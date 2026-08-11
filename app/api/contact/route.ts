import { NextResponse } from 'next/server';
import { saveContactSubmissionToD1, queueEmailPayload, verifyTurnstileToken } from '@/lib/cloudflare';

export async function POST(req: Request) {
  try {
    const body: any = await req.json();
    const { name, email, subject, message, turnstileToken } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    // Verify Turnstile if token is provided
    if (turnstileToken) {
      const isHuman = await verifyTurnstileToken(turnstileToken);
      if (!isHuman) {
        return NextResponse.json(
          { error: 'Turnstile verification failed.' },
          { status: 400 }
        );
      }
    }

    // Save to D1 database
    try {
      await saveContactSubmissionToD1({
        name,
        email,
        message: subject ? `[${subject}] ${message}` : message,
      });
    } catch (d1Err) {
      console.warn('D1 database insert skipped or failed:', d1Err);
    }

    // Queue email dispatch
    try {
      await queueEmailPayload({
        to: email,
        subject: `Thanks for reaching out, ${name}`,
        name,
        message: subject ? `[${subject}] ${message}` : message,
      });
    } catch (queueErr) {
      console.warn('Queue email dispatch skipped or failed:', queueErr);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Contact submit API error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to submit form' },
      { status: 500 }
    );
  }
}
