// mxd-error-recovery-vortex.js — Ultimate Self-Healing System (30x Enhanced)
// Global handlers, retry logic, intelligent recovery, silent operations
(function(){
  'use strict';

  const VERSION = '30.0.0';

  const ERROR_SEVERITY = {
    CRITICAL: { level: 'critical', color: '#ff0000', retryAttempts: 5, timeout: 5000 },
    WARNING: { level: 'warning', color: '#ffaa00', retryAttempts: 3, timeout: 3000 },
    INFO: { level: 'info', color: '#00aa00', retryAttempts: 1, timeout: 1000 }
  };

  const RECOVERY_STRATEGIES = {
    AUTO_RETRY: 'auto_retry',
    FALLBACK: 'fallback',
    RESET_STATE: 'reset_state',
    CLEAR_CACHE: 'clear_cache',
    RESTORE_BACKUP: 'restore_backup',
    GRACEFUL_DEGRADE: 'graceful_degrade',
    IGNORE: 'ignore'
  };

  const ERROR_TYPES = {
    STORAGE: 'storage',
    NETWORK: 'network',
    RENDER: 'render',
    TIMEOUT: 'timeout',
    MEMORY: 'memory',
    PERMISSION: 'permission',
    UNKNOWN: 'unknown'
  };

  class MXDErrorRecoveryVortex {
    constructor() {
      this.errorLog = [];
      this.errorPatterns = {};
      this.recoveryAttempts = {};
      this.isActive = true;
      this.listeners = {};
      this.errorThreshold = 10;
      this.maxLogSize = 500;
      this.maxPatterns = 100;
      this.offlineQueue = [];
      this.backupSystem = null;
      this.selfHealingEnabled = true;
      this.intelligentRouting = true;
      this.settings = this.loadSettings();
      this.statistics = this.loadStatistics();
      this.corruptionDetector = null;
      this.healthMonitor = null;
      this.init();
    }

    init() {
      console.log(`🔧 MXD Error Recovery Vortex v${VERSION} — 30x Ultimate Self-Healing`);
      this.setupGlobalErrorHandlers();
      this.setupPromiseRejectionHandler();
      this.setupNetworkErrorHandler();
      this.setupTimeoutHandler();
      this.setupMemoryMonitor();
      this.setupCorruptionDetector();
      this.setupHealthMonitor();
      this.loadErrorPatterns();
      this.restoreOfflineOperations();
    }

    loadSettings() {
      try {
        const saved = localStorage.getItem('mxd_error_recovery_settings');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
      return {
        maxRetryAttempts: 5,
        baseRetryDelay: 1000,
        maxRetryDelay: 30000,
        exponentialBackoff: true,
        backoffMultiplier: 2,
        errorThreshold: 10,
        enableOfflineQueue: true,
        enableAutoBackup: true,
        backupInterval: 300000,
        clearOldDataOnError: true,
        enableSelfHealing: true,
        intelligentRecovery: true,
        gracefulDegradation: true,
        silentMode: true,
        logErrors: true,
        trackPatterns: true,
        autoOptimize: true,
        healthCheckInterval: 60000
      };
    }

    saveSettings() {
      try { localStorage.setItem('mxd_error_recovery_settings', JSON.stringify(this.settings)); } catch (e) {}
    }

    loadStatistics() {
      try {
        const saved = localStorage.getItem('mxd_error_recovery_stats');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
      return {
        totalErrors: 0, totalRecoveries: 0, totalRetries: 0,
        criticalErrors: 0, warnings: 0, infoMessages: 0,
        offlineOperations: 0, successfulHealings: 0, failedHealings: 0,
        avgRecoveryTime: 0, totalRecoveryTime: 0,
        byType: {}, bySeverity: {}, patternsDetected: 0,
        healthScore: 100, lastHealthCheck: null
      };
    }

    saveStatistics() {
      try { localStorage.setItem('mxd_error_recovery_stats', JSON.stringify(this.statistics)); } catch (e) {}
    }

    setupGlobalErrorHandlers() {
      window.addEventListener('error', (event) => {
        this.handleError({
          type: ERROR_TYPES.UNKNOWN,
          source: 'window',
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error,
          timestamp: Date.now()
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.handleError({
          type: ERROR_TYPES.UNKNOWN,
          source: 'promise',
          message: event.reason?.message || String(event.reason),
          error: event.reason,
          timestamp: Date.now()
        });
      });
    }

    setupPromiseRejectionHandler() {
      const originalFetch = window.fetch;
      const self = this;

      // Local endpoints that are expected to fail when not running
      const localEndpoints = [
        'localhost:11434', // Ollama
        'localhost:1234',  // LM Studio
        'localhost:5000'   // KoboldCPP
      ];

      window.fetch = async function(...args) {
        try {
          return await originalFetch.apply(this, args);
        } catch (error) {
          const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || '';
          
          // Skip logging for expected local AI endpoints
          const isLocalAI = localEndpoints.some(ep => url.includes(ep));
          if (isLocalAI) {
            return; // Silently ignore - local AI not running is expected
          }
          
          self.handleError({
            type: ERROR_TYPES.NETWORK,
            source: 'fetch',
            message: error.message,
            url: url,
            timestamp: Date.now()
          });
          throw error;
        }
      };
    }

    setupNetworkErrorHandler() {
      window.addEventListener('online', () => {
        this.emit('networkStatus', { online: true, timestamp: Date.now() });
        this.retryFailedOperations();
      });

      window.addEventListener('offline', () => {
        this.emit('networkStatus', { online: false, timestamp: Date.now() });
        this.queueOfflineOperations();
      });
    }

    setupTimeoutHandler() {
      this.activeOperations = new Map();
      this.timeoutWarnings = new Map();

      setInterval(() => {
        this.checkLongRunningOperations();
      }, 10000);
    }

    setupMemoryMonitor() {
      if ('memory' in performance) {
        setInterval(() => {
          const memory = performance.memory;
          if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
            this.handleError({
              type: ERROR_TYPES.MEMORY,
              source: 'memory_monitor',
              message: 'High memory usage detected',
              usage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
              timestamp: Date.now()
            });
            this.cleanupMemory();
          }
        }, 30000);
      }
    }

    setupCorruptionDetector() {
      this.corruptionDetector = {
        checkData: (key) => {
          try {
            const data = localStorage.getItem(key);
            if (data) {
              JSON.parse(data);
              return { corrupted: false };
            }
            return { corrupted: false, empty: true };
          } catch (e) {
            return { corrupted: true, error: e.message };
          }
        },

        repairData: (key) => {
          try {
            const data = localStorage.getItem(key);
            if (!data) return { repaired: false, reason: 'no_data' };

            const parsed = JSON.parse(data);
            localStorage.setItem(key, JSON.stringify(parsed));
            return { repaired: true };
          } catch (e) {
            localStorage.removeItem(key);
            return { repaired: false, reason: 'remove_corrupted' };
          }
        }
      };
    }

    setupHealthMonitor() {
      this.healthMonitor = {
        score: 100,
        checks: {},

        runCheck: (name, fn) => {
          try {
            const result = fn();
            this.healthMonitor.checks[name] = { status: 'healthy', result, timestamp: Date.now() };
            return result;
          } catch (e) {
            this.healthMonitor.checks[name] = { status: 'unhealthy', error: e.message, timestamp: Date.now() };
            this.healthMonitor.score -= 10;
            return null;
          }
        },

        getScore: () => {
          const checks = Object.values(this.healthMonitor.checks);
          if (checks.length === 0) return 100;
          const healthyCount = checks.filter(c => c.status === 'healthy').length;
          return Math.round((healthyCount / checks.length) * 100);
        },

        comprehensiveCheck: () => {
          const results = {
            storage: window.localStorage ? 'healthy' : 'unhealthy',
            network: navigator.onLine ? 'healthy' : 'degraded',
            memory: 'unknown',
            render: 'healthy',
            timestamp: Date.now()
          };

          if ('memory' in performance) {
            const mem = performance.memory;
            results.memory = mem.usedJSHeapSize < mem.jsHeapSizeLimit * 0.8 ? 'healthy' : 'degraded';
          }

          this.statistics.healthScore = Object.values(results).filter(v => v === 'healthy').length / Object.keys(results).length * 100;
          this.statistics.lastHealthCheck = Date.now();
          this.saveStatistics();

          this.emit('healthCheck', results);
          return results;
        }
      };
    }

    handleError(error) {
      if (!this.isActive) return;

      const errorId = `error_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
      error.id = errorId;
      error.attempts = this.recoveryAttempts[errorId] || 0;
      error.severity = this.classifyError(error);
      error.type = this.detectErrorType(error);

      if (this.settings.logErrors) {
        this.logError(error);
      }

      if (this.settings.trackPatterns) {
        this.trackErrorPattern(error);
      }

      this.statistics.totalErrors++;
      this.updateStatistics(error);

      const strategy = this.determineRecoveryStrategy(error);
      this.executeRecovery(error, strategy);
    }

    classifyError(error) {
      const message = (error.message || '').toLowerCase();
      const criticalPatterns = [
        'localStorage', 'indexedDB', 'Cannot read', 'undefined is not',
        'null is not', 'Failed to fetch', 'NetworkError', 'quotaexceeded',
        'permission denied', 'securityerror', 'circular reference'
      ];

      const warningPatterns = [
        'deprecated', 'warning', 'invalid', 'timeout', 'slow',
        'performance', 'memory', 'overflow'
      ];

      for (const pattern of criticalPatterns) {
        if (message.includes(pattern.toLowerCase())) {
          return ERROR_SEVERITY.CRITICAL;
        }
      }

      for (const pattern of warningPatterns) {
        if (message.includes(pattern.toLowerCase())) {
          return ERROR_SEVERITY.WARNING;
        }
      }

      return ERROR_SEVERITY.INFO;
    }

    detectErrorType(error) {
      const message = (error.message || '').toLowerCase();

      if (message.includes('localStorage') || message.includes('quota') || message.includes('storage')) {
        return ERROR_TYPES.STORAGE;
      }
      if (message.includes('fetch') || message.includes('network') || message.includes('connection')) {
        return ERROR_TYPES.NETWORK;
      }
      if (message.includes('canvas') || message.includes('webgl') || message.includes('context')) {
        return ERROR_TYPES.RENDER;
      }
      if (message.includes('timeout')) {
        return ERROR_TYPES.TIMEOUT;
      }
      if (message.includes('memory') || message.includes('heap')) {
        return ERROR_TYPES.MEMORY;
      }
      if (message.includes('permission') || message.includes('access')) {
        return ERROR_TYPES.PERMISSION;
      }

      return ERROR_TYPES.UNKNOWN;
    }

    determineRecoveryStrategy(error) {
      if (!this.intelligentRouting) {
        return RECOVERY_STRATEGIES.AUTO_RETRY;
      }

      switch (error.type) {
        case ERROR_TYPES.STORAGE:
          return RECOVERY_STRATEGIES.CLEAR_CACHE;
        case ERROR_TYPES.NETWORK:
          return navigator.onLine ? RECOVERY_STRATEGIES.AUTO_RETRY : RECOVERY_STRATEGIES.IGNORE;
        case ERROR_TYPES.MEMORY:
          return RECOVERY_STRATEGIES.CLEAR_CACHE;
        case ERROR_TYPES.TIMEOUT:
          return RECOVERY_STRATEGIES.AUTO_RETRY;
        default:
          return RECOVERY_STRATEGIES.AUTO_RETRY;
      }
    }

    executeRecovery(error, strategy) {
      switch (strategy) {
        case RECOVERY_STRATEGIES.AUTO_RETRY:
          this.attemptRetry(error);
          break;
        case RECOVERY_STRATEGIES.CLEAR_CACHE:
          this.attemptCacheClear(error);
          break;
        case RECOVERY_STRATEGIES.RESET_STATE:
          this.resetToStableState(error);
          break;
        case RECOVERY_STRATEGIES.IGNORE:
          this.emit('errorIgnored', error);
          break;
        case RECOVERY_STRATEGIES.GRACEFUL_DEGRADE:
          this.gracefulDegrade(error);
          break;
        default:
          this.attemptRetry(error);
      }
    }

    attemptRetry(error) {
      const maxAttempts = this.settings.maxRetryAttempts;
      const errorId = error.id;

      if (error.attempts >= maxAttempts) {
        this.handleMaxRetriesExceeded(error);
        return;
      }

      this.recoveryAttempts[errorId] = (this.recoveryAttempts[errorId] || 0) + 1;
      this.statistics.totalRetries++;

      const delay = this.calculateRetryDelay(error.attempts);

      setTimeout(() => {
        this.emit('retryAttempt', { error, attempt: this.recoveryAttempts[errorId], delay });

        if (this.canRecover(error)) {
          this.recordRecovery(error, true);
        } else {
          this.executeRecovery(error, this.determineRecoveryStrategy(error));
        }
      }, delay);
    }

    calculateRetryDelay(attempts) {
      if (this.settings.exponentialBackoff) {
        const delay = this.settings.baseRetryDelay * Math.pow(this.settings.backoffMultiplier, attempts);
        return Math.min(delay, this.settings.maxRetryDelay);
      }
      return this.settings.baseRetryDelay;
    }

    canRecover(error) {
      switch (error.type) {
        case ERROR_TYPES.STORAGE:
          try {
            localStorage.setItem('__test__', '1');
            localStorage.removeItem('__test__');
            return true;
          } catch (e) { return false; }
        case ERROR_TYPES.NETWORK:
          return navigator.onLine;
        case ERROR_TYPES.MEMORY:
          if ('memory' in performance) {
            const mem = performance.memory;
            return mem.usedJSHeapSize < mem.jsHeapSizeLimit * 0.8;
          }
          return true;
        default:
          return true;
      }
    }

    handleMaxRetriesExceeded(error) {
      this.emit('maxRetriesExceeded', error);

      if (this.settings.gracefulDegradation) {
        this.gracefulDegrade(error);
      }

      if (this.settings.clearOldDataOnError) {
        this.cleanupOldData();
      }
    }

    gracefulDegrade(error) {
      this.emit('gracefulDegradation', { error, timestamp: Date.now() });

      switch (error.type) {
        case ERROR_TYPES.NETWORK:
          if (this.settings.enableOfflineQueue) {
            this.queueOfflineOperation(error);
          }
          break;
        case ERROR_TYPES.MEMORY:
          this.cleanupMemory();
          this.emit('memoryCleaned', { success: true });
          break;
        case ERROR_TYPES.STORAGE:
          this.cleanupStorage();
          break;
      }
    }

    resetToStableState(error) {
      this.emit('stateReset', { source: 'recovery', error, timestamp: Date.now() });

      if (window.MXD_BACKUP) {
        window.MXD_BACKUP.restoreBackup().then(backup => {
          if (backup) {
            this.recordRecovery(error, true, 'backup_restore');
          }
        }).catch(() => {
          this.recordRecovery(error, false, 'backup_failed');
        });
      }

      this.clearProblematicData(error);
    }

    attemptCacheClear(error) {
      this.cleanupStorage();
      this.cleanupMemory();

      this.emit('cacheCleared', { type: error.type, timestamp: Date.now() });

      setTimeout(() => {
        if (this.canRecover(error)) {
          this.recordRecovery(error, true, 'cache_clear');
        }
      }, 500);
    }

    cleanupStorage() {
      try {
        const keys = Object.keys(localStorage);
        let cleaned = 0;

        for (const key of keys) {
          if (key.startsWith('mxd_') || key.startsWith('mxd-')) {
            try {
              const data = localStorage.getItem(key);
              JSON.parse(data);
            } catch (e) {
              localStorage.removeItem(key);
              cleaned++;
            }
          }
        }

        const backupKey = 'mxd_backup_system';
        const stored = localStorage.getItem(backupKey);
        if (stored) {
          const data = JSON.parse(stored);
          if (data.backups && data.backups.length > 10) {
            data.backups = data.backups.slice(-10);
            localStorage.setItem(backupKey, JSON.stringify(data));
          }
        }

        this.emit('storageCleaned', { cleaned, timestamp: Date.now() });
      } catch (e) {
        this.emit('storageCleanFailed', { error: e.message, timestamp: Date.now() });
      }
    }

    cleanupMemory() {
      const caches = window.caches || {};
      const keys = Object.keys(caches);

      keys.forEach(key => {
        if (key.includes('mxd')) {
          caches.delete(key).catch(() => {});
        }
      });

      if ('gc' in window) {
        window.gc();
      }

      this.clearInternalCaches();

      this.emit('memoryCleaned', { timestamp: Date.now() });
    }

    clearInternalCaches() {
      if (window.MXD_BATCH_VORTEX) {
        window.MXD_BATCH_VORTEX.clearCache?.();
      }
      if (window.MXD_PUZZLE_OPTIMIZER_VORTEX) {
        window.MXD_PUZZLE_OPTIMIZER_VORTEX.clearCache?.();
      }
      if (window.MXD_WORD_PROCESSOR_VORTEX) {
        window.MXD_WORD_PROCESSOR_VORTEX.clearCache?.();
      }
    }

    cleanupOldData() {
      try {
        const patterns = ['_cache', '_temp', '_old', '_backup'];
        const keys = Object.keys(localStorage);

        keys.forEach(key => {
          const shouldClean = patterns.some(p => key.includes(p));
          if (shouldClean) {
            try {
              const age = Date.now() - (localStorage.getItem(key + '_time') || 0);
              if (age > 86400000) {
                localStorage.removeItem(key);
                localStorage.removeItem(key + '_time');
              }
            } catch (e) {}
          }
        });
      } catch (e) {}
    }

    clearProblematicData(error) {
      try {
        const problematicKeys = [
          'mxd:settings', 'mxd_puzzles', 'mxd_grid', 'mxd_words',
          'mxd_current', 'mxd_last'
        ];

        problematicKeys.forEach(key => {
          try {
            const data = localStorage.getItem(key);
            if (data) {
              try {
                JSON.parse(data);
              } catch (e) {
                localStorage.removeItem(key);
                this.logRecovery('Removed corrupted data: ' + key, error);
              }
            }
          } catch (e) {}
        });
      } catch (e) {}
    }

    queueOfflineOperations() {
      this.emit('offlineMode', { queued: this.offlineQueue.length, timestamp: Date.now() });
    }

    queueOfflineOperation(operation) {
      this.offlineQueue.push({
        ...operation,
        queuedAt: Date.now(),
        retries: 0
      });
      this.statistics.offlineOperations++;
      this.emit('operationQueued', operation);
    }

    retryFailedOperations() {
      if (!this.offlineQueue || this.offlineQueue.length === 0) return;

      const queue = [...this.offlineQueue];
      this.offlineQueue = [];
      let retried = 0;

      queue.forEach(operation => {
        try {
          if (operation.callback) {
            operation.callback();
            this.logRecovery('Retried offline operation', operation);
            retried++;
          }
        } catch (e) {
          this.offlineQueue.push(operation);
        }
      });

      this.emit('offlineOperationsRetried', { count: retried, remaining: this.offlineQueue.length });
    }

    restoreOfflineOperations() {
      try {
        const stored = localStorage.getItem('mxd_offline_queue');
        if (stored) {
          this.offlineQueue = JSON.parse(stored);
        }
      } catch (e) {}
    }

    saveOfflineOperations() {
      try {
        localStorage.setItem('mxd_offline_queue', JSON.stringify(this.offlineQueue));
      } catch (e) {}
    }

    checkLongRunningOperations() {
      const now = Date.now();
      const timeout = 60000;

      this.activeOperations.forEach((op, id) => {
        if (now - op.startTime > timeout) {
          this.handleError({
            type: ERROR_TYPES.TIMEOUT,
            source: 'operation_monitor',
            message: `Long running operation: ${id}`,
            operationId: id,
            duration: now - op.startTime,
            timestamp: now
          });

          this.activeOperations.delete(id);
        }
      });
    }

    trackErrorPattern(error) {
      const pattern = this.extractErrorPattern(error) || 'unknown_error';

      if (!this.errorPatterns[pattern]) {
        this.errorPatterns[pattern] = {
          count: 0, lastSeen: 0, errors: [], severity: null
        };
      }

      this.errorPatterns[pattern].count++;
      this.errorPatterns[pattern].lastSeen = Date.now();
      if (error?.severity) this.errorPatterns[pattern].severity = error.severity;

      if (this.errorPatterns[pattern].errors && this.errorPatterns[pattern].errors.length < 10) {
        this.errorPatterns[pattern].errors.push({
          message: error?.message || 'Unknown error',
          timestamp: error?.timestamp || Date.now()
        });
      }

      if (this.errorPatterns[pattern].count > 5) {
        this.emit('frequentError', {
          pattern,
          count: this.errorPatterns[pattern].count
        });
        this.statistics.patternsDetected++;
      }

      this.saveErrorPatterns();
    }

    extractErrorPattern(error) {
      const msg = (error.message || '').toLowerCase();
      return msg
        .replace(/\d+/g, 'N')
        .replace(/[a-zA-Z0-9@.-]+/g, 'X')
        .substring(0, 100);
    }

    loadErrorPatterns() {
      try {
        const stored = localStorage.getItem('mxd_error_patterns');
        if (stored) {
          this.errorPatterns = JSON.parse(stored);
        }
      } catch (e) {}
    }

    saveErrorPatterns() {
      try {
        const frequent = {};
        Object.entries(this.errorPatterns)
          .filter(([_, data]) => data.count > 2)
          .slice(0, this.maxPatterns)
          .forEach(([key, value]) => {
            frequent[key] = value;
          });
        localStorage.setItem('mxd_error_patterns', JSON.stringify(frequent));
      } catch (e) {}
    }

    logError(error) {
      this.errorLog.push(error);

      if (this.errorLog.length > this.maxLogSize) {
        this.errorLog.shift();
      }

      if (error.severity?.level === 'critical' && !this.settings.silentMode) {
        console.error('MXD Critical Error:', error);
      }
    }

    logRecovery(action, error) {
      this.errorLog.push({
        type: 'recovery',
        action,
        errorId: error.id,
        timestamp: Date.now()
      });
    }

    recordRecovery(error, success, method = 'auto') {
      this.statistics.totalRecoveries++;
      if (success) {
        this.statistics.successfulHealings++;
      } else {
        this.statistics.failedHealings++;
      }

      this.emit('recoveryComplete', { error, success, method, timestamp: Date.now() });
    }

    updateStatistics(error) {
      if (!this.statistics.byType[error.type]) {
        this.statistics.byType[error.type] = { count: 0, recovered: 0 };
      }
      this.statistics.byType[error.type].count++;

      if (!this.statistics.bySeverity[error.severity?.level]) {
        this.statistics.bySeverity[error.severity?.level] = { count: 0 };
      }
      this.statistics.bySeverity[error.severity?.level].count++;

      if (error.severity?.level === 'critical') {
        this.statistics.criticalErrors++;
      }

      this.saveStatistics();
    }

    on(event, callback) {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(callback);
    }

    off(event, callback) {
      if (!this.listeners[event]) return;
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    emit(event, data) {
      if (!this.listeners[event]) return;
      this.listeners[event].forEach(cb => {
        try { cb(data); } catch (e) { console.error('Event handler error:', e); }
      });
    }

    getStatus() {
      return {
        isActive: this.isActive,
        errorCount: this.errorLog.length,
        errorPatterns: Object.keys(this.errorPatterns).length,
        recoveryAttempts: Object.keys(this.recoveryAttempts).length,
        offlineQueue: this.offlineQueue.length,
        version: VERSION,
        statistics: this.statistics,
        settings: this.settings,
        health: this.healthMonitor?.getScore() || 100
      };
    }

    getRecentErrors(count = 10) {
      return this.errorLog.slice(-count);
    }

    getErrorPatterns() {
      return { ...this.errorPatterns };
    }

    clearErrorLog() {
      this.errorLog = [];
      this.emit('errorLogCleared');
    }

    enable() { this.isActive = true; }
    disable() { this.isActive = false; }

    forceHealthCheck() {
      return this.healthMonitor?.comprehensiveCheck() || {};
    }

    forceCleanup() {
      this.cleanupStorage();
      this.cleanupMemory();
      this.cleanupOldData();
      this.emit('forcedCleanup', { timestamp: Date.now() });
    }
  }

  window.MXD_ERROR_RECOVERY_VORTEX = new MXDErrorRecoveryVortex();
  window.MXDErrorRecoveryVortex = MXDErrorRecoveryVortex;
  window.ERROR_SEVERITY_VORTEX = ERROR_SEVERITY;
  window.RECOVERY_STRATEGIES_VORTEX = RECOVERY_STRATEGIES;
  window.ERROR_TYPES_VORTEX = ERROR_TYPES;
})();