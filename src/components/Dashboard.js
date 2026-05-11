import { useEffect, useRef } from 'react'
import { useEconomicCalendar, currencyFlag, formatFFTime } from '../lib/useEconomicCalendar'
import { Chart } from 'chart.js/auto'
import { computeStats, breakdownStats, f2, f1, fUSD, fR, fP, BAL } from '../lib/stats'

const CHART_COLORS = {
  blue: '#2563EB', green: '#059669', red: '#DC2626',
  amber: '#D97706', purple: '#7C3AED',
}


function NewsStrip() {
  const { events, loading, eventsForDate } = useEconomicCalendar()
  const today = new Date().toISOString().split('T')[0]

  if (loading || events.length === 0) return null

  return (
    <div style={{ marginBottom: '20px', background: 'var(--red-bg)', border: '1px solid var(--red-dim)', borderRadius: 'var(--r)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
      <div style={{ padding: '10px 16px', background: 'var(--surface)', borderBottom: '1px solid var(--red-dim)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '14px' }}>🔴</span>
        <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--red)', letterSpacing: '.04em', textTransform: 'uppercase' }}>High Impact News This Week</span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: '700', color: 'var(--muted)' }}>{events.length} events · USD GBP EUR</span>
      </div>
      <div style={{ padding: '10px 16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {events.map((e, i) => {
          const isToday = e.date === today
          const colors = { USD: 'var(--blue)', GBP: 'var(--purple)', EUR: 'var(--green)' }
          return (
            <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', background: isToday ? 'var(--amber-bg)' : 'var(--surface)', border: `1px solid ${isToday ? 'var(--amber-dim)' : 'var(--border)'}`, fontSize: '11px', fontWeight: '600' }}>
              <span>{currencyFlag(e.country)}</span>
              <span style={{ color: colors[e.country] || 'var(--muted)', fontWeight: '800' }}>{e.country}</span>
              <span style={{ color: 'var(--text2)' }}>{e.title}</span>
              <span style={{ color: 'var(--muted)', fontFamily: "'JetBrains Mono',monospace", fontSize: '10px' }}>{formatFFTime(e.time)}</span>
              {isToday && <span style={{ padding: '1px 5px', borderRadius: '4px', background: 'var(--amber)', color: '#fff', fontSize: '9px', fontWeight: '800' }}>TODAY</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, icon, color, valClass }) {
  return (
    <div className={`sc ${color}`}>
      <div className="sc-icon">{icon}</div>
      <div className="sc-label">{label}</div>
      <div className={`sc-val ${valClass || ''}`}>{value}</div>
      <div className="sc-sub">{sub}</div>
    </div>
  )
}

function ChartCard({ title, accentColor = 'var(--blue)', children }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '16px', boxShadow: 'var(--shadow)' }}>
      <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ width: '3px', height: '11px', borderRadius: '2px', background: accentColor, display: 'inline-block' }} />
        {title}
      </div>
      {children}
    </div>
  )
}

function useChart(id, config) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    const ctx = ref.current.getContext('2d')
    const chart = new Chart(ctx, config)
    return () => chart.destroy()
  })
  return ref
}

