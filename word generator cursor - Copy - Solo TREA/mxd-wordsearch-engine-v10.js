// MXD Word Search Engine v10.0 — 30x Professional Upgrade
// Pillars 1-5: Smart Placement, Advanced Grid, Typography, Directions, Word List Intelligence
(function(){
'use strict';

// ===== PILLAR 1: SMART PLACEMENT ENGINE =====
window.MXD_WS_PLACEMENT = {
  strategies: {
    compact: { label: 'Compact', desc: 'Maximize letter sharing, dense grids', overlapBias: 0.8, spreadBias: 0.1 },
    balanced: { label: 'Balanced', desc: 'Even distribution, natural feel', overlapBias: 0.4, spreadBias: 0.5 },
    spread: { label: 'Spread', desc: 'Words far apart, easier to find', overlapBias: 0.0, spreadBias: 0.9 }
  },
  overlapModes: {
    none: { label: 'No Overlap', desc: 'Words never touch each other' },
    matchOnly: { label: 'Match Letters Only', desc: 'Overlap only on same letter' },
    crossAllowed: { label: 'Cross Allowed', desc: 'Words can cross at any letter' },
    maximizeCrossings: { label: 'Maximize Crossings', desc: 'Actively seek intersections for elegant puzzles' }
  },
  priorities: {
    longestFirst: { label: 'Longest First', desc: 'Place longest words first (default)' },
    shortestFirst: { label: 'Shortest First', desc: 'Place shortest words first' },
    random: { label: 'Random Order', desc: 'Random placement order' },
    smart: { label: 'Smart Order', desc: 'Hardest words first, then fill gaps' }
  },
  sortWords: function(words, priority) {
    var p = priority || 'longestFirst';
    var sorted = words.slice();
    if (p === 'longestFirst') sorted.sort(function(a,b){ return b.length - a.length; });
    else if (p === 'shortestFirst') sorted.sort(function(a,b){ return a.length - b.length; });
    else if (p === 'random') sorted.sort(function(){ return Math.random() - 0.5; });
    else if (p === 'smart') {
      var scored = sorted.map(function(w){ return { w: w, score: w.length + (w.match(/[JKQXZ]/g)||[]).length * 3 }; });
      scored.sort(function(a,b){ return b.score - a.score; });
      sorted = scored.map(function(s){ return s.w; });
    }
    return sorted;
  },
  canPlace: function(grid, mask, word, r, c, dr, dc, overlapMode, rows, cols) {
    for (var i = 0; i < word.length; i++) {
      var nr = r + dr * i, nc = c + dc * i;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || !mask[nr][nc]) return false;
      var existing = grid[nr][nc];
      if (existing !== '') {
        if (overlapMode === 'none') return false;
        if (overlapMode === 'matchOnly' && existing !== word[i]) return false;
      }
    }
    return true;
  },
  countCrossings: function(grid, word, r, c, dr, dc, rows, cols) {
    var crossings = 0;
    for (var i = 0; i < word.length; i++) {
      var nr = r + dr * i, nc = c + dc * i;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] !== '') crossings++;
    }
    return crossings;
  },
  placeWord: function(grid, mask, word, r, c, dr, dc) {
    var cells = [];
    for (var i = 0; i < word.length; i++) {
      var nr = r + dr * i, nc = c + dc * i;
      grid[nr][nc] = word[i];
      cells.push([nr, nc]);
    }
    return cells;
  },
  generate: function(cfg) {
    var rows = cfg.rows || 15, cols = cfg.cols || 15;
    var words = cfg.words || [];
    var shape = cfg.shape || 'square';
    var allowDiag = cfg.allowDiag !== false;
    var allowReverse = cfg.allowReverse !== false;
    var allowH = cfg.allowH !== false;
    var allowV = cfg.allowV !== false;
    var overlapMode = cfg.overlapMode || 'matchOnly';
    var strategy = cfg.strategy || 'balanced';
    var priority = cfg.priority || 'longestFirst';
    var maxAttempts = cfg.maxAttempts || 500;
    var seed = cfg.seed;
    var rng = seeded(seed);

    var mask = generateMask(rows, cols, shape, cfg.shapeScale || 1.0);
    var grid = emptyGrid(rows, cols);
    var placements = {};
    var skipped = [];

    var sorted = this.sortWords(words, priority);
    var strat = this.strategies[strategy] || this.strategies.balanced;
    var dirs = getDirections(allowH, allowV, allowDiag, allowReverse);

    for (var wi = 0; wi < sorted.length; wi++) {
      var word = sorted[wi].toUpperCase().replace(/[^A-Z]/g, '');
      if (word.length < 2 || word.length > Math.max(rows, cols)) { skipped.push(sorted[wi]); continue; }

      var placed = false;
      var attempts = 0;
      var bestPos = null, bestScore = -1;

      while (attempts < maxAttempts && !placed) {
        var dirIdx = Math.floor(rng() * dirs.length);
        var dr = dirs[dirIdx][0], dc = dirs[dirIdx][1];
        var r = Math.floor(rng() * rows), c = Math.floor(rng() * cols);

        if (this.canPlace(grid, mask, word, r, c, dr, dc, overlapMode, rows, cols)) {
          if (overlapMode === 'maximizeCrossings') {
            var crossings = this.countCrossings(grid, word, r, c, dr, dc, rows, cols);
            var score = crossings + rng() * strat.spreadBias;
            if (score > bestScore) { bestScore = score; bestPos = { r: r, c: c, dr: dr, dc: dc }; }
            if (crossings > 0 && rng() < strat.overlapBias) placed = true;
          } else {
            placed = true;
            bestPos = { r: r, c: c, dr: dr, dc: dc };
          }
        }
        attempts++;
      }

      if (bestPos && !placed) {
        this.placeWord(grid, mask, word, bestPos.r, bestPos.c, bestPos.dr, bestPos.dc);
        placements[sorted[wi]] = getWordCells(word, bestPos.r, bestPos.c, bestPos.dr, bestPos.dc);
        placed = true;
      } else if (placed && bestPos) {
        this.placeWord(grid, mask, word, bestPos.r, bestPos.c, bestPos.dr, bestPos.dc);
        placements[sorted[wi]] = getWordCells(word, bestPos.r, bestPos.c, bestPos.dr, bestPos.dc);
      } else {
        skipped.push(sorted[wi]);
      }
    }

    var fillerMode = cfg.fillerMode || 'random';
    var fillerLetters = cfg.fillerLetters || null;
    fillGrid(grid, mask, fillerMode, fillerLetters, cfg.letterCase || 'upper', rng);

    return {
      grid: grid, mask: mask, placements: placements,
      rows: rows, cols: cols, shape: shape,
      placed: Object.keys(placements).length,
      total: words.length,
      skipped: skipped,
      fillPercent: calcFillPercent(grid, mask),
      seed: seed
    };
  }
};

