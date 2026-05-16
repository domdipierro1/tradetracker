import { useState, useEffect } from 'react'

const CACHE_KEY = 'tt_macro_v3'
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

function fmt(v) {
  if (v == null || isNaN(v)) return '—'
  return parseFloat(v).toFixed(2) + '%'
}

function fmtDate(d) {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) }
  catch { return '' }
}

function Delta({ current, previous }) {
  if (current == null || previous == null) return null
  const diff = parseFloat(current) - parseFloat(previous)
  if (Math.abs(diff) < 0.001) return <span style={{ fontSize:'10px', color:'#94A3B8' }}>no change</span>
  const up = diff > 0
  return (
    <span style={{ fontSize:'10px', fontWeight:'600', color: up ? '#10B981' : '#EF4444', display:'flex', alignItems:'center', gap:'2px' }}>
      {up ? '▲' : '▼'} {Math.abs(diff).toFixed(2)}%
    </span>
  )
}

function RateBar({ value, max = 6 }) {
  if (value == null) return null
  const pct = Math.min(100, Math.max(0, (parseFloat(value) / max) * 100))
  const col = parseFloat(value) >= 4 ? '#EF4444' : parseFloat(value) >= 2 ? '#F59E0B' : '#10B981'
  return (
    <div style={{ height:'3px', background:'#F1F5F9', borderRadius:'2px', overflow:'hidden', marginTop:'6px' }}>
      <div style={{ width: pct + '%', height:'100%', background: col, borderRadius:'2px', transition:'width .4s ease' }} />
    </div>
  )
}

