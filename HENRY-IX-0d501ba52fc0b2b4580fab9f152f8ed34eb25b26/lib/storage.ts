export function getStorageUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('/api/assets')) return path;

  let fullUrl: string;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    fullUrl = path;
  } else {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const baseUrl = process.env.NEXT_PUBLIC_STORAGE_BASE_URL || 'https://pub-c7c5ff43a8ae174ad91e2668de0ad7f0.r2.dev';
    fullUrl = `${baseUrl}${normalizedPath}`;
  }

  return fullUrl;
}

