export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const isR2 = process.env.NEXT_PUBLIC_USE_CLOUDFLARE_R2 === 'true';

let s3Client: S3Client | null = null;
if (isR2) {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (accountId && accessKeyId && secretAccessKey) {
    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  } else {
    console.warn('R2 is enabled but credentials are not fully configured.');
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
    return new NextResponse('Storage (Cloudflare R2) is not configured correctly', { status: 500 });
  }
  
  const bucketName = process.env.R2_BUCKET_NAME;
  if (!bucketName) {
    return new NextResponse('R2 Bucket name not configured', { status: 500 });
  }
  
  // Optional: Validate that the requested domain matches the public R2 domain
  const r2PublicDomain = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (r2PublicDomain) {
    const publicUrl = new URL(r2PublicDomain);
    if (parsedUrl.host.toLowerCase() !== publicUrl.host.toLowerCase()) {
       return new NextResponse('Invalid source domain', { status: 400 });
    }
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: pathname,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 5 * 60 });
    return NextResponse.redirect(presignedUrl, { status: 307 });
  } catch (error) {
    console.error('Error signing R2 URL:', error);
    return new NextResponse('Error generating signed URL', { status: 500 });
  }
}

export async function GET(request: Request) {
  return handleAssetRequest(request);
}

export async function HEAD(request: Request) {
  return handleAssetRequest(request);
}