// ===== PILLAR 2: ADVANCED GRID SYSTEM =====
window.MXD_WS_GRID = {
  shapes: {},
  letterModes: {
    random: { label: 'Random Letters', desc: 'Uniform random A-Z' },
    frequency: { label: 'Frequency-Weighted', desc: 'Match English letter frequency' },
    wordlistOnly: { label: 'Word List Only', desc: 'Only use letters from your words' },
    custom: { label: 'Custom Characters', desc: 'User-defined letter pool' },
    silent: { label: 'Silent/Blank', desc: 'Leave empty cells blank' }
  },
  visualStyles: {
    clean: { label: 'Clean', desc: 'No grid lines' },
    gridLines: { label: 'Grid Lines', desc: 'Subtle lines between cells' },
    checkered: { label: 'Checkered', desc: 'Alternating cell colors' },
    dotted: { label: 'Dotted', desc: 'Dots at cell corners' },
    boldBorder: { label: 'Bold Border', desc: 'Thick outer border' }
  },
  englishFreq: 'EEEEEEEEEEEETTTTTTTTAAAAAAAIIIIIIIOOOOOONNNNNNSSSSSSRRRRRRDDDDLLLCCCUMMMWWFFGGYYPPBBVVKJXQZ'.split(''),
  getFillerLetters: function(mode, customLetters, wordList) {
    if (mode === 'frequency') return this.englishFreq;
    if (mode === 'wordlistOnly') {
      var letters = [];
      for (var i = 0; i < wordList.length; i++) {
        for (var j = 0; j < wordList[i].length; j++) letters.push(wordList[i][j].toUpperCase());
      }
      return letters.length > 0 ? letters : this.englishFreq;
    }
    if (mode === 'custom' && customLetters && customLetters.length > 0) return customLetters.toUpperCase().split('');
    return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  },
  generateMask: function(rows, cols, shape, scale) { return generateMask(rows, cols, shape, scale); },
  suggestGridSize: function(words, shape) {
    var maxLen = 0;
    for (var i = 0; i < words.length; i++) if (words[i].length > maxLen) maxLen = words[i].length;
    var totalLetters = 0;
    for (var i = 0; i < words.length; i++) totalLetters += words[i].length;
    var minSide = Math.max(maxLen, Math.ceil(Math.sqrt(totalLetters * 1.5)));
    return { rows: minSide, cols: minSide, minSide: minSide, maxWordLength: maxLen };
  }
};

