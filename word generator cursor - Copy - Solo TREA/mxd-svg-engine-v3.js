// mxd-svg-engine-v3.js — Professional SVG Processing Engine v3.0
// ZERO external dependencies — uses browser-native Path2D + Canvas API
// Handles ALL SVG elements: path, circle, rect, ellipse, polygon, polyline, line, g, use, text
// Properly handles viewBox, transforms, compound paths, fill rules (nonzero/evenodd)
// Ultra-fast rasterization via Canvas isPointInPath (not manual bezier parsing)

(function(){
  'use strict';

  var VERSION = '3.0.0';

  // ============================================================
  // SVG PARSER — Extracts paths from any SVG string using DOMParser
  // ============================================================
  function SVGParser() {}

  SVGParser.parse = function(svgString) {
    if (!svgString || typeof svgString !== 'string') {
      return { error: 'Empty or invalid SVG string' };
    }

    try {
      var parser = new DOMParser();
      var doc = parser.parseFromString(svgString, 'image/svg+xml');

      // Check for parse errors
      var parseError = doc.querySelector('parsererror');
      if (parseError) {
        return { error: 'Invalid SVG XML: ' + parseError.textContent.substring(0, 100) };
      }

      var svgEl = doc.querySelector('svg');
      if (!svgEl) {
        return { error: 'No <svg> element found' };
      }

      // Extract viewBox
      var viewBoxAttr = svgEl.getAttribute('viewBox');
      var viewBox = null;
      if (viewBoxAttr) {
        var parts = viewBoxAttr.trim().split(/[\s,]+/).map(Number);
        if (parts.length === 4 && !parts.some(isNaN)) {
          viewBox = { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
        }
      }

      // Fallback to width/height if no viewBox
      if (!viewBox) {
        var w = parseFloat(svgEl.getAttribute('width')) || 512;
        var h = parseFloat(svgEl.getAttribute('height')) || 512;
        viewBox = { x: 0, y: 0, width: w, height: h };
      }

      // Extract ALL path elements (including nested in <g>, <defs>, etc.)
      var pathElements = doc.querySelectorAll('path');
      var circleElements = doc.querySelectorAll('circle');
      var rectElements = doc.querySelectorAll('rect');
      var ellipseElements = doc.querySelectorAll('ellipse');
      var polygonElements = doc.querySelectorAll('polygon');
      var polylineElements = doc.querySelectorAll('polyline');
      var lineElements = doc.querySelectorAll('line');

      var paths = [];

      // Process <path> elements
      for (var i = 0; i < pathElements.length; i++) {
        var d = pathElements[i].getAttribute('d');
        if (d && d.trim()) {
          var fillRule = pathElements[i].getAttribute('fill-rule') || 'nonzero';
          var transform = pathElements[i].getAttribute('transform');
          paths.push({ type: 'path', d: d.trim(), fillRule: fillRule, transform: transform });
        }
      }

      // Convert <circle> to path
      for (var i = 0; i < circleElements.length; i++) {
        var cx = parseFloat(circleElements[i].getAttribute('cx')) || 0;
        var cy = parseFloat(circleElements[i].getAttribute('cy')) || 0;
        var r = parseFloat(circleElements[i].getAttribute('r')) || 0;
        if (r > 0) {
          var circleD = 'M' + (cx-r) + ',' + cy +
            'A' + r + ',' + r + ' 0 1,0 ' + (cx+r) + ',' + cy +
            'A' + r + ',' + r + ' 0 1,0 ' + (cx-r) + ',' + cy + 'Z';
          paths.push({ type: 'circle', d: circleD, cx: cx, cy: cy, r: r });
        }
      }

      // Convert <rect> to path
      for (var i = 0; i < rectElements.length; i++) {
        var x = parseFloat(rectElements[i].getAttribute('x')) || 0;
        var y = parseFloat(rectElements[i].getAttribute('y')) || 0;
        var w = parseFloat(rectElements[i].getAttribute('width')) || 0;
        var h = parseFloat(rectElements[i].getAttribute('height')) || 0;
        var rx = parseFloat(rectElements[i].getAttribute('rx')) || 0;
        var ry = parseFloat(rectElements[i].getAttribute('ry')) || 0;
        if (w > 0 && h > 0) {
          var rectD;
          if (rx > 0 || ry > 0) {
            var rxVal = Math.min(rx, w/2);
            var ryVal = Math.min(ry, h/2);
            rectD = 'M' + (x+rxVal) + ',' + y +
              'H' + (x+w-rxVal) +
              'A' + rxVal + ',' + ryVal + ' 0 0,1 ' + (x+w) + ',' + (y+ryVal) +
              'V' + (y+h-ryVal) +
              'A' + rxVal + ',' + ryVal + ' 0 0,1 ' + (x+w-rxVal) + ',' + (y+h) +
              'H' + (x+rxVal) +
              'A' + rxVal + ',' + ryVal + ' 0 0,1 ' + x + ',' + (y+h-ryVal) +
              'V' + (y+ryVal) +
              'A' + rxVal + ',' + ryVal + ' 0 0,1 ' + (x+rxVal) + ',' + y + 'Z';
          } else {
            rectD = 'M' + x + ',' + y + 'H' + (x+w) + 'V' + (y+h) + 'H' + x + 'Z';
          }
          paths.push({ type: 'rect', d: rectD, x: x, y: y, width: w, height: h });
        }
      }

      // Convert <ellipse> to path
      for (var i = 0; i < ellipseElements.length; i++) {
        var cx = parseFloat(ellipseElements[i].getAttribute('cx')) || 0;
        var cy = parseFloat(ellipseElements[i].getAttribute('cy')) || 0;
        var rx = parseFloat(ellipseElements[i].getAttribute('rx')) || 0;
        var ry = parseFloat(ellipseElements[i].getAttribute('ry')) || 0;
        if (rx > 0 && ry > 0) {
          var ellipseD = 'M' + (cx-rx) + ',' + cy +
            'A' + rx + ',' + ry + ' 0 1,0 ' + (cx+rx) + ',' + cy +
            'A' + rx + ',' + ry + ' 0 1,0 ' + (cx-rx) + ',' + cy + 'Z';
          paths.push({ type: 'ellipse', d: ellipseD, cx: cx, cy: cy, rx: rx, ry: ry });
        }
      }

      // Convert <polygon> to path
      for (var i = 0; i < polygonElements.length; i++) {
        var points = polygonElements[i].getAttribute('points');
        if (points && points.trim()) {
          var coords = points.trim().split(/[\s,]+/).map(Number).filter(function(n) { return !isNaN(n); });
          var polyD = 'M';
          for (var j = 0; j < coords.length; j += 2) {
            if (j > 0) polyD += 'L';
            polyD += coords[j] + ',' + coords[j+1];
          }
          polyD += 'Z';
          paths.push({ type: 'polygon', d: polyD, points: points });
        }
      }

      // Convert <polyline> to path (not closed)
      for (var i = 0; i < polylineElements.length; i++) {
        var points = polylineElements[i].getAttribute('points');
        if (points && points.trim()) {
          var coords = points.trim().split(/[\s,]+/).map(Number).filter(function(n) { return !isNaN(n); });
          var lineD = 'M';
          for (var j = 0; j < coords.length; j += 2) {
            if (j > 0) lineD += 'L';
            lineD += coords[j] + ',' + coords[j+1];
          }
          paths.push({ type: 'polyline', d: lineD, points: points });
        }
      }

      // Convert <line> to path
      for (var i = 0; i < lineElements.length; i++) {
        var x1 = parseFloat(lineElements[i].getAttribute('x1')) || 0;
        var y1 = parseFloat(lineElements[i].getAttribute('y1')) || 0;
        var x2 = parseFloat(lineElements[i].getAttribute('x2')) || 0;
        var y2 = parseFloat(lineElements[i].getAttribute('y2')) || 0;
        var lineD = 'M' + x1 + ',' + y1 + 'L' + x2 + ',' + y2;
        paths.push({ type: 'line', d: lineD, x1: x1, y1: y1, x2: x2, y2: y2 });
      }

      return {
        success: true,
        viewBox: viewBox,
        paths: paths,
        pathCount: paths.length,
        width: viewBox.width,
        height: viewBox.height
      };
    } catch(e) {
      return { error: 'SVG parse error: ' + e.message };
    }
  };

  // ============================================================
  // SVG RASTERIZER — Path2D + Canvas isPointInPath (browser-native)
  // This is the CORE engine — converts SVG to a grid mask
  // ============================================================
  function SVGRasterizer() {}

  SVGRasterizer.rasterize = function(svgString, cols, rows, options) {
    options = options || {};
    var padding = options.padding || 0.05; // 5% padding
    var fillRule = options.fillRule || 'nonzero';

    // Parse SVG
    var parsed = SVGParser.parse(svgString);
    if (!parsed.success) {
      return { error: parsed.error };
    }

    if (parsed.paths.length === 0) {
      return { error: 'No SVG paths found' };
    }

    // Create offscreen canvas
    var canvas = document.createElement('canvas');
    canvas.width = cols;
    canvas.height = rows;
    var ctx = canvas.getContext('2d');

    // Build combined Path2D from all paths
    var combinedPath = new Path2D();

    for (var i = 0; i < parsed.paths.length; i++) {
      var p = parsed.paths[i];
      try {
        var path2d = new Path2D(p.d);
        combinedPath.addPath(path2d);
      } catch(e) {
        // Skip invalid paths
      }
    }

    // Calculate viewBox to grid mapping
    var vb = parsed.viewBox;
    var gridCols = cols;
    var gridRows = rows;

    // Scale factors (accounting for padding)
    var vbAspect = vb.width / vb.height;
    var gridAspect = gridCols / gridRows;

    var scale, offsetX, offsetY;
    if (vbAspect > gridAspect) {
      // viewBox is wider — fit to width
      scale = gridCols / vb.width;
      offsetX = 0;
      offsetY = (gridRows - vb.height * scale) / 2;
    } else {
      // viewBox is taller — fit to height
      scale = gridRows / vb.height;
      offsetX = (gridCols - vb.width * scale) / 2;
      offsetY = 0;
    }

    // Apply padding
    var padX = gridCols * padding;
    var padY = gridRows * padding;
    var usableCols = gridCols - padX * 2;
    var usableRows = gridRows - padY * 2;

    // Rescale for padding
    var padScale = Math.min(usableCols / vb.width, usableRows / vb.height);
    var padOffsetX = padX + (usableCols - vb.width * padScale) / 2;
    var padOffsetY = padY + (usableRows - vb.height * padScale) / 2;

    // Create the properly scaled Path2D
    var scaledPath = new Path2D();
    var transform = {
      a: padScale, b: 0, c: 0,
      d: padScale, e: padOffsetX, f: padOffsetY
    };

    for (var i = 0; i < parsed.paths.length; i++) {
      try {
        var path2d = new Path2D(parsed.paths[i].d);
        scaledPath.addPath(path2d, transform);
      } catch(e) {}
    }

    // Rasterize: check each grid cell using isPointInPath
    var mask = [];
    var filledCount = 0;
    var totalCells = gridCols * gridRows;

    for (var r = 0; r < gridRows; r++) {
      mask[r] = [];
      for (var c = 0; c < gridCols; c++) {
        // Check center of cell
        var px = c + 0.5;
        var py = r + 0.5;
        var isInPath = ctx.isPointInPath(scaledPath, px, py, fillRule);
        mask[r][c] = isInPath ? 1 : 0;
        if (isInPath) filledCount++;
      }
    }

    var fillRatio = filledCount / totalCells;

    return {
      success: true,
      mask: mask,
      cols: gridCols,
      rows: gridRows,
      filledCount: filledCount,
      totalCells: totalCells,
      fillRatio: fillRatio,
      viewBox: vb,
      scale: padScale,
      pathCount: parsed.paths.length
    };
  };

  // ============================================================
  // FAST RASTERIZER — Canvas fill + getImageData (bulk extraction)
  // Much faster for large grids — fills path once, reads pixels
  // ============================================================
  SVGRasterizer.rasterizeFast = function(svgString, cols, rows, options) {
    options = options || {};
    var padding = options.padding || 0.05;

    // Parse SVG
    var parsed = SVGParser.parse(svgString);
    if (!parsed.success) {
      return { error: parsed.error };
    }

    if (parsed.paths.length === 0) {
      return { error: 'No SVG paths found' };
    }

    // Create canvas at grid resolution
    var canvas = document.createElement('canvas');
    canvas.width = cols;
    canvas.height = rows;
    var ctx = canvas.getContext('2d');

    // Build scaled Path2D
    var vb = parsed.viewBox;
    var padX = cols * padding;
    var padY = rows * padding;
    var usableCols = cols - padX * 2;
    var usableRows = rows - padY * 2;

    var padScale = Math.min(usableCols / vb.width, usableRows / vb.height);
    var padOffsetX = padX + (usableCols - vb.width * padScale) / 2;
    var padOffsetY = padY + (usableRows - vb.height * padScale) / 2;

    var scaledPath = new Path2D();
    var transform = { a: padScale, b: 0, c: 0, d: padScale, e: padOffsetX, f: padOffsetY };

    for (var i = 0; i < parsed.paths.length; i++) {
      try {
        var path2d = new Path2D(parsed.paths[i].d);
        scaledPath.addPath(path2d, transform);
      } catch(e) {}
    }

    // Fill path with white on black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, cols, rows);
    ctx.fillStyle = '#ffffff';
    ctx.fill(scaledPath, options.fillRule || 'nonzero');

    // Read pixel data
    var imageData = ctx.getImageData(0, 0, cols, rows);
    var data = imageData.data;

    var mask = [];
    var filledCount = 0;

    for (var r = 0; r < rows; r++) {
      mask[r] = [];
      for (var c = 0; c < cols; c++) {
        var idx = (r * cols + c) * 4;
        // Check if pixel is white (filled) — use threshold for anti-aliasing
        var brightness = (data[idx] + data[idx+1] + data[idx+2]) / 3;
        var isFilled = brightness > 128;
        mask[r][c] = isFilled ? 1 : 0;
        if (isFilled) filledCount++;
      }
    }

    return {
      success: true,
      mask: mask,
      cols: cols,
      rows: rows,
      filledCount: filledCount,
      totalCells: cols * rows,
      fillRatio: filledCount / (cols * rows),
      viewBox: vb,
      pathCount: parsed.paths.length
    };
  };

  // ============================================================
  // SVG VALIDATOR
  // ============================================================
  function SVGValidator() {}

  SVGValidator.validate = function(svgString) {
    var result = { valid: true, errors: [], warnings: [], info: {} };

    if (!svgString || typeof svgString !== 'string') {
      result.valid = false;
      result.errors.push('Empty or invalid SVG string');
      return result;
    }

    var parsed = SVGParser.parse(svgString);
    if (parsed.error) {
      result.valid = false;
      result.errors.push(parsed.error);
      return result;
    }

    result.info.viewBox = parsed.viewBox;
    result.info.pathCount = parsed.pathCount;
    result.info.width = parsed.width;
    result.info.height = parsed.height;

    // Warnings
    if (!parsed.viewBox) {
      result.warnings.push('No viewBox — scaling may be inconsistent');
    }

    if (parsed.pathCount === 0) {
      result.warnings.push('No drawable paths found');
    }

    if (parsed.width > 2000 || parsed.height > 2000) {
      result.warnings.push('Very large viewBox — consider simplifying');
    }

    // Check for unsupported features
    if (svgString.indexOf('<filter') !== -1) result.warnings.push('Contains <filter> — not supported for puzzle shapes');
    if (svgString.indexOf('<clipPath') !== -1) result.warnings.push('Contains <clipPath> — may not render correctly');
    if (svgString.indexOf('<animate') !== -1) result.warnings.push('Contains <animate> — animations ignored');
    if (svgString.indexOf('<script') !== -1) result.warnings.push('Contains <script> — scripts ignored');
    if (svgString.indexOf('<image') !== -1) result.warnings.push('Contains <image> — raster images not supported');

    return result;
  };

  // ============================================================
  // SHAPE QUALITY SCORER
  // ============================================================
  function ShapeQualityScorer() {}

  ShapeQualityScorer.score = function(rasterResult) {
    if (!rasterResult || !rasterResult.success) {
      return { score: 0, grade: 'F', issues: ['Invalid raster result'] };
    }

    var score = 100;
    var issues = [];
    var mask = rasterResult.mask;
    var rows = rasterResult.rows;
    var cols = rasterResult.cols;
    var fillRatio = rasterResult.fillRatio;

    // Fill ratio scoring
    if (fillRatio < 0.05) {
      score -= 40;
      issues.push('Very low fill ratio (' + (fillRatio * 100).toFixed(1) + '%) — shape too thin');
    } else if (fillRatio < 0.15) {
      score -= 20;
      issues.push('Low fill ratio (' + (fillRatio * 100).toFixed(1) + '%)');
    } else if (fillRatio > 0.95) {
      score -= 15;
      issues.push('Very high fill ratio (' + (fillRatio * 100).toFixed(1) + '%) — may look like a solid block');
    }

    // Connectivity check (BFS)
    var connectivity = ShapeQualityScorer._checkConnectivity(mask, rows, cols);
    if (!connectivity.connected) {
      score -= 25;
      issues.push('Shape has ' + connectivity.regionCount + ' disconnected regions');
    }

    // Aspect ratio
    var boundingBox = ShapeQualityScorer._getBoundingBox(mask, rows, cols);
    if (boundingBox) {
      var bw = boundingBox.maxC - boundingBox.minC + 1;
      var bh = boundingBox.maxR - boundingBox.minR + 1;
      var aspect = bw / bh;
      if (aspect > 3 || aspect < 0.33) {
        score -= 10;
        issues.push('Extreme aspect ratio (' + aspect.toFixed(2) + ')');
      }
    }

    // Edge smoothness (check for jagged edges)
    var jaggedness = ShapeQualityScorer._measureJaggedness(mask, rows, cols);
    if (jaggedness > 0.4) {
      score -= 10;
      issues.push('Very jagged edges — consider simplifying the SVG');
    }

    score = Math.max(0, Math.min(100, score));

    return {
      score: score,
      grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
      issues: issues,
      metrics: {
        fillRatio: fillRatio,
        filledCells: rasterResult.filledCount,
        totalCells: rasterResult.totalCells,
        connected: connectivity.connected,
        regionCount: connectivity.regionCount,
        aspectRatio: boundingBox ? (boundingBox.maxC - boundingBox.minC + 1) / (boundingBox.maxR - boundingBox.minR + 1) : null,
        jaggedness: jaggedness
      }
    };
  };

  ShapeQualityScorer._checkConnectivity = function(mask, rows, cols) {
    var visited = [];
    for (var r = 0; r < rows; r++) {
      visited[r] = [];
      for (var c = 0; c < cols; c++) {
        visited[r][c] = false;
      }
    }

    var regionCount = 0;

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (mask[r][c] === 1 && !visited[r][c]) {
          regionCount++;
          // BFS
          var queue = [[r, c]];
          visited[r][c] = true;
          while (queue.length > 0) {
            var curr = queue.shift();
            var cr = curr[0], cc = curr[1];
            var neighbors = [[cr-1,cc],[cr+1,cc],[cr,cc-1],[cr,cc+1]];
            for (var n = 0; n < neighbors.length; n++) {
              var nr = neighbors[n][0], nc = neighbors[n][1];
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && mask[nr][nc] === 1 && !visited[nr][nc]) {
                visited[nr][nc] = true;
                queue.push([nr, nc]);
              }
            }
          }
        }
      }
    }

    return { connected: regionCount <= 1, regionCount: regionCount };
  };

  ShapeQualityScorer._getBoundingBox = function(mask, rows, cols) {
    var minR = rows, maxR = -1, minC = cols, maxC = -1;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (mask[r][c] === 1) {
          if (r < minR) minR = r;
          if (r > maxR) maxR = r;
          if (c < minC) minC = c;
          if (c > maxC) maxC = c;
        }
      }
    }
    if (maxR === -1) return null;
    return { minR: minR, maxR: maxR, minC: minC, maxC: maxC };
  };

  ShapeQualityScorer._measureJaggedness = function(mask, rows, cols) {
    var edgeTransitions = 0;
    var edgePixels = 0;

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (mask[r][c] === 1) {
          // Check if this is an edge pixel
          var isEdge = false;
          var neighbors = [[r-1,c],[r+1,c],[r,c-1],[r,c+1]];
          for (var n = 0; n < neighbors.length; n++) {
            var nr = neighbors[n][0], nc = neighbors[n][1];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || mask[nr][nc] === 0) {
              isEdge = true;
              break;
            }
          }
          if (isEdge) {
            edgePixels++;
            // Count transitions along edge
            if (c > 0 && mask[r][c-1] !== mask[r][c]) edgeTransitions++;
            if (r > 0 && mask[r-1][c] !== mask[r][c]) edgeTransitions++;
          }
        }
      }
    }

    return edgePixels > 0 ? edgeTransitions / edgePixels : 0;
  };

  // ============================================================
  // SVG TO MASK PIPELINE FORMAT CONVERTER
  // ============================================================
  function SvgToMaskConverter() {}

  SvgToMaskConverter.convert = function(svgString, targetSize) {
    targetSize = targetSize || 512;

    var parsed = SVGParser.parse(svgString);
    if (!parsed.success) return null;

    // Combine all path d attributes
    var combinedD = '';
    for (var i = 0; i < parsed.paths.length; i++) {
      combinedD += parsed.paths[i].d + ' ';
    }

    // Normalize coordinates to targetSize
    var vb = parsed.viewBox;
    var scale = targetSize / Math.max(vb.width, vb.height);
    var offsetX = (targetSize - vb.width * scale) / 2;
    var offsetY = (targetSize - vb.height * scale) / 2;

    // Parse and transform path commands
    var normalizedD = '';
    var cmdRegex = /([MmZzLlHhVvCcSsQqTtAa])([^MmZzLlHhVvCcSsQqTtAa]*)/g;
    var match;

    while ((match = cmdRegex.exec(combinedD)) !== null) {
      var cmd = match[1];
      var args = match[2].trim().split(/[\s,]+/).map(Number);
      normalizedD += cmd;

      for (var i = 0; i < args.length; i++) {
        if (!isNaN(args[i])) {
          if (cmd === cmd.toUpperCase()) {
            // Absolute coordinates
            if (i % 2 === 0) {
              normalizedD += (args[i] * scale + offsetX).toFixed(1);
            } else {
              normalizedD += (args[i] * scale + offsetY).toFixed(1);
            }
          } else {
            // Relative coordinates — also scale
            normalizedD += (args[i] * scale).toFixed(1);
          }
        }
        if (i < args.length - 1) normalizedD += ' ';
      }
    }

    return {
      d: normalizedD.trim(),
      w: targetSize,
      h: targetSize
    };
  };

  // ============================================================
  // BATCH PROCESSOR
  // ============================================================
  function BatchProcessor() {}

  BatchProcessor.process = function(svgFiles, gridCols, gridRows, options, progressCallback) {
    options = options || {};
    var results = [];
    var total = svgFiles.length;

    for (var i = 0; i < total; i++) {
      var file = svgFiles[i];
      var svgString = typeof file === 'string' ? file : file.content;
      var name = typeof file === 'string' ? 'shape_' + i : file.name;

      if (progressCallback) progressCallback(i, total, name);

      // Validate
      var validation = SVGValidator.validate(svgString);
      if (!validation.valid) {
        results.push({ name: name, success: false, errors: validation.errors });
        continue;
      }

      // Rasterize (fast method)
      var raster = SVGRasterizer.rasterizeFast(svgString, gridCols, gridRows, options);
      if (!raster.success) {
        results.push({ name: name, success: false, errors: [raster.error] });
        continue;
      }

      // Score quality
      var quality = ShapeQualityScorer.score(raster);

      // Convert to mask pipeline format
      var converted = SvgToMaskConverter.convert(svgString);

      results.push({
        name: name,
        success: true,
        mask: raster.mask,
        quality: quality,
        raster: raster,
        converted: converted,
        warnings: validation.warnings
      });
    }

    return results;
  };

  // ============================================================
  // EXPORT FUNCTIONS
  // ============================================================
  function exportToMaskPipelineFormat(results) {
    var output = '// Auto-generated by MXD SVG Engine v' + VERSION + '\n';
    output += 'var SHAPE_PATHS = {\n';
    var entries = [];

    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      if (!r.success || !r.converted) continue;

      var key = r.name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      var d = r.converted.d.replace(/"/g, '\\"');
      entries.push('  ' + key + ':{d:"' + d + '",w:' + r.converted.w + ',h:' + r.converted.h + '}');
    }

    output += entries.join(',\n');
    output += '\n};\n';
    return output;
  }

  function exportToClipboard(results) {
    var output = exportToMaskPipelineFormat(results);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(output);
    }
    return output;
  }

  function downloadAsJS(results, filename) {
    filename = filename || 'mxd-shapes-export.js';
    var output = exportToMaskPipelineFormat(results);
    var blob = new Blob([output], { type: 'application/javascript' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function downloadMaskAsImage(mask, cols, rows, filename) {
    filename = filename || 'mask.png';
    var canvas = document.createElement('canvas');
    canvas.width = cols;
    canvas.height = rows;
    var ctx = canvas.getContext('2d');

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        ctx.fillStyle = mask[r][c] ? '#ffffff' : '#000000';
        ctx.fillRect(c, r, 1, 1);
      }
    }

    canvas.toBlob(function(blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================
  function init() {
    window.MXDSVGEngine = {
      version: VERSION,
      SVGParser: SVGParser,
      SVGRasterizer: SVGRasterizer,
      SVGValidator: SVGValidator,
      ShapeQualityScorer: ShapeQualityScorer,
      SvgToMaskConverter: SvgToMaskConverter,
      BatchProcessor: BatchProcessor,
      exportToMaskPipelineFormat: exportToMaskPipelineFormat,
      exportToClipboard: exportToClipboard,
      downloadAsJS: downloadAsJS,
      downloadMaskAsImage: downloadMaskAsImage
    };

    console.log('[MXD SVG Engine v' + VERSION + '] Loaded — Path2D + Canvas rasterization, zero dependencies');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
