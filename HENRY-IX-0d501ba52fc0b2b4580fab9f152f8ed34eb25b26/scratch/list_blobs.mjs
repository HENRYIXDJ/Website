import { list } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

// Read .env.local manually to get the token
const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
let token = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('BLOB_READ_WRITE_TOKEN=')) {
    token = line.split('BLOB_READ_WRITE_TOKEN=')[1].replace(/['"\r]/g, '').trim();
  }
}

if (!token) {
  console.error("Error: BLOB_READ_WRITE_TOKEN not found in .env.local");
  process.exit(1);
}

try {
  console.log("Listing blobs using token: " + token.substring(0, 15) + "...");
  const { blobs } = await list({ token });
  console.log("--- BLOBS START ---");
  console.log(JSON.stringify(blobs, null, 2));
  console.log("--- BLOBS END ---");
} catch (error) {
  console.error("Error listing blobs:", error);
  process.exit(1);
}
