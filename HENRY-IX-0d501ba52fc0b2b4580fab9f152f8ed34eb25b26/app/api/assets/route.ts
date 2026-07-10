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

  const fetchHeaders = new Headers();
  const rangeHeader = request.headers.get('range');
  if (rangeHeader) {
    fetchHeaders.set('range', rangeHeader);
  }
  fetchHeaders.set('Authorization', `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`);

  try {
    const response = await fetch(url, {
      headers: fetchHeaders,
    });

    if (!response.ok && response.status !== 206) {
      return new NextResponse(`Error fetching asset from source: ${response.statusText}`, { status: response.status });
    }
    
    // Create headers based on the response
    const headers = new Headers();
    
    const headersToForward = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'etag',
      'last-modified'
    ];

    for (const headerName of headersToForward) {
      const val = response.headers.get(headerName);
      if (val) {
        headers.set(headerName, val);
      }
    }
    
    // Cache control to make loading fast and browser-cachable
    headers.set('cache-control', 'public, max-age=31536000, immutable');

    // Return the response status and body stream directly
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    console.error('Error proxying asset:', error);
    return new NextResponse('Error fetching asset', { status: 500 });
  }
}
