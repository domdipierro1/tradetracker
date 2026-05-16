import { useMemo } from 'react'

// ── CENTRAL BANK DATA ────────────────────────────────────────────
// Rates updated as of May 2026 — update manually when central banks meet
// Next meetings: Fed (Jun 18), ECB (Jun 5), BoE (Jun 19), BoJ (Jun 17)
const BANKS = [
  {
    id: 'fed',  name: 'Federal Reserve',  currency: 'USD', flag: '🇺🇸', color: '#1D4ED8',
    rate: { value: 4.25, previous: 4.50, date: 'Dec 2024' },
    cpi:  { value: 2.4,  previous: 2.8,  date: 'Apr 2026' },
    gdp:  { value: 0.3,  previous: 2.4,  date: 'Q1 2026'  },
  },
  {
    id: 'boe',  name: 'Bank of England',  currency: 'GBP', flag: '🇬🇧', color: '#7C3AED',
    rate: { value: 4.25, previous: 4.50, date: 'May 2026' },
    cpi:  { value: 2.6,  previous: 2.8,  date: 'Apr 2026' },
    gdp:  { value: 0.5,  previous: 0.1,  date: 'Q1 2026'  },
  },
  {
    id: 'ecb',  name: 'European Central Bank', currency: 'EUR', flag: '🇪🇺', color: '#065F46',
    rate: { value: 2.25, previous: 2.50, date: 'Apr 2026' },
    cpi:  { value: 2.2,  previous: 2.3,  date: 'Apr 2026' },
    gdp:  { value: 0.4,  previous: 0.2,  date: 'Q1 2026'  },
  },
  {
    id: 'boj',  name: 'Bank of Japan',    currency: 'JPY', flag: '🇯🇵', color: '#B45309',
    rate: { value: 0.50, previous: 0.25, date: 'Jan 2026' },
    cpi:  { value: 3.4,  previous: 3.7,  date: 'Mar 2026' },
    gdp:  { value: -0.7, previous: 0.6,  date: 'Q1 2026'  },
  },
  {
    id: 'snb',  name: 'Swiss National Bank', currency: 'CHF', flag: '🇨🇭', color: '#DC2626',
    rate: { value: 0.25, previous: 0.50, date: 'Mar 2026' },
    cpi:  { value: 0.3,  previous: 0.3,  date: 'Apr 2026' },
    gdp:  { value: 0.3,  previous: 0.5,  date: 'Q1 2026'  },
  },
  {
    id: 'rba',  name: 'Reserve Bank of Australia', currency: 'AUD', flag: '🇦🇺', color: '#D97706',
    rate: { value: 4.10, previous: 4.35, date: 'Feb 2026' },
    cpi:  { value: 2.4,  previous: 2.5,  date: 'Q1 2026'  },
    gdp:  { value: 0.6,  previous: 0.3,  date: 'Q4 2025'  },
  },
  {
    id: 'rbnz', name: 'Reserve Bank of NZ', currency: 'NZD', flag: '🇳🇿', color: '#059669',
    rate: { value: 3.50, previous: 3.75, date: 'Apr 2026' },
    cpi:  { value: 2.5,  previous: 2.2,  date: 'Q1 2026'  },
    gdp:  { value: 0.7,  previous: -0.1, date: 'Q4 2025'  },
  },
  {
    id: 'boc',  name: 'Bank of Canada',   currency: 'CAD', flag: '🇨🇦', color: '#EF4444',
    rate: { value: 2.75, previous: 3.00, date: 'Mar 2026' },
    cpi:  { value: 2.3,  previous: 2.6,  date: 'Apr 2026' },
    gdp:  { value: 0.5,  previous: 0.6,  date: 'Q4 2025'  },
  },
]

function fmt(v) {
  if (v == null) return '—'
  const n = parseFloat(v)
  return (n >= 0 ? '' : '') + n.toFixed(2) + '%'
}

function fmtGdp(v) {
  if (v == null) return '—'
  const n = parseFloat(v)
  return (n >= 0 ? '+' : '') + n.toFixed(1) + '%'
}

function Delta({ current, previous, invert }) {
  if (current == null || previous == null) return null
  const diff = parseFloat(current) - parseFloat(previous)
  if (Math.abs(diff) < 0.001) return <span style={{ fontSize:'10px', color:'#94A3B8' }}>unchanged</span>
  const up = diff > 0
  const positive = invert ? !up : up
  return (
    <span style={{ fontSize:'10px', fontWeight:'600', color: positive ? '#10B981' : '#EF4444', display:'flex', alignItems:'center', gap:'2px' }}>
      {up ? '▲' : '▼'} {Math.abs(diff).toFixed(2)}%
    </span>
  )
}

function MiniBar({ value, max, col }) {
  if (value == null) return null
  const pct = Math.min(100, Math.max(0, (Math.abs(parseFloat(value)) / max) * 100))
  return (
    <div style={{ height:'3px', background:'#F1F5F9', borderRadius:'2px', overflow:'hidden', marginTop:'6px' }}>
      <div style={{ width: pct + '%', height:'100%', background: col, borderRadius:'2px', transition:'width .4s' }} />
    </div>
  )
}