function Card({ bank }) {
  const rate  = bank.rate?.value
  const cpi   = bank.cpi?.value
  const rateUp = rate != null && bank.rate?.previous != null && parseFloat(rate) > parseFloat(bank.rate.previous)
  const rateDn = rate != null && bank.rate?.previous != null && parseFloat(rate) < parseFloat(bank.rate.previous)

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: '20px',
      padding: '20px 22px',
      boxShadow: '0 1px 3px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.05)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
    }}>
      {/* Accent top bar */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg, ${bank.color}, ${bank.color}66)`, borderRadius:'20px 20px 0 0' }} />

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginTop:'4px' }}>
        <span style={{ fontSize:'22px', lineHeight:1 }}>{bank.flag}</span>
        <div>
          <div style={{ fontSize:'13px', fontWeight:'700', color:'#0F172A', lineHeight:1.2 }}>{bank.currency}</div>
          <div style={{ fontSize:'10px', color:'#94A3B8', marginTop:'1px' }}>{bank.name}</div>
        </div>
      </div>

      {/* Rate */}
      <div style={{ borderRadius:'12px', background:'#F8FAFC', padding:'12px 14px' }}>
        <div style={{ fontSize:'10px', fontWeight:'600', color:'#94A3B8', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:'6px' }}>Interest Rate</div>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:'8px' }}>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'26px', fontWeight:'700', color: rateUp ? '#EF4444' : rateDn ? '#10B981' : '#0F172A', lineHeight:1, letterSpacing:'-.02em' }}>
              {fmt(rate)}
            </div>
            <div style={{ marginTop:'5px' }}>
              <Delta current={rate} previous={bank.rate?.previous} />
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:'10px', color:'#CBD5E1', marginBottom:'1px' }}>prev</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:'#94A3B8' }}>{fmt(bank.rate?.previous)}</div>
          </div>
        </div>
        <RateBar value={rate} max={6} />
      </div>

      {/* CPI */}
      <div style={{ borderRadius:'12px', background:'#F8FAFC', padding:'12px 14px' }}>
        <div style={{ fontSize:'10px', fontWeight:'600', color:'#94A3B8', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:'6px' }}>CPI Inflation</div>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:'8px' }}>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'26px', fontWeight:'700', color: cpi != null && parseFloat(cpi) > 3 ? '#EF4444' : cpi != null && parseFloat(cpi) > 2 ? '#F59E0B' : '#10B981', lineHeight:1, letterSpacing:'-.02em' }}>
              {fmt(cpi)}
            </div>
            <div style={{ marginTop:'5px' }}>
              <Delta current={cpi} previous={bank.cpi?.previous} />
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:'10px', color:'#CBD5E1', marginBottom:'1px' }}>prev</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:'#94A3B8' }}>{fmt(bank.cpi?.previous)}</div>
          </div>
        </div>
        <RateBar value={cpi} max={8} />
      </div>

      {/* GDP */}
      <div style={{ borderRadius:'12px', background:'#F8FAFC', padding:'12px 14px' }}>
        <div style={{ fontSize:'10px', fontWeight:'600', color:'#94A3B8', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:'6px' }}>GDP Growth (QoQ)</div>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:'8px' }}>
          <div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'26px', fontWeight:'700',
              color: bank.gdp?.value == null ? '#CBD5E1'
                   : parseFloat(bank.gdp.value) > 0.5 ? '#10B981'
                   : parseFloat(bank.gdp.value) > 0 ? '#F59E0B'
                   : '#EF4444',
              lineHeight:1, letterSpacing:'-.02em' }}>
              {bank.gdp?.value != null ? (parseFloat(bank.gdp.value) >= 0 ? '+' : '') + fmt(bank.gdp.value) : '—'}
            </div>
            <div style={{ marginTop:'5px' }}>
              <Delta current={bank.gdp?.value} previous={bank.gdp?.previous} />
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:'10px', color:'#CBD5E1', marginBottom:'1px' }}>prev</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:'#94A3B8' }}>
              {bank.gdp?.previous != null ? (parseFloat(bank.gdp.previous) >= 0 ? '+' : '') + fmt(bank.gdp.previous) : '—'}
            </div>
          </div>
        </div>
        <div style={{ height:'3px', background:'#F1F5F9', borderRadius:'2px', overflow:'hidden', marginTop:'6px' }}>
          <div style={{ width: bank.gdp?.value != null ? Math.min(100, Math.abs(parseFloat(bank.gdp.value)) / 3 * 100) + '%' : '0%', height:'100%', borderRadius:'2px', transition:'width .4s',
            background: bank.gdp?.value != null && parseFloat(bank.gdp.value) > 0 ? '#10B981' : '#EF4444' }} />
        </div>
      </div>

      {/* Last updated */}
      {bank.rate?.date && (
        <div style={{ fontSize:'10px', color:'#CBD5E1', textAlign:'right', marginTop:'-6px' }}>
          Updated {fmtDate(bank.rate.date)}
        </div>
      )}
    </div>
  )
}

export default function Macro() {
  const [data,       setData]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  async function load() {
    setLoading(true); setError(null)
    try {
      // Check cache first
      try {
        const cached = sessionStorage.getItem(CACHE_KEY)
        if (cached) {
          const p = JSON.parse(cached)
          if (Date.now() - p.ts < CACHE_TTL) {
            setData(p.data); setLastUpdate(new Date(p.ts)); setLoading(false); return
          }
        }
      } catch(e) {}

      const res = await fetch('/api/macro', { signal: AbortSignal.timeout(20000) })
      if (!res.ok) throw new Error('API error')
      const json = await res.json()
      if (!json.ok && !json.data?.length) throw new Error(json.error || 'No data')
      setData(json.data || [])
      setLastUpdate(new Date())
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: json.data, ts: Date.now() })) } catch(e) {}
    } catch(e) {
      setError('Could not load macro data: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // Spread analysis — real rate = rate - CPI (negative = dovish pressure)
  const spreads = data
    .filter(b => b.rate?.value != null && b.cpi?.value != null)
    .map(b => ({
      currency: b.currency,
      flag: b.flag,
      color: b.color,
      real: (parseFloat(b.rate.value) - parseFloat(b.cpi.value)).toFixed(2),
    }))
    .sort((a, b) => parseFloat(b.real) - parseFloat(a.real))

  return (
    <div style={{ padding:'24px', maxWidth:'1100px', margin:'0 auto' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'28px', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:'700', color:'#0F172A', letterSpacing:'-.03em', marginBottom:'3px' }}>Macro Overview</h1>
          <p style={{ fontSize:'13px', color:'#94A3B8' }}>
            {loading ? 'Loading central bank data...' : lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})} · Cached for 1hr` : 'Central bank interest rates + CPI inflation'}
          </p>
        </div>
        <button onClick={load} disabled={loading}
          style={{ background: loading ? '#E2E8F0' : '#0F172A', color: loading ? '#94A3B8' : '#FFFFFF', border:'none', borderRadius:'12px', padding:'9px 18px', fontSize:'12px', fontWeight:'600', cursor: loading ? 'default' : 'pointer', fontFamily:'inherit', transition:'all .15s', display:'flex', alignItems:'center', gap:'6px' }}>
          <span style={{ display:'inline-block', animation: loading ? 'spin 1s linear infinite' : 'none' }}>↻</span>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div style={{ padding:'12px 16px', background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:'12px', color:'#991B1B', fontSize:'13px', marginBottom:'20px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'14px', marginBottom:'28px' }}>
          {Array.from({length:8}).map((_,i) => (
            <div key={i} style={{ background:'#FFFFFF', borderRadius:'20px', padding:'20px 22px', boxShadow:'0 1px 3px rgba(0,0,0,.06)', height:'220px', animation:'pulse 1.5s ease infinite' }}>
              <div style={{ height:'12px', borderRadius:'6px', background:'#F1F5F9', marginBottom:'12px', width:'60%' }} />
              <div style={{ height:'40px', borderRadius:'10px', background:'#F8FAFC', marginBottom:'10px' }} />
              <div style={{ height:'40px', borderRadius:'10px', background:'#F8FAFC' }} />
            </div>
          ))}
        </div>
      )}

      {/* ── STRENGTH SUMMARY TABLE ── */}
      {!loading && data.length > 0 && (() => {
        const scored = data.map(b => {
          let score = 0; let signals = []
          // Rate score (0-3)
          const rate = parseFloat(b.rate?.value)
          if (!isNaN(rate)) {
            if (rate >= 4)      { score += 3; signals.push('High rate') }
            else if (rate >= 2) { score += 2; signals.push('Mid rate') }
            else if (rate >= 0) { score += 1; signals.push('Low rate') }
            else                { score += 0; signals.push('Neg rate') }
          }
          // CPI trend (falling = hawkish effect wearing off = neutral/bearish, rising = hawkish pressure)
          const cpi = parseFloat(b.cpi?.value); const prevCpi = parseFloat(b.cpi?.previous)
          if (!isNaN(cpi)) {
            if (cpi <= 2)       { score += 2; signals.push('CPI on target') }
            else if (cpi <= 3)  { score += 1; signals.push('CPI near target') }
            else                { score -= 1; signals.push('CPI elevated') }
          }
          // GDP (positive = good, negative = bad)
          const gdp = parseFloat(b.gdp?.value)
          if (!isNaN(gdp)) {
            if (gdp > 0.5)      { score += 2; signals.push('Strong growth') }
            else if (gdp > 0)   { score += 1; signals.push('Positive growth') }
            else                { score -= 1; signals.push('Contraction') }
          }
          // Real rate bonus
          if (!isNaN(rate) && !isNaN(cpi)) {
            const real = rate - cpi
            if (real > 1)       { score += 1; signals.push('Positive real rate') }
            else if (real < -1) { score -= 1; signals.push('Negative real rate') }
          }
          const max = 8
          const pct = Math.max(0, Math.min(100, (score / max) * 100))
          const label = pct >= 75 ? 'Strong' : pct >= 55 ? 'Moderate' : pct >= 35 ? 'Neutral' : 'Weak'
          const col   = pct >= 75 ? '#10B981' : pct >= 55 ? '#6366F1' : pct >= 35 ? '#F59E0B' : '#EF4444'
          return { ...b, score, pct, label, col, signals }
        }).sort((a,b) => b.score - a.score)

        return (
          <div style={{ background:'#FFFFFF', borderRadius:'20px', padding:'22px 24px', boxShadow:'0 1px 3px rgba(0,0,0,.06),0 8px 24px rgba(0,0,0,.05)', marginBottom:'20px', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:'linear-gradient(90deg,#0F172A,#0F172A88)', borderRadius:'20px 20px 0 0' }} />
            <div style={{ fontSize:'14px', fontWeight:'700', color:'#0F172A', marginBottom:'3px', marginTop:'4px' }}>Currency Strength Scorecard</div>
            <div style={{ fontSize:'12px', color:'#94A3B8', marginBottom:'16px' }}>Ranked by macro fundamentals: Interest Rate + CPI + GDP + Real Rate</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'8px' }}>
              {scored.map((b, i) => (
                <div key={b.currency} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 14px', background:'#F8FAFC', borderRadius:'12px', border:`1.5px solid ${b.col}22` }}>
                  <span style={{ fontSize:'10px', fontWeight:'700', color:'#CBD5E1', width:'18px' }}>#{i+1}</span>
                  <span style={{ fontSize:'18px' }}>{b.flag}</span>
                  <span style={{ fontSize:'13px', fontWeight:'700', color:'#0F172A', width:'36px' }}>{b.currency}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ height:'5px', background:'#E2E8F0', borderRadius:'3px', overflow:'hidden', marginBottom:'4px' }}>
                      <div style={{ width: b.pct+'%', height:'100%', background: b.col, borderRadius:'3px', transition:'width .5s ease' }} />
                    </div>
                    <div style={{ fontSize:'10px', color:'#94A3B8', lineHeight:1 }}>{b.signals.slice(0,2).join(' · ')}</div>
                  </div>
                  <span style={{ fontSize:'11px', fontWeight:'700', color: b.col, minWidth:'60px', textAlign:'right' }}>{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* ── CARDS GRID ── */}
      {!loading && data.length > 0 && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'14px', marginBottom:'28px' }}>
            {data.map(bank => <Card key={bank.id} bank={bank} />)}
          </div>

          {/* Real rates ranking */}
          {spreads.length >= 2 && (
            <div style={{ background:'#FFFFFF', borderRadius:'20px', padding:'22px 24px', boxShadow:'0 1px 3px rgba(0,0,0,.06),0 8px 24px rgba(0,0,0,.05)', marginBottom:'20px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:'linear-gradient(90deg,#6366F1,#6366F188)', borderRadius:'20px 20px 0 0' }} />
              <div style={{ fontSize:'14px', fontWeight:'700', color:'#0F172A', marginBottom:'3px', marginTop:'4px' }}>Real Interest Rate Ranking</div>
              <div style={{ fontSize:'12px', color:'#94A3B8', marginBottom:'16px' }}>Rate minus CPI — higher = more hawkish / currency supportive</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {spreads.map((s, i) => {
                  const val = parseFloat(s.real)
                  const maxAbs = Math.max(...spreads.map(x => Math.abs(parseFloat(x.real))), 0.1)
                  const barPct = Math.min(100, (Math.abs(val) / maxAbs) * 100)
                  const col = val >= 0 ? '#10B981' : '#EF4444'
                  return (
                    <div key={s.currency} style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <span style={{ fontSize:'10px', fontWeight:'600', color:'#CBD5E1', width:'20px', textAlign:'right' }}>#{i+1}</span>
                      <span style={{ fontSize:'14px' }}>{s.flag}</span>
                      <span style={{ fontSize:'12px', fontWeight:'600', color:'#334155', width:'36px' }}>{s.currency}</span>
                      <div style={{ flex:1, height:'6px', background:'#F1F5F9', borderRadius:'3px', overflow:'hidden' }}>
                        <div style={{ width: barPct+'%', height:'100%', background: col, borderRadius:'3px', transition:'width .4s ease' }} />
                      </div>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', fontWeight:'700', color: col, minWidth:'50px', textAlign:'right' }}>
                        {val >= 0 ? '+' : ''}{s.real}%
                      </span>
                      <span style={{ fontSize:'10px', color:'#94A3B8', width:'80px' }}>{val >= 1 ? 'Hawkish' : val >= 0 ? 'Neutral' : val >= -1 ? 'Mild dovish' : 'Dovish'}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
      <div style={{ height:'20px' }} />
    </div>
  )
}
