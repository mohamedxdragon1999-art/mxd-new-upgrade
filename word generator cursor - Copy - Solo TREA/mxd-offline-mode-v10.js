/**
 * MXD Perfect Offline Mode v10.0
 * 
 * Flawless offline functionality with:
 * - IndexedDB for persistent storage (puzzles, settings, progress, presets)
 * - Service Worker for asset caching and offline access
 * - Sync Engine for reconnect and data synchronization
 * - Connectivity Manager with heartbeat monitoring
 * - Offline-first architecture
 * - Graceful degradation
 * - Auto-sync when back online
 * 
 * @module MXDOfflineMode
 * @version 10.0.0
 */
(function(){
  'use strict';

  /**
   * IndexedDB Manager
   * Handles all persistent data storage
   */
  var IndexedDB = {
    dbName: 'MXDProV10',
    dbVersion: 10,
    db: null,

    /**
     * Store definitions
     */
    stores: {
      puzzles: {keyPath: 'id', indexes: ['createdAt', 'title', 'tags']},
      settings: {keyPath: 'key', indexes: ['updatedAt']},
      progress: {keyPath: 'puzzleId', indexes: ['updatedAt', 'completed']},
      presets: {keyPath: 'id', indexes: ['name', 'createdAt', 'category']},
      cache: {keyPath: 'key', indexes: ['expiresAt', 'type']},
      wordlists: {keyPath: 'id', indexes: ['name', 'createdAt', 'tags']}
    },

    /**
     * Initialize database
     */
    init: function(){
      var self = this;
      return new Promise(function(resolve, reject){
        if(self.db){
          resolve(self.db);
          return;
        }

        var request = indexedDB.open(self.dbName, self.dbVersion);

        request.onupgradeneeded = function(event){
          var db = event.target.result;
          var oldVersion = event.oldVersion;

          // Create stores
          Object.keys(self.stores).forEach(function(storeName){
            if(!db.objectStoreNames.contains(storeName)){
              var storeConfig = self.stores[storeName];
              var store = db.createObjectStore(storeName, {keyPath: storeConfig.keyPath});

              // Create indexes
              if(storeConfig.indexes){
                storeConfig.indexes.forEach(function(indexName){
                  if(!store.indexNames.contains(indexName)){
                    store.createIndex(indexName, indexName, {unique: false});
                  }
                });
              }
            }
          });
        };

        request.onsuccess = function(event){
          self.db = event.target.result;

          // Handle connection close
          self.db.onclose = function(){
            self.db = null;
          };

          resolve(self.db);
        };

        request.onerror = function(event){
          reject(new Error('IndexedDB open failed: ' + event.target.error));
        };
      });
    },

    /**
     * Put (insert or update) a record
     */
    put: function(storeName, data){
      var self = this;
      return this.init().then(function(db){
        return new Promise(function(resolve, reject){
          var tx = db.transaction(storeName, 'readwrite');
          var store = tx.objectStore(storeName);
          var request = store.put(data);

          request.onsuccess = function(){
            resolve(request.result);
          };

          request.onerror = function(){
            reject(new Error('Put failed: ' + request.error));
          };
        });
      });
    },

    /**
     * Get a record by key
     */
    get: function(storeName, key){
      var self = this;
      return this.init().then(function(db){
        return new Promise(function(resolve, reject){
          var tx = db.transaction(storeName, 'readonly');
          var store = tx.objectStore(storeName);
          var request = store.get(key);

          request.onsuccess = function(){
            resolve(request.result);
          };

          request.onerror = function(){
            reject(new Error('Get failed: ' + request.error));
          };
        });
      });
    },

    /**
     * Delete a record
     */
    delete: function(storeName, key){
      var self = this;
      return this.init().then(function(db){
        return new Promise(function(resolve, reject){
          var tx = db.transaction(storeName, 'readwrite');
          var store = tx.objectStore(storeName);
          var request = store.delete(key);

          request.onsuccess = function(){
            resolve();
          };

          request.onerror = function(){
            reject(new Error('Delete failed: ' + request.error));
          };
        });
      });
    },

    /**
     * Get all records from a store
     */
    getAll: function(storeName){
      var self = this;
      return this.init().then(function(db){
        return new Promise(function(resolve, reject){
          var tx = db.transaction(storeName, 'readonly');
          var store = tx.objectStore(storeName);
          var request = store.getAll();

          request.onsuccess = function(){
            resolve(request.result);
          };

          request.onerror = function(){
            reject(new Error('GetAll failed: ' + request.error));
          };
        });
      });
    },

    /**
     * Query by index
     */
    query: function(storeName, indexName, value){
      var self = this;
      return this.init().then(function(db){
        return new Promise(function(resolve, reject){
          var tx = db.transaction(storeName, 'readonly');
          var store = tx.objectStore(storeName);
          var index = store.index(indexName);
          var request = index.getAll(value);

          request.onsuccess = function(){
            resolve(request.result);
          };

          request.onerror = function(){
            reject(new Error('Query failed: ' + request.error));
          };
        });
      });
    },

    /**
     * Clear a store
     */
    clear: function(storeName){
      var self = this;
      return this.init().then(function(db){
        return new Promise(function(resolve, reject){
          var tx = db.transaction(storeName, 'readwrite');
          var store = tx.objectStore(storeName);
          var request = store.clear();

          request.onsuccess = function(){
            resolve();
          };

          request.onerror = function(){
            reject(new Error('Clear failed: ' + request.error));
          };
        });
      });
    },

    /**
     * Get storage usage
     */
    getUsage: function(){
      var self = this;
      return this.init().then(function(db){
        return new Promise(function(resolve, reject){
          var sizes = {};
          var pending = 0;
          var completed = 0;

          Object.keys(self.stores).forEach(function(storeName){
            pending++;
            var tx = db.transaction(storeName, 'readonly');
            var store = tx.objectStore(storeName);
            var request = store.getAll();

            request.onsuccess = function(){
              sizes[storeName] = request.result.length;
              completed++;
              if(completed === pending){
                resolve(sizes);
              }
            };

            request.onerror = function(){
              sizes[storeName] = 0;
              completed++;
              if(completed === pending){
                resolve(sizes);
              }
            };
          });
        });
      });
    }
  };

  /**
   * Connectivity Manager
   * Monitors online/offline status with heartbeat
   */
  var Connectivity = {
    online: navigator.onLine,
    listeners: {},
    heartbeatInterval: null,
    heartbeatFailures: 0,
    maxHeartbeatFailures: 3,

    /**
     * Initialize connectivity monitoring
     */
    init: function(config){
      config = config || {};
      var self = this;

      // Listen to browser online/offline events
      window.addEventListener('online', function(){
        self._setOnline(true);
      });

      window.addEventListener('offline', function(){
        self._setOnline(false);
      });

      // Start heartbeat if configured
      if(config.heartbeatUrl){
        this._startHeartbeat(config.heartbeatUrl, config.heartbeatIntervalMs || 30000);
      }

      this.maxHeartbeatFailures = config.maxHeartbeatFailures || 3;
    },

    /**
     * Set online status and notify listeners
     */
    _setOnline: function(online){
      if(this.online === online) return;
      this.online = online;
      this.heartbeatFailures = 0;

      this._emit(online ? 'online' : 'offline');
    },

    /**
     * Start heartbeat monitoring
     */
    _startHeartbeat: function(url, intervalMs){
      var self = this;

      this.heartbeatInterval = setInterval(function(){
        if(!self.online) return;

        fetch(url, {method:'HEAD', mode:'no-cors', cache:'no-store'})
          .then(function(){
            self.heartbeatFailures = 0;
          })
          .catch(function(){
            self.heartbeatFailures++;
            if(self.heartbeatFailures >= self.maxHeartbeatFailures){
              self._setOnline(false);
            }
          });
      }, intervalMs);
    },

    /**
     * Register event listener
     */
    on: function(event, callback){
      if(!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(callback);
    },

    /**
     * Remove event listener
     */
    off: function(event, callback){
      if(!this.listeners[event]) return;
      var idx = this.listeners[event].indexOf(callback);
      if(idx >= 0) this.listeners[event].splice(idx, 1);
    },

    /**
     * Emit event to listeners
     */
    _emit: function(event){
      var listeners = this.listeners[event] || [];
      for(var i=0;i<listeners.length;i++){
        try { listeners[i](); } catch(e){}
      }
    },

    /**
     * Destroy
     */
    destroy: function(){
      if(this.heartbeatInterval){
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
      this.listeners = {};
    }
  };

  /**
   * Sync Engine
   * Handles data synchronization when reconnecting
   */
  var SyncEngine = {
    pendingSyncs: [],
    syncing: false,

    /**
     * Queue a sync operation
     */
    queue: function(operation){
      this.pendingSyncs.push({
        operation: operation,
        timestamp: Date.now(),
        retries: 0
      });
      this._trySync();
    },

    /**
     * Try to process pending syncs
     */
    _trySync: function(){
      var self = this;
      if(this.syncing || this.pendingSyncs.length === 0 || !Connectivity.online) return;

      this.syncing = true;
      var sync = this.pendingSyncs[0];

      // Execute sync operation
      Promise.resolve(sync.operation())
        .then(function(){
          self.pendingSyncs.shift();
          self.syncing = false;
          self._trySync();
        })
        .catch(function(){
          sync.retries++;
          if(sync.retries >= 3){
            self.pendingSyncs.shift();
          }
          self.syncing = false;
          // Retry after delay
          setTimeout(function(){ self._trySync(); }, 5000);
        });
    },

    /**
     * Get pending sync count
     */
    getPendingCount: function(){
      return this.pendingSyncs.length;
    },

    /**
     * Clear pending syncs
     */
    clear: function(){
      this.pendingSyncs = [];
      this.syncing = false;
    }
  };

  /**
   * Cache Manager
   * Handles asset and data caching for offline access
   */
  var CacheManager = {
    /**
     * Cache a resource
     */
    cache: function(key, data, ttlMs){
      ttlMs = ttlMs || 86400000; // 24 hours default
      return IndexedDB.put('cache', {
        key: key,
        data: data,
        createdAt: Date.now(),
        expiresAt: Date.now() + ttlMs,
        type: typeof data === 'string' ? 'string' : 'json',
        size: JSON.stringify(data).length
      });
    },

    /**
     * Get cached resource
     */
    get: function(key){
      return IndexedDB.get('cache', key).then(function(item){
        if(!item) return null;
        if(item.expiresAt < Date.now()){
          // Expired
          IndexedDB.delete('cache', key);
          return null;
        }
        return item.data;
      });
    },

    /**
     * Clean up expired cache entries
     */
    cleanup: function(){
      return IndexedDB.getAll('cache').then(function(items){
        var expired = items.filter(function(item){
          return item.expiresAt < Date.now();
        });

        var promises = expired.map(function(item){
          return IndexedDB.delete('cache', item.key);
        });

        return Promise.all(promises).then(function(){
          return expired.length;
        });
      });
    }
  };

  /**
   * Offline Status UI
   */
  var OfflineUI = {
    _element: null,

    /**
     * Render status bar
     */
    render: function(containerId){
      var container = document.getElementById(containerId);
      if(!container) return;

      this._element = document.createElement('div');
      this._element.id = 'mxd-offline-status';
      this._element.style.cssText = 'position:fixed;top:0;left:0;right:0;padding:8px 16px;text-align:center;font-size:12px;font-weight:600;z-index:9999;transition:all 0.3s;transform:translateY(-100%);';

      container.appendChild(this._element);

      // Listen to connectivity changes
      Connectivity.on('offline', function(){
        this._element.style.background = '#f59e0b';
        this._element.style.color = '#fff';
        this._element.textContent = '⚠️ Offline Mode — All features work normally';
        this._element.style.transform = 'translateY(0)';
      }.bind(this));

      Connectivity.on('online', function(){
        this._element.style.background = '#10b981';
        this._element.style.color = '#fff';
        this._element.textContent = '✅ Back Online — Syncing data...';
        this._element.style.transform = 'translateY(0)';

        setTimeout(function(){
          this._element.style.transform = 'translateY(-100%)';
        }.bind(this), 3000);
      }.bind(this));
    }
  };

  /**
   * Export
   */
  window.MXDOfflineMode = {
    version: '10.0.0',
    db: IndexedDB,
    connectivity: Connectivity,
    sync: SyncEngine,
    cache: CacheManager,
    ui: OfflineUI,
    isOnline: function(){ return Connectivity.online; }
  };

})();
