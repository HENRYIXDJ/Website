import { issueSignedToken, presignUrl } from '@vercel/blob';
import { NextResponse } from 'next/server';

const PRIVATE_BLOB_HOST = 'tegbbmt42xpyzcnx.private.blob.vercel-storage.com';
const SIGNED_URL_TTL_MS = 15 * 60 * 1000;

type BlobOperation = 'get' | 'head';

function getPrivateBlobPathname(request: Request): string | NextResponse {
  const { searchParams } = new URL(request.url);
  const sourceUrl = searchParams.get('url');

  if (!sourceUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(sourceUrl);
  } catch {
    return new NextResponse('Invalid url parameter', { status: 400 });
  }

  if (parsedUrl.protocol !== 'https:' || parsedUrl.hostname !== PRIVATE_BLOB_HOST) {
    return new NextResponse('Invalid source domain', { status: 400 });
  }

  return decodeURIComponent(parsedUrl.pathname.replace(/^\//, ''));
}

async function redirectToSignedBlobUrl(request: Request, operation: BlobOperation) {
  const pathname = getPrivateBlobPathname(request);
  if (pathname instanceof NextResponse) {
    return pathname;
  }

  try {
    const validUntil = Date.now() + SIGNED_URL_TTL_MS;
    const token = await issueSignedToken({
      pathname,
      operations: [operation],
      validUntil,
    });
    const { presignedUrl } = await presignUrl(token, {
      pathname,
      operation,
      validUntil,
    });

    const response = NextResponse.redirect(presignedUrl, 307);
    response.headers.set('cache-control', 'private, max-age=300');
    return response;
  } catch (error) {
    console.error('Error signing private blob URL:', error);
    return new NextResponse('Error signing asset URL', { status: 500 });
  }
}

export async function GET(request: Request) {
  return redirectToSignedBlobUrl(request, 'get');
}

export async function HEAD(request: Request) {
  return redirectToSignedBlobUrl(request, 'head');
}
