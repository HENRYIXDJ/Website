import { NextResponse } from 'next/server';
import { issueSignedToken, presignUrl } from '@vercel/blob';

async function handleAssetRequest(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  
  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error('BLOB_READ_WRITE_TOKEN is not configured');
    return new NextResponse('BLOB_READ_WRITE_TOKEN is not configured', { status: 500 });
  }

  // Parse storeId from the read-write token
  // Token is of format: vercel_blob_rw_<storeId>_<randomString>
  const tokenParts = token.split('_');
  const storeId = tokenParts[3]?.toLowerCase();
  
  if (!storeId) {
    console.error('Could not extract storeId from BLOB_READ_WRITE_TOKEN');
    return new NextResponse('Store ID configuration error', { status: 500 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch (e) {
    return new NextResponse('Invalid URL parameter', { status: 400 });
  }

  // Exact validation of the storage host domain
  const expectedHost = `${storeId}.private.blob.vercel-storage.com`;
  if (parsedUrl.host.toLowerCase() !== expectedHost) {
    return new NextResponse('Invalid source domain', { status: 400 });
  }

  try {
    // pathname starts with a slash, we want to strip the leading slash for vercel blob
    const pathname = decodeURIComponent(parsedUrl.pathname.slice(1));

    // Generate a short-lived delegation token for reading this specific pathname
    const signedToken = await issueSignedToken({
      pathname,
      operations: ['get'],
      token,
    });

    // Generate the presigned URL, valid for 5 minutes (300 seconds)
    const { presignedUrl } = await presignUrl(signedToken, {
      pathname,
      operation: 'get',
      access: 'private',
      validUntil: Date.now() + 5 * 60 * 1000,
    });

    // Return a temporary redirect to the signed URL
    return NextResponse.redirect(presignedUrl, { status: 307 });
  } catch (error) {
    console.error('Error signing assets URL:', error);
    return new NextResponse('Error generating signed URL', { status: 500 });
  }
}

export async function GET(request: Request) {
  return handleAssetRequest(request);
}

export async function HEAD(request: Request) {
  return handleAssetRequest(request);
}
