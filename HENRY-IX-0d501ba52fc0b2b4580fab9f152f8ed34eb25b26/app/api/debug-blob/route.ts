import { NextResponse } from 'next/server';
import { issueSignedToken, presignUrl } from '@vercel/blob';

export async function GET() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const envKeys = Object.keys(process.env);
  
  const debugInfo = {
    hasToken: !!token,
    tokenPrefix: token ? token.substring(0, 15) : null,
    tokenPartsCount: token ? token.split('_').length : 0,
    extractedStoreId: token ? token.split('_')[3] : null,
    availableEnvKeys: envKeys.filter(k => k.includes('BLOB') || k.includes('STORE') || k.includes('VERCEL')),
  };

  if (!token) {
    return NextResponse.json({
      error: "BLOB_READ_WRITE_TOKEN is missing in Vercel environment variables.",
      debugInfo
    }, { status: 500 });
  }

  try {
    // Attempt to test sign a known private asset URL
    const testPath = 'Mixes/Knight Club/KC Artwork/Session 1.jpg';
    const signedToken = await issueSignedToken({
      pathname: testPath,
      operations: ['get'],
      token,
    });

    const { presignedUrl } = await presignUrl(signedToken, {
      pathname: testPath,
      operation: 'get',
      access: 'private',
      validUntil: Date.now() + 5 * 60 * 1000,
    });

    // Test fetching it to check permission status
    const testFetch = await fetch(presignedUrl);
    
    return NextResponse.json({
      status: "success",
      message: "API can successfully generate signed URLs and connect to Blob Storage.",
      debugInfo,
      testPath,
      presignedUrlHost: new URL(presignedUrl).host,
      testFetchStatus: testFetch.status,
      testFetchStatusText: testFetch.statusText,
    });
  } catch (err: any) {
    return NextResponse.json({
      status: "error",
      message: "Failed to generate or fetch signed URL.",
      error: err.message || err,
      debugInfo
    }, { status: 500 });
  }
}
