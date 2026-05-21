// mxd-file-compat.js — File:// Protocol Compatibility Layer
// Ensures the app works 100% when opened by double-clicking index.html
// No server required — all CDN dependencies have local fallbacks
(function(){
  'use strict';

  var isFileProtocol = window.location.protocol === 'file:';
  var loadedScripts = {};
  var pendingCallbacks = [];
  var appInitialized = false;

  console.log('[MXD File Compat] Protocol: ' + window.location.protocol + (isFileProtocol ? ' (file:// mode)' : ' (server mode)'));

  // ============================================================
  // CDN FALLBACK CONFIGURATION
  // Maps CDN URLs to local paths and global variable checks
  // ============================================================
  var SCRIPTS = [
    {
      id: 'react',
      cdn: 'https://unpkg.com/react@18/umd/react.production.min.js',
      local: 'libs/react.production.min.js',
      check: function() { return window.React !== undefined; },
      critical: true
    },
    {
      id: 'react-dom',
      cdn: 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
      local: 'libs/react-dom.production.min.js',
      check: function() { return window.ReactDOM !== undefined; },
      critical: true,
      depends: ['react']
    },
    {
      id: 'babel',
      cdn: 'https://unpkg.com/@babel/standalone/babel.min.js',
      local: 'libs/babel.min.js',
      check: function() { return window.Babel !== undefined; },
      critical: true
    },
    {
      id: 'jspdf',
      cdn: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
      local: 'libs/jspdf.umd.min.js',
      check: function() { return window.jspdf !== undefined; },
      critical: true
    },
    {
      id: 'html2canvas',
      cdn: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
      local: 'libs/html2canvas.min.js',
      check: function() { return window.html2canvas !== undefined; },
      critical: false
    },
    {
      id: 'jszip',
      cdn: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
      local: 'libs/jszip.min.js',
      check: function() { return window.JSZip !== undefined; },
      critical: false
    }
  ];

  // ============================================================
  // SMART SCRIPT LOADER with CDN → Local fallback
  // ============================================================
  function loadScript(id, callback) {
    var scriptConfig = SCRIPTS.find(function(s) { return s.id === id; });
    if (!scriptConfig) { if (callback) callback(false); return; }
    if (loadedScripts[id]) { if (callback) callback(true); return; }

    // Check if already loaded
    if (scriptConfig.check()) {
      loadedScripts[id] = true;
      if (callback) callback(true);
      return;
    }

    // Wait for dependencies
    if (scriptConfig.depends) {
      var self = this;
      var allDepsLoaded = scriptConfig.depends.every(function(dep) { return loadedScripts[dep]; });
      if (!allDepsLoaded) {
        pendingCallbacks.push(function() { loadScript(id, callback); });
        return;
      }
    }

    var script = document.createElement('script');
    script.async = false; // Maintain order

    // Try CDN first (if not file://)
    var src = isFileProtocol ? scriptConfig.local : scriptConfig.cdn;

    script.src = src;
    script.setAttribute('data-mxd-id', id);

    script.onload = function() {
      if (scriptConfig.check()) {
        loadedScripts[id] = true;
        console.log('[MXD File Compat] ✓ Loaded: ' + id + ' from ' + src);
        if (callback) callback(true);
      } else {
        // CDN loaded but global not set — try local fallback
        if (!isFileProtocol) {
          console.warn('[MXD File Compat] CDN loaded but global not set, trying local fallback for ' + id);
          loadLocalFallback(id, callback);
        } else {
          console.error('[MXD File Compat] ✗ Failed to load: ' + id);
          if (callback) callback(false);
        }
      }
    };

    script.onerror = function() {
      console.warn('[MXD File Compat] ✗ Failed to load from ' + src + ', trying local fallback for ' + id);
      loadLocalFallback(id, callback);
    };

    document.head.appendChild(script);
  }

  function loadLocalFallback(id, callback) {
    var scriptConfig = SCRIPTS.find(function(s) { return s.id === id; });
    if (!scriptConfig) { if (callback) callback(false); return; }

    // Remove failed script
    var failedScripts = document.querySelectorAll('script[data-mxd-id="' + id + '"]');
    failedScripts.forEach(function(s) { s.parentNode.removeChild(s); });

    var script = document.createElement('script');
    script.async = false;
    script.src = scriptConfig.local;
    script.setAttribute('data-mxd-id', id);
    script.setAttribute('data-mxd-fallback', 'true');

    script.onload = function() {
      if (scriptConfig.check()) {
        loadedScripts[id] = true;
        console.log('[MXD File Compat] ✓ Loaded (local fallback): ' + id);
        if (callback) callback(true);
      } else {
        console.error('[MXD File Compat] ✗ Local fallback also failed for ' + id);
        if (callback) callback(false);
      }
    };

    script.onerror = function() {
      console.error('[MXD File Compat] ✗ Local fallback failed for ' + id + ' — file not found at: ' + scriptConfig.local);
      if (callback) callback(false);
    };

    document.head.appendChild(script);
  }

  // ============================================================
  // LOAD ALL SCRIPTS IN ORDER
  // ============================================================
  function loadAllScripts(callback) {
    var criticalScripts = SCRIPTS.filter(function(s) { return s.critical; });
    var optionalScripts = SCRIPTS.filter(function(s) { return !s.critical; });
    var loaded = 0;
    var total = criticalScripts.length;
    var allSuccess = true;

    function onScriptLoaded(success) {
      loaded++;
      if (!success) allSuccess = false;

      // Trigger pending callbacks
      pendingCallbacks.forEach(function(cb) { cb(); });
      pendingCallbacks = [];

      if (loaded === total) {
        // Now load optional scripts
        optionalScripts.forEach(function(s) {
          loadScript(s.id);
        });

        if (callback) callback(allSuccess);
      }
    }

    // Load critical scripts sequentially (respecting dependencies)
    function loadNext(index) {
      if (index >= criticalScripts.length) return;
      var s = criticalScripts[index];
      loadScript(s.id, function(success) {
        onScriptLoaded(success);
        loadNext(index + 1);
      });
    }

    loadNext(0);
  }

  // ============================================================
  // DOWNLOAD HELPER — Shows instructions if local files missing
  // ============================================================
  function showDownloadInstructions(missingScripts) {
    var overlay = document.createElement('div');
    overlay.id = 'mxd-file-compat-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:999999;display:flex;align-items:center;justify-content:center;font-family:Inter,sans-serif;';

    var box = document.createElement('div');
    box.style.cssText = 'background:#1e293b;color:#e2e8f0;padding:32px;border-radius:16px;max-width:600px;max-height:80vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.5);';

    var html = '<h2 style="color:#6366f1;margin:0 0 16px;font-size:24px;">📦 Missing Local Dependencies</h2>';
    html += '<p style="color:#94a3b8;margin:0 0 24px;line-height:1.6;">The following files are needed to run offline. Download them and place in the <code style="background:#334155;padding:2px 6px;border-radius:4px;">libs/</code> folder:</p>';
    html += '<div style="background:#0f172a;border-radius:8px;padding:16px;margin-bottom:24px;">';

    missingScripts.forEach(function(s) {
      html += '<div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #334155;">';
      html += '<div style="font-weight:600;margin-bottom:4px;">' + s.id + '</div>';
      html += '<div style="font-size:12px;color:#64748b;margin-bottom:8px;">Save as: <code style="color:#22c55e;">libs/' + s.local.replace('libs/', '') + '</code></div>';
      html += '<a href="' + s.cdn + '" target="_blank" download style="display:inline-block;background:#6366f1;color:#fff;padding:6px 12px;border-radius:6px;text-decoration:none;font-size:13px;">Download from CDN →</a>';
      html += '</div>';
    });

    html += '</div>';
    html += '<div style="background:#334155;border-radius:8px;padding:16px;margin-bottom:24px;">';
    html += '<div style="font-weight:600;margin-bottom:8px;">💡 Alternative: Use a Local Server</div>';
    html += '<div style="font-size:13px;color:#94a3b8;line-height:1.6;">';
    html += '<div style="margin-bottom:8px;"><strong>Python:</strong> <code style="background:#0f172a;padding:2px 6px;border-radius:4px;">python -m http.server 8000</code></div>';
    html += '<div style="margin-bottom:8px;"><strong>Node.js:</strong> <code style="background:#0f172a;padding:2px 6px;border-radius:4px;">npx serve .</code></div>';
    html += '<div><strong>VS Code:</strong> Install "Live Server" extension, right-click index.html → "Open with Live Server"</div>';
    html += '</div></div>';
    html += '<button onclick="document.getElementById(\'mxd-file-compat-overlay\').style.display=\'none\';" style="background:#6366f1;color:#fff;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:600;">Continue Anyway (Limited Features)</button>';

    box.innerHTML = html;
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================
  function init() {
    // If not file:// protocol, just load from CDN normally
    if (!isFileProtocol) {
      console.log('[MXD File Compat] Running on server — using CDN sources');
      return;
    }

    console.log('[MXD File Compat] Running on file:// — checking local dependencies...');

    // Check which local files exist by trying to load them
    var missingScripts = [];
    var allLoaded = true;

    // For file://, we try loading local files directly
    // If they fail, the script will be missing
    loadAllScripts(function(allSuccess) {
      if (!allSuccess) {
        // Find which scripts failed
        SCRIPTS.forEach(function(s) {
          if (!loadedScripts[s.id]) {
            missingScripts.push(s);
          }
        });

        if (missingScripts.length > 0) {
          console.warn('[MXD File Compat] Missing local files:', missingScripts.map(function(s) { return s.local; }));
          // Show download instructions after a short delay
          setTimeout(function() {
            showDownloadInstructions(missingScripts);
          }, 2000);
        }
      } else {
        console.log('[MXD File Compat] ✓ All dependencies loaded successfully!');
      }
    });
  }

  // ============================================================
  // EXPORT API
  // ============================================================
  window.MXD_FILE_COMPAT = {
    isFileProtocol: isFileProtocol,
    loadedScripts: loadedScripts,
    loadScript: loadScript,
    loadAllScripts: loadAllScripts,
    SCRIPTS: SCRIPTS,
    init: init
  };

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