function MetricBlock({ label, value, previous, date, displayValue, color, barMax, invert }) {
  return (
    <div style={{ borderRadius:'12px', background:'#F8FAFC', padding:'12px 14px' }}>
      <div style={{ fontSize:'10px', fontWeight:'600', color:'#94A3B8', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:'6px' }}>{label}</div>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:'8px' }}>
        <div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'24px', fontWeight:'700', color, lineHeight:1, letterSpacing:'-.02em' }}>
            {displayValue || fmt(value)}
          </div>
          <div style={{ marginTop:'5px' }}>
            <Delta current={value} previous={previous} invert={invert} />
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:'10px', color:'#CBD5E1', marginBottom:'2px' }}>prev</div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:'#94A3B8' }}>{fmt(previous)}</div>
          {date && <div style={{ fontSize:'9px', color:'#E2E8F0', marginTop:'2px' }}>{date}</div>}
        </div>
      </div>
      {barMax && <MiniBar value={value} max={barMax} col={color} />}
    </div>
  )
}

function BankCard({ bank }) {
  const rateCol = bank.rate.value > bank.rate.previous ? '#EF4444' : bank.rate.value < bank.rate.previous ? '#10B981' : '#0F172A'
  const cpiCol  = parseFloat(bank.cpi.value) > 3 ? '#EF4444' : parseFloat(bank.cpi.value) > 2 ? '#F59E0B' : '#10B981'
  const gdpVal  = parseFloat(bank.gdp?.value)
  const gdpCol  = gdpVal > 0.5 ? '#10B981' : gdpVal > 0 ? '#F59E0B' : '#EF4444'

  return (
    <div style={{ background:'#FFFFFF', borderRadius:'20px', padding:'20px 22px', boxShadow:'0 1px 3px rgba(0,0,0,.06),0 8px 24px rgba(0,0,0,.05)', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column', gap:'12px' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg,${bank.color},${bank.color}55)`, borderRadius:'20px 20px 0 0' }} />

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginTop:'4px' }}>
        <span style={{ fontSize:'22px' }}>{bank.flag}</span>
        <div>
          <div style={{ fontSize:'13px', fontWeight:'700', color:'#0F172A' }}>{bank.currency}</div>
          <div style={{ fontSize:'10px', color:'#94A3B8' }}>{bank.name}</div>
        </div>
      </div>

      <MetricBlock label="Interest Rate" value={bank.rate.value} previous={bank.rate.previous} date={bank.rate.date} color={rateCol} barMax={7} invert={false} />
      <MetricBlock label="CPI Inflation" value={bank.cpi.value}  previous={bank.cpi.previous}  date={bank.cpi.date}  color={cpiCol}  barMax={8} invert={true} />
      {bank.gdp && <MetricBlock label="GDP Growth (QoQ)" value={bank.gdp.value} previous={bank.gdp.previous} date={bank.gdp.date} displayValue={fmtGdp(bank.gdp.value)} color={gdpCol} barMax={3} invert={false} />}
    </div>
  )
}

