// mxd-svg-shape-manager.js — SVG Shape Manager UI v1.0
// Modern, card-based UI integrated into MXD Settings panel
// Drag & drop import, live preview, quality scoring, batch processing, export

(function(){
  'use strict';

  var VERSION = '1.0.0';

  // ============================================================
  // SVG SHAPE MANAGER UI
  // ============================================================
  function SVGShapeManager() {
    this.shapes = [];
    this.currentPreview = null;
    this.container = null;
    this.activeTab = 'import';
  }

  SVGShapeManager.prototype.init = function(containerId) {
    var self = this;
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.render();
    this.loadSavedShapes();
  };

  SVGShapeManager.prototype.render = function() {
    var self = this;
    var container = this.container;

    container.innerHTML =
      '<div class="svg-manager">' +
        '<div class="svg-tabs">' +
          '<button class="svg-tab active" data-tab="import" onclick="MXDSVGShapeManager.setTab(\'import\')">' +
            '<span class="svg-tab-icon">\uD83D\uDCE5</span> Import SVG' +
          '</button>' +
          '<button class="svg-tab" data-tab="library" onclick="MXDSVGShapeManager.setTab(\'library\')">' +
            '<span class="svg-tab-icon">\uD83D\uDCC1</span> Shape Library <span class="svg-count" id="svg-shape-count">0</span>' +
          '</button>' +
          '<button class="svg-tab" data-tab="batch" onclick="MXDSVGShapeManager.setTab(\'batch\')">' +
            '<span class="svg-tab-icon">\uD83D\uDCE6</span> Batch Process' +
          '</button>' +
          '<button class="svg-tab" data-tab="export" onclick="MXDSVGShapeManager.setTab(\'export\')">' +
            '<span class="svg-tab-icon">\uD83D\uDCBE</span> Export' +
          '</button>' +
        '</div>' +

        '<div class="svg-content">' +
          // IMPORT TAB
          '<div class="svg-panel active" id="svg-panel-import">' +
            '<div class="svg-drop-zone" id="svg-drop-zone">' +
              '<div class="svg-drop-icon">\uD83D\uDCC2</div>' +
              '<div class="svg-drop-text">Drop SVG files here or click to browse</div>' +
              '<div class="svg-drop-hint">Supports .svg files, SVG code paste, or image URLs</div>' +
              '<input type="file" id="svg-file-input" accept=".svg" multiple style="display:none" />' +
            '</div>' +

            '<div class="svg-paste-area">' +
              '<textarea id="svg-code-input" placeholder="Or paste SVG code here..." rows="4"></textarea>' +
            '</div>' +

            '<div class="svg-options">' +
              '<div class="svg-option-group">' +
                '<label>Grid Size</label>' +
                '<div class="svg-size-inputs">' +
                  '<input type="number" id="svg-grid-cols" value="25" min="5" max="100" class="svg-num-input" />' +
                  '<span class="svg-x">\u00D7</span>' +
                  '<input type="number" id="svg-grid-rows" value="25" min="5" max="100" class="svg-num-input" />' +
                '</div>' +
              '</div>' +
              '<div class="svg-option-group">' +
                '<label>Padding</label>' +
                '<input type="range" id="svg-padding" min="0" max="0.2" step="0.01" value="0.05" class="svg-range" />' +
                '<span class="svg-range-value" id="svg-padding-value">5%</span>' +
              '</div>' +
              '<div class="svg-option-group">' +
                '<label>Fill Rule</label>' +
                '<select id="svg-fill-rule" class="svg-select">' +
                  '<option value="nonzero">Non-Zero (default)</option>' +
                  '<option value="evenodd">Even-Odd</option>' +
                '</select>' +
              '</div>' +
            '</div>' +

            '<button class="svg-btn svg-btn-primary" id="svg-process-btn" onclick="MXDSVGShapeManager.processSVG()">' +
              '\u26A1 Process & Preview' +
            '</button>' +

            '<div class="svg-preview" id="svg-preview-area" style="display:none">' +
              '<div class="svg-preview-header">' +
                '<h4>Preview</h4>' +
                '<div class="svg-quality-badge" id="svg-quality-badge"></div>' +
              '</div>' +
              '<div class="svg-preview-grid" id="svg-preview-grid"></div>' +
              '<div class="svg-preview-info" id="svg-preview-info"></div>' +
              '<div class="svg-preview-actions">' +
                '<button class="svg-btn svg-btn-sm" onclick="MXDSVGShapeManager.saveCurrentShape()">\uD83D\uDCBE Save to Library</button>' +
                '<button class="svg-btn svg-btn-sm svg-btn-sec" onclick="MXDSVGShapeManager.downloadMask()">\uD83D\uDDBC Download Mask</button>' +
              '</div>' +
            '</div>' +
          '</div>' +

          // LIBRARY TAB
          '<div class="svg-panel" id="svg-panel-library">' +
            '<div class="svg-library-header">' +
              '<h4>Saved Shapes</h4>' +
              '<div class="svg-library-actions">' +
                '<button class="svg-btn svg-btn-sm" onclick="MXDSVGShapeManager.exportLibrary()">\uD83D\uDCE4 Export All</button>' +
                '<button class="svg-btn svg-btn-sm svg-btn-danger" onclick="MXDSVGShapeManager.clearLibrary()">\uD83D\uDDD1 Clear</button>' +
              '</div>' +
            '</div>' +
            '<div class="svg-library-grid" id="svg-library-grid"></div>' +
            '<div class="svg-library-empty" id="svg-library-empty">' +
              '<div class="svg-empty-icon">\uD83D\uDCC2</div>' +
              '<div>No shapes saved yet</div>' +
              '<div class="svg-empty-hint">Import and process SVG shapes to build your library</div>' +
            '</div>' +
          '</div>' +

          // BATCH TAB
          '<div class="svg-panel" id="svg-panel-batch">' +
            '<div class="svg-batch-header">' +
              '<h4>Batch Process</h4>' +
              '<div class="svg-batch-drop-zone" id="svg-batch-drop">' +
                '<span>\uD83D\uDCC2 Drop multiple SVG files</span>' +
                '<input type="file" id="svg-batch-input" accept=".svg" multiple style="display:none" />' +
              '</div>' +
            '</div>' +
            '<div class="svg-batch-progress" id="svg-batch-progress" style="display:none">' +
              '<div class="svg-progress-bar"><div class="svg-progress-fill" id="svg-progress-fill"></div></div>' +
              '<div class="svg-progress-text" id="svg-progress-text">Processing...</div>' +
            '</div>' +
            '<div class="svg-batch-results" id="svg-batch-results"></div>' +
          '</div>' +

          // EXPORT TAB
          '<div class="svg-panel" id="svg-panel-export">' +
            '<div class="svg-export-section">' +
              '<h4>Export to Mask Pipeline Format</h4>' +
              '<p class="svg-export-desc">Generates JavaScript code compatible with mxd-mask-pipeline.js</p>' +
              '<textarea id="svg-export-output" readonly rows="12" class="svg-export-code"></textarea>' +
              '<div class="svg-export-actions">' +
                '<button class="svg-btn" onclick="MXDSVGShapeManager.copyExport()">\uD83D\uDCCB Copy to Clipboard</button>' +
                '<button class="svg-btn" onclick="MXDSVGShapeManager.downloadExport()">\uD83D\uDCE5 Download .js File</button>' +
              '</div>' +
            '</div>' +
            '<div class="svg-export-section">' +
              '<h4>Export as Image Masks</h4>' +
              '<p class="svg-export-desc">Download shape masks as PNG images</p>' +
              '<button class="svg-btn" onclick="MXDSVGShapeManager.downloadAllMasks()">\uD83D\uDDBC Download All Masks</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    // Setup event listeners
    this._setupEvents();
    this._updateLibrary();
  };

  SVGShapeManager.prototype._setupEvents = function() {
    var self = this;

    // Drop zone
    var dropZone = document.getElementById('svg-drop-zone');
    var fileInput = document.getElementById('svg-file-input');

    dropZone.addEventListener('click', function() { fileInput.click(); });

    dropZone.addEventListener('dragover', function(e) {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', function() {
      dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', function(e) {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      var files = e.dataTransfer.files;
      if (files.length > 0) {
        self._handleFile(files[0]);
      }
    });

    fileInput.addEventListener('change', function() {
      if (fileInput.files.length > 0) {
        self._handleFile(fileInput.files[0]);
      }
    });

    // Padding slider
    var paddingSlider = document.getElementById('svg-padding');
    if (paddingSlider) {
      paddingSlider.addEventListener('input', function() {
        document.getElementById('svg-padding-value').textContent = Math.round(this.value * 100) + '%';
      });
    }

    // Batch drop zone
    var batchDrop = document.getElementById('svg-batch-drop');
    var batchInput = document.getElementById('svg-batch-input');
    if (batchDrop && batchInput) {
      batchDrop.addEventListener('click', function() { batchInput.click(); });
      batchDrop.addEventListener('dragover', function(e) { e.preventDefault(); });
      batchDrop.addEventListener('drop', function(e) {
        e.preventDefault();
        if (e.dataTransfer.files.length > 0) {
          self._handleBatchFiles(e.dataTransfer.files);
        }
      });
      batchInput.addEventListener('change', function() {
        if (batchInput.files.length > 0) {
          self._handleBatchFiles(batchInput.files);
        }
      });
    }
  };

  SVGShapeManager.prototype._handleFile = function(file) {
    var self = this;
    var reader = new FileReader();
    reader.onload = function(e) {
      document.getElementById('svg-code-input').value = e.target.result;
    };
    reader.readAsText(file);
  };

  SVGShapeManager.prototype.processSVG = function() {
    var svgCode = document.getElementById('svg-code-input').value.trim();
    if (!svgCode) {
      this._showMessage('Please paste SVG code or drop a file', 'error');
      return;
    }

    var cols = parseInt(document.getElementById('svg-grid-cols').value) || 25;
    var rows = parseInt(document.getElementById('svg-grid-rows').value) || 25;
    var padding = parseFloat(document.getElementById('svg-padding').value) || 0.05;
    var fillRule = document.getElementById('svg-fill-rule').value || 'nonzero';

    // Validate
    var validation = window.MXDSVGEngine.SVGValidator.validate(svgCode);
    if (!validation.valid) {
      this._showMessage('Invalid SVG: ' + validation.errors.join(', '), 'error');
      return;
    }

    // Rasterize
    var raster = window.MXDSVGEngine.SVGRasterizer.rasterizeFast(svgCode, cols, rows, {
      padding: padding,
      fillRule: fillRule
    });

    if (!raster.success) {
      this._showMessage('Rasterization failed: ' + raster.error, 'error');
      return;
    }

    // Score quality
    var quality = window.MXDSVGEngine.ShapeQualityScorer.score(raster);

    // Store current preview
    this.currentPreview = {
      svg: svgCode,
      mask: raster.mask,
      cols: cols,
      rows: rows,
      quality: quality,
      raster: raster
    };

    // Render preview
    this._renderPreview(raster, quality);
  };

  SVGShapeManager.prototype._renderPreview = function(raster, quality) {
    var previewArea = document.getElementById('svg-preview-area');
    var previewGrid = document.getElementById('svg-preview-grid');
    var previewInfo = document.getElementById('svg-preview-info');
    var qualityBadge = document.getElementById('svg-quality-badge');

    previewArea.style.display = 'block';

    // Quality badge
    var gradeColor = { A: '#10b981', B: '#22c55e', C: '#f59e0b', D: '#f97316', F: '#ef4444' };
    qualityBadge.innerHTML = '<span class="svg-grade" style="background:' + (gradeColor[quality.grade] || '#94a3b8') + '">' + quality.grade + '</span> ' + quality.score + '/100';

    // Grid preview (render as small canvas)
    var canvas = document.createElement('canvas');
    var cellSize = Math.min(400 / raster.cols, 400 / raster.rows);
    canvas.width = raster.cols * cellSize;
    canvas.height = raster.rows * cellSize;
    canvas.style.maxWidth = '100%';
    canvas.style.borderRadius = '8px';
    canvas.style.border = '1px solid var(--border, #334155)';
    var ctx = canvas.getContext('2d');

    for (var r = 0; r < raster.rows; r++) {
      for (var c = 0; c < raster.cols; c++) {
        ctx.fillStyle = raster.mask[r][c] ? '#6366f1' : '#1e293b';
        ctx.fillRect(c * cellSize, r * cellSize, cellSize - 0.5, cellSize - 0.5);
      }
    }

    previewGrid.innerHTML = '';
    previewGrid.appendChild(canvas);

    // Info
    var issuesHtml = '';
    if (quality.issues.length > 0) {
      issuesHtml = '<div class="svg-issues"><strong>Issues:</strong><ul>';
      for (var i = 0; i < quality.issues.length; i++) {
        issuesHtml += '<li>' + quality.issues[i] + '</li>';
      }
      issuesHtml += '</ul></div>';
    }

    previewInfo.innerHTML =
      '<div class="svg-stats">' +
        '<div class="svg-stat"><span class="svg-stat-label">Grid</span><span class="svg-stat-value">' + raster.cols + '\u00D7' + raster.rows + '</span></div>' +
        '<div class="svg-stat"><span class="svg-stat-label">Fill</span><span class="svg-stat-value">' + (raster.fillRatio * 100).toFixed(1) + '%</span></div>' +
        '<div class="svg-stat"><span class="svg-stat-label">Cells</span><span class="svg-stat-value">' + raster.filledCount + '/' + raster.totalCells + '</span></div>' +
        '<div class="svg-stat"><span class="svg-stat-label">Paths</span><span class="svg-stat-value">' + raster.pathCount + '</span></div>' +
        '<div class="svg-stat"><span class="svg-stat-label">Connected</span><span class="svg-stat-value">' + (quality.metrics.connected ? 'Yes' : 'No') + '</span></div>' +
      '</div>' +
      issuesHtml;
  };

  SVGShapeManager.prototype.saveCurrentShape = function() {
    if (!this.currentPreview) return;

    var name = prompt('Shape name:', 'custom_shape_' + (this.shapes.length + 1));
    if (!name) return;

    // Convert to mask pipeline format
    var converted = window.MXDSVGEngine.SvgToMaskConverter.convert(this.currentPreview.svg);

    var shape = {
      id: Date.now().toString(),
      name: name,
      svg: this.currentPreview.svg,
      mask: this.currentPreview.mask,
      cols: this.currentPreview.cols,
      rows: this.currentPreview.rows,
      quality: this.currentPreview.quality,
      converted: converted,
      createdAt: new Date().toISOString()
    };

    this.shapes.push(shape);
    this._saveShapes();
    this._updateLibrary();
    this._showMessage('Shape "' + name + '" saved!', 'success');
  };

  SVGShapeManager.prototype._updateLibrary = function() {
    var grid = document.getElementById('svg-library-grid');
    var empty = document.getElementById('svg-library-empty');
    var count = document.getElementById('svg-shape-count');

    if (!grid) return;

    count.textContent = this.shapes.length;

    if (this.shapes.length === 0) {
      grid.style.display = 'none';
      empty.style.display = 'block';
      return;
    }

    grid.style.display = 'grid';
    empty.style.display = 'none';

    var html = '';
    for (var i = 0; i < this.shapes.length; i++) {
      var s = this.shapes[i];
      var gradeColor = { A: '#10b981', B: '#22c55e', C: '#f59e0b', D: '#f97316', F: '#ef4444' };
      var color = gradeColor[s.quality.grade] || '#94a3b8';

      html += '<div class="svg-shape-card">' +
        '<div class="svg-shape-preview">' +
          this._renderMiniMask(s.mask, s.rows, s.cols) +
        '</div>' +
        '<div class="svg-shape-info">' +
          '<div class="svg-shape-name">' + this._escapeHtml(s.name) + '</div>' +
          '<div class="svg-shape-meta">' +
            '<span class="svg-shape-grade" style="background:' + color + '">' + s.quality.grade + '</span>' +
            '<span>' + s.cols + '\u00D7' + s.rows + '</span>' +
            '<span>' + (s.quality.metrics.fillRatio * 100).toFixed(0) + '%</span>' +
          '</div>' +
        '</div>' +
        '<div class="svg-shape-actions">' +
          '<button class="svg-btn-icon" onclick="MXDSVGShapeManager.useShape(\'' + s.id + '\')" title="Use">\u2713</button>' +
          '<button class="svg-btn-icon" onclick="MXDSVGShapeManager.deleteShape(\'' + s.id + '\')" title="Delete">\u00D7</button>' +
        '</div>' +
      '</div>';
    }

    grid.innerHTML = html;
  };

  SVGShapeManager.prototype._renderMiniMask = function(mask, rows, cols) {
    var size = 80;
    var cellSize = size / Math.max(cols, rows);
    var canvas = document.createElement('canvas');
    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    var ctx = canvas.getContext('2d');

    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        ctx.fillStyle = mask[r][c] ? '#6366f1' : '#0f172a';
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }
    }

    return canvas.outerHTML || '<div class="svg-mini-mask"></div>';
  };

  SVGShapeManager.prototype.useShape = function(id) {
    var shape = this.shapes.find(function(s) { return s.id === id; });
    if (!shape) return;

    // Apply shape to the main app's shape selector
    if (window.MXD_SETTINGS) {
      window.MXD_SETTINGS.set('shape', shape.name);
    }

    // Add to mask pipeline if available
    if (window.MXDMaskPipeline && shape.converted) {
      var paths = window.MXDMaskPipeline.SHAPE_PATHS || {};
      var key = shape.name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      paths[key] = shape.converted;
      window.MXDMaskPipeline.SHAPE_PATHS = paths;
    }

    this._showMessage('Shape "' + shape.name + '" applied!', 'success');
  };

  SVGShapeManager.prototype.deleteShape = function(id) {
    if (!confirm('Delete this shape?')) return;
    this.shapes = this.shapes.filter(function(s) { return s.id !== id; });
    this._saveShapes();
    this._updateLibrary();
  };

  SVGShapeManager.prototype._handleBatchFiles = function(files) {
    var self = this;
    var progress = document.getElementById('svg-batch-progress');
    var progressFill = document.getElementById('svg-progress-fill');
    var progressText = document.getElementById('svg-progress-text');
    var results = document.getElementById('svg-batch-results');

    progress.style.display = 'block';
    results.innerHTML = '';

    var cols = parseInt(document.getElementById('svg-grid-cols').value) || 25;
    var rows = parseInt(document.getElementById('svg-grid-rows').value) || 25;

    var fileArray = [];
    var loaded = 0;

    for (var i = 0; i < files.length; i++) {
      (function(file, idx) {
        var reader = new FileReader();
        reader.onload = function(e) {
          fileArray[idx] = { name: file.name.replace('.svg', ''), content: e.target.result };
          loaded++;
          if (loaded === files.length) {
            self._runBatch(fileArray, cols, rows);
          }
        };
        reader.readAsText(file);
      })(files[i], i);
    }
  };

  SVGShapeManager.prototype._runBatch = function(files, cols, rows) {
    var self = this;
    var progressFill = document.getElementById('svg-progress-fill');
    var progressText = document.getElementById('svg-progress-text');
    var results = document.getElementById('svg-batch-results');

    var batchResults = window.MXDSVGEngine.BatchProcessor.process(files, cols, rows, {}, function(current, total, name) {
      var pct = Math.round((current / total) * 100);
      progressFill.style.width = pct + '%';
      progressText.textContent = 'Processing ' + (current + 1) + '/' + total + ': ' + name;
    });

    progressText.textContent = 'Done! Processed ' + batchResults.filter(function(r) { return r.success; }).length + '/' + files.length + ' shapes';

    // Render results
    var html = '<div class="svg-batch-list">';
    for (var i = 0; i < batchResults.length; i++) {
      var r = batchResults[i];
      if (r.success) {
        var gradeColor = { A: '#10b981', B: '#22c55e', C: '#f59e0b', D: '#f97316', F: '#ef4444' };
        var color = gradeColor[r.quality.grade] || '#94a3b8';
        html += '<div class="svg-batch-item svg-batch-success">' +
          '<span class="svg-batch-name">' + this._escapeHtml(r.name) + '</span>' +
          '<span class="svg-batch-grade" style="background:' + color + '">' + r.quality.grade + '</span>' +
          '<span class="svg-batch-fill">' + (r.raster.fillRatio * 100).toFixed(0) + '%</span>' +
          '<button class="svg-btn-icon" onclick="MXDSVGShapeManager.saveBatchShape(' + i + ')" title="Save">\uD83D\uDCBE</button>' +
        '</div>';
      } else {
        html += '<div class="svg-batch-item svg-batch-error">' +
          '<span class="svg-batch-name">' + this._escapeHtml(r.name) + '</span>' +
          '<span class="svg-batch-error-msg">' + this._escapeHtml(r.errors.join(', ')) + '</span>' +
        '</div>';
      }
    }
    html += '</div>';
    results.innerHTML = html;

    // Store batch results for export
    this._batchResults = batchResults;
  };

  SVGShapeManager.prototype.saveBatchShape = function(index) {
    if (!this._batchResults || !this._batchResults[index]) return;
    var r = this._batchResults[index];
    if (!r.success) return;

    var shape = {
      id: Date.now().toString() + '_' + index,
      name: r.name,
      svg: '',
      mask: r.mask,
      cols: r.raster.cols,
      rows: r.raster.rows,
      quality: r.quality,
      converted: r.converted,
      createdAt: new Date().toISOString()
    };

    this.shapes.push(shape);
    this._saveShapes();
    this._updateLibrary();
    this._showMessage('"' + r.name + '" saved!', 'success');
  };

  SVGShapeManager.prototype._saveShapes = function() {
    try {
      // Save without mask data (too large for localStorage)
      var lightShapes = this.shapes.map(function(s) {
        return {
          id: s.id,
          name: s.name,
          svg: s.svg,
          cols: s.cols,
          rows: s.rows,
          quality: s.quality,
          converted: s.converted,
          createdAt: s.createdAt
        };
      });
      localStorage.setItem('mxd_svg_shapes', JSON.stringify(lightShapes));
    } catch(e) {
      console.warn('[SVG Manager] Could not save shapes:', e);
    }
  };

  SVGShapeManager.prototype.loadSavedShapes = function() {
    try {
      var saved = localStorage.getItem('mxd_svg_shapes');
      if (saved) {
        var shapes = JSON.parse(saved);
        var self = this;
        // Re-rasterize to get mask data
        shapes.forEach(function(s) {
          if (s.svg) {
            var raster = window.MXDSVGEngine.SVGRasterizer.rasterizeFast(s.svg, s.cols, s.rows, {});
            if (raster.success) {
              s.mask = raster.mask;
              s.quality = window.MXDSVGEngine.ShapeQualityScorer.score(raster);
            }
          }
        });
        this.shapes = shapes;
        this._updateLibrary();
      }
    } catch(e) {
      console.warn('[SVG Manager] Could not load shapes:', e);
    }
  };

  SVGShapeManager.prototype.exportLibrary = function() {
    if (this.shapes.length === 0) {
      this._showMessage('No shapes to export', 'error');
      return;
    }
    window.MXDSVGEngine.downloadAsJS(
      this.shapes.map(function(s) { return { success: true, name: s.name, converted: s.converted }; }),
      'mxd-shapes-library.js'
    );
  };

  SVGShapeManager.prototype.clearLibrary = function() {
    if (!confirm('Delete all saved shapes?')) return;
    this.shapes = [];
    localStorage.removeItem('mxd_svg_shapes');
    this._updateLibrary();
  };

  SVGShapeManager.prototype.copyExport = function() {
    var output = window.MXDSVGEngine.exportToClipboard(this.shapes.map(function(s) {
      return { success: true, name: s.name, converted: s.converted };
    }));
    this._showMessage('Copied to clipboard!', 'success');
  };

  SVGShapeManager.prototype.downloadExport = function() {
    window.MXDSVGEngine.downloadAsJS(
      this.shapes.map(function(s) { return { success: true, name: s.name, converted: s.converted }; }),
      'mxd-shapes-export.js'
    );
  };

  SVGShapeManager.prototype.downloadAllMasks = function() {
    for (var i = 0; i < this.shapes.length; i++) {
      var s = this.shapes[i];
      if (s.mask) {
        window.MXDSVGEngine.downloadMaskAsImage(s.mask, s.cols, s.rows, 'mask-' + s.name + '.png');
      }
    }
  };

  SVGShapeManager.prototype.downloadMask = function() {
    if (!this.currentPreview) return;
    window.MXDSVGEngine.downloadMaskAsImage(
      this.currentPreview.mask,
      this.currentPreview.cols,
      this.currentPreview.rows,
      'mask-preview.png'
    );
  };

  SVGShapeManager.prototype.setTab = function(tab) {
    this.activeTab = tab;
    var tabs = document.querySelectorAll('.svg-tab');
    var panels = document.querySelectorAll('.svg-panel');

    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.toggle('active', tabs[i].getAttribute('data-tab') === tab);
    }
    for (var i = 0; i < panels.length; i++) {
      panels[i].classList.toggle('active', panels[i].id === 'svg-panel-' + tab);
    }
  };

  SVGShapeManager.prototype._showMessage = function(msg, type) {
    // Use existing toast if available
    if (window.showToast) {
      window.showToast(msg, type === 'error' ? 'error' : 'success', 3000);
    } else {
      alert(msg);
    }
  };

  SVGShapeManager.prototype._escapeHtml = function(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  // ============================================================
  // INJECT CSS STYLES
  // ============================================================
  function injectStyles() {
    if (document.getElementById('mxd-svg-manager-styles')) return;

    var style = document.createElement('style');
    style.id = 'mxd-svg-manager-styles';
    style.textContent =
      '.svg-manager{font-family:Inter,system-ui,sans-serif;color:#e2e8f0}' +
      '.svg-tabs{display:flex;gap:4px;padding:0 16px 12px;border-bottom:1px solid #334155}' +
      '.svg-tab{display:flex;align-items:center;gap:6px;padding:8px 16px;background:transparent;border:none;color:#94a3b8;font-size:13px;font-weight:500;cursor:pointer;border-radius:8px 8px 0 0;transition:all .2s}' +
      '.svg-tab:hover{background:#1e293b;color:#e2e8f0}' +
      '.svg-tab.active{background:#1e293b;color:#6366f1;border-bottom:2px solid #6366f1}' +
      '.svg-tab-icon{font-size:14px}' +
      '.svg-count{background:#334155;color:#64748b;font-size:11px;padding:2px 6px;border-radius:10px}' +
      '.svg-content{padding:16px}' +
      '.svg-panel{display:none}' +
      '.svg-panel.active{display:block}' +

      /* Drop Zone */
      '.svg-drop-zone{border:2px dashed #334155;border-radius:12px;padding:32px;text-align:center;cursor:pointer;transition:all .2s}' +
      '.svg-drop-zone:hover,.svg-drop-zone.dragover{border-color:#6366f1;background:#6366f111}' +
      '.svg-drop-icon{font-size:32px;margin-bottom:8px}' +
      '.svg-drop-text{font-size:14px;font-weight:500;color:#e2e8f0}' +
      '.svg-drop-hint{font-size:12px;color:#64748b;margin-top:4px}' +

      /* Paste Area */
      '.svg-paste-area{margin-top:12px}' +
      '.svg-paste-area textarea{width:100%;background:#0f172a;border:1px solid #334155;color:#e2e8f0;padding:10px;border-radius:8px;font-family:monospace;font-size:12px;resize:vertical;outline:none}' +
      '.svg-paste-area textarea:focus{border-color:#6366f1}' +

      /* Options */
      '.svg-options{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px}' +
      '.svg-option-group label{display:block;font-size:12px;color:#94a3b8;margin-bottom:6px}' +
      '.svg-size-inputs{display:flex;align-items:center;gap:8px}' +
      '.svg-num-input{width:64px;background:#0f172a;border:1px solid #334155;color:#e2e8f0;padding:6px 8px;border-radius:6px;font-size:13px;text-align:center;outline:none}' +
      '.svg-num-input:focus{border-color:#6366f1}' +
      '.svg-x{color:#64748b}' +
      '.svg-range{width:100%;accent-color:#6366f1}' +
      '.svg-range-value{font-size:12px;color:#6366f1;font-weight:600}' +
      '.svg-select{width:100%;background:#0f172a;border:1px solid #334155;color:#e2e8f0;padding:6px 8px;border-radius:6px;font-size:13px;outline:none}' +

      /* Buttons */
      '.svg-btn{display:inline-flex;align-items:center;gap:6px;padding:10px 20px;background:#6366f1;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;margin-top:16px}' +
      '.svg-btn:hover{background:#4f46e5;transform:translateY(-1px)}' +
      '.svg-btn-primary{width:100%;justify-content:center}' +
      '.svg-btn-sm{padding:6px 12px;font-size:12px;margin-top:0}' +
      '.svg-btn-sec{background:#334155}' +
      '.svg-btn-sec:hover{background:#475569}' +
      '.svg-btn-danger{background:#ef4444}' +
      '.svg-btn-danger:hover{background:#dc2626}' +
      '.svg-btn-icon{width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:#334155;border:none;border-radius:6px;color:#e2e8f0;cursor:pointer;font-size:14px;transition:all .2s}' +
      '.svg-btn-icon:hover{background:#6366f1}' +

      /* Preview */
      '.svg-preview{margin-top:20px;padding:16px;background:#0f172a;border-radius:12px;border:1px solid #1e293b}' +
      '.svg-preview-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}' +
      '.svg-preview-header h4{margin:0;font-size:14px;font-weight:600;color:#e2e8f0}' +
      '.svg-quality-badge{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600}' +
      '.svg-grade{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:6px;color:#fff;font-size:14px;font-weight:700}' +
      '.svg-preview-grid{text-align:center;margin-bottom:12px}' +
      '.svg-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:12px}' +
      '.svg-stat{text-align:center;padding:8px;background:#1e293b;border-radius:8px}' +
      '.svg-stat-label{display:block;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px}' +
      '.svg-stat-value{display:block;font-size:14px;font-weight:600;color:#e2e8f0;margin-top:2px}' +
      '.svg-issues{font-size:12px;color:#f59e0b}' +
      '.svg-issues ul{margin:4px 0 0 16px;padding:0}' +
      '.svg-preview-actions{display:flex;gap:8px;margin-top:12px}' +

      /* Library */
      '.svg-library-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}' +
      '.svg-library-header h4{margin:0;font-size:14px;font-weight:600}' +
      '.svg-library-actions{display:flex;gap:8px}' +
      '.svg-library-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}' +
      '.svg-shape-card{background:#1e293b;border:1px solid #334155;border-radius:10px;overflow:hidden;transition:all .2s}' +
      '.svg-shape-card:hover{border-color:#6366f1;transform:translateY(-2px)}' +
      '.svg-shape-preview{height:80px;background:#0f172a;display:flex;align-items:center;justify-content:center;padding:8px}' +
      '.svg-shape-preview canvas{max-width:100%;max-height:100%;border-radius:4px}' +
      '.svg-shape-info{padding:10px}' +
      '.svg-shape-name{font-size:13px;font-weight:600;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '.svg-shape-meta{display:flex;align-items:center;gap:6px;margin-top:4px;font-size:11px;color:#94a3b8}' +
      '.svg-shape-grade{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:4px;color:#fff;font-size:10px;font-weight:700}' +
      '.svg-shape-actions{display:flex;gap:4px;padding:8px;border-top:1px solid #334155}' +
      '.svg-library-empty{text-align:center;padding:40px 20px;color:#64748b}' +
      '.svg-empty-icon{font-size:40px;margin-bottom:12px}' +
      '.svg-empty-hint{font-size:12px;margin-top:4px}' +

      /* Batch */
      '.svg-batch-header h4{margin:0 0 12px;font-size:14px;font-weight:600}' +
      '.svg-batch-drop-zone{border:2px dashed #334155;border-radius:10px;padding:20px;text-align:center;cursor:pointer;color:#94a3b8;font-size:13px}' +
      '.svg-batch-drop-zone:hover{border-color:#6366f1}' +
      '.svg-progress-bar{height:6px;background:#1e293b;border-radius:3px;overflow:hidden;margin:12px 0}' +
      '.svg-progress-fill{height:100%;background:linear-gradient(90deg,#6366f1,#22c55e);border-radius:3px;transition:width .3s}' +
      '.svg-progress-text{font-size:12px;color:#94a3b8;text-align:center}' +
      '.svg-batch-list{margin-top:16px}' +
      '.svg-batch-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:8px;margin-bottom:6px;font-size:13px}' +
      '.svg-batch-success{background:#10b98111;border:1px solid #10b98133}' +
      '.svg-batch-error{background:#ef444411;border:1px solid #ef444433}' +
      '.svg-batch-name{flex:1;font-weight:500;color:#e2e8f0}' +
      '.svg-batch-grade{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:4px;color:#fff;font-size:11px;font-weight:700}' +
      '.svg-batch-fill{color:#94a3b8;font-size:12px}' +
      '.svg-batch-error-msg{color:#ef4444;font-size:12px}' +

      /* Export */
      '.svg-export-section{margin-bottom:24px}' +
      '.svg-export-section h4{margin:0 0 4px;font-size:14px;font-weight:600}' +
      '.svg-export-desc{margin:0 0 12px;font-size:12px;color:#94a3b8}' +
      '.svg-export-code{width:100%;background:#0f172a;border:1px solid #334155;color:#e2e8f0;padding:12px;border-radius:8px;font-family:monospace;font-size:12px;resize:vertical;outline:none}' +
      '.svg-export-code:focus{border-color:#6366f1}' +
      '.svg-export-actions{display:flex;gap:8px;margin-top:12px}';

    document.head.appendChild(style);
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================
  function init() {
    injectStyles();
    window.MXDSVGShapeManager = new SVGShapeManager();
    console.log('[MXD SVG Shape Manager] v' + VERSION + ' loaded');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
