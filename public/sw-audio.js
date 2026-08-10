/**
 * sw-audio.js - HENRY IX DJ Audio & Storage Service Worker
 * Offline Caching for R2 Audio Streams, Waveforms, & Static Assets
 */

const CACHE_NAME = 'henryix-audio-v1';

const AUDIO_URL_PATTERNS = [
  'pub-c7c5ff43a8ae174ad91e2668de0ad7f0.r2.dev',
  'pub-930b5248e181432aa6e2f5a31832fd8d.r2.dev',
];

const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac'];

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  const isAudioRequest =
    AUDIO_URL_PATTERNS.some((pattern) => url.includes(pattern)) ||
    AUDIO_EXTENSIONS.some((ext) => url.toLowerCase().endsWith(ext));

  if (!isAudioRequest) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse && networkResponse.status === 200) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (err) {
        if (cachedResponse) return cachedResponse;
        throw err;
      }
    })
  );
});
