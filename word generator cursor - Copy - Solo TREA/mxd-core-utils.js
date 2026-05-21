(function(){
  'use strict';

  window.MXD_UTILS = {
    formatDate: function(d) { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); },
    formatNumber: function(n) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); },
    debounce: function(fn, ms) { var t; return function() { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function() { fn.apply(c, a); }, ms); }; },
    throttle: function(fn, ms) { var last = 0; return function() { var now = Date.now(); if (now - last >= ms) { last = now; fn.apply(this, arguments); } }; },
    deepClone: function(obj) { return JSON.parse(JSON.stringify(obj)); },
    merge: function(target, source) { var r = Object.assign({}, target); for (var k in source) { if (source[k] && typeof source[k] === 'object' && !Array.isArray(source[k])) { r[k] = r[k] ? this.merge(r[k], source[k]) : source[k]; } else { r[k] = source[k]; } } return r; },
    uniqueId: function() { return 'mxd_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9); },
    sanitizeHTML: function(str) { return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); },
    truncate: function(str, len) { return str.length > len ? str.substr(0, len) + '...' : str; },
    capitalize: function(str) { return str.charAt(0).toUpperCase() + str.slice(1); },
    slugify: function(str) { return str.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '-'); },
    hexToRgb: function(hex) { var r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex); return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : null; },
    rgbToHex: function(r, g, b) { return '#' + [r, g, b].map(function(x) { var hex = x.toString(16); return hex.length === 1 ? '0' + hex : hex; }).join(''); },
    lightenColor: function(hex, percent) { var rgb = this.hexToRgb(hex); if (!rgb) return hex; var amt = Math.round(2.55 * percent); return this.rgbToHex(Math.min(255, rgb.r + amt), Math.min(255, rgb.g + amt), Math.min(255, rgb.b + amt)); },
    darkenColor: function(hex, percent) { var rgb = this.hexToRgb(hex); if (!rgb) return hex; var amt = Math.round(2.55 * percent); return this.rgbToHex(Math.max(0, rgb.r - amt), Math.max(0, rgb.g - amt), Math.max(0, rgb.b - amt)); },
    getContrastColor: function(hex) { var rgb = this.hexToRgb(hex); if (!rgb) return '#000000'; var luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255; return luminance > 0.5 ? '#000000' : '#ffffff'; },
    isValidEmail: function(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); },
    isValidURL: function(url) { try { new URL(url); return true; } catch (e) { return false; } },
    generateRandomString: function(length) { var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; var result = ''; for (var i = 0; i < length; i++) { result += chars.charAt(Math.floor(Math.random() * chars.length)); } return result; },
    shuffleArray: function(arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var temp = a[i]; a[i] = a[j]; a[j] = temp; } return a; },
    chunkArray: function(arr, size) { var chunks = []; for (var i = 0; i < arr.length; i += size) { chunks.push(arr.slice(i, i + size)); } return chunks; },
    flattenArray: function(arr) { return arr.reduce(function(acc, val) { return acc.concat(Array.isArray(val) ? this.flattenArray(val) : val); }.bind(this), []); },
    groupBy: function(arr, key) { return arr.reduce(function(groups, item) { var group = item[key]; groups[group] = groups[group] || []; groups[group].push(item); return groups; }, {}); },
    sortBy: function(arr, key, order) { return arr.slice().sort(function(a, b) { var va = a[key], vb = b[key]; if (order === 'desc') return va < vb ? 1 : va > vb ? -1 : 0; return va > vb ? 1 : va < vb ? -1 : 0; }); },
    removeDuplicates: function(arr) { return arr.filter(function(item, index) { return arr.indexOf(item) === index; }); },
    intersection: function(a, b) { return a.filter(function(x) { return b.indexOf(x) !== -1; }); },
    union: function(a, b) { return this.removeDuplicates(a.concat(b)); },
    difference: function(a, b) { return a.filter(function(x) { return b.indexOf(x) === -1; }); }
  };

  window.MXD_EVENT_BUS = (function() {
    var listeners = {};
    return {
      on: function(event, callback) { if (!listeners[event]) listeners[event] = []; listeners[event].push(callback); },
      off: function(event, callback) { if (!listeners[event]) return; listeners[event] = listeners[event].filter(function(cb) { return cb !== callback; }); },
      emit: function(event, data) { if (!listeners[event]) return; listeners[event].forEach(function(cb) { cb(data); }); },
      once: function(event, callback) { var self = this; function wrapper(data) { callback(data); self.off(event, wrapper); } this.on(event, wrapper); },
      clear: function() { listeners = {}; },
      hasListeners: function(event) { return listeners[event] && listeners[event].length > 0; },
      listenerCount: function(event) { return listeners[event] ? listeners[event].length : 0; }
    };
  })();

  window.MXD_STATE = {
    version: '10.0.0',
    initialized: false,
    currentTheme: 'night',
    currentPuzzleType: 'wordsearch',
    currentDifficulty: 'medium',
    currentLanguage: 'en',
    currentPalette: 'ocean_breeze',
    currentTypography: 'classic',
    currentGridStyle: 'classic',
    currentLayout: 'single_puzzle',
    currentExportFormat: 'pdf',
    currentAccessibility: 'standard',
    currentAnimation: 'normal',
    settings: {},
    puzzles: [],
    wordBank: [],
    customWords: [],
    excludedWords: [],
    foundWords: [],
    history: [],
    undoStack: [],
    redoStack: [],
    cache: {},
    performance: { renderTime: 0, generationTime: 0, exportTime: 0 },
    errors: [],
    warnings: [],
    notifications: []
  };

  window.MXD_PERF = {
    timers: {},
    start: function(name) { this.timers[name] = performance.now(); },
    end: function(name) { var elapsed = performance.now() - (this.timers[name] || 0); delete this.timers[name]; return elapsed; },
    measure: function(name, fn) { this.start(name); var result = fn(); var elapsed = this.end(name); return { result: result, time: elapsed }; },
    report: function() { console.log('[MXD Performance]', JSON.stringify(this.timers, null, 2)); }
  };

  window.MXD_FEATURES = {
    enableVortexWorker: true,
    enableAIOptimization: true,
    enableParallelGeneration: true,
    enableCaching: true,
    enableAutoSave: true,
    enableAnalytics: false,
    enableDarkMode: true,
    enableAccessibility: true,
    enableExport: true,
    enablePrint: true,
    enableShare: true,
    enableCollaboration: false,
    enableCloudSync: false,
    enableOfflineMode: true,
    enableServiceWorker: true,
    enablePushNotifications: false,
    enableDragDrop: true,
    enableUndoRedo: true,
    enableKeyboardShortcuts: true,
    enableTouchGestures: true,
    enableVoiceCommands: false,
    enableAIWordGeneration: true,
    enableThemeCustomization: true,
    enableLayoutCustomization: true,
    enableTypographyCustomization: true,
    enableColorCustomization: true,
    enableGridCustomization: true,
    enableAnimationCustomization: true,
    enableExportCustomization: true,
    enablePrintCustomization: true,
    enableAccessibilityCustomization: true
  };

  window.MXD_I18N = {
    en: {
      newPuzzle: 'New Puzzle', openPuzzle: 'Open', savePuzzle: 'Save', exportPuzzle: 'Export', printPuzzle: 'Print',
      undo: 'Undo', redo: 'Redo', settings: 'Settings', help: 'Help', about: 'About',
      wordSearch: 'Word Search', crossword: 'Crossword', sudoku: 'Sudoku', maze: 'Maze',
      easy: 'Easy', medium: 'Medium', hard: 'Hard', expert: 'Expert', extreme: 'Extreme',
      generate: 'Generate', regenerate: 'Regenerate', clear: 'Clear', reset: 'Reset',
      words: 'Words', grid: 'Grid', solution: 'Solution', hints: 'Hints', timer: 'Timer',
      found: 'Found', remaining: 'Remaining', total: 'Total', score: 'Score', time: 'Time',
      theme: 'Theme', difficulty: 'Difficulty', language: 'Language', layout: 'Layout',
      typography: 'Typography', colors: 'Colors', gridStyle: 'Grid Style', animation: 'Animation',
      accessibility: 'Accessibility', exportFormat: 'Export Format', pageSize: 'Page Size',
      margins: 'Margins', orientation: 'Orientation', bleed: 'Bleed', paper: 'Paper',
      title: 'Title', subtitle: 'Subtitle', author: 'Author', description: 'Description',
      copyright: 'Copyright', isbn: 'ISBN', publisher: 'Publisher', edition: 'Edition',
      cover: 'Cover', tableOfContents: 'Table of Contents', answerKey: 'Answer Key',
      singlePuzzle: 'Single Puzzle', doublePuzzle: 'Double Puzzle', puzzleOnly: 'Puzzle Only',
      wordListOnly: 'Word List Only', titlePage: 'Title Page', copyrightPage: 'Copyright Page',
      classic: 'Classic', modern: 'Modern', elegant: 'Elegant', playful: 'Playful', minimal: 'Minimal',
      bold: 'Bold', handwritten: 'Handwritten', largePrint: 'Large Print', kidsFriendly: 'Kids Friendly',
      professional: 'Professional', oceanBreeze: 'Ocean Breeze', forestCanopy: 'Forest Canopy',
      sunsetGlow: 'Sunset Glow', royalPurple: 'Royal Purple', roseGarden: 'Rose Garden',
      goldenHour: 'Golden Hour', midnightSky: 'Midnight Sky', arcticFrost: 'Arctic Frost',
      autumnLeaves: 'Autumn Leaves', springBloom: 'Spring Bloom', earthTones: 'Earth Tones',
      slateGray: 'Slate Gray', neonNights: 'Neon Nights', vintageParchment: 'Vintage Parchment',
      pastelDream: 'Pastel Dream', monochrome: 'Monochrome',
      success: 'Success', error: 'Error', warning: 'Warning', info: 'Info',
      loading: 'Loading...', generating: 'Generating...', exporting: 'Exporting...', printing: 'Printing...',
      saving: 'Saving...', opening: 'Opening...', refreshing: 'Refreshing...',
      noWords: 'No words added', noPuzzle: 'No puzzle generated', noSolution: 'No solution available',
      invalidWord: 'Invalid word', wordTooLong: 'Word too long', wordTooShort: 'Word too short',
      duplicateWord: 'Duplicate word', gridFull: 'Grid is full', generationFailed: 'Generation failed',
      exportFailed: 'Export failed', printFailed: 'Print failed', saveFailed: 'Save failed',
      openFailed: 'Open failed', invalidFile: 'Invalid file', fileTooLarge: 'File too large',
      unsupportedFormat: 'Unsupported format', networkError: 'Network error', serverError: 'Server error',
      offlineMode: 'Offline mode', onlineMode: 'Online mode', syncComplete: 'Sync complete',
      updateAvailable: 'Update available', newVersion: 'New version', restart: 'Restart',
      dismiss: 'Dismiss', cancel: 'Cancel', confirm: 'Confirm', ok: 'OK', yes: 'Yes', no: 'No',
      close: 'Close', minimize: 'Minimize', maximize: 'Maximize', restore: 'Restore',
      expand: 'Expand', collapse: 'Collapse', show: 'Show', hide: 'Hide',
      previous: 'Previous', next: 'Next', first: 'First', last: 'Last',
      page: 'Page', of: 'of', pages: 'pages', results: 'results', items: 'items'
    }
  };

  console.log('[MXD Core Utils] Loaded');
})();
