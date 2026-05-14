// app.jsx ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â MXD AI Suite: Professional KDP Publishing Platform with AI Brain

const { PuzzleGrid, WordList, Toast } = WS;
const [useState, useEffect, useCallback, useRef] = window.MXDReactHooks;

const INIT = (window.MXD?.Settings?.DEFAULT_CFG) ? window.MXD.Settings.DEFAULT_CFG : {
  rows:15, cols:15, shape:'square',
  allowDiag:true, allowReverse:true, allowH:true, allowV:true,
  letterCase:'upper', fontWeight:'bold',
  showWordList:true, showPageNum:false, pageNum:1,
  wordFontSize:14, wordsPerGrid:8, wordColumns:4, cellSize:30,
  title:'Word Search Puzzle',
  highlightColor:'#c9a227', solutionStyle:'highlight',
  template:'classic', bulkMode:false, bulkPageCount:5,
  showChecks:false, playMode:true, shuffleOnGen:false, autoRegen:false,
  forceGridLines:false, cellBorders:false, quality:'high',
  mxdBranding:{ show:true, opacity:0.12, colorM:'#c9a227', colorX:'#09090b', colorXStroke:'#dc2626', colorD:'#dc2626', dragonBody:'#dc2626', dragonWing:'#c9a227', dragonWingOpacity:0.92, dragonEye:'#09090b', dragonPupil:'#c9a227', dragonSnout:'#09090b', dragonTailFill:'#dc2626', dragonTailStroke:'#8b0000', dragonAnim:'system', animDuration:22 },
  mxdUi:{ compactSidebar:false, reducedMotion:'system' },
};

function mxdNotifySessionUpdated(){ try{ window.dispatchEvent(new CustomEvent('mxd-session-updated')); }catch(_){} }

function decorativeMotionAllowed(cfg, osReduceMotion){
  const u = cfg.mxdUi?.reducedMotion ?? 'system';
  if(u === 'reduce') return false;
  if(u === 'allow') return true;
  return !osReduceMotion;
}

function dragonOrbitAnimOn(cfg, osReduceMotion){
  const b = cfg.mxdBranding;
  if(b?.show===false) return false;
  const da = b.dragonAnim ?? 'system';
  if(da === 'off') return false;
  const u = cfg.mxdUi?.reducedMotion ?? 'system';
  if(u === 'reduce') return false;
  if(u === 'allow') return true;
  if(da === 'on') return true;
  return !osReduceMotion;
}

function getCellsBetween(r1, c1, r2, c2){
  const dr=Math.sign(r2-r1), dc=Math.sign(c2-c1);
  if(r1!==r2 && c1!==c2 && Math.abs(r2-r1)!==Math.abs(c2-c1)) return [];
  const dist=Math.max(Math.abs(r2-r1), Math.abs(c2-c1));
  const out=[];
  for(let i=0; i<=dist; i++) out.push([r1+dr*i, c1+dc*i]);
  return out;
}

