import { useEffect, useRef } from 'react'
import { Chart } from 'chart.js/auto'
import { computeStats, f2, fR, fP } from '../lib/stats'

const GRADE_ITEMS = [
  'Preparation',
  'Patience',
  'Entry Quality',
  'Risk',
  'Exit Discipline',
]

// ── THIS WEEK'S GRADING ───────────────────────────────────────────
function WeeklyGrading({ dailyNotes, onOpenJournal }) {
  // Current week Mon–Fri
  const now = new Date()
  const day = now.getDay() // 0=Sun
  const monday = new Date(now)
  const diff = day === 0 ? -6 : 1 - day
  monday.setDate(now.getDate() + diff)
  const weekDays = []
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday); d.setDate(monday.getDate() + i)
    weekDays.push(d.toLocaleDateString('en-CA'))
  }
  const labels = ['Mon','Tue','Wed','Thu','Fri']

  const noteByDate = {}
  ;(dailyNotes || []).forEach(n => { noteByDate[n.date] = n })

  const dayScores = weekDays.map(ds => {
    const n = noteByDate[ds]
    if (!n || !n.checklist_data) return null
    try {
      const cd = JSON.parse(n.checklist_data)
      const all = cd.grades || []
      const itemCount = all.length || 8
      const total = all.reduce((s, g) => s + (g || 0), 0)
      const rated = all.filter(g => g > 0)
      if (!rated.length) return null
      const pct = Math.round((total / (itemCount * 5)) * 100)
      return { pct }
    } catch { return null }
  })

  const graded = dayScores.filter(Boolean)
  const weekPct = graded.length ? Math.round(graded.reduce((s, d) => s + d.pct, 0) / graded.length) : 0
  const col = p => p >= 80 ? '#059669' : p >= 60 ? '#D97706' : p > 0 ? '#E11D48' : '#A4ABB7'

  // Per-item breakdown for the week — only trading-mode days (the 5 pillars)
  const itemStats = GRADE_ITEMS.map((label, idx) => {
    let sum = 0, count = 0, lowDays = 0
    weekDays.forEach(ds => {
      const n = noteByDate[ds]
      if (!n || !n.checklist_data) return
      try {
        const cd = JSON.parse(n.checklist_data)
        if (cd.gradeMode === 'notrade') return  // skip no-trade days
        const g = (cd.grades || [])[idx]
        if (g > 0) { sum += g; count++; if (g <= 3) lowDays++ }
      } catch {}
    })
    return { label, avg: count ? sum / count : 0, count, lowDays }
  }).filter(s => s.count > 0).sort((a, b) => a.avg - b.avg) // weakest first
  const colAvg = a => a >= 4 ? '#059669' : a >= 3 ? '#D97706' : a > 0 ? '#E11D48' : '#A4ABB7'

  return (
    <div style={{ background:'#FFFFFF', border:'1px solid #E9ECF1', borderRadius:'16px', padding:'20px 22px', boxShadow:'0 1px 2px rgba(20,24,31,.04), 0 1px 8px rgba(20,24,31,.04)', marginBottom:'16px' }}>
      <div style={{ display:'flex', alignItems:'center', marginBottom:'16px' }}>
        <span style={{ fontSize:'11px', fontWeight:'700', color:'#717A88', letterSpacing:'.09em', textTransform:'uppercase' }}>This Week's Grading</span>
        <span style={{ marginLeft:'auto', fontFamily:"'JetBrains Mono',monospace", fontSize:'15px', fontWeight:'700', color:col(weekPct) }}>
          {weekPct > 0 ? weekPct + '%' : '—'}<span style={{ fontSize:'10px', color:'#A4ABB7', fontWeight:'600' }}> avg</span>
        </span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'10px' }}>
        {dayScores.map((s, i) => {
          const isToday = weekDays[i] === now.toLocaleDateString('en-CA')
          const clickable = !!onOpenJournal
          return (
            <button key={i} disabled={!clickable} onClick={() => clickable && onOpenJournal(weekDays[i], false)}
              style={{ textAlign:'center', padding:'14px 6px', borderRadius:'12px', background: s ? '#F4F6F8' : '#FAFBFC', border: isToday ? '1.5px solid #4F46E5' : '1px solid #E9ECF1', cursor: clickable ? 'pointer' : 'default', fontFamily:'inherit', transition:'all .15s' }}
              onMouseEnter={e => { if(clickable){ e.currentTarget.style.borderColor='#4F46E5'; e.currentTarget.style.transform='translateY(-2px)' } }}
              onMouseLeave={e => { if(clickable){ e.currentTarget.style.borderColor = isToday ? '#4F46E5' : '#E9ECF1'; e.currentTarget.style.transform='translateY(0)' } }}>
              <div style={{ fontSize:'10px', fontWeight:'700', color: isToday ? '#4F46E5' : '#A4ABB7', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'8px' }}>{labels[i]}</div>
              {s ? (
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'21px', fontWeight:'700', color:col(s.pct), lineHeight:1, letterSpacing:'-.04em' }}>{s.pct}<span style={{ fontSize:'11px' }}>%</span></div>
              ) : (
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'20px', fontWeight:'600', color:'#D8DDE5', lineHeight:1, paddingBottom:'4px' }}>–</div>
              )}
            </button>
          )
        })}
      </div>
      {/* Per-item breakdown */}
      {itemStats.length > 0 && (
        <div style={{ marginTop:'18px', paddingTop:'16px', borderTop:'1px solid #E9ECF1' }}>
          <div style={{ fontSize:'10px', fontWeight:'700', color:'#A4ABB7', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:'12px' }}>By Area · weakest first</div>
          {itemStats.map((s, i) => (
            <div key={s.label} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'8px 0', borderBottom: i < itemStats.length-1 ? '1px solid #F4F6F8' : 'none' }}>
              <span style={{ fontSize:'12.5px', fontWeight:'600', color:'#334155', flex:1 }}>{s.label}</span>
              {s.lowDays > 0 && (
                <span style={{ fontSize:'10px', fontWeight:'600', color:'#E11D48', background:'#FDECEF', padding:'2px 8px', borderRadius:'20px' }}>low {s.lowDays} {s.lowDays === 1 ? 'day' : 'days'}</span>
              )}
              <div style={{ width:'90px', height:'5px', background:'#F1F5F9', borderRadius:'3px', overflow:'hidden' }}>
                <div style={{ width:`${(s.avg/5)*100}%`, height:'100%', background:colAvg(s.avg), borderRadius:'3px' }} />
              </div>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'13px', fontWeight:'700', color:colAvg(s.avg), minWidth:'34px', textAlign:'right' }}>{s.avg.toFixed(1)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── PREMIUM STAT CARD ────────────────────────────────────────────
function KPI({ label, value, sub, accent, positive, negative, wide }) {
  const col = positive ? '#059669' : negative ? '#E11D48' : accent || '#4F46E5'
  return (
    <div
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 4px 16px rgba(20,24,31,.08), 0 1px 4px rgba(20,24,31,.04)'; e.currentTarget.style.borderColor='#D8DDE5' }}
      onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 1px 2px rgba(20,24,31,.04), 0 1px 8px rgba(20,24,31,.04)'; e.currentTarget.style.borderColor='#E9ECF1' }}
      style={{
      background: '#FFFFFF',
      border: '1px solid #E9ECF1',
      borderRadius: '16px',
      padding: '18px 20px',
      boxShadow: '0 1px 2px rgba(20,24,31,.04), 0 1px 8px rgba(20,24,31,.04)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform .22s cubic-bezier(.16,1,.3,1), box-shadow .22s cubic-bezier(.16,1,.3,1), border-color .22s',
      gridColumn: wide ? 'span 2' : 'span 1',
    }}>
      {/* Accent bar */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:col, opacity:.9 }} />
      {/* Label */}
      <div style={{ fontSize:'10px', fontWeight:'700', color:'#717A88', letterSpacing:'.09em', textTransform:'uppercase', marginBottom:'8px', marginTop:'4px' }}>{label}</div>
      {/* Value */}
      <div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:'25px', fontWeight:'700', color: col, lineHeight:'1', marginBottom:'6px', letterSpacing:'-.045em' }}>{value}</div>
      {/* Sub */}
      {sub && <div style={{ fontSize:'11.5px', color:'#717A88', fontWeight:'450' }}>{sub}</div>}
    </div>
  )
}

