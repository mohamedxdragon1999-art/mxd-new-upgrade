// mxd-pdf-export.js — Professional PDF Export Engine v2.0
// Single puzzle, bulk books, TOC, KDP trim sizes, solution pages, cover generation
// Works 100% offline with jsPDF — no server required

(function(){
  'use strict';

  var VERSION = '2.0.0';

  // ============================================================
  // KDP TRIM SIZE PRESETS
  // ============================================================
  var KDP_TRIM_SIZES = {
    '6x9':       { name: '6" x 9" (Trade)',       width: 6,   height: 9,   unit: 'in' },
    '8.5x11':    { name: '8.5" x 11" (Letter)',   width: 8.5, height: 11,  unit: 'in' },
    '8x10':      { name: '8" x 10"',              width: 8,   height: 10,  unit: 'in' },
    '8.5x8.5':   { name: '8.5" x 8.5" (Square)',  width: 8.5, height: 8.5, unit: 'in' },
    '7x10':      { name: '7" x 10"',              width: 7,   height: 10,  unit: 'in' },
    '5x8':       { name: '5" x 8" (Compact)',     width: 5,   height: 8,   unit: 'in' },
    '5.5x8.5':   { name: '5.5" x 8.5" (Digest)',  width: 5.5, height: 8.5, unit: 'in' },
    '6x6':       { name: '6" x 6" (Square)',      width: 6,   height: 6,   unit: 'in' },
    '4x6':       { name: '4" x 6" (Pocket)',      width: 4,   height: 6,   unit: 'in' },
    'A4':        { name: 'A4 (210 x 297 mm)',     width: 210, height: 297, unit: 'mm' },
    'A5':        { name: 'A5 (148 x 210 mm)',     width: 148, height: 210, unit: 'mm' }
  };

  // ============================================================
  // MARGIN PRESETS
  // ============================================================
  var MARGIN_PRESETS = {
    'standard': { top: 0.75, bottom: 0.75, left: 0.75, right: 0.75, unit: 'in' },
    'narrow':   { top: 0.5,  bottom: 0.5,  left: 0.5,  right: 0.5,  unit: 'in' },
    'wide':     { top: 1.0,  bottom: 1.0,  left: 1.0,  right: 1.0,  unit: 'in' },
    'kdp':      { top: 0.75, bottom: 0.75, left: 0.875, right: 0.625, unit: 'in' } // KDP gutter
  };

  // ============================================================
  // COLOR THEMES FOR PDF
  // ============================================================
  var PDF_THEMES = {
    'classic':    { bg: [255,255,255], text: [26,26,46], cell: [45,45,68], accent: [201,162,39], grid: [200,200,200], solution: [201,162,39], solutionBg: [255,248,225] },
    'bw':         { bg: [255,255,255], text: [0,0,0],     cell: [0,0,0],     accent: [100,100,100], grid: [180,180,180], solution: [0,0,0],         solutionBg: [240,240,240] },
    'blue':       { bg: [239,246,255], text: [30,58,95],  cell: [30,64,175], accent: [37,99,235],   grid: [191,219,254], solution: [37,99,235],     solutionBg: [219,234,254] },
    'green':      { bg: [240,253,244], text: [20,83,45],  cell: [22,101,52], accent: [34,197,94],   grid: [187,247,208], solution: [22,101,52],     solutionBg: [220,252,231] },
    'dark':       { bg: [15,23,42],    text: [226,232,240], cell: [148,163,184], accent: [99,102,241], grid: [51,65,85],    solution: [99,102,241],  solutionBg: [30,41,59] },
    'gold':       { bg: [255,251,235], text: [120,53,15], cell: [146,64,14], accent: [201,162,39],  grid: [253,230,138], solution: [201,162,39],    solutionBg: [254,243,199] }
  };

  // ============================================================
  // PDF EXPORT ENGINE
  // ============================================================
  function PdfExportEngine() {
    this.version = VERSION;
    this.jsPDF = null;
    this.initialized = false;
  }

  PdfExportEngine.prototype.init = function() {
    if (this.initialized) return true;
    if (window.jspdf && window.jspdf.jsPDF) {
      this.jsPDF = window.jspdf.jsPDF;
      this.initialized = true;
      console.log('[MXD PDF Export] v' + VERSION + ' initialized');
      return true;
    }
    console.warn('[MXD PDF Export] jsPDF not loaded');
    return false;
  };

  // ============================================================
  // SINGLE PUZZLE EXPORT
  // ============================================================
  PdfExportEngine.prototype.exportSingle = function(puzzle, options) {
    if (!this.init()) return null;

    options = options || {};
    var trimSize = KDP_TRIM_SIZES[options.trimSize || '8.5x11'] || KDP_TRIM_SIZES['8.5x11'];
    var margins = MARGIN_PRESETS[options.margins || 'standard'] || MARGIN_PRESETS['standard'];
    var theme = PDF_THEMES[options.theme || 'classic'] || PDF_THEMES['classic'];

    var unit = trimSize.unit === 'in' ? 'in' : 'mm';
    var doc = new this.jsPDF({
      orientation: trimSize.width > trimSize.height ? 'landscape' : 'portrait',
      unit: unit,
      format: [trimSize.width, trimSize.height]
    });

    // Convert margins to document units
    var marginTop = this._convertUnit(margins.top, margins.unit, unit);
    var marginBottom = this._convertUnit(margins.bottom, margins.unit, unit);
    var marginLeft = this._convertUnit(margins.left, margins.unit, unit);
    var marginRight = this._convertUnit(margins.right, margins.unit, unit);

    var pageW = trimSize.width;
    var pageH = trimSize.height;
    var availW = pageW - marginLeft - marginRight;
    var availH = pageH - marginTop - marginBottom;

    // Background
    doc.setFillColor.apply(doc, theme.bg);
    doc.rect(0, 0, pageW, pageH, 'F');

    // Title
    var title = options.title || puzzle.title || 'Word Search Puzzle';
    doc.setFont('helvetica', 'bold');
    var titleSize = this._fitFontSize(doc, title, availW, 24, 12, unit);
    doc.setFontSize(titleSize);
    doc.setTextColor.apply(doc, theme.text);
    doc.text(title, pageW / 2, marginTop + titleSize * 0.6, { align: 'center' });

    // Subtitle (if provided)
    if (options.subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(titleSize * 0.5);
      doc.setTextColor(128, 128, 128);
      doc.text(options.subtitle, pageW / 2, marginTop + titleSize * 1.2, { align: 'center' });
    }

    // Calculate grid dimensions
    var rows = puzzle.grid ? puzzle.grid.length : 0;
    var cols = puzzle.grid && puzzle.grid[0] ? puzzle.grid[0].length : 0;
    if (rows === 0 || cols === 0) return null;

    // Grid area
    var titleBlockH = titleSize * 1.8;
    var gridTop = marginTop + titleBlockH;
    var gridAvailH = availH - titleBlockH;

    // Word list area (below grid)
    var wordListH = 0.8; // inches
    var gridAvailH2 = gridAvailH - wordListH;

    // Cell size
    var cellByW = availW / cols;
    var cellByH = gridAvailH2 / rows;
    var cellSize = Math.min(cellByW, cellByH);

    // Center grid
    var gridW = cellSize * cols;
    var gridH = cellSize * rows;
    var gridLeft = marginLeft + (availW - gridW) / 2;
    var gridTop2 = gridTop + (gridAvailH2 - gridH) / 2;

    // Draw grid
    doc.setFont('helvetica', 'normal');
    var fontSize = cellSize * 0.55;
    if (fontSize < 4) fontSize = 4;
    if (fontSize > 18) fontSize = 18;
    doc.setFontSize(fontSize);

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var x = gridLeft + c * cellSize;
        var y = gridTop2 + r * cellSize;
        var letter = puzzle.grid[r][c] || '';

        // Cell background
        if (options.showGridBg !== false) {
          doc.setFillColor(255, 255, 255);
          doc.rect(x, y, cellSize, cellSize, 'F');
        }

        // Cell border
        if (options.showGridLines !== false) {
          doc.setDrawColor.apply(doc, theme.grid);
          doc.setLineWidth(0.005);
          doc.rect(x, y, cellSize, cellSize, 'S');
        }

        // Letter
        if (letter) {
          doc.setTextColor.apply(doc, theme.cell);
          doc.text(letter, x + cellSize / 2, y + cellSize * 0.68, { align: 'center' });
        }
      }
    }

    // Word list
    var words = puzzle.words || Object.keys(puzzle.placements || {});
    if (words && words.length > 0) {
      var wlTop = gridTop2 + gridH + 0.15;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(fontSize * 0.8);
      doc.setTextColor.apply(doc, theme.text);
      doc.text('Find these words:', pageW / 2, wlTop, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSize * 0.7);
      doc.setTextColor.apply(doc, theme.cell);

      var wordCols = 3;
      if (words.length > 30) wordCols = 4;
      if (words.length > 50) wordCols = 5;
      var wordsPerCol = Math.ceil(words.length / wordCols);
      var wordColW = availW / wordCols;

      for (var i = 0; i < words.length; i++) {
        var col = Math.floor(i / wordsPerCol);
        var row = i % wordsPerCol;
        var wx = marginLeft + col * wordColW + 0.05;
        var wy = wlTop + 0.15 + row * 0.12;
        doc.text(words[i], wx, wy);
      }
    }

    // Footer
    if (options.footer !== false) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      var footerText = options.footerText || 'MXD Puzzle Generator';
      doc.text(footerText, pageW / 2, pageH - marginBottom * 0.4, { align: 'center' });
    }

    return doc;
  };

  // ============================================================
  // SINGLE PUZZLE + SOLUTION (2 pages)
  // ============================================================
  PdfExportEngine.prototype.exportWithSolution = function(puzzle, options) {
    if (!this.init()) return null;

    options = options || {};
    var doc = this.exportSingle(puzzle, options);
    if (!doc) return null;

    // Add solution page
    doc.addPage();
    this._drawSolutionPage(doc, puzzle, options);

    return doc;
  };

  // ============================================================
  // BULK BOOK EXPORT (multiple puzzles)
  // ============================================================
  PdfExportEngine.prototype.exportBook = function(puzzles, options) {
    if (!this.init()) return null;
    if (!puzzles || puzzles.length === 0) return null;

    options = options || {};
    var trimSize = KDP_TRIM_SIZES[options.trimSize || '8.5x11'] || KDP_TRIM_SIZES['8.5x11'];
    var margins = MARGIN_PRESETS[options.margins || 'kdp'] || MARGIN_PRESETS['kdp'];
    var theme = PDF_THEMES[options.theme || 'classic'] || PDF_THEMES['classic'];
    var unit = trimSize.unit === 'in' ? 'in' : 'mm';

    var doc = new this.jsPDF({
      orientation: trimSize.width > trimSize.height ? 'landscape' : 'portrait',
      unit: unit,
      format: [trimSize.width, trimSize.height]
    });

    var pageW = trimSize.width;
    var pageH = trimSize.height;

    // Page 1: Cover
    if (options.cover !== false) {
      this._drawCoverPage(doc, options, theme, pageW, pageH);
    }

    // Page 2: Table of Contents
    if (options.toc !== false) {
      if (options.cover !== false) doc.addPage();
      this._drawTOC(doc, puzzles, options, theme, pageW, pageH);
    }

    // Puzzle pages
    for (var i = 0; i < puzzles.length; i++) {
      var puzzle = puzzles[i];
      var pageNum = (options.cover !== false ? 1 : 0) + (options.toc !== false ? 1 : 0) + i * (options.includeSolutions ? 2 : 1) + 1;

      // Puzzle page
      if (options.cover !== false || options.toc !== false || i > 0) {
        doc.addPage();
      }
      this._drawBookPuzzlePage(doc, puzzle, options, theme, pageW, pageH, pageNum);

      // Solution page
      if (options.includeSolutions) {
        doc.addPage();
        this._drawBookSolutionPage(doc, puzzle, options, theme, pageW, pageH, pageNum + 1);
      }
    }

    return doc;
  };

  // ============================================================
  // COVER PAGE
  // ============================================================
  PdfExportEngine.prototype._drawCoverPage = function(doc, options, theme, pageW, pageH) {
    // Background
    doc.setFillColor.apply(doc, theme.bg);
    doc.rect(0, 0, pageW, pageH, 'F');

    // Decorative border
    var borderInset = 0.4;
    doc.setDrawColor.apply(doc, theme.accent);
    doc.setLineWidth(0.05);
    doc.rect(borderInset, borderInset, pageW - borderInset * 2, pageH - borderInset * 2, 'S');

    // Inner border
    var innerInset = 0.5;
    doc.setLineWidth(0.02);
    doc.rect(innerInset, innerInset, pageW - innerInset * 2, pageH - innerInset * 2, 'S');

    // Title
    var title = options.bookTitle || 'Word Search Puzzle Book';
    doc.setFont('helvetica', 'bold');
    var titleSize = this._fitFontSize(doc, title, pageW - 1.5, 48, 18, 'in');
    doc.setFontSize(titleSize);
    doc.setTextColor.apply(doc, theme.text);
    doc.text(title, pageW / 2, pageH * 0.35, { align: 'center' });

    // Subtitle
    if (options.bookSubtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(titleSize * 0.4);
      doc.setTextColor(128, 128, 128);
      doc.text(options.bookSubtitle, pageW / 2, pageH * 0.45, { align: 'center' });
    }

    // Puzzle count
    var puzzleCount = options.puzzleCount || 0;
    if (puzzleCount > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(titleSize * 0.3);
      doc.setTextColor.apply(doc, theme.accent);
      doc.text(puzzleCount + ' Puzzles', pageW / 2, pageH * 0.55, { align: 'center' });
    }

    // Author
    if (options.author) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(titleSize * 0.25);
      doc.setTextColor(100, 100, 100);
      doc.text('by ' + options.author, pageW / 2, pageH * 0.7, { align: 'center' });
    }

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Generated with MXD Puzzle Generator', pageW / 2, pageH - 0.6, { align: 'center' });
  };

  // ============================================================
  // TABLE OF CONTENTS
  // ============================================================
  PdfExportEngine.prototype._drawTOC = function(doc, puzzles, options, theme, pageW, pageH) {
    var margins = MARGIN_PRESETS[options.margins || 'kdp'] || MARGIN_PRESETS['kdp'];
    var marginLeft = this._convertUnit(margins.left, margins.unit, 'in');
    var marginRight = this._convertUnit(margins.right, margins.unit, 'in');
    var marginTop = this._convertUnit(margins.top, margins.unit, 'in');
    var availW = pageW - marginLeft - marginRight;

    // Background
    doc.setFillColor.apply(doc, theme.bg);
    doc.rect(0, 0, pageW, pageH, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor.apply(doc, theme.text);
    doc.text('Contents', pageW / 2, marginTop + 0.5, { align: 'center' });

    // Divider line
    doc.setDrawColor.apply(doc, theme.accent);
    doc.setLineWidth(0.03);
    doc.line(pageW / 2 - 1, marginTop + 0.65, pageW / 2 + 1, marginTop + 0.65);

    // TOC entries
    var startY = marginTop + 0.9;
    var lineH = 0.25;
    var currentY = startY;
    var pageNum = (options.cover !== false ? 1 : 0) + (options.toc !== false ? 1 : 0) + 1;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    for (var i = 0; i < puzzles.length; i++) {
      var puzzle = puzzles[i];
      var puzzleTitle = puzzle.title || ('Puzzle ' + (i + 1));
      var wordCount = (puzzle.words || Object.keys(puzzle.placements || {})).length;

      // Check if we need a new page
      if (currentY + lineH > pageH - 0.75) {
        doc.addPage();
        doc.setFillColor.apply(doc, theme.bg);
        doc.rect(0, 0, pageW, pageH, 'F');
        currentY = marginTop + 0.5;
      }

      // Title
      doc.setTextColor.apply(doc, theme.text);
      doc.text(puzzleTitle, marginLeft, currentY);

      // Word count
      doc.setTextColor(128, 128, 128);
      doc.setFontSize(9);
      doc.text('(' + wordCount + ' words)', marginLeft + 3.5, currentY);

      // Page number
      doc.setFontSize(11);
      doc.setTextColor.apply(doc, theme.accent);
      doc.text(String(pageNum), pageW - marginRight, currentY, { align: 'right' });

      // Dotted line
      var titleW = doc.getTextWidth(puzzleTitle) + doc.getTextWidth('(' + wordCount + ' words)') + 0.3;
      var pageNumW = doc.getTextWidth(String(pageNum));
      var dotStart = marginLeft + titleW;
      var dotEnd = pageW - marginRight - pageNumW - 0.1;
      if (dotEnd > dotStart) {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.01);
        for (var dx = dotStart; dx < dotEnd; dx += 0.08) {
          doc.line(dx, currentY - 0.03, dx + 0.04, currentY - 0.03);
        }
      }

      currentY += lineH;
      doc.setFontSize(11);

      // Increment page number for solution pages if included
      pageNum += options.includeSolutions ? 2 : 1;
    }
  };

  // ============================================================
  // BOOK PUZZLE PAGE
  // ============================================================
  PdfExportEngine.prototype._drawBookPuzzlePage = function(doc, puzzle, options, theme, pageW, pageH, pageNum) {
    var margins = MARGIN_PRESETS[options.margins || 'kdp'] || MARGIN_PRESETS['kdp'];
    var unit = 'in';

    var marginTop = this._convertUnit(margins.top, margins.unit, unit);
    var marginBottom = this._convertUnit(margins.bottom, margins.unit, unit);
    var marginLeft = this._convertUnit(margins.left, margins.unit, unit);
    var marginRight = this._convertUnit(margins.right, margins.unit, unit);
    var availW = pageW - marginLeft - marginRight;
    var availH = pageH - marginTop - marginBottom;

    // Background
    doc.setFillColor.apply(doc, theme.bg);
    doc.rect(0, 0, pageW, pageH, 'F');

    // Puzzle title
    var title = puzzle.title || ('Puzzle ' + pageNum);
    doc.setFont('helvetica', 'bold');
    var titleSize = this._fitFontSize(doc, title, availW, 18, 10, unit);
    doc.setFontSize(titleSize);
    doc.setTextColor.apply(doc, theme.text);
    doc.text(title, pageW / 2, marginTop + titleSize * 0.6, { align: 'center' });

    // Grid
    var rows = puzzle.grid ? puzzle.grid.length : 0;
    var cols = puzzle.grid && puzzle.grid[0] ? puzzle.grid[0].length : 0;
    if (rows === 0 || cols === 0) return;

    var titleBlockH = titleSize * 1.5;
    var gridTop = marginTop + titleBlockH;
    var wordListH = 0.7;
    var gridAvailH = availH - titleBlockH - wordListH;

    var cellByW = availW / cols;
    var cellByH = gridAvailH / rows;
    var cellSize = Math.min(cellByW, cellByH);

    var gridW = cellSize * cols;
    var gridH = cellSize * rows;
    var gridLeft = marginLeft + (availW - gridW) / 2;
    var gridTop2 = gridTop + (gridAvailH - gridH) / 2;

    // Draw grid
    doc.setFont('helvetica', 'normal');
    var fontSize = cellSize * 0.55;
    if (fontSize < 4) fontSize = 4;
    if (fontSize > 14) fontSize = 14;
    doc.setFontSize(fontSize);

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var x = gridLeft + c * cellSize;
        var y = gridTop2 + r * cellSize;
        var letter = puzzle.grid[r][c] || '';

        if (options.showGridBg !== false) {
          doc.setFillColor(255, 255, 255);
          doc.rect(x, y, cellSize, cellSize, 'F');
        }

        if (options.showGridLines !== false) {
          doc.setDrawColor.apply(doc, theme.grid);
          doc.setLineWidth(0.005);
          doc.rect(x, y, cellSize, cellSize, 'S');
        }

        if (letter) {
          doc.setTextColor.apply(doc, theme.cell);
          doc.text(letter, x + cellSize / 2, y + cellSize * 0.68, { align: 'center' });
        }
      }
    }

    // Word list
    var words = puzzle.words || Object.keys(puzzle.placements || {});
    if (words && words.length > 0) {
      var wlTop = gridTop2 + gridH + 0.1;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(fontSize * 0.75);
      doc.setTextColor.apply(doc, theme.text);
      doc.text('Find these words:', pageW / 2, wlTop, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSize * 0.65);
      doc.setTextColor.apply(doc, theme.cell);

      var wordCols = 3;
      if (words.length > 25) wordCols = 4;
      if (words.length > 40) wordCols = 5;
      var wordsPerCol = Math.ceil(words.length / wordCols);
      var wordColW = availW / wordCols;

      for (var i = 0; i < words.length; i++) {
        var col = Math.floor(i / wordsPerCol);
        var row = i % wordsPerCol;
        var wx = marginLeft + col * wordColW + 0.03;
        var wy = wlTop + 0.12 + row * 0.1;
        doc.text(words[i], wx, wy);
      }
    }

    // Page number
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(String(pageNum), pageW / 2, pageH - marginBottom * 0.4, { align: 'center' });
  };

  // ============================================================
  // SOLUTION PAGE
  // ============================================================
  PdfExportEngine.prototype._drawSolutionPage = function(doc, puzzle, options) {
    options = options || {};
    var trimSize = KDP_TRIM_SIZES[options.trimSize || '8.5x11'] || KDP_TRIM_SIZES['8.5x11'];
    var margins = MARGIN_PRESETS[options.margins || 'standard'] || MARGIN_PRESETS['standard'];
    var theme = PDF_THEMES[options.theme || 'classic'] || PDF_THEMES['classic'];
    var unit = trimSize.unit === 'in' ? 'in' : 'mm';

    var pageW = trimSize.width;
    var pageH = trimSize.height;
    var marginTop = this._convertUnit(margins.top, margins.unit, unit);
    var marginBottom = this._convertUnit(margins.bottom, margins.unit, unit);
    var marginLeft = this._convertUnit(margins.left, margins.unit, unit);
    var marginRight = this._convertUnit(margins.right, margins.unit, unit);
    var availW = pageW - marginLeft - marginRight;
    var availH = pageH - marginTop - marginBottom;

    // Background
    doc.setFillColor.apply(doc, theme.bg);
    doc.rect(0, 0, pageW, pageH, 'F');

    // Title
    var title = (options.title || puzzle.title || 'Word Search') + ' — Solution';
    doc.setFont('helvetica', 'bold');
    var titleSize = this._fitFontSize(doc, title, availW, 20, 10, unit);
    doc.setFontSize(titleSize);
    doc.setTextColor.apply(doc, theme.accent);
    doc.text(title, pageW / 2, marginTop + titleSize * 0.6, { align: 'center' });

    // Grid
    var rows = puzzle.grid ? puzzle.grid.length : 0;
    var cols = puzzle.grid && puzzle.grid[0] ? puzzle.grid[0].length : 0;
    if (rows === 0 || cols === 0) return;

    var titleBlockH = titleSize * 1.5;
    var gridTop = marginTop + titleBlockH;
    var wordListH = 0.7;
    var gridAvailH = availH - titleBlockH - wordListH;

    var cellByW = availW / cols;
    var cellByH = gridAvailH / rows;
    var cellSize = Math.min(cellByW, cellByH);

    var gridW = cellSize * cols;
    var gridH = cellSize * rows;
    var gridLeft = marginLeft + (availW - gridW) / 2;
    var gridTop2 = gridTop + (gridAvailH - gridH) / 2;

    // Draw grid with solution highlighting
    doc.setFont('helvetica', 'normal');
    var fontSize = cellSize * 0.55;
    if (fontSize < 4) fontSize = 4;
    if (fontSize > 14) fontSize = 14;
    doc.setFontSize(fontSize);

    // Build solution cell map
    var solutionCells = {};
    var placements = puzzle.placements || {};
    for (var word in placements) {
      var cells = placements[word];
      if (cells && Array.isArray(cells)) {
        for (var ci = 0; ci < cells.length; ci++) {
          var key = cells[ci][0] + ',' + cells[ci][1];
          solutionCells[key] = word;
        }
      }
    }

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var x = gridLeft + c * cellSize;
        var y = gridTop2 + r * cellSize;
        var letter = puzzle.grid[r][c] || '';
        var key = r + ',' + c;
        var isSolution = solutionCells[key] !== undefined;

        // Cell background
        if (isSolution) {
          doc.setFillColor.apply(doc, theme.solutionBg);
        } else if (options.showGridBg !== false) {
          doc.setFillColor(255, 255, 255);
        }
        doc.rect(x, y, cellSize, cellSize, 'F');

        // Cell border
        if (options.showGridLines !== false) {
          if (isSolution) {
            doc.setDrawColor.apply(doc, theme.solution);
            doc.setLineWidth(0.015);
          } else {
            doc.setDrawColor.apply(doc, theme.grid);
            doc.setLineWidth(0.005);
          }
          doc.rect(x, y, cellSize, cellSize, 'S');
        }

        // Letter
        if (letter) {
          if (isSolution) {
            doc.setTextColor.apply(doc, theme.solution);
            doc.setFont('helvetica', 'bold');
          } else {
            doc.setTextColor(180, 180, 180);
            doc.setFont('helvetica', 'normal');
          }
          doc.text(letter, x + cellSize / 2, y + cellSize * 0.68, { align: 'center' });
        }
      }
    }

    // Word list with checkmarks
    var words = puzzle.words || Object.keys(placements);
    if (words && words.length > 0) {
      var wlTop = gridTop2 + gridH + 0.1;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(fontSize * 0.75);
      doc.setTextColor.apply(doc, theme.text);
      doc.text('Solution Words:', pageW / 2, wlTop, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSize * 0.65);
      doc.setTextColor.apply(doc, theme.solution);

      var wordCols = 3;
      if (words.length > 25) wordCols = 4;
      if (words.length > 40) wordCols = 5;
      var wordsPerCol = Math.ceil(words.length / wordCols);
      var wordColW = availW / wordCols;

      for (var i = 0; i < words.length; i++) {
        var col = Math.floor(i / wordsPerCol);
        var row = i % wordsPerCol;
        var wx = marginLeft + col * wordColW + 0.03;
        var wy = wlTop + 0.12 + row * 0.1;
        doc.text('\u2713 ' + words[i], wx, wy);
      }
    }
  };

  PdfExportEngine.prototype._drawBookSolutionPage = function(doc, puzzle, options, theme, pageW, pageH, pageNum) {
    this._drawSolutionPage(doc, puzzle, options);

    // Add page number
    var margins = MARGIN_PRESETS[options.margins || 'kdp'] || MARGIN_PRESETS['kdp'];
    var marginBottom = this._convertUnit(margins.bottom, margins.unit, 'in');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(String(pageNum), pageW / 2, pageH - marginBottom * 0.4, { align: 'center' });
  };

  // ============================================================
  // UTILITY: Convert units
  // ============================================================
  PdfExportEngine.prototype._convertUnit = function(value, fromUnit, toUnit) {
    if (fromUnit === toUnit) return value;
    if (fromUnit === 'in' && toUnit === 'mm') return value * 25.4;
    if (fromUnit === 'mm' && toUnit === 'in') return value / 25.4;
    return value;
  };

  // ============================================================
  // UTILITY: Fit font size to width
  // ============================================================
  PdfExportEngine.prototype._fitFontSize = function(doc, text, maxWidth, maxFontSize, minFontSize, unit) {
    for (var size = maxFontSize; size >= minFontSize; size -= 0.5) {
      doc.setFontSize(size);
      var textWidth = doc.getTextWidth(text);
      if (textWidth <= maxWidth) return size;
    }
    return minFontSize;
  };

  // ============================================================
  // EXPORT: Download PDF
  // ============================================================
  PdfExportEngine.prototype.download = function(doc, filename) {
    if (!doc) return;
    filename = filename || 'puzzle.pdf';
    if (!filename.toLowerCase().endsWith('.pdf')) filename += '.pdf';
    doc.save(filename);
  };

  // ============================================================
  // EXPORT: Get PDF as Blob
  // ============================================================
  PdfExportEngine.prototype.getBlob = function(doc) {
    if (!doc) return null;
    return doc.output('blob');
  };

  // ============================================================
  // EXPORT: Get PDF as Data URL
  // ============================================================
  PdfExportEngine.prototype.getDataUrl = function(doc) {
    if (!doc) return null;
    return doc.output('dataurlstring');
  };

  // ============================================================
  // EXPORT: Quick single puzzle download
  // ============================================================
  PdfExportEngine.prototype.quickExport = function(puzzle, options) {
    var doc = this.exportSingle(puzzle, options);
    if (doc) {
      this.download(doc, options.filename || (puzzle.title || 'puzzle') + '.pdf');
    }
    return doc;
  };

  // ============================================================
  // EXPORT: Quick book download
  // ============================================================
  PdfExportEngine.prototype.quickBook = function(puzzles, options) {
    var doc = this.exportBook(puzzles, options);
    if (doc) {
      this.download(doc, options.filename || 'puzzle-book.pdf');
    }
    return doc;
  };

  // ============================================================
  // INITIALIZATION
  // ============================================================
  function init() {
    var engine = new PdfExportEngine();
    window.PdfExport = engine;
    console.log('[MXD PDF Export] v' + VERSION + ' loaded');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export
  window.PdfExportEngine = PdfExportEngine;
  window.KDP_TRIM_SIZES = KDP_TRIM_SIZES;
  window.MARGIN_PRESETS = MARGIN_PRESETS;
  window.PDF_THEMES = PDF_THEMES;
})();
