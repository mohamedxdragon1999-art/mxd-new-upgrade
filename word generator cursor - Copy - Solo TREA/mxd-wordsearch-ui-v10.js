// MXD Word Search UI v10.0 — Two-Tier Settings, Real-Time Preview, Presets, Export, Book Builder
// Pillars 6-8 + Full UI Integration
(function(){
'use strict';

var React = window.React;
var ReactDOM = window.ReactDOM;

if (!React || !ReactDOM) { console.warn('[MXD WS UI v10] React not ready'); return; }

// ===== COLOR THEMES =====
var WS_THEMES = {
  classic: { name: 'Classic White', gridBg:'#ffffff', gridLetter:'#1a1a2e', gridLine:'#e2e8f0', wordListBg:'#f1f5f9', wordListText:'#334155', titleColor:'#1a1a2e', solutionHighlight:'#c9a227', decorations: ['asset_0', 'asset_1'], decorationScale: 0.4, decorationOpacity: 0.15 },
  ocean: { name: 'Ocean Blue', gridBg:'#eff6ff', gridLetter:'#1e3a5f', gridLine:'#bfdbfe', wordListBg:'#dbeafe', wordListText:'#1e40af', titleColor:'#1e3a5f', solutionHighlight:'#3b82f6', decorations: ['asset_2', 'asset_3'], decorationScale: 0.4, decorationOpacity: 0.15 },
  forest: { name: 'Forest Green', gridBg:'#f0fdf4', gridLetter:'#14532d', gridLine:'#bbf7d0', wordListBg:'#dcfce7', wordListText:'#166534', titleColor:'#14532d', solutionHighlight:'#22c55e', decorations: ['asset_4', 'asset_5'], decorationScale: 0.4, decorationOpacity: 0.15 },
  sunset: { name: 'Sunset Orange', gridBg:'#fff7ed', gridLetter:'#9a3412', gridLine:'#fed7aa', wordListBg:'#ffedd5', wordListText:'#c2410c', titleColor:'#9a3412', solutionHighlight:'#f97316', decorations: ['asset_6', 'asset_7'], decorationScale: 0.4, decorationOpacity: 0.15 },
  rose: { name: 'Rose Gold', gridBg:'#fff1f2', gridLetter:'#9f1239', gridLine:'#fecdd3', wordListBg:'#ffe4e6', wordListText:'#be123c', titleColor:'#9f1239', solutionHighlight:'#e11d48', decorations: ['asset_8', 'asset_9'], decorationScale: 0.4, decorationOpacity: 0.15 },
  gold: { name: 'Gold Premium', gridBg:'#fffbeb', gridLetter:'#78350f', gridLine:'#fde68a', wordListBg:'#fef3c7', wordListText:'#92400e', titleColor:'#78350f', solutionHighlight:'#fbbf24', decorations: ['asset_10', 'asset_11'], decorationScale: 0.4, decorationOpacity: 0.15 },
  lavender: { name: 'Lavender Dream', gridBg:'#f5f3ff', gridLetter:'#4c1d95', gridLine:'#ddd6fe', wordListBg:'#ede9fe', wordListText:'#6d28d9', titleColor:'#4c1d95', solutionHighlight:'#8b5cf6', decorations: ['asset_12', 'asset_13'], decorationScale: 0.4, decorationOpacity: 0.15 },
  mint: { name: 'Mint Fresh', gridBg:'#f0fdfa', gridLetter:'#134e4a', gridLine:'#99f6e4', wordListBg:'#ccfbf1', wordListText:'#0f766e', titleColor:'#134e4a', solutionHighlight:'#14b8a6', decorations: ['asset_14', 'asset_15'], decorationScale: 0.4, decorationOpacity: 0.15 },
  slate: { name: 'Slate Cool', gridBg:'#f8fafc', gridLetter:'#0f172a', gridLine:'#cbd5e1', wordListBg:'#e2e8f0', wordListText:'#334155', titleColor:'#0f172a', solutionHighlight:'#64748b', decorations: ['asset_16', 'asset_17'], decorationScale: 0.4, decorationOpacity: 0.15 },
  dark: { name: 'Dark Mode', gridBg:'#1e293b', gridLetter:'#e2e8f0', gridLine:'#334155', wordListBg:'#0f172a', wordListText:'#94a3b8', titleColor:'#f1f5f9', solutionHighlight:'#fbbf24', decorations: ['asset_18', 'asset_19'], decorationScale: 0.4, decorationOpacity: 0.2 },
  midnight: { name: 'Midnight', gridBg:'#0f172a', gridLetter:'#94a3b8', gridLine:'#1e293b', wordListBg:'#020617', wordListText:'#64748b', titleColor:'#f1f5f9', solutionHighlight:'#6366f1', decorations: ['asset_20', 'asset_21'], decorationScale: 0.4, decorationOpacity: 0.2 },
  neon: { name: 'Neon Dark', gridBg:'#0a0a0f', gridLetter:'#39ff14', gridLine:'#1a1a2e', wordListBg:'#0f172a', wordListText:'#00ffff', titleColor:'#39ff14', solutionHighlight:'#ff00ff', decorations: ['asset_22', 'asset_23'], decorationScale: 0.4, decorationOpacity: 0.25 },
  newspaper: { name: 'Newspaper', gridBg:'#faf6f0', gridLetter:'#1a1a1a', gridLine:'#d4c5a9', wordListBg:'#f5f0e6', wordListText:'#333333', titleColor:'#1a1a1a', solutionHighlight:'#8b7355', decorations: ['asset_24', 'asset_25'], decorationScale: 0.4, decorationOpacity: 0.15 },
  kids: { name: 'Kids Colorful', gridBg:'#fffde7', gridLetter:'#e65100', gridLine:'#ffe0b2', wordListBg:'#e1f5fe', wordListText:'#01579b', titleColor:'#e65100', solutionHighlight:'#ff6f00', decorations: ['asset_26', 'asset_27'], decorationScale: 0.4, decorationOpacity: 0.2 },
  retro: { name: 'Retro Terminal', gridBg:'#0d1117', gridLetter:'#00ff41', gridLine:'#1a2332', wordListBg:'#0a0e14', wordListText:'#00cc33', titleColor:'#00ff41', solutionHighlight:'#00ffff', decorations: ['asset_28', 'asset_29'], decorationScale: 0.4, decorationOpacity: 0.25 },
  vintage: { name: 'Vintage Parchment', gridBg:'#f5e6c8', gridLetter:'#4e342e', gridLine:'#d4b896', wordListBg:'#efebe9', wordListText:'#5d4037', titleColor:'#4e342e', solutionHighlight:'#8d6e63', decorations: ['asset_30', 'asset_31'], decorationScale: 0.4, decorationOpacity: 0.15 },
  pastel: { name: 'Pastel Dream', gridBg:'#fdf2f8', gridLetter:'#831843', gridLine:'#fbcfe8', wordListBg:'#fce7f3', wordListText:'#9d174d', titleColor:'#831843', solutionHighlight:'#ec4899', decorations: ['asset_32', 'asset_33'], decorationScale: 0.4, decorationOpacity: 0.15 },
  arctic: { name: 'Arctic Ice', gridBg:'#f0f9ff', gridLetter:'#0c4a6e', gridLine:'#bae6fd', wordListBg:'#e0f2fe', wordListText:'#0369a1', titleColor:'#0c4a6e', solutionHighlight:'#0ea5e9', decorations: ['asset_34', 'asset_35'], decorationScale: 0.4, decorationOpacity: 0.15 },
  ember: { name: 'Ember Glow', gridBg:'#fef2f2', gridLetter:'#7f1d1d', gridLine:'#fecaca', wordListBg:'#fee2e2', wordListText:'#991b1b', titleColor:'#7f1d1d', solutionHighlight:'#ef4444', decorations: ['asset_36', 'asset_37'], decorationScale: 0.4, decorationOpacity: 0.15 },
  zen: { name: 'Zen Garden', gridBg:'#f5f5f4', gridLetter:'#44403c', gridLine:'#d6d3d1', wordListBg:'#e7e5e4', wordListText:'#57534e', titleColor:'#44403c', solutionHighlight:'#a8a29e', decorations: ['asset_38', 'asset_39'], decorationScale: 0.4, decorationOpacity: 0.15 }
};

var SHAPES_LIST = [
  { id: 'square', icon: '⬜', name: 'Square' },
  { id: 'circle', icon: '⭕', name: 'Circle' },
  { id: 'diamond', icon: '🔷', name: 'Diamond' },
  { id: 'triangle', icon: '🔺', name: 'Triangle' },
  { id: 'oval', icon: '🥚', name: 'Oval' },
  { id: 'star5', icon: '⭐', name: 'Star' },
  { id: 'star6', icon: '✡', name: '6-Point Star' },
  { id: 'heart', icon: '❤️', name: 'Heart' },
  { id: 'cross', icon: '✚', name: 'Cross' },
  { id: 'moon', icon: '🌙', name: 'Moon' },
  { id: 'cloud', icon: '☁️', name: 'Cloud' },
  { id: 'shield', icon: '🛡️', name: 'Shield' },
  { id: 'hexagon', icon: '⬡', name: 'Hexagon' },
  { id: 'octagon', icon: '🛑', name: 'Octagon' },
  { id: 'pentagon', icon: '⏣', name: 'Pentagon' }
];

// ===== DEFAULT CONFIG =====
function getDefaultConfig() {
  return {
    title: 'Word Search Puzzle',
    words: '',
    difficulty: 'medium',
    rows: 15, cols: 15,
    shape: 'square',
    theme: 'classic',
    placementStrategy: 'balanced',
    overlapMode: 'matchOnly',
    priority: 'longestFirst',
    fillerMode: 'random',
    fillerLetters: '',
    letterCase: 'upper',
    letterStyle: 'normal',
    gridStyle: 'clean',
    cellShape: 'square',
    gridFont: 'Inter', gridFontSize: 14,
    wordListFont: 'Inter', wordListFontSize: 11,
    titleFont: 'Montserrat', titleFontSize: 22,
    directionPreset: 'medium',
    customDirections: [],
    wordCountMode: 'all',
    wordCount: 15,
    decoyWords: '',
    bonusWordCount: 0,
    missingVowels: false,
    showWordList: true,
    wordListColumns: 3,
    showTitle: true,
    showPageNum: true,
    seed: '',
    wordListOrder: 'random',
    customColors: null,
    decorations: ['asset_0', 'asset_1'],
    decorationScale: 0.4,
    decorationOpacity: 0.15,
    advancedOpen: false,
    showAdvanced: false
  };
}

// ===== MAIN WORD SEARCH PANEL =====
function WordSearchPanel(props) {
  var useState = React.useState;
  var config = getDefaultConfig();
  var [state, setState] = useState(config);
  var [puzzle, setPuzzle] = useState(null);
  var [generating, setGenerating] = useState(false);
  var [activeTab, setActiveTab] = useState('quick');
  var [expandedSections, setExpandedSections] = useState({});
  var [presets, setPresets] = useState([]);
  var [showPresetModal, setShowPresetModal] = useState(false);
  var [presetName, setPresetName] = useState('');
  var [notification, setNotification] = useState(null);

  var notify = function(msg, type) {
    setNotification({ msg: msg, type: type || 'ok' });
    setTimeout(function(){ setNotification(null); }, 3000);
  };

  var update = function(key, val) {
    var next = {}; next[key] = val;
    setState(function(prev){ return Object.assign({}, prev, next); });
  };

  var applyTheme = function(themeId) {
    var t = WS_THEMES[themeId];
    if (!t) return;
    setState(function(prev){
      return Object.assign({}, prev, {
        theme: themeId,
        customColors: {
          gridBg: t.gridBg, gridLetter: t.gridLetter, gridLine: t.gridLine,
          wordListBg: t.wordListBg, wordListText: t.wordListText,
          titleColor: t.titleColor, solutionHighlight: t.solutionHighlight
        },
        decorations: t.decorations || [],
        decorationScale: t.decorationScale || 0.4,
        decorationOpacity: t.decorationOpacity || 0.15
      });
    });
  };

  var generate = function() {
    var wordsText = state.words.trim();
    if (!wordsText) { notify('Please enter some words', 'err'); return; }
    var words = wordsText.split(/[\n,]+/).map(function(w){ return w.trim().replace(/[^a-zA-Z]/g,''); }).filter(function(w){ return w.length >= 2; });
    if (words.length === 0) { notify('No valid words found', 'err'); return; }

    setGenerating(true);
    setTimeout(function() {
      try {
        var cfg = {
          rows: state.rows, cols: state.cols,
          words: words,
          shape: state.shape,
          allowDiag: ['medium','hard','expert'].indexOf(state.difficulty) >= 0,
          allowReverse: ['hard','expert'].indexOf(state.difficulty) >= 0,
          allowH: true, allowV: true,
          overlapMode: state.overlapMode,
          strategy: state.placementStrategy,
          priority: state.priority,
          fillerMode: state.fillerMode,
          fillerLetters: state.fillerLetters,
          letterCase: state.letterCase,
          seed: state.seed || undefined,
          maxAttempts: 500
        };

        if (state.directionPreset !== 'custom') {
          var dirs = MXD_WS_DIRECTIONS.getDirections(state.directionPreset);
          cfg.dirs = dirs;
        }

        var result = MXD_WS_PLACEMENT.generate(cfg);
        setPuzzle(result);
        notify('Puzzle generated! ' + result.placed + '/' + result.total + ' words placed (' + result.fillPercent + '% fill)', 'ok');
      } catch(e) {
        notify('Error: ' + e.message, 'err');
        console.error(e);
      }
      setGenerating(false);
    }, 50);
  };

  var reshuffle = function() {
    update('seed', Date.now().toString());
    setTimeout(function(){ generate(); }, 100);
  };

  var savePreset = function() {
    if (!presetName.trim()) { notify('Enter a preset name', 'err'); return; }
    var id = 'preset_' + Date.now();
    MXD_WS_PRESETS.save(id, Object.assign({}, state, { name: presetName }));
    setPresets(MXD_WS_PRESETS.getAll());
    setPresetName('');
    setShowPresetModal(false);
    notify('Preset "' + presetName + '" saved!', 'ok');
  };

  var loadPreset = function(id) {
    var p = MXD_WS_PRESETS.load(id);
    if (p) { setState(p); notify('Preset loaded', 'ok'); }
  };

  var deletePreset = function(id) {
    MXD_WS_PRESETS.delete(id);
    setPresets(MXD_WS_PRESETS.getAll());
    notify('Preset deleted', 'info');
  };

  React.useEffect(function() {
    setPresets(MXD_WS_PRESETS.getAll());
  }, []);

  var colors = state.customColors || WS_THEMES[state.theme] || WS_THEMES.classic;

  // ===== RENDER =====
  return React.createElement('div', { style: { display: 'flex', gap: '20px', padding: '20px', maxWidth: '1400px', margin: '0 auto' } },

    // ===== LEFT SIDEBAR: SETTINGS =====
    React.createElement('div', { style: { width: '380px', flexShrink: 0, maxHeight: '85vh', overflowY: 'auto' } },

      // Header
      React.createElement('div', { style: { marginBottom: '16px' } },
        React.createElement('h2', { style: { fontSize: '18px', fontWeight: '700', margin: '0 0 4px' } }, '🔍 Word Search Studio'),
        React.createElement('p', { style: { fontSize: '12px', color: '#64748b', margin: 0 } }, 'Professional puzzle generator — 30x upgraded')
      ),

      // Tab Switcher
      React.createElement('div', { style: { display: 'flex', gap: '4px', marginBottom: '12px', padding: '4px', background: '#f1f5f9', borderRadius: '8px' } },
        React.createElement('button', {
          onClick: function(){ setActiveTab('quick'); },
          style: Object.assign({ flex: 1, padding: '8px', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
            activeTab === 'quick' ? { background: '#fff', color: '#6366f1', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { background: 'transparent', color: '#64748b' })
        }, '⚡ Quick'),
        React.createElement('button', {
          onClick: function(){ setActiveTab('advanced'); },
          style: Object.assign({ flex: 1, padding: '8px', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
            activeTab === 'advanced' ? { background: '#fff', color: '#6366f1', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { background: 'transparent', color: '#64748b' })
        }, '🔧 Advanced'),
        React.createElement('button', {
          onClick: function(){ setActiveTab('presets'); },
          style: Object.assign({ flex: 1, padding: '8px', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' },
            activeTab === 'presets' ? { background: '#fff', color: '#6366f1', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { background: 'transparent', color: '#64748b' })
        }, '💾 Presets')
      ),

      // QUICK TAB
      activeTab === 'quick' && React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } },

        // Title
        React.createElement('div', null,
          React.createElement('label', { style: { fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' } }, 'Puzzle Title'),
          React.createElement('input', { type: 'text', value: state.title, onChange: function(e){ update('title', e.target.value); },
            style: { width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', outline: 'none' } })
        ),

        // Words
        React.createElement('div', null,
          React.createElement('label', { style: { fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' } }, 'Words (one per line or comma-separated)'),
          React.createElement('textarea', { value: state.words, onChange: function(e){ update('words', e.target.value); },
            rows: 6,
            style: { width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', resize: 'vertical', outline: 'none', lineHeight: '1.6' },
            placeholder: 'LION\nTIGER\nBEAR\nWOLF\nFOX' })
        ),

        // Difficulty + Grid Size row
        React.createElement('div', { style: { display: 'flex', gap: '8px' } },
          React.createElement('div', { style: { flex: 1 } },
            React.createElement('label', { style: { fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' } }, 'Difficulty'),
            React.createElement('select', { value: state.difficulty, onChange: function(e){ update('difficulty', e.target.value); },
              style: { width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', fontFamily: 'inherit', cursor: 'pointer' } },
              React.createElement('option', { value: 'easy' }, 'Easy'),
              React.createElement('option', { value: 'medium' }, 'Medium'),
              React.createElement('option', { value: 'hard' }, 'Hard'),
              React.createElement('option', { value: 'expert' }, 'Expert')
            )
          ),
          React.createElement('div', { style: { flex: 1 } },
            React.createElement('label', { style: { fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' } }, 'Grid Size'),
            React.createElement('select', { value: state.rows + 'x' + state.cols, onChange: function(e){ var parts = e.target.value.split('x'); update('rows', parseInt(parts[0])); update('cols', parseInt(parts[1])); },
              style: { width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', fontFamily: 'inherit', cursor: 'pointer' } },
              React.createElement('option', { value: '10x10' }, '10 × 10'),
              React.createElement('option', { value: '12x12' }, '12 × 12'),
              React.createElement('option', { value: '15x15' }, '15 × 15'),
              React.createElement('option', { value: '18x18' }, '18 × 18'),
              React.createElement('option', { value: '20x20' }, '20 × 20'),
              React.createElement('option', { value: '25x25' }, '25 × 25'),
              React.createElement('option', { value: '30x30' }, '30 × 30')
            )
          )
        ),

        // Shape
        React.createElement('div', null,
          React.createElement('label', { style: { fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' } }, 'Shape'),
          React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' } },
            SHAPES_LIST.map(function(s){
              return React.createElement('button', {
                key: s.id,
                onClick: function(){ update('shape', s.id); },
                title: s.name,
                style: Object.assign({ padding: '8px 4px', border: '1px solid #e2e8f0', borderRadius: '6px', background: state.shape === s.id ? '#eef2ff' : '#fff', color: state.shape === s.id ? '#6366f1' : '#475569', cursor: 'pointer', fontSize: '16px', textAlign: 'center' },
                  state.shape === s.id ? { borderColor: '#6366f1', boxShadow: '0 0 0 2px rgba(99,102,241,0.2)' } : {})
              }, s.icon);
            })
          )
        ),

        // Theme
        React.createElement('div', null,
          React.createElement('label', { style: { fontSize: '11px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' } }, 'Color Theme'),
          React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' } },
            Object.keys(WS_THEMES).map(function(id){
              var t = WS_THEMES[id];
              return React.createElement('button', {
                key: id,
                onClick: function(){ applyTheme(id); },
                title: t.name,
                style: Object.assign({ width: '100%', aspectRatio: '1', border: '2px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', background: 'linear-gradient(135deg, ' + t.gridBg + ' 50%, ' + t.gridLetter + ' 50%)' },
                  state.theme === id ? { borderColor: '#6366f1', boxShadow: '0 0 0 2px rgba(99,102,241,0.3)' } : {})
              });
            })
          )
        ),

        // Generate Button
        React.createElement('button', {
          onClick: generate,
          disabled: generating,
          style: {
            width: '100%', padding: '12px', border: 'none', borderRadius: '8px',
            background: generating ? '#94a3b8' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff', fontSize: '14px', fontWeight: '700', cursor: generating ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
            transition: 'all 0.2s'
          }
        }, generating ? '⏳ Generating...' : '🚀 Generate Puzzle'),

        // Reshuffle
        puzzle && React.createElement('button', {
          onClick: reshuffle,
          style: { width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', color: '#475569', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }
        }, '🔄 Reshuffle (New Layout)')
      ),

      // ADVANCED TAB
      activeTab === 'advanced' && React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },

        // Placement Strategy
        React.createElement('div', { style: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' } },
          React.createElement('div', { onClick: function(){ setExpandedSections(function(p){ return Object.assign({}, p, { placement: !p.placement }); }); }, style: { padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            React.createElement('span', { style: { fontSize: '12px', fontWeight: '600' } }, '🧩 Placement Strategy'),
            React.createElement('span', { style: { fontSize: '10px', color: '#94a3b8' } }, expandedSections.placement ? '▼' : '▶')
          ),
          expandedSections.placement && React.createElement('div', { style: { padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: '8px' } },
            React.createElement('div', null,
              React.createElement('label', { style: { fontSize: '10px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '3px' } }, 'Strategy'),
              React.createElement('select', { value: state.placementStrategy, onChange: function(e){ update('placementStrategy', e.target.value); }, style: { width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px', fontFamily: 'inherit' } },
                React.createElement('option', { value: 'compact' }, 'Compact (dense)'),
                React.createElement('option', { value: 'balanced' }, 'Balanced'),
                React.createElement('option', { value: 'spread' }, 'Spread (easy)')
              )
            ),
            React.createElement('div', null,
              React.createElement('label', { style: { fontSize: '10px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '3px' } }, 'Overlap Mode'),
              React.createElement('select', { value: state.overlapMode, onChange: function(e){ update('overlapMode', e.target.value); }, style: { width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px', fontFamily: 'inherit' } },
                React.createElement('option', { value: 'none' }, 'No Overlap'),
                React.createElement('option', { value: 'matchOnly' }, 'Match Letters Only'),
                React.createElement('option', { value: 'crossAllowed' }, 'Cross Allowed'),
                React.createElement('option', { value: 'maximizeCrossings' }, 'Maximize Crossings')
              )
            ),
            React.createElement('div', null,
              React.createElement('label', { style: { fontSize: '10px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '3px' } }, 'Placement Priority'),
              React.createElement('select', { value: state.priority, onChange: function(e){ update('priority', e.target.value); }, style: { width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px', fontFamily: 'inherit' } },
                React.createElement('option', { value: 'longestFirst' }, 'Longest First'),
                React.createElement('option', { value: 'shortestFirst' }, 'Shortest First'),
                React.createElement('option', { value: 'random' }, 'Random'),
                React.createElement('option', { value: 'smart' }, 'Smart Order')
              )
            )
          )
        ),

        // Filler Letters
        React.createElement('div', { style: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' } },
          React.createElement('div', { onClick: function(){ setExpandedSections(function(p){ return Object.assign({}, p, { filler: !p.filler }); }); }, style: { padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            React.createElement('span', { style: { fontSize: '12px', fontWeight: '600' } }, '🔤 Filler Letters'),
            React.createElement('span', { style: { fontSize: '10px', color: '#94a3b8' } }, expandedSections.filler ? '▼' : '▶')
          ),
          expandedSections.filler && React.createElement('div', { style: { padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: '8px' } },
            React.createElement('div', null,
              React.createElement('label', { style: { fontSize: '10px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '3px' } }, 'Filler Mode'),
              React.createElement('select', { value: state.fillerMode, onChange: function(e){ update('fillerMode', e.target.value); }, style: { width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px', fontFamily: 'inherit' } },
                React.createElement('option', { value: 'random' }, 'Random A-Z'),
                React.createElement('option', { value: 'frequency' }, 'English Frequency'),
                React.createElement('option', { value: 'wordlistOnly' }, 'Word List Only'),
                React.createElement('option', { value: 'custom' }, 'Custom Characters'),
                React.createElement('option', { value: 'silent' }, 'Blank Cells')
              )
            ),
            state.fillerMode === 'custom' && React.createElement('div', null,
              React.createElement('label', { style: { fontSize: '10px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '3px' } }, 'Custom Letters'),
              React.createElement('input', { type: 'text', value: state.fillerLetters, onChange: function(e){ update('fillerLetters', e.target.value); }, placeholder: 'ABCDE...', style: { width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px', fontFamily: 'inherit' } })
            )
          )
        ),

        // Typography
        React.createElement('div', { style: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' } },
          React.createElement('div', { onClick: function(){ setExpandedSections(function(p){ return Object.assign({}, p, { typo: !p.typo }); }); }, style: { padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            React.createElement('span', { style: { fontSize: '12px', fontWeight: '600' } }, '✏️ Typography'),
            React.createElement('span', { style: { fontSize: '10px', color: '#94a3b8' } }, expandedSections.typo ? '▼' : '▶')
          ),
          expandedSections.typo && React.createElement('div', { style: { padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: '8px' } },
            React.createElement('div', { style: { display: 'flex', gap: '8px' } },
              React.createElement('div', { style: { flex: 1 } },
                React.createElement('label', { style: { fontSize: '10px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '3px' } }, 'Grid Font'),
                React.createElement('select', { value: state.gridFont, onChange: function(e){ update('gridFont', e.target.value); }, style: { width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px', fontFamily: 'inherit' } },
                  MXD_WS_TYPOGRAPHY.fonts.map(function(f){ return React.createElement('option', { key: f.id, value: f.id }, f.label); })
                )
              ),
              React.createElement('div', { style: { flex: 1 } },
                React.createElement('label', { style: { fontSize: '10px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '3px' } }, 'Grid Size (pt)'),
                React.createElement('input', { type: 'number', value: state.gridFontSize, onChange: function(e){ update('gridFontSize', parseInt(e.target.value) || 14); }, min: 8, max: 48, style: { width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px', fontFamily: 'inherit' } })
              )
            ),
            React.createElement('div', { style: { display: 'flex', gap: '8px' } },
              React.createElement('div', { style: { flex: 1 } },
                React.createElement('label', { style: { fontSize: '10px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '3px' } }, 'Letter Case'),
                React.createElement('select', { value: state.letterCase, onChange: function(e){ update('letterCase', e.target.value); }, style: { width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px', fontFamily: 'inherit' } },
                  React.createElement('option', { value: 'upper' }, 'UPPERCASE'),
                  React.createElement('option', { value: 'lower' }, 'lowercase'),
                  React.createElement('option', { value: 'title' }, 'Title Case'),
                  React.createElement('option', { value: 'mixed' }, 'MiXeD')
                )
              ),
              React.createElement('div', { style: { flex: 1 } },
                React.createElement('label', { style: { fontSize: '10px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '3px' } }, 'Letter Style'),
                React.createElement('select', { value: state.letterStyle, onChange: function(e){ update('letterStyle', e.target.value); }, style: { width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px', fontFamily: 'inherit' } },
                  React.createElement('option', { value: 'normal' }, 'Normal'),
                  React.createElement('option', { value: 'bold' }, 'Bold'),
                  React.createElement('option', { value: 'outlined' }, 'Outlined'),
                  React.createElement('option', { value: 'shadow' }, 'Shadow'),
                  React.createElement('option', { value: 'chaotic' }, 'Chaotic')
                )
              )
            )
          )
        ),

        // Directions
        React.createElement('div', { style: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' } },
          React.createElement('div', { onClick: function(){ setExpandedSections(function(p){ return Object.assign({}, p, { dirs: !p.dirs }); }); }, style: { padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            React.createElement('span', { style: { fontSize: '12px', fontWeight: '600' } }, '🧭 Directions'),
            React.createElement('span', { style: { fontSize: '10px', color: '#94a3b8' } }, expandedSections.dirs ? '▼' : '▶')
          ),
          expandedSections.dirs && React.createElement('div', { style: { padding: '0 14px 12px' } },
            React.createElement('div', { style: { display: 'flex', gap: '4px', flexWrap: 'wrap' } },
              ['easy','medium','hard','expert'].map(function(p){
                return React.createElement('button', {
                  key: p,
                  onClick: function(){ update('directionPreset', p); },
                  style: Object.assign({ padding: '5px 10px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '10px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' },
                    state.directionPreset === p ? { background: '#6366f1', color: '#fff', borderColor: '#6366f1' } : { background: '#fff', color: '#475569' })
                }, p);
              })
            )
          )
        ),

        // Word List Tools
        React.createElement('div', { style: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' } },
          React.createElement('div', { onClick: function(){ setExpandedSections(function(p){ return Object.assign({}, p, { wl: !p.wl }); }); }, style: { padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            React.createElement('span', { style: { fontSize: '12px', fontWeight: '600' } }, '📝 Word List Tools'),
            React.createElement('span', { style: { fontSize: '10px', color: '#94a3b8' } }, expandedSections.wl ? '▼' : '▶')
          ),
          expandedSections.wl && React.createElement('div', { style: { padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: '6px' } },
            React.createElement('div', { style: { display: 'flex', gap: '4px', flexWrap: 'wrap' } },
              React.createElement('button', { onClick: function(){ var w = state.words.split(/[\n,]+/).map(function(s){return s.trim();}).filter(Boolean); update('words', MXD_WS_WORDLIST.tools.shuffle(w).join('\n')); }, style: { padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontFamily: 'inherit', background: '#fff' } }, '🔀 Shuffle'),
              React.createElement('button', { onClick: function(){ var w = state.words.split(/[\n,]+/).map(function(s){return s.trim();}).filter(Boolean); update('words', MXD_WS_WORDLIST.tools.sortAZ(w).join('\n')); }, style: { padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontFamily: 'inherit', background: '#fff' } }, '🔤 A-Z'),
              React.createElement('button', { onClick: function(){ var w = state.words.split(/[\n,]+/).map(function(s){return s.trim();}).filter(Boolean); update('words', MXD_WS_WORDLIST.tools.sortByLength(w).join('\n')); }, style: { padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontFamily: 'inherit', background: '#fff' } }, '📏 By Length'),
              React.createElement('button', { onClick: function(){ var w = state.words.split(/[\n,]+/).map(function(s){return s.trim();}).filter(Boolean); update('words', MXD_WS_WORDLIST.tools.removeDuplicates(w).join('\n')); }, style: { padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontFamily: 'inherit', background: '#fff' } }, '🗑️ Dedup')
            ),
            React.createElement('label', { style: { fontSize: '10px', fontWeight: '600', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' } },
              React.createElement('input', { type: 'checkbox', checked: state.missingVowels, onChange: function(e){ update('missingVowels', e.target.checked); } }),
              'Missing Vowel Mode (L_PH_NT → ELEPHANT)'
            )
          )
        ),

        // Grid Style
        React.createElement('div', { style: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' } },
          React.createElement('div', { onClick: function(){ setExpandedSections(function(p){ return Object.assign({}, p, { grid: !p.grid }); }); }, style: { padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            React.createElement('span', { style: { fontSize: '12px', fontWeight: '600' } }, '📐 Grid Style'),
            React.createElement('span', { style: { fontSize: '10px', color: '#94a3b8' } }, expandedSections.grid ? '▼' : '▶')
          ),
          expandedSections.grid && React.createElement('div', { style: { padding: '0 14px 12px' } },
            React.createElement('div', { style: { display: 'flex', gap: '4px', flexWrap: 'wrap' } },
              ['clean','gridLines','checkered','dotted','boldBorder'].map(function(s){
                return React.createElement('button', {
                  key: s,
                  onClick: function(){ update('gridStyle', s); },
                  style: Object.assign({ padding: '5px 10px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' },
                    state.gridStyle === s ? { background: '#6366f1', color: '#fff', borderColor: '#6366f1' } : { background: '#fff', color: '#475569' })
                }, s.replace(/([A-Z])/g, ' $1'));
              })
            )
          )
        ),

        // Seed
        React.createElement('div', { style: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' } },
          React.createElement('div', { onClick: function(){ setExpandedSections(function(p){ return Object.assign({}, p, { seed: !p.seed }); }); }, style: { padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            React.createElement('span', { style: { fontSize: '12px', fontWeight: '600' } }, '🎲 Seed (Reproducible)'),
            React.createElement('span', { style: { fontSize: '10px', color: '#94a3b8' } }, expandedSections.seed ? '▼' : '▶')
          ),
          expandedSections.seed && React.createElement('div', { style: { padding: '0 14px 12px' } },
            React.createElement('input', { type: 'text', value: state.seed, onChange: function(e){ update('seed', e.target.value); }, placeholder: 'Leave blank for random', style: { width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px', fontFamily: 'inherit' } })
          )
        )
      ),

      // PRESETS TAB
      activeTab === 'presets' && React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
        React.createElement('button', { onClick: function(){ setShowPresetModal(true); }, style: { width: '100%', padding: '10px', border: '2px dashed #6366f1', borderRadius: '8px', background: '#eef2ff', color: '#6366f1', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' } },
          '💾 Save Current Settings as Preset'
        ),
        Object.keys(presets).length === 0 && React.createElement('p', { style: { fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '20px' } }, 'No saved presets yet. Generate a puzzle and save your settings!'),
        Object.keys(presets).map(function(id){
          var p = presets[id];
          return React.createElement('div', { key: id, style: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
            React.createElement('div', null,
              React.createElement('div', { style: { fontSize: '12px', fontWeight: '600' } }, p.name || 'Untitled'),
              React.createElement('div', { style: { fontSize: '10px', color: '#94a3b8' } }, new Date(p.createdAt).toLocaleDateString())
            ),
            React.createElement('div', { style: { display: 'flex', gap: '4px' } },
              React.createElement('button', { onClick: function(){ loadPreset(id); }, style: { padding: '5px 10px', border: '1px solid #6366f1', borderRadius: '4px', background: '#6366f1', color: '#fff', fontSize: '10px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' } }, 'Load'),
              React.createElement('button', { onClick: function(){ deletePreset(id); }, style: { padding: '5px 10px', border: '1px solid #ef4444', borderRadius: '4px', background: '#fff', color: '#ef4444', fontSize: '10px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' } }, 'Delete')
            )
          );
        })
      )
    ),

    // ===== RIGHT: PUZZLE PREVIEW =====
    React.createElement('div', { style: { flex: 1, minWidth: 0 } },
      !puzzle && !generating && React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0' } },
        React.createElement('div', { style: { textAlign: 'center' } },
          React.createElement('div', { style: { fontSize: '48px', marginBottom: '12px' } }, '🔍'),
          React.createElement('h3', { style: { fontSize: '16px', fontWeight: '600', color: '#475569', margin: '0 0 8px' } }, 'Ready to Generate'),
          React.createElement('p', { style: { fontSize: '13px', color: '#94a3b8', margin: 0 } }, 'Enter words and click Generate to create your puzzle')
        )
      ),

      generating && React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', background: '#f8fafc', borderRadius: '12px' } },
        React.createElement('div', { style: { textAlign: 'center' } },
          React.createElement('div', { style: { fontSize: '32px', animation: 'spin 1s linear infinite', display: 'inline-block' } }, '⚙️'),
          React.createElement('p', { style: { fontSize: '14px', fontWeight: '600', color: '#475569', marginTop: '12px' } }, 'Generating puzzle...')
        )
      ),

      puzzle && React.createElement('div', null,
        // Stats bar
        React.createElement('div', { style: { display: 'flex', gap: '12px', marginBottom: '16px', padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' } },
          React.createElement('div', { style: { flex: 1, textAlign: 'center' } },
            React.createElement('div', { style: { fontSize: '20px', fontWeight: '700', color: '#6366f1' } }, puzzle.placed + '/' + puzzle.total),
            React.createElement('div', { style: { fontSize: '10px', color: '#94a3b8' } }, 'Words Placed')
          ),
          React.createElement('div', { style: { flex: 1, textAlign: 'center' } },
            React.createElement('div', { style: { fontSize: '20px', fontWeight: '700', color: '#22c55e' } }, puzzle.fillPercent + '%'),
            React.createElement('div', { style: { fontSize: '10px', color: '#94a3b8' } }, 'Fill Density')
          ),
          React.createElement('div', { style: { flex: 1, textAlign: 'center' } },
            React.createElement('div', { style: { fontSize: '20px', fontWeight: '700', color: '#f59e0b' } }, puzzle.rows + '×' + puzzle.cols),
            React.createElement('div', { style: { fontSize: '10px', color: '#94a3b8' } }, 'Grid Size')
          ),
          puzzle.skipped.length > 0 && React.createElement('div', { style: { flex: 1, textAlign: 'center' } },
            React.createElement('div', { style: { fontSize: '20px', fontWeight: '700', color: '#ef4444' } }, puzzle.skipped.length),
            React.createElement('div', { style: { fontSize: '10px', color: '#94a3b8' } }, 'Skipped')
          )
        ),

        // Puzzle Grid
        React.createElement('div', { style: { background: colors.gridBg, borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '16px', position: 'relative' } },
          state.showTitle && React.createElement('h3', { style: { textAlign: 'center', fontSize: state.titleFontSize + 'px', fontFamily: MXD_WS_TYPOGRAPHY.fonts.find(function(f){return f.id===state.titleFont;})?.family || 'Inter', fontWeight: '700', color: colors.titleColor, margin: '0 0 16px' } }, state.title),

          // Decorative SVG Overlay
          (state.decorations && state.decorations.length > 0 && window.MXD_VISUAL_THEMES) && React.createElement('svg', { style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: state.decorationOpacity || 0.15 }, viewBox: '0 0 1000 1000', preserveAspectRatio: 'none' },
            state.decorations.map(function(assetId, idx){
              var pathStr = window.MXD_VISUAL_THEMES.DECORATIVE_ASSETS[assetId];
              if (!pathStr) return null;
              return React.createElement('path', {
                key: assetId,
                d: pathStr,
                fill: colors.solutionHighlight || '#6366f1',
                transform: idx % 2 === 0 ? 'translate(0,0) scale(0.5)' : 'translate(500,500) scale(0.5)'
              });
            })
          ),

          // Grid
          React.createElement('div', { style: { display: 'inline-grid', gridTemplateColumns: 'repeat(' + puzzle.cols + ', ' + (state.gridFontSize * 1.4) + 'px)', gap: state.gridStyle === 'clean' ? '0' : '1px', background: state.gridStyle === 'gridLines' ? colors.gridLine : 'transparent', border: state.gridStyle === 'boldBorder' ? '3px solid ' + colors.gridLine : '1px solid ' + colors.gridLine, borderRadius: '4px', overflow: 'hidden', margin: '0 auto', position: 'relative', zIndex: 1 } },
            puzzle.grid.map(function(row, r){
              return row.map(function(cell, c){
                if (!puzzle.mask[r][c] || !cell) return React.createElement('div', { key: r+'-'+c, style: { width: state.gridFontSize*1.4, height: state.gridFontSize*1.4, background: colors.gridBg } });
                var bg = colors.gridBg;
                if (state.gridStyle === 'checkered' && (r+c)%2===1) bg = colors.gridLine;
                var font = MXD_WS_TYPOGRAPHY.fonts.find(function(f){return f.id===state.gridFont;});
                var style = {
                  width: state.gridFontSize*1.4, height: state.gridFontSize*1.4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: font ? font.family : 'Inter, sans-serif',
                  fontSize: state.gridFontSize + 'px',
                  fontWeight: state.letterStyle === 'bold' ? 'bold' : 'normal',
                  color: colors.gridLetter,
                  background: bg,
                  textShadow: state.letterStyle === 'shadow' ? '1px 1px 2px rgba(0,0,0,0.3)' : 'none',
                  WebkitTextStroke: state.letterStyle === 'outlined' ? '0.5px ' + colors.gridLetter : 'unset',
                  transform: state.letterStyle === 'chaotic' ? 'rotate(' + ((Math.random()-0.5)*6) + 'deg)' : 'none'
                };
                return React.createElement('div', { key: r+'-'+c, style: style }, cell);
              });
            })
          ),

          // Word List
          state.showWordList && Object.keys(puzzle.placements).length > 0 && React.createElement('div', { style: { marginTop: '20px', paddingTop: '16px', borderTop: '1px solid ' + colors.gridLine } },
            React.createElement('div', { style: { fontSize: '12px', fontWeight: '700', color: colors.wordListText, marginBottom: '8px', textAlign: 'center' } }, 'WORDS TO FIND'),
            React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(' + state.wordListColumns + ', 1fr)', gap: '4px' } },
              Object.keys(puzzle.placements).map(function(w){
                return React.createElement('div', { key: w, style: { padding: '4px 8px', background: colors.wordListBg, color: colors.wordListText, borderRadius: '4px', fontSize: '11px', fontWeight: '500', textAlign: 'center', fontFamily: MXD_WS_TYPOGRAPHY.fonts.find(function(f){return f.id===state.wordListFont;})?.family || 'Inter' } }, w);
              })
            )
          )
        ),

        // Export Buttons
        React.createElement('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
          React.createElement('button', { onClick: function(){ notify('PDF export — use the main Export panel', 'info'); }, style: { padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', color: '#475569', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' } }, '📄 Export PDF'),
          React.createElement('button', { onClick: function(){
            var svg = MXD_WS_EXPORT.toSVG(puzzle.grid, puzzle.mask, puzzle.placements, { cellSize: state.gridFontSize*1.4, colors: colors, gridFont: state.gridFont, gridFontSize: state.gridFontSize });
            var blob = new Blob([svg], { type: 'image/svg+xml' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a'); a.href = url; a.download = (state.title||'wordsearch')+'.svg'; a.click();
            URL.revokeObjectURL(url);
            notify('SVG exported!', 'ok');
          }, style: { padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', color: '#475569', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' } }, '🎨 Export SVG'),
          React.createElement('button', { onClick: function(){
            var json = MXD_WS_EXPORT.toJSON(puzzle);
            var blob = new Blob([json], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a'); a.href = url; a.download = (state.title||'wordsearch')+'.json'; a.click();
            URL.revokeObjectURL(url);
            notify('JSON exported!', 'ok');
          }, style: { padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', color: '#475569', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' } }, '📊 Export JSON')
        ),

        // Skipped words
        puzzle.skipped.length > 0 && React.createElement('div', { style: { marginTop: '12px', padding: '10px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' } },
          React.createElement('div', { style: { fontSize: '11px', fontWeight: '600', color: '#991b1b', marginBottom: '4px' } }, '⚠️ Words that couldn\'t fit:'),
          React.createElement('div', { style: { fontSize: '11px', color: '#991b1b' } }, puzzle.skipped.join(', '))
        )
      )
    ),

    // Preset Modal
    showPresetModal && React.createElement('div', { style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 } },
      React.createElement('div', { style: { background: '#fff', borderRadius: '12px', padding: '24px', width: '360px', maxWidth: '90vw' } },
        React.createElement('h3', { style: { margin: '0 0 16px', fontSize: '16px', fontWeight: '700' } }, 'Save Preset'),
        React.createElement('input', { type: 'text', value: presetName, onChange: function(e){ setPresetName(e.target.value); }, placeholder: 'Preset name...', autoFocus: true, style: { width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', marginBottom: '16px', outline: 'none' } }),
        React.createElement('div', { style: { display: 'flex', gap: '8px', justifyContent: 'flex-end' } },
          React.createElement('button', { onClick: function(){ setShowPresetModal(false); }, style: { padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', color: '#475569', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' } }, 'Cancel'),
          React.createElement('button', { onClick: savePreset, style: { padding: '8px 16px', border: 'none', borderRadius: '6px', background: '#6366f1', color: '#fff', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' } }, 'Save')
        )
      )
    ),

    // Notification
    notification && React.createElement('div', { style: { position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', background: notification.type === 'ok' ? '#059669' : notification.type === 'err' ? '#dc2626' : '#6366f1', color: '#fff' } },
      notification.msg
    )
  );
}

// ===== REGISTER IN GLOBAL REGISTRY =====
if (window.MXD && window.MXD.registerPanel) {
  window.MXD.registerPanel({
    id: 'wordsearch-v10',
    name: 'Word Search Pro',
    icon: '🔍',
    component: WordSearchPanel,
    priority: 1
  });
}

// Also expose globally
window.WordSearchPanel = WordSearchPanel;
window.WS_THEMES = WS_THEMES;

console.log('[MXD WS UI v10] Loaded — Two-tier settings, real-time preview, presets, export');
})();
