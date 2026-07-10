import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    if (!request.body) {
      return NextResponse.json({ error: 'File body is required' }, { status: 400 });
    }

    // Securely upload using public read permissions
    const blob = await put(filename, request.body, {
      access: 'public',
    });

    return NextResponse.json(blob);
  } catch (error: any) {
    console.error('Vercel Blob Upload endpoint error:', error);
    return NextResponse.json(
      { error: `Vercel Blob upload failed: ${error.message || 'Unknown error'}. Please verify your BLOB_READ_WRITE_TOKEN is configured in Vercel settings.` },
      { status: 500 }
    );
  }
}
