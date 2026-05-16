// ui-base.jsx — base UI components, stored in window.WS
window.WS = {};
const { useState, useEffect } = React;

WS.Toggle = function({ label, checked, onChange, id, sublabel }) {
  return (
    <div className="tog-row">
      <div>
        <span className="tog-lbl">{label}</span>
        {sublabel && <div style={{fontSize:10,color:'var(--t3)',marginTop:1}}>{sublabel}</div>}
      </div>
      <label className="tog-sw" htmlFor={id}>
        <input type="checkbox" id={id} checked={checked} onChange={e=>onChange(e.target.checked)}/>
        <span className="tog-sl"/>
      </label>
    </div>
  );
};

WS.Section = function({ title, icon, children, defaultOpen=true, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="sec">
      <div className="sec-hd" onClick={()=>setOpen(!open)}>
        <span className="sec-title">
          <span className="sec-icon">{icon}</span>{title}
          {badge && <span style={{marginLeft:4,background:'var(--acc)',color:'#fff',fontSize:9,padding:'1px 6px',borderRadius:10,fontWeight:700}}>{badge}</span>}
        </span>
        <span className={`sec-chev ${open?'':'shut'}`}>▾</span>
      </div>
      <div className={`sec-body ${open?'':'shut'}`}>{children}</div>
    </div>
  );
};

WS.Slider = function({ label, value, min, max, step=1, onChange, unit='' }) {
  return (
    <div className="sl-wrap">
      <div className="sl-hd">
        <span className="lbl">{label}</span>
        <span className="sl-val">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e=>onChange(Number(e.target.value))}/>
    </div>
  );
};

WS.Toast = function({ message, type='info', onClose }) {
  useEffect(()=>{ const t=setTimeout(onClose,3800); return()=>clearTimeout(t); },[]);
  const icons={success:'✓',error:'⚠',info:'ℹ',warn:'⚡'};
  return <div className={`toast ${type}`}>{icons[type]||'ℹ'} {message}</div>;
};

WS.Progress = function({ done, total, label }) {
  const pct=total>0?Math.round((done/total)*100):0;
  return (
    <div className="prog-wrap">
      <div className="prog-bg"><div className="prog-fill" style={{width:`${pct}%`}}/></div>
      <div className="prog-txt">{label||`${done}/${total}`} — {pct}%</div>
    </div>
  );
};

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

WS.NumberInput = function({ label, value, min, max, onChange }) {
  return (
    <div className="fg">
      <label className="lbl">{label}</label>
      <input className="inp" type="number" min={min} max={max} value={value}
        onChange={e=>onChange(Math.min(max,Math.max(min,+e.target.value||min)))
      }/>
    </div>
  );
};

WS.Select = function({ label, value, options, onChange }) {
  return (
    <div className="fg">
      {label && <label className="lbl">{label}</label>}
      <select className="sel" value={value} onChange={e=>onChange(e.target.value)}>
        {options.map(o=>(
          <option key={o.v||o} value={o.v||o}>{o.l||o}</option>
        ))}
      </select>
    </div>
  );
};
