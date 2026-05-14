// sw.js — MXD Word Search Generator PWA Service Worker
const CACHE_NAME = 'mxd-wordsearch-v6.0.0';
const DATA_CACHE_NAME = 'mxd-data-v1.0.0';
const FONT_CACHE_NAME = 'mxd-fonts-v1.0.0';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/engine.js',
  '/settings.js',
  '/data.js',
  '/pdf.js',
  '/ui-base.jsx',
  '/ui-grid.jsx',
  '/sidebar.jsx',
  '/mxd-kdp-panels.jsx',
  '/app.jsx',
  '/mxd-auth.js',
  '/mxd-subscription.js',
  '/mxd-rate-limiter.js',
  '/mxd-anti-cheat.js',
  '/mxd-referral.js',
  '/mxd-ai-engine.js',
  '/mxd-ai-panel.jsx',
  '/mxd-ai-integrator.js',
  '/mxd-bulk-ultimate.js',
  '/mxd-batch-processor.js',
  '/mxd-enterprise-processor.js',
  '/mxd-professional-export.js',
  '/mxd-offline-tools.jsx',
  '/mxd-offline-core.js',
  '/mxd-cost-aware-engine.js',
  '/manifest.json'
];

const OFFLINE_PAGE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>MXD Word Search - Offline</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: linear-gradient(135deg, #09090b 0%, #141418 100%);
      color: #ececf0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 20px;
    }
    .offline-container {
      max-width: 400px;
    }
    .logo {
      font-size: 64px;
      font-weight: 900;
      margin-bottom: 20px;
    }
    .logo-m { color: #c9a227; }
    .logo-x { color: #ececf0; }
    .logo-d { color: #ef4444; }
    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #c9a227;
      margin-bottom: 12px;
    }
    p {
      color: #9ca3af;
      line-height: 1.6;
      margin-bottom: 24px;
      font-size: 14px;
    }
    .retry-btn {
      background: linear-gradient(135deg, #c9a227, #d4af37);
      color: #09090b;
      border: none;
      padding: 14px 32px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 15px rgba(201, 162, 39, 0.3);
    }
    .retry-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(201, 162, 39, 0.4);
    }
    .features {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-top: 24px;
      flex-wrap: wrap;
    }
    .feature {
      background: rgba(201, 162, 39, 0.1);
      border: 1px solid rgba(201, 162, 39, 0.2);
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 12px;
      color: #c9a227;
    }
    .feature-icon { font-size: 20px; display: block; margin-bottom: 4px; }
  </style>
</head>
<body>
  <div class="offline-container">
    <div class="logo">
      <span class="logo-m">M</span><span class="logo-x">X</span><span class="logo-d">D</span>
    </div>
    <h1>You're Offline</h1>
    <p>Don't worry! Your MXD Word Search Generator is cached and ready. You can still generate puzzles and they'll sync when you're back online.</p>
    <button class="retry-btn" onclick="location.reload()">Try Again</button>
    <div class="features">
      <div class="feature"><span class="feature-icon">✓</span>Generate Puzzles</div>
      <div class="feature"><span class="feature-icon">✓</span>Save Settings</div>
      <div class="feature"><span class="feature-icon">✓</span>Offline Export</div>
    </div>
  </div>
</body>
</html>
`;

// IndexedDB Setup
const DB_NAME = 'mxd-offline-db';
const DB_VERSION = 1;
let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => { db = request.result; resolve(db); };
    request.onupgradeneeded = (e) => {
      const database = e.target.result;
      if (!database.objectStoreNames.contains('puzzles')) {
        database.createObjectStore('puzzles', { keyPath: 'id', autoIncrement: true });
      }
      if (!database.objectStoreNames.contains('settings')) {
        database.createObjectStore('settings', { keyPath: 'key' });
      }
      if (!database.objectStoreNames.contains('wordlists')) {
        database.createObjectStore('wordlists', { keyPath: 'id', autoIncrement: true });
      }
      if (!database.objectStoreNames.contains('syncQueue')) {
        database.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

async function saveToIndexedDB(store, data) {
  if (!db) await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const objectStore = tx.objectStore(store);
    const request = objectStore.put(data);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getFromIndexedDB(store, key) {
  if (!db) await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const objectStore = tx.objectStore(store);
    const request = objectStore.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllFromIndexedDB(store) {
  if (!db) await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly');
    const objectStore = tx.objectStore(store);
    const request = objectStore.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('[SW] Caching static assets');
        try {
          await cache.addAll(STATIC_ASSETS.map(url => {
            return new Request(url, { cache: 'reload' });
          }));
          console.log('[SW] All assets cached successfully');
        } catch (err) {
          console.warn('[SW] Failed to cache some assets:', err);
        }
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== DATA_CACHE_NAME && name !== FONT_CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(async () => {
        await openDB();
        self.clients.claim();
        console.log('[SW] MXD Word Search PWA activated');
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests except for API calls that support it
  if (request.method !== 'GET' && !url.pathname.includes('/api/')) {
    return;
  }

  // API requests - network only
  if (url.pathname.includes('/api/') || 
      url.pathname.includes('openai.com') ||
      url.pathname.includes('anthropic.com') ||
      url.pathname.includes('generativelanguage.googleapis.com') ||
      url.pathname.includes('groq.com') ||
      url.pathname.includes('cloudflare.com')) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return new Response(
            JSON.stringify({ error: 'Offline', message: 'API requests require internet connection' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
    return;
  }

  // Fonts - cache first
  if (url.pathname.includes('fonts.googleapis.com') || 
      url.pathname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) return response;
          return fetch(request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                const responseToCache = networkResponse.clone();
                caches.open(FONT_CACHE_NAME)
                  .then((cache) => cache.put(request, responseToCache));
              }
              return networkResponse;
            });
        })
    );
    return;
  }

  // Data requests - network first with cache fallback
  if (url.pathname.includes('/data/') || 
      url.pathname.includes('.json') ||
      url.pathname.includes('.csv')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(DATA_CACHE_NAME)
              .then((cache) => cache.put(request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets and pages - cache first with network fallback
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached, update in background
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                caches.open(CACHE_NAME)
                  .then((cache) => cache.put(request, networkResponse.clone()));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse.ok) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => cache.put(request, responseToCache));
            }
            return networkResponse;
          })
          .catch(() => {
            // Network failed, return offline page for HTML requests
            if (request.headers.get('Accept')?.includes('text/html')) {
              return new Response(OFFLINE_PAGE, {
                headers: { 'Content-Type': 'text/html' }
              });
            }
            return new Response('Offline', { status: 503 });
          });
      })
  );
});

// Background sync for offline queue
self.addEventListener('sync', (event) => {
  if (event.tag === 'mxd-offline-queue') {
    event.waitUntil(processOfflineQueue());
  }
  if (event.tag === 'mxd-sync-puzzles') {
    event.waitUntil(syncPuzzles());
  }
});

// Process offline queue
async function processOfflineQueue() {
  try {
    if (!db) await openDB();
    const queue = await getAllFromIndexedDB('syncQueue');
    
    for (const item of queue) {
      try {
        await fetch(item.url, {
          method: item.method || 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.data)
        });
        
        // Remove from queue after successful sync
        const tx = db.transaction('syncQueue', 'readwrite');
        tx.objectStore('syncQueue').delete(item.id);
      } catch (e) {
        console.log('[SW] Failed to sync item:', item.id);
      }
    }
    
    // Notify clients
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_COMPLETE', synced: queue.length });
    });
  } catch (err) {
    console.error('[SW] Failed to process offline queue:', err);
  }
}

// Sync puzzles to server
async function syncPuzzles() {
  try {
    if (!db) await openDB();
    const puzzles = await getAllFromIndexedDB('puzzles');
    
    if (navigator.onLine) {
      // Sync to server if online
      for (const puzzle of puzzles) {
        if (!puzzle.synced) {
          try {
            await fetch('/api/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(puzzle)
            });
            
            // Mark as synced
            puzzle.synced = true;
            await saveToIndexedDB('puzzles', puzzle);
          } catch (e) {
            console.log('[SW] Puzzle sync failed');
          }
        }
      }
    }
  } catch (err) {
    console.error('[SW] Failed to sync puzzles:', err);
  }
}

// Push notifications (future)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'New update from MXD Word Search',
    icon: '/icon-192.png',
    badge: '/icon-96.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'MXD Word Search', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'dismiss') return;
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url || '/');
        }
      })
  );
});

// Message handling from main app
self.addEventListener('message', (event) => {
  const { type } = event.data || {};
  
  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      event.ports?.[0]?.postMessage({ success: true });
    });
  }
  
  if (type === 'SAVE_OFFLINE') {
    const { store, data } = event.data;
    saveToIndexedDB(store, data).then(() => {
      event.ports?.[0]?.postMessage({ success: true });
    });
  }
  
  if (type === 'GET_OFFLINE') {
    const { store, key } = event.data;
    getFromIndexedDB(store, key).then((result) => {
      event.ports?.[0]?.postMessage({ data: result });
    });
  }
  
  if (type === 'CHECK_ONLINE') {
    event.ports?.[0]?.postMessage({ online: navigator.onLine });
  }
});

// Online/offline detection
self.addEventListener('online', () => {
  self.registration.sync.register('mxd-sync-puzzles');
});

self.addEventListener('offline', () => {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'OFFLINE_MODE', enabled: true });
    });
  });
});

console.log('[SW] MXD Word Search Generator PWA Service Worker loaded');