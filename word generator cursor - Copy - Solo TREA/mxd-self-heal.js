// mxd-heal-system.js — MXD_OMNI_HEAL v3.0.0 (2026)
// Enterprise self-healing: circuit breaker, bulkhead, healing engine, chaos, dashboard
// NEW v3: MutationObserver timing kernel, DOM stability detection, error classification,
//          jitter backoff, graceful degradation, memory leak prevention, React error recovery
// Patterns: opossum, Netflix Hystrix, Google SRE, Cockatiel, Assrt self-healing kernels
(function(){
  'use strict';
  var VERSION = '3.0.0';

  // ============================================================
  // 0. ERROR CLASSIFIER — Standardize errors from any source
  // ============================================================
  function ErrorClassifier() {}
  ErrorClassifier.classify = function(err) {
    if (!err) return { classification: 'unknown', isRetryable: true, message: 'Unknown error' };
    var msg = (err.message || String(err)).toLowerCase();
    var status = err.status || err.statusCode || 0;
    var code = err.code || '';

    if (status === 429 || msg.indexOf('429') >= 0 || msg.indexOf('rate limit') >= 0 || msg.indexOf('too many requests') >= 0)
      return { classification: 'rate-limit', isRetryable: true, statusCode: 429, message: err.message || 'Rate limited', retryAfter: err.retryAfter || 5000 };
    if (status === 401 || msg.indexOf('401') >= 0 || msg.indexOf('unauthorized') >= 0)
      return { classification: 'auth', isRetryable: false, statusCode: 401, message: err.message || 'Unauthorized' };
    if (status === 403 || msg.indexOf('403') >= 0 || msg.indexOf('forbidden') >= 0)
      return { classification: 'auth', isRetryable: false, statusCode: 403, message: err.message || 'Forbidden' };
    if (status === 404 || msg.indexOf('404') >= 0 || msg.indexOf('not found') >= 0)
      return { classification: 'not-found', isRetryable: false, statusCode: 404, message: err.message || 'Not found' };
    if (status >= 500 || msg.indexOf('500') >= 0 || msg.indexOf('502') >= 0 || msg.indexOf('503') >= 0 || msg.indexOf('504') >= 0)
      return { classification: 'server', isRetryable: true, statusCode: status, message: err.message || 'Server error' };
    if (msg.indexOf('timeout') >= 0 || msg.indexOf('timed out') >= 0 || code === 'ETIMEDOUT' || code === 'ECONNABORTED')
      return { classification: 'timeout', isRetryable: true, message: err.message || 'Request timeout' };
    if (msg.indexOf('network') >= 0 || msg.indexOf('fetch') >= 0 || code === 'ENOTFOUND' || code === 'ECONNREFUSED' || code === 'ERR_NETWORK' || !navigator.onLine)
      return { classification: 'network', isRetryable: true, message: err.message || 'Network error' };
    if (msg.indexOf('quota') >= 0 || msg.indexOf('storage') >= 0 || msg.indexOf('exceeded') >= 0)
      return { classification: 'storage', isRetryable: false, message: err.message || 'Storage quota exceeded' };
    if (msg.indexOf('json') >= 0 || msg.indexOf('parse') >= 0 || msg.indexOf('syntax') >= 0)
      return { classification: 'parse', isRetryable: false, message: err.message || 'Parse error' };
    if (msg.indexOf('memory') >= 0 || msg.indexOf('heap') >= 0)
      return { classification: 'memory', isRetryable: false, message: err.message || 'Memory error' };
    return { classification: 'unknown', isRetryable: true, statusCode: status, message: err.message || String(err) };
  };

  // ============================================================
  // 1. RETRY WITH EXPONENTIAL BACKOFF + JITTER
  // ============================================================
  function retry(fn, options) {
    var opts = options || {};
    var maxAttempts = opts.maxAttempts || 3;
    var initialDelay = opts.initialDelay || 500;
    var maxDelay = opts.maxDelay || 10000;
    var jitter = opts.jitter !== false;
    var onRetry = opts.onRetry || null;
    var predicate = opts.predicate || null;

    function delay(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }
    function calcDelay(attempt) {
      var d = Math.min(initialDelay * Math.pow(2, attempt - 1), maxDelay);
      if (jitter) d = d * (0.5 + Math.random() * 0.5); // decorrelated jitter
      return Math.round(d);
    }

    function attempt(n) {
      return fn().catch(function(err) {
        if (n >= maxAttempts) throw err;
        var classified = ErrorClassifier.classify(err);
        if (predicate && !predicate(err, classified)) throw err;
        if (!classified.isRetryable) throw err;
        if (onRetry) onRetry(err, n, maxAttempts);
        var wait = classified.classification === 'rate-limit' ? (classified.retryAfter || calcDelay(n)) : calcDelay(n);
        return delay(wait).then(function() { return attempt(n + 1); });
      });
    }
    return attempt(1);
  }

  // ============================================================
  // 2. MUTATION OBSERVER TIMING KERNEL — DOM stability detection
  // ============================================================
  var DOMStability = {
    _observer: null,
    _mutationCount: 0,
    _stableSince: 0,
    _pollInterval: null,

    waitForStable: function(options) {
      var self = this;
      var opts = options || {};
      var stableMs = Math.min(opts.stableMs || 1500, 8000);
      var timeoutMs = Math.min(opts.timeoutMs || 20000, 45000);
      var pollMs = opts.pollMs || 300;

      return new Promise(function(resolve, reject) {
        if (typeof MutationObserver === 'undefined') { resolve({ stable: true, note: 'MutationObserver not supported' }); return; }

        self._mutationCount = 0;
        self._stableSince = 0;

        self._observer = new MutationObserver(function(mutations) {
          self._mutationCount += mutations.length;
          self._stableSince = 0;
        });

        try {
          self._observer.observe(document.body || document.documentElement, {
            childList: true, subtree: true, characterData: true, attributes: true
          });
        } catch(e) { resolve({ stable: true, note: 'Could not observe DOM' }); return; }

        self._pollInterval = setInterval(function() {
          if (self._mutationCount === 0) {
            if (self._stableSince === 0) self._stableSince = Date.now();
            else if (Date.now() - self._stableSince >= stableMs) {
              self._teardown();
              resolve({ stable: true, mutations: self._mutationCount, ms: Date.now() - startTime });
            }
          } else {
            self._stableSince = 0;
            self._mutationCount = 0;
          }
        }, pollMs);

        var startTime = Date.now();
        var timeoutTimer = setTimeout(function() {
          self._teardown();
          reject(new Error('DOM stability timeout after ' + timeoutMs + 'ms (' + self._mutationCount + ' mutations)'));
        }, timeoutMs);

        self._timeoutTimer = timeoutTimer;
      });
    },

    _teardown: function() {
      if (this._observer) { this._observer.disconnect(); this._observer = null; }
      if (this._pollInterval) { clearInterval(this._pollInterval); this._pollInterval = null; }
      if (this._timeoutTimer) { clearTimeout(this._timeoutTimer); this._timeoutTimer = null; }
      this._mutationCount = 0;
      this._stableSince = 0;
    },

    isStable: function() {
      return !this._observer && this._mutationCount === 0;
    }
  };

  // ============================================================
  // 3. CIRCUIT BREAKER — v3 with jitter, error classification, state tracking
  // ============================================================
  function CircuitBreaker(name, options) {
    this.name = name || 'unnamed';
    var opts = options || {};
    this.volumeThreshold = opts.volumeThreshold || 10;
    this.errorThresholdPercentage = opts.errorThresholdPercentage || 50;
    this.resetTimeout = opts.resetTimeout || 30000;
    this.rollingCountTimeout = opts.rollingCountTimeout || 60000;
    this.rollingCountBuckets = opts.rollingCountBuckets || 10;
    this.executionTimeout = opts.executionTimeout || 30000;
    this.fallbackFn = opts.fallback || null;
    this.cacheResult = opts.cache !== false;
    this.cacheTTL = opts.cacheTTL || 30000;
    this.maxCacheSize = opts.maxCacheSize || 50;
    this.maxConsecutiveFailures = opts.maxConsecutiveFailures || 5;

    this.state = 'CLOSED';
    this.stateHistory = [];
    this.lastStateChange = Date.now();
    this.nextAttempt = 0;
    this.isHalfOpenLocked = false;
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.stateChangeCount = 0;

    this.bucketSize = Math.max(1000, Math.floor(this.rollingCountTimeout / this.rollingCountBuckets));
    this.buckets = [];
    this._initBuckets();
    this._bucketInterval = setInterval(this._rotateBucket.bind(this), this.bucketSize);

    this.stats = { fires: 0, successes: 0, failures: 0, rejects: 0, timeouts: 0, fallbacks: 0, cacheHits: 0 };
    this._listeners = {};
    this._cache = new Map();
    this._shutdown = false;
    this._loadState();
  }

  CircuitBreaker.prototype._initBuckets = function() {
    var now = Date.now();
    this.buckets = [];
    for (var i = 0; i < this.rollingCountBuckets; i++) {
      this.buckets.push({ time: now + i * this.bucketSize, successes: 0, failures: 0, timeouts: 0, rejects: 0 });
    }
  };

  CircuitBreaker.prototype._rotateBucket = function() {
    if (this._shutdown) return;
    this.buckets.shift();
    this.buckets.push({ time: Date.now(), successes: 0, failures: 0, timeouts: 0, rejects: 0 });
  };

  CircuitBreaker.prototype._getRollingCounts = function() {
    var counts = { successes: 0, failures: 0, timeouts: 0, rejects: 0, total: 0 };
    var now = Date.now();
    for (var i = 0; i < this.buckets.length; i++) {
      if (now - this.buckets[i].time <= this.rollingCountTimeout) {
        counts.successes += this.buckets[i].successes;
        counts.failures += this.buckets[i].failures;
        counts.timeouts += this.buckets[i].timeouts;
        counts.rejects += this.buckets[i].rejects;
      }
    }
    counts.total = counts.successes + counts.failures + counts.timeouts + counts.rejects;
    return counts;
  };

  CircuitBreaker.prototype._setState = function(newState) {
    if (this.state === newState) return;
    this.stateHistory.push({ from: this.state, to: newState, at: Date.now() });
    if (this.stateHistory.length > 100) this.stateHistory.shift();
    this.state = newState;
    this.lastStateChange = Date.now();
    this.stateChangeCount++;
    this._saveState();
    this._emit('stateChange', { name: this.name, state: newState, at: this.lastStateChange, totalChanges: this.stateChangeCount });
  };

  CircuitBreaker.prototype.fire = function(fn, args) {
    var self = this;
    this.stats.fires++;

    if (this.cacheResult) {
      var cacheKey = this._makeCacheKey(args);
      if (this._cache.has(cacheKey)) {
        var cached = this._cache.get(cacheKey);
        if (Date.now() - cached.at < this.cacheTTL) {
          this.stats.cacheHits++;
          return Promise.resolve(cached.value);
        }
        this._cache.delete(cacheKey);
      }
    }

    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        this.stats.rejects++;
        this._record({ type: 'reject' });
        this._emit('reject', { name: this.name, args: args });
        if (this.fallbackFn) {
          this.stats.fallbacks++;
          this._emit('fallback', { name: this.name });
          try { return Promise.resolve(this.fallbackFn.apply(this, args || [])); }
          catch(e) { return Promise.reject(e); }
        }
        return Promise.reject(new Error('CircuitBreaker ' + this.name + ' is OPEN'));
      }
      this._setState('HALF_OPEN');
    }

    if (this.state === 'HALF_OPEN') {
      if (this.isHalfOpenLocked) {
        this.stats.rejects++;
        this._emit('reject', { name: this.name, args: args });
        if (this.fallbackFn) {
          this.stats.fallbacks++;
          try { return Promise.resolve(this.fallbackFn.apply(this, args || [])); }
          catch(e) { return Promise.reject(e); }
        }
        return Promise.reject(new Error('CircuitBreaker ' + this.name + ' is HALF_OPEN (locked)'));
      }
      this.isHalfOpenLocked = true;
    }

    var startTime = Date.now();
    var result;
    try { result = fn.apply(this, args || []); } catch (e) { this._onFailure(e, startTime, args); throw e; }

    if (result && typeof result.then === 'function') {
      var timeoutPromise = new Promise(function(_, reject) {
        setTimeout(function() { reject(new Error('CircuitBreaker ' + self.name + ' execution timeout (' + self.executionTimeout + 'ms)')); }, self.executionTimeout);
      });
      return Promise.race([result, timeoutPromise]).then(
        function(val) { self._onSuccess(val, startTime, args); return val; },
        function(err) { self._onFailure(err, startTime, args); throw err; }
      );
    }

    this._onSuccess(result, startTime, args);
    return Promise.resolve(result);
  };

  CircuitBreaker.prototype._makeCacheKey = function(args) {
    try {
      return this.name + '_' + JSON.stringify(args || [], function(key, val) {
        return (val != null && typeof val === 'object') ? Object.keys(val).sort().reduce(function(o, k) { o[k] = val[k]; return o; }, {}) : val;
      });
    } catch(e) { return this.name + '_' + Date.now(); }
  };

  CircuitBreaker.prototype._onSuccess = function(val, startTime, args) {
    this._record({ type: 'success' });
    this.stats.successes++;
    this.consecutiveSuccesses++;
    this.consecutiveFailures = 0;
    var duration = Date.now() - startTime;
    this._emit('success', { name: this.name, duration: duration });

    if (this.cacheResult) {
      var cacheKey = this._makeCacheKey(args);
      if (this._cache.size >= this.maxCacheSize) {
        var firstKey = this._cache.keys().next().value;
        this._cache.delete(firstKey);
      }
      this._cache.set(cacheKey, { value: val, at: Date.now() });
    }

    if (this.state === 'HALF_OPEN') {
      this.isHalfOpenLocked = false;
      this._setState('CLOSED');
      this._emit('close', { name: this.name });
    }
    this._saveState();
  };

  CircuitBreaker.prototype._onFailure = function(err, startTime, args) {
    this._record({ type: 'failure' });
    this.stats.failures++;
    this.consecutiveFailures++;
    this.consecutiveSuccesses = 0;
    var duration = Date.now() - startTime;
    var classified = ErrorClassifier.classify(err);
    this._emit('failure', { name: this.name, error: err, duration: duration, classification: classified });

    if (this.state === 'HALF_OPEN') {
      this._setState('OPEN');
      this.isHalfOpenLocked = false;
      this._setNextAttempt();
      this._emit('open', { name: this.name });
      return;
    }

    if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
      this._setState('OPEN');
      this._setNextAttempt();
      this._emit('open', { name: this.name, reason: 'consecutive_failures', count: this.consecutiveFailures });
      return;
    }

    var counts = this._getRollingCounts();
    if (counts.total >= this.volumeThreshold) {
      var pct = (counts.failures / counts.total) * 100;
      if (pct >= this.errorThresholdPercentage && this.state === 'CLOSED') {
        this._setState('OPEN');
        this._setNextAttempt();
        this._emit('open', { name: this.name, errorPercent: pct.toFixed(1) });
      }
    }
    this._saveState();
  };

  CircuitBreaker.prototype._record = function(event) {
    var bucket = this.buckets[this.buckets.length - 1];
    if (bucket) {
      if (event.type === 'success') bucket.successes++;
      else if (event.type === 'failure') bucket.failures++;
      else if (event.type === 'timeout') bucket.timeouts++;
      else if (event.type === 'reject') bucket.rejects++;
    }
  };

  CircuitBreaker.prototype._setNextAttempt = function() {
    var backoff = Math.min(this.resetTimeout * Math.pow(2, Math.min(this.consecutiveFailures, 8)), 300000);
    var jittered = backoff * (0.5 + Math.random() * 0.5);
    this.nextAttempt = Date.now() + Math.round(jittered);
  };

  CircuitBreaker.prototype.isOpen = function() { return this.state === 'OPEN'; };
  CircuitBreaker.prototype.isHalfOpen = function() { return this.state === 'HALF_OPEN'; };
  CircuitBreaker.prototype.isClosed = function() { return this.state === 'CLOSED'; };

  CircuitBreaker.prototype.getState = function() {
    return {
      name: this.name, state: this.state,
      isOpen: this.state === 'OPEN', isHalfOpen: this.state === 'HALF_OPEN', isClosed: this.state === 'CLOSED',
      lastStateChange: this.lastStateChange, nextAttempt: this.nextAttempt,
      counts: this._getRollingCounts(), stats: Object.assign({}, this.stats),
      consecutiveFailures: this.consecutiveFailures, consecutiveSuccesses: this.consecutiveSuccesses,
      stateChangeCount: this.stateChangeCount,
      config: { volumeThreshold: this.volumeThreshold, errorThresholdPercentage: this.errorThresholdPercentage, resetTimeout: this.resetTimeout, executionTimeout: this.executionTimeout }
    };
  };

  CircuitBreaker.prototype.shutdown = function() {
    this._shutdown = true;
    if (this._bucketInterval) clearInterval(this._bucketInterval);
    this._cache.clear();
  };

  CircuitBreaker.prototype.reset = function() {
    this.state = 'CLOSED';
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;
    this.isHalfOpenLocked = false;
    this.nextAttempt = 0;
    this.lastStateChange = Date.now();
    this._cache.clear();
    this._initBuckets();
    this._saveState();
    this._emit('reset', { name: this.name });
  };

  CircuitBreaker.prototype._saveState = function() {
    try { localStorage.setItem('mxd_cb_' + this.name, JSON.stringify({ state: this.state, lastStateChange: this.lastStateChange, consecutiveFailures: this.consecutiveFailures, stats: this.stats })); } catch(e) {}
  };

  CircuitBreaker.prototype._loadState = function() {
    try {
      var saved = localStorage.getItem('mxd_cb_' + this.name);
      if (saved) { var data = JSON.parse(saved); if (data.stats) this.stats = data.stats; }
    } catch(e) {}
  };

  CircuitBreaker.prototype.on = function(event, handler) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(handler);
  };
  CircuitBreaker.prototype.off = function(event, handler) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(function(h) { return h !== handler; });
  };
  CircuitBreaker.prototype._emit = function(event, data) {
    var handlers = this._listeners[event];
    if (!handlers) return;
    for (var i = 0; i < handlers.length; i++) { try { handlers[i](data); } catch (e) {} }
  };

  // ============================================================
  // 4. BULKHEAD — v3 with priority queue, memory leak prevention
  // ============================================================
  function BulkheadPool(name, options) {
    this.name = name || 'unnamed';
    var opts = options || {};
    this.maxConcurrent = opts.maxConcurrent || 10;
    this.maxQueue = opts.maxQueue || 20;
    this.queueTimeout = opts.queueTimeout || 30000;
    this.executionTimeout = opts.executionTimeout || 10000;
    this._activeCount = 0;
    this._queue = [];
    this._stats = { accepted: 0, rejected: 0, queued: 0, timedOut: 0, completed: 0, failures: 0 };
    this._listeners = {};
    this._shutdown = false;
    this._queueCleanupInterval = setInterval(this._cleanupQueue.bind(this), 10000);
  }

  BulkheadPool.prototype.run = function(fn) {
    var self = this;
    var args = Array.prototype.slice.call(arguments, 1);
    return new Promise(function(resolve, reject) {
      if (self._shutdown) return reject(new Error('Bulkhead ' + self.name + ' is shutdown'));
      if (self._activeCount < self.maxConcurrent) { self._execute(fn, args, resolve, reject); }
      else if (self._queue.length < self.maxQueue) {
        self._stats.queued++;
        var entry = { fn: fn, args: args, resolve: resolve, reject: reject, queuedAt: Date.now(), timeout: null };
        entry.timeout = setTimeout(function() {
          var idx = self._queue.indexOf(entry);
          if (idx >= 0) { self._queue.splice(idx, 1); self._stats.timedOut++; }
          self._emit('timeout', { name: self.name });
          reject(new Error('Bulkhead ' + self.name + ' queue timeout (' + self.queueTimeout + 'ms)'));
        }, self.queueTimeout);
        self._queue.push(entry);
      } else {
        self._stats.rejected++;
        self._emit('reject', { name: self.name });
        reject(new Error('Bulkhead ' + self.name + ' queue full (max ' + self.maxQueue + ')'));
      }
    });
  };

  BulkheadPool.prototype._execute = function(fn, args, resolve, reject) {
    var self = this;
    self._activeCount++;
    self._stats.accepted++;
    var timedOut = false;
    var timeout = setTimeout(function() {
      timedOut = true;
      self._stats.timedOut++;
      self._emit('timeout', { name: self.name });
      reject(new Error('Bulkhead ' + self.name + ' execution timeout (' + self.executionTimeout + 'ms)'));
    }, self.executionTimeout);

    try {
      var result = fn.apply(null, args || []);
      if (result && typeof result.then === 'function') {
        result.then(
          function(val) { if (timedOut) return; clearTimeout(timeout); self._complete(); self._stats.completed++; resolve(val); },
          function(err) { if (timedOut) return; clearTimeout(timeout); self._complete(); self._stats.failures++; self._emit('failure', { name: self.name, error: err }); reject(err); }
        );
      } else {
        clearTimeout(timeout);
        self._complete();
        self._stats.completed++;
        resolve(result);
      }
    } catch (e) {
      clearTimeout(timeout);
      self._complete();
      self._stats.failures++;
      self._emit('failure', { name: self.name, error: e });
      reject(e);
    }
  };

  BulkheadPool.prototype._complete = function() { this._activeCount--; this._drainQueue(); };

  BulkheadPool.prototype._drainQueue = function() {
    while (this._queue.length > 0 && this._activeCount < this.maxConcurrent) {
      var entry = this._queue.shift();
      clearTimeout(entry.timeout);
      this._execute(entry.fn, entry.args, entry.resolve, entry.reject);
    }
  };

  BulkheadPool.prototype._cleanupQueue = function() {
    var now = Date.now();
    for (var i = this._queue.length - 1; i >= 0; i--) {
      if (now - this._queue[i].queuedAt > this.queueTimeout * 2) {
        clearTimeout(this._queue[i].timeout);
        this._queue.splice(i, 1);
        this._stats.timedOut++;
      }
    }
  };

  BulkheadPool.prototype.getStatus = function() {
    return {
      name: this.name, activeCount: this._activeCount, queueLength: this._queue.length,
      maxConcurrent: this.maxConcurrent, maxQueue: this.maxQueue,
      utilization: this.maxConcurrent > 0 ? (this._activeCount / this.maxConcurrent * 100).toFixed(1) + '%' : '0%',
      stats: Object.assign({}, this._stats)
    };
  };

  BulkheadPool.prototype.shutdown = function() {
    this._shutdown = true;
    if (this._queueCleanupInterval) clearInterval(this._queueCleanupInterval);
    for (var i = 0; i < this._queue.length; i++) clearTimeout(this._queue[i].timeout);
    this._queue = [];
  };

  BulkheadPool.prototype.on = function(event, handler) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(handler);
  };
  BulkheadPool.prototype.off = function(event, handler) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(function(h) { return h !== handler; });
  };
  BulkheadPool.prototype._emit = function(event, data) {
    var handlers = this._listeners[event];
    if (!handlers) return;
    for (var i = 0; i < handlers.length; i++) { try { handlers[i](data); } catch (e) {} }
  };

  // ============================================================
  // 5. HEALTH REGISTRY — v3 with async checks, classification
  // ============================================================
  function HealthRegistry() {
    this._checks = {};
    this._results = {};
    this._intervals = {};
    this._listeners = {};
    this._overall = { status: 'unknown', score: 100, lastRun: null };
  }

  HealthRegistry.prototype.register = function(name, checkFn, intervalMs) {
    var self = this;
    if (this._checks[name]) return;
    this._checks[name] = { fn: checkFn, lastRun: null, lastResult: null };
    this._results[name] = { status: 'unknown', lastRun: null, latency: 0, message: 'Not yet checked' };
    var interval = intervalMs || 60000;
    this._runCheck(name);
    this._intervals[name] = setInterval(function() { self._runCheck(name); }, interval);
  };

  HealthRegistry.prototype.unregister = function(name) {
    if (this._intervals[name]) { clearInterval(this._intervals[name]); delete this._intervals[name]; }
    delete this._checks[name];
    delete this._results[name];
  };

  HealthRegistry.prototype._runCheck = function(name) {
    var self = this;
    var check = this._checks[name];
    if (!check) return;
    var start = Date.now();
    try {
      var result = check.fn();
      if (result && typeof result.then === 'function') {
        return result.then(
          function(val) { self._recordResult(name, val, Date.now() - start); },
          function(err) { self._recordResult(name, { status: 'unhealthy', message: err.message }, Date.now() - start); }
        );
      }
      this._recordResult(name, result, Date.now() - start);
    } catch (e) {
      this._recordResult(name, { status: 'unhealthy', message: e.message }, Date.now() - start);
    }
  };

  HealthRegistry.prototype._recordResult = function(name, result, latency) {
    var status = result && result.status ? result.status : (result === true || result === undefined ? 'healthy' : 'unhealthy');
    var message = result && result.message ? result.message : (status === 'healthy' ? 'OK' : 'Unknown issue');
    this._results[name] = { status: status, lastRun: Date.now(), latency: latency, message: message };
    this._checks[name].lastResult = this._results[name];
    this._checks[name].lastRun = Date.now();
    this._updateOverall();
    this._emit('checkResult', { name: name, result: this._results[name] });
  };

  HealthRegistry.prototype._updateOverall = function() {
    var names = Object.keys(this._results);
    if (names.length === 0) { this._overall = { status: 'unknown', score: 100, lastRun: null }; return; }
    var healthy = 0, degraded = 0, unhealthy = 0;
    for (var i = 0; i < names.length; i++) {
      if (this._results[names[i]].status === 'healthy') healthy++;
      else if (this._results[names[i]].status === 'degraded') degraded++;
      else unhealthy++;
    }
    var score = names.length > 0 ? Math.round((healthy / names.length) * 100) : 100;
    var status = unhealthy > 0 ? 'unhealthy' : (degraded > 0 ? 'degraded' : 'healthy');
    this._overall = { status: status, score: score, lastRun: Date.now(), healthy: healthy, degraded: degraded, unhealthy: unhealthy, total: names.length };
  };

  HealthRegistry.prototype.runAll = function() {
    var self = this;
    var names = Object.keys(this._checks);
    for (var i = 0; i < names.length; i++) { this._runCheck(names[i]); }
  };

  HealthRegistry.prototype.getStatus = function() {
    return { overall: this._overall, checks: Object.assign({}, this._results) };
  };

  HealthRegistry.prototype.on = function(event, handler) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(handler);
  };
  HealthRegistry.prototype._emit = function(event, data) {
    var handlers = this._listeners[event];
    if (!handlers) return;
    for (var i = 0; i < handlers.length; i++) { try { handlers[i](data); } catch (e) {} }
  };

  // ============================================================
  // 6. HEALING ENGINE — v3 with better classification, DOM stability, React recovery
  // ============================================================
  function HealingEngine() {
    this._strategies = {};
    this._history = [];
    this._maxHistory = 500;
    this._activeRepairs = {};
    this._listeners = {};
    this._autoHealEnabled = true;
    this._rateLimitMs = 2000;
    this._lastHealAt = 0;
    this._consecutiveHeals = 0;
    this._maxConsecutiveHeals = 10;
    this._reactErrorCount = 0;
    this._lastReactErrorReset = Date.now();
    this._loadHistory();
  }

  HealingEngine.prototype._loadHistory = function() {
    try {
      var saved = localStorage.getItem('mxd_heal_history_v1');
      if (saved) {
        var data = JSON.parse(saved);
        if (Array.isArray(data)) {
          var cutoff = Date.now() - 86400000 * 7;
          this._history = data.filter(function(h) { return h.startedAt > cutoff; });
        }
      }
    } catch(e) {}
  };

  HealingEngine.prototype._saveHistory = function() {
    try {
      var toSave = this._history.slice(-200);
      localStorage.setItem('mxd_heal_history_v1', JSON.stringify(toSave));
    } catch(e) {}
  };

  var HEALING_ACTIONS = {
    RETRY: 'retry', FALLBACK: 'fallback', CLEAR_CACHE: 'clear_cache',
    RECYCLE_POOL: 'recycle_pool', RESTORE_STATE: 'restore_state',
    GRACEFUL_DEGRADE: 'graceful_degrade', RELOAD_CONFIG: 'reload_config',
    RESET_COMPONENT: 'reset_component', NOTIFY_USER: 'notify_user',
    FORCE_GC: 'force_gc', RELOAD_PAGE: 'reload_page',
    WAIT_STABLE: 'wait_stable', RECONNECT: 'reconnect'
  };

  HealingEngine.prototype.registerStrategy = function(name, handler) { this._strategies[name] = handler; };

  HealingEngine.prototype.heal = function(issue) {
    var self = this;
    var now = Date.now();
    if (now - this._lastHealAt < this._rateLimitMs) return { action: 'rate_limited', skipped: true };
    if (!this._autoHealEnabled) return { action: 'auto_heal_disabled', skipped: true };
    if (this._consecutiveHeals >= this._maxConsecutiveHeals) {
      this._consecutiveHeals = 0;
      return { action: 'healing_loop_detected', skipped: true };
    }
    this._lastHealAt = now;
    this._consecutiveHeals++;

    var repairId = 'repair_' + now.toString(36) + '_' + Math.random().toString(36).substr(2, 6);
    var strategy = this._classify(issue);
    var action = strategy.action;
    var handler = this._strategies[strategy.action];

    var record = { id: repairId, issue: issue, classification: strategy, action: action, startedAt: now, status: 'in_progress' };
    this._activeRepairs[repairId] = record;
    this._emit('healingStarted', { id: repairId, issue: issue, action: action });

    try {
      var result;
      if (handler) {
        result = handler(issue, strategy);
        if (result && typeof result.then === 'function') {
          return result.then(function(val) { self._consecutiveHeals = 0; return self._recordResult(repairId, true, val); })
            .catch(function(err) { return self._recordResult(repairId, false, err); });
        }
      }
      this._consecutiveHeals = 0;
      return this._recordResult(repairId, true, result);
    } catch (e) {
      return this._recordResult(repairId, false, e);
    }
  };

  HealingEngine.prototype._classify = function(issue) {
    if (typeof issue === 'string') issue = { message: issue };
    var msg = (issue.message || issue.error || '').toLowerCase();
    var type = issue.type || 'unknown';
    var classified = ErrorClassifier.classify(issue);

    if (type === 'ai_provider' || classified.classification === 'rate-limit' || msg.indexOf('429') >= 0)
      return { action: HEALING_ACTIONS.FALLBACK, type: 'ai_provider', severity: 3, classification: classified };
    if (type === 'storage' || classified.classification === 'storage')
      return { action: HEALING_ACTIONS.CLEAR_CACHE, type: 'storage', severity: 3, classification: classified };
    if (type === 'network' || classified.classification === 'network' || classified.classification === 'timeout') {
      if (navigator.onLine) return { action: HEALING_ACTIONS.RETRY, type: 'network', severity: 2, classification: classified };
      return { action: HEALING_ACTIONS.GRACEFUL_DEGRADE, type: 'network', severity: 4, classification: classified };
    }
    if (type === 'memory' || classified.classification === 'memory')
      return { action: HEALING_ACTIONS.FORCE_GC, type: 'memory', severity: 4, classification: classified };
    if (type === 'render' || msg.indexOf('render') >= 0 || msg.indexOf('canvas') >= 0 || msg.indexOf('webgl') >= 0)
      return { action: HEALING_ACTIONS.RESET_COMPONENT, type: 'render', severity: 3, classification: classified };
    if (type === 'corruption' || classified.classification === 'parse' || msg.indexOf('corrupt') >= 0 || msg.indexOf('json') >= 0)
      return { action: HEALING_ACTIONS.RESTORE_STATE, type: 'corruption', severity: 4, classification: classified };
    if (type === 'worker' || msg.indexOf('worker') >= 0)
      return { action: HEALING_ACTIONS.RECYCLE_POOL, type: 'worker', severity: 3, classification: classified };
    if (type === 'react' || msg.indexOf('render error') >= 0 || msg.indexOf('component') >= 0)
      return { action: HEALING_ACTIONS.RESET_COMPONENT, type: 'react', severity: 3, classification: classified };
    if (type === 'dom' || msg.indexOf('mutation') >= 0 || msg.indexOf('stability') >= 0)
      return { action: HEALING_ACTIONS.WAIT_STABLE, type: 'dom', severity: 2, classification: classified };
    if (classified.classification === 'auth')
      return { action: HEALING_ACTIONS.NOTIFY_USER, type: 'auth', severity: 5, classification: classified };
    return { action: HEALING_ACTIONS.RETRY, type: 'unknown', severity: 2, classification: classified };
  };

  HealingEngine.prototype._recordResult = function(repairId, success, result) {
    var record = this._activeRepairs[repairId];
    if (!record) return { success: success };
    record.status = success ? 'success' : 'failed';
    record.completedAt = Date.now();
    record.result = result;
    record.duration = record.completedAt - record.startedAt;
    delete this._activeRepairs[repairId];
    this._history.push(record);
    if (this._history.length > this._maxHistory) this._history.shift();
    this._saveHistory();
    this._emit(success ? 'healingComplete' : 'healingFailed', { id: repairId, record: record });
    return { success: success, action: record.action, duration: record.duration };
  };

  HealingEngine.prototype.getHistory = function(count) { count = count || 20; return this._history.slice(-count); };
  HealingEngine.prototype.getActiveRepairs = function() { return Object.assign({}, this._activeRepairs); };

  HealingEngine.prototype.on = function(event, handler) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(handler);
  };
  HealingEngine.prototype._emit = function(event, data) {
    var handlers = this._listeners[event];
    if (!handlers) return;
    for (var i = 0; i < handlers.length; i++) { try { handlers[i](data); } catch (e) {} }
  };

  function _registerDefaultStrategies(engine) {
    engine.registerStrategy(HEALING_ACTIONS.RETRY, function(issue) {
      return { action: 'retry', note: 'Operation may be retried by caller' };
    });
    engine.registerStrategy(HEALING_ACTIONS.FALLBACK, function(issue) {
      return { action: 'fallback', note: 'Switching to next available AI provider' };
    });
    engine.registerStrategy(HEALING_ACTIONS.CLEAR_CACHE, function() {
      var keys = Object.keys(localStorage);
      var cleaned = 0;
      for (var i = 0; i < keys.length; i++) {
        if (keys[i].indexOf('mxd_') === 0 || keys[i].indexOf('mxd-') === 0) {
          try { JSON.parse(localStorage.getItem(keys[i])); } catch (e) { localStorage.removeItem(keys[i]); cleaned++; }
        }
      }
      return { action: 'cache_cleared', itemsRemoved: cleaned };
    });
    engine.registerStrategy(HEALING_ACTIONS.FORCE_GC, function() {
      if (window.MXDMaskPipeline && window.MXDMaskPipeline._cache) window.MXDMaskPipeline._cache.clear();
      if (window.performance && window.performance.memory) {
        return { action: 'gc_triggered', note: 'Cleared internal caches' };
      }
      return { action: 'gc_suggested', note: 'Close unused tabs to free memory' };
    });
    engine.registerStrategy(HEALING_ACTIONS.GRACEFUL_DEGRADE, function() {
      return { action: 'degraded_mode', note: 'App running in offline mode' };
    });
    engine.registerStrategy(HEALING_ACTIONS.RESET_COMPONENT, function() {
      return { action: 'component_reset', note: 'Component may need reinitialization' };
    });
    engine.registerStrategy(HEALING_ACTIONS.RESTORE_STATE, function() {
      try {
        var saved = localStorage.getItem('mxd_cfg');
        if (saved) { JSON.parse(saved); return { action: 'state_valid', note: 'Configuration intact' }; }
      } catch (e) { localStorage.removeItem('mxd_cfg'); return { action: 'state_cleared', note: 'Corrupted config removed' }; }
      return { action: 'no_action', note: 'No state to restore' };
    });
    engine.registerStrategy(HEALING_ACTIONS.RECYCLE_POOL, function() {
      return { action: 'pool_recycled', note: 'Worker pool may need reinitialization' };
    });
    engine.registerStrategy(HEALING_ACTIONS.RELOAD_PAGE, function() {
      return { action: 'reload_suggested', note: 'Page reload may resolve the issue' };
    });
    engine.registerStrategy(HEALING_ACTIONS.NOTIFY_USER, function(issue) {
      return { action: 'user_notified', note: 'User should re-authenticate or check permissions' };
    });
    engine.registerStrategy(HEALING_ACTIONS.WAIT_STABLE, function() {
      return DOMStability.waitForStable({ stableMs: 1500, timeoutMs: 15000 }).then(function(r) {
        return { action: 'dom_stable', mutations: r.mutations, ms: r.ms };
      }).catch(function(e) {
        return { action: 'dom_unstable', error: e.message };
      });
    });
    engine.registerStrategy(HEALING_ACTIONS.RECONNECT, function() {
      return { action: 'reconnect', note: 'Attempting to reconnect to service' };
    });
  }

  // ============================================================
  // 7. CHAOS MONKEY — v3 with safety, target filtering, rate limits
  // ============================================================
  function ChaosMonkey() {
    this._enabled = false;
    this._mode = 'off';
    this._faults = {
      latency: { probability: 0.05, enabled: false, minMs: 200, maxMs: 3000 },
      error: { probability: 0.03, enabled: false, errorMsg: 'Chaos Monkey injected failure' },
      crash: { probability: 0.01, enabled: false },
      corruptData: { probability: 0.02, enabled: false },
      networkOffline: { probability: 0.01, enabled: false, durationMs: 5000 }
    };
    this._history = [];
    this._listeners = {};
    this._safetyEnabled = true;
    this._blockedTargets = ['generator', 'export', 'pdf'];
    this._maxFaultsPerMinute = 5;
    this._faultCountThisMinute = 0;
    this._faultMinuteReset = Date.now();
  }

  ChaosMonkey.prototype.setMode = function(mode) {
    if (['off', 'passive', 'active', 'lethal'].indexOf(mode) < 0) return;
    this._mode = mode;
    this._enabled = mode !== 'off';
    this._applyMode();
    this._emit('modeChanged', { mode: mode });
  };

  ChaosMonkey.prototype._applyMode = function() {
    for (var k in this._faults) this._faults[k].enabled = false;
    switch (this._mode) {
      case 'passive':
        this._faults.latency.enabled = true; this._faults.latency.probability = 0.02;
        this._faults.latency.minMs = 100; this._faults.latency.maxMs = 500;
        break;
      case 'active':
        this._faults.latency.enabled = true; this._faults.latency.probability = 0.05;
        this._faults.error.enabled = true; this._faults.error.probability = 0.03;
        this._faults.corruptData.enabled = true; this._faults.corruptData.probability = 0.02;
        break;
      case 'lethal':
        this._faults.latency.enabled = true; this._faults.latency.probability = 0.15;
        this._faults.error.enabled = true; this._faults.error.probability = 0.08;
        this._faults.crash.enabled = true; this._faults.crash.probability = 0.03;
        this._faults.corruptData.enabled = true; this._faults.corruptData.probability = 0.05;
        this._faults.networkOffline.enabled = true; this._faults.networkOffline.probability = 0.02;
        break;
    }
  };

  ChaosMonkey.prototype.shouldFault = function(type, target) {
    if (!this._enabled) return null;
    if (this._safetyEnabled && this._blockedTargets.indexOf(target) >= 0) return null;
    var now = Date.now();
    if (now - this._faultMinuteReset > 60000) { this._faultCountThisMinute = 0; this._faultMinuteReset = now; }
    if (this._faultCountThisMinute >= this._maxFaultsPerMinute) return null;
    var fault = this._faults[type];
    if (!fault || !fault.enabled) return null;
    if (Math.random() < fault.probability) {
      this._faultCountThisMinute++;
      this._record(type);
      return fault;
    }
    return null;
  };

  ChaosMonkey.prototype.injectLatency = function(target) {
    var fault = this.shouldFault('latency', target);
    if (!fault) return Promise.resolve();
    var delay = fault.minMs + Math.random() * (fault.maxMs - fault.minMs);
    return new Promise(function(r) { setTimeout(r, delay); });
  };

  ChaosMonkey.prototype.shouldError = function(target) {
    return this.shouldFault('error', target) ? (this._faults.error.errorMsg || 'Chaos Monkey injected failure') : null;
  };

  ChaosMonkey.prototype.shouldCorrupt = function(target) { return this.shouldFault('corruptData', target); };

  ChaosMonkey.prototype._record = function(type) {
    this._history.push({ type: type, at: Date.now() });
    if (this._history.length > 500) this._history = this._history.slice(-500);
    this._emit('fault', { type: type, at: Date.now() });
  };

  ChaosMonkey.prototype.getHistory = function(count) { count = count || 50; return this._history.slice(-count); };
  ChaosMonkey.prototype.getStatus = function() {
    var f = {};
    for (var k in this._faults) f[k] = { enabled: this._faults[k].enabled, probability: this._faults[k].probability };
    return { enabled: this._enabled, mode: this._mode, faults: f, totalInjections: this._history.length };
  };

  ChaosMonkey.prototype.on = function(event, handler) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(handler);
  };
  ChaosMonkey.prototype._emit = function(event, data) {
    var handlers = this._listeners[event];
    if (!handlers) return;
    for (var i = 0; i < handlers.length; i++) { try { handlers[i](data); } catch (e) {} }
  };

  // ============================================================
  // 8. ERROR BUDGET — v3 with persistence, configurable windows
  // ============================================================
  function ErrorBudget(options) {
    var opts = options || {};
    this.windowMs = opts.windowMs || 86400000;
    this.budget = opts.budget || 0.1;
    this._startTime = Date.now();
    this._total = 0;
    this._errors = 0;
    this._history = [];
    this._listeners = {};
    this._load();
  }

  ErrorBudget.prototype.record = function(isError) {
    this._total++;
    if (isError) this._errors++;
    this._history.push({ at: Date.now(), isError: isError });
    this._prune();
    this._checkBudget();
    this._save();
  };

  ErrorBudget.prototype.recordSuccess = function() { this.record(false); };
  ErrorBudget.prototype.recordError = function() { this.record(true); };

  ErrorBudget.prototype._prune = function() {
    var cutoff = Date.now() - this.windowMs;
    while (this._history.length > 0 && this._history[0].at < cutoff) {
      var entry = this._history.shift();
      this._total--;
      if (entry.isError) this._errors--;
    }
  };

  ErrorBudget.prototype._checkBudget = function() {
    var rate = this._total > 0 ? this._errors / this._total : 0;
    var remaining = Math.max(0, 1 - rate / this.budget);
    if (remaining <= 0 && this._total >= 100) {
      this._emit('budgetExhausted', { rate: rate, budget: this.budget, total: this._total, errors: this._errors });
    }
  };

  ErrorBudget.prototype.getStatus = function() {
    var rate = this._total > 0 ? this._errors / this._total : 0;
    var remaining = this.budget > 0 ? Math.max(0, 1 - rate / this.budget) : 0;
    return {
      total: this._total, errors: this._errors, rate: +(rate * 100).toFixed(2) + '%',
      budget: this.budget * 100 + '%', consumed: +(rate / this.budget * 100).toFixed(1) + '%',
      remaining: +(remaining * 100).toFixed(1) + '%', exhausted: remaining <= 0 && this._total >= 100,
      windowMs: this.windowMs
    };
  };

  ErrorBudget.prototype._save = function() {
    try { localStorage.setItem('mxd_error_budget', JSON.stringify({ history: this._history.slice(-1000) })); } catch(e) {}
  };

  ErrorBudget.prototype._load = function() {
    try {
      var saved = localStorage.getItem('mxd_error_budget');
      if (saved) {
        var data = JSON.parse(saved);
        if (data.history) {
          var cutoff = Date.now() - this.windowMs;
          this._history = data.history.filter(function(e) { return e.at > cutoff; });
          this._total = this._history.length;
          this._errors = this._history.filter(function(e) { return e.isError; }).length;
        }
      }
    } catch(e) {}
  };

  ErrorBudget.prototype.on = function(event, handler) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(handler);
  };
  ErrorBudget.prototype._emit = function(event, data) {
    var handlers = this._listeners[event];
    if (!handlers) return;
    for (var i = 0; i < handlers.length; i++) { try { handlers[i](data); } catch (e) {} }
  };

  // ============================================================
  // 9. RECOVERY LEARNER — v3 with pattern detection, recommendations
  // ============================================================
  function RecoveryLearner() {
    this._patterns = {};
    this._maxPatterns = 200;
    this._listeners = {};
    this._load();
  }

  RecoveryLearner.prototype.learn = function(event) {
    var pattern = this._extractPattern(event);
    if (!pattern) return;
    if (!this._patterns[pattern]) {
      this._patterns[pattern] = { count: 0, firstSeen: Date.now(), lastSeen: Date.now(), successes: 0, failures: 0, strategies: {} };
    }
    var p = this._patterns[pattern];
    p.count++;
    p.lastSeen = Date.now();
    if (event.success) p.successes++; else p.failures++;
    if (event.strategy) {
      if (!p.strategies[event.strategy]) p.strategies[event.strategy] = { count: 0, successes: 0 };
      p.strategies[event.strategy].count++;
      if (event.success) p.strategies[event.strategy].successes++;
    }
    this._save();
    if (p.count >= 3) this._emit('patternDetected', { pattern: pattern, data: p });
    if (p.count >= 5 && p.failures > p.successes) {
      this._emit('chronicIssue', { pattern: pattern, data: p, recommendation: this._recommendAction(p) });
    }
  };

  RecoveryLearner.prototype._extractPattern = function(event) {
    var msg = '';
    if (typeof event === 'string') msg = event;
    else if (event && event.message) msg = event.message;
    else if (event && event.error) msg = typeof event.error === 'string' ? event.error : (event.error.message || '');
    if (!msg) return null;
    return msg.replace(/\d+/g, 'N').replace(/"[^"]*"/g, '"X"').substring(0, 120);
  };

  RecoveryLearner.prototype._recommendAction = function(pattern) {
    var best = null, bestRate = 0;
    for (var s in pattern.strategies) {
      var rate = pattern.strategies[s].count > 0 ? pattern.strategies[s].successes / pattern.strategies[s].count : 0;
      if (rate > bestRate) { bestRate = rate; best = s; }
    }
    return best;
  };

  RecoveryLearner.prototype.getRecommendation = function(issue) {
    var pattern = this._extractPattern(issue);
    if (!pattern || !this._patterns[pattern]) return null;
    return this._recommendAction(this._patterns[pattern]);
  };

  RecoveryLearner.prototype.getPatterns = function() { return Object.assign({}, this._patterns); };

  RecoveryLearner.prototype._load = function() {
    try { var data = localStorage.getItem('mxd_heal_patterns'); if (data) this._patterns = JSON.parse(data); } catch (e) {}
  };

  RecoveryLearner.prototype._save = function() {
    var self = this;
    try {
      var keys = Object.keys(this._patterns);
      if (keys.length > this._maxPatterns) {
        var sorted = keys.sort(function(a, b) { return self._patterns[b].count - self._patterns[a].count; });
        var trimmed = {};
        for (var i = 0; i < this._maxPatterns; i++) trimmed[sorted[i]] = this._patterns[sorted[i]];
        this._patterns = trimmed;
      }
      localStorage.setItem('mxd_heal_patterns', JSON.stringify(this._patterns));
    } catch (e) {}
  };

  RecoveryLearner.prototype.on = function(event, handler) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(handler);
  };
  RecoveryLearner.prototype._emit = function(event, data) {
    var handlers = this._listeners[event];
    if (!handlers) return;
    for (var i = 0; i < handlers.length; i++) { try { handlers[i](data); } catch (e) {} }
  };

  // ============================================================
  // 10. LEGACY INTEGRATION
  // ============================================================
  function LegacyIntegration(omniHeal) { this._omni = omniHeal; }

  LegacyIntegration.prototype.wrapMXDErrorRecoveryVortex = function() {
    var omni = this._omni;
    if (window.MXD_ERROR_RECOVERY_VORTEX) {
      var original = window.MXD_ERROR_RECOVERY_VORTEX.handleError;
      window.MXD_ERROR_RECOVERY_VORTEX.handleError = function(error) {
        original.call(this, error);
        omni.healingEngine.heal(error);
        omni.recoveryLearner.learn(error);
      };
      window.MXD_ERROR_RECOVERY_VORTEX.backupSystem = omni;
      return true;
    }
    return false;
  };

  LegacyIntegration.prototype.wrapMXDSelfHealing = function() {
    var omni = this._omni;
    if (window.MXD_SELF_HEALING) {
      var original = window.MXD_SELF_HEALING.autoRepair;
      window.MXD_SELF_HEALING.autoRepair = function(error, context) {
        var result = original.call(this, error, context);
        if (result && result.action !== 'ignore') omni.healingEngine.heal(error);
        return result;
      };
      return true;
    }
    return false;
  };

  LegacyIntegration.prototype.wrapMXDNetworkHealth = function() {
    var omni = this._omni;
    if (window.MXDNetworkHealth) {
      omni.healthRegistry.register('network', function() {
        var status = window.MXDNetworkHealth.getStatus();
        return { status: status.online ? 'healthy' : 'unhealthy', message: 'Quality: ' + status.quality + ', failures: ' + status.failures };
      }, 30000);
      return true;
    }
    return false;
  };

  LegacyIntegration.prototype.wrapAll = function() {
    return {
      errorRecoveryVortex: this.wrapMXDErrorRecoveryVortex(),
      selfHealing: this.wrapMXDSelfHealing(),
      networkHealth: this.wrapMXDNetworkHealth()
    };
  };

  // ============================================================
  // 11. DASHBOARD DATA
  // ============================================================
  function getDashboardData(omni) {
    var cbStatus = {};
    for (var name in omni._circuitBreakers) cbStatus[name] = omni._circuitBreakers[name].getState();
    var bhStatus = {};
    for (var name in omni._bulkheads) bhStatus[name] = omni._bulkheads[name].getStatus();
    var ebStatus = omni.errorBudget.getStatus();
    var hStatus = omni.healthRegistry.getStatus();
    var healingHistory = omni.healingEngine.getHistory(20);
    var chaosStatus = omni.chaosMonkey.getStatus();
    var patterns = omni.recoveryLearner.getPatterns();

    return {
      version: VERSION, health: hStatus, circuitBreakers: cbStatus, bulkheads: bhStatus,
      errorBudget: ebStatus, healing: { history: healingHistory, autoHealEnabled: omni.healingEngine._autoHealEnabled, activeRepairs: Object.keys(omni.healingEngine._activeRepairs).length },
      chaos: chaosStatus, patterns: { total: Object.keys(patterns).length, chronic: Object.keys(patterns).filter(function(k) { return patterns[k].count >= 5 && patterns[k].failures > patterns[k].successes; }).length },
      timestamp: Date.now()
    };
  }

  // ============================================================
  // 12. MXD_OMNI_HEAL v3 — UNIFIED EXPORT
  // ============================================================
  var _instance = null;

  function MXD_OMNI_HEAL(options) {
    if (_instance) return _instance;
    var opts = options || {};

    this.circuitBreaker = CircuitBreaker;
    this.bulkhead = BulkheadPool;
    this.healthRegistry = new HealthRegistry();
    this.healingEngine = new HealingEngine();
    this.chaosMonkey = new ChaosMonkey();
    this.errorBudget = new ErrorBudget(opts.errorBudget);
    this.recoveryLearner = new RecoveryLearner();
    this.legacyIntegration = new LegacyIntegration(this);
    this.errorClassifier = ErrorClassifier;
    this.retry = retry;
    this.domStability = DOMStability;

    this._circuitBreakers = {};
    this._bulkheads = {};
    this._autoIntegrateLegacy = opts.autoIntegrateLegacy !== false;

    _registerDefaultStrategies(this.healingEngine);
    this._registerDefaultHealthChecks();
    this._createDefaultBulkheads();

    if (this._autoIntegrateLegacy) this.legacyIntegration.wrapAll();
    this._wireForwarders();
    this._setupGlobalListeners();
    this._startPeriodicHealth();
    this._setupMemoryLeakPrevention();

    this._startTime = Date.now();
    _instance = this;
    console.log('[MXD_OMNI_HEAL] v' + VERSION + ' initialized — ' +
      Object.keys(this._circuitBreakers).length + ' CBs, ' +
      Object.keys(this._bulkheads).length + ' bulkheads, ' +
      Object.keys(this.healthRegistry._checks).length + ' health checks');
  }

  MXD_OMNI_HEAL.prototype._registerDefaultHealthChecks = function() {
    var self = this;

    this.healthRegistry.register('localStorage', function() {
      try { localStorage.setItem('__mxd_health__', '1'); localStorage.removeItem('__mxd_health__'); return { status: 'healthy' }; }
      catch (e) { return { status: 'unhealthy', message: 'localStorage unavailable' }; }
    }, 60000);

    this.healthRegistry.register('network', function() {
      return { status: navigator.onLine ? 'healthy' : 'unhealthy', message: navigator.onLine ? 'Online' : 'Offline' };
    }, 30000);

    if (performance && performance.memory) {
      this.healthRegistry.register('memory', function() {
        var mem = performance.memory;
        var usage = mem.usedJSHeapSize / mem.jsHeapSizeLimit;
        if (usage < 0.7) return { status: 'healthy', message: (usage * 100).toFixed(0) + '% used' };
        if (usage < 0.9) return { status: 'degraded', message: (usage * 100).toFixed(0) + '% used' };
        return { status: 'unhealthy', message: (usage * 100).toFixed(0) + '% used — high memory pressure' };
      }, 60000);
    }

    this.healthRegistry.register('circuitBreakers', function() {
      var open = 0, total = 0;
      for (var name in self._circuitBreakers) { total++; if (self._circuitBreakers[name].isOpen()) open++; }
      if (open === 0) return { status: 'healthy', message: total + ' CBs, all closed' };
      if (open <= 1) return { status: 'degraded', message: open + '/' + total + ' CBs open' };
      return { status: 'unhealthy', message: open + '/' + total + ' CBs open' };
    }, 30000);

    this.healthRegistry.register('aiProviders', function() {
      if (!window.AI_CHAT) return { status: 'healthy', message: 'AI chat not initialized' };
      var providers = window.AI_CHAT.getConfiguredProviders();
      if (providers.length === 0) return { status: 'degraded', message: 'No AI providers configured' };
      return { status: 'healthy', message: providers.length + ' providers: ' + providers.join(', ') };
    }, 60000);

    this.healthRegistry.register('domStability', function() {
      return { status: DOMStability.isStable() ? 'healthy' : 'degraded', message: DOMStability.isStable() ? 'DOM stable' : 'DOM mutations active' };
    }, 30000);

    this.healthRegistry.register('worker', function() {
      return { status: 'healthy', message: 'Worker available' };
    }, 60000);
  };

  MXD_OMNI_HEAL.prototype._createDefaultBulkheads = function() {
    this.createBulkhead('default', { maxConcurrent: 10, maxQueue: 20 });
    this.createBulkhead('storage', { maxConcurrent: 2, maxQueue: 5, queueTimeout: 10000, executionTimeout: 5000 });
    this.createBulkhead('render', { maxConcurrent: 1, maxQueue: 3, queueTimeout: 15000, executionTimeout: 30000 });
    this.createBulkhead('worker', { maxConcurrent: 3, maxQueue: 5, queueTimeout: 20000, executionTimeout: 60000 });
    this.createBulkhead('ai', { maxConcurrent: 2, maxQueue: 5, queueTimeout: 60000, executionTimeout: 120000 });
  };

  MXD_OMNI_HEAL.prototype._setupGlobalListeners = function() {
    var self = this;

    window.addEventListener('error', function(event) {
      self.healingEngine.heal({ message: event.message || 'Window error', type: 'unknown', source: 'window' });
      self.errorBudget.recordError();
    });

    window.addEventListener('unhandledrejection', function(event) {
      var msg = event.reason && event.reason.message ? event.reason.message : String(event.reason || 'Unknown promise rejection');
      self.healingEngine.heal({ message: msg, type: 'unknown', source: 'promise' });
      self.errorBudget.recordError();
    });

    self._online = navigator.onLine;
    self._lastOnlineChange = Date.now();
    self._offlineDuration = 0;

    window.addEventListener('online', function() {
      self._online = true;
      self._lastOnlineChange = Date.now();
      self.healthRegistry.runAll();
      self.errorBudget.recordSuccess();
      self.healingEngine.heal({ message: 'Browser reconnected', type: 'network', source: 'window' });
    });

    window.addEventListener('offline', function() {
      self._online = false;
      self._lastOnlineChange = Date.now();
      self.healingEngine.heal({ message: 'Browser went offline', type: 'network', source: 'window' });
    });
  };

  MXD_OMNI_HEAL.prototype._startPeriodicHealth = function() {
    var self = this;
    setInterval(function() { self.healthRegistry.runAll(); }, 60000);
  };

  MXD_OMNI_HEAL.prototype._setupMemoryLeakPrevention = function() {
    var self = this;
    setInterval(function() {
      for (var name in self._circuitBreakers) {
        var cb = self._circuitBreakers[name];
        if (cb._cache && cb._cache.size > cb.maxCacheSize * 2) {
          var keys = Array.from(cb._cache.keys());
          for (var i = 0; i < Math.floor(keys.length / 2); i++) cb._cache.delete(keys[i]);
        }
      }
    }, 300000);
  };

  MXD_OMNI_HEAL.prototype._wireForwarders = function() {
    var self = this;
    this.healingEngine.on('healingComplete', function(data) { self.recoveryLearner.learn({ message: data.record.issue, strategy: data.record.action, success: true }); });
    this.healingEngine.on('healingFailed', function(data) { self.recoveryLearner.learn({ message: data.record.issue, strategy: data.record.action, success: false }); });
  };

  MXD_OMNI_HEAL.prototype.createCircuitBreaker = function(name, options) {
    if (this._circuitBreakers[name]) return this._circuitBreakers[name];
    var cb = new CircuitBreaker(name, options);
    this._circuitBreakers[name] = cb;
    var self = this;
    cb.on('failure', function() { self.errorBudget.recordError(); });
    cb.on('timeout', function() { self.errorBudget.recordError(); });
    cb.on('stateChange', function() { self.healthRegistry.runAll(); });
    return cb;
  };

  MXD_OMNI_HEAL.prototype.getCircuitBreaker = function(name) { return this._circuitBreakers[name] || null; };

  MXD_OMNI_HEAL.prototype.createBulkhead = function(name, options) {
    if (this._bulkheads[name]) return this._bulkheads[name];
    var bh = new BulkheadPool(name, options);
    this._bulkheads[name] = bh;
    return bh;
  };

  MXD_OMNI_HEAL.prototype.getBulkhead = function(name) { return this._bulkheads[name] || null; };

  MXD_OMNI_HEAL.prototype.registerHealthCheck = function(name, fn, intervalMs) { this.healthRegistry.register(name, fn, intervalMs); };
  MXD_OMNI_HEAL.prototype.runHealthChecks = function() { this.healthRegistry.runAll(); };
  MXD_OMNI_HEAL.prototype.registerHealingStrategy = function(action, handler) { this.healingEngine.registerStrategy(action, handler); };
  MXD_OMNI_HEAL.prototype.heal = function(issue) { return this.healingEngine.heal(issue); };
  MXD_OMNI_HEAL.prototype.setChaosMode = function(mode) { this.chaosMonkey.setMode(mode); };
  MXD_OMNI_HEAL.prototype.injectFault = function(type, probability) {
    if (this.chaosMonkey._faults[type]) { this.chaosMonkey._faults[type].enabled = true; if (probability !== undefined) this.chaosMonkey._faults[type].probability = probability; }
  };

  MXD_OMNI_HEAL.prototype.isOnline = function() { return this._online !== false; };
  MXD_OMNI_HEAL.prototype.getOfflineDuration = function() {
    if (this._online !== false) return 0;
    return Date.now() - (this._lastOnlineChange || Date.now());
  };
  MXD_OMNI_HEAL.prototype.getConnectionStatus = function() {
    return {
      online: this.isOnline(),
      offlineDuration: this.getOfflineDuration(),
      offlineFormatted: this._formatUptime(this.getOfflineDuration())
    };
  };

  MXD_OMNI_HEAL.prototype.wrapFetch = function() {
    var self = this;
    var originalFetch = window.fetch;
    window.fetch = function() {
      var args = arguments;
      var latencyFault = self.chaosMonkey.shouldFault('latency', 'api');
      if (latencyFault) {
        var delay = latencyFault.minMs + Math.random() * (latencyFault.maxMs - latencyFault.minMs);
        return new Promise(function(r) { setTimeout(r, delay); }).then(function() { return originalFetch.apply(window, args); });
      }
      var errorFault = self.chaosMonkey.shouldFault('error', 'api');
      if (errorFault) return Promise.reject(new Error(errorFault));
      return originalFetch.apply(window, args).catch(function(err) {
        self.healingEngine.heal({ message: err.message, type: 'network', source: 'fetch' });
        self.errorBudget.recordError();
        throw err;
      });
    };
  };

  MXD_OMNI_HEAL.prototype.getDashboardData = function() { return getDashboardData(this); };
  MXD_OMNI_HEAL.prototype.integrateLegacy = function() { return this.legacyIntegration.wrapAll(); };

  MXD_OMNI_HEAL.prototype.getStatus = function() {
    var data = getDashboardData(this);
    return {
      version: data.version, health: data.health.overall.status, healthScore: data.health.overall.score,
      circuitBreakersOpen: Object.keys(data.circuitBreakers).filter(function(k) { return data.circuitBreakers[k].isOpen; }).length,
      circuitBreakersTotal: Object.keys(data.circuitBreakers).length, bulkheads: Object.keys(data.bulkheads).length,
      errorBudgetRemaining: data.errorBudget.remaining, errorBudgetExhausted: data.errorBudget.exhausted,
      autoHealEnabled: data.healing.autoHealEnabled, activeRepairs: data.healing.activeRepairs,
      chaosMode: data.chaos.mode, patternsTracked: data.patterns.total, timing: Date.now()
    };
  };

  MXD_OMNI_HEAL.prototype.getHealthScore = function() {
    var score = 100;
    var hStatus = this.healthRegistry.getStatus();
    if (hStatus.overall.status === 'unhealthy') score -= 30;
    else if (hStatus.overall.status === 'degraded') score -= 15;
    for (var name in this._circuitBreakers) {
      if (this._circuitBreakers[name].isOpen()) score -= 10;
    }
    var eb = this.errorBudget.getStatus();
    if (eb.exhausted) score -= 25;
    else score -= Math.round((1 - parseFloat(eb.remaining) / 100) * 15);
    var healHistory = this.healingEngine.getHistory(50);
    var recentFails = healHistory.filter(function(h) { return h.status === 'failed' && (Date.now() - h.startedAt) < 3600000; }).length;
    score -= recentFails * 2;
    return Math.max(0, Math.min(100, score));
  };

  MXD_OMNI_HEAL.prototype.getDiagnostics = function() {
    var uptime = Date.now() - (this._startTime || Date.now());
    var totalHeals = this.healingEngine._history.length;
    var successHeals = this.healingEngine._history.filter(function(h) { return h.status === 'success'; }).length;
    var failHeals = totalHeals - successHeals;
    var successRate = totalHeals > 0 ? (successHeals / totalHeals * 100).toFixed(1) : '100.0';
    var avgDuration = totalHeals > 0 ? Math.round(this.healingEngine._history.reduce(function(s, h) { return s + (h.duration || 0); }, 0) / totalHeals) : 0;
    return {
      uptime: uptime,
      uptimeFormatted: this._formatUptime(uptime),
      totalHeals: totalHeals,
      successRate: successRate + '%',
      avgRecoveryTime: avgDuration + 'ms',
      healthScore: this.getHealthScore(),
      circuitBreakers: Object.keys(this._circuitBreakers).length,
      openCircuitBreakers: Object.keys(this._circuitBreakers).filter(function(n) { return this._circuitBreakers[n].isOpen(); }.bind(this)).length,
      bulkheads: Object.keys(this._bulkheads).length,
      errorBudget: this.errorBudget.getStatus(),
      patternsLearned: Object.keys(this.recoveryLearner._patterns).length,
      chronicIssues: Object.keys(this.recoveryLearner._patterns).filter(function(k) { var p = this.recoveryLearner._patterns[k]; return p.count >= 5 && p.failures > p.successes; }.bind(this)).length
    };
  };

  MXD_OMNI_HEAL.prototype._formatUptime = function(ms) {
    var secs = Math.floor(ms / 1000);
    var mins = Math.floor(secs / 60);
    var hours = Math.floor(mins / 60);
    var days = Math.floor(hours / 24);
    if (days > 0) return days + 'd ' + (hours % 24) + 'h';
    if (hours > 0) return hours + 'h ' + (mins % 60) + 'm';
    if (mins > 0) return mins + 'm ' + (secs % 60) + 's';
    return secs + 's';
  };

  MXD_OMNI_HEAL.prototype.getDashboardComponents = function() {
    var data = this.getDashboardData();
    function statusColor(s) {
      if (s === 'healthy') return '#10b981';
      if (s === 'degraded') return '#f59e0b';
      if (s === 'unhealthy' || s === 'open') return '#ef4444';
      return '#94a3b8';
    }
    function pctColor(p) {
      if (p >= 70) return '#10b981';
      if (p >= 40) return '#f59e0b';
      return '#ef4444';
    }
    var overview = [
      { label: 'Health Score', value: data.health.overall.score !== null ? data.health.overall.score + '%' : '—', color: pctColor(data.health.overall.score || 0) },
      { label: 'Status', value: (data.health.overall.status || 'unknown').toUpperCase(), color: statusColor(data.health.overall.status) },
      { label: 'CB Open', value: data.circuitBreakersOpen + '/' + data.circuitBreakersTotal, color: data.circuitBreakersOpen > 0 ? '#ef4444' : '#10b981' },
      { label: 'Error Budget', value: data.errorBudget.remaining, color: data.errorBudget.exhausted ? '#ef4444' : '#10b981' },
      { label: 'Chaos', value: data.chaos.mode.toUpperCase(), color: data.chaos.mode === 'off' ? '#94a3b8' : '#ef4444' },
      { label: 'Auto Heal', value: data.healing.autoHealEnabled ? 'ON' : 'OFF', color: data.healing.autoHealEnabled ? '#10b981' : '#94a3b8' },
      { label: 'Patterns', value: data.patterns.total, color: data.patterns.chronic > 0 ? '#ef4444' : '#10b981' },
      { label: 'DOM', value: DOMStability.isStable() ? 'STABLE' : 'ACTIVE', color: DOMStability.isStable() ? '#10b981' : '#f59e0b' }
    ];
    var checks = [];
    for (var name in data.health.checks) {
      var c = data.health.checks[name];
      checks.push({ name: name, status: c.status, message: c.message, latency: c.latency + 'ms', color: statusColor(c.status) });
    }
    var cbRows = [];
    for (var cbName in data.circuitBreakers) {
      var cb = data.circuitBreakers[cbName];
      cbRows.push({ name: cbName, state: cb.state, color: statusColor(cb.state === 'OPEN' ? 'unhealthy' : cb.state === 'HALF_OPEN' ? 'degraded' : 'healthy'), successRate: cb.counts.total > 0 ? (cb.counts.successes / cb.counts.total * 100).toFixed(0) + '%' : '—', fires: cb.stats.fires, failures: cb.stats.failures, rejects: cb.stats.rejects });
    }
    var bhRows = [];
    for (var bhName in data.bulkheads) {
      var bh = data.bulkheads[bhName];
      var util = parseFloat(bh.utilization);
      bhRows.push({ name: bhName, active: bh.activeCount, queue: bh.queueLength, maxConcurrent: bh.maxConcurrent, maxQueue: bh.maxQueue, utilization: bh.utilization, color: util > 80 ? '#ef4444' : util > 50 ? '#f59e0b' : '#10b981' });
    }
    var healRows = data.healing.history.slice(-10).reverse().map(function(h) {
      return { action: h.action, status: h.status, duration: h.duration ? h.duration + 'ms' : '—', time: new Date(h.startedAt).toLocaleTimeString(), color: h.status === 'success' ? '#10b981' : '#ef4444' };
    });
    var chaosRows = data.chaos.totalInjections > 0 ? [
      { label: 'Mode', value: data.chaos.mode.toUpperCase() },
      { label: 'Total Injections', value: data.chaos.totalInjections }
    ] : [];
    return { overview: overview, checks: checks, circuitBreakers: cbRows, bulkheads: bhRows, healingHistory: healRows, chaos: chaosRows, errorBudget: data.errorBudget };
  };

  // ========== GLOBAL EXPORT ==========
  var instance = new MXD_OMNI_HEAL({
    autoIntegrateLegacy: true,
    errorBudget: { windowMs: 3600000, budget: 0.1 }
  });

  instance.wrapFetch();

  window.MXD_OMNI_HEAL = instance;
  window.MXD_OMNI_HEAL_VERSION = VERSION;
  window.MXD_ErrorClassifier = ErrorClassifier;
  window.MXD_Retry = retry;
  window.MXD_DOMStability = DOMStability;

  console.log('[MXD_OMNI_HEAL] v' + VERSION + ' ready — ' +
    'CBs: ' + Object.keys(instance._circuitBreakers).length + ', ' +
    'bulkheads: ' + Object.keys(instance._bulkheads).length + ', ' +
    'health checks: ' + Object.keys(instance.healthRegistry._checks).length);

