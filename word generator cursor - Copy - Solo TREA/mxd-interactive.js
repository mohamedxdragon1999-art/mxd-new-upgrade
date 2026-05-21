// MXD Interactive Enhancement Engine v12.0
// 2026 Best Practices: Micro-interactions, Real-time Feedback, Personalization, Keyboard Navigation

(function(win) {
  'use strict';

  if (typeof win.React === 'undefined') {
    console.warn('[MXD Interactive] React not loaded yet, deferring init...');
    win.MXDInteractive = { _pending: true, init: function() {
      if (typeof win.React === 'undefined') return;
      delete this._pending;
      var React = win.React;
      var h = React.createElement;
      this._initInternal(React, h);
    }};
    var _retryInit = setInterval(function() {
      if (typeof win.React !== 'undefined' && win.MXDInteractive._pending) {
        clearInterval(_retryInit);
        win.MXDInteractive.init();
      }
    }, 100);
    return;
  }

  var React = win.React;
  var h = React.createElement;

  // ── Interactive State Manager ──
  var MXDInteractive = {
    _history: [],
    _historyIdx: -1,
    _maxHistory: 50,
    _listeners: {},
    _userPrefs: {},
    _sessionStart: Date.now(),
    _actions: 0,
    _lastAction: null,
    _hoveredElement: null,
    _focusTrap: null,
    _toasts: [],
    _achievements: [],

    init: function() {
      this._loadPrefs();
      this._initKeyboard();
      this._initMouseTracking();
      this._initAutoSave();
      this._initAchievements();
      this._initContextMenu();
      console.log('[MXD Interactive] Engine initialized');
    },

    // ── History / Undo-Redo ──
    pushState: function(state) {
      this._history = this._history.slice(0, this._historyIdx + 1);
      this._history.push(JSON.parse(JSON.stringify(state)));
      if (this._history.length > this._maxHistory) this._history.shift();
      this._historyIdx = this._history.length - 1;
    },

    undo: function() {
      if (this._historyIdx > 0) {
        this._historyIdx--;
        return JSON.parse(JSON.stringify(this._history[this._historyIdx]));
      }
      return null;
    },

    redo: function() {
      if (this._historyIdx < this._history.length - 1) {
        this._historyIdx++;
        return JSON.parse(JSON.stringify(this._history[this._historyIdx]));
      }
      return null;
    },

    // ── Event System ──
    on: function(event, fn) {
      if (!this._listeners[event]) this._listeners[event] = [];
      this._listeners[event].push(fn);
    },

    emit: function(event, data) {
      var fns = this._listeners[event] || [];
      for (var i = 0; i < fns.length; i++) fns[i](data);
    },

    // ── User Preferences ──
    _loadPrefs: function() {
      try {
        this._userPrefs = JSON.parse(localStorage.getItem('mxd_prefs') || '{}');
      } catch(e) { this._userPrefs = {}; }
    },

    savePref: function(key, val) {
      this._userPrefs[key] = val;
      try { localStorage.setItem('mxd_prefs', JSON.stringify(this._userPrefs)); } catch(e) {}
      this.emit('prefChange', { key: key, val: val });
    },

    getPref: function(key, def) {
      return this._userPrefs[key] !== undefined ? this._userPrefs[key] : def;
    },

    // ── Keyboard Navigation ──
    _initKeyboard: function() {
      var self = this;
      document.addEventListener('keydown', function(e) {
        // Ctrl+Z: Undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          self.emit('undo');
        }
        // Ctrl+Y or Ctrl+Shift+Z: Redo
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
          e.preventDefault();
          self.emit('redo');
        }
        // Ctrl+S: Save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault();
          self.emit('save');
        }
        // Ctrl+F: Find/Filter
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
          e.preventDefault();
          self.emit('find');
        }
        // Escape: Close modals
        if (e.key === 'Escape') {
          self.emit('escape');
        }
        // Space: Toggle/Play
        if (e.key === ' ' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          self.emit('space');
        }
        // Arrow keys: Navigate
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
          self.emit('arrow', e.key);
        }
        // Number keys: Quick actions
        if (e.key >= '1' && e.key <= '9' && !e.target.tagName.match(/INPUT|TEXTAREA/)) {
          self.emit('quickAction', parseInt(e.key));
        }
      });
    },

    // ── Mouse Tracking ──
    _initMouseTracking: function() {
      var self = this;
      document.addEventListener('mousemove', function(e) {
        self._hoveredElement = e.target;
      });
    },

    // ── Auto-Save ──
    _initAutoSave: function() {
      var self = this;
      var saveTimer = null;
      this.on('stateChange', function() {
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(function() {
          self.emit('autoSave');
        }, 2000);
      });
    },

    // ── Achievements System ──
    _initAchievements: function() {
      this._achievements = [
        { id: 'first_generate', name: 'First Puzzle', desc: 'Generate your first puzzle', icon: '🧩', unlocked: false },
        { id: 'ten_puzzles', name: 'Puzzle Master', desc: 'Generate 10 puzzles', icon: '🏆', unlocked: false, count: 0, target: 10 },
        { id: 'king_mode', name: 'King Mode', desc: 'Activate King Mode', icon: '👑', unlocked: false },
        { id: 'bulk_export', name: 'Book Creator', desc: 'Export a bulk book', icon: '📚', unlocked: false },
        { id: 'theme_switcher', name: 'Theme Explorer', desc: 'Try 3 different themes', icon: '🎨', unlocked: false, count: 0, target: 3 },
        { id: 'word_finder', name: 'Word Detective', desc: 'Find 5 words in a puzzle', icon: '🔍', unlocked: false, count: 0, target: 5 },
        { id: 'speed_demon', name: 'Speed Demon', desc: 'Generate 5 puzzles in under 1 minute', icon: '⚡', unlocked: false, count: 0, target: 5, timeLimit: 60000 },
        { id: 'settings_tweaker', name: 'Settings Tweaker', desc: 'Change 10 different settings', icon: '⚙️', unlocked: false, count: 0, target: 10 }
      ];
      try {
        var saved = JSON.parse(localStorage.getItem('mxd_achievements') || '[]');
        for (var i = 0; i < saved.length; i++) {
          for (var j = 0; j < this._achievements.length; j++) {
            if (this._achievements[j].id === saved[i]) {
              this._achievements[j].unlocked = true;
            }
          }
        }
      } catch(e) {}
    },

    unlockAchievement: function(id) {
      for (var i = 0; i < this._achievements.length; i++) {
        if (this._achievements[i].id === id && !this._achievements[i].unlocked) {
          this._achievements[i].unlocked = true;
          this._saveAchievements();
          this.emit('achievement', this._achievements[i]);
          this.toast('🏆 Achievement Unlocked: ' + this._achievements[i].name, 'success');
          return;
        }
      }
    },

    incrementAchievement: function(id, count) {
      count = count || 1;
      for (var i = 0; i < this._achievements.length; i++) {
        if (this._achievements[i].id === id && !this._achievements[i].unlocked) {
          this._achievements[i].count = (this._achievements[i].count || 0) + count;
          if (this._achievements[i].count >= this._achievements[i].target) {
            this.unlockAchievement(id);
          }
          this._saveAchievements();
          return;
        }
      }
    },

    _saveAchievements: function() {
      var unlocked = [];
      for (var i = 0; i < this._achievements.length; i++) {
        if (this._achievements[i].unlocked) unlocked.push(this._achievements[i].id);
      }
      try { localStorage.setItem('mxd_achievements', JSON.stringify(unlocked)); } catch(e) {}
    },

    // ── Toast System ──
    toast: function(msg, type, duration) {
      type = type || 'info';
      duration = duration || 3000;
      this.emit('toast', { message: msg, type: type, duration: duration });
    },

    // ── Context Menu ──
    _initContextMenu: function() {
      var self = this;
      document.addEventListener('contextmenu', function(e) {
        var target = e.target;
        if (target.closest('.gc')) {
          e.preventDefault();
          self.emit('cellContextMenu', {
            row: parseInt(target.dataset.row),
            col: parseInt(target.dataset.col),
            x: e.clientX,
            y: e.clientY
          });
        }
      });
    }
  };

  win.MXDInteractive = MXDInteractive;

  // ── Interactive Component Enhancers ──
  win.MXDEnhancers = {
    // Button with micro-interaction
    enhanceButton: function(el) {
      if (!el) return;
      el.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-1px)';
        this.style.boxShadow = '0 4px 12px rgba(99,102,241,0.3)';
      });
      el.addEventListener('mouseleave', function() {
        this.style.transform = '';
        this.style.boxShadow = '';
      });
      el.addEventListener('mousedown', function() {
        this.style.transform = 'scale(0.97)';
      });
      el.addEventListener('mouseup', function() {
        this.style.transform = 'translateY(-1px)';
      });
    },

    // Input with real-time validation
    enhanceInput: function(el, validator) {
      if (!el) return;
      el.addEventListener('input', function() {
        if (validator) {
          var result = validator(this.value);
          if (result.valid) {
            this.style.borderColor = 'var(--ok)';
          } else {
            this.style.borderColor = 'var(--err)';
          }
        }
        MXDInteractive.emit('inputChange', { el: this, value: this.value });
      });
      el.addEventListener('focus', function() {
        this.style.borderColor = 'var(--accent)';
        this.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
      });
      el.addEventListener('blur', function() {
        this.style.borderColor = '';
        this.style.boxShadow = '';
      });
    },

    // Toggle with animation
    enhanceToggle: function(el) {
      if (!el) return;
      el.addEventListener('change', function() {
        MXDInteractive.emit('toggleChange', { el: this, checked: this.checked });
      });
    },

    // Slider with live value display
    enhanceSlider: function(el, displayEl) {
      if (!el) return;
      el.addEventListener('input', function() {
        if (displayEl) displayEl.textContent = this.value;
        MXDInteractive.emit('sliderChange', { el: this, value: parseInt(this.value) });
      });
    }
  };

  // ── Interactive React Components ──
  win.MXDComponents = {
    // Interactive Button with ripple effect
    InteractiveButton: function(props) {
      var useState = React.useState;
      var [pressed, setPressed] = useState(false);
      var [ripples, setRipples] = useState([]);

      var handleClick = function(e) {
        var rect = e.currentTarget.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var newRipple = { x: x, y: y, id: Date.now() };
        setRipples(function(prev) { return prev.concat([newRipple]); });
        setTimeout(function() {
          setRipples(function(prev) { return prev.filter(function(r) { return r.id !== newRipple.id; }); });
        }, 600);
        if (props.onClick) props.onClick(e);
      };

      var btnStyle = {
        position: 'relative',
        overflow: 'hidden',
        transform: pressed ? 'scale(0.97)' : 'translateY(0)',
        transition: 'all 150ms ease',
        boxShadow: pressed ? '0 1px 3px rgba(0,0,0,0.1)' : '0 2px 8px rgba(99,102,241,0.2)',
        cursor: props.disabled ? 'not-allowed' : 'pointer'
      };

      var rippleStyle = {
        position: 'absolute',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.4)',
        transform: 'scale(0)',
        animation: 'ripple 600ms ease-out',
        pointerEvents: 'none'
      };

      return h('button', {
        className: props.className || 'btn btn-pri',
        style: Object.assign({}, btnStyle, props.style || {}),
        disabled: props.disabled,
        onClick: handleClick,
        onMouseDown: function() { setPressed(true); },
        onMouseUp: function() { setPressed(false); },
        onMouseLeave: function() { setPressed(false); },
        title: props.title,
        'aria-label': props['aria-label'] || props.children
      },
        ripples.map(function(r) {
          return h('span', {
            key: r.id,
            style: Object.assign({}, rippleStyle, {
              left: r.x - 20,
              top: r.y - 20,
              width: 40,
              height: 40
            })
          });
        }),
        props.children
      );
    },

    // Live Search Input
    LiveSearch: function(props) {
      var useState = React.useState;
      var [value, setValue] = useState(props.value || '');
      var [focused, setFocused] = useState(false);

      return h('div', { style: { position: 'relative' } },
        h('input', {
          type: 'text',
          className: 'txt-in',
          value: value,
          placeholder: props.placeholder || 'Search...',
          style: {
            borderColor: focused ? 'var(--accent)' : 'var(--border)',
            boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
            transition: 'all 150ms ease'
          },
          onChange: function(e) {
            setValue(e.target.value);
            if (props.onChange) props.onChange(e.target.value);
          },
          onFocus: function() { setFocused(true); },
          onBlur: function() { setFocused(false); },
          'aria-label': props['aria-label'] || 'Search'
        }),
        value && h('button', {
          style: {
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--t3)',
            fontSize: 14,
            padding: '2px 6px'
          },
          onClick: function() { setValue(''); if (props.onChange) props.onChange(''); },
          'aria-label': 'Clear search'
        }, '✕')
      );
    },

    // Progress Bar with animation
    AnimatedProgress: function(props) {
      var pct = props.max > 0 ? Math.round((props.value / props.max) * 100) : 0;
      return h('div', { className: 'prog-wrap' },
        h('div', { className: 'prog-bg', style: { height: 6, borderRadius: 3, background: '#e2e8f0', overflow: 'hidden' } },
          h('div', {
            className: 'prog-fill',
            style: {
              width: pct + '%',
              height: '100%',
              background: 'var(--accent)',
              transition: 'width 300ms ease',
              borderRadius: 3
            }
          })
        ),
        props.showLabel && h('div', { className: 'prog-txt', style: { fontSize: 10, color: 'var(--t3)', marginTop: 4, textAlign: 'center' } },
          props.label || (props.value + '/' + props.max + ' — ' + pct + '%')
        )
      );
    },

    // Achievement Badge
    AchievementBadge: function(props) {
      var ach = props.achievement;
      return h('div', {
        style: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          borderRadius: 8,
          background: ach.unlocked ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'var(--bg)',
          color: ach.unlocked ? '#fff' : 'var(--t3)',
          fontSize: 11,
          fontWeight: 600,
          opacity: ach.unlocked ? 1 : 0.6,
          transition: 'all 200ms ease',
          cursor: 'pointer'
        },
        title: ach.desc
      },
        h('span', { style: { fontSize: 16 } }, ach.icon),
        h('span', null, ach.name)
      );
    },

    // Toast Notification
    Toast: function(props) {
      var useEffect = React.useEffect;
      var [visible, setVisible] = React.useState(true);

      useEffect(function() {
        var timer = setTimeout(function() {
          setVisible(false);
          setTimeout(function() { if (props.onClose) props.onClose(); }, 300);
        }, props.duration || 3000);
        return function() { clearTimeout(timer); };
      }, []);

      var colors = { success: '#10b981', error: '#ef4444', warn: '#f59e0b', info: '#3b82f6' };
      var icons = { success: '✓', error: '✕', warn: '⚠', info: 'ℹ' };

      return h('div', {
        style: {
          position: 'fixed',
          bottom: 20,
          right: 20,
          padding: '12px 20px',
          borderRadius: 8,
          background: colors[props.type] || colors.info,
          color: '#fff',
          fontSize: 13,
          fontWeight: 500,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          opacity: visible ? 1 : 0,
          transition: 'all 300ms ease',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          maxWidth: 320
        }
      },
        h('span', null, icons[props.type] || 'ℹ'),
        h('span', null, props.message)
      );
    }
  };

  // ── Add ripple animation CSS ──
  var style = document.createElement('style');
  style.textContent = '@keyframes ripple{to{transform:scale(4);opacity:0}}';
  document.head.appendChild(style);

  console.log('[MXD Interactive] Components loaded');
})(window);
