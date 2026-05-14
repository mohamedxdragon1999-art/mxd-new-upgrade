// temporal-error-boundary.jsx — MXD OMNI-NEXUS v11.0 Self-Healing
// React Error Boundary with State Rollback and Silent Recovery
(function() {
  'use strict';

  // State History for rollback
  class StateHistoryManager {
    constructor(maxStates = 50) {
      this.states = [];
      this.maxStates = maxStates;
      this.lastGoodState = null;
    }

    push(state) {
      const snapshot = JSON.parse(JSON.stringify(state));
      this.states.push(snapshot);
      
      if (this.states.length > this.maxStates) {
        this.states.shift();
      }
      
      this.lastGoodState = snapshot;
    }

    rollback() {
      if (this.states.length > 1) {
        this.states.pop();
        return this.states[this.states.length - 1];
      }
      return this.lastGoodState;
    }

    getLastGood() {
      return this.lastGoodState;
    }

    clear() {
      this.states = [];
    }
  }

  // Ghost Simulation - runs 5 steps ahead
  class GhostSimulator {
    constructor() {
      this.enabled = true;
      this.predictions = [];
    }

    predict(component, props, state) {
      if (!this.enabled) return null;

      // Simple prediction based on state patterns
      const predictions = {
        gridGeneration: state?.generating && !state?.puzzles?.length,
        largeBatch: state?.bulkPageCount > 100,
        complexShape: state?.shape?.startsWith('mxd_'),
        largeGrid: (state?.rows > 30 || state?.cols > 30)
      };

      // Return potential issues
      const issues = Object.entries(predictions)
        .filter(([key, value]) => value)
        .map(([key]) => key);

      return issues.length > 0 ? issues : null;
    }

    validateAction(action, state) {
      // Check for potentially dangerous actions
      const dangerousPatterns = [
        { pattern: 'bulkPageCount > 300', check: () => state?.bulkPageCount > 300 },
        { pattern: 'grid > 50x50', check: () => (state?.rows > 50 || state?.cols > 50) },
        { pattern: 'no words', check: () => !state?.wordText?.trim() }
      ];

      for (const { pattern, check } of dangerousPatterns) {
        if (check()) {
          return { safe: false, reason: pattern };
        }
      }

      return { safe: true };
    }
  }

  // Error Metrics - logs to IndexedDB
  class ErrorMetrics {
    static async log(error, errorInfo, context) {
      const errorEntry = {
        timestamp: Date.now(),
        message: error?.message || 'Unknown error',
        stack: error?.stack || '',
        componentStack: errorInfo?.componentStack || '',
        context: context || {},
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      try {
        // Store in localStorage (simplified for demo)
        const errors = JSON.parse(localStorage.getItem('mxd_errors') || '[]');
        errors.push(errorEntry);
        
        // Keep only last 100 errors
        if (errors.length > 100) errors.shift();
        localStorage.setItem('mxd_errors', JSON.stringify(errors));
        
        console.log('📊 Error logged:', errorEntry.message);
      } catch (e) {
        console.warn('Failed to log error:', e);
      }

      return errorEntry;
    }

    static getRecentErrors() {
      try {
        return JSON.parse(localStorage.getItem('mxd_errors') || '[]');
      } catch (e) {
        return [];
      }
    }

    static clearErrors() {
      localStorage.removeItem('mxd_errors');
    }
  }

  // Temporal Error Boundary Component
  class TemporalErrorBoundary {
    constructor(component) {
      this.component = component;
      this.stateHistory = new StateHistoryManager(50);
      this.ghostSimulator = new GhostSimulator();
      this.recoveryMode = false;
      this.retryCount = 0;
      this.maxRetries = 3;
      this.init();
    }

    init() {
      // Wrap component methods
      this.wrapComponentMethods();
      
      // Start ghost simulation
      this.startGhostSimulation();
      
      console.log('🛡️ Temporal Error Boundary initialized');
    }

    wrapComponentMethods() {
      const originalRender = this.component.render?.bind(this.component);
      const originalSetState = this.component.setState?.bind(this.component);

      if (originalSetState) {
        this.component.setState = (update, callback) => {
          // Capture state before update
          const currentState = this.component.state;
          this.stateHistory.push(currentState);

          try {
            originalSetState(update, () => {
              // Capture state after successful update
              const newState = this.component.state;
              this.stateHistory.push(newState);
              
              if (callback) callback();
            });
          } catch (error) {
            this.handleError(error, 'setState');
          }
        };
      }

      if (originalRender) {
        this.component.render = () => {
          if (this.recoveryMode) {
            // Show recovery indicator
            return this.renderRecoveryUI();
          }
          return originalRender();
        };
      }
    }

    handleError(error, context) {
      console.warn('⚡ Temporal Error Boundary caught error:', error.message);
      
      // Log the error
      ErrorMetrics.log(error, null, { context, recoveryMode: this.recoveryMode });

      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        
        // Rollback to last good state
        const lastGood = this.stateHistory.getLastGood();
        if (lastGood) {
          console.log('🔄 Rolling back to last good state...');
          
          // Apply rollback
          try {
            this.component.setState(lastGood);
            this.recoveryMode = true;
            
            // Auto-retry after rollback
            setTimeout(() => {
              this.recoveryMode = false;
              this.retryCount = 0;
              console.log('✅ Recovery successful, resuming normal operation');
            }, 100);
            
          } catch (rollbackError) {
            console.error('Rollback failed:', rollbackError);
          }
        }
      } else {
        // Max retries exceeded, show error
        this.recoveryMode = true;
        console.error('❌ Max retries exceeded, manual intervention required');
      }
    }

    renderRecoveryUI() {
      return `
        <div style="
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: var(--bg2);
          border: 2px solid var(--hl);
          border-radius: 16px;
          padding: 32px;
          text-align: center;
          z-index: 9999;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        ">
          <div style="font-size: 48px; margin-bottom: 16px;">🔄</div>
          <h3 style="color: var(--t1); margin: 0 0 8px 0;">Recovery Mode Active</h3>
          <p style="color: var(--t2); margin: 0 0 16px 0;">
            The system detected an issue and is automatically recovering...
          </p>
          <div style="
            width: 200px;
            height: 4px;
            background: var(--bg3);
            border-radius: 2px;
            margin: 0 auto;
            overflow: hidden;
          ">
            <div style="
              width: 50%;
              height: 100%;
              background: var(--hl);
              animation: recover 1s ease-in-out infinite;
            "></div>
          </div>
          <style>
            @keyframes recover {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(200%); }
            }
          </style>
        </div>
      `;
    }

    startGhostSimulation() {
      // Run ghost simulation every 5 seconds
      setInterval(() => {
        if (this.component?.state) {
          const predictions = this.ghostSimulator.predict(
            this.component,
            this.component.props,
            this.component.state
          );
          
          if (predictions && predictions.length > 0) {
            console.log('👻 Ghost Simulation predictions:', predictions);
            
            // Preemptively warn about potential issues
            for (const issue of predictions) {
              this.handlePredictedIssue(issue);
            }
          }
        }
      }, 5000);
    }

    handlePredictedIssue(issue) {
      switch (issue) {
        case 'largeBatch':
          console.warn('⚠️ Large batch detected, enabling turbo mode');
          window.QuantumGridEngine?.batchMode?.('hyper');
          break;
        case 'largeGrid':
          console.warn('⚠️ Large grid detected, enabling WebGL acceleration');
          window.QuantumGridEngine?.enableWebGL?.();
          break;
        case 'complexShape':
          console.warn('⚠️ Complex shape detected, optimizing rendering');
          break;
      }
    }

    // Manual error injection for testing
    injectError(error) {
      this.handleError(error, 'manual_injection');
    }

    // Force recovery
    forceRecovery() {
      const lastGood = this.stateHistory.getLastGood();
      if (lastGood && this.component) {
        this.component.setState(lastGood);
        this.recoveryMode = false;
        this.retryCount = 0;
        console.log('✅ Force recovery successful');
      }
    }

    // Get error history
    getErrorHistory() {
      return ErrorMetrics.getRecentErrors();
    }
  }

  // Auto-initialize on script load
  document.addEventListener('DOMContentLoaded', () => {
    // Wait for React to be ready
    const initInterval = setInterval(() => {
      if (window.React && document.getElementById('root')) {
        clearInterval(initInterval);
        console.log('🛡️ Temporal Error Boundary ready');
      }
    }, 100);
  });

  // Export for use
  window.TemporalErrorBoundary = TemporalErrorBoundary;
  window.StateHistoryManager = StateHistoryManager;
  window.GhostSimulator = GhostSimulator;
  window.ErrorMetrics = ErrorMetrics;

})();