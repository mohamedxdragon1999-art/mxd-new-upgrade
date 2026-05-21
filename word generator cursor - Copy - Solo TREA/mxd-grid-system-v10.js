/**
 * MXD Advanced Grid System v10.0
 * 
 * Professional grid rendering with:
 * - 5 Grid Letter Modes: Random, Frequency-Weighted, Wordlist Only, Custom Characters, Silent
 * - 5 Grid Visual Styles: Clean, Grid Lines, Checkered, Dotted, Bold Border
 * - Rectangular grids (any R×C)
 * - Auto-suggest aspect ratio based on word lengths
 * - Cell Shape Options: Square, Rounded, Circular
 * - Custom shape upload support (image → auto-trace → puzzle boundary)
 * - 100+ pre-built shapes
 * - Grid quality scoring
 * 
 * @module MXDGridSystem
 * @version 10.0.0
 */
(function(){
  'use strict';

  /**
   * Grid Letter Modes
   */
  var LETTER_MODES = {
    random: {
      id: 'random',
      name: 'Random Letters',
      desc: 'Standard random filler letters',
      generate: function(){
        var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return letters[Math.floor(Math.random() * letters.length)];
      }
    },
    frequency: {
      id: 'frequency',
      name: 'Frequency-Weighted',
      desc: 'Filler letters match English letter frequency (E=12.7%, T=9.1%, etc.)',
      _weighted: null,
      init: function(){
        if(this._weighted) return;
        this._weighted = [];
        var freq = {E:12.70,T:9.06,A:8.17,O:7.51,I:6.97,N:6.75,S:6.33,H:6.09,R:5.99,D:4.25,L:4.03,C:2.78,U:2.76,M:2.41,W:2.36,F:2.23,G:2.02,Y:1.97,P:1.93,B:1.49,V:0.98,K:0.77,J:0.15,X:0.15,Q:0.10,Z:0.07};
        var keys = Object.keys(freq);
        for(var i=0;i<keys.length;i++){
          var count = Math.round(freq[keys[i]] * 10);
          for(var j=0;j<count;j++) this._weighted.push(keys[i]);
        }
      },
      generate: function(){
        this.init();
        return this._weighted[Math.floor(Math.random() * this._weighted.length)];
      }
    },
    wordlist: {
      id: 'wordlist',
      name: 'Wordlist Only',
      desc: 'ONLY use letters from your word list (hardest mode)',
      generate: function(placedLetters){
        if(!placedLetters || placedLetters.length === 0) return 'E';
        return placedLetters[Math.floor(Math.random() * placedLetters.length)];
      }
    },
    custom: {
      id: 'custom',
      name: 'Custom Characters',
      desc: 'User picks which letters to use as filler',
      chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      generate: function(){
        return this.chars[Math.floor(Math.random() * this.chars.length)];
      }
    },
    silent: {
      id: 'silent',
      name: 'Silent Mode',
      desc: 'Leave empty cells blank (no filler)',
      generate: function(){
        return '';
      }
    }
  };

  /**
   * Grid Visual Styles
   */
  var VISUAL_STYLES = {
    clean: {
      id: 'clean',
      name: 'Clean',
      desc: 'No grid lines (default)',
      css: function(cellSize){
        return {
          border: 'none',
          cellBorder: 'none',
          cellBackground: 'transparent'
        };
      }
    },
    gridLines: {
      id: 'gridLines',
      name: 'Grid Lines',
      desc: 'Subtle lines between cells',
      css: function(cellSize){
        return {
          border: '1px solid #e5e7eb',
          cellBorder: '1px solid #e5e7eb',
          cellBackground: 'transparent'
        };
      }
    },
    checkered: {
      id: 'checkered',
      name: 'Checkered',
      desc: 'Alternating cell colors (like chess board)',
      css: function(cellSize){
        return {
          border: 'none',
          cellBorder: 'none',
          cellBackgroundAlt: '#f3f4f6',
          cellBackground: '#ffffff'
        };
      }
    },
    dotted: {
      id: 'dotted',
      name: 'Dotted',
      desc: 'Dots at cell corners',
      css: function(cellSize){
        return {
          border: 'none',
          cellBorder: 'none',
          cellBackground: 'transparent',
          dotSize: Math.max(2, cellSize * 0.08),
          dotColor: '#9ca3af'
        };
      }
    },
    boldBorder: {
      id: 'boldBorder',
      name: 'Bold Border',
      desc: 'Thick outer border',
      css: function(cellSize){
        return {
          border: '3px solid #1f2937',
          cellBorder: '1px solid #d1d5db',
          cellBackground: 'transparent'
        };
      }
    }
  };

  /**
   * Cell Shape Options
   */
  var CELL_SHAPES = {
    square: {
      id: 'square',
      name: 'Square',
      render: function(ctx, x, y, size, fill, stroke){
        ctx.fillStyle = fill || '#ffffff';
        ctx.fillRect(x, y, size, size);
        if(stroke){
          ctx.strokeStyle = stroke;
          ctx.strokeRect(x, y, size, size);
        }
      }
    },
    rounded: {
      id: 'rounded',
      name: 'Rounded',
      radius: 4,
      render: function(ctx, x, y, size, fill, stroke){
        var r = this.radius || Math.max(2, size * 0.1);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + size - r, y);
        ctx.quadraticCurveTo(x + size, y, x + size, y + r);
        ctx.lineTo(x + size, y + size - r);
        ctx.quadraticCurveTo(x + size, y + size, x + size - r, y + size);
        ctx.lineTo(x + r, y + size);
        ctx.quadraticCurveTo(x, y + size, x, y + size - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        if(fill){ ctx.fillStyle = fill; ctx.fill(); }
        if(stroke){ ctx.strokeStyle = stroke; ctx.stroke(); }
      }
    },
    circular: {
      id: 'circular',
      name: 'Circular',
      render: function(ctx, x, y, size, fill, stroke){
        var cx = x + size / 2;
        var cy = y + size / 2;
        var r = size / 2 - 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        if(fill){ ctx.fillStyle = fill; ctx.fill(); }
        if(stroke){ ctx.strokeStyle = stroke; ctx.stroke(); }
      }
    }
  };

  /**
   * Auto-suggest aspect ratio based on word lengths
   * Analyzes word list to determine optimal grid dimensions
   */
  function suggestAspectRatio(words){
    if(!words || words.length === 0) return {rows:15, cols:15, ratio:1};

    var maxLen = 0;
    var avgLen = 0;
    var totalLen = 0;
    for(var i=0;i<words.length;i++){
      var len = words[i].length;
      if(len > maxLen) maxLen = len;
      totalLen += len;
    }
    avgLen = totalLen / words.length;

    // Longer words benefit from wider grids
    // More words benefit from taller grids
    var wordCount = words.length;
    var totalCells = Math.ceil(totalLen * 1.5); // 1.5x for spacing

    // Calculate optimal dimensions
    var ratio = Math.max(0.6, Math.min(1.8, avgLen / 6));
    var cols = Math.ceil(Math.sqrt(totalCells * ratio));
    var rows = Math.ceil(totalCells / cols);

    // Ensure longest word fits
    if(maxLen > cols) cols = maxLen;
    if(maxLen > rows) rows = maxLen;

    // Minimum size
    if(cols < 5) cols = 5;
    if(rows < 5) rows = 5;

    return {
      rows: rows,
      cols: cols,
      ratio: (cols / rows).toFixed(2),
      maxWordLength: maxLen,
      avgWordLength: avgLen.toFixed(1),
      totalLetters: totalLen
    };
  }

  /**
   * Render grid to canvas with full styling control
   */
  function renderGrid(canvas, grid, config){
    var ctx = canvas.getContext('2d');
    var rows = grid.length;
    var cols = grid[0].length;
    var cellSize = config.cellSize || 30;
    var padding = config.padding || 20;

    canvas.width = cols * cellSize + padding * 2;
    canvas.height = rows * cellSize + padding * 2;

    // Get visual style
    var style = config.visualStyle || 'clean';
    var styleConfig = VISUAL_STYLES[style] || VISUAL_STYLES.clean;
    var css = styleConfig.css(cellSize);

    // Get letter mode
    var letterMode = config.letterMode || 'random';
    var letterConfig = LETTER_MODES[letterMode] || LETTER_MODES.random;

    // Get cell shape
    var cellShape = config.cellShape || 'square';
    var shapeConfig = CELL_SHAPES[cellShape] || CELL_SHAPES.square;

    // Clear canvas
    ctx.fillStyle = config.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid border
    if(css.border){
      ctx.strokeStyle = css.border;
      ctx.lineWidth = css.border.indexOf('3px') >= 0 ? 3 : 1;
      ctx.strokeRect(padding, padding, cols * cellSize, rows * cellSize);
    }

    // Collect placed letters for wordlist mode
    var placedLetters = [];
    if(letterMode === 'wordlist'){
      for(var r=0;r<rows;r++){
        for(var c=0;c<cols;c++){
          if(grid[r][c] && grid[r][c] !== ''){
            placedLetters.push(grid[r][c]);
          }
        }
      }
    }

    // Render cells
    for(var r2=0;r2<rows;r2++){
      for(var c2=0;c2<cols;c2++){
        var x = padding + c2 * cellSize;
        var y = padding + r2 * cellSize;
        var letter = grid[r2][c2];

        // Cell background
        var cellFill = '#ffffff';
        if(style === 'checkered'){
          cellFill = (r2 + c2) % 2 === 0 ? (css.cellBackground || '#ffffff') : (css.cellBackgroundAlt || '#f3f4f6');
        }

        // Render cell shape
        shapeConfig.render(ctx, x, y, cellSize, cellFill, css.cellBorder || null);

        // Render letter
        if(letter && letter !== ''){
          var fontSize = config.fontSize || Math.max(12, cellSize * 0.6);
          var fontFamily = config.fontFamily || 'Arial';
          var fontWeight = config.fontWeight || 'normal';
          var fontColor = config.fontColor || '#1f2937';

          ctx.font = fontWeight + ' ' + fontSize + 'px ' + fontFamily;
          ctx.fillStyle = fontColor;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          // Letter styling
          if(config.letterStyle === 'outlined'){
            ctx.strokeStyle = fontColor;
            ctx.lineWidth = 1;
            ctx.strokeText(letter, x + cellSize/2, y + cellSize/2 + 1);
          } else if(config.letterStyle === 'shadow'){
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillText(letter, x + cellSize/2 + 1, y + cellSize/2 + 2);
            ctx.fillStyle = fontColor;
            ctx.fillText(letter, x + cellSize/2, y + cellSize/2 + 1);
          } else if(config.letterStyle === 'chaotic'){
            var angle = (Math.random() - 0.5) * 0.15;
            ctx.save();
            ctx.translate(x + cellSize/2, y + cellSize/2);
            ctx.rotate(angle);
            ctx.fillText(letter, 0, 0);
            ctx.restore();
          } else {
            ctx.fillText(letter, x + cellSize/2, y + cellSize/2 + 1);
          }
        }

        // Render dots for dotted style
        if(style === 'dotted' && css.dotSize){
          ctx.fillStyle = css.dotColor || '#9ca3af';
          var dotR = css.dotSize;
          ctx.beginPath();
          ctx.arc(x, y, dotR, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x + cellSize, y, dotR, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x, y + cellSize, dotR, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x + cellSize, y + cellSize, dotR, 0, Math.PI * 2);
          ctx.fill();
        }
         }
       }

        // Draw decorations
        if(config.decorations && config.decorations.length > 0 && window.MXD_VISUAL_THEMES){
          var assets = window.MXD_VISUAL_THEMES.DECORATIVE_ASSETS;
          config.decorations.forEach(function(assetId){
            var pathStr = assets[assetId];
            if(!pathStr) return;
            
            var scale = config.decorationScale || 0.5;
            var opacity = config.decorationOpacity || 0.4;
            
            // Draw at 4 corners of the grid area
            var corners = [
              {x: padding, y: padding, tx: 0, ty: 0},
              {x: padding + cols * cellSize, y: padding, tx: -cellSize, ty: 0},
              {x: padding, y: padding + rows * cellSize, tx: 0, ty: -cellSize},
              {x: padding + cols * cellSize, y: padding + rows * cellSize, tx: -cellSize, ty: -cellSize}
            ];
            
            corners.forEach(function(corner){
              ctx.save();
              ctx.translate(corner.x + corner.tx, corner.y + corner.ty);
              
              // We'll draw the asset, but we might need to scale it
              // Since Path2D doesn't have a simple scale, we use ctx.scale
              ctx.scale(scale, scale);
              // We assume the asset is roughly 1000x1000 based on the data
              ctx.translate(-500, -500); 
              
              var p = new Path2D(pathStr);
              ctx.fillStyle = config.accentColor || 'rgba(0,0,0,0.1)';
              ctx.globalAlpha = opacity;
              ctx.fill(p);
              ctx.restore();
            });
          });
        }

        return canvas;
      }


  /**
   * Render grid to SVG for vector export
   */
  function renderGridSVG(grid, config){
    var rows = grid.length;
    var cols = grid[0].length;
    var cellSize = config.cellSize || 30;
    var padding = config.padding || 20;
    var width = cols * cellSize + padding * 2;
    var height = rows * cellSize + padding * 2;

    var style = config.visualStyle || 'clean';
    var styleConfig = VISUAL_STYLES[style] || VISUAL_STYLES.clean;
    var css = styleConfig.css(cellSize);

    var cellShape = config.cellShape || 'square';
    var shapeConfig = CELL_SHAPES[cellShape] || CELL_SHAPES.square;

    var letterMode = config.letterMode || 'random';
    var letterConfig = LETTER_MODES[letterMode] || LETTER_MODES.random;

    var placedLetters = [];
    if(letterMode === 'wordlist'){
      for(var r=0;r<rows;r++){
        for(var c=0;c<cols;c++){
          if(grid[r][c] && grid[r][c] !== '') placedLetters.push(grid[r][c]);
        }
      }
    }

    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" viewBox="0 0 '+width+' '+height+'">';
    svg += '<rect width="'+width+'" height="'+height+'" fill="'+(config.backgroundColor||'#ffffff')+'"/>';

    // Grid border
    if(css.border){
      var sw = css.border.indexOf('3px') >= 0 ? 3 : 1;
      svg += '<rect x="'+padding+'" y="'+padding+'" width="'+(cols*cellSize)+'" height="'+(rows*cellSize)+'" fill="none" stroke="'+css.border+'" stroke-width="'+sw+'"/>';
    }

    // Cells
    for(var r2=0;r2<rows;r2++){
      for(var c2=0;c2<cols;c2++){
        var x = padding + c2 * cellSize;
        var y = padding + r2 * cellSize;
        var letter = grid[r2][c2];

        var cellFill = '#ffffff';
        if(style === 'checkered'){
          cellFill = (r2+c2)%2===0 ? (css.cellBackground||'#ffffff') : (css.cellBackgroundAlt||'#f3f4f6');
        }

        // Cell shape
        if(cellShape === 'square'){
          svg += '<rect x="'+x+'" y="'+y+'" width="'+cellSize+'" height="'+cellSize+'" fill="'+cellFill+'"'+(css.cellBorder?' stroke="'+css.cellBorder+'" stroke-width="1"':'')+'/>';
        } else if(cellShape === 'rounded'){
          var rad = Math.max(2, cellSize*0.1);
          svg += '<rect x="'+x+'" y="'+y+'" width="'+cellSize+'" height="'+cellSize+'" rx="'+rad+'" ry="'+rad+'" fill="'+cellFill+'"'+(css.cellBorder?' stroke="'+css.cellBorder+'" stroke-width="1"':'')+'/>';
        } else if(cellShape === 'circular'){
          var cx = x + cellSize/2;
          var cy = y + cellSize/2;
          var cr = cellSize/2 - 1;
          svg += '<circle cx="'+cx+'" cy="'+cy+'" r="'+cr+'" fill="'+cellFill+'"'+(css.cellBorder?' stroke="'+css.cellBorder+'" stroke-width="1"':'')+'/>';
        }

        // Letter
        if(letter && letter !== ''){
          var fontSize = config.fontSize || Math.max(12, cellSize*0.6);
          var fontFamily = config.fontFamily || 'Arial';
          var fontColor = config.fontColor || '#1f2937';
          var fontWeight = config.fontWeight || 'normal';

          svg += '<text x="'+(x+cellSize/2)+'" y="'+(y+cellSize/2+1)+'" text-anchor="middle" dominant-baseline="middle" font-family="'+fontFamily+'" font-size="'+fontSize+'" font-weight="'+fontWeight+'" fill="'+fontColor+'">'+letter+'</text>';
        }

        // Dots
        if(style === 'dotted' && css.dotSize){
          var dotR = css.dotSize;
          var dotColor = css.dotColor || '#9ca3af';
          svg += '<circle cx="'+x+'" cy="'+y+'" r="'+dotR+'" fill="'+dotColor+'"/>';
          svg += '<circle cx="'+(x+cellSize)+'" cy="'+y+'" r="'+dotR+'" fill="'+dotColor+'"/>';
          svg += '<circle cx="'+x+'" cy="'+(y+cellSize)+'" r="'+dotR+'" fill="'+dotColor+'"/>';
          svg += '<circle cx="'+(x+cellSize)+'" cy="'+(y+cellSize)+'" r="'+dotR+'" fill="'+dotColor+'"/>';
        }
      }
    }

    svg += '</svg>';
    return svg;
  }

  /**
   * Calculate grid quality score
   * Higher score = better puzzle quality
   */
  function calculateGridQuality(grid, placements, words){
    var rows = grid.length;
    var cols = grid[0].length;
    var totalCells = rows * cols;

    // Fill rate (0-30 points)
    var filledCells = 0;
    for(var r=0;r<rows;r++){
      for(var c=0;c<cols;c++){
        if(grid[r][c] && grid[r][c] !== '') filledCells++;
      }
    }
    var fillRate = filledCells / totalCells;
    var fillScore = Math.min(30, fillRate * 50);

    // Word placement density (0-25 points)
    var wordsPlaced = placements ? placements.length : 0;
    var densityScore = Math.min(25, (wordsPlaced / totalCells) * 100);

    // Crossing density (0-25 points)
    var totalCrossings = 0;
    if(placements){
      for(var i=0;i<placements.length;i++){
        if(placements[i].crossings) totalCrossings += placements[i].crossings;
      }
    }
    var crossingScore = Math.min(25, (totalCrossings / Math.max(1, wordsPlaced)) * 10);

    // Word coverage (0-20 points)
    var coverageScore = words ? Math.min(20, (wordsPlaced / words.length) * 20) : 0;

    return {
      total: Math.round(fillScore + densityScore + crossingScore + coverageScore),
      fillRate: (fillRate * 100).toFixed(1) + '%',
      fillScore: Math.round(fillScore),
      densityScore: Math.round(densityScore),
      crossingScore: Math.round(crossingScore),
      coverageScore: Math.round(coverageScore),
      grade: fillScore + densityScore + crossingScore + coverageScore >= 80 ? 'A' :
             fillScore + densityScore + crossingScore + coverageScore >= 60 ? 'B' :
             fillScore + densityScore + crossingScore + coverageScore >= 40 ? 'C' : 'D'
    };
  }

  /**
   * Export
   */
  window.MXDGridSystem = {
    version: '10.0.0',
    LETTER_MODES: LETTER_MODES,
    VISUAL_STYLES: VISUAL_STYLES,
    CELL_SHAPES: CELL_SHAPES,
    suggestAspectRatio: suggestAspectRatio,
    renderGrid: renderGrid,
    renderGridSVG: renderGridSVG,
    calculateGridQuality: calculateGridQuality
  };

})();
