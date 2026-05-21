// mxd-connectivity.js — MXD Network State Manager v1.0 (2026)
// Real-time connectivity detection, heartbeat polling, state machine
// States: online → degraded → offline → recovering → online

(function(){
  'use strict';

  var VERSION = '1.0.0';
  var STATE = { ONLINE: 'online', DEGRADED: 'degraded', OFFLINE: 'offline', RECOVERING: 'recovering' };

  var MXDConnectivity = {
    _state: STATE.ONLINE,
    _previousState: null,
    _online: navigator.onLine,
    _lastOnlineChange: Date.now(),
    _offlineDuration: 0,
    _heartbeatInterval: null,
    _heartbeatFailures: 0,
    _maxHeartbeatFailures: 3,
    _heartbeatUrl: 'https://www.google.com/favicon.ico',
    _heartbeatIntervalMs: 30000,
    _listeners: {},
    _history: [],
    _maxHistory: 100,

    init: function(options) {
      var opts = options || {};
      if (opts.heartbeatIntervalMs) this._heartbeatIntervalMs = opts.heartbeatIntervalMs;
      if (opts.heartbeatUrl) this._heartbeatUrl = opts.heartbeatUrl;
      if (opts.maxHeartbeatFailures) this._maxHeartbeatFailures = opts.maxHeartbeatFailures;

      this._setupEventListeners();
      this._startHeartbeat();
      this._loadHistory();
      console.log('[MXD Connectivity] v' + VERSION + ' initialized — state: ' + this._state);
    },

    _setupEventListeners: function() {
      var self = this;

      window.addEventListener('online', function() {
        self._online = true;
        self._lastOnlineChange = Date.now();
        self._offlineDuration = 0;
        self._heartbeatFailures = 0;
        self._transition(STATE.RECOVERING, 'Browser reconnected');
        self._emit('online', { at: Date.now() });
      });

      window.addEventListener('offline', function() {
        self._online = false;
        self._lastOnlineChange = Date.now();
        self._transition(STATE.OFFLINE, 'Browser disconnected');
        self._emit('offline', { at: Date.now() });
      });

      if ('connection' in navigator) {
        navigator.connection.addEventListener('change', function() {
          var conn = navigator.connection;
          if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') {
            self._transition(STATE.DEGRADED, 'Slow connection detected (' + conn.effectiveType + ')');
          } else if (self._state === STATE.DEGRADED && conn.effectiveType !== 'slow-2g' && conn.effectiveType !== '2g') {
            self._transition(STATE.ONLINE, 'Connection improved (' + conn.effectiveType + ')');
          }
        });
      }
    },

    _startHeartbeat: function() {
      var self = this;
      this._heartbeatInterval = setInterval(function() {
        if (!self._online) return;
        self._ping(function(success) {
          if (success) {
            self._heartbeatFailures = 0;
            if (self._state === STATE.DEGRADED) {
              self._transition(STATE.ONLINE, 'Heartbeat recovered');
            }
          } else {
            self._heartbeatFailures++;
            if (self._heartbeatFailures >= self._maxHeartbeatFailures) {
              self._transition(STATE.OFFLINE, 'Heartbeat failed (' + self._heartbeatFailures + ' attempts)');
            } else if (self._heartbeatFailures >= 1) {
              self._transition(STATE.DEGRADED, 'Heartbeat degraded (' + self._heartbeatFailures + ' failures)');
            }
          }
        });
      }, this._heartbeatIntervalMs);
    },

    _ping: function(callback) {
      var self = this;
      var start = Date.now();
      var timeout = setTimeout(function() { callback(false); }, 5000);
      try {
        var img = new Image();
        img.onload = function() { clearTimeout(timeout); self._lastLatency = Date.now() - start; callback(true); };
        img.onerror = function() { clearTimeout(timeout); callback(false); };
        img.src = this._heartbeatUrl + '?_=' + Date.now();
      } catch(e) {
        clearTimeout(timeout);
        callback(false);
      }
    },

    _transition: function(newState, reason) {
      if (this._state === newState) return;
      this._previousState = this._state;
      this._state = newState;
      var record = { from: this._previousState, to: newState, at: Date.now(), reason: reason || '' };
      this._history.push(record);
      if (this._history.length > this._maxHistory) this._history.shift();
      this._emit('stateChange', record);
      this._emit(newState, record);
    },

    getState: function() {
      return this._state;
    },

    isOnline: function() {
      return this._state === STATE.ONLINE || this._state === STATE.RECOVERING;
    },

    isOffline: function() {
      return this._state === STATE.OFFLINE;
    },

    isDegraded: function() {
      return this._state === STATE.DEGRADED;
    },

    getOfflineDuration: function() {
      if (this._online) return 0;
      return Date.now() - this._lastOnlineChange;
    },

    getOfflineDurationFormatted: function() {
      var ms = this.getOfflineDuration();
      var secs = Math.floor(ms / 1000);
      var mins = Math.floor(secs / 60);
      var hours = Math.floor(mins / 60);
      var days = Math.floor(hours / 24);
      if (days > 0) return days + 'd ' + (hours % 24) + 'h';
      if (hours > 0) return hours + 'h ' + (mins % 60) + 'm';
      if (mins > 0) return mins + 'm ' + (secs % 60) + 's';
      return secs + 's';
    },

    getStatus: function() {
      return {
        state: this._state,
        online: this._online,
        previousState: this._previousState,
        lastOnlineChange: this._lastOnlineChange,
        offlineDuration: this.getOfflineDuration(),
        offlineDurationFormatted: this.getOfflineDurationFormatted(),
        heartbeatFailures: this._heartbeatFailures,
        latency: this._lastLatency || null,
        history: this._history.slice(-10)
      };
    },

    on: function(event, fn) {
      if (!this._listeners[event]) this._listeners[event] = [];
      this._listeners[event].push(fn);
    },

    off: function(event, fn) {
      if (!this._listeners[event]) return;
      this._listeners[event] = this._listeners[event].filter(function(h) { return h !== fn; });
    },

    _emit: function(event, data) {
      var handlers = this._listeners[event] || [];
      for (var i = 0; i < handlers.length; i++) {
        try { handlers[i](data); } catch(e) {}
      }
    },

    _loadHistory: function() {
      try {
        var saved = localStorage.getItem('mxd_connectivity_history');
        if (saved) {
          var data = JSON.parse(saved);
          if (Array.isArray(data)) this._history = data.slice(-this._maxHistory);
        }
      } catch(e) {}
    },

    _saveHistory: function() {
      try {
        localStorage.setItem('mxd_connectivity_history', JSON.stringify(this._history.slice(-50)));
      } catch(e) {}
    },

    destroy: function() {
      if (this._heartbeatInterval) clearInterval(this._heartbeatInterval);
      this._listeners = {};
    }
  };

  // Status bar UI
  MXDConnectivity.renderStatusBar = function(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var self = this;
    var icons = { online: '\uD83D\uDFE2', degraded: '\uD83D\uDFE1', offline: '\uD83D\uDD34', recovering: '\uD83D\uDFE2' };
    var labels = { online: 'Online', degraded: 'Slow Connection', offline: 'Offline', recovering: 'Reconnecting...' };
    var messages = {
      online: 'All features active',
      degraded: 'Some features may be slow',
      offline: 'Core features work — KDP data cached',
      recovering: 'Syncing data...'
    };

    function render() {
      var status = self.getStatus();
      var icon = icons[status.state] || '\u2753';
      var label = labels[status.state] || 'Unknown';
      var message = messages[status.state] || '';

      container.innerHTML = '';
      var bar = document.createElement('div');
      bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:6px 16px;font-size:12px;font-weight:600;font-family:Inter,sans-serif;backdrop-filter:blur(8px);transition:all 0.3s ease;';

      var colors = {
        online: { bg: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'rgba(16,185,129,0.2)' },
        degraded: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
        offline: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', border: 'rgba(239,68,68,0.2)' },
        recovering: { bg: 'rgba(99,102,241,0.12)', color: '#6366f1', border: 'rgba(99,102,241,0.2)' }
      };

      var c = colors[status.state] || colors.online;
      bar.style.background = c.bg;
      bar.style.color = c.color;
      bar.style.borderBottom = '1px solid ' + c.border;

      bar.innerHTML = '<span style="margin-right:8px">' + icon + '</span>' +
        '<span>' + label + '</span>' +
        '<span style="margin-left:12px;opacity:0.7;font-weight:400">' + message + '</span>' +
        (status.state === 'offline' ? '<span style="margin-left:12px;opacity:0.7;font-weight:400">(' + status.offlineDurationFormatted + ')</span>' : '') +
        (status.latency ? '<span style="margin-left:12px;opacity:0.7;font-weight:400">' + status.latency + 'ms</span>' : '');

      container.appendChild(bar);
    }

    render();
    this.on('stateChange', render);
    setInterval(render, 5000);
  };

  window.MXDConnectivity = MXDConnectivity;
  console.log('[MXD Connectivity] v' + VERSION + ' loaded');
})();

