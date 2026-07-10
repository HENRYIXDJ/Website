import { get } from '@vercel/blob';
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
  const url = 'https://tegbbmt42xpyzcnx.private.blob.vercel-storage.com/Mixes/Knight%20Club/KC%20Artwork/Session%201.jpg';
  console.log("Fetching url metadata using get...");
  const response = await get(url, { token });
  console.log("Response keys:", Object.keys(response));
  console.log("Response headers:", [...response.headers.entries()]);
  console.log("ContentType:", response.headers.get('content-type'));
  console.log("ContentLength:", response.headers.get('content-length'));
} catch (error) {
  console.error("Error:", error);
}
