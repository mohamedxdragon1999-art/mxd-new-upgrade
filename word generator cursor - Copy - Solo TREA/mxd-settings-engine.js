// mxd-settings-engine.js — MXD Unified Settings Engine v10.0
// Schema-validated, versioned, auto-detecting, AI-recommended, profile-based settings system
// Works 100% on file:// protocol — zero server required
(function(){
  'use strict';

  const SETTINGS_VERSION = 10;
  const STORAGE_KEY = 'mxd:settings:v10';
  const PROFILES_KEY = 'mxd:profiles:v10';
  const HISTORY_KEY = 'mxd:settings:history:v10';
  const MAX_HISTORY = 30;
  const WRITE_DEBOUNCE_MS = 300;

  // ============================================================
  // SCHEMA DEFINITIONS — Every setting has type, range, default, description
  // ============================================================
  const SCHEMA = {
    // Puzzle Core
    rows: { type: 'number', min: 5, max: 50, default: 25, category: 'puzzle', label: 'Grid Rows', icon: '⬛', description: 'Number of rows in the puzzle grid' },
    cols: { type: 'number', min: 5, max: 50, default: 25, category: 'puzzle', label: 'Grid Columns', icon: '⬛', description: 'Number of columns in the puzzle grid' },
    wordsPerGrid: { type: 'number', min: 3, max: 60, default: 20, category: 'puzzle', label: 'Words Per Puzzle', icon: '📝', description: 'How many words to place in each puzzle' },
    wordColumns: { type: 'number', min: 1, max: 8, default: 4, category: 'puzzle', label: 'Word List Columns', icon: '📋', description: 'Number of columns for the word list display' },
    wordFontSize: { type: 'number', min: 8, max: 24, default: 14, category: 'puzzle', label: 'Word Font Size', icon: '🔤', description: 'Font size for words in the list (pt)' },
    cellSize: { type: 'number', min: 12, max: 48, default: 24, category: 'puzzle', label: 'Cell Size', icon: '📐', description: 'Size of each grid cell (px)' },
    titleFontSize: { type: 'number', min: 10, max: 48, default: 22, category: 'puzzle', label: 'Title Font Size', icon: '🔠', description: 'Font size for puzzle title (pt)' },
    title: { type: 'string', maxLength: 100, default: 'MXD SUPREME PUZZLE', category: 'puzzle', label: 'Puzzle Title', icon: '✏️', description: 'Title displayed at the top of the puzzle' },
    subtitle: { type: 'string', maxLength: 100, default: '', category: 'puzzle', label: 'Subtitle', icon: '✏️', description: 'Optional subtitle below the title' },

    // Directions
    allowH: { type: 'boolean', default: true, category: 'directions', label: 'Horizontal', icon: '↔️', description: 'Allow words placed left-to-right' },
    allowV: { type: 'boolean', default: true, category: 'directions', label: 'Vertical', icon: '↕️', description: 'Allow words placed top-to-bottom' },
    allowDiag: { type: 'boolean', default: true, category: 'directions', label: 'Diagonal', icon: '↗️', description: 'Allow words placed diagonally' },
    allowReverse: { type: 'boolean', default: true, category: 'directions', label: 'Reverse', icon: '🔄', description: 'Allow words placed backwards' },

    // Appearance
    letterCase: { type: 'select', options: ['upper', 'lower', 'mixed'], default: 'upper', category: 'appearance', label: 'Letter Case', icon: '🔡', description: 'Case of letters in the grid' },
    fontWeight: { type: 'select', options: ['400', '500', '600', '700', '800', '900'], default: '700', category: 'appearance', label: 'Font Weight', icon: '🅱️', description: 'Boldness of grid letters' },
    fontFamily: { type: 'string', default: 'Inter, sans-serif', category: 'appearance', label: 'Font Family', icon: '🔤', description: 'Font family for the puzzle' },
    highlightColor: { type: 'color', default: '#6c63ff', category: 'appearance', label: 'Highlight Color', icon: '🎨', description: 'Color used for solution highlighting' },
    solutionStyle: { type: 'select', options: ['highlight', 'circle', 'black_circle', 'square', 'black_square', 'dim', 'lines', 'outline', 'dashed', 'double_line', 'underline', 'dot', 'boxed'], default: 'highlight', category: 'appearance', label: 'Solution Style', icon: '✨', description: 'How solutions are displayed' },
    template: { type: 'select', options: ['classic', 'dark_slate', 'cyber', 'newspaper', 'ocean', 'forest', 'sunset', 'rose', 'gold', 'lavender', 'mint', 'slate'], default: 'classic', category: 'appearance', label: 'Visual Template', icon: '🎭', description: 'Pre-built color theme for the puzzle' },
    titleStyle: { type: 'select', options: ['plain', 'banner', 'boxed', 'underline'], default: 'plain', category: 'appearance', label: 'Title Style', icon: '🏷️', description: 'Background style for the title' },
    titleAlign: { type: 'select', options: ['left', 'center', 'right'], default: 'center', category: 'appearance', label: 'Title Alignment', icon: '↔️', description: 'Horizontal alignment of the title' },
    titleWeight: { type: 'number', min: 400, max: 900, step: 100, default: 700, category: 'appearance', label: 'Title Font Weight', icon: '🅱️', description: 'Boldness of the title text' },
    titleGap: { type: 'number', min: 0, max: 50, default: 0, category: 'appearance', label: 'Title Gap', icon: '↕️', description: 'Extra space below the title (px)' },
    titleIndent: { type: 'number', min: -50, max: 50, default: 0, category: 'appearance', label: 'Title Indent', icon: '↔️', description: 'Horizontal offset for the title (px)' },
    showGridLines: { type: 'boolean', default: true, category: 'appearance', label: 'Show Grid Lines', icon: '📏', description: 'Display lines between grid cells' },
    showWordList: { type: 'boolean', default: true, category: 'appearance', label: 'Show Word List', icon: '📋', description: 'Display the list of words to find' },
    showPageNum: { type: 'boolean', default: true, category: 'appearance', label: 'Show Page Numbers', icon: '🔢', description: 'Display page numbers on export' },
    pageNum: { type: 'number', min: 1, max: 999, default: 1, category: 'appearance', label: 'Page Number', icon: '🔢', description: 'Starting page number' },

    // Shape
    shape: { type: 'select', options: ['rectangle', 'circle', 'square', 'diamond', 'triangle', 'pentagon', 'hexagon', 'octagon', 'star', 'heart', 'cross', 'arrow', 'cloud', 'drop', 'dragon', 'butterfly', 'cat', 'dog', 'fish', 'bird', 'rabbit', 'turtle', 'elephant', 'lion', 'bear', 'fox', 'owl', 'horse', 'dolphin', 'whale', 'shark', 'crab', 'octopus', 'snail', 'bee', 'ladybug', 'dinosaur', 'unicorn', 'penguin', 'frog', 'snake', 'spider', 'scorpion', 'lobster', 'seahorse', 'jellyfish', 'crown', 'bell', 'candle', 'gift', 'tree', 'flower', 'leaf', 'mushroom', 'apple', 'orange', 'banana', 'grape', 'cherry', 'watermelon', 'strawberry', 'pizza', 'burger', 'icecream', 'cake', 'cookie', 'candy', 'cupcake', 'donut', 'lollipop', 'car', 'bus', 'train', 'plane', 'boat', 'rocket', 'bicycle', 'house', 'castle', 'bridge', 'tower', 'church', 'school', 'hospital', 'library', 'store', 'restaurant', 'letter_a', 'letter_b', 'letter_c', 'letter_d', 'letter_e', 'letter_f', 'letter_g', 'letter_h', 'letter_i', 'letter_j', 'letter_k', 'letter_l', 'letter_m', 'letter_n', 'letter_o', 'letter_p', 'letter_q', 'letter_r', 'letter_s', 'letter_t', 'letter_u', 'letter_v', 'letter_w', 'letter_x', 'letter_y', 'letter_z', 'num_1', 'num_2', 'num_3', 'num_4', 'num_5', 'num_6', 'num_7', 'num_8', 'num_9', 'num_0'], default: 'dragon', category: 'shape', label: 'Puzzle Shape', icon: '🔷', description: 'Shape mask for the puzzle grid' },

    // Difficulty
    difficulty: { type: 'select', options: ['very-easy', 'easy', 'medium', 'hard', 'expert', 'adaptive', 'senior', 'kids', 'memoryCare', 'custom'], default: 'normal', category: 'difficulty', label: 'Difficulty', icon: '🎯', description: 'Overall puzzle difficulty level' },
    aiOptimize: { type: 'boolean', default: true, category: 'difficulty', label: 'AI Optimize', icon: '🤖', description: 'Use AI to optimize word placement' },
    fillMissing: { type: 'boolean', default: true, category: 'difficulty', label: 'Fill Missing', icon: '📦', description: 'Auto-fill grid with random letters' },
    autoSplit: { type: 'boolean', default: true, category: 'difficulty', label: 'Auto Split', icon: '✂️', description: 'Split large word lists across multiple puzzles' },

    // Export / PDF
    pageSize: { type: 'select', options: ['letter', 'legal', 'A4', 'A5', '6x9', '7x10', '8x10', '8.5x11', '5.5x8.5', '5x7', 'square_8x8', 'square_10x10', 'square_12x12'], default: '8.5x11', category: 'export', label: 'Page Size', icon: '📄', description: 'Paper size for PDF export' },
    orientation: { type: 'select', options: ['portrait', 'landscape'], default: 'portrait', category: 'export', label: 'Orientation', icon: '🔄', description: 'Page orientation for PDF' },
    marginPreset: { type: 'select', options: ['tight', 'standard', 'generous', 'custom'], default: 'standard', category: 'export', label: 'Margin Preset', icon: '📏', description: 'Pre-configured margin settings' },
    marginTop: { type: 'number', min: 0, max: 100, default: 28, category: 'export', label: 'Top Margin', icon: '⬆️', description: 'Top margin in points' },
    marginBottom: { type: 'number', min: 0, max: 100, default: 28, category: 'export', label: 'Bottom Margin', icon: '⬇️', description: 'Bottom margin in points' },
    marginInner: { type: 'number', min: 0, max: 100, default: 36, category: 'export', label: 'Inner Margin', icon: '⬅️', description: 'Inner (binding) margin in points' },
    marginOuter: { type: 'number', min: 0, max: 100, default: 28, category: 'export', label: 'Outer Margin', icon: '➡️', description: 'Outer margin in points' },
    showSolution: { type: 'boolean', default: false, category: 'export', label: 'Include Solutions', icon: '🔑', description: 'Add solution pages to PDF' },
    compress: { type: 'boolean', default: true, category: 'export', label: 'Compress PDF', icon: '📦', description: 'Compress PDF to reduce file size' },
    watermark: { type: 'boolean', default: false, category: 'export', label: 'Add Watermark', icon: '💧', description: 'Add watermark to PDF pages' },
    watermarkText: { type: 'string', maxLength: 100, default: 'Generated by MXD Word Search', category: 'export', label: 'Watermark Text', icon: '✏️', description: 'Text to display as watermark' },
    kdpCompliant: { type: 'boolean', default: true, category: 'export', label: 'KDP Compliant', icon: '📚', description: 'Ensure PDF meets KDP requirements' },
    bleed: { type: 'number', min: 0, max: 20, default: 0, category: 'export', label: 'Bleed', icon: '📐', description: 'Bleed margin in points (for full-bleed printing)' },

    // UI
    uiTheme: { type: 'select', options: ['night', 'day', 'cyber', 'forest', 'gold', 'rose', 'midnight', 'lavender'], default: 'night', category: 'ui', label: 'UI Theme', icon: '🌙', description: 'Color theme for the application interface' },
    puzzleType: { type: 'select', options: ['wordsearch', 'crossword', 'cryptogram', 'maze', 'sudoku', 'wordScramble', 'wordMatch', 'spiral', 'honeycomb'], default: 'wordsearch', category: 'ui', label: 'Puzzle Type', icon: '🧩', description: 'Type of puzzle to generate' },
    variation: { type: 'select', options: ['var_0', 'var_1', 'var_2', 'var_3', 'var_4', 'var_5', 'var_6', 'var_7', 'var_8', 'var_9'], default: 'var_0', category: 'ui', label: 'Variation', icon: '🎲', description: 'Puzzle variation style' },
    sidebarCollapsed: { type: 'boolean', default: false, category: 'ui', label: 'Sidebar Collapsed', icon: '📁', description: 'Collapse the sidebar' },
    settingsModalOpen: { type: 'boolean', default: false, category: 'ui', label: 'Settings Modal', icon: '⚙️', description: 'Show settings modal' },

    // AI
    aiExtreme: { type: 'boolean', default: false, category: 'ai', label: 'AI Extreme Mode', icon: '🚀', description: 'Enable maximum AI processing power' },
    aiProvider: { type: 'select', options: ['auto', 'deepseek', 'openai_gpt4', 'claude', 'gemini', 'groq', 'cerebras', 'openrouter', 'mistral', 'huggingface', 'cohere', 'togetherai', 'ollama', 'lmstudio'], default: 'auto', category: 'ai', label: 'AI Provider', icon: '🤖', description: 'Primary AI provider for generation' },
    aiModel: { type: 'string', default: 'auto', category: 'ai', label: 'AI Model', icon: '🧠', description: 'Specific AI model to use (auto = best available)' },
    aiTemperature: { type: 'number', min: 0, max: 2, step: 0.1, default: 0.7, category: 'ai', label: 'AI Creativity', icon: '🌡️', description: 'AI creativity level (0 = focused, 2 = creative)' },
    aiMaxTokens: { type: 'number', min: 100, max: 8000, default: 2000, category: 'ai', label: 'Max Tokens', icon: '📊', description: 'Maximum AI response length' },
    localAiEnabled: { type: 'boolean', default: false, category: 'ai', label: 'Local AI', icon: '💻', description: 'Use local AI (Ollama/LM Studio)' },

    // Performance
    highRes: { type: 'boolean', default: false, category: 'performance', label: 'High Resolution', icon: '🖼️', description: 'Generate high-resolution output' },
    svgExport: { type: 'boolean', default: false, category: 'performance', label: 'SVG Export', icon: '📐', description: 'Export as SVG vector format' },
    spyMode: { type: 'boolean', default: false, category: 'performance', label: 'Spy Mode', icon: '🕵️', description: 'Advanced analytics and monitoring' },
    bulkMode: { type: 'boolean', default: false, category: 'performance', label: 'Bulk Mode', icon: '📦', description: 'Generate multiple puzzles at once' },
    bulkPageCount: { type: 'number', min: 1, max: 500, default: 100, category: 'performance', label: 'Bulk Count', icon: '🔢', description: 'Number of puzzles in bulk generation' },
    parallelWorkers: { type: 'number', min: 1, max: 8, default: 4, category: 'performance', label: 'Parallel Workers', icon: '⚡', description: 'Number of parallel processing workers' },
    cacheEnabled: { type: 'boolean', default: true, category: 'performance', label: 'Enable Cache', icon: '💾', description: 'Cache generated puzzles for faster reload' },
    autoSave: { type: 'boolean', default: true, category: 'performance', label: 'Auto Save', icon: '💾', description: 'Automatically save settings changes' },
    autoSaveDelay: { type: 'number', min: 100, max: 5000, default: 300, category: 'performance', label: 'Auto Save Delay', icon: '⏱️', description: 'Delay before auto-saving (ms)' },

    // Accessibility
    largePrint: { type: 'boolean', default: false, category: 'accessibility', label: 'Large Print', icon: '🔍', description: 'Increase font sizes for readability' },
    highContrast: { type: 'boolean', default: false, category: 'accessibility', label: 'High Contrast', icon: '🌓', description: 'Use high contrast colors' },
    dyslexiaFont: { type: 'boolean', default: false, category: 'accessibility', label: 'Dyslexia Font', icon: '📖', description: 'Use dyslexia-friendly font' },
    reducedMotion: { type: 'boolean', default: false, category: 'accessibility', label: 'Reduced Motion', icon: '🎬', description: 'Minimize animations and transitions' },
    screenReader: { type: 'boolean', default: false, category: 'accessibility', label: 'Screen Reader', icon: '🔊', description: 'Optimize for screen readers' },

    // Language
    language: { type: 'select', options: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'ar', 'hi', 'ru'], default: 'en', category: 'language', label: 'Language', icon: '🌐', description: 'Interface language' },
    wordListLanguage: { type: 'select', options: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'ar', 'hi', 'ru'], default: 'en', category: 'language', label: 'Word Language', icon: '📝', description: 'Language for word lists' },

    // Advanced
    seed: { type: 'number', min: 0, max: 999999, default: 0, category: 'advanced', label: 'Random Seed', icon: '🎲', description: 'Seed for reproducible puzzles (0 = random)' },
    overlapPolicy: { type: 'select', options: ['maximize', 'moderate', 'minimal', 'none'], default: 'moderate', category: 'advanced', label: 'Overlap Policy', icon: '🔀', description: 'How words can overlap in the grid' },
    edgeBias: { type: 'select', options: ['none', 'light', 'medium', 'heavy'], default: 'none', category: 'advanced', label: 'Edge Bias', icon: '📍', description: 'Prefer placing words near edges' },
    clustering: { type: 'select', options: ['none', 'light', 'medium', 'heavy'], default: 'none', category: 'advanced', label: 'Word Clustering', icon: '🔗', description: 'Group related words together' },
    fillerComplexity: { type: 'select', options: ['simple', 'moderate', 'complex', 'themed'], default: 'simple', category: 'advanced', label: 'Filler Complexity', icon: '🔤', description: 'Complexity of filler letters' },
    customDictionary: { type: 'string', default: '', category: 'advanced', label: 'Custom Dictionary', icon: '📚', description: 'Custom word list (one per line)' },
    excludeWords: { type: 'string', default: '', category: 'advanced', label: 'Exclude Words', icon: '🚫', description: 'Words to exclude (comma separated)' },

    // Profile
    activeProfile: { type: 'string', default: 'default', category: 'profile', label: 'Active Profile', icon: '👤', description: 'Currently active settings profile' },
    profileName: { type: 'string', default: 'default', category: 'profile', label: 'Profile Name', icon: '✏️', description: 'Name of the current profile' }
  };

  // ============================================================
  // SMART PRESETS — One-click configurations for common use cases
  // ============================================================
  const PRESETS = {
    default: {
      name: 'Default',
      icon: '⚙️',
      description: 'Balanced settings for general use',
      settings: { rows: 25, cols: 25, wordsPerGrid: 20, difficulty: 'normal', template: 'classic', uiTheme: 'night', aiOptimize: true, showSolution: false, kdpCompliant: true }
    },
    kids: {
      name: 'Kids Fun',
      icon: '🧒',
      description: 'Simple, colorful puzzles for children',
      settings: { rows: 10, cols: 10, wordsPerGrid: 8, difficulty: 'very-easy', letterCase: 'upper', template: 'ocean', uiTheme: 'day', showGridLines: true, solutionStyle: 'circle', highlightColor: '#f59e0b', largePrint: true, aiOptimize: true, allowDiag: false, allowReverse: false }
    },
    senior: {
      name: 'Senior Friendly',
      icon: '👴',
      description: 'Large print, high contrast for seniors',
      settings: { rows: 15, cols: 15, wordsPerGrid: 12, difficulty: 'easy', letterCase: 'upper', template: 'classic', uiTheme: 'day', largePrint: true, highContrast: true, cellSize: 32, wordFontSize: 18, showGridLines: true, solutionStyle: 'highlight', highlightColor: '#22c55e', aiOptimize: true, allowDiag: false }
    },
    expert: {
      name: 'Expert Challenge',
      icon: '🧠',
      description: 'Maximum difficulty for puzzle masters',
      settings: { rows: 30, cols: 30, wordsPerGrid: 40, difficulty: 'expert', allowDiag: true, allowReverse: true, template: 'dark_slate', uiTheme: 'midnight', overlapPolicy: 'maximize', aiExtreme: true, aiOptimize: true, cellSize: 18, wordFontSize: 10 }
    },
    kdpStandard: {
      name: 'KDP Standard',
      icon: '📚',
      description: 'Optimized for Amazon KDP publishing',
      settings: { rows: 20, cols: 20, wordsPerGrid: 18, pageSize: '8.5x11', marginPreset: 'standard', kdpCompliant: true, showSolution: true, compress: true, template: 'classic', uiTheme: 'night', cellSize: 22, wordFontSize: 13, bleed: 0 }
    },
    kdpPremium: {
      name: 'KDP Premium',
      icon: '📖',
      description: 'High-quality KDP with solutions and bleed',
      settings: { rows: 25, cols: 25, wordsPerGrid: 22, pageSize: '8.5x11', marginPreset: 'generous', kdpCompliant: true, showSolution: true, compress: false, template: 'gold', uiTheme: 'gold', cellSize: 20, wordFontSize: 14, bleed: 9, watermark: true, watermarkText: '© MXD Puzzles' }
    },
    largePrint: {
      name: 'Large Print',
      icon: '🔍',
      description: 'Extra large text and cells for easy reading',
      settings: { rows: 15, cols: 15, wordsPerGrid: 12, cellSize: 36, wordFontSize: 20, titleFontSize: 28, largePrint: true, highContrast: true, template: 'classic', uiTheme: 'day', showGridLines: true, solutionStyle: 'boxed', highlightColor: '#ef4444' }
    },
    compact: {
      name: 'Compact',
      icon: '📱',
      description: 'Fits more puzzles per page',
      settings: { rows: 20, cols: 20, wordsPerGrid: 25, cellSize: 16, wordFontSize: 10, titleFontSize: 16, pageSize: 'A5', marginPreset: 'tight', template: 'slate', uiTheme: 'night' }
    },
    cyber: {
      name: 'Cyberpunk',
      icon: '🌆',
      description: 'Futuristic neon aesthetic',
      settings: { rows: 25, cols: 25, wordsPerGrid: 20, template: 'cyber', uiTheme: 'cyber', highlightColor: '#00ff88', solutionStyle: 'lines', cellSize: 22, fontWeight: '800', fontFamily: 'Courier New, monospace' }
    },
    newspaper: {
      name: 'Newspaper Classic',
      icon: '📰',
      description: 'Traditional newspaper puzzle style',
      settings: { rows: 15, cols: 15, wordsPerGrid: 15, template: 'newspaper', uiTheme: 'day', cellSize: 26, wordFontSize: 12, titleFontSize: 20, fontWeight: '700', showGridLines: true, solutionStyle: 'highlight', highlightColor: '#000000' }
    },
    memoryCare: {
      name: 'Memory Care',
      icon: '🧩',
      description: 'Therapeutic puzzles for cognitive support',
      settings: { rows: 8, cols: 8, wordsPerGrid: 5, difficulty: 'memoryCare', letterCase: 'upper', cellSize: 40, wordFontSize: 22, titleFontSize: 26, largePrint: true, highContrast: true, template: 'forest', uiTheme: 'day', showGridLines: true, solutionStyle: 'circle', highlightColor: '#22c55e', allowDiag: false, allowReverse: false, allowV: false }
    },
    bulkKdp: {
      name: 'Bulk KDP Book',
      icon: '📚',
      description: 'Generate 100+ puzzles for a KDP book',
      settings: { rows: 20, cols: 20, wordsPerGrid: 18, bulkMode: true, bulkPageCount: 100, pageSize: '8.5x11', marginPreset: 'standard', kdpCompliant: true, showSolution: true, compress: true, template: 'classic', uiTheme: 'night', parallelWorkers: 4, cacheEnabled: true, autoSplit: true }
    }
  };

  // ============================================================
  // AUTO-DETECTION RULES — Smart recommendations based on environment
  // ============================================================
  const AUTO_DETECT_RULES = [
    {
      id: 'screenSize',
      name: 'Screen Size Detection',
      check: function() {
        var w = window.innerWidth;
        if (w < 1024) return { recommendation: 'compact', reason: 'Small screen detected — using compact layout' };
        if (w > 2560) return { recommendation: 'highRes', reason: '4K+ screen detected — enabling high resolution' };
        return null;
      }
    },
    {
      id: 'printerDetection',
      name: 'Printer Detection',
      check: function() {
        if (window.matchMedia && window.matchMedia('print').matches) {
          return { recommendation: 'printOptimized', reason: 'Print mode detected' };
        }
        return null;
      }
    },
    {
      id: 'kdpRequirement',
      name: 'KDP Requirement Check',
      check: function(settings) {
        var issues = [];
        if (settings.kdpCompliant) {
          if (settings.marginInner < 27) issues.push('Inner margin too small for KDP (min 27pt)');
          if (settings.pageSize === 'A4' && settings.bleed > 0) issues.push('A4 with bleed not recommended for KDP');
          if (settings.rows > 35 || settings.cols > 35) issues.push('Large grid may not fit well on page');
        }
        return issues.length > 0 ? { recommendation: 'kdpFix', reason: issues.join('; '), issues: issues } : null;
      }
    },
    {
      id: 'performanceCheck',
      name: 'Performance Check',
      check: function() {
        if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) {
          return { recommendation: 'lowPerformance', reason: 'Low-end device detected — reducing workers' };
        }
        if (performance && performance.memory && performance.memory.usedJSHeapSize > 500 * 1024 * 1024) {
          return { recommendation: 'memoryWarning', reason: 'High memory usage — consider reducing grid size' };
        }
        return null;
      }
    },
    {
      id: 'accessibilityCheck',
      name: 'Accessibility Detection',
      check: function() {
        var prefs = [];
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) prefs.push('reducedMotion');
        if (window.matchMedia && window.matchMedia('(prefers-contrast: more)').matches) prefs.push('highContrast');
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) prefs.push('darkMode');
        return prefs.length > 0 ? { recommendation: 'accessibility', reason: 'System preferences: ' + prefs.join(', '), prefs: prefs } : null;
      }
    },
    {
      id: 'offlineDetection',
      name: 'Offline Mode Detection',
      check: function() {
        if (!navigator.onLine) {
          return { recommendation: 'offline', reason: 'Offline mode — using local AI and cached data' };
        }
        return null;
      }
    }
  ];

  // ============================================================
  // MIGRATION SYSTEM — Handle schema changes across versions
  // ============================================================
  var MIGRATIONS = {
    1: function(old) {
      // v1 -> v2: Add new appearance settings
      return Object.assign({}, old, { titleStyle: 'plain', titleAlign: 'center', titleWeight: 700, titleGap: 0, titleIndent: 0 });
    },
    2: function(old) {
      // v2 -> v3: Add export settings
      return Object.assign({}, old, { compress: true, watermark: false, watermarkText: 'Generated by MXD Word Search', kdpCompliant: true, bleed: 0 });
    },
    3: function(old) {
      // v3 -> v4: Add AI settings
      return Object.assign({}, old, { aiProvider: 'auto', aiModel: 'auto', aiTemperature: 0.7, aiMaxTokens: 2000, localAiEnabled: false });
    },
    4: function(old) {
      // v4 -> v5: Add performance settings
      return Object.assign({}, old, { parallelWorkers: 4, cacheEnabled: true, autoSave: true, autoSaveDelay: 300 });
    },
    5: function(old) {
      // v5 -> v6: Add accessibility settings
      return Object.assign({}, old, { largePrint: false, highContrast: false, dyslexiaFont: false, reducedMotion: false, screenReader: false });
    },
    6: function(old) {
      // v6 -> v7: Add language settings
      return Object.assign({}, old, { language: 'en', wordListLanguage: 'en' });
    },
    7: function(old) {
      // v7 -> v8: Add advanced settings
      return Object.assign({}, old, { seed: 0, overlapPolicy: 'moderate', edgeBias: 'none', clustering: 'none', fillerComplexity: 'simple', customDictionary: '', excludeWords: '' });
    },
    8: function(old) {
      // v8 -> v9: Add profile settings
      return Object.assign({}, old, { activeProfile: 'default', profileName: 'default' });
    },
    9: function(old) {
      // v9 -> v10: Add subtitle and orientation
      return Object.assign({}, old, { subtitle: '', orientation: 'portrait' });
    }
  };

  // ============================================================
  // VALIDATION ENGINE — Validate settings against schema
  // ============================================================
  function validateSetting(key, value) {
    var def = SCHEMA[key];
    if (!def) return { valid: false, error: 'Unknown setting: ' + key };
    if (value === undefined || value === null) return { valid: true, value: def.default };

    switch (def.type) {
      case 'number':
        var num = Number(value);
        if (isNaN(num)) return { valid: false, error: key + ' must be a number' };
        if (def.min !== undefined && num < def.min) return { valid: false, error: key + ' must be >= ' + def.min, corrected: def.min };
        if (def.max !== undefined && num > def.max) return { valid: false, error: key + ' must be <= ' + def.max, corrected: def.max };
        return { valid: true, value: num };
      case 'string':
        var str = String(value);
        if (def.maxLength && str.length > def.maxLength) return { valid: false, error: key + ' must be <= ' + def.maxLength + ' chars', corrected: str.substring(0, def.maxLength) };
        return { valid: true, value: str };
      case 'boolean':
        return { valid: true, value: Boolean(value) };
      case 'select':
        if (def.options.indexOf(value) === -1) return { valid: false, error: key + ' must be one of: ' + def.options.join(', '), corrected: def.default };
        return { valid: true, value: value };
      case 'color':
        if (typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)) return { valid: true, value: value };
        return { valid: false, error: key + ' must be a hex color (#RRGGBB)', corrected: def.default };
      default:
        return { valid: true, value: value };
    }
  }

  function validateAll(settings) {
    var result = { valid: true, errors: [], warnings: [], corrected: {} };
    for (var key in SCHEMA) {
      var def = SCHEMA[key];
      var val = settings[key] !== undefined ? settings[key] : def.default;
      var v = validateSetting(key, val);
      if (!v.valid) {
        result.errors.push({ key: key, error: v.error });
        result.corrected[key] = v.corrected !== undefined ? v.corrected : def.default;
        result.valid = false;
      } else if (v.value !== val) {
        result.warnings.push({ key: key, message: 'Value corrected from ' + val + ' to ' + v.value });
        result.corrected[key] = v.value;
      }
    }
    // Cross-setting validation
    if (settings.rows && settings.cols && settings.rows * settings.cols > 2500) {
      result.warnings.push({ key: 'grid', message: 'Very large grid (' + settings.rows + 'x' + settings.cols + ') may be slow' });
    }
    if (settings.kdpCompliant && settings.marginInner < 27) {
      result.warnings.push({ key: 'marginInner', message: 'KDP requires inner margin >= 27pt' });
      result.corrected.marginInner = 27;
    }
    return result;
  }

  // ============================================================
  // MAIN SETTINGS ENGINE CLASS
  // ============================================================
  class MXDSettingsEngine {
    constructor() {
      this._settings = this._getDefaults();
      this._history = [];
      this._listeners = {};
      this._debounceTimer = null;
      this._profiles = {};
      this._autoDetectResults = [];
      this._diagnostics = { loadTime: 0, validationErrors: 0, migrationsRun: 0, lastSave: 0 };
      this._quotaWarningShown = false;
      this.init();
    }

    init() {
      var start = performance.now();
      this._loadProfiles();
      this._loadSettings();
      this._loadHistory();
      this._runAutoDetect();
      this._setupStorageListener();
      this._diagnostics.loadTime = performance.now() - start;
      console.log('[MXD Settings v' + SETTINGS_VERSION + '] Initialized in ' + this._diagnostics.loadTime.toFixed(1) + 'ms');
    }

    _getDefaults() {
      var defaults = {};
      for (var key in SCHEMA) {
        defaults[key] = SCHEMA[key].default;
      }
      return defaults;
    }

    _loadSettings() {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        var data = JSON.parse(raw);
        var version = data._version || 0;

        // Run migrations if needed
        if (version < SETTINGS_VERSION) {
          console.log('[MXD Settings] Migrating from v' + version + ' to v' + SETTINGS_VERSION);
          for (var v = version; v < SETTINGS_VERSION; v++) {
            if (MIGRATIONS[v]) {
              data = MIGRATIONS[v](data);
              this._diagnostics.migrationsRun++;
            }
          }
          data._version = SETTINGS_VERSION;
        }

        // Validate and merge
        var validation = validateAll(data);
        if (!validation.valid) {
          this._diagnostics.validationErrors = validation.errors.length;
          console.warn('[MXD Settings] Validation errors:', validation.errors);
        }
        if (Object.keys(validation.corrected).length > 0) {
          Object.assign(data, validation.corrected);
        }

        // Merge with defaults (only known keys)
        var merged = this._getDefaults();
        for (var key in SCHEMA) {
          if (data[key] !== undefined) merged[key] = data[key];
        }
        this._settings = merged;
      } catch (e) {
        console.error('[MXD Settings] Failed to load settings, using defaults:', e);
        this._settings = this._getDefaults();
      }
    }

    _saveSettings() {
      try {
        var data = Object.assign({}, this._settings, { _version: SETTINGS_VERSION, _savedAt: Date.now() });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        this._diagnostics.lastSave = Date.now();
        this._emit('save', { settings: this._settings });
      } catch (e) {
        if (e.name === 'QuotaExceededError' && !this._quotaWarningShown) {
          this._quotaWarningShown = true;
          console.warn('[MXD Settings] Storage quota exceeded. Clearing old history.');
          this._clearHistory();
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.assign({}, this._settings, { _version: SETTINGS_VERSION })));
          } catch (e2) {
            console.error('[MXD Settings] Still cannot save settings:', e2);
          }
        }
      }
    }

    _debouncedSave() {
      var self = this;
      var delay = this._settings.autoSaveDelay || WRITE_DEBOUNCE_MS;
      if (this._debounceTimer) clearTimeout(this._debounceTimer);
      this._debounceTimer = setTimeout(function() {
        self._saveSettings();
      }, delay);
    }

    _loadProfiles() {
      try {
        var raw = localStorage.getItem(PROFILES_KEY);
        if (raw) this._profiles = JSON.parse(raw);
      } catch (e) { this._profiles = {}; }
      // Ensure default profile exists
      if (!this._profiles.default) {
        this._profiles.default = { name: 'Default', icon: '⚙️', settings: this._getDefaults(), createdAt: Date.now() };
      }
    }

    _saveProfiles() {
      try {
        localStorage.setItem(PROFILES_KEY, JSON.stringify(this._profiles));
      } catch (e) { console.warn('[MXD Settings] Could not save profiles:', e); }
    }

    _loadHistory() {
      try {
        var raw = localStorage.getItem(HISTORY_KEY);
        if (raw) this._history = JSON.parse(raw);
      } catch (e) { this._history = []; }
    }

    _saveHistory() {
      try {
        if (this._history.length > MAX_HISTORY) this._history = this._history.slice(-MAX_HISTORY);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(this._history));
      } catch (e) {}
    }

    _clearHistory() {
      this._history = [];
      try { localStorage.removeItem(HISTORY_KEY); } catch (e) {}
    }

    _setupStorageListener() {
      var self = this;
      window.addEventListener('storage', function(e) {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            var data = JSON.parse(e.newValue);
            var merged = self._getDefaults();
            for (var key in SCHEMA) { if (data[key] !== undefined) merged[key] = data[key]; }
            self._settings = merged;
            self._emit('sync', { settings: self._settings });
          } catch (err) {}
        }
      });
    }

    _runAutoDetect() {
      var self = this;
      this._autoDetectResults = [];
      AUTO_DETECT_RULES.forEach(function(rule) {
        try {
          var result = rule.check(self._settings);
          if (result) {
            self._autoDetectResults.push(Object.assign({ ruleId: rule.id, ruleName: rule.name }, result));
          }
        } catch (e) {}
      });
      if (this._autoDetectResults.length > 0) {
        console.log('[MXD Settings] Auto-detect results:', this._autoDetectResults);
        this._emit('autoDetect', this._autoDetectResults);
      }
    }

    // ============================================================
    // PUBLIC API
    // ============================================================

    // Get a single setting value
    get(key) {
      if (SCHEMA[key]) return this._settings[key];
      console.warn('[MXD Settings] Unknown key:', key);
      return undefined;
    }

    // Get all settings
    getAll() {
      return Object.assign({}, this._settings);
    }

    // Set a single setting
    set(key, value, skipSave) {
      var validation = validateSetting(key, value);
      if (!validation.valid) {
        console.warn('[MXD Settings] Invalid value for ' + key + ':', validation.error);
        if (validation.corrected !== undefined) {
          value = validation.corrected;
        } else {
          return false;
        }
      }
      var oldValue = this._settings[key];
      if (oldValue === value) return true;

      // Push to history
      this._history.push({ key: key, oldValue: oldValue, newValue: value, timestamp: Date.now() });
      this._saveHistory();

      this._settings[key] = value;
      this._emit('change', { key: key, oldValue: oldValue, newValue: value });

      if (!skipSave && this._settings.autoSave) {
        this._debouncedSave();
      }
      return true;
    }

    // Set multiple settings at once
    setMultiple(updates, skipSave) {
      var changes = [];
      for (var key in updates) {
        if (this.set(key, updates[key], true)) {
          changes.push(key);
        }
      }
      if (changes.length > 0) {
        this._emit('batchChange', { keys: changes });
        if (!skipSave && this._settings.autoSave) {
          this._debouncedSave();
        }
      }
      return changes;
    }

    // Apply a preset
    applyPreset(presetId) {
      var preset = PRESETS[presetId];
      if (!preset) {
        console.warn('[MXD Settings] Unknown preset:', presetId);
        return false;
      }
      this._history.push({ type: 'preset', presetId: presetId, oldSettings: Object.assign({}, this._settings), timestamp: Date.now() });
      this._saveHistory();
      this.setMultiple(preset.settings);
      this._emit('presetApplied', { presetId: presetId, name: preset.name });
      return true;
    }

    // Get available presets
    getPresets() {
      var list = [];
      for (var id in PRESETS) {
        list.push({ id: id, name: PRESETS[id].name, icon: PRESETS[id].icon, description: PRESETS[id].description });
      }
      return list;
    }

    // Get preset details
    getPreset(id) {
      return PRESETS[id] || null;
    }

    // Undo last change
    undo() {
      if (this._history.length === 0) return false;
      var last = this._history.pop();
      if (last.key) {
        this._settings[last.key] = last.oldValue;
        this._emit('undo', { key: last.key, value: last.oldValue });
      } else if (last.type === 'preset') {
        this._settings = last.oldSettings;
        this._emit('undo', { type: 'preset' });
      }
      this._saveHistory();
      this._saveSettings();
      return true;
    }

    // Redo (not implemented yet — history is linear)
    redo() { return false; }

    // Get undo history
    getHistory() {
      return this._history.slice(-10);
    }

    // Reset to defaults
    resetToDefaults() {
      this._history.push({ type: 'reset', oldSettings: Object.assign({}, this._settings), timestamp: Date.now() });
      this._saveHistory();
      this._settings = this._getDefaults();
      this._saveSettings();
      this._emit('reset', { settings: this._settings });
      return true;
    }

    // Export settings as JSON
    exportSettings() {
      return JSON.stringify(this._settings, null, 2);
    }

    // Import settings from JSON
    importSettings(jsonString) {
      try {
        var data = JSON.parse(jsonString);
        var validation = validateAll(data);
        if (!validation.valid) {
          console.warn('[MXD Settings] Import validation errors:', validation.errors);
        }
        if (Object.keys(validation.corrected).length > 0) {
          Object.assign(data, validation.corrected);
        }
        this._history.push({ type: 'import', oldSettings: Object.assign({}, this._settings), timestamp: Date.now() });
        this._saveHistory();
        var merged = this._getDefaults();
        for (var key in SCHEMA) { if (data[key] !== undefined) merged[key] = data[key]; }
        this._settings = merged;
        this._saveSettings();
        this._emit('import', { settings: this._settings });
        return { success: true, warnings: validation.warnings };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }

    // Profile management
    createProfile(name, icon) {
      var id = 'profile_' + Date.now();
      this._profiles[id] = { name: name || 'Profile ' + (Object.keys(this._profiles).length + 1), icon: icon || '📁', settings: Object.assign({}, this._settings), createdAt: Date.now() };
      this._saveProfiles();
      this._emit('profileCreated', { id: id, name: this._profiles[id].name });
      return id;
    }

    saveProfile(id) {
      if (!this._profiles[id]) return false;
      this._profiles[id].settings = Object.assign({}, this._settings);
      this._profiles[id].updatedAt = Date.now();
      this._saveProfiles();
      this._emit('profileSaved', { id: id });
      return true;
    }

    loadProfile(id) {
      if (!this._profiles[id]) return false;
      this._history.push({ type: 'profileLoad', profileId: id, oldSettings: Object.assign({}, this._settings), timestamp: Date.now() });
      this._saveHistory();
      var merged = this._getDefaults();
      for (var key in SCHEMA) { if (this._profiles[id].settings[key] !== undefined) merged[key] = this._profiles[id].settings[key]; }
      this._settings = merged;
      this._settings.activeProfile = id;
      this._saveSettings();
      this._emit('profileLoaded', { id: id, settings: this._settings });
      return true;
    }

    deleteProfile(id) {
      if (id === 'default') return false;
      delete this._profiles[id];
      this._saveProfiles();
      this._emit('profileDeleted', { id: id });
      return true;
    }

    getProfiles() {
      var list = [];
      for (var id in this._profiles) {
        list.push({ id: id, name: this._profiles[id].name, icon: this._profiles[id].icon, createdAt: this._profiles[id].createdAt, updatedAt: this._profiles[id].updatedAt });
      }
      return list;
    }

    getProfile(id) {
      return this._profiles[id] || null;
    }

    // Auto-detect results
    getAutoDetectResults() {
      return this._autoDetectResults;
    }

    // Re-run auto-detection
    reAutoDetect() {
      this._runAutoDetect();
      return this._autoDetectResults;
    }

    // Apply auto-detect recommendations
    applyAutoDetectRecommendations() {
      var self = this;
      var applied = [];
      this._autoDetectResults.forEach(function(result) {
        if (result.recommendation === 'compact') {
          self.setMultiple({ cellSize: 18, wordFontSize: 11 }, true);
          applied.push('compact');
        } else if (result.recommendation === 'highRes') {
          self.set('highRes', true, true);
          applied.push('highRes');
        } else if (result.recommendation === 'kdpFix' && result.issues) {
          result.issues.forEach(function(issue) {
            if (issue.indexOf('margin') !== -1) self.set('marginInner', 27, true);
          });
          applied.push('kdpFix');
        } else if (result.recommendation === 'lowPerformance') {
          self.set('parallelWorkers', 1, true);
          applied.push('lowPerformance');
        } else if (result.recommendation === 'accessibility' && result.prefs) {
          result.prefs.forEach(function(pref) {
            if (pref === 'reducedMotion') self.set('reducedMotion', true, true);
            if (pref === 'highContrast') self.set('highContrast', true, true);
            if (pref === 'darkMode') self.set('uiTheme', 'night', true);
          });
          applied.push('accessibility');
        } else if (result.recommendation === 'offline') {
          self.set('localAiEnabled', true, true);
          applied.push('offline');
        }
      });
      if (applied.length > 0) {
        this._saveSettings();
        this._emit('autoDetectApplied', { recommendations: applied });
      }
      return applied;
    }

    // Validation
    validate() {
      return validateAll(this._settings);
    }

    // Diagnostics
    getDiagnostics() {
      var mem = null;
      if (performance && performance.memory) {
        mem = { used: (performance.memory.usedJSHeapSize / 1048576).toFixed(1) + 'MB', total: (performance.memory.totalJSHeapSize / 1048576).toFixed(1) + 'MB' };
      }
      var storageUsed = 0;
      try {
        for (var key in localStorage) {
          if (localStorage.hasOwnProperty(key) && key.indexOf('mxd') === 0) {
            storageUsed += localStorage[key].length * 2; // UTF-16
          }
        }
      } catch (e) {}
      return Object.assign({}, this._diagnostics, {
        settingsCount: Object.keys(this._settings).length,
        historyLength: this._history.length,
        profilesCount: Object.keys(this._profiles).length,
        autoDetectResults: this._autoDetectResults.length,
        storageUsed: (storageUsed / 1024).toFixed(1) + 'KB',
        memory: mem,
        online: navigator.onLine,
        protocol: window.location.protocol,
        version: SETTINGS_VERSION
      });
    }

    // Schema info
    getSchema() {
      return SCHEMA;
    }

    // Get settings by category
    getByCategory(category) {
      var result = {};
      for (var key in SCHEMA) {
        if (SCHEMA[key].category === category) {
          result[key] = { value: this._settings[key], schema: SCHEMA[key] };
        }
      }
      return result;
    }

    // Get all categories
    getCategories() {
      var cats = {};
      for (var key in SCHEMA) {
        var cat = SCHEMA[key].category;
        if (!cats[cat]) cats[cat] = { count: 0, keys: [] };
        cats[cat].count++;
        cats[cat].keys.push(key);
      }
      return cats;
    }

    // Search settings
    search(query) {
      var q = query.toLowerCase();
      var results = [];
      for (var key in SCHEMA) {
        var def = SCHEMA[key];
        if (key.toLowerCase().indexOf(q) !== -1 || def.label.toLowerCase().indexOf(q) !== -1 || def.description.toLowerCase().indexOf(q) !== -1 || def.category.toLowerCase().indexOf(q) !== -1) {
          results.push({ key: key, schema: def, value: this._settings[key] });
        }
      }
      return results;
    }

    // Event system
    on(event, callback) {
      if (!this._listeners[event]) this._listeners[event] = [];
      this._listeners[event].push(callback);
    }

    off(event, callback) {
      if (!this._listeners[event]) return;
      this._listeners[event] = this._listeners[event].filter(function(cb) { return cb !== callback; });
    }

    _emit(event, data) {
      if (!this._listeners[event]) return;
      var self = this;
      this._listeners[event].forEach(function(cb) {
        try { cb(data, self._settings); } catch (e) { console.error('[MXD Settings] Listener error:', e); }
      });
    }

    // Force save immediately
    save() {
      this._saveSettings();
    }

    // Get AI recommendations based on current settings
    getAiRecommendations() {
      var recs = [];
      var s = this._settings;

      // Difficulty vs grid size
      if (s.difficulty === 'expert' && (s.rows < 25 || s.cols < 25)) {
        recs.push({ type: 'suggestion', message: 'Expert difficulty works best with 25x25+ grids', action: { rows: 25, cols: 25 } });
      }
      if (s.difficulty === 'very-easy' && (s.rows > 15 || s.cols > 15)) {
        recs.push({ type: 'suggestion', message: 'Very easy difficulty works best with smaller grids (10-15)', action: { rows: 12, cols: 12 } });
      }

      // Word count vs grid size
      var gridArea = s.rows * s.cols;
      var wordsPerCell = s.wordsPerGrid / gridArea;
      if (wordsPerCell > 0.08) {
        recs.push({ type: 'warning', message: 'High word density (' + (wordsPerCell * 100).toFixed(1) + '%). May cause placement issues.' });
      }
      if (wordsPerCell < 0.01) {
        recs.push({ type: 'suggestion', message: 'Low word density. Consider adding more words or reducing grid size.' });
      }

      // KDP compliance
      if (s.kdpCompliant) {
        if (s.marginInner < 36) recs.push({ type: 'warning', message: 'KDP recommends inner margin >= 36pt for books over 100 pages' });
        if (s.pageSize === 'A4') recs.push({ type: 'info', message: 'A4 is not a standard KDP size. Consider 8.5x11 or 6x9' });
      }

      // Performance
      if (s.rows * s.cols > 625 && !s.aiOptimize) {
        recs.push({ type: 'suggestion', message: 'Large grids benefit from AI optimization', action: { aiOptimize: true } });
      }

      // Accessibility
      if (s.cellSize < 18 && !s.largePrint) {
        recs.push({ type: 'info', message: 'Small cells may be hard to read. Consider Large Print mode.' });
      }

      // Theme consistency
      var themeTemplates = { night: ['classic', 'dark_slate', 'cyber'], day: ['classic', 'ocean', 'forest', 'newspaper'], cyber: ['cyber'], gold: ['gold'], rose: ['rose'], midnight: ['dark_slate', 'cyber'], lavender: ['lavender'] };
      if (themeTemplates[s.uiTheme] && themeTemplates[s.uiTheme].indexOf(s.template) === -1) {
        recs.push({ type: 'info', message: 'Template "' + s.template + '" may not match theme "' + s.uiTheme + '" well' });
      }

      return recs;
    }

    // Conflict detection and resolution
    detectConflicts() {
      var conflicts = [];
      var s = this._settings;

      if (s.allowDiag === false && s.allowReverse === false && s.allowH === false && s.allowV === false) {
        conflicts.push({ type: 'error', message: 'All directions disabled — no words can be placed', resolution: { allowH: true, allowV: true } });
      }
      if (s.bulkMode && s.bulkPageCount > 200 && s.parallelWorkers > 4) {
        conflicts.push({ type: 'warning', message: 'High worker count with large bulk may cause memory issues', resolution: { parallelWorkers: 2 } });
      }
      if (s.largePrint && s.cellSize < 24) {
        conflicts.push({ type: 'warning', message: 'Large Print mode with small cells', resolution: { cellSize: 32 } });
      }
      if (s.aiExtreme && !navigator.onLine) {
        conflicts.push({ type: 'warning', message: 'AI Extreme requires internet connection', resolution: { aiExtreme: false } });
      }

      return conflicts;
    }

    // Auto-resolve conflicts
    autoResolveConflicts() {
      var conflicts = this.detectConflicts();
      var resolved = [];
      var self = this;
      conflicts.forEach(function(c) {
        if (c.resolution) {
          self.setMultiple(c.resolution, true);
          resolved.push(c.message);
        }
      });
      if (resolved.length > 0) {
        this._saveSettings();
        this._emit('conflictsResolved', { resolved: resolved });
      }
      return resolved;
    }
  }

  // ============================================================
  // EXPORT TO WINDOW
  // ============================================================
  window.MXD_SETTINGS = new MXDSettingsEngine();
  window.MXD_SETTINGS_SCHEMA = SCHEMA;
  window.MXD_SETTINGS_PRESETS = PRESETS;
  window.MXD_SETTINGS_VERSION = SETTINGS_VERSION;

  // ============================================================
  // SETTINGS UI COMPONENTS (merged from mxd-settings-ui.js)
  // ============================================================

  // ============================================================
  // CATEGORY DEFINITIONS
  // ============================================================
  var CATEGORIES = [
    { id: 'puzzle', name: 'Puzzle Core', icon: '🧩', color: '#6366f1' },
    { id: 'directions', name: 'Word Directions', icon: '↔️', color: '#22c55e' },
    { id: 'appearance', name: 'Appearance', icon: '🎨', color: '#f59e0b' },
    { id: 'shape', name: 'Puzzle Shape', icon: '🔷', color: '#ec4899' },
    { id: 'difficulty', name: 'Difficulty', icon: '🎯', color: '#ef4444' },
    { id: 'export', name: 'Export & PDF', icon: '📄', color: '#3b82f6' },
    { id: 'ui', name: 'Interface', icon: '🖥️', color: '#8b5cf6' },
    { id: 'ai', name: 'AI Engine', icon: '🤖', color: '#06b6d4' },
    { id: 'performance', name: 'Performance', icon: '⚡', color: '#f97316' },
    { id: 'accessibility', name: 'Accessibility', icon: '♿', color: '#14b8a6' },
    { id: 'language', name: 'Language', icon: '🌐', color: '#a855f7' },
    { id: 'advanced', name: 'Advanced', icon: '🔧', color: '#64748b' },
    { id: 'profile', name: 'Profiles', icon: '👤', color: '#c9a227' },
    { id: 'kdp', name: 'KDP Intelligence', icon: '📊', color: '#10b981' },
    { id: 'svg', name: 'SVG Shapes', icon: '🔲', color: '#a855f7' }
  ];

  // ============================================================
  // SETTINGS MODAL COMPONENT (Plain JS — no JSX needed)
  // ============================================================
  function createSettingsModal() {
    if (document.getElementById('mxd-settings-modal')) return;

    var modal = document.createElement('div');
    modal.id = 'mxd-settings-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:99998;display:none;align-items:center;justify-content:center;backdrop-filter:blur(4px);';

    var container = document.createElement('div');
    container.style.cssText = 'background:#0f172a;border-radius:16px;width:95%;max-width:1400px;height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.5);border:1px solid #1e293b;';

    // Header
    var header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #1e293b;';
    header.innerHTML = '<div style="display:flex;align-items:center;gap:12px;"><span style="font-size:24px;">⚙️</span><div><h2 style="margin:0;color:#f8fafc;font-size:20px;font-weight:700;">Settings</h2><p style="margin:0;color:#64748b;font-size:13px;">Configure every aspect of your puzzle generator</p></div></div><div style="display:flex;align-items:center;gap:8px;"><button id="mxd-settings-reset" style="background:#334155;color:#e2e8f0;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;">Reset Defaults</button><button id="mxd-settings-export" style="background:#334155;color:#e2e8f0;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;">Export</button><button id="mxd-settings-import" style="background:#334155;color:#e2e8f0;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;">Import</button><button id="mxd-settings-close" style="background:none;border:none;color:#94a3b8;font-size:24px;cursor:pointer;padding:4px 8px;border-radius:6px;">&times;</button></div>';

    // Body
    var body = document.createElement('div');
    body.style.cssText = 'display:flex;flex:1;overflow:hidden;';

    // Sidebar
    var sidebar = document.createElement('div');
    sidebar.id = 'mxd-settings-sidebar';
    sidebar.style.cssText = 'width:220px;background:#1e293b;border-right:1px solid #334155;overflow-y:auto;flex-shrink:0;';

    // Search
    var searchDiv = document.createElement('div');
    searchDiv.style.cssText = 'padding:12px;border-bottom:1px solid #334155;';
    searchDiv.innerHTML = '<input type="text" id="mxd-settings-search" placeholder="Search settings..." style="width:100%;background:#0f172a;border:1px solid #334155;color:#e2e8f0;padding:8px 12px;border-radius:8px;font-size:13px;outline:none;" />';

    // Category list
    var catList = document.createElement('div');
    catList.id = 'mxd-settings-categories';
    catList.style.cssText = 'padding:8px;';

    CATEGORIES.forEach(function(cat) {
      var item = document.createElement('div');
      item.className = 'mxd-settings-cat-item';
      item.setAttribute('data-category', cat.id);
      item.style.cssText = 'display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:8px;cursor:pointer;color:#94a3b8;font-size:14px;transition:all 0.2s;';
      item.innerHTML = '<span>' + cat.icon + '</span><span>' + cat.name + '</span><span class="mxd-cat-count" style="margin-left:auto;background:#334155;color:#64748b;font-size:11px;padding:2px 6px;border-radius:4px;">0</span>';
      item.addEventListener('mouseenter', function() { this.style.background = '#334155'; this.style.color = '#e2e8f0'; });
      item.addEventListener('mouseleave', function() { if (!this.classList.contains('active')) { this.style.background = ''; this.style.color = '#94a3b8'; } });
      item.addEventListener('click', function() {
        document.querySelectorAll('.mxd-settings-cat-item').forEach(function(el) { el.classList.remove('active'); el.style.background = ''; el.style.color = '#94a3b8'; });
        this.classList.add('active');
        this.style.background = '#6366f1';
        this.style.color = '#fff';
        showCategory(cat.id);
      });
      catList.appendChild(item);
    });

    sidebar.appendChild(searchDiv);
    sidebar.appendChild(catList);

    // Content area
    var content = document.createElement('div');
    content.id = 'mxd-settings-content';
    content.style.cssText = 'flex:1;overflow-y:auto;padding:24px;';

    body.appendChild(sidebar);
    body.appendChild(content);

    // Footer
    var footer = document.createElement('div');
    footer.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:16px 24px;border-top:1px solid #1e293b;';
    footer.innerHTML = '<div style="color:#64748b;font-size:13px;" id="mxd-settings-status">Ready</div><div style="display:flex;gap:8px;"><button id="mxd-settings-undo" style="background:#334155;color:#e2e8f0;border:none;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:13px;">Undo</button><button id="mxd-settings-apply" style="background:#6366f1;color:#fff;border:none;padding:8px 20px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;">Apply & Close</button></div>';

    container.appendChild(header);
    container.appendChild(body);
    container.appendChild(footer);
    modal.appendChild(container);
    document.body.appendChild(modal);

    // ============================================================
    // EVENT HANDLERS
    // ============================================================
    document.getElementById('mxd-settings-close').addEventListener('click', function() { hideSettingsModal(); });
    modal.addEventListener('click', function(e) { if (e.target === modal) hideSettingsModal(); });

    document.getElementById('mxd-settings-reset').addEventListener('click', function() {
      if (confirm('Reset all settings to defaults? This cannot be undone.')) {
        window.MXD_SETTINGS.resetToDefaults();
        renderCategory('puzzle');
        updateStatus('Settings reset to defaults');
      }
    });

    document.getElementById('mxd-settings-export').addEventListener('click', function() {
      var json = window.MXD_SETTINGS.exportSettings();
      var blob = new Blob([json], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'mxd-settings-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click();
      URL.revokeObjectURL(url);
      updateStatus('Settings exported');
    });

    document.getElementById('mxd-settings-import').addEventListener('click', function() {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) {
          var result = window.MXD_SETTINGS.importSettings(ev.target.result);
          if (result.success) {
            renderCategory('puzzle');
            updateStatus('Settings imported' + (result.warnings.length > 0 ? ' (' + result.warnings.length + ' warnings)' : ''));
          } else {
            updateStatus('Import failed: ' + result.error);
          }
        };
        reader.readAsText(file);
      });
      input.click();
    });

    document.getElementById('mxd-settings-undo').addEventListener('click', function() {
      if (window.MXD_SETTINGS.undo()) {
        renderCategory(getCurrentCategory());
        updateStatus('Undo successful');
      } else {
        updateStatus('Nothing to undo');
      }
    });

    document.getElementById('mxd-settings-apply').addEventListener('click', function() {
      window.MXD_SETTINGS.save();
      hideSettingsModal();
      if (window.showToast) window.showToast('Settings saved!', 'success');
    });

    // Search handler
    document.getElementById('mxd-settings-search').addEventListener('input', function(e) {
      var query = e.target.value.trim();
      if (query.length < 2) {
        renderCategory(getCurrentCategory());
        return;
      }
      renderSearchResults(query);
    });

    // Keyboard shortcut
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.style.display === 'flex') hideSettingsModal();
    });

    // ============================================================
    // RENDER FUNCTIONS
    // ============================================================
    var currentCategory = 'puzzle';

    function getCurrentCategory() { return currentCategory; }

    function showCategory(catId) {
      currentCategory = catId;
      renderCategory(catId);
    }

    function renderCategory(catId) {
      var settings = window.MXD_SETTINGS.getByCategory(catId);
      var cat = CATEGORIES.find(function(c) { return c.id === catId; });
      if (!cat) return;

      var html = '<div style="margin-bottom:24px;"><h3 style="color:#f8fafc;font-size:18px;margin:0 0 4px;">' + cat.icon + ' ' + cat.name + '</h3><p style="color:#64748b;font-size:13px;margin:0;">Configure ' + cat.name.toLowerCase() + ' settings</p></div>';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;">';

      for (var key in settings) {
        var def = settings[key].schema;
        var val = settings[key].value;
        html += renderSettingCard(key, def, val);
      }

      html += '</div>';

      // Presets section for puzzle category
      if (catId === 'puzzle') {
        html += renderPresetsSection();
      }

      // Profiles section
      if (catId === 'profile') {
        html += renderProfilesSection();
      }

      // KDP Health Dashboard section
      if (catId === 'kdp') {
        html += renderKDPHealthSection();
      }

      // SVG Shape Manager section
      if (catId === 'svg') {
        html += '<div id="mxd-svg-manager-container"></div>';
        // Initialize after render
        setTimeout(function() {
          if (window.MXDSVGShapeManager) {
            window.MXDSVGShapeManager.init('mxd-svg-manager-container');
          }
        }, 100);
      }

      content.innerHTML = html;
      bindSettingEvents();
    }

    function renderSettingCard(key, def, val) {
      var html = '<div class="mxd-setting-card" style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:16px;">';
      html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">';
      html += '<span style="font-size:16px;">' + def.icon + '</span>';
      html += '<div style="flex:1;"><div style="color:#e2e8f0;font-size:14px;font-weight:600;">' + def.label + '</div><div style="color:#64748b;font-size:12px;">' + def.description + '</div></div>';
      html += '</div>';

      switch (def.type) {
        case 'number':
          html += '<div style="display:flex;align-items:center;gap:8px;">';
          html += '<input type="range" class="mxd-setting-input" data-key="' + key + '" data-type="number" min="' + (def.min || 0) + '" max="' + (def.max || 100) + '" step="' + (def.step || 1) + '" value="' + val + '" style="flex:1;accent-color:#6366f1;" />';
          html += '<input type="number" class="mxd-setting-number" data-key="' + key + '" data-type="number" min="' + (def.min || 0) + '" max="' + (def.max || 100) + '" step="' + (def.step || 1) + '" value="' + val + '" style="width:64px;background:#0f172a;border:1px solid #334155;color:#e2e8f0;padding:4px 8px;border-radius:6px;font-size:13px;text-align:center;" />';
          html += '</div>';
          break;
        case 'string':
          html += '<input type="text" class="mxd-setting-input" data-key="' + key + '" data-type="string" value="' + escapeHtml(val) + '" placeholder="' + def.label + '" style="width:100%;background:#0f172a;border:1px solid #334155;color:#e2e8f0;padding:8px 12px;border-radius:6px;font-size:13px;" />';
          break;
        case 'boolean':
          html += '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;"><input type="checkbox" class="mxd-setting-input" data-key="' + key + '" data-type="boolean" ' + (val ? 'checked' : '') + ' style="accent-color:#6366f1;width:16px;height:16px;" /><span style="color:#94a3b8;font-size:13px;">' + (val ? 'Enabled' : 'Disabled') + '</span></label>';
          break;
        case 'select':
          html += '<select class="mxd-setting-input" data-key="' + key + '" data-type="select" style="width:100%;background:#0f172a;border:1px solid #334155;color:#e2e8f0;padding:8px 12px;border-radius:6px;font-size:13px;">';
          def.options.forEach(function(opt) {
            html += '<option value="' + opt + '"' + (val === opt ? ' selected' : '') + '>' + opt + '</option>';
          });
          html += '</select>';
          break;
        case 'color':
          html += '<div style="display:flex;align-items:center;gap:8px;">';
          html += '<input type="color" class="mxd-setting-input" data-key="' + key + '" data-type="color" value="' + val + '" style="width:40px;height:32px;border:none;border-radius:6px;cursor:pointer;background:none;" />';
          html += '<input type="text" class="mxd-setting-color-text" data-key="' + key + '" data-type="color" value="' + val + '" style="flex:1;background:#0f172a;border:1px solid #334155;color:#e2e8f0;padding:6px 10px;border-radius:6px;font-size:13px;font-family:monospace;" />';
          html += '</div>';
          break;
      }

      html += '</div>';
      return html;
    }

    function renderPresetsSection() {
      var presets = window.MXD_SETTINGS.getPresets();
      var html = '<div style="margin-top:32px;"><h3 style="color:#f8fafc;font-size:16px;margin:0 0 16px;">⚡ Quick Presets</h3>';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;">';

      presets.forEach(function(preset) {
        html += '<button class="mxd-preset-btn" data-preset="' + preset.id + '" style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:16px;cursor:pointer;text-align:left;transition:all 0.2s;">';
        html += '<div style="font-size:24px;margin-bottom:8px;">' + preset.icon + '</div>';
        html += '<div style="color:#e2e8f0;font-size:14px;font-weight:600;margin-bottom:4px;">' + preset.name + '</div>';
        html += '<div style="color:#64748b;font-size:12px;">' + preset.description + '</div>';
        html += '</button>';
      });

      html += '</div></div>';
      return html;
    }

    function renderProfilesSection() {
      var profiles = window.MXD_SETTINGS.getProfiles();
      var html = '<div><h3 style="color:#f8fafc;font-size:16px;margin:0 0 16px;">👤 Settings Profiles</h3>';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-bottom:24px;">';

      profiles.forEach(function(profile) {
        var isActive = profile.id === window.MXD_SETTINGS.get('activeProfile');
        html += '<div class="mxd-profile-card" data-profile="' + profile.id + '" style="background:#1e293b;border:' + (isActive ? '2px solid #6366f1' : '1px solid #334155') + ';border-radius:10px;padding:16px;cursor:pointer;transition:all 0.2s;">';
        html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">';
        html += '<span style="font-size:20px;">' + profile.icon + '</span>';
        html += '<div style="flex:1;"><div style="color:#e2e8f0;font-size:14px;font-weight:600;">' + profile.name + '</div>';
        if (isActive) html += '<div style="color:#6366f1;font-size:11px;">Active</div>';
        html += '</div></div>';
        html += '<div style="display:flex;gap:4px;">';
        html += '<button class="mxd-profile-load" data-profile="' + profile.id + '" style="flex:1;background:#6366f1;color:#fff;border:none;padding:4px 8px;border-radius:4px;font-size:12px;cursor:pointer;">Load</button>';
        html += '<button class="mxd-profile-save" data-profile="' + profile.id + '" style="flex:1;background:#334155;color:#e2e8f0;border:none;padding:4px 8px;border-radius:4px;font-size:12px;cursor:pointer;">Save</button>';
        if (profile.id !== 'default') html += '<button class="mxd-profile-delete" data-profile="' + profile.id + '" style="background:#ef4444;color:#fff;border:none;padding:4px 8px;border-radius:4px;font-size:12px;cursor:pointer;">&times;</button>';
        html += '</div></div>';
      });

      html += '</div>';
      html += '<button id="mxd-profile-create" style="background:#334155;color:#e2e8f0;border:1px dashed #475569;padding:12px 20px;border-radius:10px;cursor:pointer;font-size:14px;width:100%;">+ Create New Profile</button>';
      html += '</div>';
      return html;
    }

    function renderKDPHealthSection() {
      var html = '<div id="mxd-kdp-health-dashboard"></div>';
      return html;
    }

    function renderSearchResults(query) {
      var results = window.MXD_SETTINGS.search(query);
      if (results.length === 0) {
        content.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#64748b;"><div style="font-size:48px;margin-bottom:16px;">🔍</div><div style="font-size:16px;">No settings found for "' + escapeHtml(query) + '"</div></div>';
        return;
      }

      var html = '<div style="margin-bottom:16px;color:#64748b;font-size:13px;">Found ' + results.length + ' settings for "' + escapeHtml(query) + '"</div>';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;">';

      results.forEach(function(r) {
        html += renderSettingCard(r.key, r.schema, r.value);
      });

      html += '</div>';
      content.innerHTML = html;
      bindSettingEvents();
    }

    function bindSettingEvents() {
      // Range + number sync
      document.querySelectorAll('.mxd-setting-input[data-type="number"]').forEach(function(input) {
        input.addEventListener('input', function() {
          var key = this.getAttribute('data-key');
          var val = Number(this.value);
          window.MXD_SETTINGS.set(key, val);
          // Sync number input
          var numInput = document.querySelector('.mxd-setting-number[data-key="' + key + '"]');
          if (numInput) numInput.value = val;
          updateStatus('Changed: ' + key + ' = ' + val);
        });
      });

      document.querySelectorAll('.mxd-setting-number').forEach(function(input) {
        input.addEventListener('change', function() {
          var key = this.getAttribute('data-key');
          var val = Number(this.value);
          window.MXD_SETTINGS.set(key, val);
          // Sync range input
          var rangeInput = document.querySelector('.mxd-setting-input[data-key="' + key + '"]');
          if (rangeInput) rangeInput.value = val;
          updateStatus('Changed: ' + key + ' = ' + val);
        });
      });

      // Text inputs
      document.querySelectorAll('.mxd-setting-input[data-type="string"]').forEach(function(input) {
        input.addEventListener('change', function() {
          var key = this.getAttribute('data-key');
          window.MXD_SETTINGS.set(key, this.value);
          updateStatus('Changed: ' + key);
        });
      });

      // Checkboxes
      document.querySelectorAll('.mxd-setting-input[data-type="boolean"]').forEach(function(input) {
        input.addEventListener('change', function() {
          var key = this.getAttribute('data-key');
          window.MXD_SETTINGS.set(key, this.checked);
          // Update label text
          var label = this.closest('label');
          if (label) {
            var span = label.querySelector('span');
            if (span) span.textContent = this.checked ? 'Enabled' : 'Disabled';
          }
          updateStatus('Changed: ' + key + ' = ' + this.checked);
        });
      });

      // Selects
      document.querySelectorAll('.mxd-setting-input[data-type="select"]').forEach(function(input) {
        input.addEventListener('change', function() {
          var key = this.getAttribute('data-key');
          window.MXD_SETTINGS.set(key, this.value);
          updateStatus('Changed: ' + key + ' = ' + this.value);
        });
      });

      // Color inputs
      document.querySelectorAll('.mxd-setting-input[data-type="color"]').forEach(function(input) {
        input.addEventListener('input', function() {
          var key = this.getAttribute('data-key');
          window.MXD_SETTINGS.set(key, this.value);
          var textInput = document.querySelector('.mxd-setting-color-text[data-key="' + key + '"]');
          if (textInput) textInput.value = this.value;
          updateStatus('Changed: ' + key + ' = ' + this.value);
        });
      });

      document.querySelectorAll('.mxd-setting-color-text').forEach(function(input) {
        input.addEventListener('change', function() {
          var key = this.getAttribute('data-key');
          var val = this.value;
          if (/^#[0-9a-fA-F]{6}$/.test(val)) {
            window.MXD_SETTINGS.set(key, val);
            var colorInput = document.querySelector('.mxd-setting-input[data-key="' + key + '"]');
            if (colorInput) colorInput.value = val;
            updateStatus('Changed: ' + key + ' = ' + val);
          }
        });
      });

      // Preset buttons
      document.querySelectorAll('.mxd-preset-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var presetId = this.getAttribute('data-preset');
          if (window.MXD_SETTINGS.applyPreset(presetId)) {
            renderCategory(getCurrentCategory());
            updateStatus('Applied preset: ' + presetId);
            if (window.showToast) window.showToast('Preset applied!', 'success');
          }
        });
        btn.addEventListener('mouseenter', function() { this.style.borderColor = '#6366f1'; this.style.background = '#334155'; });
        btn.addEventListener('mouseleave', function() { this.style.borderColor = '#334155'; this.style.background = '#1e293b'; });
      });

      // Profile buttons
      document.querySelectorAll('.mxd-profile-load').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          var profileId = this.getAttribute('data-profile');
          if (window.MXD_SETTINGS.loadProfile(profileId)) {
            renderCategory('profile');
            updateStatus('Loaded profile');
            if (window.showToast) window.showToast('Profile loaded!', 'success');
          }
        });
      });

      document.querySelectorAll('.mxd-profile-save').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          var profileId = this.getAttribute('data-profile');
          if (window.MXD_SETTINGS.saveProfile(profileId)) {
            updateStatus('Profile saved');
            if (window.showToast) window.showToast('Profile saved!', 'success');
          }
        });
      });

      document.querySelectorAll('.mxd-profile-delete').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
          e.stopPropagation();
          var profileId = this.getAttribute('data-profile');
          if (confirm('Delete this profile?')) {
            window.MXD_SETTINGS.deleteProfile(profileId);
            renderCategory('profile');
            updateStatus('Profile deleted');
          }
        });
      });

      var createBtn = document.getElementById('mxd-profile-create');
      if (createBtn) {
        createBtn.addEventListener('click', function() {
          var name = prompt('Profile name:');
          if (name) {
            var id = window.MXD_SETTINGS.createProfile(name);
            renderCategory('profile');
            updateStatus('Profile created: ' + name);
          }
        });
      }
    }

    function updateStatus(msg) {
      var el = document.getElementById('mxd-settings-status');
      if (el) el.textContent = msg;
    }

    function escapeHtml(str) {
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ============================================================
    // PUBLIC UI API
    // ============================================================
    window.MXD_SETTINGS_UI = {
      show: function() {
        modal.style.display = 'flex';
        renderCategory('puzzle');
        // Update category counts
        var cats = window.MXD_SETTINGS.getCategories();
        CATEGORIES.forEach(function(cat) {
          var item = document.querySelector('.mxd-settings-cat-item[data-category="' + cat.id + '"]');
          if (item) {
            var countEl = item.querySelector('.mxd-cat-count');
            if (countEl) countEl.textContent = cats[cat.id] ? cats[cat.id].count : 0;
          }
        });
      },
      hide: hideSettingsModal
    };

    function hideSettingsModal() {
      modal.style.display = 'none';
    }
  }

  // Auto-create when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createSettingsModal);
  } else {
    createSettingsModal();
  }

})();
