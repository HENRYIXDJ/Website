import { getCloudflareContext } from '@opennextjs/cloudflare';

export interface ContactSubmission {
  name: string;
  email: string;
  message: string;
}

export interface TicketOrder {
  eventName: string;
  customerName: string;
  customerEmail: string;
  quantity: number;
  totalPrice: number;
}

// Safely get Cloudflare env bindings in Workers runtime or fallback gracefully
export function getCFEnv(): Record<string, any> {
  try {
    const { env } = getCloudflareContext();
    return env || {};
  } catch {
    return process.env;
  }
}

// 1. KV Caching Helper (Sanity / Calendar data)
export async function fetchWithKVCache<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttlSeconds = 300
): Promise<T> {
  const env = getCFEnv();
  const cacheKV: KVNamespace | undefined = env.CACHE;

  if (cacheKV) {
    try {
      const cached = await cacheKV.get(cacheKey, 'json');
      if (cached) {
        return cached as T;
      }
    } catch (err) {
      console.warn(`[KV Cache Read Miss/Error] ${cacheKey}:`, err);
    }
  }

  const data = await fetchFn();

  if (cacheKV && data !== undefined && data !== null) {
    try {
      await cacheKV.put(cacheKey, JSON.stringify(data), { expirationTtl: ttlSeconds });
    } catch (err) {
      console.warn(`[KV Cache Write Error] ${cacheKey}:`, err);
    }
  }

  return data;
}

// 2. D1 Database Helper (Contact Submissions)
export async function saveContactSubmissionToD1(submission: ContactSubmission): Promise<{ success: boolean; id?: number }> {
  const env = getCFEnv();
  const db: D1Database | undefined = env.DB;

  if (!db) {
    console.warn('[D1 Warning] DB binding not available. Falling back.');
    return { success: false };
  }

  try {
    const result = await db
      .prepare(
        'INSERT INTO contact_submissions (name, email, message, created_at, status) VALUES (?, ?, ?, datetime("now"), "new")'
      )
      .bind(submission.name, submission.email, submission.message)
      .run();

    return { success: result.success, id: result.meta?.last_row_id };
  } catch (err) {
    console.error('[D1 Insert Error] Failed to save contact submission:', err);
    throw err;
  }
}

// 3. Cloudflare Queue Helper (Email Dispatch)
export async function queueEmailPayload(payload: {
  to: string;
  subject: string;
  name: string;
  message: string;
}): Promise<boolean> {
  const env = getCFEnv();
  const queue: Queue | undefined = env.EMAIL_QUEUE;

  if (!queue) {
    console.warn('[Queue Warning] EMAIL_QUEUE binding not available.');
    return false;
  }

  try {
    await queue.send(payload);
    return true;
  } catch (err) {
    console.error('[Queue Error] Failed to send email to queue:', err);
    return false;
  }
}

// 4. Cloudflare Turnstile Verification
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const env = getCFEnv();
  const secretKey = env.TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.warn('[Turnstile Warning] TURNSTILE_SECRET_KEY not set.');
    return true; // Bypass in dev if secret key is omitted
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    const data = await res.json() as { success: boolean };
    return data.success;
  } catch (err) {
    console.error('[Turnstile Error] Validation failed:', err);
    return false;
  }
}
