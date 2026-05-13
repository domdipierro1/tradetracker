import { useState, useEffect, useCallback } from 'react'

const INSTRUMENTS = [
  { sym: 'AUD/USD', yf: 'AUDUSD=X',  dp: 5 },
  { sym: 'EUR/USD', yf: 'EURUSD=X',  dp: 5 },
  { sym: 'GBP/USD', yf: 'GBPUSD=X',  dp: 5 },
  { sym: 'NZD/USD', yf: 'NZDUSD=X',  dp: 5 },
  { sym: 'USD/CHF', yf: 'USDCHF=X',  dp: 5 },
  { sym: 'USD/CAD', yf: 'USDCAD=X',  dp: 5 },
  { sym: 'USD/JPY', yf: 'USDJPY=X',  dp: 3 },
  { sym: 'NQ',      yf: 'NQ=F',       dp: 2 },
  { sym: 'ES',      yf: 'ES=F',       dp: 2 },
  { sym: 'YM',      yf: 'YM=F',       dp: 0 },
  { sym: 'DAX',     yf: '^GDAXI',     dp: 2 },
  { sym: 'UK100',   yf: '^FTSE',      dp: 2 },
  { sym: 'Gold',    yf: 'GC=F',       dp: 2 },
  { sym: 'Silver',  yf: 'SI=F',       dp: 3 },
  { sym: 'EUR/AUD', yf: 'EURAUD=X',  dp: 5 },
  { sym: 'EUR/CAD', yf: 'EURCAD=X',  dp: 5 },
  { sym: 'EUR/JPY', yf: 'EURJPY=X',  dp: 3 },
  { sym: 'EUR/NZD', yf: 'EURNZD=X',  dp: 5 },
  { sym: 'EUR/GBP', yf: 'EURGBP=X',  dp: 5 },
  { sym: 'GBP/AUD', yf: 'GBPAUD=X',  dp: 5 },
  { sym: 'GBP/CAD', yf: 'GBPCAD=X',  dp: 5 },
  { sym: 'GBP/JPY', yf: 'GBPJPY=X',  dp: 3 },
  { sym: 'GBP/NZD', yf: 'GBPNZD=X',  dp: 5 },
  { sym: 'AUD/NZD', yf: 'AUDNZD=X',  dp: 5 },
]

const RETEST_BUFFER = 0.015 // 1.5% of range counts as retest zone

function getStatus(price, pdh, pdl) {
  if (!price || !pdh || !pdl) return 'unknown'
  const range = pdh - pdl
  if (range <= 0) return 'unknown'
  const buf = range * RETEST_BUFFER
  if (price > pdh) {
    if (Math.abs(price - pdh) <= buf) return 'retest-pdh'
    return 'above'
  }
  if (price < pdl) {
    if (Math.abs(price - pdl) <= buf) return 'retest-pdl'
    return 'below'
  }
  return 'range'
}

function fmtPrice(v, dp) {
  if (v == null || isNaN(v)) return '—'
  return Number(v).toFixed(dp)
}

