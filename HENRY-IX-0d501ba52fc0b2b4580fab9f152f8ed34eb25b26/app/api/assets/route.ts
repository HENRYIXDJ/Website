import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
let endpoint = process.env.R2_ENDPOINT || (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);
const bucketName = process.env.R2_BUCKET_NAME;

if (endpoint && bucketName && endpoint.endsWith(`/${bucketName}`)) {
  endpoint = endpoint.slice(0, -(bucketName.length + 1));
}

const isR2 = process.env.NEXT_PUBLIC_USE_CLOUDFLARE_R2 === 'true' || !!(endpoint && accessKeyId && secretAccessKey);

let s3Client: S3Client | null = null;
if (isR2) {
  if (endpoint && accessKeyId && secretAccessKey) {
    s3Client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  } else {
    console.warn('R2 is enabled but credentials or endpoint are not fully configured.');
  }
}

async function handleAssetRequest(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  
  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch (e) {
    return new NextResponse('Invalid URL parameter', { status: 400 });
  }

  // pathname starts with a slash, we want to strip the leading slash
  const pathname = decodeURIComponent(parsedUrl.pathname.slice(1));

  if (!isR2 || !s3Client) {
    const r2PublicDomain = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
    if (r2PublicDomain) {
      const publicUrl = r2PublicDomain.endsWith('/') ? r2PublicDomain : `${r2PublicDomain}/`;
      return NextResponse.redirect(`${publicUrl}${pathname}`, { status: 307 });
    }
    return new NextResponse('Storage (Cloudflare R2) is not configured correctly', { status: 500 });
  }
  
  if (!bucketName) {
    return new NextResponse('R2 Bucket name not configured', { status: 500 });
  }
  
  const r2PublicDomain = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  const storageBaseUrl = process.env.NEXT_PUBLIC_STORAGE_BASE_URL;
  const allowedHosts = [
    'tegbbmt42xpyzcnx.private.blob.vercel-storage.com',
    'vercel-storage.com'
  ];
  if (r2PublicDomain) {
    try { allowedHosts.push(new URL(r2PublicDomain).host.toLowerCase()); } catch(_) {}
  }
  if (storageBaseUrl) {
    try { allowedHosts.push(new URL(storageBaseUrl).host.toLowerCase()); } catch(_) {}
  }
  
  const parsedHost = parsedUrl.host.toLowerCase();
  const isAllowedHost = allowedHosts.some(allowed => parsedHost === allowed || parsedHost.endsWith('.' + allowed));
  
  if (!isAllowedHost) {
     return new NextResponse('Invalid source domain', { status: 400 });
  }

  try {
    const range = request.headers.get('Range');
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: pathname,
      Range: range || undefined,
    });

    const s3Response = await s3Client.send(command);
    
    // Set headers
    const headers = new Headers();
    headers.set('Content-Type', s3Response.ContentType || 'application/octet-stream');
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    headers.set('Access-Control-Allow-Headers', '*');
    
    if (s3Response.ContentLength !== undefined) {
      headers.set('Content-Length', s3Response.ContentLength.toString());
    }
    if (s3Response.ContentRange) {
      headers.set('Content-Range', s3Response.ContentRange);
      headers.set('Accept-Ranges', 'bytes');
    } else {
      headers.set('Accept-Ranges', 'bytes');
    }
    if (s3Response.ETag) {
      headers.set('ETag', s3Response.ETag);
    }
    if (s3Response.LastModified) {
      headers.set('Last-Modified', s3Response.LastModified.toUTCString());
    }

    const statusCode = s3Response.ContentRange ? 206 : 200;

    if (request.method === 'HEAD') {
      return new NextResponse(null, {
        status: statusCode,
        headers,
      });
    }

    const readable = s3Response.Body as any;
    if (!readable) {
      return new NextResponse(null, { status: statusCode, headers });
    }

    const stream = new ReadableStream({
      start(controller) {
        if (typeof readable.on === 'function') {
          readable.on('data', (chunk: any) => controller.enqueue(chunk));
          readable.on('end', () => controller.close());
          readable.on('error', (err: any) => controller.error(err));
        } else if (typeof readable[Symbol.asyncIterator] === 'function') {
          (async () => {
            try {
              for await (const chunk of readable) {
                controller.enqueue(chunk);
              }
              controller.close();
            } catch (err) {
              controller.error(err);
            }
          })();
        } else {
          controller.error(new Error('Unknown stream type'));
        }
      },
      cancel() {
        if (typeof readable.destroy === 'function') {
          readable.destroy();
        }
      }
    });

    return new NextResponse(stream, {
      status: statusCode,
      headers,
    });

  } catch (error: any) {
    console.error('Error proxying asset from R2:', error);
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      return new NextResponse('Asset not found in storage', { status: 404 });
    }
    return new NextResponse('Error generating signed URL', { status: 500 });
  }
}

export async function GET(request: Request) {
  return handleAssetRequest(request);
}

export async function HEAD(request: Request) {
  return handleAssetRequest(request);
}
