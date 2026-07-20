import { google } from 'googleapis';
import { S3Client, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';
import * as stream from 'stream';

// Load environment variables for local run
dotenv.config({ path: '.env.local' });
if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
  dotenv.config();
}

const dryRun = process.argv.includes('--dry-run');

// Parse Google credentials
const googleSAJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
if (!googleSAJson) {
  console.error("Missing GOOGLE_SERVICE_ACCOUNT_JSON environment variable.");
  process.exit(1);
}

let googleCredentials;
try {
  googleCredentials = JSON.parse(googleSAJson);
} catch (err: any) {
  console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON. Ensure it is a valid JSON string.", err.message);
  process.exit(1);
}

// Initialize Clients
const auth = new google.auth.JWT({
  email: googleCredentials.client_email,
  key: googleCredentials.private_key,
  scopes: ['https://www.googleapis.com/auth/drive.readonly']
});

const drive = google.drive({ version: 'v3', auth });

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

interface R2FileInfo {
  exists: boolean;
  size?: number;
  gdId?: string;
  gdMd5?: string;
}

async function getR2FileInfo(key: string): Promise<R2FileInfo> {
  try {
    const command = new HeadObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || '',
      Key: key,
    });
    const res = await s3Client.send(command);
    return {
      exists: true,
      size: res.ContentLength,
      gdId: res.Metadata?.['gd-id'],
      gdMd5: res.Metadata?.['gd-md5'],
    };
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return { exists: false };
    }
    console.warn(`Warning checking R2 object ${key}:`, error.message);
    return { exists: false };
  }
}

async function deleteFromR2(key: string) {
  console.log(`Deleting object from R2: ${key}...`);
  if (dryRun) {
    console.log(`[DRY RUN] Would delete ${key} from R2`);
    return;
  }
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || '',
      Key: key,
    });
    await s3Client.send(command);
  } catch (err: any) {
    console.error(`Failed to delete R2 object ${key}:`, err.message);
  }
}

const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'r6mln4n3',
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2023-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

async function findFolderId(name: string, parentId?: string): Promise<string | null> {
  let query = `name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }
  const res = await drive.files.list({ q: query, fields: 'files(id)' });
  return res.data.files?.[0]?.id || null;
}

interface DriveFileInfo {
  id: string;
  name: string;
  parentName?: string;
  size?: string;
  md5Checksum?: string;
  modifiedTime?: string;
}

async function getAllFilesRecursively(
  parentFolderId: string,
  mimeTypes: string[],
  parentFolderName?: string
): Promise<DriveFileInfo[]> {
  const files: DriveFileInfo[] = [];

  try {
    const mimeQuery = mimeTypes.map(m => `mimeType = '${m}'`).join(' or ');
    const fileQuery = `'${parentFolderId}' in parents and trashed = false and (${mimeQuery})`;

    const filesRes = await drive.files.list({
      q: fileQuery,
      fields: 'files(id, name, size, md5Checksum, modifiedTime)',
      pageSize: 1000,
    });

    if (filesRes.data.files) {
      for (const f of filesRes.data.files) {
        if (f.id && f.name) {
          files.push({
            id: f.id,
            name: f.name,
            parentName: parentFolderName,
            size: f.size || undefined,
            md5Checksum: f.md5Checksum || undefined,
            modifiedTime: f.modifiedTime || undefined,
          });
        }
      }
    }

    const folderQuery = `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const foldersRes = await drive.files.list({
      q: folderQuery,
      fields: 'files(id, name)',
      pageSize: 100,
    });

    if (foldersRes.data.files) {
      for (const folder of foldersRes.data.files) {
        if (folder.id && folder.name) {
          const subFiles = await getAllFilesRecursively(folder.id, mimeTypes, folder.name);
          files.push(...subFiles);
        }
      }
    }
  } catch (err: any) {
    console.warn(`Warning reading files recursively in folder ID ${parentFolderId}:`, err.message);
  }

  return files;
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

