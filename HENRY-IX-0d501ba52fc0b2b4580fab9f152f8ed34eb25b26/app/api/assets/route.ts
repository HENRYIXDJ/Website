import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  
  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  // Basic security check: make sure the url belongs to vercel-storage
  if (!url.includes('.private.blob.vercel-storage.com')) {
    return new NextResponse('Invalid source domain', { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
      },
    });

    if (!response.ok) {
      return new NextResponse(`Error fetching asset from source: ${response.statusText}`, { status: response.status });
    }
    
    // Create headers based on the response
    const headers = new Headers();
    const contentType = response.headers.get('content-type');
    if (contentType) headers.set('content-type', contentType);
    const contentLength = response.headers.get('content-length');
    if (contentLength) headers.set('content-length', contentLength);
    
    // Cache control to make loading fast and browser-cachable
    headers.set('cache-control', 'public, max-age=31536000, immutable');

    // Return the readable stream directly
    return new NextResponse(response.body, {
      headers,
    });
  } catch (error) {
    console.error('Error proxying asset:', error);
    return new NextResponse('Error fetching asset', { status: 500 });
  }
}
