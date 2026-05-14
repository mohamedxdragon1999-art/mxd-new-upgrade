// mxd-quality-modes-vortex.js — Ultimate Quality Modes (30x Enhanced)
// 5 quality tiers, adaptive settings, print-ready optimization
(function(){
  'use strict';

  const VERSION = '30.0.0';

  const QUALITY_MODES = {
    DRAFT: {
      id: 'draft',
      name: 'Draft',
      description: 'Fast preview, low resource usage',
      dpi: 72,
      antialiasing: false,
      compression: 0.3,
      colorDepth: 8,
      cacheEnabled: true,
      asyncRendering: false,
      smoothingLevel: 0,
      fontHinting: 'none',
      alphaBlending: false,
      quality: 0.3,
      useCase: 'Quick preview and testing'
    },
    STANDARD: {
      id: 'standard',
      name: 'Standard',
      description: 'Balanced quality and performance',
      dpi: 150,
      antialiasing: true,
      compression: 0.5,
      colorDepth: 16,
      cacheEnabled: true,
      asyncRendering: true,
      smoothingLevel: 1,
      fontHinting: 'slight',
      alphaBlending: true,
      quality: 0.6,
      useCase: 'Web display and digital sharing'
    },
    HIGH: {
      id: 'high',
      name: 'High Quality',
      description: 'High quality output, good performance',
      dpi: 300,
      antialiasing: true,
      compression: 0.7,
      colorDepth: 24,
      cacheEnabled: true,
      asyncRendering: true,
      smoothingLevel: 2,
      fontHinting: 'medium',
      alphaBlending: true,
      quality: 0.85,
      useCase: 'Standard printing and presentations'
    },
    PRINT: {
      id: 'print',
      name: 'Print Ready',
      description: 'Professional print quality',
      dpi: 600,
      antialiasing: true,
      compression: 0.9,
      colorDepth: 32,
      cacheEnabled: true,
      asyncRendering: false,
      smoothingLevel: 3,
      fontHinting: 'full',
      alphaBlending: true,
      quality: 0.95,
      useCase: 'Professional printing and publishing'
    },
    ARCHIVE: {
      id: 'archive',
      name: 'Archive Quality',
      description: 'Maximum quality for archival',
      dpi: 1200,
      antialiasing: true,
      compression: 1.0,
      colorDepth: 32,
      cacheEnabled: true,
      asyncRendering: false,
      smoothingLevel: 4,
      fontHinting: 'full',
      alphaBlending: true,
      quality: 1.0,
      useCase: 'Archival preservation and high-end publishing'
    }
  };

  const RENDERING_QUALITY = {
    ULTRA_LOW: { factor: 0.25, name: 'Ultra Low (0.25x)' },
    LOW: { factor: 0.5, name: 'Low (0.5x)' },
    MEDIUM: { factor: 0.75, name: 'Medium (0.75x)' },
    HIGH: { factor: 1.0, name: 'High (1x)' },
    ULTRA: { factor: 2.0, name: 'Ultra (2x)' },
    SUPER: { factor: 4.0, name: 'Super (4x)' },
    MEGA: { factor: 8.0, name: 'Mega (8x)' },
    HYPER: { factor: 16.0, name: 'Hyper (16x)' },
    OMEGA: { factor: 32.0, name: 'Omega (32x)' }
  };

  const COLOR_PROFILES = {
    sRGB: { name: 'sRGB', description: 'Standard RGB for web and digital', gamma: 2.2, whitePoint: 6500 },
    AdobeRGB: { name: 'Adobe RGB', description: 'Wider gamut for print', gamma: 2.2, whitePoint: 6500 },
    ProPhoto: { name: 'ProPhoto RGB', description: 'Ultra-wide gamut', gamma: 1.8, whitePoint: 5000 },
    CMYK: { name: 'CMYK (US Web Coated)', description: 'Print production', gamma: 2.2, whitePoint: 6500 },
    Grayscale: { name: 'Grayscale', description: 'Black and white output', gamma: 2.2, whitePoint: 6500 }
  };

  class MXDQualityModesVortex {
    constructor() {
      this.currentMode = QUALITY_MODES.STANDARD;
      this.customSettings = {};
      this.settings = this.loadSettings();
      this.statistics = this.loadStatistics();
      this.listeners = {};
      this.adaptiveEnabled = true;
      this.hardwareAcceleration = true;
      this.progressiveRendering = true;
      this.memoryManagement = true;
      this.autoOptimization = true;
      this.init();
    }

    init() {
      this.loadSettings();
      console.log(`🎨 MXD Quality Modes Vortex v${VERSION} — 30x Enhanced Visual Quality`);
      this.detectHardwareCapabilities();
    }

    detectHardwareCapabilities() {
      this.hardwareInfo = {
        cores: navigator.hardwareConcurrency || 4,
        memory: navigator.deviceMemory || 4,
        gpu: this.detectGPU(),
        supportWebGL: this.checkWebGL(),
        supportWebGPU: this.checkWebGPU(),
        supportWorkers: typeof Worker !== 'undefined'
      };

      if (this.autoOptimization) {
        this.autoSelectMode();
      }
    }

    detectGPU() {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl && gl.getParameter) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        }
      }
      return 'Unknown';
    }

    checkWebGL() {
      try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      } catch (e) { return false; }
    }

    checkWebGPU() {
      return 'gpu' in navigator;
    }

    autoSelectMode() {
      const info = this.hardwareInfo;

      if (info.memory >= 8 && info.cores >= 8) {
        if (info.supportWebGL) {
          this.currentMode = QUALITY_MODES.PRINT;
        } else {
          this.currentMode = QUALITY_MODES.HIGH;
        }
      } else if (info.memory >= 4 && info.cores >= 4) {
        this.currentMode = QUALITY_MODES.HIGH;
      } else if (info.memory >= 2) {
        this.currentMode = QUALITY_MODES.STANDARD;
      } else {
        this.currentMode = QUALITY_MODES.DRAFT;
      }

      this.emit('autoModeSelected', { mode: this.currentMode });
    }

    loadSettings() {
      try {
        const saved = localStorage.getItem('mxd_quality_vortex_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          this.currentMode = parsed.currentMode || QUALITY_MODES.STANDARD;
          this.customSettings = parsed.customSettings || {};
          this.adaptiveEnabled = parsed.adaptiveEnabled ?? true;
          this.hardwareAcceleration = parsed.hardwareAcceleration ?? true;
          this.progressiveRendering = parsed.progressiveRendering ?? true;
          this.memoryManagement = parsed.memoryManagement ?? true;
          this.autoOptimization = parsed.autoOptimization ?? true;
        }
      } catch (e) {}
      return this.settings;
    }

    saveSettings() {
      try {
        localStorage.setItem('mxd_quality_vortex_settings', JSON.stringify({
          currentMode: this.currentMode,
          customSettings: this.customSettings,
          adaptiveEnabled: this.adaptiveEnabled,
          hardwareAcceleration: this.hardwareAcceleration,
          progressiveRendering: this.progressiveRendering,
          memoryManagement: this.memoryManagement,
          autoOptimization: this.autoOptimization
        }));
      } catch (e) {}
    }

    loadStatistics() {
      try {
        const saved = localStorage.getItem('mxd_quality_stats');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
      return {
        rendersCompleted: 0,
        totalRenderTime: 0,
        averageQuality: 0,
        peakQuality: 0,
        memoryUsage: 0,
        cacheHits: 0,
        cacheMisses: 0,
        byMode: {}
      };
    }

    saveStatistics() {
      try { localStorage.setItem('mxd_quality_stats', JSON.stringify(this.statistics)); } catch (e) {}
    }

    setMode(modeId) {
      const mode = Object.values(QUALITY_MODES).find(m => m.id === modeId);
      if (mode) {
        this.currentMode = mode;
        this.emit('modeChanged', { mode });
        this.saveSettings();
        return true;
      }
      return false;
    }

    getMode() { return this.currentMode; }
    getAllModes() { return QUALITY_MODES; }

    getModeSettings(modeId = null) {
      const mode = modeId ? Object.values(QUALITY_MODES).find(m => m.id === modeId) : this.currentMode;
      return { ...mode, ...this.customSettings[modeId] };
    }

    setCustomSetting(key, value) {
      if (!this.customSettings[this.currentMode.id]) {
        this.customSettings[this.currentMode.id] = {};
      }
      this.customSettings[this.currentMode.id][key] = value;
      this.emit('customSettingChanged', { key, value, mode: this.currentMode.id });
      this.saveSettings();
    }

    getCustomSettings() {
      return { ...this.customSettings[this.currentMode.id] };
    }

    getEffectiveSettings() {
      return {
        ...this.currentMode,
        ...(this.customSettings[this.currentMode.id] || {})
      };
    }

    setRenderingQuality(qualityId) {
      const quality = RENDERING_QUALITY[qualityId.toUpperCase()];
      if (quality) {
        this.currentMode.dpi = Math.round(this.currentMode.dpi * quality.factor);
        this.currentMode.quality = Math.min(1, this.currentMode.quality * quality.factor);
        this.emit('renderingQualityChanged', { quality, dpi: this.currentMode.dpi });
        this.saveSettings();
        return true;
      }
      return false;
    }

    getRenderingQuality() {
      const factor = this.currentMode.dpi / QUALITY_MODES.STANDARD.dpi;
      for (const [key, q] of Object.entries(RENDERING_QUALITY)) {
        if (Math.abs(q.factor - factor) < 0.1) return key;
      }
      return 'HIGH';
    }

    setColorProfile(profileId) {
      const profile = COLOR_PROFILES[profileId];
      if (profile) {
        this.currentMode.colorProfile = profile;
        this.emit('colorProfileChanged', { profile });
        this.saveSettings();
        return true;
      }
      return false;
    }

    getColorProfile() { return this.currentMode.colorProfile || COLOR_PROFILES.sRGB; }
    getAllColorProfiles() { return COLOR_PROFILES; }

    enableHardwareAcceleration(enabled) {
      this.hardwareAcceleration = !!enabled;
      this.emit('hardwareAccelerationChanged', { enabled: this.hardwareAcceleration });
      this.saveSettings();
    }

    isHardwareAccelerationEnabled() { return this.hardwareAcceleration; }

    enableProgressiveRendering(enabled) {
      this.progressiveRendering = !!enabled;
      this.emit('progressiveRenderingChanged', { enabled: this.progressiveRendering });
      this.saveSettings();
    }

    isProgressiveRenderingEnabled() { return this.progressiveRendering; }

    enableAdaptiveMode(enabled) {
      this.adaptiveEnabled = !!enabled;
      if (enabled) this.autoSelectMode();
      this.emit('adaptiveModeChanged', { enabled: this.adaptiveEnabled });
      this.saveSettings();
    }

    isAdaptiveModeEnabled() { return this.adaptiveEnabled; }

    getQualityProfile() {
      const settings = this.getEffectiveSettings();
      return {
        mode: this.currentMode.id,
        dpi: settings.dpi,
        quality: settings.quality,
        antialiasing: settings.antialiasing,
        colorDepth: settings.colorDepth,
        compression: settings.compression,
        hardwareInfo: this.hardwareInfo
      };
    }

    estimateRenderTime(pixelWidth, pixelHeight) {
      const settings = this.getEffectiveSettings();
      const pixels = pixelWidth * pixelHeight;
      const baseTime = pixels / 1000000;
      const qualityFactor = settings.dpi / 300;
      const hardwareFactor = this.hardwareAcceleration ? 0.5 : 1;
      const coresFactor = 1 / (this.hardwareInfo.cores || 4);
      return baseTime * qualityFactor * hardwareFactor * coresFactor * 1000;
    }

    estimateMemoryUsage(pixelWidth, pixelHeight) {
      const settings = this.getEffectiveSettings();
      const pixels = pixelWidth * pixelHeight;
      const bytesPerPixel = settings.colorDepth / 8;
      const multiplier = settings.quality;
      return (pixels * bytesPerPixel * multiplier) / (1024 * 1024);
    }

    optimizeForUseCase(useCase) {
      const useCaseSettings = {
        web: { modeId: 'standard', compression: 0.6, dpi: 150 },
        print: { modeId: 'print', compression: 0.9, dpi: 600 },
        archive: { modeId: 'archive', compression: 1.0, dpi: 1200 },
        preview: { modeId: 'draft', compression: 0.3, dpi: 72 },
        presentation: { modeId: 'high', compression: 0.8, dpi: 300 }
      };

      const config = useCaseSettings[useCase];
      if (config) {
        this.setMode(config.modeId);
        this.setCustomSetting('compression', config.compression);
        this.setCustomSetting('dpi', config.dpi);
        this.emit('optimizedForUseCase', { useCase, config });
        return true;
      }
      return false;
    }

    recordRender(time, quality) {
      this.statistics.rendersCompleted++;
      this.statistics.totalRenderTime += time;
      this.statistics.averageQuality = (this.statistics.averageQuality * (this.statistics.rendersCompleted - 1) + quality) / this.statistics.rendersCompleted;
      this.statistics.peakQuality = Math.max(this.statistics.peakQuality, quality);

      const modeId = this.currentMode.id;
      if (!this.statistics.byMode[modeId]) this.statistics.byMode[modeId] = { renders: 0, time: 0 };
      this.statistics.byMode[modeId].renders++;
      this.statistics.byMode[modeId].time += time;

      this.saveStatistics();
    }

    getStatistics() { return { ...this.statistics }; }

    resetStatistics() {
      this.statistics = {
        rendersCompleted: 0,
        totalRenderTime: 0,
        averageQuality: 0,
        peakQuality: 0,
        memoryUsage: 0,
        cacheHits: 0,
        cacheMisses: 0,
        byMode: {}
      };
      this.saveStatistics();
    }

    clearCache() {
      this.statistics.cacheHits = 0;
      this.statistics.cacheMisses = 0;
      this.emit('cacheCleared');
    }

    getCacheStats() {
      const total = this.statistics.cacheHits + this.statistics.cacheMisses;
      return {
        hits: this.statistics.cacheHits,
        misses: this.statistics.cacheMisses,
        hitRate: total > 0 ? (this.statistics.cacheHits / total) * 100 : 0
      };
    }

    getRecommendedMode() {
      const info = this.hardwareInfo;

      if (info.memory >= 8 && info.cores >= 8 && info.supportWebGL) {
        return QUALITY_MODES.PRINT;
      } else if (info.memory >= 4 && info.cores >= 4) {
        return QUALITY_MODES.HIGH;
      } else if (info.memory >= 2) {
        return QUALITY_MODES.STANDARD;
      }
      return QUALITY_MODES.DRAFT;
    }

    exportSettings() {
      return {
        mode: this.currentMode,
        customSettings: this.customSettings,
        adaptiveEnabled: this.adaptiveEnabled,
        hardwareAcceleration: this.hardwareAcceleration,
        progressiveRendering: this.progressiveRendering,
        memoryManagement: this.memoryManagement,
        autoOptimization: this.autoOptimization
      };
    }

    importSettings(config) {
      if (config.mode) this.currentMode = config.mode;
      if (config.customSettings) this.customSettings = config.customSettings;
      if (config.adaptiveEnabled !== undefined) this.adaptiveEnabled = config.adaptiveEnabled;
      if (config.hardwareAcceleration !== undefined) this.hardwareAcceleration = config.hardwareAcceleration;
      if (config.progressiveRendering !== undefined) this.progressiveRendering = config.progressiveRendering;
      if (config.memoryManagement !== undefined) this.memoryManagement = config.memoryManagement;
      if (config.autoOptimization !== undefined) this.autoOptimization = config.autoOptimization;
      this.saveSettings();
      this.emit('settingsImported', config);
    }

    on(event, callback) {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(callback);
    }

    off(event, callback) {
      if (!this.listeners[event]) return;
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    emit(event, data) {
      if (!this.listeners[event]) return;
      this.listeners[event].forEach(cb => { try { cb(data); } catch (e) {} });
    }

    getVersion() { return VERSION; }
  }

  window.MXD_QUALITY_VORTEX = new MXDQualityModesVortex();
  window.MXDQualityModesVortex = MXDQualityModesVortex;
  window.QUALITY_MODES_VORTEX = QUALITY_MODES;
  window.RENDERING_QUALITY_VORTEX = RENDERING_QUALITY;
  window.COLOR_PROFILES_VORTEX = COLOR_PROFILES;
})();