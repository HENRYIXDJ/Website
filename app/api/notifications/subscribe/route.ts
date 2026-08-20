import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'next-sanity';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { subscription?: any; email?: string };
    const { subscription, email } = body;

    if (!subscription && !email) {
      return NextResponse.json({ error: 'Missing subscription details or email' }, { status: 400 });
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(email).trim())) {
        return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
      }
    }

    const cleanEmail = email ? String(email).trim().slice(0, 150) : null;

    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'r6mln4n3';
    const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
    const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_TOKEN;

    if (token && cleanEmail) {
      const writeClient = createClient({
        projectId,
        dataset,
        apiVersion: '2023-01-01',
        token,
        useCdn: false,
      });

      // Save email subscriber if provided
      const existing = await writeClient.fetch<any>(`*[_type == "subscriber" && email == $email][0]`, { email: cleanEmail });
      if (!existing) {
        await writeClient.create({
          _type: 'subscriber',
          email: cleanEmail,
          subscribedAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to live broadcast notifications!',
    });
  } catch (err: any) {
    console.error('Error subscribing to notifications:', err);
    return NextResponse.json({ error: 'Failed to complete subscription' }, { status: 500 });
  }
}
