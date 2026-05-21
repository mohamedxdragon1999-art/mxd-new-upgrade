(function(){
  'use strict';

  function buildDesignerToolbar(toolbar){
    var D=window.MXDDesignerInstance;
    if(!D||!toolbar)return;
    toolbar.innerHTML='';
    toolbar.style.color='#e2e8f0';toolbar.style.fontFamily='system-ui';toolbar.style.fontSize='12px';

    function sec(title){
      var h=document.createElement('div');h.style.cssText='font-size:11px;font-weight:700;color:#94a3b8;margin:12px 0 6px;text-transform:uppercase;letter-spacing:0.5px;';h.textContent=title;toolbar.appendChild(h);
    }
    function row(label,input){
      var r=document.createElement('div');r.style.cssText='margin-bottom:8px;';
      if(label){var l=document.createElement('div');l.style.cssText='font-size:10px;color:#64748b;margin-bottom:3px;';l.textContent=label;r.appendChild(l);}
      r.appendChild(input);toolbar.appendChild(r);return r;
    }
    function btn(text,cls,onClick){
      var b=document.createElement('button');b.style.cssText='width:100%;padding:8px 12px;border:none;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;font-family:system-ui;'+(cls==='pri'?'background:#6366f1;color:#fff;':cls==='ok'?'background:#10b981;color:#fff;':cls==='err'?'background:#ef4444;color:#fff;':'background:#1e293b;color:#e2e8f0;border:1px solid rgba(255,255,255,0.06);');b.textContent=text;b.addEventListener('click',onClick);return b;
    }
    function sel(options,onChange){
      var s=document.createElement('select');s.style.cssText='width:100%;padding:6px 8px;background:#1e293b;color:#e2e8f0;border:1px solid rgba(255,255,255,0.06);border-radius:4px;font-size:11px;';
      options.forEach(function(o){var opt=document.createElement('option');opt.value=o.v;opt.textContent=o.l;s.appendChild(opt);});
      s.addEventListener('change',function(){onChange(s.value);});return s;
    }
    function inp(type,placeholder,onChange){
      var i=document.createElement('input');i.type=type;i.placeholder=placeholder||'';i.style.cssText='width:100%;padding:6px 8px;background:#1e293b;color:#e2e8f0;border:1px solid rgba(255,255,255,0.06);border-radius:4px;font-size:11px;';
      if(type==='number'){i.min=0;i.step='any';}
      i.addEventListener('change',function(){onChange(i.value);});return i;
    }

    sec('Dimensions');
    var KDP=window.MXDKDPSuite||{trimSizes:[{id:'8.5x11',w:8.5,h:11,label:'8.5x11'}]};
    row('Trim Size',sel(KDP.trimSizes.map(function(t){return{v:t.id,l:t.label};}),function(v){
      var ts=KDP.trimSizes.find(function(t){return t.id===v;});
      if(ts)D.setDimensions({trimW:ts.w,trimH:ts.h,pageCount:D.dims.pageCount,paperType:D.dims.paperType});
    }));
    row('Page Count',inp('number','100',function(v){
      D.setDimensions({trimW:D.dims.trimW,trimH:D.dims.trimH,pageCount:parseInt(v)||100,paperType:D.dims.paperType});
    }));
    row('Paper Type',sel([{v:'white_bw',l:'White Paper B&W'},{v:'cream_bw',l:'Cream Paper B&W'},{v:'standard_color',l:'Standard Color'},{v:'premium_color',l:'Premium Color'}],function(v){
      D.setDimensions({trimW:D.dims.trimW,trimH:D.dims.trimH,pageCount:D.dims.pageCount,paperType:v});
    }));

    sec('Add Elements');
    var addRow=document.createElement('div');addRow.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:8px;';
    [
      {t:'Title',type:'text',p:{text:'YOUR TITLE',fontSize:48,fontWeight:'bold',textColor:'#FFFFFF',textAlign:'center',x:0.5,y:2,w:5,h:1.5}},
      {t:'Subtitle',type:'text',p:{text:'Subtitle Here',fontSize:20,fontWeight:'normal',textColor:'#FFD93D',textAlign:'center',x:0.5,y:3.8,w:5,h:0.6}},
      {t:'Author',type:'text',p:{text:'Author Name',fontSize:16,fontWeight:'normal',textColor:'#FFFFFF',textAlign:'center',x:0.5,y:7,w:5,h:0.5}},
      {t:'Badge',type:'badge',p:{text:'100 Puzzles',bgColor:'#FFD93D',textColor:'#000000',fontSize:14,x:1,y:0.5,w:3,h:0.5}},
      {t:'Rectangle',type:'shape',p:{shapeType:'rectangle',fill:'#6C63FF',x:0.5,y:0.5,w:2,h:1}},
      {t:'Circle',type:'shape',p:{shapeType:'circle',fill:'#FF6584',x:1,y:1,w:1.5,h:1.5}},
      {t:'Image',type:'image',p:{x:0.5,y:0.5,w:3,h:3}},
      {t:'Barcode',type:'barcode',p:{isbn:'9780000000000',x:0.5,y:7.5,w:2,h:1.2}},
      {t:'QR Code',type:'qrcode',p:{data:'https://example.com',x:3,y:7.5,w:1.5,h:1.5}},
      {t:'Divider',type:'divider',p:{color:'#FFD93D',thickness:0.04,x:0.5,y:4.5,w:5,h:0.1}}
    ].forEach(function(item){
      var b=document.createElement('button');b.style.cssText='padding:6px 8px;background:#1e293b;color:#e2e8f0;border:1px solid rgba(255,255,255,0.06);border-radius:4px;cursor:pointer;font-size:10px;font-weight:500;font-family:system-ui;text-align:center;';b.textContent=item.t;
      b.addEventListener('click',function(){
        if(item.type==='image'){
          var fi=document.createElement('input');fi.type='file';fi.accept='image/*';
          fi.addEventListener('change',function(e){
            if(e.target.files[0]){var l=D.addLayer(item.type,item.p);D.loadImage(l,e.target.files[0]);}
          });fi.click();
        }else{D.addLayer(item.type,item.p);}
      });
      addRow.appendChild(b);
    });
    toolbar.appendChild(addRow);

    sec('Layers');
    var layersDiv=document.createElement('div');layersDiv.id='mxd-layers-list';layersDiv.style.cssText='max-height:150px;overflow-y:auto;margin-bottom:8px;';
    toolbar.appendChild(layersDiv);
    function updateLayersList(){
      layersDiv.innerHTML='';
      D.layers.slice().reverse().forEach(function(l){
        var r=document.createElement('div');r.style.cssText='display:flex;align-items:center;gap:4px;padding:4px 6px;background:'+(D.selectedLayer&&D.selectedLayer.id===l.id?'rgba(99,102,241,0.2)':'transparent')+';border-radius:4px;margin-bottom:2px;cursor:pointer;';
        var vis=document.createElement('span');vis.textContent=l.visible?'👁':'👁‍🗨';vis.style.cssText='cursor:pointer;font-size:10px;';
        vis.addEventListener('click',function(e){e.stopPropagation();l.visible=!l.visible;D.render();updateLayersList();});
        var name=document.createElement('span');name.style.cssText='flex:1;font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';name.textContent=(l.type==='text'?l.text:l.type==='badge'?l.text:l.type==='shape'?l.shapeType:l.type).substring(0,20);
        name.addEventListener('click',function(e){e.stopPropagation();D.selectedLayer=l;D.render();updateLayersList();});
        var del=document.createElement('span');del.textContent='✖';del.style.cssText='cursor:pointer;font-size:10px;color:#ef4444;';
        del.addEventListener('click',function(e){e.stopPropagation();D.removeLayer(l.id);});
        r.appendChild(vis);r.appendChild(name);r.appendChild(del);layersDiv.appendChild(r);
      });
    }
    D.updateUI=function(){updateLayersList();};
    updateLayersList();

    sec('Templates');
    var tplGrid=document.createElement('div');tplGrid.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:4px;max-height:200px;overflow-y:auto;margin-bottom:8px;';
    (window.MXDDesignerTemplates||[]).slice(0,20).forEach(function(tpl){
      var b=document.createElement('button');b.style.cssText='padding:6px 8px;background:linear-gradient(135deg,'+tpl.bg1+','+tpl.bg2+');color:'+(tpl.tc||'#fff')+';border:none;border-radius:4px;cursor:pointer;font-size:9px;font-weight:600;font-family:system-ui;text-align:center;min-height:32px;';b.textContent=tpl.name;
      b.addEventListener('click',function(){D.loadTemplate(tpl);});
      tplGrid.appendChild(b);
    });
    toolbar.appendChild(tplGrid);

    sec('View');
    var togRow=document.createElement('div');togRow.style.cssText='display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;margin-bottom:8px;';
    [{t:'Safe Zones',fn:function(){D.toggleSafeZones();}},{t:'Grid',fn:function(){D.toggleGrid();}},{t:'Fit View',fn:function(){D.fitToView();}}].forEach(function(item){
      var b=document.createElement('button');b.style.cssText='padding:6px 8px;background:#1e293b;color:#e2e8f0;border:1px solid rgba(255,255,255,0.06);border-radius:4px;cursor:pointer;font-size:10px;font-family:system-ui;';b.textContent=item.t;
      b.addEventListener('click',item.fn);togRow.appendChild(b);
    });
    toolbar.appendChild(togRow);

    sec('Export');
    toolbar.appendChild(btn('Export PDF', 'pri', function(){D.exportAsPDF();}));
    toolbar.appendChild(btn('Export PNG (Front)', 'ok', function(){
      var dataUrl=D.exportAsPNG('front',1);
      var a=document.createElement('a');a.href=dataUrl;a.download='mxd-cover-front.png';a.click();
    }));
    toolbar.appendChild(btn('Export PNG (Full Spread)', '', function(){
      var dataUrl=D.exportAsPNG('full',1);
      var a=document.createElement('a');a.href=dataUrl;a.download='mxd-cover-full.png';a.click();
    }));

    sec('AI Studio');
    var apiKeyInp=inp('text','Gemini API Key',function(v){D.setApiKey(v);});
    if(D.apiKey)apiKeyInp.value=D.apiKey;
    row('API Key',apiKeyInp);
    var aiPrompt=document.createElement('textarea');aiPrompt.placeholder='Describe your cover background...';aiPrompt.style.cssText='width:100%;padding:6px 8px;background:#1e293b;color:#e2e8f0;border:1px solid rgba(255,255,255,0.06);border-radius:4px;font-size:11px;min-height:60px;resize:vertical;font-family:system-ui;';
    toolbar.appendChild(aiPrompt);
    toolbar.appendChild(btn('Generate Background', 'pri', function(){
      var prompt=aiPrompt.value;
      if(!prompt){alert('Enter a description first');return;}
      btn.textContent='Generating...';
      D.aiGenerateBackground(prompt,function(result,err){
        btn.textContent='Generate Background';
        if(err){alert(err);return;}
        var colors=result.match(/#[0-9A-Fa-f]{6}/g);
        if(colors&&colors.length>=2){
          D.addLayer('shape',{x:D.dims.frontX,y:D.dims.BLEED,w:D.dims.frontW,h:D.dims.coverH-2*D.dims.BLEED,shapeType:'rectangle',fill:colors[0],opacity:1});
          if(window.showToast)window.showToast('AI background generated with colors: '+colors.slice(0,3).join(', '),'success');
        }else{
          if(window.showToast)window.showToast('AI response: '+result.substring(0,100)+'...','info');
        }
      });
    }));
    toolbar.appendChild(btn('Suggest Colors (Puzzle)', '', function(){
      var colors=D.aiSuggestColors('puzzle');
      if(window.showToast)window.showToast('Suggested: '+colors.join(', '),'info');
    }));
    toolbar.appendChild(btn('Suggest Fonts (Puzzle)', '', function(){
      var fonts=D.aiSuggestFonts('puzzle');
      if(window.showToast)window.showToast('Suggested: '+fonts.join(', '),'info');
    }));

    sec('KDP Compliance');
    toolbar.appendChild(btn('Check Compliance', '', function(){
      var issues=D.checkCompliance();
      if(issues.length){if(window.showToast)window.showToast(issues.length+' issues: '+issues.slice(0,3).join(', '),'warn');}
      else{if(window.showToast)window.showToast('All checks passed!','success');}
    }));
    toolbar.appendChild(btn('Thumbnail Test', '', function(){
      var thumb=D.getThumbnail();
      var w=window.open('','_blank','width=200,height=300');
      w.document.write('<html><head><title>Thumbnail Test</title></head><body style="margin:0;display:flex;align-items:center;justify-content:center;background:#f0f0f5;"><img src="'+thumb+'" style="width:160px;"/></body></html>');
    }));
  }

  window.buildDesignerToolbar = buildDesignerToolbar;
  console.log('[MXD Cover Designer Toolbar] Loaded');
})();
