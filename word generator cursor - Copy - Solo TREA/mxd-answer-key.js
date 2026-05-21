/**
 * MXD Answer Key Generator v1.0
 * Generates solution pages using the EXACT same puzzle data — same grid, same letters, same placements
 * Only the visualization changes (highlight, circle, dim, etc.)
 * 
 * PITFALLS AVOIDED:
 * - NEVER regenerates puzzles — uses exact same grid/placements from the generated puzzle
 * - Solutions must match puzzle letter-for-letter, position-for-position
 * - Supports all 8 solution styles consistently
 * - Solution pages are numbered separately from puzzle pages
 * - TOC for solutions page included
 * - Can export standalone solutions book or append to main PDF
 */
(function(){
  'use strict';

  var ANSWER_KEY = {
    version: '1.0',

    // Solution styles matching the puzzle engine
    SOLUTION_STYLES: [
      {id:'highlight', name:'Highlight Color', desc:'Words highlighted in color'},
      {id:'circle', name:'Colored Circle', desc:'Circles around each word'},
      {id:'black_circle', name:'Black Circle', desc:'Black circles around words'},
      {id:'square', name:'Color Square', desc:'Colored squares around words'},
      {id:'black_square', name:'Black Square', desc:'Black squares around words'},
      {id:'dim', name:'Dim Others', desc:'Solution letters normal, fillers dimmed'},
      {id:'lines', name:'Color Lines', desc:'Colored lines connecting letters'},
      {id:'outline', name:'Black Outline', desc:'Black outline around solution cells'}
    ],

    COLORS: ['#6c63ff','#22c55e','#f59e0b','#ef4444','#3b82f6','#ec4899','#14b8a6','#f97316','#8b5cf6','#06b6d4'],

    /**
     * Generate answer key PDF from existing puzzles
     * Uses the EXACT same puzzle objects — no regeneration
     * @param {Array} puzzles - Array of puzzle objects {grid, mask, placements, rows, cols}
     * @param {Object} cfg - Configuration
     * @param {Function} onProgress - Progress callback
     * @returns {Promise} jsPDF document
     */
    generate: function(puzzles, cfg, onProgress) {
      if(typeof jsPDF === 'undefined' && typeof window.jspdf !== 'undefined') {
        var jsPDF = window.jspdf.jsPDF;
      }
      if(typeof jsPDF === 'undefined') {
        return Promise.reject(new Error('jsPDF not loaded'));
      }

      cfg = cfg || {};
      var style = cfg.solutionStyle || 'highlight';
      var title = cfg.title || 'Answer Key';
      var cellSize = cfg.cellSize || 24;
      var trimSize = cfg.trimSize || 'letter';
      var includeTOC = cfg.includeTOC !== false;
      var showWordList = cfg.showWordList !== false;

      // Trim size dimensions in points
      var TRIM_SIZES = {
        'letter': [612, 792],
        'a4': [595, 842],
        '6x9': [432, 648],
        '8.5x11': [612, 792]
      };
      var pageSize = TRIM_SIZES[trimSize] || TRIM_SIZES['letter'];
      var pageW = pageSize[0];
      var pageH = pageSize[1];

      var doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: [pageW, pageH]
      });

      var totalPages = puzzles.length + (includeTOC ? 1 : 0);
      var currentPage = 0;

      // Solutions TOC page
      if(includeTOC) {
        currentPage++;
        if(onProgress) onProgress(currentPage, totalPages, 'Creating solutions index...');
        this._drawSolutionsTOC(doc, puzzles, title, pageW, pageH);
      }

      // Solution pages — one per puzzle, using EXACT same data
      for(var pi = 0; pi < puzzles.length; pi++) {
        currentPage++;
        if(onProgress) onProgress(currentPage, totalPages, 'Rendering solution ' + currentPage + ' of ' + totalPages + '...');
        var pz = puzzles[pi];
        this._drawSolutionPage(doc, pz, pi + 1, style, title, cellSize, showWordList, pageW, pageH);
        if(pi < puzzles.length - 1) {
          doc.addPage([pageW, pageH], 'portrait');
        }
      }

      return doc;
    },

    /**
     * Draw solutions table of contents page
     */
    _drawSolutionsTOC: function(doc, puzzles, title, pageW, pageH) {
      var margin = 50;
      var y = 80;

      // Title
      doc.setFontSize(28);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('SOLUTIONS INDEX', pageW / 2, y, {align: 'center'});
      y += 12;

      doc.setFontSize(11);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(title, pageW / 2, y, {align: 'center'});
      y += 30;

      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(1);
      doc.line(margin, y, pageW - margin, y);
      y += 20;

      // List entries
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      for(var i = 0; i < puzzles.length; i++) {
        var label = 'Puzzle ' + (i + 1);
        var wordCount = Object.keys(puzzles[i].placements).length;
        var gridSize = puzzles[i].rows + '×' + puzzles[i].cols;
        var entry = label + ' — ' + wordCount + ' words (' + gridSize + ')';
        doc.text(entry, margin, y);
        y += 18;
        if(y > pageH - 60) {
          doc.addPage([pageW, pageH], 'portrait');
          y = 60;
        }
      }
    },

    /**
     * Draw a single solution page using EXACT puzzle data
     * This is the critical function — it uses pz.grid, pz.placements directly
     * NO regeneration, NO modification of the puzzle data
     */
    _drawSolutionPage: function(doc, pz, pageNum, style, bookTitle, cellSize, showWordList, pageW, pageH) {
      var rows = pz.rows;
      var cols = pz.cols;
      var grid = pz.grid;
      var mask = pz.mask;
      var placements = pz.placements;
      var margin = 40;
      var availableW = pageW - 2 * margin;
      var availableH = pageH - 2 * margin;

      // Calculate cell size to fit page
      var maxCellW = Math.floor(availableW / cols);
      var maxCellH = Math.floor((availableH - (showWordList ? 80 : 40)) / rows);
      var cs = Math.min(maxCellW, maxCellH, cellSize || 18);
      cs = Math.max(cs, 8);

      var gridW = cols * cs;
      var gridH = rows * cs;
      var startX = (pageW - gridW) / 2;
      var startY = margin + 30;

      // Page title
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('SOLUTION — Puzzle ' + pageNum, pageW / 2, startY - 12, {align: 'center'});

      // Build solution set for fast lookup
      var solSet = {};
      var wordColors = {};
      var wordIndex = 0;
      var words = Object.keys(placements);
      for(var wi = 0; wi < words.length; wi++) {
        var w = words[wi];
        var cells = placements[w];
        wordColors[w] = this.COLORS[wordIndex % this.COLORS.length];
        for(var ci = 0; ci < cells.length; ci++) {
          var key = cells[ci][0] + ',' + cells[ci][1];
          solSet[key] = w;
        }
        wordIndex++;
      }

      // Draw grid cells
      for(var r = 0; r < rows; r++) {
        for(var c = 0; c < cols; c++) {
          if(!mask[r][c]) continue;
          var x = startX + c * cs;
          var y = startY + r * cs;
          var key = r + ',' + c;
          var isSol = solSet.hasOwnProperty(key);
          var solWord = solSet[key];

          // Cell background based on style
          if(isSol) {
            if(style === 'highlight' || style === 'lines') {
              var rgb = this._hexToRgb(wordColors[solWord]);
              doc.setFillColor(rgb[0], rgb[1], rgb[2]);
              doc.setFillColor(255, 255, 0); // Yellow highlight for visibility
              doc.rect(x, y, cs, cs, 'F');
            } else if(style === 'dim') {
              // Normal background for solution cells
              doc.setFillColor(255, 255, 255);
              doc.rect(x, y, cs, cs, 'F');
            }
          } else {
            if(style === 'dim') {
              doc.setFillColor(230, 230, 235);
              doc.rect(x, y, cs, cs, 'F');
            } else {
              doc.setFillColor(255, 255, 255);
              doc.rect(x, y, cs, cs, 'F');
            }
          }

          // Cell border
          doc.setDrawColor(220, 220, 230);
          doc.setLineWidth(0.5);
          doc.rect(x, y, cs, cs, 'S');

          // Cell letter
          var letter = grid[r][c];
          var fontSize = Math.max(cs * 0.5, 7);
          doc.setFontSize(fontSize);
          doc.setFont(undefined, 'bold');

          if(style === 'dim') {
            if(isSol) {
              doc.setTextColor(15, 23, 42);
            } else {
              doc.setTextColor(180, 180, 190);
            }
          } else {
            doc.setTextColor(15, 23, 42);
          }

          doc.text(letter, x + cs / 2, y + cs / 2 + fontSize * 0.3, {align: 'center'});

          // Style-specific overlays
          if(isSol) {
            var color = wordColors[solWord];
            var rgb = this._hexToRgb(color);

            if(style === 'circle' || style === 'black_circle') {
              var cx = x + cs / 2;
              var cy = y + cs / 2;
              var radius = cs * 0.48;
              if(style === 'circle') {
                doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
              } else {
                doc.setDrawColor(0, 0, 0);
              }
              doc.setLineWidth(1.5);
              doc.circle(cx, cy, radius, 'S');
            } else if(style === 'square' || style === 'black_square') {
              if(style === 'square') {
                doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
              } else {
                doc.setDrawColor(0, 0, 0);
              }
              doc.setLineWidth(1.5);
              doc.rect(x + 1, y + 1, cs - 2, cs - 2, 'S');
            } else if(style === 'outline') {
              doc.setDrawColor(0, 0, 0);
              doc.setLineWidth(2);
              doc.rect(x + 0.5, y + 0.5, cs - 1, cs - 1, 'S');
            }
          }
        }
      }

      // Draw solution lines for 'lines' style
      if(style === 'lines') {
        for(var wi2 = 0; wi2 < words.length; wi2++) {
          var w2 = words[wi2];
          var cells2 = placements[w2];
          if(cells2.length < 2) continue;
          var rgb2 = this._hexToRgb(wordColors[w2]);
          doc.setDrawColor(rgb2[0], rgb2[1], rgb2[2]);
          doc.setLineWidth(cs * 0.55);
          doc.setLineCap('round');
          var first = cells2[0];
          var last = cells2[cells2.length - 1];
          var x1 = startX + first[1] * cs + cs / 2;
          var y1 = startY + first[0] * cs + cs / 2;
          var x2 = startX + last[1] * cs + cs / 2;
          var y2 = startY + last[0] * cs + cs / 2;
          doc.setDrawColor(255, 200, 50);
          doc.line(x1, y1, x2, y2);
        }
      }

      // Word list below grid
      if(showWordList) {
        var wordListY = startY + gridH + 20;
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('Words Found:', pageW / 2, wordListY, {align: 'center'});
        wordListY += 14;

        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        var cols2 = Math.min(4, Math.ceil(words.length / 6));
        var colW = (pageW - 2 * margin) / cols2;
        for(var wi3 = 0; wi3 < words.length; wi3++) {
          var col = wi3 % cols2;
          var row2 = Math.floor(wi3 / cols2);
          var wx = margin + col * colW + 5;
          var wy = wordListY + row2 * 14;
          var rgb3 = this._hexToRgb(wordColors[words[wi3]]);
          doc.setFillColor(rgb3[0], rgb3[1], rgb3[2]);
          doc.circle(wx + 3, wy - 2, 2.5, 'F');
          doc.setTextColor(15, 23, 42);
          doc.text(words[wi3].toUpperCase(), wx + 8, wy);
        }
      }

      // Footer
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(bookTitle + ' — Solutions', pageW / 2, pageH - 20, {align: 'center'});
      doc.text('Page ' + pageNum, pageW - margin, pageH - 20, {align: 'right'});
    },

    /**
     * Append solution pages to an existing PDF document
     * This allows adding solutions to the end of the main puzzle book
     */
    appendToPDF: function(doc, puzzles, cfg, onProgress) {
      cfg = cfg || {};
      var style = cfg.solutionStyle || 'highlight';
      var title = cfg.title || 'Answer Key';
      var cellSize = cfg.cellSize || 24;
      var showWordList = cfg.showWordList !== false;

      for(var pi = 0; pi < puzzles.length; pi++) {
        if(onProgress) onProgress(pi + 1, puzzles.length, 'Adding solution page ' + (pi + 1) + '...');
        var pz = puzzles[pi];
        var pageNum = pi + 1;
        doc.addPage();
        // Get current page dimensions
        var pageW = doc.internal.pageSize.getWidth();
        var pageH = doc.internal.pageSize.getHeight();
        this._drawSolutionPage(doc, pz, pageNum, style, title, cellSize, showWordList, pageW, pageH);
      }

      return doc;
    },

    /**
     * Generate a standalone solutions book (separate PDF)
     */
    generateStandaloneBook: function(puzzles, cfg, onProgress) {
      return this.generate(puzzles, Object.assign({includeTOC: true}, cfg), onProgress);
    },

    _hexToRgb: function(hex) {
      if(!hex || hex.length < 7) return [100, 100, 100];
      var r = parseInt(hex.slice(1, 3), 16);
      var g = parseInt(hex.slice(3, 5), 16);
      var b = parseInt(hex.slice(5, 7), 16);
      return [r, g, b];
    }
  };

  window.MXDAnswerKey = ANSWER_KEY;
  console.log('[MXD] Answer Key Generator v' + ANSWER_KEY.version + ' loaded — uses exact puzzle data, 8 solution styles, standalone or appended');
})();
