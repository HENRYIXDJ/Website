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

async function findFileInFolder(namePrefix: string, folderId: string, mimeTypes: string[]): Promise<{ id: string; name: string } | null> {
  const mimeQuery = mimeTypes.map(m => `mimeType = '${m}'`).join(' or ');
  const query = `'${folderId}' in parents and trashed = false and (${mimeQuery})`;
  
  const res = await drive.files.list({ q: query, fields: 'files(id, name)' });
  const files = res.data.files || [];
  
  // Find a file whose base name matches the name prefix
  const matched = files.find(f => {
    const baseName = f.name?.substring(0, f.name.lastIndexOf('.')) || f.name || '';
    return baseName.toLowerCase().trim() === namePrefix.toLowerCase().trim();
  });
  
  return matched ? { id: matched.id!, name: matched.name! } : null;
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
      
      console.log(`- Checking mix: "${mixName}"`);

      // Check if document already exists in Sanity
      const existing = await sanityClient.fetch(
        `*[_type == "mix" && title == $title][0]`,
        { title: mixName }
      );

      if (existing) {
        console.log(`  Mix "${mixName}" already exists in Sanity. Skipping sync.`);
        continue;
      }

      console.log(`  New mix discovered! Fetching assets...`);
      
      // Look for tracklist text file
      let tracklistText = '';
      if (tracklistsFolderId) {
        const tracklistFile = await findFileInFolder(mixName, tracklistsFolderId, ['text/plain']);
        if (tracklistFile) {
          console.log(`  Found tracklist file: ${tracklistFile.name}`);
          tracklistText = await downloadFileText(tracklistFile.id);
        } else {
          console.log(`  No tracklist file found for "${mixName}"`);
        }
      }

      // Look for artwork image
      let artworkFile = null;
      if (artworkFolderId) {
        artworkFile = await findFileInFolder(mixName, artworkFolderId, ['image/jpeg', 'image/png', 'image/webp']);
        if (artworkFile) {
          console.log(`  Found artwork file: ${artworkFile.name}`);
        } else {
          console.log(`  No artwork file found for "${mixName}"`);
        }
      }

      // S3 / R2 Keys
      const audioR2Key = `Mixes/${mixType}/Mix Audio/${fileName}`;
      const artworkR2Key = artworkFile 
        ? `Mixes/${mixType}/Mix Artwork/${mixName}${artworkFile.name.substring(artworkFile.name.lastIndexOf('.'))}`
        : null;

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
          title: mixName,
          slug: {
            _type: 'slug',
            current: slugify(mixName),
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
        console.log(`  [DRY RUN] Would create Sanity mix document for: "${mixName}"`);
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
