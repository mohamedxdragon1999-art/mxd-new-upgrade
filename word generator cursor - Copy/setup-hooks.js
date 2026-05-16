// This file runs first and sets up React hooks for all components
(function() {
    if (!window.React) {
        console.error('React not loaded!');
        return;
    }
    
    // Store original hooks
    const React = window.React;
    
    // Create a unique namespace for our hooks
    window.__MXD_HOOKS__ = {
        useState: React.useState.bind(React),
        useEffect: React.useEffect.bind(React),
        useCallback: React.useCallback.bind(React),
        useRef: React.useRef.bind(React),
        useMemo: React.useMemo.bind(React),
        useContext: React.useContext.bind(React)
    };
    
    console.log('MXD Hooks initialized');
})();