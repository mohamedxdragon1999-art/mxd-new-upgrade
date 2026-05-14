// sidebar.jsx — full sidebar with all settings panels
const [useSt2, useSBMemo] = window.MXDReactHooks;
const [useMemo2] = [window.MXDReactHooks.useMemo];
const { Toggle, Section, Slider, ColorPicker, Progress, NumberInput, Select, TextInput } = WS;

const MXD_ACCESS = {
  free: {
    features: ['wordlist_basic', 'templates_basic', 'grid_standard', 'pdf_5'],
    maxPdfPages: 5,
    maxGridSize: 20,
    maxTemplates: 5
  },
  pro: {
    features: ['wordlist_basic', 'templates_basic', 'grid_standard', 'pdf_5'],
    maxPdfPages: 5,
    maxGridSize: 20,
    maxTemplates: 5
  },
  extrem: {
    features: ['wordlist_basic', 'wordlist_advanced', 'chat', 'cover', 'templates_basic', 'templates_extended', 'grid_standard', 'grid_medium', 'pdf_5', 'pdf_50', 'analytics_basic'],
    maxPdfPages: 50,
    maxGridSize: 30,
    maxTemplates: 12
  },
  ultimate: {
    features: ['*'], // All features
    maxPdfPages: 300,
    maxGridSize: 40,
    maxTemplates: 999
  },
  admin: {
    features: ['*'],
    maxPdfPages: 9999,
    maxGridSize: 50,
    maxTemplates: 999
  }
};

function hasAccess(plan, feature) {
  const access = MXD_ACCESS[plan] || MXD_ACCESS.free;
  if (access.features.includes('*')) return true;
  return access.features.includes(feature);
}

function getAccessLevel(plan) {
  return MXD_ACCESS[plan] || MXD_ACCESS.free;
}

function parseWords(txt){ return txt.split(/[\n,]+/).map(w=>w.trim().replace(/[^a-zA-Z]/g,'')).filter(w=>w.length>=2); }
function parseBulk(txt){ return txt.split(/\n[ \t]*\n+/).map(b=>parseWords(b)).filter(g=>g.length>0); }
function tokenizeWordInput(txt){
  return txt.split(/[\n,]+/).map(s=>s.trim()).filter(Boolean);
}
/** Lightweight stats for sidebar feedback (placement still uses parseWords / parseBulk). */
function getWordInputStats(txt, bulkMode){
  const tokens=tokenizeWordInput(txt);
  const valid=parseWords(txt);
  const uniq=new Set(valid.map(w=>w.toLowerCase()));
  const duplicateExtra=Math.max(0,valid.length-uniq.size);
  const droppedShort=tokens.filter(t=>t.replace(/[^a-zA-Z]/g,'').length<2).length;
  const hadFormatting=tokens.filter(t=>{
    const letters=t.replace(/[^a-zA-Z]/g,'');
    return letters.length>=2&&t!==letters;
  }).length;
  let bulk=null;
  if(bulkMode){
    const groups=parseBulk(txt);
    const lens=groups.map(g=>g.length);
    bulk={
      groups:groups.length,
      minW:lens.length?Math.min(...lens):0,
      maxW:lens.length?Math.max(...lens):0,
      total:lens.reduce((a,n)=>a+n,0),
    };
  }
  return{tokens:tokens.length,validN:valid.length,unique:uniq.size,duplicateExtra,droppedShort,hadFormatting,bulk};
}
window.parseWords=parseWords;
window.parseBulk=parseBulk;

function sortShapeGroupEntries(entries){
  const order=window.SHAPE_GRP_ORDER||[];
  return entries.slice().sort((a,b)=>{
    const ia=order.indexOf(a[0]), ib=order.indexOf(b[0]);
    const ra=ia<0?999:ia, rb=ib<0?999:ib;
    if(ra!==rb)return ra-rb;
    return String(a[0]).localeCompare(String(b[0]));
  });
}

