import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'next-sanity';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { subscription?: any; email?: string };
    const { subscription, email } = body;

    if (!subscription && !email) {
      return NextResponse.json({ error: 'Missing subscription details or email' }, { status: 400 });
    }

    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'r6mln4n3';
    const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
    const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_TOKEN;

    if (token && email) {
      const writeClient = createClient({
        projectId,
        dataset,
        apiVersion: '2023-01-01',
        token,
        useCdn: false,
      });

      // Save email subscriber if provided
      const existing = await writeClient.fetch<any>(`*[_type == "subscriber" && email == $email][0]`, { email });
      if (!existing) {
        await writeClient.create({
          _type: 'subscriber',
          email,
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
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