// ===== PILLAR 3: TYPOGRAPHY & STYLING =====
window.MXD_WS_TYPOGRAPHY = {
  fonts: [
    { id: 'Inter', label: 'Inter (Modern)', family: 'Inter, sans-serif' },
    { id: 'Roboto', label: 'Roboto (Clean)', family: 'Roboto, sans-serif' },
    { id: 'OpenSans', label: 'Open Sans (Friendly)', family: 'Open Sans, sans-serif' },
    { id: 'Lato', label: 'Lato (Warm)', family: 'Lato, sans-serif' },
    { id: 'Montserrat', label: 'Montserrat (Bold)', family: 'Montserrat, sans-serif' },
    { id: 'Oswald', label: 'Oswald (Condensed)', family: 'Oswald, sans-serif' },
    { id: 'Raleway', label: 'Raleway (Elegant)', family: 'Raleway, sans-serif' },
    { id: 'Merriweather', label: 'Merriweather (Serif)', family: 'Merriweather, serif' },
    { id: 'Georgia', label: 'Georgia (Classic)', family: 'Georgia, serif' },
    { id: 'Times', label: 'Times New Roman', family: 'Times New Roman, serif' },
    { id: 'Courier', label: 'Courier (Monospace)', family: 'Courier New, monospace' },
    { id: 'Consolas', label: 'Consolas (Monospace)', family: 'Consolas, monospace' },
    { id: 'Arial', label: 'Arial (Standard)', family: 'Arial, sans-serif' },
    { id: 'Verdana', label: 'Verdana (Readable)', family: 'Verdana, sans-serif' },
    { id: 'Trebuchet', label: 'Trebuchet MS', family: 'Trebuchet MS, sans-serif' },
    { id: 'ComicSans', label: 'Comic Sans (Kids)', family: 'Comic Sans MS, cursive' },
    { id: 'Impact', label: 'Impact (Bold)', family: 'Impact, sans-serif' },
    { id: 'Palatino', label: 'Palatino (Elegant)', family: 'Palatino, serif' },
    { id: 'Garamond', label: 'Garamond (Classic)', family: 'Garamond, serif' },
    { id: 'Lucida', label: 'Lucida Console', family: 'Lucida Console, monospace' }
  ],
  letterCases: {
    upper: { label: 'UPPERCASE', transform: function(w){ return w.toUpperCase(); } },
    lower: { label: 'lowercase', transform: function(w){ return w.toLowerCase(); } },
    title: { label: 'Title Case', transform: function(w){ return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(); } },
    mixed: { label: 'MiXeD', transform: function(w){ var r=''; for(var i=0;i<w.length;i++) r += Math.random()>0.5 ? w[i].toUpperCase() : w[i].toLowerCase(); return r; } }
  },
  letterStyles: {
    normal: { label: 'Normal', fontWeight: 'normal', outline: false, shadow: false, chaotic: false },
    bold: { label: 'Bold', fontWeight: 'bold', outline: false, shadow: false, chaotic: false },
    outlined: { label: 'Outlined', fontWeight: 'normal', outline: true, shadow: false, chaotic: false },
    shadow: { label: 'Shadow', fontWeight: 'normal', outline: false, shadow: true, chaotic: false },
    chaotic: { label: 'Chaotic', fontWeight: 'normal', outline: false, shadow: false, chaotic: true }
  },
  getDefaultConfig: function() {
    return {
      gridFont: 'Inter', gridFontSize: 14,
      wordListFont: 'Inter', wordListFontSize: 11,
      titleFont: 'Montserrat', titleFontSize: 22,
      letterCase: 'upper', letterStyle: 'normal',
      colors: {
        gridBg: '#ffffff', gridLetter: '#1a1a2e', gridLine: '#e2e8f0',
        cellBg: 'transparent', wordListText: '#334155', wordListBg: '#f1f5f9',
        titleColor: '#1a1a2e', footerColor: '#64748b', borderColor: '#e2e8f0',
        solutionHighlight: '#c9a227'
      },
      gridStyle: 'clean', cellShape: 'square'
    };
  }
};

