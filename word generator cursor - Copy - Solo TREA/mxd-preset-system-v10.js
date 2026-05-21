/**
 * MXD Preset System v10.0
 * 
 * Save, load, and manage puzzle configurations:
 * - Save full configuration as named preset
 * - Load preset with one click
 * - Preset categories (Easy, Medium, Hard, KDP, Custom)
 * - Import/Export presets as JSON
 * - Preset sharing via URL
 * - Default presets included
 * - Real-time preview of changes
 * 
 * @module MXDPresetSystem
 * @version 10.0.0
 */
(function(){
  'use strict';

  /**
   * Default Presets
   */
  var DEFAULT_PRESETS = {
    'quick-easy': {
      id: 'quick-easy',
      name: 'Quick & Easy',
      category: 'Easy',
      description: 'Simple puzzle for beginners',
      config: {
        rows: 10, cols: 10,
        difficulty: 'easy',
        strategy: 'balanced',
        overlap: 'match',
        placeOrder: 'longest',
        allowH: true, allowV: true,
        allowDiag: false, allowReverse: false,
        fillerMode: 'random',
        visualStyle: 'clean',
        cellShape: 'square',
        letterMode: 'random',
        cellSize: 30,
        fontSize: 18,
        fontFamily: 'Arial',
        showWordList: true,
        wordsPerGrid: 10
      },
      createdAt: Date.now()
    },
    'standard-medium': {
      id: 'standard-medium',
      name: 'Standard Medium',
      category: 'Medium',
      description: 'Balanced difficulty with diagonals',
      config: {
        rows: 15, cols: 15,
        difficulty: 'medium',
        strategy: 'balanced',
        overlap: 'match',
        placeOrder: 'longest',
        allowH: true, allowV: true,
        allowDiag: true, allowReverse: false,
        fillerMode: 'frequency',
        visualStyle: 'gridLines',
        cellShape: 'square',
        letterMode: 'frequency',
        cellSize: 28,
        fontSize: 16,
        fontFamily: 'Arial',
        showWordList: true,
        wordsPerGrid: 15
      },
      createdAt: Date.now()
    },
    'expert-challenge': {
      id: 'expert-challenge',
      name: 'Expert Challenge',
      category: 'Hard',
      description: 'All directions, maximize crossings',
      config: {
        rows: 20, cols: 20,
        difficulty: 'expert',
        strategy: 'compact',
        overlap: 'maximize',
        placeOrder: 'smart',
        allowH: true, allowV: true,
        allowDiag: true, allowReverse: true,
        allowLeft: true, allowUp: true,
        allowDiagLeft: true, allowDiagUp: true, allowDiagUpLeft: true,
        fillerMode: 'wordlist',
        visualStyle: 'checkered',
        cellShape: 'rounded',
        letterMode: 'frequency',
        cellSize: 24,
        fontSize: 14,
        fontFamily: 'Georgia',
        showWordList: true,
        wordsPerGrid: 25
      },
      createdAt: Date.now()
    },
    'kdp-print': {
      id: 'kdp-print',
      name: 'KDP Print Ready',
      category: 'KDP',
      description: 'Optimized for KDP 8.5x11 printing',
      config: {
        rows: 20, cols: 20,
        difficulty: 'medium',
        strategy: 'balanced',
        overlap: 'match',
        placeOrder: 'longest',
        allowH: true, allowV: true,
        allowDiag: true, allowReverse: false,
        fillerMode: 'frequency',
        visualStyle: 'clean',
        cellShape: 'square',
        letterMode: 'frequency',
        cellSize: 24,
        fontSize: 16,
        fontFamily: 'Arial',
        showWordList: true,
        wordsPerGrid: 20,
        trimSize: '8.5x11',
        bleed: true,
        showPageNum: true,
        includeSolutions: true
      },
      createdAt: Date.now()
    },
    'large-print': {
      id: 'large-print',
      name: 'Large Print',
      category: 'Easy',
      description: 'Large text for seniors',
      config: {
        rows: 12, cols: 12,
        difficulty: 'easy',
        strategy: 'spread',
        overlap: 'none',
        placeOrder: 'longest',
        allowH: true, allowV: true,
        allowDiag: false, allowReverse: false,
        fillerMode: 'random',
        visualStyle: 'boldBorder',
        cellShape: 'square',
        letterMode: 'random',
        cellSize: 40,
        fontSize: 28,
        fontFamily: 'Arial',
        showWordList: true,
        wordsPerGrid: 8,
        wordFontSize: 16
      },
      createdAt: Date.now()
    },
    'compact-dense': {
      id: 'compact-dense',
      name: 'Compact Dense',
      category: 'Hard',
      description: 'Maximum word density, many crossings',
      config: {
        rows: 25, cols: 25,
        difficulty: 'hard',
        strategy: 'compact',
        overlap: 'maximize',
        placeOrder: 'smart',
        allowH: true, allowV: true,
        allowDiag: true, allowReverse: true,
        fillerMode: 'wordlist',
        visualStyle: 'clean',
        cellShape: 'square',
        letterMode: 'frequency',
        cellSize: 20,
        fontSize: 12,
        fontFamily: 'Courier New',
        showWordList: true,
        wordsPerGrid: 40
      },
      createdAt: Date.now()
    }
  };

  /**
   * Preset Manager
   */
  var PresetManager = {
    _presets: {},
    _listeners: [],

    /**
     * Initialize presets
     */
    init: function(){
      // Load from localStorage
      try {
        var saved = localStorage.getItem('mxd-presets');
        if(saved){
          this._presets = JSON.parse(saved);
        }
      } catch(e){}

      // Merge with defaults (don't overwrite user presets)
      Object.keys(DEFAULT_PRESETS).forEach(function(key){
        if(!this._presets[key]){
          this._presets[key] = DEFAULT_PRESETS[key];
        }
      }.bind(this));

      this._save();
    },

    /**
     * Save a preset
     */
    save: function(id, name, config, category, description){
      var preset = {
        id: id || 'preset-' + Date.now(),
        name: name || 'Untitled Preset',
        config: JSON.parse(JSON.stringify(config)),
        category: category || 'Custom',
        description: description || '',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // If updating existing, preserve createdAt
      if(this._presets[id]){
        preset.createdAt = this._presets[id].createdAt;
      }

      this._presets[id] = preset;
      this._save();
      this._notify('save', preset);
      return preset;
    },

    /**
     * Load a preset
     */
    load: function(id){
      var preset = this._presets[id];
      if(!preset) return null;
      this._notify('load', preset);
      return JSON.parse(JSON.stringify(preset.config));
    },

    /**
     * Delete a preset
     */
    delete: function(id){
      // Don't allow deleting default presets
      if(DEFAULT_PRESETS[id]) return false;

      delete this._presets[id];
      this._save();
      this._notify('delete', {id: id});
      return true;
    },

    /**
     * Get all presets
     */
    getAll: function(){
      return Object.keys(this._presets).map(function(key){
        return this._presets[key];
      }.bind(this));
    },

    /**
     * Get presets by category
     */
    getByCategory: function(category){
      return this.getAll().filter(function(p){
        return p.category === category;
      });
    },

    /**
     * Get all categories
     */
    getCategories: function(){
      var cats = {};
      this.getAll().forEach(function(p){
        cats[p.category] = (cats[p.category] || 0) + 1;
      });
      return Object.keys(cats).map(function(name){
        return {name: name, count: cats[name]};
      });
    },

    /**
     * Export presets as JSON
     */
    exportJSON: function(){
      return JSON.stringify(this._presets, null, 2);
    },

    /**
     * Import presets from JSON
     */
    importJSON: function(json){
      try {
        var imported = JSON.parse(json);
        Object.keys(imported).forEach(function(key){
          if(!this._presets[key]){
            this._presets[key] = imported[key];
          }
        }.bind(this));
        this._save();
        this._notify('import', {count: Object.keys(imported).length});
        return true;
      } catch(e){
        return false;
      }
    },

    /**
     * Export preset as shareable URL
     */
    exportURL: function(id){
      var preset = this._presets[id];
      if(!preset) return '';

      var configStr = JSON.stringify(preset.config);
      var encoded = btoa(encodeURIComponent(configStr));
      return window.location.origin + window.location.pathname + '?preset=' + encoded;
    },

    /**
     * Load preset from URL
     */
    loadFromURL: function(){
      var params = new URLSearchParams(window.location.search);
      var presetData = params.get('preset');
      if(!presetData) return null;

      try {
        var decoded = decodeURIComponent(atob(presetData));
        return JSON.parse(decoded);
      } catch(e){
        return null;
      }
    },

    /**
     * Register change listener
     */
    onChange: function(callback){
      this._listeners.push(callback);
    },

    /**
     * Notify listeners
     */
    _notify: function(event, data){
      for(var i=0;i<this._listeners.length;i++){
        try { this._listeners[i](event, data); } catch(e){}
      }
    },

    /**
     * Save to localStorage
     */
    _save: function(){
      try {
        localStorage.setItem('mxd-presets', JSON.stringify(this._presets));
      } catch(e){}
    }
  };

  /**
   * Real-time Preview Engine
   * Updates preview instantly when settings change
   */
  var RealtimePreview = {
    _previewElement: null,
    _debounceTimer: null,
    _lastConfig: null,

    /**
     * Initialize preview
     */
    init: function(elementId){
      this._previewElement = document.getElementById(elementId);
    },

    /**
     * Update preview with debouncing
     */
    update: function(config, renderFn){
      var self = this;

      // Clear previous debounce
      if(this._debounceTimer){
        clearTimeout(this._debounceTimer);
      }

      // Check if config changed
      var configStr = JSON.stringify(config);
      if(configStr === this._lastConfig) return;
      this._lastConfig = configStr;

      // Debounce to avoid excessive rendering
      this._debounceTimer = setTimeout(function(){
        if(!self._previewElement || !renderFn) return;

        try {
          renderFn(self._previewElement, config);
        } catch(e){
          console.warn('Preview render error:', e);
        }
      }, 150);
    },

    /**
     * Force immediate update (no debounce)
     */
    updateNow: function(config, renderFn){
      if(this._debounceTimer){
        clearTimeout(this._debounceTimer);
        this._debounceTimer = null;
      }

      if(!this._previewElement || !renderFn) return;

      try {
        renderFn(this._previewElement, config);
      } catch(e){
        console.warn('Preview render error:', e);
      }
    }
  };

  /**
   * Export
   */
  window.MXDPresetSystem = {
    version: '10.0.0',
    manager: PresetManager,
    preview: RealtimePreview,
    DEFAULT_PRESETS: DEFAULT_PRESETS
  };

})();
