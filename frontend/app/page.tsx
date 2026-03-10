'use client';
import React, { useState, useCallback, useEffect } from 'react';
import StockChart from '@/components/StockChart';
import { fetchPrediction, fetchHistory, Prediction, HistoricalPoint } from '@/services/api';

/* ─── tiny style helper ─── */
const S = (obj: React.CSSProperties) => obj;

/* ─── Currency helper ─── */
function getCurrency(symbol: string): string {
  return symbol.includes('.NS') || symbol.includes('.BO') ? '₹' : '$';
}

/* ─── Watchlist data ─── */
const WL = [
  { sym:'AAPL',         px:189.30, chg:+1.24 },
  { sym:'TSLA',         px:248.50, chg:-2.11 },
  { sym:'MSFT',         px:415.20, chg:+0.87 },
  { sym:'GOOG',         px:175.80, chg:+0.54 },
  { sym:'AMZN',         px:198.40, chg:+1.92 },
  { sym:'NVDA',         px:875.30, chg:+3.45 },
  { sym:'META',         px:512.60, chg:-0.73 },
  { sym:'RELIANCE.NS',  px:2847.0, chg:+0.31 },
];

const INDICES = [
  { n:'NIFTY 50',   v:'22,147.25', chg:'+54.30',  up:true  },
  { n:'SENSEX',     v:'73,018.15', chg:'+348.10', up:true  },
  { n:'BANK NIFTY', v:'46,312.40', chg:'-112.55', up:false },
  { n:'MIDCAP',     v:'44,820.60', chg:'+88.40',  up:true  },
];

const TICKER_ITEMS = [
  ...WL.map(w => ({ l:w.sym, v:`${getCurrency(w.sym)}${w.px}`, up: w.chg >= 0, chg: w.chg })),
  ...INDICES.map(i => ({ l:i.n, v:i.v, up:i.up, chg:0 })),
];

/* ─── SVG Icons ─── */
const Ic = {
  home:      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  grid:      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  clock:     <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  search:    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  sun:       <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  moon:      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  bell:      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  trend:     <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  up:        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={12} height={12}><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
  down:      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={12} height={12}><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>,
  star:      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={16} height={16}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  spin:      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" className="spin-anim"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity=".2"/><path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>,
  warn:      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" width={18} height={18}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  check:     <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" width={18} height={18}><polyline points="20 6 9 17 4 12"/></svg>,
};

/* ─────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────── */

