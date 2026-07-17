import { NextRequest, NextResponse } from 'next/server';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { createClient } from '@sanity/client';

export const maxDuration = 300; // Allow up to 5 minutes for sync

function base64UrlEncode(str: string | Uint8Array): string {
  let base64: string;
  if (typeof str === 'string') {
    base64 = btoa(unescape(encodeURIComponent(str)));
  } else {
    base64 = btoa(String.fromCharCode(...Array.from(str)));
  }
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binaryString = atob(b64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function cleanPemKey(pem: string): string {
  return pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
}

async function getGoogleAccessToken(
  clientEmail: string,
  privateKeyPem: string
): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp,
    iat,
  };

  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
  const message = `${headerEncoded}.${payloadEncoded}`;

  const cleanKey = cleanPemKey(privateKeyPem);
  const keyBuffer = base64ToArrayBuffer(cleanKey);

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const encoder = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(message)
  );

  const signatureEncoded = base64UrlEncode(new Uint8Array(signatureBuffer));
  const assertion = `${message}.${signatureEncoded}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${assertion}`,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to fetch Google access token: ${errText}`);
  }

  const data = await response.json();
  return data.access_token;
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

function cleanMixTitle(fileName: string, mixType: string): string {
  const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
  const normalized = nameWithoutExt.toLowerCase();

  if (mixType === 'Corner New Cross') {
    const nightMatch = normalized.match(/night\s*(\d+)/) || normalized.match(/n\s*(\d+)/);
    if (nightMatch) {
      return `Corner New Cross: Night ${nightMatch[1]}`;
    }
    return `Corner New Cross: ${nameWithoutExt}`;
  }

  const sessionMatch = normalized.match(/session\s*(\d+)/) || normalized.match(/s\s*(\d+)/);
  if (sessionMatch) {
    return `${mixType}: Session ${sessionMatch[1]}`;
  }

  return `${mixType}: ${nameWithoutExt}`;
}
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction || cronSecret) {
    if (!cronSecret) {
      console.error('CRON_SECRET is missing in production environment');
      return NextResponse.json({ error: 'Cron secret not configured' }, { status: 500 });
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized key transmission' }, { status: 401 });
    }
  } else {
    console.warn('Bypassing cron authorization check (development mode)');
  }

  // Parse Google credentials
  const googleSAJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!googleSAJson) {
    return NextResponse.json({ error: 'Missing GOOGLE_SERVICE_ACCOUNT_JSON' }, { status: 500 });
  }

  let googleCredentials: any;
  try {
    googleCredentials = JSON.parse(googleSAJson);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON' }, { status: 500 });
  }

  // Get OAuth2 Access Token
  let googleAccessToken: string;
  try {
    googleAccessToken = await getGoogleAccessToken(
      googleCredentials.client_email,
      googleCredentials.private_key
    );
  } catch (err: any) {
    console.error('Failed to authenticate with Google Service Account:', err);
    return NextResponse.json({ error: `Google auth failed: ${err.message}` }, { status: 500 });
  }

  let r2Endpoint = process.env.R2_ENDPOINT;
  const bucketName = process.env.R2_BUCKET_NAME || '';
  if (r2Endpoint && bucketName && r2Endpoint.endsWith(`/${bucketName}`)) {
    r2Endpoint = r2Endpoint.slice(0, -(bucketName.length + 1));
  }

  const s3Client = new S3Client({
    endpoint: r2Endpoint,
    region: 'auto',
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
  });

  const sanityClient = createClient({
    projectId: process.env.SANITY_PROJECT_ID || 'r6mln4n3',
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: '2023-01-01',
    token: process.env.SANITY_WRITE_TOKEN,
    useCdn: false,
  });

  async function fileExistsInR2(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME || '',
        Key: key,
      });
      await s3Client.send(command);
      return true;
    } catch (error: any) {
      return false;
    }
  }

  async function findFolderId(name: string, parentId?: string): Promise<string | null> {
    let query = `name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    if (parentId) {
      query += ` and '${parentId}' in parents`;
    }

    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.set('q', query);
    url.searchParams.set('fields', 'files(id)');

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${googleAccessToken}` },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Failed to find folder ID: ${errText}`);
      return null;
    }

    const data = await res.json();
    return data.files?.[0]?.id || null;
  }

  async function getAllFilesRecursively(
    parentFolderId: string,
    mimeTypes: string[],
    parentFolderName?: string
  ): Promise<{ id: string; name: string; parentName?: string }[]> {
    const files: { id: string; name: string; parentName?: string }[] = [];
    try {
      const mimeQuery = mimeTypes.map(m => `mimeType = '${m}'`).join(' or ');
      const fileQuery = `'${parentFolderId}' in parents and trashed = false and (${mimeQuery})`;

      const url = new URL('https://www.googleapis.com/drive/v3/files');
      url.searchParams.set('q', fileQuery);
      url.searchParams.set('fields', 'files(id, name)');
      url.searchParams.set('pageSize', '1000');

      const filesRes = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${googleAccessToken}` },
      });

      if (filesRes.ok) {
        const filesData = await filesRes.json();
        if (filesData.files) {
          for (const f of filesData.files) {
            if (f.id && f.name) {
              files.push({ id: f.id, name: f.name, parentName: parentFolderName });
            }
          }
        }
      }

      const folderQuery = `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      const fUrl = new URL('https://www.googleapis.com/drive/v3/files');
      fUrl.searchParams.set('q', folderQuery);
      fUrl.searchParams.set('fields', 'files(id, name)');
      fUrl.searchParams.set('pageSize', '100');

      const foldersRes = await fetch(fUrl.toString(), {
        headers: { Authorization: `Bearer ${googleAccessToken}` },
      });

      if (foldersRes.ok) {
        const foldersData = await foldersRes.json();
        if (foldersData.files) {
          for (const folder of foldersData.files) {
            if (folder.id && folder.name) {
              const subFiles = await getAllFilesRecursively(folder.id, mimeTypes, folder.name);
              files.push(...subFiles);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Warning reading files recursively:', err);
    }
    return files;
  }

  async function uploadToR2(fileId: string, key: string, contentType: string) {
    const driveRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${googleAccessToken}` },
    });

    if (!driveRes.ok) {
      const errText = await driveRes.text();
      throw new Error(`Failed to download file ${fileId} from Drive: ${errText}`);
    }

    if (!driveRes.body) {
      throw new Error(`Empty body returned for file ${fileId} from Drive`);
    }

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.R2_BUCKET_NAME || '',
        Key: key,
        Body: driveRes.body,
        ContentType: contentType,
      },
    });

    await upload.done();
  }

  function matchArtworkFile(mixName: string, mixType: string, files: any[]): any | null {
    const normalizedMixType = mixType.toLowerCase().trim();
    const eligibleFiles = files.filter(f => !f.parentName || f.parentName.toLowerCase().trim() === normalizedMixType);
    const normalizedMixName = mixName.toLowerCase().replace(/[:\-]/g, ' ').replace(/\s+/g, ' ').trim();
    
    let found = eligibleFiles.find(f => {
      const baseName = f.name?.substring(0, f.name.lastIndexOf('.')) || f.name || '';
      return baseName.toLowerCase().trim() === mixName.toLowerCase().trim();
    });
    if (found) return found;

    if (mixType === 'Knight Club') {
      const sessionMatch = normalizedMixName.match(/session\s*(\d+)/);
      if (sessionMatch) {
        const sessionNum = sessionMatch[1];
        found = eligibleFiles.find(f => {
          const baseName = f.name?.substring(0, f.name.lastIndexOf('.')) || f.name || '';
          const normBase = baseName.toLowerCase().trim();
          return normBase === `session ${sessionNum}` || normBase === `session${sessionNum}`;
        });
        if (found) return found;
      }
    }

    if (mixType === 'Royal Court') {
      const sessionMatch = normalizedMixName.match(/session\s*(\d+)/);
      if (sessionMatch) {
        const sessionNum = sessionMatch[1];
        found = eligibleFiles.find(f => {
          const baseName = f.name?.substring(0, f.name.lastIndexOf('.')) || f.name || '';
          const normBase = baseName.toLowerCase().trim();
          return normBase.includes(`session ${sessionNum}`) || normBase.includes(`session${sessionNum}`);
        });
        if (found) return found;
      }
    }

    if (mixType === 'Corner New Cross') {
      const nightMatch = normalizedMixName.match(/night\s*(\d+)/);
      if (nightMatch) {
        const nightNum = nightMatch[1];
        found = eligibleFiles.find(f => {
          const baseName = f.name?.substring(0, f.name.lastIndexOf('.')) || f.name || '';
          const normBase = baseName.toLowerCase().trim();
          return normBase.includes(`n${nightNum}`) || normBase.includes(`night ${nightNum}`);
        });
        if (found) return found;
      }
    }

    const numberMatch = normalizedMixName.match(/\d+/);
    if (numberMatch) {
      const num = numberMatch[0];
      found = eligibleFiles.find(f => {
        const baseName = f.name?.substring(0, f.name.lastIndexOf('.')) || f.name || '';
        return baseName.includes(num);
      });
      if (found) return found;
    }

    return null;
  }

  function matchTracklistFile(mixName: string, mixType: string, files: any[]): any | null {
    const normalizedMixType = mixType.toLowerCase().trim();
    const eligibleFiles = files.filter(f => !f.parentName || f.parentName.toLowerCase().trim() === normalizedMixType);
    const normalizedMixName = mixName.toLowerCase().trim();
    
    let found = eligibleFiles.find(f => {
      const baseName = f.name?.substring(0, f.name.lastIndexOf('.')) || f.name || '';
      return baseName.toLowerCase().trim() === normalizedMixName;
    });
    if (found) return found;

    found = eligibleFiles.find(f => {
      const baseName = f.name?.substring(0, f.name.lastIndexOf('.')) || f.name || '';
      const normBase = baseName.toLowerCase().trim();
      return normalizedMixName.includes(normBase) || normBase.includes(normalizedMixName);
    });
    return found || null;
  }

  async function downloadFileText(fileId: string): Promise<string> {
    const driveRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${googleAccessToken}` },
    });

    if (!driveRes.ok) {
      const errText = await driveRes.text();
      throw new Error(`Failed to download text file ${fileId} from Drive: ${errText}`);
    }

    return driveRes.text();
  }

  try {
    const rootId = await findFolderId('Henry IX Website');
    if (!rootId) {
      return NextResponse.json({ error: "Root folder 'Henry IX Website' not found in Drive" }, { status: 404 });
    }

    const mixesId = await findFolderId('Mixes', rootId);
    if (!mixesId) {
      return NextResponse.json({ error: "Mixes folder not found" }, { status: 404 });
    }

    const mixAudioId = await findFolderId('Mix Audio', mixesId);
    if (!mixAudioId) {
      return NextResponse.json({ error: "Mix Audio folder not found" }, { status: 404 });
    }

    const tracklistsFolderId = await findFolderId('Mix Tracklists', mixesId) || await findFolderId('Mix Track Lists', mixesId);
    const artworkFolderId = await findFolderId('Mix Artwork', mixesId);

    let artworkFiles: any[] = [];
    if (artworkFolderId) {
      artworkFiles = await getAllFilesRecursively(artworkFolderId, ['image/jpeg', 'image/png', 'image/webp']);
    }

    let tracklistFiles: any[] = [];
    if (tracklistsFolderId) {
      tracklistFiles = await getAllFilesRecursively(tracklistsFolderId, ['text/plain']);
    }

    const matchedArtworkIds = new Set<string>();
    
    const mixTypeFoldersUrl = new URL('https://www.googleapis.com/drive/v3/files');
    mixTypeFoldersUrl.searchParams.set('q', `'${mixAudioId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
    mixTypeFoldersUrl.searchParams.set('fields', 'files(id, name)');
    const mixTypeFoldersRes = await fetch(mixTypeFoldersUrl.toString(), {
      headers: { Authorization: `Bearer ${googleAccessToken}` },
    });
    if (!mixTypeFoldersRes.ok) {
      const errText = await mixTypeFoldersRes.text();
      throw new Error(`Failed to list mix type folders: ${errText}`);
    }
    const mixTypeFoldersData = await mixTypeFoldersRes.json();
    const mixTypeFolders = mixTypeFoldersData.files || [];
    const syncResults: string[] = [];

    for (const mixFolder of mixTypeFolders) {
      const mixType = mixFolder.name!;
      
      const mp3sUrl = new URL('https://www.googleapis.com/drive/v3/files');
      mp3sUrl.searchParams.set('q', `'${mixFolder.id}' in parents and mimeType = 'audio/mpeg' and trashed = false`);
      mp3sUrl.searchParams.set('fields', 'files(id, name, size)');
      const mp3sRes = await fetch(mp3sUrl.toString(), {
        headers: { Authorization: `Bearer ${googleAccessToken}` },
      });
      if (!mp3sRes.ok) {
        const errText = await mp3sRes.text();
        throw new Error(`Failed to list mp3 files: ${errText}`);
      }
      const mp3sData = await mp3sRes.json();
      const mp3Files = mp3sData.files || [];
      for (const mp3 of mp3Files) {
        const fileName = mp3.name!;
        const mixName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
        const cleanTitle = cleanMixTitle(fileName, mixType);
        const cleanSlug = slugify(cleanTitle);
        const audioR2Key = `Mixes/${mixType}/Mix Audio/${fileName}`;

        let tracklistText = '';
        const tracklistFile = matchTracklistFile(mixName, mixType, tracklistFiles);
        if (tracklistFile) {
          tracklistText = await downloadFileText(tracklistFile.id);
        }

        const artworkFile = matchArtworkFile(mixName, mixType, artworkFiles);
        let artworkR2Key: string | null = null;
        if (artworkFile) {
          artworkR2Key = `Mixes/${mixType}/Mix Artwork/${artworkFile.name}`;
          matchedArtworkIds.add(artworkFile.id);
        }

        const existing = await sanityClient.fetch(
          `*[_type == "mix" && (slug.current == $slug || title == $title || audioFile == $audioFile)][0]`,
          { slug: cleanSlug, title: cleanTitle, audioFile: `/${audioR2Key}` }
        );

        const audioExists = await fileExistsInR2(audioR2Key);
        const artworkExists = artworkR2Key ? await fileExistsInR2(artworkR2Key) : false;

        if (existing) {
          let needsPatch = false;
          const patchData: any = {};

          if (existing.title !== cleanTitle) {
            patchData.title = cleanTitle;
            patchData.slug = { _type: 'slug', current: cleanSlug };
            needsPatch = true;
          }

          const currentAudioFile = existing.audioFile;
          const expectedAudioFile = `/${audioR2Key}`;
          if (currentAudioFile !== expectedAudioFile || !audioExists) {
            await uploadToR2(mp3.id!, audioR2Key, 'audio/mpeg');
            if (currentAudioFile !== expectedAudioFile) {
              patchData.audioFile = expectedAudioFile;
              needsPatch = true;
            }
          }

          const currentArtworkFile = existing.artworkFile;
          const expectedArtworkFile = artworkR2Key ? `/${artworkR2Key}` : undefined;
          if (artworkFile && (currentArtworkFile !== expectedArtworkFile || !artworkExists)) {
            const artworkContentType = artworkFile.name.endsWith('.png') ? 'image/png' : artworkFile.name.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
            await uploadToR2(artworkFile.id, artworkR2Key!, artworkContentType);
            if (currentArtworkFile !== expectedArtworkFile) {
              patchData.artworkFile = expectedArtworkFile;
              needsPatch = true;
            }
          }

          if (tracklistText && existing.tracklist !== tracklistText) {
            patchData.tracklist = tracklistText;
            needsPatch = true;
          }

          if (needsPatch) {
            await sanityClient.patch(existing._id).set(patchData).commit();
            syncResults.push(`Updated ${cleanTitle}`);
          }
          continue;
        }

        // New mix discovered
        await uploadToR2(mp3.id!, audioR2Key, 'audio/mpeg');
        if (artworkFile && artworkR2Key) {
          const artworkContentType = artworkFile.name.endsWith('.png') ? 'image/png' : artworkFile.name.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
          await uploadToR2(artworkFile.id, artworkR2Key, artworkContentType);
        }

        const mixDoc = {
          _type: 'mix',
          title: cleanTitle,
          slug: {
            _type: 'slug',
            current: cleanSlug,
          },
          audioFile: `/${audioR2Key}`,
          artworkFile: artworkR2Key ? `/${artworkR2Key}` : undefined,
          tracklist: tracklistText || undefined,
          bpm: 120,
          cuePoints: [],
        };

        const createdMix = await sanityClient.create(mixDoc);
        syncResults.push(`Created ${cleanTitle}`);

        const mixGroupTitle = mixType;
        const mixGroupSlug = slugify(mixGroupTitle);
        const existingGroup = await sanityClient.fetch(
          `*[_type == "mixGroup" && title == $title][0]`,
          { title: mixGroupTitle }
        );

        if (existingGroup) {
          await sanityClient
            .patch(existingGroup._id)
            .setIfMissing({ mixes: [] })
            .append('mixes', [{ _type: 'reference', _ref: createdMix._id }])
            .commit();
        } else {
          const newGroupDoc = {
            _type: 'mixGroup',
            title: mixGroupTitle,
            slug: {
              _type: 'slug',
              current: mixGroupSlug,
            },
            description: `Auto-generated collection for ${mixGroupTitle} mixes`,
            mixes: [{ _type: 'reference', _ref: createdMix._id }],
          };
          await sanityClient.create(newGroupDoc);
        }
      }
    }

    return NextResponse.json({ success: true, processed: syncResults });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Sync failed' }, { status: 500 });
  }
}
