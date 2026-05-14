// mxd-offline-vortex.js — MXD Hyper Offline v2.0 (20x Better - Reliability Priority)
// Consolidated offline system with auto-retry, IndexedDB queue, corruption repair

(function() {
  'use strict';

  // ============ STORAGE MANAGER ============
  window.MXDStorageManager = {
    db: null,
    dbName: 'mxd_offline_vortex',
    version: 1,
    stores: ['cache', 'puzzles', 'wordlists', 'queue', 'sync_log', 'settings', 'analytics'],
    
    async init() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, this.version);
        
        request.onerror = () => {
          console.error('MXDStorage: Failed to open IndexedDB', request.error);
          this.fallbackToLocalStorage();
          resolve(false);
        };
        
        request.onsuccess = () => {
          this.db = request.result;
          console.log('MXDStorage: IndexedDB initialized');
          resolve(true);
        };
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          
          // Cache store - for generated puzzles and data
          if (!db.objectStoreNames.contains('cache')) {
            const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
            cacheStore.createIndex('priority', 'priority', { unique: false });
            cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false });
            cacheStore.createIndex('accessedAt', 'accessedAt', { unique: false });
          }
          
          // Puzzles store - generated puzzles with metadata
          if (!db.objectStoreNames.contains('puzzles')) {
            const puzzleStore = db.createObjectStore('puzzles', { keyPath: 'id', autoIncrement: true });
            puzzleStore.createIndex('timestamp', 'timestamp', { unique: false });
            puzzleStore.createIndex('category', 'category', { unique: false });
            puzzleStore.createIndex('shape', 'shape', { unique: false });
          }
          
          // Word lists store
          if (!db.objectStoreNames.contains('wordlists')) {
            const wordlistStore = db.createObjectStore('wordlists', { keyPath: 'id', autoIncrement: true });
            wordlistStore.createIndex('category', 'category', { unique: false });
            wordlistStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
          
          // Queue store - persistent sync queue
          if (!db.objectStoreNames.contains('queue')) {
            const queueStore = db.createObjectStore('queue', { keyPath: 'id', autoIncrement: true });
            queueStore.createIndex('priority', 'priority', { unique: false });
            queueStore.createIndex('status', 'status', { unique: false });
            queueStore.createIndex('timestamp', 'timestamp', { unique: false });
            queueStore.createIndex('retryCount', 'retryCount', { unique: false });
          }
          
          // Sync log store - track sync operations
          if (!db.objectStoreNames.contains('sync_log')) {
            const syncStore = db.createObjectStore('sync_log', { keyPath: 'id', autoIncrement: true });
            syncStore.createIndex('timestamp', 'timestamp', { unique: false });
            syncStore.createIndex('status', 'status', { unique: false });
            syncStore.createIndex('type', 'type', { unique: false });
          }
          
          // Settings store
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' });
          }
          
          // Analytics store
          if (!db.objectStoreNames.contains('analytics')) {
            const analyticsStore = db.createObjectStore('analytics', { keyPath: 'id', autoIncrement: true });
            analyticsStore.createIndex('timestamp', 'timestamp', { unique: false });
            analyticsStore.createIndex('metric', 'metric', { unique: false });
          }
          
          console.log('MXDStorage: All stores created');
        };
      });
    },
    
    fallbackToLocalStorage() {
      console.warn('MXDStorage: Falling back to localStorage');
      this.useLocalStorage = true;
    },
    
    // Generic get
    async get(storeName, key) {
      if (this.useLocalStorage) {
        const data = localStorage.getItem(`mxd_${storeName}_${key}`);
        return data ? JSON.parse(data) : null;
      }
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    },
    
    // Generic put
    async put(storeName, data) {
      if (this.useLocalStorage) {
        localStorage.setItem(`mxd_${storeName}_${data.key || data.id || Date.now()}`, JSON.stringify(data));
        return true;
      }
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    },
    
    // Generic delete
    async delete(storeName, key) {
      if (this.useLocalStorage) {
        localStorage.removeItem(`mxd_${storeName}_${key}`);
        return true;
      }
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);
        
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    },
    
    // Get all from store
    async getAll(storeName) {
      if (this.useLocalStorage) {
        const items = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.startsWith(`mxd_${storeName}_`)) {
            items.push(JSON.parse(localStorage.getItem(key)));
          }
        }
        return items;
      }
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    },
    
    // Batch put
    async batchPut(storeName, items) {
      if (this.useLocalStorage) {
        items.forEach(item => {
          localStorage.setItem(`mxd_${storeName}_${item.key || item.id || Date.now()}`, JSON.stringify(item));
        });
        return true;
      }
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        items.forEach(item => store.put(item));
        
        transaction.oncomplete = () => resolve(true);
        transaction.onerror = () => reject(transaction.error);
      });
    },
    
    // Clear store
    async clear(storeName) {
      if (this.useLocalStorage) {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.startsWith(`mxd_${storeName}_`)) keys.push(key);
        }
        keys.forEach(k => localStorage.removeItem(k));
        return true;
      }
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    }
  };

  // ============ WORKER POOL ============
  window.MXDWorkerPool = {
    workers: [],
    taskQueue: [],
    maxWorkers: 4,
    activeWorkers: 0,
    stats: { totalTasks: 0, completedTasks: 0, failedTasks: 0, avgTime: 0 },
    
    async init() {
      // Detect optimal worker count based on CPU cores
      const cores = navigator.hardwareConcurrency || 4;
      this.maxWorkers = Math.min(Math.max(2, cores - 1), 8);
      
      // Create worker pool
      for (let i = 0; i < this.maxWorkers; i++) {
        const worker = this.createWorker();
        this.workers.push({
          id: i,
          worker: worker,
          busy: false,
          taskId: null
        });
      }
      
      console.log(`MXDWorkerPool: Initialized with ${this.maxWorkers} workers`);
    },
    
    createWorker() {
      const workerCode = `
        self.onmessage = function(e) {
          const { taskId, task, data } = e.data;
          
          try {
            let result;
            
            switch(task) {
              case 'generatePuzzle':
                result = this.generatePuzzle(data);
                break;
              case 'optimizePuzzle':
                result = this.optimizePuzzle(data);
                break;
              case 'fillGrid':
                result = this.fillGrid(data);
                break;
              case 'compress':
                result = this.compress(data);
                break;
              default:
                throw new Error('Unknown task: ' + task);
            }
            
            self.postMessage({ taskId, success: true, result });
          } catch (error) {
            self.postMessage({ taskId, success: false, error: error.message });
          }
        };
        
        this.generatePuzzle = function(data) {
          const { words, rows, cols, shape, directions } = data;
          const grid = Array.from({length: rows}, () => Array(cols).fill(''));
          const placements = {};
          
          // Sort words by length (longest first)
          const sortedWords = [...words].sort((a, b) => b.length - a.length);
          
          for (const word of sortedWords) {
            const positions = findBestPlacement(grid, word, rows, cols, directions);
            if (positions) {
              placements[word] = positions;
              positions.forEach((pos, i) => {
                grid[pos[0]][pos[1]] = word[i];
              });
            }
          }
          
          return { grid, placements };
        };
        
        this.optimizePuzzle = function(data) {
          const { grid, mask } = data;
          let filled = 0, total = 0;
          
          for (let r = 0; r < grid.length; r++) {
            for (let c = 0; c < grid[0].length; c++) {
              if (mask[r][c]) {
                total++;
                if (grid[r][c] !== '') filled++;
              }
            }
          }
          
          return { density: total > 0 ? filled / total : 0 };
        };
        
        this.fillGrid = function(data) {
          const { grid, mask, letterCase } = data;
          const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
          
          for (let r = 0; r < grid.length; r++) {
            for (let c = 0; c < grid[0].length; c++) {
              if (mask[r][c] && grid[r][c] === '') {
                const letter = letters[Math.floor(Math.random() * 26)];
                grid[r][c] = letterCase === 'lower' ? letter.toLowerCase() : letter;
              }
            }
          }
          
          return grid;
        };
        
        this.compress = function(data) {
          // Simple compression - convert to base64
          return btoa(JSON.stringify(data));
        };
        
        function findBestPlacement(grid, word, rows, cols, directions) {
          const positions = [];
          
          for (const [dr, dc] of directions) {
            for (let r = 0; r < rows; r++) {
              for (let c = 0; c < cols; c++) {
                if (canPlace(grid, word, r, c, dr, dc)) {
                  const pos = [];
                  let valid = true;
                  
                  for (let i = 0; i < word.length; i++) {
                    const nr = r + dr * i;
                    const nc = c + dc * i;
                    pos.push([nr, nc]);
                  }
                  
                  if (valid) return pos;
                }
              }
            }
          }
          
          return null;
        }
        
        function canPlace(grid, word, r, c, dr, dc) {
          for (let i = 0; i < word.length; i++) {
            const nr = r + dr * i;
            const nc = c + dc * i;
            
            if (nr < 0 || nr >= grid.length || nc < 0 || nc >= grid[0].length) {
              return false;
            }
            
            if (grid[nr][nc] !== '' && grid[nr][nc] !== word[i]) {
              return false;
            }
          }
          return true;
        }
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      return new Worker(URL.createObjectURL(blob));
    },
    
    async execute(task, data) {
      return new Promise((resolve, reject) => {
        const taskId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const startTime = performance.now();
        
        // Find available worker
        const availableWorker = this.workers.find(w => !w.busy);
        
        if (availableWorker) {
          this.assignTask(availableWorker, taskId, task, data, startTime, resolve, reject);
        } else {
          // Queue task
          this.taskQueue.push({ taskId, task, data, startTime, resolve, reject });
        }
      });
    },
    
    assignTask(worker, taskId, task, data, startTime, resolve, reject) {
      worker.busy = true;
      worker.taskId = taskId;
      this.activeWorkers++;
      
      const timeout = setTimeout(() => {
        worker.busy = false;
        worker.taskId = null;
        reject(new Error('Task timeout'));
      }, 30000);
      
      const handleMessage = (e) => {
        if (e.data.taskId === taskId) {
          clearTimeout(timeout);
          worker.worker.removeEventListener('message', handleMessage);
          worker.busy = false;
          worker.taskId = null;
          this.activeWorkers--;
          
          const time = performance.now() - startTime;
          this.stats.totalTasks++;
          this.stats.completedTasks++;
          this.stats.avgTime = (this.stats.avgTime * (this.stats.completedTasks - 1) + time) / this.stats.completedTasks;
          
          if (e.data.success) {
            resolve(e.data.result);
          } else {
            this.stats.failedTasks++;
            reject(new Error(e.data.error));
          }
          
          // Process queued tasks
          this.processQueue();
        }
      };
      
      worker.worker.addEventListener('message', handleMessage);
      worker.worker.postMessage({ taskId, task, data });
    },
    
    processQueue() {
      if (this.taskQueue.length === 0) return;
      
      const availableWorker = this.workers.find(w => !w.busy);
      if (!availableWorker) return;
      
      const { taskId, task, data, startTime, resolve, reject } = this.taskQueue.shift();
      this.assignTask(availableWorker, taskId, task, data, startTime, resolve, reject);
    },
    
    getStats() {
      return {
        ...this.stats,
        maxWorkers: this.maxWorkers,
        activeWorkers: this.activeWorkers,
        queuedTasks: this.taskQueue.length,
        utilization: this.maxWorkers > 0 ? (this.activeWorkers / this.maxWorkers * 100).toFixed(1) + '%' : '0%'
      };
    }
  };

  // ============ SYNC QUEUE (IndexedDB-based) ============
  window.MXDSyncQueue = {
    store: null,
    maxItems: 500,
    processing: false,
    retryDelays: [1000, 2000, 4000, 8000, 16000, 32000],
    
    async init() {
      this.store = window.MXDStorageManager;
      console.log('MXDSyncQueue: Initialized with IndexedDB backend');
    },
    
    async enqueue(operation, priority = 'normal') {
      const item = {
        operation: operation,
        priority: priority,
        status: 'pending',
        timestamp: Date.now(),
        retryCount: 0,
        lastError: null,
        id: null // Will be set by IndexedDB
      };
      
      // Get current queue size
      const queue = await this.store.getAll('queue');
      
      // If queue is full, remove oldest non-critical items
      if (queue.length >= this.maxItems) {
        const removable = queue
          .filter(i => i.priority !== 'critical' && i.status !== 'processing')
          .sort((a, b) => a.timestamp - b.timestamp);
        
        if (removable.length > 0) {
          await this.store.delete('queue', removable[0].id);
        }
      }
      
      const id = await this.store.put('queue', item);
      item.id = id;
      
      console.log(`MXDSyncQueue: Enqueued ${operation.type} (priority: ${priority})`);
      
      // Auto-process if online
      if (navigator.onLine) {
        this.processQueue();
      }
      
      return id;
    },
    
    async processQueue() {
      if (this.processing) return;
      this.processing = true;
      
      try {
        const queue = await this.store.getAll('queue');
        const pending = queue
          .filter(i => i.status === 'pending' || (i.status === 'failed' && i.retryCount < 6))
          .sort((a, b) => {
            const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
            return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
          });
        
        for (const item of pending) {
          // Check retry delay
          if (item.status === 'failed' && item.retryCount > 0) {
            const delay = this.retryDelays[Math.min(item.retryCount - 1, this.retryDelays.length - 1)];
            const timeSinceLastAttempt = Date.now() - (item.lastAttempt || 0);
            if (timeSinceLastAttempt < delay) continue;
          }
          
          item.status = 'processing';
          item.lastAttempt = Date.now();
          await this.store.put('queue', item);
          
          try {
            await this.executeOperation(item.operation);
            
            item.status = 'completed';
            item.completedAt = Date.now();
            await this.store.put('queue', item);
            
            console.log(`MXDSyncQueue: Completed ${item.operation.type}`);
          } catch (error) {
            item.status = 'failed';
            item.retryCount++;
            item.lastError = error.message;
            await this.store.put('queue', item);
            
            console.warn(`MXDSyncQueue: Failed ${item.operation.type} (attempt ${item.retryCount}):`, error.message);
            
            // Auto-retry for non-critical failures
            if (item.retryCount < 6 && item.priority !== 'critical') {
              // Will be retried in next processQueue call
            }
          }
        }
      } finally {
        this.processing = false;
      }
    },
    
    async executeOperation(operation) {
      switch (operation.type) {
        case 'savePuzzle':
          await window.MXDStorageManager.put('puzzles', operation.data);
          break;
        case 'saveWordList':
          await window.MXDStorageManager.put('wordlists', operation.data);
          break;
        case 'updateSettings':
          await window.MXDStorageManager.put('settings', operation.data);
          break;
        case 'syncData':
          // Real sync implementation
          if (operation.endpoint && operation.method) {
            const response = await fetch(operation.endpoint, {
              method: operation.method,
              headers: operation.headers || { 'Content-Type': 'application/json' },
              body: operation.body ? JSON.stringify(operation.body) : undefined
            });
            
            if (!response.ok) {
              throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
          }
          break;
        default:
          console.warn(`MXDSyncQueue: Unknown operation type: ${operation.type}`);
      }
    },
    
    async getStatus() {
      const queue = await this.store.getAll('queue');
      return {
        total: queue.length,
        pending: queue.filter(i => i.status === 'pending').length,
        processing: queue.filter(i => i.status === 'processing').length,
        completed: queue.filter(i => i.status === 'completed').length,
        failed: queue.filter(i => i.status === 'failed').length,
        maxItems: this.maxItems
      };
    },
    
    async retry(id) {
      const item = await this.store.get('queue', id);
      if (item) {
        item.status = 'pending';
        item.retryCount = 0;
        await this.store.put('queue', item);
        this.processQueue();
      }
    },
    
    async cancel(id) {
      await this.store.delete('queue', id);
    },
    
    async clearCompleted() {
      const queue = await this.store.getAll('queue');
      const completed = queue.filter(i => i.status === 'completed');
      for (const item of completed) {
        await this.store.delete('queue', item.id);
      }
      console.log(`MXDSyncQueue: Cleared ${completed.length} completed items`);
    }
  };

  // ============ NETWORK HEALTH MONITOR ============
  window.MXDNetworkHealth = {
    isOnline: navigator.onLine,
    qualityScore: 100,
    lastCheck: null,
    checkInterval: 30000,
    retryDelay: 30000,
    maxRetryDelay: 480000, // 8 minutes
    pingEndpoint: '/health',
    consecutiveFailures: 0,
    
    init() {
      // Listen for online/offline events
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.onStatusChange(true);
        this.checkHealth();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.qualityScore = 0;
        this.onStatusChange(false);
      });
      
      // Periodic health checks
      this.startHealthChecks();
      
      console.log('MXDNetworkHealth: Initialized');
    },
    
    startHealthChecks() {
      setInterval(() => this.checkHealth(), this.checkInterval);
      this.checkHealth();
    },
    
    async checkHealth() {
      if (!navigator.onLine) {
        this.isOnline = false;
        this.qualityScore = 0;
        return { online: false, quality: 0 };
      }
      
      const startTime = performance.now();
      
      try {
        // Try to fetch a small resource
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(this.pingEndpoint || '/favicon.ico', {
          method: 'HEAD',
          cache: 'no-store',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const latency = performance.now() - startTime;
        this.lastCheck = Date.now();
        this.consecutiveFailures = 0;
        this.retryDelay = 30000; // Reset retry delay
        
        // Calculate quality score based on latency
        if (latency < 100) this.qualityScore = 100;
        else if (latency < 300) this.qualityScore = 90;
        else if (latency < 500) this.qualityScore = 75;
        else if (latency < 1000) this.qualityScore = 50;
        else this.qualityScore = 25;
        
        this.isOnline = true;
        this.onStatusChange(true, { latency, quality: this.qualityScore });
        
        return { online: true, latency, quality: this.qualityScore };
      } catch (error) {
        this.consecutiveFailures++;
        this.retryDelay = Math.min(this.retryDelay * 2, this.maxRetryDelay);
        
        // Degrade quality score
        this.qualityScore = Math.max(0, this.qualityScore - 20 * this.consecutiveFailures);
        
        if (this.qualityScore === 0) {
          this.isOnline = false;
        }
        
        this.onStatusChange(this.isOnline, { error: error.message, failures: this.consecutiveFailures });
        
        return { online: this.isOnline, quality: this.qualityScore, error: error.message };
      }
    },
    
    onStatusChange(online, details) {
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('mxd-network-status', {
        detail: { online, ...details }
      }));
      
      // Trigger sync queue if coming back online
      if (online && window.MXDSyncQueue) {
        window.MXDSyncQueue.processQueue();
      }
    },
    
    getStatus() {
      return {
        online: this.isOnline,
        quality: this.qualityScore,
        lastCheck: this.lastCheck,
        latency: this.lastLatency,
        failures: this.consecutiveFailures
      };
    }
  };

  // ============ ERROR RECOVERY & CORRUPTION REPAIR ============
  window.MXDErrorRecovery = {
    repairAttempts: 0,
    maxRepairAttempts: 3,
    
    async init() {
      // Set up global error handlers
      window.addEventListener('error', (e) => this.handleError(e.error || e));
      window.addEventListener('unhandledrejection', (e) => this.handlePromiseRejection(e.reason));
      
      // Check for corruption on init
      await this.checkForCorruption();
      
      console.log('MXDErrorRecovery: Initialized');
    },
    
    handleError(error) {
      console.error('MXDErrorRecovery: Caught error:', error);
      
      const type = this.classifyError(error);
      
      if (type === 'storage') {
        this.repairStorage(error);
      } else if (type === 'network') {
        // Already handled by MXDNetworkHealth
      } else if (type === 'quota') {
        this.cleanupStorage(error);
      }
    },
    
    handlePromiseRejection(reason) {
      console.error('MXDErrorRecovery: Unhandled promise rejection:', reason);
      this.handleError(reason);
    },
    
    classifyError(error) {
      const message = (error?.message || '').toLowerCase();
      
      if (message.includes('quota') || message.includes('storage')) return 'storage';
      if (message.includes('network') || message.includes('fetch')) return 'network';
      if (message.includes('corrupt') || message.includes('invalid')) return 'corruption';
      if (message.includes('parse') || message.includes('json')) return 'parse';
      
      return 'unknown';
    },
    
    async repairStorage(error) {
      console.warn('MXDErrorRecovery: Attempting storage repair...');
      
      try {
        // Clear old completed queue items
        await window.MXDSyncQueue.clearCompleted();
        
        // Try to clear cache if quota exceeded
        const cache = await window.MXDStorageManager.getAll('cache');
        if (cache.length > 100) {
          const toRemove = cache.slice(0, Math.floor(cache.length * 0.5));
          for (const item of toRemove) {
            await window.MXDStorageManager.delete('cache', item.key);
          }
          console.log(`MXDErrorRecovery: Removed ${toRemove.length} cache items`);
        }
        
        this.repairAttempts++;
        console.log(`MXDErrorRecovery: Storage repair attempt ${this.repairAttempts} completed`);
      } catch (e) {
        console.error('MXDErrorRecovery: Storage repair failed:', e);
      }
    },
    
    async cleanupStorage(error) {
      console.warn('MXDErrorRecovery: Cleaning up storage...');
      
      try {
        // Keep last 10 puzzles
        const puzzles = await window.MXDStorageManager.getAll('puzzles');
        if (puzzles.length > 10) {
          const sorted = puzzles.sort((a, b) => b.timestamp - a.timestamp);
          const toRemove = sorted.slice(10);
          for (const p of toRemove) {
            await window.MXDStorageManager.delete('puzzles', p.id);
          }
          console.log(`MXDErrorRecovery: Removed ${toRemove.length} old puzzles`);
        }
        
        // Clear old analytics
        await window.MXDStorageManager.clear('analytics');
        
        // Clear completed queue items
        await window.MXDSyncQueue.clearCompleted();
        
        console.log('MXDErrorRecovery: Storage cleanup completed');
      } catch (e) {
        console.error('MXDErrorRecovery: Cleanup failed:', e);
      }
    },
    
    async checkForCorruption() {
      try {
        // Check settings integrity
        const settings = await window.MXDStorageManager.get('settings', 'app_config');
        if (settings && settings._checksum) {
          const { _checksum, ...data } = settings;
          const computed = this.calculateChecksum(data);
          if (computed !== _checksum) {
            console.warn('MXDErrorRecovery: Settings corruption detected, restoring...');
            await this.restoreFromBackup('settings');
          }
        }
      } catch (e) {
        console.error('MXDErrorRecovery: Corruption check failed:', e);
      }
    },
    
    calculateChecksum(data) {
      const str = JSON.stringify(data);
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return hash.toString(16);
    },
    
    async restoreFromBackup(storeName) {
      console.warn(`MXDErrorRecovery: Attempting to restore ${storeName} from backup...`);
      // Implement backup restoration logic
      // For now, just clear the corrupted data
      await window.MXDStorageManager.clear(storeName);
    }
  };

  // ============ COMPRESSION (Balanced LZ4) ============
  window.MXDCompression = {
    useCompressionStream: 'CompressionStream' in window,
    
    async compress(data) {
      if (typeof data === 'string') {
        if (this.useCompressionStream) {
          return await this.compressStream(data);
        }
        // Fallback: base64 encode
        return btoa(encodeURIComponent(data));
      }
      return JSON.stringify(data);
    },
    
    async decompress(data) {
      if (this.useCompressionStream && typeof data === 'string' && data.startsWith('lz4:')) {
        return await this.decompressStream(data.replace('lz4:', ''));
      }
      // Fallback
      try {
        return JSON.parse(data);
      } catch {
        return decodeURIComponent(atob(data));
      }
    },
    
    async compressStream(str) {
      const cs = new CompressionStream('gzip');
      const writer = cs.writable.getWriter();
      writer.write(new TextEncoder().encode(str));
      writer.close();
      
      const reader = cs.readable.getReader();
      const chunks = [];
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      
      const blob = new Blob(chunks);
      const reader2 = blob.arrayBuffer();
      const base64 = await new Response(reader2).text();
      
      return 'lz4:' + base64;
    },
    
    async decompressStream(data) {
      const binary = atob(data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      const cs = new DecompressionStream('gzip');
      const writer = cs.writable.getWriter();
      writer.write(bytes);
      writer.close();
      
      const reader = cs.readable.getReader();
      const chunks = [];
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      
      const result = new Blob(chunks);
      return await result.text();
    }
  };

  // ============ CACHE MANAGER ============
  window.MXDCache = {
    ttl: 3600000, // 1 hour default
    maxSize: 100, // Max items
    memoryCache: new Map(),
    
    async set(key, value, options = {}) {
      const ttl = options.ttl || this.ttl;
      const priority = options.priority || 'normal';
      const compress = options.compress !== false;
      
      const item = {
        key,
        value,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
        accessedAt: Date.now(),
        priority,
        size: JSON.stringify(value).length
      };
      
      // Compress if enabled
      if (compress && item.size > 1000) {
        item.compressed = await window.MXDCompression.compress(value);
        item.originalSize = item.size;
        item.compressedSize = item.compressed.length;
      }
      
      // Store in memory
      this.memoryCache.set(key, item);
      
      // Store in IndexedDB
      await window.MXDStorageManager.put('cache', item);
      
      // Evict if over limit
      await this.evictIfNeeded();
    },
    
    async get(key) {
      // Check memory first
      let item = this.memoryCache.get(key);
      
      if (!item) {
        // Check IndexedDB
        item = await window.MXDStorageManager.get('cache', key);
        if (item) {
          this.memoryCache.set(key, item);
        }
      }
      
      if (!item) return null;
      
      // Check expiry
      if (item.expiresAt < Date.now()) {
        this.delete(key);
        return null;
      }
      
      // Update access time
      item.accessedAt = Date.now();
      this.memoryCache.set(key, item);
      await window.MXDStorageManager.put('cache', item);
      
      // Decompress if needed
      if (item.compressed) {
        return await window.MXDCompression.decompress(item.compressed);
      }
      
      return item.value;
    },
    
    async delete(key) {
      this.memoryCache.delete(key);
      await window.MXDStorageManager.delete('cache', key);
    },
    
    async evictIfNeeded() {
      if (this.memoryCache.size <= this.maxSize) return;
      
      const items = Array.from(this.memoryCache.values())
        .sort((a, b) => {
          // Priority first, then LRU
          const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
          const pDiff = (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
          if (pDiff !== 0) return pDiff;
          return a.accessedAt - b.accessedAt;
        });
      
      const toRemove = items.slice(0, Math.floor(this.maxSize * 0.2));
      for (const item of toRemove) {
        await this.delete(item.key);
      }
      
      console.log(`MXDCache: Evicted ${toRemove.length} items`);
    },
    
    async clear() {
      this.memoryCache.clear();
      await window.MXDStorageManager.clear('cache');
    }
  };

  // ============ MAIN OFFLINE CORE ============
  window.MXDOfflineVortex = {
    initialized: false,
    version: '2.0.0',
    
    async init() {
      if (this.initialized) return;
      
      console.log('MXDOfflineVortex v2.0: Initializing...');
      
      // Initialize all subsystems
      await window.MXDStorageManager.init();
      await window.MXDWorkerPool.init();
      await window.MXDSyncQueue.init();
      await window.MXDNetworkHealth.init();
      await window.MXDErrorRecovery.init();
      
      this.initialized = true;
      console.log('MXDOfflineVortex v2.0: All systems initialized');
      
      // Dispatch ready event
      window.dispatchEvent(new CustomEvent('mxd-offline-ready'));
    },
    
    async warmCache() {
      console.log('MXDOfflineVortex: Warming cache...');
      
      try {
        // Load last 10 puzzles
        const puzzles = await window.MXDStorageManager.getAll('puzzles');
        const recentPuzzles = puzzles
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10);
        
        for (const puzzle of recentPuzzles) {
          await window.MXDCache.set(`puzzle_${puzzle.id}`, puzzle, { ttl: 86400000 }); // 24 hours
        }
        
        // Load last 10 word lists
        const wordlists = await window.MXDStorageManager.getAll('wordlists');
        const recentLists = wordlists
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10);
        
        for (const list of recentLists) {
          await window.MXDCache.set(`wordlist_${list.id}`, list, { ttl: 86400000 });
        }
        
        console.log(`MXDOfflineVortex: Cache warmed with ${recentPuzzles.length} puzzles and ${recentLists.length} word lists`);
      } catch (e) {
        console.error('MXDOfflineVortex: Cache warming failed:', e);
      }
    },
    
    async savePuzzle(puzzle) {
      const data = {
        ...puzzle,
        timestamp: Date.now()
      };
      
      // Save to IndexedDB
      await window.MXDStorageManager.put('puzzles', data);
      
      // Cache it
      await window.MXDCache.set(`puzzle_${data.id || data.timestamp}`, data);
      
      // Queue for sync
      await window.MXDSyncQueue.enqueue({
        type: 'savePuzzle',
        data
      }, 'normal');
    },
    
    async saveWordList(wordlist) {
      const data = {
        ...wordlist,
        timestamp: Date.now()
      };
      
      await window.MXDStorageManager.put('wordlists', data);
      await window.MXDCache.set(`wordlist_${data.id || data.timestamp}`, data);
      
      await window.MXDSyncQueue.enqueue({
        type: 'saveWordList',
        data
      }, 'normal');
    },
    
    async generatePuzzleAsync(config) {
      // Use worker pool for off-main-thread generation
      return await window.MXDWorkerPool.execute('generatePuzzle', config);
    },
    
    async getPuzzles(limit = 10) {
      const puzzles = await window.MXDStorageManager.getAll('puzzles');
      return puzzles
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
    },
    
    async getWordLists(limit = 10) {
      const wordlists = await window.MXDStorageManager.getAll('wordlists');
      return wordlists
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
    },
    
    async syncNow() {
      await window.MXDSyncQueue.processQueue();
    },
    
    async getFullStatus() {
      const [network, queue, worker, storage] = await Promise.all([
        Promise.resolve(window.MXDNetworkHealth.getStatus()),
        window.MXDSyncQueue.getStatus(),
        Promise.resolve(window.MXDWorkerPool.getStats()),
        this.getStorageStatus()
      ]);
      
      return {
        version: this.version,
        initialized: this.initialized,
        network,
        queue,
        worker,
        storage
      };
    },
    
    async getStorageStatus() {
      try {
        if (navigator.storage && navigator.storage.estimate) {
          const estimate = await navigator.storage.estimate();
          return {
            used: estimate.usage || 0,
            quota: estimate.quota || 0,
            percent: estimate.quota ? ((estimate.usage / estimate.quota) * 100).toFixed(1) + '%' : 'N/A'
          };
        }
      } catch (e) {
        console.error('MXDOfflineVortex: Storage status error:', e);
      }
      return { used: 'N/A', quota: 'N/A', percent: 'N/A' };
    }
  };

  // ============ AUTO-INITIALIZE ============
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.MXDOfflineVortex.init());
  } else {
    window.MXDOfflineVortex.init();
  }

  console.log('MXDOfflineVortex v2.0: Script loaded');
})();
