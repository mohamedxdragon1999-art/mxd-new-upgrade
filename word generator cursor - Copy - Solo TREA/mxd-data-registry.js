(function(){
  'use strict';

  window.KDP_ALERTS=[
    {type:'TREND',msg:'Large Print Word Search demand up 34% this week'},
    {type:'OPPORTUNITY',msg:'Senior puzzle niche showing low competition'},
    {type:'ALERT',msg:'Christmas puzzles BSR dropping - high demand season'},
    {type:'INSIGHT',msg:'Bible word search books averaging 210 sales/month'},
    {type:'TREND',msg:'Activity books for kids growing 28% YoY'}
  ];

  window.PUZZLE_TYPES=[
    {id:'wordsearch',n:'Word Search',icon:'\u{1F50D}',pro:false},
    {id:'crossword',n:'Crossword',icon:'\u{2716}\u{FE0F}',pro:true},
    {id:'wordfill',n:'Word Fill',icon:'\u{270F}\u{FE0F}',pro:true},
    {id:'cryptogram',n:'Cryptogram',icon:'\u{1F510}',pro:true},
    {id:'maze',n:'Maze',icon:'\u{1F3D7}\u{FE0F}',pro:true},
    {id:'sudoku',n:'Sudoku',icon:'\u{1F522}',pro:true}
  ];

  window.PUZZLE_VARIATIONS=[];
  (function(){
    var bases=['Classic','Diagonal','No Reverse','Horizontal Only','Vertical Only','All Directions','Easy','Medium','Hard','Extreme'];
    var shapes=['None','Circle','Square','Diamond','Triangle','Heart','Star','Custom'];
    for(var i=0;i<410;i++){
      var b=bases[i%bases.length],s=shapes[i%shapes.length];
      window.PUZZLE_VARIATIONS.push({id:'var_'+i,name:b+' '+s+' #'+Math.floor(i/bases.length)});
    }
  })();

  window.CATEGORY_DB=[
    {id:1,n:'Games & Activities > Word Searches',path:'Books > Nonfiction > Games'},
    {id:2,n:'Games & Activities > Puzzles',path:'Books > Nonfiction > Games'},
    {id:3,n:'Health & Fitness > Brain Health',path:'Books > Nonfiction > Health'},
    {id:4,n:'Education > Vocabulary',path:'Books > Education > Language'},
    {id:5,n:'Children > Activities',path:'Books > Children > Activity Books'},
    {id:6,n:'Senior > Large Print',path:'Books > Special Interest > Senior'},
    {id:7,n:'Religion > Bible Study',path:'Books > Religion > Christianity'},
    {id:8,n:'Travel > Activity Books',path:'Books > Travel > Guides'},
    {id:9,n:'Holiday > Christmas',path:'Books > Holiday > Seasonal'},
    {id:10,n:'Education > Spelling',path:'Books > Education > Language Arts'}
  ];

  window.MOVERS_SHAKERS=[
    {id:1,n:'Large Print Word Search Vol.12',bsr_change:'-4,200',trend:'\u{2B06}'},
    {id:2,n:'Bible Word Search for Adults',bsr_change:'-2,800',trend:'\u{2B06}'},
    {id:3,n:'Christmas Puzzles 2024',bsr_change:'-8,500',trend:'\u{2B06}\u{FE0F}'},
    {id:4,n:'Senior Brain Teasers',bsr_change:'-1,200',trend:'\u{2B06}'},
    {id:5,n:'Kids Activity Book Ages 8-12',bsr_change:'-3,100',trend:'\u{2B06}'}
  ];

  window.BOOK_GENERATORS=[
    {id:'wordsearch',n:'Word Search',icon:'\u{1F50D}'},
    {id:'crossword',n:'Crossword',icon:'\u{2716}\u{FE0F}'},
    {id:'sudoku',n:'Sudoku',icon:'\u{1F522}'},
    {id:'maze',n:'Maze',icon:'\u{1F3D7}\u{FE0F}'},
    {id:'cryptogram',n:'Cryptogram',icon:'\u{1F510}'},
    {id:'coloring',n:'Coloring Book',icon:'\u{1F3A8}'},
    {id:'journal',n:'Journal',icon:'\u{1F4D3}'},
    {id:'planner',n:'Planner',icon:'\u{1F4C5}'},
    {id:'logbook',n:'Log Book',icon:'\u{1F4CB}'},
    {id:'activity',n:'Activity Book',icon:'\u{1F9E9}'}
  ];

  window.EXTENDED_BOOK_TYPES=[];
  (function(){
    var types=['Word Search','Crossword','Sudoku','Maze','Cryptogram','Word Scramble','Acrostic','Fall-A-Corner','Coloring Page','Journal','Planner','Log Book','Tracker','Workbook','Activity Book','Puzzle Collection','Brain Teaser','Logic Puzzle','Math Workbook','Handwriting Practice'];
    for(var i=0;i<100;i++){
      var t=types[i%types.length];
      window.EXTENDED_BOOK_TYPES.push({id:'et_'+i,name:t+' Template #'+(Math.floor(i/types.length)+1)});
    }
  })();

  window.LANGUAGES=['English','Spanish','French','German','Italian','Portuguese','Dutch','Swedish','Norwegian','Danish','Finnish'];
  window.ILLUSTRATION_COUNT=3000;

  window.KDP_EXPORT_PRESETS = {
    standard_8x11: { name: 'Standard 8.5x11', trimSize: '8.5x11', margins: { top: 0.5, bottom: 0.5, inner: 0.75, outer: 0.5 }, bleed: false, paper: 'white' },
    large_print_8x11: { name: 'Large Print 8.5x11', trimSize: '8.5x11', margins: { top: 0.75, bottom: 0.75, inner: 1.0, outer: 0.75 }, bleed: false, paper: 'cream', fontSize: 18 },
    pocket_5x8: { name: 'Pocket 5x8', trimSize: '5x8', margins: { top: 0.5, bottom: 0.5, inner: 0.625, outer: 0.5 }, bleed: false, paper: 'white' },
    digest_5x8: { name: 'Digest 5.5x8.5', trimSize: '5.5x8.5', margins: { top: 0.5, bottom: 0.5, inner: 0.625, outer: 0.5 }, bleed: false, paper: 'white' },
    square_8x8: { name: 'Square 8x8', trimSize: '8x8', margins: { top: 0.5, bottom: 0.5, inner: 0.75, outer: 0.5 }, bleed: false, paper: 'white' },
    landscape_11x8: { name: 'Landscape 11x8.5', trimSize: '11x8.5', margins: { top: 0.5, bottom: 0.5, inner: 0.75, outer: 0.5 }, bleed: false, paper: 'white' },
    large_landscape_11x8: { name: 'Large Landscape 11x8.5', trimSize: '11x8.5', margins: { top: 0.75, bottom: 0.75, inner: 1.0, outer: 0.75 }, bleed: false, paper: 'cream', fontSize: 16 },
    travel_6x9: { name: 'Travel 6x9', trimSize: '6x9', margins: { top: 0.5, bottom: 0.5, inner: 0.625, outer: 0.5 }, bleed: false, paper: 'white' },
    kids_8x10: { name: 'Kids 8x10', trimSize: '8x10', margins: { top: 0.5, bottom: 0.5, inner: 0.75, outer: 0.5 }, bleed: false, paper: 'white', fontSize: 14 },
    premium_8x11: { name: 'Premium 8.5x11', trimSize: '8.5x11', margins: { top: 0.75, bottom: 0.75, inner: 1.0, outer: 0.75 }, bleed: false, paper: 'cream', fontSize: 16, includeSolutions: true }
  };

  window.TYPOGRAPHY_PRESETS = {
    classic: { gridFont: 'Arial', gridFontSize: 14, wordListFont: 'Arial', wordListFontSize: 11, titleFont: 'Georgia', titleFontSize: 22, fontWeight: 'normal' },
    modern: { gridFont: 'Inter', gridFontSize: 14, wordListFont: 'Inter', wordListFontSize: 11, titleFont: 'Montserrat', titleFontSize: 22, fontWeight: '600' },
    elegant: { gridFont: 'Georgia', gridFontSize: 14, wordListFont: 'Georgia', wordListFontSize: 11, titleFont: 'Playfair Display', titleFontSize: 24, fontWeight: 'normal' },
    playful: { gridFont: 'Comic Sans MS', gridFontSize: 16, wordListFont: 'Comic Sans MS', wordListFontSize: 12, titleFont: 'Fredoka One', titleFontSize: 24, fontWeight: 'bold' },
    minimal: { gridFont: 'Helvetica', gridFontSize: 12, wordListFont: 'Helvetica', wordListFontSize: 10, titleFont: 'Helvetica', titleFontSize: 18, fontWeight: '300' },
    bold: { gridFont: 'Impact', gridFontSize: 16, wordListFont: 'Impact', wordListFontSize: 12, titleFont: 'Impact', titleFontSize: 26, fontWeight: 'bold' },
    handwritten: { gridFont: 'Courier New', gridFontSize: 14, wordListFont: 'Courier New', wordListFontSize: 11, titleFont: 'Brush Script MT', titleFontSize: 24, fontWeight: 'normal' },
    large_print: { gridFont: 'Arial', gridFontSize: 20, wordListFont: 'Arial', wordListFontSize: 16, titleFont: 'Arial', titleFontSize: 28, fontWeight: 'bold' },
    kids_friendly: { gridFont: 'Comic Sans MS', gridFontSize: 18, wordListFont: 'Comic Sans MS', wordListFontSize: 14, titleFont: 'Comic Sans MS', titleFontSize: 24, fontWeight: 'bold' },
    professional: { gridFont: 'Times New Roman', gridFontSize: 14, wordListFont: 'Times New Roman', wordListFontSize: 11, titleFont: 'Times New Roman', titleFontSize: 22, fontWeight: 'normal' }
  };

  window.COLOR_PALETTES = {
    ocean_breeze: { primary: '#0ea5e9', secondary: '#38bdf8', accent: '#0284c7', bg: '#f0f9ff', text: '#0c4a6e', border: '#bae6fd' },
    forest_canopy: { primary: '#22c55e', secondary: '#4ade80', accent: '#16a34a', bg: '#f0fdf4', text: '#14532d', border: '#bbf7d0' },
    sunset_glow: { primary: '#f97316', secondary: '#fb923c', accent: '#ea580c', bg: '#fff7ed', text: '#9a3412', border: '#fed7aa' },
    royal_purple: { primary: '#8b5cf6', secondary: '#a78bfa', accent: '#7c3aed', bg: '#f5f3ff', text: '#4c1d95', border: '#ddd6fe' },
    rose_garden: { primary: '#e11d48', secondary: '#f472b6', accent: '#be123c', bg: '#fff1f2', text: '#9f1239', border: '#fecdd3' },
    golden_hour: { primary: '#f59e0b', secondary: '#fbbf24', accent: '#d97706', bg: '#fffbeb', text: '#78350f', border: '#fde68a' },
    midnight_sky: { primary: '#6366f1', secondary: '#818cf8', accent: '#4f46e5', bg: '#0f172a', text: '#e2e8f0', border: '#1e293b' },
    arctic_frost: { primary: '#06b6d4', secondary: '#22d3ee', accent: '#0891b2', bg: '#ecfeff', text: '#164e63', border: '#a5f3fc' },
    autumn_leaves: { primary: '#dc2626', secondary: '#f87171', accent: '#b91c1c', bg: '#fef2f2', text: '#7f1d1d', border: '#fecaca' },
    spring_bloom: { primary: '#ec4899', secondary: '#f472b6', accent: '#db2777', bg: '#fdf2f8', text: '#831843', border: '#fbcfe8' },
    earth_tones: { primary: '#a16207', secondary: '#ca8a04', accent: '#854d0e', bg: '#fefce8', text: '#713f12', border: '#fde047' },
    slate_gray: { primary: '#64748b', secondary: '#94a3b8', accent: '#475569', bg: '#f8fafc', text: '#0f172a', border: '#cbd5e1' },
    neon_nights: { primary: '#39ff14', secondary: '#00ffff', accent: '#ff00ff', bg: '#0a0a0f', text: '#39ff14', border: '#1a1a2e' },
    vintage_parchment: { primary: '#8d6e63', secondary: '#a1887f', accent: '#6d4c41', bg: '#f5e6c8', text: '#4e342e', border: '#d4b896' },
    pastel_dream: { primary: '#f9a8d4', secondary: '#fbcfe8', accent: '#f472b6', bg: '#fdf2f8', text: '#831843', border: '#fbcfe8' },
    monochrome: { primary: '#52525b', secondary: '#71717a', accent: '#3f3f46', bg: '#fafafa', text: '#18181b', border: '#e4e4e7' }
  };

  window.GRID_STYLE_CONFIGS = {
    classic: { cellBorder: '1px solid #e5e7eb', cellBg: '#ffffff', hoverBg: 'rgba(99,102,241,0.08)', solutionBg: '#dbeafe', solutionBorder: '#3b82f6', foundBg: '#dcfce7', foundBorder: '#22c55e' },
    minimal: { cellBorder: 'none', cellBg: 'transparent', hoverBg: 'rgba(0,0,0,0.05)', solutionBg: '#f0f9ff', solutionBorder: 'none', foundBg: '#f0fdf4', foundBorder: 'none' },
    bold: { cellBorder: '2px solid #1f2937', cellBg: '#ffffff', hoverBg: 'rgba(99,102,241,0.1)', solutionBg: '#eff6ff', solutionBorder: '#2563eb', foundBg: '#dcfce7', foundBorder: '#16a34a' },
    checkered: { cellBorder: 'none', cellBg: '#ffffff', cellBgAlt: '#f3f4f6', hoverBg: 'rgba(99,102,241,0.08)', solutionBg: '#dbeafe', solutionBorder: 'none', foundBg: '#dcfce7', foundBorder: 'none' },
    dotted: { cellBorder: 'none', cellBg: 'transparent', hoverBg: 'rgba(0,0,0,0.05)', dotColor: '#9ca3af', dotSize: 2, solutionBg: '#f0f9ff', foundBg: '#f0fdf4' },
    rounded: { cellBorder: '1px solid #e5e7eb', cellBg: '#ffffff', borderRadius: '4px', hoverBg: 'rgba(99,102,241,0.08)', solutionBg: '#dbeafe', solutionBorder: '#3b82f6', foundBg: '#dcfce7', foundBorder: '#22c55e' },
    circular: { cellBorder: 'none', cellBg: '#ffffff', cellShape: 'circle', hoverBg: 'rgba(99,102,241,0.08)', solutionBg: '#dbeafe', solutionBorder: '#3b82f6', foundBg: '#dcfce7', foundBorder: '#22c55e' },
    shadow: { cellBorder: 'none', cellBg: '#ffffff', cellShadow: '0 1px 2px rgba(0,0,0,0.1)', hoverBg: 'rgba(99,102,241,0.08)', solutionBg: '#dbeafe', solutionBorder: 'none', foundBg: '#dcfce7', foundBorder: 'none' },
    neon: { cellBorder: '1px solid #1a1a2e', cellBg: '#0a0a0f', cellGlow: '0 0 5px rgba(57,255,20,0.3)', hoverBg: 'rgba(57,255,20,0.1)', solutionBg: '#0f172a', solutionBorder: '#39ff14', foundBg: '#0f172a', foundBorder: '#00ffff' },
    vintage: { cellBorder: '1px solid #d4b896', cellBg: '#f5e6c8', hoverBg: 'rgba(141,110,99,0.1)', solutionBg: '#efebe9', solutionBorder: '#8d6e63', foundBg: '#e8f5e9', foundBorder: '#66bb6a' }
  };

  window.DIFFICULTY_PRESETS = {
    easy: { directions: ['right', 'down'], allowDiagonal: false, allowReverse: false, overlap: 'matchOnly', fillerMode: 'random', wordLengthMin: 3, wordLengthMax: 8, gridDensity: 0.4 },
    medium: { directions: ['right', 'down', 'left', 'up'], allowDiagonal: true, allowReverse: false, overlap: 'matchOnly', fillerMode: 'random', wordLengthMin: 4, wordLengthMax: 12, gridDensity: 0.5 },
    hard: { directions: ['right', 'down', 'left', 'up', 'diag-right', 'diag-down'], allowDiagonal: true, allowReverse: true, overlap: 'matchOnly', fillerMode: 'frequency', wordLengthMin: 5, wordLengthMax: 14, gridDensity: 0.6 },
    expert: { directions: ['right', 'down', 'left', 'up', 'diag-right', 'diag-down', 'diag-left', 'diag-up'], allowDiagonal: true, allowReverse: true, overlap: 'crossAllowed', fillerMode: 'wordlistOnly', wordLengthMin: 6, wordLengthMax: 16, gridDensity: 0.7 },
    extreme: { directions: ['right', 'down', 'left', 'up', 'diag-right', 'diag-down', 'diag-left', 'diag-up'], allowDiagonal: true, allowReverse: true, overlap: 'maximizeCrossings', fillerMode: 'custom', wordLengthMin: 8, wordLengthMax: 20, gridDensity: 0.8 }
  };

  window.ANIMATION_PRESETS = {
    none: { duration: 0, easing: 'linear', delay: 0 },
    fast: { duration: 150, easing: 'ease-out', delay: 0 },
    normal: { duration: 300, easing: 'ease-in-out', delay: 0 },
    slow: { duration: 500, easing: 'ease-in-out', delay: 0 },
    bounce: { duration: 500, easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', delay: 0 },
    elastic: { duration: 800, easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', delay: 0 },
    stagger: { duration: 300, easing: 'ease-out', delay: 50, staggerAmount: 50 }
  };

  window.EXPORT_FORMATS = {
    pdf: { extension: '.pdf', mimeType: 'application/pdf', icon: '\ud83d\udcc4', description: 'Portable Document Format' },
    png: { extension: '.png', mimeType: 'image/png', icon: '\ud83d\uddbc\ufe0f', description: 'Portable Network Graphics' },
    svg: { extension: '.svg', mimeType: 'image/svg+xml', icon: '\ud83c\udfa8', description: 'Scalable Vector Graphics' },
    json: { extension: '.json', mimeType: 'application/json', icon: '\ud83d\udcca', description: 'JavaScript Object Notation' },
    csv: { extension: '.csv', mimeType: 'text/csv', icon: '\ud83d\udccb', description: 'Comma-Separated Values' },
    txt: { extension: '.txt', mimeType: 'text/plain', icon: '\ud83d\udcdd', description: 'Plain Text' },
    html: { extension: '.html', mimeType: 'text/html', icon: '\ud83c\udf10', description: 'HyperText Markup Language' },
    xml: { extension: '.xml', mimeType: 'application/xml', icon: '\ud83d\udcc4', description: 'Extensible Markup Language' }
  };

  window.PAGE_LAYOUTS = {
    single_puzzle: { name: 'Single Puzzle', description: 'One puzzle per page', puzzlesPerPage: 1, showWordList: true, showTitle: true, showPageNumber: true },
    double_puzzle: { name: 'Double Puzzle', description: 'Two puzzles per page', puzzlesPerPage: 2, showWordList: true, showTitle: false, showPageNumber: true },
    puzzle_only: { name: 'Puzzle Only', description: 'Puzzle without word list', puzzlesPerPage: 1, showWordList: false, showTitle: false, showPageNumber: false },
    puzzle_with_solutions: { name: 'Puzzle + Solutions', description: 'Puzzle and solution on same page', puzzlesPerPage: 1, showWordList: true, showTitle: true, showPageNumber: true, showSolutions: true },
    word_list_only: { name: 'Word List Only', description: 'Just the word list', puzzlesPerPage: 0, showWordList: true, showTitle: true, showPageNumber: true },
    title_page: { name: 'Title Page', description: 'Book title page', puzzlesPerPage: 0, showWordList: false, showTitle: true, showPageNumber: false },
    copyright_page: { name: 'Copyright Page', description: 'Copyright information', puzzlesPerPage: 0, showWordList: false, showTitle: false, showPageNumber: false },
    table_of_contents: { name: 'Table of Contents', description: 'List of all puzzles', puzzlesPerPage: 0, showWordList: false, showTitle: true, showPageNumber: false },
    answer_key: { name: 'Answer Key', description: 'Solutions for all puzzles', puzzlesPerPage: 4, showWordList: false, showTitle: false, showPageNumber: true, showSolutions: true }
  };

  window.ACCESSIBILITY_PRESETS = {
    standard: { fontSize: 14, contrast: 'normal', spacing: 'normal', highlightFound: true, screenReaderLabels: true },
    large_text: { fontSize: 20, contrast: 'high', spacing: 'relaxed', highlightFound: true, screenReaderLabels: true },
    high_contrast: { fontSize: 14, contrast: 'maximum', spacing: 'normal', highlightFound: true, screenReaderLabels: true },
    dyslexia_friendly: { fontSize: 16, contrast: 'high', spacing: 'relaxed', highlightFound: true, screenReaderLabels: true, font: 'OpenDyslexic' },
    low_vision: { fontSize: 24, contrast: 'maximum', spacing: 'relaxed', highlightFound: true, screenReaderLabels: true },
    minimal: { fontSize: 12, contrast: 'normal', spacing: 'compact', highlightFound: false, screenReaderLabels: false }
  };

  window.PuzzleEngines={
    wordsearch:{
      generate:function(cfg){
        return window.WordSearchEngine?window.WordSearchEngine.generate(cfg):{grid:[],mask:[],placements:{},rows:cfg.rows,cols:cfg.cols};
      }
    },
    crossword:{
      generate:function(cfg){
        return window.CrosswordEngine?window.CrosswordEngine.generate(cfg):{grid:[],mask:[],placements:{},rows:cfg.rows,cols:cfg.cols};
      }
    },
    wordfill:{
      generate:function(cfg){
        return window.WordFillEngine?window.WordFillEngine.generate(cfg):{grid:[],mask:[],placements:{},rows:cfg.rows,cols:cfg.cols};
      }
    }
  };

  window.THEMES=window.THEMES||{
    night:{n:'Night',c:'#6c63ff'},
    day:{n:'Day',c:'#3b82f6'},
    cyber:{n:'Cyber',c:'#ff003c'},
    forest:{n:'Forest',c:'#10b981'},
    gold:{n:'Gold',c:'#fbbf24'},
    rose:{n:'Rose',c:'#e11d48'},
    midnight:{n:'Midnight',c:'#4f46e5'},
    lavender:{n:'Lavender',c:'#8b5cf6'}
  };

  window.WORD_BANKS=(()=>{
    const C=[];
    function add(n,w){C.push({n:n,w:w.slice(0,120)})}
    add('Space',['STAR','MOON','PLANET','GALAXY','COMET','NEBULA','ROCKET','ASTEROID','COSMOS','METEOR','ORBIT','VOID','QUASAR','PULSAR','NOVA','DARK','SOLAR','LUNAR','ECLIPSE','SATELLITE','MARS','VENUS','JUPITER','SATURN','URANUS','NEPTUNE','MERCURY','PLUTO','METEORITE','CONSTELLATION','AURORA','STARDUST','SUPERNOVA','BIGBANG','WORMHOLE','BLACKHOLE','LIGHTYEAR','TELESCOPE','ASTRONAUT','LAUNCH','MISSION','ORBITER','LANDER','ROVER','CAPSULE','DOCKING','THRUSTER','BOOSTER','PROPELLANT','LAUNCHPAD','COUNTDOWN','SOLARFLARE','CORONA','FLARE','SUNSPOT','RADIATION','MAGNETIC','FIELD','GRAVITY','CELESTIAL','INTERSTELLAR','ASTROPHYSICS','OBSERVATORY','DOME','REFLECTOR','REFRACTOR','EYEPIECE','FOCUS','ALIGNMENT','NAVIGATION','AZIMUTH','ZENITH','NADIR','HORIZON','EQUATOR','MERIDIAN','LATITUDE','LONGITUDE','ORBITING','APOGEE','PERIGEE','SYZYGY','TRANSIT','OCCULTATION','CONJUNCTION','OPPOSITION','ELONGATION','PHASE','WANING','WAXING','GIBBOUS','CRESCENT','HALF','FULL','DARK','NEW','BRIGHT','DIM']);
    add('Jungle',['TIGER','MONKEY','PARROT','VINE','CANOPY','SNAKE','FERN','ORCHID','BAMBOO','RAIN','FRUIT','LEAF','JAGUAR','TOUCAN','SLOTH','CHIMPANZEE','GORILLA','OKAPI','ANACONDA','BOA','TARANTULA','SCORPION','BUTTERFLY','BEETLE','ANT','TERMITE','MOSQUITO','DRAGONFLY','HUMMINGBIRD','MACAW','PIRANHA','CAIMAN','FROG','TOAD','TREE','PALM','MAHOGANY','EBONY','MOSS','LICHEN','FUNGUS','MUSHROOM','BLOOM','PETAL','POLLEN','NECTAR','TENDRIL','ROOT','TRUNK','BRANCH','SPROUT','SEEDLING','BROMELIAD','HELICONIA','PASSIONFLOWER','MANGROVE','SWAMP','MARSH','BOG','RIVER','STREAM','CREEK','WATERFALL','RAPIDS','POOL','LAGOON','DELTA','FLOODPLAIN','HABITAT','ECOSYSTEM','BIOME','DENSE','LUSH','TROPICAL','EQUATORIAL','HUMID','MISTY','FOGGY','CLOUD','FOREST','RAINFOREST','JUNGLE','WILDERNESS','EXPEDITION','TREK','TRAIL','PATH','RIDGE','PEAK','SUMMIT','VALLEY','GORGE','CAVE','GROTTO','HOLLOW']);
    add('Desert',['CACTUS','DUNE','CAMEL','OASIS','SCORPION','SAND','HEAT','SUN','VULTURE','MIRAGE','NOMAD','PLATEAU','ARID','DUST','PALM','LIZARD','RATTLESNAKE','COYOTE','ROADRUNNER','JACKRABBIT','KANGAROO','RAT','BAT','HAWK','EAGLE','FALCON','BUZZARD','TARANTULA','BEETLE','ANT','WASP','SANDSTORM','SUNSCORCHED','BARREN','WASTELAND','DRY','PARCHED','THIRST','WATER','SPRING','WELL','WADI','CANYON','MESA','BUTTE','CLIFF','ROCK','STONE','BOULDER','GRAVEL','PEBBLE','SILICA','QUARTZ','FELDSPAR','GRANITE','BASALT','LAVA','MAGMA','VOLCANO','CRATER','CALDERA','FISSURE','VENT','GEYSER','HOTSPRING','MINERAL','SALT','GYPSUM','CALICHE','HARDENED','ERODED','WEATHERED','WIND','BLAST','GUST','GALE','WHIRLWIND','DEVIL','TURBULENCE','THERMAL','UPDRAFT','DOWNDRAFT','DROUGHT','FAMINE','SCARCITY','SURVIVAL','ADAPTATION','RESILIENCE','ENDURANCE','PATIENCE','WISDOM','ANCIENT','PRIMITIVE','RAW','WILD','FREE','ROUGH','TOUGH','HARSH','SEVERE','EXTREME']);
    add('Winter',['SNOW','ICE','FROST','GLACIER','ARCTIC','POLAR','SLED','SKI','FLAKE','IGLOO','PENGUIN','TUNDRA','CHILL','BOREAL','STORM','BLIZZARD','FREEZE','HAIL','SLEET','WINTRY','COLD','FRIGID','GELID','CRYSTAL','SNOWBALL','SNOWMAN','SCARF','MITTEN','COAT','BOOT','THERMAL','FROSTBITE','HIBERNATE','MIGRATE','SHIVER','TREMBLE','NUMB','FROZEN','SOLID','BRITTLE','SLIPPERY','SHEET','FLOE','BERG','CAP','FIELD','PACK','DRILL','CORE','AGE','TERMINAL','FJORD','GLACIAL','MORAINE','CREVASSE','SERAC','BERGSCHRUND','ALPINE','SNOWLINE','TIMBERLINE','PERMAFROST','TAIGA','BOREAL','CONIFER','SPRUCE','PINE','FIR','CEDAR','LARCH','HEMLOCK','BALSAM','NEEDLE','CONE','BARK','SAP','RESIN','EVERGREEN','WITHERED','BARE','DORMANT','SILENT','STILL','PURE','WHITE','PALE','FAINT','MUTED','MUFFLED','BLANKET','COVER','SHROUD','VEIL','MANTLE','LAYER','DUST','POWDER','FLUFFY','CRUNCHY','CLEAR','CRISP','BITING','RAW']);
    add('Spring',['FLOWER','BLOOM','TULIP','DAFFODIL','LILAC','BLOSSOM','PETAL','POLLEN','BEE','BUTTERFLY','BIRD','NEST','EGG','HATCH','CHIRP','MELT','THAW','SHOWER','RAINBOW','FRESH','GREEN','GROW','PLANT','SEED','SPROUT','BUD','LEAF','GRASS','MEADOW','FIELD','PARK','GARDEN','ORCHARD','FARM','BARN','HEN','CHICK','LAMB','CALF','FOAL','KITTEN','PUPPY','CUB','FAWN','BUNNY','DUCKLING','GOSLING','CYGNET','TADPOLE','FRY','SMOLT','PARR','SPAWN','HATCHLING','NESTLING','FLEDGLING','BROOD','CLUTCH','LITTER','DEN','LAIR','BURROW','WARREN','HIVE','COLONY','SWARM','FLOCK','HERD','PACK','SCHOOL','SHOAL','BED','BANK','THICKET','COPSE','GROVE','STAND','CLUMP','TUFTS','VERNAL','EQUAL','LIGHT','WARM','GENTLE','SOFT','MILD','BALMY','FRAGRANT','SWEET','CLEAN','PURE','NEW','YOUNG','TENDER','DELICATE','FRESH','VIVID','BRIGHT','GOLDEN','LUMINOUS','RADIANT','GLOWING','SHINING']);
    add('Summer',['BEACH','SUN','SAND','WAVE','SURF','SWIM','POOL','LAKE','RIVER','OCEAN','SEA','SHORE','COAST','TIDE','SUNSET','DAWN','HEAT','WARM','HOT','BLAZE','RADIANT','SOLAR','RAY','BEAM','GLARE','GLINT','GLOW','BASK','SOAK','TAN','BURN','SCORCH','MELT','DRIP','SWEAT','DEW','MIST','FOG','HUMID','MUGGY','SUFFOCATE','BREEZE','WIND','GUST','COOL','REFRESH','BATHE','WADE','DIP','DIVE','SPLASH','PADDLE','FLOAT','DRIFT','GLIDE','SKIM','SKIP','BOUNCE','RICOCHET','DEFLECT','REFLECT','SHIMMER','SPARKLE','TWINKLE','GLEAM','SHINE','GLOSS','SHEEN','LUSTER','PATINA','VERDIGRIS','FADED','BLEACHED','SUNBLEACHED','SANDY','GRITTY','GRAINY','COARSE','FINE','SOFT','SMOOTH','SILKY','SATIN','VELVET','LINEN','COTTON','LIGHT','AIRY','FLOWING','LOOSE','CASUAL','LEISURE','LOUNGE','LAZE','IDLE','REST','RELAX','UNWIND','DECHILL']);
    add('Autumn',['LEAF','FALL','OAK','MAPLE','BIRCH','RED','GOLD','ORANGE','BROWN','AMBER','CRIMSON','SCARLET','RUST','COPPER','BRONZE','YELLOW','GOLDEN','HARVEST','PUMPKIN','SQUASH','GOURD','CORN','HAY','STRAW','WHEAT','OATS','BARLEY','RYE','MILLET','SORGHUM','ACORN','NUT','SEED','BERRY','HAW','ROSEHIP','SLOE','CRABAPPLE','QUINCE','MEDLAR','FIG','DATE','GRAPE','APPLE','PEAR','PLUM','DAMSON','GREENGAGE','BULLACE','MUSHROOM','TOADSTOOL','FUNGUS','MOLD','MILDEW','ROT','DECAY','DECOMPOSE','WITHER','SHRIVEL','CRISP','DRY','BROWN','DUN','DULL','MATTE','FLAT','EARTHY','WOODY','MUSKY','PUNGENT','SMOKY','SMOLDERING','EMBER','ASH','SOOT','CHAR','KINDLE','IGNITE','FLAME','FIRE','BLAZE','GLOW','RADIATE','WARMTH','HEAT','COZY','SNUG','COMFORT','HARVEST','PLENTY','BOUNTY','ABUNDANCE','FEAST','FESTIVAL','CELEBRATE','JOY','GRATEFUL','THANKFUL']);
    add('Weather',['CLOUD','RAIN','STORM','WIND','SUN','SNOW','FOG','MIST','HAIL','SLEET','THUNDER','LIGHTNING','FLASH','BOOM','CRACK','RUMBLE','GUST','GALE','HURRICANE','CYCLONE','TYPHOON','TORNADO','TWISTER','VORTEX','WHIRLWIND','DUSTDEVIL','MONSOON','DRIZZLE','SHOWER','DOWNPOUR','DELUGE','TORRENT','FLOOD','OVERFLOW','DELTA','WET','DAMP','MOIST','HUMID','DEW','FROST','ICE','FREEZE','CHILL','COLD','COOL','MILD','WARM','HOT','SCORCH','BLAZE','HEATWAVE','CLEAR','FAIR','FINE','BRIGHT','SUNNY','PARTLY','OVERCAST','DULL','GLOOMY','DARK','MENACE','THREATEN','BREW','APPROACH','ADVANCE','SWEEP','ENGULF','CONSUME','RAGE','HOWL','SHRIEK','SCREAM','WHISPER','SIGH','MURMUR','RUSTLE','RATTLE','DRUM','PELT','STING','BITE','PRICKLE','PENETRATE','SOAK','DRENCH','SATURATE','SWELL','SURGE','RECEDE','RETREAT','LULL','CALM','STILL','PEACE','QUIET','SERENE']);
    add('Pets',['DOG','CAT','FISH','BIRD','HAMSTER','GERBIL','RABBIT','GUINEA','PIG','RAT','MOUSE','FERRET','HEDGEHOG','CHINCHILLA','DEGU','PARROT','BUDGIE','COCKATIEL','CANARY','FINCH','LOVEBIRD','PARAKEET','MACAW','AFRICAN','GREY','AMAZON','CONURE','ARATINGA','KAKA','LORY','LORIKET','SNAKE','LIZARD','GECKO','CHAMELEON','IGUANA','SKINK','BEARDED','DRAGON','LEOPARD','TURTLE','TORTOISE','TERRAPIN','NEWT','SALAMANDER','AXOLOTL','FROG','TOAD','TARANTULA','SCORPION','CRAB','HERMIT','SHRIMP','SNAIL','PYTHON','BOA','MILK','KING','CORN','BALL','WATER','GARTER','RACER','WHIPSNAKE','HOGNOSE','MILKSNAKE','RATTLESNAKE','VIPER','COBRA','MAMBA','KRAIT','TAIPAN','ADDER','CONSTRICTOR','ANACONDA','RETICULATED','BURMESE','BLOOD','CARPET','DIAMOND','TREE','GREEN','EMERALD','WOMA','BLACK','MULGA','DEATH','TIGER','BROWN','EASTERN','WESTERN','INLAND','COPPERHEAD','COTTONMOUTH','MOCCASIN','RATTLER','DIAMONDBACK','SIDEWINDER']);

    if(window.MXD_WORD_BANKS){
      window.MXD_WORD_BANKS.forEach(function(bank){
        C.push({n:bank.n, w:bank.w.slice(0,120)});
      });
    }

    return C;
  })();

  window.AI_THEMES={};
  window.WORD_BANKS.forEach(function(b){window.AI_THEMES[b.n]=b.w});
  window.AI_THEMES['Dragon']=['DRAGON','FIRE','SCALES','WINGS','GOLD','LEGEND','MYTH','TAIL','CLAWS','BREATH','MAGIC','POWER','FIERCE','HOARD','FLAME','DANGER','SCORCH','SMOKE','ASHES','BLAZE','EMBER','FLARE','SPARK','BURN','HEAT','LAVA','MOLTEN','FORGE','ANVIL','SMITH','ORE','STEEL','IRON','SWORD','SHIELD','ARMOR','CROWN','THRONE','KING','QUEEN','KNIGHT','CASTLE','TOWER','WALL','MOAT','WYRM','SERPENT','VIPER','COBRA','FANG','VENOM','POISON','SCALE','HIDE','LEATHER','BONE','SKULL','HORN','WING','FEATHER','TALON','CLAW','PAW','BEAST','MONSTER','GIANT','TITAN','DEMON','DEVIL','HELL','ABYSS','VOID','SHADOW','DARK','NIGHT','MOON','STAR','SKY','STORM','THUNDER','LIGHTNING','RAIN','CLOUD','WIND','GALE','HURRICANE','CYCLONE','TEMPEST','VOLCANO','EARTHQUAKE','TREMOR','RUMBLE','CRASH','ROAR','BATTLE','WARRIOR','BRAVE','HERO','LEGEND','SAGA','EPIC','TALE'];
  window.AI_THEMES['Ocean']=['SHARK','WHALE','CORAL','ABYSS','CURRENT','TIDE','TRIDENT','SHELL','PEARL','DOLPHIN','REEF','WAVES','DEPTHS','SURGE','OCTOPUS','SQUID','JELLYFISH','STINGRAY','SEAHORSE','ANEMONE','KELP','SEAWEED','PLANKTON','BARNACLE','CRAB','LOBSTER','SHRIMP','CLAM','OYSTER','SCALLOP','MUSSEL','STARFISH','URCHIN','CRINOID','SPONGE','ANGELFISH','TANG','CLOWNFISH','GROUPER','SNAPPER','MACKEREL','TUNA','SALMON','TROUT','HERRING','SARDINE','ANCHOVY','BARRACUDA','MARLIN','SWORDFISH','SAILFISH','TARPON','BONITO','HADDOCK','COD','FLOUNDER','SOLE','HALIBUT','MANTA','RAY','SEAL','WALRUS','OTTER','PENGUIN','ALBATROSS','PETREL','GULL','TERN','PELICAN','HERON','CRANE','STORK','FLAMINGO','PORPOISE','SPERM','BLUE','HUMPBACK','ORCA','BELUGA','NARWHAL','MANATEE','DUGONG','TURTLE','SNAPPING','SEA','SALT','BRINE','WATER','WET','DEEP','AQUA','TEAL','AZURE','CERULEAN','MARITIME','NAUTICAL','SAILOR','CAPTAIN','PIRATE','BUCCANEER','CORSAR'];
  window.AI_THEMES['Food']=['PIZZA','PASTA','BURGER','SALAD','SUSHI','TACO','BURRITO','QUESADILLA','NACHOS','GUACAMOLE','SALSA','DIP','CHEESE','BACON','EGGS','PANCAKE','WAFFLE','TOAST','BAGEL','DONUT','CROISSANT','MUFFIN','COOKIE','BROWNIE','CAKE','PIE','TART','CUPCAKE','ICING','FROSTING','CREAM','CUSTARD','PUDDING','JELLO','GELATO','SORBET','MILK','CHOCOLATE','CANDY','LOLLIPOP','GUMDROP','LICORICE','MARSHMALLOW','CARAMEL','TOFFEE','FUDGE','TRUFFLE','NUT','ALMOND','WALNUT','PECAN','CASHEW','PEANUT','PISTACHIO','MACADAMIA','HAZELNUT','CHESTNUT','COCONUT','MANGO','PINEAPPLE','BANANA','APPLE','ORANGE','GRAPE','LEMON','LIME','CHERRY','PEACH','PLUM','PEAR','APRICOT','NECTARINE','WATERMELON','CANTALOUPE','HONEYDEW','BERRY','STRAWBERRY','BLUEBERRY','RASPBERRY','BLACKBERRY','CRANBERRY','GOOSEBERRY','CURRANT','FIG','DATE','PRUNE','RAISIN','OLIVE','POTATO','CARROT','BROCCOLI','SPINACH','KALE','LETTUCE','CABBAGE','CAULIFLOWER','BELL','PEPPER','ONION','GARLIC','GINGER','TURMERIC','CINNAMON','VANILLA','PEPPERMINT'];
  window.AI_THEMES['Sports']=['SOCCER','FOOTBALL','BASKETBALL','BASEBALL','TENNIS','GOLF','HOCKEY','CRICKET','VOLLEYBALL','RUGBY','BADMINTON','TABLE','PINGPONG','RACQUETBALL','SQUASH','HANDBALL','LACROSSE','FIELD','TRACK','RUNNING','SPRINT','MARATHON','JOGGING','WALKING','HIKING','SWIMMING','DIVING','SURFING','SAILING','ROWING','KAYAKING','CANOEING','RAFTING','SKIING','SNOWBOARD','SKATING','CURLING','BOBSLED','LUGE','SKELETON','BIATHLON','TRIATHLON','CYCLING','MOUNTAIN','ROAD','BMX','BOXING','KARATE','JUDO','TAEKWONDO','KICKBOXING','WRESTLING','SUMOU','FENCING','ARCHERY','SHOOTING','HUNTING','FISHING','CLIMBING','BOULDERING','YOGA','PILATES','GYMNASTICS','DANCE','BALLET','CHEERLEADING','SKATEBOARD','ROLLERBLADE','SCOOTER','PARKOUR','FREERUNNING','WEIGHT','POWERLIFTING','BODYBUILDING','CROSSFIT','CALISTHENICS','PUSHUP','SITUP','SQUAT','DEADLIFT','BENCH','PRESS','DUMBBELL','BARBELL','KETTLEBELL','JUMP','ROPE','PLANK','LUNGE','BURPEE','CLIMBER','STRETCH','WARMUP','COOLDOWN','CARDIO','AEROBIC','ZUMBA','SPIN','CYCLE','ELLIPTICAL','TREADMILL','STADIUM','ARENA','COURT','GYM','POOL','RINK','RING','MAT','DOJO'];
  window.AI_THEMES['Science']=['ATOM','MOLECULE','ELEMENT','PROTON','NEUTRON','ELECTRON','NUCLEUS','QUANTUM','PHOTON','GRAVITY','ENERGY','FORCE','VELOCITY','ACCELERATE','MOMENTUM','FRICTION','INERTIA','MASS','WEIGHT','DENSITY','VOLUME','PRESSURE','TEMPERATURE','HEAT','COLD','CELSIUS','FAHRENHEIT','KELVIN','ENTROPY','THERMODYNAMIC','ELECTRIC','CURRENT','VOLTAGE','RESISTANCE','CAPACITOR','INDUCTOR','DIODE','TRANSISTOR','CIRCUIT','BATTERY','SOLAR','WIND','NUCLEAR','FISSION','FUSION','PLASMA','GAS','LIQUID','SOLID','STATE','MATTER','COMPOUND','MIXTURE','ALLOY','ACID','BASE','PH','CATALYST','ENZYME','REACTION','OXIDATION','REDUCTION','BOND','COVALENT','IONIC','HYDROGEN','OXYGEN','CARBON','NITROGEN','SULFUR','PHOSPHORUS','CALCIUM','SODIUM','POTASSIUM','IRON','COPPER','ZINC','SILVER','GOLD','PLATINUM','MERCURY','LEAD','TIN','ALUMINUM','SILICON','CHLORINE','FLUORINE','BROMINE','IODINE','HELIUM','NEON','ARGON','KRYPTON','XENON','RADIUM','URANIUM','PLUTONIUM','LASER','ROBOT','AUTOMATION','MACHINE','ENGINE','MOTOR','GENERATOR','TURBINE','PUMP','VALVE','PISTON','LEVER','PULLEY','GEAR','SPRING','WHEEL','AXLE','CAM','CRANK'];
  window.AI_THEMES['Music']=['GUITAR','PIANO','DRUMS','BASS','VIOLIN','CELLO','VIOLA','FLUTE','CLARINET','OBOE','BASSOON','SAXOPHONE','TRUMPET','TROMBONE','FRENCH','HORN','TUBA','HARP','XYLOPHONE','MARIMBA','VIBRAPHONE','GLOCKENSPIEL','ACCORDION','ORGAN','SYNTHESIZER','KEYBOARD','HARMONICA','BANJO','MANDOLIN','UKULELE','SITAR','BAGPIPE','HARMONY','MELODY','RHYTHM','TEMPO','SCALE','MODE','KEY','CHORD','TRIAD','SEVENTH','NINTH','ARPEGGIO','CADENCE','BRIDGE','CHORUS','VERSE','INTRO','OUTRO','CODA','SOLO','DUET','TRIO','QUARTET','ENSEMBLE','ORCHESTRA','BAND','CONDUCTOR','COMPOSER','MAESTRO','DIRECTOR','NOTATION','STAFF','CLEF','TREBLE','ALTO','SOPRANO','TENOR','BARITONE','DYNAMIC','FORTE','CRESCENDO','DIMINUENDO','STACCATO','LEGATO','TREMOLO','VIBRATO','GLISSANDO','PORTAMENTO','IMPROVISE','JAZZ','BLUES','CLASSICAL','ROCK','POP','FUNK','SOUL','REGGAE','COUNTRY','FOLK','BLUEGRASS','LATIN','SALSA','SAMBA','BOSSA','NOVA','TANGO','FLAMENCO','CALYPSO','ZYDECO'];

  window.TEMPLATES={
    classic:{n:'Classic',bg:'#ffffff',tc:'#2d2d44',cc:'#2d2d44',ac:'#6c63ff',ff:'Inter,monospace',gridLines:true,gridBorder:true,colorMode:'color',pillBg:'#f3f0ff',pillColor:'#4a3d8f',cellTextColor:'#2d2d44'},
    dark_slate:{n:'Dark Slate',bg:'#1e293b',tc:'#f1f5f9',cc:'#f1f5f9',ac:'#8b5cf6',ff:'Inter,monospace',gridLines:true,gridBorder:false,colorMode:'dark',pillBg:'#334155',pillColor:'#e2e8f0',cellTextColor:'#f1f5f9'},
    cyber:{n:'Cyber',bg:'#0a0a0a',tc:'#00ff41',cc:'#00ff41',ac:'#ff003c',ff:'Courier New,monospace',gridLines:true,gridBorder:false,colorMode:'bw',pillBg:'#1a1a1a',pillColor:'#00ff41',cellTextColor:'#00ff41'},
    newspaper:{n:'Newspaper',bg:'#fefce8',tc:'#1c1917',cc:'#1c1917',ac:'#78716c',ff:'Georgia,serif',gridLines:true,gridBorder:true,colorMode:'bw',pillBg:'#fef3c7',pillColor:'#44403c',cellTextColor:'#1c1917'}
  };

  window.WordSearchEngine=window.WordSearchEngine||{
    generate:function(cfg){
      var rows=cfg.rows||25,cols=cfg.cols||25;
      var words=cfg.words||[];
      var grid=[],mask=[],placements={};
      for(var r=0;r<rows;r++){grid[r]=[];mask[r]=[];for(var c=0;c<cols;c++){grid[r][c]='.';mask[r][c]=true;}}
      var dirs=[[0,1],[1,0],[1,1],[1,-1],[0,-1],[-1,0],[-1,-1],[-1,1]];
      for(var wi=0;wi<words.length;wi++){
        var word=words[wi].toUpperCase();
        var placed=false,attempts=0;
        while(!placed&&attempts<200){
          attempts++;
          var d=dirs[Math.floor(Math.random()*dirs.length)];
          if(!cfg.allowDiag&&(d[0]!==0&&d[1]!==0))continue;
          if(!cfg.allowReverse&&(d[0]<0||d[1]<0))continue;
          if(!cfg.allowH&&d[1]!==0)continue;
          if(!cfg.allowV&&d[0]!==0)continue;
          var sr=Math.floor(Math.random()*rows),sc=Math.floor(Math.random()*cols);
          var er=sr+d[0]*(word.length-1),ec=sc+d[1]*(word.length-1);
          if(er<0||er>=rows||ec<0||ec>=cols)continue;
          var ok=true,cells=[];
          for(var i=0;i<word.length;i++){
            var rr=sr+d[0]*i,cc=sc+d[1]*i;
            if(grid[rr][cc]!=='.'&&grid[rr][cc]!==word[i]){ok=false;break;}
            cells.push([rr,cc]);
          }
          if(ok){
            for(var i=0;i<word.length;i++){grid[cells[i][0]][cells[i][1]]=word[i];}
            placements[word]=cells;placed=true;
          }
        }
      }
      var alpha='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      for(var r=0;r<rows;r++)for(var c=0;c<cols;c++)if(grid[r][c]==='.')grid[r][c]=alpha[Math.floor(Math.random()*26)];
      return{grid:grid,mask:mask,placements:placements,rows:rows,cols:cols};
    }
  };

  window.PdfExport=window.PdfExport||{
    generate:function(puzzles,cfg,onProgress){
      if(onProgress)onProgress(0,1,'PDF export not available - using print dialog');
      window.print();
      return Promise.resolve();
    }
  };

  console.log('[MXD Data Registry] Loaded');
})();