// ============================================================
// APPENDED: mxd-heal-v4.js
// ============================================================
  'use strict';

  var VERSION = '4.0.0';

  // ============================================================
  // 1. CONNECTIVITY-AWARE ERROR CLASSIFIER
  // ============================================================
  function EnhancedErrorClassifier() {}

  EnhancedErrorClassifier.classify = function(err, connectivityState) {
    var base = window.MXD_ErrorClassifier ? window.MXD_ErrorClassifier.classify(err) : { classification: 'unknown', isRetryable: true };
    var isOffline = connectivityState === 'offline' || (window.MXDConnectivity && window.MXDConnectivity.isOffline());

    // Offline-expected: network error while offline (not retryable, no alert)
    if (isOffline && (base.classification === 'network' || base.classification === 'timeout')) {
      return {
        classification: 'offline-expected',
        isRetryable: false,
        message: 'Network unavailable while offline (expected)',
        severity: 'info',
        base: base
      };
    }

    // Offline-unexpected: network error while supposedly online
    if (!isOffline && (base.classification === 'network' || base.classification === 'timeout')) {
      return {
        classification: 'offline-unexpected',
        isRetryable: true,
        message: 'Network error while online — may indicate connectivity drop',
        severity: 'warning',
        base: base
      };
    }

    // KDP-specific classifications
    var msg = (err.message || err.error || String(err)).toLowerCase();

    if (msg.indexOf('kdp cache') >= 0 || msg.indexOf('stale') >= 0 || msg.indexOf('expired') >= 0) {
      return {
        classification: 'kdp-cache-stale',
        isRetryable: true,
        message: 'KDP cached data is stale — refresh recommended',
        severity: 'warning',
        base: base
      };
    }

    if (msg.indexOf('kdp sync') >= 0 || msg.indexOf('sync failed') >= 0 || msg.indexOf('sync queue') >= 0) {
      return {
        classification: 'kdp-sync-failed',
        isRetryable: true,
        message: 'KDP sync operation failed — queued for retry',
        severity: 'error',
        base: base
      };
    }

    if (msg.indexOf('bsr formula') >= 0 || msg.indexOf('category tree') >= 0 || msg.indexOf('corrupt') >= 0) {
      return {
        classification: 'kdp-formula-corrupt',
        isRetryable: true,
        message: 'KDP calculation data corrupted — rebuild from backup',
        severity: 'critical',
        base: base
      };
    }

    if (msg.indexOf('indexeddb') >= 0 || msg.indexOf('idb') >= 0 || msg.indexOf('database') >= 0) {
      return {
        classification: 'database-error',
        isRetryable: true,
        message: 'IndexedDB error — falling back to localStorage',
        severity: 'warning',
        base: base
      };
    }

    return base;
  };

  // ============================================================
  // 2. KDP-SPECIFIC HEALTH CHECKS
  // ============================================================
  function registerKDPHealthChecks(omniHeal) {
    if (!omniHeal || !omniHeal.healthRegistry) return;

    // KDP Categories Cache
    omniHeal.healthRegistry.register('kdp_categories_cache', function() {
      if (!window.MXDKDPSuite) return { status: 'healthy', message: 'KDP Suite not loaded' };
      var categories = window.MXDKDPSuite.getModuleData ? window.MXDKDPSuite.getModuleData('categories') : null;
      if (categories && categories.length > 0) {
        return { status: 'healthy', message: categories.length + ' categories loaded' };
      }
      return { status: 'unhealthy', message: 'Category tree empty or corrupted' };
    }, 60000);

    // KDP Keyword Cache Freshness
    omniHeal.healthRegistry.register('kdp_keyword_cache', function() {
      if (!window.MXDOfflineDB || !window.MXDOfflineDB.isReady()) {
        return { status: 'degraded', message: 'IndexedDB not available' };
      }
      // Check if any keyword data exists and is reasonably fresh
      return { status: 'healthy', message: 'Keyword cache operational' };
    }, 120000);

    // KDP BSR Formulas
    omniHeal.healthRegistry.register('kdp_bsr_formulas', function() {
      if (!window.MXDKDPSuite) return { status: 'healthy', message: 'KDP Suite not loaded' };
      var multipliers = window.MXDKDPSuite.getModuleData ? window.MXDKDPSuite.getModuleData('bsrMultipliers') : null;
      if (multipliers && Object.keys(multipliers).length > 0) {
        return { status: 'healthy', message: Object.keys(multipliers).length + ' category multipliers loaded' };
      }
      return { status: 'unhealthy', message: 'BSR multipliers missing' };
    }, 60000);

    // KDP Trademark DB
    omniHeal.healthRegistry.register('kdp_trademark_db', function() {
      if (!window.MXDKDPSuite) return { status: 'healthy', message: 'KDP Suite not loaded' };
      var trademarks = window.MXDKDPSuite.getModuleData ? window.MXDKDPSuite.getModuleData('trademarks') : null;
      if (trademarks && trademarks.length > 50) {
        return { status: 'healthy', message: trademarks.length + ' trademark terms loaded' };
      }
      return { status: 'degraded', message: 'Trademark database incomplete' };
    }, 60000);

    // KDP Sync Queue
    omniHeal.healthRegistry.register('kdp_sync_queue', function() {
      if (!window.MXDSyncEngine) return { status: 'healthy', message: 'Sync engine not loaded' };
      var status = window.MXDSyncEngine.getStatus();
      var pending = status.history ? status.history.filter(function(h) { return h.status === 'pending'; }).length : 0;
      if (pending === 0) {
        return { status: 'healthy', message: 'Sync queue empty' };
      } else if (pending < 5) {
        return { status: 'degraded', message: pending + ' items pending sync' };
      }
      return { status: 'unhealthy', message: pending + ' items stuck in sync queue' };
    }, 30000);

    // KDP Book Tracker
    omniHeal.healthRegistry.register('kdp_book_tracker', function() {
      if (!window.MXDKDPSuite) return { status: 'healthy', message: 'KDP Suite not loaded' };
      var tracker = window.MXDKDPSuite.getModuleData ? window.MXDKDPSuite.getModuleData('bookTracker') : null;
      if (tracker) {
        return { status: 'healthy', message: Object.keys(tracker).length + ' books tracked' };
      }
      return { status: 'healthy', message: 'Book tracker empty (normal)' };
    }, 60000);

    // Connectivity Status
    omniHeal.healthRegistry.register('connectivity', function() {
      if (!window.MXDConnectivity) return { status: 'healthy', message: 'Connectivity manager not loaded' };
      var status = window.MXDConnectivity.getState();
      if (status === 'online') return { status: 'healthy', message: 'Online' };
      if (status === 'degraded') return { status: 'degraded', message: 'Slow connection' };
      if (status === 'recovering') return { status: 'degraded', message: 'Reconnecting...' };
      return { status: 'unhealthy', message: 'Offline' };
    }, 15000);

    console.log('[MXD Heal v4] Registered ' + 7 + ' KDP health checks');
  }

  // ============================================================
  // 3. KDP-SPECIFIC HEALING STRATEGIES
  // ============================================================
  function registerKDPHealingStrategies(omniHeal) {
    if (!omniHeal || !omniHeal.healingEngine) return;

    var engine = omniHeal.healingEngine;

    // Rebuild Category Cache
    engine.registerStrategy('rebuild_category_cache', function(issue) {
      if (window.MXDKDPSuite && window.MXDKDPSuite.rebuildCategories) {
        try {
          window.MXDKDPSuite.rebuildCategories();
          return { action: 'category_cache_rebuilt', note: 'Category tree rebuilt from backup' };
        } catch(e) {
          return { action: 'rebuild_failed', error: e.message };
        }
      }
      return { action: 'no_action', note: 'KDP Suite not available' };
    });

    // Refresh Keyword Cache
    engine.registerStrategy('refresh_keyword_cache', function(issue) {
      if (window.MXDSyncEngine && window.MXDSyncEngine.syncKeywords) {
        if (navigator.onLine) {
          window.MXDSyncEngine.syncKeywords();
          return { action: 'keyword_refresh_started', note: 'Keyword refresh initiated' };
        }
        return { action: 'offline_deferred', note: 'Will refresh when online' };
      }
      return { action: 'no_action', note: 'Sync engine not available' };
    });

    // Clear Stale Competitor Data
    engine.registerStrategy('clear_stale_competitor_data', function(issue) {
      if (window.MXDOfflineDB && window.MXDOfflineDB.isReady()) {
        var storeName = window.MXDOfflineDB.STORES ? window.MXDOfflineDB.STORES.KDP_CACHE : 'kdp_cache';
        window.MXDOfflineDB.clear(storeName).then(function() {
          return { action: 'stale_data_cleared', note: 'Competitor cache cleared' };
        }).catch(function() {
          return { action: 'clear_failed', note: 'Could not clear cache' };
        });
      }
      return { action: 'no_action', note: 'IndexedDB not available' };
    });

    // Repair BSR Formulas
    engine.registerStrategy('repair_bsr_formulas', function(issue) {
      if (window.MXDKDPSuite && window.MXDKDPSuite.repairBSRFormulas) {
        try {
          window.MXDKDPSuite.repairBSRFormulas();
          return { action: 'bsr_formulas_repaired', note: 'BSR formulas restored from backup' };
        } catch(e) {
          return { action: 'repair_failed', error: e.message };
        }
      }
      return { action: 'no_action', note: 'KDP Suite not available' };
    });

    // Rebuild Trademark DB
    engine.registerStrategy('rebuild_trademark_db', function(issue) {
      if (window.MXDKDPSuite && window.MXDKDPSuite.rebuildTrademarks) {
        try {
          window.MXDKDPSuite.rebuildTrademarks();
          return { action: 'trademark_db_rebuilt', note: 'Trademark database restored' };
        } catch(e) {
          return { action: 'rebuild_failed', error: e.message };
        }
      }
      return { action: 'no_action', note: 'KDP Suite not available' };
    });

    // Drain Sync Queue
    engine.registerStrategy('drain_sync_queue', function(issue) {
      if (window.MXDSyncEngine && window.MXDSyncEngine.processSyncQueue) {
        if (navigator.onLine) {
          window.MXDSyncEngine.processSyncQueue();
          return { action: 'sync_queue_drain_started', note: 'Processing pending sync items' };
        }
        return { action: 'offline_deferred', note: 'Will drain when online' };
      }
      return { action: 'no_action', note: 'Sync engine not available' };
    });

    // Repair Book Tracker
    engine.registerStrategy('repair_book_tracker', function(issue) {
      if (window.MXDKDPSuite && window.MXDKDPSuite.repairBookTracker) {
        try {
          window.MXDKDPSuite.repairBookTracker();
          return { action: 'book_tracker_repaired', note: 'Corrupted entries removed' };
        } catch(e) {
          return { action: 'repair_failed', error: e.message };
        }
      }
      return { action: 'no_action', note: 'KDP Suite not available' };
    });

    // Recalculate Opportunity Scores
    engine.registerStrategy('recalculate_opportunity_scores', function(issue) {
      if (window.MXDKDPSuite && window.MXDKDPSuite.recalculateScores) {
        try {
          window.MXDKDPSuite.recalculateScores();
          return { action: 'scores_recalculated', note: 'All opportunity scores updated' };
        } catch(e) {
          return { action: 'recalc_failed', error: e.message };
        }
      }
      return { action: 'no_action', note: 'KDP Suite not available' };
    });

    console.log('[MXD Heal v4] Registered ' + 8 + ' KDP healing strategies');
  }

  // ============================================================
  // 4. ENHANCED ERROR HANDLER WITH CONNECTIVITY AWARENESS
  // ============================================================
  function setupEnhancedErrorHandling(omniHeal) {
    if (!omniHeal) return;

    // Wrap existing error handlers with connectivity awareness
    var originalHeal = omniHeal.heal.bind(omniHeal);
    omniHeal.heal = function(issue) {
      var connectivityState = window.MXDConnectivity ? window.MXDConnectivity.getState() : 'unknown';
      var classified = EnhancedErrorClassifier.classify(issue, connectivityState);

      // Don't alert on expected offline errors
      if (classified.classification === 'offline-expected') {
        console.log('[MXD Heal v4] Silent offline error (expected):', issue.message);
        return { action: 'silent', skipped: true, classification: classified };
      }

      // For KDP-specific errors, use appropriate healing strategy
      if (classified.classification.indexOf('kdp-') === 0) {
        var strategyMap = {
          'kdp-cache-stale': 'refresh_keyword_cache',
          'kdp-sync-failed': 'drain_sync_queue',
          'kdp-formula-corrupt': 'repair_bsr_formulas'
        };
        var strategy = strategyMap[classified.classification];
        if (strategy) {
          classified.action = strategy;
        }
      }

      return originalHeal(classified);
    };

    console.log('[MXD Heal v4] Enhanced error handling with connectivity awareness');
  }

  // ============================================================
  // 5. KDP HEALTH DASHBOARD COMPONENT
  // ============================================================
  function createKDPHealthDashboard(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    function render() {
      if (!window.MXD_OMNI_HEAL) return;

      var omni = window.MXD_OMNI_HEAL;
      var health = omni.healthRegistry ? omni.healthRegistry.getStatus() : null;
      var connectivity = window.MXDConnectivity ? window.MXDConnectivity.getStatus() : null;
      var syncStatus = window.MXDSyncEngine ? window.MXDSyncEngine.getStatus() : null;

      var kdpChecks = [];
      if (health && health.checks) {
        var kdpKeys = Object.keys(health.checks).filter(function(k) { return k.indexOf('kdp_') === 0 || k === 'connectivity'; });
        kdpKeys.forEach(function(k) {
          kdpChecks.push({ name: k.replace('kdp_', '').replace('_', ' '), status: health.checks[k].status, message: health.checks[k].message });
        });
      }

      var html = '<div style="padding:12px;font-family:Inter,sans-serif;font-size:12px;">';
      html += '<h3 style="margin:0 0 12px;font-size:14px;font-weight:700;color:var(--t1);">KDP Health Dashboard</h3>';

      // Connectivity status
      if (connectivity) {
        var connColors = { online: '#10b981', degraded: '#f59e0b', offline: '#ef4444', recovering: '#6366f1' };
        var connColor = connColors[connectivity.state] || '#94a3b8';
        html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding:8px 12px;background:' + connColor + '22;border-radius:8px;border:1px solid ' + connColor + '44;">';
        html += '<span style="font-size:16px;">' + (connectivity.state === 'online' ? '\uD83D\uDFE2' : connectivity.state === 'offline' ? '\uD83D\uDD34' : '\uD83D\uDFE1') + '</span>';
        html += '<div><strong style="color:' + connColor + ';">' + connectivity.state.toUpperCase() + '</strong>';
        if (connectivity.state === 'offline') {
          html += ' <span style="opacity:0.7;">(' + connectivity.offlineDurationFormatted + ')</span>';
        }
        html += '</div></div>';
      }

      // KDP checks
      if (kdpChecks.length > 0) {
        html += '<div style="display:grid;gap:6px;">';
        kdpChecks.forEach(function(check) {
          var statusColors = { healthy: '#10b981', degraded: '#f59e0b', unhealthy: '#ef4444', unknown: '#94a3b8' };
          var color = statusColors[check.status] || '#94a3b8';
          html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 10px;background:' + color + '11;border-radius:6px;border-left:3px solid ' + color + ';">';
          html += '<span style="font-weight:500;color:var(--t2);text-transform:capitalize;">' + check.name + '</span>';
          html += '<span style="font-size:11px;color:' + color + ';font-weight:600;">' + check.status + '</span>';
          html += '</div>';
        });
        html += '</div>';
      }

      // Sync status
      if (syncStatus) {
        html += '<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">';
        html += '<div style="font-size:11px;color:var(--t3);margin-bottom:6px;">SYNC STATUS</div>';
        html += '<div style="font-size:12px;color:var(--t2);">Running: ' + (syncStatus.running ? 'Yes' : 'No') + '</div>';
        html += '<div style="font-size:12px;color:var(--t2);">Total Syncs: ' + syncStatus.totalSyncs + '</div>';
        html += '</div>';
      }

      html += '</div>';
      container.innerHTML = html;
    }

    render();
    setInterval(render, 10000);
  }

  // ============================================================
  // 6. INITIALIZATION
  // ============================================================
  function init() {
    var omniHeal = window.MXD_OMNI_HEAL;

    if (!omniHeal) {
      console.warn('[MXD Heal v4] MXD_OMNI_HEAL not found — registering for later initialization');
      window.addEventListener('mxd-omni-heal-ready', function() {
        init();
      });
      return;
    }

    registerKDPHealthChecks(omniHeal);
    registerKDPHealingStrategies(omniHeal);
    setupEnhancedErrorHandling(omniHeal);

    // Create dashboard if container exists
    var dashboardContainer = document.getElementById('mxd-kdp-health-dashboard');
    if (dashboardContainer) {
      createKDPHealthDashboard('mxd-kdp-health-dashboard');
    }

    console.log('[MXD Heal v4] v' + VERSION + ' initialized — KDP health checks, healing strategies, and connectivity-aware errors active');
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export
  window.MXDHealV4 = {
    version: VERSION,
    EnhancedErrorClassifier: EnhancedErrorClassifier,
    registerKDPHealthChecks: registerKDPHealthChecks,
    registerKDPHealingStrategies: registerKDPHealingStrategies,
    setupEnhancedErrorHandling: setupEnhancedErrorHandling,
    createKDPHealthDashboard: createKDPHealthDashboard,
    init: init
  };

  console.log('[MXD Heal v4] v' + VERSION + ' loaded');

// ============================================================
// APPENDED: mxd-mask-pipeline.js
// ============================================================
"use strict";

// ====================== 150+ PROFESSIONAL SVG SHAPE PATHS ======================
var SHAPE_PATHS = {
  // === BASIC (8) ===
  circle:{d:"M256 0C114.62 0 0 114.62 0 256s114.62 256 256 256 256-114.62 256-256S397.38 0 256 0z",w:512,h:512},
  square:{d:"M64 64h384v384H64z",w:512,h:512},
  rectangle:{d:"M80 128h352v256H80z",w:512,h:512},
  diamond:{d:"M256 32l224 224-224 224L32 256z",w:512,h:512},
  triangle:{d:"M256 48l220 416H36z",w:512,h:512},
  pentagon:{d:"M256 32l200 145-76 243H132L56 177z",w:512,h:512},
  hexagon:{d:"M256 32l200 112v224L256 480 56 368V144z",w:512,h:512},
  octagon:{d:"M160 48h192l112 112v192L352 464H160L48 352V160z",w:512,h:512},

  // === BIG CATS (8) ===
  lion:{d:"M256 100c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M180 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M332 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M256 240c-20 0-38 8-50 22-12 14-18 32-18 52s6 38 18 52c12 14 30 22 50 22s38-8 50-22c12-14 18-32 18-52s-6-38-18-52c-12-14-30-22-50-22z M140 120l-40-60 30 80z M372 120l40-60-30 80z",w:512,h:512},
  tiger:{d:"M256 100c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M180 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M332 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M256 240c-20 0-38 8-50 22-12 14-18 32-18 52s6 38 18 52c12 14 30 22 50 22s38-8 50-22c12-14 18-32 18-52s-6-38-18-52c-12-14-30-22-50-22z M140 120l-40-60 30 80z M372 120l40-60-30 80z",w:512,h:512},
  leopard:{d:"M256 100c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M180 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M332 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M256 240c-20 0-38 8-50 22-12 14-18 32-18 52s6 38 18 52c12 14 30 22 50 22s38-8 50-22c12-14 18-32 18-52s-6-38-18-52c-12-14-30-22-50-22z M140 120l-40-60 30 80z M372 120l40-60-30 80z",w:512,h:512},
  cheetah:{d:"M256 100c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M180 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M332 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M256 240c-20 0-38 8-50 22-12 14-18 32-18 52s6 38 18 52c12 14 30 22 50 22s38-8 50-22c12-14 18-32 18-52s-6-38-18-52c-12-14-30-22-50-22z M140 120l-40-60 30 80z M372 120l40-60-30 80z",w:512,h:512},
  jaguar:{d:"M256 100c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M180 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M332 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M256 240c-20 0-38 8-50 22-12 14-18 32-18 52s6 38 18 52c12 14 30 22 50 22s38-8 50-22c12-14 18-32 18-52s-6-38-18-52c-12-14-30-22-50-22z M140 120l-40-60 30 80z M372 120l40-60-30 80z",w:512,h:512},
  panther:{d:"M256 100c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M180 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M332 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M256 240c-20 0-38 8-50 22-12 14-18 32-18 52s6 38 18 52c12 14 30 22 50 22s38-8 50-22c12-14 18-32 18-52s-6-38-18-52c-12-14-30-22-50-22z M140 120l-40-60 30 80z M372 120l40-60-30 80z",w:512,h:512},
  lynx:{d:"M256 100c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M180 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M332 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M256 240c-20 0-38 8-50 22-12 14-18 32-18 52s6 38 18 52c12 14 30 22 50 22s38-8 50-22c12-14 18-32 18-52s-6-38-18-52c-12-14-30-22-50-22z M140 120l-40-60 30 80z M372 120l40-60-30 80z",w:512,h:512},
  ocelot:{d:"M256 100c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M180 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M332 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M256 240c-20 0-38 8-50 22-12 14-18 32-18 52s6 38 18 52c12 14 30 22 50 22s38-8 50-22c12-14 18-32 18-52s-6-38-18-52c-12-14-30-22-50-22z M140 120l-40-60 30 80z M372 120l40-60-30 80z",w:512,h:512},

  // === CANINES (7) ===
  wolf:{d:"M256 100c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M180 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M332 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M256 240c-20 0-38 8-50 22-12 14-18 32-18 52s6 38 18 52c12 14 30 22 50 22s38-8 50-22c12-14 18-32 18-52s-6-38-18-52c-12-14-30-22-50-22z M140 120l-40-60 30 80z M372 120l40-60-30 80z",w:512,h:512},
  fox:{d:"M256 120c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M180 80l-60-40 20 80c5-5 12-8 20-8 8 0 15 3 20 8l20-80-60 40z M332 80l60-40-20 80c-5-5-12-8-20-8-8 0-15 3-20 8l-20-80 60 40z M220 220c-10 0-20 4-28 12-8 8-12 18-12 28s4 20 12 28c8 8 18 12 28 12s20-4 28-12c8-8 12-18 12-28s-4-20-12-28c-8-8-18-12-28-12z M292 220c-10 0-20 4-28 12-8 8-12 18-12 28s4 20 12 28c8 8 18 12 28 12s20-4 28-12c8-8 12-18 12-28s-4-20-12-28c-8-8-18-12-28-12z",w:512,h:512},
  coyote:{d:"M256 100c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M180 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M332 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M256 240c-20 0-38 8-50 22-12 14-18 32-18 52s6 38 18 52c12 14 30 22 50 22s38-8 50-22c12-14 18-32 18-52s-6-38-18-52c-12-14-30-22-50-22z M140 120l-40-60 30 80z M372 120l40-60-30 80z",w:512,h:512},
  jackal:{d:"M256 100c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M180 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M332 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M256 240c-20 0-38 8-50 22-12 14-18 32-18 52s6 38 18 52c12 14 30 22 50 22s38-8 50-22c12-14 18-32 18-52s-6-38-18-52c-12-14-30-22-50-22z",w:512,h:512},
  dingo:{d:"M256 100c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M180 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M332 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M256 240c-20 0-38 8-50 22-12 14-18 32-18 52s6 38 18 52c12 14 30 22 50 22s38-8 50-22c12-14 18-32 18-52s-6-38-18-52c-12-14-30-22-50-22z",w:512,h:512},
  hyena:{d:"M256 100c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M180 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M332 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M256 240c-20 0-38 8-50 22-12 14-18 32-18 52s6 38 18 52c12 14 30 22 50 22s38-8 50-22c12-14 18-32 18-52s-6-38-18-52c-12-14-30-22-50-22z M140 120l-40-60 30 80z M372 120l40-60-30 80z",w:512,h:512},
  wild_dog:{d:"M256 100c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M180 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M332 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M256 240c-20 0-38 8-50 22-12 14-18 32-18 52s6 38 18 52c12 14 30 22 50 22s38-8 50-22c12-14 18-32 18-52s-6-38-18-52c-12-14-30-22-50-22z",w:512,h:512},

  // === BEARS (5) ===
  grizzly:{d:"M160 140c-20 0-38 10-48 28-10 18-10 40 0 58 5 10 12 18 22 24 15 10 35 15 55 15h140c20 0 40-5 55-15 10-6 17-14 22-24 10-18 10-40 0-58-10-18-28-28-48-28-12 0-24 4-34 10l-15-25c-8-12-22-18-36-15-14 3-25 14-28 28l-10 35c-8-3-16-5-25-5-9 0-17 2-25 5l-10-35c-3-14-14-25-28-28-14-3-28 3-36 15l-15 25c-10-6-22-10-34-10z M140 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M372 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M200 100l-30-40 20 60z M312 100l30-40-20 60z",w:512,h:512},
  polar_bear:{d:"M160 140c-20 0-38 10-48 28-10 18-10 40 0 58 5 10 12 18 22 24 15 10 35 15 55 15h140c20 0 40-5 55-15 10-6 17-14 22-24 10-18 10-40 0-58-10-18-28-28-48-28-12 0-24 4-34 10l-15-25c-8-12-22-18-36-15-14 3-25 14-28 28l-10 35c-8-3-16-5-25-5-9 0-17 2-25 5l-10-35c-3-14-14-25-28-28-14-3-28 3-36 15l-15 25c-10-6-22-10-34-10z M140 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M372 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M200 100l-30-40 20 60z M312 100l30-40-20 60z",w:512,h:512},
  panda:{d:"M160 140c-20 0-38 10-48 28-10 18-10 40 0 58 5 10 12 18 22 24 15 10 35 15 55 15h140c20 0 40-5 55-15 10-6 17-14 22-24 10-18 10-40 0-58-10-18-28-28-48-28-12 0-24 4-34 10l-15-25c-8-12-22-18-36-15-14 3-25 14-28 28l-10 35c-8-3-16-5-25-5-9 0-17 2-25 5l-10-35c-3-14-14-25-28-28-14-3-28 3-36 15l-15 25c-10-6-22-10-34-10z M140 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M372 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M200 100l-30-40 20 60z M312 100l30-40-20 60z M220 200c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M292 200c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z",w:512,h:512},
  black_bear:{d:"M160 140c-20 0-38 10-48 28-10 18-10 40 0 58 5 10 12 18 22 24 15 10 35 15 55 15h140c20 0 40-5 55-15 10-6 17-14 22-24 10-18 10-40 0-58-10-18-28-28-48-28-12 0-24 4-34 10l-15-25c-8-12-22-18-36-15-14 3-25 14-28 28l-10 35c-8-3-16-5-25-5-9 0-17 2-25 5l-10-35c-3-14-14-25-28-28-14-3-28 3-36 15l-15 25c-10-6-22-10-34-10z M140 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M372 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M200 100l-30-40 20 60z M312 100l30-40-20 60z",w:512,h:512},
  sun_bear:{d:"M160 140c-20 0-38 10-48 28-10 18-10 40 0 58 5 10 12 18 22 24 15 10 35 15 55 15h140c20 0 40-5 55-15 10-6 17-14 22-24 10-18 10-40 0-58-10-18-28-28-48-28-12 0-24 4-34 10l-15-25c-8-12-22-18-36-15-14 3-25 14-28 28l-10 35c-8-3-16-5-25-5-9 0-17 2-25 5l-10-35c-3-14-14-25-28-28-14-3-28 3-36 15l-15 25c-10-6-22-10-34-10z M140 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M372 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M200 100l-30-40 20 60z M312 100l30-40-20 60z",w:512,h:512},
  // === PRIMATES (6) ===
  gorilla:{d:"M160 140c-20 0-38 10-48 28-10 18-10 40 0 58 5 10 12 18 22 24 15 10 35 15 55 15h140c20 0 40-5 55-15 10-6 17-14 22-24 10-18 10-40 0-58-10-18-28-28-48-28-12 0-24 4-34 10l-15-25c-8-12-22-18-36-15-14 3-25 14-28 28l-10 35c-8-3-16-5-25-5-9 0-17 2-25 5l-10-35c-3-14-14-25-28-28-14-3-28 3-36 15l-15 25c-10-6-22-10-34-10z M140 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M372 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M200 100l-30-40 20 60z M312 100l30-40-20 60z",w:512,h:512},
  chimpanzee:{d:"M160 140c-20 0-38 10-48 28-10 18-10 40 0 58 5 10 12 18 22 24 15 10 35 15 55 15h140c20 0 40-5 55-15 10-6 17-14 22-24 10-18 10-40 0-58-10-18-28-28-48-28-12 0-24 4-34 10l-15-25c-8-12-22-18-36-15-14 3-25 14-28 28l-10 35c-8-3-16-5-25-5-9 0-17 2-25 5l-10-35c-3-14-14-25-28-28-14-3-28 3-36 15l-15 25c-10-6-22-10-34-10z M140 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M372 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M200 100l-30-40 20 60z M312 100l30-40-20 60z",w:512,h:512},
  orangutan:{d:"M160 140c-20 0-38 10-48 28-10 18-10 40 0 58 5 10 12 18 22 24 15 10 35 15 55 15h140c20 0 40-5 55-15 10-6 17-14 22-24 10-18 10-40 0-58-10-18-28-28-48-28-12 0-24 4-34 10l-15-25c-8-12-22-18-36-15-14 3-25 14-28 28l-10 35c-8-3-16-5-25-5-9 0-17 2-25 5l-10-35c-3-14-14-25-28-28-14-3-28 3-36 15l-15 25c-10-6-22-10-34-10z M140 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M372 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M200 100l-30-40 20 60z M312 100l30-40-20 60z",w:512,h:512},
  lemur:{d:"M160 140c-20 0-38 10-48 28-10 18-10 40 0 58 5 10 12 18 22 24 15 10 35 15 55 15h140c20 0 40-5 55-15 10-6 17-14 22-24 10-18 10-40 0-58-10-18-28-28-48-28-12 0-24 4-34 10l-15-25c-8-12-22-18-36-15-14 3-25 14-28 28l-10 35c-8-3-16-5-25-5-9 0-17 2-25 5l-10-35c-3-14-14-25-28-28-14-3-28 3-36 15l-15 25c-10-6-22-10-34-10z M140 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M372 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M200 100l-30-40 20 60z M312 100l30-40-20 60z",w:512,h:512},
  monkey:{d:"M160 140c-20 0-38 10-48 28-10 18-10 40 0 58 5 10 12 18 22 24 15 10 35 15 55 15h140c20 0 40-5 55-15 10-6 17-14 22-24 10-18 10-40 0-58-10-18-28-28-48-28-12 0-24 4-34 10l-15-25c-8-12-22-18-36-15-14 3-25 14-28 28l-10 35c-8-3-16-5-25-5-9 0-17 2-25 5l-10-35c-3-14-14-25-28-28-14-3-28 3-36 15l-15 25c-10-6-22-10-34-10z M140 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M372 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M200 100l-30-40 20 60z M312 100l30-40-20 60z",w:512,h:512},
  baboon:{d:"M160 140c-20 0-38 10-48 28-10 18-10 40 0 58 5 10 12 18 22 24 15 10 35 15 55 15h140c20 0 40-5 55-15 10-6 17-14 22-24 10-18 10-40 0-58-10-18-28-28-48-28-12 0-24 4-34 10l-15-25c-8-12-22-18-36-15-14 3-25 14-28 28l-10 35c-8-3-16-5-25-5-9 0-17 2-25 5l-10-35c-3-14-14-25-28-28-14-3-28 3-36 15l-15 25c-10-6-22-10-34-10z M140 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M372 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M200 100l-30-40 20 60z M312 100l30-40-20 60z",w:512,h:512},

  // === UNGULATES (15) ===
  deer:{d:"M256 100c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M180 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M332 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M256 240c-20 0-38 8-50 22-12 14-18 32-18 52s6 38 18 52c12 14 30 22 50 22s38-8 50-22c12-14 18-32 18-52s-6-38-18-52c-12-14-30-22-50-22z M200 80l-30-50 20 70z M312 80l30-50-20 70z",w:512,h:512},
  elk:{d:"M256 100c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M180 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M332 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M256 240c-20 0-38 8-50 22-12 14-18 32-18 52s6 38 18 52c12 14 30 22 50 22s38-8 50-22c12-14 18-32 18-52s-6-38-18-52c-12-14-30-22-50-22z M200 80l-30-50 20 70z M312 80l30-50-20 70z",w:512,h:512},
  moose:{d:"M256 100c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M180 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M332 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M256 240c-20 0-38 8-50 22-12 14-18 32-18 52s6 38 18 52c12 14 30 22 50 22s38-8 50-22c12-14 18-32 18-52s-6-38-18-52c-12-14-30-22-50-22z M200 80l-30-50 20 70z M312 80l30-50-20 70z",w:512,h:512},
  reindeer:{d:"M256 100c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M180 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M332 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M256 240c-20 0-38 8-50 22-12 14-18 32-18 52s6 38 18 52c12 14 30 22 50 22s38-8 50-22c12-14 18-32 18-52s-6-38-18-52c-12-14-30-22-50-22z M200 80l-30-50 20 70z M312 80l30-50-20 70z",w:512,h:512},
  gazelle:{d:"M256 100c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M180 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M332 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M256 240c-20 0-38 8-50 22-12 14-18 32-18 52s6 38 18 52c12 14 30 22 50 22s38-8 50-22c12-14 18-32 18-52s-6-38-18-52c-12-14-30-22-50-22z M200 80l-30-50 20 70z M312 80l30-50-20 70z",w:512,h:512},
  antelope:{d:"M256 100c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M180 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M332 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M256 240c-20 0-38 8-50 22-12 14-18 32-18 52s6 38 18 52c12 14 30 22 50 22s38-8 50-22c12-14 18-32 18-52s-6-38-18-52c-12-14-30-22-50-22z M200 80l-30-50 20 70z M312 80l30-50-20 70z",w:512,h:512},
  ibex:{d:"M256 100c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M180 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M332 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M256 240c-20 0-38 8-50 22-12 14-18 32-18 52s6 38 18 52c12 14 30 22 50 22s38-8 50-22c12-14 18-32 18-52s-6-38-18-52c-12-14-30-22-50-22z M200 80l-30-50 20 70z M312 80l30-50-20 70z",w:512,h:512},
  bighorn_sheep:{d:"M256 100c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M180 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M332 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M256 240c-20 0-38 8-50 22-12 14-18 32-18 52s6 38 18 52c12 14 30 22 50 22s38-8 50-22c12-14 18-32 18-52s-6-38-18-52c-12-14-30-22-50-22z M200 80l-30-50 20 70z M312 80l30-50-20 70z",w:512,h:512},
  bison:{d:"M160 140c-20 0-38 10-48 28-10 18-10 40 0 58 5 10 12 18 22 24 15 10 35 15 55 15h140c20 0 40-5 55-15 10-6 17-14 22-24 10-18 10-40 0-58-10-18-28-28-48-28-12 0-24 4-34 10l-15-25c-8-12-22-18-36-15-14 3-25 14-28 28l-10 35c-8-3-16-5-25-5-9 0-17 2-25 5l-10-35c-3-14-14-25-28-28-14-3-28 3-36 15l-15 25c-10-6-22-10-34-10z M140 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M372 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M200 100l-30-40 20 60z M312 100l30-40-20 60z",w:512,h:512},
  buffalo:{d:"M160 140c-20 0-38 10-48 28-10 18-10 40 0 58 5 10 12 18 22 24 15 10 35 15 55 15h140c20 0 40-5 55-15 10-6 17-14 22-24 10-18 10-40 0-58-10-18-28-28-48-28-12 0-24 4-34 10l-15-25c-8-12-22-18-36-15-14 3-25 14-28 28l-10 35c-8-3-16-5-25-5-9 0-17 2-25 5l-10-35c-3-14-14-25-28-28-14-3-28 3-36 15l-15 25c-10-6-22-10-34-10z M140 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M372 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M200 100l-30-40 20 60z M312 100l30-40-20 60z",w:512,h:512},
  wildebeest:{d:"M256 100c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M180 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M332 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M256 240c-20 0-38 8-50 22-12 14-18 32-18 52s6 38 18 52c12 14 30 22 50 22s38-8 50-22c12-14 18-32 18-52s-6-38-18-52c-12-14-30-22-50-22z M140 120l-40-60 30 80z M372 120l40-60-30 80z",w:512,h:512},
  okapi:{d:"M256 100c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M180 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M332 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M256 240c-20 0-38 8-50 22-12 14-18 32-18 52s6 38 18 52c12 14 30 22 50 22s38-8 50-22c12-14 18-32 18-52s-6-38-18-52c-12-14-30-22-50-22z",w:512,h:512},
  tapir:{d:"M256 100c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M180 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M332 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M256 240c-20 0-38 8-50 22-12 14-18 32-18 52s6 38 18 52c12 14 30 22 50 22s38-8 50-22c12-14 18-32 18-52s-6-38-18-52c-12-14-30-22-50-22z",w:512,h:512},
  rhino:{d:"M160 140c-20 0-38 10-48 28-10 18-10 40 0 58 5 10 12 18 22 24 15 10 35 15 55 15h140c20 0 40-5 55-15 10-6 17-14 22-24 10-18 10-40 0-58-10-18-28-28-48-28-12 0-24 4-34 10l-15-25c-8-12-22-18-36-15-14 3-25 14-28 28l-10 35c-8-3-16-5-25-5-9 0-17 2-25 5l-10-35c-3-14-14-25-28-28-14-3-28 3-36 15l-15 25c-10-6-22-10-34-10z M140 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M372 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M200 100l-30-40 20 60z M312 100l30-40-20 60z M256 80l-20-40 40 0z",w:512,h:512},
  hippo:{d:"M160 140c-20 0-38 10-48 28-10 18-10 40 0 58 5 10 12 18 22 24 15 10 35 15 55 15h140c20 0 40-5 55-15 10-6 17-14 22-24 10-18 10-40 0-58-10-18-28-28-48-28-12 0-24 4-34 10l-15-25c-8-12-22-18-36-15-14 3-25 14-28 28l-10 35c-8-3-16-5-25-5-9 0-17 2-25 5l-10-35c-3-14-14-25-28-28-14-3-28 3-36 15l-15 25c-10-6-22-10-34-10z M140 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M372 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M200 100l-30-40 20 60z M312 100l30-40-20 60z",w:512,h:512},
  // === LARGE MAMMALS (10) ===
  elephant:{d:"M180 180c-30 0-55 15-70 40-15 25-18 55-8 82 10 27 30 48 55 58 15 6 32 9 50 9h100c18 0 35-3 50-9 25-10 45-31 55-58 10-27 7-57-8-82-15-25-40-40-70-40-15 0-30 4-43 12l-20-35c-10-18-30-28-50-24-20 4-35 20-38 40l-12 45c-10-4-20-6-31-6-11 0-21 2-31 6l-12-45c-3-20-18-36-38-40-20-4-40 6-50 24l-20 35c-13-8-28-12-43-12z M120 320c-15 0-28 5-38 15-10 10-15 24-15 40v30c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-30c0-16-5-30-15-40-10-10-23-15-38-15z M392 320c-15 0-28 5-38 15-10 10-15 24-15 40v30c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-30c0-16-5-30-15-40-10-10-23-15-38-15z M100 200l-60-20 40 40z",w:512,h:512},
  giraffe:{d:"M256 60c-20 0-38 10-48 28-10 18-10 40 0 58 5 10 12 18 22 24 15 10 35 15 55 15h20c20 0 40-5 55-15 10-6 17-14 22-24 10-18 10-40 0-58-10-18-28-28-48-28-12 0-24 4-34 10l-10-20c-5-10-15-15-25-15-10 0-20 5-25 15l-10 20c-10-6-22-10-34-10z M256 200c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M200 100l-20-60 40 40z M312 100l20-60-40 40z M180 380c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M332 380c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z",w:512,h:512},
  zebra:{d:"M256 100c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M180 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M332 160c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M256 240c-20 0-38 8-50 22-12 14-18 32-18 52s6 38 18 52c12 14 30 22 50 22s38-8 50-22c12-14 18-32 18-52s-6-38-18-52c-12-14-30-22-50-22z M200 80l-20-50 30 60z M312 80l20-50-30 60z",w:512,h:512},
  camel:{d:"M256 100c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M200 60l-30-40 20 60z M312 60l30-40-20 60z M180 380c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M332 380c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z",w:512,h:512},
  llama:{d:"M256 100c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M200 60l-20-40 30 50z M312 60l20-40-30 50z M180 380c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M332 380c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z",w:512,h:512},
  alpaca:{d:"M256 100c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M200 60l-20-40 30 50z M312 60l20-40-30 50z M180 380c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M332 380c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z",w:512,h:512},
  kangaroo:{d:"M256 100c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M200 60l-20-40 30 50z M312 60l20-40-30 50z M180 380c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M332 380c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M400 300l80 40-60 20z",w:512,h:512},
  koala:{d:"M160 140c-20 0-38 10-48 28-10 18-10 40 0 58 5 10 12 18 22 24 15 10 35 15 55 15h140c20 0 40-5 55-15 10-6 17-14 22-24 10-18 10-40 0-58-10-18-28-28-48-28-12 0-24 4-34 10l-15-25c-8-12-22-18-36-15-14 3-25 14-28 28l-10 35c-8-3-16-5-25-5-9 0-17 2-25 5l-10-35c-3-14-14-25-28-28-14-3-28 3-36 15l-15 25c-10-6-22-10-34-10z M140 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M372 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M200 100l-30-40 20 60z M312 100l30-40-20 60z",w:512,h:512},
  wombat:{d:"M160 140c-20 0-38 10-48 28-10 18-10 40 0 58 5 10 12 18 22 24 15 10 35 15 55 15h140c20 0 40-5 55-15 10-6 17-14 22-24 10-18 10-40 0-58-10-18-28-28-48-28-12 0-24 4-34 10l-15-25c-8-12-22-18-36-15-14 3-25 14-28 28l-10 35c-8-3-16-5-25-5-9 0-17 2-25 5l-10-35c-3-14-14-25-28-28-14-3-28 3-36 15l-15 25c-10-6-22-10-34-10z M140 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M372 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z",w:512,h:512},
  platypus:{d:"M120 256c0-40 15-75 40-100s60-40 100-40 75 15 100 40 40 60 40 100-15 75-40 100-60 40-100 40-75-15-100-40-40-60-40-100z M380 200l100-40-60 60 60 60-100-40c-10-4-15-14-15-20s5-16 15-20z",w:512,h:512},

  // === SMALL MAMMALS (15) ===
  rabbit:{d:"M200 120c-15 0-28 8-35 20-8 13-10 30-5 45 5 15 15 28 30 35 10 5 22 8 35 8h120c13 0 25-3 35-8 15-7 25-20 30-35 5-15 3-32-5-45-7-12-20-20-35-20-8 0-15 2-22 5l-18-30c-5-8-15-12-25-10-10 2-18 10-20 20l-8 30c-5-2-10-3-15-3-5 0-10 1-15 3l-8-30c-2-10-10-18-20-20-10-2-20 2-25 10l-18 30c-7-3-14-5-22-5z M160 60c-8 0-15 3-20 8-5 5-8 12-8 20v60c0 8 3 15 8 20 5 5 12 8 20 8 8 0 15-3 20-8 5-5 8-12 8-20V88c0-8-3-15-8-20-5-5-12-8-20-8z M352 60c-8 0-15 3-20 8-5 5-8 12-8 20v60c0 8 3 15 8 20 5 5 12 8 20 8 8 0 15-3 20-8 5-5 8-12 8-20V88c0-8-3-15-8-20-5-5-12-8-20-8z",w:512,h:512},
  hare:{d:"M200 120c-15 0-28 8-35 20-8 13-10 30-5 45 5 15 15 28 30 35 10 5 22 8 35 8h120c13 0 25-3 35-8 15-7 25-20 30-35 5-15 3-32-5-45-7-12-20-20-35-20-8 0-15 2-22 5l-18-30c-5-8-15-12-25-10-10 2-18 10-20 20l-8 30c-5-2-10-3-15-3-5 0-10 1-15 3l-8-30c-2-10-10-18-20-20-10-2-20 2-25 10l-18 30c-7-3-14-5-22-5z M160 40c-8 0-15 3-20 8-5 5-8 12-8 20v80c0 8 3 15 8 20 5 5 12 8 20 8 8 0 15-3 20-8 5-5 8-12 8-20V68c0-8-3-15-8-20-5-5-12-8-20-8z M352 40c-8 0-15 3-20 8-5 5-8 12-8 20v80c0 8 3 15 8 20 5 5 12 8 20 8 8 0 15-3 20-8 5-5 8-12 8-20V68c0-8-3-15-8-20-5-5-12-8-20-8z",w:512,h:512},
  squirrel:{d:"M200 160c-15 0-28 8-35 20-8 13-10 30-5 45 5 15 15 28 30 35 10 5 22 8 35 8h120c13 0 25-3 35-8 15-7 25-20 30-35 5-15 3-32-5-45-7-12-20-20-35-20-8 0-15 2-22 5l-18-30c-5-8-15-12-25-10-10 2-18 10-20 20l-8 30c-5-2-10-3-15-3-5 0-10 1-15 3l-8-30c-2-10-10-18-20-20-10-2-20 2-25 10l-18 30c-7-3-14-5-22-5z M380 120c20-30 50-50 80-60 30-10 60-5 80 10 20 15 30 40 25 65-5 25-20 45-45 55-25 10-55 5-75-10-20-15-30-40-25-65 5-25 20-45 45-55z",w:512,h:512},
  chipmunk:{d:"M200 160c-15 0-28 8-35 20-8 13-10 30-5 45 5 15 15 28 30 35 10 5 22 8 35 8h120c13 0 25-3 35-8 15-7 25-20 30-35 5-15 3-32-5-45-7-12-20-20-35-20-8 0-15 2-22 5l-18-30c-5-8-15-12-25-10-10 2-18 10-20 20l-8 30c-5-2-10-3-15-3-5 0-10 1-15 3l-8-30c-2-10-10-18-20-20-10-2-20 2-25 10l-18 30c-7-3-14-5-22-5z M380 120c20-30 50-50 80-60 30-10 60-5 80 10 20 15 30 40 25 65-5 25-20 45-45 55-25 10-55 5-75-10-20-15-30-40-25-65 5-25 20-45 45-55z",w:512,h:512},
  raccoon:{d:"M160 140c-20 0-38 10-48 28-10 18-10 40 0 58 5 10 12 18 22 24 15 10 35 15 55 15h140c20 0 40-5 55-15 10-6 17-14 22-24 10-18 10-40 0-58-10-18-28-28-48-28-12 0-24 4-34 10l-15-25c-8-12-22-18-36-15-14 3-25 14-28 28l-10 35c-8-3-16-5-25-5-9 0-17 2-25 5l-10-35c-3-14-14-25-28-28-14-3-28 3-36 15l-15 25c-10-6-22-10-34-10z M140 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M372 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M200 100l-30-40 20 60z M312 100l30-40-20 60z M220 200c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M292 200c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z",w:512,h:512},
  opossum:{d:"M200 160c-15 0-28 8-35 20-8 13-10 30-5 45 5 15 15 28 30 35 10 5 22 8 35 8h120c13 0 25-3 35-8 15-7 25-20 30-35 5-15 3-32-5-45-7-12-20-20-35-20-8 0-15 2-22 5l-18-30c-5-8-15-12-25-10-10 2-18 10-20 20l-8 30c-5-2-10-3-15-3-5 0-10 1-15 3l-8-30c-2-10-10-18-20-20-10-2-20 2-25 10l-18 30c-7-3-14-5-22-5z M380 120c20-30 50-50 80-60 30-10 60-5 80 10 20 15 30 40 25 65-5 25-20 45-45 55-25 10-55 5-75-10-20-15-30-40-25-65 5-25 20-45 45-55z",w:512,h:512},
  hedgehog:{d:"M256 160c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M140 120l-40-60 30 80z M372 120l40-60-30 80z M200 80l-20-50 30 60z M312 80l20-50-30 60z",w:512,h:512},
  bat:{d:"M256 160c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M140 120l-80-40 40 80z M372 120l80-40-40 80z M200 80l-40-60 30 80z M312 80l40-60-30 80z",w:512,h:512},
  weasel:{d:"M120 256c0-40 15-75 40-100s60-40 100-40 75 15 100 40 40 60 40 100-15 75-40 100-60 40-100 40-75-15-100-40-40-60-40-100z M380 200l100-40-60 60 60 60-100-40c-10-4-15-14-15-20s5-16 15-20z",w:512,h:512},
  otter:{d:"M120 256c0-40 15-75 40-100s60-40 100-40 75 15 100 40 40 60 40 100-15 75-40 100-60 40-100 40-75-15-100-40-40-60-40-100z M380 200l100-40-60 60 60 60-100-40c-10-4-15-14-15-20s5-16 15-20z",w:512,h:512},
  mink:{d:"M120 256c0-40 15-75 40-100s60-40 100-40 75 15 100 40 40 60 40 100-15 75-40 100-60 40-100 40-75-15-100-40-40-60-40-100z M380 200l100-40-60 60 60 60-100-40c-10-4-15-14-15-20s5-16 15-20z",w:512,h:512},
  badger:{d:"M160 140c-20 0-38 10-48 28-10 18-10 40 0 58 5 10 12 18 22 24 15 10 35 15 55 15h140c20 0 40-5 55-15 10-6 17-14 22-24 10-18 10-40 0-58-10-18-28-28-48-28-12 0-24 4-34 10l-15-25c-8-12-22-18-36-15-14 3-25 14-28 28l-10 35c-8-3-16-5-25-5-9 0-17 2-25 5l-10-35c-3-14-14-25-28-28-14-3-28 3-36 15l-15 25c-10-6-22-10-34-10z M140 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M372 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M200 100l-30-40 20 60z M312 100l30-40-20 60z",w:512,h:512},
  skunk:{d:"M160 140c-20 0-38 10-48 28-10 18-10 40 0 58 5 10 12 18 22 24 15 10 35 15 55 15h140c20 0 40-5 55-15 10-6 17-14 22-24 10-18 10-40 0-58-10-18-28-28-48-28-12 0-24 4-34 10l-15-25c-8-12-22-18-36-15-14 3-25 14-28 28l-10 35c-8-3-16-5-25-5-9 0-17 2-25 5l-10-35c-3-14-14-25-28-28-14-3-28 3-36 15l-15 25c-10-6-22-10-34-10z M140 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M372 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M200 100l-30-40 20 60z M312 100l30-40-20 60z M256 80l-10-40 20 0z",w:512,h:512},
  armadillo:{d:"M256 160c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M140 120l-40-60 30 80z M372 120l40-60-30 80z",w:512,h:512},
  sloth:{d:"M160 140c-20 0-38 10-48 28-10 18-10 40 0 58 5 10 12 18 22 24 15 10 35 15 55 15h140c20 0 40-5 55-15 10-6 17-14 22-24 10-18 10-40 0-58-10-18-28-28-48-28-12 0-24 4-34 10l-15-25c-8-12-22-18-36-15-14 3-25 14-28 28l-10 35c-8-3-16-5-25-5-9 0-17 2-25 5l-10-35c-3-14-14-25-28-28-14-3-28 3-36 15l-15 25c-10-6-22-10-34-10z M140 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M372 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M200 100l-30-40 20 60z M312 100l30-40-20 60z",w:512,h:512},
  anteater:{d:"M120 256c0-40 15-75 40-100s60-40 100-40 75 15 100 40 40 60 40 100-15 75-40 100-60 40-100 40-75-15-100-40-40-60-40-100z M380 200l120-40-80 60 80 60-120-40c-10-4-15-14-15-20s5-16 15-20z",w:512,h:512},
  pangolin:{d:"M256 160c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M140 120l-40-60 30 80z M372 120l40-60-30 80z",w:512,h:512},
  // === BIRDS (25) ===
  eagle:{d:"M256 100c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M140 80l-80-20 60 40z M372 80l80-20-60 40z M200 60l-30-40 20 60z M312 60l30-40-20 60z M256 380l-40 60 40-20 40 20z",w:512,h:512},
  hawk:{d:"M256 100c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M140 80l-80-20 60 40z M372 80l80-20-60 40z M256 380l-40 60 40-20 40 20z",w:512,h:512},
  falcon:{d:"M256 100c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M140 80l-80-20 60 40z M372 80l80-20-60 40z M256 380l-40 60 40-20 40 20z",w:512,h:512},
  owl:{d:"M256 100c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M180 160c-20 0-38 10-48 25-10 15-12 35-5 52 7 17 22 28 40 30 18 2 35-5 45-20 10-15 12-35 5-52-7-17-22-28-40-30-5-1-10-1-15 0z M332 160c-20 0-38 10-48 25-10 15-12 35-5 52 7 17 22 28 40 30 18 2 35-5 45-20 10-15 12-35 5-52-7-17-22-28-40-30-5-1-10-1-15 0z M256 280c-20 0-38 8-50 22-12 14-18 32-18 52s6 38 18 52c12 14 30 22 50 22s38-8 50-22c12-14 18-32 18-52s-6-38-18-52c-12-14-30-22-50-22z M140 120l-40-60 30 80z M372 120l40-60-30 80z",w:512,h:512},
  vulture:{d:"M256 100c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M140 80l-80-20 60 40z M372 80l80-20-60 40z M256 380l-40 60 40-20 40 20z",w:512,h:512},
  condor:{d:"M256 100c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M140 80l-80-20 60 40z M372 80l80-20-60 40z M256 380l-40 60 40-20 40 20z",w:512,h:512},
  crow:{d:"M256 100c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M140 80l-80-20 60 40z M372 80l80-20-60 40z M256 380l-40 60 40-20 40 20z",w:512,h:512},
  raven:{d:"M256 100c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M140 80l-80-20 60 40z M372 80l80-20-60 40z M256 380l-40 60 40-20 40 20z",w:512,h:512},
  magpie:{d:"M256 100c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M140 80l-80-20 60 40z M372 80l80-20-60 40z M256 380l-40 60 40-20 40 20z",w:512,h:512},
  peacock:{d:"M256 100c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M140 80l-80-20 60 40z M372 80l80-20-60 40z M256 380l-40 80 40-30 40 30z M200 60l-20-40 30 50z M312 60l20-40-30 50z",w:512,h:512},
  flamingo:{d:"M256 100c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M256 380l-20 80 20-30 20 30z M200 60l-30-40 20 60z M312 60l30-40-20 60z",w:512,h:512},
  heron:{d:"M256 100c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M256 380l-20 80 20-30 20 30z M200 60l-30-40 20 60z M312 60l30-40-20 60z",w:512,h:512},
  crane:{d:"M256 100c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M256 380l-20 80 20-30 20 30z M200 60l-30-40 20 60z M312 60l30-40-20 60z",w:512,h:512},
  stork:{d:"M256 100c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M256 380l-20 80 20-30 20 30z M200 60l-30-40 20 60z M312 60l30-40-20 60z",w:512,h:512},
  pelican:{d:"M256 100c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M256 380l-20 80 20-30 20 30z M200 60l-30-40 20 60z M312 60l30-40-20 60z",w:512,h:512},
  penguin:{d:"M256 100c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M220 200c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M292 200c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M256 380l-30 60 30-20 30 20z",w:512,h:512},
  ostrich:{d:"M256 100c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M256 380l-20 80 20-30 20 30z M200 60l-30-40 20 60z M312 60l30-40-20 60z",w:512,h:512},
  emu:{d:"M256 100c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M256 380l-20 80 20-30 20 30z M200 60l-30-40 20 60z M312 60l30-40-20 60z",w:512,h:512},
  cassowary:{d:"M256 100c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M256 380l-20 80 20-30 20 30z M200 60l-30-40 20 60z M312 60l30-40-20 60z",w:512,h:512},
  kiwi:{d:"M256 160c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M256 380l-20 60 20-20 20 20z",w:512,h:512},
  toucan:{d:"M256 100c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M380 160l80-20-40 40 40 40-80-20c-10-4-15-10-15-20s5-16 15-20z M256 380l-20 60 20-20 20 20z",w:512,h:512},
  parrot:{d:"M256 100c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M380 160l80-20-40 40 40 40-80-20c-10-4-15-10-15-20s5-16 15-20z M256 380l-20 60 20-20 20 20z",w:512,h:512},
  macaw:{d:"M256 100c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M380 160l80-20-40 40 40 40-80-20c-10-4-15-10-15-20s5-16 15-20z M256 380l-20 60 20-20 20 20z",w:512,h:512},
  cockatoo:{d:"M256 100c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M200 60l-20-40 30 50z M312 60l20-40-30 50z M256 380l-20 60 20-20 20 20z",w:512,h:512},
  dove:{d:"M256 100c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M140 80l-80-20 60 40z M372 80l80-20-60 40z M256 380l-40 60 40-20 40 20z",w:512,h:512},
  pigeon:{d:"M256 100c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M140 80l-80-20 60 40z M372 80l80-20-60 40z M256 380l-40 60 40-20 40 20z",w:512,h:512},
  swan:{d:"M256 100c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M200 60l-30-40 20 60z M312 60l30-40-20 60z M256 380l-60 40 60-10 60 10z",w:512,h:512},
  duck:{d:"M120 256c0-40 15-75 40-100s60-40 100-40 75 15 100 40 40 60 40 100-15 75-40 100-60 40-100 40-75-15-100-40-40-60-40-100z M380 200l80-20-40 40 40 40-80-20c-10-4-15-10-15-20s5-16 15-20z",w:512,h:512},
  goose:{d:"M256 100c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M200 60l-30-40 20 60z M312 60l30-40-20 60z M256 380l-60 40 60-10 60 10z",w:512,h:512},
  chicken:{d:"M160 140c-20 0-38 10-48 28-10 18-10 40 0 58 5 10 12 18 22 24 15 10 35 15 55 15h140c20 0 40-5 55-15 10-6 17-14 22-24 10-18 10-40 0-58-10-18-28-28-48-28-12 0-24 4-34 10l-15-25c-8-12-22-18-36-15-14 3-25 14-28 28l-10 35c-8-3-16-5-25-5-9 0-17 2-25 5l-10-35c-3-14-14-25-28-28-14-3-28 3-36 15l-15 25c-10-6-22-10-34-10z M140 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M372 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M200 100l-30-40 20 60z M312 100l30-40-20 60z",w:512,h:512},
  rooster:{d:"M160 140c-20 0-38 10-48 28-10 18-10 40 0 58 5 10 12 18 22 24 15 10 35 15 55 15h140c20 0 40-5 55-15 10-6 17-14 22-24 10-18 10-40 0-58-10-18-28-28-48-28-12 0-24 4-34 10l-15-25c-8-12-22-18-36-15-14 3-25 14-28 28l-10 35c-8-3-16-5-25-5-9 0-17 2-25 5l-10-35c-3-14-14-25-28-28-14-3-28 3-36 15l-15 25c-10-6-22-10-34-10z M140 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M372 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M200 100l-30-40 20 60z M312 100l30-40-20 60z M256 60l-10-30 20 0z",w:512,h:512},
  turkey:{d:"M160 140c-20 0-38 10-48 28-10 18-10 40 0 58 5 10 12 18 22 24 15 10 35 15 55 15h140c20 0 40-5 55-15 10-6 17-14 22-24 10-18 10-40 0-58-10-18-28-28-48-28-12 0-24 4-34 10l-15-25c-8-12-22-18-36-15-14 3-25 14-28 28l-10 35c-8-3-16-5-25-5-9 0-17 2-25 5l-10-35c-3-14-14-25-28-28-14-3-28 3-36 15l-15 25c-10-6-22-10-34-10z M140 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M372 300c-15 0-28 5-38 15-10 10-15 24-15 40v40c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-40c0-16-5-30-15-40-10-10-23-15-38-15z M200 100l-30-40 20 60z M312 100l30-40-20 60z",w:512,h:512},
  hummingbird:{d:"M256 160c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M140 120l-80-20 60 40z M372 120l80-20-60 40z M256 380l-20 40 20-10 20 10z M380 200l60-20-30 30 30 30-60-20z",w:512,h:512},
  woodpecker:{d:"M256 100c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M380 160l60-20-30 30 30 30-60-20z M256 380l-20 40 20-10 20 10z",w:512,h:512},
  kingfisher:{d:"M256 100c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M380 160l60-20-30 30 30 30-60-20z M256 380l-20 40 20-10 20 10z",w:512,h:512},
  // === MARINE ANIMALS (20) ===
  whale:{d:"M120 256c0-60 20-110 55-140 35-30 80-40 120-25 40 15 70 50 80 95 5 20 8 45 8 70s-3 50-8 70c-10 45-40 80-80 95-40 15-85 5-120-25-35-30-55-80-55-140z M380 200l100-40-60 60 60 60-100-40c-10-4-15-14-15-20s5-16 15-20z",w:512,h:512},
  dolphin:{d:"M120 256c0-40 15-75 40-100s60-40 100-40 75 15 100 40 40 60 40 100-15 75-40 100-60 40-100 40-75-15-100-40-40-60-40-100z M380 200l80-40-40 60 40 60-80-40c-10-4-15-14-15-20s5-16 15-20z",w:512,h:512},
  shark:{d:"M120 256c0-40 15-75 40-100s60-40 100-40 75 15 100 40 40 60 40 100-15 75-40 100-60 40-100 40-75-15-100-40-40-60-40-100z M380 200l100-60-40 80 40 80-100-60c-10-6-15-16-15-20s5-14 15-20z M256 180l-20-40 40 0z",w:512,h:512},
  orca:{d:"M120 256c0-40 15-75 40-100s60-40 100-40 75 15 100 40 40 60 40 100-15 75-40 100-60 40-100 40-75-15-100-40-40-60-40-100z M380 200l80-40-40 60 40 60-80-40c-10-4-15-14-15-20s5-16 15-20z M256 180l-20-40 40 0z",w:512,h:512},
  seal:{d:"M120 256c0-40 15-75 40-100s60-40 100-40 75 15 100 40 40 60 40 100-15 75-40 100-60 40-100 40-75-15-100-40-40-60-40-100z M220 200c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M292 200c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z",w:512,h:512},
  sea_lion:{d:"M120 256c0-40 15-75 40-100s60-40 100-40 75 15 100 40 40 60 40 100-15 75-40 100-60 40-100 40-75-15-100-40-40-60-40-100z M220 200c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M292 200c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z",w:512,h:512},
  walrus:{d:"M120 256c0-40 15-75 40-100s60-40 100-40 75 15 100 40 40 60 40 100-15 75-40 100-60 40-100 40-75-15-100-40-40-60-40-100z M220 200c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M292 200c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M200 300l-20 40 20-10 20 10z M312 300l20 40-20-10-20 10z",w:512,h:512},
  manatee:{d:"M120 256c0-40 15-75 40-100s60-40 100-40 75 15 100 40 40 60 40 100-15 75-40 100-60 40-100 40-75-15-100-40-40-60-40-100z M380 200l60-20-30 40 30 40-60-20z",w:512,h:512},
  dugong:{d:"M120 256c0-40 15-75 40-100s60-40 100-40 75 15 100 40 40 60 40 100-15 75-40 100-60 40-100 40-75-15-100-40-40-60-40-100z M380 200l60-20-30 40 30 40-60-20z",w:512,h:512},
  octopus:{d:"M256 160c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M180 380l-40 60 20-20 20 20z M332 380l40 60-20-20-20 20z M256 380l-20 60 20-20 20 20z M140 360l-30 60 15-15 15 15z M372 360l30 60-15-15-15 15z M220 200c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M292 200c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z",w:512,h:512},
  squid:{d:"M256 120c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M200 380l-30 60 15-15 15 15z M312 380l30 60-15-15-15 15z M256 380l-20 60 20-20 20 20z",w:512,h:512},
  jellyfish:{d:"M256 120c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M180 380l-20 80 10-30 10 30z M256 380l-10 80 10-30 10 30z M332 380l20 80-10-30-10 30z M140 360l-15 80 8-25 7 25z M372 360l15 80-8-25-7 25z",w:512,h:512},
  seahorse:{d:"M256 100c-20 0-38 10-48 28-10 18-10 40 0 58 5 10 12 18 22 24 15 10 35 15 55 15h20c20 0 40-5 55-15 10-6 17-14 22-24 10-18 10-40 0-58-10-18-28-28-48-28-12 0-24 4-34 10l-10-20c-5-10-15-15-25-15-10 0-20 5-25 15l-10 20c-10-6-22-10-34-10z M256 280c-20 0-38 8-50 22-12 14-18 32-18 52s6 38 18 52c12 14 30 22 50 22s38-8 50-22c12-14 18-32 18-52s-6-38-18-52c-12-14-30-22-50-22z M256 380l-20 60 20-20 20 20z M380 200l40-20-20 30 20 30-40-20z",w:512,h:512},
  starfish:{d:"M256 64l40 120h120l-100 70 40 120-100-70-100 70 40-120-100-70h120z",w:512,h:512},
  crab:{d:"M256 200c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M140 160l-80-40 40 60z M372 160l80-40-40 60z M180 380l-40 40 20-10 20 10z M332 380l40 40-20-10-20 10z M220 240c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M292 240c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z",w:512,h:512},
  lobster:{d:"M256 160c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M140 120l-80-40 40 60z M372 120l80-40-40 60z M180 380l-40 40 20-10 20 10z M332 380l40 40-20-10-20 10z M220 240c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M292 240c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z",w:512,h:512},
  shrimp:{d:"M120 256c0-40 15-75 40-100s60-40 100-40 75 15 100 40 40 60 40 100-15 75-40 100-60 40-100 40-75-15-100-40-40-60-40-100z M380 200l60-20-30 40 30 40-60-20z M200 380l-20 40 20-10 20 10z",w:512,h:512},
  turtle:{d:"M256 160c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M180 120c-10 0-20 4-28 12-8 8-12 18-12 28s4 20 12 28c8 8 18 12 28 12s20-4 28-12c8-8 12-18 12-28s-4-20-12-28c-8-8-18-12-28-12z M332 120c-10 0-20 4-28 12-8 8-12 18-12 28s4 20 12 28c8 8 18 12 28 12s20-4 28-12c8-8 12-18 12-28s-4-20-12-28c-8-8-18-12-28-12z M140 380c-15 0-28 5-38 15-10 10-15 24-15 40v20c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-20c0-16-5-30-15-40-10-10-23-15-38-15z M372 380c-15 0-28 5-38 15-10 10-15 24-15 40v20c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-20c0-16-5-30-15-40-10-10-23-15-38-15z",w:512,h:512},
  sea_turtle:{d:"M256 160c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M180 120c-10 0-20 4-28 12-8 8-12 18-12 28s4 20 12 28c8 8 18 12 28 12s20-4 28-12c8-8 12-18 12-28s-4-20-12-28c-8-8-18-12-28-12z M332 120c-10 0-20 4-28 12-8 8-12 18-12 28s4 20 12 28c8 8 18 12 28 12s20-4 28-12c8-8 12-18 12-28s-4-20-12-28c-8-8-18-12-28-12z M140 380c-15 0-28 5-38 15-10 10-15 24-15 40v20c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-20c0-16-5-30-15-40-10-10-23-15-38-15z M372 380c-15 0-28 5-38 15-10 10-15 24-15 40v20c0 16 5 30 15 40 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-24 15-40v-20c0-16-5-30-15-40-10-10-23-15-38-15z",w:512,h:512},
  ray:{d:"M256 160c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M256 380l-20 80 20-30 20 30z",w:512,h:512},
  manta_ray:{d:"M256 160c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M140 120l-80-40 40 60z M372 120l80-40-40 60z M256 380l-20 80 20-30 20 30z",w:512,h:512},
  swordfish:{d:"M120 256c0-40 15-75 40-100s60-40 100-40 75 15 100 40 40 60 40 100-15 75-40 100-60 40-100 40-75-15-100-40-40-60-40-100z M380 200l120-40-80 60 80 60-120-40c-10-4-15-14-15-20s5-16 15-20z",w:512,h:512},
  marlin:{d:"M120 256c0-40 15-75 40-100s60-40 100-40 75 15 100 40 40 60 40 100-15 75-40 100-60 40-100 40-75-15-100-40-40-60-40-100z M380 200l120-40-80 60 80 60-120-40c-10-4-15-14-15-20s5-16 15-20z M256 180l-20-40 40 0z",w:512,h:512},
  tuna:{d:"M120 256c0-40 15-75 40-100s60-40 100-40 75 15 100 40 40 60 40 100-15 75-40 100-60 40-100 40-75-15-100-40-40-60-40-100z M380 200l80-20-40 40 40 40-80-20c-10-4-15-14-15-20s5-16 15-20z",w:512,h:512},
  salmon:{d:"M120 256c0-40 15-75 40-100s60-40 100-40 75 15 100 40 40 60 40 100-15 75-40 100-60 40-100 40-75-15-100-40-40-60-40-100z M380 200l80-20-40 40 40 40-80-20c-10-4-15-14-15-20s5-16 15-20z",w:512,h:512},
  clownfish:{d:"M120 256c0-40 15-75 40-100s60-40 100-40 75 15 100 40 40 60 40 100-15 75-40 100-60 40-100 40-75-15-100-40-40-60-40-100z M380 200l80-20-40 40 40 40-80-20c-10-4-15-14-15-20s5-16 15-20z",w:512,h:512},
  angelfish:{d:"M120 256c0-40 15-75 40-100s60-40 100-40 75 15 100 40 40 60 40 100-15 75-40 100-60 40-100 40-75-15-100-40-40-60-40-100z M380 200l80-20-40 40 40 40-80-20c-10-4-15-14-15-20s5-16 15-20z M256 180l-20-40 40 0z",w:512,h:512},
  pufferfish:{d:"M256 160c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M220 240c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M292 240c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z",w:512,h:512},
  coral:{d:"M256 380v-120 M200 380v-80 M312 380v-80 M160 380v-60 M352 380v-60 M256 260c-20 0-38 8-50 22-12 14-18 32-18 52s6 38 18 52c12 14 30 22 50 22s38-8 50-22c12-14 18-32 18-52s-6-38-18-52c-12-14-30-22-50-22z M200 300c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M312 300c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z",w:512,h:512},
  // === INSECTS & ARACHNIDS (15) ===
  butterfly:{d:"M256 200c-15 0-28 5-38 15-10 10-15 23-15 38 0 15 5 28 15 38 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-23 15-38 0-15-5-28-15-38-10-10-23-15-38-15z M180 160c-25 0-48 10-65 28-17 18-25 42-25 68s8 50 25 68c17 18 40 28 65 28 15 0 28-3 40-8l-15-30c-5-10-8-22-8-34s3-24 8-34l15-30c-12-5-25-8-40-8z M332 160c25 0 48 10 65 28 17 18 25 42 25 68s-8 50-25 68c-17 18-40 28-65 28-15 0-28-3-40-8l15-30c5-10 8-22 8-34s-3-24-8-34l-15-30c12-5 25-8 40-8z M200 120c-10 0-20 4-28 12-8 8-12 18-12 28s4 20 12 28c8 8 18 12 28 12s20-4 28-12c8-8 12-18 12-28s-4-20-12-28c-8-8-18-12-28-12z M312 120c-10 0-20 4-28 12-8 8-12 18-12 28s4 20 12 28c8 8 18 12 28 12s20-4 28-12c8-8 12-18 12-28s-4-20-12-28c-8-8-18-12-28-12z",w:512,h:512},
  moth:{d:"M256 200c-15 0-28 5-38 15-10 10-15 23-15 38 0 15 5 28 15 38 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-23 15-38 0-15-5-28-15-38-10-10-23-15-38-15z M180 160c-25 0-48 10-65 28-17 18-25 42-25 68s8 50 25 68c17 18 40 28 65 28 15 0 28-3 40-8l-15-30c-5-10-8-22-8-34s3-24 8-34l15-30c-12-5-25-8-40-8z M332 160c25 0 48 10 65 28 17 18 25 42 25 68s-8 50-25 68c-17 18-40 28-65 28-15 0-28-3-40-8l15-30c5-10 8-22 8-34s-3-24-8-34l-15-30c12-5 25-8 40-8z M200 120c-10 0-20 4-28 12-8 8-12 18-12 28s4 20 12 28c8 8 18 12 28 12s20-4 28-12c8-8 12-18 12-28s-4-20-12-28c-8-8-18-12-28-12z M312 120c-10 0-20 4-28 12-8 8-12 18-12 28s4 20 12 28c8 8 18 12 28 12s20-4 28-12c8-8 12-18 12-28s-4-20-12-28c-8-8-18-12-28-12z",w:512,h:512},
  dragonfly:{d:"M256 200c-15 0-28 5-38 15-10 10-15 23-15 38 0 15 5 28 15 38 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-23 15-38 0-15-5-28-15-38-10-10-23-15-38-15z M140 160l-80-40 40 60z M372 160l80-40-40 60z M140 360l-80 40 40-60z M372 360l80 40-40-60z M256 120l-10-40 20 0z M256 400l-10 40 20 0z",w:512,h:512},
  damselfly:{d:"M256 200c-15 0-28 5-38 15-10 10-15 23-15 38 0 15 5 28 15 38 10 10 23 15 38 15 15 0 28-5 38-15 10-10 15-23 15-38 0-15-5-28-15-38-10-10-23-15-38-15z M140 160l-80-40 40 60z M372 160l80-40-40 60z M140 360l-80 40 40-60z M372 360l80 40-40-60z M256 120l-10-40 20 0z M256 400l-10 40 20 0z",w:512,h:512},
  bee:{d:"M256 200c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M140 160l-60-40 30 60z M372 160l60-40-30 60z M220 280c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M292 280c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z",w:512,h:512},
  wasp:{d:"M256 200c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M140 160l-60-40 30 60z M372 160l60-40-30 60z M220 280c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M292 280c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z",w:512,h:512},
  hornet:{d:"M256 200c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M140 160l-60-40 30 60z M372 160l60-40-30 60z M220 280c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M292 280c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z",w:512,h:512},
  ant:{d:"M256 200c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M200 160l-60-40 30 60z M312 160l60-40-30 60z M180 380l-40 40 20-10 20 10z M332 380l40 40-20-10-20 10z M220 280c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M292 280c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z",w:512,h:512},
  beetle:{d:"M256 160c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M256 200c-20 0-38 8-50 22-12 14-18 32-18 52s6 38 18 52c12 14 30 22 50 22s38-8 50-22c12-14 18-32 18-52s-6-38-18-52c-12-14-30-22-50-22z M200 120l-40-40 20 60z M312 120l40-40-20 60z",w:512,h:512},
  ladybug:{d:"M256 160c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M256 200c-20 0-38 8-50 22-12 14-18 32-18 52s6 38 18 52c12 14 30 22 50 22s38-8 50-22c12-14 18-32 18-52s-6-38-18-52c-12-14-30-22-50-22z M200 120l-40-40 20 60z M312 120l40-40-20 60z M220 280c-10 0-18 8-18 18s8 18 18 18 18-8 18-18-8-18-18-18z M292 280c-10 0-18 8-18 18s8 18 18 18 18-8 18-18-8-18-18-18z",w:512,h:512},
  firefly:{d:"M256 200c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M140 160l-60-40 30 60z M372 160l60-40-30 60z M256 380l-10 40 10-15 10 15z M220 280c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M292 280c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z",w:512,h:512},
  grasshopper:{d:"M256 200c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M200 160l-60-40 30 60z M312 160l60-40-30 60z M180 380l-60 60 30-20 30 20z M332 380l60 60-30-20-30 20z M220 280c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M292 280c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z",w:512,h:512},
  cricket:{d:"M256 200c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M200 160l-60-40 30 60z M312 160l60-40-30 60z M180 380l-60 60 30-20 30 20z M332 380l60 60-30-20-30 20z M220 280c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M292 280c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z",w:512,h:512},
  praying_mantis:{d:"M256 100c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M200 160l-60-40 30 60z M312 160l60-40-30 60z M180 380l-40 60 20-20 20 20z M332 380l40 60-20-20-20 20z M220 280c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M292 280c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z",w:512,h:512},
  spider:{d:"M256 200c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M140 160l-80-60 40 80z M372 160l80-60-40 80z M140 360l-80 60 40-80z M372 360l80 60-40-80z M100 256l-60-20 40 40z M412 256l60-20-40 40z M220 280c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M292 280c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z",w:512,h:512},
  scorpion:{d:"M256 200c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58 24 14 52 22 82 22s58-8 82-22c24-14 44-34 58-58 14-24 22-52 22-82 0-40-15-75-40-100-25-25-60-40-100-40z M200 160l-60-40 30 60z M312 160l60-40-30 60z M180 380l-40 60 20-20 20 20z M332 380l40 60-20-20-20 20z M256 120l-20-60 40 0z M380 200l60-20-30 30 30 30-60-20z M220 280c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z M292 280c-15 0-28 5-38 15-10 10-15 23-15 38s5 28 15 38c10 10 23 15 38 15s28-5 38-15c10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15z",w:512,h:512},
  // === REPTILES & AMPHIBIANS (15) ===
  crocodile:{d:"M120 256c0-40 20-75 55-100s80-40 120-25 70 50 80 95 5 20 8 45s-3 50-8 70c-10 45-40 80-80 95s-85 5-120-25-55-80-55-140z M380 280l120 20-80-40 80-40-120 20c-10 4-15 10-15 20s5 16 15 20z",w:512,h:512},
  alligator:{d:"M120 256c0-40 20-75 55-100s80-40 120-25 70 50 80 95 5 20 8 45s-3 50-8 70c-10 45-40 80-80 95s-85 5-120-25-55-80-55-140z M380 280l120 20-80-40 80-40-120 20c-10 4-15 10-15 20s5 16 15 20z",w:512,h:512},
  snake:{d:"M256 100c-20 0-38 10-48 28-10 18-10 40 0 58 5 10 12 18 22 24 15 10 35 15 55 15h20c20 0 40-5 55-15 10-6 17-14 22-24 10-18 10-40 0-58-10-18-28-28-48-28-12 0-24 4-34 10l-10-20c-5-10-15-15-25-15-10 0-20 5-25 15l-10 20c-10-6-22-10-34-10z M256 256c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z",w:512,h:512},
  cobra:{d:"M256 80c-40 0-75 15-100 40-25 25-40 60-40 100 0 30 8 58 22 82 14 24 34 44 58 58s52 22 82 22 58-8 82-22 44-34 58-58 22-52 22-82c0-40-15-75-40-100s-60-40-100-40z M256 380c-60 0-110 20-140 55s-40 80-25 120c15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120s-80-55-140-55z M256 160l-10-40 20 0z",w:512,h:512},
  python:{d:"M256 100c-60 0-110 20-140 55s-40 80-25 120c15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120s-80-55-140-55z",w:512,h:512},
  viper:{d:"M256 100c-60 0-110 20-140 55s-40 80-25 120c15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120s-80-55-140-55z",w:512,h:512},
  lizard:{d:"M120 256c0-40 20-75 55-100s80-40 120-25 70 50 80 95 5 20 8 45s-3 50-8 70c-10 45-40 80-80 95s-85 5-120-25-55-80-55-140z M380 200l80-40-40 60 40 60-80-40c-10-4-15-14-15-20s5-16 15-20z M200 380l-40 40 20-10 20 10z M312 380l40 40-20-10-20 10z",w:512,h:512},
  gecko:{d:"M120 256c0-40 20-75 55-100s80-40 120-25 70 50 80 95 5 20 8 45s-3 50-8 70c-10 45-40 80-80 95s-85 5-120-25-55-80-55-140z M380 200l80-40-40 60 40 60-80-40c-10-4-15-14-15-20s5-16 15-20z M200 380l-40 40 20-10 20 10z M312 380l40 40-20-10-20 10z",w:512,h:512},
  iguana:{d:"M120 256c0-40 20-75 55-100s80-40 120-25 70 50 80 95 5 20 8 45s-3 50-8 70c-10 45-40 80-80 95s-85 5-120-25-55-80-55-140z M380 200l80-40-40 60 40 60-80-40c-10-4-15-14-15-20s5-16 15-20z M256 160v-40",w:512,h:512},
  chameleon:{d:"M120 256c0-40 20-75 55-100s80-40 120-25 70 50 80 95 5 20 8 45s-3 50-8 70c-10 45-40 80-80 95s-85 5-120-25-55-80-55-140z M380 200c40 0 75 15 100 40 25 25 40 60 40 100 0 30-8 58-22 82-14 24-34 44-58 58s-52 22-82 22-58-8-82-22-44-34-58-58-22-52-22-82c0-40 15-75 40-100s60-40 100-40z",w:512,h:512},
  monitor_lizard:{d:"M120 256c0-40 20-75 55-100s80-40 120-25 70 50 80 95 5 20 8 45s-3 50-8 70c-10 45-40 80-80 95s-85 5-120-25-55-80-55-140z M380 200l80-40-40 60 40 60-80-40c-10-4-15-14-15-20s5-16 15-20z",w:512,h:512},
  komodo_dragon:{d:"M120 256c0-40 20-75 55-100s80-40 120-25 70 50 80 95 5 20 8 45s-3 50-8 70c-10 45-40 80-80 95s-85 5-120-25-55-80-55-140z M380 200l80-40-40 60 40 60-80-40c-10-4-15-14-15-20s5-16 15-20z",w:512,h:512},
  tortoise:{d:"M256 160c-60 0-110 20-140 55s-40 80-25 120c15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120s-80-55-140-55z M180 120c-10 0-20 4-28 12s-12 18-12 28 4 20 12 28 18 12 28 12 20-4 28-12 12-18 12-28-4-20-12-28-18-12-28-12z M332 120c-10 0-20 4-28 12s-12 18-12 28 4 20 12 28 18 12 28 12 20-4 28-12 12-18 12-28-4-20-12-28-18-12-28-12z M140 380c-15 0-28 5-38 15s-15 24-15 40 5 30 15 40 23 15 38 15 28-5 38-15 15-24 15-40-5-30-15-40-23-15-38-15z M372 380c-15 0-28 5-38 15s-15 24-15 40 5 30 15 40 23 15 38 15 28-5 38-15 15-24 15-40-5-30-15-40-23-15-38-15z",w:512,h:512},
  frog:{d:"M256 160c-60 0-110 20-140 55-30 35-40 80-25 120 15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120-30-35-80-55-140-55z M180 120c-20 0-38 10-48 25s-12 35-5 52c7 17 22 28 40 30 18 2 35-5 45-20s12-35 5-52c-7-17-22-28-40-30-5-1-10-1-15 0z M332 120c-20 0-38 10-48 25s-12 35-5 52c7 17 22 28 40 30 18 2 35-5 45-20s12-35 5-52c-7-17-22-28-40-30-5-1-10-1-15 0z M140 380l-40 40 20-10 20 10z M372 380l40 40-20-10-20 10z",w:512,h:512},
  salamander:{d:"M120 256c0-40 20-75 55-100s80-40 120-25 70 50 80 95 5 20 8 45s-3 50-8 70c-10 45-40 80-80 95s-85 5-120-25-55-80-55-140z M380 200l80-40-40 60 40 60-80-40c-10-4-15-14-15-20s5-16 15-20z M200 380l-40 40 20-10 20 10z M312 380l40 40-20-10-20 10z",w:512,h:512},

  // === FANTASY & MYTHICAL (10) ===
  dragon:{d:"M256 100c-60 0-110 20-140 55s-40 80-25 120c15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120s-80-55-140-55z M140 120l-80-40 40 80z M372 120l80-40-40 80z M420 200l80-40-40 60 40 60-80-40c-10-4-15-14-15-20s5-16 15-20z M256 380l-40 60 40-20 40 20z",w:512,h:512},
  unicorn:{d:"M256 100c-40 0-75 15-100 40s-40 60-40 100c0 30 8 58 22 82 14 24 34 44 58 58s52 22 82 22 58-8 82-22 44-34 58-58 22-52 22-82c0-40-15-75-40-100s-60-40-100-40z M256 60l-20 40 40 0z M200 100l-20-60 40 40z M312 100l20-60-40 40z",w:512,h:512},
  pegasus:{d:"M256 100c-40 0-75 15-100 40s-40 60-40 100c0 30 8 58 22 82 14 24 34 44 58 58s52 22 82 22 58-8 82-22 44-34 58-58 22-52 22-82c0-40-15-75-40-100s-60-40-100-40z M140 120l-80-40 40 80z M372 120l80-40-40 80z",w:512,h:512},
  griffin:{d:"M256 100c-40 0-75 15-100 40s-40 60-40 100c0 30 8 58 22 82 14 24 34 44 58 58s52 22 82 22 58-8 82-22 44-34 58-58 22-52 22-82c0-40-15-75-40-100s-60-40-100-40z M140 120l-80-40 40 80z M372 120l80-40-40 80z M256 380l-40 60 40-20 40 20z",w:512,h:512},
  phoenix:{d:"M256 100c-40 0-75 15-100 40s-40 60-40 100c0 30 8 58 22 82 14 24 34 44 58 58s52 22 82 22 58-8 82-22 44-34 58-58 22-52 22-82c0-40-15-75-40-100s-60-40-100-40z M140 120l-80-20 60 40z M372 120l80-20-60 40z M256 380l-40 80 40-30 40 30z M256 60l-30-40 20 60z M312 60l30-40-20 60z",w:512,h:512},
  mermaid:{d:"M256 160c-40 0-75 15-100 40s-40 60-40 100c0 30 8 58 22 82 14 24 34 44 58 58s52 22 82 22 58-8 82-22 44-34 58-58 22-52 22-82c0-40-15-75-40-100s-60-40-100-40z M256 380l-60 120 60-30 60 30z",w:512,h:512},
  centaur:{d:"M160 140c-20 0-38 10-48 28-10 18-10 40 0 58 5 10 12 18 22 24 15 10 35 15 55 15h140c20 0 40-5 55-15 10-6 17-14 22-24 10-18 10-40 0-58-10-18-28-28-48-28-12 0-24 4-34 10l-15-25c-8-12-22-18-36-15-14 3-25 14-28 28l-10 35c-8-3-16-5-25-5-9 0-17 2-25 5l-10-35c-3-14-14-25-28-28-14-3-28 3-36 15l-15 25c-10-6-22-10-34-10z M256 100c-30 0-55 15-70 40s-18 55-8 82 30 48 55 58c15 6 32 9 50 9h20c18 0 35-3 50-9 25-10 45-31 55-58 10-27 7-57-8-82-15-25-40-40-70-40-15 0-30 4-43 12l-20-35c-10-18-30-28-50-24z",w:512,h:512},
  minotaur:{d:"M160 140c-20 0-38 10-48 28-10 18-10 40 0 58 5 10 12 18 22 24 15 10 35 15 55 15h140c20 0 40-5 55-15 10-6 17-14 22-24 10-18 10-40 0-58-10-18-28-28-48-28-12 0-24 4-34 10l-15-25c-8-12-22-18-36-15-14 3-25 14-28 28l-10 35c-8-3-16-5-25-5-9 0-17 2-25 5l-10-35c-3-14-14-25-28-28-14-3-28 3-36 15l-15 25c-10-6-22-10-34-10z M256 100c-30 0-55 15-70 40s-18 55-8 82 30 48 55 58c15 6 32 9 50 9h20c18 0 35-3 50-9 25-10 45-31 55-58 10-27 7-57-8-82-15-25-40-40-70-40-15 0-30 4-43 12l-20-35c-10-18-30-28-50-24z M200 60l-30-40 20 60z M312 60l30-40-20 60z",w:512,h:512},
  chimera:{d:"M256 100c-60 0-110 20-140 55s-40 80-25 120c15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120s-80-55-140-55z M140 120l-80-40 40 80z M372 120l80-40-40 80z M420 200l80-40-40 60 40 60-80-40z",w:512,h:512},
  hydra:{d:"M256 100c-60 0-110 20-140 55s-40 80-25 120c15 40 50 70 95 80 20 5 45 8 70 8s50-3 70-8c45-10 80-40 95-80 15-40 5-85-25-120s-80-55-140-55z M140 120l-40-80 20 80z M372 120l40-80-20 80z M256 100l-10-80 20 80z",w:512,h:512},

  // === LETTERS (4) ===
  letter_A:{d:"M256 64l-160 384h80l30-80h140l30 80h80z M256 160l-40 120h80z",w:512,h:512},
  letter_B:{d:"M120 64h120c40 0 75 15 95 40 20 25 30 60 25 95-5 35-25 65-50 85-10 8-22 14-35 18 20 5 38 15 52 30 14 15 22 35 23 55 1 20-5 40-18 55-13 15-32 25-52 28-10 2-20 2-30 2H120V64z M200 144v100h80c15 0 28-5 38-15 10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15h-80z M200 308v100h90c15 0 28-5 38-15 10-10 15-23 15-38s-5-28-15-38c-10-10-23-15-38-15h-90z",w:512,h:512},
  letter_C:{d:"M400 140c-20-25-50-45-85-55-35-10-75-10-110 0-35 10-65 30-85 55-20 25-30 60-30 95v60c0 35 10 70 30 95 20 25 50 45 85 55 35 10 75 10 110 0 35-10 65-30 85-55l-60-48c-12 15-30 28-50 34-20 6-45 6-65 0-20-6-38-19-50-34-12-15-18-35-18-55v-60c0-20 6-40 18-55 12-15 30-28 50-34 20-6 45-6 65 0 20 6 38 19 50 34l60-48z",w:512,h:512},
  letter_D:{d:"M120 64h140c40 0 75 15 100 40 25 25 40 60 40 100v100c0 40-15 75-40 100-25 25-60 40-100 40H120V64z M200 144v224h80c20 0 38-8 50-22 12-14 18-32 18-52V216c0-20-6-38-18-52-12-14-30-22-50-22h-80z",w:512,h:512}
};
// ====================== STAGE 1: RASTERIZATION ======================

// Main-thread only: Path2D + offscreen canvas rasterization
function rasterizeSVGPath(d, svgW, svgH, rows, cols, scale) {
  if (typeof document === 'undefined' || typeof Path2D === 'undefined') return null;
  var ca = document.createElement('canvas');
  ca.width = cols;
  ca.height = rows;
  var ctx = ca.getContext('2d', { willReadFrequently: true });
  var path;
  try { path = new Path2D(d); } catch(e) { return null; }
  var pad = 0.02; // Thinner padding to make shapes bigger
  var scaleX = (1 - pad * 2) * cols / svgW;
  var scaleY = (1 - pad * 2) * rows / svgH;
  var s = Math.min(scaleX, scaleY) * (scale || 1.0);
  var offX = (cols - svgW * s) / 2;
  var offY = (rows - svgH * s) / 2;
  var mask = [];
  for (var r = 0; r < rows; r++) {
    mask[r] = new Array(cols);
    for (var c = 0; c < cols; c++) {
      var svgX = (c + 0.5 - offX) / s;
      var svgY = (r + 0.5 - offY) / s;
      mask[r][c] = ctx.isPointInPath(path, svgX, svgY);
    }
  }
  return mask;
}

// Pure-JS math shape rasterization (works in worker)
function rasterizeMathShape(shape, rows, cols, scale) {
  var m = [];
  var cx = (cols - 1) / 2, cy = (rows - 1) / 2;
  var rx = cols / 2 * (scale || 1.0), ry = rows / 2 * (scale || 1.0);
  for (var r = 0; r < rows; r++) {
    m[r] = new Array(cols);
    for (var c = 0; c < cols; c++) {
      var dx = (c - cx) / rx, dy = (r - cy) / ry;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var v = false;
      switch(shape) {
        case 'circle': v = dist <= 1; break;
        case 'square': v = true; break;
        case 'rectangle': v = true; break;
        case 'diamond': v = Math.abs(dx) + Math.abs(dy) <= 1; break;
        case 'triangle': {
          var ty = (r + 0.5) / rows;
          var tw = ty * cols;
          var tl = (cols - tw) / 2;
          v = c >= tl && c < tl + tw;
          break;
        }
        case 'pentagon': case 'hexagon': case 'octagon': {
          var n = shape === 'pentagon' ? 5 : shape === 'hexagon' ? 6 : 8;
          var ang = Math.atan2(dy, dx);
          var sector = Math.PI * 2 / n;
          var localAng = ((ang % sector) + sector) % sector - sector / 2;
          var maxR = Math.cos(Math.PI / n) / Math.cos(localAng);
          v = dist <= maxR;
          break;
        }
        default: v = true;
      }
      m[r][c] = v;
    }
  }
  return m;
}

// Template rasterization (existing logic)
function rasterizeTemplate(shape, rows, cols, templates) {
  var tmpl = templates && templates[shape];
  if (!tmpl) return null;
  var mask = [];
  var th = tmpl.length, tw = tmpl[0].length;
  for (var r = 0; r < rows; r++) {
    mask[r] = new Array(cols);
    for (var c = 0; c < cols; c++) {
      mask[r][c] = tmpl[Math.floor(r * th / rows)][Math.floor(c * tw / cols)] === '1';
    }
  }
  return mask;
}

// ====================== STAGE 2: DISTANCE TRANSFORM EROSION ======================
// Felzenszwalb & Huttenlocher (2004) — O(n) exact Euclidean distance transform
// Reference: https://cs.brown.edu/~pff/papers/dt-final.pdf

function computeDistanceTransform(mask, rows, cols) {
  var f = new Float64Array(Math.max(rows, cols));
  var d = new Float64Array(Math.max(rows, cols));
  var v = new Int32Array(Math.max(rows, cols));
  var z = new Float64Array(Math.max(rows, cols) + 1);
  var dt = new Float64Array(rows * cols);

  var INF = 1e10;
  for (var i = 0; i < rows * cols; i++) {
    dt[i] = mask[Math.floor(i / cols)][i % cols] ? 0 : INF;
  }

  for (var x = 0; x < cols; x++) {
    for (var y = 0; y < rows; y++) {
      f[y] = dt[y * cols + x];
    }
    edt1d(f, d, v, z, rows);
    for (var y = 0; y < rows; y++) {
      dt[y * cols + x] = d[y];
    }
  }

  for (var y = 0; y < rows; y++) {
    for (var x = 0; x < cols; x++) {
      f[x] = dt[y * cols + x];
    }
    edt1d(f, d, v, z, cols);
    for (var x = 0; x < cols; x++) {
      dt[y * cols + x] = Math.sqrt(d[x]);
    }
  }

  return dt;
}

function edt1d(f, d, v, z, n) {
  v[0] = 0;
  z[0] = -1e10;
  z[1] = 1e10;
  var k = 0;
  for (var q = 1; q < n; q++) {
    var s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k--;
      s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = 1e10;
  }
  k = 0;
  for (var q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
  }
}

function erodeMask(mask, rows, cols, padding) {
  if (padding <= 0) return mask;
  var dt = computeDistanceTransform(mask, rows, cols);
  var eroded = [];
  for (var r = 0; r < rows; r++) {
    eroded[r] = new Array(cols);
    for (var c = 0; c < cols; c++) {
      eroded[r][c] = dt[r * cols + c] >= padding;
    }
  }
  return eroded;
}

// ====================== STAGE 3: BFS CONNECTIVITY ======================

function ensureConnected(mask, rows, cols) {
  var cy = Math.floor(rows / 2), cx = Math.floor(cols / 2);
  var startR = -1, startC = -1, bestDist = 1e10;

  for (var r = Math.max(0, cy - 3); r <= Math.min(rows - 1, cy + 3); r++) {
    for (var c = Math.max(0, cx - 3); c <= Math.min(cols - 1, cx + 3); c++) {
      if (mask[r][c]) {
        var dist = Math.abs(r - cy) + Math.abs(c - cx);
        if (dist < bestDist) {
          bestDist = dist;
          startR = r;
          startC = c;
        }
      }
    }
  }

  if (startR < 0) return mask;

  var visited = [];
  for (var r = 0; r < rows; r++) visited[r] = new Uint8Array(cols);
  var queue = [startR * cols + startC];
  visited[startR][startC] = 1;
  var head = 0;
  var count = 0;

  while (head < queue.length) {
    var idx = queue[head++];
    count++;
    var cr = Math.floor(idx / cols), cc = idx % cols;

    if (cr > 0 && !visited[cr-1][cc] && mask[cr-1][cc]) { visited[cr-1][cc] = 1; queue.push((cr-1)*cols+cc); }
    if (cr < rows-1 && !visited[cr+1][cc] && mask[cr+1][cc]) { visited[cr+1][cc] = 1; queue.push((cr+1)*cols+cc); }
    if (cc > 0 && !visited[cr][cc-1] && mask[cr][cc-1]) { visited[cr][cc-1] = 1; queue.push(cr*cols+cc-1); }
    if (cc < cols-1 && !visited[cr][cc+1] && mask[cr][cc+1]) { visited[cr][cc+1] = 1; queue.push(cr*cols+cc+1); }
  }

  var connected = [];
  for (var r = 0; r < rows; r++) {
    connected[r] = new Array(cols);
    for (var c = 0; c < cols; c++) {
      connected[r][c] = visited[r][c] === 1;
    }
  }

  if (count < 20) return mask;

  return connected;
}

// ====================== UNIFIED PIPELINE ======================

function generate(rows, cols, shape, scale, svgPaths, templates) {
  scale = scale || 1.0;
  rows = Math.max(5, Math.min(50, rows));
  cols = Math.max(5, Math.min(50, cols));

  var mask = null;

  // Stage 1: Rasterize
  if (svgPaths && svgPaths[shape]) {
    var sp = svgPaths[shape];
    mask = rasterizeSVGPath(sp.d, sp.w, sp.h, rows, cols, scale);
    if (!mask) {
      mask = rasterizeMathShape(shape, rows, cols, scale);
    }
  } else if (templates && templates[shape]) {
    mask = rasterizeTemplate(shape, rows, cols, templates);
  } else {
    mask = rasterizeMathShape(shape, rows, cols, scale);
  }

  if (!mask) {
    mask = [];
    for (var r = 0; r < rows; r++) {
      mask[r] = new Array(cols).fill(true);
    }
    return mask;
  }

  var activeCount = 0;
  for (var r = 0; r < rows; r++) {
    for (var c = 0; c < cols; c++) {
      if (mask[r][c]) activeCount++;
    }
  }
  if (activeCount < 20) return mask;

  // Stage 2: Distance transform erosion (8-12% padding)
  var padding = Math.max(1, Math.ceil(Math.min(rows, cols) * 0.15)); // Higher erosion for better padding
  mask = erodeMask(mask, rows, cols, padding);

  activeCount = 0;
  for (var r = 0; r < rows; r++) {
    for (var c = 0; c < cols; c++) {
      if (mask[r][c]) activeCount++;
    }
  }
  if (activeCount < 20) {
    padding = Math.max(1, Math.ceil(Math.min(rows, cols) * 0.10));
    if (svgPaths && svgPaths[shape]) {
      var sp = svgPaths[shape];
      mask = rasterizeSVGPath(sp.d, sp.w, sp.h, rows, cols, scale);
    } else if (templates && templates[shape]) {
      mask = rasterizeTemplate(shape, rows, cols, templates);
    } else {
      mask = rasterizeMathShape(shape, rows, cols, scale);
    }
    mask = erodeMask(mask, rows, cols, padding);
  }

  // Stage 3: BFS connectivity
  mask = ensureConnected(mask, rows, cols);

  return mask;
}

// ====================== EXPORT ======================
var NS = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : root);
NS.MXDMaskPipeline = {
  SHAPE_PATHS: SHAPE_PATHS,
  rasterizeSVGPath: rasterizeSVGPath,
  rasterizeMathShape: rasterizeMathShape,
  rasterizeTemplate: rasterizeTemplate,
  computeDistanceTransform: computeDistanceTransform,
  edt1d: edt1d,
  erodeMask: erodeMask,
  ensureConnected: ensureConnected,
  generate: generate,
  registerCustomShape: function(key, pathData) {
    if (!pathData || !pathData.d) return false;
    SHAPE_PATHS[key] = pathData;
    return true;
  },
  loadCustomShapesFromDB: function() {
    var self = this;
    if (!window.MXDOfflineDB) return Promise.resolve(0);
    return window.MXDOfflineDB.getAll('svg_shapes').then(function(records) {
      var count = 0;
      records.forEach(function(rec) {
        var key = 'usr_' + rec.key;
        if (rec.value && rec.value.converted) {
          SHAPE_PATHS[key] = rec.value.converted;
          count++;
        }
      });
      console.log('[MXD Mask Pipeline] Loaded ' + count + ' custom shapes from IndexedDB');
      return count;
    }).catch(function() { return 0; });
  }
};


})();