// ===== PILLAR 5: DIRECTION CONTROL =====
window.MXD_WS_DIRECTIONS = {
  all: [
    { id: 'right', label: '→ Right', dr: 0, dc: 1 },
    { id: 'down', label: '↓ Down', dr: 1, dc: 0 },
    { id: 'left', label: '← Left', dr: 0, dc: -1 },
    { id: 'up', label: '↑ Up', dr: -1, dc: 0 },
    { id: 'downRight', label: '↘ Down-Right', dr: 1, dc: 1 },
    { id: 'downLeft', label: '↙ Down-Left', dr: 1, dc: -1 },
    { id: 'upRight', label: '↗ Up-Right', dr: -1, dc: 1 },
    { id: 'upLeft', label: '↖ Up-Left', dr: -1, dc: -1 }
  ],
  presets: {
    easy: { label: 'Easy', dirs: ['right', 'down'], desc: 'Horizontal & vertical only' },
    medium: { label: 'Medium', dirs: ['right', 'down', 'downRight'], desc: '+ Main diagonal' },
    hard: { label: 'Hard', dirs: ['right', 'down', 'left', 'up', 'downRight', 'downLeft'], desc: '+ Reverse directions' },
    expert: { label: 'Expert', dirs: ['right', 'down', 'left', 'up', 'downRight', 'downLeft', 'upRight', 'upLeft'], desc: 'All 8 directions' },
    custom: { label: 'Custom', dirs: [], desc: 'Pick individually' }
  },
  getDirections: function(preset, customDirs) {
    var p = this.presets[preset] || this.presets.medium;
    var dirIds = p.dirs;
    if (preset === 'custom' && customDirs) dirIds = customDirs;
    var result = [];
    for (var i = 0; i < dirIds.length; i++) {
      for (var j = 0; j < this.all.length; j++) {
        if (this.all[j].id === dirIds[i]) result.push([this.all[j].dr, this.all[j].dc]);
      }
    }
    return result.length > 0 ? result : [[0,1],[1,0]];
  }
};