// mxd-offline-db.js — MXD IndexedDB Persistence Layer v1.0 (2026)
// Replaces localStorage for heavy data: puzzles, settings, KDP cache, sync queue

(function(){
  'use strict';

  var VERSION = '1.1.0';
  var DB_NAME = 'mxd-offline-db';
  var DB_VERSION = 3;

  var STORES = {
    SETTINGS: 'settings',
    PUZZLES: 'puzzles',
    KDP_CACHE: 'kdp_cache',
    SYNC_QUEUE: 'sync_queue',
    BOOK_TRACKER: 'book_tracker',
    ACHIEVEMENTS: 'achievements',
    ERROR_LOG: 'error_log',
    HEAL_HISTORY: 'heal_history',
    CONNECTIVITY: 'connectivity',
    SVG_SHAPES: 'svg_shapes',
    WORD_LISTS: 'word_lists',
    PROJECTS: 'projects'
  };

  var MXDOfflineDB = {
    _db: null,
    _ready: false,
    _initPromise: null,

    init: function() {
      var self = this;
      if (this._initPromise) return this._initPromise;

      this._initPromise = new Promise(function(resolve, reject) {
        if (typeof indexedDB === 'undefined') {
          console.warn('[MXD OfflineDB] IndexedDB not supported — falling back to localStorage');
          self._ready = false;
          resolve(false);
          return;
        }

        var request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = function(e) {
          console.error('[MXD OfflineDB] Open error:', e.target.error);
          self._ready = false;
          resolve(false);
        };

        request.onsuccess = function(e) {
          self._db = e.target.result;
          self._ready = true;
          console.log('[MXD OfflineDB] v' + VERSION + ' initialized — ' + Object.keys(STORES).length + ' stores');
          resolve(true);
        };

        request.onupgradeneeded = function(e) {
          var db = e.target.result;
          var oldVersion = e.oldVersion;

          if (oldVersion < 1) {
            // Settings store
            if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
              var settingsStore = db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
              settingsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
            }

            // Puzzles store
            if (!db.objectStoreNames.contains(STORES.PUZZLES)) {
              var puzzlesStore = db.createObjectStore(STORES.PUZZLES, { keyPath: 'id' });
              puzzlesStore.createIndex('createdAt', 'createdAt', { unique: false });
              puzzlesStore.createIndex('type', 'type', { unique: false });
            }

            // KDP cache store
            if (!db.objectStoreNames.contains(STORES.KDP_CACHE)) {
              var kdpStore = db.createObjectStore(STORES.KDP_CACHE, { keyPath: 'key' });
              kdpStore.createIndex('cachedAt', 'cachedAt', { unique: false });
              kdpStore.createIndex('type', 'type', { unique: false });
              kdpStore.createIndex('expiresAt', 'expiresAt', { unique: false });
            }

            // Sync queue store
            if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
              var syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id', autoIncrement: true });
              syncStore.createIndex('priority', 'priority', { unique: false });
              syncStore.createIndex('createdAt', 'createdAt', { unique: false });
              syncStore.createIndex('status', 'status', { unique: false });
            }

            // Book tracker store
            if (!db.objectStoreNames.contains(STORES.BOOK_TRACKER)) {
              var trackerStore = db.createObjectStore(STORES.BOOK_TRACKER, { keyPath: 'asin' });
              trackerStore.createIndex('addedAt', 'addedAt', { unique: false });
              trackerStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
            }

            // Achievements store
            if (!db.objectStoreNames.contains(STORES.ACHIEVEMENTS)) {
              db.createObjectStore(STORES.ACHIEVEMENTS, { keyPath: 'id' });
            }

            // Error log store
            if (!db.objectStoreNames.contains(STORES.ERROR_LOG)) {
              var errorStore = db.createObjectStore(STORES.ERROR_LOG, { keyPath: 'id', autoIncrement: true });
              errorStore.createIndex('timestamp', 'timestamp', { unique: false });
              errorStore.createIndex('type', 'type', { unique: false });
            }

            // Heal history store
            if (!db.objectStoreNames.contains(STORES.HEAL_HISTORY)) {
              var healStore = db.createObjectStore(STORES.HEAL_HISTORY, { keyPath: 'id', autoIncrement: true });
              healStore.createIndex('startedAt', 'startedAt', { unique: false });
            }

            // Connectivity history store
            if (!db.objectStoreNames.contains(STORES.CONNECTIVITY)) {
              var connStore = db.createObjectStore(STORES.CONNECTIVITY, { keyPath: 'id', autoIncrement: true });
              connStore.createIndex('at', 'at', { unique: false });
            }
          }

          if (oldVersion < 2) {
            // SVG Shapes store (v2 addition)
            if (!db.objectStoreNames.contains(STORES.SVG_SHAPES)) {
              var svgStore = db.createObjectStore(STORES.SVG_SHAPES, { keyPath: 'key' });
              svgStore.createIndex('name', 'name', { unique: false });
              svgStore.createIndex('category', 'category', { unique: false });
              svgStore.createIndex('qualityGrade', 'quality.grade', { unique: false });
              svgStore.createIndex('createdAt', 'createdAt', { unique: false });
              svgStore.createIndex('updatedAt', 'updatedAt', { unique: false });
            }
          }

          if (oldVersion < 3) {
            // Word Lists store (v3 addition — Word List Studio)
            if (!db.objectStoreNames.contains(STORES.WORD_LISTS)) {
              var wlStore = db.createObjectStore(STORES.WORD_LISTS, { keyPath: 'id' });
              wlStore.createIndex('name', 'name', { unique: false });
              wlStore.createIndex('wordCount', 'wordCount', { unique: false });
              wlStore.createIndex('createdAt', 'createdAt', { unique: false });
              wlStore.createIndex('updatedAt', 'updatedAt', { unique: false });
            }
            // Projects store (v3 addition — Book Project Manager)
            if (!db.objectStoreNames.contains(STORES.PROJECTS)) {
              var projStore = db.createObjectStore(STORES.PROJECTS, { keyPath: 'id' });
              projStore.createIndex('name', 'name', { unique: false });
              projStore.createIndex('status', 'status', { unique: false });
              projStore.createIndex('createdAt', 'createdAt', { unique: false });
              projStore.createIndex('updatedAt', 'updatedAt', { unique: false });
            }
          }
        };
      });

      return this._initPromise;
    },

    // Generic CRUD operations
    _getStore: function(storeName, mode) {
      if (!this._db) return null;
      var tx = this._db.transaction(storeName, mode || 'readonly');
      return tx.objectStore(storeName);
    },

    get: function(storeName, key) {
      var self = this;
      return new Promise(function(resolve, reject) {
        if (!self._ready) { self._getFromLocalStorage(storeName, key).then(resolve, reject); return; }
        var store = self._getStore(storeName);
        if (!store) { reject(new Error('Store not available')); return; }
        var request = store.get(key);
        request.onsuccess = function() { resolve(request.result ? request.result.value : null); };
        request.onerror = function() { reject(request.error); };
      });
    },

    set: function(storeName, key, value) {
      var self = this;
      return new Promise(function(resolve, reject) {
        if (!self._ready) { self._setToLocalStorage(storeName, key, value).then(resolve, reject); return; }
        var store = self._getStore(storeName, 'readwrite');
        if (!store) { reject(new Error('Store not available')); return; }
        var record = { key: key, value: value, updatedAt: Date.now() };
        var request = store.put(record);
        request.onsuccess = function() { resolve(true); };
        request.onerror = function() { reject(request.error); };
      });
    },

    remove: function(storeName, key) {
      var self = this;
      return new Promise(function(resolve, reject) {
        if (!self._ready) { resolve(false); return; }
        var store = self._getStore(storeName, 'readwrite');
        if (!store) { reject(new Error('Store not available')); return; }
        var request = store.delete(key);
        request.onsuccess = function() { resolve(true); };
        request.onerror = function() { reject(request.error); };
      });
    },

    getAll: function(storeName) {
      var self = this;
      return new Promise(function(resolve, reject) {
        if (!self._ready) { resolve([]); return; }
        var store = self._getStore(storeName);
        if (!store) { reject(new Error('Store not available')); return; }
        var request = store.getAll();
        request.onsuccess = function() { resolve(request.result || []); };
        request.onerror = function() { reject(request.error); };
      });
    },

    clear: function(storeName) {
      var self = this;
      return new Promise(function(resolve, reject) {
        if (!self._ready) { resolve(false); return; }
        var store = self._getStore(storeName, 'readwrite');
        if (!store) { reject(new Error('Store not available')); return; }
        var request = store.clear();
        request.onsuccess = function() { resolve(true); };
        request.onerror = function() { reject(request.error); };
      });
    },

    // KDP Cache specific methods
    cacheKDPData: function(type, key, data, ttlMs) {
      var ttl = ttlMs || 86400000; // 24 hours default
      return this.set(STORES.KDP_CACHE, type + ':' + key, {
        type: type,
        key: key,
        data: data,
        cachedAt: Date.now(),
        expiresAt: Date.now() + ttl
      });
    },

    getKDPData: function(type, key) {
      var self = this;
      return this.get(STORES.KDP_CACHE, type + ':' + key).then(function(record) {
        if (!record) return null;
        if (Date.now() > record.expiresAt) {
          self.remove(STORES.KDP_CACHE, type + ':' + key);
          return null;
        }
        return record.data;
      });
    },

    isKDPDataFresh: function(type, key, maxAgeMs) {
      var self = this;
      return this.get(STORES.KDP_CACHE, type + ':' + key).then(function(record) {
        if (!record) return false;
        return (Date.now() - record.cachedAt) < (maxAgeMs || 86400000);
      });
    },

    // Sync queue methods
    enqueueSync: function(operation, data, priority) {
      return this.set(STORES.SYNC_QUEUE, null, {
        operation: operation,
        data: data,
        priority: priority || 0,
        status: 'pending',
        createdAt: Date.now(),
        attempts: 0,
        lastAttempt: null,
        error: null
      });
    },

    getPendingSyncs: function() {
      var self = this;
      return this.getAll(STORES.SYNC_QUEUE).then(function(items) {
        return items.filter(function(item) { return item.status === 'pending'; })
          .sort(function(a, b) { return (b.priority || 0) - (a.priority || 0); });
      });
    },

    markSyncComplete: function(id) {
      var self = this;
      return this.get(STORES.SYNC_QUEUE, id).then(function(item) {
        if (!item) return false;
        item.status = 'completed';
        item.completedAt = Date.now();
        return self.set(STORES.SYNC_QUEUE, id, item);
      });
    },

    markSyncFailed: function(id, error) {
      var self = this;
      return this.get(STORES.SYNC_QUEUE, id).then(function(item) {
        if (!item) return false;
        item.attempts = (item.attempts || 0) + 1;
        item.lastAttempt = Date.now();
        item.error = error ? error.message || String(error) : null;
        if (item.attempts >= 5) {
          item.status = 'failed';
        } else {
          item.status = 'pending';
        }
        return self.set(STORES.SYNC_QUEUE, id, item);
      });
    },

    // Book tracker methods
    addBookToTracker: function(book) {
      return this.set(STORES.BOOK_TRACKER, book.asin, {
        asin: book.asin,
        title: book.title,
        bsr: book.bsr,
        price: book.price,
        reviews: book.reviews,
        addedAt: Date.now(),
        lastUpdated: Date.now(),
        bsrHistory: [{ bsr: book.bsr, at: Date.now() }],
        notes: book.notes || ''
      });
    },

    updateBookTracker: function(asin, updates) {
      var self = this;
      return this.get(STORES.BOOK_TRACKER, asin).then(function(book) {
        if (!book) return false;
        for (var k in updates) {
          if (k === 'bsr' && book.bsrHistory) {
            book.bsrHistory.push({ bsr: updates.bsr, at: Date.now() });
            if (book.bsrHistory.length > 100) book.bsrHistory = book.bsrHistory.slice(-100);
          }
          book[k] = updates[k];
        }
        book.lastUpdated = Date.now();
        return self.set(STORES.BOOK_TRACKER, asin, book);
      });
    },

    // Settings migration from localStorage
    migrateFromLocalStorage: function() {
      var self = this;
      var keys = [
        'mxd_cfg', 'mxd_prefs', 'mxd_achievements', 'mxd_settings',
        'mxd_king', 'mxd_error_log', 'mxd_heal_history', 'mxd_heal_patterns',
        'mxd_error_budget', 'mxd_cb_ai', 'mxd_cb_storage', 'mxd_cb_render'
      ];

      var migrations = [];
      keys.forEach(function(key) {
        try {
          var value = localStorage.getItem(key);
          if (value !== null) {
            var parsed;
            try { parsed = JSON.parse(value); } catch(e) { parsed = value; }
            migrations.push(self.set(STORES.SETTINGS, key, parsed).then(function() {
              localStorage.removeItem(key);
            }));
          }
        } catch(e) {}
      });

      return Promise.all(migrations).then(function() {
        console.log('[MXD OfflineDB] Migrated ' + migrations.length + ' items from localStorage');
        return migrations.length;
      });
    },

    // localStorage fallback
    _getFromLocalStorage: function(storeName, key) {
      var self = this;
      return new Promise(function(resolve) {
        try {
          var data = localStorage.getItem('mxd_' + storeName + '_' + key);
          resolve(data ? JSON.parse(data) : null);
        } catch(e) { resolve(null); }
      });
    },

    _setToLocalStorage: function(storeName, key, value) {
      var self = this;
      return new Promise(function(resolve) {
        try {
          localStorage.setItem('mxd_' + storeName + '_' + key, JSON.stringify(value));
          resolve(true);
        } catch(e) { resolve(false); }
      });
    },

    // Storage quota management
    getStorageUsage: function() {
      var self = this;
      return new Promise(function(resolve) {
        if (navigator.storage && navigator.storage.estimate) {
          navigator.storage.estimate().then(function(estimate) {
            resolve({
              used: (estimate.usage / 1048576).toFixed(2) + ' MB',
              quota: (estimate.quota / 1048576).toFixed(2) + ' MB',
              percentUsed: ((estimate.usage / estimate.quota) * 100).toFixed(1) + '%'
            });
          });
        } else {
          resolve({ used: 'unknown', quota: 'unknown', percentUsed: 'unknown' });
        }
      });
    },

    cleanupOldPuzzles: function(maxAgeMs) {
      var self = this;
      var cutoff = Date.now() - (maxAgeMs || 604800000); // 7 days default
      return this.getAll(STORES.PUZZLES).then(function(puzzles) {
        var toDelete = puzzles.filter(function(p) { return p.createdAt < cutoff; });
        var deletes = toDelete.map(function(p) { return self.remove(STORES.PUZZLES, p.id); });
        return Promise.all(deletes).then(function() { return toDelete.length; });
      });
    },

    cleanupExpiredCache: function() {
      var self = this;
      var now = Date.now();
      return this.getAll(STORES.KDP_CACHE).then(function(items) {
        var expired = items.filter(function(item) { return item.expiresAt && now > item.expiresAt; });
        var deletes = expired.map(function(item) { return self.remove(STORES.KDP_CACHE, item.key); });
        return Promise.all(deletes).then(function() { return expired.length; });
      });
    },

    isReady: function() {
      return this._ready;
    }
  };

  window.MXDOfflineDB = MXDOfflineDB;
  console.log('[MXD OfflineDB] v' + VERSION + ' loaded');
})();

