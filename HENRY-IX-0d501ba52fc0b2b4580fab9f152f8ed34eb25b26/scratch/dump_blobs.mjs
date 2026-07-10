import { list } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
let token = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('BLOB_READ_WRITE_TOKEN=')) {
    token = line.split('BLOB_READ_WRITE_TOKEN=')[1].replace(/['"\r]/g, '').trim();
  }
}

try {
  const { blobs } = await list({ token });
  fs.writeFileSync('scratch/blobs.json', JSON.stringify(blobs, null, 2));
  console.log("Successfully wrote scratch/blobs.json");
} catch (error) {
  console.error("Error:", error);
  process.exit(1);
}
