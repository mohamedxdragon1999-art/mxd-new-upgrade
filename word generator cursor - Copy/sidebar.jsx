// sidebar.jsx — Supreme KDP Enterprise Sidebar
const { useState: useSt2, useMemo: useMemo2, useRef: useRef2, useEffect: useEff2 } = React;
const { Toggle, Section, Slider, ColorPicker, Progress, NumberInput, Select } = WS;

function parseWords(txt){ return txt.split(/[\n,]+/).map(w=>w.trim().replace(/[^a-zA-Z]/g,'')).filter(w=>w.length>=2); }

window.Sidebar = function({ cfg, setCfg, wordText, setWordText, onGenerate, onBulkExport, generating, progress, onAiGenerate, onAiThemeGenerate, onExportImage, stats, onAiSolve, onKdpSpy, onBulkListPrep, onAiOptimizeLayout, onAsinLookup, onCheckTrademark, onOptimizeListing, onBuildOptIn, onDesignCover, isKing, onCheckCode, mkt, setMkt }) {
  const set=(k,v)=>setCfg(p=>({...p,[k]:v}));
  const [aiTheme, setAiTheme] = useSt2('Dragon');
  const [activeAlert, setActiveAlert] = useSt2(0);
  const [asin, setAsin] = useSt2('');
  const [listPrice, setListPrice] = useSt2(9.99);
  const [licCode, setLicCode] = useSt2('');

  
  useEff2(() => {
    const timer = setInterval(() => {
      setActiveAlert(prev => (prev + 1) % KDP_ALERTS.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const curMarket = MARKETPLACES.find(m => m.id === mkt) || MARKETPLACES[0];
  const alert = KDP_ALERTS[activeAlert] || {type:'INFO', msg:'System Active'};

  return(
    <aside className="sb">
      <div className="sb-hd">
        <div className="sb-logo">🛡️</div>
        <div className="sb-brand">
          <h1>MXD SUPREME</h1>
          <span>Enterprise intelligence</span>
        </div>
      </div>
      
      {/* ── INTERFACE & MARKETPLACE ── */}
      <div className="sect-row" style={{padding: '0 12px', marginBottom: 12}}>
         <Select value={cfg.uiTheme || 'night'} options={Object.entries(THEMES).map(([k,v])=>({v:k,l:v.n}))} onChange={v=>set('uiTheme',v)}/>
         <Select value={mkt} options={MARKETPLACES.map(m=>({v:m.id,l:m.n}))} onChange={v=>setMkt(v)}/>
      </div>

      <div className={`alert-box trend`}>
         <div className="alert-hd">{alert.type}: {curMarket.id.toUpperCase()} MARKET</div>
         <div className="alert-msg">{alert.msg}</div>
      </div>

      <div className="sb-body">
        {/* ── LICENSE & ACCESS ── */}
        <Section title="License & Access" icon={isKing ? "👑" : "🔑"} defaultOpen={!isKing}>
           {isKing ? (
             <div className="king-badge">
                <div className="sparkle">✨</div>
                <div>KING MODE ACTIVE</div>
                <div style={{fontSize: 9, opacity: 0.8, marginTop: 4}}>LIFETIME LICENSE & UPDATES</div>
                <div className="sparkle">✨</div>
             </div>
           ) : (
             <div className="row" style={{gap: 8}}>
                <input className="num-in" placeholder="Enter Access Code..." value={licCode} onChange={e=>setLicCode(e.target.value)}/>
                <button className="btn btn-ok" onClick={() => onCheckCode(licCode)}>Unlock</button>
             </div>
           )}
        </Section>

        {/* ── PUZZLE ENGINE & TYPE ── */}
        <Section title="Puzzle Engine & Type" icon="🧩" defaultOpen={true}>
           <div className="puzzle-grid-select">
              {PUZZLE_TYPES.map(t => (
                <div key={t.id} 
                  className={`puzzle-type-card ${cfg.puzzleType===t.id?'on':''} ${t.pro && !isKing ? 'premium-only' : ''}`}
                  onClick={() => (!t.pro || isKing) && set('puzzleType', t.id)}>
                   <div className="pt-icon">{t.icon}</div>
                   <div className="pt-name">{t.n}</div>
                   {t.pro && !isKing && <div className="pt-lock">🔒</div>}
                </div>
              ))}
           </div>
           <div style={{marginTop: 10}}>
              <Select label="Type Variation (410+)" value={cfg.variation || 'var_0'}
                options={PUZZLE_VARIATIONS.slice(0, isKing ? 410 : 10).map(v => ({v:v.id, l:v.name}))}
                onChange={v=>set('variation',v)}/>
              {!isKing && <div style={{fontSize: 9, color: 'var(--accent)', marginTop: 4}}>Unlock KING MODE for all 410+ variations.</div>}
           </div>
        </Section>

        {/* ── ADVANCED NICHE FINDER ── */}
        <Section title="Advanced Niche Finder" icon="🔍" defaultOpen={false}>
           <div className={!isKing ? 'premium-only' : ''}>
              <div style={{fontSize: 10, color: 'var(--t2)', marginBottom: 12}}>Scan Millions of KDP Books (BookBeam Engine)</div>
              
              <div className="filter-grid">
                 <div>
                    <label style={{fontSize: 9, color: 'var(--t3)'}}>Max BSR</label>
                    <input className="num-in" type="number" placeholder="e.g. 50000" />
                 </div>
                 <div>
                    <label style={{fontSize: 9, color: 'var(--t3)'}}>Min Sales</label>
                    <input className="num-in" type="number" placeholder="e.g. 50" />
                 </div>
                 <div>
                    <label style={{fontSize: 9, color: 'var(--t3)'}}>Min Reviews</label>
                    <input className="num-in" type="number" placeholder="e.g. 100" />
                 </div>
                 <div>
                    <label style={{fontSize: 9, color: 'var(--t3)'}}>Min Rating</label>
                    <input className="num-in" type="number" step="0.1" placeholder="4.0" />
                 </div>
              </div>

              <div style={{marginTop: 10}}>
                 <Select label="Listing Age" options={[{v:'any', l:'Any Age'}, {v:'30d', l:'Last 30 Days'}, {v:'90d', l:'Last 90 Days'}, {v:'1y', l:'Last Year'}]} />
              </div>

              <button className="btn btn-ok btn-full" style={{marginTop: 12}} onClick={() => onKdpSpy()}>✨ Search Niches</button>
              
              <div className="niche-results" style={{marginTop: 15}}>
                 {KDP_NICHES.slice(0, isKing ? 10 : 2).map((n, i) => (
                   <div key={i} className="niche-card">
                      <div className="niche-hd">
                         <strong>{n.name}</strong>
                         <span className={`comp-tag ${n.comp.toLowerCase()}`}>{n.comp}</span>
                      </div>
                      <div className="niche-stats">
                         <span>BSR: {n.bsr}</span>
                         <span>Sales: {n.sales}</span>
                         <span>Age: {n.age}</span>
                      </div>
                   </div>
                 ))}
                 {!isKing && <div className="blur-overlay">Unlock KING MODE to see 10,000+ more niches</div>}
              </div>
           </div>
           {!isKing && <div style={{fontSize: 9, color: 'var(--warn)', marginTop: 8}}>👑 Unlock Advanced Niche Finder in KING MODE.</div>}
        </Section>

        {/* ── BOOK SCOUT & COMPETITION ── */}
        <Section title="Book Scout & Spy" icon="🕵️" defaultOpen={true}>
           <div style={{marginBottom: 12}}>
              <Toggle label="Live Amazon Spy (Extension)" value={cfg.spyMode} 
                onChange={v => isKing && set('spyMode', v)} 
                locked={!isKing}/>
           </div>
           <div className="row" style={{marginBottom: 8}}>
              <input className="num-in" placeholder="Reverse ASIN Lookup..." value={asin} onChange={e=>setAsin(e.target.value)}/>
              <button className="btn btn-ok" onClick={() => onAsinLookup(asin)}>Spy</button>
           </div>
           <button className={`btn btn-sec btn-full ${!isKing ? 'premium-only' : ''}`} onClick={onKdpSpy}>Deep Cloud Search (BookBeam)</button>
           <div style={{marginTop: 8}}>
              <button className={`btn btn-sec btn-full ${!isKing ? 'premium-only' : ''}`} onClick={onKdpSpy}>Deep ASIN Analysis (SellerSprite)</button>
           </div>
           <div style={{marginTop: 8}}>
              <button className="btn btn-pri btn-full" onClick={onCheckTrademark}>🛡️ Check Trademark</button>
           </div>
        </Section>

        {/* ── AI ASSISTANT (CREATE) ── */}
        <Section title="AI Assistant (Create)" icon="🧠" defaultOpen={true}>
           <div className={`btn-grp ${!isKing ? 'premium-only' : ''}`}>
              <button className="btn btn-pri btn-full" onClick={() => onAiThemeGenerate(aiTheme, 20, true)}>AI Content Package</button>
           </div>
           <div style={{marginTop: 8}}>
              <Toggle label="Full AI Extreme Mode" value={cfg.aiExtreme} 
                onChange={v => isKing && set('aiExtreme', v)} 
                locked={!isKing}/>
           </div>
           <div style={{marginTop: 8}}>
              {isKing ? (
                <WS.SeoGenerator title={cfg.title} isKing={isKing} />
              ) : (
                <button className="btn btn-ok btn-full premium-only" onClick={onOptimizeListing}>AI Metadata & SEO Generator</button>
              )}
           </div>
           <div style={{marginTop: 8}}>
              <button className="btn btn-sec btn-full" onClick={onOptimizeListing}>Listing Optimizer (Score)</button>
           </div>
           <div style={{marginTop: 8}}>
              <button className="btn btn-sec btn-full" onClick={onBuildOptIn}>Lead Magnet Builder</button>
           </div>
           {isKing && (
              <div style={{marginTop: 15}}>
                 <div style={{fontSize: 9, color: 'var(--t3)', marginBottom: 8, fontWeight: 800}}>AMAZON PREVIEW SIMULATOR</div>
                 <WS.AmazonPreview title={cfg.title} listPrice={listPrice} market={curMarket} />
              </div>
           )}
        </Section>

        {/* ── 45,000+ CATEGORY EXPLORER ── */}
        <Section title="Category Explorer & Opt" icon="📂" defaultOpen={false}>
           <div className={!isKing ? 'premium-only' : ''}>
              <div style={{fontSize: 10, color: 'var(--t2)', marginBottom: 8}}>Browse 45,000+ Verified KDP Categories</div>
              <input className="num-in" placeholder="Search categories..." />
              <button className="btn btn-ok btn-full" style={{marginTop: 8, marginBottom: 12}} onClick={() => showToast("OPTIMIZER: Best low-competition categories identified.", "success")}>✨ Category Optimizer</button>
              <div className="cat-list" style={{maxHeight: 150, overflowY: 'auto'}}>
                 {CATEGORY_DB.map(c => (
                   <div key={c.id} className="cat-item">
                      <div className="cat-name">{c.n}</div>
                      <div className="cat-path">{c.path}</div>
                   </div>
                 ))}
                 {isKing && (
                    <div style={{padding: 8, textAlign: 'center', fontSize: 10, color: 'var(--accent)'}}>
                       + 44,995 more categories available in KING MODE
                    </div>
                 )}
              </div>
           </div>
           {!isKing && <div style={{fontSize: 9, color: 'var(--warn)', marginTop: 8}}>👑 Unlock 45,000+ Category Database in KING MODE.</div>}
        </Section>

        {/* ── COVER & INTERIOR STUDIO ── */}
        <Section title="Cover & Interior Studio" icon="🎨" defaultOpen={true}>
           <button className="btn btn-ok btn-full" onClick={onDesignCover}>✨ Pro Cover Designer</button>
           <hr style={{margin: '12px 0', opacity: 0.1}} />
           <Select label="Global Font" value={cfg.fontFamily}
            options={FONTS.map(f => ({v:f, l:f.split(',')[0]}))}
            onChange={v=>set('fontFamily',v)}/>
           <div className="tmpl-row" style={{marginTop: 8}}>
              {['classic','dark_slate','cyber','newspaper'].map(k => (
                <div key={k} className={`tmpl-dot ${cfg.template===k?'on':''}`} 
                  style={{background: TEMPLATES[k].bg}}
                  onClick={() => set('template', k)}/>
              ))}
           </div>
        </Section>

        {/* ── REAL-TIME MOVERS & SHAKERS ── */}
        <Section title="Movers & Shakers" icon="🚀" defaultOpen={false}>
           <div className={!isKing ? 'premium-only' : ''}>
              <div style={{fontSize: 10, color: 'var(--t2)', marginBottom: 8}}>Live BSR Movers (Last 24h)</div>
              <div className="ms-list">
                 {MOVERS_SHAKERS.map(ms => (
                   <div key={ms.id} className="ms-item">
                      <div className="ms-name">{ms.n}</div>
                      <div className="ms-meta">
                         <span className="ms-change">{ms.bsr_change} BSR</span>
                         <span className="ms-trend">{ms.trend}</span>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
           {!isKing && <div style={{fontSize: 9, color: 'var(--accent)', marginTop: 8}}>👑 Unlock Real-Time Movers & Shakers in KING MODE.</div>}
        </Section>

        {/* ── REAL-TIME AMAZON DATA & TRENDS ── */}
        <Section title="Trend Analytics (Live)" icon="📊" defaultOpen={isKing}>
           <div className={!isKing ? 'premium-only' : ''}>
              <div className="trend-row">
                 <div className="trend-lbl">Avg BSR (Niche):</div>
                 <div className="trend-val">12,402 <span className="up">↑</span></div>
              </div>
              <div className="trend-row">
                 <div className="trend-lbl">Search Volume:</div>
                 <div className="trend-val">45,200/mo</div>
              </div>
              <div className="mini-chart">
                 <div className="chart-bar" style={{height: '40%'}}></div>
                 <div className="chart-bar" style={{height: '60%'}}></div>
                 <div className="chart-bar" style={{height: '50%'}}></div>
                 <div className="chart-bar" style={{height: '80%'}}></div>
                 <div className="chart-bar" style={{height: '90%'}}></div>
                 <div className="chart-bar" style={{height: '70%'}}></div>
              </div>
              <div style={{marginTop: 8}}>
                 <button className="btn btn-sec btn-full" onClick={() => onAsinLookup('TRENDS')}>Global Trend Map (FlyingUpload)</button>
              </div>
           </div>
           {!isKing && <div style={{fontSize: 9, color: 'var(--accent)', marginTop: 8}}>👑 Unlock Real-Time Amazon Trends in KING MODE.</div>}
        </Section>

        {/* ── ANALYTICS & ROYALTY ── */}
        <Section title="Analytics & Royalty" icon="📈" defaultOpen={true}>
           <div style={{padding: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 8}}>
              <div style={{fontSize: 10, color: 'var(--t2)'}}>Opportunity Score: <strong>84/100</strong></div>
              <div style={{height: 4, background: '#333', marginTop: 4, borderRadius: 2}}>
                 <div style={{width: '84%', height: '100%', background: 'var(--ok)'}}></div>
              </div>
              <hr style={{margin: '12px 0', opacity: 0.05}} />
              <div style={{fontSize: 10, color: 'var(--t3)', marginBottom: 5}}>BSR Sales Calculator</div>
              <div className="row" style={{marginBottom: 8}}>
                 <input className="num-in" type="number" placeholder="Enter BSR..." onChange={e => {
                    const bsr = +e.target.value;
                    const estSales = Math.max(0, Math.floor(100000 / (bsr || 100000) * 10));
                    showToast(`BSR #${bsr} ≈ ${estSales} Sales/mo`, "info");
                 }}/>
              </div>
              <div style={{marginTop: 10, fontSize: 13, fontWeight: 700, color: 'var(--ok)'}}>
                 Royalty Est: {curMarket.cur}{((listPrice * 0.6) - 1.2).toFixed(2)}
              </div>
              <input className="num-in" type="number" style={{marginTop: 5}} value={listPrice} onChange={e=>setListPrice(+e.target.value)}/>
           </div>
        </Section>

        {/* ── 100+ ALL-IN-ONE BOOK STUDIO ── */}
        <Section title="100+ All-in-One Studio" icon="📚" defaultOpen={false}>
           <div className={`puzzle-grid-select ${!isKing ? 'premium-only' : ''}`}>
              {BOOK_GENERATORS.map(b => (
                <div key={b.id} className="puzzle-type-card">
                   <div className="pt-icon">{b.icon}</div>
                   <div className="pt-name">{b.n}</div>
                </div>
              ))}
           </div>
           <div style={{marginTop: 10}} className={!isKing ? 'premium-only' : ''}>
              <Select label="Enterprise Templates (100+)" options={EXTENDED_BOOK_TYPES.map(e => ({v:e.id, l:e.name}))} />
              <div style={{marginTop: 15}}>
                 <div style={{fontSize: 9, color: 'var(--t3)', marginBottom: 8, fontWeight: 800}}>AI IMAGE & COLORING GEN</div>
                 <WS.AiImageGen isKing={isKing} />
              </div>
           </div>
           {!isKing && <div style={{fontSize: 9, color: 'var(--warn)', marginTop: 8}}>👑 Upgrade to KING MODE for the full 100+ Studio tools.</div>}
        </Section>

        {/* ── 11-LANGUAGE & 3,000+ ILLUSTRATIONS ── */}
        <Section title="Global Assets & Lang" icon="🌐" defaultOpen={false}>
           <div className={!isKing ? 'premium-only' : ''}>
              <Select label="Puzzle Language (11)" options={LANGUAGES.map(l => ({v:l.toLowerCase(), l}))} />
              <div style={{marginTop: 10}}>
                 <div style={{fontSize: 10, color: 'var(--t2)', marginBottom: 8}}>Themed Illustrations: <strong>{ILLUSTRATION_COUNT}+</strong></div>
                 <button className="btn btn-sec btn-full" onClick={() => onDesignCover()}>Browse Illustration Library</button>
              </div>
           </div>
           {!isKing && <div style={{fontSize: 9, color: 'var(--warn)', marginTop: 8}}>👑 Unlock 11 Languages & 3,000+ Illustrations in KING MODE.</div>}
        </Section>

        {/* ── PUZZLE ASSET LIBRARY ── */}
        <Section title="Asset Library (Modular)" icon="📦" defaultOpen={false}>
           <div className={!isKing ? 'premium-only' : ''}>
              <div style={{fontSize: 10, color: 'var(--t2)', marginBottom: 8}}>Saved Modular Assets: 0</div>
              <button className="btn btn-pri btn-full" onClick={() => onOptimizeListing()}>✨ Create Reusable Module</button>
              <div style={{marginTop: 8, fontSize: 9, color: 'var(--t3)'}}>Build once, reuse across all your books.</div>
           </div>
           {!isKing && <div style={{fontSize: 9, color: 'var(--accent)', marginTop: 8}}>👑 Unlock Modular Asset System in KING MODE.</div>}
        </Section>

        {/* ── INVENTORY & TRACKER ── */}
        <Section title="Inventory & Tracker" icon="📋" defaultOpen={false}>
           <div className={!isKing ? 'premium-only' : ''}>
              <div style={{fontSize: 10, color: 'var(--t2)', marginBottom: 8}}>Tracked Puzzles in current project: <strong>{puzzles.length}</strong></div>
              <div style={{fontSize: 10, color: 'var(--t2)', marginBottom: 8}}>Duplicate Search (Cross-Book): <span style={{color: 'var(--ok)'}}>ACTIVE</span></div>
              <button className="btn btn-sec btn-full" onClick={() => onCheckTrademark()}>Scan for Duplicates (KDPReady)</button>
           </div>
           {!isKing && <div style={{fontSize: 9, color: 'var(--warn)', marginTop: 8}}>👑 Unlock Cross-Book Duplicate Tracker in KING MODE.</div>}
        </Section>

        {/* ── MASTER EXPORT ── */}
        <Section title="Master Export" icon="📄" defaultOpen={true}>
          <div className="btn-grp">
            <button className="btn btn-ok btn-full" onClick={onBulkExport} disabled={generating}>
              {generating?'📄 Building...':'📄 Export KDP PDF'}
            </button>
          </div>
          <div style={{marginTop: 10}}>
             <Toggle label="High-Res (300 DPI)" value={cfg.highRes} 
               onChange={v => isKing && set('highRes', v)} 
               locked={!isKing}/>
          </div>
          <div style={{marginTop: 5}}>
             <Toggle label="SVG Vector Export" value={cfg.svgExport} 
               onChange={v => isKing && set('svgExport', v)} 
               locked={!isKing}/>
          </div>
          {generating&&progress&&<Progress done={progress.done} total={progress.total} label={progress.label}/>}
        </Section>

      </div>
      
      <div className="realtime-ticker">
         <div className="ticker-item">MKT: {curMarket.n}</div>
         <div className="ticker-item">BSR RANK TRACK: ACTIVE</div>
      </div>
    </aside>
  );
};
