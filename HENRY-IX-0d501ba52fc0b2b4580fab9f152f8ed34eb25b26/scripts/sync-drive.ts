import { google } from 'googleapis';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';
import * as stream from 'stream';

// Load environment variables for local run
dotenv.config();

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

async function fileExistsInR2(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || '',
      Key: key,
    });
    await s3Client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    console.warn(`Warning checking R2 object ${key}:`, error.message);
    return false;
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

async function getAllFilesRecursively(
  parentFolderId: string,
  mimeTypes: string[],
  parentFolderName?: string
): Promise<{ id: string; name: string; parentName?: string }[]> {
  const files: { id: string; name: string; parentName?: string }[] = [];

  try {
    const mimeQuery = mimeTypes.map(m => `mimeType = '${m}'`).join(' or ');
    const fileQuery = `'${parentFolderId}' in parents and trashed = false and (${mimeQuery})`;

    const filesRes = await drive.files.list({
      q: fileQuery,
      fields: 'files(id, name)',
      pageSize: 1000,
    });

    if (filesRes.data.files) {
      for (const f of filesRes.data.files) {
        if (f.id && f.name) {
          files.push({ id: f.id, name: f.name, parentName: parentFolderName });
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

function matchArtworkFile(mixName: string, mixType: string, files: { id: string; name: string; parentName?: string }[]): { id: string; name: string; parentName?: string } | null {
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

function matchTracklistFile(mixName: string, mixType: string, files: { id: string; name: string; parentName?: string }[]): { id: string; name: string; parentName?: string } | null {
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

async function uploadToR2(fileId: string, key: string, contentType: string) {
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
  let artworkFiles: { id: string; name: string; parentName?: string }[] = [];
  if (artworkFolderId) {
    artworkFiles = await getAllFilesRecursively(artworkFolderId, ['image/jpeg', 'image/png', 'image/webp']);
    console.log(`Preloaded ${artworkFiles.length} artwork files recursively from Google Drive.`);
  }

  // Preload tracklists
  let tracklistFiles: { id: string; name: string; parentName?: string }[] = [];
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
      fields: 'files(id, name, size)',
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

      // Perform existence check in R2
      const audioExists = await fileExistsInR2(audioR2Key);
      const artworkExists = artworkR2Key ? await fileExistsInR2(artworkR2Key) : false;

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
        if (currentAudioFile !== expectedAudioFile || !audioExists) {
          if (!audioExists) {
            console.log(`    Audio file missing in R2: "${audioR2Key}". Uploading...`);
          } else {
            console.log(`    Audio file path mismatch: current="${currentAudioFile}", expected="${expectedAudioFile}". Uploading/Updating...`);
          }
          if (!dryRun) {
            await uploadToR2(mp3.id!, audioR2Key, 'audio/mpeg');
          }
          if (currentAudioFile !== expectedAudioFile) {
            patchData.audioFile = expectedAudioFile;
            needsPatch = true;
          }
        }

        // Artwork path alignment & existence check
        const currentArtworkFile = existing.artworkFile;
        const expectedArtworkFile = artworkR2Key ? `/${artworkR2Key}` : undefined;
        if (artworkFile && (currentArtworkFile !== expectedArtworkFile || !artworkExists)) {
          if (!artworkExists) {
            console.log(`    Artwork file missing in R2: "${artworkR2Key}". Uploading...`);
          } else {
            console.log(`    Artwork file path mismatch: current="${currentArtworkFile}", expected="${expectedArtworkFile}". Uploading/Updating...`);
          }
          if (!dryRun) {
            const artworkContentType = artworkFile.name.endsWith('.png') ? 'image/png' : artworkFile.name.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
            await uploadToR2(artworkFile.id, artworkR2Key!, artworkContentType);
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
        await uploadToR2(mp3.id!, audioR2Key, 'audio/mpeg');

        // Upload artwork to R2
        if (artworkFile && artworkR2Key) {
          const artworkContentType = artworkFile.name.endsWith('.png') ? 'image/png' : artworkFile.name.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
          await uploadToR2(artworkFile.id, artworkR2Key, artworkContentType);
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
    
    const artworkExists = await fileExistsInR2(artworkR2Key);
    
    if (existing) {
      console.log(`  Mix document already exists in Sanity. Checking if artwork updates are needed...`);
      let needsPatch = false;
      const patchData: any = {};
      
      const currentArtworkFile = existing.artworkFile;
      const expectedArtworkFile = `/${artworkR2Key}`;
      
      if (currentArtworkFile !== expectedArtworkFile || !artworkExists) {
        if (!artworkExists) {
          console.log(`    Artwork file missing in R2: "${artworkR2Key}". Uploading...`);
        } else {
          console.log(`    Artwork file path mismatch: current="${currentArtworkFile}", expected="${expectedArtworkFile}". Uploading/Updating...`);
        }
        if (!dryRun) {
          const artworkContentType = artworkFile.name.endsWith('.png') ? 'image/png' : artworkFile.name.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
          await uploadToR2(artworkFile.id, artworkR2Key, artworkContentType);
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
        await uploadToR2(artworkFile.id, artworkR2Key, artworkContentType);
        
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
