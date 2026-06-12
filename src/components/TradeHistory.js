import { useState, useMemo } from 'react'
import { computeStats, f1, fP } from '../lib/stats'

// Parse a multi-value field (level/emotions/mistake_tags) into an array
function parseList(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : (raw ? [String(raw)] : []) }
  catch { return raw ? [String(raw)] : [] }
}

// ── CHART IMAGE w/ lightbox (self-contained copy) ────────────────
function ChartImage({ url, label, large }) {
  const [err, setErr] = useState(false)
  const [open, setOpen] = useState(false)
  if (!url) return null
  return (
    <>
      <div>
        <div style={{ fontSize:'10px', fontWeight:'600', color:'var(--muted)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'6px' }}>{label}</div>
        {!err ? (
          <img src={url} alt={label} onError={() => setErr(true)} onClick={() => setOpen(true)}
            style={{ width:'100%', borderRadius:'var(--r-sm)', border:'1px solid var(--border)', display:'block', cursor:'zoom-in', objectFit:'contain', minHeight: large ? '180px' : '120px', maxHeight: large ? '460px' : '300px', background:'var(--surface2)' }} />
        ) : (
          <a href={url} target="_blank" rel="noopener noreferrer"
            style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'80px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', fontSize:'12px', color:'var(--blue)', fontWeight:'500', textDecoration:'none', gap:'6px' }}>
            📊 View {label} →
          </a>
        )}
      </div>
      {open && (
        <div onClick={() => setOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.85)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', cursor:'zoom-out' }}>
          <img src={url} alt={label} style={{ maxWidth:'100%', maxHeight:'100%', borderRadius:'var(--r-sm)', boxShadow:'0 20px 60px rgba(0,0,0,.5)' }} />
          <div style={{ position:'absolute', top:'16px', right:'16px', color:'#fff', fontSize:'14px', fontWeight:'700', cursor:'pointer', background:'rgba(255,255,255,.15)', padding:'6px 12px', borderRadius:'6px' }}>✕ Close</div>
        </div>
      )}
    </>
  )
}

