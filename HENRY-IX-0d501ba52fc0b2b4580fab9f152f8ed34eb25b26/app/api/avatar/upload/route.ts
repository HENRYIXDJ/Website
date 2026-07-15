export const runtime = 'edge';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';

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

    if (!s3Client || !bucketName) {
      return NextResponse.json({ error: 'R2 storage is not configured' }, { status: 500 });
    }

    // Convert request body stream to Uint8Array
    const arrayBuffer = await request.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Save avatar to R2 under an avatars prefix with timestamp
    const key = `avatars/${Date.now()}-${filename}`;
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: request.headers.get('content-type') || 'application/octet-stream',
    });

    await s3Client.send(command);

    // Return the pathname format expected by the frontend
    return NextResponse.json({
      pathname: key,
      url: `/api/avatar/view?pathname=${key}`
    });
  } catch (error: any) {
    console.error('R2 Avatar Upload endpoint error:', error);
    return NextResponse.json(
      { error: `Avatar upload failed: ${error.message || 'Unknown error'}.` },
      { status: 500 }
    );
  }
}
