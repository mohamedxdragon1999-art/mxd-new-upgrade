// mxd-svg-engine.js — Professional SVG Processing Engine v2.0
// Standalone SVG processor — no external dependencies (no Paper.js needed)
// Direct integration with mxd-mask-pipeline.js format
// Features: parse, simplify, validate, optimize, batch process, quality scoring

(function(){
  'use strict';

  var VERSION = '2.0.0';

  // ============================================================
  // SVG PATH PARSER
  // ============================================================
  function SVGPathParser() {}

  SVGPathParser.parse = function(d) {
    if (!d || typeof d !== 'string') return [];
    var commands = [];
    var regex = /([MmZzLlHhVvCcSsQqTtAa])([^MmZzLlHhVvCcSsQqTtAa]*)/g;
    var match;
    while ((match = regex.exec(d)) !== null) {
      var cmd = match[1];
      var args = match[2].trim().split(/[\s,]+/).map(Number).filter(function(n) { return !isNaN(n); });
      commands.push({ command: cmd, args: args });
    }
    return commands;
  };

  SVGPathParser.toPoints = function(commands, viewBox) {
    var points = [];
    var cx = 0, cy = 0;
    var startX = 0, startY = 0;
    var prevCtrlX = 0, prevCtrlY = 0;

    for (var i = 0; i < commands.length; i++) {
      var cmd = commands[i];
      var c = cmd.command;
      var args = cmd.args;
      var isRelative = c === c.toLowerCase();

      switch (c.toUpperCase()) {
        case 'M':
          cx = isRelative ? cx + args[0] : args[0];
          cy = isRelative ? cy + args[1] : args[1];
          startX = cx;
          startY = cy;
          points.push({ x: cx, y: cy, type: 'move' });
          break;
        case 'L':
          cx = isRelative ? cx + args[0] : args[0];
          cy = isRelative ? cy + args[1] : args[1];
          points.push({ x: cx, y: cy, type: 'line' });
          break;
        case 'H':
          cx = isRelative ? cx + args[0] : args[0];
          points.push({ x: cx, y: cy, type: 'line' });
          break;
        case 'V':
          cy = isRelative ? cy + args[0] : args[0];
          points.push({ x: cx, y: cy, type: 'line' });
          break;
        case 'C':
          var x1 = isRelative ? cx + args[0] : args[0];
          var y1 = isRelative ? cy + args[1] : args[1];
          var x2 = isRelative ? cx + args[2] : args[2];
          var y2 = isRelative ? cy + args[3] : args[3];
          cx = isRelative ? cx + args[4] : args[4];
          cy = isRelative ? cy + args[5] : args[5];
          prevCtrlX = x2;
          prevCtrlY = y2;
          // Sample bezier curve
          var samples = Math.max(4, Math.ceil(Math.hypot(cx - startX, cy - startY) / 10));
          for (var t = 0; t <= 1; t += 1 / samples) {
            var mt = 1 - t;
            var px = mt*mt*mt*startX + 3*mt*mt*t*x1 + 3*mt*t*t*x2 + t*t*t*cx;
            var py = mt*mt*mt*startY + 3*mt*mt*t*y1 + 3*mt*t*t*y2 + t*t*t*cy;
            points.push({ x: px, y: py, type: 'curve' });
          }
          startX = cx;
          startY = cy;
          break;
        case 'S':
          var x1s = isRelative ? cx + (cx - prevCtrlX) : 2*cx - prevCtrlX;
          var y1s = isRelative ? cy + (cy - prevCtrlY) : 2*cy - prevCtrlY;
          var x2s = isRelative ? cx + args[0] : args[0];
          var y2s = isRelative ? cy + args[1] : args[1];
          cx = isRelative ? cx + args[2] : args[2];
          cy = isRelative ? cy + args[3] : args[3];
          prevCtrlX = x2s;
          prevCtrlY = y2s;
          var samples2 = Math.max(4, Math.ceil(Math.hypot(cx - startX, cy - startY) / 10));
          for (var t2 = 0; t2 <= 1; t2 += 1 / samples2) {
            var mt2 = 1 - t2;
            var px2 = mt2*mt2*mt2*startX + 3*mt2*mt2*t2*x1s + 3*mt2*t2*t2*x2s + t2*t2*t2*cx;
            var py2 = mt2*mt2*mt2*startY + 3*mt2*mt2*t2*y1s + 3*mt2*t2*t2*y2s + t2*t2*t2*cy;
            points.push({ x: px2, y: py2, type: 'curve' });
          }
          startX = cx;
          startY = cy;
          break;
        case 'Q':
          var qx1 = isRelative ? cx + args[0] : args[0];
          var qy1 = isRelative ? cy + args[1] : args[1];
          cx = isRelative ? cx + args[2] : args[2];
          cy = isRelative ? cy + args[3] : args[3];
          var samples3 = Math.max(4, Math.ceil(Math.hypot(cx - startX, cy - startY) / 10));
          for (var t3 = 0; t3 <= 1; t3 += 1 / samples3) {
            var mt3 = 1 - t3;
            var px3 = mt3*mt3*startX + 2*mt3*t3*qx1 + t3*t3*cx;
            var py3 = mt3*mt3*startY + 2*mt3*t3*qy1 + t3*t3*cy;
            points.push({ x: px3, y: py3, type: 'curve' });
          }
          prevCtrlX = qx1;
          prevCtrlY = qy1;
          startX = cx;
          startY = cy;
          break;
        case 'T':
          var tx1 = isRelative ? cx + (cx - prevCtrlX) : 2*cx - prevCtrlX;
          var ty1 = isRelative ? cy + (cy - prevCtrlY) : 2*cy - prevCtrlY;
          cx = isRelative ? cx + args[0] : args[0];
          cy = isRelative ? cy + args[1] : args[1];
          var samples4 = Math.max(4, Math.ceil(Math.hypot(cx - startX, cy - startY) / 10));
          for (var t4 = 0; t4 <= 1; t4 += 1 / samples4) {
            var mt4 = 1 - t4;
            var px4 = mt4*mt4*startX + 2*mt4*t4*tx1 + t4*t4*cx;
            var py4 = mt4*mt4*startY + 2*mt4*t4*ty1 + t4*t4*cy;
            points.push({ x: px4, y: py4, type: 'curve' });
          }
          prevCtrlX = tx1;
          prevCtrlY = ty1;
          startX = cx;
          startY = cy;
          break;
        case 'A':
          var rx = args[0];
          var ry = args[1];
          var rotation = args[2] * Math.PI / 180;
          var largeArc = args[3];
          var sweep = args[4];
          var endX = isRelative ? cx + args[5] : args[5];
          var endY = isRelative ? cy + args[6] : args[6];
          // Approximate arc with bezier curves
          var arcPoints = SVGPathParser._arcToPoints(cx, cy, rx, ry, rotation, largeArc, sweep, endX, endY, 16);
          points.push.apply(points, arcPoints);
          cx = endX;
          cy = endY;
          startX = cx;
          startY = cy;
          break;
        case 'Z':
          if (Math.abs(cx - startX) > 0.1 || Math.abs(cy - startY) > 0.1) {
            points.push({ x: startX, y: startY, type: 'close' });
          }
          cx = startX;
          cy = startY;
          break;
      }
    }

    return points;
  };

  SVGPathParser._arcToPoints = function(cx, cy, rx, ry, rotation, largeArc, sweep, endX, endY, segments) {
    var points = [];
    var startX = cx;
    var startY = cy;
    var angle = rotation;
    var totalAngle = sweep === largeArc ? Math.PI : Math.PI * 0.5;
    if (largeArc) totalAngle = Math.PI * 1.5;

    for (var i = 0; i <= segments; i++) {
      var t = i / segments;
      var a = angle + totalAngle * t * (sweep ? 1 : -1);
      var px = cx + rx * Math.cos(a);
      var py = cy + ry * Math.sin(a);
      points.push({ x: px, y: py, type: 'arc' });
    }
    return points;
  };

  // ============================================================
  // PATH SIMPLIFICATION (Ramer-Douglas-Peucker)
  // ============================================================
  function PathSimplifier() {}

  PathSimplifier.simplify = function(points, tolerance) {
    tolerance = tolerance || 2;
    if (points.length <= 2) return points.slice();

    var maxDist = 0;
    var maxIndex = 0;
    var end = points.length - 1;

    for (var i = 1; i < end; i++) {
      var dist = PathSimplifier._perpendicularDistance(points[i], points[0], points[end]);
      if (dist > maxDist) {
        maxDist = dist;
        maxIndex = i;
      }
    }

    if (maxDist > tolerance) {
      var left = PathSimplifier.simplify(points.slice(0, maxIndex + 1), tolerance);
      var right = PathSimplifier.simplify(points.slice(maxIndex), tolerance);
      return left.slice(0, -1).concat(right);
    }

    return [points[0], points[end]];
  };

  PathSimplifier._perpendicularDistance = function(point, lineStart, lineEnd) {
    var dx = lineEnd.x - lineStart.x;
    var dy = lineEnd.y - lineStart.y;
    var length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) return Math.hypot(point.x - lineStart.x, point.y - lineStart.y);
    return Math.abs(dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x) / length;
  };

  // ============================================================
  // SVG VALIDATOR
  // ============================================================
  function SVGValidator() {}

  SVGValidator.validate = function(svgString) {
    var errors = [];
    var warnings = [];

    if (!svgString || typeof svgString !== 'string') {
      errors.push('Empty or invalid SVG string');
      return { valid: false, errors: errors, warnings: warnings };
    }

    // Check for SVG tag
    if (svgString.indexOf('<svg') === -1) {
      errors.push('No <svg> tag found');
      return { valid: false, errors: errors, warnings: warnings };
    }

    // Check for closing tag
    if (svgString.indexOf('</svg>') === -1) {
      warnings.push('Missing </svg> closing tag');
    }

    // Check for path data
    var pathRegex = /d="([^"]*)"/g;
    var paths = [];
    var match;
    while ((match = pathRegex.exec(svgString)) !== null) {
      paths.push(match[1]);
    }

    if (paths.length === 0) {
      warnings.push('No path data found');
    }

    // Validate each path
    for (var i = 0; i < paths.length; i++) {
      var pathResult = SVGValidator._validatePath(paths[i]);
      errors.push.apply(errors, pathResult.errors);
      warnings.push.apply(warnings, pathResult.warnings);
    }

    // Check viewBox
    var viewBoxRegex = /viewBox="([^"]*)"/;
    var viewBoxMatch = viewBoxRegex.exec(svgString);
    if (!viewBoxMatch) {
      warnings.push('No viewBox attribute — scaling may be inconsistent');
    }

    // Check for unsupported elements
    var unsupportedElements = ['<filter', '<fe', '<clipPath', '<mask', '<pattern', '<linearGradient', '<radialGradient'];
    for (var j = 0; j < unsupportedElements.length; j++) {
      if (svgString.indexOf(unsupportedElements[j]) !== -1) {
        warnings.push('Contains ' + unsupportedElements[j] + ' — may not render correctly in all contexts');
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      warnings: warnings,
      pathCount: paths.length,
      hasViewBox: !!viewBoxMatch
    };
  };

  SVGValidator._validatePath = function(d) {
    var errors = [];
    var warnings = [];

    if (!d || d.trim() === '') {
      errors.push('Empty path data');
      return { errors: errors, warnings: warnings };
    }

    // Check for valid commands
    var validCommands = 'MmZzLlHhVvCcSsQqTtAa';
    var commandRegex = /([MmZzLlHhVvCcSsQqTtAa])/g;
    var match;
    var lastCommand = null;

    while ((match = commandRegex.exec(d)) !== null) {
      var cmd = match[1];
      if (validCommands.indexOf(cmd) === -1) {
        errors.push('Invalid command: ' + cmd);
      }
      lastCommand = cmd;
    }

    // Check if path starts with M
    if (d.trim().charAt(0).toUpperCase() !== 'M') {
      warnings.push('Path does not start with M (move) command');
    }

    return { errors: errors, warnings: warnings };
  };

  // ============================================================
  // SVG OPTIMIZER
  // ============================================================
  function SVGOptimizer() {}

  SVGOptimizer.optimize = function(svgString, options) {
    options = options || {};
    var precision = options.precision || 2;
    var removeComments = options.removeComments !== false;
    var removeMetadata = options.removeMetadata !== false;
    var collapseWhitespace = options.collapseWhitespace !== false;
    var minify = options.minify !== false;

    var result = svgString;

    // Remove comments
    if (removeComments) {
      result = result.replace(/<!--[\s\S]*?-->/g, '');
    }

    // Remove metadata
    if (removeMetadata) {
      result = result.replace(/<metadata[\s\S]*?<\/metadata>/g, '');
      result = result.replace(/<title[\s\S]*?<\/title>/g, '');
      result = result.replace(/<desc[\s\S]*?<\/desc>/g, '');
    }

    // Remove unnecessary attributes
    result = result.replace(/\s*version="[^"]*"/g, '');
    result = result.replace(/\s*xmlns="[^"]*"/g, function(match) {
      return match.indexOf('xmlns="http://www.w3.org/2000/svg"') !== -1 ? match : '';
    });

    // Optimize path data
    result = result.replace(/d="([^"]*)"/g, function(match, d) {
      return 'd="' + SVGOptimizer._optimizePath(d, precision) + '"';
    });

    // Collapse whitespace
    if (collapseWhitespace) {
      result = result.replace(/\s+/g, ' ').trim();
    }

    // Minify
    if (minify) {
      result = result.replace(/>\s+</g, '><');
      result = result.replace(/\s*=\s*/g, '=');
      result = result.replace(/"\s+/g, '"');
      result = result.replace(/\s+"/g, '"');
    }

    return result;
  };

  SVGOptimizer._optimizePath = function(d, precision) {
    var commands = SVGPathParser.parse(d);
    var result = '';

    for (var i = 0; i < commands.length; i++) {
      var cmd = commands[i];
      result += cmd.command;
      for (var j = 0; j < cmd.args.length; j++) {
        result += (j > 0 ? ' ' : '') + cmd.args[j].toFixed(precision).replace(/\.?0+$/, '');
      }
    }

    return result;
  };

  // ============================================================
  // SHAPE QUALITY SCORER
  // ============================================================
  function ShapeQualityScorer() {}

  ShapeQualityScorer.score = function(points, options) {
    options = options || {};
    var targetGridSize = options.targetGridSize || 50;

    var score = 100;
    var issues = [];

    // Check point count
    if (points.length < 10) {
      score -= 30;
      issues.push('Too few points — shape may be too simple');
    } else if (points.length > 500) {
      score -= 20;
      issues.push('Too many points — consider simplifying');
    }

    // Check bounding box aspect ratio
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (var i = 0; i < points.length; i++) {
      if (points[i].x < minX) minX = points[i].x;
      if (points[i].y < minY) minY = points[i].y;
      if (points[i].x > maxX) maxX = points[i].x;
      if (points[i].y > maxY) maxY = points[i].y;
    }

    var width = maxX - minX;
    var height = maxY - minY;
    var aspectRatio = width / height;

    if (aspectRatio > 3 || aspectRatio < 0.33) {
      score -= 15;
      issues.push('Extreme aspect ratio (' + aspectRatio.toFixed(2) + ')');
    }

    // Check for self-intersections (simplified)
    var intersectionCount = 0;
    for (var i = 0; i < points.length - 1; i++) {
      for (var j = i + 2; j < points.length - 1; j++) {
        if (ShapeQualityScorer._linesIntersect(points[i], points[i+1], points[j], points[j+1])) {
          intersectionCount++;
        }
      }
    }

    if (intersectionCount > 5) {
      score -= 20;
      issues.push('Many self-intersections (' + intersectionCount + ')');
    } else if (intersectionCount > 0) {
      score -= 5;
      issues.push('Some self-intersections (' + intersectionCount + ')');
    }

    // Check connectivity (BFS)
    var connectivity = ShapeQualityScorer._checkConnectivity(points, targetGridSize);
    if (!connectivity.connected) {
      score -= 25;
      issues.push('Shape has disconnected regions');
    }

    // Check fill ratio
    var fillRatio = ShapeQualityScorer._estimateFillRatio(points, targetGridSize);
    if (fillRatio < 0.1) {
      score -= 20;
      issues.push('Very low fill ratio (' + (fillRatio * 100).toFixed(1) + '%)');
    } else if (fillRatio > 0.95) {
      score -= 10;
      issues.push('Very high fill ratio — may look like a solid block');
    }

    // Check point density uniformity
    var densityScore = ShapeQualityScorer._checkDensityUniformity(points);
    if (densityScore < 0.5) {
      score -= 10;
      issues.push('Uneven point density');
    }

    score = Math.max(0, Math.min(100, score));

    return {
      score: score,
      grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
      issues: issues,
      metrics: {
        pointCount: points.length,
        boundingBox: { width: width, height: height },
        aspectRatio: aspectRatio,
        intersectionCount: intersectionCount,
        fillRatio: fillRatio,
        connected: connectivity.connected
      }
    };
  };

  ShapeQualityScorer._linesIntersect = function(p1, p2, p3, p4) {
    var d1 = (p3.x - p4.x) * (p1.y - p3.y) - (p3.y - p4.y) * (p1.x - p3.x);
    var d2 = (p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x);
    var d3 = (p3.x - p4.x) * (p2.y - p3.y) - (p3.y - p4.y) * (p2.x - p3.x);
    var d4 = (p1.x - p2.x) * (p2.y - p3.y) - (p1.y - p2.y) * (p2.x - p3.x);
    return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
  };

  ShapeQualityScorer._checkConnectivity = function(points, gridSize) {
    // Simplified connectivity check using bounding box
    if (points.length < 3) return { connected: false };

    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (var i = 0; i < points.length; i++) {
      if (points[i].x < minX) minX = points[i].x;
      if (points[i].y < minY) minY = points[i].y;
      if (points[i].x > maxX) maxX = points[i].x;
      if (points[i].y > maxY) maxY = points[i].y;
    }

    // Create a simple grid mask
    var cols = Math.min(gridSize, Math.ceil((maxX - minX) / 2));
    var rows = Math.min(gridSize, Math.ceil((maxY - minY) / 2));
    var grid = [];
    for (var r = 0; r < rows; r++) {
      grid[r] = [];
      for (var c = 0; c < cols; c++) {
        grid[r][c] = false;
      }
    }

    // Mark cells that contain points
    for (var i = 0; i < points.length; i++) {
      var col = Math.floor((points[i].x - minX) / (maxX - minX) * (cols - 1));
      var row = Math.floor((points[i].y - minY) / (maxY - minY) * (rows - 1));
      if (row >= 0 && row < rows && col >= 0 && col < cols) {
        grid[row][col] = true;
      }
    }

    // BFS to check connectivity
    var visited = 0;
    var queue = [];
    var startFound = false;

    for (var r = 0; r < rows && !startFound; r++) {
      for (var c = 0; c < cols && !startFound; c++) {
        if (grid[r][c]) {
          queue.push([r, c]);
          grid[r][c] = false;
          visited++;
          startFound = true;
        }
      }
    }

    while (queue.length > 0) {
      var curr = queue.shift();
      var cr = curr[0], cc = curr[1];

      var neighbors = [[cr-1,cc],[cr+1,cc],[cr,cc-1],[cr,cc+1]];
      for (var n = 0; n < neighbors.length; n++) {
        var nr = neighbors[n][0], nc = neighbors[n][1];
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc]) {
          grid[nr][nc] = false;
          visited++;
          queue.push([nr, nc]);
        }
      }
    }

    // Count total filled cells
    var totalFilled = 0;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (grid[r][c]) totalFilled++;
      }
    }

    return { connected: totalFilled === 0, visited: visited, total: visited + totalFilled };
  };

  ShapeQualityScorer._estimateFillRatio = function(points, gridSize) {
    if (points.length < 3) return 0;

    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (var i = 0; i < points.length; i++) {
      if (points[i].x < minX) minX = points[i].x;
      if (points[i].y < minY) minY = points[i].y;
      if (points[i].x > maxX) maxX = points[i].x;
      if (points[i].y > maxY) maxY = points[i].y;
    }

    var cols = Math.min(gridSize, Math.ceil((maxX - minX) / 2));
    var rows = Math.min(gridSize, Math.ceil((maxY - minY) / 2));
    var filled = 0;
    var total = rows * cols;

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var px = minX + (c / cols) * (maxX - minX);
        var py = minY + (r / rows) * (maxY - minY);
        if (ShapeQualityScorer._pointInPolygon(px, py, points)) {
          filled++;
        }
      }
    }

    return filled / total;
  };

  ShapeQualityScorer._pointInPolygon = function(px, py, polygon) {
    var inside = false;
    for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      var xi = polygon[i].x, yi = polygon[i].y;
      var xj = polygon[j].x, yj = polygon[j].y;
      var intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  ShapeQualityScorer._checkDensityUniformity = function(points) {
    if (points.length < 10) return 1;

    // Divide into quadrants and check point distribution
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (var i = 0; i < points.length; i++) {
      if (points[i].x < minX) minX = points[i].x;
      if (points[i].y < minY) minY = points[i].y;
      if (points[i].x > maxX) maxX = points[i].x;
      if (points[i].y > maxY) maxY = points[i].y;
    }

    var midX = (minX + maxX) / 2;
    var midY = (minY + maxY) / 2;
    var quadrants = [0, 0, 0, 0];

    for (var i = 0; i < points.length; i++) {
      var q = (points[i].x < midX ? 0 : 1) + (points[i].y < midY ? 0 : 2);
      quadrants[q]++;
    }

    var max = Math.max.apply(null, quadrants);
    var min = Math.min.apply(null, quadrants);
    if (max === 0) return 1;
    return min / max;
  };

  // ============================================================
  // SVG TO MASK PIPELINE FORMAT CONVERTER
  // ============================================================
  function SvgToMaskConverter() {}

  SvgToMaskConverter.convert = function(svgString, options) {
    options = options || {};
    var tolerance = options.tolerance || 2;
    var targetSize = options.targetSize || 512;

    // Extract viewBox
    var viewBoxMatch = svgString.match(/viewBox="([^"]*)"/);
    var viewBox = viewBoxMatch ? viewBoxMatch[1].split(/[\s,]+/).map(Number) : [0, 0, 512, 512];

    // Extract all path d attributes
    var pathRegex = /d="([^"]*)"/g;
    var paths = [];
    var match;
    while ((match = pathRegex.exec(svgString)) !== null) {
      paths.push(match[1]);
    }

    if (paths.length === 0) {
      return null;
    }

    // Combine all paths into one
    var combinedD = paths.join(' ');

    // Parse and simplify
    var commands = SVGPathParser.parse(combinedD);
    var points = SVGPathParser.toPoints(commands, viewBox);

    if (points.length === 0) {
      return null;
    }

    // Simplify
    var simplified = PathSimplifier.simplify(points, tolerance);

    // Normalize to target size
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (var i = 0; i < simplified.length; i++) {
      if (simplified[i].x < minX) minX = simplified[i].x;
      if (simplified[i].y < minY) minY = simplified[i].y;
      if (simplified[i].x > maxX) maxX = simplified[i].x;
      if (simplified[i].y > maxY) maxY = simplified[i].y;
    }

    var scale = targetSize / Math.max(maxX - minX, maxY - minY);
    var offsetX = (targetSize - (maxX - minX) * scale) / 2;
    var offsetY = (targetSize - (maxY - minY) * scale) / 2;

    // Build normalized path
    var normalizedD = 'M';
    for (var i = 0; i < simplified.length; i++) {
      var nx = (simplified[i].x - minX) * scale + offsetX;
      var ny = (simplified[i].y - minY) * scale + offsetY;
      if (i > 0) normalizedD += ' L';
      normalizedD += nx.toFixed(1) + ' ' + ny.toFixed(1);
    }
    normalizedD += ' Z';

    return {
      d: normalizedD,
      w: targetSize,
      h: targetSize,
      originalPoints: points.length,
      simplifiedPoints: simplified.length,
      reduction: ((1 - simplified.length / points.length) * 100).toFixed(1) + '%'
    };
  };

  // ============================================================
  // BATCH PROCESSOR
  // ============================================================
  function BatchProcessor() {}

  BatchProcessor.process = function(svgFiles, options, progressCallback) {
    options = options || {};
    var results = [];
    var total = svgFiles.length;

    for (var i = 0; i < total; i++) {
      var file = svgFiles[i];
      var svgString = typeof file === 'string' ? file : file.content;
      var name = typeof file === 'string' ? 'shape_' + i : file.name;

      if (progressCallback) {
        progressCallback(i, total, name);
      }

      // Validate
      var validation = SVGValidator.validate(svgString);
      if (!validation.valid) {
        results.push({
          name: name,
          success: false,
          errors: validation.errors,
          warnings: validation.warnings
        });
        continue;
      }

      // Convert
      var converted = SvgToMaskConverter.convert(svgString, options);
      if (!converted) {
        results.push({
          name: name,
          success: false,
          errors: ['Failed to convert SVG to mask format']
        });
        continue;
      }

      // Score quality
      var commands = SVGPathParser.parse(converted.d);
      var points = SVGPathParser.toPoints(commands, [0, 0, converted.w, converted.h]);
      var quality = ShapeQualityScorer.score(points, options);

      results.push({
        name: name,
        success: true,
        data: converted,
        quality: quality,
        warnings: validation.warnings
      });
    }

    return results;
  };

  // ============================================================
  // EXPORT
  // ============================================================
  function exportToMaskPipelineFormat(results) {
    var output = 'var SHAPE_PATHS = {\n';
    var entries = [];

    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      if (!r.success) continue;

      var key = r.name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      var d = r.data.d.replace(/"/g, '\\"');
      entries.push('  ' + key + ':{d:"' + d + '",w:' + r.data.w + ',h:' + r.data.h + '}');
    }

    output += entries.join(',\n');
    output += '\n};\n';
    output += 'module.exports = SHAPE_PATHS;\n';

    return output;
  }

  function exportToClipboard(results) {
    var output = exportToMaskPipelineFormat(results);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(output).then(function() {
        console.log('[MXD SVG Engine] Copied to clipboard');
      });
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

  // ============================================================
  // INITIALIZATION
  // ============================================================
  function init() {
    window.MXDSVGEngine = {
      version: VERSION,
      SVGPathParser: SVGPathParser,
      PathSimplifier: PathSimplifier,
      SVGValidator: SVGValidator,
      SVGOptimizer: SVGOptimizer,
      ShapeQualityScorer: ShapeQualityScorer,
      SvgToMaskConverter: SvgToMaskConverter,
      BatchProcessor: BatchProcessor,
      exportToMaskPipelineFormat: exportToMaskPipelineFormat,
      exportToClipboard: exportToClipboard,
      downloadAsJS: downloadAsJS
    };

    console.log('[MXD SVG Engine] v' + VERSION + ' loaded — no external dependencies');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