function matchArtworkFile(mixName: string, mixType: string, files: DriveFileInfo[]): DriveFileInfo | null {
  const normalizedMixType = mixType.toLowerCase().trim();
  const eligibleFiles = files.filter(f => !f.parentName || f.parentName.toLowerCase().trim() === normalizedMixType);
  
  const normalizedMixName = mixName.toLowerCase().replace(/[:\-]/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Try exact match first
  let found = eligibleFiles.find(f => {
    const baseName = f.name?.substring(0, f.name.lastIndexOf('.')) || f.name || '';
    return baseName.toLowerCase().trim() === mixName.toLowerCase().trim();
  });
  if (found) return found;

  // Specific mapping for Knight Club
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

  // Specific mapping for Royal Court
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

  // Specific mapping for Corner New Cross
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

  // Generic fallback: number matching
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

function matchTracklistFile(mixName: string, mixType: string, files: DriveFileInfo[]): DriveFileInfo | null {
  const normalizedMixType = mixType.toLowerCase().trim();
  const eligibleFiles = files.filter(f => !f.parentName || f.parentName.toLowerCase().trim() === normalizedMixType);
  
  const normalizedMixName = mixName.toLowerCase().trim();
  // Exact match
  let found = eligibleFiles.find(f => {
    const baseName = f.name?.substring(0, f.name.lastIndexOf('.')) || f.name || '';
    return baseName.toLowerCase().trim() === normalizedMixName;
  });
  if (found) return found;

  // Fuzzy match
  found = eligibleFiles.find(f => {
    const baseName = f.name?.substring(0, f.name.lastIndexOf('.')) || f.name || '';
    const normBase = baseName.toLowerCase().trim();
    return normalizedMixName.includes(normBase) || normBase.includes(normalizedMixName);
  });
  return found || null;
}

async function downloadFileText(fileId: string): Promise<string> {
  const response = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'text' });
  return response.data as string;
}

async function uploadToR2(fileId: string, key: string, contentType: string, md5Checksum?: string | null) {
  console.log(`Streaming file ID ${fileId} from Drive to R2 at key: ${key}...`);
  
  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  );

  const passThroughStream = new stream.PassThrough();
  (response.data as any).pipe(passThroughStream);

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.R2_BUCKET_NAME || '',
      Key: key,
      Body: passThroughStream,
      ContentType: contentType,
      Metadata: {
        'gd-id': fileId,
        'gd-md5': md5Checksum || '',
      }
    },
  });

  await upload.done();
  console.log(`Successfully uploaded: ${key}`);
}

function detectMixType(fileName: string): string {
  const norm = fileName.toLowerCase();
  if (norm.includes('knight club') || norm.includes('kc ')) {
    return 'Knight Club';
  }
  if (norm.includes('royal court') || norm.includes('rc ')) {
    return 'Royal Court';
  }
  if (norm.includes('corner new cross') || norm.includes('cnc')) {
    return 'Corner New Cross';
  }
  return 'Knight Club';
}