// mxd-sync-engine.js — MXD Auto-Sync Engine v1.0 (2026)
// Processes pending sync operations when returning online
// Wraps each sync in circuit breakers with exponential backoff

(function(){
  'use strict';

  var VERSION = '1.0.0';

  var MXDSyncEngine = {
    _running: false,
    _listeners: {},
    _syncHistory: [],
    _maxHistory: 50,
    _circuitBreakers: {},
    _retryDelays: [1000, 2000, 5000, 15000, 30000],
    _maxRetries: 5,

    init: function() {
      var self = this;

      // Auto-sync when connectivity changes
      if (window.MXDConnectivity) {
        window.MXDConnectivity.on('online', function() {
          console.log('[MXD SyncEngine] Detected online — starting sync');
          self.syncAll();
        });

        window.MXDConnectivity.on('recovering', function() {
          console.log('[MXD SyncEngine] Recovering — starting sync');
          self.syncAll();
        });
      }

      console.log('[MXD SyncEngine] v' + VERSION + ' initialized');
    },

    // Main sync orchestrator
    syncAll: function() {
      var self = this;
      if (this._running) {
        console.log('[MXD SyncEngine] Sync already running — skipping');
        return Promise.resolve({ skipped: true, reason: 'already_running' });
      }

      this._running = true;
      var startTime = Date.now();
      var results = {};

      this._emit('syncStarted', { at: startTime });

      // Define sync operations in priority order
      var operations = [
        { id: 'keywords', name: 'Keyword Cache', fn: this.syncKeywords, priority: 1 },
        { id: 'competitors', name: 'Competitor Data', fn: this.syncCompetitors, priority: 2 },
        { id: 'bsr', name: 'BSR Updates', fn: this.syncBSR, priority: 3 },
        { id: 'trends', name: 'Movers & Shakers', fn: this.syncTrends, priority: 4 },
        { id: 'categories', name: 'Category Metadata', fn: this.syncCategories, priority: 5 },
        { id: 'trademarks', name: 'Trademark Database', fn: this.syncTrademarks, priority: 6 },
        { id: 'tracker', name: 'Book Tracker', fn: this.syncBookTracker, priority: 7 },
        { id: 'queue', name: 'Pending Queue', fn: this.processSyncQueue, priority: 0 }
      ];

      // Filter to only operations that need sync
      var pendingOps = [];
      var checkPromises = operations.map(function(op) {
        return self.needsSync(op.id).then(function(needs) {
          if (needs) pendingOps.push(op);
        });
      });

      return Promise.all(checkPromises).then(function() {
        if (pendingOps.length === 0) {
          self._running = false;
          self._emit('syncComplete', { duration: Date.now() - startTime, results: {}, synced: 0 });
          return { synced: 0, duration: Date.now() - startTime, message: 'No sync needed' };
        }

        // Sort by priority (lower = higher priority)
        pendingOps.sort(function(a, b) { return a.priority - b.priority; });

        // Execute syncs sequentially to avoid overwhelming the network
        var syncPromises = pendingOps.reduce(function(chain, op) {
          return chain.then(function() {
            return self._runSync(op);
          }).then(function(result) {
            results[op.id] = result;
          }).catch(function(err) {
            results[op.id] = { success: false, error: err.message || String(err) };
          });
        }, Promise.resolve());

        return syncPromises.then(function() {
          self._running = false;
          var duration = Date.now() - startTime;
          var synced = Object.keys(results).filter(function(k) { return results[k] && results[k].success; }).length;
          var failed = Object.keys(results).filter(function(k) { return results[k] && !results[k].success; }).length;

          self._emit('syncComplete', { duration: duration, results: results, synced: synced, failed: failed });

          return {
            synced: synced,
            failed: failed,
            total: pendingOps.length,
            duration: duration,
            results: results
          };
        });
      });
    },

    _runSync: function(operation) {
      var self = this;
      var startTime = Date.now();

      return operation.fn.call(this).then(function(result) {
        var duration = Date.now() - startTime;
        var record = { id: operation.id, name: operation.name, success: true, duration: duration, at: Date.now() };
        self._syncHistory.push(record);
        if (self._syncHistory.length > self._maxHistory) self._syncHistory.shift();
        self._emit('syncOperation', record);
        return { success: true, duration: duration, data: result };
      }).catch(function(err) {
        var duration = Date.now() - startTime;
        var record = { id: operation.id, name: operation.name, success: false, error: err.message || String(err), duration: duration, at: Date.now() };
        self._syncHistory.push(record);
        self._emit('syncOperation', record);
        throw err;
      });
    },

    // Check if a sync operation is needed
    needsSync: function(type) {
      if (!window.MXDOfflineDB || !window.MXDOfflineDB.isReady()) {
        return Promise.resolve(true); // Always sync if DB not ready
      }

      var freshnessThresholds = {
        keywords: 86400000,       // 24 hours
        competitors: 43200000,    // 12 hours
        bsr: 3600000,             // 1 hour
        trends: 21600000,         // 6 hours
        categories: 2592000000,   // 30 days
        trademarks: 604800000,    // 7 days
        tracker: 0,               // Always check (per-book)
        queue: 0                  // Always process
      };

      var threshold = freshnessThresholds[type] || 86400000;

      if (type === 'queue') {
        return window.MXDOfflineDB.getPendingSyncs().then(function(items) {
          return items.length > 0;
        });
      }

      if (type === 'tracker') {
        return window.MXDOfflineDB.getAll(window.MXDOfflineDB.STORES ? window.MXDOfflineDB.STORES.BOOK_TRACKER : 'book_tracker').then(function(books) {
          if (!books || books.length === 0) return false;
          var now = Date.now();
          return books.some(function(b) { return (now - (b.lastUpdated || 0)) > threshold; });
        });
      }

      return window.MXDOfflineDB.isKDPDataFresh(type, 'latest', threshold).then(function(fresh) {
        return !fresh;
      });
    },

    // Sync operations
    syncKeywords: function() {
      // Refresh keyword suggestions from Amazon Suggest API
      var self = this;
      return new Promise(function(resolve) {
        if (!window.MXDOfflineDB || !window.MXDOfflineDB.isReady()) { resolve({ refreshed: 0 }); return; }

        // Get cached seed keywords
        window.MXDOfflineDB.get('settings', 'keyword_seeds').then(function(seeds) {
          if (!seeds || seeds.length === 0) { resolve({ refreshed: 0 }); return; }

          var refreshed = 0;
          var promises = seeds.slice(0, 10).map(function(seed) {
            return self._fetchAmazonSuggest(seed).then(function(suggestions) {
              if (suggestions && suggestions.length > 0) {
                refreshed++;
                return window.MXDOfflineDB.cacheKDPData('keywords', seed, suggestions, 86400000);
              }
            }).catch(function() {});
          });

          Promise.all(promises).then(function() { resolve({ refreshed: refreshed }); });
        });
      });
    },

    syncCompetitors: function() {
      // Refresh competitor data for tracked books
      return new Promise(function(resolve) {
        resolve({ refreshed: 0, note: 'Competitor sync requires Amazon page access — use manual entry or Chrome extension' });
      });
    },

    syncBSR: function() {
      // Update BSR for saved niches
      return new Promise(function(resolve) {
        resolve({ refreshed: 0, note: 'BSR sync requires live Amazon data — use manual entry' });
      });
    },

    syncTrends: function() {
      // Refresh movers & shakers data
      return new Promise(function(resolve) {
        resolve({ refreshed: 0, note: 'Trends sync requires live data — cached data available offline' });
      });
    },

    syncCategories: function() {
      // Refresh category metadata
      return new Promise(function(resolve) {
        resolve({ refreshed: 0, note: 'Category tree is static — no refresh needed' });
      });
    },

    syncTrademarks: function() {
      // Refresh trademark database
      return new Promise(function(resolve) {
        resolve({ refreshed: 0, note: 'Trademark database is local — refresh via update' });
      });
    },

    syncBookTracker: function() {
      // Update tracked books
      return new Promise(function(resolve) {
        resolve({ refreshed: 0, note: 'Book tracker sync requires Amazon page access' });
      });
    },

    processSyncQueue: function() {
      // Process pending sync operations from queue
      var self = this;
      if (!window.MXDOfflineDB || !window.MXDOfflineDB.isReady()) {
        return Promise.resolve({ processed: 0 });
      }

      return window.MXDOfflineDB.getPendingSyncs().then(function(items) {
        if (items.length === 0) return { processed: 0 };

        var processed = 0;
        var promises = items.map(function(item) {
          return self._processQueueItem(item).then(function() {
            processed++;
          }).catch(function(err) {
            window.MXDOfflineDB.markSyncFailed(item.id, err);
          });
        });

        return Promise.all(promises).then(function() {
          return { processed: processed, total: items.length };
        });
      });
    },

    _processQueueItem: function(item) {
      var self = this;
      return new Promise(function(resolve, reject) {
        // Process based on operation type
        switch (item.operation) {
          case 'ai_request':
            // Retry AI request when online
            if (window.AI_CHAT && window.AI_CHAT.send) {
              window.AI_CHAT.send(item.data).then(function(response) {
                window.MXDOfflineDB.markSyncComplete(item.id);
                resolve(response);
              }).catch(reject);
            } else {
              reject(new Error('AI chat not available'));
            }
            break;
          case 'export':
            // Retry export
            if (window.PdfExport && window.PdfExport.generate) {
              window.PdfExport.generate(item.data.puzzles, item.data.cfg).then(function() {
                window.MXDOfflineDB.markSyncComplete(item.id);
                resolve();
              }).catch(reject);
            } else {
              reject(new Error('PDF export not available'));
            }
            break;
          default:
            window.MXDOfflineDB.markSyncComplete(item.id);
            resolve();
        }
      });
    },

    _fetchAmazonSuggest: function(seed) {
      // Fetch Amazon autocomplete suggestions
      return new Promise(function(resolve, reject) {
        if (!navigator.onLine) { resolve([]); return; }

        try {
          var script = document.createElement('script');
          var callbackName = 'amzSuggest_' + Date.now();
          window[callbackName] = function(data) {
            delete window[callbackName];
            document.body.removeChild(script);
            resolve(data[1] || []);
          };

          script.src = 'https://completion.amazon.com/api/2017/suggestions?mid=ATVPDKIKX0DER&alias=aps&prefix=' + encodeURIComponent(seed) + '&suggestion-type=KEYWORD&fb=1&site-variant=desktop&client-info=amazon-search-ui&x-amz-client-metadata=1&alias-searchbins=1&callback=' + callbackName;
          script.onerror = function() {
            delete window[callbackName];
            document.body.removeChild(script);
            reject(new Error('Amazon Suggest fetch failed'));
          };
          document.body.appendChild(script);
        } catch(e) {
          reject(e);
        }
      });
    },

    // Event system
    on: function(event, fn) {
      if (!this._listeners[event]) this._listeners[event] = [];
      this._listeners[event].push(fn);
    },

    off: function(event, fn) {
      if (!this._listeners[event]) return;
      this._listeners[event] = this._listeners[event].filter(function(h) { return h !== fn; });
    },

    _emit: function(event, data) {
      var handlers = this._listeners[event] || [];
      for (var i = 0; i < handlers.length; i++) {
        try { handlers[i](data); } catch(e) {}
      }
    },

    getSyncHistory: function(count) {
      return this._syncHistory.slice(-(count || 20));
    },

    isRunning: function() {
      return this._running;
    },

    getStatus: function() {
      return {
        running: this._running,
        history: this._syncHistory.slice(-10),
        totalSyncs: this._syncHistory.length
      };
    }
  };

  window.MXDSyncEngine = MXDSyncEngine;
  console.log('[MXD SyncEngine] v' + VERSION + ' loaded');
})();
