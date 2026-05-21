/**
 * MXD Reliability v10.0
 * 
 * 10 Resilience Patterns for bulletproof operation:
 * 1. Circuit Breaker - Prevent cascading failures
 * 2. Bulkhead - Isolate failures to components
 * 3. Retry with Backoff - Intelligent retry logic
 * 4. Timeout - Prevent hanging operations
 * 5. Fallback - Graceful degradation
 * 6. Health Check - System status monitoring
 * 7. Chaos Testing - Random failure injection for testing
 * 8. Saga - Multi-step transaction management
 * 9. Rate Limiter - Prevent resource exhaustion
 * 10. Dead Letter Queue - Track failed operations
 * 
 * @module MXDReliability
 * @version 10.0.0
 */
(function(){
  'use strict';

  /**
   * 1. Circuit Breaker Pattern
   * Prevents cascading failures by stopping calls to failing services
   */
  var CircuitBreaker = {
    states: {},
    CLOSED: 'closed',
    OPEN: 'open',
    HALF_OPEN: 'half_open',

    create: function(name, options){
      options = options || {};
      this.states[name] = {
        state: this.CLOSED,
        failures: 0,
        success: 0,
        lastFailure: 0,
        threshold: options.threshold || 5,
        timeout: options.timeout || 30000,
        halfOpenMax: options.halfOpenMax || 3
      };
    },

    canExecute: function(name){
      var cb = this.states[name];
      if(!cb) return true;

      if(cb.state === this.CLOSED) return true;

      if(cb.state === this.OPEN){
        if(Date.now() - cb.lastFailure > cb.timeout){
          cb.state = this.HALF_OPEN;
          cb.success = 0;
          return true;
        }
        return false;
      }

      // HALF_OPEN
      return cb.success < cb.halfOpenMax;
    },

    recordSuccess: function(name){
      var cb = this.states[name];
      if(!cb) return;

      cb.success++;
      cb.failures = 0;

      if(cb.state === this.HALF_OPEN && cb.success >= cb.halfOpenMax){
        cb.state = this.CLOSED;
      }
    },

    recordFailure: function(name){
      var cb = this.states[name];
      if(!cb) return;

      cb.failures++;
      cb.lastFailure = Date.now();

      if(cb.failures >= cb.threshold){
        cb.state = this.OPEN;
      }
    },

    getState: function(name){
      var cb = this.states[name];
      return cb ? cb.state : this.CLOSED;
    }
  };

  /**
   * 2. Bulkhead Pattern
   * Isolates failures to prevent system-wide collapse
   */
  var Bulkhead = {
    compartments: {},

    create: function(name, options){
      options = options || {};
      this.compartments[name] = {
        maxConcurrent: options.maxConcurrent || 10,
        currentConcurrent: 0,
        queue: [],
        maxQueueSize: options.maxQueueSize || 20
      };
    },

    execute: function(name, fn){
      var self = this;
      var compartment = this.compartments[name];

      if(!compartment){
        return Promise.resolve(fn());
      }

      return new Promise(function(resolve, reject){
        if(compartment.currentConcurrent < compartment.maxConcurrent){
          compartment.currentConcurrent++;
          try {
            var result = fn();
            Promise.resolve(result).then(function(res){
              compartment.currentConcurrent--;
              self._processQueue(name);
              resolve(res);
            }).catch(function(err){
              compartment.currentConcurrent--;
              self._processQueue(name);
              reject(err);
            });
          } catch(e){
            compartment.currentConcurrent--;
            self._processQueue(name);
            reject(e);
          }
        } else if(compartment.queue.length < compartment.maxQueueSize){
          compartment.queue.push({fn: fn, resolve: resolve, reject: reject});
        } else {
          reject(new Error('Bulkhead ' + name + ' is full'));
        }
      });
    },

    _processQueue: function(name){
      var compartment = this.compartments[name];
      if(!compartment || compartment.queue.length === 0) return;
      if(compartment.currentConcurrent >= compartment.maxConcurrent) return;

      var next = compartment.queue.shift();
      this.execute(name, next.fn).then(next.resolve).catch(next.reject);
    }
  };

  /**
   * 3. Retry with Exponential Backoff
   */
  var Retry = {
    execute: function(fn, options){
      options = options || {};
      var maxRetries = options.maxRetries || 3;
      var baseDelay = options.baseDelay || 1000;
      var maxDelay = options.maxDelay || 30000;
      var jitter = options.jitter !== false;
      var attempt = 0;

      function tryOnce(){
        return Promise.resolve(fn()).catch(function(err){
          attempt++;
          if(attempt > maxRetries) throw err;

          var delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
          if(jitter) delay *= (0.5 + Math.random());

          return new Promise(function(resolve){
            setTimeout(resolve, delay);
          }).then(tryOnce);
        });
      }

      return tryOnce();
    }
  };

  /**
   * 4. Timeout Pattern
   */
  var Timeout = {
    execute: function(promise, ms, errorMsg){
      errorMsg = errorMsg || 'Operation timed out after ' + ms + 'ms';

      return new Promise(function(resolve, reject){
        var timer = setTimeout(function(){
          reject(new Error(errorMsg));
        }, ms);

        Promise.resolve(promise).then(function(result){
          clearTimeout(timer);
          resolve(result);
        }).catch(function(err){
          clearTimeout(timer);
          reject(err);
        });
      });
    }
  };

  /**
   * 5. Fallback Pattern
   */
  var Fallback = {
    execute: function(primary, fallback, onError){
      return Promise.resolve(primary()).catch(function(err){
        if(onError) onError(err);
        return typeof fallback === 'function' ? fallback() : fallback;
      });
    }
  };

  /**
   * 6. Health Check
   */
  var HealthCheck = {
    checks: {},
    lastCheck: 0,
    status: 'unknown',

    register: function(name, checkFn){
      this.checks[name] = checkFn;
    },

    run: function(){
      var self = this;
      var results = {};
      var allHealthy = true;
      var promises = [];

      Object.keys(this.checks).forEach(function(name){
        var promise = Promise.resolve(self.checks[name]()).then(function(healthy){
          results[name] = {healthy: healthy, timestamp: Date.now()};
          if(!healthy) allHealthy = false;
        }).catch(function(err){
          results[name] = {healthy: false, error: err.message, timestamp: Date.now()};
          allHealthy = false;
        });
        promises.push(promise);
      });

      return Promise.all(promises).then(function(){
        self.lastCheck = Date.now();
        self.status = allHealthy ? 'healthy' : 'degraded';
        return {
          status: self.status,
          checks: results,
          timestamp: self.lastCheck
        };
      });
    }
  };

  /**
   * 7. Chaos Testing
   */
  var Chaos = {
    enabled: false,
    failureRate: 0.01, // 1% default

    enable: function(rate){
      this.enabled = true;
      this.failureRate = rate || 0.01;
    },

    disable: function(){
      this.enabled = false;
    },

    shouldFail: function(){
      return this.enabled && Math.random() < this.failureRate;
    },

    inject: function(fn){
      if(this.shouldFail()){
        throw new Error('Chaos: Random failure injected');
      }
      return fn();
    }
  };

  /**
   * 8. Saga Pattern
   * Multi-step transaction with rollback
   */
  var Saga = {
    execute: function(steps){
      var completed = [];

      function executeStep(index){
        if(index >= steps.length){
          return Promise.resolve(completed);
        }

        var step = steps[index];
        return Promise.resolve(step.action()).then(function(result){
          completed.push({step: step, result: result});
          return executeStep(index + 1);
        }).catch(function(err){
          // Rollback completed steps in reverse
          return rollback(completed).then(function(){
            throw err;
          });
        });
      }

      function rollback(completedSteps){
        var rollbackPromises = [];
        for(var i=completedSteps.length-1;i>=0;i--){
          var step = completedSteps[i].step;
          if(step.rollback){
            rollbackPromises.push(Promise.resolve(step.rollback(completedSteps[i].result)));
          }
        }
        return Promise.all(rollbackPromises);
      }

      return executeStep(0);
    }
  };

  /**
   * 9. Rate Limiter
   */
  var RateLimiter = {
    limits: {},

    create: function(name, options){
      options = options || {};
      this.limits[name] = {
        maxRequests: options.maxRequests || 100,
        windowMs: options.windowMs || 60000,
        requests: [],
        blocked: false
      };
    },

    canProceed: function(name){
      var limit = this.limits[name];
      if(!limit) return true;

      var now = Date.now();
      // Remove old requests outside window
      limit.requests = limit.requests.filter(function(t){
        return now - t < limit.windowMs;
      });

      if(limit.requests.length >= limit.maxRequests){
        return false;
      }

      limit.requests.push(now);
      return true;
    },

    getRemaining: function(name){
      var limit = this.limits[name];
      if(!limit) return Infinity;

      var now = Date.now();
      limit.requests = limit.requests.filter(function(t){
        return now - t < limit.windowMs;
      });

      return Math.max(0, limit.maxRequests - limit.requests.length);
    }
  };

  /**
   * 10. Dead Letter Queue
   * Track failed operations for later analysis
   */
  var DeadLetterQueue = {
    _queue: [],
    _maxSize: 1000,

    add: function(operation, error, context){
      this._queue.push({
        operation: operation,
        error: error.message || String(error),
        context: context,
        timestamp: Date.now(),
        retries: 0
      });

      // Trim if over max size
      if(this._queue.length > this._maxSize){
        this._queue = this._queue.slice(-this._maxSize);
      }

      // Persist to localStorage
      try {
        localStorage.setItem('mxd-dlq', JSON.stringify(this._queue));
      } catch(e){}
    },

    getAll: function(){
      return this._queue.slice();
    },

    getCount: function(){
      return this._queue.length;
    },

    clear: function(){
      this._queue = [];
      try { localStorage.removeItem('mxd-dlq'); } catch(e){}
    },

    retry: function(index, retryFn){
      if(index < 0 || index >= this._queue.length) return Promise.reject(new Error('Invalid index'));

      var item = this._queue[index];
      item.retries++;

      return Promise.resolve(retryFn(item)).then(function(){
        // Remove from queue on success
        this._queue.splice(index, 1);
      }.bind(this));
    },

    load: function(){
      try {
        var saved = localStorage.getItem('mxd-dlq');
        if(saved) this._queue = JSON.parse(saved);
      } catch(e){}
    }
  };

  /**
   * Export
   */
  window.MXDReliability = {
    version: '10.0.0',
    circuitBreaker: CircuitBreaker,
    bulkhead: Bulkhead,
    retry: Retry,
    timeout: Timeout,
    fallback: Fallback,
    healthCheck: HealthCheck,
    chaos: Chaos,
    saga: Saga,
    rateLimiter: RateLimiter,
    deadLetterQueue: DeadLetterQueue
  };

})();
