import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const s3Client = new S3Client({
  endpoint: process.env.R2_ENDPOINT,
  region: 'auto',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

async function run() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME || 'websiteassets',
      Prefix: 'Mixes/Knight Club/Mix Artwork/',
    });
    const response = await s3Client.send(command);
    console.log('Objects in R2 under Mixes/Knight Club/Mix Artwork/:');
    if (response.Contents) {
      for (const obj of response.Contents) {
        console.log(`- ${obj.Key} (Size: ${obj.Size})`);
      }
    } else {
      console.log('No objects found.');
    }
  } catch (error) {
    console.error('Error listing R2 objects:', error);
  }
}

run();
