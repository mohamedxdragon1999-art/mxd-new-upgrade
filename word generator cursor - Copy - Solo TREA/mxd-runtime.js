(function(){
  'use strict';

  window.isOrganicShape=function(id){
    if(!window.MXDMaskPipeline||!window.MXDMaskPipeline.SHAPE_PATHS||!window.MXDMaskPipeline.SHAPE_PATHS[id])return false;
    var geo=['circle','square','rectangle','diamond','triangle','pentagon','hexagon','octagon','star','heart','cross','arrow','cloud','drop'];
    if(geo.indexOf(id)!==-1)return false;
    if(id.indexOf('letter_')===0||id.indexOf('num_')===0)return false;
    return true;
  };

  window.CaptureExport={
    capture:function(element,dpi,scale){
      scale=scale||2;
      if(window.html2canvas){
        return html2canvas(element,{scale:scale,backgroundColor:'#ffffff',useCORS:true,logging:false}).then(function(canvas){
          var link=document.createElement('a');
          link.download='puzzle-'+Date.now()+'.png';
          link.href=canvas.toDataURL('image/png');
          link.click();
          return canvas;
        });
      }
      return Promise.reject(new Error('html2canvas not loaded'));
    }
  };

  if('serviceWorker' in navigator){
    window.addEventListener('load',function(){
      navigator.serviceWorker.register('./service-worker.js').then(function(reg){
        console.log('[SW] Registered, scope:',reg.scope);
        reg.addEventListener('updatefound',function(){
          var newWorker=reg.installing;
          newWorker.addEventListener('statechange',function(){
            if(newWorker.state==='installed'&&navigator.serviceWorker.controller){
              if(window.showToast)window.showToast('Update available! Reload to get the latest version.','info');
            }
          });
        });
      }).catch(function(err){
        console.log('[SW] Registration failed (expected on file://):',err.message);
      });
    });
  }

  (function(){
    function initOfflineArchitecture(){
      if(window.MXDConnectivity){
        window.MXDConnectivity.init({
          heartbeatIntervalMs: 30000,
          maxHeartbeatFailures: 3
        });
        var statusBar = document.createElement('div');
        statusBar.id = 'mxd-connectivity-status';
        document.body.appendChild(statusBar);
        window.MXDConnectivity.renderStatusBar('mxd-connectivity-status');
        window.MXDConnectivity.on('offline', function(){
          if(window.showToast) window.showToast('Offline mode activated - all core features work normally', 'warn', 4000);
        });
        window.MXDConnectivity.on('online', function(){
          if(window.showToast) window.showToast('Back online - syncing KDP data...', 'success', 3000);
        });
      }

      if(window.MXDOfflineDB){
        window.MXDOfflineDB.init().then(function(ready){
          if(ready){
            window.MXDOfflineDB.migrateFromLocalStorage().then(function(count){
              if(count > 0) console.log('[MXD] Migrated ' + count + ' items from localStorage to IndexedDB');
            });
            setInterval(function(){
              window.MXDOfflineDB.cleanupExpiredCache();
            }, 3600000);
          }
        });
      }

      if(window.MXDSyncEngine){
        window.MXDSyncEngine.init();
      }

      if(window.MXDHealV4){
        window.MXDHealV4.init();
      }

      if(window.PdfExport){
        window.PdfExport.init();
      }

      if(window.MXDSVGEngine){
        console.log('[MXD] SVG Engine v' + window.MXDSVGEngine.version + ' ready');
      }

      if(window.MXDMaskPipeline && window.MXDMaskPipeline.loadCustomShapesFromDB){
        window.MXDMaskPipeline.loadCustomShapesFromDB().then(function(count){
          if(count > 0) console.log('[MXD] Loaded ' + count + ' custom shapes from IndexedDB');
          setTimeout(function(){
            if(window.MXDSVGStudio) window.MXDSVGStudio._refreshGrid();
          }, 500);
        });
      }

      if(window.Worker){
        try {
          var puzzleWorker = new Worker('puzzle-worker.js');
          window.MXD_PUZZLE_WORKER = puzzleWorker;
          console.log('[MXD] Puzzle Web Worker initialized');
        } catch(e) {
          console.log('[MXD] Puzzle Worker unavailable - using main thread generation');
        }
      }

      console.log('[MXD] Offline architecture initialized');
    }

    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', initOfflineArchitecture);
    } else {
      initOfflineArchitecture();
    }
  })();

  window.MXD_PERF_DASHBOARD={
    _visible:false,
    _el:null,
    _interval:null,
    toggle:function(){
      if(this._visible)this.hide();else this.show();
    },
    show:function(){
      if(this._el){this._el.style.display='block';this._visible=true;return;}
      this._el=document.createElement('div');
      this._el.id='mxd-perf-dashboard';
      this._el.style.cssText='position:fixed;bottom:10px;left:10px;z-index:99998;background:rgba(15,23,42,0.92);color:#e2e8f0;padding:12px 16px;border-radius:10px;font-family:monospace;font-size:12px;line-height:1.6;min-width:260px;box-shadow:0 4px 20px rgba(0,0,0,0.3);backdrop-filter:blur(8px);';
      this._el.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><strong style="color:#6366f1;">Performance</strong><button id="mxd-perf-close" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:16px;padding:0 4px;">&times;</button></div><div id="mxd-perf-content">Loading...</div>';
      document.body.appendChild(this._el);
      var self=this;
      document.getElementById('mxd-perf-close').addEventListener('click',function(){self.hide();});
      this._interval=setInterval(function(){self.update();},1000);
      this.update();
      this._visible=true;
    },
    hide:function(){
      if(this._el)this._el.style.display='none';
      if(this._interval)clearInterval(this._interval);
      this._visible=false;
    },
    update:function(){
      if(!this._el)return;
      var c=document.getElementById('mxd-perf-content');
      if(!c)return;
      var mem=window.MXD_PERF?window.MXD_PERF.getMemory():null;
      var heal=window.MXD_OMNI_HEAL?window.MXD_OMNI_HEAL.getHealthScore():null;
      var online=navigator.onLine;
      var html='<div>Online: <span style="color:'+(online?'#10b981':'#ef4444')+'">'+(online?'Yes':'No')+'</span></div>';
      if(mem)html+='<div>Memory: '+mem.used+' / '+mem.total+'</div>';
      if(heal)html+='<div>Health: <span style="color:'+(heal>80?'#10b981':heal>50?'#f59e0b':'#ef4444')+'">'+heal+'%</span></div>';
      var errs=JSON.parse(localStorage.getItem('mxd_error_log')||'[]');
      html+='<div>Errors: '+errs.length+'</div>';
      var cacheHits=localStorage.getItem('mxd_pdf_cache_hits')||'0';
      html+='<div>PDF Cache Hits: '+cacheHits+'</div>';
      c.innerHTML=html;
    }
  };

  window.MXD_SHORTCUTS={
    _map:{},
    register:function(key,fn,desc){this._map[key.toLowerCase()]={fn:fn,desc:desc};},
    init:function(){
      var self=this;
      document.addEventListener('keydown',function(e){
        if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.isContentEditable)return;
        var key='';
        if(e.ctrlKey||e.metaKey)key+='ctrl+';
        if(e.altKey)key+='alt+';
        if(e.shiftKey)key+='shift+';
        key+=e.key.toLowerCase();
        var handler=self._map[key];
        if(handler){e.preventDefault();handler.fn(e);}
      });
    },
    getHelp:function(){
      var h=[];
      for(var k in this._map)h.push({key:k,desc:this._map[k].desc});
      return h;
    }
  };
  window.MXD_SHORTCUTS.register('ctrl+n',function(){if(window.newPuzzle)window.newPuzzle();},'New Puzzle');
  window.MXD_SHORTCUTS.register('ctrl+e',function(){if(window.exportPDF)window.exportPDF();},'Export PDF');
  window.MXD_SHORTCUTS.register('ctrl+s',function(){if(window.savePuzzle)window.savePuzzle();},'Save Puzzle');
  window.MXD_SHORTCUTS.register('ctrl+z',function(){if(window.MXD_UI_ENHANCEMENTS&&window._undoRedo){var s=window._undoRedo.undo();if(s&&window.applyState)window.applyState(s);}},'Undo');
  window.MXD_SHORTCUTS.register('ctrl+y',function(){if(window.MXD_UI_ENHANCEMENTS&&window._undoRedo){var s=window._undoRedo.redo();if(s&&window.applyState)window.applyState(s);}},'Redo');
  window.MXD_SHORTCUTS.register('ctrl+g',function(){if(window.generatePuzzle)window.generatePuzzle();},'Generate');
  window.MXD_SHORTCUTS.register('f11',function(){var el=document.documentElement;if(el.requestFullscreen)el.requestFullscreen();else if(el.webkitRequestFullscreen)el.webkitRequestFullscreen();},'Fullscreen');
  window.MXD_SHORTCUTS.register('escape',function(){if(document.fullscreenElement)document.exitFullscreen();},'Exit Fullscreen');
  window.MXD_SHORTCUTS.register('ctrl+shift+p',function(){if(window.MXD_PERF_DASHBOARD)window.MXD_PERF_DASHBOARD.toggle();},'Toggle Performance Dashboard');
  window.MXD_SHORTCUTS.register('ctrl+,',function(){if(window.MXD_SETTINGS_UI)window.MXD_SETTINGS_UI.show();},'Open Settings');
  window.MXD_SHORTCUTS.register('f1',function(){if(window.MXD_SETTINGS_UI)window.MXD_SETTINGS_UI.show();},'Open Settings');
  window.MXD_SHORTCUTS.init();

  window.showToast=function(msg,type,dur){
    type=type||'info';dur=dur||3000;
    var existing=document.getElementById('mxd-toast-container');
    if(!existing){existing=document.createElement('div');existing.id='mxd-toast-container';existing.style.cssText='position:fixed;top:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:8px;pointer-events:none;';document.body.appendChild(existing);}
    var t=document.createElement('div');
    t.style.cssText='pointer-events:auto;padding:12px 20px;border-radius:8px;font-size:14px;font-family:Inter,sans-serif;color:#fff;box-shadow:0 4px 12px rgba(0,0,0,0.15);opacity:0;transform:translateX(100%);transition:all 0.3s cubic-bezier(0.4,0,0.2,1);max-width:320px;word-wrap:break-word;';
    var colors={success:'#10b981',error:'#ef4444',warn:'#f59e0b',info:'#3b82f6'};
    t.style.backgroundColor=colors[type]||colors.info;
    t.textContent=msg;
    existing.appendChild(t);
    requestAnimationFrame(function(){t.style.opacity='1';t.style.transform='translateX(0)';});
    setTimeout(function(){t.style.opacity='0';t.style.transform='translateX(100%)';setTimeout(function(){if(t.parentNode)t.parentNode.removeChild(t);},300);},dur);
  };

  window.addEventListener('error',function(e){
    var errData={message:e.message||'Unknown error',file:e.filename||'unknown',line:e.lineno||0,col:e.colno||0,stack:e.error?e.error.stack:'N/A',ts:Date.now()};
    console.error('[MXD_ERROR]',errData);
    try{
      var hist=JSON.parse(localStorage.getItem('mxd_error_log')||'[]');
      hist.push(errData);
      if(hist.length>100)hist=hist.slice(-100);
      localStorage.setItem('mxd_error_log',JSON.stringify(hist));
    }catch(x){}
    if(window.MXD_OMNI_HEAL)window.MXD_OMNI_HEAL.heal({message:errData.message,type:'render',source:'window'});
  },true);

  window.addEventListener('unhandledrejection',function(e){
    var msg=e.reason&&e.reason.message?e.reason.message:String(e.reason||'Unknown rejection');
    console.error('[MXD_PROMISE_ERROR]',msg);
    if(window.MXD_OMNI_HEAL)window.MXD_OMNI_HEAL.heal({message:msg,type:'promise',source:'unhandledrejection'});
  },true);

  console.log('[MXD Runtime] Loaded');
})();
