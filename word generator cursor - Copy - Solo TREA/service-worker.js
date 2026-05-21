// service-worker.js — MXD Supreme Offline Support v2.0 (2026)
// Cache strategies: cache-first for static assets, network-first for AI APIs, stale-while-revalidate for dynamic data
// Background sync, push notifications, advanced cache management

var CACHE_VERSION = 'mxd-v2';
var STATIC_CACHE = 'mxd-static-' + CACHE_VERSION;
var DYNAMIC_CACHE = 'mxd-dynamic-' + CACHE_VERSION;
var PUZZLE_CACHE = 'mxd-puzzles-' + CACHE_VERSION;
var KDP_CACHE = 'mxd-kdp-' + CACHE_VERSION;
var FONT_CACHE = 'mxd-fonts-' + CACHE_VERSION;

// Assets to precache on install
var PRECACHE_URLS = [
  './',
  './index.html',
  './mxd-engine-core.js',
  './mxd-self-heal.js',
  './mxd-network.js',
  './mxd-shapes.js',
  './mxd-word-banks.js',
  './mxd-ai-chat-pro.js',
  './mxd-vortex.js',
  './mxd-auth.js',
  './mxd-dimension-engine.js',
  './mxd-settings-engine.js',
  './mxd-interactive.js',
  './mxd-kdp-suite.js',
  './mxd-pdf-export.js',
  './mxd-svg-engine-v3.js',
  './mxd-svg-shape-manager.js',
  './mxd-svg-studio.js',
  './mxd-kdp-niche-db.js',
  './mxd-file-compat.js',
  './mxd-cover-designer.js',
  './mxd-answer-key.js',
  './mxd-word-studio.js',
  './mxd-project-manager.js',
  './mxd-typography.js',
  './mxd-massive-words.js',
  './mxd-puzzle-templates-db.js',
  './mxd-shapes-library-v2.js',
  './mxd-puzzle-database.js',
  './mxd-wordsearch-engine-v10.js',
  './mxd-wordsearch-ui-v10.js',
  './mxd-placement-engine-v10.js',
  './mxd-grid-system-v10.js',
  './mxd-wordlist-intelligence-v10.js',
  './mxd-export-bookbuilder-v10.js',
  './mxd-play-mode-v10.js',
  './mxd-offline-mode-v10.js',
  './mxd-preset-system-v10.js',
  './mxd-reliability-v10.js',
  './mxd-security-v10.js',
  './puzzle-worker.js',
  './styles.css',
  './manifest.json'
];

