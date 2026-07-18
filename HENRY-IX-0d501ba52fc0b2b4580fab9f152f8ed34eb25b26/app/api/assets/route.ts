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

  const r2PublicDomain = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  const storageBaseUrl = process.env.NEXT_PUBLIC_STORAGE_BASE_URL;
  const allowedHosts = [
    'tegbbmt42xpyzcnx.private.blob.vercel-storage.com',
    'pub-930b5248e181432aa6e2f5a31832fd8d.r2.dev',
    'pub-c7c5ff43a8ae174ad91e2668de0ad7f0.r2.dev'
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

  // Use native Cloudflare R2 binding if running inside Worker context
  let binding: any = null;
  try {
    const cfContext = eval("require")('@opennextjs/cloudflare');
    binding = cfContext.getCloudflareContext().env.R2_BUCKET;
  } catch (err) {
    binding = (process.env.R2_BUCKET as any) || (globalThis as any).R2_BUCKET;
  }
  if (binding && typeof binding.get === 'function') {
    try {
      const rangeHeader = request.headers.get('Range');
      let range: { offset: number; length?: number } | undefined;
      
      if (rangeHeader) {
        const parts = rangeHeader.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : undefined;
        range = {
          offset: start,
          length: end !== undefined ? (end - start + 1) : undefined
        };
      }

      const object = await binding.get(pathname, range ? { range } : undefined);
      if (object) {
        const headers = new Headers();
        headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        headers.set('Access-Control-Allow-Headers', '*');
        headers.set('Accept-Ranges', 'bytes');
        
        if (object.httpMetadata?.etag) {
          headers.set('ETag', object.httpMetadata.etag);
        }
        
        let statusCode = 200;
        if (rangeHeader && object.size) {
          statusCode = 206;
          const start = range.offset;
          const end = range.length ? (start + range.length - 1) : (object.size - 1);
          headers.set('Content-Range', `bytes ${start}-${end}/${object.size}`);
          headers.set('Content-Length', (end - start + 1).toString());
        } else if (object.size) {
          headers.set('Content-Length', object.size.toString());
        }

        return new NextResponse(object.body, {
          status: statusCode,
          headers
        });
      }
    } catch (err) {
      console.error('Error reading from R2 binding:', err);
    }
  }

  if (!isR2 || !s3Client) {
    // If Cloudflare R2 is not configured (e.g. in local development), fallback to fetching the source URL directly
    const targetUrl = r2PublicDomain
      ? `${r2PublicDomain.endsWith('/') ? r2PublicDomain : `${r2PublicDomain}/`}${pathname}`
      : url;

    try {
      const fetchHeaders = new Headers();
      const range = request.headers.get('Range');
      if (range) {
        fetchHeaders.set('Range', range);
      }
      
      const response = await fetch(targetUrl, {
        headers: fetchHeaders,
        method: request.method,
      });
      
      const headers = new Headers();
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      headers.set('Access-Control-Allow-Headers', '*');
      headers.set('Accept-Ranges', 'bytes');
      
      const headersToForward = [
        'content-type',
        'content-length',
        'content-range',
        'etag',
        'last-modified',
        'cache-control'
      ];
      headersToForward.forEach(h => {
        const val = response.headers.get(h);
        if (val !== null) {
          headers.set(h, val);
        }
      });
      
      return new NextResponse(response.body, {
        status: response.status,
        headers,
      });
    } catch (err) {
      console.error('Error fetching from asset storage fallback:', err);
      return new NextResponse('Failed to fetch from asset storage fallback', { status: 500 });
    }
  }

  if (!bucketName) {
    return new NextResponse('R2 Bucket name not configured', { status: 500 });
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

    let bodyStream: any = s3Response.Body;
    if (!bodyStream) {
      return new NextResponse(null, { status: statusCode, headers });
    }

    if (typeof bodyStream.transformToWebStream === 'function') {
      bodyStream = bodyStream.transformToWebStream();
    }

    let finalStream: any;
    if (bodyStream instanceof ReadableStream) {
      finalStream = bodyStream;
    } else {
      finalStream = new ReadableStream({
        start(controller) {
          if (typeof bodyStream.on === 'function') {
            bodyStream.on('data', (chunk: any) => controller.enqueue(chunk));
            bodyStream.on('end', () => controller.close());
            bodyStream.on('error', (err: any) => controller.error(err));
          } else if (typeof bodyStream[Symbol.asyncIterator] === 'function') {
            (async () => {
              try {
                for await (const chunk of bodyStream) {
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
          if (typeof bodyStream.destroy === 'function') {
            bodyStream.destroy();
          }
        }
      });
    }

    return new NextResponse(finalStream, {
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
