/* eslint-disable no-restricted-globals */
// Service Worker for Brainwave PWA
// Version 2.0.1 - Enhanced PWA Support

// IMPORTANT: Change this version number to force cache clear on all clients
const SW_VERSION = '2.0.1';
const CACHE_NAME = `brainwave-v${SW_VERSION}`;
const RUNTIME_CACHE = `brainwave-runtime-v${SW_VERSION}`;
const VIDEO_CACHE = `brainwave-videos-v${SW_VERSION}`;
const API_CACHE = `brainwave-api-v${SW_VERSION}`;
const QUIZ_CACHE = `brainwave-quiz-v${SW_VERSION}`;
const AUTH_CACHE = `brainwave-auth-v${SW_VERSION}`;

// Detect if running as installed PWA
const isPWA = self.clients && self.clients.matchAll ? true : false;
console.log('[Service Worker] Running as:', isPWA ? 'Installed PWA' : 'Browser');

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/static/js/bundle.js',
  '/manifest.json',
  '/favicon.png',
  '/logo.png',
  '/sounds/excellent.mp3',
  '/sounds/fail.mp3',
  '/sounds/pass.mp3',
  '/sounds/perfect.mp3'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing version:', SW_VERSION);
  console.log('[Service Worker] Install triggered from:', isPWA ? 'PWA' : 'Browser');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })))
          .catch(err => {
            console.warn('[Service Worker] Failed to cache some assets:', err);
            // Continue even if some assets fail to cache
            return Promise.resolve();
          });
      })
      .then(() => {
        console.log('[Service Worker] Skip waiting and take control');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating version:', SW_VERSION);
  console.log('[Service Worker] Activation triggered from:', isPWA ? 'PWA' : 'Browser');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME &&
              cacheName !== RUNTIME_CACHE &&
              cacheName !== VIDEO_CACHE &&
              cacheName !== API_CACHE &&
              cacheName !== QUIZ_CACHE &&
              cacheName !== AUTH_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Claiming clients for immediate control');
      return self.clients.claim();
    }).then(() => {
      console.log('[Service Worker] Successfully activated and controlling all clients');
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip chrome extensions and non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Profile pictures - cache first (always available offline)
  if (request.url.includes('/uploads/') ||
      request.url.includes('/profile-pictures/') ||
      request.url.includes('/avatars/')) {
    event.respondWith(cacheFirstStrategy(request, RUNTIME_CACHE));
    return;
  }

  // Sound files - cache first (always available offline)
  if (request.url.includes('/sounds/') ||
      request.url.includes('.mp3') ||
      request.url.includes('.wav') ||
      request.url.includes('.ogg')) {
    event.respondWith(cacheFirstStrategy(request, RUNTIME_CACHE));
    return;
  }

  // Video download requests - cache first
  if (request.url.includes('/videos/') || request.url.includes('.mp4') || request.url.includes('.webm')) {
    event.respondWith(cacheFirstStrategy(request, VIDEO_CACHE));
    return;
  }

  // Auth API requests - special handling for offline login
  if (url.pathname.includes('/api/users/login') ||
      url.pathname.includes('/api/auth/') ||
      url.pathname.includes('/api/users/get-user-info')) {
    event.respondWith(authStrategy(request, AUTH_CACHE));
    return;
  }

  // Quiz/Exam API requests - cache for offline access
  if (url.pathname.includes('/api/exams/') ||
      url.pathname.includes('/api/questions/')) {
    event.respondWith(quizStrategy(request, QUIZ_CACHE));
    return;
  }

  // Other API requests - network first with cache fallback
  if (url.pathname.startsWith('/api/') || url.port === '5000') {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Static assets - cache first
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'image' ||
      request.destination === 'font' ||
      request.url.includes('/static/')) {
    event.respondWith(cacheFirstStrategy(request, RUNTIME_CACHE));
    return;
  }

  // HTML pages - network first
  if (request.destination === 'document') {
    event.respondWith(networkFirstStrategy(request, RUNTIME_CACHE));
    return;
  }

  // Default - network first
  event.respondWith(networkFirstStrategy(request, RUNTIME_CACHE));
});

// Cache first strategy - for static assets and videos
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    console.log('[Service Worker] Serving from cache:', request.url);
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[Service Worker] Fetch failed:', error);
    // Return offline page or cached version
    return new Response('Offline - Content not available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({ 'Content-Type': 'text/plain' })
    });
  }
}

// Network first strategy - for API calls and dynamic content
async function networkFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[Service Worker] Network failed, serving from cache:', request.url);
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    return new Response('Offline - Content not available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({ 'Content-Type': 'text/plain' })
    });
  }
}

// Auth strategy - cache successful auth responses for offline access
async function authStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    // Only cache successful auth responses
    if (response.status === 200 && request.method === 'POST') {
      const clonedResponse = response.clone();
      const data = await clonedResponse.json();
      if (data.success) {
        cache.put(request, response.clone());
        console.log('[Service Worker] Cached auth response');
      }
    }
    return response;
  } catch (error) {
    console.log('[Service Worker] Auth network failed, checking cache');
    const cached = await cache.match(request);
    if (cached) {
      console.log('[Service Worker] Serving cached auth data (offline mode)');
      return cached;
    }
    // Return offline error
    return new Response(JSON.stringify({
      success: false,
      message: 'You are offline. Please check your internet connection.',
      offline: true
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({ 'Content-Type': 'application/json' })
    });
  }
}

// Quiz strategy - cache quiz data for offline access
async function quizStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.status === 200) {
      cache.put(request, response.clone());
      console.log('[Service Worker] Cached quiz data');
    }
    return response;
  } catch (error) {
    console.log('[Service Worker] Quiz network failed, serving from cache');
    const cached = await cache.match(request);
    if (cached) {
      console.log('[Service Worker] Serving cached quiz data (offline mode)');
      return cached;
    }
    return new Response(JSON.stringify({
      success: false,
      message: 'Quiz not available offline. Please download it first.',
      offline: true
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({ 'Content-Type': 'application/json' })
    });
  }
}

// Message handler for video downloads and PWA communication
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Received message:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Skip waiting requested');
    self.skipWaiting();
    return;
  }

  if (event.data && event.data.type === 'CACHE_VIDEO') {
    const { url, title } = event.data;
    cacheVideo(url, title);
  }

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Cache video for offline playback
async function cacheVideo(url, title) {
  try {
    const cache = await caches.open(VIDEO_CACHE);
    const response = await fetch(url);
    if (response.status === 200) {
      await cache.put(url, response);
      console.log('[Service Worker] Video cached:', title);

      // Notify all clients that video is cached
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'VIDEO_CACHED',
          url: url,
          title: title
        });
      });
    }
  } catch (error) {
    console.error('[Service Worker] Failed to cache video:', error);

    // Notify clients of failure
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'VIDEO_CACHE_FAILED',
        url: url,
        title: title,
        error: error.message
      });
    });
  }
}

