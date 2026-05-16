// ── Shared UI Components (loaded before app.jsx) ──
const { useState, useEffect, useRef, useMemo, useCallback } = React;

window.WS = {}; // shared namespace

// ── Toggle ──
WS.Toggle = function({ label, checked, onChange, id }) {
  return (
    <div className="toggle-row">
      <span className="toggle-label">{label}</span>
      <label className="toggle-switch" htmlFor={id}>
        <input type="checkbox" id={id} checked={checked} onChange={e => onChange(e.target.checked)} />
        <span className="toggle-slider"></span>
      </label>
    </div>
  );
};

// ── Section ──
WS.Section = function({ title, icon, children, defaultOpen=true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="section">
      <div className="section-header" onClick={() => setOpen(!open)}>
        <span className="section-title"><span className="icon">{icon}</span>{title}</span>
        <span className={`section-chevron ${open?'':'collapsed'}`}>▾</span>
      </div>
      <div className={`section-body ${open?'':'collapsed'}`}>{children}</div>
    </div>
  );
};

// ── Slider ──
WS.Slider = function({ label, value, min, max, step=1, onChange, unit='' }) {
  return (
    <div className="slider-control" style={{marginBottom:10}}>
      <div className="slider-header">
        <span className="form-label">{label}</span>
        <span className="slider-value">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))} />
    </div>
  );
};

// ── Toast ──
WS.Toast = function({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  const icon = type === 'success' ? '✓' : type === 'info' ? 'ℹ' : '⚠';
  return <div className={`toast ${type}`}>{icon} {message}</div>;
};

// ── Progress ──
WS.Progress = function({ value, max, label }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="progress-wrap">
      <div className="progress-bar-bg"><div className="progress-bar-fill" style={{width:`${pct}%`}} /></div>
      <div className="progress-text">{label} ({pct}%)</div>
    </div>
  );
};

// ── ColorPicker ──
WS.ColorPicker = function({ label, value, onChange }) {
  return (
    <div className="color-picker-row">
      <span className="form-label">{label}</span>
      <div className="color-swatch" style={{backgroundColor: value}}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)} />
      </div>
    </div>
  );
};