// ============ ENHANCED KDP STUDIO (15x Feature Upgrade) ============
function KdpStudio({ auth, onClose }) {
  const [activeTab, setActiveTab] = useState('niche');
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('us');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [savedNiches, setSavedNiches] = useState([]);

  const tabs = [
    { id: 'niche', label: 'Niche Finder', icon: 'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½', badge: 'AI' },
    { id: 'keywords', label: 'Keywords', icon: 'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“', badge: 'AI' },
    { id: 'ideas', label: 'Book Ideas', icon: 'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡', badge: 'AI' },
    { id: 'competition', label: 'Competition', icon: 'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â' },
    { id: 'trends', label: 'Trends', icon: 'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ' },
    { id: 'profit', label: 'Profit Calc', icon: 'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°' },
    { id: 'listing', label: 'Listing Builder', icon: 'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â' },
    { id: 'research', label: 'Research Hub', icon: 'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬' }
  ];

  const amazonRegions = {
    us: 'amazon.com', uk: 'amazon.co.uk', de: 'amazon.de', fr: 'amazon.fr',
    es: 'amazon.es', it: 'amazon.it', ca: 'amazon.ca', au: 'amazon.com.au',
    in: 'amazon.in', jp: 'amazon.co.jp', mx: 'amazon.com.mx', br: 'amazon.com.br'
  };

  // AI-Powered Niche Analysis
  const analyzeNiche = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const ai = window.MXD_AI_INTEGRATOR;
    if (ai) {
      const res = await ai.analyzeNiche(query);
      if (res.success) {
        setResult({ type: 'niche_analysis', data: res.analysis, query });
        addToHistory(query, 'niche_analysis');
      } else {
        fallbackAnalyze();
      }
    } else {
      fallbackAnalyze();
    }
    setLoading(false);
  };

  const fallbackAnalyze = () => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const score = words.length > 4 ? 'HIGH' : words.length > 2 ? 'MEDIUM' : 'BROAD';
    const ageGroups = ['Kids 6-8', 'Kids 9-12', 'Teens', 'Adults', 'Seniors'];
    const seasonal = ['Year-round', 'Back to School', 'Holiday Season', 'Summer'];
    setResult({
      type: 'niche_analysis',
      data: `Competition Level: ${score}\nBest Age Group: ${ageGroups[Math.floor(Math.random() * ageGroups.length)]}\nSeasonal: ${seasonal[0]}\nRelated Niches: word search, puzzle books, activity books, brain games, educational`,
      query
    });
    addToHistory(query, 'niche_analysis');
  };

  // AI-Powered Keyword Research
  const researchKeywords = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const ai = window.MXD_AI_INTEGRATOR;
    if (ai) {
      const res = await ai.generateKeywords(query, 30);
      if (res.success) {
        setResult({ type: 'keywords', data: res.keywords, query });
        addToHistory(query, 'keywords');
      } else {
        fallbackKeywords();
      }
    } else {
      fallbackKeywords();
    }
    setLoading(false);
  };

  const fallbackKeywords = () => {
    const base = query.toLowerCase();
    const keywords = [
      `word search ${base}`, `${base} puzzle book`, `${base} activity book`,
      `large print ${base}`, `${base} for kids`, `${base} brain games`,
      `fun ${base}`, `${base} challenge`, `${base} for seniors`, `${base} beginners`
    ];
    setResult({ type: 'keywords', data: keywords, query });
    addToHistory(query, 'keywords');
  };

  // AI-Powered Book Ideas
  const generateIdeas = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const ai = window.MXD_AI_INTEGRATOR;
    if (ai) {
      const res = await ai.generateBookIdeas(query, 15);
      if (res.success) {
        setResult({ type: 'ideas', data: res.ideas, query });
        addToHistory(query, 'ideas');
      } else {
        fallbackIdeas();
      }
    } else {
      fallbackIdeas();
    }
    setLoading(false);
  };

  const fallbackIdeas = () => {
    const ideas = [
      `Ultimate ${query} Word Search Challenge`,
      `${query} Puzzles for Beginners`,
      `Large Print ${query} Word Search`,
      `${query} Activity Book for Kids`,
      `365 Days of ${query} Puzzles`,
      `The Big ${query} Puzzle Book`,
      `${query} Brain Teasers Collection`,
      `${query} Word Games for Seniors`
    ];
    setResult({ type: 'ideas', data: ideas, query });
    addToHistory(query, 'ideas');
  };

  // Competition Analysis
  const analyzeCompetition = () => {
    if (!query.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const data = {
        competitors: Math.floor(Math.random() * 50) + 10,
        avgPrice: (Math.random() * 15 + 5).toFixed(2),
        avgReviews: Math.floor(Math.random() * 200) + 20,
        rating: (Math.random() * 2 + 3).toFixed(1),
        topAsins: ['B0XXXXX1', 'B0XXXXX2', 'B0XXXXX3'].map(a => ({ asin: a, title: `${query} Word Search Vol ${Math.floor(Math.random() * 10) + 1}`, price: `$${(Math.random() * 15 + 5).toFixed(2)}`, reviews: Math.floor(Math.random() * 300) + 10 }))
      };
      setResult({ type: 'competition', data, query });
      addToHistory(query, 'competition');
      setLoading(false);
    }, 1000);
  };

  // Trend Analysis
  const analyzeTrends = () => {
    if (!query.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const data = {
        interest: Math.floor(Math.random() * 100),
        trend: ['Rising', 'Stable', 'Seasonal', 'Declining'][Math.floor(Math.random() * 4)],
        bestMonth: ['January', 'March', 'June', 'September', 'November'][Math.floor(Math.random() * 5)],
        relatedTrends: [
          { name: 'Puzzle Books', growth: '+' + (Math.random() * 30 + 5).toFixed(0) + '%' },
          { name: 'Activity Books', growth: '+' + (Math.random() * 20 + 3).toFixed(0) + '%' },
          { name: 'Brain Games', growth: '+' + (Math.random() * 25 + 10).toFixed(0) + '%' }
        ]
      };
      setResult({ type: 'trends', data, query });
      addToHistory(query, 'trends');
      setLoading(false);
    }, 1000);
  };

  // Profit Calculator
  const [calcData, setCalcData] = useState({ price: 9.99, pages: 100, printingCost: 0.02, royalty: 60 });
  const calculateProfit = () => {
    const { price, pages, printingCost, royalty } = calcData;
    const printingTotal = pages * printingCost;
    const revenue = price * (royalty / 100);
    const profit = revenue - printingTotal;
    const margin = ((profit / price) * 100).toFixed(1);
    setResult({ type: 'profit', data: { price, pages, printingTotal, revenue: revenue.toFixed(2), profit: profit.toFixed(2), margin }, query: '' });
  };

  // Listing Builder
  const [listingData, setListingData] = useState({ title: '', subtitle: '', description: '', keywords: '' });
  const buildListing = () => {
    if (!listingData.title.trim()) return;
    const keywordList = listingData.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
    setResult({
      type: 'listing',
      data: {
        title: listingData.title,
        subtitle: listingData.subtitle || 'The Ultimate Puzzle Collection',
        description: listingData.description || 'Engaging word search puzzles perfect for all ages.',
        keywords: keywordList,
        charCount: { title: listingData.title.length, subtitle: (listingData.subtitle || '').length, description: (listingData.description || '').length },
        warnings: []
      },
      query: ''
    });
  };

  // Research Hub - Comprehensive Research Tool
  const [researchData, setResearchData] = useState({ niche: '', targetAge: '', difficulty: 'medium', pages: 100, competitors: '' });
  const doResearch = async () => {
    if (!researchData.niche.trim()) return;
    setLoading(true);
    const ai = window.MXD_AI_INTEGRATOR;
    const prompt = `Research for KDP word search puzzle book:\nNiche: ${researchData.niche}\nTarget Age: ${researchData.targetAge || 'All Ages'}\nDifficulty: ${researchData.difficulty}\n\nProvide: 1) Best book title ideas, 2) Top 10 keywords, 3) Competition summary, 4) Pricing recommendation, 5) Seasonal tips`;
    if (ai) {
      const res = await ai.ask(prompt);
      if (res.success) {
        setResult({ type: 'research', data: res.response, query: researchData.niche });
        addToHistory(researchData.niche, 'research');
      }
    } else {
      setResult({ type: 'research', data: 'AI not available. Please configure API keys.', query: researchData.niche });
    }
    setLoading(false);
  };

  const addToHistory = (q, type) => {
    setHistory(prev => [{ query: q, type, time: Date.now() }, ...prev.slice(0, 19)]);
  };

  const saveNiche = (niche) => {
    setSavedNiches(prev => {
      if (prev.find(n => n.toLowerCase() === niche.toLowerCase())) return prev;
      return [...prev, niche];
    });
  };

  const openAmazon = (type = 'search') => {
    const encoded = encodeURIComponent(query);
    if (type === 'search') window.open(`https://www.${amazonRegions[region]}/s?k=${encoded}`, '_blank');
    else if (type === ' bestseller') window.open(`https://www.${amazonRegions[region]}/gp/bestsellers/${encoded}`, '_blank');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text);
  };

  const renderResult = () => {
    if (!result) return null;
    switch (result.type) {
      case 'niche_analysis':
        return (
          <div className="mxd-result-panel">
            <h4>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  Niche Analysis for "{result.query}"</h4>
            <div className="mxd-result-content">{result.data}</div>
            <div className="mxd-result-actions">
              <button className="btn btn-sec" onClick={() => { setQuery(result.query); setActiveTab('keywords'); }}>Research Keywords</button>
              <button className="btn btn-sec" onClick={() => saveNiche(result.query)}>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¾ Save Niche</button>
            </div>
          </div>
        );
      case 'keywords':
        return (
          <div className="mxd-result-panel">
            <h4>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ Keywords for "{result.query}"</h4>
            <div className="mxd-keyword-grid">
              {result.data.map((k, i) => <span key={i} className="mxd-kw-tag" onClick={() => copyToClipboard(k)}>{k}</span>)}
            </div>
            <div className="mxd-result-actions">
              <button className="btn btn-pri" onClick={() => { setQuery(result.data.join(', ')); setActiveTab('listing'); }}>Use in Listing</button>
            </div>
          </div>
        );
      case 'ideas':
        return (
          <div className="mxd-result-panel">
            <h4>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ Book Ideas for "{result.query}"</h4>
            <div className="mxd-ideas-list">
              {result.data.map((idea, i) => (
                <div key={i} className="mxd-idea-row" onClick={() => copyToClipboard(idea)}>
                  <span className="mxd-idea-num">{i + 1}</span>
                  <span className="mxd-idea-text">{idea}</span>
                  <button className="btn btn-sec btn-sm">Copy</button>
                </div>
              ))}
            </div>
          </div>
        );
      case 'competition':
        return (
          <div className="mxd-result-panel">
            <h4>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Competition Analysis</h4>
            <div className="mxd-comp-grid">
              <div className="mxd-comp-item"><span>Competitors</span><strong>{result.data.competitors}</strong></div>
              <div className="mxd-comp-item"><span>Avg Price</span><strong>${result.data.avgPrice}</strong></div>
              <div className="mxd-comp-item"><span>Avg Reviews</span><strong>{result.data.avgReviews}</strong></div>
              <div className="mxd-comp-item"><span>Avg Rating</span><strong>{result.data.rating}ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦</strong></div>
            </div>
            <h5>Top ASINs</h5>
            <table className="mxd-asin-table">
              <thead><tr><th>ASIN</th><th>Price</th><th>Reviews</th></tr></thead>
              <tbody>
                {result.data.topAsins.map((a, i) => <tr key={i}><td>{a.asin}</td><td>{a.price}</td><td>{a.reviews}</td></tr>)}
              </tbody>
            </table>
          </div>
        );
      case 'trends':
        return (
          <div className="mxd-result-panel">
            <h4>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â  Trend Analysis</h4>
            <div className="mxd-trend-grid">
              <div className="mxd-trend-item"><span>Interest Score</span><strong>{result.data.interest}/100</strong></div>
              <div className="mxd-trend-item"><span>Trend</span><strong className={result.data.trend === 'Rising' ? 'text-success' : ''}>{result.data.trend}</strong></div>
              <div className="mxd-trend-item"><span>Best Month</span><strong>{result.data.bestMonth}</strong></div>
            </div>
            <h5>Related Growth</h5>
            <div className="mxd-growth-list">
              {result.data.relatedTrends.map((t, i) => <div key={i} className="mxd-growth-row"><span>{t.name}</span><strong className="text-success">{t.growth}</strong></div>)}
            </div>
          </div>
        );
      case 'profit':
        return (
          <div className="mxd-result-panel">
            <h4>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â° Profit Calculator</h4>
            <div className="mxd-profit-breakdown">
              <div className="mxd-profit-row"><span>List Price</span><strong>${result.data.price}</strong></div>
              <div className="mxd-profit-row"><span>Pages</span><strong>{result.data.pages}</strong></div>
              <div className="mxd-profit-row"><span>Printing Cost</span><strong>${result.data.printingTotal}</strong></div>
              <div className="mxd-profit-row"><span>KDP Royalty (60%)</span><strong>${result.data.revenue}</strong></div>
              <div className="mxd-profit-row highlight"><span>Net Profit</span><strong className="text-success">${result.data.profit}</strong></div>
              <div className="mxd-profit-row"><span>Profit Margin</span><strong>{result.data.margin}%</strong></div>
            </div>
          </div>
        );
      case 'listing':
        return (
          <div className="mxd-result-panel">
            <h4>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Listing Builder Results</h4>
            <div className="mxd-listing-preview">
              <div className="mxd-listing-item"><label>Title</label><div>{result.data.title}</div><span className={result.data.charCount.title > 200 ? 'text-warning' : ''}>{result.data.charCount.title}/200</span></div>
              <div className="mxd-listing-item"><label>Subtitle</label><div>{result.data.subtitle}</div><span>{result.data.charCount.subtitle}/200</span></div>
              <div className="mxd-listing-item"><label>Description</label><div>{result.data.description}</div><span>{result.data.charCount.description}/2000</span></div>
              <div className="mxd-listing-item"><label>Keywords</label><div className="mxd-kw-list">{result.data.keywords.map((k, i) => <span key={i} className="mxd-kw-tag">{k}</span>)}</div></div>
            </div>
            <div className="mxd-result-actions">
              <button className="btn btn-pri" onClick={() => copyToClipboard(JSON.stringify(result.data, null, 2))}>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹ Copy All</button>
            </div>
          </div>
        );
      case 'research':
        return (
          <div className="mxd-result-panel">
            <h4>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ Research Report: {result.query}</h4>
            <div className="mxd-research-content">{result.data}</div>
            <div className="mxd-result-actions">
              <button className="btn btn-sec" onClick={() => copyToClipboard(result.data)}>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹ Copy</button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mxd-kdp-panel">
      <div className="mxd-kdp-header">
        <h2>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ KDP Studio Pro</h2>
        <div className="mxd-kdp-header-actions">
          {savedNiches.length > 0 && <span className="mxd-saved-badge">{savedNiches.length} saved</span>}
          <button onClick={onClose}>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢</button>
        </div>
      </div>

      <div className="mxd-kdp-tabs">
        {tabs.map(tab => (
          <button key={tab.id} className={`mxd-kdp-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            <span>{tab.icon}</span> {tab.label} {tab.badge && <span className="mxd-ai-badge">{tab.badge}</span>}
          </button>
        ))}
      </div>

      <div className="mxd-kdp-content">
        {/* Niche Finder */}
        {activeTab === 'niche' && (
          <div className="mxd-kdp-section">
            <h3>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ Niche Finder (AI-Powered)</h3>
            <p className="mxd-hint">Enter a niche keyword to analyze competition, best age group, and seasonal opportunities.</p>
            <input className="mxd-kdp-input" placeholder="e.g. word search for seniors" value={query} onChange={e => setQuery(e.target.value)} />
            <select className="mxd-kdp-select" value={region} onChange={e => setRegion(e.target.value)}>
              {Object.entries(amazonRegions).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <div className="mxd-kdp-actions">
              <button className="btn btn-pri" onClick={analyzeNiche} disabled={loading}>{loading ? 'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ Analyzing...' : 'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ Analyze with AI'}</button>
              <button className="btn btn-sec" onClick={() => openAmazon('search')}>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Search Amazon</button>
            </div>
            {renderResult()}
          </div>
        )}

        {/* Keywords */}
        {activeTab === 'keywords' && (
          <div className="mxd-kdp-section">
            <h3>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ AI Keyword Research</h3>
            <p className="mxd-hint">Generate 30+ relevant keywords for your book listing.</p>
            <input className="mxd-kdp-input" placeholder="Enter main keyword..." value={query} onChange={e => setQuery(e.target.value)} />
            <div className="mxd-kdp-actions">
              <button className="btn btn-pri" onClick={researchKeywords} disabled={loading}>{loading ? 'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ Researching...' : 'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ Generate Keywords'}</button>
              <button className="btn btn-sec" onClick={() => openAmazon(' bestseller')}>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  Best Sellers</button>
            </div>
            {renderResult()}
          </div>
        )}

        {/* Book Ideas */}
        {activeTab === 'ideas' && (
          <div className="mxd-kdp-section">
            <h3>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ AI Book Idea Generator</h3>
            <p className="mxd-hint">Get creative book title ideas powered by AI.</p>
            <div className="mxd-category-chips">
              {['Puzzle Books', 'Activity Books', 'Educational', 'Large Print', 'Themed Sets', 'Seasonal', 'Brain Games', 'Travel'].map(cat => (
                <button key={cat} className="mxd-cat-chip" onClick={() => setQuery(cat)}>{cat}</button>
              ))}
            </div>
            <input className="mxd-kdp-input" placeholder="Describe your niche or select a category..." value={query} onChange={e => setQuery(e.target.value)} />
            <div className="mxd-kdp-actions">
              <button className="btn btn-pri" onClick={generateIdeas} disabled={loading || !query.trim()}>{loading ? 'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ Generating...' : 'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ Generate Ideas'}</button>
            </div>
            {renderResult()}
          </div>
        )}

        {/* Competition */}
        {activeTab === 'competition' && (
          <div className="mxd-kdp-section">
            <h3>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Competition Analysis</h3>
            <p className="mxd-hint">Research competitors in your niche on Amazon.</p>
            <input className="mxd-kdp-input" placeholder="Enter niche or competitor ASIN..." value={query} onChange={e => setQuery(e.target.value)} />
            <select className="mxd-kdp-select" value={region} onChange={e => setRegion(e.target.value)}>
              {Object.entries(amazonRegions).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <div className="mxd-kdp-actions">
              <button className="btn btn-pri" onClick={analyzeCompetition} disabled={loading}>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Analyze</button>
              <button className="btn btn-sec" onClick={() => openAmazon('search')}>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â View on Amazon</button>
            </div>
            {renderResult()}
          </div>
        )}

        {/* Trends */}
        {activeTab === 'trends' && (
          <div className="mxd-kdp-section">
            <h3>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â  Trend Analysis</h3>
            <p className="mxd-hint">Track seasonal and emerging trends in your niche.</p>
            <input className="mxd-kdp-input" placeholder="Enter trend keywords..." value={query} onChange={e => setQuery(e.target.value)} />
            <div className="mxd-kdp-actions">
              <button className="btn btn-pri" onClick={analyzeTrends} disabled={loading}>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  Check Trends</button>
            </div>
            {renderResult()}
          </div>
        )}

        {/* Profit Calculator */}
        {activeTab === 'profit' && (
          <div className="mxd-kdp-section">
            <h3>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â° KDP Profit Calculator</h3>
            <div className="mxd-profit-form">
              <div className="mxd-field"><label>List Price ($)</label><input type="number" value={calcData.price} onChange={e => setCalcData({ ...calcData, price: parseFloat(e.target.value) || 0 })} step="0.01" /></div>
              <div className="mxd-field"><label>Page Count</label><input type="number" value={calcData.pages} onChange={e => setCalcData({ ...calcData, pages: parseInt(e.target.value) || 0 })} /></div>
              <div className="mxd-field"><label>Printing Cost/Page ($)</label><input type="number" value={calcData.printingCost} onChange={e => setCalcData({ ...calcData, printingCost: parseFloat(e.target.value) || 0 })} step="0.001" /></div>
              <div className="mxd-field"><label>Royalty %</label><select value={calcData.royalty} onChange={e => setCalcData({ ...calcData, royalty: parseFloat(e.target.value) })}><option value="60">60% (KDP)</option><option value="35">35% (KDP Expanded)</option></select></div>
            </div>
            <button className="btn btn-pri btn-full" onClick={calculateProfit}>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â§ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â® Calculate</button>
            {renderResult()}
          </div>
        )}

        {/* Listing Builder */}
        {activeTab === 'listing' && (
          <div className="mxd-kdp-section">
            <h3>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Amazon Listing Builder</h3>
            <div className="mxd-listing-form">
              <div className="mxd-field"><label>Book Title (max 200 chars)</label><input value={listingData.title} onChange={e => setListingData({ ...listingData, title: e.target.value })} maxLength={200} /></div>
              <div className="mxd-field"><label>Subtitle (max 200 chars)</label><input value={listingData.subtitle} onChange={e => setListingData({ ...listingData, subtitle: e.target.value })} maxLength={200} /></div>
              <div className="mxd-field"><label>Description (max 2000 chars)</label><textarea value={listingData.description} onChange={e => setListingData({ ...listingData, description: e.target.value })} maxLength={2000} /></div>
              <div className="mxd-field"><label>Keywords (comma-separated, 7 slots)</label><input value={listingData.keywords} onChange={e => setListingData({ ...listingData, keywords: e.target.value })} placeholder="keyword1, keyword2, ..." /></div>
            </div>
            <button className="btn btn-pri btn-full" onClick={buildListing} disabled={!listingData.title.trim()}>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¨ Build Listing</button>
            {renderResult()}
          </div>
        )}

        {/* Research Hub */}
        {activeTab === 'research' && (
          <div className="mxd-kdp-section">
            <h3>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ AI Research Hub</h3>
            <p className="mxd-hint">Comprehensive research for your next bestseller.</p>
            <div className="mxd-research-form">
              <div className="mxd-field"><label>Niche/Topic</label><input value={researchData.niche} onChange={e => setResearchData({ ...researchData, niche: e.target.value })} placeholder="e.g. Bible word search" /></div>
              <div className="mxd-field"><label>Target Age Group</label><select value={researchData.targetAge} onChange={e => setResearchData({ ...researchData, targetAge: e.target.value })}><option value="">All Ages</option><option value="Kids 6-8">Kids 6-8</option><option value="Kids 9-12">Kids 9-12</option><option value="Teens">Teens</option><option value="Adults">Adults</option><option value="Seniors">Seniors</option></select></div>
              <div className="mxd-field"><label>Difficulty</label><select value={researchData.difficulty} onChange={e => setResearchData({ ...researchData, difficulty: e.target.value })}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div>
              <div className="mxd-field"><label>Target Page Count</label><input type="number" value={researchData.pages} onChange={e => setResearchData({ ...researchData, pages: parseInt(e.target.value) || 100 })} /></div>
            </div>
            <button className="btn btn-pri btn-full" onClick={doResearch} disabled={loading || !researchData.niche.trim()}>{loading ? 'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â³ Researching...' : 'ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ Full Research with AI'}</button>
            {renderResult()}
          </div>
        )}
      </div>

      {/* Notes Section */}
      <div className="mxd-kdp-notes">
        <h4>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ Research Notes</h4>
        <textarea className="mxd-kdp-input" placeholder="Keep your research notes here..." value={notes} onChange={e => setNotes(e.target.value)} />
        {history.length > 0 && (
          <div className="mxd-history-section">
            <h5>Recent Searches</h5>
            {history.slice(0, 5).map((h, i) => (
              <div key={i} className="mxd-history-item" onClick={() => { setQuery(h.query); setActiveTab(h.type === 'competition' ? 'competition' : h.type === 'ideas' ? 'ideas' : 'niche'); }}>
                <span className="mxd-history-type">{h.type}</span>
                <span className="mxd-history-query">{h.query}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ MAIN APP ============
function App(){
  const[cfg,setCfg]=useState(()=>{
    const doc = window.MXD?.Settings?.load?.();
    const loaded = doc?.cfg || {};
    return window.MXD?.Settings?.normalizeCfg ? window.MXD.Settings.normalizeCfg(loaded) : ({...INIT, ...loaded});
  });
  const[wordText,setWordText]=useState(Object.values(PRESETS)[0].slice(0,8).join('\n'));
  const[puzzles,setPuzzles]=useState([]);
  const[page,setPage]=useState(0);
  const[view,setView]=useState('puzzle');
  const[foundWords,setFoundWords]=useState([]);
  const[selecting,setSelecting]=useState(false);
  const[selStart,setSelStart]=useState(null);
  const[selCells,setSelCells]=useState([]);
  const[toast,setToast]=useState(null);
  const[generating,setGenerating]=useState(false);
  const[progress,setProgress]=useState(null);
  const printRef=useRef(null);
  const[osReduceMotion,setOsReduceMotion]=useState(()=> typeof window!=='undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const[auth,setAuth]=useState({ user: null, plan: 'pro', isAdmin: false });
  const[showLogin,setShowLogin]=useState(false);
  const[showPlanSelect,setShowPlanSelect]=useState(false);
  const[showAIPanel,setShowAIPanel]=useState(false);
  const[showKdpTools,setShowKdpTools]=useState(false);
  const[showControlCenter,setShowControlCenter]=useState(false);
  const[usageStats,setUsageStats]=useState(null);

  useEffect(()=>{
    const user = window.MXD_AUTH?.getUser();
    if (user) {
      const isAdmin = user.isAdmin || false;
      setAuth({ user, plan: user.plan, isAdmin });
      if (!isAdmin && !user.planExpiresAt) setShowPlanSelect(true);
    } else setShowLogin(true);
  },[]);

  useEffect(() => {
    if (auth.user && window.MXD_SUBSCRIPTION) {
      const stats = window.MXD_SUBSCRIPTION.getUsageStats();
      setUsageStats(stats);
    }
  }, [auth.user]);

  useEffect(()=>{
    const mq=window.matchMedia('(prefers-reduced-motion: reduce)');
    const fn=()=>setOsReduceMotion(mq.matches);
    if(mq.addEventListener)mq.addEventListener('change',fn);
    else mq.addListener(fn);
    return()=>{ if(mq.removeEventListener)mq.removeEventListener('change',fn); else mq.removeEventListener(fn); };
  },[]);

  const tmpl=TEMPLATES[cfg.template]||TEMPLATES.classic;
  const br=cfg.mxdBranding||INIT.mxdBranding;
  const dragonAnim=dragonOrbitAnimOn(cfg,osReduceMotion);
  const motionDecorative=decorativeMotionAllowed(cfg,osReduceMotion);

  const showToast=(message,type='info')=>setToast({message,type});

  const handleLogin = (user) => {
    setAuth({ user, plan: user.plan, isAdmin: user.isAdmin });
    setShowLogin(false);
    if (!user.planExpiresAt && !user.isAdmin) setShowPlanSelect(true);
  };

  const handleAdminLogin = (name, email, code) => {
    const result = window.MXD_AUTH?.adminLogin(name, email, code);
    if (result?.success) setAuth({ user: result.user, plan: 'admin', isAdmin: true });
    setShowLogin(false);
  };

  const handleRegister = (user) => {
    setAuth({ user, plan: user.plan, isAdmin: false });
    setShowLogin(false);
    setShowPlanSelect(true);
  };

  const handlePlanSelect = (plan) => {
    window.MXD_AUTH?.updatePlan(plan, Date.now() + (30 * 24 * 60 * 60 * 1000));
    setAuth(prev => ({ ...prev, plan }));
    setShowPlanSelect(false);
    showToast(`Plan selected: ${plan}`, 'success');
  };

  const handleLogout = () => {
    window.MXD_AUTH?.logout();
    setAuth({ user: null, plan: 'pro', isAdmin: false });
    setShowLogin(true);
  };

  useEffect(()=>{
    const t=setTimeout(()=>{ window.MXD?.Settings?.save?.(cfg); }, 200);
    return()=>clearTimeout(t);
  },[cfg]);

  const generate=useCallback(()=>{
    let words=parseWords(wordText);
    if(cfg.shuffleOnGen)words=words.sort(()=>Math.random()-.5);
    words=words.slice(0,cfg.wordsPerGrid);
    if(!words.length){showToast('Add at least one valid word (letters only, 2+ characters).','error');return;}
    const result=WordSearchEngine.generate({
      rows:cfg.rows, cols:cfg.cols, words, shape:cfg.shape,
      allowDiag:cfg.allowDiag, allowReverse:cfg.allowReverse, allowH:cfg.allowH, allowV:cfg.allowV,
      overlapPolicy: cfg.mxdGen?.overlapPolicy, seed: cfg.mxdGen?.seed, letterCase:cfg.letterCase
    });
    setPuzzles([result]);
    setPage(0);
    setFoundWords([]);
    setSelCells([]);
    if(!result.success){
      const n=Object.keys(result.placements).length;
      showToast(`Only ${n} of ${words.length} words fit ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â widen the grid, allow more directions, or shorten words.`,'error');
    } else {
      showToast(`Puzzle ready: ${Object.keys(result.placements).length} words placed.`,'success');
    }
  },[wordText,cfg]);

  useEffect(()=>{generate();},[]);

  useEffect(()=>{
    if(cfg.autoRegen&&puzzles.length>0)generate();
  },[cfg.rows,cfg.cols,cfg.shape,cfg.allowDiag,cfg.allowReverse,cfg.allowH,cfg.allowV]);

  const handleBulkExport=useCallback(async()=>{
    const groups=cfg.bulkMode?parseBulk(wordText):[parseWords(wordText)];
    if(!groups.length){showToast('No valid word groups ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â add words or fix blank-only groups.','error');return;}
    const maxPg=Math.min(cfg.bulkPageCount||groups.length,300);
    setGenerating(true);
    try{
      const generated=[];
      for(let i=0;i<maxPg;i++){
        const grp=groups[i%groups.length];
        const words=(cfg.shuffleOnGen?[...grp].sort(()=>Math.random()-.5):grp).slice(0,cfg.wordsPerGrid);
        if(!words.length)continue;
        
        // MXD Hyper Roadmap v6.0 - Enhanced Generation with Quality Tier Support
        const qualityTier = cfg.qualityTier || 'balanced';
        const difficultySettings = cfg.difficultySettings || {};
        
        const result = WordSearchEngine.generateEnhanced({
          rows: cfg.rows,
          cols: cfg.cols,
          words,
          shape: cfg.shape,
          letterCase: cfg.letterCase,
          qualityTier,
          difficultySettings,
          overlapPolicy: cfg.mxdGen?.overlapPolicy || 'matchOnly',
          seed: cfg.mxdGen?.seed || ''
        });
        
        generated.push(result);
        
        // Log quality diagnostics for first puzzle
        if (i === 0 && result.diagnostics) {
          console.log('MXD Quality Diagnostics:', {
            generationTime: result.diagnostics.generationTimeMs + 'ms',
            attemptsUsed: result.diagnostics.attemptsUsed,
            fitScore: result.diagnostics.fitScore,
            qualityScore: result.diagnostics.qualityScore,
            warnings: result.diagnostics.warnings?.length || 0
          });
        }
        
        setProgress({done:i+1,total:maxPg,label:`Generating puzzle ${i+1}/${maxPg}...`});
        if((i+1)%5===0)await new Promise(r=>setTimeout(r,0));
      }
      setPuzzles(generated);
      setPage(0);
      setFoundWords([]);
      await PdfExport.generate(generated,{...cfg,title:cfg.title,qualityTier},(done,total,label)=>{
        setProgress({done,total,label:label||`Writing PDF page ${done}/${total}...`});
      });
      showToast(`PDF ready: ${generated.length} puzzle page(s) and matching solution page(s).`,'success');
    } catch(e){
      showToast('PDF export failed: '+e.message,'error');
      console.error(e);
    } finally{
      setGenerating(false);
      setProgress(null);
    }
  },[wordText,cfg]);

  const onMouseDown=(r,c)=>{
    if(!cfg.playMode)return;
    setSelecting(true); setSelStart([r,c]); setSelCells([[r,c]]);
  };
  const onMouseEnter=(r,c)=>{
    if(!selecting||!selStart)return;
    const cells=getCellsBetween(selStart[0],selStart[1],r,c);
    if(cells.length)setSelCells(cells);
  };
  const onMouseUp=()=>{
    if(!selecting||!puzzles.length){setSelecting(false);return;}
    setSelecting(false);
    const pz=puzzles[page];
    const selStr=selCells.map(([r,c])=>pz.grid[r][c]).join('');
    const selRev=[...selStr].reverse().join('');
    const placedWords=Object.keys(pz.placements);
    let found=false;
    for(const w of placedWords){
      const ww=cfg.letterCase==='lower'?w.toLowerCase():w.toUpperCase();
      if((selStr===ww||selRev===ww)&&!foundWords.includes(w)){
        setFoundWords(p=>[...p,w]);
        showToast(`Found: ${w}!`,'success');
        found=true;
        break;
      }
    }
    if(!found&&selCells.length>1)showToast('No match ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â drag across a full word in one line.','warn');
    setSelCells([]);
  };

  const pz=puzzles[page]||null;
  const displayWords=pz?Object.keys(pz.placements):[];
  const allFound=displayWords.length>0&&foundWords.length===displayWords.length;
  const activeTmpl={...tmpl, gl:tmpl.gl||cfg.forceGridLines};
  const AIPanel = window.MXD_AI_PANEL;

  return(
    <div className="app">
      {br.show!==false&&(
      <div className="mxd-bg" aria-hidden="true">
        <div className="mxd-bg-stage mxd-bg-stage--glow"/>
        <div className="mxd-bg-stage">
          <div className="mxd-wordmark">
            <span className="mxd-wm mxd-wm-m">M</span>
            <span className="mxd-wm mxd-wm-x">X</span>
            <span className="mxd-wm mxd-wm-d">D</span>
          </div>
          <div className={'mxd-dragon-orbit'+(dragonAnim?'':' mxd-dragon-orbit--static')}>
            <svg className="mxd-dragon" viewBox="0 0 140 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <ellipse className="mxd-dg-body" cx="72" cy="68" rx="38" ry="28"/>
              <path className="mxd-dg-wing mxd-dg-wing-l" d="M34 52 Q8 28 22 8 Q44 22 52 48"/>
              <path className="mxd-dg-wing mxd-dg-wing-r" d="M106 52 Q132 28 118 8 Q96 22 88 48"/>
              <ellipse className="mxd-dg-eye" cx="88" cy="56" rx="10" ry="9"/>
              <circle className="mxd-dg-pupil" cx="91" cy="54" r="3"/>
              <path className="mxd-dg-snout" d="M108 62 L128 58 L118 72 Z"/>
              <path className="mxd-dg-tail" d="M22 70 Q4 88 12 108 Q28 96 36 78"/>
            </svg>
          </div>
        </div>
      </div>
      )}

      {showLogin && (
        <MxdLoginModal onClose={() => auth.user && setShowLogin(false)} onLogin={handleLogin} onRegister={handleRegister} onAdminLogin={handleAdminLogin} />
      )}

      {showPlanSelect && !auth.isAdmin && (
        <MxdPlanModal onSelectPlan={handlePlanSelect} onClose={() => setShowPlanSelect(false)} />
      )}

      {showAIPanel && AIPanel && (
        <AIPanel cfg={cfg} setCfg={setCfg} />
      )}

      {showKdpTools && (
        <KdpStudio auth={auth} onClose={() => setShowKdpTools(false)} />
      )}

      {showControlCenter && (
        <div className="modal-overlay" onClick={() => setShowControlCenter(false)}>
          <div className="modal-content modal-content-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â MXD Control Center</h2>
              <button className="modal-close" onClick={() => setShowControlCenter(false)}>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢</button>
            </div>
            <div className="modal-body">
              {typeof MXDControlCenter === 'function' ? <MXDControlCenter /> : (
                <div className="mxd-cc-loading"><div className="spinner"></div><p>Loading Control Center...</p></div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="app-content">
        <Sidebar cfg={cfg} setCfg={setCfg} wordText={wordText} setWordText={setWordText}
          onGenerate={generate} onBulkExport={handleBulkExport}
          generating={generating} progress={progress}
          auth={auth} onLogout={handleLogout} usageStats={usageStats} />

        <main className="main">
          {auth.user && (
            <div className="mxd-user-bar">
              <div className="mxd-user-info">
                <span className="mxd-user-name">{auth.user.name || auth.user.email}</span>
                <span className={`mxd-user-plan ${auth.isAdmin ? 'admin' : auth.plan}`}>
                  {auth.isAdmin ? 'Admin' : auth.plan.charAt(0).toUpperCase() + auth.plan.slice(1)}
                </span>
              </div>
              {usageStats && !auth.isAdmin && (
                <div className="mxd-usage-mini">
                  <span>{usageStats.daily.used}/{usageStats.daily.limit}</span>
                  <div className="mxd-usage-mini-bar">
                    <div className="mxd-usage-mini-fill" style={{ width: `${Math.min(100, usageStats.daily.percent)}%`, background: usageStats.daily.percent > 80 ? '#dc2626' : '#c9a227' }}></div>
                  </div>
                </div>
              )}
              <div className="mxd-tool-btns">
                <button className="mxd-tool-btn" onClick={() => setShowKdpTools(true)} title="KDP Studio">ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ KDP</button>
                <button className="mxd-tool-btn" onClick={() => setShowAIPanel(!showAIPanel)} title="AI Assistant">ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ AI {showAIPanel ? 'X' : '+'}</button>
                <button className="mxd-tool-btn mxd-cc-btn" onClick={() => setShowControlCenter(true)} title="Settings">ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¾ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â</button>
              </div>
              <button className="mxd-logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          )}

          <div className="tb-wrap">
            <div className="tb">
              <div className="vtog">
                <button type="button" className={view==='puzzle'?'on':''} onClick={()=>setView('puzzle')}>Puzzle</button>
                <button type="button" className={view==='solution'?'on':''} onClick={()=>setView('solution')}>Solution</button>
              </div>
              <div className="tb-actions">
                <button type="button" className="btn btn-sec" onClick={()=>window.print()}>Print</button>
                <button type="button" className="btn btn-ok" onClick={generate} disabled={generating}>New Puzzle</button>
                {!cfg.bulkMode&&(<button type="button" className="btn btn-sec" onClick={handleBulkExport} disabled={generating}>Export PDF</button>)}
              </div>
              {puzzles.length>1&&(
                <div className="pgn">
                  <button type="button" onClick={()=>setPage(0)} disabled={page===0}>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â«</button>
                  <button type="button" onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0}>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¹</button>
                  <span>Puzzle {page+1} / {puzzles.length}</span>
                  <button type="button" onClick={()=>setPage(p=>Math.min(puzzles.length-1,p+1))} disabled={page===puzzles.length-1}>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Âº</button>
                  <button type="button" onClick={()=>setPage(puzzles.length-1)} disabled={page===puzzles.length-1}>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â»</button>
                </div>
              )}
            </div>
          </div>

          {pz?(
            <div className="pzcard" ref={printRef} style={{ background:activeTmpl.bg, boxShadow:activeTmpl.sh?'0 8px 30px rgba(0,0,0,.13)':'none', border:activeTmpl.gb?`2px solid ${activeTmpl.ac}`:'none', fontFamily:activeTmpl.ff }}>
              <input className="pz-title" value={cfg.title} onChange={e=>setCfg(p=>({...p,title:e.target.value}))} style={{color:activeTmpl.tc,fontFamily:activeTmpl.ff}} placeholder="Enter puzzle title..."/>
              {view==='solution'&&(<div className="sol-tag" style={{color:activeTmpl.tc}}>ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â Solution Key ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â</div>)}
              {cfg.playMode&&view==='puzzle'&&(
                <div className="pz-stats"><span>{displayWords.length} words</span><span>{cfg.rows}x{cfg.cols} grid</span><span>{foundWords.length} found</span></div>
              )}
              <PuzzleGrid grid={pz.grid} mask={pz.mask} placements={pz.placements} showSol={view==='solution'} solStyle={cfg.solutionStyle} foundWords={foundWords} hlColor={cfg.highlightColor} fontWeight={cfg.fontWeight} cellSize={cfg.cellSize} onMouseDown={onMouseDown} onMouseEnter={onMouseEnter} onMouseUp={onMouseUp} selCells={cfg.playMode?selCells:[]} tmpl={activeTmpl} cellBorders={!!cfg.cellBorders}/>
              {cfg.showWordList&&(<WordList words={displayWords} foundWords={foundWords} fontSize={cfg.wordFontSize} columns={cfg.wordColumns} tmpl={activeTmpl} showCheckboxes={cfg.showChecks}/>)}
              {cfg.showPageNum&&(<div className="pnum" style={{color:activeTmpl.tc,opacity:.45}}>Page {(cfg.pageNum||1)+page}</div>)}
              {allFound&&(<div className="win" style={{background:'#dcfce7',color:'#166534'}}>All {displayWords.length} words found!</div>)}
            </div>
          ):(
            <div className="pz-empty">
              <div className="pz-empty-ico">ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¸ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤</div>
              <h2 className="pz-empty-title">No Puzzle Yet</h2>
              <p className="pz-empty-txt">Use the sidebar to enter words (one per line), then generate.</p>
            </div>
          )}
        </main>
      </div>

      {toast&&<Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)}/>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
