import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'next-sanity';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { secret, action, streamUrl } = body;

    const configuredSecret = process.env.LIVE_STATUS_SECRET;
    const isProduction = process.env.NODE_ENV === 'production';

    // Verify secret
    if (isProduction || configuredSecret) {
      if (!configuredSecret) {
        console.error('LIVE_STATUS_SECRET is missing in production environment');
        return NextResponse.json({ error: 'Server secret not configured' }, { status: 500 });
      }
      if (secret !== configuredSecret) {
        console.warn('Unauthorized attempt to trigger live status API');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'r6mln4n3';
    const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
    const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_TOKEN;

    if (!token) {
      console.error('Sanity Write Token is missing in environment variables');
      return NextResponse.json({ error: 'Sanity write token not configured' }, { status: 500 });
    }

    const writeClient = createClient({
      projectId,
      dataset,
      apiVersion: '2023-01-01',
      token,
      useCdn: false,
    });

    // Find the latest active or upcoming stream document
    let activeOrUpcoming = await writeClient.fetch<any>(
      `*[_type == "liveStream" && (status == "live" || status == "upcoming" || status == "ended")] | order(_updatedAt desc)[0]`
    );

    if (!activeOrUpcoming) {
      // Fallback: fetch the very last stream created if none active/upcoming
      const lastStream = await writeClient.fetch<any>(
        `*[_type == "liveStream"] | order(_createdAt desc)[0]`
      );
      if (!lastStream) {
        return NextResponse.json({ error: 'No live stream document found in Sanity' }, { status: 404 });
      }
      activeOrUpcoming = lastStream;
    }

    const docId = activeOrUpcoming._id;

    if (action === 'publish' || action === 'live') {
      // Set to upcoming status with a 5-minute scheduled offset countdown
      const countdownStartTime = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      const patches: any = {
        status: 'upcoming',
        scheduledTime: countdownStartTime,
        endedAt: null,
      };

      if (streamUrl) {
        patches.playbackId = streamUrl;
      }

      await writeClient.patch(docId).set(patches).commit();
      console.log(`Live stream status patched to upcoming (countdown active) for ${docId}`);
      return NextResponse.json({ success: true, message: `Stream countdown activated for ${docId}` });
    }

    if (action === 'done' || action === 'ended' || action === 'archive') {
      // Stream concluded - trigger 30 minute grace period concluded screen
      await writeClient
        .patch(docId)
        .set({
          status: 'ended',
          endedAt: new Date().toISOString(),
        })
        .commit();
      console.log(`Live stream status patched to ended for ${docId}`);
      return NextResponse.json({ success: true, message: `Concluded grace period activated for ${docId}` });
    }

    return NextResponse.json({ error: 'Invalid action provided' }, { status: 400 });
  } catch (err: any) {
    console.error('Error in live-status route:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