// ===== PILLAR 4: WORD LIST INTELLIGENCE =====
window.MXD_WS_WORDLIST = {
  tools: {
    shuffle: function(words) { var a = words.slice(); for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;} return a; },
    sortAZ: function(words) { return words.slice().sort(); },
    sortByLength: function(words) { return words.slice().sort(function(a,b){return a.length-b.length;}); },
    removeDuplicates: function(words) { var seen={}; var r=[]; for(var i=0;i<words.length;i++){var u=words[i].toUpperCase();if(!seen[u]){seen[u]=true;r.push(words[i]);}} return r; },
    filterByLength: function(words, min, max) { return words.filter(function(w){return w.length>=min&&w.length<=max;}); },
    removeBlocklist: function(words, blocklist) { var bl={}; for(var i=0;i<blocklist.length;i++) bl[blocklist[i].toUpperCase()]=true; return words.filter(function(w){return !bl[w.toUpperCase()];}); },
    mergeLists: function(lists) { var all=[]; for(var i=0;i<lists.length;i++) all=all.concat(lists[i]); return this.removeDuplicates(all); },
    pickRandom: function(words, count) { var shuffled = this.shuffle(words); return shuffled.slice(0, Math.min(count, shuffled.length)); },
    extractLetters: function(words) { var letters=[]; for(var i=0;i<words.length;i++) for(var j=0;j<words[i].length;j++) letters.push(words[i][j].toUpperCase()); return letters; }
  },
  removeVowels: function(words) { return words.map(function(w){ return w.replace(/[AEIOU]/g, ''); }).filter(function(w){return w.length>0;}); },
  generateDecoys: function(realWords, count, wordBanks) {
    var decoys = [];
    var allWords = [];
    if (wordBanks) { for(var i=0;i<wordBanks.length;i++) allWords=allWords.concat(wordBanks[i].w||[]); }
    var realSet = {};
    for(var i=0;i<realWords.length;i++) realSet[realWords[i].toUpperCase()]=true;
    var attempts = 0;
    while(decoys.length < count && attempts < 500) {
      var candidate = allWords[Math.floor(Math.random()*allWords.length)];
      if (candidate && !realSet[candidate.toUpperCase()] && decoys.indexOf(candidate)===-1) decoys.push(candidate);
      attempts++;
    }
    return decoys;
  },
  generateBonusWords: function(realWords, count, wordBanks) {
    var bonus = [];
    var allWords = [];
    if (wordBanks) { for(var i=0;i<wordBanks.length;i++) allWords=allWords.concat(wordBanks[i].w||[]); }
    var realSet = {};
    for(var i=0;i<realWords.length;i++) realSet[realWords[i].toUpperCase()]=true;
    var attempts = 0;
    while(bonus.length < count && attempts < 500) {
      var candidate = allWords[Math.floor(Math.random()*allWords.length)];
      if (candidate && !realSet[candidate.toUpperCase()] && bonus.indexOf(candidate)===-1) bonus.push(candidate);
      attempts++;
    }
    return bonus;
  }
};

// ===== UTILITY FUNCTIONS =====
function seeded(seed) {
  var s = (seed !== undefined && seed !== null) ? (typeof seed === 'string' ? hashStr(seed) : seed) : Date.now();
  s = s | 0;
  return function() {
    s = (s * 1664525 + 1013904223) | 0;
    return (s >>> 0) / 4294967296;
  };
}
function hashStr(s) { var h=0; for(var i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0;} return h>>>0; }
function emptyGrid(r,c) { var g=[]; for(var i=0;i<r;i++){var row=[];for(var j=0;j<c;j++)row.push('');g.push(row);} return g; }
function getWordCells(word,r,c,dr,dc) { var cells=[]; for(var i=0;i<word.length;i++) cells.push([r+dr*i,c+dc*i]); return cells; }
function calcFillPercent(grid,mask) {
  var total=0,used=0;
  for(var r=0;r<grid.length;r++) for(var c=0;c<grid[0].length;c++) if(mask[r][c]){total++;if(grid[r][c])used++;}
  return total>0?Math.round(used/total*100):0;
}

function getDirections(allowH,allowV,allowDiag,allowReverse) {
  var dirs=[];
  if(allowH) dirs.push([0,1]);
  if(allowV) dirs.push([1,0]);
  if(allowReverse){if(allowH)dirs.push([0,-1]);if(allowV)dirs.push([-1,0]);}
  if(allowDiag){dirs.push([1,1]);if(allowReverse){dirs.push([1,-1]);dirs.push([-1,1]);dirs.push([-1,-1]);}}
  return dirs.length>0?dirs:[[0,1],[1,0]];
}