export default function Macro() {
  // Strength scorecard
  const scored = useMemo(() => BANKS.map(b => {
    let score = 0; const signals = []
    const rate = parseFloat(b.rate.value)
    const cpi  = parseFloat(b.cpi.value)
    const gdp  = b.gdp ? parseFloat(b.gdp.value) : null
    const real = rate - cpi

    // Rate level
    if (rate >= 4)      { score += 3; signals.push('High rate') }
    else if (rate >= 2) { score += 2; signals.push('Mid rate') }
    else if (rate >= 0) { score += 1; signals.push('Low rate') }
    else                { score += 0; signals.push('Neg rate') }

    // CPI vs target (2%)
    if (cpi <= 2)       { score += 2; signals.push('CPI on target') }
    else if (cpi <= 3)  { score += 1; signals.push('CPI near target') }
    else                { score -= 1; signals.push('Elevated CPI') }

    // GDP
    if (gdp != null) {
      if (gdp > 0.5)    { score += 2; signals.push('Strong growth') }
      else if (gdp > 0) { score += 1; signals.push('Positive growth') }
      else              { score -= 1; signals.push('Contraction') }
    }

    // Real rate
    if (real > 1)       { score += 1; signals.push('Positive real rate') }
    else if (real < -1) { score -= 1; signals.push('Negative real rate') }

    const pct   = Math.max(0, Math.min(100, (score / 8) * 100))
    const label = pct >= 75 ? 'Strong' : pct >= 55 ? 'Moderate' : pct >= 35 ? 'Neutral' : 'Weak'
    const col   = pct >= 75 ? '#10B981' : pct >= 55 ? '#6366F1'  : pct >= 35 ? '#F59E0B' : '#EF4444'
    return { ...b, score, pct, label, col, signals, real: real.toFixed(2) }
  }).sort((a, b) => b.score - a.score), [])

  return (
    <div style={{ padding:'24px', maxWidth:'1100px', margin:'0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom:'28px' }}>
        <h1 style={{ fontSize:'22px', fontWeight:'700', color:'#0F172A', letterSpacing:'-.03em', marginBottom:'3px' }}>Macro Overview</h1>
        <p style={{ fontSize:'13px', color:'#94A3B8' }}>Central bank rates · CPI inflation · GDP growth · Data updated manually each meeting</p>
      </div>

      {/* ── STRENGTH SCORECARD ── */}
      <div style={{ background:'#FFFFFF', borderRadius:'20px', padding:'22px 24px', boxShadow:'0 1px 3px rgba(0,0,0,.06),0 8px 24px rgba(0,0,0,.05)', marginBottom:'20px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:'linear-gradient(90deg,#0F172A,#0F172A55)', borderRadius:'20px 20px 0 0' }} />
        <div style={{ fontSize:'14px', fontWeight:'700', color:'#0F172A', marginBottom:'3px', marginTop:'4px' }}>Currency Strength Scorecard</div>
        <div style={{ fontSize:'12px', color:'#94A3B8', marginBottom:'16px' }}>Ranked by macro fundamentals: Rate + CPI + GDP + Real Rate</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'8px' }}>
          {scored.map((b, i) => (
            <div key={b.currency} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 14px', background:'#F8FAFC', borderRadius:'12px', border:`1.5px solid ${b.col}22` }}>
              <span style={{ fontSize:'10px', fontWeight:'700', color:'#CBD5E1', width:'18px' }}>#{i+1}</span>
              <span style={{ fontSize:'18px' }}>{b.flag}</span>
              <span style={{ fontSize:'13px', fontWeight:'700', color:'#0F172A', width:'36px' }}>{b.currency}</span>
              <div style={{ flex:1 }}>
                <div style={{ height:'5px', background:'#E2E8F0', borderRadius:'3px', overflow:'hidden', marginBottom:'4px' }}>
                  <div style={{ width: b.pct+'%', height:'100%', background: b.col, borderRadius:'3px', transition:'width .5s' }} />
                </div>
                <div style={{ fontSize:'10px', color:'#94A3B8' }}>{b.signals.slice(0,2).join(' · ')}</div>
              </div>
              <span style={{ fontSize:'11px', fontWeight:'700', color: b.col, minWidth:'60px', textAlign:'right' }}>{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── REAL RATE RANKING ── */}
      <div style={{ background:'#FFFFFF', borderRadius:'20px', padding:'22px 24px', boxShadow:'0 1px 3px rgba(0,0,0,.06),0 8px 24px rgba(0,0,0,.05)', marginBottom:'20px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:'linear-gradient(90deg,#6366F1,#6366F155)', borderRadius:'20px 20px 0 0' }} />
        <div style={{ fontSize:'14px', fontWeight:'700', color:'#0F172A', marginBottom:'3px', marginTop:'4px' }}>Real Interest Rate</div>
        <div style={{ fontSize:'12px', color:'#94A3B8', marginBottom:'16px' }}>Rate minus CPI — higher = more hawkish = currency supportive</div>
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {scored.map((b, i) => {
            const val = parseFloat(b.real)
            const maxAbs = Math.max(...scored.map(x => Math.abs(parseFloat(x.real))), 0.1)
            const barPct = Math.min(100, Math.abs(val) / maxAbs * 100)
            const col = val >= 0 ? '#10B981' : '#EF4444'
            return (
              <div key={b.currency} style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <span style={{ fontSize:'10px', fontWeight:'600', color:'#CBD5E1', width:'20px', textAlign:'right' }}>#{i+1}</span>
                <span style={{ fontSize:'14px' }}>{b.flag}</span>
                <span style={{ fontSize:'12px', fontWeight:'600', color:'#334155', width:'36px' }}>{b.currency}</span>
                <div style={{ flex:1, height:'6px', background:'#F1F5F9', borderRadius:'3px', overflow:'hidden' }}>
                  <div style={{ width: barPct+'%', height:'100%', background: col, borderRadius:'3px', transition:'width .4s' }} />
                </div>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', fontWeight:'700', color: col, minWidth:'52px', textAlign:'right' }}>
                  {val >= 0 ? '+' : ''}{b.real}%
                </span>
                <span style={{ fontSize:'10px', color:'#94A3B8', width:'80px' }}>
                  {val >= 1 ? 'Hawkish' : val >= 0 ? 'Neutral' : val >= -1 ? 'Mild dovish' : 'Dovish'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── BANK CARDS ── */}
      <div style={{ marginBottom:'12px' }}>
        <h2 style={{ fontSize:'15px', fontWeight:'700', color:'#0F172A', marginBottom:'3px' }}>Central Bank Data</h2>
        <p style={{ fontSize:'12px', color:'#94A3B8', marginBottom:'16px' }}>Data updated manually — rates only change at scheduled meetings</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'14px', marginBottom:'20px' }}>
        {BANKS.map(bank => <BankCard key={bank.id} bank={bank} />)}
      </div>

      <div style={{ height:'20px' }} />
    </div>
  )
}