export default function Dashboard({ trades, startingBalance, currency }) {
  const BAL = startingBalance || 100000
  const acctCurrSym = currency === "GBP" ? "£" : currency === "EUR" ? "€" : "$"
  const s = computeStats(trades, BAL)
  const gradeSt = ['A+','A','B','C'].map(g => ({ grade: g, ...computeStats(trades.filter(t => t.grade === g), BAL) }))
  const mistakes = ['FOMO entry','Moved stop','Revenge trade','Overtraded','Wrong bias','Hesitated','Early exit','Late entry']

  // Rolling 20
  const rolling = []
  for (let i = 19; i < trades.length; i++) {
    const sl = trades.slice(i - 19, i + 1)
    rolling.push(sl.filter(t => t.outcome === 'Win').length / 20 * 100)
  }

  // Chart refs
  const outcomeRef  = useRef(null)
  const gradesRef   = useRef(null)
  const dirRef      = useRef(null)
  const symRef      = useRef(null)
  const sessRef     = useRef(null)
  const rdistRef    = useRef(null)
  const equityRef   = useRef(null)
  const rollingRef  = useRef(null)

  useEffect(() => {
    const charts = []
    const donut = (el, labels, data, colors) => {
      if (!el) return
      const ch = new Chart(el.getContext('2d'), {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 3, borderColor: 'var(--surface)', hoverOffset: 5 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '70%',
          plugins: { legend: { position: 'bottom', labels: { font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' }, padding: 12, usePointStyle: true, pointStyle: 'circle', color: 'var(--text2)' } },
            tooltip: { callbacks: { label: c => `${c.label}: ${c.raw} (${(c.raw / (c.dataset.data.reduce((a,b)=>a+b,0)||1) * 100).toFixed(1)}%)` } } } }
      })
      charts.push(ch)
    }
    const hbar = (el, labels, data, color) => {
      if (!el) return
      const ch = new Chart(el.getContext('2d'), {
        type: 'bar',
        data: { labels, datasets: [{ data, backgroundColor: data.map(v => v >= 0 ? color + '30' : '#DC262630'), borderColor: data.map(v => v >= 0 ? color : '#DC2626'), borderWidth: 2, borderRadius: 5 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.raw >= 0 ? '+' : ''}${c.raw.toFixed(2)}%` } } },
          scales: { x: { grid: { color: 'var(--border)' }, ticks: { font: { family: 'JetBrains Mono', size: 10 }, color: 'var(--muted)', callback: v => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%` } }, y: { grid: { display: false }, ticks: { font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' }, color: 'var(--text2)' } } } }
      })
      charts.push(ch)
    }

    donut(outcomeRef.current, ['Win','Loss','BE'], [s.wins, s.losses, s.bes], ['#059669','#DC2626','#D97706'])
    donut(gradesRef.current,  ['A+','A','B','C'], ['A+','A','B','C'].map(g => trades.filter(t => t.grade === g).length), ['#2563EB','#059669','#D97706','#DC2626'])
    donut(dirRef.current, ['Long','Short'], [trades.filter(t=>t.direction==='Long').length, trades.filter(t=>t.direction==='Short').length], ['#059669','#DC2626'])

    const syms = ['US100','US500','EUR/USD','GBP/USD','DAX']
    const sess = ['London','AM','PM','Asia']
    hbar(symRef.current,  syms, syms.map(s2 => trades.filter(t=>t.symbol===s2).reduce((sum,t)=>sum+(t.pl||0),0)),  '#2563EB')
    hbar(sessRef.current, sess, sess.map(s2 => trades.filter(t=>t.session===s2).reduce((sum,t)=>sum+(t.pl||0),0)), '#7C3AED')

    // R distribution
    if (rdistRef.current) {
      const rb = { '<1R':0, '1R':0, '1.5R':0, '2R':0, '2.5R':0, '3R+':0 }
      trades.filter(t=>t.r_multiple&&t.outcome==='Win').forEach(t => {
        if (t.r_multiple < 1) rb['<1R']++
        else if (t.r_multiple < 1.5) rb['1R']++
        else if (t.r_multiple < 2) rb['1.5R']++
        else if (t.r_multiple < 2.5) rb['2R']++
        else if (t.r_multiple < 3) rb['2.5R']++
        else rb['3R+']++
      })
      charts.push(new Chart(rdistRef.current.getContext('2d'), {
        type: 'bar',
        data: { labels: Object.keys(rb), datasets: [{ data: Object.values(rb), backgroundColor: '#2563EB22', borderColor: '#2563EB', borderWidth: 2, borderRadius: 6 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
          scales: { x: { grid: { display: false }, ticks: { font: { family: 'JetBrains Mono', size: 11 }, color: 'var(--text2)' } }, y: { grid: { color: 'var(--border)' }, ticks: { font: { family: 'JetBrains Mono', size: 10 }, color: 'var(--muted)', stepSize: 1 } } } }
      }))
    }

    // Equity curve
    if (equityRef.current) {
      charts.push(new Chart(equityRef.current.getContext('2d'), {
        type: 'line',
        data: { labels: s.curve.map((_,i) => i === 0 ? 'Start' : `#${i}`),
          datasets: [
            { data: s.curve, borderColor: '#2563EB', borderWidth: 2.5, fill: true, backgroundColor: 'rgba(37,99,235,.07)', pointRadius: 0, pointHoverRadius: 5, tension: .35 },
            { data: Array(s.curve.length).fill(BAL), borderColor: 'var(--border2)', borderWidth: 1.5, borderDash: [5,5], pointRadius: 0, fill: false }
          ] },
        options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
          plugins: { legend: { display: false }, tooltip: { filter: i => i.datasetIndex === 0, callbacks: { label: c => `Equity: ${acctCurrSym}${Math.round(c.raw).toLocaleString('en-US')}` } } },
          scales: { x: { display: false }, y: { grid: { color: 'var(--border)' }, ticks: { font: { family: 'JetBrains Mono', size: 10 }, color: 'var(--muted)', callback: v => acctCurrSym+(v/1000).toFixed(0)+'k' } } } }
      }))
    }

    // Rolling win rate
    if (rollingRef.current && rolling.length > 0) {
      charts.push(new Chart(rollingRef.current.getContext('2d'), {
        type: 'line',
        data: { labels: rolling.map((_,i) => `${i+20}`),
          datasets: [
            { data: rolling, borderColor: '#059669', borderWidth: 2, fill: true, backgroundColor: 'rgba(5,150,105,.07)', pointRadius: 0, tension: .4 },
            { data: Array(rolling.length).fill(50), borderColor: 'var(--border2)', borderWidth: 1.5, borderDash: [4,4], pointRadius: 0, fill: false }
          ] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
          scales: { x: { display: false }, y: { min: 0, max: 100, grid: { color: 'var(--border)' }, ticks: { font: { family: 'JetBrains Mono', size: 10 }, color: 'var(--muted)', callback: v => v + '%' } } } }
      }))
    }

    return () => charts.forEach(c => c.destroy())
  }, [trades])

  const statCards = [
    { label: 'Account Equity',  value: acctCurrSym + Math.round(s.equity).toLocaleString('en-US'),          sub: `${f2(s.totalPL)} all time`,           icon: '💰', color: 'blue',   valClass: 'blue'                         },
    { label: 'Total Return',    value: f2(s.totalPL),            sub: `From ${acctCurrSym + Math.round(BAL).toLocaleString('en-US')}`,                   icon: '📈', color: s.totalPL>=0?'green':'red', valClass: s.totalPL>=0?'up':'down' },
    { label: 'Total Trades',    value: s.n,                      sub: `${s.wins}W · ${s.losses}L · ${s.bes}BE`, icon: '🔢', color: 'blue', valClass: 'blue' },
    { label: 'Win Rate',        value: fP(s.winRate),            sub: `${s.wins} of ${s.n} trades`,          icon: '🎯', color: s.winRate>=.5?'green':'red', valClass: s.winRate>=.5?'up':'down' },
    { label: 'Profit Factor',   value: s.pf ? s.pf.toFixed(2) : '—', sub: '>1.5 = strong edge',             icon: '⚖️', color: 'purple', valClass: '' },
    { label: 'Expectancy',      value: s.exp ? f2(s.exp) : '—', sub: 'Per trade edge',                       icon: '🧮', color: s.exp>0?'green':'red', valClass: s.exp>0?'up':'down' },
    { label: 'Avg R-Multiple',  value: fR(s.avgR),               sub: 'Winning trades',                      icon: '🏆', color: 'amber', valClass: '' },
    { label: 'Avg Win',         value: s.avgWin ? f2(s.avgWin) : '—', sub: 'On winning trades',              icon: '✅', color: 'green', valClass: 'up' },
    { label: 'Avg Loss',        value: s.avgLoss ? f2(s.avgLoss) : '—', sub: 'On losing trades',             icon: '❌', color: 'red',   valClass: 'down' },
    { label: 'W/L Ratio',       value: s.wl ? s.wl.toFixed(2) : '—', sub: 'Avg win ÷ avg loss',             icon: '📊', color: 'purple', valClass: '' },
    { label: 'Max Drawdown',    value: s.maxDD ? f2(s.maxDD) : '—', sub: 'Peak to trough',                  icon: '📉', color: 'red',   valClass: 'down' },
    { label: 'Best Trade',      value: s.best ? f2(s.best) : '—',   sub: 'Single best',                     icon: '🌟', color: 'green', valClass: 'up' },
    { label: 'Worst Trade',     value: s.worst ? f2(s.worst) : '—', sub: 'Single worst',                    icon: '💔', color: 'red',   valClass: 'down' },
    { label: 'Win Streak',      value: s.mw || '—',              sub: `Current: ${s.cw}`,                   icon: '🔥', color: 'amber', valClass: '' },
  ]

  return (
    <div className="page active">
      <NewsStrip />
      {/* Stat cards */}
      <div className="stat-grid">
        {statCards.map((c, i) => <StatCard key={i} {...c} />)}
      </div>

      {/* Charts */}
      <div className="sh"><h2>Performance Charts</h2></div>
      <div className="cg" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: '14px', marginBottom: '24px' }}>
        <ChartCard title="Win / Loss / Break Even"><div style={{ height: '180px' }}><canvas ref={outcomeRef} /></div></ChartCard>
        <ChartCard title="Trade Grades"  accentColor="var(--purple)"><div style={{ height: '180px' }}><canvas ref={gradesRef} /></div></ChartCard>
        <ChartCard title="Long vs Short" accentColor="var(--green)"><div style={{ height: '180px' }}><canvas ref={dirRef} /></div></ChartCard>
        <ChartCard title="P/L by Symbol"><div style={{ height: '180px' }}><canvas ref={symRef} /></div></ChartCard>
        <ChartCard title="P/L by Session" accentColor="var(--purple)"><div style={{ height: '180px' }}><canvas ref={sessRef} /></div></ChartCard>
        <ChartCard title="R Distribution" accentColor="var(--amber)"><div style={{ height: '180px' }}><canvas ref={rdistRef} /></div></ChartCard>
      </div>

      {/* Equity curve */}
      <div className="sh"><h2>Equity Curve</h2></div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '16px', marginBottom: '24px', boxShadow: 'var(--shadow)' }}>
        {s.curve.length > 1
          ? <div style={{ height: '200px' }}><canvas ref={equityRef} /></div>
          : <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '13px' }}>Log some trades to see your equity curve</div>}
      </div>

      {/* Rolling win rate */}
      <div className="sh"><h2>Rolling 20-Trade Win Rate</h2><span className="sh-right">50% threshold line</span></div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '16px', marginBottom: '24px', boxShadow: 'var(--shadow)' }}>
        {rolling.length > 0
          ? <div style={{ height: '90px' }}><canvas ref={rollingRef} /></div>
          : <div style={{ height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '12px' }}>Need 20+ trades</div>}
      </div>

      {/* Streak */}
      <div className="sh"><h2>Current Streak</h2></div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '16px', marginBottom: '24px', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <div><div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '3px' }}>Win Streak</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '28px', fontWeight: '700', color: 'var(--green)' }}>{s.cw}</div></div>
          <div><div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '3px' }}>Loss Streak</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '28px', fontWeight: '700', color: 'var(--red)' }}>{s.cl}</div></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '8px' }}>Last 30 Trades</div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {trades.slice(-30).map((t, i) => (
                <div key={i} title={`${t.outcome} — ${t.date}`} style={{ width: '12px', height: '12px', borderRadius: '50%', background: t.outcome==='Win'?'var(--green)':t.outcome==='Loss'?'var(--red)':'var(--amber)', flexShrink: 0 }} />
              ))}
              {trades.length === 0 && <span style={{ fontSize: '12px', color: 'var(--muted)' }}>No trades yet</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Grade analysis */}
      <div className="sh"><h2>Grade Analysis</h2></div>
      <div className="tbl-card" style={{ marginBottom: '24px' }}>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Grade</th><th>Trades</th><th>Win %</th><th>Avg Win</th><th>Avg Loss</th><th>Avg R</th><th>Expectancy</th><th>% of Total</th></tr></thead>
            <tbody>
              {gradeSt.map(g => (
                <tr key={g.grade}>
                  <td><span className={`badge badge-${g.grade.replace('+','plus')}`}>{g.grade}</span></td>
                  <td className="num">{g.n}</td>
                  <td><span className={g.winRate >= .5 ? 'num-up' : 'num-dn'}>{fP(g.winRate)}</span></td>
                  <td className="num-up">{g.avgWin ? f2(g.avgWin) : '—'}</td>
                  <td className="num-dn">{g.avgLoss ? f2(g.avgLoss) : '—'}</td>
                  <td className="num">{fR(g.avgR)}</td>
                  <td className={g.exp > 0 ? 'num-up' : 'num-dn'}>{g.exp ? f2(g.exp) : '—'}</td>
                  <td className="num">{trades.length ? (g.n / trades.length * 100).toFixed(1) + '%' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mistakes */}
      <div className="sh"><h2>Mistake Frequency</h2></div>
      <div className="tbl-card" style={{ marginBottom: '24px' }}>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Mistake</th><th>Count</th><th>% of Trades</th><th>P/L Impact</th></tr></thead>
            <tbody>
              {mistakes.map(m => {
                const mt = trades.filter(t => t.mistake === m)
                const pl = mt.reduce((s, t) => s + (t.pl || 0), 0)
                return (
                  <tr key={m}>
                    <td style={{ fontWeight: '600', color: 'var(--red)' }}>{m}</td>
                    <td className="num">{mt.length}</td>
                    <td className="num">{trades.length ? (mt.length / trades.length * 100).toFixed(1) + '%' : '—'}</td>
                    <td className={pl >= 0 ? 'num-up' : 'num-dn'}>{mt.length ? f2(pl) : '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