function fillGrid(grid, mask, mode, customLetters, letterCase, rng) {
  var letters = MXD_WS_GRID.getFillerLetters(mode, customLetters, []);
  var caseFn = MXD_WS_TYPOGRAPHY.letterCases[letterCase] || MXD_WS_TYPOGRAPHY.letterCases.upper;
  for(var r=0;r<grid.length;r++) for(var c=0;c<grid[0].length;c++) {
    if(mask[r][c] && !grid[r][c]) {
      if(mode==='silent') { grid[r][c]=''; continue; }
      var ch = letters[Math.floor(rng()*letters.length)];
      grid[r][c] = caseFn.transform(ch);
    }
  }
}

function generateMask(rows, cols, shape, scale) {
  scale = scale || 1.0;
  var m = [];
  for(var r=0;r<rows;r++){m[r]=[];for(var c=0;c<cols;c++)m[r][c]=false;}
  var cx=(cols-1)/2, cy=(rows-1)/2, rx=cols/2*scale, ry=rows/2*scale;
  var inE=function(x,y,ax,ay){var dx=(x-cx)/ax,dy=(y-cy)/ay;return dx*dx+dy*dy<=1;};
  var poly=function(pts,px,py){var inside=false;for(var i=0,j=pts.length-1;i<pts.length;j=i++){var xi=pts[i][0],yi=pts[i][1],xj=pts[j][0],yj=pts[j][1];if((yi>py)!==(yj>py)&&px<(xj-xi)*(py-yi)/(yj-yi)+xi)inside=!inside;}return inside;};
  var nPts=function(n,r1,r2,off){var p=[];for(var i=0;i<n;i++){var a=i*2*Math.PI/n+off;p.push([cx+r1*Math.cos(a),cy+r2*Math.sin(a)]);}return p;};
  for(var y=0;y<rows;y++) for(var x=0;x<cols;x++){
    var v=false;
    switch(shape){
      case 'square': v=true; break;
      case 'circle': v=inE(x,y,rx,ry); break;
      case 'oval': v=inE(x,y,rx,ry*0.65); break;
      case 'diamond': v=Math.abs(x-cx)/rx+Math.abs(y-cy)/ry<=1; break;
      case 'triangle':{var w=((y+1)/rows)*cols,l=(cols-w)/2;v=x>=l&&x<l+w;break;}
      case 'heart':{var nx=(x-cx)/(rx*0.88),ny=(y-cy)/(ry*0.88),h=nx*nx+ny*ny-1;v=h*h*h-nx*nx*ny*ny*ny<=0.06;break;}
      case 'cross':{var aw=Math.floor(cols/3),ah=Math.floor(rows/3);v=(x>=aw&&x<cols-aw)||(y>=ah&&y<rows-ah);break;}
      case 'star5':{var a=Math.atan2(y-cy,x-cx),d=Math.sqrt((x-cx)*(x-cx)+(y-cy)*(y-cy)),r2=Math.max(rx,ry)*(0.38+0.62*Math.abs(Math.cos(2.5*a+Math.PI/2)));v=d<=r2*0.93;break;}
      case 'star6':{var a=Math.atan2(y-cy,x-cx),d=Math.sqrt((x-cx)*(x-cx)+(y-cy)*(y-cy)),r2=Math.max(rx,ry)*(0.4+0.6*Math.abs(Math.cos(3*a)));v=d<=r2*0.93;break;}
      case 'moon':{var full=inE(x,y,rx,ry),cut=((x-(cx+rx*0.22))*(x-(cx+rx*0.22))/(rx*0.8)/(rx*0.8)+(y-cy)*(y-cy)/(ry*0.92)/(ry*0.92))<=1;v=full&&!cut;break;}
      case 'cloud':{var bs=[[cx,cy,rx*0.55,ry*0.55],[cx-rx*0.45,cy+ry*0.18,rx*0.4,ry*0.4],[cx+rx*0.45,cy+ry*0.18,rx*0.4,ry*0.4],[cx-rx*0.22,cy-ry*0.18,rx*0.38,ry*0.38],[cx+rx*0.22,cy-ry*0.18,rx*0.38,ry*0.38]];v=bs.some(function(b){return inE(x,y,b[2],b[3])&&((x-b[0])*(x-b[0])/(b[2]*b[2])+(y-b[1])*(y-b[1])/(b[3]*b[3]))<=1;});break;}
      case 'shield':{var top=inE(x,y,rx*0.9,ry*0.62)&&y<=cy+ry*0.35;var bot=y>cy+ry*0.3&&poly([[cx-rx*0.82,cy+ry*0.3],[cx+rx*0.82,cy+ry*0.3],[cx,rows-0.5]],x,y);v=top||bot;break;}
      case 'hexagon': v=poly(nPts(6,rx*0.95,ry*0.95,0),x,y); break;
      case 'octagon': v=poly(nPts(8,rx*0.95,ry*0.95,0),x,y); break;
      case 'pentagon': v=poly(nPts(5,rx*0.95,ry*0.95,-Math.PI/2),x,y); break;
      default: v=true; break;
    }
    m[y][x]=v;
  }
  return m;
}

