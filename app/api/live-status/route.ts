import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'next-sanity';
import { Resend } from 'resend';

function safeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  let result = 0;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i++) {
    const charA = a.charCodeAt(i) || 0;
    const charB = b.charCodeAt(i) || 0;
    result |= (charA ^ charB);
  }
  return result === 0 && a.length === b.length;
}

export async function POST(req: NextRequest) {
  try {
    const body: any = await req.json().catch(() => ({}));
    const { secret, action, streamUrl, obsStreamKey, countdownMinutes = 5, multiPlatformTargets, notifySubscribers = true } = body;

    const configuredSecret = process.env.LIVE_STATUS_SECRET;
    const isProduction = process.env.NODE_ENV === 'production';

    // Verify secret using secure timing-safe comparison if configured
    if (isProduction || configuredSecret) {
      if (configuredSecret && !safeCompare(secret, configuredSecret)) {
        console.warn('Unauthorized attempt to trigger live status API');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'r6mln4n3';
    const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
    const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_TOKEN;

    if (!token) {
      console.warn('Sanity write token missing in env; operating in dev fallback mode.');
    }

    const writeClient = token
      ? createClient({
          projectId,
          dataset,
          apiVersion: '2023-01-01',
          token,
          useCdn: false,
        })
      : null;

    let activeOrUpcoming = null;
    if (writeClient) {
      activeOrUpcoming = await writeClient.fetch<any>(
        `*[_type == "liveStream" && (status == "live" || status == "upcoming" || status == "ended")] | order(_updatedAt desc)[0]`
      );

      if (!activeOrUpcoming) {
        const lastStream = await writeClient.fetch<any>(
          `*[_type == "liveStream"] | order(_createdAt desc)[0]`
        );
        activeOrUpcoming = lastStream;
      }
    }

    const docId = activeOrUpcoming?._id || 'drafts.liveStreamSettings';

    const parsedCountdown = parseInt(String(countdownMinutes), 10);
    const offsetMs = isNaN(parsedCountdown) ? 5 * 60 * 1000 : parsedCountdown * 60 * 1000;
    const isImmediate = parsedCountdown === 0 || action === 'immediate';

    if (action === 'publish' || action === 'live' || action === 'upcoming' || action === 'immediate') {
      const targetStatus = isImmediate ? 'live' : 'upcoming';
      const scheduledTime = isImmediate ? new Date().toISOString() : new Date(Date.now() + offsetMs).toISOString();

      const patches: any = {
        status: targetStatus,
        countdownMinutes: parsedCountdown,
        scheduledTime,
        endedAt: null,
      };

      if (streamUrl) patches.playbackId = streamUrl;
      if (obsStreamKey) patches.obsStreamKey = obsStreamKey;
      if (multiPlatformTargets) patches.multiPlatformTargets = multiPlatformTargets;

      if (writeClient && activeOrUpcoming) {
        await writeClient.patch(docId).set(patches).commit();
      }

      // Resend Email Alert Dispatch (@henryix.com)
      if (notifySubscribers && process.env.RESEND_API_KEY) {
        try {
          const resend = new Resend(process.env.RESEND_API_KEY);
          const fromEmail = process.env.RESEND_FROM_EMAIL || 'HENRY IX Broadcasts <broadcasts@henryix.com>';
          const streamTitle = activeOrUpcoming?.title || 'Live Transmission Broadcast';

          // Fetch subscribers if writeClient available
          let subscribers: any[] = [];
          if (writeClient) {
            subscribers = await writeClient.fetch<any[]>(`*[_type == "subscriber"]{ email }`);
          }

          const recipientEmails = subscribers.map(s => s.email).filter(Boolean);

          if (recipientEmails.length > 0) {
            const subjectText = isImmediate
              ? `🔴 LIVE NOW: ${streamTitle} | HENRY IX`
              : `🚨 BROADCAST ALERT: Going Live in ${parsedCountdown} Minutes! | HENRY IX`;

            const bodyHtml = `
              <div style="background-color:#000000; color:#ffffff; font-family:'OCR A', monospace; padding:30px; border:2px solid #D8163F;">
                <h1 style="color:#D8163F; letter-spacing:2px;">HENRY IX TRANSMISSION SIGNAL</h1>
                <p style="font-size:16px;">${subjectText}</p>
                <p style="color:#a1a1aa;">Tune in directly on the official site for real-time low-latency visuals and high-fidelity audio.</p>
                <div style="margin-top:25px;">
                  <a href="https://henryix.com/live" style="background-color:#D8163F; color:#ffffff; padding:12px 24px; text-decoration:none; font-weight:bold; display:inline-block;">TUNE IN TO LIVE TRANSMISSION</a>
                </div>
                <p style="margin-top:30px; font-size:11px; color:#52525b;">HENRY IX DJ STUDIO // BROADCAST CENTER</p>
              </div>
            `;

            await resend.emails.send({
              from: fromEmail,
              to: recipientEmails.slice(0, 50), // Batch up to 50 recipients
              subject: subjectText,
              html: bodyHtml,
            });
            console.log(`Email alert sent via Resend from ${fromEmail} to ${recipientEmails.length} subscribers.`);
          }
        } catch (emailErr) {
          console.warn('Resend email notification warning:', emailErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: isImmediate ? 'Broadcast status set to LIVE NOW' : `Countdown scheduled for ${parsedCountdown} minutes`,
        status: targetStatus,
        scheduledTime,
      });
    }

    if (action === 'done' || action === 'ended' || action === 'archive') {
      if (writeClient && activeOrUpcoming) {
        await writeClient
          .patch(docId)
          .set({
            status: 'ended',
            endedAt: new Date().toISOString(),
          })
          .commit();
      }
      return NextResponse.json({ success: true, message: 'Broadcast concluded' });
    }

    return NextResponse.json({ error: 'Invalid action provided' }, { status: 400 });
  } catch (err: any) {
    console.error('Error in live-status route:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
