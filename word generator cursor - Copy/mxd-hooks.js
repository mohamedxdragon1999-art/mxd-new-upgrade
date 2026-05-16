// MXD OMNI-NEXUS v11.0 React Hooks Initialization
// This MUST run before any JSX files that use hooks

(function() {
    'use strict';
    
    // Wait for React to be fully loaded
    function initHooks() {
        if (!window.React) {
            console.warn('React not loaded yet, retrying...');
            setTimeout(initHooks, 100);
            return;
        }
        
        const React = window.React;
        
        // Create MXD Hooks namespace
        window.MXDReactHooks = {
            useState: React.useState ? React.useState.bind(React) : () => { throw new Error('useState not available'); },
            useEffect: React.useEffect ? React.useEffect.bind(React) : () => { throw new Error('useEffect not available'); },
            useCallback: React.useCallback ? React.useCallback.bind(React) : () => { throw new Error('useCallback not available'); },
            useRef: React.useRef ? React.useRef.bind(React) : () => { throw new Error('useRef not available'); },
            useMemo: React.useMemo ? React.useMemo.bind(React) : () => { throw new Error('useMemo not available'); },
            useContext: React.useContext ? React.useContext.bind(React) : () => { throw new Error('useContext not available'); }
        };
        
        // Also set legacy namespace
        window.__MXD_HOOKS__ = window.MXDReactHooks;
        
        console.log('✅ MXD React Hooks v11.0 initialized');
        console.log('   useState:', typeof window.MXDReactHooks.useState);
        console.log('   useEffect:', typeof window.MXDReactHooks.useEffect);
    }
    
    // Initialize immediately if React is ready, otherwise wait
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initHooks();
    } else {
        window.addEventListener('DOMContentLoaded', initHooks);
    }
    
    // Also try immediately in case DOM is already loaded
    setTimeout(initHooks, 0);
})();