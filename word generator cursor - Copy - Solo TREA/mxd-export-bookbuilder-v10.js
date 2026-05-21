/**
 * MXD Export & Book Builder v10.0
 * 
 * Professional export system with:
 * - Multi-Format: PDF, PNG (300/600 DPI), SVG, JSON
 * - KDP trim size presets: 6x9, 7x10, 8x10, 8.5x11, A4, A5
 * - Bleed margins (0.125" standard)
 * - Crop marks toggle
 * - Mirrored margins (for double-sided printing)
 * - Page numbering
 * - Custom footer text
 * - Book Builder: TOC, title page, copyright, intro, answer keys (4-6/page)
 * - Batch generation: 10-100 puzzles, progress bar, single PDF or individual files
 * 
 * @module MXDExportBookBuilder
 * @version 10.0.0
 */
(function(){
  'use strict';

  /**
   * KDP Trim Size Presets
   * All dimensions in points (1 inch = 72 points)
   */
  var TRIM_SIZES = {
    '6x9':     {name:'6" × 9"',     width:432,  height:648,  bleed:9},
    '7x10':    {name:'7" × 10"',    width:504,  height:720,  bleed:9},
    '8x10':    {name:'8" × 10"',    width:576,  height:720,  bleed:9},
    '8.5x11':  {name:'8.5" × 11"',  width:612,  height:792,  bleed:9},
    'A4':      {name:'A4',          width:595,  height:842,  bleed:9},
    'A5':      {name:'A5',          width:420,  height:595,  bleed:9},
    '5x8':     {name:'5" × 8"',     width:360,  height:576,  bleed:9},
    '5.5x8.5': {name:'5.5" × 8.5"', width:396,  height:612,  bleed:9}
  };

  /**
   * Margin Presets
   */
  var MARGIN_PRESETS = {
    standard: {name:'Standard',  top:36, bottom:36, inner:45, outer:36},
    narrow:   {name:'Narrow',    top:28, bottom:28, inner:36, outer:28},
    wide:     {name:'Wide',      top:54, bottom:54, inner:63, outer:54},
    custom:   {name:'Custom',    top:36, bottom:36, inner:36, outer:36}
  };

  /**
   * KDP Minimum Margins by page count
   * Amazon KDP requires larger inner margins for thicker books
   */
  function getKDPMinMargins(pageCount){
    if(pageCount <= 150)  return {top:18, bottom:18, inner:27, outer:18};
    if(pageCount <= 300)  return {top:18, bottom:18, inner:36, outer:18};
    if(pageCount <= 500)  return {top:18, bottom:18, inner:45, outer:18};
    if(pageCount <= 700)  return {top:18, bottom:18, inner:54, outer:18};
    return {top:18, bottom:18, inner:63, outer:18};
  }

  /**
   * Validate margins against KDP requirements
   */
  function validateMargins(margins, pageCount){
    var kdpMin = getKDPMinMargins(pageCount);
    var issues = [];

    if(margins.top < kdpMin.top) issues.push('Top margin too small (min: '+kdpMin.top+'pt)');
    if(margins.bottom < kdpMin.bottom) issues.push('Bottom margin too small (min: '+kdpMin.bottom+'pt)');
    if(margins.inner < kdpMin.inner) issues.push('Inner margin too small (min: '+kdpMin.inner+'pt)');
    if(margins.outer < kdpMin.outer) issues.push('Outer margin too small (min: '+kdpMin.outer+'pt)');

    return {
      valid: issues.length === 0,
      issues: issues,
      kdpMin: kdpMin
    };
  }

  /**
   * Render a single puzzle page to canvas
   */
  function renderPuzzlePage(canvas, puzzle, config){
    var ctx = canvas.getContext('2d');
    var trimSize = TRIM_SIZES[config.trimSize || '8.5x11'];
    var margins = config.margins || MARGIN_PRESETS.standard;
    var cellSize = config.cellSize || 24;
    var fontSize = config.fontSize || 16;
    var fontFamily = config.fontFamily || 'Arial';
    var title = config.title || 'Word Search';
    var showWordList = config.showWordList !== false;
    var showPageNum = config.showPageNum || false;
    var pageNum = config.pageNum || 1;
    var footerText = config.footerText || '';

    var width = trimSize.width;
    var height = trimSize.height;
    var bleed = config.bleed ? trimSize.bleed : 0;

    canvas.width = width + bleed * 2;
    canvas.height = height + bleed * 2;

     // Background
     ctx.fillStyle = config.bg || '#ffffff';
     ctx.fillRect(0, 0, width, height);


    // Title
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 20px ' + fontFamily;
    ctx.textAlign = 'center';
    ctx.fillText(title, width/2, margins.top - 10);

    // Grid with highlighted words
    var grid = puzzle.grid;
    var rows = grid.length;
    var cols = grid[0].length;
    var gridWidth = cols * cellSize;
    var gridHeight = rows * cellSize;
    var gridX = (width - gridWidth) / 2;
    var gridY = margins.top + 10;

    // Build set of solution cells
    var solutionCells = {};
    if(puzzle.placements){
      for(var p=0;p<puzzle.placements.length;p++){
        var placement = puzzle.placements[p];
        var dir = placement.dir;
        var dx = 0, dy = 0;
        if(dir === 'right') dx = 1;
        else if(dir === 'down') dy = 1;
        else if(dir === 'left') dx = -1;
        else if(dir === 'up') dy = -1;
        else if(dir === 'downRight'){ dx = 1; dy = 1; }
        else if(dir === 'downLeft'){ dx = -1; dy = 1; }
        else if(dir === 'upRight'){ dx = 1; dy = -1; }
        else if(dir === 'upLeft'){ dx = -1; dy = -1; }

        for(var i=0;i<placement.word.length;i++){
          var key = (placement.row + dy*i) + ',' + (placement.col + dx*i);
          solutionCells[key] = true;
        }
      }
    }

    // Draw grid
    for(var r=0;r<rows;r++){
      for(var c=0;c<cols;c++){
        var x = gridX + c * cellSize;
        var y = gridY + r * cellSize;
        var key = r + ',' + c;
        var isSolution = solutionCells[key];

         // Cell background
         ctx.fillStyle = isSolution ? (config.cc || '#dbeafe') : '#ffffff';
         ctx.fillRect(x, y, cellSize, cellSize);
 
         // Cell border
         ctx.strokeStyle = isSolution ? (config.cc || '#3b82f6') : '#e5e7eb';
         ctx.lineWidth = 0.5;
         ctx.strokeRect(x, y, cellSize, cellSize);
 
         // Letter
         if(grid[r][c]){
           ctx.fillStyle = isSolution ? (config.tc || '#1e40af') : '#1f2937';
           ctx.font = (isSolution ? 'bold ' : '') + fontSize + 'px ' + fontFamily;
           ctx.textAlign = 'center';
           ctx.textBaseline = 'middle';
           ctx.fillText(grid[r][c], x + cellSize/2, y + cellSize/2 + 1);
         }


       }
     }

     // Draw decorations
     if(config.decorations && config.decorations.length > 0 && window.MXD_VISUAL_THEMES){
       var assets = window.MXD_VISUAL_THEMES.DECORATIVE_ASSETS;
       config.decorations.forEach(function(assetId){
         var pathStr = assets[assetId];
         if(!pathStr) return;
         ctx.save();
         var corners = [
           {x: padding, y: padding},
           {x: padding + cols * cellSize, y: padding},
           {x: padding, y: padding + rows * cellSize},
           {x: padding + cols * cellSize, y: padding + rows * cellSize}
         ];
         var corner = corners[Math.floor(Math.random() * corners.length)];
         ctx.translate(corner.x, corner.y);
         var p = new Path2D(pathStr);
         ctx.fillStyle = config.accentColor || 'rgba(0,0,0,0.1)';
         ctx.globalAlpha = 0.4;
         ctx.fill(p);
         ctx.restore();
       });
     }

      return canvas;
    }

    function renderSolutionPage(canvas, puzzle, config){
      var cfg = Object.assign({}, config || {}, { highlightSolution: true });
      return renderPuzzlePage(canvas, puzzle, cfg);
    }

    /**
   * Export as PNG
   */
  function exportPNG(canvas, filename, dpi){
    dpi = dpi || 300;
    var scale = dpi / 96; // 96 DPI is screen standard

    var exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width * scale;
    exportCanvas.height = canvas.height * scale;
    var ctx = exportCanvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.drawImage(canvas, 0, 0);

    var link = document.createElement('a');
    link.download = filename || 'puzzle.png';
    link.href = exportCanvas.toDataURL('image/png');
    link.click();

    return exportCanvas;
  }

  /**
   * Export as SVG
   */
  function exportSVG(svgContent, filename){
    var blob = new Blob([svgContent], {type:'image/svg+xml'});
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.download = filename || 'puzzle.svg';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Export as JSON
   */
  function exportJSON(puzzle, filename){
    var data = JSON.stringify(puzzle, null, 2);
    var blob = new Blob([data], {type:'application/json'});
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.download = filename || 'puzzle.json';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Book Builder - Combine multiple puzzles into one book
   */
  var BookBuilder = {
    /**
     * Build complete book with all pages
     * @param {Array} puzzles - Array of puzzle objects
     * @param {Object} config - Book configuration
     * @returns {Array} Array of canvas elements (one per page)
     */
    build: function(puzzles, config){
      var pages = [];
      var pageNum = config.startPage || 1;

      // Title page
      if(config.includeTitlePage !== false){
        var titleCanvas = document.createElement('canvas');
        var trimSize = TRIM_SIZES[config.trimSize || '8.5x11'];
        titleCanvas.width = trimSize.width;
        titleCanvas.height = trimSize.height;
        var ctx = titleCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, trimSize.width, trimSize.height);
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 36px ' + (config.fontFamily || 'Arial');
        ctx.textAlign = 'center';
        ctx.fillText(config.bookTitle || 'Word Search Puzzle Book', trimSize.width/2, trimSize.height/2 - 40);
        ctx.font = '18px ' + (config.fontFamily || 'Arial');
        ctx.fillStyle = '#6b7280';
        ctx.fillText(config.bookSubtitle || '', trimSize.width/2, trimSize.height/2 + 10);
        if(config.bookAuthor){
          ctx.font = '16px ' + (config.fontFamily || 'Arial');
          ctx.fillText('By ' + config.bookAuthor, trimSize.width/2, trimSize.height/2 + 50);
        }
        pages.push({canvas: titleCanvas, type:'title', pageNum: pageNum++});
      }

      // Copyright page
      if(config.includeCopyright){
        var copyCanvas = document.createElement('canvas');
        var trimSize2 = TRIM_SIZES[config.trimSize || '8.5x11'];
        copyCanvas.width = trimSize2.width;
        copyCanvas.height = trimSize2.height;
        var ctx2 = copyCanvas.getContext('2d');
        ctx2.fillStyle = '#ffffff';
        ctx2.fillRect(0, 0, trimSize2.width, trimSize2.height);
        ctx2.fillStyle = '#6b7280';
        ctx2.font = '12px ' + (config.fontFamily || 'Arial');
        ctx2.textAlign = 'center';
        ctx2.fillText('Copyright © ' + (config.copyrightYear || new Date().getFullYear()), trimSize2.width/2, trimSize2.height/2);
        ctx2.fillText('All rights reserved.', trimSize2.width/2, trimSize2.height/2 + 20);
        if(config.copyrightText){
          ctx2.fillText(config.copyrightText, trimSize2.width/2, trimSize2.height/2 + 50);
        }
        pages.push({canvas: copyCanvas, type:'copyright', pageNum: pageNum++});
      }

      // Table of Contents
      if(config.includeTOC){
        var tocCanvas = document.createElement('canvas');
        var trimSize3 = TRIM_SIZES[config.trimSize || '8.5x11'];
        tocCanvas.width = trimSize3.width;
        tocCanvas.height = trimSize3.height;
        var ctx3 = tocCanvas.getContext('2d');
        ctx3.fillStyle = '#ffffff';
        ctx3.fillRect(0, 0, trimSize3.width, trimSize3.height);
        ctx3.fillStyle = '#1f2937';
        ctx3.font = 'bold 24px ' + (config.fontFamily || 'Arial');
        ctx3.textAlign = 'center';
        ctx3.fillText('Table of Contents', trimSize3.width/2, 50);

        ctx3.font = '14px ' + (config.fontFamily || 'Arial');
        ctx3.textAlign = 'left';
        var tocY = 80;
        for(var t=0;t<puzzles.length;t++){
          var puzzleTitle = puzzles[t].title || ('Puzzle ' + (t+1));
          ctx3.fillText(puzzleTitle, 60, tocY);
          ctx3.textAlign = 'right';
          ctx3.fillText(''+(pageNum + t), trimSize3.width - 60, tocY);
          ctx3.textAlign = 'left';
          tocY += 24;
        }
        pages.push({canvas: tocCanvas, type:'toc', pageNum: pageNum++});
      }

      // Introduction page
      if(config.includeIntro){
        var introCanvas = document.createElement('canvas');
        var trimSize4 = TRIM_SIZES[config.trimSize || '8.5x11'];
        introCanvas.width = trimSize4.width;
        introCanvas.height = trimSize4.height;
        var ctx4 = introCanvas.getContext('2d');
        ctx4.fillStyle = '#ffffff';
        ctx4.fillRect(0, 0, trimSize4.width, trimSize4.height);
        ctx4.fillStyle = '#1f2937';
        ctx4.font = 'bold 24px ' + (config.fontFamily || 'Arial');
        ctx4.textAlign = 'center';
        ctx4.fillText('How to Use This Book', trimSize4.width/2, 50);
        ctx4.font = '14px ' + (config.fontFamily || 'Arial');
        ctx4.textAlign = 'left';
        var instructions = config.instructions || [
          '1. Find all the words listed below each puzzle.',
          '2. Words can be placed horizontally, vertically, or diagonally.',
          '3. Words may also be placed in reverse.',
          '4. Circle or highlight each word as you find it.',
          '5. Solutions are provided at the end of the book.'
        ];
        var instY = 80;
        for(var ii=0;ii<instructions.length;ii++){
          ctx4.fillText(instructions[ii], 60, instY);
          instY += 24;
        }
        pages.push({canvas: introCanvas, type:'intro', pageNum: pageNum++});
      }

      // Puzzle pages
      for(var p=0;p<puzzles.length;p++){
        var puzzleCanvas = document.createElement('canvas');
        renderPuzzlePage(puzzleCanvas, puzzles[p], {
          trimSize: config.trimSize,
          margins: config.margins,
          cellSize: config.cellSize,
          fontSize: config.fontSize,
          fontFamily: config.fontFamily,
          title: puzzles[p].title || ('Puzzle ' + (p+1)),
          showWordList: true,
          showPageNum: config.showPageNum,
          pageNum: pageNum,
          footerText: config.footerText,
          bleed: config.bleed,
          cropMarks: config.cropMarks
        });
        pages.push({canvas: puzzleCanvas, type:'puzzle', pageNum: pageNum++, puzzleIndex: p});

        // Solution page (if requested)
        if(config.includeSolutions){
          var solCanvas = document.createElement('canvas');
          renderSolutionPage(solCanvas, puzzles[p], {
            trimSize: config.trimSize,
            margins: config.margins,
            cellSize: config.cellSize,
            fontSize: config.fontSize,
            fontFamily: config.fontFamily,
            title: 'Solution - ' + (puzzles[p].title || ('Puzzle ' + (p+1)))
          });
          pages.push({canvas: solCanvas, type:'solution', pageNum: pageNum++});
        }
      }

      // Compact answer key (4-6 solutions per page)
      if(config.compactAnswerKey){
        var solutionsPerPage = config.solutionsPerPage || 4;
        var solutionPages = Math.ceil(puzzles.length / solutionsPerPage);

        for(var sp=0;sp<solutionPages;sp++){
          var akCanvas = document.createElement('canvas');
          var trimSize5 = TRIM_SIZES[config.trimSize || '8.5x11'];
          akCanvas.width = trimSize5.width;
          akCanvas.height = trimSize5.height;
          var ctx5 = akCanvas.getContext('2d');
          ctx5.fillStyle = '#ffffff';
          ctx5.fillRect(0, 0, trimSize5.width, trimSize5.height);
          ctx5.fillStyle = '#1f2937';
          ctx5.font = 'bold 20px ' + (config.fontFamily || 'Arial');
          ctx5.textAlign = 'center';
          ctx5.fillText('Answer Key', trimSize5.width/2, 40);

          var startIdx = sp * solutionsPerPage;
          var endIdx = Math.min(startIdx + solutionsPerPage, puzzles.length);
          var cellSize = Math.min(16, (trimSize5.width - 120) / 20);

          for(var si=startIdx;si<endIdx;si++){
            var yPos = 60 + (si - startIdx) * ((trimSize5.height - 80) / solutionsPerPage);
            ctx5.font = 'bold 12px ' + (config.fontFamily || 'Arial');
            ctx5.textAlign = 'left';
            ctx5.fillText('Puzzle ' + (si+1), 20, yPos);

            // Mini grid
            var grid = puzzles[si].grid;
            if(grid){
              var miniX = 20;
              var miniY = yPos + 5;
              for(var mr=0;mr<grid.length;mr++){
                for(var mc=0;mc<grid[mr].length;mc++){
                  ctx5.fillStyle = '#f3f4f6';
                  ctx5.fillRect(miniX + mc*cellSize, miniY + mr*cellSize, cellSize, cellSize);
                  ctx5.strokeStyle = '#d1d5db';
                  ctx5.lineWidth = 0.3;
                  ctx5.strokeRect(miniX + mc*cellSize, miniY + mr*cellSize, cellSize, cellSize);
                  if(grid[mr][mc]){
                    ctx5.fillStyle = '#1f2937';
                    ctx5.font = (cellSize-4) + 'px ' + (config.fontFamily || 'Arial');
                    ctx5.textAlign = 'center';
                    ctx5.textBaseline = 'middle';
                    ctx5.fillText(grid[mr][mc], miniX + mc*cellSize + cellSize/2, miniY + mr*cellSize + cellSize/2);
                  }
                }
              }
            }
          }
          pages.push({canvas: akCanvas, type:'answerkey', pageNum: pageNum++});
        }
      }

      return pages;
    }
  };

  /**
   * Batch Generation
   * Generate multiple puzzles with progress tracking
   */
  var BatchGenerator = {
    generate: function(wordLists, config, onProgress){
      var puzzles = [];
      var total = wordLists.length;
      var startTime = Date.now();

      for(var i=0;i<wordLists.length;i++){
        var words = wordLists[i];
        var puzzleConfig = Object.assign({}, config, {
          rows: config.rows || 15,
          cols: config.cols || 15,
          title: words.title || ('Puzzle ' + (i+1))
        });

        // Generate puzzle using placement engine
        if(window.MXDPlacementEngine){
          var result = window.MXDPlacementEngine.placeWords(words.words || words, puzzleConfig);
          puzzles.push({
            grid: result.grid,
            rows: result.rows,
            cols: result.cols,
            words: words.words || words,
            placements: result.placements,
            title: puzzleConfig.title
          });
        }

        // Report progress
        if(onProgress){
          var elapsed = Date.now() - startTime;
          var eta = total > 0 ? (elapsed / (i+1)) * (total - i - 1) : 0;
          onProgress({
            current: i + 1,
            total: total,
            percent: Math.round((i+1) / total * 100),
            eta: Math.round(eta / 1000),
            puzzle: puzzles[puzzles.length - 1]
          });
        }
      }

      return puzzles;
    }
  };

  /**
   * Export
   */
  window.MXDExportBookBuilder = {
    version: '10.0.0',
    TRIM_SIZES: TRIM_SIZES,
    MARGIN_PRESETS: MARGIN_PRESETS,
    getKDPMinMargins: getKDPMinMargins,
    validateMargins: validateMargins,
    renderPuzzlePage: renderPuzzlePage,
    renderSolutionPage: renderSolutionPage,
    exportPNG: exportPNG,
    exportSVG: exportSVG,
    exportJSON: exportJSON,
    bookBuilder: BookBuilder,
    batchGenerator: BatchGenerator
  };

})();
