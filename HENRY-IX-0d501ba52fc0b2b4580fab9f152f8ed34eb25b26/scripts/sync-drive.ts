import { google } from 'googleapis';
import { S3Client } from '@aws-sdk/client-s3';
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

const s3Client = new S3Client({
  endpoint: process.env.R2_ENDPOINT,
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

function matchArtworkFile(mixName: string, mixType: string, files: { id: string; name: string }[]): { id: string; name: string } | null {
  const normalizedMixName = mixName.toLowerCase().replace(/[:\-]/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Try exact match first
  let found = files.find(f => {
    const baseName = f.name?.substring(0, f.name.lastIndexOf('.')) || f.name || '';
    return baseName.toLowerCase().trim() === mixName.toLowerCase().trim();
  });
  if (found) return found;

  // Specific mapping for Knight Club
  if (mixType === 'Knight Club') {
    const sessionMatch = normalizedMixName.match(/session\s*(\d+)/);
    if (sessionMatch) {
      const sessionNum = sessionMatch[1];
      found = files.find(f => {
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
      found = files.find(f => {
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
      found = files.find(f => {
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
    found = files.find(f => {
      const baseName = f.name?.substring(0, f.name.lastIndexOf('.')) || f.name || '';
      return baseName.includes(num);
    });
    if (found) return found;
  }

  return null;
}

function matchTracklistFile(mixName: string, files: { id: string; name: string }[]): { id: string; name: string } | null {
  const normalizedMixName = mixName.toLowerCase().trim();
  // Exact match
  let found = files.find(f => {
    const baseName = f.name?.substring(0, f.name.lastIndexOf('.')) || f.name || '';
    return baseName.toLowerCase().trim() === normalizedMixName;
  });
  if (found) return found;

  // Fuzzy match
  found = files.find(f => {
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

async function main() {
  console.log(`Starting sync... ${dryRun ? '[DRY RUN MODE]' : ''}`);
  
  // Find Root Folder
  const rootId = await findFolderId('Henry IX Website');
  if (!rootId) {
    console.error("Root folder 'Henry IX Website' not found in Google Drive.");
    process.exit(1);
  }
  console.log(`Found 'Henry IX Website' root folder ID: ${rootId}`);

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

  // Find sub-folders for Track Lists and Artwork
  const tracklistsFolderId = await findFolderId('Mix Track Lists', mixesId);
  const artworkFolderId = await findFolderId('Mix Artwork', mixesId);
  
  if (!tracklistsFolderId) console.warn("Folder 'Mix Track Lists' not found. Skipping tracklist matching.");
  if (!artworkFolderId) console.warn("Folder 'Mix Artwork' not found. Skipping cover art matching.");

  // Preload artwork files
  let artworkFiles: { id: string; name: string }[] = [];
  if (artworkFolderId) {
    const mimeQuery = ['image/jpeg', 'image/png', 'image/webp'].map(m => `mimeType = '${m}'`).join(' or ');
    const query = `'${artworkFolderId}' in parents and trashed = false and (${mimeQuery})`;
    const res = await drive.files.list({ q: query, fields: 'files(id, name)', pageSize: 1000 });
    artworkFiles = res.data.files?.map(f => ({ id: f.id!, name: f.name! })) || [];
    console.log(`Preloaded ${artworkFiles.length} artwork files from Google Drive.`);
  }

  // Preload tracklists
  let tracklistFiles: { id: string; name: string }[] = [];
  if (tracklistsFolderId) {
    const query = `'${tracklistsFolderId}' in parents and trashed = false and mimeType = 'text/plain'`;
    const res = await drive.files.list({ q: query, fields: 'files(id, name)', pageSize: 1000 });
    tracklistFiles = res.data.files?.map(f => ({ id: f.id!, name: f.name! })) || [];
    console.log(`Preloaded ${tracklistFiles.length} tracklist files from Google Drive.`);
  }

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
      const tracklistFile = matchTracklistFile(mixName, tracklistFiles);
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
      } else {
        console.log(`  No artwork file found for "${mixName}"`);
      }

      // Check if document already exists in Sanity
      const existing = await sanityClient.fetch(
        `*[_type == "mix" && (slug.current == $slug || title == $title || audioFile == $audioFile)][0]`,
        { slug: cleanSlug, title: cleanTitle, audioFile: `/${audioR2Key}` }
      );

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

        // Audio path alignment
        const currentAudioFile = existing.audioFile;
        const expectedAudioFile = `/${audioR2Key}`;
        if (currentAudioFile !== expectedAudioFile) {
          console.log(`    Audio file path mismatch: current="${currentAudioFile}", expected="${expectedAudioFile}". Uploading/Updating...`);
          if (!dryRun) {
            await uploadToR2(mp3.id!, audioR2Key, 'audio/mpeg');
          }
          patchData.audioFile = expectedAudioFile;
          needsPatch = true;
        }

        // Artwork path alignment
        const currentArtworkFile = existing.artworkFile;
        const expectedArtworkFile = artworkR2Key ? `/${artworkR2Key}` : undefined;
        if (artworkFile && currentArtworkFile !== expectedArtworkFile) {
          console.log(`    Artwork file path mismatch: current="${currentArtworkFile}", expected="${expectedArtworkFile}". Uploading/Updating...`);
          if (!dryRun) {
            const artworkContentType = artworkFile.name.endsWith('.png') ? 'image/png' : artworkFile.name.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
            await uploadToR2(artworkFile.id, artworkR2Key!, artworkContentType);
          }
          patchData.artworkFile = expectedArtworkFile;
          needsPatch = true;
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
  console.log('\nSync finished successfully!');
}

main().catch(err => {
  console.error("Unexpected error in main:", err);
  process.exit(1);
});
