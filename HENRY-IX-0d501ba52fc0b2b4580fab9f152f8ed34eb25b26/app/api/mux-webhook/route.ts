import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'next-sanity';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventType = body.type;

    console.log(`Received Mux Webhook: ${eventType}`);

    if (eventType === 'video.asset.live_stream_completed') {
      const data = body.data;
      const newPlaybackId = data?.playback_ids?.[0]?.id;

      if (!newPlaybackId) {
        return NextResponse.json({ error: 'No playback ID found in event' }, { status: 400 });
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

      // Find the active live stream document marked as "live"
      const activeStreams = await writeClient.fetch<any[]>(
        `*[_type == "liveStream" && status == "live"]`
      );

      if (activeStreams && activeStreams.length > 0) {
        const docToUpdate = activeStreams[0];
        
        // Update status to "archived" and swap playbackId with the VOD playback ID
        await writeClient
          .patch(docToUpdate._id)
          .set({
            status: 'archived',
            playbackId: newPlaybackId,
          })
          .commit();

        console.log(`Successfully archived stream ${docToUpdate._id} and updated playback ID to ${newPlaybackId}`);
        return NextResponse.json({ success: true, message: `Archived stream ${docToUpdate._id}` });
      } else {
        console.warn('No active live stream found with status == "live"');
        return NextResponse.json({ message: 'No active live stream found' }, { status: 200 });
      }
    }

    return NextResponse.json({ message: 'Event ignored' }, { status: 200 });
  } catch (error: any) {
    console.error('Mux webhook error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
