'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip } from 'chart.js';
import type { HistoricalPoint } from '@/services/api';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip);

const RANGES = ['1W','1M','3M','6M','1Y','ALL'] as const;
type Range = typeof RANGES[number];

function slice(data: HistoricalPoint[], r: Range): HistoricalPoint[] {
  if (r === 'ALL') return data;
  const days: Record<string,number> = { '1W':7,'1M':30,'3M':90,'6M':180,'1Y':365 };
  const cutoff = new Date(data.at(-1)?.date ?? Date.now());
  cutoff.setDate(cutoff.getDate() - days[r]);
  return data.filter(d => new Date(d.date) >= cutoff);
}

export default function StockChart({ data, symbol }: { data: HistoricalPoint[]; symbol: string }) {
  const ref   = useRef<HTMLCanvasElement>(null);
  const chart = useRef<Chart | null>(null);
  const [range, setRange] = useState<Range>('1Y');

  const pts   = slice(data, range);
  const vals  = pts.map(d => d.close);
  const isUp  = vals.length >= 2 ? vals.at(-1)! >= vals[0] : true;
  const pct   = vals.length >= 2 ? (((vals.at(-1)! - vals[0]) / vals[0]) * 100).toFixed(2) : null;

  useEffect(() => {
    if (!ref.current || !pts.length) return;
    chart.current?.destroy();

    const labels = pts.map(d => new Date(d.date).toLocaleDateString('en-IN', { day:'2-digit', month:'short' }));
    const ctx = ref.current.getContext('2d')!;
    const g   = ctx.createLinearGradient(0, 0, 0, 260);
    const rgb = isUp ? '22,163,74' : '220,38,38';
    g.addColorStop(0,   `rgba(${rgb},.20)`);
    g.addColorStop(.65, `rgba(${rgb},.04)`);
    g.addColorStop(1,   `rgba(${rgb},0)`);

    chart.current = new Chart(ref.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: vals,
          borderColor: isUp ? '#16a34a' : '#dc2626',
          borderWidth: 2,
          backgroundColor: g,
          fill: true,
          tension: .38,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: isUp ? '#16a34a' : '#dc2626',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600, easing: 'easeInOutCubic' },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(8,11,20,.95)',
            borderColor: 'rgba(255,255,255,.08)',
            borderWidth: 1,
            titleColor: '#7b82a3',
            bodyColor: '#e8eaff',
            padding: 12,
            cornerRadius: 10,
            titleFont: { size: 11, family: 'JetBrains Mono' },
            bodyFont:  { size: 13, family: 'JetBrains Mono', weight: 'bold' },
            callbacks: {
              title: i => labels[i[0].dataIndex],
              label: i => `  $ ${(i.raw as number).toFixed(2)}`,
            },
          },
        },
        scales: {
          x: {
            grid:   { display: false },
            border: { display: false },
            ticks:  { color:'#7b82a3', font:{ size:10, family:'JetBrains Mono' }, maxTicksLimit:9, maxRotation:0 },
          },
          y: {
            position: 'right',
            grid:   { color:'rgba(120,130,180,.07)' } as any,
            border: { display: false },
            ticks:  { color:'#7b82a3', font:{ size:10, family:'JetBrains Mono' }, callback: v => `$${Number(v).toFixed(0)}` },
          },
        },
      },
    });
    return () => chart.current?.destroy();
  }, [pts, isUp]);

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {pct && (
            <span className="num" style={{
              fontSize:12, fontWeight:700, padding:'3px 10px', borderRadius:999,
              background: isUp ? 'var(--green-bg)' : 'var(--red-bg)',
              color:      isUp ? 'var(--green)'    : 'var(--red)',
              border:    `1px solid ${isUp ? 'var(--green-bd)' : 'var(--red-bd)'}`,
            }}>
              {isUp ? '▲' : '▼'} {Math.abs(parseFloat(pct))}%
            </span>
          )}
          <span style={{ fontSize:11, color:'var(--t3)' }}>{pts.length} sessions</span>
        </div>
        {/* Range pills */}
        <div style={{ display:'flex', gap:3, background:'var(--bg-input)', padding:3, borderRadius:12 }}>
          {RANGES.map(r => (
            <button key={r} onClick={() => setRange(r)} style={{
              padding:'4px 11px', borderRadius:9, fontSize:11, fontWeight:600, border:'none', cursor:'pointer',
              background: range===r ? 'var(--bg-card)' : 'transparent',
              color:      range===r ? 'var(--accent)'  : 'var(--t3)',
              boxShadow:  range===r ? 'var(--shadow1)' : 'none',
              transition: 'all .15s',
            }}>{r}</button>
          ))}
        </div>
      </div>
      <div style={{ height:250 }}>
        <canvas ref={ref} />
      </div>
    </div>
  );
}