// ── PuzzleGrid ──
WS.PuzzleGrid = function({ grid, mask, placements, showSol, solStyle, foundWords,
  hlColor, fontWeight, cellSize, onMouseDown, onMouseEnter, onMouseUp, selCells, template }) {
  const rows = grid.length, cols = grid[0].length;

  const solSet = useMemo(() => {
    if (!showSol) return new Set();
    const s = new Set();
    Object.values(placements).forEach(cells => cells.forEach(([r,c]) => s.add(`${r}-${c}`)));
    return s;
  }, [showSol, placements]);

  const foundSet = useMemo(() => {
    const s = new Set();
    foundWords.forEach(w => { if (placements[w]) placements[w].forEach(([r,c]) => s.add(`${r}-${c}`)); });
    return s;
  }, [foundWords, placements]);

  const selSet = useMemo(() => new Set(selCells.map(([r,c]) => `${r}-${c}`)), [selCells]);

  const COLORS = ['#6c63ff','#22c55e','#f59e0b','#ef4444','#3b82f6','#ec4899','#14b8a6','#f97316','#8b5cf6','#06b6d4'];

  const lines = useMemo(() => {
    const out = [];
    if (showSol) {
      let ci = 0;
      Object.entries(placements).forEach(([w, cells]) => {
        if (cells.length < 2) return;
        const [r1,c1] = cells[0], [r2,c2] = cells[cells.length-1];
        out.push({ x1: c1*cellSize+cellSize/2, y1: r1*cellSize+cellSize/2,
          x2: c2*cellSize+cellSize/2, y2: r2*cellSize+cellSize/2,
          color: template?.colorMode === 'bw' ? '#aaa' : COLORS[ci%COLORS.length] });
        ci++;
      });
    }
    foundWords.forEach((w, ci) => {
      if (!placements[w] || placements[w].length < 2) return;
      const cells = placements[w];
      const [r1,c1] = cells[0], [r2,c2] = cells[cells.length-1];
      if (!out.find(l => l.color === COLORS[ci % COLORS.length])) {
        out.push({ x1: c1*cellSize+cellSize/2, y1: r1*cellSize+cellSize/2,
          x2: c2*cellSize+cellSize/2, y2: r2*cellSize+cellSize/2,
          color: COLORS[ci%COLORS.length] });
      }
    });
    return out;
  }, [showSol, placements, foundWords, cellSize, template]);

  const fw = fontWeight === 'bold' ? 700 : fontWeight === 'light' ? 300 : 400;

  return (
    <div className="grid-wrapper">
      <div className="puzzle-grid"
        style={{ gridTemplateColumns: `repeat(${cols},${cellSize}px)`, gridTemplateRows: `repeat(${rows},${cellSize}px)`,
          width: cols*cellSize, height: rows*cellSize, border: template?.gridBorder ? '2px solid #ddd' : 'none' }}
        onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
        <svg className="grid-svg-overlay" width={cols*cellSize} height={rows*cellSize}>
          {lines.map((l,i) => <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={l.color} strokeWidth={cellSize*0.72} strokeLinecap="round" opacity={0.28} />)}
          {selCells.length > 1 && (
            <line x1={selCells[0][1]*cellSize+cellSize/2} y1={selCells[0][0]*cellSize+cellSize/2}
              x2={selCells[selCells.length-1][1]*cellSize+cellSize/2}
              y2={selCells[selCells.length-1][0]*cellSize+cellSize/2}
              stroke={hlColor} strokeWidth={cellSize*0.72} strokeLinecap="round" opacity={0.35} />
          )}
          {template?.gridLines && Array.from({length:cols+1}).map((_,i) => (
            <line key={`v${i}`} x1={i*cellSize} y1={0} x2={i*cellSize} y2={rows*cellSize} stroke="#eee" strokeWidth={1} />
          ))}
          {template?.gridLines && Array.from({length:rows+1}).map((_,i) => (
            <line key={`h${i}`} x1={0} y1={i*cellSize} x2={cols*cellSize} y2={i*cellSize} stroke="#eee" strokeWidth={1} />
          ))}
        </svg>
        {grid.map((row, ri) => row.map((cell, ci) => {
          if (!mask[ri][ci]) return <div key={`${ri}-${ci}`} className="grid-cell" style={{width:cellSize,height:cellSize,visibility:'hidden'}} />;
          const isSol = solSet.has(`${ri}-${ci}`), isFound = foundSet.has(`${ri}-${ci}`), isSel = selSet.has(`${ri}-${ci}`);
          let bg = 'transparent', color = template?.cellTextColor || '#2d2d44';
          if (isSel) { bg = hlColor + '55'; color = '#fff'; }
          if (isFound) { bg = hlColor + '44'; }
          if (showSol && solStyle === 'dim' && !isSol) color = '#ccc';
          if (showSol && solStyle === 'highlight' && isSol) color = '#5b21b6';
          if (template?.colorMode === 'bw') { bg = bg === 'transparent' ? 'transparent' : '#eee'; color = '#000'; }
          return (
            <div key={`${ri}-${ci}`} className="grid-cell"
              style={{ width:cellSize, height:cellSize, fontSize: Math.max(cellSize*0.5,9), fontWeight: fw,
                background: bg, color, fontFamily: template?.fontFamily || 'Inter,monospace',
                border: template?.gridLines ? '1px solid #f0f0f0' : 'none' }}
              onMouseDown={() => onMouseDown(ri,ci)}
              onMouseEnter={() => onMouseEnter(ri,ci)}>
              {cell}
            </div>
          );
        }))}
      </div>
    </div>
  );
};

