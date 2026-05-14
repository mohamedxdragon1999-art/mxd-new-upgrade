// generative-theme-engine.js — MXD OMNI-NEXUS v11.0 Generative CSS Theming
// Creates custom themes from text descriptions
(function() {
  'use strict';

  const THEME_VERSION = '11.0.0';

  // Predefined theme generators
  const THEME_PRESETS = {
    cyberpunk: {
      colors: {
        primary: '#00ffff',
        secondary: '#ff00ff',
        accent: '#ffff00',
        background: '#0a0a0a',
        surface: '#1a1a2e',
        text: '#e0e0e0',
        highlight: '#00ffff'
      },
      fonts: { primary: 'Orbitron, monospace', secondary: 'Share Tech Mono, monospace' },
      effects: { glow: true, scanlines: true, neon: true }
    },
    forest: {
      colors: {
        primary: '#228b22',
        secondary: '#90ee90',
        accent: '#ffd700',
        background: '#f0fff0',
        surface: '#e8f5e9',
        text: '#1b5e20',
        highlight: '#4caf50'
      },
      fonts: { primary: 'Merriweather, serif', secondary: 'Lato, sans-serif' },
      effects: { glow: false, scanlines: false, neon: false }
    },
    ocean: {
      colors: {
        primary: '#0077b6',
        secondary: '#00b4d8',
        accent: '#90e0ef',
        background: '#caf0f8',
        surface: '#ade8f4',
        text: '#023e8a',
        highlight: '#0096c7'
      },
      fonts: { primary: 'Poppins, sans-serif', secondary: 'Open Sans, sans-serif' },
      effects: { glow: false, scanlines: false, neon: false }
    },
    sunset: {
      colors: {
        primary: '#ff6b35',
        secondary: '#f7931e',
        accent: '#ffd700',
        background: '#fff5e6',
        surface: '#ffe4c4',
        text: '#8b4513',
        highlight: '#ff4500'
      },
      fonts: { primary: 'Playfair Display, serif', secondary: 'Raleway, sans-serif' },
      effects: { glow: true, scanlines: false, neon: false }
    },
    space: {
      colors: {
        primary: '#6c63ff',
        secondary: '#4ecdc4',
        accent: '#ffe66d',
        background: '#1a1a2e',
        surface: '#16213e',
        text: '#e0e0e0',
        highlight: '#a855f7'
      },
      fonts: { primary: 'Space Grotesk, sans-serif', secondary: 'Inter, sans-serif' },
      effects: { glow: true, scanlines: true, neon: false }
    },
    minimal: {
      colors: {
        primary: '#2d2d2d',
        secondary: '#757575',
        accent: '#1a73e8',
        background: '#ffffff',
        surface: '#f5f5f5',
        text: '#212121',
        highlight: '#1a73e8'
      },
      fonts: { primary: 'Inter, sans-serif', secondary: 'Inter, sans-serif' },
      effects: { glow: false, scanlines: false, neon: false }
    }
  };

  // Color analysis from text
  const COLOR_KEYWORDS = {
    warm: ['#ff6b35', '#f7931e', '#ffd700', '#e74c3c', '#ff8c00'],
    cool: ['#3498db', '#00b4d8', '#0077b6', '#6c63ff', '#9b59b6'],
    dark: ['#1a1a2e', '#2d3436', '#34495e', '#0a0a0a', '#2c3e50'],
    light: ['#ffffff', '#f5f5f5', '#ffe4c4', '#e8f5e9', '#caf0f8'],
    neon: ['#00ffff', '#ff00ff', '#39ff14', '#ff6ec7', '#bf00ff'],
    natural: ['#228b22', '#90ee90', '#8b4513', '#daa520', '#6b8e23']
  };

  // Font mapping from text
  const FONT_KEYWORDS = {
    modern: ['Inter', 'Poppins', 'Roboto', 'Space Grotesk'],
    classic: ['Merriweather', 'Playfair Display', 'Lora', 'Libre Baskerville'],
    tech: ['Orbitron', 'Share Tech Mono', 'Fira Code', 'JetBrains Mono'],
    playful: ['Comic Neue', 'Patrick Hand', 'Baloo 2', 'Nunito'],
    elegant: ['Cormorant Garamond', 'EB Garamond', 'Crimson Text', 'Libre Baskerville']
  };

  class GenerativeThemeEngine {
    constructor() {
      this.currentTheme = 'classic';
      this.customStyles = null;
      this.init();
    }

    init() {
      console.log(`🎨 Generative Theme Engine v${THEME_VERSION}`);
      this.loadSavedTheme();
    }

    // Generate theme from text description
    async generateFromDescription(description) {
      const desc = description.toLowerCase();
      
      // Analyze description for colors
      const colors = this.analyzeColorPreferences(desc);
      
      // Analyze description for fonts
      const fonts = this.analyzeFontPreferences(desc);
      
      // Analyze description for effects
      const effects = this.analyzeEffectPreferences(desc);

      const theme = {
        name: description,
        colors: {
          primary: colors.primary || '#c9a227',
          secondary: colors.secondary || '#ececf0',
          accent: colors.accent || '#ef4444',
          background: colors.background || '#09090b',
          surface: colors.surface || '#18181b',
          text: colors.text || '#fafafa',
          highlight: colors.highlight || '#c9a227'
        },
        fonts: {
          primary: fonts.primary || 'Inter, sans-serif',
          secondary: fonts.secondary || 'Inter, sans-serif'
        },
        effects: effects,
        metadata: {
          generated: Date.now(),
          description: description,
          version: THEME_VERSION
        }
      };

      // Apply theme
      await this.applyTheme(theme);
      
      return theme;
    }

    // Analyze color preferences from text
    analyzeColorPreferences(description) {
      const colors = {};
      const desc = description.toLowerCase();

      // Check for keyword matches
      if (desc.includes('dark') || desc.includes('night') || desc.includes('black')) {
        colors.background = COLOR_KEYWORDS.dark[0];
        colors.surface = COLOR_KEYWORDS.dark[3];
        colors.text = '#e0e0e0';
        colors.primary = COLOR_KEYWORDS.cool[0];
      }
      
      if (desc.includes('light') || desc.includes('bright') || desc.includes('white') || desc.includes('clean')) {
        colors.background = COLOR_KEYWORDS.light[0];
        colors.surface = COLOR_KEYWORDS.light[1];
        colors.text = '#212121';
        colors.primary = COLOR_KEYWORDS.cool[0];
      }

      if (desc.includes('neon') || desc.includes('cyber') || desc.includes('glowing')) {
        colors.primary = COLOR_KEYWORDS.neon[0];
        colors.secondary = COLOR_KEYWORDS.neon[1];
        colors.accent = COLOR_KEYWORDS.neon[4];
        colors.background = '#0a0a0a';
        colors.surface = '#1a1a2e';
      }

      if (desc.includes('warm') || desc.includes('sunset') || desc.includes('orange')) {
        colors.primary = COLOR_KEYWORDS.warm[0];
        colors.secondary = COLOR_KEYWORDS.warm[1];
        colors.accent = COLOR_KEYWORDS.warm[2];
      }

      if (desc.includes('cool') || desc.includes('ocean') || desc.includes('blue')) {
        colors.primary = COLOR_KEYWORDS.cool[0];
        colors.secondary = COLOR_KEYWORDS.cool[1];
        colors.accent = COLOR_KEYWORDS.cool[2];
      }

      if (desc.includes('nature') || desc.includes('forest') || desc.includes('green')) {
        colors.primary = COLOR_KEYWORDS.natural[0];
        colors.secondary = COLOR_KEYWORDS.natural[1];
        colors.accent = COLOR_KEYWORDS.natural[2];
      }

      if (desc.includes('elegant') || desc.includes('luxury') || desc.includes('gold')) {
        colors.primary = '#c9a227';
        colors.accent = '#ffd700';
        colors.background = '#1a1a2e';
      }

      return colors;
    }

    // Analyze font preferences from text
    analyzeFontPreferences(description) {
      const fonts = {};
      const desc = description.toLowerCase();

      if (desc.includes('modern') || desc.includes('tech') || desc.includes('digital')) {
        fonts.primary = FONT_KEYWORDS.tech[0] + ', monospace';
        fonts.secondary = FONT_KEYWORDS.tech[1] + ', monospace';
      }
      
      if (desc.includes('classic') || desc.includes('traditional') || desc.includes('elegant')) {
        fonts.primary = FONT_KEYWORDS.classic[0] + ', serif';
        fonts.secondary = FONT_KEYWORDS.classic[1] + ', serif';
      }

      if (desc.includes('playful') || desc.includes('fun') || desc.includes('kids') || desc.includes('colorful')) {
        fonts.primary = FONT_KEYWORDS.playful[0] + ', cursive';
        fonts.secondary = FONT_KEYWORDS.playful[1] + ', sans-serif';
      }

      if (desc.includes('simple') || desc.includes('minimal') || desc.includes('clean')) {
        fonts.primary = FONT_KEYWORDS.modern[0] + ', sans-serif';
        fonts.secondary = FONT_KEYWORDS.modern[1] + ', sans-serif';
      }

      if (!fonts.primary) {
        fonts.primary = 'Inter, sans-serif';
        fonts.secondary = 'Inter, sans-serif';
      }

      return fonts;
    }

    // Analyze effect preferences
    analyzeEffectPreferences(description) {
      const effects = {
        glow: false,
        scanlines: false,
        neon: false,
        gradient: false,
        shadow: true
      };

      const desc = description.toLowerCase();

      if (desc.includes('glow') || desc.includes('neon') || desc.includes('cyber')) {
        effects.glow = true;
        effects.neon = true;
      }

      if (desc.includes('retro') || desc.includes('scanline') || desc.includes('vintage')) {
        effects.scanlines = true;
        effects.glow = false;
      }

      if (desc.includes('gradient') || desc.includes('vibrant') || desc.includes('colorful')) {
        effects.gradient = true;
      }

      if (desc.includes('flat') || desc.includes('minimal') || desc.includes('simple')) {
        effects.shadow = false;
      }

      return effects;
    }

    // Apply theme to document
    async applyTheme(theme) {
      // Generate CSS
      const css = this.generateCSS(theme);
      
      // Create or update style element
      let styleEl = document.getElementById('mxd-generative-theme');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'mxd-generative-theme';
        document.head.appendChild(styleEl);
      }
      
      styleEl.textContent = css;
      
      // Save to localStorage
      this.saveTheme(theme);
      
      this.currentTheme = theme;
      console.log('🎨 Theme applied:', theme.name || 'Custom Theme');
      
      // Dispatch event for React components
      window.dispatchEvent(new CustomEvent('mxd-theme-changed', { detail: theme }));
    }

    // Generate CSS from theme
    generateCSS(theme) {
      const { colors, fonts, effects } = theme;
      
      return `
        /* MXD OMNI-NEXUS v11.0 Generated Theme */
        :root {
          --primary: ${colors.primary};
          --secondary: ${colors.secondary};
          --accent: ${colors.accent};
          --background: ${colors.background};
          --surface: ${colors.surface};
          --text: ${colors.text};
          --highlight: ${colors.highlight};
          --font-primary: ${fonts.primary};
          --font-secondary: ${fonts.secondary};
          --hl: ${colors.highlight};
          --bg1: ${colors.background};
          --bg2: ${colors.surface};
          --bg3: ${colors.secondary};
          --t1: ${colors.text};
          --t2: ${colors.secondary};
          --t3: ${colors.accent};
          --b1: ${colors.primary}40;
          --b2: ${colors.primary}20;
        }

        /* Glow effects */
        ${effects.glow ? `
        .glow-effect {
          box-shadow: 0 0 10px ${colors.primary}, 0 0 20px ${colors.primary}40, 0 0 30px ${colors.primary}20;
        }
        .glow-text {
          text-shadow: 0 0 5px ${colors.primary}, 0 0 10px ${colors.primary}80;
        }
        ` : ''}

        /* Neon effects */
        ${effects.neon ? `
        .neon-border {
          border: 2px solid ${colors.primary};
          box-shadow: 0 0 5px ${colors.primary}, 0 0 10px ${colors.primary}, 0 0 20px ${colors.primary}50;
        }
        .neon-text {
          color: ${colors.primary};
          text-shadow: 0 0 5px ${colors.primary}, 0 0 10px ${colors.primary}, 0 0 20px ${colors.primary};
        }
        ` : ''}

        /* Scanline effect */
        ${effects.scanlines ? `
        body::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 0, 0, 0.1) 2px,
            rgba(0, 0, 0, 0.1) 4px
          );
          pointer-events: none;
          z-index: 9999;
        }
        ` : ''}

        /* Gradient background */
        ${effects.gradient ? `
        .gradient-bg {
          background: linear-gradient(135deg, ${colors.background}, ${colors.surface}, ${colors.primary}20);
        }
        ` : ''}

        /* Base typography */
        body, .app {
          font-family: var(--font-primary);
          background-color: var(--background);
          color: var(--text);
        }

        /* Grid styling */
        .gg {
          background: ${colors.surface};
        }

        .gc {
          color: ${colors.text};
          background: ${colors.background};
        }

        /* Sidebar styling */
        .sb {
          background: ${colors.surface};
          color: ${colors.text};
        }

        /* Button styling */
        .btn-pri, .btn-ok {
          background: ${colors.primary};
          color: ${colors.background};
        }

        .btn-pri:hover, .btn-ok:hover {
          box-shadow: ${effects.glow ? `0 0 10px ${colors.primary}` : 'none'};
        }

        /* Highlight styling */
        .hi {
          background: ${colors.highlight}40;
        }

        /* Section styling */
        .sec-hd {
          background: ${colors.surface};
          border-bottom: 1px solid ${colors.primary}30;
        }
      `;
    }

    // Apply preset theme
    applyPreset(presetName) {
      const preset = THEME_PRESETS[presetName];
      if (!preset) {
        console.error('Unknown preset:', presetName);
        return;
      }

      this.applyTheme({
        name: presetName,
        ...preset,
        metadata: {
          generated: Date.now(),
          preset: presetName,
          version: THEME_VERSION
        }
      });
    }

    // Get available presets
    getPresets() {
      return Object.keys(THEME_PRESETS);
    }

    // Get current theme
    getCurrentTheme() {
      return this.currentTheme;
    }

    // Save theme to localStorage
    saveTheme(theme) {
      try {
        localStorage.setItem('mxd_generated_theme', JSON.stringify(theme));
      } catch (e) {
        console.warn('Failed to save theme:', e);
      }
    }

    // Load saved theme
    loadSavedTheme() {
      try {
        const saved = localStorage.getItem('mxd_generated_theme');
        if (saved) {
          const theme = JSON.parse(saved);
          this.currentTheme = theme;
          console.log('🎨 Loaded saved theme:', theme.name || 'Custom');
        }
      } catch (e) {
        console.warn('Failed to load theme:', e);
      }
    }

    // Reset to default theme
    resetTheme() {
      localStorage.removeItem('mxd_generated_theme');
      
      // Remove generated style
      const styleEl = document.getElementById('mxd-generative-theme');
      if (styleEl) styleEl.remove();

      // Apply default MXD theme
      this.currentTheme = 'classic';
      
      // Dispatch event
      window.dispatchEvent(new CustomEvent('mxd-theme-reset'));
      
      console.log('🎨 Theme reset to default');
    }

    // Export current theme as JSON
    exportTheme() {
      return JSON.stringify(this.currentTheme, null, 2);
    }

    // Import theme from JSON
    importTheme(jsonString) {
      try {
        const theme = JSON.parse(jsonString);
        this.applyTheme(theme);
        return true;
      } catch (e) {
        console.error('Failed to import theme:', e);
        return false;
      }
    }
  }

  // Initialize global theme engine
  window.GenerativeThemeEngine = new GenerativeThemeEngine();
  window.MXD_THEME = GenerativeThemeEngine;

})();