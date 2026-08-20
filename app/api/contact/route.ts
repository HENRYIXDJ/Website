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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).trim())) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const cleanName = String(name).trim().slice(0, 100);
    const cleanEmail = String(email).trim().slice(0, 150);
    const cleanSubject = subject ? String(subject).trim().slice(0, 150) : '';
    const cleanMessage = String(message).trim().slice(0, 3000);

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
        name: cleanName,
        email: cleanEmail,
        message: cleanSubject ? `[${cleanSubject}] ${cleanMessage}` : cleanMessage,
      });
    } catch (d1Err) {
      console.warn('D1 database insert skipped or failed:', d1Err);
    }

    // Queue email dispatch
    try {
      await queueEmailPayload({
        to: cleanEmail,
        subject: `Thanks for reaching out, ${cleanName}`,
        name: cleanName,
        message: cleanSubject ? `[${cleanSubject}] ${cleanMessage}` : cleanMessage,
      });
    } catch (queueErr) {
      console.warn('Queue email dispatch skipped or failed:', queueErr);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Contact submit API error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing your request.' },
      { status: 500 }
    );
  }
}