// ── WordList ──
WS.WordList = function({ words, foundWords, fontSize, columns, template }) {
  const cols = columns || 4;
  const bw = template?.colorMode === 'bw';
  return (
    <div className="word-list-section" style={{ borderTopColor: template?.accentColor || '#f0f0f0' }}>
      <div className="word-list-title" style={{ color: template?.titleColor || '#2d2d44', fontFamily: template?.fontFamily }}>
        Words to Find
      </div>
      <div className="word-list-grid" style={{ gridTemplateColumns: `repeat(${cols},1fr)`, display: 'grid', gap: 6 }}>
        {words.map(w => (
          <span key={w} className={`word-pill ${foundWords.includes(w) ? 'found' : ''}`}
            style={{ fontSize, justifyContent: 'center',
              background: bw ? (foundWords.includes(w) ? '#ccc' : '#eee') : (foundWords.includes(w) ? '#dcfce7' : template?.pillBg || '#f3f0ff'),
              color: bw ? '#333' : (foundWords.includes(w) ? '#166534' : template?.pillColor || '#4a3d8f') }}>
            {w.toUpperCase()}
          </span>
        ))}
      </div>
    </div>
  );
};
// ── LiveSpyOverlay (Chrome Extension Simulator) ──
WS.LiveSpyOverlay = function({ market, isKing }) {
  const [data, setData] = useState({ bsr: '...', sales: '...', royalty: '...', competition: '...' });
  
  useEffect(() => {
    const timer = setInterval(() => {
      setData({
        bsr: (Math.floor(Math.random() * 50000) + 1000).toLocaleString(),
        sales: Math.floor(Math.random() * 500) + 10,
        royalty: (Math.random() * 10 + 2).toFixed(2),
        competition: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)]
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="spy-extension-ui">
       <div className="spy-hd">
          <span>BookBeam LIVE SPY</span>
          <div className="spy-badge">PRO</div>
       </div>
       <div className="spy-stats-grid">
          <div className="spy-stat">
             <label>EST. SALES</label>
             <div className="val">{data.sales}/mo</div>
          </div>
          <div className="spy-stat">
             <label>BSR</label>
             <div className="val">#{data.bsr}</div>
          </div>
          <div className="spy-stat">
             <label>ROYALTY</label>
             <div className="val">{market.cur}{data.royalty}</div>
          </div>
          <div className="spy-stat">
             <label>COMPETITION</label>
             <div className="val">{data.competition}</div>
          </div>
       </div>
       <div className="spy-chart-sim">
          <div className="chart-bar-sim" style={{height: '30%'}}></div>
          <div className="chart-bar-sim" style={{height: '80%'}}></div>
          <div className="chart-bar-sim" style={{height: '50%'}}></div>
          <div className="chart-bar-sim" style={{height: '90%'}}></div>
       </div>
    </div>
  );
};
// ── SeoGenerator (AI Metadata Suite) ──
WS.SeoGenerator = function({ title, isKing }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const generate = () => {
    setLoading(true);
    setTimeout(() => {
      setData({
        title: `${title} Supreme: The Ultimate Collection`,
        subtitle: `Over 100+ Pro-Level Puzzles for Brain Health and Relaxation`,
        description: `Experience the most advanced ${title} collection ever created... [AI GENERATED DESCRIPTION]`,
        keywords: ['puzzle book', 'brain games', 'kdp bestseller', 'activity book', 'senior puzzles', 'large print', 'logic games']
      });
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="seo-gen-ui">
       <button className="btn btn-ok btn-full" onClick={generate} disabled={loading}>
          {loading ? 'AI GEN: Analyzing Market...' : '✨ Deep AI SEO Generate'}
       </button>
       {data && (
         <div className="seo-results" style={{marginTop: 15}}>
            <div className="seo-field">
               <label>OPTIMIZED TITLE</label>
               <input className="num-in" value={data.title} readOnly />
            </div>
            <div className="seo-field">
               <label>PRO SUBTITLE</label>
               <textarea className="wta" value={data.subtitle} readOnly rows={2} />
            </div>
            <div className="seo-field">
               <label>7 BACKEND KEYWORDS</label>
               <div className="kw-grid">
                  {data.keywords.map((kw, i) => <span key={i} className="kw-tag">{kw}</span>)}
               </div>
            </div>
         </div>
       )}
    </div>
  );
};
// ── AmazonPreview (Market Simulator) ──
WS.AmazonPreview = function({ title, subtitle, listPrice, market }) {
  return (
    <div className="amz-preview">
       <div className="amz-hd">
          <div className="amz-img-sim">📖</div>
          <div className="amz-info">
             <div className="amz-title">{title} Supreme</div>
             <div className="amz-subtitle">{subtitle || 'The Ultimate Puzzle Collection'}</div>
             <div className="amz-stars">⭐⭐⭐⭐⭐ <span style={{fontSize: 9, color: 'var(--accent)'}}>(4.9)</span></div>
             <div className="amz-price">{market.cur}{listPrice}</div>
             <div className="amz-prime">✓ Prime</div>
          </div>
       </div>
       <button className="btn btn-ok btn-full" style={{marginTop: 10, fontSize: 10}}>Add to Cart</button>
    </div>
  );
};
// ── AiImageGen (KDP Illustration Engine) ──
WS.AiImageGen = function({ isKing }) {
  const [prompt, setPrompt] = useState('');
  const [img, setImg] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = () => {
    if(!prompt) return;
    setLoading(true);
    setTimeout(() => {
      setImg('🖼️'); // Simulate image
      setLoading(false);
      showToast("AI IMAGE: High-res coloring page generated.", "success");
    }, 2500);
  };

  return (
    <div className="ai-img-gen">
       <input className="num-in" placeholder="Describe image (e.g. 'cute cat')..." value={prompt} onChange={e => setPrompt(e.target.value)} />
       <button className="btn btn-pri btn-full" style={{marginTop: 8}} onClick={generate} disabled={loading}>
          {loading ? 'AI Drawing...' : '✨ Generate Coloring Page'}
       </button>
       {img && (
         <div className="img-preview-sim">
            <div style={{fontSize: 40, textAlign: 'center', background: '#eee', padding: 20, borderRadius: 8}}>{img}</div>
            <div style={{fontSize: 9, marginTop: 4, color: 'var(--t3)', textAlign: 'center'}}>Coloring-Ready Vector (Simulated)</div>
         </div>
       )}
    </div>
  );
};
