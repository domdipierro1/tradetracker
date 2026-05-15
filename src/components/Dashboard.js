import { useEffect, useRef } from 'react'
import { Chart } from 'chart.js/auto'
import { computeStats, f2, fR, fP } from '../lib/stats'

// ── PREMIUM STAT CARD ────────────────────────────────────────────
function KPI({ label, value, sub, accent, positive, negative, wide }) {
  const col = positive ? '#10B981' : negative ? '#EF4444' : accent || '#6366F1'
  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: '20px',
      padding: '22px 24px',
      boxShadow: '0 1px 3px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.05)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0',
      position: 'relative',
      overflow: 'hidden',
      gridColumn: wide ? 'span 2' : 'span 1',
    }}>
      {/* Accent bar */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg, ${col}, ${col}88)`, borderRadius:'20px 20px 0 0' }} />
      {/* Label */}
      <div style={{ fontSize:'10px', fontWeight:'600', color:'#94A3B8', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:'10px', marginTop:'4px' }}>{label}</div>
      {/* Value */}
      <div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:'28px', fontWeight:'700', color: col, lineHeight:'1', marginBottom:'8px', letterSpacing:'-.02em' }}>{value}</div>
      {/* Sub */}
      {sub && <div style={{ fontSize:'11px', color:'#94A3B8', fontWeight:'400' }}>{sub}</div>}
    </div>
  )
}

// ── CHART WRAPPER ────────────────────────────────────────────────
function Panel({ title, accent, span, height, children }) {
  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: '20px',
      padding: '22px 24px',
      boxShadow: '0 1px 3px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.05)',
      gridColumn: span ? `span ${span}` : 'span 1',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg, ${accent||'#6366F1'}, ${accent||'#6366F1'}88)`, borderRadius:'20px 20px 0 0' }} />
      <div style={{ fontSize:'11px', fontWeight:'700', color:'#64748B', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:'16px', marginTop:'4px', display:'flex', alignItems:'center', gap:'6px' }}>
        {title}
      </div>
      <div style={{ height: height || '180px' }}>{children}</div>
    </div>
  )
}