function fmtChg(chg, pct) {
  if (chg == null) return null
  const sign = chg >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(2)}%`
}

// No client-side fetch needed - data comes from /api/scanner serverless function

const STATUS_CONFIG = {
  'retest-pdh': { label: '👀 PDH Retest',  bg: 'var(--amber-bg)',  border: 'var(--amber-dim)',  text: 'var(--amber)',  priority: 1 },
  'retest-pdl': { label: '👀 PDL Retest',  bg: 'var(--amber-bg)',  border: 'var(--amber-dim)',  text: 'var(--amber)',  priority: 1 },
  'above':      { label: '▲ Above PDH',   bg: 'var(--green-bg)',  border: 'var(--green-dim)',  text: 'var(--green)',  priority: 2 },
  'below':      { label: '▼ Below PDL',   bg: 'var(--red-bg)',    border: 'var(--red-dim)',    text: 'var(--red)',    priority: 2 },
  'range':      { label: '· In range',    bg: 'var(--surface2)',  border: 'var(--border)',     text: 'var(--muted)',  priority: 3 },
  'unknown':    { label: '—',             bg: 'var(--surface2)',  border: 'var(--border)',     text: 'var(--muted2)', priority: 4 },
}

const FILTERS = [
  { id: 'all',    label: 'All' },
  { id: 'retest', label: '👀 Retest' },
  { id: 'break',  label: 'Broken Level' },
  { id: 'range',  label: 'In Range' },
]

export default function Scanner() {
  const [data,       setData]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState('all')
  const [lastUpdate, setLastUpdate] = useState(null)
  const [error,      setError]      = useState(null)

  const loadAll = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/scanner', { signal: AbortSignal.timeout(20000) })
      if (!res.ok) throw new Error('API error ' + res.status)
      const json = await res.json()
      if (!json.ok && !json.data?.length) throw new Error(json.error || 'No data returned')
      setData(json.data || [])
      setLastUpdate(new Date())
    } catch (e) {
      setError('Could not load prices: ' + e.message + '. Try refreshing.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
    const timer = setInterval(loadAll, 5 * 60 * 1000)
    return () => clearInterval(timer)
  }, [loadAll])

  const filtered = data
    .filter(r => {
      const st = getStatus(r.price, r.pdh, r.pdl)
      if (filter === 'retest') return st === 'retest-pdh' || st === 'retest-pdl'
      if (filter === 'break')  return st === 'above' || st === 'below'
      if (filter === 'range')  return st === 'range'
      return true
    })
    .sort((a, b) => {
      const pa = STATUS_CONFIG[getStatus(a.price, a.pdh, a.pdl)]?.priority || 9
      const pb = STATUS_CONFIG[getStatus(b.price, b.pdh, b.pdl)]?.priority || 9
      return pa - pb
    })

  // Summary counts
  const counts = { retest: 0, above: 0, below: 0, range: 0 }
  data.forEach(r => {
    const st = getStatus(r.price, r.pdh, r.pdl)
    if (st === 'retest-pdh' || st === 'retest-pdl') counts.retest++
    else if (st === 'above') counts.above++
    else if (st === 'below') counts.below++
    else if (st === 'range') counts.range++
  })

  return (
    <div className="page active">

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'10px' }}>
        <div>
          <h1 style={{ fontSize:'18px', fontWeight:'600', color:'var(--text)', letterSpacing:'-.02em', marginBottom:'3px' }}>
            PDH/PDL Scanner
          </h1>
          <div style={{ fontSize:'12px', color:'var(--muted)', display:'flex', alignItems:'center', gap:'6px' }}>
            <span style={{ width:'6px', height:'6px', borderRadius:'50%', background: loading ? 'var(--amber)' : 'var(--green)', display:'inline-block', animation: loading ? 'pulse 1s infinite' : 'none' }} />
            {loading ? 'Updating...' : lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })} · Auto-refreshes every 5 min` : 'Live prices from Yahoo Finance'}
          </div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={loadAll} disabled={loading}
          style={{ display:'flex', alignItems:'center', gap:'5px' }}>
          <span style={{ display:'inline-block', animation: loading ? 'spin 1s linear infinite' : 'none', fontSize:'13px' }}>↻</span>
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(100px, 1fr))', gap:'8px', marginBottom:'18px' }}>
        {[
          { label:'Retest',    n: counts.retest, col:'var(--amber)' },
          { label:'Above PDH', n: counts.above,  col:'var(--green)' },
          { label:'Below PDL', n: counts.below,  col:'var(--red)'   },
          { label:'In Range',  n: counts.range,  col:'var(--muted)' },
        ].map((c, i) => (
          <div key={i} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', padding:'11px 13px', boxShadow:'var(--shadow)' }}>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'22px', fontWeight:'600', color: c.n > 0 ? c.col : 'var(--text)', lineHeight:1, marginBottom:'3px' }}>{loading ? '—' : c.n}</div>
            <div style={{ fontSize:'10px', fontWeight:'600', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em' }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div style={{ display:'flex', gap:'5px', marginBottom:'14px', flexWrap:'wrap' }}>
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            style={{ padding:'5px 12px', borderRadius:'20px', fontSize:'11px', fontWeight: filter===f.id ? '600' : '400', color: filter===f.id ? 'var(--text)' : 'var(--muted)', background: filter===f.id ? 'var(--surface)' : 'transparent', border: filter===f.id ? '1px solid var(--border2)' : '1px solid var(--border)', cursor:'pointer', fontFamily:'inherit', transition:'all .12s' }}>
            {f.label}
            {f.id !== 'all' && !loading && (
              <span style={{ marginLeft:'5px', fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'var(--muted2)' }}>
                {f.id==='retest' ? counts.retest : f.id==='break' ? counts.above+counts.below : counts.range}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding:'12px 14px', background:'var(--red-bg)', border:'1px solid var(--red-dim)', borderRadius:'var(--r)', color:'var(--red)', fontSize:'12px', fontWeight:'500', marginBottom:'14px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Table */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
        {/* Column headers */}
        <div style={{ display:'grid', gridTemplateColumns:'100px 1fr 90px 90px 1fr 130px', background:'var(--surface2)', borderBottom:'1px solid var(--border)', padding:'0' }}>
          {['Instrument','Price','PDH','PDL','vs Range','Status'].map((h, i) => (
            <div key={h} style={{ padding:'8px 12px', fontSize:'9px', fontWeight:'600', color:'var(--muted)', letterSpacing:'.08em', textTransform:'uppercase', textAlign: i >= 4 ? 'center' : 'left' }}>{h}</div>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading && data.length === 0 && Array.from({length: 8}).map((_, i) => (
          <div key={i} style={{ display:'grid', gridTemplateColumns:'100px 1fr 90px 90px 1fr 130px', padding:'0', borderBottom:'1px solid var(--border)', alignItems:'center', minHeight:'44px' }}>
            {Array.from({length:6}).map((_, j) => (
              <div key={j} style={{ margin:'10px 12px', height:'12px', borderRadius:'3px', background:'var(--surface3)', animation:'pulse 1.5s ease infinite', animationDelay: `${j*0.1}s` }} />
            ))}
          </div>
        ))}

        {/* Rows */}
        {filtered.map((row, i) => {
          const st   = getStatus(row.price, row.pdh, row.pdl)
          const cfg  = STATUS_CONFIG[st]
          const chg  = row.price && row.prev ? row.price - row.prev : null
          const pct  = chg && row.prev ? (chg / row.prev * 100) : null
          const chgStr = fmtChg(chg, pct)
          const chgCol = chg > 0 ? 'var(--green)' : chg < 0 ? 'var(--red)' : 'var(--muted)'

          // Position in range bar
          const posInRange = row.pdh && row.pdl && row.price ? Math.min(110, Math.max(-10, ((row.price - row.pdl) / (row.pdh - row.pdl)) * 100)) : null
          const barCol = st === 'above' ? 'var(--green)' : st === 'below' ? 'var(--red)' : st.startsWith('retest') ? 'var(--amber)' : 'var(--blue)'

          return (
            <div key={row.sym} style={{ display:'grid', gridTemplateColumns:'100px 1fr 90px 90px 1fr 130px', borderBottom: i < filtered.length-1 ? '1px solid var(--border)' : 'none', alignItems:'center', minHeight:'46px', transition:'background .1s', background: st.startsWith('retest') ? 'rgba(245,158,11,.03)' : 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
              onMouseLeave={e => e.currentTarget.style.background= st.startsWith('retest') ? 'rgba(245,158,11,.03)' : 'transparent'}>

              {/* Instrument */}
              <div style={{ padding:'8px 12px', fontSize:'12px', fontWeight:'600', color:'var(--text)' }}>{row.sym}</div>

              {/* Price + change */}
              <div style={{ padding:'8px 12px' }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:'var(--text)', fontWeight:'500' }}>{fmtPrice(row.price, row.dp)}</div>
                {chgStr && <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:chgCol, marginTop:'1px' }}>{chgStr}</div>}
              </div>

              {/* PDH */}
              <div style={{ padding:'8px 12px', fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'var(--green)', textAlign:'right' }}>{fmtPrice(row.pdh, row.dp)}</div>

              {/* PDL */}
              <div style={{ padding:'8px 12px', fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'var(--red)', textAlign:'right' }}>{fmtPrice(row.pdl, row.dp)}</div>

              {/* Position bar */}
              <div style={{ padding:'8px 16px', display:'flex', alignItems:'center', gap:'6px' }}>
                {posInRange !== null ? (
                  <>
                    <div style={{ flex:1, height:'4px', background:'var(--surface3)', borderRadius:'2px', position:'relative', overflow:'hidden' }}>
                      <div style={{ position:'absolute', left:0, width:`${Math.min(100, Math.max(0, posInRange))}%`, height:'100%', background:barCol, borderRadius:'2px', transition:'width .3s' }} />
                    </div>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', color:'var(--muted2)', minWidth:'28px', textAlign:'right' }}>
                      {Math.min(999, Math.max(-99, posInRange)).toFixed(0)}%
                    </span>
                  </>
                ) : <div style={{ flex:1, height:'4px', background:'var(--surface3)', borderRadius:'2px' }} />}
              </div>

              {/* Status badge */}
              <div style={{ padding:'8px 12px', display:'flex', justifyContent:'flex-end' }}>
                <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 8px', borderRadius:'4px', fontSize:'10px', fontWeight:'600', background:cfg.bg, border:`1px solid ${cfg.border}`, color:cfg.text, whiteSpace:'nowrap' }}>
                  {cfg.label}
                </span>
              </div>
            </div>
          )
        })}

        {!loading && filtered.length === 0 && (
          <div style={{ padding:'32px', textAlign:'center', color:'var(--muted)', fontSize:'13px' }}>
            No instruments match this filter
          </div>
        )}
      </div>

      {/* Footer note */}
      <div style={{ marginTop:'10px', fontSize:'10px', color:'var(--muted2)', textAlign:'center' }}>
        Prices from Yahoo Finance · PDH/PDL from previous daily candle · Retest zone = within 1.5% of level · Not financial advice
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @media(max-width:768px){
          .scanner-table { font-size:11px; }
        }
      `}</style>
    </div>
  )
}
