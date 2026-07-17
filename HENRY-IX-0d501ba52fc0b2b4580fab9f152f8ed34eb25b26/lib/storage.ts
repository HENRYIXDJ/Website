export function getStorageUrl(path: string): string {
  // If the path is already a full URL, return it as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Ensure path starts with a slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Use the configured base URL, fallback to Cloudflare R2 default
  const baseUrl = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || 'https://pub-c7c5ff43a8ae174ad91e2668de0ad7f0.r2.dev';
  
  return `${baseUrl}${normalizedPath}`;
}
