// ui.jsx - MXD UI Components (Pure JS with React.createElement)
(function(win) {
  var React = win.React;
  var WS = win.WS = win.WS || {};

  WS.Toggle = React.createElement.bind(null, 'div', {className:'tog-row'});
  WS.Section = function(p) {
    var useState = win.MXDReactHooks && win.MXDReactHooks.useState ? win.MXDReactHooks.useState : React.useState;
    var openState = useState(p.defaultOpen !== false);
    var open = openState[0], setOpen = openState[1];
    return React.createElement('div', {className:'sec' + (p.className ? ' ' + p.className : '')},
      React.createElement('div', {
        className:'sec-hd', role:'button', tabIndex:0,
        onClick: function() { setOpen(!open); },
        onKeyDown: function(e) { if(e.key==='Enter'||e.key===' '){ e.preventDefault(); setOpen(!open);} }
      },
        React.createElement('span', {className:'sec-hd-main'},
          React.createElement('span', {className:'sec-icon', 'aria-hidden':true}, p.icon || ''),
          React.createElement('span', {className:'sec-title-text'}, p.title),
          p.badge && React.createElement('span', {className:'sec-badge'}, p.badge)
        ),
        React.createElement('span', {className:'sec-chev' + (open ? '' : ' shut'), 'aria-hidden':true}, '▼')
      ),
      open && p.children && React.createElement('div', {className:'sec-body'}, p.children),
      !open && p.summaryChildren && React.createElement('div', {className:'sec-body'}, p.summaryChildren)
    );
  };

  WS.Slider = function(p) {
    return React.createElement('div', {className:'sl-wrap'},
      React.createElement('div', {className:'sl-hd'},
        React.createElement('span', {className:'lbl'}, p.label),
        React.createElement('span', {className:'sl-val'}, String(p.value) + (p.unit || ''))
      ),
      React.createElement('input', {type:'range', min:p.min, max:p.max, step:p.step||1, value:p.value, onChange:function(e){p.onChange(Number(e.target.value));}})
    );
  };

  WS.Toast = function(p) {
    var useEffect = win.MXDReactHooks && win.MXDReactHooks.useEffect ? win.MXDReactHooks.useEffect : React.useEffect;
    useEffect(function() {
      var t = setTimeout(p.onClose, 3800);
      return function() { clearTimeout(t); };
    }, []);
    var icons = {success:'✓', error:'✕', info:'ℹ', warn:'⚠'};
    return React.createElement('div', {className:'toast ' + (p.type||'info'), role:'status'}, (icons[p.type]||'ℹ') + ' ' + p.message);
  };

  WS.Progress = function(p) {
    var pct = p.total > 0 ? Math.round((p.done/p.total)*100) : 0;
    return React.createElement('div', {className:'prog-wrap'},
      React.createElement('div', {className:'prog-bg'},
        React.createElement('div', {className:'prog-fill', style:{width:pct+'%'}})
      ),
      React.createElement('div', {className:'prog-txt'}, (p.label||(p.done+'/'+p.total+' ✓ ' + pct + '%')))
    );
  };

  WS.ColorPicker = function(p) {
    return React.createElement('div', {className:'cprow'},
      React.createElement('span', {className:'lbl'}, p.label),
      React.createElement('div', {className:'cpsw', style:{background:p.value}, title:'Click to change color'},
        React.createElement('input', {type:'color', value:p.value, onChange:function(e){p.onChange(e.target.value);}})
      ),
      React.createElement('span', {style:{fontSize:10,color:'var(--t3)',fontFamily:'monospace'}}, p.value)
    );
  };

  WS.NumberInput = function(p) {
    return React.createElement('div', {className:'nrow'},
      React.createElement('span', {className:'lbl'}, p.label),
      React.createElement('input', {type:'number', min:p.min, max:p.max, step:p.step||1, value:p.value, onChange:function(e){p.onChange(Number(e.target.value));}})
    );
  };

  WS.Select = function(p) {
    return React.createElement('div', {className:'srow'},
      React.createElement('span', {className:'lbl'}, p.label),
      React.createElement('select', {value:p.value, onChange:function(e){p.onChange(e.target.value);}},
        (p.options||[]).map(function(o){ return React.createElement('option', {key:o.v, value:o.v}, o.l); })
      )
    );
  };

  WS.TextInput = function(p) {
    return React.createElement('div', {className:'trow'},
      React.createElement('span', {className:'lbl'}, p.label),
      React.createElement('input', {type:p.type||'text', value:p.value, placeholder:p.placeholder||'', onChange:function(e){p.onChange(e.target.value);}})
    );
  };

  var HCOLORS = ['#6c63ff','#22c55e','#f59e0b','#ef4444','#3b82f6','#ec4899','#14b8a6','#f97316','#8b5cf6','#06b6d4','#84cc16','#f43f5e'];

  WS.PuzzleGrid = function(p) {
    var useMemo = win.MXDReactHooks && win.MXDReactHooks.useMemo ? win.MXDReactHooks.useMemo : React.useMemo;
    var R = p.grid.length, C = p.grid[0].length;
    var cs = p.cellSize || 28;

    var solSet = useMemo(function() {
      if(!p.showSol) return new Set();
      var s = new Set();
      Object.values(p.placements || {}).forEach(function(cells){ cells.forEach(function(c){ s.add(c[0]+'-'+c[1]); }); });
      return s;
    }, [p.showSol, p.placements]);

    var foundSet = useMemo(function() {
      var s = new Set();
      (p.foundWords||[]).forEach(function(w){ if(p.placements[w]) p.placements[w].forEach(function(c){ s.add(c[0]+'-'+c[1]); }); });
      return s;
    }, [p.foundWords, p.placements]);

    var selSet = useMemo(function() {
      return new Set((p.selCells||[]).map(function(c){ return c[0]+'-'+c[1]; }));
    }, [p.selCells]);

    var fw = p.fontWeight === 'bold' ? 700 : p.fontWeight === 'light' ? 300 : 400;
    var cells = [];
    for(var r=0; r<R; r++) {
      for(var c=0; c<C; c++) {
        if(!p.mask[r][c]) continue;
        var key = r+'-'+c;
        var highlighted = solSet.has(key) || foundSet.has(key) || selSet.has(key);
        var bg = highlighted ? 'rgba(201,162,39,0.35)' : 'transparent';
        cells.push(React.createElement('div', {
          key: key, className:'gc' + (highlighted ? ' hi' : ''),
          style:{width:cs, height:cs, fontWeight:fw, background:bg},
          onMouseDown: p.onMouseDown ? function(r,c){ return function(e){p.onMouseDown(r,c,e);}; }(r,c) : null,
          onMouseEnter: p.onMouseEnter ? function(r,c){ return function(e){p.onMouseEnter(r,c,e);}; }(r,c) : null
        }, p.grid[r][c] || ''));
      }
    }

    return React.createElement('div', {className:'gw'},
      React.createElement('div', {className:'gg', style:{gridTemplateColumns:'repeat('+C+','+cs+'px)', gridTemplateRows:'repeat('+R+','+cs+'px)', width:C*cs+'px', height:R*cs+'px'}, onMouseUp:p.onMouseUp, onMouseLeave:p.onMouseUp},
        cells
      )
    );
  };

  WS.WordList = function(p) {
    var words = Object.keys(p.placements || {});
    return React.createElement('div', {className:'wl', style:{gridTemplateColumns:'repeat('+(p.cols||3)+',1fr)'}},
      words.map(function(w){
        var found = (p.foundWords||[]).includes(w);
        return React.createElement('div', {key:w, className:'wl-w' + (found ? ' fo' : '')}, w);
      })
    );
  };
})(window);