// ── CHART WRAPPER ────────────────────────────────────────────────
function Panel({ title, accent, span, height, children }) {
  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E9ECF1',
      borderRadius: '16px',
      padding: '20px 22px',
      boxShadow: '0 1px 2px rgba(20,24,31,.04), 0 1px 8px rgba(20,24,31,.04)',
      gridColumn: span ? `span ${span}` : 'span 1',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ fontSize:'10px', fontWeight:'700', color:'#717A88', letterSpacing:'.09em', textTransform:'uppercase', marginBottom:'18px', display:'flex', alignItems:'center', gap:'8px' }}>
        <span style={{ width:'7px', height:'7px', borderRadius:'2px', background: accent||'#4F46E5' }} />
        {title}
      </div>
      <div style={{ height: height || '180px' }}>{children}</div>
    </div>
  )
}

// ── STREAK DOTS ──────────────────────────────────────────────────
function StreakDots({ trades }) {
  const last = trades.slice(-20)
  if (!last.length) return <div style={{ color:'#A4ABB7', fontSize:'12px', marginTop:'4px' }}>No trades yet</div>
  return (
    <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginTop:'4px' }}>
      {last.map((t, i) => (
        <div key={i} style={{
          width:'30px', height:'30px', borderRadius:'9px',
          background: t.outcome==='Win' ? '#E7F6F0' : t.outcome==='Loss' ? '#FDECEF' : '#FEF3E2',
          border: `1px solid ${t.outcome==='Win' ? '#A6E0CB' : t.outcome==='Loss' ? '#F6B9C6' : '#F6D496'}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:'11px', fontWeight:'700', fontFamily:"'JetBrains Mono',monospace",
          color: t.outcome==='Win' ? '#059669' : t.outcome==='Loss' ? '#E11D48' : '#D97706',
        }}>
          {t.outcome==='Win' ? 'W' : t.outcome==='Loss' ? 'L' : 'B'}
        </div>
      ))}
    </div>
  )
}

export default function Dashboard({ trades, dailyNotes, startingBalance, currency, onOpenJournal }) {
  const s = computeStats(trades, startingBalance || 100000)

  const equityRef  = useRef(null)
  const outcomeRef = useRef(null)
  const dirRef     = useRef(null)
  const symRef     = useRef(null)
  const sessRef    = useRef(null)
  const rdistRef   = useRef(null)
  const rollingRef = useRef(null)
  const dowRef     = useRef(null)
  const hourRef    = useRef(null)

  const rolling = []
  for (let i = 19; i < trades.length; i++) {
    const sl = trades.slice(i - 19, i + 1)
    rolling.push(sl.filter(t => t.outcome === 'Win').length / 20 * 100)
  }

  useEffect(() => {
    const charts = []
    const safe = (ref, fn) => { if (ref.current) { const c = fn(ref.current.getContext('2d')); if (c) charts.push(c) } }

    // Shared options
    const font = (size, weight) => ({ family: 'Inter Tight', size: size || 11, weight: weight || '500' })
    const monoFont = (size) => ({ family: "'JetBrains Mono'", size: size || 11 })
    const gridColor = 'rgba(20,24,31,.06)'
    const tickColor = '#A4ABB7'

    // Equity curve
    safe(equityRef, ctx => new Chart(ctx, {
      type: 'line',
      data: {
        labels: s.curve.map((_, i) => i === 0 ? 'Start' : `#${i}`),
        datasets: [
          {
            data: s.curve,
            borderColor: '#4F46E5',
            borderWidth: 3,
            fill: true,
            backgroundColor: (ctx2) => {
              const g = ctx2.chart.ctx.createLinearGradient(0, 0, 0, ctx2.chart.height)
              g.addColorStop(0, 'rgba(79,70,229,.22)')
              g.addColorStop(1, 'rgba(79,70,229,.01)')
              return g
            },
            pointRadius: 0,
            pointHoverRadius: 6,
            pointBackgroundColor: '#4F46E5',
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2.5,
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
            backgroundColor: '#14181F',
            padding: 12, cornerRadius: 10, displayColors: false, titleColor: '#fff', bodyColor: '#fff', caretSize: 5, displayColors: false,
            titleColor: '#A4ABB7', bodyColor: '#FFFFFF',
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
        datasets: [{ data: [s.wins, s.losses, s.bes], backgroundColor: ['#059669', '#E11D48', '#D97706'], borderWidth: 0, spacing: 3, hoverOffset: 8 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '75%',
        plugins: {
          legend: { position: 'bottom', labels: { font: font(11, '600'), padding: 12, usePointStyle: true, pointStyle: 'circle', color: '#717A88' } },
          tooltip: { backgroundColor: '#14181F', padding: 11, cornerRadius: 10, displayColors: false, titleColor: '#A4ABB7', bodyColor: '#FFFFFF', bodyFont: font(12, '600') }
        }
      }
    }))

    // Direction donut
    safe(dirRef, ctx => new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Long', 'Short'],
        datasets: [{ data: [trades.filter(t => t.direction === 'Long').length, trades.filter(t => t.direction === 'Short').length], backgroundColor: ['#059669', '#E11D48'], borderWidth: 0, spacing: 3, hoverOffset: 8 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '75%',
        plugins: {
          legend: { position: 'bottom', labels: { font: font(11, '600'), padding: 12, usePointStyle: true, pointStyle: 'circle', color: '#717A88' } },
          tooltip: { backgroundColor: '#14181F', padding: 11, cornerRadius: 10, displayColors: false, titleColor: '#A4ABB7', bodyColor: '#FFFFFF', bodyFont: font(12, '600') }
        }
      }
    }))

    // Symbol R bar
    const syms = ['AUD/USD','EUR/USD','GBP/USD','NZD/USD','USD/CAD','USD/CHF','USD/JPY','NQ','ES','Gold','Silver']
    const symData = syms.map(s2 => trades.filter(t => t.symbol === s2).reduce((sum, t) => sum + (t.pl || t.r_multiple || 0), 0))
    safe(symRef, ctx => new Chart(ctx, {
      type: 'bar',
      data: {
        labels: syms,
        datasets: [{
          data: symData,
          backgroundColor: symData.map(v => v >= 0 ? '#D7F0E6' : '#FBDCE3'),
          borderColor: symData.map(v => v >= 0 ? '#059669' : '#E11D48'),
          borderWidth: 1.5, borderRadius: 8, borderSkipped: false, barThickness: 14,
        }]
      },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: '#14181F', padding: 11, cornerRadius: 10, displayColors: false, titleColor: '#A4ABB7', bodyColor: '#FFFFFF', callbacks: { label: c => ` ${c.raw >= 0 ? '+' : ''}${c.raw.toFixed(2)}R` } } },
        scales: {
          x: { grid: { color: gridColor }, border: { display: false }, ticks: { font: monoFont(9), color: tickColor, callback: v => (v >= 0 ? '+' : '') + v.toFixed(1) + 'R' } },
          y: { grid: { display: false }, border: { display: false }, ticks: { font: font(10, '600'), color: '#717A88' } }
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
          backgroundColor: sessData.map(v => v >= 0 ? '#E9E3FB' : '#FBDCE3'),
          borderColor: sessData.map(v => v >= 0 ? '#7C3AED' : '#E11D48'),
          borderWidth: 1.5, borderRadius: 10, borderSkipped: false, barThickness: 32,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: '#14181F', padding: 11, cornerRadius: 10, displayColors: false, titleColor: '#A4ABB7', bodyColor: '#FFFFFF', callbacks: { label: c => ` ${c.raw >= 0 ? '+' : ''}${c.raw.toFixed(2)}R` } } },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { font: font(11, '600'), color: '#717A88' } },
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
          datasets: [{ data: Object.values(rb), backgroundColor: '#E9E3FB', borderColor: '#7C3AED', borderWidth: 1.5, borderRadius: 10, borderSkipped: false }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { backgroundColor: '#14181F', padding: 11, cornerRadius: 10, displayColors: false, titleColor: '#A4ABB7', bodyColor: '#FFFFFF', bodyFont: { ...font(12), weight: '700' } } },
          scales: {
            x: { grid: { display: false }, border: { display: false }, ticks: { font: { ...monoFont(10), weight: '600' }, color: '#717A88' } },
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
          { data: rolling, borderColor: '#059669', borderWidth: 2.5, fill: true, backgroundColor: (ctx2) => { const g = ctx2.chart.ctx.createLinearGradient(0, 0, 0, ctx2.chart.height); g.addColorStop(0, 'rgba(5,150,105,.16)'); g.addColorStop(1, 'rgba(5,150,105,.01)'); return g }, pointRadius: 0, tension: .4 },
          { data: Array(rolling.length).fill(50), borderColor: '#D8DDE5', borderWidth: 1.5, borderDash: [4, 4], pointRadius: 0, fill: false }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: '#14181F', padding: 11, cornerRadius: 10, displayColors: false, titleColor: '#A4ABB7', bodyColor: '#FFFFFF', callbacks: { label: c => ` ${c.raw.toFixed(1)}%` } } },
        scales: {
          x: { display: false },
          y: { min: 0, max: 100, grid: { color: gridColor }, border: { display: false }, ticks: { font: monoFont(10), color: tickColor, callback: v => v + '%' } }
        }
      }
    }))

    // Day-of-week R performance
    const dowNames = ['Mon','Tue','Wed','Thu','Fri']
    const dowData = dowNames.map((_, idx) => {
      const target = idx + 1 // Mon=1 .. Fri=5
      return trades.filter(t => {
        if (!t.date) return false
        const d = new Date(t.date + 'T12:00:00')
        return d.getDay() === target
      }).reduce((sum, t) => sum + (t.pl || t.r_multiple || 0), 0)
    })
    safe(dowRef, ctx => new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dowNames,
        datasets: [{
          data: dowData,
          backgroundColor: dowData.map(v => v >= 0 ? '#D7F0E6' : '#FBDCE3'),
          borderColor: dowData.map(v => v >= 0 ? '#059669' : '#E11D48'),
          borderWidth: 1.5, borderRadius: 8, borderSkipped: false, barThickness: 30,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: '#14181F', padding: 11, cornerRadius: 10, displayColors: false, titleColor: '#A4ABB7', bodyColor: '#FFFFFF', callbacks: { label: c => ` ${c.raw >= 0 ? '+' : ''}${c.raw.toFixed(2)}R` } } },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { font: font(11, '600'), color: '#717A88' } },
          y: { grid: { color: gridColor }, border: { display: false }, ticks: { font: monoFont(10), color: tickColor, callback: v => (v >= 0 ? '+' : '') + v.toFixed(1) + 'R' } }
        }
      }
    }))

    // Killzone / entry-hour R performance (NY time buckets)
    const kzBuckets = [
      { label: '02–05', lo: 2,  hi: 5  },   // London KZ
      { label: '05–08', lo: 5,  hi: 8  },   // London/NY overlap
      { label: '08–10', lo: 8,  hi: 10 },   // NY AM KZ
      { label: '10–13', lo: 10, hi: 13 },   // late morning
      { label: 'Other', lo: -1, hi: 99 },   // anything else
    ]
    function hourOf(t) {
      // try explicit time field first (e.g. "08:30"), fall back to created time
      const raw = t.time || ''
      const m = String(raw).match(/(\d{1,2}):?(\d{2})?/)
      if (m) return parseInt(m[1], 10)
      return null
    }
    const kzData = kzBuckets.map(b => {
      return trades.filter(t => {
        const h = hourOf(t)
        if (h === null) return b.label === 'Other'
        if (b.label === 'Other') return !(h >= 2 && h < 13)
        return h >= b.lo && h < b.hi
      }).reduce((sum, t) => sum + (t.pl || t.r_multiple || 0), 0)
    })
    safe(hourRef, ctx => new Chart(ctx, {
      type: 'bar',
      data: {
        labels: kzBuckets.map(b => b.label),
        datasets: [{
          data: kzData,
          backgroundColor: kzData.map(v => v >= 0 ? '#D7F0E6' : '#FBDCE3'),
          borderColor: kzData.map(v => v >= 0 ? '#059669' : '#E11D48'),
          borderWidth: 1.5, borderRadius: 8, borderSkipped: false, barThickness: 26,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: '#14181F', padding: 11, cornerRadius: 10, displayColors: false, titleColor: '#A4ABB7', bodyColor: '#FFFFFF', callbacks: { title: items => `${items[0].label} NY`, label: c => ` ${c.raw >= 0 ? '+' : ''}${c.raw.toFixed(2)}R` } } },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { font: { ...monoFont(10), weight: '600' }, color: '#717A88' } },
          y: { grid: { color: gridColor }, border: { display: false }, ticks: { font: monoFont(10), color: tickColor, callback: v => (v >= 0 ? '+' : '') + v.toFixed(1) + 'R' } }
        }
      }
    }))

    return () => charts.forEach(c => c.destroy())
  }, [trades])

  // Empty state
  const isEmpty = trades.length === 0

  return (
    <div className="dashboard-page" style={{ padding:'28px', minHeight:'100vh', background:'var(--bg)' }}>

      {/* ── HERO HEADER ── */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'16px', marginBottom:'26px' }}>
        <div>
          <h1 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:'30px', fontWeight:'800', color:'#14181F', letterSpacing:'-.04em', marginBottom:'4px', lineHeight:1.05 }}>Dashboard</h1>
          <p style={{ fontSize:'13.5px', color:'#717A88', fontWeight:'450' }}>
            {isEmpty ? 'Log your first trade to start tracking performance' : `${trades.length} trade${trades.length > 1 ? 's' : ''} tracked · all metrics in R multiples`}
          </p>
        </div>
        {!isEmpty && (
          <div style={{ display:'flex', alignItems:'center', gap:'10px', background:'#FFFFFF', border:'1px solid #E9ECF1', borderRadius:'14px', padding:'12px 18px', boxShadow:'0 1px 2px rgba(20,24,31,.04), 0 1px 8px rgba(20,24,31,.04)' }}>
            <div style={{ width:'9px', height:'9px', borderRadius:'50%', background: s.totalR >= 0 ? '#059669' : '#E11D48', boxShadow:`0 0 0 4px ${s.totalR >= 0 ? 'rgba(5,150,105,.14)' : 'rgba(225,29,72,.14)'}` }} />
            <div>
              <div style={{ fontSize:'9.5px', fontWeight:'700', color:'#717A88', letterSpacing:'.09em', textTransform:'uppercase' }}>Net Result</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'19px', fontWeight:'700', color: s.totalR >= 0 ? '#059669' : '#E11D48', letterSpacing:'-.04em', lineHeight:1.1 }}>{s.totalR >= 0 ? '+' : ''}{f2(s.totalR)}R</div>
            </div>
          </div>
        )}
      </div>

      {/* ── KPI GRID ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:'12px', marginBottom:'20px' }}>
        <KPI label="Total R"       value={f2(s.totalR)}                  sub="Cumulative R earned"             accent="#4F46E5" positive={s.totalR > 0} negative={s.totalR < 0} />
        <KPI label="Total Trades"  value={s.n}                           sub={`${s.wins}W · ${s.losses}L · ${s.bes}BE`} accent="#0D9488" />
        <KPI label="Win Rate"      value={fP(s.winRate)}                 sub={`${s.wins} of ${s.n} trades`}   positive={s.winRate >= .5} negative={s.winRate > 0 && s.winRate < .5} />
        <KPI label="Expectancy"    value={s.expectancy ? fR(s.expectancy) : '—'} sub="Per trade edge"         positive={s.expectancy > 0} negative={s.expectancy < 0} accent="#4F46E5" />
        <KPI label="Profit Factor" value={!s.profitFactor || s.profitFactor === 0 ? '—' : !isFinite(s.profitFactor) ? 'No losses' : s.profitFactor.toFixed(2)} sub="Target: > 1.5" positive={s.profitFactor >= 1.5} negative={s.profitFactor > 0 && s.profitFactor < 1} accent="#7C3AED" />
        <KPI label="Avg Win"       value={s.avgWin ? fR(s.avgWin) : '—'}  sub="On winning trades"            positive accent="#059669" />
        <KPI label="Avg Loss"      value={s.avgLoss ? fR(s.avgLoss) : '—'} sub="On losing trades"            negative={s.avgLoss < 0} accent="#E11D48" />
        <KPI label="Best Trade"    value={s.bestTrade ? fR(s.bestTrade) : '—'} sub="Single best"             positive accent="#059669" />
        <KPI label="Worst Trade"   value={s.worstTrade ? fR(s.worstTrade) : '—'} sub="Single worst"          negative={s.worstTrade < 0} accent="#E11D48" />
        <KPI label="Max Drawdown"  value={s.maxDD ? fR(-s.maxDD) : '—'}   sub="Peak to trough"              negative={s.maxDD > 0} accent="#D97706" />
        <KPI label="Win Streak"    value={s.maxWinStreak || '—'}          sub="Best consecutive wins"         accent="#D97706" />
        <KPI label="W/L Ratio"     value={s.wlRatio ? s.wlRatio.toFixed(2) : '—'} sub="Avg win ÷ avg loss"  positive={s.wlRatio >= 1} accent="#4F46E5" />
      </div>

      {/* ── RECENT TRADES STREAK ── */}
      <div style={{ background:'#FFFFFF', border:'1px solid #E9ECF1', borderRadius:'16px', padding:'20px 22px', boxShadow:'0 1px 2px rgba(20,24,31,.04), 0 1px 8px rgba(20,24,31,.04)', marginBottom:'16px' }}>
        <div style={{ fontSize:'11px', fontWeight:'700', color:'#717A88', letterSpacing:'.09em', textTransform:'uppercase', marginBottom:'14px' }}>Last 20 Trades</div>
        <StreakDots trades={trades} />
      </div>

      {/* ── THIS WEEK'S GRADING ── */}
      <WeeklyGrading dailyNotes={dailyNotes} onOpenJournal={onOpenJournal} />

      {/* ── EQUITY CURVE ── */}
      <div style={{ background:'#FFFFFF', border:'1px solid #E9ECF1', borderRadius:'16px', padding:'20px 22px', boxShadow:'0 1px 2px rgba(20,24,31,.04), 0 1px 8px rgba(20,24,31,.04)', marginBottom:'16px' }}>
        <div style={{ fontSize:'11px', fontWeight:'700', color:'#717A88', letterSpacing:'.09em', textTransform:'uppercase', marginBottom:'16px' }}>R Equity Curve</div>
        {isEmpty
          ? <div style={{ height:'220px', display:'flex', alignItems:'center', justifyContent:'center', color:'#A4ABB7', fontSize:'13px' }}>Log trades to see your equity curve</div>
          : <div style={{ height:'220px' }}><canvas ref={equityRef} /></div>}
      </div>

      {/* ── CHARTS GRID ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:'14px', marginBottom:'20px' }}>
        <Panel title="Outcome" accent="#059669"><canvas ref={outcomeRef} /></Panel>
        <Panel title="Long vs Short" accent="#4F46E5"><canvas ref={dirRef} /></Panel>
        <Panel title="R Distribution" accent="#7C3AED"><canvas ref={rdistRef} /></Panel>
        <Panel title="P/L by Session" accent="#7C3AED" height="140px"><canvas ref={sessRef} /></Panel>
        <Panel title="Edge by Weekday" accent="#059669" height="180px"><canvas ref={dowRef} /></Panel>
        <Panel title="Edge by Hour · Killzone" accent="#0D9488" height="180px"><canvas ref={hourRef} /></Panel>
        <Panel title="P/L by Symbol" accent="#4F46E5" span={2} height="260px"><canvas ref={symRef} /></Panel>
      </div>

      {/* ── ROLLING WIN RATE ── */}
      <div style={{ background:'#FFFFFF', border:'1px solid #E9ECF1', borderRadius:'16px', padding:'20px 22px', boxShadow:'0 1px 2px rgba(20,24,31,.04), 0 1px 8px rgba(20,24,31,.04)' }}>
        <div style={{ fontSize:'11px', fontWeight:'700', color:'#717A88', letterSpacing:'.09em', textTransform:'uppercase', marginBottom:'4px' }}>Rolling 20-Trade Win Rate</div>
        <div style={{ fontSize:'11px', color:'#A4ABB7', marginBottom:'16px' }}>50% threshold line</div>
        {rolling.length > 0
          ? <div style={{ height:'160px' }}><canvas ref={rollingRef} /></div>
          : <div style={{ height:'160px', display:'flex', alignItems:'center', justifyContent:'center', color:'#A4ABB7', fontSize:'13px' }}>Need 20+ trades</div>}
      </div>

      {/* Mobile spacing */}
      <div style={{ height:'20px' }} />
    </div>
  )
}