async function main() {
  console.log(`Starting sync... ${dryRun ? '[DRY RUN MODE]' : ''}`);
  
  // Find Root Folder
  const rootId = await findFolderId('Henry IX Website');
  if (!rootId) {
    console.error("Root folder 'Henry IX Website' not found in Google Drive.");
    process.exit(1);
  }
  console.log(`Found 'Henry IX Website' root folder ID: ${rootId}`);

  // List all top-level folders inside 'Henry IX Website'
  try {
    const topFoldersRes = await drive.files.list({
      q: `'${rootId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id, name)',
    });
    const topFolders = topFoldersRes.data.files || [];
    console.log(`Top-level folders found in Google Drive 'Henry IX Website':`, topFolders.map(f => f.name));
  } catch (err: any) {
    console.warn(`Could not list top-level folders in Google Drive: ${err.message}`);
  }

  // Find Mixes Folder
  const mixesId = await findFolderId('Mixes', rootId);
  if (!mixesId) {
    console.error("Folder 'Mixes' not found inside 'Henry IX Website'.");
    process.exit(1);
  }

  // Find Mix Audio folder
  const mixAudioId = await findFolderId('Mix Audio', mixesId);
  if (!mixAudioId) {
    console.error("Folder 'Mix Audio' not found inside 'Mixes'.");
    process.exit(1);
  }

  // Find sub-folders for Tracklists and Artwork
  const tracklistsFolderId = await findFolderId('Mix Tracklists', mixesId) || await findFolderId('Mix Track Lists', mixesId);
  const artworkFolderId = await findFolderId('Mix Artwork', mixesId);
  
  if (!tracklistsFolderId) console.warn("Folder 'Mix Tracklists' not found. Skipping tracklist matching.");
  if (!artworkFolderId) console.warn("Folder 'Mix Artwork' not found. Skipping cover art matching.");

  // Preload artwork files
  let artworkFiles: DriveFileInfo[] = [];
  if (artworkFolderId) {
    artworkFiles = await getAllFilesRecursively(artworkFolderId, ['image/jpeg', 'image/png', 'image/webp']);
    console.log(`Preloaded ${artworkFiles.length} artwork files recursively from Google Drive.`);
  }

  // Preload tracklists
  let tracklistFiles: DriveFileInfo[] = [];
  if (tracklistsFolderId) {
    tracklistFiles = await getAllFilesRecursively(tracklistsFolderId, ['text/plain']);
    console.log(`Preloaded ${tracklistFiles.length} tracklist files recursively from Google Drive.`);
  }

  // Set to keep track of artwork files matched to MP3s
  const matchedArtworkIds = new Set<string>();

  // List mix types folders (e.g. Knight Club)
  const mixTypeFoldersRes = await drive.files.list({
    q: `'${mixAudioId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
  });
  
  const mixTypeFolders = mixTypeFoldersRes.data.files || [];
  console.log(`Found ${mixTypeFolders.length} mix type subfolders in 'Mix Audio'.`);

  for (const mixFolder of mixTypeFolders) {
    const mixType = mixFolder.name!;
    console.log(`\nProcessing mix type: ${mixType}...`);

    // List all .mp3 files inside this folder
    const mp3sRes = await drive.files.list({
      q: `'${mixFolder.id}' in parents and mimeType = 'audio/mpeg' and trashed = false`,
      fields: 'files(id, name, size, md5Checksum, modifiedTime)',
    });

    const mp3Files = mp3sRes.data.files || [];
    console.log(`Found ${mp3Files.length} MP3 files in '${mixType}'.`);

    for (const mp3 of mp3Files) {
      const fileName = mp3.name!;
      const mixName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
      
      const cleanTitle = cleanMixTitle(fileName, mixType);
      const cleanSlug = slugify(cleanTitle);
      
      console.log(`- Checking mix: "${mixName}" (Normalized Title: "${cleanTitle}")`);

      // S3 / R2 Keys
      const audioR2Key = `Mixes/${mixType}/Mix Audio/${fileName}`;
      
      // Look for tracklist text file
      let tracklistText = '';
      const tracklistFile = matchTracklistFile(mixName, mixType, tracklistFiles);
      if (tracklistFile) {
        console.log(`  Found matched tracklist file: ${tracklistFile.name}`);
        tracklistText = await downloadFileText(tracklistFile.id);
      } else {
        console.log(`  No tracklist file found for "${mixName}"`);
      }

      // Look for artwork image
      const artworkFile = matchArtworkFile(mixName, mixType, artworkFiles);
      let artworkR2Key: string | null = null;
      if (artworkFile) {
        console.log(`  Found matched artwork file: ${artworkFile.name}`);
        artworkR2Key = `Mixes/${mixType}/Mix Artwork/${artworkFile.name}`;
        matchedArtworkIds.add(artworkFile.id);
      } else {
        console.log(`  No artwork file found for "${mixName}"`);
      }

      // Check if document already exists in Sanity
      const existing = await sanityClient.fetch(
        `*[_type == "mix" && (slug.current == $slug || title == $title || audioFile == $audioFile)][0]`,
        { slug: cleanSlug, title: cleanTitle, audioFile: `/${audioR2Key}` }
      );

      // Perform existence & metadata checks in R2
      const audioR2Info = await getR2FileInfo(audioR2Key);
      const artworkR2Info = artworkR2Key ? await getR2FileInfo(artworkR2Key) : { exists: false };

      // Check for content changes (size or MD5 mismatch)
      const driveAudioSize = mp3.size ? parseInt(mp3.size, 10) : undefined;
      const driveAudioMd5 = mp3.md5Checksum;
      let audioChanged = false;
      if (audioR2Info.exists) {
        if (driveAudioSize !== undefined && audioR2Info.size !== undefined && driveAudioSize !== audioR2Info.size) {
          console.log(`    Detected audio size mismatch for "${audioR2Key}": Drive size = ${driveAudioSize}, R2 size = ${audioR2Info.size}`);
          audioChanged = true;
        } else if (driveAudioMd5 && audioR2Info.gdMd5 && driveAudioMd5 !== audioR2Info.gdMd5) {
          console.log(`    Detected audio MD5 mismatch for "${audioR2Key}": Drive MD5 = ${driveAudioMd5}, R2 MD5 = ${audioR2Info.gdMd5}`);
          audioChanged = true;
        } else if (mp3.id && audioR2Info.gdId && mp3.id !== audioR2Info.gdId) {
          console.log(`    Detected audio ID mismatch for "${audioR2Key}": Drive ID = ${mp3.id}, R2 ID = ${audioR2Info.gdId}`);
          audioChanged = true;
        }
      }

      const driveArtworkSize = artworkFile?.size ? parseInt(artworkFile.size, 10) : undefined;
      const driveArtworkMd5 = artworkFile?.md5Checksum;
      let artworkChanged = false;
      if (artworkR2Info.exists && artworkFile) {
        if (driveArtworkSize !== undefined && artworkR2Info.size !== undefined && driveArtworkSize !== artworkR2Info.size) {
          console.log(`    Detected artwork size mismatch for "${artworkR2Key}": Drive size = ${driveArtworkSize}, R2 size = ${artworkR2Info.size}`);
          artworkChanged = true;
        } else if (driveArtworkMd5 && artworkR2Info.gdMd5 && driveArtworkMd5 !== artworkR2Info.gdMd5) {
          console.log(`    Detected artwork MD5 mismatch for "${artworkR2Key}": Drive MD5 = ${driveArtworkMd5}, R2 MD5 = ${artworkR2Info.gdMd5}`);
          artworkChanged = true;
        } else if (artworkFile.id && artworkR2Info.gdId && artworkFile.id !== artworkR2Info.gdId) {
          console.log(`    Detected artwork ID mismatch for "${artworkR2Key}": Drive ID = ${artworkFile.id}, R2 ID = ${artworkR2Info.gdId}`);
          artworkChanged = true;
        }
      }

      if (existing) {
        console.log(`  Mix document already exists in Sanity. Checking if updates are needed...`);
        let needsPatch = false;
        const patchData: any = {};

        // Title/Slug cleanup
        if (existing.title !== cleanTitle) {
          console.log(`    Updating title to clean format: "${cleanTitle}"`);
          patchData.title = cleanTitle;
          patchData.slug = { _type: 'slug', current: cleanSlug };
          needsPatch = true;
        }

        // Audio path alignment & existence check
        const currentAudioFile = existing.audioFile;
        const expectedAudioFile = `/${audioR2Key}`;
        if (currentAudioFile !== expectedAudioFile || !audioR2Info.exists || audioChanged) {
          if (currentAudioFile && currentAudioFile !== expectedAudioFile) {
            const oldKey = currentAudioFile.startsWith('/') ? currentAudioFile.slice(1) : currentAudioFile;
            console.log(`    Audio path changed from ${currentAudioFile} to ${expectedAudioFile}. Deleting old asset from R2...`);
            await deleteFromR2(oldKey);
          }
          if (audioChanged) {
            console.log(`    Audio file content changed. Deleting old asset from R2 and re-uploading...`);
            await deleteFromR2(audioR2Key);
          }
          if (!audioR2Info.exists && !audioChanged) {
            console.log(`    Audio file missing in R2: "${audioR2Key}". Uploading...`);
          } else {
            console.log(`    Uploading updated audio to R2: "${audioR2Key}"...`);
          }
          if (!dryRun) {
            await uploadToR2(mp3.id!, audioR2Key, 'audio/mpeg', mp3.md5Checksum);
          }
          if (currentAudioFile !== expectedAudioFile) {
            patchData.audioFile = expectedAudioFile;
            needsPatch = true;
          }
        }

        // Artwork path alignment & existence check
        const currentArtworkFile = existing.artworkFile;
        const expectedArtworkFile = artworkR2Key ? `/${artworkR2Key}` : undefined;
        if (artworkFile && (currentArtworkFile !== expectedArtworkFile || !artworkR2Info.exists || artworkChanged)) {
          if (currentArtworkFile && currentArtworkFile !== expectedArtworkFile) {
            const oldKey = currentArtworkFile.startsWith('/') ? currentArtworkFile.slice(1) : currentArtworkFile;
            console.log(`    Artwork path changed from ${currentArtworkFile} to ${expectedArtworkFile}. Deleting old asset from R2...`);
            await deleteFromR2(oldKey);
          }
          if (artworkChanged && artworkR2Key) {
            console.log(`    Artwork file content changed. Deleting old asset from R2 and re-uploading...`);
            await deleteFromR2(artworkR2Key);
          }
          if (!artworkR2Info.exists && !artworkChanged) {
            console.log(`    Artwork file missing in R2: "${artworkR2Key}". Uploading...`);
          } else {
            console.log(`    Uploading updated artwork to R2: "${artworkR2Key}"...`);
          }
          if (!dryRun) {
            const artworkContentType = artworkFile.name.endsWith('.png') ? 'image/png' : artworkFile.name.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
            await uploadToR2(artworkFile.id, artworkR2Key!, artworkContentType, artworkFile.md5Checksum);
          }
          if (currentArtworkFile !== expectedArtworkFile) {
            patchData.artworkFile = expectedArtworkFile;
            needsPatch = true;
          }
        }

        // Tracklist update
        if (tracklistText && existing.tracklist !== tracklistText) {
          console.log(`    Updating tracklist content...`);
          patchData.tracklist = tracklistText;
          needsPatch = true;
        }

        if (needsPatch) {
          if (!dryRun) {
            await sanityClient.patch(existing._id).set(patchData).commit();
            console.log(`    Successfully updated Sanity mix document: ${existing._id}`);
          } else {
            console.log(`    [DRY RUN] Would patch Sanity mix document: ${existing._id} with data:`, patchData);
          }
        } else {
          console.log(`    No changes needed.`);
        }
        continue;
      }

      console.log(`  New mix discovered! Syncing...`);
      
      if (!dryRun) {
        // Upload audio to R2
        await uploadToR2(mp3.id!, audioR2Key, 'audio/mpeg', mp3.md5Checksum);

        // Upload artwork to R2
        if (artworkFile && artworkR2Key) {
          const artworkContentType = artworkFile.name.endsWith('.png') ? 'image/png' : artworkFile.name.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
          await uploadToR2(artworkFile.id, artworkR2Key, artworkContentType, artworkFile.md5Checksum);
        }

        // Create Sanity Document
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
          bpm: 120, // Default fallback
          cuePoints: [],
        };

        const createdMix = await sanityClient.create(mixDoc);
        console.log(`  Created Sanity mix document: ${createdMix._id}`);

        // Add reference to mixGroup
        const mixGroupTitle = mixType;
        const mixGroupSlug = slugify(mixGroupTitle);

        const existingGroup = await sanityClient.fetch(
          `*[_type == "mixGroup" && title == $title][0]`,
          { title: mixGroupTitle }
        );

        if (existingGroup) {
          console.log(`  Appending mix to existing mixGroup: ${mixGroupTitle}`);
          await sanityClient
            .patch(existingGroup._id)
            .setIfMissing({ mixes: [] })
            .append('mixes', [{ _type: 'reference', _ref: createdMix._id }])
            .commit();
        } else {
          console.log(`  Creating new mixGroup: ${mixGroupTitle}`);
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
      } else {
        console.log(`  [DRY RUN] Would upload audio to R2 at key: ${audioR2Key}`);
        if (artworkR2Key) {
          console.log(`  [DRY RUN] Would upload artwork to R2 at key: ${artworkR2Key}`);
        }
        console.log(`  [DRY RUN] Would create Sanity mix document for: "${cleanTitle}"`);
        console.log(`  [DRY RUN] Would append to or create Sanity mixGroup for: "${mixType}"`);
      }
    }
  }

  // Post-process unmatched artworks (for bulk uploading artworks without audio yet)
  const unmatchedArtworks = artworkFiles.filter(a => !matchedArtworkIds.has(a.id));
  console.log(`\nProcessing ${unmatchedArtworks.length} unmatched artwork files (bulk uploaded artworks)...`);
  
  for (const artworkFile of unmatchedArtworks) {
    const mixType = artworkFile.parentName || detectMixType(artworkFile.name);
    const cleanTitle = cleanMixTitle(artworkFile.name, mixType);
    const cleanSlug = slugify(cleanTitle);
    
    console.log(`- Unmatched artwork: "${artworkFile.name}" (Normalized Title: "${cleanTitle}")`);
    
    const artworkR2Key = `Mixes/${mixType}/Mix Artwork/${artworkFile.name}`;
    
    // Check if document already exists in Sanity
    const existing = await sanityClient.fetch(
      `*[_type == "mix" && (slug.current == $slug || title == $title)][0]`,
      { slug: cleanSlug, title: cleanTitle }
    );
    
    const artworkR2Info = await getR2FileInfo(artworkR2Key);

    const driveArtworkSize = artworkFile.size ? parseInt(artworkFile.size, 10) : undefined;
    const driveArtworkMd5 = artworkFile.md5Checksum;
    let artworkChanged = false;
    if (artworkR2Info.exists) {
      if (driveArtworkSize !== undefined && artworkR2Info.size !== undefined && driveArtworkSize !== artworkR2Info.size) {
        console.log(`    Detected unmatched artwork size mismatch for "${artworkR2Key}": Drive size = ${driveArtworkSize}, R2 size = ${artworkR2Info.size}`);
        artworkChanged = true;
      } else if (driveArtworkMd5 && artworkR2Info.gdMd5 && driveArtworkMd5 !== artworkR2Info.gdMd5) {
        console.log(`    Detected unmatched artwork MD5 mismatch for "${artworkR2Key}": Drive MD5 = ${driveArtworkMd5}, R2 MD5 = ${artworkR2Info.gdMd5}`);
        artworkChanged = true;
      } else if (artworkFile.id && artworkR2Info.gdId && artworkFile.id !== artworkR2Info.gdId) {
        console.log(`    Detected unmatched artwork ID mismatch for "${artworkR2Key}": Drive ID = ${artworkFile.id}, R2 ID = ${artworkR2Info.gdId}`);
        artworkChanged = true;
      }
    }
    
    if (existing) {
      console.log(`  Mix document already exists in Sanity. Checking if artwork updates are needed...`);
      let needsPatch = false;
      const patchData: any = {};
      
      const currentArtworkFile = existing.artworkFile;
      const expectedArtworkFile = `/${artworkR2Key}`;
      
      if (currentArtworkFile !== expectedArtworkFile || !artworkR2Info.exists || artworkChanged) {
        if (currentArtworkFile && currentArtworkFile !== expectedArtworkFile) {
          const oldKey = currentArtworkFile.startsWith('/') ? currentArtworkFile.slice(1) : currentArtworkFile;
          console.log(`    Artwork path changed from ${currentArtworkFile} to ${expectedArtworkFile}. Deleting old asset from R2...`);
          await deleteFromR2(oldKey);
        }
        if (artworkChanged) {
          console.log(`    Artwork file content changed. Deleting old asset from R2 and re-uploading...`);
          await deleteFromR2(artworkR2Key);
        }
        if (!artworkR2Info.exists && !artworkChanged) {
          console.log(`    Artwork file missing in R2: "${artworkR2Key}". Uploading...`);
        } else {
          console.log(`    Uploading updated artwork to R2: "${artworkR2Key}"...`);
        }
        if (!dryRun) {
          const artworkContentType = artworkFile.name.endsWith('.png') ? 'image/png' : artworkFile.name.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
          await uploadToR2(artworkFile.id, artworkR2Key, artworkContentType, artworkFile.md5Checksum);
        }
        if (currentArtworkFile !== expectedArtworkFile) {
          patchData.artworkFile = expectedArtworkFile;
          needsPatch = true;
        }
      }
      
      if (needsPatch) {
        if (!dryRun) {
          await sanityClient.patch(existing._id).set(patchData).commit();
          console.log(`    Successfully updated Sanity mix document: ${existing._id}`);
        } else {
          console.log(`    [DRY RUN] Would patch Sanity mix document: ${existing._id} with data:`, patchData);
        }
      } else {
        console.log(`    No changes needed.`);
      }
    } else {
      console.log(`  New mix discovered from artwork! Syncing...`);
      if (!dryRun) {
        // Upload artwork to R2
        const artworkContentType = artworkFile.name.endsWith('.png') ? 'image/png' : artworkFile.name.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
        await uploadToR2(artworkFile.id, artworkR2Key, artworkContentType, artworkFile.md5Checksum);
        
        // Create Sanity Document (no audio file)
        const mixDoc = {
          _type: 'mix',
          title: cleanTitle,
          slug: {
            _type: 'slug',
            current: cleanSlug,
          },
          artworkFile: `/${artworkR2Key}`,
          bpm: 120, // Default fallback
          cuePoints: [],
        };
        
        const createdMix = await sanityClient.create(mixDoc);
        console.log(`  Created Sanity mix document (artwork only): ${createdMix._id}`);
        
        // Add reference to mixGroup
        const mixGroupTitle = mixType;
        const mixGroupSlug = slugify(mixGroupTitle);
        
        const existingGroup = await sanityClient.fetch(
          `*[_type == "mixGroup" && title == $title][0]`,
          { title: mixGroupTitle }
        );
        
        if (existingGroup) {
          console.log(`  Appending mix to existing mixGroup: ${mixGroupTitle}`);
          await sanityClient
            .patch(existingGroup._id)
            .setIfMissing({ mixes: [] })
            .append('mixes', [{ _type: 'reference', _ref: createdMix._id }])
            .commit();
        } else {
          console.log(`  Creating new mixGroup: ${mixGroupTitle}`);
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
      } else {
        console.log(`  [DRY RUN] Would upload artwork to R2 at key: ${artworkR2Key}`);
        console.log(`  [DRY RUN] Would create Sanity mix document (artwork only) for: "${cleanTitle}"`);
        console.log(`  [DRY RUN] Would append to or create Sanity mixGroup for: "${mixType}"`);
      }
    }
  }

  console.log('\nSync finished successfully!');
}

main().catch(err => {
  console.error("Unexpected error in main:", err);
  process.exit(1);
});