/* Ticker tape */
function TickerTape() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="ticker-outer" style={{ background:'var(--bg-card)', borderBottom:'1px solid var(--border)', height:32, display:'flex', alignItems:'center' }}>
      <div className="ticker-inner">
        {items.map((item, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:6, padding:'0 20px', borderRight:'1px solid var(--border)' }}>
            <span className="num" style={{ fontSize:11, fontWeight:600, color:'var(--t2)' }}>{item.l}</span>
            <span className="num" style={{ fontSize:11, fontWeight:700, color:'var(--t1)' }}>{item.v}</span>
            <span className="num" style={{ fontSize:10, fontWeight:700, color: item.up ? 'var(--green)' : 'var(--red)' }}>
              {item.up ? '▲' : '▼'} {Math.abs(item.chg).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Navbar */
function Navbar({ dark, setDark, page, setPage }: {
  dark:boolean; setDark:(b:boolean)=>void; page:string; setPage:(s:string)=>void;
}) {
  const navItems = [
    { id:'home',      label:'Home',      icon: Ic.home  },
    { id:'dashboard', label:'Dashboard', icon: Ic.grid  },
    { id:'previous',  label:'Previous',  icon: Ic.clock },
  ];
  return (
    <header style={{ background:'var(--bg-card)', borderBottom:'1px solid var(--border)', height:60, display:'flex', alignItems:'center', padding:'0 24px', gap:16, position:'sticky', top:0, zIndex:100, boxShadow:'var(--shadow1)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginRight:8 }}>
        <div style={{ width:34, height:34, borderRadius:10, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(37,99,235,.35)' }}>
          {Ic.trend}
        </div>
        <div>
          <div style={{ fontSize:14, fontWeight:800, color:'var(--t1)', lineHeight:1.1 }}>Kite AI</div>
          <div style={{ fontSize:10, color:'var(--t3)', lineHeight:1.1 }}>Intelligence Platform</div>
        </div>
      </div>

      <nav style={{ display:'flex', gap:4, marginLeft:8 }}>
        {navItems.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)} style={{
            display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:10,
            fontSize:13, fontWeight:600, border:'none', cursor:'pointer', transition:'all .15s',
            background: page===n.id ? 'var(--accent-bg)' : 'transparent',
            color:      page===n.id ? 'var(--accent)'    : 'var(--t2)',
          }}>
            {n.icon}{n.label}
          </button>
        ))}
      </nav>

      <div style={{ flex:1 }} />

      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <button onClick={() => setDark(!dark)} title={dark?'Light mode':'Dark mode'} style={{
          width:36, height:36, borderRadius:10, border:'none', cursor:'pointer',
          background:'var(--bg-input)', color:'var(--t2)', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s',
        }}>{dark ? Ic.sun : Ic.moon}</button>

        <button style={{
          width:36, height:36, borderRadius:10, border:'none', cursor:'pointer', position:'relative',
          background:'var(--bg-input)', color:'var(--t2)', display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          {Ic.bell}
          <span style={{ position:'absolute', top:7, right:7, width:7, height:7, borderRadius:'50%', background:'var(--red)', border:'1.5px solid var(--bg-card)' }}/>
        </button>

        <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#667eea,#764ba2)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:14, fontWeight:800, cursor:'pointer' }}>U</div>
      </div>
    </header>
  );
}

/* Search bar */
function SearchBar({ val, set, run, loading }: {
  val:string; set:(s:string)=>void; run:()=>void; loading:boolean;
}) {
  return (
    <div style={{ background:'var(--bg-card)', borderBottom:'1px solid var(--border)', padding:'16px 24px' }}>
      <div style={{ display:'flex', gap:12, maxWidth:680, margin:'0 auto' }}>
        <div style={{ position:'relative', flex:1 }}>
          <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--t3)', display:'flex' }}>{Ic.search}</span>
          <input
            value={val}
            onChange={e => set(e.target.value.toUpperCase())}
            onKeyDown={e => e.key==='Enter' && run()}
            placeholder="Search stock  —  AAPL, TSLA, MSFT, RELIANCE.NS ..."
            className="num"
            style={{
              width:'100%', height:46, paddingLeft:42, paddingRight:16, borderRadius:12,
              fontSize:13, fontWeight:500, outline:'none', transition:'all .2s',
              background:'var(--bg-input)', border:'2px solid var(--border)', color:'var(--t1)',
            }}
            onFocus={e => { e.target.style.borderColor='var(--accent)'; e.target.style.boxShadow='0 0 0 3px var(--accent-bg)'; }}
            onBlur={e  => { e.target.style.borderColor='var(--border)'; e.target.style.boxShadow='none'; }}
          />
        </div>
        <button onClick={run} disabled={loading || !val.trim()} style={{
          height:46, padding:'0 24px', borderRadius:12, border:'none', cursor:'pointer',
          fontSize:13, fontWeight:700, color:'#fff', transition:'all .2s',
          background: loading ? 'var(--t3)' : 'var(--accent)',
          boxShadow: loading ? 'none' : '0 4px 14px rgba(37,99,235,.35)',
          display:'flex', alignItems:'center', gap:8, whiteSpace:'nowrap',
        }}>
          {loading ? <>{Ic.spin} Analysing…</> : <>{Ic.trend} Analyse</>}
        </button>
      </div>
      <div style={{ display:'flex', gap:6, justifyContent:'center', marginTop:10, flexWrap:'wrap' }}>
        {['AAPL','TSLA','NVDA','MSFT','GOOG','AMZN','META'].map(s => (
          <button key={s} onClick={() => { set(s); setTimeout(run, 0); }} style={{
            padding:'4px 12px', borderRadius:999, fontSize:11, fontWeight:700, border:'1px solid var(--border)',
            background:'var(--bg-card)', color:'var(--t3)', cursor:'pointer', transition:'all .15s',
            fontFamily:'JetBrains Mono, monospace',
          }}
            onMouseEnter={e => { (e.target as HTMLElement).style.color='var(--accent)'; (e.target as HTMLElement).style.borderColor='var(--accent)'; (e.target as HTMLElement).style.background='var(--accent-bg)'; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.color='var(--t3)'; (e.target as HTMLElement).style.borderColor='var(--border)'; (e.target as HTMLElement).style.background='var(--bg-card)'; }}
          >{s}</button>
        ))}
      </div>
    </div>
  );
}

/* Watchlist */
function Watchlist({ active, pick }: { active:string; pick:(s:string)=>void }) {
  return (
    <aside style={{ width:200, background:'var(--bg-card)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{ padding:'12px 14px 10px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--t3)' }}>Watchlist</span>
        <button style={{ fontSize:18, lineHeight:1, fontWeight:300, color:'var(--accent)', background:'none', border:'none', cursor:'pointer' }}>+</button>
      </div>
      <div style={{ flex:1, overflowY:'auto' }}>
        {WL.map(w => {
          const isAct = active === w.sym;
          const up    = w.chg >= 0;
          const cur   = getCurrency(w.sym);
          return (
            <div key={w.sym} onClick={() => pick(w.sym)} style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'10px 14px', cursor:'pointer', transition:'all .15s',
              borderLeft: isAct ? '3px solid var(--accent)' : '3px solid transparent',
              borderBottom:'1px solid var(--border)',
              background: isAct ? 'var(--accent-bg)' : 'transparent',
            }}
              onMouseEnter={e => { if(!isAct)(e.currentTarget as HTMLElement).style.background='var(--bg-hover)'; }}
              onMouseLeave={e => { if(!isAct)(e.currentTarget as HTMLElement).style.background='transparent'; }}
            >
              <div>
                <div style={{ fontSize:12, fontWeight:700, color: isAct ? 'var(--accent)' : 'var(--t1)' }}>{w.sym}</div>
                <div style={{ fontSize:10, color:'var(--t4)', marginTop:2 }}>NSE · Equity</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div className="num" style={{ fontSize:12, fontWeight:700, color: up ? 'var(--green)' : 'var(--red)' }}>{cur}{w.px.toFixed(2)}</div>
                <div className="num" style={{ fontSize:10, color: up ? 'var(--green)' : 'var(--red)', marginTop:2, display:'flex', alignItems:'center', gap:2, justifyContent:'flex-end' }}>
                  {up ? Ic.up : Ic.down}{Math.abs(w.chg).toFixed(2)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ borderTop:'1px solid var(--border)', padding:'10px 14px', display:'flex', flexDirection:'column', gap:6 }}>
        {INDICES.slice(0,2).map(idx => (
          <div key={idx.n} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:10, color:'var(--t3)' }}>{idx.n}</span>
            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
              <span className="num" style={{ fontSize:10, fontWeight:700, color:'var(--t2)' }}>{idx.v}</span>
              <span className="num" style={{ fontSize:9, fontWeight:700, color: idx.up ? 'var(--green)' : 'var(--red)' }}>{idx.up?'▲':'▼'}</span>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

/* Metric card */
function MetricCard({ label, value, sub, subUp, highlight, icon }: {
  label:string; value:string; sub?:string; subUp?:boolean; highlight?:boolean; icon?:React.ReactNode;
}) {
  return (
    <div className="card anim-fade-up" style={{
      padding:18,
      ...(highlight ? { background:'var(--accent-bg)', borderColor:'var(--accent-border)' } : {}),
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <span style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.12em', color: highlight ? 'var(--accent)' : 'var(--t3)' }}>{label}</span>
        {icon && <span style={{ color: highlight ? 'var(--accent)' : 'var(--t3)', opacity:.7 }}>{icon}</span>}
      </div>
      <div className="num" style={{
        fontSize: value.length > 12 ? 13 : value.length > 8 ? 16 : 20,
        fontWeight:800,
        color: highlight ? 'var(--accent)' : 'var(--t1)',
        marginBottom:6,
        overflow:'hidden',
        textOverflow:'ellipsis',
        whiteSpace:'nowrap',
        maxWidth:'100%',
      }}>{value}</div>
      {sub && (
        <div className="num" style={{ fontSize:11, fontWeight:700, color: subUp===undefined ? 'var(--t3)' : subUp ? 'var(--green)' : 'var(--red)', display:'flex', alignItems:'center', gap:3 }}>
          {subUp!==undefined && (subUp ? Ic.up : Ic.down)}{sub}
        </div>
      )}
    </div>
  );
}

/* Recommendation badge */
function RecBadge({ rec, sentiment }: { rec:'BUY'|'SELL'|'HOLD'; sentiment:number }) {
  const C = {
    BUY:  { bg:'var(--green-bg)',  bd:'var(--green-bd)',  tx:'var(--green)',  dot:'#16a34a', label:'Strong Buy Signal',  desc:'Models indicate upward momentum'   },
    SELL: { bg:'var(--red-bg)',    bd:'var(--red-bd)',    tx:'var(--red)',    dot:'#dc2626', label:'Sell Signal Detected',desc:'Models indicate downward pressure'  },
    HOLD: { bg:'var(--amber-bg)',  bd:'var(--amber-bd)',  tx:'var(--amber)',  dot:'#d97706', label:'Hold Position',       desc:'Models indicate sideways movement' },
  }[rec];
  return (
    <div style={{ background:C.bg, border:`1px solid ${C.bd}`, borderRadius:14, padding:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span className="pulse-anim" style={{ width:10, height:10, borderRadius:'50%', background:C.dot, display:'inline-block' }}/>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:C.tx }}>{C.label}</div>
            <div style={{ fontSize:11, color:'var(--t3)', marginTop:2 }}>{C.desc}</div>
          </div>
        </div>
        <div className="num" style={{ fontSize:26, fontWeight:900, letterSpacing:'.08em', color:C.tx }}>{rec}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', color:'var(--t3)', whiteSpace:'nowrap' }}>Sentiment</span>
        <div style={{ flex:1, height:6, borderRadius:999, background:'rgba(0,0,0,.08)', overflow:'hidden' }}>
          <div style={{ height:'100%', borderRadius:999, background:C.dot, width:`${Math.round(sentiment*100)}%`, transition:'width .7s ease' }}/>
        </div>
        <span className="num" style={{ fontSize:11, fontWeight:800, color:C.tx, whiteSpace:'nowrap' }}>{Math.round(sentiment*100)}%</span>
      </div>
    </div>
  );
}

/* Risk meter */
function RiskMeter({ score }: { score:number }) {
  const col = score>65 ? 'var(--red)' : score>35 ? 'var(--amber)' : 'var(--green)';
  const lbl = score>65 ? 'High Risk'  : score>35 ? 'Medium Risk'  : 'Low Risk';
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
        <span style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'.12em', color:'var(--t3)' }}>Risk Score</span>
        <span className="num" style={{ fontSize:12, fontWeight:800, color:col }}>{score}% — {lbl}</span>
      </div>
      <div style={{ height:8, borderRadius:999, overflow:'hidden', position:'relative', background:'var(--bg-input)' }}>
        <div style={{ position:'absolute', inset:0, borderRadius:999, background:'linear-gradient(90deg,var(--green),var(--amber),var(--red))' }}/>
        <div style={{ position:'absolute', top:0, bottom:0, right:0, left:`${score}%`, background:'var(--bg-base)', borderRadius:'0 999px 999px 0' }}/>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--t4)', marginTop:4, fontWeight:600 }}>
        <span>Low</span><span>Medium</span><span>High</span>
      </div>
    </div>
  );
}

/* Model performance card */
function ModelCard({ name, rmse, best }: { name:string; rmse:number; best:boolean }) {
  const barW = Math.max(5, 100 - rmse * 4);
  return (
    <div style={{
      padding:14, borderRadius:14, border:'1px solid', transition:'all .2s',
      background: best ? 'var(--accent-bg)'  : 'var(--bg-card2)',
      borderColor: best ? 'var(--accent-border)' : 'var(--border)',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background: best ? 'var(--accent)' : 'var(--t4)' }}/>
          <span style={{ fontSize:12, fontWeight:700, color: best ? 'var(--accent)' : 'var(--t2)' }}>{name}</span>
          {best && <span style={{ fontSize:9, padding:'2px 7px', borderRadius:999, background:'var(--accent)', color:'#fff', fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase' }}>BEST</span>}
        </div>
        <span className="num" style={{ fontSize:12, fontWeight:700, color:'var(--t2)' }}>{rmse.toFixed(2)}</span>
      </div>
      <div style={{ height:4, borderRadius:999, background:'var(--bg-input)', overflow:'hidden' }}>
        <div style={{ height:'100%', borderRadius:999, background: best ? 'var(--accent)' : 'var(--t4)', width:`${barW}%`, transition:'width .6s ease' }}/>
      </div>
      <div style={{ fontSize:10, color:'var(--t4)', marginTop:5 }}>RMSE — lower is better</div>
    </div>
  );
}

/* Prediction table */
function PredTable({ cur, preds, symbol }: { cur:number; preds:Prediction['future_predictions']; symbol:string }) {
  const c = getCurrency(symbol);
  const rows = [
    { period:'3 Months', price: preds['3_months'] },
    { period:'6 Months', price: preds['6_months'] },
    { period:'9 Months', price: preds['9_months'] },
  ];
  return (
    <div style={{ borderRadius:14, overflow:'hidden', border:'1px solid var(--border)' }}>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr style={{ background:'var(--bg-card2)' }}>
            {['Period','Target Price','Change','Signal'].map(h => (
              <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'.1em', color:'var(--t3)', borderBottom:'1px solid var(--border)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r,i) => {
            const pct = (((r.price-cur)/cur)*100).toFixed(2);
            const up  = parseFloat(pct) >= 0;
            return (
              <tr key={r.period} style={{ borderBottom: i<2 ? '1px solid var(--border)' : 'none', transition:'background .15s' }}
                onMouseEnter={e=>(e.currentTarget.style.background='var(--bg-hover)')}
                onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
              >
                <td style={{ padding:'13px 16px', fontSize:13, fontWeight:600, color:'var(--t2)' }}>{r.period}</td>
                <td style={{ padding:'13px 16px' }}>
                  <span className="num" style={{ fontSize:14, fontWeight:800, color:'var(--t1)' }}>{c}{r.price.toFixed(2)}</span>
                </td>
                <td style={{ padding:'13px 16px' }}>
                  <span className="num" style={{ fontSize:13, fontWeight:700, color: up ? 'var(--green)' : 'var(--red)', display:'flex', alignItems:'center', gap:3 }}>
                    {up ? Ic.up : Ic.down}{Math.abs(parseFloat(pct))}%
                  </span>
                </td>
                <td style={{ padding:'13px 16px' }}>
                  <span style={{
                    fontSize:10, fontWeight:800, padding:'4px 12px', borderRadius:999, textTransform:'uppercase', letterSpacing:'.08em',
                    background: up ? 'var(--green-bg)' : 'var(--red-bg)',
                    color:      up ? 'var(--green)'    : 'var(--red)',
                    border:    `1px solid ${up ? 'var(--green-bd)' : 'var(--red-bd)'}`,
                  }}>{up ? '↑ BUY' : '↓ SELL'}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* Buy / Sell panel */
function TradePanel({ symbol, price, rec }: { symbol:string; price:number; rec:string }) {
  const [mode, setMode]   = useState<'buy'|'sell'>('buy');
  const [qty,  setQty]    = useState('1');
  const [type, setType]   = useState<'market'|'limit'>('market');
  const [done, setDone]   = useState(false);

  const c     = getCurrency(symbol);
  const total = (parseFloat(qty)||0) * price;

  return (
    <div className="card" style={{ overflow:'hidden' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }}>
        {(['buy','sell'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding:'12px 0', fontSize:13, fontWeight:800, border:'none', cursor:'pointer', transition:'all .15s', textTransform:'uppercase', letterSpacing:'.06em',
            background: mode===m ? (m==='buy' ? 'var(--green-bg)' : 'var(--red-bg)') : 'var(--bg-card2)',
            color:      mode===m ? (m==='buy' ? 'var(--green)'    : 'var(--red)')    : 'var(--t3)',
            borderBottom: mode===m ? `2px solid ${m==='buy'?'var(--green)':'var(--red)'}` : '2px solid transparent',
          }}>
            {m==='buy' ? '▲ BUY' : '▼ SELL'}
          </button>
        ))}
      </div>

      <div style={{ padding:16, display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:14, fontWeight:800, color:'var(--t1)' }}>{symbol}</div>
            <div style={{ fontSize:10, color:'var(--t3)', marginTop:2 }}>NSE · Equity</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div className="num" style={{ fontSize:15, fontWeight:800, color:'var(--t1)' }}>{c}{price.toFixed(2)}</div>
            <div style={{ fontSize:10, marginTop:2, color: rec==='BUY' ? 'var(--green)' : rec==='SELL' ? 'var(--red)' : 'var(--amber)', fontWeight:700 }}>
              AI: {rec}
            </div>
          </div>
        </div>

        <div>
          <label style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'.1em', color:'var(--t3)', display:'block', marginBottom:6 }}>Order Type</label>
          <div style={{ display:'flex', gap:6 }}>
            {(['market','limit'] as const).map(t => (
              <button key={t} onClick={()=>setType(t)} style={{
                flex:1, padding:'7px 0', borderRadius:9, fontSize:11, fontWeight:700, border:'none', cursor:'pointer', textTransform:'capitalize', transition:'all .15s',
                background: type===t ? 'var(--accent)' : 'var(--bg-input)',
                color:      type===t ? '#fff'           : 'var(--t2)',
              }}>{t}</button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'.1em', color:'var(--t3)', display:'block', marginBottom:6 }}>Quantity</label>
          <input type="number" min="1" value={qty} onChange={e=>setQty(e.target.value)} className="num" style={{
            width:'100%', height:40, padding:'0 12px', borderRadius:10, fontSize:14, fontWeight:700,
            background:'var(--bg-input)', border:'2px solid var(--border)', color:'var(--t1)', outline:'none',
          }}
            onFocus={e=>{e.target.style.borderColor='var(--accent)';}}
            onBlur={e=>{e.target.style.borderColor='var(--border)';}}
          />
        </div>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--bg-input)', borderRadius:10, padding:'10px 12px' }}>
          <span style={{ fontSize:11, color:'var(--t3)', fontWeight:600 }}>Total Value</span>
          <span className="num" style={{ fontSize:14, fontWeight:800, color:'var(--t1)' }}>{c}{total.toFixed(2)}</span>
        </div>

        {done ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'12px', borderRadius:12, background:'var(--green-bg)', border:'1px solid var(--green-bd)', color:'var(--green)', fontWeight:700, fontSize:13 }}>
            {Ic.check} Order Placed Successfully!
          </div>
        ) : (
          <button onClick={()=>{setDone(true);setTimeout(()=>setDone(false),3000);}} style={{
            padding:'13px 0', borderRadius:12, border:'none', cursor:'pointer', fontSize:13, fontWeight:800, color:'#fff', transition:'all .2s',
            background: mode==='buy' ? 'var(--green)' : 'var(--red)',
            boxShadow: `0 4px 18px ${mode==='buy' ? 'rgba(22,163,74,.35)' : 'rgba(220,38,38,.35)'}`,
          }}>
            {mode==='buy' ? '▲ Place Buy Order' : '▼ Place Sell Order'}
          </button>
        )}

        <p style={{ fontSize:10, textAlign:'center', color:'var(--t4)' }}>Simulated trading · Not real orders</p>
      </div>
    </div>
  );
}

/* Empty state */
function EmptyState({ onQuick }: { onQuick:(s:string)=>void }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 24px', textAlign:'center' }} className="anim-fade-in">
      <div style={{ width:72, height:72, borderRadius:20, background:'var(--accent-bg)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20, boxShadow:'0 8px 24px rgba(37,99,235,.15)' }}>
        <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 5-5"/>
        </svg>
      </div>
      <h2 style={{ fontSize:20, fontWeight:800, color:'var(--t1)', marginBottom:8 }}>Search any stock to begin</h2>
      <p style={{ fontSize:13, color:'var(--t3)', maxWidth:360, lineHeight:1.6, marginBottom:24 }}>
        Enter a stock symbol in the search bar above and click Analyse to see AI-powered predictions, interactive charts, and trading signals.
      </p>
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' }}>
        {['AAPL','TSLA','NVDA','MSFT','GOOG','AMZN','META'].map(s => (
          <button key={s} onClick={()=>onQuick(s)} className="num" style={{
            padding:'8px 16px', borderRadius:10, fontSize:12, fontWeight:700,
            background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--t2)', cursor:'pointer', transition:'all .15s',
          }}
            onMouseEnter={e=>{const el=e.currentTarget;el.style.background='var(--accent-bg)';el.style.color='var(--accent)';el.style.borderColor='var(--accent-border)';el.style.transform='translateY(-2px)';}}
            onMouseLeave={e=>{const el=e.currentTarget;el.style.background='var(--bg-card)';el.style.color='var(--t2)';el.style.borderColor='var(--border)';el.style.transform='translateY(0)';}}
          >{s}</button>
        ))}
      </div>
    </div>
  );
}

/* Skeleton loader */
function SkeletonLoader() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14, padding:0 }} className="anim-fade-in">
      <div className="skeleton" style={{ height:90, borderRadius:16 }}/>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {[0,1,2,3].map(i=><div key={i} className="skeleton" style={{ height:90, borderRadius:16 }}/>)}
      </div>
      <div className="skeleton" style={{ height:300, borderRadius:16 }}/>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {[0,1,2].map(i=><div key={i} className="skeleton" style={{ height:110, borderRadius:16 }}/>)}
      </div>
    </div>
  );
}

/* Status bar */
function StatusBar() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <footer style={{
      height:28, background:'var(--bg-card)', borderTop:'1px solid var(--border)',
      display:'flex', alignItems:'center', padding:'0 24px', gap:20, position:'sticky', bottom:0, zIndex:50,
    }}>
      {INDICES.map(idx => (
        <div key={idx.n} style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:10, color:'var(--t3)', fontWeight:600 }}>{idx.n}</span>
          <span className="num" style={{ fontSize:10, fontWeight:700, color:'var(--t2)' }}>{idx.v}</span>
          <span style={{ fontSize:9, fontWeight:800, color: idx.up ? 'var(--green)' : 'var(--red)' }}>{idx.up?'▲':'▼'} {idx.chg}</span>
        </div>
      ))}
      <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
        <span className="pulse-anim" style={{ width:7, height:7, borderRadius:'50%', background:'var(--green)', display:'inline-block' }}/>
        <span style={{ fontSize:10, fontWeight:600, color:'var(--t3)' }}>Markets Open</span>
        <span className="num" style={{ fontSize:10, fontWeight:700, color:'var(--t2)' }}>{time}</span>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────────── */
export default function Dashboard() {
  const [dark,     setDark]     = useState(false);
  const [page,     setPage]     = useState('dashboard');
  const [sym,      setSym]      = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string|null>(null);
  const [pred,     setPred]     = useState<Prediction|null>(null);
  const [hist,     setHist]     = useState<HistoricalPoint[]>([]);
  const [analyzed, setAnalyzed] = useState(false);
  const [activeSym,setActiveSym]= useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [dark]);

  const run = useCallback(async (overrideSym?: string) => {
    const target = (overrideSym ?? sym).toUpperCase().trim();
    if (!target) return;
    setSym(target);
    setActiveSym(target);
    setLoading(true);
    setError(null);
    setPred(null);
    setHist([]);
    setAnalyzed(true);
    try {
      const [p, h] = await Promise.all([fetchPrediction(target), fetchHistory(target)]);
      setPred(p);
      setHist(h);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e?.message ?? 'Symbol not found or server unavailable.');
    } finally {
      setLoading(false);
    }
  }, [sym]);

  const priceDiff  = pred ? (((pred.predicted_price - pred.current_price) / pred.current_price) * 100).toFixed(2) : null;
  const histChange = hist.length >= 2 ? (((hist.at(-1)!.close - hist[0].close) / hist[0].close) * 100).toFixed(2) : null;
  const currency   = pred ? getCurrency(pred.symbol) : '$';

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', background:'var(--bg-base)', color:'var(--t1)' }}>

      <Navbar dark={dark} setDark={setDark} page={page} setPage={setPage} />
      <TickerTape />
      <SearchBar val={sym} set={setSym} run={() => run()} loading={loading} />

      <div style={{ display:'flex', flex:1, overflow:'hidden', minHeight:0 }}>

        <div style={{ display:'none', flexShrink:0 }} className="lg-sidebar">
          <Watchlist active={activeSym} pick={s => { setSym(s); run(s); }} />
        </div>
        <style>{`@media(min-width:1024px){ .lg-sidebar{ display:block !important; } }`}</style>

        <main style={{ flex:1, padding:20, overflowY:'auto', minWidth:0 }}>

          {!analyzed && !loading && (
            <EmptyState onQuick={s => { setSym(s); run(s); }} />
          )}

          {loading && <SkeletonLoader />}

          {error && !loading && (
            <div className="anim-pop-in" style={{ display:'flex', alignItems:'flex-start', gap:12, padding:16, borderRadius:14, background:'var(--red-bg)', border:'1px solid var(--red-bd)' }}>
              <span style={{ color:'var(--red)', flexShrink:0, marginTop:1 }}>{Ic.warn}</span>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--red)' }}>Symbol not found</div>
                <div style={{ fontSize:12, color:'var(--t2)', marginTop:4 }}>{error}</div>
              </div>
            </div>
          )}

          {pred && !loading && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }} className="anim-fade-up">

              {/* Stock hero */}
              <div className="card" style={{ padding:20 }}>
                <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:16 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                    <div style={{ width:48, height:48, borderRadius:14, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:16, fontWeight:900, flexShrink:0, boxShadow:'0 4px 14px rgba(37,99,235,.3)' }}>
                      {pred.symbol.slice(0,2)}
                    </div>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                        <h1 style={{ fontSize:22, fontWeight:900, color:'var(--t1)' }}>{pred.symbol}</h1>
                        {['NSE','Equity','AI Analysed'].map(tag => (
                          <span key={tag} style={{ fontSize:10, padding:'3px 9px', borderRadius:999, background:'var(--bg-input)', color:'var(--t3)', fontWeight:700 }}>{tag}</span>
                        ))}
                      </div>
                      <div style={{ fontSize:11, color:'var(--t3)', marginTop:4 }}>
                        Last analysed · {new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })} · {new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div style={{ display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
                    <div>
                      <div className="num" style={{ fontSize:28, fontWeight:900, color:'var(--t1)', lineHeight:1.1 }}>{currency}{pred.current_price.toFixed(2)}</div>
                      {histChange && (
                        <div className="num" style={{ fontSize:12, fontWeight:700, color: parseFloat(histChange)>=0 ? 'var(--green)' : 'var(--red)', display:'flex', alignItems:'center', gap:4, marginTop:3 }}>
                          {parseFloat(histChange)>=0 ? Ic.up : Ic.down} {Math.abs(parseFloat(histChange))}% overall
                        </div>
                      )}
                    </div>

                    <div style={{
                      padding:'10px 22px', borderRadius:14, border:'2px solid',
                      background: pred.recommendation==='BUY' ? 'var(--green-bg)' : pred.recommendation==='SELL' ? 'var(--red-bg)' : 'var(--amber-bg)',
                      borderColor: pred.recommendation==='BUY' ? 'var(--green-bd)' : pred.recommendation==='SELL' ? 'var(--red-bd)' : 'var(--amber-bd)',
                      textAlign:'center',
                    }}>
                      <div className="num" style={{ fontSize:22, fontWeight:900, letterSpacing:'.06em', color: pred.recommendation==='BUY' ? 'var(--green)' : pred.recommendation==='SELL' ? 'var(--red)' : 'var(--amber)' }}>
                        {pred.recommendation}
                      </div>
                      <div style={{ fontSize:10, color:'var(--t3)', marginTop:2, fontWeight:600 }}>AI SIGNAL</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metric cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:12 }} className="stagger">
                <MetricCard
                  label="Current Price" value={`${currency}${pred.current_price.toFixed(2)}`}
                  highlight
                  icon={<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>}
                />
                <MetricCard
                  label="AI Price Target" value={`${currency}${pred.predicted_price.toFixed(2)}`}
                  sub={priceDiff ? `${parseFloat(priceDiff)>=0?'+':''}${priceDiff}% upside` : undefined}
                  subUp={priceDiff ? parseFloat(priceDiff)>=0 : undefined}
                />
                <MetricCard
                  label="Best ML Model" value={pred.best_model}
                  sub="Auto-selected" icon={Ic.star}
                />
                <MetricCard
                  label="Risk Score" value={`${pred.risk_score}%`}
                  sub={pred.risk_score>65?'High Risk':pred.risk_score>35?'Medium Risk':'Low Risk'}
                  subUp={pred.risk_score<40}
                />
              </div>

              {/* Chart */}
              {hist.length > 0 && (
                <div className="card" style={{ padding:20 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--t2)', marginBottom:14 }}>
                    {pred.symbol} — Price History
                  </div>
                  <StockChart data={hist} symbol={pred.symbol} />
                </div>
              )}

              {/* Bottom grid */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:16 }}>
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  <div className="card" style={{ padding:18 }}>
                    <div style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'.12em', color:'var(--t3)', marginBottom:12 }}>AI Recommendation</div>
                    <RecBadge rec={pred.recommendation} sentiment={pred.sentiment_score} />
                    <div style={{ marginTop:16 }}>
                      <RiskMeter score={pred.risk_score} />
                    </div>
                  </div>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  <div className="card" style={{ padding:18 }}>
                    <div style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'.12em', color:'var(--t3)', marginBottom:14 }}>Price Targets</div>
                    <PredTable cur={pred.current_price} preds={pred.future_predictions} symbol={pred.symbol} />
                  </div>

                  <div className="card" style={{ padding:18 }}>
                    <div style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'.12em', color:'var(--t3)', marginBottom:14 }}>ML Model Performance</div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                      <ModelCard name="Linear Regression" rmse={pred.model_errors.LinearRegression_RMSE} best={pred.best_model==='LinearRegression'} />
                      <ModelCard name="Random Forest"     rmse={pred.model_errors.RandomForest_RMSE}     best={pred.best_model==='RandomForest'} />
                      <ModelCard name="XGBoost"           rmse={pred.model_errors.XGBoost_RMSE}           best={pred.best_model==='XGBoost'} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer credits */}
              <div style={{ borderTop:'1px solid var(--border)', marginTop:8, paddingTop:16, paddingBottom:20, display:'flex', flexDirection:'column', gap:8, alignItems:'center' }}>
                <p style={{ fontSize:11, textAlign:'center', color:'var(--t4)' }}>
                  AI predictions are for informational purposes only and do not constitute financial advice. Past performance does not guarantee future results.
                </p>
                <p style={{ fontSize:12, textAlign:'center', color:'var(--t3)', fontWeight:600 }}>
                  Made for Major Project Presentation by{' '}
                  <span style={{ color:'var(--accent)', fontWeight:800 }}>Siddharth</span>,{' '}
                  <span style={{ color:'var(--accent)', fontWeight:800 }}>Niraj</span>,{' '}
                  <span style={{ color:'var(--accent)', fontWeight:800 }}>Anupama</span>{' '}
                  &{' '}
                  <span style={{ color:'var(--accent)', fontWeight:800 }}>Nimesh</span>
                  {' '}· B.Tech IT 2026
                </p>
              </div>

            </div>
          )}
        </main>

        {/* Right panel — trading */}
        {pred && !loading && (
          <>
            <style>{`@media(min-width:1280px){ .xl-trade{ display:flex !important; } }`}</style>
            <div className="xl-trade" style={{ display:'none', width:220, flexShrink:0, padding:16, flexDirection:'column', gap:14, overflowY:'auto', borderLeft:'1px solid var(--border)', background:'var(--bg-card)' }}>
              <TradePanel symbol={pred.symbol} price={pred.current_price} rec={pred.recommendation} />
              <div className="card" style={{ padding:14 }}>
                <div style={{ fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'.12em', color:'var(--t3)', marginBottom:12 }}>Key Stats</div>
                {[
                  { l:'AI Target',  v:`${currency}${pred.predicted_price.toFixed(2)}` },
                  { l:'3M Target',  v:`${currency}${pred.future_predictions['3_months'].toFixed(0)}` },
                  { l:'6M Target',  v:`${currency}${pred.future_predictions['6_months'].toFixed(0)}` },
                  { l:'9M Target',  v:`${currency}${pred.future_predictions['9_months'].toFixed(0)}` },
                  { l:'Risk',       v:`${pred.risk_score}%` },
                  { l:'Sentiment',  v:`${Math.round(pred.sentiment_score*100)}%` },
                ].map(s => (
                  <div key={s.l} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'5px 0', borderBottom:'1px solid var(--border)' }}>
                    <span style={{ fontSize:11, color:'var(--t3)' }}>{s.l}</span>
                    <span className="num" style={{ fontSize:11, fontWeight:700, color:'var(--t1)' }}>{s.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <StatusBar />
    </div>
  );
}