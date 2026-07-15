export const runtime = 'edge';
import { type NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;

const s3Client = accountId && accessKeyId && secretAccessKey
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
  : null;

export async function GET(request: NextRequest) {
  // ⚠️ Authenticate the request before serving the blob

  const pathname = request.nextUrl.searchParams.get('pathname');
  if (!pathname) {
    return NextResponse.json({ error: 'Missing pathname' }, { status: 400 });
  }

  if (!s3Client || !bucketName) {
    return NextResponse.json({ error: 'R2 storage is not configured' }, { status: 500 });
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: pathname,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 5 * 60 });
    return NextResponse.redirect(presignedUrl, { status: 307 });
  } catch (error: any) {
    console.error('Error retrieving private R2 avatar:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
