import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '../env'

export const client = createClient({
  apiVersion,
  dataset,
  projectId,
  useCdn: true,
  timeout: 1200,
  maxRetries: 0,
});

export async function safeSanityFetch<T>(query: string, params: Record<string, any> = {}, fallback: T = [] as any): Promise<T> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = setTimeout(() => controller?.abort(), 800);

  try {
    const result = await client.fetch<T>(query, params, {
      signal: controller?.signal,
      maxRetries: 0,
    } as any);
    clearTimeout(timeoutId);
    return result || fallback;
  } catch {
    clearTimeout(timeoutId);
    return fallback;
  }
}
