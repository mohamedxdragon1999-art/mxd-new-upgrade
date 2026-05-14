// MXD React Hooks - Use __MXD_HOOKS__ for components
window.MXDReactHooks = window.__MXD_HOOKS__ || {
    useState: window.React?.useState,
    useEffect: window.React?.useEffect,
    useCallback: window.React?.useCallback,
    useRef: window.React?.useRef,
    useMemo: window.React?.useMemo
};