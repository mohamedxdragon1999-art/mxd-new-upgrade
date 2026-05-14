// ui.jsx Ã¢â‚¬â€ MXD UI Components: Base + Grid + Panels (Merged)
// Combines: ui-base.jsx, ui-grid.jsx, mxd-ai-panel.jsx, mxd-kdp-panels.jsx, mxd-control-center.jsx, mxd-quality-panel.jsx, mxd-offline-tools.jsx
const [useState, useEffect, useRef, useMemo] = window.MXDReactHooks;

window.WS = window.WS || {};

// Toggle
WS.Toggle = function({ label, checked, onChange, id, sublabel }) {
  return (
    <div className="tog-row">
      <div><span className="tog-lbl">{label}</span>{sublabel&&<div style={{fontSize:10,color:'var(--t3)',marginTop:1}}>{sublabel}</div>}</div>
      <label className="tog-sw" htmlFor={id}>
        <input type="checkbox" id={id} checked={checked} onChange={e=>onChange(e.target.checked)}/>
        <span className="tog-sl"/>
      </label>
    </div>
  );
};

// Section
WS.Section = function({ title, icon, children, defaultOpen=true, badge, className='', collapseMode='full', summaryChildren, visibleWhenCollapsed=2 }) {
  const [open, setOpen] = useState(defaultOpen);
  const n = Math.max(0, Number(visibleWhenCollapsed) || 0);
  const arr = (children || []).filter(c => c != null && c !== false && (typeof c !== 'string' || c.trim() !== ''));
  return (
    <div className={`sec ${className}`.trim()}>
      <div className="sec-hd" role="button" tabIndex={0} onClick={()=>setOpen(!open)} onKeyDown={e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); setOpen(!open);} }}>
        <span className="sec-hd-main"><span className="sec-icon" aria-hidden="true">{icon}</span><span className="sec-title-text">{title}</span>{badge&&<span className="sec-badge">{badge}</span>}</span>
        <span className={`sec-chev ${open?'':'shut'}`} aria-hidden="true">Ã¢â€“Â¾</span>
      </div>
      {open && <div className="sec-body">{children}</div>}
      {!open && <div className="sec-body shut" aria-hidden="true"/>}
    </div>
  );
};

// Slider
WS.Slider = function({ label, value, min, max, step=1, onChange, unit='' }) {
  return (
    <div className="sl-wrap">
      <div className="sl-hd"><span className="lbl">{label}</span><span className="sl-val">{value}{unit}</span></div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/>
    </div>
  );
};

// Toast
WS.Toast = function({ message, type='info', onClose }) {
  useEffect(()=>{ const t=setTimeout(onClose,3800); return()=>clearTimeout(t); },[]);
  const icons={success:'Ã¢Å“â€œ',error:'Ã¢Å“â€¢',info:'Ã¢â€žÂ¹',warn:'Ã¢Å¡Â¡'};
  return <div className={`toast ${type}`} role="status">{icons[type]||'Ã¢â€žÂ¹'} {message}</div>;
};

// Progress
WS.Progress = function({ done, total, label }) {
  const pct=total>0?Math.round((done/total)*100):0;
  return (
    <div className="prog-wrap">
      <div className="prog-bg"><div className="prog-fill" style={{width:`${pct}%`}}/></div>
      <div className="prog-txt">{label||`${done}/${total}`} Ã¢â‚¬â€ {pct}%</div>
    </div>
  );
};

// ColorPicker
WS.ColorPicker = function({ label, value, onChange }) {
  return (
    <div className="cprow">
      <span className="lbl">{label}</span>
      <div className="cpsw" style={{background:value}} title="Click to change color">
        <input type="color" value={value} onChange={e=>onChange(e.target.value)}/>
      </div>
      <span style={{fontSize:10,color:'var(--t3)',fontFamily:'monospace'}}>{value}</span>
    </div>
  );
};

// NumberInput
WS.NumberInput = function({ label, value, min, max, step=1, onChange }) {
  return (
    <div className="nrow">
      <span className="lbl">{label}</span>
      <input type="number" min={min} max={max} step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/>
    </div>
  );
};

