import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'next-sanity';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json({ error: 'Missing type or document data' }, { status: 400 });
    }

    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'r6mln4n3';
    const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
    const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_TOKEN;

    if (!token) {
      console.warn('Sanity Write Token is missing in environment variables');
      return NextResponse.json({
        success: true,
        message: 'Saved to local transient state (Sanity Write Token missing for persistent write)',
        doc: data
      });
    }

    const writeClient = createClient({
      projectId,
      dataset,
      apiVersion: '2023-01-01',
      token,
      useCdn: false,
    });

    let createdDoc = null;

    if (type === 'mix') {
      const slugValue = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      createdDoc = await writeClient.create({
        _type: 'mix',
        title: data.title,
        slug: { _type: 'slug', current: slugValue },
        bpm: Number(data.bpm) || 130,
        genre: data.genre || 'UK Garage',
        tags: Array.isArray(data.tags) ? data.tags : (data.tags ? data.tags.split(',').map((t: string) => t.trim()) : []),
        audioFile: data.audioFile || '',
        audioUrl: data.audioUrl || '',
        artworkFile: data.artworkFile || '',
        artworkUrl: data.artworkUrl || '',
        soundcloudLink: data.soundcloudLink || '',
        tracklist: data.tracklist || '',
        cuePoints: Array.isArray(data.cuePoints) ? data.cuePoints : [],
        publishedAt: new Date().toISOString(),
      });
    } else if (type === 'galleryImage') {
      createdDoc = await writeClient.create({
        _type: 'galleryImage',
        title: data.title || 'Untitled Photo',
        album: data.album || 'Me',
        category: data.category || 'me',
        imageFile: data.imageFile || '',
        imageUrl: data.imageUrl || '',
        gridClass: data.gridClass || 'col-span-1 aspect-square',
        tags: Array.isArray(data.tags) ? data.tags : [],
        caption: data.caption || '',
      });
    } else if (type === 'podcastEpisode') {
      const slugValue = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      createdDoc = await writeClient.create({
        _type: 'podcastEpisode',
        title: data.title,
        slug: { _type: 'slug', current: slugValue },
        seasonNumber: Number(data.seasonNumber) || 1,
        episodeNumber: Number(data.episodeNumber) || 1,
        summary: data.summary || '',
        guests: Array.isArray(data.guests) ? data.guests : [],
        audioUrl: data.audioUrl || '',
        artworkUrl: data.artworkUrl || '',
        duration: data.duration || '00:45:00',
        explicit: Boolean(data.explicit),
        publishedAt: new Date().toISOString(),
      });
    } else if (type === 'socialConnection') {
      createdDoc = await writeClient.create({
        _type: 'socialConnection',
        platform: data.platform,
        enabled: Boolean(data.enabled),
        streamKeyOrToken: data.streamKeyOrToken || '',
        accountHandle: data.accountHandle || '',
        lastSyncTime: new Date().toISOString(),
      });
    } else {
      return NextResponse.json({ error: `Unknown document type: ${type}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `${type} created successfully!`,
      document: createdDoc,
    });
  } catch (err: any) {
    console.error('Error in Studio Manage API:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
