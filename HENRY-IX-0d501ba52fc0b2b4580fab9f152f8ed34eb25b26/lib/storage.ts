export function getStorageUrl(path: string): string {
  // If the path is already a full URL, return it as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Ensure path starts with a slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Use the configured base URL, fallback to Vercel Blob default
  const baseUrl = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || 'https://tegbbmt42xpyzcnx.private.blob.vercel-storage.com';
  
  return `${baseUrl}${normalizedPath}`;
}
