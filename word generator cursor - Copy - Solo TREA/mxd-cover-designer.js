/**
 * MXD Designer v3.0 — Professional KDP Cover Design Studio
 * =========================================================
 * Features: Canvas engine, zoom/pan, layers, undo/redo, drag-drop,
 * typography, images, graphics, AI, 3D mockups, KDP compliance, export.
 * Works 100% offline via file://.
 */
(function(){
  'use strict';

  var DPI = 300, MAX_UNDO = 50, AUTO_SAVE_MS = 30000;

  /* ===== KDP DIMENSION CALCULATOR ===== */
  var KDP = {
    paperThickness: { 'white_bw': 0.002252, 'cream_bw': 0.0025, 'premium_color': 0.002347, 'standard_color': 0.002252 },
    MIN_PAGES: 24, MAX_PAGES: 830, MIN_SPINE_PAGES: 79,
    BLEED: 0.125, SAFE_TRIM: 0.125, SAFE_SPINE: 0.0625,
    BARCODE_W: 2.0, BARCODE_H: 1.2, BARCODE_MARGIN: 0.25,
    trimSizes: [
      {id:'5x8',w:5,h:8,label:'5" x 8"'},{id:'5.06x7.81',w:5.06,h:7.81,label:'5.06" x 7.81"'},
      {id:'5.25x8',w:5.25,h:8,label:'5.25" x 8"'},{id:'5.5x8.5',w:5.5,h:8.5,label:'5.5" x 8.5"'},
      {id:'6x9',w:6,h:9,label:'6" x 9"'},{id:'6.14x9.21',w:6.14,h:9.21,label:'6.14" x 9.21"'},
      {id:'6.69x9.61',w:6.69,h:9.61,label:'6.69" x 9.61"'},{id:'7x10',w:7,h:10,label:'7" x 10"'},
      {id:'7.44x9.69',w:7.44,h:9.69,label:'7.44" x 9.69"'},{id:'7.5x9.25',w:7.5,h:9.25,label:'7.5" x 9.25"'},
      {id:'8x10',w:8,h:10,label:'8" x 10"'},{id:'8.5x8.5',w:8.5,h:8.5,label:'8.5" x 8.5"'},
      {id:'8.5x11',w:8.5,h:11,label:'8.5" x 11"'}
    ],
    calculate: function(o) {
      var tw=o.trimW||6, th=o.trimH||9, pc=o.pageCount||100, pt=o.paperType||'white_bw';
      var err=[];
      if(pc<this.MIN_PAGES) err.push('Min '+this.MIN_PAGES+' pages');
      if(pc>this.MAX_PAGES) err.push('Max '+this.MAX_PAGES+' pages');
      if(pc%2!==0) err.push('Page count should be even');
      var sw=pc*(this.paperThickness[pt]||0.002252);
      var cw=this.BLEED+tw+sw+tw+this.BLEED, ch=this.BLEED+th+this.BLEED;
      return {errors:err,trimW:tw,trimH:th,pageCount:pc,paperType:pt,spineWidth:sw,
        spineTextAllowed:pc>=this.MIN_SPINE_PAGES&&sw>=0.5,coverW:cw,coverH:ch,
        pxW:Math.round(cw*DPI),pxH:Math.round(ch*DPI),
        backX:this.BLEED,backW:tw,spineX:this.BLEED+tw,spineW:sw,frontX:this.BLEED+tw+sw,frontW:tw,
        safeTop:this.BLEED+this.SAFE_TRIM,safeBottom:ch-this.BLEED-this.SAFE_TRIM,
        barcodeX:this.BLEED+tw-this.BARCODE_W-this.BARCODE_MARGIN,
        barcodeY:ch-this.BLEED-this.BARCODE_H-this.BARCODE_MARGIN,
        barcodeW:this.BARCODE_W,barcodeH:this.BARCODE_H};
    }
  };

  /* ===== UNDO/REDO ===== */
  function UndoMgr(max){this.stack=[];this.idx=-1;this.max=max||MAX_UNDO;}
  UndoMgr.prototype.push=function(s){if(this.idx<this.stack.length-1)this.stack=this.stack.slice(0,this.idx+1);this.stack.push(JSON.parse(JSON.stringify(s)));if(this.stack.length>this.max)this.stack.shift();this.idx=this.stack.length-1;};
  UndoMgr.prototype.undo=function(){if(this.idx>0){this.idx--;return JSON.parse(JSON.stringify(this.stack[this.idx]));}return null;};
  UndoMgr.prototype.redo=function(){if(this.idx<this.stack.length-1){this.idx++;return JSON.parse(JSON.stringify(this.stack[this.idx]));}return null;};
  UndoMgr.prototype.canUndo=function(){return this.idx>0;};
  UndoMgr.prototype.canRedo=function(){return this.idx<this.stack.length-1;};

  /* ===== COLOR UTILS ===== */
  var Color={
    hexToRgb:function(h){h=h.replace('#','');if(h.length===3)h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];return{r:parseInt(h.substring(0,2),16),g:parseInt(h.substring(2,4),16),b:parseInt(h.substring(4,6),16)};},
    rgbToHex:function(r,g,b){return'#'+[r,g,b].map(function(x){var h=Math.round(Math.max(0,Math.min(255,x))).toString(16);return h.length===1?'0'+h:h;}).join('');},
    hexToRgba:function(h,a){var c=this.hexToRgb(h);return'rgba('+c.r+','+c.g+','+c.b+','+(a||1)+')';},
    blend:function(h1,h2,t){var c1=this.hexToRgb(h1),c2=this.hexToRgb(h2);return this.rgbToHex(Math.round(c1.r+(c2.r-c1.r)*t),Math.round(c1.g+(c2.g-c1.g)*t),Math.round(c1.b+(c2.b-c1.b)*t));},
    contrast:function(h){var c=this.hexToRgb(h);var l=(0.299*c.r+0.587*c.g+0.114*c.b)/255;return l>0.5?'#000000':'#ffffff';},
    palettes:{warm:['#FF6B35','#F7C59F','#EFEFD0','#004E89','#1A659E'],cool:['#264653','#2A9D8F','#E9C46A','#F4A261','#E76F51'],vibrant:['#6C63FF','#FF6584','#43E97B','#FFD93D','#FF8C32'],earthy:['#606C38','#283618','#FEFAE0','#DDA15E','#BC6C25'],pastel:['#FFB5A7','#FCD5CE','#F8EDEB','#F9DCC4','#FEC89A'],dark:['#0D1B2A','#1B263B','#415A77','#778DA9','#E0E1DD'],jewel:['#9B2335','#EAB08C','#5C2751','#414288','#3594B1'],senior:['#E8601C','#FFB347','#FF6961','#77DD77','#AEC6CF'],kids:['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7']}
  };

  /* ===== FONT PAIRINGS ===== */
  var FontPairs=[
    {name:'Bold Modern',title:'Inter',body:'Inter',genre:'puzzle,nonfiction'},
    {name:'Classic Serif',title:'Georgia',body:'Arial',genre:'fiction,nonfiction'},
    {name:'Elegant Display',title:'Playfair Display',body:'Source Sans Pro',genre:'romance,fiction'},
    {name:'Condensed Bold',title:'Oswald',body:'Roboto',genre:'thriller,action'},
    {name:'Friendly Round',title:'Nunito',body:'Nunito',genre:'kids,education'},
    {name:'Clean Minimal',title:'Montserrat',body:'Open Sans',genre:'business,selfhelp'},
    {name:'Vintage Serif',title:'Merriweather',body:'Lato',genre:'history,biography'},
    {name:'Strong Impact',title:'Bebas Neue',body:'Raleway',genre:'thriller,sports'},
    {name:'Playful Script',title:'Pacifico',body:'Quicksand',genre:'romance,cozy'},
    {name:'Tech Mono',title:'Roboto Mono',body:'Roboto',genre:'scifi,tech'}
  ];

  /* ===== 200+ TEMPLATES ===== */
  function genTemplates(){
    var T=[],
    bases=[
      {n:'MEGA WORD SEARCH',b1:'#FF6B35',b2:'#FF8C42',tc:'#FFFFFF',ac:'#FFD93D',bd:'100 Puzzles',bdb:'#FFD93D',bdc:'#000000',tf:'Inter',ts:48,sf:'Inter',ss:24,af:'Inter',as:16,sg:true,so:0.15,st:'bold'},
      {n:'LARGE PRINT',b1:'#E8601C',b2:'#FFB347',tc:'#FFFFFF',ac:'#FF6961',bd:'Large Print',bdb:'#FF6961',bdc:'#FFFFFF',tf:'Inter',ts:52,sf:'Inter',ss:22,af:'Inter',as:16,sg:true,so:0.1,st:'senior'},
      {n:'5000 WORDS',b1:'#1A659E',b2:'#004E89',tc:'#FFFFFF',ac:'#F7C59F',bd:'5000+ Words',bdb:'#F7C59F',bdc:'#000000',tf:'Oswald',ts:56,sf:'Roboto',ss:20,af:'Roboto',as:14,sg:true,so:0.12,st:'bold'},
      {n:'THEMED COLLECTION',b1:'#606C38',b2:'#283618',tc:'#FEFAE0',ac:'#DDA15E',bd:'Themed',bdb:'#DDA15E',bdc:'#000000',tf:'Merriweather',ts:44,sf:'Lato',ss:20,af:'Lato',as:14,sg:false,so:0,st:'earthy'},
      {n:'BRAIN TEASERS',b1:'#9B2335',b2:'#5C2751',tc:'#FFFFFF',ac:'#EAB08C',bd:'Challenging',bdb:'#EAB08C',bdc:'#000000',tf:'Bebas Neue',ts:50,sf:'Raleway',ss:18,af:'Raleway',as:14,sg:true,so:0.08,st:'dark'},
      {n:'KIDS FUN SEARCH',b1:'#FF6B6B',b2:'#4ECDC4',tc:'#FFFFFF',ac:'#FFEAA7',bd:'Ages 8-12',bdb:'#FFEAA7',bdc:'#000000',tf:'Nunito',ts:46,sf:'Nunito',ss:22,af:'Nunito',as:14,sg:false,so:0,st:'kids'},
      {n:'SENIOR RELAXING',b1:'#AEC6CF',b2:'#77DD77',tc:'#1A1A2E',ac:'#FF6961',bd:'Easy',bdb:'#77DD77',bdc:'#000000',tf:'Inter',ts:42,sf:'Inter',ss:20,af:'Inter',as:16,sg:true,so:0.1,st:'senior'},
      {n:'ULTIMATE COLLECTION',b1:'#0D1B2A',b2:'#415A77',tc:'#E0E1DD',ac:'#FFD93D',bd:'400+ Puzzles',bdb:'#FFD93D',bdc:'#000000',tf:'Montserrat',ts:48,sf:'Open Sans',ss:20,af:'Open Sans',as:14,sg:true,so:0.1,st:'dark'},
      {n:'INSPIRATIONAL',b1:'#F8EDEB',b2:'#FCD5CE',tc:'#1A1A2E',ac:'#FFB5A7',bd:'Positive',bdb:'#FFB5A7',bdc:'#000000',tf:'Playfair Display',ts:44,sf:'Source Sans Pro',ss:18,af:'Source Sans Pro',as:14,sg:false,so:0,st:'elegant'},
      {n:'HOLIDAY SPECIAL',b1:'#C41E3A',b2:'#165B33',tc:'#FFD700',ac:'#FFFFFF',bd:'Holiday',bdb:'#FFD700',bdc:'#000000',tf:'Pacifico',ts:46,sf:'Quicksand',ss:20,af:'Quicksand',as:14,sg:true,so:0.08,st:'playful'},
      {n:'VARIETY PACK',b1:'#6C63FF',b2:'#8B5CF6',tc:'#FFFFFF',ac:'#FFD93D',bd:'Variety',bdb:'#FFD93D',bdc:'#000000',tf:'Inter',ts:50,sf:'Inter',ss:20,af:'Inter',as:14,sg:true,so:0.1,st:'modern'},
      {n:'WORD HUNT',b1:'#264653',b2:'#2A9D8F',tc:'#FFFFFF',ac:'#E9C46A',bd:'Fun',bdb:'#E9C46A',bdc:'#000000',tf:'Oswald',ts:48,sf:'Roboto',ss:18,af:'Roboto',as:14,sg:false,so:0,st:'minimal'},
      {n:'SEARCH & FIND',b1:'#E9C46A',b2:'#F4A261',tc:'#1A1A2E',ac:'#E76F51',bd:'Easy',bdb:'#E76F51',bdc:'#FFFFFF',tf:'Nunito',ts:44,sf:'Nunito',ss:20,af:'Nunito',as:14,sg:true,so:0.12,st:'playful'},
      {n:'PUZZLE MASTER',b1:'#414288',b2:'#3594B1',tc:'#FFFFFF',ac:'#FFD93D',bd:'Expert',bdb:'#FFD93D',bdc:'#000000',tf:'Bebas Neue',ts:52,sf:'Raleway',ss:18,af:'Raleway',as:14,sg:true,so:0.08,st:'dark'},
      {n:'RELAXING SEARCH',b1:'#FCD5CE',b2:'#FFB5A7',tc:'#1A1A2E',ac:'#F8EDEB',bd:'Calm',bdb:'#F8EDEB',bdc:'#000000',tf:'Playfair Display',ts:42,sf:'Source Sans Pro',ss:18,af:'Source Sans Pro',as:14,sg:false,so:0,st:'elegant'},
      {n:'SUPER WORD SEARCH',b1:'#FF0080',b2:'#8A2BE2',tc:'#FFFFFF',ac:'#40E0D0',bd:'Super',bdb:'#40E0D0',bdc:'#000000',tf:'Montserrat',ts:48,sf:'Open Sans',ss:20,af:'Open Sans',as:14,sg:true,so:0.1,st:'vibrant'},
      {n:'GIANT WORD SEARCH',b1:'#000000',b2:'#333333',tc:'#FFFFFF',ac:'#FFD93D',bd:'Giant',bdb:'#FFD93D',bdc:'#000000',tf:'Bebas Neue',ts:56,sf:'Raleway',ss:20,af:'Raleway',as:14,sg:true,so:0.06,st:'dark'},
      {n:'CLASSIC PUZZLES',b1:'#FFFFFF',b2:'#F0F0F0',tc:'#1A1A2E',ac:'#6C63FF',bd:'Classic',bdb:'#6C63FF',bdc:'#FFFFFF',tf:'Georgia',ts:44,sf:'Arial',ss:20,af:'Arial',as:14,sg:true,so:0.1,st:'minimal'},
      {n:'NATURE WORDS',b1:'#283618',b2:'#606C38',tc:'#FEFAE0',ac:'#DDA15E',bd:'Nature',bdb:'#DDA15E',bdc:'#000000',tf:'Merriweather',ts:42,sf:'Lato',ss:18,af:'Lato',as:14,sg:false,so:0,st:'earthy'},
      {n:'ANIMAL WORDS',b1:'#FF8C32',b2:'#FF6B35',tc:'#FFFFFF',ac:'#FFEAA7',bd:'Animals',bdb:'#FFEAA7',bdc:'#000000',tf:'Nunito',ts:46,sf:'Nunito',ss:20,af:'Nunito',as:14,sg:true,so:0.1,st:'kids'}
    ];
    bases.forEach(function(t,i){
      T.push({id:'tpl_'+i,cat:'puzzle',style:t.st,name:t.n,
        bg1:t.b1,bg2:t.b2,bgType:'gradient',tc:t.tc,ac:t.ac,
        badge:t.bd,badgeBg:t.bdb,badgeColor:t.bdc,
        tf:t.tf,ts:t.ts,sf:t.sf,ss:t.ss,af:t.af,as:t.as,
        sg:t.sg,so:t.so,
        ft:t.n.toUpperCase(),fs:'Word Search Puzzle Book for Adults',fa:'Your Name Here',
        st2:t.n,sa:'Your Name Here',
        bd2:'Hours of fun with themed word search puzzles. Perfect for relaxing and keeping your mind sharp.',
        ab:'About the author goes here.',layout:'centered'});
    });
    var bgs=[['#6C63FF','#8B5CF6'],['#FF6584','#FF8C42'],['#43E97B','#38F9D7'],['#FFD93D','#FF8C32'],['#264653','#2A9D8F'],['#E9C46A','#F4A261'],['#E76F51','#F4A261'],['#9B2335','#5C2751'],['#0D1B2A','#1B263B'],['#606C38','#283618'],['#FFB5A7','#FCD5CE'],['#AEC6CF','#77DD77'],['#E8601C','#FFB347'],['#1A659E','#004E89'],['#414288','#3594B1'],['#FF0080','#8A2BE2'],['#000000','#333333'],['#FFFFFF','#F0F0F0'],['#8B4513','#D2691E'],['#2F4F4F','#5F9EA0']];
    var tns=['WORD SEARCH','LARGE PRINT','5000 WORDS','BRAIN TEASERS','WORD FIND','PUZZLE BOOK','WORD HUNT','SEARCH & FIND','ULTIMATE WORDS','SUPER SEARCH','GIANT SEARCH','PREMIUM PUZZLES','SMART WORDS','FUN SEARCH','RELAXING SEARCH','CHALLENGING WORDS','EASY PUZZLES','HARD PUZZLES','MIXED DIFFICULTY','VARIETY PACK'];
    var sns=['Word Search Puzzle Book for Adults','Large Print Word Search for Seniors','Fun Word Search for Kids','Themed Word Search Puzzles','Challenging Word Search Book','Easy Word Search Collection','Relaxing Word Search Puzzles','Brain Training Word Search','Mind Games Word Search','Activity Book Word Search'];
    var bds=['100 Puzzles','200 Puzzles','5000+ Words','Large Print','Extra Large Print','For Adults','For Seniors','Ages 8-12','Easy','Medium','Hard','Mixed','Themed','Solutions Included','8.5 x 11','Variety Pack','Brain Training','Relaxing','Fun & Easy','Challenging'];
    var fts=['Inter','Oswald','Bebas Neue','Montserrat','Merriweather','Playfair Display','Nunito','Roboto','Pacifico','Lato'];
    var lts=['centered','top','bottom','split','diagonal'];
    var idx=20;
    for(var g=0;g<20&&idx<200;g++){
      for(var s=0;s<10&&idx<200;s++){
        var bc=bgs[idx%bgs.length],tt=tns[idx%tns.length],st3=sns[idx%sns.length],bt=bds[idx%bds.length],ft=fts[idx%fts.length],lt=lts[idx%lts.length];
        var dk=(g>=13&&g<=15)||s===5||s===6;
        T.push({id:'tpl_'+idx,cat:'puzzle',style:ft.toLowerCase(),name:tt+' - '+ft,
          bg1:bc[0],bg2:bc[1],bgType:'gradient',tc:dk?'#FFFFFF':'#1A1A2E',ac:dk?'#FFD93D':bc[1],
          badge:bt,badgeBg:dk?'#FFD93D':bc[0],badgeColor:dk?'#000000':'#FFFFFF',
          tf:ft,ts:dk?52:46,sf:ft==='Oswald'||ft==='Bebas Neue'?'Roboto':ft,ss:dk?20:18,
          af:ft==='Oswald'||ft==='Bebas Neue'?'Roboto':ft,as:14,
          sg:g<10&&Math.random()>0.3,so:0.08+Math.random()*0.1,
          ft:tt,fs:st3,fa:'Your Name Here',st2:tt,sa:'Your Name Here',
          bd2:'Hours of fun with themed word search puzzles. Perfect for relaxing and keeping your mind sharp.',
          ab:'About the author goes here.',layout:lt});
        idx++;
      }
    }
    return T;
  }
  var TEMPLATES=genTemplates();

  /* ===== QR CODE GENERATOR ===== */
  var QRGen={
    generate:function(text,sz){
      var s=sz||100,cv=document.createElement('canvas');cv.width=s;cv.height=s;
      var ctx=cv.getContext('2d');ctx.fillStyle='#FFF';ctx.fillRect(0,0,s,s);ctx.fillStyle='#000';
      var cs=Math.floor(s/25);
      function df(x,y){ctx.fillRect(x*cs,y*cs,7*cs,7*cs);ctx.fillStyle='#FFF';ctx.fillRect((x+1)*cs,(y+1)*cs,5*cs,5*cs);ctx.fillStyle='#000';ctx.fillRect((x+2)*cs,(y+2)*cs,3*cs,3*cs);}
      df(0,0);df(18,0);df(0,18);
      var sd=0;for(var i=0;i<text.length;i++)sd=((sd<<5)-sd)+text.charCodeAt(i);
      var rng=function(){sd=(sd*16807)%2147483647;return(sd&1)===1;};
      for(var r=0;r<25;r++)for(var c=0;c<25;c++){if((r<8&&c<8)||(r<8&&c>16)||(r>16&&c<8))continue;if(rng())ctx.fillRect(c*cs,r*cs,cs,cs);}
      return cv;
    }
  };

  /* ===== BARCODE GENERATOR (EAN-13) ===== */
  var BarcodeGen={
    generate:function(isbn,sz){
      var s=sz||200,cv=document.createElement('canvas');cv.width=s;cv.height=Math.round(s*0.6);
      var ctx=cv.getContext('2d');ctx.fillStyle='#FFF';ctx.fillRect(0,0,cv.width,cv.height);
      /* Simplified barcode visual representation */
      var digits=isbn.replace(/[^0-9]/g,'').substring(0,13);
      if(!digits)return cv;
      ctx.fillStyle='#000';
      var bw=Math.floor(s/95),bh=Math.round(cv.height*0.75),y=Math.round(cv.height*0.1);
      var patterns={L:['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'],
        G:['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'],
        R:['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100']};
      var first=parseInt(digits[0]),enc='';
      for(var i=1;i<=6;i++)enc+=patterns[first<4?'L':'G'][parseInt(digits[i])];
      for(var i=7;i<=12;i++)enc+=patterns.R[parseInt(digits[i])];
      var x=bw;
      ctx.fillRect(x,y,bw,bh);ctx.fillRect(x+bw,y,bw,bh); /* guard bars */
      x+=bw*3;
      for(var i=0;i<enc.length;i++){if(enc[i]==='1')ctx.fillRect(x,y,bw,bh);x+=bw;}
      ctx.fillRect(x,y,bw,bh);ctx.fillRect(x+bw,y,bw,bh);ctx.fillRect(x+bw*2,y,bw,bh);
      ctx.font=Math.round(bw*1.2)+'px monospace';ctx.textAlign='center';ctx.fillText(digits, cv.width/2, cv.height-2);
      return cv;
    }
  };

  /* ===== SHAPES DEFINITION ===== */
  var SHAPES = {
    types: ['rectangle', 'circle', 'star', 'arrow', 'badge', 'triangle', 'hexagon', 'diamond', 'heart', 'cloud'],
    defaults: {
      rectangle: {fill:'#6C63FF',stroke:null,strokeWidth:0,cornerRadius:0},
      circle: {fill:'#6C63FF',stroke:null,strokeWidth:0},
      star: {fill:'#FFD93D',stroke:null,strokeWidth:0},
      arrow: {fill:'#43E97B',stroke:null,strokeWidth:0},
      badge: {fill:'#FF6B6B',stroke:null,strokeWidth:0},
      triangle: {fill:'#8B5CF6',stroke:null,strokeWidth:0},
      hexagon: {fill:'#3594B1',stroke:null,strokeWidth:0},
      diamond: {fill:'#E9C46A',stroke:null,strokeWidth:0},
      heart: {fill:'#FF6584',stroke:null,strokeWidth:0},
      cloud: {fill:'#AEC6CF',stroke:null,strokeWidth:0}
    }
  };

  /* ===== V1 FUNCTIONS: TEMPLATE GENERATOR, PREVIEW RENDERER, PDF EXPORT ===== */

  /* V1: Cover template types (background patterns) */
  var CoverTemplateTypes = [
    {id:'solid', name:'Solid Color', type:'solid'},
    {id:'gradient_v', name:'Vertical Gradient', type:'gradient', dir:'vertical'},
    {id:'gradient_h', name:'Horizontal Gradient', type:'gradient', dir:'horizontal'},
    {id:'gradient_d', name:'Diagonal Gradient', type:'gradient', dir:'diagonal'},
    {id:'gradient_r', name:'Radial Gradient', type:'gradient', dir:'radial'},
    {id:'stripe_h', name:'Horizontal Stripes', type:'pattern', pattern:'stripe_h'},
    {id:'stripe_v', name:'Vertical Stripes', type:'pattern', pattern:'stripe_v'},
    {id:'dots', name:'Dot Pattern', type:'pattern', pattern:'dots'},
    {id:'checker', name:'Checkerboard', type:'pattern', pattern:'checker'},
    {id:'diamond', name:'Diamond Pattern', type:'pattern', pattern:'diamond'},
    {id:'zigzag', name:'Zigzag Pattern', type:'pattern', pattern:'zigzag'},
    {id:'wave', name:'Wave Pattern', type:'pattern', pattern:'wave'},
    {id:'puzzle_grid', name:'Puzzle Grid BG', type:'pattern', pattern:'puzzle_grid'},
    {id:'word_scatter', name:'Word Scatter', type:'pattern', pattern:'word_scatter'},
    {id:'border_frame', name:'Border Frame', type:'border'}
  ];

  /* V1: Wrap text helper */
  function wrapText(ctx, text, maxWidth) {
    var words = text.split(' ');
    var lines = [];
    var currentLine = '';
    for(var i = 0; i < words.length; i++) {
      var testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
      if(ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    if(currentLine) lines.push(currentLine);
    return lines;
  }

  /* V1: Apply design template to canvas context */
  function applyDesignToCanvas(ctx, design, dimensions, s) {
    var c = {width: dimensions.coverW, height: dimensions.coverH};
    var p = {
      backCover: {x: dimensions.backX, w: dimensions.backW},
      spine: {x: dimensions.spineX, w: dimensions.spineW},
      frontCover: {x: dimensions.frontX, w: dimensions.frontW}
    };
    var bleed = dimensions.BLEED || KDP.BLEED;

    var bg1 = design.bgColor1 || '#6366f1';
    var bg2 = design.bgColor2 || '#8b5cf6';
    var template = design.template || 'gradient_v';

    function hexToRgb(hex) {
      var r = parseInt(hex.slice(1, 3), 16);
      var g = parseInt(hex.slice(3, 5), 16);
      var b = parseInt(hex.slice(5, 7), 16);
      return [r, g, b];
    }

    /* Apply to front cover */
    ctx.save();
    ctx.beginPath();
    ctx.rect(p.frontCover.x * s, bleed * s, p.frontCover.w * s, (c.height - 2 * bleed) * s);
    ctx.clip();

    if(template === 'solid') {
      ctx.fillStyle = bg1;
      ctx.fillRect(p.frontCover.x * s, bleed * s, p.frontCover.w * s, (c.height - 2 * bleed) * s);
    } else if(template.indexOf('gradient') === 0) {
      var grad;
      var x1 = p.frontCover.x * s, y1 = bleed * s;
      var x2 = (p.frontCover.x + p.frontCover.w) * s, y2 = (c.height - bleed) * s;
      if(template === 'gradient_v') {
        grad = ctx.createLinearGradient(x1, y1, x1, y2);
      } else if(template === 'gradient_h') {
        grad = ctx.createLinearGradient(x1, y1, x2, y1);
      } else if(template === 'gradient_d') {
        grad = ctx.createLinearGradient(x1, y1, x2, y2);
      } else {
        grad = ctx.createRadialGradient((x1+x2)/2, (y1+y2)/2, 0, (x1+x2)/2, (y1+y2)/2, (x2-x1)/2);
      }
      grad.addColorStop(0, bg1);
      grad.addColorStop(1, bg2);
      ctx.fillStyle = grad;
      ctx.fillRect(p.frontCover.x * s, bleed * s, p.frontCover.w * s, (c.height - 2 * bleed) * s);
    } else if(template.indexOf('stripe') === 0) {
      ctx.fillStyle = bg1;
      ctx.fillRect(p.frontCover.x * s, bleed * s, p.frontCover.w * s, (c.height - 2 * bleed) * s);
      ctx.strokeStyle = bg2;
      ctx.lineWidth = 2;
      var spacing = 12;
      if(template === 'stripe_h') {
        for(var y = bleed * s; y < (c.height - bleed) * s; y += spacing) {
          ctx.beginPath();
          ctx.moveTo(p.frontCover.x * s, y);
          ctx.lineTo((p.frontCover.x + p.frontCover.w) * s, y);
          ctx.stroke();
        }
      } else {
        for(var x = p.frontCover.x * s; x < (p.frontCover.x + p.frontCover.w) * s; x += spacing) {
          ctx.beginPath();
          ctx.moveTo(x, bleed * s);
          ctx.lineTo(x, (c.height - bleed) * s);
          ctx.stroke();
        }
      }
    } else if(template === 'dots') {
      ctx.fillStyle = bg1;
      ctx.fillRect(p.frontCover.x * s, bleed * s, p.frontCover.w * s, (c.height - 2 * bleed) * s);
      ctx.fillStyle = bg2;
      var dotR = 3;
      var dotSpacing = 16;
      for(var dx = p.frontCover.x * s + dotSpacing; dx < (p.frontCover.x + p.frontCover.w) * s; dx += dotSpacing) {
        for(var dy = bleed * s + dotSpacing; dy < (c.height - bleed) * s; dy += dotSpacing) {
          ctx.beginPath();
          ctx.arc(dx, dy, dotR, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if(template === 'checker') {
      var sqSize = 14;
      for(var cx = p.frontCover.x * s; cx < (p.frontCover.x + p.frontCover.w) * s; cx += sqSize) {
        for(var cy = bleed * s; cy < (c.height - bleed) * s; cy += sqSize) {
          ctx.fillStyle = ((cx/sqSize + cy/sqSize) % 2 === 0) ? bg1 : bg2;
          ctx.fillRect(cx, cy, sqSize, sqSize);
        }
      }
    } else if(template === 'border_frame') {
      ctx.fillStyle = bg1;
      ctx.fillRect(p.frontCover.x * s, bleed * s, p.frontCover.w * s, (c.height - 2 * bleed) * s);
      ctx.strokeStyle = bg2;
      ctx.lineWidth = 3;
      var margin = 20 * s;
      ctx.strokeRect(p.frontCover.x * s + margin, bleed * s + margin, p.frontCover.w * s - margin * 2, (c.height - 2 * bleed) * s - margin * 2);
      ctx.lineWidth = 1;
      ctx.strokeRect(p.frontCover.x * s + margin + 4, bleed * s + margin + 4, p.frontCover.w * s - (margin + 4) * 2, (c.height - 2 * bleed) * s - (margin + 4) * 2);
    }
    ctx.restore();

    /* Apply same design to spine */
    ctx.save();
    ctx.beginPath();
    ctx.rect(p.spine.x * s, bleed * s, p.spine.w * s, (c.height - 2 * bleed) * s);
    ctx.clip();
    if(template === 'solid' || template.indexOf('gradient') === 0) {
      if(template === 'solid') {
        ctx.fillStyle = bg1;
      } else {
        var grad2 = ctx.createLinearGradient(p.spine.x * s, bleed * s, p.spine.x * s, (c.height - bleed) * s);
        grad2.addColorStop(0, bg1);
        grad2.addColorStop(1, bg2);
        ctx.fillStyle = grad2;
      }
      ctx.fillRect(p.spine.x * s, bleed * s, p.spine.w * s, (c.height - 2 * bleed) * s);
    }
    ctx.restore();

    /* Apply same design to back cover */
    ctx.save();
    ctx.beginPath();
    ctx.rect(p.backCover.x * s, bleed * s, p.backCover.w * s, (c.height - 2 * bleed) * s);
    ctx.clip();
    if(template === 'solid') {
      ctx.fillStyle = bg1;
      ctx.fillRect(p.backCover.x * s, bleed * s, p.backCover.w * s, (c.height - 2 * bleed) * s);
    } else if(template.indexOf('gradient') === 0) {
      var grad3 = ctx.createLinearGradient(p.backCover.x * s, bleed * s, p.backCover.x * s, (c.height - bleed) * s);
      grad3.addColorStop(0, bg1);
      grad3.addColorStop(1, bg2);
      ctx.fillStyle = grad3;
      ctx.fillRect(p.backCover.x * s, bleed * s, p.backCover.w * s, (c.height - 2 * bleed) * s);
    }
    /* Back cover description text */
    if(design.backDescription) {
      ctx.fillStyle = design.backTextColor || '#e2e8f0';
      ctx.font = Math.max(8, 10 * s) + 'px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      var lines = wrapText(ctx, design.backDescription, (p.backCover.w - 0.5) * s);
      var textY = (bleed + 0.3) * s;
      for(var li = 0; li < lines.length; li++) {
        ctx.fillText(lines[li], (p.backCover.x + 0.2) * s, textY + li * 14 * s);
      }
    }
    ctx.restore();
  }

  /* V1: Render cover preview on canvas */
  function renderCoverPreview(canvas, dimensions, design) {
    var ctx = canvas.getContext('2d');
    var c = {width: dimensions.coverW, height: dimensions.coverH};
    var p = {
      backCover: {x: dimensions.backX, w: dimensions.backW},
      spine: {x: dimensions.spineX, w: dimensions.spineW},
      frontCover: {x: dimensions.frontX, w: dimensions.frontW}
    };
    var bleed = dimensions.BLEED || KDP.BLEED;
    var dpr = window.devicePixelRatio || 1;
    var displayW = Math.min(canvas.parentElement.clientWidth - 40, 900);
    var scale = displayW / (c.width * 300);
    var renderW = Math.round(c.width * 300 * scale);
    var renderH = Math.round(c.height * 300 * scale);

    canvas.width = renderW * dpr;
    canvas.height = renderH * dpr;
    canvas.style.width = renderW + 'px';
    canvas.style.height = renderH + 'px';
    ctx.scale(dpr, dpr);

    var s = renderW / c.width;

    /* Background */
    ctx.fillStyle = '#f0f0f5';
    ctx.fillRect(0, 0, renderW, renderH);

    /* Panel backgrounds */
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(p.backCover.x * s, bleed * s, p.backCover.w * s, (c.height - 2 * bleed) * s);
    ctx.fillRect(p.frontCover.x * s, bleed * s, p.frontCover.w * s, (c.height - 2 * bleed) * s);

    /* Spine */
    ctx.fillStyle = '#f8f8fc';
    ctx.fillRect(p.spine.x * s, bleed * s, p.spine.w * s, (c.height - 2 * bleed) * s);

    /* Apply design template */
    if(design) {
      applyDesignToCanvas(ctx, design, dimensions, s);
    }

    /* Spine text (if allowed) */
    if(dimensions.spineTextAllowed && design && design.spineTitle) {
      ctx.save();
      ctx.translate(p.spine.x * s + p.spine.w * s / 2, c.height * s / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = design.spineColor || '#1a1a2e';
      ctx.font = 'bold ' + Math.min(14 * s, p.spine.w * s * 0.6) + 'px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(design.spineTitle, 0, -8 * s);
      if(design.spineAuthor) {
        ctx.font = Math.min(10 * s, p.spine.w * s * 0.4) + 'px Inter, sans-serif';
        ctx.fillText(design.spineAuthor, 0, 8 * s);
      }
      ctx.restore();
    }

    /* Front cover title */
    if(design && design.frontTitle) {
      ctx.fillStyle = design.titleColor || '#1a1a2e';
      ctx.font = 'bold ' + Math.max(12, 20 * s) + 'px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var fcx = p.frontCover.x * s + p.frontCover.w * s / 2;
      var fcy = c.height * s * 0.35;
      ctx.fillText(design.frontTitle, fcx, fcy);
      if(design.frontSubtitle) {
        ctx.font = Math.max(9, 12 * s) + 'px Inter, sans-serif';
        ctx.fillStyle = design.subtitleColor || '#475569';
        ctx.fillText(design.frontSubtitle, fcx, fcy + 25 * s);
      }
      if(design.frontAuthor) {
        ctx.font = Math.max(8, 11 * s) + 'px Inter, sans-serif';
        ctx.fillStyle = design.authorColor || '#64748b';
        ctx.fillText(design.frontAuthor, fcx, c.height * s * 0.75);
      }
    }

    /* Guide overlays */
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.spine.x * s, 0); ctx.lineTo(p.spine.x * s, renderH);
    ctx.moveTo(p.spine.x * s + p.spine.w * s, 0); ctx.lineTo(p.spine.x * s + p.spine.w * s, renderH);
    ctx.stroke();
    ctx.setLineDash([]);

    /* Labels */
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(99, 102, 241, 0.6)';
    ctx.fillText('BACK', p.backCover.x * s + p.backCover.w * s / 2, 14);
    ctx.fillText('SPINE', p.spine.x * s + p.spine.w * s / 2, 14);
    ctx.fillText('FRONT', p.frontCover.x * s + p.frontCover.w * s / 2, 14);
  }

  /* V1: Generate cover template as PDF with guide lines */
  function generateCoverTemplatePDF(dimensions, opts) {
    if(typeof jsPDF === 'undefined' && typeof window.jspdf !== 'undefined') {
      var jsPDF = window.jspdf.jsPDF;
    }
    if(typeof jsPDF === 'undefined') {
      return Promise.reject(new Error('jsPDF not loaded'));
    }

    var c = {width: dimensions.coverW, height: dimensions.coverH};
    var p = {
      backCover: {x: dimensions.backX, w: dimensions.backW},
      spine: {x: dimensions.spineX, w: dimensions.spineW},
      frontCover: {x: dimensions.frontX, w: dimensions.frontW}
    };
    var bleed = dimensions.BLEED || KDP.BLEED;
    var sz = dimensions;

    var doc = new jsPDF({
      orientation: c.width > c.height ? 'landscape' : 'portrait',
      unit: 'in',
      format: [c.width, c.height]
    });

    /* Background */
    doc.setFillColor(240, 240, 245);
    doc.rect(0, 0, c.width, c.height, 'F');

    /* Panel backgrounds */
    doc.setFillColor(255, 255, 255);
    doc.rect(p.backCover.x, bleed, p.backCover.w, c.height - 2 * bleed, 'F');
    doc.rect(p.frontCover.x, bleed, p.frontCover.w, c.height - 2 * bleed, 'F');

    /* Spine background */
    doc.setFillColor(248, 248, 252);
    doc.rect(p.spine.x, bleed, p.spine.w, c.height - 2 * bleed, 'F');

    /* Bleed area indicator */
    doc.setDrawColor(255, 150, 150);
    doc.setLineWidth(0.01);
    doc.rect(bleed, bleed, c.width - 2 * bleed, c.height - 2 * bleed, 'S');

    /* Trim lines */
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.008);
    doc.line(p.backCover.x, bleed, p.backCover.x, c.height - bleed);
    doc.line(p.backCover.x + p.backCover.w, bleed, p.backCover.x + p.backCover.w, c.height - bleed);
    doc.line(p.frontCover.x, bleed, p.frontCover.x, c.height - bleed);
    doc.line(p.frontCover.x + p.frontCover.w, bleed, p.frontCover.x + p.frontCover.w, c.height - bleed);

    /* Spine boundaries */
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(0.012);
    doc.line(p.spine.x, bleed, p.spine.x, c.height - bleed);
    doc.line(p.spine.x + p.spine.w, bleed, p.spine.x + p.spine.w, c.height - bleed);

    /* Safe zone lines */
    var safeTop = bleed + KDP.SAFE_TRIM;
    var safeBottom = c.height - bleed - KDP.SAFE_TRIM;
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.005);
    doc.setLineDashPattern([0.05, 0.05], 0);
    doc.line(bleed, safeTop, c.width - bleed, safeTop);
    doc.line(bleed, safeBottom, c.width - bleed, safeBottom);
    doc.line(p.backCover.x + KDP.SAFE_TRIM, bleed, p.backCover.x + KDP.SAFE_TRIM, c.height - bleed);
    doc.line(p.backCover.x + p.backCover.w - KDP.SAFE_TRIM, bleed, p.backCover.x + p.backCover.w - KDP.SAFE_TRIM, c.height - bleed);
    doc.line(p.frontCover.x + KDP.SAFE_TRIM, bleed, p.frontCover.x + KDP.SAFE_TRIM, c.height - bleed);
    doc.line(p.frontCover.x + p.frontCover.w - KDP.SAFE_TRIM, bleed, p.frontCover.x + p.frontCover.w - KDP.SAFE_TRIM, c.height - bleed);
    doc.line(p.spine.x + KDP.SAFE_SPINE, bleed, p.spine.x + KDP.SAFE_SPINE, c.height - bleed);
    doc.line(p.spine.x + p.spine.w - KDP.SAFE_SPINE, bleed, p.spine.x + p.spine.w - KDP.SAFE_SPINE, c.height - bleed);
    doc.setLineDashPattern([], 0);

    /* Barcode area */
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(239, 68, 68);
    doc.setLineWidth(0.008);
    var bx = dimensions.barcodeX, by = dimensions.barcodeY, bw = dimensions.barcodeW, bh = dimensions.barcodeH;
    doc.rect(bx, by, bw, bh, 'FD');
    doc.setFontSize(6);
    doc.setTextColor(239, 68, 68);
    doc.text('BARCODE AREA', bx + bw / 2, by + bh / 2 + 1, {align: 'center'});

    /* Labels */
    doc.setFontSize(8);
    doc.setTextColor(99, 102, 241);
    doc.text('BACK COVER', p.backCover.x + p.backCover.w / 2, bleed + 0.2, {align: 'center'});
    doc.text('SPINE', p.spine.x + p.spine.w / 2, bleed + 0.2, {align: 'center'});
    doc.text('FRONT COVER', p.frontCover.x + p.frontCover.w / 2, bleed + 0.2, {align: 'center'});

    /* Dimension annotations */
    doc.setFontSize(6);
    doc.setTextColor(100, 100, 100);
    doc.text('Spine: ' + dimensions.spineWidth.toFixed(4) + '"', p.spine.x + p.spine.w / 2, c.height - bleed - 0.15, {align: 'center'});
    doc.text('Full Cover: ' + c.width.toFixed(3) + '" x ' + c.height.toFixed(3) + '"', c.width / 2, c.height - 0.08, {align: 'center'});
    doc.text(dimensions.pageCount + ' pages | ' + (opts && opts.paperLabel ? opts.paperLabel : 'White Paper'), c.width / 2, c.height - 0.02, {align: 'center'});

    /* Legend */
    var legendX = p.backCover.x + 0.1;
    var legendY = c.height - bleed - 1.2;
    doc.setFontSize(5);
    doc.setTextColor(80, 80, 80);
    doc.text('LEGEND:', legendX, legendY);
    doc.setDrawColor(255, 150, 150);
    doc.setLineWidth(0.015);
    doc.line(legendX, legendY + 0.08, legendX + 0.3, legendY + 0.08);
    doc.text('Bleed edge', legendX + 0.35, legendY + 0.09);
    doc.setDrawColor(99, 102, 241);
    doc.line(legendX, legendY + 0.18, legendX + 0.3, legendY + 0.18);
    doc.text('Spine boundary', legendX + 0.35, legendY + 0.19);
    doc.setDrawColor(16, 185, 129);
    doc.setLineDashPattern([0.05, 0.05], 0);
    doc.line(legendX, legendY + 0.28, legendX + 0.3, legendY + 0.28);
    doc.text('Safe zone', legendX + 0.35, legendY + 0.29);
    doc.setLineDashPattern([], 0);
    doc.setDrawColor(239, 68, 68);
    doc.setLineWidth(0.015);
    doc.rect(legendX, legendY + 0.34, 0.15, 0.1, 'S');
    doc.text('Barcode area', legendX + 0.35, legendY + 0.39);

    return doc;
  }

  /* V1: Export cover as print-ready PDF with design */
  function exportCoverAsPDF(dimensions, design) {
    if(typeof jsPDF === 'undefined' && typeof window.jspdf !== 'undefined') {
      var jsPDF = window.jspdf.jsPDF;
    }
    if(typeof jsPDF === 'undefined') {
      return Promise.reject(new Error('jsPDF not loaded'));
    }

    var c = {width: dimensions.coverW, height: dimensions.coverH};
    var p = {
      backCover: {x: dimensions.backX, w: dimensions.backW},
      spine: {x: dimensions.spineX, w: dimensions.spineW},
      frontCover: {x: dimensions.frontX, w: dimensions.frontW}
    };
    var bleed = dimensions.BLEED || KDP.BLEED;

    var doc = new jsPDF({
      orientation: c.width > c.height ? 'landscape' : 'portrait',
      unit: 'in',
      format: [c.width, c.height]
    });

    function hexToRgb(hex) {
      var r = parseInt(hex.slice(1, 3), 16);
      var g = parseInt(hex.slice(3, 5), 16);
      var b = parseInt(hex.slice(5, 7), 16);
      return [r, g, b];
    }

    var bg1 = design.bgColor1 || '#6366f1';
    var bg2 = design.bgColor2 || '#8b5cf6';
    var rgb1 = hexToRgb(bg1);
    var rgb2 = hexToRgb(bg2);

    /* Front cover background */
    doc.setFillColor(rgb1[0], rgb1[1], rgb1[2]);
    doc.rect(p.frontCover.x, bleed, p.frontCover.w, c.height - 2 * bleed, 'F');

    /* Spine background */
    doc.setFillColor(rgb1[0], rgb1[1], rgb1[2]);
    doc.rect(p.spine.x, bleed, p.spine.w, c.height - 2 * bleed, 'F');

    /* Back cover background */
    doc.setFillColor(rgb1[0], rgb1[1], rgb1[2]);
    doc.rect(p.backCover.x, bleed, p.backCover.w, c.height - 2 * bleed, 'F');

    /* Spine text */
    if(dimensions.spineTextAllowed && design.spineTitle) {
      var sc = design.spineColor ? hexToRgb(design.spineColor) : [26, 26, 46];
      doc.setTextColor(sc[0], sc[1], sc[2]);
      var spineFontSize = Math.min(14, dimensions.spineWidth * 12);
      doc.setFontSize(spineFontSize);
      doc.setFont(undefined, 'bold');
      var spineCenterX = p.spine.x + p.spine.w / 2;
      var spineCenterY = c.height / 2;
      doc.text(design.spineTitle, spineCenterX, spineCenterY - 0.15, {angle: 90, align: 'center'});
      if(design.spineAuthor) {
        doc.setFontSize(spineFontSize * 0.7);
        doc.setFont(undefined, 'normal');
        doc.text(design.spineAuthor, spineCenterX, spineCenterY + 0.2, {angle: 90, align: 'center'});
      }
    }

    /* Front cover text */
    if(design.frontTitle) {
      var tc = design.titleColor ? hexToRgb(design.titleColor) : [26, 26, 46];
      doc.setTextColor(tc[0], tc[1], tc[2]);
      doc.setFontSize(22);
      doc.setFont(undefined, 'bold');
      doc.text(design.frontTitle, p.frontCover.x + p.frontCover.w / 2, c.height * 0.35, {align: 'center'});
      if(design.frontSubtitle) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        var stc = design.subtitleColor ? hexToRgb(design.subtitleColor) : [71, 85, 105];
        doc.setTextColor(stc[0], stc[1], stc[2]);
        doc.text(design.frontSubtitle, p.frontCover.x + p.frontCover.w / 2, c.height * 0.35 + 0.35, {align: 'center'});
      }
      if(design.frontAuthor) {
        doc.setFontSize(11);
        var ac = design.authorColor ? hexToRgb(design.authorColor) : [100, 116, 139];
        doc.setTextColor(ac[0], ac[1], ac[2]);
        doc.text(design.frontAuthor, p.frontCover.x + p.frontCover.w / 2, c.height * 0.75, {align: 'center'});
      }
    }

    /* Back cover description */
    if(design.backDescription) {
      var btc = design.backTextColor ? hexToRgb(design.backTextColor) : [226, 232, 239];
      doc.setTextColor(btc[0], btc[1], btc[2]);
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      var backLines = design.backDescription.split('\n');
      var textY = bleed + 0.3;
      for(var i = 0; i < backLines.length; i++) {
        doc.text(backLines[i], p.backCover.x + 0.2, textY + i * 0.2, {maxWidth: p.backCover.w - 0.4});
      }
    }

    return doc;
  }

  /* ===== MAIN MXD DESIGNER ===== */
  var Designer={
    version:'3.0',
    canvas:null, ctx:null, container:null,
    dims:null, layers:[], selectedLayer:null,
    zoom:1, panX:0, panY:0,
    undo:null, autoSaveTimer:null,
    isDragging:false, dragOffset:null, dragLayer:null,
    isResizing:false, resizeHandle:null, resizeStart:null,
    isPanning:false, panStart:null,
    showSafeZones:false, showGrid:false, showRulers:false,
    thumbnailPreview:null,
    apiKey:null,

    /* Initialize */
    init:function(containerEl, opts){
      this.container=containerEl;
      this.undo=new UndoMgr(MAX_UNDO);
      this.dims=KDP.calculate(opts||{trimW:6,trimH:9,pageCount:100,paperType:'white_bw'});
      this.layers=[];
      this.selectedLayer=null;
      this.zoom=1;this.panX=0;this.panY=0;
      this.createCanvas();
      this.loadApiKey();
      this.startAutoSave();
      console.log('[MXD Designer v'+this.version+'] Initialized — '+this.dims.coverW.toFixed(2)+'" x '+this.dims.coverH.toFixed(2)+'" ('+this.dims.pxW+'x'+this.dims.pxH+'px @ 300 DPI)');
      return this;
    },

    createCanvas:function(){
      var wrap=document.createElement('div');
      wrap.style.cssText='position:relative;width:100%;height:100%;overflow:hidden;background:#1a1a2e;cursor:crosshair;';
      this.canvas=document.createElement('canvas');
      this.canvas.style.cssText='display:block;image-rendering:auto;';
      this.ctx=this.canvas.getContext('2d');
      wrap.appendChild(this.canvas);
      this.container.appendChild(wrap);
      this.canvasWrap=wrap;
      this.bindEvents();
      this.resize();
      this.render();
    },

    resize:function(){
      if(!this.canvasWrap)return;
      var w=this.canvasWrap.clientWidth, h=this.canvasWrap.clientHeight;
      var aspect=this.dims.coverW/this.dims.coverH;
      var cw,ch;
      if(w/h>aspect){ch=h*0.9;cw=ch*aspect;}else{cw=w*0.9;ch=cw/aspect;}
      cw*=this.zoom;ch*=this.zoom;
      this.canvas.width=Math.round(cw);this.canvas.height=Math.round(ch);
      this.canvas.style.width=Math.round(cw)+'px';this.canvas.style.height=Math.round(ch)+'px';
      this.canvas.style.position='absolute';
      this.canvas.style.left=Math.round((w-cw)/2+this.panX)+'px';
      this.canvas.style.top=Math.round((h-ch)/2+this.panY)+'px';
      this.renderScale=cw/(this.dims.coverW*DPI);
      this.render();
    },

    bindEvents:function(){
      var self=this;
      this.canvas.addEventListener('mousedown',function(e){self.onMouseDown(e);});
      this.canvas.addEventListener('mousemove',function(e){self.onMouseMove(e);});
      this.canvas.addEventListener('mouseup',function(e){self.onMouseUp(e);});
      this.canvas.addEventListener('wheel',function(e){self.onWheel(e);},{passive:false});
      this.canvas.addEventListener('dblclick',function(e){self.onDblClick(e);});
      window.addEventListener('resize',function(){self.resize();});
      window.addEventListener('keydown',function(e){self.onKeyDown(e);});
    },

    onMouseDown:function(e){
      var rect=this.canvas.getBoundingClientRect();
      var mx=e.clientX-rect.left, my=e.clientY-rect.top;
      var wx=(mx/this.renderScale)/DPI, wy=(my/this.renderScale)/DPI;
      for(var i=this.layers.length-1;i>=0;i--){
        var l=this.layers[i];
        if(wx>=l.x&&wx<=l.x+l.w&&wy>=l.y&&wy<=l.y+l.h){
          this.selectedLayer=l;
          this.isDragging=true;
          this.dragOffset={x:wx-l.x,y:wy-l.y};
          this.dragLayer=l;
          this.render();
          this.updateUI();
          return;
        }
      }
      if(this.selectedLayer){
        var l=this.selectedLayer;
        var hs=8/this.renderScale/DPI;
        var handles=[
          {id:'tl',x:l.x,y:l.y},{id:'tr',x:l.x+l.w,y:l.y},
          {id:'bl',x:l.x,y:l.y+l.h},{id:'br',x:l.x+l.w,y:l.y+l.h},
          {id:'tm',x:l.x+l.w/2,y:l.y},{id:'bm',x:l.x+l.w/2,y:l.y+l.h},
          {id:'ml',x:l.x,y:l.y+l.h/2},{id:'mr',x:l.x+l.w,y:l.y+l.h/2}
        ];
        for(var h=0;h<handles.length;h++){
          if(Math.abs(wx-handles[h].x)<hs&&Math.abs(wy-handles[h].y)<hs){
            this.isResizing=true;this.resizeHandle=handles[h].id;
            this.resizeStart={x:wx,y:wy,lx:l.x,ly:l.y,lw:l.w,lh:l.h};
            this.render();return;
          }
        }
      }
      if(e.button===1||e.altKey){this.isPanning=true;this.panStart={x:e.clientX-this.panX,y:e.clientY-this.panY};this.canvasWrap.style.cursor='grab';}
      else{this.selectedLayer=null;this.render();this.updateUI();}
    },

    onMouseMove:function(e){
      var rect=this.canvas.getBoundingClientRect();
      var mx=e.clientX-rect.left, my=e.clientY-rect.top;
      var wx=(mx/this.renderScale)/DPI, wy=(my/this.renderScale)/DPI;
      if(this.isDragging&&this.dragLayer){
        this.dragLayer.x=wx-this.dragOffset.x;
        this.dragLayer.y=wy-this.dragOffset.y;
        this.render();
      }else if(this.isResizing&&this.selectedLayer){
        var l=this.selectedLayer,s=this.resizeStart;
        var dx=wx-s.x,dy=wy-s.y;
        if(this.resizeHandle.indexOf('r')>=0)l.w=Math.max(0.1,s.lw+dx);
        if(this.resizeHandle.indexOf('l')>=0){l.x=s.lx+dx;l.w=Math.max(0.1,s.lw-dx);}
        if(this.resizeHandle.indexOf('b')>=0)l.h=Math.max(0.1,s.lh+dy);
        if(this.resizeHandle.indexOf('t')>=0){l.y=s.ly+dy;l.h=Math.max(0.1,s.lh-dy);}
        this.render();
      }else if(this.isPanning){
        this.panX=e.clientX-this.panStart.x;this.panY=e.clientY-this.panStart.y;
        this.canvas.style.left=Math.round((this.canvasWrap.clientWidth-this.canvas.width)/2+this.panX)+'px';
        this.canvas.style.top=Math.round((this.canvasWrap.clientHeight-this.canvas.height)/2+this.panY)+'px';
      }
    },

    onMouseUp:function(){
      if(this.isDragging){this.undo.push({layers:this.layers});}
      this.isDragging=false;this.dragLayer=null;this.isResizing=false;this.resizeHandle=null;
      if(this.isPanning){this.isPanning=false;this.canvasWrap.style.cursor='crosshair';}
    },

    onWheel:function(e){
      e.preventDefault();
      var delta=e.deltaY>0?0.9:1.1;
      this.zoom=Math.max(0.2,Math.min(5,this.zoom*delta));
      this.resize();
    },

    onDblClick:function(e){
      if(this.selectedLayer&&this.selectedLayer.type==='text'){
        var newText=prompt('Edit text:',this.selectedLayer.text);
        if(newText!==null){this.selectedLayer.text=newText;this.undo.push({layers:this.layers});this.render();}
      }
    },

    onKeyDown:function(e){
      if(e.ctrlKey&&e.key==='z'){e.preventDefault();var s=this.undo.undo();if(s){this.layers=s.layers;this.render();}}
      if(e.ctrlKey&&e.key==='y'){e.preventDefault();var s=this.undo.redo();if(s){this.layers=s.layers;this.render();}}
      if(e.key==='Delete'&&this.selectedLayer){this.layers=this.layers.filter(function(l){return l!==this.selectedLayer;}.bind(this));this.selectedLayer=null;this.undo.push({layers:this.layers});this.render();}
      if(e.ctrlKey&&e.key==='d'&&this.selectedLayer){
        var dup=JSON.parse(JSON.stringify(this.selectedLayer));dup.x+=0.1;dup.y+=0.1;dup.id='layer_'+Date.now();
        this.layers.push(dup);this.selectedLayer=dup;this.undo.push({layers:this.layers});this.render();
      }
    },

    /* ===== LAYER MANAGEMENT ===== */
    addLayer:function(type,props){
      var l={id:'layer_'+Date.now(),type:type,x:props.x||0.5,y:props.y||0.5,w:props.w||2,h:props.h||1,visible:true,locked:false,opacity:props.opacity||1,blendMode:props.blendMode||'normal'};
      if(type==='text'){l.text=props.text||'Text';l.fontSize=props.fontSize||24;l.fontFamily=props.fontFamily||'Inter';l.fontWeight=props.fontWeight||'bold';l.fontStyle=props.fontStyle||'normal';l.textColor=props.textColor||'#FFFFFF';l.textAlign=props.textAlign||'center';l.letterSpacing=props.letterSpacing||0;l.lineHeight=props.lineHeight||1.2;l.shadow=props.shadow||null;l.outline=props.outline||null;l.gradient=props.gradient||null;}
      if(type==='image'){l.src=props.src||'';l.crop=props.crop||null;l.filters=props.filters||{brightness:100,contrast:100,saturation:100,blur:0};l._img=null;}
      if(type==='shape'){l.shapeType=props.shapeType||'rectangle';l.fill=props.fill||'#6C63FF';l.stroke=props.stroke||null;l.strokeWidth=props.strokeWidth||0;l.cornerRadius=props.cornerRadius||0;}
      if(type==='badge'){l.text=props.text||'Badge';l.bgColor=props.bgColor||'#FFD93D';l.textColor=props.textColor||'#000000';l.fontSize=props.fontSize||16;l.fontFamily=props.fontFamily||'Inter';}
      if(type==='barcode'){l.isbn=props.isbn||'9780000000000';}
      if(type==='qrcode'){l.data=props.data||'https://example.com';}
      if(type==='divider'){l.color=props.color||'#FFD93D';l.thickness=props.thickness||0.05;l.style=props.dividerStyle||'solid';}
      this.layers.push(l);
      this.selectedLayer=l;
      this.undo.push({layers:this.layers});
      this.render();
      this.updateUI();
      return l;
    },

    removeLayer:function(id){
      this.layers=this.layers.filter(function(l){return l.id!==id;});
      if(this.selectedLayer&&this.selectedLayer.id===id)this.selectedLayer=null;
      this.undo.push({layers:this.layers});this.render();this.updateUI();
    },

    moveLayer:function(id,dir){
      var idx=this.layers.findIndex(function(l){return l.id===id;});
      if(idx<0)return;
      var newIdx=dir==='up'?idx+1:idx-1;
      if(newIdx<0||newIdx>=this.layers.length)return;
      var tmp=this.layers[idx];this.layers[idx]=this.layers[newIdx];this.layers[newIdx]=tmp;
      this.undo.push({layers:this.layers});this.render();this.updateUI();
    },

    /* ===== RENDER ENGINE ===== */
    render:function(){
      if(!this.ctx)return;
      var ctx=this.ctx,cv=this.canvas;
      var cw=this.dims.coverW,ch=this.dims.coverH;
      var s=this.renderScale*DPI;
      ctx.clearRect(0,0,cv.width,cv.height);
      ctx.fillStyle='#f0f0f5';ctx.fillRect(0,0,cv.width,cv.height);

      ctx.fillStyle='#ffffff';
      ctx.fillRect(this.dims.backX*s,this.dims.BLEED*s,this.dims.backW*s,(ch-2*this.dims.BLEED)*s);
      ctx.fillRect(this.dims.frontX*s,this.dims.BLEED*s,this.dims.frontW*s,(ch-2*this.dims.BLEED)*s);
      ctx.fillStyle='#f8f8fc';
      ctx.fillRect(this.dims.spineX*s,this.dims.BLEED*s,this.dims.spineW*s,(ch-2*this.dims.BLEED)*s);

      for(var i=0;i<this.layers.length;i++){
        var l=this.layers[i];
        if(!l.visible)continue;
        ctx.save();
        ctx.globalAlpha=l.opacity;
        if(l.blendMode!=='normal')ctx.globalCompositeOperation=l.blendMode;
        ctx.beginPath();
        ctx.rect(l.x*s,l.y*s,l.w*s,l.h*s);
        ctx.clip();
        this._renderLayer(ctx,l,s);
        ctx.restore();
      }

      if(this.showSafeZones){
        ctx.setLineDash([4,4]);ctx.strokeStyle='rgba(239,68,68,0.6)';ctx.lineWidth=1;
        ctx.strokeRect(this.dims.BLEED*s,this.dims.BLEED*s,(cw-2*this.dims.BLEED)*s,(ch-2*this.dims.BLEED)*s);
        ctx.strokeStyle='rgba(16,185,129,0.5)';
        ctx.strokeRect((this.dims.BLEED+this.dims.SAFE_TRIM)*s,(this.dims.BLEED+this.dims.SAFE_TRIM)*s,(cw-2*(this.dims.BLEED+this.dims.SAFE_TRIM))*s,(ch-2*(this.dims.BLEED+this.dims.SAFE_TRIM))*s);
        ctx.strokeStyle='rgba(99,102,241,0.4)';
        ctx.beginPath();ctx.moveTo(this.dims.spineX*s,0);ctx.lineTo(this.dims.spineX*s,cv.height);ctx.stroke();
        ctx.beginPath();ctx.moveTo((this.dims.spineX+this.dims.spineW)*s,0);ctx.lineTo((this.dims.spineX+this.dims.spineW)*s,cv.height);ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle='rgba(239,68,68,0.7)';ctx.lineWidth=2;
        ctx.strokeRect(this.dims.barcodeX*s,this.dims.barcodeY*s,this.dims.barcodeW*s,this.dims.barcodeH*s);
        ctx.font=Math.round(10*s)+'px sans-serif';ctx.fillStyle='rgba(239,68,68,0.8)';ctx.textAlign='center';
        ctx.fillText('BARCODE',this.dims.barcodeX*s+this.dims.barcodeW*s/2,this.dims.barcodeY*s+this.dims.barcodeH*s/2+4*s);
      }

      if(this.showGrid){
        ctx.strokeStyle='rgba(148,163,184,0.15)';ctx.lineWidth=0.5;
        var gs=0.25*s;
        for(var gx=0;gx<cv.width;gx+=gs){ctx.beginPath();ctx.moveTo(gx,0);ctx.lineTo(gx,cv.height);ctx.stroke();}
        for(var gy=0;gy<cv.height;gy+=gs){ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(cv.width,gy);ctx.stroke();}
      }

      if(this.selectedLayer){
        var l=this.selectedLayer;
        ctx.strokeStyle='#6366f1';ctx.lineWidth=2;ctx.setLineDash([]);
        ctx.strokeRect(l.x*s,l.y*s,l.w*s,l.h*s);
        var hs=6;
        var handles=[
          {x:l.x,y:l.y},{x:l.x+l.w,y:l.y},{x:l.x,y:l.y+l.h},{x:l.x+l.w,y:l.y+l.h},
          {x:l.x+l.w/2,y:l.y},{x:l.x+l.w/2,y:l.y+l.h},{x:l.x,y:l.y+l.h/2},{x:l.x+l.w,y:l.y+l.h/2}
        ];
        ctx.fillStyle='#6366f1';
        for(var h=0;h<handles.length;h++){
          ctx.fillRect(handles[h].x*s-hs/2,handles[h].y*s-hs/2,hs,hs);
        }
      }

      ctx.font=Math.round(8*s)+'px sans-serif';ctx.fillStyle='rgba(99,102,241,0.5)';ctx.textAlign='center';
      ctx.fillText('BACK',this.dims.backX*s+this.dims.backW*s/2,12*s);
      ctx.fillText('SPINE',this.dims.spineX*s+this.dims.spineW*s/2,12*s);
      ctx.fillText('FRONT',this.dims.frontX*s+this.dims.frontW*s/2,12*s);
    },

    _renderLayer:function(ctx,l,s){
      if(l.type==='text'){
        var fs=l.fontSize*s;
        ctx.font=(l.fontStyle==='italic'?'italic ':'')+(l.fontWeight||'normal')+' '+fs+'px '+(l.fontFamily||'Inter')+', sans-serif';
        ctx.textAlign=l.textAlign||'center';ctx.textBaseline='middle';
        var tx=l.textAlign==='left'?l.x*s+4*s:l.textAlign==='right'?l.x*s+l.w*s-4*s:l.x*s+l.w*s/2;
        var ty=l.y*s+l.h*s/2;
        if(l.shadow){ctx.shadowColor=l.shadow.color||'rgba(0,0,0,0.5)';ctx.shadowBlur=l.shadow.blur*s||4*s;ctx.shadowOffsetX=(l.shadow.offsetX||0)*s;ctx.shadowOffsetY=(l.shadow.offsetY||2)*s;}
        if(l.outline){ctx.strokeStyle=l.outline.color||'#000';ctx.lineWidth=(l.outline.width||1)*s;ctx.strokeText(l.text,tx,ty);}
        if(l.gradient){var grad=ctx.createLinearGradient(l.x*s,l.y*s,l.x*s,l.y*s+l.h*s);grad.addColorStop(0,l.gradient.c1||'#fff');grad.addColorStop(1,l.gradient.c2||'#ccc');ctx.fillStyle=grad;}
        else{ctx.fillStyle=l.textColor||'#fff';}
        if(l.letterSpacing)ctx.letterSpacing=l.letterSpacing*s+'px';
        ctx.fillText(l.text,tx,ty);
        ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
      }else if(l.type==='shape'){
        ctx.fillStyle=l.fill||'#6C63FF';
        if(l.shapeType==='rectangle'){
          if(l.cornerRadius){
            var r=l.cornerRadius*s;
            ctx.beginPath();ctx.moveTo(l.x*s+r,l.y*s);ctx.lineTo(l.x*s+l.w*s-r,l.y*s);ctx.quadraticCurveTo(l.x*s+l.w*s,l.y*s,l.x*s+l.w*s,l.y*s+r);ctx.lineTo(l.x*s+l.w*s,l.y*s+l.h*s-r);ctx.quadraticCurveTo(l.x*s+l.w*s,l.y*s+l.h*s,l.x*s+l.w*s-r,l.y*s+l.h*s);ctx.lineTo(l.x*s+r,l.y*s+l.h*s);ctx.quadraticCurveTo(l.x*s,l.y*s+l.h*s,l.x*s,l.y*s+l.h*s-r);ctx.lineTo(l.x*s,l.y*s+r);ctx.quadraticCurveTo(l.x*s,l.y*s,l.x*s+r,l.y*s);ctx.closePath();ctx.fill();
          }else{ctx.fillRect(l.x*s,l.y*s,l.w*s,l.h*s);}
        }else if(l.shapeType==='circle'){
          ctx.beginPath();ctx.ellipse(l.x*s+l.w*s/2,l.y*s+l.h*s/2,l.w*s/2,l.h*s/2,0,0,Math.PI*2);ctx.fill();
        }else if(l.shapeType==='star'){
          this._drawStar(ctx,l.x*s+l.w*s/2,l.y*s+l.h*s/2,5,l.w*s/2,l.w*s/4);ctx.fill();
        }else if(l.shapeType==='arrow'){
          ctx.beginPath();ctx.moveTo(l.x*s+l.w*s,l.y*s+l.h*s/2);ctx.lineTo(l.x*s+l.w*0.6*s,l.y*s);ctx.lineTo(l.x*s+l.w*0.6*s,l.y*s+l.h*0.3*s);ctx.lineTo(l.x*s,l.y*s+l.h*0.3*s);ctx.lineTo(l.x*s,l.y*s+l.h*0.7*s);ctx.lineTo(l.x*s+l.w*0.6*s,l.y*s+l.h*0.7*s);ctx.lineTo(l.x*s+l.w*0.6*s,l.y*s+l.h*s);ctx.closePath();ctx.fill();
        }else if(l.shapeType==='badge'){
          ctx.beginPath();ctx.arc(l.x*s+l.w*s/2,l.y*s+l.h*s/2,l.w*s/2,0,Math.PI*2);ctx.fill();
        }
        if(l.stroke){ctx.strokeStyle=l.stroke;ctx.lineWidth=(l.strokeWidth||1)*s;ctx.stroke();}
      }else if(l.type==='image'&&l._img){
        ctx.drawImage(l._img,l.x*s,l.y*s,l.w*s,l.h*s);
      }else if(l.type==='badge'){
        ctx.fillStyle=l.bgColor||'#FFD93D';
        ctx.beginPath();
        var bx=l.x*s,by=l.y*s,bw=l.w*s,bh=l.h*s,br=bh/2;
        ctx.moveTo(bx+br,by);ctx.lineTo(bx+bw-br,by);ctx.quadraticCurveTo(bx+bw,by,bx+bw,by+br);ctx.lineTo(bx+bw,by+bh-br);ctx.quadraticCurveTo(bx+bw,by+bh,bx+bw-br,by+bh);ctx.lineTo(bx+br,by+bh);ctx.quadraticCurveTo(bx,by+bh,bx,by+bh-br);ctx.lineTo(bx,by+br);ctx.quadraticCurveTo(bx,by,bx+br,by);ctx.closePath();ctx.fill();
        ctx.fillStyle=l.textColor||'#000';ctx.font='bold '+(l.fontSize||14)*s+'px '+(l.fontFamily||'Inter')+', sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText(l.text,bx+bw/2,by+bh/2);
      }else if(l.type==='barcode'){
        var bc=BarcodeGen.generate(l.isbn||'9780000000000',Math.round(l.w*s));
        ctx.drawImage(bc,l.x*s,l.y*s,l.w*s,l.h*s);
      }else if(l.type==='qrcode'){
        var qr=QRGen.generate(l.data||'https://example.com',Math.round(l.w*s));
        ctx.drawImage(qr,l.x*s,l.y*s,l.w*s,l.h*s);
      }else if(l.type==='divider'){
        ctx.strokeStyle=l.color||'#FFD93D';ctx.lineWidth=(l.thickness||0.05)*s;
        if(l.dividerStyle==='dashed')ctx.setLineDash([4*s,4*s]);
        ctx.beginPath();ctx.moveTo(l.x*s,l.y*s+l.h*s/2);ctx.lineTo(l.x*s+l.w*s,l.y*s+l.h*s/2);ctx.stroke();
        ctx.setLineDash([]);
      }
    },

    _drawStar:function(ctx,cx,cy,spikes,outerR,innerR){
      var rot=Math.PI/2*3,step=Math.PI/spikes;
      ctx.beginPath();ctx.moveTo(cx,cy-outerR);
      for(var i=0;i<spikes;i++){ctx.lineTo(cx+Math.cos(rot)*outerR,cy+Math.sin(rot)*outerR);rot+=step;ctx.lineTo(cx+Math.cos(rot)*innerR,cy+Math.sin(rot)*innerR);rot+=step;}
      ctx.lineTo(cx,cy-outerR);ctx.closePath();
    },

    /* ===== IMAGE LOADING ===== */
    loadImage:function(layer,fileOrUrl){
      var self=this;
      if(typeof fileOrUrl==='string'){
        var img=new Image();img.crossOrigin='anonymous';
        img.onload=function(){layer._img=img;layer.w=img.naturalWidth/DPI*0.5;layer.h=img.naturalHeight/DPI*0.5;self.undo.push({layers:self.layers});self.render();self.updateUI();};
        img.onerror=function(){console.warn('[MXD Designer] Failed to load image:',fileOrUrl);};
        img.src=fileOrUrl;
      }else if(fileOrUrl instanceof File){
        var reader=new FileReader();
        reader.onload=function(e){layer.src=e.target.result;self.loadImage(layer,e.target.result);};
        reader.readAsDataURL(fileOrUrl);
      }
    },

    /* ===== TEMPLATE LOADING ===== */
    loadTemplate:function(tpl){
      this.layers=[];
      var cw=this.dims.coverW,ch=this.dims.coverH;
      var fcx=this.dims.frontX,fcw=this.dims.frontW;
      this.addLayer('shape',{x:this.dims.frontX,y:this.dims.BLEED,w:this.dims.frontW,h:ch-2*this.dims.BLEED,shapeType:'rectangle',fill:tpl.bg1,opacity:1});
      this.addLayer('text',{x:fcx,y:ch*0.3,w:fcw,h:1.5,text:tpl.ft,fontSize:tpl.ts,fontFamily:tpl.tf,fontWeight:'bold',textColor:tpl.tc,textAlign:'center'});
      this.addLayer('text',{x:fcx,y:ch*0.5,w:fcw,h:0.8,text:tpl.fs,fontSize:tpl.ss,fontFamily:tpl.sf,fontWeight:'normal',textColor:tpl.ac,textAlign:'center'});
      this.addLayer('text',{x:fcx,y:ch*0.75,w:fcw,h:0.6,text:tpl.fa,fontSize:tpl.as,fontFamily:tpl.af,fontWeight:'normal',textColor:tpl.tc,textAlign:'center'});
      this.addLayer('badge',{x:fcx+fcw*0.3,y:ch*0.15,w:fcw*0.4,h:0.5,text:tpl.badge,bgColor:tpl.badgeBg,textColor:tpl.badgeColor,fontSize:12,fontFamily:tpl.tf});
      if(tpl.sg){
        this.addLayer('shape',{x:this.dims.frontX,y:this.dims.BLEED,w:this.dims.frontW,h:ch-2*this.dims.BLEED,shapeType:'rectangle',fill:'#000000',opacity:tpl.so,blendMode:'overlay'});
      }
      this.undo.push({layers:this.layers});
      this.render();
      this.updateUI();
    },

    /* ===== EXPORT ===== */
    exportAsPNG:function(panel,quality){
      var ec=document.createElement('canvas');
      var pw=panel==='front'?this.dims.frontW:panel==='back'?this.dims.backW:panel==='spine'?this.dims.spineW:this.dims.coverW;
      var ph=this.dims.coverH;
      var px=panel==='front'?this.dims.frontX:panel==='back'?this.dims.backX:panel==='spine'?this.dims.spineX:0;
      ec.width=Math.round(pw*DPI*(quality||1));ec.height=Math.round(ph*DPI*(quality||1));
      var ectx=ec.getContext('2d');
      var s=DPI*(quality||1);
      ectx.fillStyle='#ffffff';ectx.fillRect(0,0,ec.width,ec.height);
      for(var i=0;i<this.layers.length;i++){
        var l=this.layers[i];if(!l.visible)continue;
        ectx.save();ectx.globalAlpha=l.opacity;
        if(l.blendMode!=='normal')ectx.globalCompositeOperation=l.blendMode;
        ectx.beginPath();ectx.rect(l.x*s,l.y*s,l.w*s,l.h*s);ectx.clip();
        this._renderLayer(ectx,l,s);ectx.restore();
      }
      return ec.toDataURL('image/png');
    },

    exportAsPDF:function(){
      if(typeof window.jspdf==='undefined'&&typeof jsPDF==='undefined'){alert('jsPDF not loaded. Please ensure the library is loaded.');return;}
      var jsPDFLib=typeof jsPDF!=='undefined'?jsPDF:window.jspdf.jsPDF;
      var doc=new jsPDFLib({orientation:this.dims.coverW>this.dims.coverH?'landscape':'portrait',unit:'in',format:[this.dims.coverW,this.dims.coverH]});
      var png=this.exportAsPNG('full',1);
      doc.addImage(png,'PNG',0,0,this.dims.coverW,this.dims.coverH);
      doc.save('mxd-cover-'+Date.now()+'.pdf');
    },

    /* ===== 3D MOCKUP ===== */
    generate3DMockup:function(angle,bgColor){
      var cv=document.createElement('canvas');cv.width=800;cv.height=600;
      var ctx=cv.getContext('2d');
      ctx.fillStyle=bgColor||'#f0f0f5';ctx.fillRect(0,0,cv.width,cv.height);
      var coverImg=new Image();
      var self=this;
      coverImg.onload=function(){
        var bw=200,bh=280,spineW=20;
        var cx=300,cy=150;
        if(angle==='front'){
          ctx.save();ctx.translate(cx,cy);
          ctx.drawImage(coverImg,0,0,bw,bh);
          ctx.restore();
        }else if(angle==='3d'){
          ctx.save();ctx.translate(cx,cy);
          ctx.transform(1,0.1,-0.3,1,0,0);
          ctx.drawImage(coverImg,0,0,bw,bh);
          ctx.restore();
        }else if(angle==='spine'){
          ctx.save();ctx.translate(cx,cy);
          ctx.fillRect(0,0,spineW,bh,'#333');
          ctx.restore();
        }else if(angle==='flat'){
          ctx.save();ctx.translate(cx,cy);
          ctx.drawImage(coverImg,-bw/2,-bh/2,bw,bh);
          ctx.restore();
        }else if(angle==='standing'){
          ctx.save();ctx.translate(cx,cy);
          ctx.transform(0.8,0.15,-0.1,1,0,0);
          ctx.drawImage(coverImg,0,0,bw,bh);
          ctx.fillStyle='rgba(0,0,0,0.15)';
          ctx.beginPath();ctx.ellipse(bw/2+20,bh+10,bw/2,20,0,0,Math.PI*2);ctx.fill();
          ctx.restore();
        }
      };
      coverImg.src=this.exportAsPNG('front',1);
      return cv;
    },

    /* ===== AI STUDIO ===== */
    setApiKey:function(key){
      this.apiKey=key;
      try{localStorage.setItem('mxd_designer_api_key',key);}catch(e){}
    },

    loadApiKey:function(){
      try{this.apiKey=localStorage.getItem('mxd_designer_api_key')||null;}catch(e){}
    },

    aiGenerateBackground:function(prompt,callback){
      if(!this.apiKey){callback(null,'No API key. Set your Gemini API key in Settings.');return;}
      fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key='+this.apiKey,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({contents:[{parts:[{text:'Generate a book cover background: '+prompt+'. Describe the color scheme, layout, and visual elements in detail.'}]}],generationConfig:{temperature:0.7}})
      }).then(function(r){return r.json();}).then(function(data){
        if(data.candidates&&data.candidates[0]&&data.candidates[0].content&&data.candidates[0].content.parts[0]){
          callback(data.candidates[0].content.parts[0].text,null);
        }else{callback(null,'AI response format error');}
      }).catch(function(err){callback(null,'AI request failed: '+err.message);});
    },

    aiSuggestColors:function(genre){
      var genreColors={puzzle:['#FF6B35','#1A659E','#6C63FF'],senior:['#E8601C','#AEC6CF','#77DD77'],kids:['#FF6B6B','#4ECDC4','#FFEAA7'],christmas:['#C41E3A','#165B33','#FFD700'],nature:['#606C38','#283618','#DDA15E'],romance:['#FFB5A7','#FCD5CE','#F8EDEB'],thriller:['#0D1B2A','#1B263B','#9B2335'],fantasy:['#414288','#3594B1','#9B2335'],mystery:['#264653','#2A9D8F','#E9C46A'],business:['#0D1B2A','#415A77','#E0E1DD']};
      return genreColors[genre]||Color.palettes.vibrant;
    },

    aiSuggestFonts:function(genre){
      var genreFonts={puzzle:['Inter','Oswald'],senior:['Inter','Georgia'],kids:['Nunito','Pacifico'],christmas:['Pacifico','Merriweather'],nature:['Merriweather','Lato'],romance:['Playfair Display','Source Sans Pro'],thriller:['Bebas Neue','Raleway'],fantasy:['Playfair Display','Montserrat'],mystery:['Merriweather','Lato'],business:['Montserrat','Open Sans']};
      return genreFonts[genre]||['Inter','Roboto'];
    },

    /* ===== KDP COMPLIANCE CHECK ===== */
    checkCompliance:function(){
      var issues=[];
      if(this.dims.errors.length)issues=issues.concat(this.dims.errors);
      for(var i=0;i<this.layers.length;i++){
        var l=this.layers[i];
        if(l.type==='text'){
          if(l.x<this.dims.BLEED+this.dims.SAFE_TRIM)issues.push('Text "'+l.text+'" too close to left edge');
          if(l.y<this.dims.BLEED+this.dims.SAFE_TRIM)issues.push('Text "'+l.text+'" too close to top edge');
          if(l.x+l.w>this.dims.coverW-this.dims.BLEED-this.dims.SAFE_TRIM)issues.push('Text "'+l.text+'" too close to right edge');
          if(l.y+l.h>this.dims.coverH-this.dims.BLEED-this.dims.SAFE_TRIM)issues.push('Text "'+l.text+'" too close to bottom edge');
        }
      }
      var barcodeInArea=this.layers.some(function(l){return l.type==='barcode';});
      if(!barcodeInArea)issues.push('No barcode on back cover');
      if(!this.dims.spineTextAllowed){
        var spineText=this.layers.filter(function(l){return l.type==='text'&&l.x>=this.dims.spineX&&l.x+l.w<=this.dims.spineX+this.dims.spineW;}.bind(this));
        if(spineText.length)issues.push('Spine text not allowed (less than 79 pages)');
      }
      return issues;
    },

    /* ===== AUTO-SAVE ===== */
    startAutoSave:function(){
      var self=this;
      this.autoSaveTimer=setInterval(function(){self.saveProject();},AUTO_SAVE_MS);
    },

    saveProject:function(){
      try{
        var data={dims:this.dims,layers:this.layers,zoom:this.zoom,showSafeZones:this.showSafeZones,showGrid:this.showGrid,timestamp:Date.now()};
        var json=JSON.stringify(data);
        var db=window.MXDDatabase;
        if(db&&db.put){db.put('settings','cover_designer_project',data).catch(function(){});}
        else{localStorage.setItem('mxd_designer_project',json);}
      }catch(e){}
    },

    loadProject:function(){
      try{
        var db=window.MXDDatabase;
        var self=this;
        if(db&&db.get){
          db.get('settings','cover_designer_project').then(function(data){
            if(data){self.dims=data.dims;self.layers=data.layers;self.zoom=data.zoom||1;self.showSafeZones=data.showSafeZones||false;self.showGrid=data.showGrid||false;self.render();self.updateUI();}
          }).catch(function(){});
        }else{
          var json=localStorage.getItem('mxd_designer_project');
          if(json){var data=JSON.parse(json);this.dims=data.dims;this.layers=data.layers;this.zoom=data.zoom||1;this.showSafeZones=data.showSafeZones||false;this.showGrid=data.showGrid||false;this.render();this.updateUI();}
        }
      }catch(e){}
    },

    /* ===== UI UPDATES ===== */
    updateUI:function(){
      if(window.MXDDesignerUI&&window.MXDDesignerUI.update)window.MXDDesignerUI.update(this);
    },

    /* ===== PUBLIC API ===== */
    setDimensions:function(opts){
      this.dims=KDP.calculate(opts);
      this.resize();this.render();this.updateUI();
    },

    toggleSafeZones:function(){this.showSafeZones=!this.showSafeZones;this.render();},
    toggleGrid:function(){this.showGrid=!this.showGrid;this.render();},
    toggleRulers:function(){this.showRulers=!this.showRulers;this.render();},

    setZoom:function(z){this.zoom=Math.max(0.2,Math.min(5,z));this.resize();},
    fitToView:function(){this.zoom=1;this.panX=0;this.panY=0;this.resize();},

    getThumbnail:function(){
      var cv=document.createElement('canvas');cv.width=160;cv.height=Math.round(160*(this.dims.coverH/this.dims.coverW));
      var ctx=cv.getContext('2d');
      var s=160/(this.dims.coverW*DPI)*DPI;
      ctx.fillStyle='#fff';ctx.fillRect(0,0,cv.width,cv.height);
      for(var i=0;i<this.layers.length;i++){var l=this.layers[i];if(!l.visible)continue;ctx.save();ctx.globalAlpha=l.opacity;this._renderLayer(ctx,l,s);ctx.restore();}
      return cv.toDataURL('image/png');
    },

    getLayerState:function(){return{layers:this.layers,selectedLayer:this.selectedLayer?this.selectedLayer.id:null};},
    setLayerState:function(state){this.layers=state.layers;this.selectedLayer=state.selectedLayer?this.layers.find(function(l){return l.id===state.selectedLayer;}):null;this.render();this.updateUI();},

    destroy:function(){
      if(this.autoSaveTimer)clearInterval(this.autoSaveTimer);
      if(this.canvasWrap&&this.canvasWrap.parentNode)this.canvasWrap.parentNode.removeChild(this.canvasWrap);
    }
  };

  /* ===== EXPORT TO WINDOW ===== */
  window.MXDDesigner=Designer;
  window.MXDDesignerKDP=KDP;
  window.MXDDesignerColor=Color;
  window.MXDDesignerFonts=FontPairs;
  window.MXDDesignerTemplates=TEMPLATES;
  window.MXDDesignerShapes=window.SHAPES;
  window.MXDDesignerQR=QRGen;
  window.MXDDesignerBarcode=BarcodeGen;
  window.MXDCoverDesigner={
    version:'1.0',
    calculate:function(opts){return KDP.calculate(opts);},
    generateTemplate:generateCoverTemplatePDF,
    renderPreview:renderCoverPreview,
    exportCover:exportCoverAsPDF,
    templateTypes:CoverTemplateTypes,
    wrapText:wrapText,
    applyDesign:applyDesignToCanvas
  };

  console.log('[MXD Designer v'+Designer.version+'] Loaded — Professional KDP Cover Design Studio');
})();