/** One collapsible group inside Puzzle shapes (quick picks when collapsed). */
function ShapeGrpBlock({ name, shapes, cfgShape, setShape, disabled }){
  const [open,setOpen]=useSt2(false);
  const quick=shapes.slice(0,3);
  return(
    <div className="sb-shape-grp">
      <div className="sb-shape-grp-hd" role="button" tabIndex={0} aria-expanded={open}
        onClick={()=>setOpen(!open)}
        onKeyDown={e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); setOpen(!open);} }}>
        <span className="sb-shape-grp-title">{name}</span>
        <span className="sb-shape-grp-meta">{shapes.length} shapes</span>
        <span className={`sb-shape-grp-chev${open?'':' shut'}`}>▾</span>
      </div>
      {!open&&(
        <div className="sb-shape-grp-sum">
          <div className="chips chips-tight">
            {quick.map(s=>(
              <button type="button" key={s.id} className={`chip${cfgShape===s.id?' on':''}`}
                disabled={disabled}
                onClick={e=>{ e.stopPropagation(); setShape(s.id);}}>{s.lbl}</button>
            ))}
          </div>
          <button type="button" className="btn btn-sec sb-shape-grp-more" disabled={disabled}
            onClick={e=>{ e.stopPropagation(); setOpen(true);}}>Expand for all</button>
        </div>
      )}
      {open&&(
        <div className="sh-grid sb-shape-grp-grid">
          {shapes.map(s=>(
            <button type="button" key={s.id} className={`sh-btn${cfgShape===s.id?' on':''}`}
              disabled={disabled} onClick={()=>setShape(s.id)}>{s.lbl}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// Register core panels + defaults (registry-driven sidebar)
;(function registerMxDPanels(){
  const R = window.MXD?.SettingsRegistry;
  if(!R || registerMxDPanels._done) return;
  registerMxDPanels._done = true;

  // Bulk Mode Advanced Settings (30x Processing)
  R.registerPanel({
    id:'mxd.bulk.vortex',
    title:'Vortex Batch Processor',
    icon:'🚀',
    order:34,
    defaultOpen:false,
    render:({cfg,set})=>{
      const bulk = cfg.mxdBulkVortex || {};
      const batchProc = window.MXD_BATCH_VORTEX;
      const modes = batchProc?.BATCH_MODES ? Object.values(batchProc.BATCH_MODES) : [];
      const priorities = batchProc?.PRIORITY_LEVELS ? Object.entries(batchProc.PRIORITY_LEVELS).map(([k,v]) => ({id: k, value: v})) : [];
      return (
        <div>
          <div className="info sb-gap-sm" style={{marginBottom:12}}>
            30x enhanced batch processing with Hyper modes up to 128x parallel.
          </div>
          <div className="grp-lbl">Processing Mode</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:6,marginBottom:12}}>
            {modes.map(m => (
              <button key={m.id} type="button"
                className={`sh-btn ${bulk.mode === m.id ? 'on' : ''}`}
                style={{fontSize:11,padding:'8px 6px',textAlign:'left'}}
                onClick={() => set('mxdBulkVortex',{...bulk,mode:m.id})}>
                <div style={{fontWeight:600}}>{m.name}</div>
                <div style={{fontSize:9,color:'var(--t3)'}}>{m.maxConcurrent}x parallel</div>
              </button>
            ))}
          </div>
          <div className="grp-lbl">Priority Level</div>
          <Select label="Queue Priority" value={bulk.priority || 'NORMAL'}
            options={priorities.map(p => ({v: p.id, l: `${p.id} (${p.value})`}))}
            onChange={v=>set('mxdBulkVortex',{...bulk,priority:v})}/>
          <div className="grp-lbl sb-gap">Performance</div>
          <Toggle label="Parallel Processing" checked={bulk.parallel ?? true}
            onChange={v=>set('mxdBulkVortex',{...bulk,parallel:v})} id="tog-vortex-par"/>
          <Toggle label="Memory Optimization" checked={bulk.memoryOptimize ?? true}
            onChange={v=>set('mxdBulkVortex',{...bulk,memoryOptimize:v})} id="tog-vortex-mem"/>
          <Toggle label="Auto Retry" checked={bulk.autoRetry ?? true}
            onChange={v=>set('mxdBulkVortex',{...bulk,autoRetry:v})} id="tog-vortex-retry"/>
          <NumberInput label="Max Retries" value={bulk.maxRetries ?? 5} min={1} max={20}
            onChange={v=>set('mxdBulkVortex',{...bulk,maxRetries:v})}/>
          <Slider label="Concurrent Jobs" value={bulk.maxConcurrent ?? 32} min={1} max={128}
            onChange={v=>set('mxdBulkVortex',{...bulk,maxConcurrent:v})} unit=""/>
          <div className="grp-lbl sb-gap">Offline Mode</div>
          <Toggle label="Enable Offline Mode" checked={bulk.offlineMode ?? false}
            onChange={v=>set('mxdBulkVortex',{...bulk,offlineMode:v})} id="tog-vortex-offline"
            sublabel="Queue jobs for when connection is restored"/>
          <NumberInput label="Queue Size" value={bulk.queueSize ?? 100} min={10} max={1000}
            onChange={v=>set('mxdBulkVortex',{...bulk,queueSize:v})}/>
          {batchProc?.getStats && (
            <div style={{marginTop:12,padding:'8px',background:'var(--bg3)',borderRadius:6}}>
              <div style={{fontSize:10,color:'var(--t2)'}}>Batch Stats</div>
              <div style={{fontSize:11,color:'var(--t1)'}}>
                Processed: {batchProc.getStats().completed || 0} | Failed: {batchProc.getStats().failed || 0} | Queued: {batchProc.getStats().queued || 0}
              </div>
            </div>
          )}
        </div>
      );
    }
  });

  // AI Integration Panel
  R.registerPanel({
    id:'mxd.ai',
    title:'AI Assistant',
    icon:'🤖',
    order:36,
    defaultOpen:false,
    render:({cfg,set})=>{
      const ai = cfg.mxdAi || {};
      const aiBrain = window.MXD_AI_VORTEX;
      const availableProviders = aiBrain?.getAvailableProviders ? aiBrain.getAvailableProviders() : [];
      const configuredAPIs = aiBrain?.getConfiguredAPIs ? aiBrain.getConfiguredAPIs() : [];
      return (
        <div>
          <Toggle label="Enable AI Word Generation" checked={!!ai.enabled}
            onChange={v=>set('mxdAi',{...ai,enabled:v})} id="tog-ai-enable"/>
          <Select label="AI Provider" value={ai.provider||'groq'}
            options={[
              {v:'groq',l:'Groq (Free, Fast)'},
              {v:'cloudflare',l:'Cloudflare (Free)'},
              {v:'gemini',l:'Google Gemini (Free)'},
              {v:'huggingface',l:'Hugging Face (Free)'},
              {v:'openrouter',l:'OpenRouter (Free)'},
              {v:'ollama',l:'Ollama (Local, No Key)'},
            ]}
            onChange={v=>set('mxdAi',{...ai,provider:v})}
          />
          <Select label="Model Size" value={ai.modelSize||'medium'}
            options={[
              {v:'small',l:'Small (Fast)'},
              {v:'medium',l:'Medium (Balanced)'},
              {v:'large',l:'Large (Quality)'},
            ]}
            onChange={v=>set('mxdAi',{...ai,modelSize:v})}
          />
          <NumberInput label="Words per Generation" value={ai.wordCount||20} min={5} max={100}
            onChange={v=>set('mxdAi',{...ai,wordCount:v})}/>
          <Select label="Difficulty" value={ai.difficulty||'medium'}
            options={[
              {v:'easy',l:'Easy (3-5 letter words)'},
              {v:'medium',l:'Medium (4-8 letter words)'},
              {v:'hard',l:'Hard (6-12 letter words)'},
            ]}
            onChange={v=>set('mxdAi',{...ai,difficulty:v})}
          />
          <Toggle label="Offline Fallback (Local Words)" checked={!!ai.offlineFallback}
            onChange={v=>set('mxdAi',{...ai,offlineFallback:v})} id="tog-ai-offline"/>
          {configuredAPIs.length > 0 && (
            <div style={{marginTop:8,padding:'8px',background:'var(--bg3)',borderRadius:6}}>
              <div style={{fontSize:11,color:'var(--t2)',marginBottom:4}}>Configured APIs: {configuredAPIs.length}</div>
              <div style={{fontSize:10,color:'var(--t3)'}}>Click to manage API keys in AI Configuration panel</div>
            </div>
          )}
        </div>
      );
    }
  });

  R.registerPanel({
    id:'mxd.ai.config',
    title:'AI Configuration',
    icon:'🔑',
    order:37,
    defaultOpen:false,
    render:({cfg,set})=>{
      const aiCfg = cfg.mxdAiConfig || {};
      const aiBrain = window.MXD_AI_VORTEX;
      const providers = aiBrain?.apis ? Object.entries(aiBrain.apis).map(([id, api]) => ({
        id, ...api
      })) : [];
      const categories = ['free', 'premium', 'local', 'enterprise', ' aggregator'];
      return (
        <div>
          <div className="info sb-gap-sm" style={{marginBottom:12}}>
            Configure AI providers. Free providers are highlighted. Local models run on your machine without internet.
          </div>
          {categories.map(cat => {
            const catProviders = providers.filter(p => p.category === cat);
            if (catProviders.length === 0) return null;
            return (
              <div key={cat} style={{marginBottom:12}}>
                <div className="grp-lbl" style={{textTransform:'capitalize'}}>{cat.replace('_', ' ')} Providers</div>
                {catProviders.map(p => (
                  <div key={p.id} style={{marginBottom:8,padding:'8px',background:'var(--bg3)',borderRadius:6}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                      <span style={{fontWeight:600,fontSize:12}}>{p.name}</span>
                      {p.freeTier && <span style={{fontSize:9,background:'#22c55e',color:'white',padding:'2px 6px',borderRadius:4}}>FREE</span>}
                    </div>
                    <div style={{fontSize:10,color:'var(--t3)',marginBottom:4}}>{p.capabilities?.join(', ')}</div>
                    <div style={{display:'flex',gap:4}}>
                      <input
                        type="password"
                        placeholder={p.requiresKey ? 'API Key...' : 'No key needed'}
                        defaultValue={aiBrain?.keys?.[p.id] || ''}
                        onChange={e => {
                          if (aiBrain?.setKey) aiBrain.setKey(p.id, e.target.value);
                        }}
                        style={{flex:1,padding:'4px 8px',fontSize:11,background:'var(--bg2)',border:'1px solid var(--b2)',borderRadius:4,color:'var(--t1)'}}
                      />
                      {aiBrain?.hasKey?.(p.id) && (
                        <span style={{fontSize:10,color:'#22c55e',padding:'4px 8px'}}>✓</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
          <div className="grp-lbl sb-gap" style={{marginTop:16}}>AI Settings</div>
          <Toggle label="Smart Routing" checked={aiCfg.smartRouting ?? true}
            onChange={v=>set('mxdAiConfig',{...aiCfg,smartRouting:v})} id="tog-ai-smart"
            sublabel="Automatically select best provider"/>
          <Toggle label="Cost Optimization" checked={aiCfg.costOptimization ?? true}
            onChange={v=>set('mxdAiConfig',{...aiCfg,costOptimization:v})} id="tog-ai-cost"
            sublabel="Use free providers first"/>
          <Toggle label="Fallback Mode" checked={aiCfg.fallbackEnabled ?? true}
            onChange={v=>set('mxdAiConfig',{...aiCfg,fallbackEnabled:v})} id="tog-ai-fallback"
            sublabel="Try alternate providers on failure"/>
          <Toggle label="Response Caching" checked={aiCfg.responseCache ?? true}
            onChange={v=>set('mxdAiConfig',{...aiCfg,responseCache:v})} id="tog-ai-cache"
            sublabel="Cache responses for faster reuse"/>
          <NumberInput label="Max Cache Age (minutes)" value={aiCfg.maxCacheAge ?? 60} min={5} max={1440}
            onChange={v=>set('mxdAiConfig',{...aiCfg,maxCacheAge:v})}/>
          <Toggle label="Learning Mode" checked={aiCfg.learningEnabled ?? true}
            onChange={v=>set('mxdAiConfig',{...aiCfg,learningEnabled:v})} id="tog-ai-learn"
            sublabel="Improve suggestions over time"/>
        </div>
      );
    }
  });

  R.registerPanel({
    id:'mxd.quality',
    title:'Quality Modes',
    icon:'✨',
    order:39,
    defaultOpen:false,
    render:({cfg,set})=>{
      const q = cfg.mxdQuality || {};
      const qm = window.MXD_QUALITY_VORTEX;
      const modes = qm?.QUALITY_MODES ? Object.entries(qm.QUALITY_MODES).map(([id, m]) => ({id, ...m})) : [];
      return (
        <div>
          <div className="info sb-gap-sm" style={{marginBottom:12}}>
            5-tier quality system with adaptive settings and hardware detection.
          </div>
          <div className="grp-lbl">Quality Mode</div>
          {modes.map(m => (
            <button key={m.id} type="button"
              className={`sh-btn ${q.mode === m.id ? 'on' : ''}`}
              style={{width:'100%',marginBottom:6,padding:'8px',textAlign:'left'}}
              onClick={() => set('mxdQuality',{...q,mode:m.id})}>
              <div style={{fontWeight:600,display:'flex',justifyContent:'space-between'}}>
                <span>{m.name}</span>
                <span style={{fontSize:9,color:'var(--t3)'}}>{m.dpi} DPI</span>
              </div>
              <div style={{fontSize:10,color:'var(--t2)'}}>{m.description}</div>
            </button>
          ))}
          <div className="grp-lbl sb-gap">Advanced</div>
          <Toggle label="Auto Hardware Detection" checked={q.autoDetect ?? true}
            onChange={v=>set('mxdQuality',{...q,autoDetect:v})} id="tog-q-auto"/>
          <Toggle label="Adaptive Quality" checked={q.adaptive ?? true}
            onChange={v=>set('mxdQuality',{...q,adaptive:v})} id="tog-q-adapt"
            sublabel="Adjust quality based on content"/>
          <Toggle label="Print Ready Output" checked={q.printReady ?? false}
            onChange={v=>set('mxdQuality',{...q,printReady:v})} id="tog-q-print"/>
          <Slider label="Color Depth" value={q.colorDepth ?? 32} min={8} max={32}
            onChange={v=>set('mxdQuality',{...q,colorDepth:v})} unit=" bit"/>
          <Select label="Color Profile" value={q.colorProfile ?? 'srgb'}
            options={[
              {v:'srgb',l:'sRGB - Web Standard'},
              {v:'adobe',l:'Adobe RGB - Photography'},
              {v:'p3',l:'Display P3 - Modern Screens'},
            ]}
            onChange={v=>set('mxdQuality',{...q,colorProfile:v})}/>
        </div>
      );
    }
  });

  R.registerPanel({
    id:'mxd.optimizer',
    title:'Puzzle Optimizer',
    icon:'🎯',
    order:40,
    defaultOpen:false,
    render:({cfg,set})=>{
      const opt = cfg.mxdOptimizer || {};
      const optimizer = window.MXD_PUZZLE_OPTIMIZER_VORTEX;
      const levels = optimizer?.OPTIMIZATION_LEVELS ? Object.entries(optimizer.OPTIMIZATION_LEVELS).map(([id, l]) => ({id, ...l})) : [];
      return (
        <div>
          <div className="info sb-gap-sm" style={{marginBottom:12}}>
            7-level optimization from Minimal to Vortex with genetic algorithm.
          </div>
          <div className="grp-lbl">Optimization Level</div>
          {levels.map(l => (
            <button key={l.id} type="button"
              className={`sh-btn ${opt.level === l.id ? 'on' : ''}`}
              style={{width:'100%',marginBottom:6,padding:'8px',textAlign:'left'}}
              onClick={() => set('mxdOptimizer',{...opt,level:l.id})}>
              <div style={{fontWeight:600,display:'flex',justifyContent:'space-between'}}>
                <span>{l.name}</span>
                <span style={{fontSize:9,color:'var(--t3)'}}>{l.iterations} iters</span>
              </div>
              <div style={{fontSize:10,color:'var(--t2)'}}>{l.description}</div>
            </button>
          ))}
          <div className="grp-lbl sb-gap">Strategy</div>
          <Select label="Placement Strategy" value={opt.strategy ?? 'density'}
            options={[
              {v:'random',l:'Random - Quick placement'},
              {v:'density',l:'Density - Balanced coverage'},
              {v:'genetic',l:'Genetic - Evolved optimization'},
              {v:'vortex',l:'Vortex - Maximum efficiency'},
            ]}
            onChange={v=>set('mxdOptimizer',{...opt,strategy:v})}/>
          <Toggle label="Density Control" checked={opt.densityControl ?? true}
            onChange={v=>set('mxdOptimizer',{...opt,densityControl:v})} id="tog-opt-density"/>
          <Toggle label="Word Clustering" checked={opt.wordClustering ?? true}
            onChange={v=>set('mxdOptimizer',{...opt,wordClustering:v})} id="tog-opt-cluster"/>
          <Slider label="Max Iterations" value={opt.maxIterations ?? 500} min={100} max={2000}
            onChange={v=>set('mxdOptimizer',{...opt,maxIterations:v})} unit=""/>
          <Slider label="Convergence Threshold" value={opt.convergence ?? 0.01} min={0.001} max={0.1} step={0.001}
            onChange={v=>set('mxdOptimizer',{...opt,convergence:v})}/>
        </div>
      );
    }
  });

  R.registerPanel({
    id:'mxd.roadmap',
    title:'Product roadmap',
    icon:'🗺',
    order:2,
    defaultOpen:false,
    render:()=>{
      const doc = window.MXD?.Roadmap?.docPath || 'docs/ROADMAP.md';
      const phases = window.MXD?.Roadmap?.phases || [];
      return (
        <div>
          <div className="info" style={{marginBottom:8}}>
            Static-first MXD: anything that needs live Amazon data, hosted AI, or legal-grade trademark checks stays documented here with realistic offline alternatives.
          </div>
          <ul style={{margin:'0 0 12px 18px',padding:0,fontSize:13,lineHeight:1.55,color:'var(--t2)'}}>
            {phases.map(p=>(
              <li key={p.id} style={{marginBottom:6}}>
                <strong style={{color:'var(--t1)'}}>{p.title}</strong>
                <span> — {p.summary}</span>
              </li>
            ))}
          </ul>
          <a className="btn btn-sec btn-full" style={{textDecoration:'none',display:'block',textAlign:'center',boxSizing:'border-box'}}
            href={doc} target="_blank" rel="noopener noreferrer">
            Open docs/ROADMAP.md
          </a>
        </div>
      );
    }
  });

  R.registerPanel({
    id:'mxd.tools',
    title:'Tools & modules',
    icon:'🧩',
    order:1,
    defaultOpen:false,
    render:({cfg,set})=>{
      const tools = R.getTools();
      if(!tools.length) return <div className="info">No tools registered.</div>;
      return (
        <div>
          <div className="info" style={{marginBottom:8}}>
            Turn modules on or off. Disabled tools can hide their panels and skip export hooks when a tool wires them in.
          </div>
          {tools.map(t=>(
            <Toggle key={t.id}
              label={t.label||t.id}
              checked={(cfg.mxdTools?.[t.id] ?? t.defaultEnabled ?? true)}
              onChange={v=>set('mxdTools', { ...(cfg.mxdTools||{}), [t.id]: v })}
              id={`tog-tool-${t.id}`}
              sublabel={t.sublabel}
            />
          ))}
        </div>
      );
    }
  });

  R.registerPanel({
    id:'mxd.export',
    title:'Export (PDF)',
    icon:'📄',
    order:50,
    defaultOpen:true,
    render:({cfg,set})=>{
      const exp = cfg.mxdExport || {};
      return (
        <div>
          <Toggle label="Include solution pages" checked={exp.includeSolutions!==false}
            onChange={v=>set('mxdExport',{...exp,includeSolutions:v})} id="tog-exp-sol"/>
          <Toggle label="Table of contents" sublabel="Planned — not written to PDF in this build" checked={!!exp.includeTOC}
            onChange={v=>set('mxdExport',{...exp,includeTOC:v})} id="tog-exp-toc"/>
          <Toggle label="Extra worksheets" sublabel="Planned — reserved for future layouts" checked={!!exp.includeExtras}
            onChange={v=>set('mxdExport',{...exp,includeExtras:v})} id="tog-exp-ex"/>
        </div>
      );
    }
  });

  R.registerPanel({
    id:'mxd.generation',
    title:'Generation engine',
    icon:'🧠',
    order:40,
    defaultOpen:false,
    render:({cfg,set})=>{
      const g = cfg.mxdGen || {};
      return (
        <div>
          <Select label="Overlap policy" value={g.overlapPolicy||'matchOnly'}
            options={[
              {v:'matchOnly',l:'Allow overlap only when letters match'},
              {v:'none',l:'No overlap (words cannot share cells)'},
            ]}
            onChange={v=>set('mxdGen',{...g,overlapPolicy:v})}
          />
          <TextInput label="Seed (optional; same seed = same puzzle)" value={g.seed||''}
            placeholder="e.g. 12345"
            onChange={v=>set('mxdGen',{...g,seed:v.replace(/[^\d]/g,'').slice(0,10)})}
          />
          <div className="info" style={{marginTop:6}}>
            The seed steers fill order and placement. Clear it to return to fully random layouts.
          </div>
        </div>
      );
    }
  });
})();

const REG_LAYOUT_IDS = new Set(['mxd.tools','mxd.roadmap','mxd.export','mxd.generation','mxd.bulk','mxd.bulk.vortex','mxd.ai','mxd.ai.config','mxd.dimension','mxd.quality','mxd.optimizer']);

window.Sidebar = function({ cfg, setCfg, wordText, setWordText, onGenerate, onBulkExport, generating, progress, auth, onLogout, usageStats }) {
  const userPlan = auth?.isAdmin ? 'admin' : (auth?.plan || 'pro');
  const access = getAccessLevel(userPlan);
  const set=(k,v)=>setCfg(p=>({...p,[k]:v}));
  const [activePreset,setActivePreset]=useSt2(null);
  const wordStats=useMemo2(()=>getWordInputStats(wordText,cfg.bulkMode),[wordText,cfg.bulkMode]);
  const groups=useMemo2(()=>{
    const g={};
    SHAPES.forEach(s=>{const k=s.grp||'Other';if(!g[k])g[k]=[];g[k].push(s);});
    return g;
  },[]);
  const sortedShapeGroups=useMemo2(()=>sortShapeGroupEntries(Object.entries(groups)),[groups]);

  const regPanels=useMemo2(()=>{
    const all=window.MXD?.SettingsRegistry?.getPanels?.()||[];
    return all.filter(p=>{
      if(p.toolId)return(cfg.mxdTools?.[p.toolId]??true);
      return true;
    });
  },[cfg.mxdTools]);

  const renderReg=(id)=>{
    const p=regPanels.find(x=>x.id===id);
    if(!p)return null;
    return <div key={id} className="sb-reg">{p.render({cfg,set})}</div>;
  };
  const extraPanels=regPanels.filter(p=>!REG_LAYOUT_IDS.has(p.id));

  const b=cfg.mxdBranding||{};
  const ui=cfg.mxdUi||{};

  return(
    <aside className={'sb'+(ui.compactSidebar?' sb-compact':'')}>
      {auth?.user && (
        <div className="mxd-sb-user-info">
          <div className="mxd-sb-user-row">
            <span className="mxd-sb-user-name">{auth.user.name || auth.user.email}</span>
            <span className={`mxd-sb-plan-badge ${userPlan}`}>
              {auth.isAdmin ? '👑 Admin' : userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}
            </span>
          </div>
          {usageStats && !auth.isAdmin && (
            <div className="mxd-sb-usage">
              <div className="mxd-sb-usage-bar">
                <div className="mxd-sb-usage-fill" style={{
                  width: `${Math.min(100, usageStats.daily.percent)}%`,
                  background: usageStats.daily.percent > 80 ? '#dc2626' : '#c9a227'
                }}></div>
              </div>
              <span className="mxd-sb-usage-text">{usageStats.daily.used}/{usageStats.daily.limit} daily · Resets {usageStats.daily.resetsIn?.formatted || 'soon'}</span>
            </div>
          )}
          {!auth.isAdmin && (
            <div className="mxd-sb-upgrade-hint">
              💡 Want more? <a href="#" onClick={(e) => { e.preventDefault(); if (window.showPlanModal) window.showPlanModal(); }}>Upgrade your plan</a>
            </div>
          )}
        </div>
      )}
      <div className="sb-hd">
        <div className="sb-logo" aria-hidden="true">M</div>
        <div className="sb-brand">
          <h1>MXD Word Search</h1>
          <span>Professional Puzzle Generator</span>
        </div>
      </div>
      <div className="sb-body">

        <Section title={'Branding & motion'} icon="◆" defaultOpen={false}
          collapseMode="summary"
          summaryChildren={
            <>
              <Toggle label="Decorative background" sublabel="Wordmark + dragon behind the workspace" checked={b.show!==false}
                onChange={v=>set('mxdBranding',{...b,show:v})} id="tog-brand-bg-sum"/>
              <Slider label="Wordmark opacity" value={Math.round((b.opacity??0.08)*100)} min={2} max={35}
                onChange={v=>set('mxdBranding',{...b,opacity:v/100})} unit="%"/>
              <Toggle label="Compact sidebar" sublabel="Tighter spacing and labels" checked={!!ui.compactSidebar}
                onChange={v=>set('mxdUi',{...ui,compactSidebar:v})} id="tog-ui-compact-sum"/>
            </>
          }>
          <div className="info sb-gap-sm">Screen-only layer: print/PDF are unchanged. Gold / ink / crimson defaults match the MXD palette.</div>
          <Toggle label="Decorative background" sublabel="Wordmark + dragon behind the workspace" checked={b.show!==false}
            onChange={v=>set('mxdBranding',{...b,show:v})} id="tog-brand-bg"/>
          {b.show!==false&&<>
            <Slider label="Wordmark opacity" value={Math.round((b.opacity??0.08)*100)} min={2} max={35}
              onChange={v=>set('mxdBranding',{...b,opacity:v/100})} unit="%"/>
            <div className="grp-lbl sb-gap">Wordmark letters</div>
            <div className="row">
              <ColorPicker label="Letter M" value={b.colorM||'#fbbf24'} onChange={v=>set('mxdBranding',{...b,colorM:v})}/>
              <ColorPicker label="Letter X" value={b.colorX||'#e5e7eb'} onChange={v=>set('mxdBranding',{...b,colorX:v})}/>
            </div>
            <div className="row">
              <ColorPicker label="Letter D" value={b.colorD||'#dc2626'} onChange={v=>set('mxdBranding',{...b,colorD:v})}/>
              <ColorPicker label="X outline" value={b.colorXStroke||'#111827'} onChange={v=>set('mxdBranding',{...b,colorXStroke:v})}/>
            </div>
            <div className="grp-lbl sb-gap">Dragon</div>
            <div className="row">
              <ColorPicker label="Body" value={b.dragonBody||'#dc2626'} onChange={v=>set('mxdBranding',{...b,dragonBody:v})}/>
              <ColorPicker label="Wings" value={b.dragonWing||'#fbbf24'} onChange={v=>set('mxdBranding',{...b,dragonWing:v})}/>
            </div>
            <Slider label="Wing fill strength" value={Math.round((b.dragonWingOpacity??0.92)*100)} min={35} max={100}
              onChange={v=>set('mxdBranding',{...b,dragonWingOpacity:v/100})} unit="%"/>
            <div className="row">
              <ColorPicker label="Tail fill" value={b.dragonTailFill||'#b91c1c'} onChange={v=>set('mxdBranding',{...b,dragonTailFill:v})}/>
              <ColorPicker label="Tail stroke" value={b.dragonTailStroke||'#7f1d1d'} onChange={v=>set('mxdBranding',{...b,dragonTailStroke:v})}/>
            </div>
            <div className="row">
              <ColorPicker label="Eye" value={b.dragonEye||'#111827'} onChange={v=>set('mxdBranding',{...b,dragonEye:v})}/>
              <ColorPicker label="Pupil highlight" value={b.dragonPupil||'#fef08a'} onChange={v=>set('mxdBranding',{...b,dragonPupil:v})}/>
            </div>
            <div className="grp-lbl sb-gap">Dragon path animation</div>
            <Select label="Motion" value={b.dragonAnim||'system'}
              options={[
                {v:'system',l:'Match accessibility setting'},
                {v:'on',l:'On (when allowed below)'},
                {v:'off',l:'Off (static)'},
              ]}
              onChange={v=>set('mxdBranding',{...b,dragonAnim:v})}/>
            <Slider label="Orbit duration" value={b.animDuration??22} min={8} max={50} onChange={v=>set('mxdBranding',{...b,animDuration:v})} unit="s"/>
          </>}
          <div className="grp-lbl sb-gap">Accessibility</div>
          <Select label="Reduced motion" value={ui.reducedMotion||'system'}
            options={[
              {v:'system',l:'Use system preference'},
              {v:'reduce',l:'Reduce decorative motion'},
              {v:'allow',l:'Allow decorative motion'},
            ]}
            onChange={v=>set('mxdUi',{...ui,reducedMotion:v})}/>
          <Toggle label="Compact sidebar" sublabel="Tighter controls for smaller screens" checked={!!ui.compactSidebar}
            onChange={v=>set('mxdUi',{...ui,compactSidebar:v})} id="tog-ui-compact"/>
        </Section>

        <Section title={'Grid & layout'} icon="⊞" defaultOpen={true} badge={`${cfg.rows}×${cfg.cols}`}
          collapseMode="summary"
          summaryChildren={
            <>
              <div className="row">
                <Select label="Width (cols)" value={cfg.cols} disabled={generating}
                  options={Array.from({length:31},(_,i)=>({v:i+5,l:`${i+5}`}))}
                  onChange={v=>set('cols',+v)}/>
                <Select label="Height (rows)" value={cfg.rows} disabled={generating}
                  options={Array.from({length:31},(_,i)=>({v:i+5,l:`${i+5}`}))}
                  onChange={v=>set('rows',+v)}/>
              </div>
              <Slider label="Cell size" value={cfg.cellSize} min={14} max={44} onChange={v=>set('cellSize',v)} unit="px"/>
            </>
          }>
          <div className="row">
            <Select label="Width (cols)" value={cfg.cols} disabled={generating}
              options={Array.from({length:31},(_,i)=>({v:i+5,l:`${i+5}`}))}
              onChange={v=>set('cols',+v)}/>
            <Select label="Height (rows)" value={cfg.rows} disabled={generating}
              options={Array.from({length:31},(_,i)=>({v:i+5,l:`${i+5}`}))}
              onChange={v=>set('rows',+v)}/>
          </div>
          <div className="chips">
            {[[10,10],[12,12],[15,15],[18,18],[20,20],[25,25],[30,30],[35,35]].map(([r,c])=>(
              <button type="button" key={`${r}x${c}`} className={`chip${cfg.rows===r&&cfg.cols===c?' on':''}`}
                disabled={generating}
                onClick={()=>{set('rows',r);set('cols',c);}}>{r}×{c}</button>
            ))}
          </div>
          <Slider label="Cell size" value={cfg.cellSize} min={14} max={44} onChange={v=>set('cellSize',v)} unit="px"/>
        </Section>

        <Section title={'Puzzle shapes'} icon="◇" defaultOpen={false} badge={`${SHAPES.length} shapes`}
          collapseMode="summary"
          summaryChildren={
            <div className="info sb-gap-sm" style={{marginBottom:0}}>
              {SHAPES.length} masks grouped by theme — expand to browse or quick-pick from each group.
            </div>
          }>
          <div className="info sb-gap-sm">Pick the active mask for generation and PDF export. Legacy shape ids are unchanged.</div>
          <div className="sb-shapes-scroll">
            {sortedShapeGroups.map(([grp,shapes])=>(
              <ShapeGrpBlock key={grp} name={grp} shapes={shapes} cfgShape={cfg.shape}
                setShape={id=>set('shape',id)} disabled={generating}/>
            ))}
            {typeof MXDShapes !== 'undefined' && MXDShapes.totalShapes > 0 && (
              <div className="sb-shape-grp">
                <div className="sb-shape-grp-hd" role="button" tabIndex={0} aria-expanded={false}
                  onClick={(e) => {
                    const content = e.currentTarget.nextElementSibling;
                    if (content) content.style.display = content.style.display === 'none' ? 'block' : 'none';
                  }}>
                  <span className="sb-shape-grp-title">✨ MXD Shapes v2.0</span>
                  <span className="sb-shape-grp-meta">{MXDShapes.totalShapes} curvy shapes</span>
                </div>
                <div style={{marginTop:'8px'}}>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'4px',marginBottom:'8px'}}>
                    {MXDShapes.categoryList.slice(0,8).map((cat,ci)=>(
                      <button type="button" key={cat} className="sh-btn" style={{fontSize:'10px',padding:'6px 4px',border:'1px solid var(--b2)',borderRadius:'4px'}}
                        onClick={() => {
                          const catName = cat.charAt(0).toUpperCase() + cat.slice(1);
                          const shapes = [];
                          for (let si = 0; si < 10; si++) {
                            const s = MXDShapes.getShape(ci, si);
                            if (s) shapes.push(s);
                          }
                          const panel = document.createElement('div');
                          panel.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--bg2);border:2px solid var(--t1);border-radius:12px;padding:20px;z-index:9999;max-width:600px;max-height:80vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.4)';
                          panel.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--b2)"><h3 style="margin:0;color:var(--t1)">${catName} Shapes</h3><button onclick="this.parentElement.parentElement.remove()" style="background:none;border:none;color:var(--t2);font-size:24px;cursor:pointer">×</button></div><div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px">${shapes.map((s,si)=>`<div style="text-align:center;cursor:pointer;padding:8px;border-radius:8px;background:var(--bg3);transition:all 0.2s" onclick="var btns=document.querySelectorAll('.mxd-shape-sel');btns.forEach(b=>b.style.background='');this.style.background='var(--hl)';window.__mxdSelectedShape='mxd_${ci}_${si}'"><canvas id="mxdCanvas_${ci}_${si}" width="60" height="60" style="border-radius:4px"></canvas><div style="font-size:10px;margin-top:4px;color:var(--t2)">${s.name||'Shape '+(si+1)}</div></div>`).join('')}</div><div style="margin-top:16px;text-align:center"><button style="background:var(--hl);color:var(--bg1);border:none;padding:10px 24px;border-radius:8px;font-size:14px;cursor:pointer;font-weight:bold" onclick="if(window.__mxdSelectedShape){window.__mxdShapeSelected=window.__mxdSelectedShape;this.closest('.sidebar').querySelector('[data-section]')&&window.dispatchEvent(new CustomEvent('mxdShapeSelected',{detail:window.__mxdSelectedShape}));}this.textContent='Selected!';setTimeout(()=>this.parentElement.parentElement.remove(),500)">Select Shape</button></div>`;
                          document.body.appendChild(panel);
                          shapes.forEach((s,si) => {
                            setTimeout(() => {
                              const cv = document.getElementById(`mxdCanvas_${ci}_${si}`);
                              if (cv && MXDShapes.renderShapePreview) MXDShapes.renderShapePreview(s, cv, 60);
                            }, 50);
                          });
                        }}>
                        {cat.charAt(0).toUpperCase()+cat.slice(1)}
                      </button>
                    ))}
                  </div>
                  <button type="button" className="sh-btn" style={{width:'100%',padding:'8px',fontSize:'11px',border:'1px dashed var(--t2)',borderRadius:'6px',color:'var(--t2)'}}
                    onClick={() => {
                      const panel = document.createElement('div');
                      panel.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--bg2);border:2px solid var(--t1);border-radius:12px;padding:20px;z-index:9999;max-width:700px;max-height:85vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.4)';
                      const catButtons = MXDShapes.categoryList.map((cat,ci) => `<button class="mxd-cat-btn" data-cat="${ci}" style="padding:10px 16px;margin:4px;border-radius:8px;background:var(--bg3);border:1px solid var(--b2);cursor:pointer;font-size:12px">${cat.charAt(0).toUpperCase()+cat.slice(1)}</button>`).join('');
                      panel.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--b2)"><h3 style="margin:0;color:var(--t1)">All MXD Shapes (600 shapes)</h3><button onclick="this.parentElement.parentElement.remove()" style="background:none;border:none;color:var(--t2);font-size:24px;cursor:pointer">×</button></div><div style="margin-bottom:16px;display:flex;flex-wrap:wrap;gap:4px">${catButtons}</div><div id="mxd-shape-grid" style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px"></div>`;
                      document.body.appendChild(panel);
                      panel.querySelectorAll('.mxd-cat-btn').forEach(btn => {
                        btn.addEventListener('click', () => {
                          const catIdx = parseInt(btn.dataset.cat);
                          const grid = panel.querySelector('#mxd-shape-grid');
                          grid.innerHTML = '';
                          for (let si = 0; si < 30; si++) {
                            const s = MXDShapes.getShape(catIdx, si);
                            if (s) {
                              const div = document.createElement('div');
                              div.style.cssText = 'text-align:center;cursor:pointer;padding:8px;border-radius:8px;background:var(--bg3);transition:all 0.2s';
                              div.innerHTML = `<canvas id="mxdCanvas_${catIdx}_${si}" width="60" height="60" style="border-radius:4px"></canvas><div style="font-size:9px;margin-top:2px;color:var(--t2)">${s.name||'S'+(si+1)}</div>`;
                              div.addEventListener('click', () => {
                                set('shape', `mxd_${catIdx}_${si}`);
                                panel.remove();
                              });
                              grid.appendChild(div);
                              setTimeout(() => {
                                const cv = document.getElementById(`mxdCanvas_${catIdx}_${si}`);
                                if (cv && MXDShapes.renderShapePreview) MXDShapes.renderShapePreview(s, cv, 60);
                              }, 50);
                            }
                          }
                        });
                      });
                    }}>
                    View All 600 Shapes →
                  </button>
                </div>
              </div>
            )}
          </div>
        </Section>

        <Section title={'Words & lists'} icon="✏" defaultOpen={true}
          collapseMode="summary"
          summaryChildren={
            <>
              <Toggle label="Bulk mode" sublabel="Multi-page PDF from blank-line groups" checked={cfg.bulkMode} onChange={v=>set('bulkMode',v)} id="tog-bulk-sum"/>
              <Slider label="Words per grid (max 80)" value={cfg.wordsPerGrid} min={3} max={80} onChange={v=>set('wordsPerGrid',v)}/>
              <Toggle label="Show word list" checked={cfg.showWordList} onChange={v=>set('showWordList',v)} id="tog-wl-sum"/>
            </>
          }>
          <div className="bulk-callout">
            <div className="grp-lbl" style={{marginTop:0}}>Bulk PDF workflow</div>
            <Toggle label="Bulk mode ON" sublabel="Turn on to treat blank lines in the editor as puzzle boundaries. Export All as PDF walks groups in order (still uses your grid, shape, and placement settings)." checked={cfg.bulkMode} onChange={v=>set('bulkMode',v)} id="tog-bulk"/>
          </div>
          {cfg.bulkMode&&<>
            <div className="info sb-gap-sm">Separate groups with a <strong>blank line</strong>. Each group becomes one puzzle page (plus its solution when exporting).</div>
            <NumberInput label="Pages to generate (max 300)" value={cfg.bulkPageCount||1} min={1} max={300} disabled={generating}
              onChange={v=>set('bulkPageCount',v)}/>
          </>}
          <div className="grp-lbl sb-gap">Word list on the page</div>
          <Slider label="Word font size" value={cfg.wordFontSize} min={8} max={28} onChange={v=>set('wordFontSize',v)} unit="px"/>
          <Slider label="Words per grid (max 80)" value={cfg.wordsPerGrid} min={3} max={80} onChange={v=>set('wordsPerGrid',v)}/>
          <Slider label="Word list columns" value={cfg.wordColumns} min={1} max={10} onChange={v=>set('wordColumns',v)}/>
          <Toggle label="Show word list" checked={cfg.showWordList} onChange={v=>set('showWordList',v)} id="tog-wl"/>
          <Toggle label="Show ✓ on found words" checked={!!cfg.showChecks} onChange={v=>set('showChecks',v)} id="tog-chk"/>
          <div className="grp-lbl sb-gap">Word editor</div>
          <p className="lbl" style={{marginBottom:6,lineHeight:1.45}}>Use A–Z letters. Numbers and punctuation are stripped; each kept word needs at least two letters.</p>
          <div className="sb-presets">
            <div className="lbl sb-lbl-tight">Quick presets (50 categories × 50 words)</div>
            <div className="chips sb-presets-scroll">
              {Object.keys(PRESETS).map(cat=>(
                <button type="button" key={cat} className={`chip${activePreset===cat?' on':''}`}
                  disabled={generating}
                  onClick={()=>{setActivePreset(cat);setWordText(PRESETS[cat].join('\n'));}}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <textarea className="wta" value={wordText}
            style={{minHeight:cfg.bulkMode?180:110}}
            onChange={e=>{setWordText(e.target.value);setActivePreset(null);}}
            placeholder={cfg.bulkMode
              ?'APPLE\nBANANA\nCHERRY\n\nDOG\nCAT\nBIRD\n\nRED\nBLUE\nGREEN'
              :'One word per line — or comma-separated — e.g. APPLE, BANANA, CHERRY'}/>
          <div className="wcnt">
            <span><strong style={{color:'var(--t1)'}}>{wordStats.validN}</strong> valid</span>
            <span><strong style={{color:'var(--t1)'}}>{wordStats.unique}</strong> unique</span>
            <span>Uses <strong style={{color:'var(--t1)'}}>{Math.min(wordStats.validN,cfg.wordsPerGrid)}</strong> / {cfg.wordsPerGrid} cap</span>
          </div>
          {(wordStats.duplicateExtra>0||wordStats.droppedShort>0||wordStats.hadFormatting>0||(cfg.bulkMode&&wordStats.bulk))&&(
            <div className="wcnt-meta">
              {cfg.bulkMode&&wordStats.validN===0&&(
                <div>Bulk mode is on — add valid words to see group summaries.</div>
              )}
              {cfg.bulkMode&&wordStats.validN>0&&wordStats.bulk&&wordStats.bulk.groups>0&&(
                <div>Bulk: <strong>{wordStats.bulk.groups}</strong> group(s) · {wordStats.bulk.minW}–{wordStats.bulk.maxW} words each · <strong>{wordStats.bulk.total}</strong> words counted</div>
              )}
              {cfg.bulkMode&&wordStats.validN>0&&wordStats.bulk&&wordStats.bulk.groups===1&&(
                <div>Tip: only <strong>one</strong> contiguous group — insert blank lines between sections to split puzzles.</div>
              )}
              {wordStats.duplicateExtra>0&&(
                <div><strong>{wordStats.duplicateExtra}</strong> duplicate line(s): same spelling appears more than once (all lines are still sent to the engine in order).</div>
              )}
              {wordStats.droppedShort>0&&(
                <div><strong>{wordStats.droppedShort}</strong> token(s) skipped — need two or more letters after cleaning.</div>
              )}
              {wordStats.hadFormatting>0&&(
                <div><strong>{wordStats.hadFormatting}</strong> word(s) had spaces or punctuation removed automatically.</div>
              )}
            </div>
          )}
          <div className="btn-grp">
            <button type="button" className="btn btn-pri btn-full" onClick={onGenerate} disabled={generating}>
              {generating?'⏳ Working...':'⟳ Generate Puzzle'}
            </button>
          </div>
          {cfg.bulkMode&&(
            <div className="btn-grp">
              <button type="button" className="btn btn-ok btn-full" onClick={onBulkExport} disabled={generating}>
                {generating?'📄 Building PDF...':'📄 Export All as PDF'}
              </button>
            </div>
          )}
          {generating&&progress&&<Progress done={progress.done} total={progress.total} label={progress.label}/>}
          <div className="btn-grp">
            <button type="button" className="btn btn-sec" style={{flex:1}} disabled={generating} onClick={()=>{
              const w=parseWords(wordText).sort(()=>Math.random()-.5);
              setWordText(w.join('\n'));
            }}>🔀 Shuffle</button>
            <button type="button" className="btn btn-sec" style={{flex:1}} disabled={generating} onClick={()=>{
              const w=parseWords(wordText).sort();
              setWordText(w.join('\n'));
            }}>A→Z Sort</button>
            <button type="button" className="btn btn-del" disabled={generating} onClick={()=>setWordText('')}>Clear</button>
          </div>
        </Section>

        <Section title={'Word Analyzer'} icon="📊" defaultOpen={false} badge="v6.0">
          {(() => {
            const words = parseWords(wordText);
            const analysis = window.MXD_WordAnalyzer?.analyzeWordList(words) || null;
            if (!analysis || words.length === 0) {
              return (
                <div className="info sb-gap-sm">
                  Enter words above to see health analysis.
                </div>
              );
            }
            return (
              <div>
                <div className="grp-lbl">Word List Health</div>
                <div className="sb-analyzer-score" style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                  <div style={{fontSize:28,fontWeight:'bold',color:analysis.wordHealthScore >= 80 ? '#22c55e' : analysis.wordHealthScore >= 60 ? '#f59e0b' : '#ef4444'}}>
                    {analysis.wordHealthScore}
                  </div>
                  <div style={{fontSize:12,color:'#888'}}>/100 health score<br/>{analysis.total} total, {analysis.unique} unique</div>
                </div>
                <div className="sb-analyzer-dist">
                  <span>Short (≤4): <strong>{analysis.lengthDistribution.short}</strong></span>
                  <span>Medium: <strong>{analysis.lengthDistribution.medium}</strong></span>
                  <span>Long (>8): <strong>{analysis.lengthDistribution.long}</strong></span>
                </div>
                {analysis.warnings && analysis.warnings.length > 0 && (
                  <div className="sb-gap-sm">
                    <div className="grp-lbl">Warnings</div>
                    {analysis.warnings.map((w, i) => (
                      <div key={i} style={{fontSize:11,padding:'4px 8px',background:'#fef3c7',borderRadius:4,marginBottom:4,color:'#92400e'}}>
                        ⚠️ {w.message}
                        {w.words && w.words.length > 0 && <div style={{marginTop:2,fontSize:10}}>Examples: {w.words.join(', ')}</div>}
                      </div>
                    ))}
                  </div>
                )}
                {analysis.issues && analysis.issues.length > 0 && (
                  <div className="sb-gap-sm">
                    <div className="grp-lbl">Issues</div>
                    {analysis.issues.map((issue, i) => (
                      <div key={i} style={{fontSize:11,padding:'4px 8px',background:'#fee2e2',borderRadius:4,marginBottom:4,color:'#991b1b'}}>
                        ❌ {issue.message}
                        {issue.pairs && issue.pairs.length > 0 && (
                          <div style={{marginTop:2,fontSize:10}}>Near-duplicates: {issue.pairs.map(p => p.join(' ≈ ')).join('; ')}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {analysis.themeHints && analysis.themeHints.length > 0 && (
                  <div className="sb-gap-sm">
                    <div className="grp-lbl">Detected Theme</div>
                    {analysis.themeHints.map((hint, i) => (
                      <div key={i} style={{fontSize:11,padding:'4px 8px',background:'#dbeafe',borderRadius:4,color:'#1e40af'}}>
                        🎯 {hint.theme} (confidence: {(hint.confidence * 100).toFixed(0)}%, {hint.matches} matches)
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </Section>

        <Section title={'Appearance & print'} icon="🎨" defaultOpen={true} badge={`${Object.keys(TEMPLATES).length}`}
          collapseMode="summary"
          summaryChildren={
            <>
              <Select label="Solution style" value={cfg.solutionStyle}
                options={[
                  {v:'highlight',l:'Highlight band'},
                  {v:'dim',l:'Dim other letters'},
                  {v:'circle',l:'Circle cells'},
                  {v:'underline',l:'Underline letters'},
                  {v:'boxed',l:'Boxed cells'},
                  {v:'dashed',l:'Dashed path'},
                  {v:'double_line',l:'Double line path'},
                  {v:'dot',l:'Dot highlight'},
                ]}
                onChange={v=>set('solutionStyle',v)}/>
              <ColorPicker label="Highlight color" value={cfg.highlightColor} onChange={v=>set('highlightColor',v)}/>
            </>
          }>
          <div className="grp-lbl">Page template</div>
          <div className="tmpl-grid">
            {Object.entries(TEMPLATES).map(([k,t])=>(
              <button type="button" key={k} className="tmpl-btn"
                style={{background:t.bg,borderColor:cfg.template===k?'var(--acc)':'rgba(255,255,255,.14)',
                  color:t.tc,boxShadow:cfg.template===k?'0 0 0 2px rgba(201,162,39,.35)':'none'}}
                disabled={generating}
                onClick={()=>set('template',k)}>{t.n}</button>
            ))}
          </div>
          <div className="grp-lbl sb-gap">{'Grid & solution look'}</div>
          <Select label="Solution style" value={cfg.solutionStyle}
            options={[
              {v:'highlight',l:'Highlight band'},
              {v:'dim',l:'Dim other letters'},
              {v:'circle',l:'Circle cells'},
              {v:'underline',l:'Underline letters'},
              {v:'boxed',l:'Boxed cells'},
              {v:'dashed',l:'Dashed path'},
              {v:'double_line',l:'Double line path'},
              {v:'dot',l:'Dot highlight'},
            ]}
            onChange={v=>set('solutionStyle',v)}/>
          <div className="sb-stack-sm">
            <Select label="Font weight" value={cfg.fontWeight}
              options={[{v:'light',l:'Light'},{v:'normal',l:'Normal'},{v:'bold',l:'Bold'},{v:'800',l:'Extra Bold'}]}
              onChange={v=>set('fontWeight',v)}/>
            <Select label="Letter case" value={cfg.letterCase}
              options={[{v:'upper',l:'UPPERCASE'},{v:'lower',l:'lowercase'}]}
              onChange={v=>set('letterCase',v)}/>
          </div>
          <ColorPicker label="Highlight color" value={cfg.highlightColor} onChange={v=>set('highlightColor',v)}/>
          <Toggle label="Show grid lines" checked={!!cfg.forceGridLines} onChange={v=>set('forceGridLines',v)} id="tog-gl"/>
          <Toggle label="Show cell borders" checked={!!cfg.cellBorders} onChange={v=>set('cellBorders',v)} id="tog-cb"/>
          <div className="grp-lbl sb-gap">{'Print & PDF'}</div>
          <Toggle label="Show page numbers" checked={cfg.showPageNum} onChange={v=>set('showPageNum',v)} id="tog-pn"/>
          {cfg.showPageNum&&<div className="sb-gap-sm">
            <NumberInput label="Starting page number" value={cfg.pageNum||1} min={1} max={9999} onChange={v=>set('pageNum',v)}/>
          </div>}
          <Select label="Export quality" value={cfg.quality||'high'}
            options={[{v:'draft',l:'Draft (fast)'},{v:'high',l:'High Quality'},{v:'print',l:'Print Ready (600dpi)'}]}
            onChange={v=>set('quality',v)}/>
          <div className="grp-lbl sb-gap">Quality Tier (MXD v6.0)</div>
          <Select label="Quality tier" value={cfg.qualityTier||'balanced'}
            options={[
              {v:'highSpeed',l:'High Speed (300 DPI, fast)'},
              {v:'balanced',l:'Balanced (400 DPI, good)'},
              {v:'highQuality',l:'High Quality (500 DPI, premium)'},
            ]}
            onChange={v=>set('qualityTier',v)}/>
          <div className="info sb-gap-sm" style={{fontSize:'11px',color:'#888',marginTop:2}}>
            High Speed: draft output, 300 DPI, fast generation. Balanced: good quality, 400 DPI. High Quality: print-ready, 500 DPI, slower.
          </div>
<div className="grp-lbl sb-gap">PDF options (modules)</div>
          {renderReg('mxd.export')}
        </Section>

        <Section title={'Rendering'} icon="🎨" defaultOpen={false} badge="v7.0"
          collapseMode="summary"
          summaryChildren={
            <>
              <Select label="Render engine" value={cfg.renderMode||'canvas'}
                options={[{v:'canvas',l:'Canvas (faster)'},{v:'svg',l:'SVG (sharper)'}]}
                onChange={v=>set('renderMode',v)}/>
              <div className="info" style={{fontSize:'11px',color:'#888'}}>Canvas: faster rendering, good for large grids. SVG: sharper text, better for print.</div>
            </>
          }>
          <div className="grp-lbl">Render Engine</div>
          <Select label="Rendering mode" value={cfg.renderMode||'canvas'}
            options={[
              {v:'canvas',l:'Canvas — Faster rendering, handles large grids well'},
              {v:'svg',l:'SVG — Sharper text quality, better for print/export'}
            ]}
            onChange={v=>set('renderMode',v)}/>
          <div className="info sb-gap-sm">Canvas is faster for interactive use. SVG produces sharper output for PDF and print.</div>
          <Toggle label="Auto-detect optimal render mode" checked={cfg.autoRender??true} onChange={v=>set('autoRender',v)} id="tog-auto-render" sublabel="Automatically switch based on grid size"/>
          <div className="grp-lbl sb-gap">Performance & Speed</div>
          <Slider label="Render quality" value={cfg.renderQuality??80} min={10} max={100}
            onChange={v=>set('renderQuality',v)} unit="%"/>
          <Slider label="Frame rate target" value={cfg.targetFPS??60} min={15} max={120}
            onChange={v=>set('targetFPS',v)} unit=" FPS"/>
          <Slider label="Batch size" value={cfg.batchSize??50} min={10} max={200}
            onChange={v=>set('batchSize',v)} unit=" cells"/>
          <Toggle label="Enable anti-aliasing" checked={cfg.antiAlias??true} onChange={v=>set('antiAlias',v)} id="tog-aa"/>
          <Toggle label="Hardware acceleration" checked={cfg.hwAccel??true} onChange={v=>set('hwAccel',v)} id="tog-hw-accel"/>
          <Toggle label="Parallel rendering" checked={cfg.parallelRender??false} onChange={v=>set('parallelRender',v)} id="tog-par-render"/>
          <div className="grp-lbl sb-gap">Caching & Memory</div>
          <Toggle label="Cache rendered output" checked={cfg.cacheRender??true} onChange={v=>set('cacheRender',v)} id="tog-cache-render"/>
          <Toggle label="Pre-render shapes" checked={cfg.preRenderShapes??true} onChange={v=>set('preRenderShapes',v)} id="tog-pre-render"/>
          <Slider label="Cache size limit" value={cfg.cacheSize??100} min={10} max={500}
            onChange={v=>set('cacheSize',v)} unit=" MB"/>
          <Slider label="Memory budget" value={cfg.memoryBudget??256} min={64} max={1024}
            onChange={v=>set('memoryBudget',v)} unit=" MB"/>
          <div className="grp-lbl sb-gap">Grid & Cell Rendering</div>
          <Slider label="Cell size" value={cfg.cellRenderSize??32} min={16} max={64}
            onChange={v=>set('cellRenderSize',v)} unit="px"/>
          <Slider label="Cell padding" value={cfg.cellPadding??2} min={0} max={10}
            onChange={v=>set('cellPadding',v)} unit="px"/>
          <Toggle label="Smooth cell borders" checked={cfg.smoothBorders??true} onChange={v=>set('smoothBorders',v)} id="tog-smooth-b"/>
          <Select label="Border style" value={cfg.borderStyle??'rounded'}
            options={[
              {v:'sharp',l:'Sharp corners'},
              {v:'rounded',l:'Rounded corners'},
              {v:'beveled',l:'Beveled edges'},
              {v:'double',l:'Double line'},
            ]}
            onChange={v=>set('borderStyle',v)}/>
          <div className="grp-lbl sb-gap">Text Rendering</div>
          <Select label="Font rendering" value={cfg.fontRenderMode??'auto'}
            options={[
              {v:'auto',l:'Auto — Best for current display'},
              {v:'crisp',l:'Crisp — Sharp edges, pixel-perfect'},
              {v:'smooth',l:'Smooth — Anti-aliased, softer'},
              {v:'lcd',l:'LCD — Optimized for screens'},
            ]}
            onChange={v=>set('fontRenderMode',v)}/>
          <Slider label="Text gamma" value={cfg.textGamma??1.0} min={0.5} max={2.0} step={0.1}
            onChange={v=>set('textGamma',v)} unit=""/>
          <Toggle label="Subpixel positioning" checked={cfg.subpixel??true} onChange={v=>set('subpixel',v)} id="tog-subpixel"/>
          <div className="grp-lbl sb-gap">Color & Style</div>
          <Slider label="Color depth" value={cfg.colorDepth??32} min={8} max={32}
            onChange={v=>set('colorDepth',v)} unit=" bit"/>
          <Toggle label="Dithering" checked={cfg.dithering??false} onChange={v=>set('dithering',v)} id="tog-dither"/>
          <Toggle label="Color management" checked={cfg.colorMgmt??true} onChange={v=>set('colorMgmt',v)} id="tog-color-mgmt"/>
          <Select label="Color profile" value={cfg.colorProfile??'srgb'}
            options={[
              {v:'srgb',l:'sRGB — Standard web color'},
              {v:'adobe',l:'Adobe RGB — Photography'},
              {v:'p3',l:'Display P3 — Modern screens'},
            ]}
            onChange={v=>set('colorProfile',v)}/>
          <div className="grp-lbl sb-gap">Export & Print</div>
          <Slider label="Export DPI" value={cfg.exportDPI??300} min={72} max={600}
            onChange={v=>set('exportDPI',v)} unit=" DPI"/>
          <Slider label="Vector quality" value={cfg.vectorQuality??95} min={50} max={100}
            onChange={v=>set('vectorQuality',v)} unit="%"/>
          <Toggle label="Embed fonts" checked={cfg.embedFonts??true} onChange={v=>set('embedFonts',v)} id="tog-embed-fonts"/>
          <Toggle label="Compression" checked={cfg.enableCompression??true} onChange={v=>set('enableCompression',v)} id="tog-compress"/>
          <Select label="Compression level" value={cfg.compressionLevel??'balanced'}
            options={[
              {v:'fast',l:'Fast — Lower compression, faster'},
              {v:'balanced',l:'Balanced — Good speed and size'},
              {v:'max',l:'Maximum — Smallest file size'},
            ]}
            onChange={v=>set('compressionLevel',v)}/>
          <div className="grp-lbl sb-gap">Debug & Diagnostics</div>
          <Toggle label="Show render stats" checked={cfg.showRenderStats??false} onChange={v=>set('showRenderStats',v)} id="tog-render-stats"/>
          <Toggle label="Debug grid overlay" checked={cfg.debugGrid??false} onChange={v=>set('debugGrid',v)} id="tog-debug-grid"/>
          <Toggle label="Performance profiling" checked={cfg.perfProfile??false} onChange={v=>set('perfProfile',v)} id="tog-perf-profile"/>
        </Section>

        <Section title={'Word Analyzer'} icon="🔍" defaultOpen={false} badge="v7.0"
          collapseMode="summary"
          summaryChildren={
            <>
              <Toggle label="Enable word analysis" checked={cfg.wordAnalyzer??false} onChange={v=>set('wordAnalyzer',v)} id="tog-wa"/>
              <Slider label="Analysis depth" value={cfg.analysisDepth??5} min={1} max={10}
                onChange={v=>set('analysisDepth',v)} unit="/10"/>
            </>
          }>
          <div className="grp-lbl">Word Analysis Engine</div>
          <Toggle label="Enable word analysis" checked={cfg.wordAnalyzer??false} onChange={v=>set('wordAnalyzer',v)} id="tog-wa"/>
          <div className="info sb-gap-sm">Analyze word patterns, complexity, and placement strategies.</div>
          <div className="grp-lbl sb-gap">Analysis Options</div>
          <Slider label="Analysis depth" value={cfg.analysisDepth??5} min={1} max={10}
            onChange={v=>set('analysisDepth',v)} unit="/10"/>
          <Toggle label="Detect accidental words" checked={cfg.detectAccidental??true} onChange={v=>set('detectAccidental',v)} id="tog-accidental"/>
          <Toggle label="Check word overlap" checked={cfg.checkOverlap??true} onChange={v=>set('checkOverlap',v)} id="tog-overlap"/>
          <Toggle label="Validate spelling" checked={cfg.validateSpelling??true} onChange={v=>set('validateSpelling',v)} id="tog-spell"/>
          <Toggle label="Pattern recognition" checked={cfg.patternRecognition??true} onChange={v=>set('patternRecognition',v)} id="tog-pattern"/>
          <div className="grp-lbl sb-gap">Complexity Metrics</div>
          <Slider label="Min word length" value={cfg.minWordLen??4} min={2} max={8}
            onChange={v=>set('minWordLen',v)} unit=" chars"/>
          <Slider label="Max word length" value={cfg.maxWordLen??10} min={4} max={20}
            onChange={v=>set('maxWordLen',v)} unit=" chars"/>
          <Select label="Word source" value={cfg.wordSource??'custom'}
            options={[
              {v:'custom',l:'Custom list'},
              {v:'dictionary',l:'Dictionary'},
              {v:'thesaurus',l:'Thesaurus'},
              {v:'ai-generated',l:'AI generated'},
            ]}
            onChange={v=>set('wordSource',v)}/>
          <div className="grp-lbl sb-gap">Placement Strategy</div>
          <Select label="Placement algorithm" value={cfg.placementAlgo??'smart'}
            options={[
              {v:'random',l:'Random — Quick, basic'},
              {v:'smart',l:'Smart — Intelligent placement'},
              {v:'genetic',l:'Genetic — Optimized evolution'},
              {v:'ai-driven',l:'AI Driven — Machine learning'},
            ]}
            onChange={v=>set('placementAlgo',v)}/>
          <Toggle label="Cluster similar words" checked={cfg.clusterSimilar??true} onChange={v=>set('clusterSimilar',v)} id="tog-cluster-sim"/>
          <Toggle label="Avoid edge placement" checked={cfg.avoidEdges??false} onChange={v=>set('avoidEdges',v)} id="tog-avoid-edges"/>
          <Toggle label="Balance density" checked={cfg.balanceDensity??true} onChange={v=>set('balanceDensity',v)} id="tog-balance"/>
          <div className="grp-lbl sb-gap">Visualization</div>
          <Toggle label="Show heatmap" checked={cfg.showHeatmap??false} onChange={v=>set('showHeatmap',v)} id="tog-heatmap"/>
          <Toggle label="Word paths" checked={cfg.showWordPaths??true} onChange={v=>set('showWordPaths',v)} id="tog-paths"/>
          <Toggle label="Cell density overlay" checked={cfg.cellDensity??false} onChange={v=>set('cellDensity',v)} id="tog-density"/>
          <Slider label="Heatmap opacity" value={cfg.heatmapOpacity??30} min={5} max={80}
            onChange={v=>set('heatmapOpacity',v)} unit="%"/>
          <div className="grp-lbl sb-gap">Statistics</div>
          <Toggle label="Word length distribution" checked={cfg.wordLengthDist??true} onChange={v=>set('wordLengthDist',v)} id="tog-dist"/>
          <Toggle label="Direction distribution" checked={cfg.directionDist??true} onChange={v=>set('directionDist',v)} id="tog-dir-dist"/>
          <Toggle label="Overlap statistics" checked={cfg.overlapStats??true} onChange={v=>set('overlapStats',v)} id="tog-ov-stats"/>
          <Toggle label="Coverage analysis" checked={cfg.coverageAnalysis??true} onChange={v=>set('coverageAnalysis',v)} id="tog-coverage"/>
        </Section>

        <Section title={'Difficulty Settings'} icon="🎯" defaultOpen={false} badge="v6.0"
          collapseMode="summary"
          summaryChildren={
            <>
              <Select label="Difficulty preset" value={cfg.difficultyPreset||'medium'}
                options={[
                  {v:'very-easy',l:'Very Easy'},
                  {v:'easy',l:'Easy'},
                  {v:'medium',l:'Medium'},
                  {v:'hard',l:'Hard'},
                  {v:'expert',l:'Expert'},
                  {v:'adaptive',l:'Adaptive'},
                  {v:'senior',l:'Senior Mode'},
                  {v:'kids',l:'Kids Mode'},
                  {v:'memoryCare',l:'Memory Care'},
                ]}
                onChange={v=>set('difficultyPreset',v)}/>
              <Slider label="Difficulty level" value={cfg.difficultySettings?.overallDifficulty||5} min={1} max={10}
                onChange={v=>set('difficultySettings',{...(cfg.difficultySettings||{}),overallDifficulty:v})}
                unit="/10"/>
            </>
          }>
          <div className="grp-lbl">Difficulty Preset</div>
          <Select label="Preset" value={cfg.difficultyPreset||'medium'}
            options={[
              {v:'very-easy',l:'Very Easy — Beginners, seniors, memory care'},
              {v:'easy',l:'Easy — Kids, ESL learners'},
              {v:'medium',l:'Medium — Adults, general audience'},
              {v:'hard',l:'Hard — Teens, puzzle enthusiasts'},
              {v:'expert',l:'Expert — Puzzle masters'},
              {v:'adaptive',l:'Adaptive — Auto-tunes based on audience'},
              {v:'senior',l:'Senior Mode — Large print, low clutter'},
              {v:'kids',l:'Kids Mode — Simple, educational, playful'},
              {v:'memoryCare',l:'Memory Care — Calm categories, easier flow'},
            ]}
            onChange={v=>set('difficultyPreset',v)}/>
          <div className="grp-lbl sb-gap">Multi-Axis Difficulty</div>
          <Slider label="Overall difficulty" value={cfg.difficultySettings?.overallDifficulty||5} min={1} max={10}
            onChange={v=>set('difficultySettings',{...(cfg.difficultySettings||{}),overallDifficulty:v})} unit="/10"/>
          <Slider label="Min word count" value={cfg.difficultySettings?.wordCountMin||8} min={3} max={25}
            onChange={v=>set('difficultySettings',{...(cfg.difficultySettings||{}),wordCountMin:v})} unit=" words"/>
          <Slider label="Max word count" value={cfg.difficultySettings?.wordCountMax||15} min={5} max={50}
            onChange={v=>set('difficultySettings',{...(cfg.difficultySettings||{}),wordCountMax:v})} unit=" words"/>
          <Slider label="Min word length" value={cfg.difficultySettings?.wordLengthMin||4} min={2} max={8}
            onChange={v=>set('difficultySettings',{...(cfg.difficultySettings||{}),wordLengthMin:v})} unit=" chars"/>
          <Slider label="Max word length" value={cfg.difficultySettings?.wordLengthMax||10} min={4} max={20}
            onChange={v=>set('difficultySettings',{...(cfg.difficultySettings||{}),wordLengthMax:v})} unit=" chars"/>
          <div className="grp-lbl sb-gap">Direction Controls</div>
          <Toggle label="Horizontal forward (→)" checked={cfg.difficultySettings?.horizontalForward!==false}
            onChange={v=>set('difficultySettings',{...(cfg.difficultySettings||{}),horizontalForward:v})} id="tog-hf"/>
          <Toggle label="Horizontal backward (←)" checked={cfg.difficultySettings?.horizontalBackward!==false}
            onChange={v=>set('difficultySettings',{...(cfg.difficultySettings||{}),horizontalBackward:v})} id="tog-hb"/>
          <Toggle label="Vertical forward (↓)" checked={cfg.difficultySettings?.verticalForward!==false}
            onChange={v=>set('difficultySettings',{...(cfg.difficultySettings||{}),verticalForward:v})} id="tog-vf"/>
          <Toggle label="Vertical backward (↑)" checked={cfg.difficultySettings?.verticalBackward!==false}
            onChange={v=>set('difficultySettings',{...(cfg.difficultySettings||{}),verticalBackward:v})} id="tog-vb"/>
          <Toggle label="Diagonal forward" checked={cfg.difficultySettings?.diagonalForward!==false}
            onChange={v=>set('difficultySettings',{...(cfg.difficultySettings||{}),diagonalForward:v})} id="tog-df"/>
          <Toggle label="Diagonal backward" checked={cfg.difficultySettings?.diagonalBackward!==false}
            onChange={v=>set('difficultySettings',{...(cfg.difficultySettings||{}),diagonalBackward:v})} id="tog-db"/>
          <div className="grp-lbl sb-gap">Advanced Options</div>
          <Select label="Overlap policy" value={cfg.difficultySettings?.overlapPolicy||'matchOnly'}
            options={[
              {v:'none',l:'None — Words cannot share cells'},
              {v:'matchOnly',l:'Match only — Only when letters match'},
            ]}
            onChange={v=>set('difficultySettings',{...(cfg.difficultySettings||{}),overlapPolicy:v})}/>
          <Slider label="Max overlap per word" value={cfg.difficultySettings?.maxOverlapPerWord||3} min={1} max={10}
            onChange={v=>set('difficultySettings',{...(cfg.difficultySettings||{}),maxOverlapPerWord:v})} unit=" cells"/>
          <Select label="Filler complexity" value={cfg.difficultySettings?.fillerComplexity||'medium'}
            options={[
              {v:'low',l:'Low — Kid-friendly letters'},
              {v:'medium',l:'Medium — Balanced distribution'},
              {v:'high',l:'High — Challenging letters'},
              {v:'adaptive',l:'Adaptive — Adjusts to difficulty'},
            ]}
            onChange={v=>set('difficultySettings',{...(cfg.difficultySettings||{}),fillerComplexity:v})}/>
          <Select label="Accidental word sensitivity" value={cfg.difficultySettings?.accidentalWordSensitivity||'medium'}
            options={[
              {v:'high',l:'High — Strict filtering'},
              {v:'medium',l:'Medium — Balanced'},
              {v:'low',l:'Low — Minimal filtering'},
            ]}
            onChange={v=>set('difficultySettings',{...(cfg.difficultySettings||{}),accidentalWordSensitivity:v})}/>
          <Toggle label="Cluster words" checked={cfg.difficultySettings?.clusterWords!==false}
            onChange={v=>set('difficultySettings',{...(cfg.difficultySettings||{}),clusterWords:v})} id="tog-cluster"/>
          <Toggle label="Large print mode" checked={cfg.difficultySettings?.largePrint||false}
            onChange={v=>set('difficultySettings',{...(cfg.difficultySettings||{}),largePrint:v})} id="tog-lp"/>
          <Toggle label="High contrast" checked={cfg.difficultySettings?.highContrast||false}
            onChange={v=>set('difficultySettings',{...(cfg.difficultySettings||{}),highContrast:v})} id="tog-hc"/>
          <Toggle label="Low clutter" checked={cfg.difficultySettings?.lowClutter||false}
            onChange={v=>set('difficultySettings',{...(cfg.difficultySettings||{}),lowClutter:v})} id="tog-lcl"/>
        </Section>

        <Section title={'Modules & docs'} icon="🧩" defaultOpen={false}>
          <div className="grp-lbl">Tooling</div>
          {renderReg('mxd.tools')}
          <div className="grp-lbl sb-gap">Roadmap</div>
          {renderReg('mxd.roadmap')}
        </Section>

<Section title={'Vortex Systems'} icon='⚡' defaultOpen={false} badge="30x">
          <div className="grp-lbl">Vortex Batch Processor</div>
          {renderReg('mxd.bulk.vortex')}
          <div className="grp-lbl sb-gap">AI Assistant</div>
          {renderReg('mxd.ai')}
          <div className="grp-lbl sb-gap">AI Configuration</div>
          {renderReg('mxd.ai.config')}
          <div className="grp-lbl sb-gap">Dimension Manager</div>
          {renderReg('mxd.dimension')}
          <div className="grp-lbl sb-gap">Quality Modes</div>
          {renderReg('mxd.quality')}
          <div className="grp-lbl sb-gap">Puzzle Optimizer</div>
          {renderReg('mxd.optimizer')}
        </Section>

        {extraPanels.map(p=>(
          <Section key={p.id} title={p.title} icon={p.icon||'⚙'} defaultOpen={p.defaultOpen!==false} badge={p.badge}>
            {p.render({cfg,set})}
          </Section>
        ))}

      </div>
    </aside>
  );
};
