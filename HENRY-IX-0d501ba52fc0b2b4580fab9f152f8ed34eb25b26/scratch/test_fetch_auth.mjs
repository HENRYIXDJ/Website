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
  console.log("Fetching url using fetch + Auth header...");
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  console.log("Fetch Status:", res.status);
  console.log("Fetch Headers:", [...res.headers.entries()]);
} catch (error) {
  console.error("Error:", error);
}