// Select
WS.Select = function({ label, value, options, onChange }) {
  return (
    <div className="srow">
      <span className="lbl">{label}</span>
      <select value={value} onChange={e=>onChange(e.target.value)}>
        {options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
};

// TextInput
WS.TextInput = function({ label, value, onChange, placeholder='', type='text' }) {
  return (
    <div className="trow">
      <span className="lbl">{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/>
    </div>
  );
};

// ============ PUZZLE GRID ============
const HCOLORS=['#6c63ff','#22c55e','#f59e0b','#ef4444','#3b82f6','#ec4899','#14b8a6','#f97316','#8b5cf6','#06b6d4','#84cc16','#f43f5e'];

WS.PuzzleGrid = function({ grid, mask, placements, showSol, solStyle, foundWords, hlColor, fontWeight, cellSize, onMouseDown, onMouseEnter, onMouseUp, selCells, tmpl, cellBorders }) {
  const R=grid.length, C=grid[0].length;
  const cs=cellSize||28;
  const solSet=useMemo(()=>{
    if(!showSol)return new Set();
    const s=new Set();
    Object.values(placements).forEach(cells=>cells.forEach(([r,c])=>s.add(`${r}-${c}`)));
    return s;
  },[showSol,placements]);
  const foundSet=useMemo(()=>{
    const s=new Set();
    foundWords.forEach(w=>{if(placements[w])placements[w].forEach(([r,c])=>s.add(`${r}-${c}`));});
    return s;
  },[foundWords,placements]);
  const selSet=useMemo(()=>new Set(selCells.map(([r,c])=>`${r}-${c}`)),[selCells]);
  const solUsesPathLines=showSol&&['highlight','dim','dashed','double_line'].includes(solStyle);
  const lines=useMemo(()=>{
    const out=[];
    const perpPair=(x1,y1,x2,y2,off)=>{
      const len=Math.hypot(x2-x1,y2-y1)||1;
      return[{x1:x1+(-(y2-y1)/len*off),y1:y1+(x2-x1)/len*off,x2:x2+(-(y2-y1)/len*off),y2:y2+(x2-x1)/len*off},{x1:x1-(-(y2-y1)/len*off),y1:y1-(x2-x1)/len*off,x2:x2-(-(y2-y1)/len*off),y2:y2-(x2-x1)/len*off}];
    };
    if(showSol&&solUsesPathLines){
      let ci=0;
      Object.entries(placements).forEach(([,cells])=>{
        if(cells.length<2)return;
        const[r1,c1]=cells[0],[r2,c2]=cells[cells.length-1];
        const x1=c1*cs+cs/2,y1=r1*cs+cs/2,x2=c2*cs+cs/2,y2=r2*cs+cs/2;
        const col=tmpl?.bw?'#999':HCOLORS[ci%HCOLORS.length];
        const base={color:col,key:`sol-${ci}`};
        if(solStyle==='dim')out.push({...base,x1,y1,x2,y2,sw:cs*0.38,op:0.12,dash:null});
        else if(solStyle==='dashed')out.push({...base,x1,y1,x2,y2,sw:cs*0.5,op:0.32,dash:`${Math.max(4,Math.round(cs*0.22))} ${Math.round(cs*0.16)}`});
        else if(solStyle==='double_line')perpPair(x1,y1,x2,y2,Math.max(1.2,cs*0.09)).forEach((seg,i)=>out.push({...base,key:`sol-${ci}-d${i}`,...seg,sw:cs*0.2,op:0.45,dash:null}));
        else out.push({...base,x1,y1,x2,y2,sw:cs*0.72,op:0.28,dash:null});
        ci++;
      });
    }
    foundWords.forEach((w,ci)=>{
      if(!placements[w]||placements[w].length<2)return;
      const cells=placements[w];
      const[r1,c1]=cells[0],[r2,c2]=cells[cells.length-1];
      out.push({x1:c1*cs+cs/2,y1:r1*cs+cs/2,x2:c2*cs+cs/2,y2:r2*cs+cs/2,color:tmpl?.bw?'#aaa':HCOLORS[ci%HCOLORS.length],key:`found-${w}`,sw:cs*0.72,op:0.38,dash:null});
    });
    return out;
  },[showSol,solStyle,solUsesPathLines,placements,foundWords,cs,tmpl]);
  const fw=fontWeight==='bold'?700:fontWeight==='light'?300:400;
  const ff=tmpl?.ff||'Inter,monospace';

  return(
    <div className="gw">
      <div className="gg" style={{gridTemplateColumns:`repeat(${C},${cs}px)`,gridTemplateRows:`repeat(${R},${cs}px)`,width:C*cs,height:R*cs}} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
        <svg className="gsvg" width={C*cs} height={R*cs}>
          {tmpl?.gl && Array.from({length:C+1}).map((_,i)=>(<line key={`v${i}`} x1={i*cs} y1={0} x2={i*cs} y2={R*cs} stroke="#e5e7eb" strokeWidth={0.5}/>))}
          {tmpl?.gl && Array.from({length:R+1}).map((_,i)=>(<line key={`h${i}`} x1={0} y1={i*cs} x2={C*cs} y2={i*cs} stroke="#e5e7eb" strokeWidth={0.5}/>))}
          {lines.map(l=>(<line key={l.key} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={l.color} strokeWidth={l.sw!=null?l.sw:cs*0.72} strokeLinecap="round" opacity={l.op!=null?l.op:0.28} strokeDasharray={l.dash||undefined}/>))}
          {selCells.length>1&&(<line x1={selCells[0][1]*cs+cs/2} y1={selCells[0][0]*cs+cs/2} x2={selCells[selCells.length-1][1]*cs+cs/2} y2={selCells[selCells.length-1][0]*cs+cs/2} stroke="#6366f1" strokeWidth={cs*0.35} strokeLinecap="round" opacity={0.6}/>)}
        </svg>
        {Array.from({length:R}, (_,r) => Array.from({length:C}, (_,c) => {
          const inMask=mask[r][c],cell=grid[r][c]||'';
          if(!inMask)return null;
          const key=`${r}-${c}`;
          const highlighted=solSet.has(key)||foundSet.has(key)||selSet.has(key);
          return(
            <div key={key} className={`gc${highlighted?' hi':''}${cellBorders?' cb':''}`} style={{width:cs,height:cs,fontWeight:fw,fontFamily:ff,background:highlighted?(hlColor?'rgba(201,162,39,0.35)':'rgba(99,102,241,0.2)'):'transparent'}}
              onMouseDown={e=>onMouseDown&&onMouseDown(r,c,e)} onMouseEnter={e=>onMouseEnter&&onMouseEnter(r,c,e)}>
              {cell}
            </div>
          );
        }))}
      </div>
    </div>
  );
};

// WordList
WS.WordList = function({ words, placements, foundWords, cols, onWordClick }) {
  const words2=Object.keys(placements||{});
  return (
    <div className="wl" style={{gridTemplateColumns:`repeat(${cols||3},1fr)`}}>
      {words2.map(w=>{
        const found=foundWords.includes(w);
        return <div key={w} className={`wl-w${found?' fo':''}`} onClick={()=>onWordClick&&onWordClick(w)}>{w}</div>;
      })}
    </div>
  );
};

// ============ ENHANCED AI PANEL (15+ Providers + Continuous Learning) ============
window.MXD_AI_PANEL = function({ cfg, setCfg }) {
  const [activeTab, setActiveTab] = useState('generate');
  const [topic, setTopic] = useState('');
  const [wordCount, setWordCount] = useState(cfg?.mxdAi?.wordCount || 20);
  const [difficulty, setDifficulty] = useState(cfg?.mxdAi?.difficulty || 'medium');
  const [generating, setGenerating] = useState(false);
  const [generatedWords, setGeneratedWords] = useState([]);
  const [error, setError] = useState(null);
  const [showKeys, setShowKeys] = useState(false);
  const [provider, setProvider] = useState(cfg?.mxdAi?.provider || 'groq');
  const [offlineMode, setOfflineMode] = useState(!navigator.onLine);
  const [history, setHistory] = useState([]);
  const [apiKeys, setApiKeys] = useState(window.MXD_API_KEYS || {});
  const [learningStats, setLearningStats] = useState(null);

  const tabs = [
    { id: 'generate', label: 'Generate', icon: 'Ã¢Å“Â¨' },
    { id: 'suggestions', label: 'Suggestions', icon: 'Ã°Å¸â€™Â¡' },
    { id: 'settings', label: 'API Keys', icon: 'Ã°Å¸â€â€˜' },
    { id: 'stats', label: 'Statistics', icon: 'Ã°Å¸â€œÅ ' },
    { id: 'learning', label: 'AI Brain', icon: 'Ã°Å¸Â§Â ' },
  ];

  useEffect(() => {
    const ai = window.MXD_AI_INTEGRATOR;
    if (ai && ai.getLearningStats) {
      const stats = ai.getLearningStats();
      setLearningStats(stats);
    }
    const handleOnline = () => setOfflineMode(false);
    const handleOffline = () => setOfflineMode(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleGenerate = async () => {
    if (!topic.trim()) { setError('Please enter a topic'); return; }
    setGenerating(true); setError(null);
    try {
      const integrator = window.MXD_AI_INTEGRATOR;
      if (integrator) {
        const result = await integrator.generateWordList(topic, wordCount, difficulty);
        if (result.success && result.words) {
          setGeneratedWords(result.words);
          setHistory(prev => [{ topic, words: result.words, source: result.source || 'ai', time: Date.now() }, ...prev].slice(0, 20));
          if (integrator.getLearningStats) setLearningStats(integrator.getLearningStats());
        } else {
          setError(result.error || 'Generation failed');
        }
      } else {
        setError('AI system not available');
      }
    } catch (e) { setError(e.message); }
    setGenerating(false);
  };

  const handleGenerateIdeas = async () => {
    if (!topic.trim()) { setError('Please enter a topic'); return; }
    setGenerating(true); setError(null);
    try {
      const integrator = window.MXD_AI_INTEGRATOR;
      if (integrator && integrator.generateBookIdeas) {
        const result = await integrator.generateBookIdeas(topic, 15);
        if (result.success && result.ideas) {
          setGeneratedWords(result.ideas);
          setHistory(prev => [{ topic, words: result.ideas, source: 'ai', type: 'ideas', time: Date.now() }, ...prev].slice(0, 20));
        } else {
          setError(result.error || 'Ideas generation failed');
        }
      } else {
        setError('AI ideas system not available');
      }
    } catch (e) { setError(e.message); }
    setGenerating(false);
  };

  const handleKeywordResearch = async () => {
    if (!topic.trim()) { setError('Please enter a topic'); return; }
    setGenerating(true); setError(null);
    try {
      const integrator = window.MXD_AI_INTEGRATOR;
      if (integrator && integrator.generateKeywords) {
        const result = await integrator.generateKeywords(topic, 30);
        if (result.success && result.keywords) {
          setGeneratedWords(result.keywords);
          setHistory(prev => [{ topic, words: result.keywords, source: 'ai', type: 'keywords', time: Date.now() }, ...prev].slice(0, 20));
        } else {
          setError(result.error || 'Keyword research failed');
        }
      } else {
        setError('AI keyword system not available');
      }
    } catch (e) { setError(e.message); }
    setGenerating(false);
  };

  const saveApiKey = (provider, key) => {
    const keys = { ...apiKeys };
    keys[provider] = key;
    setApiKeys(keys);
    localStorage.setItem('mxd_ai_keys', JSON.stringify(keys));
    window.MXD_AI_INTEGRATOR?.setKey?.(provider, key);
  };

  const applyWords = () => {
    if (setCfg && generatedWords.length > 0) {
      const wordString = generatedWords.join('\n');
      if (window.parseWords) {
        const parsed = window.parseWords(wordString);
        setCfg(p => ({ ...p, customWords: parsed }));
      }
    }
  };

  const ai = window.MXD_AI_INTEGRATOR;
  const allProviders = ai?.getAllProviders?.() || [];
  const activeProvider = ai?.getActiveProvider?.();
  const aiStats = ai?.getStats?.() || {};
  const suggested = ai?.getSuggestionsForTopic?.(topic) || null;

  return (
    <div className="mxd-ai-panel">
      <div className="mxd-ai-header">
        <h2>Ã°Å¸Â¤â€“ AI Brain</h2>
        <div className="mxd-ai-header-status">
          <span className={`mxd-status-dot ${offlineMode ? 'offline' : 'online'}`}></span>
          <span>{offlineMode ? 'Offline' : 'Online'}</span>
          {learningStats?.topicsLearned > 0 && <span className="mxd-brain-badge">Ã°Å¸Â§Â  {learningStats.topicsLearned}</span>}
        </div>
      </div>
      <div className="mxd-ai-tabs">{tabs.map(t => (<button key={t.id} className={`tab ${activeTab === t.id ? 'on' : ''}`} onClick={() => setActiveTab(t.id)}><span>{t.icon}</span>{t.label}</button>))}</div>
      <div className="mxd-ai-body">
        {activeTab === 'generate' && (
          <div className="mxd-ai-section">
            <label className="mxd-ai-label">Topic / Theme<input type="text" className="input-modern" placeholder="e.g. dinosaurs, space, ocean, ancient egypt..." value={topic} onChange={e => setTopic(e.target.value)}/></label>
            <div className="mxd-ai-row-grid">
              <div className="mxd-ai-field"><label>Word Count</label><input type="number" min="5" max="100" value={wordCount} onChange={e => setWordCount(Number(e.target.value))} className="input-modern"/></div>
              <div className="mxd-ai-field"><label>Difficulty</label><select className="select-modern" value={difficulty} onChange={e => setDifficulty(e.target.value)}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div>
            </div>
            <div className="mxd-ai-actions-row">
              <button className="btn btn-modern btn-modern-primary" onClick={handleGenerate} disabled={generating}>{generating ? 'Ã¢ÂÂ³ Generating...' : 'Ã¢Å“Â¨ Generate Words'}</button>
              <button className="btn btn-modern btn-modern-secondary" onClick={handleGenerateIdeas} disabled={generating || !topic.trim()} title="Generate book title ideas">Ã°Å¸â€œÅ¡ Ideas</button>
              <button className="btn btn-modern btn-modern-secondary" onClick={handleKeywordResearch} disabled={generating || !topic.trim()} title="Generate keywords">Ã°Å¸â€â€˜ Keywords</button>
            </div>
            {suggested && <div className="mxd-ai-suggestion"><span className="mxd-ai-badge-learned">Ã°Å¸Â§Â  Learned: {Math.round(suggested.confidence * 100)}% match</span></div>}
            {error && <div className="mxd-ai-error">Ã¢Å¡Â Ã¯Â¸Â {error}</div>}
            {generatedWords.length > 0 && (
              <div className="mxd-ai-result">
                <div className="mxd-ai-words-container">
                  <div className="mxd-ai-words">{generatedWords.map((w, i) => <span key={i} className="mxd-ai-word-chip">{w}</span>)}</div>
                </div>
                <div className="mxd-ai-result-actions">
                  <button className="btn btn-pri" onClick={applyWords}>Ã¢Å“â€¦ Use These Words</button>
                  <button className="btn btn-sec" onClick={() => { navigator.clipboard?.writeText(generatedWords.join(', ')); }}>Ã°Å¸â€œâ€¹ Copy</button>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === 'suggestions' && (
          <div className="mxd-ai-section">
            <h4>Ã°Å¸â€™Â¡ Smart Suggestions</h4>
            <p className="mxd-hint">Enter a topic to see AI-learned suggestions based on your history.</p>
            <input type="text" className="input-modern" placeholder="Type to see suggestions..." value={topic} onChange={e => setTopic(e.target.value)}/>
            {suggested ? (
              <div className="mxd-ai-suggestion-detail">
                <div className="mxd-suggestion-source">Source: {suggested.source} ({Math.round(suggested.confidence * 100)}% confidence)</div>
                <div className="mxd-ai-words">{suggested.suggestions.slice(0, 15).map((w, i) => <span key={i} className="mxd-ai-word-chip">{w}</span>)}</div>
              </div>
            ) : (
              <div className="mxd-ai-empty">Start typing to see AI suggestions based on your learning history</div>
            )}
            {history.length > 0 && (
              <div className="mxd-ai-history">
                <h4>Recent Generations</h4>
                {history.slice(0, 10).map((h, i) => (
                  <div key={i} className="mxd-history-item" onClick={() => setTopic(h.topic)}>
                    <span className="mxd-history-topic">{h.topic}</span>
                    <span className="mxd-history-meta">{h.words.length} words Ã‚Â· {h.source === 'learned' ? 'Ã°Å¸Â§Â ' : 'Ã°Å¸Â¤â€“'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="mxd-ai-section">
            <div className="mxd-ai-provider-info">
              <h4>Ã°Å¸â€â€˜ API Configuration</h4>
              <p className="mxd-hint">All providers are FREE. The AI Brain will automatically select the best available provider. <a href="https://console.groq.com/keys" target="_blank">Get Groq Key</a></p>
            </div>
            <div className="mxd-providers-grid">
              {allProviders.slice(0, 12).map(p => (
                <div key={p.id} className={`mxd-provider-card ${p.hasKey ? 'active' : ''}`}>
                  <div className="mxd-provider-header">
                    <span className="mxd-provider-name">{p.name}</span>
                    <span className={`mxd-provider-status ${p.hasKey ? 'has-key' : ''}`}>{p.hasKey ? 'Ã¢Å“â€œ' : 'Ã¢â€”â€¹'}</span>
                  </div>
                  <div className="mxd-provider-meta">
                    <span>Latency: {p.latency}</span>
                    <span>Quality: {p.quality}</span>
                  </div>
                  <input type="password" className="input-modern input-sm" placeholder={p.keyPlaceholder} value={apiKeys[p.id] || ''} onChange={e => saveApiKey(p.id, e.target.value)}/>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'stats' && (
          <div className="mxd-ai-section">
            <h4>Ã°Å¸â€œÅ  Performance Statistics</h4>
            <div className="mxd-stat-grid-4">
              <div className="mxd-stat-card"><span className="mxd-stat-value">{aiStats.requests || 0}</span><span className="mxd-stat-label">Total Requests</span></div>
              <div className="mxd-stat-card"><span className="mxd-stat-value">{aiStats.successRate || '0%'}</span><span className="mxd-stat-label">Success Rate</span></div>
              <div className="mxd-stat-card"><span className="mxd-stat-value">{aiStats.availableProviders || 0}/{aiStats.totalProviders || 16}</span><span className="mxd-stat-label">Providers</span></div>
              <div className="mxd-stat-card"><span className="mxd-stat-value">{aiStats.cacheSize || 0}</span><span className="mxd-stat-label">Cached</span></div>
            </div>
            {activeProvider && <div className="mxd-active-provider">Ã°Å¸Â¤â€“ Active: {activeProvider.name}</div>}
            <div className="mxd-provider-usage">
              <h5>Provider Usage</h5>
              {Object.entries(aiStats.providerUsage || {}).map(([p, count]) => (
                <div key={p} className="mxd-provider-usage-row">
                  <span>{p}</span><span className="mxd-usage-bar"><span style={{width: Math.min(100, (count / (aiStats.requests || 1)) * 100) + '%'}}></span></span><span>{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'learning' && (
          <div className="mxd-ai-section">
            <h4>Ã°Å¸Â§Â  AI Brain - Continuous Learning</h4>
            <p className="mxd-hint">The AI Brain learns from your searches to improve future suggestions. {offlineMode ? 'Learning paused (offline)' : 'Learning active'}</p>
            <div className="mxd-brain-stats">
              <div className="mxd-brain-stat"><span>Ã°Å¸Â§Â  Topics Learned</span><strong>{learningStats?.topicsLearned || 0}</strong></div>
              <div className="mxd-brain-stat"><span>Ã°Å¸â€œÂ Words Generated</span><strong>{learningStats?.totalWords || 0}</strong></div>
              <div className="mxd-brain-stat"><span>Ã°Å¸â€â€ž Sessions</span><strong>{learningStats?.sessionCount || 0}</strong></div>
            </div>
            {learningStats?.topProviders?.length > 0 && (
              <div className="mxd-top-providers">
                <h5>Top Performing Providers</h5>
                {learningStats.topProviders.map((p, i) => (
                  <div key={i} className="mxd-top-provider">
                    <span className="mxd-provider-rank">#{i + 1}</span>
                    <span className="mxd-provider-info">{p.provider}</span>
                    <span className="mxd-provider-success">{p.success}%</span>
                    <span className="mxd-provider-latency">{p.latency}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mxd-learning-info">
              <h5>How Learning Works</h5>
              <ul>
                <li>Ã¢Å“Â¨ Every successful generation improves the AI</li>
                <li>Ã°Å¸Â§Â  Topics you search become smarter suggestions</li>
                <li>Ã°Å¸â€œÅ  Provider performance is tracked automatically</li>
                <li>Ã°Å¸â€â€ž Learning happens every minute when online</li>
                <li>Ã°Å¸â€™Â¾ All data is stored locally in your browser</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============ KDP PANEL COMPONENT ============
window.MXD_KDP_PANEL = function({ auth, onClose }) {
  const [activeTab, setActiveTab] = useState('niche');
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('us');
  const [notes, setNotes] = useState('');

  const tabs = [
    { id: 'niche', label: 'Niche Finder', icon: 'Ã°Å¸â€Å½' },
    { id: 'keywords', label: 'Keywords', icon: 'Ã°Å¸â€â€˜' },
    { id: 'ideas', label: 'Book Ideas', icon: 'Ã°Å¸â€™Â¡' },
    { id: 'profit', label: 'Profit Calc', icon: 'Ã°Å¸â€™Â°' }
  ];

  const amazonRegions = { us: 'amazon.com', uk: 'amazon.co.uk', de: 'amazon.de', fr: 'amazon.fr', es: 'amazon.es', it: 'amazon.it', ca: 'amazon.ca', au: 'amazon.com.au' };

  const openAmazon = () => window.open(`https://www.${amazonRegions[region]}/s?k=${encodeURIComponent(query)}`, '_blank');

  return (
    <div className="mxd-kdp-panel">
      <div className="mxd-kdp-header"><h2>KDP Studio</h2><button onClick={onClose}>Ã¢Å“â€¢</button></div>
      <div className="mxd-kdp-tabs">{tabs.map(tab => (<button key={tab.id} className={`mxd-kdp-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}><span>{tab.icon}</span>{tab.label}</button>))}</div>
      <div className="mxd-kdp-content">
        <div className="mxd-kdp-section">
          <textarea className="mxd-kdp-input" placeholder="Enter keyword phrase..." value={query} onChange={e => setQuery(e.target.value)}/>
          <select className="mxd-kdp-select" value={region} onChange={e => setRegion(e.target.value)}>{Object.entries(amazonRegions).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}</select>
          <div className="mxd-kdp-actions">
            <button className="btn btn-pri" onClick={openAmazon}>Search Amazon</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============ QUALITY PANEL COMPONENT ============
window.MXD_QUALITY_PANEL = function({ cfg, setCfg }) {
  const [qualityLevel, setQualityLevel] = useState(cfg?.quality || 'high');
  const [optimization, setOptimization] = useState(cfg?.optimization || 'balanced');

  const levels = ['draft', 'standard', 'balanced', 'high', 'maximum'];
  const opts = ['speed', 'balanced', 'quality', 'ultra'];

  return (
    <div className="mxd-quality-panel">
      <h3>Quality Settings</h3>
      <WS.Select label="Quality Level" value={qualityLevel} options={levels.map(l => ({ v: l, l }))} onChange={setQualityLevel}/>
      <WS.Select label="Optimization" value={optimization} options={opts.map(o => ({ v: o, l: o.charAt(0).toUpperCase() + o.slice(1) }))} onChange={setOptimization}/>
      <button className="btn btn-sec" onClick={() => setCfg && setCfg({ ...cfg, quality: qualityLevel, optimization })}>Apply</button>
    </div>
  );
};

// ============ OFFLINE TOOLS COMPONENT ============
window.MXD_OFFLINE_TOOLS = function() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cachedSize, setCachedSize] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  const clearCache = () => {
    if ('caches' in window) caches.keys().then(names => names.forEach(n => caches.delete(n)));
    localStorage.removeItem('mxd_cache');
    setCachedSize(0);
  };

  return (
    <div className="mxd-offline-tools">
      <h3>Offline Tools</h3>
      <div className="mxd-status-row"><span>Status</span><span className={isOnline?'green':'red'}>{isOnline ? 'Online' : 'Offline'}</span></div>
      <button className="btn btn-sec" onClick={clearCache}>Clear Cache</button>
    </div>
  );
};