// ── HISTORY TRADE CARD — mirrors the journal TradeCard ───────────
function HistoryTradeCard({ t, onOpenDay }) {
  const up = (t.pl || t.r_multiple || 0) >= 0
  const rVal = t.pl || t.r_multiple || 0
  const ob = o => o==='Win' ? { bg:'#ECFDF5', col:'#065F46', border:'#BBF7D0' }
                 : o==='Loss' ? { bg:'#FEF2F2', col:'#7F1D1D', border:'#FECACA' }
                 : { bg:'#FFFBEB', col:'#78350F', border:'#FDE68A' }
  const oc = ob(t.outcome)

  return (
    <div style={{ background:'#FFFFFF', borderRadius:'20px', marginBottom:'12px', boxShadow:'0 1px 3px rgba(0,0,0,.06),0 8px 24px rgba(0,0,0,.04)', overflow:'hidden', border:`1.5px solid ${up ? '#DCFCE7' : '#FEE2E2'}` }}>
      {/* Header stripe */}
      <div style={{ padding:'14px 20px', background: up ? '#F0FDF4' : '#FFF5F5', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
        <button onClick={() => onOpenDay && onOpenDay(t.date)} title="Open this day's journal"
          style={{ background:'none', border:'none', cursor: onOpenDay ? 'pointer' : 'default', padding:0, display:'inline-flex', alignItems:'center', gap:'5px', fontFamily:'inherit' }}>
          <span style={{ fontSize:'15px', fontWeight:'700', color:'#0F172A', letterSpacing:'-.01em', textDecoration: onOpenDay ? 'underline' : 'none', textDecorationColor:'#CBD5E1', textUnderlineOffset:'3px' }}>{t.symbol || '—'}</span>
          {onOpenDay && <span style={{ fontSize:'10px', color:'#94A3B8' }}>↗</span>}
        </button>
        {t.date && <span style={{ fontSize:'10px', color:'#94A3B8', fontFamily:"'JetBrains Mono',monospace" }}>{new Date(t.date+'T12:00:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}</span>}
        {t.time && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#94A3B8', background:'#F1F5F9', padding:'2px 7px', borderRadius:'6px' }}>{t.time} EST</span>}
        {t.direction && (
          <span style={{ fontSize:'11px', fontWeight:'700', padding:'3px 9px', borderRadius:'7px', background: t.direction==='Long'?'#DCFCE7':'#FEE2E2', color: t.direction==='Long'?'#14532D':'#7F1D1D', border: `1px solid ${t.direction==='Long'?'#BBF7D0':'#FECACA'}` }}>{t.direction}</span>
        )}
        {t.outcome && (
          <span style={{ fontSize:'11px', fontWeight:'700', padding:'3px 9px', borderRadius:'7px', background:oc.bg, color:oc.col, border:`1px solid ${oc.border}` }}>{t.outcome}</span>
        )}
        <span style={{ marginLeft:'auto', fontFamily:"'JetBrains Mono',monospace", fontSize:'18px', fontWeight:'700', color: up ? '#10B981' : '#EF4444' }}>
          {rVal >= 0 ? '+' : ''}{rVal.toFixed ? rVal.toFixed(2) : rVal}R
        </span>
      </div>

      {/* Details grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', borderBottom:`1px solid #F1F5F9` }}>
        {[['Bias',t.bias],['Session',t.session?.replace(' (02:00–05:00)','')?.replace(' (06:00–10:00)','')],['Trade Type',t.trade_type],['Key Level',parseList(t.level).join(', ')||t.setup],['Entry TF',t.entry_tf||t.smt],['Risk',t.risk?`${t.risk}%`:null]].filter(([,v])=>v).map(([l,v],i)=>(
          <div key={i} style={{ padding:'10px 14px', borderRight:'1px solid #F1F5F9', borderBottom:'1px solid #F1F5F9' }}>
            <div style={{ fontSize:'9px', fontWeight:'600', color:'#94A3B8', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:'3px' }}>{l}</div>
            <div style={{ fontSize:'12px', fontWeight:'500', color:'#334155' }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Emotion + Mistake tags */}
      {(parseList(t.emotions).length > 0 || parseList(t.mistake_tags).length > 0) && (
        <div style={{ padding:'10px 20px', borderBottom:'1px solid #F1F5F9', display:'flex', flexWrap:'wrap', gap:'6px', alignItems:'center' }}>
          {parseList(t.emotions).map(e => (
            <span key={'e'+e} style={{ fontSize:'11px', fontWeight:'600', color:'#7C3AED', background:'#F2ECFE', border:'1px solid #D2BEF9', padding:'3px 9px', borderRadius:'20px' }}>{e}</span>
          ))}
          {parseList(t.mistake_tags).map(m => (
            <span key={'m'+m} style={{ fontSize:'11px', fontWeight:'600', color:'#E11D48', background:'#FDECEF', border:'1px solid #F6B9C6', padding:'3px 9px', borderRadius:'20px' }}>{m}</span>
          ))}
        </div>
      )}

      {/* Mistake */}
      {t.mistake && t.mistake !== 'No mistake' && (
        <div style={{ padding:'10px 20px', background:'#FFF5F5', borderBottom:'1px solid #FEE2E2', display:'flex', alignItems:'center', gap:'8px' }}>
          <span style={{ fontSize:'13px' }}>⚠️</span>
          <span style={{ fontSize:'12px', color:'#991B1B', fontWeight:'500' }}>{t.mistake}</span>
        </div>
      )}

      {/* Journal */}
      {t.journal && (
        <div style={{ padding:'14px 20px', borderBottom:'1px solid #F1F5F9' }}>
          <div style={{ fontSize:'9px', fontWeight:'600', color:'#94A3B8', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:'6px' }}>Notes</div>
          <p style={{ fontSize:'13px', color:'#334155', lineHeight:'1.7', margin:0, whiteSpace:'pre-wrap' }}>{t.journal}</p>
        </div>
      )}

      {/* Charts */}
      {(t.screenshot || t.screenshot2) && (
        <div style={{ padding:'16px 20px' }}>
          <div style={{ fontSize:'9px', fontWeight:'600', color:'#94A3B8', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:'12px' }}>Charts</div>
          <div style={{ display:'grid', gridTemplateColumns: t.screenshot && t.screenshot2 ? '1fr 1fr' : '1fr', gap:'12px' }}>
            {t.screenshot  && <ChartImage url={t.screenshot}  label={t.screenshot_tf || "Chart 1"} large />}
            {t.screenshot2 && <ChartImage url={t.screenshot2} label={t.screenshot2_tf || "Chart 2"} large />}
          </div>
        </div>
      )}
    </div>
  )
}

// ── helpers for date math ────────────────────────────────────────
function isoDate(d) { return d.toLocaleDateString('en-CA') }
function startOfWeek(d) { const x = new Date(d); const dow = x.getDay(); const diff = dow === 0 ? -6 : 1 - dow; x.setDate(x.getDate() + diff); return x }

export default function TradeHistory({ trades, startingBalance, onOpenJournal }) {
  const all = useMemo(() => (trades || []).slice().sort((a,b) => (b.date||'').localeCompare(a.date||'') || (b.time||'').localeCompare(a.time||'')), [trades])

  // Filter mode: 'all' | 'month' | 'week' | 'range'
  const [mode, setMode] = useState('all')
  const today = new Date()
  const [month, setMonth] = useState(`${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}`) // YYYY-MM
  const [weekStart, setWeekStart] = useState(isoDate(startOfWeek(today)))
  const [rangeStart, setRangeStart] = useState('')
  const [rangeEnd, setRangeEnd] = useState('')

  // Build list of months that actually have trades, for the dropdown
  const monthsWithTrades = useMemo(() => {
    const set = new Set()
    all.forEach(t => { if (t.date) set.add(t.date.slice(0,7)) })
    return [...set].sort().reverse()
  }, [all])

  const filtered = useMemo(() => {
    if (mode === 'all') return all
    if (mode === 'month') return all.filter(t => t.date && t.date.slice(0,7) === month)
    if (mode === 'week') {
      const ws = new Date(weekStart + 'T00:00:00')
      const we = new Date(ws); we.setDate(ws.getDate() + 6)
      const wsS = isoDate(ws), weS = isoDate(we)
      return all.filter(t => t.date && t.date >= wsS && t.date <= weS)
    }
    if (mode === 'range') {
      if (!rangeStart && !rangeEnd) return all
      return all.filter(t => {
        if (!t.date) return false
        if (rangeStart && t.date < rangeStart) return false
        if (rangeEnd && t.date > rangeEnd) return false
        return true
      })
    }
    return all
  }, [all, mode, month, weekStart, rangeStart, rangeEnd])

  const stats = useMemo(() => computeStats(filtered, startingBalance), [filtered, startingBalance])

  const tabStyle = active => ({
    padding:'7px 14px', borderRadius:'10px', fontSize:'12.5px', fontWeight:'600', cursor:'pointer',
    fontFamily:'inherit', border:`1.5px solid ${active ? '#4F46E5' : '#E2E8F0'}`,
    background: active ? '#4F46E5' : '#FFFFFF', color: active ? '#FFFFFF' : '#475569', transition:'all .12s'
  })
  const inputStyle = { background:'#FFFFFF', border:'1.5px solid #E2E8F0', borderRadius:'10px', padding:'8px 11px', fontSize:'12.5px', color:'#0F172A', fontFamily:'inherit', outline:'none' }

  function monthLabel(ym) {
    const [y,m] = ym.split('-')
    return new Date(parseInt(y), parseInt(m)-1, 1).toLocaleDateString('en-GB', { month:'long', year:'numeric' })
  }

  return (
    <div className="page active journal-page" style={{ maxWidth:'860px', margin:'0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom:'18px' }}>
        <h1 style={{ fontFamily:"'Bricolage Grotesque', sans-serif", fontSize:'24px', fontWeight:'700', color:'#0F172A', letterSpacing:'-.02em', margin:'0 0 4px' }}>Trade History</h1>
        <p style={{ fontSize:'13px', color:'#64748B', margin:0 }}>Every trade you've logged — filter and review the full record.</p>
      </div>

      {/* Filter bar */}
      <div style={{ background:'#FFFFFF', border:'1px solid #E9ECF1', borderRadius:'16px', padding:'14px 16px', marginBottom:'16px', boxShadow:'0 1px 2px rgba(20,24,31,.04)' }}>
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom: mode === 'all' ? '0' : '12px' }}>
          <button style={tabStyle(mode==='all')}   onClick={() => setMode('all')}>All time</button>
          <button style={tabStyle(mode==='month')} onClick={() => setMode('month')}>By month</button>
          <button style={tabStyle(mode==='week')}  onClick={() => setMode('week')}>By week</button>
          <button style={tabStyle(mode==='range')} onClick={() => setMode('range')}>Date range</button>
        </div>

        {mode === 'month' && (
          <select style={{ ...inputStyle, cursor:'pointer', minWidth:'180px' }} value={month} onChange={e => setMonth(e.target.value)}>
            {monthsWithTrades.length === 0 && <option value={month}>{monthLabel(month)}</option>}
            {monthsWithTrades.map(ym => <option key={ym} value={ym}>{monthLabel(ym)}</option>)}
          </select>
        )}

        {mode === 'week' && (
          <div style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
            <label style={{ fontSize:'12px', color:'#64748B', fontWeight:'600' }}>Week of</label>
            <input type="date" style={inputStyle} value={weekStart} onChange={e => setWeekStart(isoDate(startOfWeek(new Date(e.target.value+'T00:00:00'))))} />
            <span style={{ fontSize:'11px', color:'#94A3B8' }}>(Mon–Sun)</span>
          </div>
        )}

        {mode === 'range' && (
          <div style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
            <label style={{ fontSize:'12px', color:'#64748B', fontWeight:'600' }}>From</label>
            <input type="date" style={inputStyle} value={rangeStart} onChange={e => setRangeStart(e.target.value)} />
            <label style={{ fontSize:'12px', color:'#64748B', fontWeight:'600' }}>to</label>
            <input type="date" style={inputStyle} value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} />
            {(rangeStart || rangeEnd) && <button onClick={() => { setRangeStart(''); setRangeEnd('') }} style={{ ...tabStyle(false), padding:'6px 10px' }}>Clear</button>}
          </div>
        )}
      </div>

      {/* Summary strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(90px,1fr))', gap:'10px', marginBottom:'18px' }}>
        {[
          ['Trades', String(filtered.length), '#0F172A'],
          ['Total R', `${stats.totalR >= 0 ? '+' : ''}${f1(stats.totalR)}`, stats.totalR >= 0 ? '#059669' : '#E11D48'],
          ['Win Rate', fP(stats.winRate), '#0F172A'],
          ['Wins', String(stats.wins ?? 0), '#059669'],
          ['Losses', String(stats.losses ?? 0), '#E11D48'],
          ['Expectancy', f1(stats.expectancy || 0) + 'R', (stats.expectancy||0) >= 0 ? '#059669' : '#E11D48'],
        ].map(([label, val, col]) => (
          <div key={label} style={{ background:'#FFFFFF', border:'1px solid #E9ECF1', borderRadius:'14px', padding:'12px 14px', textAlign:'center', boxShadow:'0 1px 2px rgba(20,24,31,.04)' }}>
            <div style={{ fontSize:'9px', fontWeight:'700', color:'#A4ABB7', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:'5px' }}>{label}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'18px', fontWeight:'700', color: col, letterSpacing:'-.03em' }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Trade list */}
      {filtered.length === 0 ? (
        <div style={{ background:'#FFFFFF', border:'1px dashed #CBD5E1', borderRadius:'16px', padding:'40px 20px', textAlign:'center' }}>
          <div style={{ fontSize:'28px', marginBottom:'8px' }}>📭</div>
          <div style={{ fontSize:'14px', fontWeight:'600', color:'#475569', marginBottom:'4px' }}>No trades in this period</div>
          <div style={{ fontSize:'12px', color:'#94A3B8' }}>Try a different month, week, or range.</div>
        </div>
      ) : (
        filtered.map(t => <HistoryTradeCard key={t.id} t={t} onOpenDay={onOpenJournal ? (d => onOpenJournal(d, false)) : null} />)
      )}
    </div>
  )
}
