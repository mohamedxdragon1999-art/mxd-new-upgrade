/**
 * MXD v10 Integration Layer
 * Bridges new v10 modules with existing app architecture
 * Makes all new settings actually control generation
 */
(function(){
  'use strict';

  // ============================================================
  // Override WordSearchEngine.generate to use v10 placement engine
  // ============================================================
  var originalGenerate = window.WordSearchEngine ? window.WordSearchEngine.generate : null;
  var originalGenerateEnhanced = window.WordSearchEngine ? window.WordSearchEngine.generateEnhanced : null;

  if(window.WordSearchEngine && window.MXDPlacementEngine){
    window.WordSearchEngine.generateV10 = function(cfg){
      var engine = window.MXDPlacementEngine;
      var words = cfg.words || [];
      var rows = cfg.rows || 15;
      var cols = cfg.cols || 15;

      // Map old config to v10 config
      var v10cfg = {
        rows: rows,
        cols: cols,
        strategy: cfg.placement || 'balanced',
        overlap: cfg.overlapPolicy === 'none' ? 'none' : 'match',
        placeOrder: cfg.placeOrder || 'longest',
        maxRetries: cfg.maxRetries || 50,
        autoRetry: cfg.autoRetry !== false,
        autoSkip: cfg.autoSkip || false,
        seed: cfg.seed || Date.now(),
        fillerMode: cfg.fillerMode || 'random',
        customFiller: cfg.customFiller || null,
        allowH: cfg.allowH !== false,
        allowV: cfg.allowV !== false,
        allowLeft: cfg.allowLeft || false,
        allowUp: cfg.allowUp || false,
        allowDiag: cfg.allowDiag || false,
        allowDiagLeft: cfg.allowDiagLeft || false,
        allowDiagUp: cfg.allowDiagUp || false,
        allowDiagUpLeft: cfg.allowDiagUpLeft || false,
        allowReverse: cfg.allowReverse || false,
        letterCase: cfg.letterCase || 'upper'
      };

      // Apply difficulty presets if specified
      if(cfg.difficulty && window.MXD_DIFFICULTY_PRESETS){
        var diff = window.MXD_DIFFICULTY_PRESETS[cfg.difficulty];
        if(diff){
          if(!diff.allowDiag) v10cfg.allowDiag = false;
          if(!diff.allowReverse) v10cfg.allowReverse = false;
          if(diff.overlapPolicy === 'none') v10cfg.overlap = 'none';
        }
      }

      var result = engine.placeWords(words, v10cfg);

      // Convert v10 result to app format
      var grid = result.grid;
      var placements = {};
      for(var i=0;i<result.placed.length;i++){
        var pw = result.placed[i];
        placements[pw.word] = pw.cells.map(function(c){ return [c.row, c.col]; });
      }

      // Build mask from shape
      var mask = [];
      for(var r=0;r<rows;r++){
        mask[r] = [];
        for(var c=0;c<cols;c++){
          mask[r][c] = grid[r][c] !== null && grid[r][c] !== undefined;
        }
      }

      // Apply letter case
      if(cfg.letterCase === 'lower'){
        for(var r2=0;r2<rows;r2++){
          for(var c2=0;c2<cols;c2++){
            if(grid[r2][c2]) grid[r2][c2] = grid[r2][c2].toLowerCase();
          }
        }
      }

      return {
        grid: grid,
        mask: mask,
        placements: placements,
        words: words,
        stats: result.stats,
        skipped: result.skipped,
        success: result.placed.length > 0,
        type: 'wordsearch'
      };
    };

    // Use v10 engine by default if available
    var v10OriginalGenerate = window.WordSearchEngine.generate;
    window.WordSearchEngine.generate = function(cfg){
      // Check if v10 settings are active
      if(cfg.placement || cfg.overlap || cfg.placeOrder || cfg.fillerMode || cfg.strategy){
        try {
          return window.WordSearchEngine.generateV10(cfg);
        } catch(e){
          console.warn('v10 engine failed, falling back:', e);
          return v10OriginalGenerate ? v10OriginalGenerate.call(window.WordSearchEngine, cfg) : originalGenerate(cfg);
        }
      }
      return v10OriginalGenerate ? v10OriginalGenerate.call(window.WordSearchEngine, cfg) : originalGenerate(cfg);
    };
  }

  // ============================================================
  // Reshuffle & Optimize functions
  // ============================================================
  window.MXDReshuffle = {
    reshuffle: function(puzzle, cfg){
      if(!window.MXDPlacementEngine) return null;
      var words = Object.keys(puzzle.placements || {});
      if(words.length === 0) return null;

      var v10cfg = {
        rows: cfg.rows || puzzle.grid.length,
        cols: cfg.cols || puzzle.grid[0].length,
        strategy: cfg.placement || 'balanced',
        overlap: cfg.overlap || 'match',
        placeOrder: cfg.placeOrder || 'longest',
        maxRetries: 10,
        autoRetry: true,
        seed: Date.now(),
        fillerMode: cfg.fillerMode || 'random',
        allowH: cfg.allowH !== false,
        allowV: cfg.allowV !== false,
        allowDiag: cfg.allowDiag || false,
        allowReverse: cfg.allowReverse || false,
        letterCase: cfg.letterCase || 'upper'
      };

      var result = window.MXDPlacementEngine.reshuffle(words, v10cfg);

      var placements = {};
      for(var i=0;i<result.placed.length;i++){
        var pw = result.placed[i];
        placements[pw.word] = pw.cells.map(function(c){ return [c.row, c.col]; });
      }

      var mask = [];
      for(var r=0;r<result.rows;r++){
        mask[r] = [];
        for(var c=0;c<result.cols;c++){
          mask[r][c] = result.grid[r][c] !== null;
        }
      }

      return { grid: result.grid, mask: mask, placements: placements, stats: result.stats };
    },

    optimize: function(puzzle, cfg, attempts){
      if(!window.MXDPlacementEngine) return null;
      var words = Object.keys(puzzle.placements || {});
      if(words.length === 0) return null;

      var v10cfg = {
        rows: cfg.rows || puzzle.grid.length,
        cols: cfg.cols || puzzle.grid[0].length,
        strategy: cfg.placement || 'balanced',
        overlap: cfg.overlap || 'match',
        placeOrder: cfg.placeOrder || 'longest',
        maxRetries: 10,
        autoRetry: true,
        seed: Date.now(),
        fillerMode: cfg.fillerMode || 'random',
        allowH: cfg.allowH !== false,
        allowV: cfg.allowV !== false,
        allowDiag: cfg.allowDiag || false,
        allowReverse: cfg.allowReverse || false,
        letterCase: cfg.letterCase || 'upper'
      };

      var result = window.MXDPlacementEngine.optimize(words, v10cfg, attempts || 10);

      var placements = {};
      for(var i=0;i<result.placed.length;i++){
        var pw = result.placed[i];
        placements[pw.word] = pw.cells.map(function(c){ return [c.row, c.col]; });
      }

      var mask = [];
      for(var r=0;r<result.rows;r++){
        mask[r] = [];
        for(var c=0;c<result.cols;c++){
          mask[r][c] = result.grid[r][c] !== null;
        }
      }

      return { grid: result.grid, mask: mask, placements: placements, stats: result.stats };
    }
  };

  // ============================================================
  // Grid Quality Scorer integration
  // ============================================================
  window.MXDGridQuality = {
    score: function(puzzle){
      if(!window.MXDGridSystem) return {total:0, grade:'?'};
      return window.MXDGridSystem.calculateGridQuality(
        puzzle.grid,
        Object.keys(puzzle.placements || {}).map(function(w){
          return {word:w, cells:puzzle.placements[w]};
        }),
        Object.keys(puzzle.placements || {})
      );
    }
  };

  // ============================================================
  // Word List Intelligence integration
  // ============================================================
  window.MXDWordListTools = {
    shuffle: function(words){ return window.MXDWordListIntelligence.tools.shuffle(words); },
    sortAZ: function(words){ return window.MXDWordListIntelligence.tools.sortAZ(words); },
    sortZA: function(words){ return window.MXDWordListIntelligence.tools.sortZA(words); },
    sortByLength: function(words){ return window.MXDWordListIntelligence.tools.sortByLength(words); },
    removeDuplicates: function(words){ return window.MXDWordListIntelligence.tools.removeDuplicates(words); },
    filterByLength: function(words, min, max){ return window.MXDWordListIntelligence.tools.filterByLength(words, min, max); },
    applyBlocklist: function(words, blocklist){ return window.MXDWordListIntelligence.tools.applyBlocklist(words, blocklist); },
    pickRandom: function(words, count){ return window.MXDWordListIntelligence.countModes.random(words, count); },
    pickByDifficulty: function(words, count, difficulty){ return window.MXDWordListIntelligence.countModes.byDifficulty(words, count, difficulty); },
    generateDecoys: function(words, count){ return window.MXDWordListIntelligence.decoys.generateMultiple(words, count || 5); },
    selectBonus: function(words, count){ return window.MXDWordListIntelligence.bonus.select(words, count || 3); },
    removeVowels: function(words){ return window.MXDWordListIntelligence.missingVowel.processList(words); },
    getStats: function(words){ return window.MXDWordListIntelligence.getStats(words); }
  };

  // ============================================================
  // Preset System integration
  // ============================================================
  window.MXDPresets = {
    init: function(){
      if(window.MXDPresetSystem) window.MXDPresetSystem.manager.init();
    },
    save: function(id, name, config, category, description){
      if(!window.MXDPresetSystem) return null;
      return window.MXDPresetSystem.manager.save(id, name, config, category, description);
    },
    load: function(id){
      if(!window.MXDPresetSystem) return null;
      return window.MXDPresetSystem.manager.load(id);
    },
    delete: function(id){
      if(!window.MXDPresetSystem) return false;
      return window.MXDPresetSystem.manager.delete(id);
    },
    getAll: function(){
      if(!window.MXDPresetSystem) return [];
      return window.MXDPresetSystem.manager.getAll();
    },
    getByCategory: function(category){
      if(!window.MXDPresetSystem) return [];
      return window.MXDPresetSystem.manager.getByCategory(category);
    },
    exportJSON: function(){
      if(!window.MXDPresetSystem) return '{}';
      return window.MXDPresetSystem.manager.exportJSON();
    },
    importJSON: function(json){
      if(!window.MXDPresetSystem) return false;
      return window.MXDPresetSystem.manager.importJSON(json);
    }
  };

  // ============================================================
  // Offline Mode integration
  // ============================================================
  window.MXDOffline = {
    init: function(){
      if(window.MXDOfflineMode){
        window.MXDOfflineMode.db.init();
        window.MXDOfflineMode.connectivity.init({
          heartbeatIntervalMs: 30000,
          maxHeartbeatFailures: 3
        });
        window.MXDOfflineMode.db.get('settings', 'lastConfig').then(function(saved){
          if(saved) return saved;
          return null;
        });
      }
    },
    saveConfig: function(cfg){
      if(!window.MXDOfflineMode) return;
      window.MXDOfflineMode.db.put('settings', {key:'lastConfig', data:cfg, updatedAt:Date.now()});
    },
    loadConfig: function(){
      if(!window.MXDOfflineMode) return null;
      return window.MXDOfflineMode.db.get('settings', 'lastConfig').then(function(item){
        return item ? item.data : null;
      });
    },
    savePuzzle: function(puzzle){
      if(!window.MXDOfflineMode) return;
      window.MXDOfflineMode.db.put('puzzles', {
        id: 'puzzle-' + Date.now(),
        data: puzzle,
        createdAt: Date.now()
      });
    },
    saveProgress: function(puzzleId, progress){
      if(!window.MXDOfflineMode) return;
      window.MXDOfflineMode.db.put('progress', {
        puzzleId: puzzleId,
        data: progress,
        updatedAt: Date.now()
      });
    },
    loadProgress: function(puzzleId){
      if(!window.MXDOfflineMode) return null;
      return window.MXDOfflineMode.db.get('progress', puzzleId).then(function(item){
        return item ? item.data : null;
      });
    },
    isOnline: function(){
      return window.MXDOfflineMode ? window.MXDOfflineMode.isOnline() : navigator.onLine;
    }
  };

  // ============================================================
  // Security integration
  // ============================================================
  window.MXDSecurityLayer = {
    init: function(){
      if(window.MXDSecurity){
        window.MXDSecurity.csp.apply();
        window.MXDSecurity.csrf.generateToken();
      }
    },
    sanitize: function(text){
      if(!window.MXDSecurity) return text;
      return window.MXDSecurity.sanitizer.sanitizeText(text);
    },
    sanitizeTitle: function(title){
      if(!window.MXDSecurity) return title;
      return window.MXDSecurity.sanitizer.sanitizeTitle(title);
    },
    sanitizeWords: function(text){
      if(!window.MXDSecurity) return text;
      return window.MXDSecurity.sanitizer.sanitizeWords(text);
    }
  };

  // ============================================================
  // Reliability integration
  // ============================================================
  window.MXDReliabilityLayer = {
    init: function(){
      if(window.MXDReliability){
        window.MXDReliability.circuitBreaker.create('engine', {threshold:5, timeout:30000});
        window.MXDReliability.circuitBreaker.create('export', {threshold:3, timeout:60000});
        window.MXDReliability.rateLimiter.create('generate', {maxRequests:100, windowMs:60000});
        window.MXDReliability.deadLetterQueue.load();
      }
    },
    safeGenerate: function(fn){
      if(!window.MXDReliability) return fn();
      return window.MXDReliability.fallback.execute(
        fn,
        function(){ return {grid:[], mask:[], placements:{}, success:false, error:'Generation failed, using fallback'}; },
        function(err){
          window.MXDReliability.deadLetterQueue.add('generate', err, {});
        }
      );
    },
    withTimeout: function(promise, ms){
      if(!window.MXDReliability) return promise;
      return window.MXDReliability.timeout.execute(promise, ms || 30000, 'Operation timed out');
    },
    withRetry: function(fn, options){
      if(!window.MXDReliability) return fn();
      return window.MXDReliability.retry.execute(fn, options || {maxRetries:3});
    }
  };

  // ============================================================
  // Initialize all v10 modules
  // ============================================================
  function initV10(){
    if(window.MXDPresets) window.MXDPresets.init();
    if(window.MXDOffline) window.MXDOffline.init();
    if(window.MXDSecurityLayer) window.MXDSecurityLayer.init();
    if(window.MXDReliabilityLayer) window.MXDReliabilityLayer.init();
    console.log('[MXD v10] All modules initialized');
  }

  // Auto-init when DOM ready
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', initV10);
  } else {
    initV10();
  }

  // Expose init for manual call
  window.MXDV10Init = initV10;

})();
