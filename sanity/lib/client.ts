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
  const timeoutPromise = new Promise<T>((resolve) => {
    setTimeout(() => resolve(fallback), 1200);
  });
  try {
    const fetchPromise = client.fetch<T>(query, params);
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch {
    return fallback;
  }
}
