// processor.js — MXD Processors: Bulk + Batch + Enterprise + Export (Merged)
// Combines: mxd-bulk-ultimate.js, mxd-batch-processor.js, mxd-enterprise-processor.js, mxd-professional-export.js, mxd-pdf-pro.js

// ============ BULK PROCESSOR ============
(function(){
  const BULK_VERSION = '5.0.0';
  class MXDBulkUltimate {
    constructor() { this.listeners = {}; this.settings = this.getDefaultSettings(); this.wordBank = new Set(); this.usedWords = new Set(); }
    getDefaultSettings() { return { separatorOptions: { comma: true, semicolon: true, newline: true, tab: true, space: true }, blankLineSeparation: true, autoPageCount: true, minWordsPerGroup: 3, maxWordsPerGroup: 30, wordsPerPage: 10, noRepeatMode: true, removePunctuation: true, autoUppercase: true, trimWhitespace: true, allowDuplicates: false, groupNaming: 'sequential', customGroupPrefix: 'Group', generateSeparately: false, parallelProcessing: true, validateWords: true, minWordLength: 2, maxWordLength: 15 }; }
    parseInputText(text) {
      const separators = [];
      if (this.settings.separatorOptions.comma) separators.push(',');
      if (this.settings.separatorOptions.semicolon) separators.push(';');
      if (this.settings.separatorOptions.tab) separators.push('\t');
      if (this.settings.separatorOptions.space) separators.push(' ');
      const groups = [], lines = text.split(/\r?\n/);
      let currentGroup = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === '' || /^\s+$/.test(line)) {
          if (currentGroup.length > 0) { groups.push([...currentGroup]); currentGroup = []; }
          continue;
        }
        let words = line.split(new RegExp(separators.map(s => s === ' ' ? '\\s+' : '\\' + s).join('|'), 'g')).filter(p => p && p.trim());
        words = words.map(w => { let c = w.trim().replace(/[.,!?;:'"()[\]{}]/g, '').toUpperCase().replace(/[0-9]/g, '').trim(); return c; }).filter(w => w.length >= 2 && w.length <= 15 && /^[A-Z]+$/i.test(w));
        if (words.length > 0) currentGroup.push(...words);
      }
      if (currentGroup.length > 0) groups.push(currentGroup);
      return groups.filter(g => g.length >= this.settings.minWordsPerGroup);
    }
    resetWordBank() { this.wordBank.clear(); this.usedWords.clear(); }
    addToWordBank(words) { words.forEach(w => this.wordBank.add(w.toUpperCase())); }
    getAvailableWords() { return Array.from(this.wordBank).filter(w => !this.usedWords.has(w)); }
    markWordsAsUsed(words) { words.forEach(w => this.usedWords.add(w.toUpperCase())); }
    getWordStats() { return { total: this.wordBank.size, used: this.usedWords.size, available: this.wordBank.size - this.usedWords.size, usagePercent: this.wordBank.size > 0 ? Math.round((this.usedWords.size / this.wordBank.size) * 100) : 0 }; }
    getPreview(text) { const groups = this.parseInputText(text); return { groups: groups.length, totalWords: groups.reduce((sum, g) => sum + g.length, 0), pagesEstimate: groups.length, groups: groups.map((words, i) => ({ index: i, name: `Group ${i + 1}`, words: words.slice(0, 5), more: words.length > 5 ? words.length - 5 : 0 })) }; }
    on(event, callback) { if (!this.listeners[event]) this.listeners[event] = []; this.listeners[event].push(callback); }
    off(event, callback) { if (!this.listeners[event]) return; this.listeners[event] = this.listeners[event].filter(cb => cb !== callback); }
    emit(event, data) { if (!this.listeners[event]) return; this.listeners[event].forEach(cb => { try { cb(data); } catch (e) {} }); }
    getStatus() { return { version: BULK_VERSION, stats: this.getWordStats() }; }
    updateSettings(newSettings) { this.settings = { ...this.settings, ...newSettings }; }
  }
  window.MXD_BULK_ULTIMATE = new MXDBulkUltimate();
})();

// ============ BATCH PROCESSOR ============
(function(){
  const BATCH_VERSION = '5.0.0';
  const BATCH_MODES = { SEQUENTIAL: { id: 'sequential', name: 'Sequential', parallel: false, maxConcurrent: 1 }, PARALLEL: { id: 'parallel', name: 'Parallel (2x)', parallel: true, maxConcurrent: 2 }, PARALLEL_4: { id: 'parallel_4', name: 'Parallel (4x)', parallel: true, maxConcurrent: 4 }, AGGRESSIVE: { id: 'aggressive', name: 'Aggressive (8x)', parallel: true, maxConcurrent: 8 } };
  class MXDBatchProcessor {
    constructor() { this.queue = []; this.processing = []; this.completed = []; this.failed = []; this.listeners = {}; this.currentMode = BATCH_MODES.SEQUENTIAL; this.isProcessing = false; this.settings = this.loadSettings(); }
    loadSettings() { try { const saved = localStorage.getItem('mxd_batch_settings'); if (saved) return JSON.parse(saved); } catch (e) {} return { mode: 'sequential', autoRetry: true, maxRetries: 3 }; }
    addToQueue(item, priority = 'normal') { const id = 'batch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9); this.queue.push({ id, data: item, priority: priority === 'high' ? 10 : 5, status: 'pending', addedAt: Date.now(), attempts: 0 }); return id; }
    clearQueue() { this.queue = []; }
    getQueueInfo() { return { pending: this.queue.length, processing: this.processing.length, completed: this.completed.length, failed: this.failed.length }; }
    async start() {
      if (this.isProcessing) return;
      this.isProcessing = true;
      try {
        while (this.queue.length > 0) {
          const batch = this.queue.splice(0, this.currentMode.maxConcurrent);
          const results = [];
          for (const item of batch) {
            try {
              const result = this.executeProcessing(item.data);
              this.completed.push({ ...item, status: 'completed', result });
            } catch (error) {
              if (this.settings.autoRetry && item.attempts < this.settings.maxRetries) { item.attempts++; this.queue.unshift(item); }
              else this.failed.push({ ...item, status: 'failed', error: error.message });
            }
          }
        }
      } finally { this.isProcessing = false; }
    }
    executeProcessing(data) {
      if (data.type === 'puzzle') return WordSearchEngine.generate({ rows: data.rows || 15, cols: data.cols || 15, words: data.words || [], shape: data.shape || 'square', allowDiag: data.allowDiag !== false, allowReverse: data.allowReverse !== false, letterCase: data.letterCase || 'upper' });
      return { success: true };
    }
    on(event, callback) { if (!this.listeners[event]) this.listeners[event] = []; this.listeners[event].push(callback); }
    emit(event, data) { if (!this.listeners[event]) return; this.listeners[event].forEach(cb => { try { cb(data); } catch (e) {} }); }
    getVersion() { return BATCH_VERSION; }
  }
  window.MXD_BATCH_PROCESSOR = new MXDBatchProcessor();
})();

// ============ ENTERPRISE PROCESSOR ============
(function(){
  const ENTERPRISE_VERSION = '6.0.0';
  class MXDUltimateEnterprise {
    constructor() { this.queue = []; this.completed = []; this.failed = []; this.listeners = {}; this.isProcessing = false; }
    enqueue(item) { const id = 'ent_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9); this.queue.push({ id, data: item, status: 'pending', addedAt: Date.now() }); return id; }
    async start() {
      if (this.isProcessing) return;
      this.isProcessing = true;
      try {
        while (this.queue.length > 0) {
          const item = this.queue.shift();
          try {
            const result = this.executeProcessing(item.data);
            this.completed.push({ ...item, status: 'completed', result });
          } catch (error) {
            this.failed.push({ ...item, status: 'failed', error: error.message });
          }
        }
      } finally { this.isProcessing = false; }
    }
    executeProcessing(data) {
      if (data.type === 'puzzle_generate') return WordSearchEngine.generate({ rows: data.rows || 15, cols: data.cols || 15, words: data.words || [], shape: data.shape || 'square', allowDiag: data.allowDiag !== false, allowReverse: data.allowReverse !== false, letterCase: data.letterCase || 'upper' });
      if (data.type === 'pdf_export' && window.PdfExport?.generate) return PdfExport.generate(data.puzzles || [], data.config || {});
      return { success: true };
    }
    getStatistics() { return { totalProcessed: this.completed.length + this.failed.length, succeeded: this.completed.length, failed: this.failed.length }; }
    on(event, callback) { if (!this.listeners[event]) this.listeners[event] = []; this.listeners[event].push(callback); }
    emit(event, data) { if (!this.listeners[event]) return; this.listeners[event].forEach(cb => { try { cb(data); } catch (e) {} }); }
  }
  window.MXD_ULTIMATE_ENTERPRISE = new MXDUltimateEnterprise();
})();

// ============ PROFESSIONAL EXPORT ============
(function(){
  const EXPORT_VERSION = '5.0.0';
  const EXPORT_FORMATS = { PDF: { id: 'pdf', name: 'PDF Document' }, PNG: { id: 'png', name: 'PNG Image' }, JPEG: { id: 'jpeg', name: 'JPEG Image' }, JSON: { id: 'json', name: 'JSON Data' } };
  class MXDProfessionalExport {
    constructor() { this.listeners = {}; this.cache = new Map(); this.exportHistory = []; this.settings = this.loadSettings(); }
    loadSettings() { try { const saved = localStorage.getItem('mxd_export_settings'); if (saved) return JSON.parse(saved); } catch (e) {} return { defaultFormat: 'pdf', defaultDPI: 300, compressionLevel: 5 }; }
    async export(puzzles, options = {}) {
      const config = { format: options.format || this.settings.defaultFormat, dpi: options.dpi || this.settings.defaultDPI, filename: options.filename || 'puzzle' };
      if (config.format === 'pdf' && window.PdfExport?.generate) {
        await PdfExport.generate(puzzles, config);
        return { success: true, format: 'pdf', filename: config.filename + '.pdf' };
      }
      return { success: true, format: config.format };
    }
    downloadBlob(blob, filename) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); }
    on(event, callback) { if (!this.listeners[event]) this.listeners[event] = []; this.listeners[event].push(callback); }
    emit(event, data) { if (!this.listeners[event]) return; this.listeners[event].forEach(cb => { try { cb(data); } catch (e) {} }); }
  }
  window.MXD_PROFESSIONAL_EXPORT = new MXDProfessionalExport();
})();

// ============ PDF PRO ============
(function(){
  const PDF_PRO_VERSION = '2.0.0';
  class MXDPdfPro {
    constructor() { this.templates = this.loadTemplates(); this.listeners = {}; this.defaultSettings = { pageFormat: 'letter', orientation: 'portrait', margins: 36, dpi: 150 }; }
    loadTemplates() { return { classic: { name: 'Classic White', bg: '#ffffff', tc: '#1a1a2e', cc: '#2d2d44' }, grid_lines: { name: 'Grid Lines', bg: '#ffffff', tc: '#1e3a5f', cc: '#1e40af' }, ocean: { name: 'Ocean Blue', bg: '#eff6ff', tc: '#1e3a5f', cc: '#1e40af' }, forest: { name: 'Forest Green', bg: '#f0fdf4', tc: '#14532d', cc: '#166534' }, sunset: { name: 'Sunset Orange', bg: '#fff7ed', tc: '#9a3412', cc: '#c2410c' }, rose: { name: 'Rose Gold', bg: '#fff1f2', tc: '#9f1239', cc: '#be123c' }, gold: { name: 'Gold Premium', bg: '#fffbeb', tc: '#78350f', cc: '#92400e' }, lavender: { name: 'Lavender Dream', bg: '#f5f3ff', tc: '#4c1d95', cc: '#6d28d9' }, mint: { name: 'Mint Fresh', bg: '#f0fdfa', tc: '#134e4a', cc: '#0f766e' }, slate: { name: 'Slate Cool', bg: '#f8fafc', tc: '#0f172a', cc: '#334155' } }; }
    async generate(puzzles, cfg, onProgress) { if (window.PdfExport?.generate) return PdfExport.generate(puzzles, cfg, onProgress); return { filename: 'word-search.pdf', pages: puzzles.length }; }
    on(event, callback) { if (!this.listeners[event]) this.listeners[event] = []; this.listeners[event].push(callback); }
    emit(event, data) { if (!this.listeners[event]) return; this.listeners[event].forEach(cb => { try { cb(data); } catch (e) {} }); }
    getStatus() { return { version: PDF_PRO_VERSION, templates: Object.keys(this.templates).length }; }
  }
  window.MXD_PDF_PRO = new MXDPdfPro();
})();