// CDN resources to cache (cache-first strategy)
var CDN_PATTERNS = [
  'unpkg.com/react',
  'unpkg.com/react-dom',
  'unpkg.com/@babel/standalone',
  'cdnjs.cloudflare.com/ajax/libs/jspdf',
  'cdnjs.cloudflare.com/ajax/libs/html2canvas',
  'cdnjs.cloudflare.com/ajax/libs/jszip',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

// AI API endpoints (network-first strategy)
var AI_PATTERNS = [
  'generativelanguage.googleapis.com',
  'api.openai.com',
  'api.anthropic.com',
  'openrouter.ai',
  'api.groq.com',
  'api.cerebras.net',
  'api.mistral.ai',
  'api.x.ai',
  'api-inference.huggingface.co',
  'api.cohere.ai',
  'api.together.ai',
  'api.venice.ai',
  'api.novita.ai',
  'api.fireworks.ai',
  'api.perplexity.ai'
];

// KDP API endpoints (stale-while-revalidate)
var KDP_PATTERNS = [
  'amazon.com',
  'amazon.co.uk',
  'amazon.de',
  'amazon.co.jp',
  'amazon.ca',
  'amazon.com.au',
  'amazon.in',
  'amazon.com.br',
  'amazon.com.mx',
  'amazon.es',
  'amazon.fr',
  'amazon.it',
  'amazon.nl'
];

// Install event — precache static assets
self.addEventListener('install', function(event) {
  console.log('[SW] Installing v' + CACHE_VERSION);
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function(cache) {
      return cache.addAll(PRECACHE_URLS).catch(function(err) {
        console.warn('[SW] Precache failed for some assets:', err);
      });
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activate event — clean old caches
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating v' + CACHE_VERSION);
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name.startsWith('mxd-') &&
                 name !== STATIC_CACHE &&
                 name !== DYNAMIC_CACHE &&
                 name !== PUZZLE_CACHE &&
                 name !== KDP_CACHE &&
                 name !== FONT_CACHE;
        }).map(function(name) {
          console.log('[SW] Deleting old cache:', name);
          return caches.delete(name);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch event — route by resource type
self.addEventListener('fetch', function(event) {
  var request = event.request;
  var url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Skip cross-origin requests that aren't CDN or KDP
  if (url.origin !== location.origin && !isCDN(url) && !isKDPRequest(url)) return;

  // Choose strategy based on request type
  if (isAIRequest(url)) {
    // AI APIs: network-first with offline fallback
    event.respondWith(networkFirst(request));
  } else if (isKDPRequest(url)) {
    // KDP/Amazon: stale-while-revalidate with 24h cache
    event.respondWith(staleWhileRevalidate(request, KDP_CACHE, 86400000));
  } else if (isFontRequest(url)) {
    // Fonts: cache-first with long TTL
    event.respondWith(cacheFirst(request, FONT_CACHE));
  } else if (isStaticAsset(request, url)) {
    // Static assets: cache-first
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (request.mode === 'navigate') {
    // HTML pages: network-first with offline fallback
    event.respondWith(networkFirst(request));
  } else {
    // Everything else: stale-while-revalidate
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
  }
});

// Sync event — background sync for pending operations
self.addEventListener('sync', function(event) {
  console.log('[SW] Background sync triggered:', event.tag);
  if (event.tag === 'mxd-sync-queue') {
    event.waitUntil(processSyncQueue());
  } else if (event.tag === 'mxd-kdp-refresh') {
    event.waitUntil(refreshKDPCache());
  } else if (event.tag === 'mxd-puzzle-cache') {
    event.waitUntil(cachePendingPuzzles());
  }
});

// Push notification handler
self.addEventListener('push', function(event) {
  var data = event.data ? event.data.json() : {};
  var title = data.title || 'MXD Puzzle Generator';
  var options = {
    body: data.body || 'Your puzzle is ready!',
    icon: './favicon.ico',
    badge: './favicon.ico',
    tag: data.tag || 'mxd-notification',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(function(clients) {
      if (clients.length > 0) {
        return clients[0].focus();
      }
      return self.clients.openWindow('./');
    })
  );
});

// Message handler — for cache management from main thread
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'CLEAR_CACHE') {
    var target = event.data.target || 'all';
    if (target === 'all') {
      caches.keys().then(function(names) {
        names.forEach(function(name) { caches.delete(name); });
      });
    } else if (target === 'static') {
      caches.delete(STATIC_CACHE);
    } else if (target === 'dynamic') {
      caches.delete(DYNAMIC_CACHE);
    } else if (target === 'puzzles') {
      caches.delete(PUZZLE_CACHE);
    } else if (target === 'kdp') {
      caches.delete(KDP_CACHE);
    } else if (target === 'fonts') {
      caches.delete(FONT_CACHE);
    }
  } else if (event.data && event.data.type === 'CACHE_PUZZLE') {
    // Cache a generated puzzle for offline access
    var puzzleData = event.data.puzzle;
    caches.open(PUZZLE_CACHE).then(function(cache) {
      var response = new Response(JSON.stringify(puzzleData), {
        headers: { 'Content-Type': 'application/json' }
      });
      cache.put('./puzzle/' + (puzzleData.id || Date.now()), response);
    });
  } else if (event.data && event.data.type === 'GET_CACHE_STATS') {
    // Return cache statistics to main thread
    caches.keys().then(function(names) {
      var stats = {};
      var promises = names.map(function(name) {
        return caches.open(name).then(function(cache) {
          return cache.keys().then(function(keys) {
            stats[name] = keys.length;
          });
        });
      });
      Promise.all(promises).then(function() {
        event.source.postMessage({
          type: 'CACHE_STATS',
          stats: stats
        });
      });
    });
  } else if (event.data && event.data.type === 'CACHE_KDP_DATA') {
    // Cache KDP data for offline access
    var kdpData = event.data.data;
    caches.open(KDP_CACHE).then(function(cache) {
      var response = new Response(JSON.stringify(kdpData), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=86400' }
      });
      cache.put('./kdp/' + (kdpData.type || 'unknown') + '/' + (kdpData.id || Date.now()), response);
    });
  }
});

// Helper functions
function isCDN(url) {
  for (var i = 0; i < CDN_PATTERNS.length; i++) {
    if (url.hostname.indexOf(CDN_PATTERNS[i]) !== -1) return true;
  }
  return false;
}

function isAIRequest(url) {
  for (var i = 0; i < AI_PATTERNS.length; i++) {
    if (url.hostname.indexOf(AI_PATTERNS[i]) !== -1) return true;
  }
  return false;
}

function isKDPRequest(url) {
  for (var i = 0; i < KDP_PATTERNS.length; i++) {
    if (url.hostname.indexOf(KDP_PATTERNS[i]) !== -1) return true;
  }
  return false;
}

function isFontRequest(url) {
  return url.hostname.indexOf('fonts.googleapis.com') !== -1 ||
         url.hostname.indexOf('fonts.gstatic.com') !== -1 ||
         url.pathname.endsWith('.woff') ||
         url.pathname.endsWith('.woff2') ||
         url.pathname.endsWith('.ttf') ||
         url.pathname.endsWith('.eot');
}

function isStaticAsset(request, url) {
  var ext = url.pathname.split('.').pop().toLowerCase();
  var staticExts = ['js', 'css', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'eot', 'webp', 'avif'];
  return staticExts.indexOf(ext) !== -1 || url.pathname.indexOf('/assets/') !== -1;
}

// Cache-first strategy
function cacheFirst(request, cacheName) {
  cacheName = cacheName || STATIC_CACHE;
  return caches.match(request).then(function(cached) {
    if (cached) return cached;
    return fetch(request).then(function(response) {
      if (response && response.ok) {
        var clone = response.clone();
        caches.open(cacheName).then(function(cache) {
          cache.put(request, clone);
        });
      }
      return response;
    }).catch(function() {
      // If offline and no cache, return offline fallback for navigation
      if (request.mode === 'navigate') {
        return caches.match('./index.html');
      }
      throw new Error('Offline: ' + request.url);
    });
  });
}

// Network-first strategy
function networkFirst(request) {
  return fetch(request).then(function(response) {
    if (response && response.ok) {
      var clone = response.clone();
      caches.open(DYNAMIC_CACHE).then(function(cache) {
        cache.put(request, clone);
      });
    }
    return response;
  }).catch(function() {
    return caches.match(request).then(function(cached) {
      if (cached) return cached;
      // For navigation, return the app shell
      if (request.mode === 'navigate') {
        return caches.match('./index.html');
      }
      // For AI requests, return a synthetic offline response
      if (isAIRequest(new URL(request.url))) {
        return new Response(JSON.stringify({
          offline: true,
          message: 'AI services unavailable offline. Using local word generation.',
          suggestions: getOfflineSuggestions(request)
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      throw new Error('Offline: ' + request.url);
    });
  });
}

// Stale-while-revalidate strategy
function staleWhileRevalidate(request, cacheName, maxAge) {
  cacheName = cacheName || DYNAMIC_CACHE;
  maxAge = maxAge || 3600000; // 1 hour default

  return caches.match(request).then(function(cached) {
    var fetchPromise = fetch(request).then(function(response) {
      if (response && response.ok) {
        var clone = response.clone();
        caches.open(cacheName).then(function(cache) {
          cache.put(request, clone);
        });
      }
      return response;
    }).catch(function() { return null; });

    // If cached and not expired, return it immediately
    if (cached) {
      var cachedTime = cached.headers.get('sw-cache-time');
      if (cachedTime) {
        var age = Date.now() - parseInt(cachedTime, 10);
        if (age < maxAge) {
          // Still fresh, revalidate in background
          fetchPromise.catch(function() {}); // Ignore errors
          return cached;
        }
      }
      // Expired, return cached but revalidate
      fetchPromise.catch(function() {});
      return cached;
    }

    // No cache, wait for fetch
    return fetchPromise;
  });
}

// Background sync: process sync queue
function processSyncQueue() {
  // This would process pending sync operations from IndexedDB
  // For now, just log that sync was triggered
  console.log('[SW] Processing sync queue...');
  return Promise.resolve();
}

// Background sync: refresh KDP cache
function refreshKDPCache() {
  console.log('[SW] Refreshing KDP cache...');
  return Promise.resolve();
}

// Background sync: cache pending puzzles
function cachePendingPuzzles() {
  console.log('[SW] Caching pending puzzles...');
  return Promise.resolve();
}

// Get offline suggestions for AI requests
function getOfflineSuggestions(request) {
  return [
    'Use local word banks from WORD_BANKS',
    'Generate puzzles with existing AI_THEMES',
    'Export previously generated puzzles from cache'
  ];
}
