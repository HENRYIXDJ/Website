import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'next-sanity';

export const runtime = 'edge';

async function verifyMuxSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): Promise<boolean> {
  if (!signatureHeader || !secret) return false;

  const parts = signatureHeader.split(',');
  let timestamp: string | null = null;
  let signature: string | null = null;

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 't') timestamp = value;
    else if (key === 'v1') signature = value;
  }

  if (!timestamp || !signature) return false;

  const now = Math.floor(Date.now() / 1000);
  const timeDifference = Math.abs(now - parseInt(timestamp, 10));
  if (timeDifference > 300) {
    console.error(`Webhook signature timestamp is too old or new. Diff: ${timeDifference}s`);
    return false;
  }

  const payload = `${timestamp}.${rawBody}`;

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(payload);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      messageData
    );

    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const expectedSignature = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    if (signature.length !== expectedSignature.length) return false;
    let result = 0;
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    return result === 0;
  } catch (err) {
    console.error('Failed to verify HMAC signature:', err);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const secret = process.env.MUX_WEBHOOK_SECRET;
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction || secret) {
      if (!secret) {
        console.error('MUX_WEBHOOK_SECRET is missing in production environment');
        return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
      }
      const signatureHeader = req.headers.get('mux-signature');
      const isValid = await verifyMuxSignature(rawBody, signatureHeader, secret);
      if (!isValid) {
        console.error('Invalid Mux Webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else {
      console.warn('Bypassing webhook signature check (development mode)');
    }

    const body = JSON.parse(rawBody);
    const eventType = body.type;

    console.log(`Received Mux Webhook: ${eventType}`);

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

    if (eventType === 'video.live_stream.connected') {
      const data = body.data;
      const playbackId = data?.playback_ids?.[0]?.id;

      if (!playbackId) {
        return NextResponse.json({ error: 'No playback ID found in event' }, { status: 400 });
      }

      // Find the upcoming live stream matching this playback ID
      const upcomingStreams = await writeClient.fetch<any[]>(
        `*[_type == "liveStream" && playbackId == $playbackId && status == "upcoming"]`,
        { playbackId }
      );

      if (upcomingStreams && upcomingStreams.length > 0) {
        const docToUpdate = upcomingStreams[0];
        await writeClient
          .patch(docToUpdate._id)
          .set({ status: 'live' })
          .commit();

        console.log(`Successfully activated live stream: ${docToUpdate._id}`);
        return NextResponse.json({ success: true, message: `Activated live stream ${docToUpdate._id}` });
      } else {
        // Fallback: Activate first upcoming scheduled stream
        const nextUpcoming = await writeClient.fetch<any>(
          `*[_type == "liveStream" && status == "upcoming"] | order(scheduledTime asc)[0]`
        );
        if (nextUpcoming) {
          const docToUpdate = nextUpcoming;
          await writeClient
            .patch(docToUpdate._id)
            .set({ status: 'live', playbackId })
            .commit();
          console.log(`Activated first upcoming stream as fallback: ${docToUpdate._id}`);
          return NextResponse.json({ success: true, message: `Activated stream fallback ${docToUpdate._id}` });
        }
      }
    }

    if (eventType === 'video.asset.live_stream_completed' || eventType === 'video.asset.ready') {
      const data = body.data;
      
      // If it's a video.asset.ready, check if it was created from a live stream
      if (eventType === 'video.asset.ready' && !data?.live_stream_id) {
        return NextResponse.json({ message: 'Non-livestream asset ignored' }, { status: 200 });
      }

      const newPlaybackId = data?.playback_ids?.[0]?.id;
      if (!newPlaybackId) {
        return NextResponse.json({ error: 'No playback ID found in event' }, { status: 400 });
      }

      // Find the active live stream document marked as "live"
      const activeStreams = await writeClient.fetch<any[]>(
        `*[_type == "liveStream" && status == "live"]`
      );

      if (activeStreams && activeStreams.length > 0) {
        const docToUpdate = activeStreams[0];
        
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