// ===== PRESET SYSTEM =====
window.MXD_WS_PRESETS = {
  STORAGE_KEY: 'mxd:ws:presets',
  getAll: function() {
    try { var s=localStorage.getItem(this.STORAGE_KEY); return s?JSON.parse(s):{}; } catch(e){ return {}; }
  },
  save: function(id, config) {
    var all = this.getAll();
    all[id] = { id: id, name: config.name, createdAt: Date.now(), config: config };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
    return all[id];
  },
  load: function(id) {
    var all = this.getAll();
    return all[id] ? all[id].config : null;
  },
  delete: function(id) {
    var all = this.getAll();
    delete all[id];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
  },
  exportAll: function() { return JSON.stringify(this.getAll(), null, 2); },
  importAll: function(json) {
    try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(JSON.parse(json))); return true; } catch(e){ return false; }
  }
};

// ===== EXPORT HELPERS =====
window.MXD_WS_EXPORT = {
  toPNG: function(canvasEl, dpi) {
    var scale = (dpi || 300) / 96;
    var w = canvasEl.width * scale, h = canvasEl.height * scale;
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var ctx = c.getContext('2d');
    ctx.scale(scale, scale);
    ctx.drawImage(canvasEl, 0, 0);
    return c.toDataURL('image/png');
  },
  toSVG: function(grid, mask, placements, cfg) {
    var rows = grid.length, cols = grid[0].length;
    var cs = cfg.cellSize || 24;
    var w = cols * cs + 40, h = rows * cs + 40;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'">';
    svg += '<rect width="'+w+'" height="'+h+'" fill="'+(cfg.colors&&cfg.colors.gridBg||'#fff')+'"/>';
    var typo = MXD_WS_TYPOGRAPHY;
    var font = typo.fonts.find(function(f){return f.id===cfg.gridFont;});
    var fontFamily = font ? font.family : 'Inter, sans-serif';
    var fs = cfg.gridFontSize || 14;
    svg += '<g font-family="'+fontFamily+'" font-size="'+fs+'" text-anchor="middle" dominant-baseline="central">';
    for(var r=0;r<rows;r++) for(var c=0;c<cols;c++){
      if(!mask[r][c]||!grid[r][c]) continue;
      var x = 20+c*cs+cs/2, y = 20+r*cs+cs/2;
      var fill = cfg.colors&&cfg.colors.gridLetter||'#1a1a2e';
      svg += '<text x="'+x+'" y="'+y+'" fill="'+fill+'">'+grid[r][c]+'</text>';
    }
    svg += '</g></svg>';
    return svg;
  },
  toJSON: function(result) {
    return JSON.stringify({
      grid: result.grid, mask: result.mask, placements: result.placements,
      rows: result.rows, cols: result.cols, shape: result.shape,
      placed: result.placed, total: result.total, skipped: result.skipped,
      fillPercent: result.fillPercent, seed: result.seed,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }
};

console.log('[MXD WS Engine v10] Loaded — 5 pillars: Placement, Grid, Typography, Directions, WordList');
})();