// ── STREAK DOTS ──────────────────────────────────────────────────
function StreakDots({ trades }) {
  const last = trades.slice(-20)
  if (!last.length) return <div style={{ color:'#94A3B8', fontSize:'12px', marginTop:'4px' }}>No trades yet</div>
  return (
    <div style={{ display:'flex', gap:'5px', flexWrap:'wrap', marginTop:'4px' }}>
      {last.map((t, i) => (
        <div key={i} style={{
          width:'28px', height:'28px', borderRadius:'8px',
          background: t.outcome==='Win' ? '#DCFCE7' : t.outcome==='Loss' ? '#FEE2E2' : '#FEF3C7',
          border: `1.5px solid ${t.outcome==='Win' ? '#BBF7D0' : t.outcome==='Loss' ? '#FECACA' : '#FDE68A'}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:'10px', fontWeight:'700',
          color: t.outcome==='Win' ? '#15803D' : t.outcome==='Loss' ? '#B91C1C' : '#B45309',
        }}>
          {t.outcome==='Win' ? 'W' : t.outcome==='Loss' ? 'L' : 'B'}
        </div>
      ))}
    </div>
  )
}

export default function Dashboard({ trades, startingBalance, currency }) {
  const s = computeStats(trades, startingBalance || 100000)

  const equityRef  = useRef(null)
  const outcomeRef = useRef(null)
  const dirRef     = useRef(null)
  const symRef     = useRef(null)
  const sessRef    = useRef(null)
  const rdistRef   = useRef(null)
  const rollingRef = useRef(null)

  const rolling = []
  for (let i = 19; i < trades.length; i++) {
    const sl = trades.slice(i - 19, i + 1)
    rolling.push(sl.filter(t => t.outcome === 'Win').length / 20 * 100)
  }

  useEffect(() => {
    const charts = []
    const safe = (ref, fn) => { if (ref.current) { const c = fn(ref.current.getContext('2d')); if (c) charts.push(c) } }

    // Shared options
    const font = (size, weight) => ({ family: 'Inter', size: size || 11, weight: weight || '500' })
    const monoFont = (size) => ({ family: "'JetBrains Mono'", size: size || 11 })
    const gridColor = 'rgba(148,163,184,.1)'
    const tickColor = '#94A3B8'

    // Equity curve
    safe(equityRef, ctx => new Chart(ctx, {
      type: 'line',
      data: {
        labels: s.curve.map((_, i) => i === 0 ? 'Start' : `#${i}`),
        datasets: [
          {
            data: s.curve,
            borderColor: '#6366F1',
            borderWidth: 2.5,
            fill: true,
            backgroundColor: (ctx2) => {
              const g = ctx2.chart.ctx.createLinearGradient(0, 0, 0, ctx2.chart.height)
              g.addColorStop(0, 'rgba(99,102,241,.18)')
              g.addColorStop(1, 'rgba(99,102,241,.01)')
              return g
            },
            pointRadius: 0,
            pointHoverRadius: 5,
            pointBackgroundColor: '#6366F1',
            tension: .4,
          },
          {
            data: Array(s.curve.length).fill(0),
            borderColor: '#E2E8F0',
            borderWidth: 1.5,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1E293B',
            padding: 12, cornerRadius: 10,
            titleFont: font(11), bodyFont: { ...monoFont(12), weight: '700' },
            filter: i => i.datasetIndex === 0,
            callbacks: { label: c => ` ${c.raw >= 0 ? '+' : ''}${c.raw.toFixed(2)}R` }
          }
        },
        scales: {
          x: { display: false },
          y: {
            grid: { color: gridColor },
            border: { display: false },
            ticks: { font: monoFont(10), color: tickColor, callback: v => (v >= 0 ? '+' : '') + v.toFixed(1) + 'R' }
          }
        }
      }
    }))

    // Outcome donut
    safe(outcomeRef, ctx => new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Win', 'Loss', 'BE'],
        datasets: [{ data: [s.wins, s.losses, s.bes], backgroundColor: ['#10B981', '#EF4444', '#F59E0B'], borderWidth: 0, spacing: 3, hoverOffset: 8 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '75%',
        plugins: {
          legend: { position: 'bottom', labels: { font: font(11, '600'), padding: 12, usePointStyle: true, pointStyle: 'circle', color: '#64748B' } },
          tooltip: { backgroundColor: '#1E293B', padding: 10, cornerRadius: 8, bodyFont: font(12, '600') }
        }
      }
    }))

    // Direction donut
    safe(dirRef, ctx => new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Long', 'Short'],
        datasets: [{ data: [trades.filter(t => t.direction === 'Long').length, trades.filter(t => t.direction === 'Short').length], backgroundColor: ['#10B981', '#EF4444'], borderWidth: 0, spacing: 3, hoverOffset: 8 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '75%',
        plugins: {
          legend: { position: 'bottom', labels: { font: font(11, '600'), padding: 12, usePointStyle: true, pointStyle: 'circle', color: '#64748B' } },
          tooltip: { backgroundColor: '#1E293B', padding: 10, cornerRadius: 8, bodyFont: font(12, '600') }
        }
      }
    }))

    // Symbol R bar
    const syms = ['NQ', 'ES', 'YM', 'DAX', 'UK100', 'Gold', 'Silver', 'EUR/USD', 'GBP/USD', 'GBP/JPY', 'EUR/JPY']
    const symData = syms.map(s2 => trades.filter(t => t.symbol === s2).reduce((sum, t) => sum + (t.pl || t.r_multiple || 0), 0))
    safe(symRef, ctx => new Chart(ctx, {
      type: 'bar',
      data: {
        labels: syms,
        datasets: [{
          data: symData,
          backgroundColor: symData.map(v => v >= 0 ? '#DCFCE7' : '#FEE2E2'),
          borderColor: symData.map(v => v >= 0 ? '#10B981' : '#EF4444'),
          borderWidth: 1.5, borderRadius: 8, borderSkipped: false, barThickness: 14,
        }]
      },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1E293B', padding: 10, cornerRadius: 8, callbacks: { label: c => ` ${c.raw >= 0 ? '+' : ''}${c.raw.toFixed(2)}R` } } },
        scales: {
          x: { grid: { color: gridColor }, border: { display: false }, ticks: { font: monoFont(9), color: tickColor, callback: v => (v >= 0 ? '+' : '') + v.toFixed(1) + 'R' } },
          y: { grid: { display: false }, border: { display: false }, ticks: { font: font(10, '600'), color: '#475569' } }
        }
      }
    }))

    // Session R bar
    const sess = ['London (02:00–05:00)', 'New York AM (06:00–10:00)']
    const sessLabels = ['London', 'New York AM']
    const sessData = sess.map(s2 => trades.filter(t => t.session === s2).reduce((sum, t) => sum + (t.pl || t.r_multiple || 0), 0))
    safe(sessRef, ctx => new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sessLabels,
        datasets: [{
          data: sessData,
          backgroundColor: sessData.map(v => v >= 0 ? '#EDE9FE' : '#FEE2E2'),
          borderColor: sessData.map(v => v >= 0 ? '#8B5CF6' : '#EF4444'),
          borderWidth: 1.5, borderRadius: 10, borderSkipped: false, barThickness: 32,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1E293B', padding: 10, cornerRadius: 8, callbacks: { label: c => ` ${c.raw >= 0 ? '+' : ''}${c.raw.toFixed(2)}R` } } },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { font: font(11, '600'), color: '#475569' } },
          y: { grid: { color: gridColor }, border: { display: false }, ticks: { font: monoFont(10), color: tickColor, callback: v => (v >= 0 ? '+' : '') + v.toFixed(1) + 'R' } }
        }
      }
    }))

    // R distribution
    safe(rdistRef, ctx => {
      const rb = { '<1R': 0, '1R': 0, '1.5R': 0, '2R': 0, '2.5R': 0, '3R+': 0 }
      trades.filter(t => t.r_multiple && t.outcome === 'Win').forEach(t => {
        if (t.r_multiple < 1) rb['<1R']++
        else if (t.r_multiple < 1.5) rb['1R']++
        else if (t.r_multiple < 2) rb['1.5R']++
        else if (t.r_multiple < 2.5) rb['2R']++
        else if (t.r_multiple < 3) rb['2.5R']++
        else rb['3R+']++
      })
      return new Chart(ctx, {
        type: 'bar',
        data: {
          labels: Object.keys(rb),
          datasets: [{ data: Object.values(rb), backgroundColor: '#EDE9FE', borderColor: '#8B5CF6', borderWidth: 1.5, borderRadius: 10, borderSkipped: false }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1E293B', padding: 10, cornerRadius: 8, bodyFont: { ...font(12), weight: '700' } } },
          scales: {
            x: { grid: { display: false }, border: { display: false }, ticks: { font: { ...monoFont(10), weight: '600' }, color: '#475569' } },
            y: { grid: { color: gridColor }, border: { display: false }, ticks: { font: monoFont(10), color: tickColor, stepSize: 1 } }
          }
        }
      })
    })

    // Rolling win rate
    if (rolling.length > 0) safe(rollingRef, ctx => new Chart(ctx, {
      type: 'line',
      data: {
        labels: rolling.map((_, i) => `${i + 20}`),
        datasets: [
          { data: rolling, borderColor: '#10B981', borderWidth: 2, fill: true, backgroundColor: (ctx2) => { const g = ctx2.chart.ctx.createLinearGradient(0, 0, 0, ctx2.chart.height); g.addColorStop(0, 'rgba(16,185,129,.15)'); g.addColorStop(1, 'rgba(16,185,129,.01)'); return g }, pointRadius: 0, tension: .4 },
          { data: Array(rolling.length).fill(50), borderColor: '#E2E8F0', borderWidth: 1.5, borderDash: [4, 4], pointRadius: 0, fill: false }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1E293B', padding: 10, cornerRadius: 8, callbacks: { label: c => ` ${c.raw.toFixed(1)}%` } } },
        scales: {
          x: { display: false },
          y: { min: 0, max: 100, grid: { color: gridColor }, border: { display: false }, ticks: { font: monoFont(10), color: tickColor, callback: v => v + '%' } }
        }
      }
    }))

    return () => charts.forEach(c => c.destroy())
  }, [trades])

  // Empty state
  const isEmpty = trades.length === 0

  return (
    <div style={{ padding:'28px', minHeight:'100vh', background:'#F8FAFC' }}>

      {/* ── HEADER ── */}
      <div style={{ marginBottom:'24px' }}>
        <h1 style={{ fontSize:'22px', fontWeight:'700', color:'#0F172A', letterSpacing:'-.03em', marginBottom:'3px' }}>Dashboard</h1>
        <p style={{ fontSize:'13px', color:'#94A3B8', fontWeight:'400' }}>
          {isEmpty ? 'Log your first trade to start tracking performance' : `${trades.length} trade${trades.length > 1 ? 's' : ''} · All metrics in R multiples`}
        </p>
      </div>

      {/* ── KPI GRID ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(170px, 1fr))', gap:'12px', marginBottom:'20px' }}>
        <KPI label="Total R"       value={f2(s.totalR)}                  sub="Cumulative R earned"             accent="#6366F1" positive={s.totalR > 0} negative={s.totalR < 0} />
        <KPI label="Total Trades"  value={s.n}                           sub={`${s.wins}W · ${s.losses}L · ${s.bes}BE`} accent="#0EA5E9" />
        <KPI label="Win Rate"      value={fP(s.winRate)}                 sub={`${s.wins} of ${s.n} trades`}   positive={s.winRate >= .5} negative={s.winRate > 0 && s.winRate < .5} />
        <KPI label="Expectancy"    value={s.expectancy ? fR(s.expectancy) : '—'} sub="Per trade edge"         positive={s.expectancy > 0} negative={s.expectancy < 0} accent="#6366F1" />
        <KPI label="Profit Factor" value={s.profitFactor ? s.profitFactor.toFixed(2) : '—'} sub="Target: > 1.5" positive={s.profitFactor >= 1.5} negative={s.profitFactor > 0 && s.profitFactor < 1} accent="#8B5CF6" />
        <KPI label="Avg Win"       value={s.avgWin ? fR(s.avgWin) : '—'}  sub="On winning trades"            positive accent="#10B981" />
        <KPI label="Avg Loss"      value={s.avgLoss ? fR(s.avgLoss) : '—'} sub="On losing trades"            negative={s.avgLoss < 0} accent="#EF4444" />
        <KPI label="Best Trade"    value={s.bestTrade ? fR(s.bestTrade) : '—'} sub="Single best"             positive accent="#10B981" />
        <KPI label="Worst Trade"   value={s.worstTrade ? fR(s.worstTrade) : '—'} sub="Single worst"          negative={s.worstTrade < 0} accent="#EF4444" />
        <KPI label="Max Drawdown"  value={s.maxDD ? fR(-s.maxDD) : '—'}   sub="Peak to trough"              negative={s.maxDD > 0} accent="#F59E0B" />
        <KPI label="Win Streak"    value={s.maxWinStreak || '—'}          sub="Best consecutive wins"         accent="#F59E0B" />
        <KPI label="W/L Ratio"     value={s.wlRatio ? s.wlRatio.toFixed(2) : '—'} sub="Avg win ÷ avg loss"  positive={s.wlRatio >= 1} accent="#6366F1" />
      </div>

      {/* ── RECENT TRADES STREAK ── */}
      <div style={{ background:'#FFFFFF', borderRadius:'20px', padding:'22px 24px', boxShadow:'0 1px 3px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.05)', marginBottom:'20px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:'linear-gradient(90deg, #F59E0B, #F59E0B88)', borderRadius:'20px 20px 0 0' }} />
        <div style={{ fontSize:'11px', fontWeight:'700', color:'#64748B', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:'12px', marginTop:'4px' }}>Last 20 Trades</div>
        <StreakDots trades={trades} />
      </div>

      {/* ── EQUITY CURVE ── */}
      <div style={{ background:'#FFFFFF', borderRadius:'20px', padding:'22px 24px', boxShadow:'0 1px 3px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.05)', marginBottom:'20px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:'linear-gradient(90deg, #6366F1, #6366F188)', borderRadius:'20px 20px 0 0' }} />
        <div style={{ fontSize:'11px', fontWeight:'700', color:'#64748B', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:'16px', marginTop:'4px' }}>R Equity Curve</div>
        {isEmpty
          ? <div style={{ height:'220px', display:'flex', alignItems:'center', justifyContent:'center', color:'#CBD5E1', fontSize:'13px' }}>Log trades to see your equity curve</div>
          : <div style={{ height:'220px' }}><canvas ref={equityRef} /></div>}
      </div>

      {/* ── CHARTS GRID ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:'14px', marginBottom:'20px' }}>
        <Panel title="Outcome" accent="#10B981"><canvas ref={outcomeRef} /></Panel>
        <Panel title="Long vs Short" accent="#6366F1"><canvas ref={dirRef} /></Panel>
        <Panel title="R Distribution" accent="#8B5CF6"><canvas ref={rdistRef} /></Panel>
        <Panel title="P/L by Session" accent="#8B5CF6" height="140px"><canvas ref={sessRef} /></Panel>
        <Panel title="P/L by Symbol" accent="#0EA5E9" span={2} height="260px"><canvas ref={symRef} /></Panel>
      </div>

      {/* ── ROLLING WIN RATE ── */}
      <div style={{ background:'#FFFFFF', borderRadius:'20px', padding:'22px 24px', boxShadow:'0 1px 3px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.05)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:'linear-gradient(90deg, #10B981, #10B98188)', borderRadius:'20px 20px 0 0' }} />
        <div style={{ fontSize:'11px', fontWeight:'700', color:'#64748B', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:'4px', marginTop:'4px' }}>Rolling 20-Trade Win Rate</div>
        <div style={{ fontSize:'11px', color:'#CBD5E1', marginBottom:'14px' }}>50% threshold line</div>
        {rolling.length > 0
          ? <div style={{ height:'160px' }}><canvas ref={rollingRef} /></div>
          : <div style={{ height:'160px', display:'flex', alignItems:'center', justifyContent:'center', color:'#CBD5E1', fontSize:'13px' }}>Need 20+ trades</div>}
      </div>

      {/* Mobile spacing */}
      <div style={{ height:'20px' }} />
    </div>
  )
}
