import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'r6mln4n3',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2023-01-01',
  useCdn: false,
});

async function run() {
  try {
    const query = `*[_type == "mix" && title match "Knight Club*"] | order(title asc) {
      _id,
      title,
      audioFile,
      artworkFile
    }`;
    const response = await sanityClient.fetch(query);
    console.log('Knight Club mixes in Sanity:');
    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error querying Sanity:', error);
  }
}

run();
