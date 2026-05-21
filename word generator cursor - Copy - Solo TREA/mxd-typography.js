/**
 * MXD Typography Engine v1.0
 * Professional typography controls for PDF export with font embedding,
 * font pairing suggestions, KDP-compliant font licensing, kerning/leading controls
 * 
 * PITFALLS AVOIDED:
 * - Font licensing: Only uses open-source fonts (OFL, Apache 2.0) for commercial use
 * - Font embedding: Uses jsPDF addFileToVFS/addFont correctly for each weight
 * - Missing bold/italic: Each font variant needs separate TTF file
 * - UMD vs ES module: Uses window.jspdf.jsPDF for UMD compatibility
 * - Font size limits: KDP minimum 8pt for body text
 * - Character encoding: Only supports basic Latin (A-Z, a-z, 0-9, punctuation)
 * - Performance: Fonts loaded once, cached for subsequent PDF generations
 */
(function(){
  'use strict';

  var TYPOGRAPHY = {
    version: '1.0',

    // Fonts loaded flag
    _fontsLoaded: false,
    _fontCache: {},

    // Open-source font definitions (OFL/Apache 2.0 licensed)
    // These are embedded as base64 TTF data for jsPDF
    FONTS: {
      inter: {
        name: 'Inter',
        family: 'Inter',
        license: 'OFL-1.1',
        commercialUse: true,
        weights: {
          normal: {name: 'Inter-Regular', file: null},
          bold: {name: 'Inter-Bold', file: null}
        }
      },
      roboto: {
        name: 'Roboto',
        family: 'Roboto',
        license: 'Apache-2.0',
        commercialUse: true,
        weights: {
          normal: {name: 'Roboto-Regular', file: null},
          bold: {name: 'Roboto-Bold', file: null}
        }
      },
      merriweather: {
        name: 'Merriweather',
        family: 'Merriweather',
        license: 'OFL-1.1',
        commercialUse: true,
        weights: {
          normal: {name: 'Merriweather-Regular', file: null},
          bold: {name: 'Merriweather-Bold', file: null}
        }
      },
      montserrat: {
        name: 'Montserrat',
        family: 'Montserrat',
        license: 'OFL-1.1',
        commercialUse: true,
        weights: {
          normal: {name: 'Montserrat-Regular', file: null},
          bold: {name: 'Montserrat-Bold', file: null}
        }
      },
      lato: {
        name: 'Lato',
        family: 'Lato',
        license: 'OFL-1.1',
        commercialUse: true,
        weights: {
          normal: {name: 'Lato-Regular', file: null},
          bold: {name: 'Lato-Bold', file: null}
        }
      },
      opensans: {
        name: 'Open Sans',
        family: 'OpenSans',
        license: 'OFL-1.1',
        commercialUse: true,
        weights: {
          normal: {name: 'OpenSans-Regular', file: null},
          bold: {name: 'OpenSans-Bold', file: null}
        }
      },
      oswald: {
        name: 'Oswald',
        family: 'Oswald',
        license: 'OFL-1.1',
        commercialUse: true,
        weights: {
          normal: {name: 'Oswald-Regular', file: null},
          bold: {name: 'Oswald-Bold', file: null}
        }
      },
      raleway: {
        name: 'Raleway',
        family: 'Raleway',
        license: 'OFL-1.1',
        commercialUse: true,
        weights: {
          normal: {name: 'Raleway-Regular', file: null},
          bold: {name: 'Raleway-Bold', file: null}
        }
      }
    },

    // Recommended font pairings (title + body)
    PAIRINGS: [
      {title: 'montserrat', body: 'opensans', name:'Modern Clean', desc:'Bold title, readable body'},
      {title: 'oswald', body: 'lato', name:'Strong & Soft', desc:'Condensed title, warm body'},
      {title: 'raleway', body: 'merriweather', name:'Elegant Classic', desc:'Refined title, serif body'},
      {title: 'inter', body: 'inter', name:'Unified', desc:'Same font, consistent feel'},
      {title: 'roboto', body: 'roboto', name:'Material', desc:'Google standard pairing'},
      {title: 'montserrat', body: 'merriweather', name:'Premium', desc:'Geometric title, traditional body'},
      {title: 'oswald', body: 'opensans', name:'Professional', desc:'Impact title, neutral body'},
      {title: 'raleway', body: 'lato', name:'Friendly', desc:'Light title, approachable body'}
    ],

    // KDP font requirements
    KDP_REQUIREMENTS: {
      minBodySize: 8,
      minTitleSize: 10,
      recommendedBodySize: 10,
      recommendedTitleSize: 14,
      maxLinesPerPage: 45,
      minLineHeight: 1.15,
      recommendedLineHeight: 1.3
    },

    /**
     * Load fonts dynamically from local files or CDN
     * For file:// usage, fonts should be in fonts/ directory
     */
    loadFonts: function() {
      var self = this;
      var fontFiles = {
        'Inter-Regular': 'fonts/Inter-Regular.ttf',
        'Inter-Bold': 'fonts/Inter-Bold.ttf',
        'Roboto-Regular': 'fonts/Roboto-Regular.ttf',
        'Roboto-Bold': 'fonts/Roboto-Bold.ttf',
        'Merriweather-Regular': 'fonts/Merriweather-Regular.ttf',
        'Merriweather-Bold': 'fonts/Merriweather-Bold.ttf',
        'Montserrat-Regular': 'fonts/Montserrat-Regular.ttf',
        'Montserrat-Bold': 'fonts/Montserrat-Bold.ttf',
        'Lato-Regular': 'fonts/Lato-Regular.ttf',
        'Lato-Bold': 'fonts/Lato-Bold.ttf',
        'OpenSans-Regular': 'fonts/OpenSans-Regular.ttf',
        'OpenSans-Bold': 'fonts/OpenSans-Bold.ttf',
        'Oswald-Regular': 'fonts/Oswald-Regular.ttf',
        'Oswald-Bold': 'fonts/Oswald-Bold.ttf',
        'Raleway-Regular': 'fonts/Raleway-Regular.ttf',
        'Raleway-Bold': 'fonts/Raleway-Bold.ttf'
      };

      var promises = [];
      for(var fontName in fontFiles) {
        if(!this._fontCache[fontName]) {
          promises.push(this._loadFontFile(fontFiles[fontName], fontName));
        }
      }

      return Promise.all(promises).then(function() {
        self._fontsLoaded = true;
        console.log('[Typography] ' + Object.keys(self._fontCache).length + ' fonts loaded');
      }).catch(function(e) {
        console.warn('[Typography] Some fonts failed to load, falling back to built-in fonts:', e.message);
      });
    },

    /**
     * Load a single TTF font file and convert to base64
     */
    _loadFontFile: function(path, fontName) {
      var self = this;
      return fetch(path).then(function(response) {
        if(!response.ok) throw new Error('Font not found: ' + path);
        return response.arrayBuffer();
      }).then(function(buffer) {
        var binary = '';
        var bytes = new Uint8Array(buffer);
        for(var i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        self._fontCache[fontName] = btoa(binary);
      });
    },

    /**
     * Register a font with jsPDF from cached base64 data
     */
    registerFont: function(doc, fontName, weight) {
      weight = weight || 'normal';
      var key = fontName + '-' + (weight === 'bold' ? 'Bold' : 'Regular');
      var base64 = this._fontCache[key];
      if(!base64) {
        // Fall back to built-in jsPDF fonts
        return false;
      }
      var ttfName = key + '.ttf';
      doc.addFileToVFS(ttfName, base64);
      doc.addFont(ttfName, fontName, weight);
      return true;
    },

    /**
     * Register all loaded fonts with a jsPDF document
     */
    registerAllFonts: function(doc) {
      var registered = 0;
      for(var fontName in this._fontCache) {
        var parts = fontName.split('-');
        var family = parts[0];
        var weight = parts[1] === 'Bold' ? 'bold' : 'normal';
        if(this.registerFont(doc, family, weight)) {
          registered++;
        }
      }
      return registered;
    },

    /**
     * Set font on a jsPDF document with fallback
     */
    setFont: function(doc, family, weight, size) {
      weight = weight || 'normal';
      size = size || 12;
      var registered = this.registerFont(doc, family, weight);
      if(registered) {
        doc.setFont(family, weight);
      } else {
        // Fallback to built-in
        doc.setFont('helvetica', weight === 'bold' ? 'bold' : 'normal');
      }
      doc.setFontSize(size);
    },

    /**
     * Validate font configuration for KDP compliance
     */
    validateForKDP: function(config) {
      var issues = [];
      var req = this.KDP_REQUIREMENTS;

      if(config.bodySize && config.bodySize < req.minBodySize) {
        issues.push({severity:'error', field:'bodySize', message:'Body text must be at least ' + req.minBodySize + 'pt for KDP'});
      }
      if(config.titleSize && config.titleSize < req.minTitleSize) {
        issues.push({severity:'error', field:'titleSize', message:'Title text must be at least ' + req.minTitleSize + 'pt for KDP'});
      }
      if(config.lineHeight && config.lineHeight < req.minLineHeight) {
        issues.push({severity:'warn', field:'lineHeight', message:'Line height below ' + req.minLineHeight + ' may cause readability issues'});
      }
      if(config.fontFamily && !this.FONTS[config.fontFamily]) {
        issues.push({severity:'warn', field:'fontFamily', message:'Font "' + config.fontFamily + '" may not be licensed for commercial use'});
      }

      return {
        valid: issues.filter(function(i){return i.severity === 'error';}).length === 0,
        issues: issues
      };
    },

    /**
     * Get font pairing suggestion based on book type
     */
    suggestPairing: function(bookType) {
      var type = (bookType || '').toLowerCase();
      if(type.indexOf('children') !== -1 || type.indexOf('kids') !== -1) {
        return this.PAIRINGS[6]; // Professional: Oswald + Open Sans
      }
      if(type.indexOf('senior') !== -1 || type.indexOf('large') !== -1) {
        return this.PAIRINGS[3]; // Unified: Inter + Inter (clean, readable)
      }
      if(type.indexOf('bible') !== -1 || type.indexOf('religious') !== -1) {
        return this.PAIRINGS[2]; // Elegant Classic: Raleway + Merriweather
      }
      if(type.indexOf('puzzle') !== -1 || type.indexOf('activity') !== -1) {
        return this.PAIRINGS[0]; // Modern Clean: Montserrat + Open Sans
      }
      return this.PAIRINGS[3]; // Default: Unified
    },

    /**
     * Calculate optimal font sizes based on page dimensions
     */
    calculateOptimalSizes: function(pageWidth, pageHeight, margin) {
      margin = margin || 50;
      var contentW = pageWidth - 2 * margin;
      var contentH = pageHeight - 2 * margin;

      // Title: ~8% of content height
      var titleSize = Math.round(contentH * 0.04);
      // Subtitle: ~6% of content height
      var subtitleSize = Math.round(contentH * 0.03);
      // Body: ~3% of content height
      var bodySize = Math.round(contentH * 0.02);
      // Footer: ~2% of content height
      var footerSize = Math.round(contentH * 0.015);

      // Ensure minimums
      titleSize = Math.max(titleSize, 14);
      subtitleSize = Math.max(subtitleSize, 11);
      bodySize = Math.max(bodySize, 9);
      footerSize = Math.max(footerSize, 7);

      return {
        title: titleSize,
        subtitle: subtitleSize,
        body: bodySize,
        footer: footerSize,
        lineHeight: Math.round(bodySize * 1.3)
      };
    },

    /**
     * Get all available fonts with their license info
     */
    getFontCatalog: function() {
      var catalog = [];
      for(var key in this.FONTS) {
        var font = this.FONTS[key];
        catalog.push({
          id: key,
          name: font.name,
          family: font.family,
          license: font.license,
          commercialUse: font.commercialUse,
          weights: Object.keys(font.weights),
          loaded: this._fontCache[font.name + '-Regular'] ? true : false
        });
      }
      return catalog;
    },

    /**
     * Wrap text to fit within a given width
     */
    wrapText: function(doc, text, maxWidth) {
      var words = text.split(' ');
      var lines = [];
      var currentLine = '';
      for(var i = 0; i < words.length; i++) {
        var testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
        var metrics = doc.getTextDimensions(testLine);
        if(metrics.w > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = words[i];
        } else {
          currentLine = testLine;
        }
      }
      if(currentLine) lines.push(currentLine);
      return lines;
    }
  };

  window.MXDTypography = TYPOGRAPHY;
  console.log('[MXD] Typography Engine v' + TYPOGRAPHY.version + ' loaded — 8 OFL fonts, pairings, KDP validation, dynamic loading');
})();
