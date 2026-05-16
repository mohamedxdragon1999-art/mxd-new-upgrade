// ui-grid.jsx — Advanced Grid & List Components
const { useMemo } = React;

const HCOLORS=['#6c63ff','#22c55e','#f59e0b','#ef4444','#3b82f6','#ec4899','#14b8a6','#f97316'];

WS.PuzzleGrid = function({ grid, mask, placements, showSol, solStyle, foundWords,
  hlColor, fontWeight, cellSize, onMouseDown, onMouseEnter, onMouseUp, selCells, tmpl, cfg }) {

  const R=grid.length, C=grid[0].length;
  const cs=cellSize||28;
  const letterSpacing = cfg?.letterSpacing || 0;
  const gridRadius = cfg?.gridRadius || 0;
  const enableGlow = cfg?.enableGlow || false;

  const solSet=useMemo(()=>{
    if(!showSol)return new Set();
    const s=new Set();
    Object.values(placements).forEach(cells=>cells.forEach(([r,c])=>s.add(`${r}-${c}`)));
    return s;
  },[showSol,placements]);

  const lines=useMemo(()=>{
    const out=[];
    const drawSet = (words, prefix, opacity) => {
       words.forEach((w,ci)=>{
          if(!placements[w]||placements[w].length<2)return;
          const cells=placements[w];
          const[r1,c1]=cells[0],[r2,c2]=cells[cells.length-1];
          out.push({x1:c1*cs+cs/2,y1:r1*cs+cs/2,x2:c2*cs+cs/2,y2:r2*cs+cs/2,
            color:tmpl?.bw?'#aaa':HCOLORS[ci%HCOLORS.length],key:`${prefix}-${w}`, opacity});
       });
    };
    if(showSol && solStyle === 'highlight') drawSet(Object.keys(placements), 'sol', 0.25);
    drawSet(foundWords, 'found', 0.35);
    return out;
  },[showSol,placements,foundWords,cs,tmpl,solStyle]);

  return(
    <div className="gw" style={{
      filter: enableGlow ? `drop-shadow(0 0 10px ${hlColor || '#6c63ff'}44)` : 'none'
    }}>
      <div className="gg"
        style={{gridTemplateColumns:`repeat(${C},${cs}px)`,
          gridTemplateRows:`repeat(${R},${cs}px)`,
          width:C*cs,height:R*cs, borderRadius: gridRadius, overflow: 'hidden'}}
        onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>

        <svg className="gsvg" width={C*cs} height={R*cs}>
          {lines.map(l=>(
            <line key={l.key} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke={l.color} strokeWidth={cs*0.8} strokeLinecap="round" opacity={l.opacity}/>
          ))}
          {selCells.length>1&&(
            <line
              x1={selCells[0][1]*cs+cs/2} y1={selCells[0][0]*cs+cs/2}
              x2={selCells[selCells.length-1][1]*cs+cs/2}
              y2={selCells[selCells.length-1][0]*cs+cs/2}
              stroke={hlColor||'#6c63ff'} strokeWidth={cs*0.8} strokeLinecap="round" opacity={0.4}/>
          )}
        </svg>

        {grid.map((row,ri)=>row.map((cell,ci)=>{
          if(!mask[ri][ci])return <div key={`${ri}-${ci}`} style={{width:cs,height:cs}}/>;
          
          const isSol=solSet.has(`${ri}-${ci}`);
          const isSel=selCells.some(([r,c])=>r===ri&&c===ci);
          const isFound=foundWords.some(w=>placements[w]?.some(([r,c])=>r===ri&&c===ci));
          
          let color=tmpl?.cc||'#2d2d44';
          let bg='transparent';
          let border='none';

          if(isSel){bg=`${hlColor||'#6c63ff'}44`;}
          if(showSol && isSol){
            if(solStyle==='grey_circle'){ border='1px solid rgba(0,0,0,0.3)'; }
            if(solStyle==='grey_square'){ border='1px solid rgba(0,0,0,0.3)'; }
          }

          return(
            <div key={`${ri}-${ci}`} className="gc"
              style={{width:cs,height:cs,fontSize:cs*0.5,fontWeight,
                fontFamily:tmpl?.ff,color,background:bg, border, borderRadius: gridRadius,
                letterSpacing: `${letterSpacing}px`}}
              onMouseDown={()=>onMouseDown(ri,ci)}
              onMouseEnter={()=>onMouseEnter(ri,ci)}>
              {cell}
            </div>
          );
        }))}
      </div>
    </div>
  );
};

WS.WordList = function({ words, foundWords, fontSize, columns, tmpl }) {
  const cols=columns||4;
  return(
    <div className="wls" style={{borderTopColor:tmpl?.ac||'#eee'}}>
      <div className="wlt" style={{color:tmpl?.tc||'#2d2d44',fontFamily:tmpl?.ff}}>Words to Find</div>
      <div style={{display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gap:10}}>
        {words.map(w=>{
          const done=foundWords.includes(w);
          return(
            <span key={w} className={`wp${done?' found':''}`}
              style={{fontSize, display: 'flex', alignItems: 'center', gap: 6,
                backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.1)',
                color: done?'#22c55e':'#333', borderRadius: 4, padding: '4px 8px'}}>
              <div style={{width: 12, height: 12, border: '1px solid #ccc', background: done?'#22c55e':'#fff'}} />
              {w.toUpperCase()}
            </span>
          );
        })}
      </div>
    </div>
  );
};
