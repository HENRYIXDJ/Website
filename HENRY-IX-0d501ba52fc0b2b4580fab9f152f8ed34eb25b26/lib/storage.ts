export function getStorageUrl(path: string): string {
  // If the path is already a full URL, return it as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Ensure path starts with a slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Use the configured base URL, fallback to Cloudflare R2 default
  const baseUrl = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || 'https://pub-930b5248e181432aa6e2f5a31832fd8d.r2.dev';
  
  return `${baseUrl}${normalizedPath}`;
}
