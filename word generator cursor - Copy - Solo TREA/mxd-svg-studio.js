// mxd-svg-studio.js — SVG Shape Slot System v1.0
// Emoji icon grid where each icon is a SLOT for custom SVG shapes
// Click empty slot → paste SVG code → preview → save → slot fills
// Click filled slot → shows saved shape → edit or delete
// Manage mode → select multiple → batch delete

(function(){
  'use strict';

  var VERSION = '1.0.0';
  var DB_STORE = 'svg_shapes';
  var PREFIX = 'usr_';

  // ============================================================
  // SHAPE SLOT DEFINITIONS — Emoji icons as slots
  // Each slot: {key, emoji, name, category}
  // Built-in shapes with good paths are pre-filled
  // Empty slots wait for user SVG input
  // ============================================================
  var SHAPE_SLOTS = [
    // BASIC SHAPES
    {key:'circle', emoji:'⭕', name:'Circle', category:'basic', builtin:true},
    {key:'square', emoji:'⬜', name:'Square', category:'basic', builtin:true},
    {key:'diamond', emoji:'🔷', name:'Diamond', category:'basic', builtin:true},
    {key:'triangle', emoji:'🔺', name:'Triangle', category:'basic', builtin:true},
    {key:'pentagon', emoji:'⬠', name:'Pentagon', category:'basic', builtin:true},
    {key:'hexagon', emoji:'⬡', name:'Hexagon', category:'basic', builtin:true},
    {key:'octagon', emoji:'🛑', name:'Octagon', category:'basic', builtin:true},
    {key:'star', emoji:'⭐', name:'Star', category:'basic', builtin:true},
    {key:'heart', emoji:'❤️', name:'Heart', category:'basic', builtin:true},
    {key:'cross', emoji:'✚', name:'Cross', category:'basic', builtin:true},
    {key:'arrow', emoji:'➡️', name:'Arrow', category:'basic', builtin:true},
    {key:'cloud', emoji:'☁️', name:'Cloud', category:'basic', builtin:true},

    // BIG CATS
    {key:'lion', emoji:'🦁', name:'Lion', category:'big_cats', builtin:false},
    {key:'tiger', emoji:'🐯', name:'Tiger', category:'big_cats', builtin:false},
    {key:'leopard', emoji:'🐆', name:'Leopard', category:'big_cats', builtin:false},
    {key:'cheetah', emoji:'🐆', name:'Cheetah', category:'big_cats', builtin:false},
    {key:'jaguar', emoji:'🐆', name:'Jaguar', category:'big_cats', builtin:false},
    {key:'panther', emoji:'🐈‍⬛', name:'Panther', category:'big_cats', builtin:false},

    // CANINES
    {key:'wolf', emoji:'🐺', name:'Wolf', category:'canines', builtin:false},
    {key:'fox', emoji:'🦊', name:'Fox', category:'canines', builtin:false},
    {key:'coyote', emoji:'🐕', name:'Coyote', category:'canines', builtin:false},
    {key:'hyena', emoji:'🐕', name:'Hyena', category:'canines', builtin:false},

    // BEARS
    {key:'grizzly', emoji:'🐻', name:'Grizzly Bear', category:'bears', builtin:false},
    {key:'polar_bear', emoji:'🐻‍❄️', name:'Polar Bear', category:'bears', builtin:false},
    {key:'panda', emoji:'🐼', name:'Panda', category:'bears', builtin:false},

    // PRIMATES
    {key:'gorilla', emoji:'🦍', name:'Gorilla', category:'primates', builtin:false},
    {key:'chimpanzee', emoji:'🐵', name:'Chimpanzee', category:'primates', builtin:false},
    {key:'monkey', emoji:'🐒', name:'Monkey', category:'primates', builtin:false},

    // UNGULATES
    {key:'deer', emoji:'🦌', name:'Deer', category:'ungulates', builtin:false},
    {key:'elk', emoji:'🦌', name:'Elk', category:'ungulates', builtin:false},
    {key:'moose', emoji:'🫎', name:'Moose', category:'ungulates', builtin:false},
    {key:'horse', emoji:'🐴', name:'Horse', category:'ungulates', builtin:false},
    {key:'zebra', emoji:'🦓', name:'Zebra', category:'ungulates', builtin:false},
    {key:'giraffe', emoji:'🦒', name:'Giraffe', category:'ungulates', builtin:false},
    {key:'elephant', emoji:'🐘', name:'Elephant', category:'ungulates', builtin:false},
    {key:'rhino', emoji:'🦏', name:'Rhino', category:'ungulates', builtin:false},
    {key:'hippo', emoji:'🦛', name:'Hippo', category:'ungulates', builtin:false},
    {key:'camel', emoji:'🐪', name:'Camel', category:'ungulates', builtin:false},

    // BIRDS
    {key:'eagle', emoji:'🦅', name:'Eagle', category:'birds', builtin:false},
    {key:'owl', emoji:'🦉', name:'Owl', category:'birds', builtin:false},
    {key:'parrot', emoji:'🦜', name:'Parrot', category:'birds', builtin:false},
    {key:'penguin', emoji:'🐧', name:'Penguin', category:'birds', builtin:false},
    {key:'flamingo', emoji:'🦩', name:'Flamingo', category:'birds', builtin:false},
    {key:'peacock', emoji:'🦚', name:'Peacock', category:'birds', builtin:false},
    {key:'dove', emoji:'🕊️', name:'Dove', category:'birds', builtin:false},
    {key:'hummingbird', emoji:'🐦', name:'Hummingbird', category:'birds', builtin:false},

    // MARINE
    {key:'whale', emoji:'🐋', name:'Whale', category:'marine', builtin:false},
    {key:'dolphin', emoji:'🐬', name:'Dolphin', category:'marine', builtin:false},
    {key:'shark', emoji:'🦈', name:'Shark', category:'marine', builtin:false},
    {key:'octopus', emoji:'🐙', name:'Octopus', category:'marine', builtin:false},
    {key:'turtle', emoji:'🐢', name:'Turtle', category:'marine', builtin:false},
    {key:'fish', emoji:'🐟', name:'Fish', category:'marine', builtin:false},
    {key:'crab', emoji:'🦀', name:'Crab', category:'marine', builtin:false},
    {key:'seahorse', emoji:'🐠', name:'Seahorse', category:'marine', builtin:false},

    // REPTILES & AMPHIBIANS
    {key:'snake', emoji:'🐍', name:'Snake', category:'reptiles', builtin:false},
    {key:'lizard', emoji:'🦎', name:'Lizard', category:'reptiles', builtin:false},
    {key:'crocodile', emoji:'🐊', name:'Crocodile', category:'reptiles', builtin:false},
    {key:'frog', emoji:'🐸', name:'Frog', category:'reptiles', builtin:false},
    {key:'dragon', emoji:'🐉', name:'Dragon', category:'reptiles', builtin:false},

    // INSECTS
    {key:'butterfly', emoji:'🦋', name:'Butterfly', category:'insects', builtin:false},
    {key:'bee', emoji:'🐝', name:'Bee', category:'insects', builtin:false},
    {key:'ladybug', emoji:'🐞', name:'Ladybug', category:'insects', builtin:false},
    {key:'spider', emoji:'🕷️', name:'Spider', category:'insects', builtin:false},
    {key:'ant', emoji:'🐜', name:'Ant', category:'insects', builtin:false},
    {key:'scorpion', emoji:'🦂', name:'Scorpion', category:'insects', builtin:false},

    // FANTASY & CREATURES
    {key:'unicorn', emoji:'🦄', name:'Unicorn', category:'fantasy', builtin:false},
    {key:'dragon_wings', emoji:'🐲', name:'Dragon Wings', category:'fantasy', builtin:false},
    {key:'ghost', emoji:'👻', name:'Ghost', category:'fantasy', builtin:false},
    {key:'alien', emoji:'👽', name:'Alien', category:'fantasy', builtin:false},
    {key:'robot', emoji:'🤖', name:'Robot', category:'fantasy', builtin:false},

    // HOLIDAYS & SEASONS
    {key:'christmas_tree', emoji:'🎄', name:'Christmas Tree', category:'holidays', builtin:false},
    {key:'snowflake', emoji:'❄️', name:'Snowflake', category:'holidays', builtin:false},
    {key:'pumpkin', emoji:'🎃', name:'Pumpkin', category:'holidays', builtin:false},
    {key:'easter_egg', emoji:'🥚', name:'Easter Egg', category:'holidays', builtin:false},
    {key:'heart_valentine', emoji:'💝', name:'Valentine Heart', category:'holidays', builtin:false},
    {key:'shamrock', emoji:'☘️', name:'Shamrock', category:'holidays', builtin:false},

    // FOOD & DRINK
    {key:'apple', emoji:'🍎', name:'Apple', category:'food', builtin:false},
    {key:'pizza', emoji:'🍕', name:'Pizza', category:'food', builtin:false},
    {key:'cake', emoji:'🎂', name:'Cake', category:'food', builtin:false},
    {key:'ice_cream', emoji:'🍦', name:'Ice Cream', category:'food', builtin:false},
    {key:'cookie', emoji:'🍪', name:'Cookie', category:'food', builtin:false},
    {key:'cupcake', emoji:'🧁', name:'Cupcake', category:'food', builtin:false},

    // TRANSPORT
    {key:'car', emoji:'🚗', name:'Car', category:'transport', builtin:false},
    {key:'rocket', emoji:'🚀', name:'Rocket', category:'transport', builtin:false},
    {key:'airplane', emoji:'✈️', name:'Airplane', category:'transport', builtin:false},
    {key:'ship', emoji:'🚢', name:'Ship', category:'transport', builtin:false},
    {key:'train', emoji:'🚂', name:'Train', category:'transport', builtin:false},

    // NATURE
    {key:'tree', emoji:'🌳', name:'Tree', category:'nature', builtin:false},
    {key:'flower', emoji:'🌸', name:'Flower', category:'nature', builtin:false},
    {key:'sun', emoji:'☀️', name:'Sun', category:'nature', builtin:false},
    {key:'moon', emoji:'🌙', name:'Moon', category:'nature', builtin:false},
    {key:'mountain', emoji:'⛰️', name:'Mountain', category:'nature', builtin:false},
    {key:'lightning', emoji:'⚡', name:'Lightning', category:'nature', builtin:false},

    // CUSTOM SLOTS (user can fill these with anything)
    {key:'custom_1', emoji:'📝', name:'Custom 1', category:'custom', builtin:false},
    {key:'custom_2', emoji:'📝', name:'Custom 2', category:'custom', builtin:false},
    {key:'custom_3', emoji:'📝', name:'Custom 3', category:'custom', builtin:false},
    {key:'custom_4', emoji:'📝', name:'Custom 4', category:'custom', builtin:false},
    {key:'custom_5', emoji:'📝', name:'Custom 5', category:'custom', builtin:false},
    {key:'custom_6', emoji:'📝', name:'Custom 6', category:'custom', builtin:false},
    {key:'custom_7', emoji:'📝', name:'Custom 7', category:'custom', builtin:false},
    {key:'custom_8', emoji:'📝', name:'Custom 8', category:'custom', builtin:false},
    {key:'custom_9', emoji:'📝', name:'Custom 9', category:'custom', builtin:false},
    {key:'custom_10', emoji:'📝', name:'Custom 10', category:'custom', builtin:false},
  ];

  // ============================================================
  // SVG SHAPE STUDIO — Main UI Controller
  // ============================================================
  function SVGShapeStudio() {
    this.slots = {};       // {key: {svg, converted, quality, name, emoji}}
    this.activeSlot = null; // Currently selected slot key
    this.manageMode = false;
    this.selectedForDelete = [];
    this.currentCategory = 'basic';
    this.panelOpen = false;
    this.previewCanvas = null;
    this.currentPreview = null;
  }

  SVGShapeStudio.prototype.init = function() {
    var self = this;
    this._loadSavedShapes();
    this._injectCSS();
    console.log('[MXD SVG Studio v' + VERSION + '] Initialized — ' + SHAPE_SLOTS.length + ' shape slots');
  };

  // ============================================================
  // RENDER — Icon Grid in Sidebar
  // ============================================================
  SVGShapeStudio.prototype.renderGrid = function(containerId) {
    var self = this;
    var container = document.getElementById(containerId);
    if (!container) return;

    var categories = this._getCategories();
    var html = '';

    // Category tabs
    html += '<div class="svg-studio-tabs">';
    categories.forEach(function(cat) {
      var active = self.currentCategory === cat.id ? ' active' : '';
      html += '<button class="svg-studio-tab' + active + '" data-cat="' + cat.id + '" onclick="window.MXDSVGStudio.setCategory(\'' + cat.id + '\')">' + cat.emoji + ' ' + cat.name + '</button>';
    });
    html += '</div>';

    // Manage mode toggle
    html += '<div class="svg-studio-toolbar">';
    html += '<button class="svg-studio-manage-btn' + (self.manageMode ? ' active' : '') + '" onclick="window.MXDSVGStudio.toggleManage()">' + (self.manageMode ? '✓ Done' : '🗑 Manage') + '</button>';
    if (self.manageMode) {
      html += '<button class="svg-studio-delete-btn" onclick="window.MXDSVGStudio.confirmDelete()" ' + (self.selectedForDelete.length === 0 ? 'disabled' : '') + '>Delete Selected (' + self.selectedForDelete.length + ')</button>';
    }
    html += '</div>';

    // Icon grid
    var slots = SHAPE_SLOTS.filter(function(s) { return s.category === self.currentCategory; });
    html += '<div class="svg-studio-grid">';
    slots.forEach(function(slot) {
      var isFilled = self.slots[slot.key] !== undefined;
      var isSelected = self.selectedForDelete.indexOf(slot.key) !== -1;
      var cls = 'svg-studio-slot' + (isFilled ? ' filled' : ' empty') + (isSelected ? ' selected' : '');

      html += '<div class="' + cls + '" data-key="' + slot.key + '" onclick="window.MXDSVGStudio.clickSlot(\'' + slot.key + '\')">';

      if (self.manageMode) {
        html += '<div class="svg-studio-checkbox"><input type="checkbox" ' + (isSelected ? 'checked' : '') + ' onclick="event.stopPropagation();window.MXDSVGStudio.toggleSelect(\'' + slot.key + '\')" /></div>';
      }

      html += '<div class="svg-studio-emoji">' + slot.emoji + '</div>';
      html += '<div class="svg-studio-label">' + slot.name + '</div>';

      if (isFilled && self.slots[slot.key].quality) {
        var q = self.slots[slot.key].quality;
        var gradeColor = {A:'#10b981',B:'#22c55e',C:'#f59e0b',D:'#f97316',F:'#ef4444'};
        html += '<div class="svg-studio-grade" style="background:' + (gradeColor[q.grade]||'#94a3b8') + '">' + q.grade + '</div>';
      }

      if (isFilled && !self.manageMode) {
        html += '<div class="svg-studio-filled-badge">✓</div>';
      }

      html += '</div>';
    });
    html += '</div>';

    container.innerHTML = html;
  };

  // ============================================================
  // SLOT CLICK — Open floating panel
  // ============================================================
  SVGShapeStudio.prototype.clickSlot = function(key) {
    var self = this;
    if (this.manageMode) return;

    var slotDef = SHAPE_SLOTS.find(function(s) { return s.key === key; });
    if (!slotDef) return;

    this.activeSlot = key;
    this._openPanel(slotDef);
  };

  SVGShapeStudio.prototype._openPanel = function(slotDef) {
    var self = this;
    var existing = document.getElementById('svg-studio-panel');
    if (existing) existing.remove();

    var isFilled = this.slots[slotDef.key] !== undefined;
    var savedSvg = isFilled ? this.slots[slotDef.key].svg : '';

    var panel = document.createElement('div');
    panel.id = 'svg-studio-panel';
    panel.className = 'svg-studio-panel';
    panel.innerHTML =
      '<div class="svg-studio-panel-header">' +
        '<span class="svg-studio-panel-title">' + slotDef.emoji + ' ' + slotDef.name + '</span>' +
        '<button class="svg-studio-panel-close" onclick="window.MXDSVGStudio.closePanel()">✕</button>' +
      '</div>' +
      '<div class="svg-studio-panel-body">' +
        '<div class="svg-studio-textarea-wrap">' +
          '<textarea id="svg-studio-code" placeholder="Paste SVG code here..." rows="8">' + (savedSvg ? this._escapeHtml(savedSvg) : '') + '</textarea>' +
        '</div>' +
        '<div class="svg-studio-preview" id="svg-studio-preview">' +
          '<div class="svg-studio-preview-empty">Preview will appear here</div>' +
        '</div>' +
        '<div class="svg-studio-panel-actions">' +
          '<button class="svg-studio-btn svg-studio-btn-save" id="svg-studio-save-btn" onclick="window.MXDSVGStudio.saveSlot()" disabled>💾 Save Shape</button>' +
          (isFilled ? '<button class="svg-studio-btn svg-studio-btn-use" onclick="window.MXDSVGStudio.useSlot()">✓ Use as Puzzle Shape</button>' : '') +
          (isFilled ? '<button class="svg-studio-btn svg-studio-btn-delete" onclick="window.MXDSVGStudio.deleteSlot()">🗑 Delete</button>' : '') +
        '</div>' +
        '<div class="svg-studio-quality" id="svg-studio-quality"></div>' +
      '</div>';

    document.body.appendChild(panel);
    this.panelOpen = true;

    // Auto-process if slot already has saved SVG
    if (savedSvg) {
      document.getElementById('svg-studio-code').value = savedSvg;
      this._processSVG(savedSvg);
    }

    // Live preview on input
    var textarea = document.getElementById('svg-studio-code');
    var debounceTimer = null;
    textarea.addEventListener('input', function() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function() {
        var code = textarea.value.trim();
        if (code) {
          self._processSVG(code);
        } else {
          self._clearPreview();
        }
      }, 500);
    });
  };

  SVGShapeStudio.prototype.closePanel = function() {
    var panel = document.getElementById('svg-studio-panel');
    if (panel) panel.remove();
    this.panelOpen = false;
    this.activeSlot = null;
    this.currentPreview = null;
  };

  // ============================================================
  // PROCESS SVG — Validate, rasterize, score, preview
  // ============================================================
  SVGShapeStudio.prototype._processSVG = function(svgCode) {
    var self = this;
    if (!window.MXDSVGEngine) {
      this._showMessage('SVG Engine not loaded', 'error');
      return;
    }

    // Validate
    var validation = window.MXDSVGEngine.SVGValidator.validate(svgCode);
    if (!validation.valid) {
      this._showMessage('Invalid SVG: ' + validation.errors.join(', '), 'error');
      this._clearPreview();
      return;
    }

    // Rasterize at 25x25 (default puzzle grid)
    var raster = window.MXDSVGEngine.SVGRasterizer.rasterizeFast(svgCode, 25, 25, {padding: 0.05});
    if (!raster.success) {
      this._showMessage('Rasterization failed: ' + raster.error, 'error');
      this._clearPreview();
      return;
    }

    // Score quality
    var quality = window.MXDSVGEngine.ShapeQualityScorer.score(raster);

    // Convert to mask pipeline format
    var converted = window.MXDSVGEngine.SvgToMaskConverter.convert(svgCode);

    // Store current preview
    this.currentPreview = {
      svg: svgCode,
      mask: raster.mask,
      cols: 25,
      rows: 25,
      quality: quality,
      raster: raster,
      converted: converted
    };

    // Render preview
    this._renderPreview(raster, quality);

    // Enable save button
    var saveBtn = document.getElementById('svg-studio-save-btn');
    if (saveBtn) saveBtn.disabled = false;
  };

  SVGShapeStudio.prototype._renderPreview = function(raster, quality) {
    var preview = document.getElementById('svg-studio-preview');
    var qualityDiv = document.getElementById('svg-studio-quality');
    if (!preview) return;

    // Canvas preview
    var size = 200;
    var cellSize = size / Math.max(raster.cols, raster.rows);
    var canvas = document.createElement('canvas');
    canvas.width = raster.cols * cellSize;
    canvas.height = raster.rows * cellSize;
    canvas.style.maxWidth = '100%';
    canvas.style.borderRadius = '8px';
    canvas.style.border = '1px solid #334155';
    var ctx = canvas.getContext('2d');

    for (var r = 0; r < raster.rows; r++) {
      for (var c = 0; c < raster.cols; c++) {
        ctx.fillStyle = raster.mask[r][c] ? '#6366f1' : '#1e293b';
        ctx.fillRect(c * cellSize, r * cellSize, cellSize - 0.5, cellSize - 0.5);
      }
    }

    preview.innerHTML = '';
    preview.appendChild(canvas);

    // Quality info
    var gradeColor = {A:'#10b981',B:'#22c55e',C:'#f59e0b',D:'#f97316',F:'#ef4444'};
    var color = gradeColor[quality.grade] || '#94a3b8';

    if (qualityDiv) {
      qualityDiv.innerHTML =
        '<div class="svg-studio-quality-badge" style="background:' + color + '">' + quality.grade + ' ' + quality.score + '/100</div>' +
        '<div class="svg-studio-quality-stats">' +
          '<span>Fill: ' + (raster.fillRatio * 100).toFixed(1) + '%</span>' +
          '<span>Cells: ' + raster.filledCount + '/' + raster.totalCells + '</span>' +
          '<span>Connected: ' + (quality.metrics.connected ? 'Yes' : 'No') + '</span>' +
        '</div>';
      if (quality.issues.length > 0) {
        qualityDiv.innerHTML += '<div class="svg-studio-quality-issues">⚠ ' + quality.issues.join(' | ') + '</div>';
      }
    }
  };

  SVGShapeStudio.prototype._clearPreview = function() {
    var preview = document.getElementById('svg-studio-preview');
    var qualityDiv = document.getElementById('svg-studio-quality');
    var saveBtn = document.getElementById('svg-studio-save-btn');
    if (preview) preview.innerHTML = '<div class="svg-studio-preview-empty">Preview will appear here</div>';
    if (qualityDiv) qualityDiv.innerHTML = '';
    if (saveBtn) saveBtn.disabled = true;
    this.currentPreview = null;
  };

  // ============================================================
  // SAVE — Save shape to IndexedDB
  // ============================================================
  SVGShapeStudio.prototype.saveSlot = function() {
    var self = this;
    if (!this.currentPreview || !this.activeSlot) return;

    var key = this.activeSlot;
    var slotDef = SHAPE_SLOTS.find(function(s) { return s.key === key; });
    if (!slotDef) return;

    var record = {
      key: key,
      name: slotDef.name,
      emoji: slotDef.emoji,
      category: slotDef.category,
      svg: this.currentPreview.svg,
      converted: this.currentPreview.converted,
      quality: this.currentPreview.quality,
      cols: this.currentPreview.cols,
      rows: this.currentPreview.rows,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to IndexedDB
    if (window.MXDOfflineDB) {
      window.MXDOfflineDB.set(DB_STORE, key, record).then(function() {
        self.slots[key] = record;
        self._showMessage(slotDef.emoji + ' "' + slotDef.name + '" saved!', 'success');
        self._refreshGrid();
        self.closePanel();
      }).catch(function(e) {
        self._showMessage('Save failed: ' + e.message, 'error');
      });
    } else {
      // Fallback to localStorage
      try {
        var saved = JSON.parse(localStorage.getItem('mxd_svg_slots') || '{}');
        saved[key] = record;
        localStorage.setItem('mxd_svg_slots', JSON.stringify(saved));
        self.slots[key] = record;
        self._showMessage(slotDef.emoji + ' "' + slotDef.name + '" saved!', 'success');
        self._refreshGrid();
        self.closePanel();
      } catch(e) {
        self._showMessage('Save failed: ' + e.message, 'error');
      }
    }

    // Register with mask pipeline
    this._registerWithPipeline(key, this.currentPreview.converted);
  };

  SVGShapeStudio.prototype._registerWithPipeline = function(key, converted) {
    if (!window.MXDMaskPipeline || !converted) return;
    var paths = window.MXDMaskPipeline.SHAPE_PATHS || {};
    paths[PREFIX + key] = converted;
    window.MXDMaskPipeline.SHAPE_PATHS = paths;
  };

  // ============================================================
  // USE — Apply shape as current puzzle shape
  // ============================================================
  SVGShapeStudio.prototype.useSlot = function() {
    var key = this.activeSlot;
    var slotDef = SHAPE_SLOTS.find(function(s) { return s.key === key; });
    if (!slotDef || !this.slots[key]) return;

    // Apply to puzzle config
    if (window.MXD_SETTINGS) {
      window.MXD_SETTINGS.set('shape', PREFIX + key);
    }

    // Also set on the global config if available
    if (window.MXDInteractive && window.MXDInteractive.getConfig) {
      var cfg = window.MXDInteractive.getConfig();
      cfg.shape = PREFIX + key;
    }

    this._showMessage(slotDef.emoji + ' "' + slotDef.name + '" applied as puzzle shape!', 'success');
    this.closePanel();
  };

  // ============================================================
  // DELETE — Delete single shape
  // ============================================================
  SVGShapeStudio.prototype.deleteSlot = function() {
    var self = this;
    var key = this.activeSlot;
    var slotDef = SHAPE_SLOTS.find(function(s) { return s.key === key; });
    if (!slotDef) return;

    if (!confirm('Delete "' + slotDef.name + '" shape?')) return;

    // Delete from IndexedDB
    if (window.MXDOfflineDB) {
      window.MXDOfflineDB.delete(DB_STORE, key).then(function() {
        delete self.slots[key];
        // Remove from pipeline
        if (window.MXDMaskPipeline && window.MXDMaskPipeline.SHAPE_PATHS) {
          delete window.MXDMaskPipeline.SHAPE_PATHS[PREFIX + key];
        }
        self._showMessage(slotDef.emoji + ' "' + slotDef.name + '" deleted', 'success');
        self._refreshGrid();
        self.closePanel();
      }).catch(function(e) {
        self._showMessage('Delete failed: ' + e.message, 'error');
      });
    } else {
      // Fallback to localStorage
      try {
        var saved = JSON.parse(localStorage.getItem('mxd_svg_slots') || '{}');
        delete saved[key];
        localStorage.setItem('mxd_svg_slots', JSON.stringify(saved));
        delete self.slots[key];
        if (window.MXDMaskPipeline && window.MXDMaskPipeline.SHAPE_PATHS) {
          delete window.MXDMaskPipeline.SHAPE_PATHS[PREFIX + key];
        }
        self._showMessage(slotDef.emoji + ' "' + slotDef.name + '" deleted', 'success');
        self._refreshGrid();
        self.closePanel();
      } catch(e) {
        self._showMessage('Delete failed: ' + e.message, 'error');
      }
    }
  };

  // ============================================================
  // MANAGE MODE — Select multiple for batch delete
  // ============================================================
  SVGShapeStudio.prototype.toggleManage = function() {
    this.manageMode = !this.manageMode;
    this.selectedForDelete = [];
    this._refreshGrid();
  };

  SVGShapeStudio.prototype.toggleSelect = function(key) {
    var idx = this.selectedForDelete.indexOf(key);
    if (idx === -1) {
      this.selectedForDelete.push(key);
    } else {
      this.selectedForDelete.splice(idx, 1);
    }
    this._refreshGrid();
  };

  SVGShapeStudio.prototype.confirmDelete = function() {
    var self = this;
    if (this.selectedForDelete.length === 0) return;

    var names = this.selectedForDelete.map(function(key) {
      var slot = SHAPE_SLOTS.find(function(s) { return s.key === key; });
      return slot ? slot.emoji + ' ' + slot.name : key;
    }).join(', ');

    if (!confirm('Delete these shapes?\n\n' + names)) return;

    var keysToDelete = this.selectedForDelete.slice();
    var promises = [];

    keysToDelete.forEach(function(key) {
      if (window.MXDOfflineDB) {
        promises.push(window.MXDOfflineDB.delete(DB_STORE, key));
      }
      delete self.slots[key];
      if (window.MXDMaskPipeline && window.MXDMaskPipeline.SHAPE_PATHS) {
        delete window.MXDMaskPipeline.SHAPE_PATHS[PREFIX + key];
      }
    });

    Promise.all(promises).then(function() {
      if (!window.MXDOfflineDB) {
        // Fallback localStorage
        try {
          var saved = JSON.parse(localStorage.getItem('mxd_svg_slots') || '{}');
          keysToDelete.forEach(function(key) { delete saved[key]; });
          localStorage.setItem('mxd_svg_slots', JSON.stringify(saved));
        } catch(e) {}
      }
      self.selectedForDelete = [];
      self.manageMode = false;
      self._showMessage(keysToDelete.length + ' shapes deleted', 'success');
      self._refreshGrid();
    }).catch(function(e) {
      self._showMessage('Batch delete failed: ' + e.message, 'error');
    });
  };

  // ============================================================
  // CATEGORY — Switch category tab
  // ============================================================
  SVGShapeStudio.prototype.setCategory = function(catId) {
    this.currentCategory = catId;
    this._refreshGrid();
  };

  SVGShapeStudio.prototype._getCategories = function() {
    var cats = [];
    var seen = {};
    SHAPE_SLOTS.forEach(function(s) {
      if (!seen[s.category]) {
        seen[s.category] = true;
        var emoji = s.category === 'basic' ? '🔷' :
                    s.category === 'big_cats' ? '🦁' :
                    s.category === 'canines' ? '🐺' :
                    s.category === 'bears' ? '🐻' :
                    s.category === 'primates' ? '🦍' :
                    s.category === 'ungulates' ? '🦌' :
                    s.category === 'birds' ? '🦅' :
                    s.category === 'marine' ? '🐋' :
                    s.category === 'reptiles' ? '🐉' :
                    s.category === 'insects' ? '🦋' :
                    s.category === 'fantasy' ? '🦄' :
                    s.category === 'holidays' ? '🎄' :
                    s.category === 'food' ? '🍕' :
                    s.category === 'transport' ? '🚀' :
                    s.category === 'nature' ? '🌳' :
                    s.category === 'custom' ? '📝' : '📦';
        var name = s.category.replace(/_/g, ' ').replace(/\b\w/g, function(l){ return l.toUpperCase(); });
        cats.push({id: s.category, emoji: emoji, name: name});
      }
    });
    return cats;
  };

  // ============================================================
  // LOAD — Load saved shapes from IndexedDB on startup
  // ============================================================
  SVGShapeStudio.prototype._loadSavedShapes = function() {
    var self = this;

    if (window.MXDOfflineDB) {
      window.MXDOfflineDB.getAll(DB_STORE).then(function(records) {
        records.forEach(function(rec) {
          self.slots[rec.key] = rec.value;
          // Register with mask pipeline
          self._registerWithPipeline(rec.key, rec.value.converted);
        });
        self._refreshGrid();
        console.log('[MXD SVG Studio] Loaded ' + records.length + ' saved shapes');
      }).catch(function() {
        // Fallback to localStorage
        self._loadFromLocalStorage();
      });
    } else {
      self._loadFromLocalStorage();
    }
  };

  SVGShapeStudio.prototype._loadFromLocalStorage = function() {
    var self = this;
    try {
      var saved = JSON.parse(localStorage.getItem('mxd_svg_slots') || '{}');
      Object.keys(saved).forEach(function(key) {
        self.slots[key] = saved[key];
        self._registerWithPipeline(key, saved[key].converted);
      });
      self._refreshGrid();
      console.log('[MXD SVG Studio] Loaded ' + Object.keys(saved).length + ' saved shapes (localStorage)');
    } catch(e) {}
  };

  // ============================================================
  // REFRESH — Re-render the grid
  // ============================================================
  SVGShapeStudio.prototype._refreshGrid = function() {
    var container = document.getElementById('svg-studio-grid-container');
    if (container) {
      this.renderGrid('svg-studio-grid-container');
    }
  };

  // ============================================================
  // MESSAGES — Toast notifications
  // ============================================================
  SVGShapeStudio.prototype._showMessage = function(msg, type) {
    if (window.showToast) {
      window.showToast(msg, type === 'error' ? 'error' : 'success', 3000);
    } else {
      alert(msg);
    }
  };

  SVGShapeStudio.prototype._escapeHtml = function(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  // ============================================================
  // INJECT CSS
  // ============================================================
  SVGShapeStudio.prototype._injectCSS = function() {
    if (document.getElementById('mxd-svg-studio-styles')) return;

    var style = document.createElement('style');
    style.id = 'mxd-svg-studio-styles';
    style.textContent =
      /* Icon Grid */
      '.svg-studio-tabs{display:flex;gap:4px;padding:8px 0;overflow-x:auto;flex-wrap:nowrap}' +
      '.svg-studio-tab{flex-shrink:0;padding:6px 10px;background:transparent;border:1px solid var(--border);color:var(--t3);border-radius:6px;font-size:11px;cursor:pointer;transition:all .2s;white-space:nowrap;font-family:var(--font)}' +
      '.svg-studio-tab:hover{color:var(--t1);border-color:var(--accent)}' +
      '.svg-studio-tab.active{color:var(--accent);border-color:var(--accent);background:var(--accent-light)}' +

      /* Toolbar */
      '.svg-studio-toolbar{display:flex;gap:6px;padding:6px 0;align-items:center}' +
      '.svg-studio-manage-btn{padding:5px 10px;background:transparent;border:1px solid var(--border);color:var(--t3);border-radius:6px;font-size:11px;cursor:pointer;transition:all .2s;font-family:var(--font)}' +
      '.svg-studio-manage-btn:hover{color:var(--t1);border-color:var(--accent)}' +
      '.svg-studio-manage-btn.active{color:#ef4444;border-color:#ef4444;background:#fef2f2}' +
      '.svg-studio-delete-btn{padding:5px 10px;background:#ef4444;border:none;color:#fff;border-radius:6px;font-size:11px;cursor:pointer;transition:all .2s;font-family:var(--font)}' +
      '.svg-studio-delete-btn:hover{background:#dc2626}' +
      '.svg-studio-delete-btn:disabled{opacity:.4;cursor:not-allowed}' +

      /* Grid */
      '.svg-studio-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(72px,1fr));gap:8px;padding:8px 0;max-height:300px;overflow-y:auto}' +
      '.svg-studio-slot{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 6px;border-radius:10px;cursor:pointer;transition:all .2s;border:2px solid transparent;min-height:80px}' +
      '.svg-studio-slot.empty{background:var(--bg);border:2px dashed var(--border)}' +
      '.svg-studio-slot.empty:hover{border-color:var(--accent);background:var(--accent-light)}' +
      '.svg-studio-slot.filled{background:var(--panel);border:2px solid var(--border)}' +
      '.svg-studio-slot.filled:hover{border-color:var(--accent);box-shadow:0 2px 8px rgba(99,102,241,0.15)}' +
      '.svg-studio-slot.selected{border-color:#ef4444;background:#fef2f2}' +
      '.svg-studio-emoji{font-size:24px;line-height:1;margin-bottom:4px}' +
      '.svg-studio-label{font-size:9px;color:var(--t3);text-align:center;line-height:1.2;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
      '.svg-studio-grade{position:absolute;top:4px;right:4px;width:18px;height:18px;border-radius:4px;color:#fff;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center}' +
      '.svg-studio-filled-badge{position:absolute;top:4px;left:4px;width:16px;height:16px;border-radius:50%;background:#10b981;color:#fff;font-size:10px;display:flex;align-items:center;justify-content:center}' +
      '.svg-studio-checkbox{position:absolute;top:4px;left:4px;z-index:2}' +
      '.svg-studio-checkbox input{width:16px;height:16px;cursor:pointer;accent-color:#ef4444}' +

      /* Floating Panel */
      '.svg-studio-panel{position:fixed;right:20px;top:80px;width:420px;max-height:calc(100vh - 100px);background:var(--panel);border:1px solid var(--border);border-radius:14px;box-shadow:0 10px 40px rgba(0,0,0,0.15);z-index:9999;display:flex;flex-direction:column;overflow:hidden;animation:svgPanelSlideIn .2s ease}' +
      '@keyframes svgPanelSlideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}' +
      '.svg-studio-panel-header{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--border);flex-shrink:0}' +
      '.svg-studio-panel-title{font-size:15px;font-weight:700;color:var(--t1)}' +
      '.svg-studio-panel-close{width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:transparent;border:none;color:var(--t3);cursor:pointer;font-size:16px;border-radius:6px;transition:all .2s}' +
      '.svg-studio-panel-close:hover{background:var(--bg);color:var(--t1)}' +
      '.svg-studio-panel-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:14px}' +
      '.svg-studio-textarea-wrap textarea{width:100%;background:var(--bg);border:1px solid var(--border);color:var(--t1);padding:12px;border-radius:8px;font-family:monospace;font-size:12px;resize:vertical;outline:none;line-height:1.5}' +
      '.svg-studio-textarea-wrap textarea:focus{border-color:var(--accent)}' +
      '.svg-studio-textarea-wrap textarea::placeholder{color:var(--t3)}' +
      '.svg-studio-preview{min-height:120px;background:var(--bg);border:1px dashed var(--border);border-radius:8px;display:flex;align-items:center;justify-content:center;padding:12px}' +
      '.svg-studio-preview-empty{color:var(--t3);font-size:13px}' +
      '.svg-studio-preview canvas{max-width:100%;border-radius:8px}' +
      '.svg-studio-panel-actions{display:flex;gap:8px;flex-wrap:wrap}' +
      '.svg-studio-btn{padding:8px 16px;border:none;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;transition:all .2s;font-family:var(--font);display:inline-flex;align-items:center;gap:6px}' +
      '.svg-studio-btn:disabled{opacity:.4;cursor:not-allowed}' +
      '.svg-studio-btn-save{background:var(--accent);color:#fff}' +
      '.svg-studio-btn-save:hover:not(:disabled){background:#4f46e5}' +
      '.svg-studio-btn-use{background:var(--ok);color:#fff}' +
      '.svg-studio-btn-use:hover{background:#059669}' +
      '.svg-studio-btn-delete{background:var(--err);color:#fff}' +
      '.svg-studio-btn-delete:hover{background:#dc2626}' +
      '.svg-studio-quality{display:flex;flex-direction:column;gap:6px}' +
      '.svg-studio-quality-badge{display:inline-flex;align-items:center;justify-content:center;padding:4px 10px;border-radius:6px;color:#fff;font-size:12px;font-weight:700;width:fit-content}' +
      '.svg-studio-quality-stats{display:flex;gap:12px;font-size:11px;color:var(--t3)}' +
      '.svg-studio-quality-stats span{display:flex;align-items:center;gap:4px}' +
      '.svg-studio-quality-issues{font-size:11px;color:#f59e0b;padding:6px 10px;background:#fffbeb;border-radius:6px;border:1px solid #fde68a}';

    document.head.appendChild(style);
  };

  // ============================================================
  // EXPORT — Get all saved shapes as JS code
  // ============================================================
  SVGShapeStudio.prototype.exportAll = function() {
    var output = '// Auto-generated by MXD SVG Studio v' + VERSION + '\n';
    output += 'var SHAPE_PATHS = {\n';
    var entries = [];
    var self = this;

    Object.keys(this.slots).forEach(function(key) {
      var s = self.slots[key];
      if (s.converted) {
        var k = PREFIX + key;
        var d = s.converted.d.replace(/"/g, '\\"');
        entries.push('  "' + k + '":{d:"' + d + '",w:' + s.converted.w + ',h:' + s.converted.h + '}');
      }
    });

    output += entries.join(',\n');
    output += '\n};\n';
    return output;
  };

  SVGShapeStudio.prototype.downloadExport = function() {
    var output = this.exportAll();
    var blob = new Blob([output], {type: 'application/javascript'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'mxd-custom-shapes.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ============================================================
  // INITIALIZATION
  // ============================================================
  function init() {
    window.MXDSVGStudio = new SVGShapeStudio();
    window.MXDSVGStudio.init();
    console.log('[MXD SVG Studio] Ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
