import React, { useState, useEffect, useCallback, useRef } from 'react'
import { computeStats, f2 } from '../lib/stats'
import { useEconomicCalendar, currencyFlag, formatFFTime } from '../lib/useEconomicCalendar'

// ── CONSTANTS ────────────────────────────────────────────────────
const TIMES   = ['02:00','02:30','03:00','03:30','04:00','04:30','05:00','05:30','06:00','06:30','07:00','07:30','08:00','08:30','09:00','09:30','10:00']
const SYMBOLS = ['AUD/USD','EUR/USD','GBP/USD','NZD/USD','USD/CAD','USD/CHF','USD/JPY','NQ','ES','Gold','Silver']
const LEVELS  = ['Prev Month High','Prev Month Low','Prev Week High','Prev Week Low','Prev Day High','Prev Day Low','4H Fair Value Gap','4H Order Block','4H Breaker Block','4H Mitigation Block','Daily Fair Value Gap','Daily Order Block','Daily Breaker Block','Daily Mitigation Block']
const MISTAKES= ['No mistake','Wrong bias','Level not aligned with bias','Entered outside killzone','No breaker block formed','Entered before breaker closed','Premature entry — no confirmation','Moved stop too early','Took partial too early','Revenge trade','Overtraded']

const EMPTY_TRADE = { time:'', symbol:'', direction:'', bias:'', session:'', level:'', pd_array:'', entry_tf:'', r:'', mae:'', mfe:'', outcome:'', mistake:'No mistake', screenshot:'', screenshot2:'', journal:'' }
const TRADE_DRAFT = 'tt26_trade_draft'
const FORM_OPEN   = 'tt26_form_open'


// Get Mon-Sun range for a given date
function getWeekRange(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  const dow = d.getDay()
  // Trading week: Mon-Sat. If on Saturday, Mon = d-5
  const mon = new Date(d)
  if (dow === 6) mon.setDate(d.getDate() - 5)       // Saturday → go back to Monday
  else if (dow === 0) mon.setDate(d.getDate() - 6)  // Sunday → go back to Monday
  else mon.setDate(d.getDate() - (dow - 1))          // Mon-Fri → go back to Monday
  const sat = new Date(mon); sat.setDate(mon.getDate() + 5)
  const fmt = dt => dt.toISOString().split('T')[0]
  return { mon: fmt(mon), sun: fmt(sat) }  // sun field = Sat for trading week
}

// ── HELPERS ──────────────────────────────────────────────────────
function toDateStr(d) { return d.toISOString().split('T')[0] }
function fmtDisplayDate(ds) {
  const d = new Date(ds + 'T12:00:00')
  return d.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
}

// ── IMAGE COMPONENT ──────────────────────────────────────────────
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
            style={{ width:'100%', borderRadius:'var(--r-sm)', border:'1px solid var(--border)', display:'block', cursor:'zoom-in', objectFit:'contain', minHeight: large ? '200px' : '120px', maxHeight: large ? '500px' : '300px', background:'var(--surface2)' }} />
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

// ── NEWS STRIP ───────────────────────────────────────────────────
function DayNews({ dateStr, onEventsLoaded, savedEvents }) {
  const { eventsForDate, loading } = useEconomicCalendar()
  // Use live events if available, otherwise fall back to saved snapshot
  const liveEvents = eventsForDate(dateStr)
  const events = liveEvents.length > 0 ? liveEvents : (savedEvents || [])

  // Snapshot events when first loaded so they get saved with the note
  const notified = React.useRef(false)
  React.useEffect(() => {
    if (!loading && liveEvents.length > 0 && !notified.current) {
      notified.current = true
      onEventsLoaded && onEventsLoaded(liveEvents)
    }
  }, [loading, liveEvents.length])

  if (events.length === 0) return null
  const CCY = { USD:'#1D4ED8', GBP:'#6D28D9', EUR:'#065F46' }
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--shadow)', marginBottom:'14px' }}>
      <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)', background:'var(--red-bg)', display:'flex', alignItems:'center', gap:'8px' }}>
        <span style={{ fontSize:'12px' }}>🔴</span>
        <span style={{ fontSize:'11px', fontWeight:'600', color:'var(--red)', letterSpacing:'.04em', textTransform:'uppercase' }}>High Impact News</span>
        <span style={{ fontSize:'11px', color:'var(--muted)', marginLeft:'auto' }}>{events.length} event{events.length > 1 ? 's' : ''}</span>
      </div>
      <div style={{ display:'flex', flexDirection:'column' }}>
        {events.map((e, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 16px', borderBottom: i < events.length-1 ? '1px solid var(--border)' : 'none' }}>
            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:'var(--muted)', minWidth:'48px' }}>{e.isHoliday ? "All Day" : (formatFFTime(e.time) !== "All Day" ? formatFFTime(e.time) : e.time || "All Day")}</span>
            <span style={{ fontSize:'11px', fontWeight:'700', color: CCY[e.country] || 'var(--muted)', background: e.country==='USD'?'#DBEAFE':e.country==='GBP'?'#EDE9FE':'#D1FAE5', padding:'2px 7px', borderRadius:'4px' }}>{e.country}</span>
            <span style={{ fontSize:'12px', color:'var(--text)', flex:1 }}>{e.title}</span>
            {e.forecast && <span style={{ fontSize:'11px', color:'var(--muted)', fontFamily:"'JetBrains Mono',monospace" }}>F: {e.forecast}</span>}
            {e.actual && <span style={{ fontSize:'11px', color:'var(--green)', fontFamily:"'JetBrains Mono',monospace", fontWeight:'600' }}>A: {e.actual}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── TRADE FORM ───────────────────────────────────────────────────
function TradeForm({ onSave, onCancel }) {
  const [form, setForm] = useState(() => {
    try { const s = localStorage.getItem(TRADE_DRAFT); return s ? { ...EMPTY_TRADE, ...JSON.parse(s) } : EMPTY_TRADE } catch(e) { return EMPTY_TRADE }
  })
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)

  const set  = k => e => { const u = { ...form, [k]: e.target.value }; setForm(u); try { localStorage.setItem(TRADE_DRAFT, JSON.stringify(u)) } catch(e) {} }
  const setV = (k, v) => { const u = { ...form, [k]: v }; setForm(u); try { localStorage.setItem(TRADE_DRAFT, JSON.stringify(u)) } catch(e) {} }

  function clear() { try { localStorage.removeItem(TRADE_DRAFT); sessionStorage.setItem(FORM_OPEN,'false') } catch(e) {} }

  async function submit(e) {
    e.preventDefault()
    if (!form.outcome) { setErr('Please select an outcome (Win/Loss/Break Even)'); return }
    if (form.r === '' || form.r === null || form.r === undefined || isNaN(parseFloat(form.r))) { setErr('R multiple is required (e.g. 2, -1, 1.5)'); return }
    setSaving(true)
    try {
      const rVal = parseFloat(form.r) || 0
      await onSave({ ...form, r_multiple: rVal, pl: rVal, risk: 1, mae: form.mae ? parseFloat(form.mae) : null, mfe: form.mfe ? parseFloat(form.mfe) : null })
      clear(); setForm(EMPTY_TRADE)
    } catch(ex) { console.error('Trade save error:', ex); setErr('Error saving: ' + (ex.message || 'Unknown error')) }
    setSaving(false)
  }

  const sel = (id, label, opts) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <select className="form-input" value={form[id]} onChange={set(id)}>
        <option value="">—</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
  const inp = (id, label, type='text', ph='') => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input className="form-input" type={type} value={form[id]} onChange={set(id)} placeholder={ph} />
    </div>
  )

  return (
    <form onSubmit={submit} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'18px', boxShadow:'var(--shadow)' }}>
      <div style={{ fontSize:'13px', fontWeight:'600', color:'var(--text)', marginBottom:'16px' }}>Log Trade</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:'11px', marginBottom:'12px' }}>
        {sel('time', 'Time (NY)', TIMES)}
        {sel('symbol', 'Symbol', SYMBOLS)}
        {sel('direction', 'Direction', ['Long','Short'])}
        {sel('bias', 'Bias', ['Bullish','Bearish'])}
        {sel('session', 'Session', ['London (02:00–05:00)','New York AM (06:00–10:00)'])}
        {sel('level', 'Key Level', LEVELS)}
        <div className="form-group">
          <label className="form-label">Premium / Discount</label>
          <div style={{ display:'flex', gap:'6px', paddingTop:'4px' }}>
            {['Premium','Discount'].map(v => (
              <label key={v} style={{ display:'flex', alignItems:'center', gap:'4px', cursor:'pointer', fontSize:'11px', fontWeight: form.pd_array===v ? '600':'400', color: form.pd_array===v ? (v==='Premium'?'var(--red)':'var(--green)'):'var(--muted)', background: form.pd_array===v ? (v==='Premium'?'var(--red-bg)':'var(--green-bg)'):'var(--surface2)', border:`1px solid ${form.pd_array===v ? (v==='Premium'?'var(--red-dim)':'var(--green-dim)'):'var(--border)'}`, padding:'5px 10px', borderRadius:'var(--r-xs)', transition:'all .12s' }}>
                <input type="radio" name="pd_array" value={v} checked={form.pd_array===v} onChange={() => setV('pd_array', v)} style={{ display:'none' }} />
                {v==='Premium'?'▲':'▼'} {v}
              </label>
            ))}
          </div>
        </div>
        {sel('entry_tf', 'Entry TF', ['5m','15m','30m'])}
        <div className="form-group">
          <label className="form-label">R Multiple</label>
          <input className="form-input" type="number" step="0.1" value={form.r} onChange={set('r')} placeholder="e.g. +2, -1, +1.5" />
          <div style={{ fontSize:'10px', color:'var(--muted)', marginTop:'3px' }}>Positive = win (+2R), Negative = loss (-1R)</div>
        </div>
        {sel('outcome', 'Outcome', ['Win','Loss','Break Even'])}
        {sel('mistake', 'Mistake', MISTAKES)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'11px', marginBottom:'11px' }}>
        <div className="form-group">
          <div style={{ display:'flex', gap:'6px', marginBottom:'6px', alignItems:'center' }}>
            <select className="form-input" style={{ flex:'0 0 auto', width:'90px', padding:'4px 8px', fontSize:'11px' }}
              value={form.screenshot_tf||''} onChange={e => setForm(f=>({...f, screenshot_tf:e.target.value}))}>
              <option value="">Timeframe</option>
              {['Daily','4H','1H','30M','15M','5M'].map(t=><option key={t}>{t}</option>)}
            </select>
            <span style={{ fontSize:'11px', color:'var(--muted)', fontWeight:'600' }}>Chart 1</span>
          </div>
          <input className="form-input" type="url" value={form.screenshot} onChange={set('screenshot')} placeholder="Paste TradingView snapshot URL..." />
        </div>
        <div className="form-group">
          <div style={{ display:'flex', gap:'6px', marginBottom:'6px', alignItems:'center' }}>
            <select className="form-input" style={{ flex:'0 0 auto', width:'90px', padding:'4px 8px', fontSize:'11px' }}
              value={form.screenshot2_tf||''} onChange={e => setForm(f=>({...f, screenshot2_tf:e.target.value}))}>
              <option value="">Timeframe</option>
              {['Daily','4H','1H','30M','15M','5M'].map(t=><option key={t}>{t}</option>)}
            </select>
            <span style={{ fontSize:'11px', color:'var(--muted)', fontWeight:'600' }}>Chart 2</span>
          </div>
          <input className="form-input" type="url" value={form.screenshot2||''} onChange={set('screenshot2')} placeholder="Paste TradingView snapshot URL..." />
        </div>
      </div>
      <div className="form-group" style={{ marginBottom:'14px' }}>
        <label className="form-label">Trade Notes</label>
        <textarea className="form-input" value={form.journal} onChange={set('journal')} placeholder="Why you took this trade, what happened, execution notes..." style={{ minHeight:'70px' }} />
      </div>
      {err && <div style={{ color:'var(--red)', fontSize:'12px', marginBottom:'10px' }}>{err}</div>}
      <div style={{ display:'flex', gap:'8px' }}>
        <button type="submit" className="btn btn-blue" disabled={saving}>{saving ? 'Saving...' : 'Save Trade'}</button>
        <button type="button" className="btn btn-outline" onClick={() => { clear(); onCancel() }}>Cancel</button>
      </div>
    </form>
  )
}

// ── TRADE CARD ───────────────────────────────────────────────────
function TradeCard({ t, onDelete }) {
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
        <span style={{ fontSize:'15px', fontWeight:'700', color:'#0F172A', letterSpacing:'-.01em' }}>{t.symbol || '—'}</span>
        {t.time && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#94A3B8', background:'#F1F5F9', padding:'2px 7px', borderRadius:'6px' }}>{t.time} NY</span>}
        {t.direction && (
          <span style={{ fontSize:'11px', fontWeight:'700', padding:'3px 9px', borderRadius:'7px', background: t.direction==='Long'?'#DCFCE7':'#FEE2E2', color: t.direction==='Long'?'#14532D':'#7F1D1D', border: `1px solid ${t.direction==='Long'?'#BBF7D0':'#FECACA'}` }}>{t.direction}</span>
        )}
        {t.outcome && (
          <span style={{ fontSize:'11px', fontWeight:'700', padding:'3px 9px', borderRadius:'7px', background:oc.bg, color:oc.col, border:`1px solid ${oc.border}` }}>{t.outcome}</span>
        )}
        <span style={{ marginLeft:'auto', fontFamily:"'JetBrains Mono',monospace", fontSize:'18px', fontWeight:'700', color: up ? '#10B981' : '#EF4444' }}>
          {rVal >= 0 ? '+' : ''}{rVal.toFixed ? rVal.toFixed(2) : rVal}R
        </span>
        {onDelete && (
          <button onClick={() => { if(window.confirm('Delete this trade?')) onDelete(t.id) }}
            style={{ background:'none', border:'none', cursor:'pointer', color:'#CBD5E1', fontSize:'14px', padding:'0', lineHeight:1, fontWeight:'700' }}>✕</button>
        )}
      </div>

      {/* Details grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', borderBottom:`1px solid #F1F5F9` }}>
        {[['Bias',t.bias],['Session',t.session?.replace(' (02:00–05:00)','')?.replace(' (06:00–10:00)','')],['Key Level',t.level||t.setup],['P/D',t.pd_array],['Entry TF',t.entry_tf||t.smt],['Risk',t.risk?`${t.risk}%`:null],['R Target',t.r_multiple?`${t.r_multiple}R`:null]].filter(([,v])=>v).map(([l,v],i)=>(
          <div key={i} style={{ padding:'10px 14px', borderRight:'1px solid #F1F5F9', borderBottom:'1px solid #F1F5F9' }}>
            <div style={{ fontSize:'9px', fontWeight:'600', color:'#94A3B8', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:'3px' }}>{l}</div>
            <div style={{ fontSize:'12px', fontWeight:'500', color:'#334155' }}>{v}</div>
          </div>
        ))}
      </div>

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

// ── AUTO-EXPANDING TEXTAREA ──────────────────────────────────────
function AutoTextarea({ value, onChange, placeholder, style, minHeight = 80 }) {
  const ref = useRef(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = Math.max(minHeight, ref.current.scrollHeight) + 'px'
    }
  }, [value, minHeight])

  function handleKeyDown(e) {
    // Auto bullet: press Enter after a line starting with • or - to continue bullets
    if (e.key === 'Enter') {
      const textarea = e.target
      const pos = textarea.selectionStart
      const text = textarea.value
      const lineStart = text.lastIndexOf('\n', pos - 1) + 1
      const currentLine = text.substring(lineStart, pos)
      const bulletMatch = currentLine.match(/^([•\-]\s)/)
      if (bulletMatch) {
        e.preventDefault()
        const bullet = bulletMatch[1]
        const newText = text.substring(0, pos) + '\n' + bullet + text.substring(pos)
        onChange({ target: { value: newText } })
        // Move cursor after bullet
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = pos + 1 + bullet.length
        }, 0)
      }
    }
    // Type • with Cmd+8 or Ctrl+8
    if ((e.metaKey || e.ctrlKey) && e.key === '8') {
      e.preventDefault()
      const textarea = e.target
      const pos = textarea.selectionStart
      const text = textarea.value
      const lineStart = text.lastIndexOf('\n', pos - 1) + 1
      const currentLine = text.substring(lineStart, pos)
      if (!currentLine.startsWith('• ')) {
        const newText = text.substring(0, lineStart) + '• ' + text.substring(lineStart)
        onChange({ target: { value: newText } })
        setTimeout(() => { textarea.selectionStart = textarea.selectionEnd = pos + 2 }, 0)
      }
    }
  }

  const baseStyle = {
    width: '100%',
    background: '#F8FAFC',
    border: '1.5px solid #E2E8F0',
    borderRadius: '12px',
    padding: '12px 14px',
    fontSize: '13px',
    color: '#0F172A',
    fontFamily: 'inherit',
    outline: 'none',
    resize: 'none',
    lineHeight: '1.7',
    transition: 'border-color .15s',
    boxSizing: 'border-box',
    overflow: 'hidden',
    minHeight: minHeight + 'px',
    ...style,
  }

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      style={baseStyle}
      onFocus={e => e.target.style.borderColor = '#6366F1'}
      onBlur={e => e.target.style.borderColor = '#E2E8F0'}
    />
  )
}


// ── WEEKLY ECON SNAPSHOT ─────────────────────────────────────────
// Shows Mon-Fri high-impact events for the week being reviewed
function WeeklyEconNews({ weekRange, useNextWeek, onEventsLoaded, savedEvents }) {
  const { eventsForDate, loading } = useEconomicCalendar()

  const weekdays = React.useMemo(() => {
    if (!weekRange) return []
    const days = []
    // For forecast (Sunday), use NEXT week's Mon-Fri
    const start = new Date(weekRange.mon + 'T12:00:00')
    if (useNextWeek) start.setDate(start.getDate() + 7)
    for (let i = 0; i < 5; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i)
      const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0')
      days.push(`${y}-${m}-${dd}`)
    }
    return days
  }, [weekRange?.mon, useNextWeek])

  const liveEvents = weekdays.flatMap(ds => eventsForDate(ds))
  const events = liveEvents.length > 0 ? liveEvents : (savedEvents || [])

  const notified = React.useRef(false)
  React.useEffect(() => {
    if (!loading && liveEvents.length > 0 && !notified.current) {
      notified.current = true
      onEventsLoaded && onEventsLoaded(liveEvents)
    }
  }, [loading, liveEvents.length])

  if (events.length === 0) return null

  const CCY_COL = { USD:'#1D4ED8', GBP:'#6D28D9', EUR:'#065F46' }
  const CCY_BG  = { USD:'#DBEAFE', GBP:'#EDE9FE', EUR:'#D1FAE5' }

  // Group by date
  const grouped = {}
  events.forEach(e => { if (!grouped[e.date]) grouped[e.date] = []; grouped[e.date].push(e) })

  return (
    <div style={{ background:'#FFFFFF', borderRadius:'20px', boxShadow:'0 1px 3px rgba(0,0,0,.06),0 8px 24px rgba(0,0,0,.05)', marginBottom:'16px', overflow:'hidden', order:0 }}>
      <div style={{ padding:'14px 20px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', gap:'10px' }}>
        <div style={{ width:'3px', height:'16px', borderRadius:'2px', background:'#EF4444', flexShrink:0 }} />
        <span style={{ fontSize:'13px', fontWeight:'700', color:'#0F172A' }}>Week's High-Impact Events</span>
        <span style={{ marginLeft:'auto', fontSize:'11px', color:'#94A3B8' }}>Mon–Fri · USD · GBP · EUR</span>
      </div>
      <div style={{ padding:'0' }}>
        {Object.keys(grouped).sort().map(dateStr => {
          const d = new Date(dateStr + 'T12:00:00')
          const dayLabel = d.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })
          return (
            <div key={dateStr} style={{ borderBottom:'1px solid #F8FAFC' }}>
              <div style={{ padding:'8px 20px 4px', fontSize:'10px', fontWeight:'700', color:'#94A3B8', letterSpacing:'.06em', textTransform:'uppercase' }}>{dayLabel}</div>
              {grouped[dateStr].map((e, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'6px 20px', borderTop: i>0?'1px solid #F8FAFC':'none' }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#64748B', minWidth:'40px' }}>{e.time||'—'}</span>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:'3px', padding:'1px 6px', borderRadius:'4px', background:CCY_BG[e.country]||'#F1F5F9', fontSize:'10px', fontWeight:'700', color:CCY_COL[e.country]||'#64748B', flexShrink:0 }}>
                    {e.country}
                  </span>
                  <div style={{ width:'8px', height:'8px', borderRadius:'2px', background:'#EF4444', flexShrink:0 }} />
                  <span style={{ fontSize:'12px', fontWeight:'600', color:'#334155', flex:1 }}>{e.title}</span>
                  {e.actual && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', fontWeight:'700', color:'#10B981' }}>{e.actual}</span>}
                  {e.forecast && !e.actual && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#64748B' }}>{e.forecast}</span>}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── MAIN COMPONENT ───────────────────────────────────────────────
export default function DailyJournal({ trades, dailyNotes, onSaveNote, onDeleteNote, onAddTrade, onDeleteTrade, toast, dateStr: propDateStr, isWeekly: propIsWeekly }) {
  const today = toDateStr(new Date())
  const [dateStr, setDateStr] = useState(propDateStr || today)
  const isWeekly   = propIsWeekly === true
  const isForecast  = propIsWeekly === 'forecast'
  const [showTradeForm, setShowTradeForm] = useState(() => {
    try { return sessionStorage.getItem(FORM_OPEN) === 'true' } catch { return false }
  })
  const [saving, setSaving] = useState(false)

  // When propDateStr changes (from calendar click), update local date
  useEffect(() => { if (propDateStr) setDateStr(propDateStr) }, [propDateStr])

  const isToday = dateStr === today
  const displayDate = fmtDisplayDate(dateStr)
  const dayTrades = trades.filter(t => t.date === dateStr)

  // Week trades (Mon-Sun of the Sunday selected)
  const weekRange = (isWeekly || isForecast) ? getWeekRange(dateStr) : null
  const weekTrades = isWeekly && weekRange
    ? trades.filter(t => t.date >= weekRange.mon && t.date <= weekRange.sun).sort((a,b) => a.date.localeCompare(b.date))
    : []
  const weekR = weekTrades.reduce((s,t) => s+(t.pl||t.r_multiple||0), 0)
  const weekWins = weekTrades.filter(t => t.outcome==='Win').length
  const weekLosses = weekTrades.filter(t => t.outcome==='Loss').length
  const dayStats  = computeStats(dayTrades)
  const existingNote = dailyNotes?.find(n => n.date === dateStr) || null

  // Local note state — initialised from DB
  const [mood,       setMood]       = useState('')
  const [bias,       setBias]       = useState('')
  const [plan,       setPlan]       = useState('')
  const [chart1,     setChart1]     = useState('')
  const [chart2,     setChart2]     = useState('')
  const [chart3,     setChart3]     = useState('')
  const [chart4,     setChart4]     = useState('')
  const [chartNote1, setChartNote1] = useState('')
  const [chartNote2, setChartNote2] = useState('')
  const [chartNote3, setChartNote3] = useState('')
  const [chartNote4, setChartNote4] = useState('')
  const [chartTf1,   setChartTf1]   = useState('')
  const [chartTf2,   setChartTf2]   = useState('')
  const [chartTf3,   setChartTf3]   = useState('')
  const [chartTf4,   setChartTf4]   = useState('')
  const [noteOpen1,  setNoteOpen1]  = useState(false)
  const [noteOpen2,  setNoteOpen2]  = useState(false)
  const [noteOpen3,  setNoteOpen3]  = useState(false)
  const [noteOpen4,  setNoteOpen4]  = useState(false)
  const [econSnapshot, setEconSnapshot] = useState([])
  const [eodReview,  setEodReview]  = useState('')
  const [followedPlan, setFollowedPlan] = useState('')
  const [wentWell,   setWentWell]   = useState('')
  const [improve,    setImprove]    = useState('')
  const [noteDirty,  setNoteDirty]  = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)

  // Auto-save: 2 seconds after last change
  useEffect(() => {
    if (!noteDirty) return
    const timer = setTimeout(async () => {
      setAutoSaving(true)
      try { await saveNote() } catch(e) {}
      setAutoSaving(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [noteDirty, mood, bias, plan, chart1, chart2, chart3, chart4,
      chartNote1, chartNote2, chartNote3, chartNote4,
      chartTf1, chartTf2, chartTf3, chartTf4,
      eodReview, followedPlan, wentWell, improve])

  // Load note data when date changes
  useEffect(() => {
    if (existingNote) {
      setMood(existingNote.mood || '')
      setBias(existingNote.htf_bias || '')
      setPlan(existingNote.market_conditions || '')
      setChart1(existingNote.observations || '')
      setChart2(existingNote.execution_review || '')
      setChart3(existingNote.week_summary || '')
      setChart4(existingNote.top_mistake || '')
      try { const notes = JSON.parse(existingNote.improvements||'[]'); setChartNote1(notes[0]||''); setChartNote2(notes[1]||''); setChartNote3(notes[2]||''); setChartNote4(notes[3]||'') } catch(e) {}
      try { const tfs = JSON.parse(existingNote.trading_errors||'[]'); setChartTf1(tfs[0]||''); setChartTf2(tfs[1]||''); setChartTf3(tfs[2]||''); setChartTf4(tfs[3]||'') } catch(e) {}
      try { setEconSnapshot(JSON.parse(existingNote.econ_snapshot||'[]')) } catch(e) {}
      setEodReview(existingNote.trading_errors || '')
      setFollowedPlan(existingNote.consistency || '')
      setWentWell(existingNote.what_worked || '')
      setImprove(existingNote.improvements || '')
    } else {
      setMood(''); setBias(''); setPlan(''); setChart1(''); setChart2('')
      setEodReview(''); setFollowedPlan(''); setWentWell(''); setImprove('')
      setChart3(''); setChart4('')
      setChartNote1(''); setChartNote2(''); setChartNote3(''); setChartNote4('')
      setChartTf1(''); setChartTf2(''); setChartTf3(''); setChartTf4('')
      setNoteOpen1(false); setNoteOpen2(false); setNoteOpen3(false); setNoteOpen4(false)
    }
    setNoteDirty(false)
  }, [dateStr, existingNote?.id])

  function markDirty() { setNoteDirty(true) }

  async function saveNote() {
    setSaving(true)
    try {
      await onSaveNote({
        id:               existingNote?.id,
        date:             dateStr,
        note_type:        isWeekly ? 'week' : isForecast ? 'forecast' : 'day',
        note:             plan,
        mood,
        htf_bias:         bias,
        market_conditions: plan,
        observations:     chart1,
        execution_review: chart2,
        week_summary:     chart3,
        top_mistake:      chart4,
        improvements:     improve,
        what_worked:      wentWell,
        consistency:      followedPlan,
        trading_errors:   eodReview,
        market_conditions: JSON.stringify([chartNote1,chartNote2,chartNote3,chartNote4]),
        htf_bias:         JSON.stringify([chartTf1,chartTf2,chartTf3,chartTf4]),
        econ_snapshot:    JSON.stringify(econSnapshot),
      })
      setNoteDirty(false)
      toast('Day saved ✓')
    } catch(e) { toast('Error saving: ' + e.message) }
    setSaving(false)
  }

  async function handleAddTrade(tradeData) {
    try {
      await onAddTrade({ ...tradeData, date: dateStr })
      setShowTradeForm(false)
      try { sessionStorage.setItem(FORM_OPEN,'false') } catch(e) {}
      toast('Trade logged ✓')
    } catch(err) {
      toast('Error saving trade: ' + err.message)
    }
  }

  function openTradeForm() {
    setShowTradeForm(true)
    try { sessionStorage.setItem(FORM_OPEN,'true') } catch(e) {}
  }

  // Day P/L summary
  const dayPL  = dayTrades.reduce((s, t) => s + (t.pl||t.r_multiple||0), 0)
  const dayUp  = dayPL >= 0
  const wins   = dayTrades.filter(t => t.outcome === 'Win').length
  const losses = dayTrades.filter(t => t.outcome === 'Loss').length

  return (
    <div style={{ padding:'24px', maxWidth:'860px', margin:'0 auto', display:'flex', flexDirection:'column' }}>

      {/* ── HEADER ── */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'24px', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <div style={{ fontSize:'11px', fontWeight:'600', color:'#94A3B8', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:'6px' }}>
            {isWeekly ? 'Weekly Review' : isForecast ? 'Weekly Forecast' : isToday ? 'Today' : 'Daily Journal'}
          </div>
          <h1 style={{ fontSize:'26px', fontWeight:'700', color:'#0F172A', letterSpacing:'-.03em', lineHeight:1.1 }}>
            {isWeekly
              ? weekRange ? `${new Date(weekRange.mon+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'})} – ${new Date(weekRange.sun+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}` : 'Weekly Review'
              : isToday ? new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})
              : new Date(dateStr+'T12:00:00').toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})
            }
          </h1>
        </div>
        <button onClick={saveNote} disabled={saving}
          style={{ background: saving ? '#E2E8F0' : '#0F172A', color: saving ? '#94A3B8' : '#FFFFFF', border:'none', borderRadius:'12px', padding:'10px 20px', fontSize:'13px', fontWeight:'600', cursor: saving ? 'default' : 'pointer', fontFamily:'inherit', letterSpacing:'-.01em', transition:'all .15s', boxShadow: saving ? 'none' : '0 4px 14px rgba(15,23,42,.25)' }}>
          {saving ? 'Saving...' : autoSaving ? 'Auto-saving...' : isWeekly ? 'Save Review' : isForecast ? 'Save Forecast' : 'Save Day'}
        </button>
      </div>

      {/* ── WEEKLY STATS ── */}
      {isWeekly && weekTrades.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginBottom:'20px' }}>
          {[
            { label:'Week R',  v: f2(weekR),             col: weekR>=0?'#10B981':'#EF4444', bg: weekR>=0?'#ECFDF5':'#FEF2F2' },
            { label:'Trades',  v: weekTrades.length,      col:'#0F172A',                   bg:'#F8FAFC' },
            { label:'Wins',    v: weekWins,               col:'#10B981',                   bg:'#ECFDF5' },
            { label:'Losses',  v: weekLosses,             col: weekLosses>0?'#EF4444':'#0F172A', bg: weekLosses>0?'#FEF2F2':'#F8FAFC' },
          ].map((s,i) => (
            <div key={i} style={{ background:s.bg, borderRadius:'16px', padding:'16px 18px', border:`1px solid ${s.col}22` }}>
              <div style={{ fontSize:'10px', fontWeight:'600', color:'#94A3B8', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:'6px' }}>{s.label}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'22px', fontWeight:'700', color:s.col, lineHeight:1 }}>{s.v}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── DAY STATS ── */}
      {!isWeekly && dayTrades.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginBottom:'20px' }}>
          {[
            { label:'Day R',   v: f2(dayPL),             col: dayUp?'#10B981':'#EF4444',  bg: dayUp?'#ECFDF5':'#FEF2F2' },
            { label:'Trades',  v: dayTrades.length,       col:'#0F172A',                   bg:'#F8FAFC' },
            { label:'Wins',    v: wins,                   col:'#10B981',                   bg:'#ECFDF5' },
            { label:'Losses',  v: losses,                 col: losses>0?'#EF4444':'#0F172A', bg: losses>0?'#FEF2F2':'#F8FAFC' },
          ].map((s,i) => (
            <div key={i} style={{ background:s.bg, borderRadius:'16px', padding:'16px 18px', border:`1px solid ${s.col}22` }}>
              <div style={{ fontSize:'10px', fontWeight:'600', color:'#94A3B8', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:'6px' }}>{s.label}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'22px', fontWeight:'700', color:s.col, lineHeight:1 }}>{s.v}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── TODAY'S NEWS ── */}
      <DayNews dateStr={dateStr} />

      {/* ── DAY PLAN CARD ── */}
      {/* Only show for daily and forecast modes */}
      {(isForecast || !isWeekly) && (
      <div style={{ order: isForecast ? 1 : 1, background:'#FFFFFF', borderRadius:'20px', boxShadow:'0 1px 3px rgba(0,0,0,.06),0 8px 24px rgba(0,0,0,.05)', marginBottom:'16px', overflow:'hidden' }}>
        <div style={{ padding:'18px 24px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'32px', height:'32px', borderRadius:'10px', background: isForecast ? '#F3E8FF' : '#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>📋</div>
            <span style={{ fontSize:'14px', fontWeight:'600', color:'#0F172A' }}>{isForecast ? 'Weekly Forecast' : 'Day Plan'}</span>
          </div>
          {noteDirty && <span style={{ fontSize:'11px', color:'#94A3B8', fontStyle:'italic' }}>Unsaved changes</span>}
        </div>
        <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:'18px' }}>

          {/* DAILY: Feeling + Bias + Plan */}
          {!isWeekly && !isForecast && (<>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#64748B', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'8px' }}>Feeling</label>
                <AutoTextarea value={mood} onChange={e => { setMood(e.target.value); markDirty() }} placeholder="How are you feeling going into today's session?" minHeight={70} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#64748B', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'8px' }}>Bias Today</label>
                <input value={bias} onChange={e => { setBias(e.target.value); markDirty() }}
                  placeholder="e.g. Bearish NQ, Bullish GBP/USD..."
                  style={{ width:'100%', background:'#F8FAFC', border:'1.5px solid #E2E8F0', borderRadius:'12px', padding:'12px 14px', fontSize:'13px', color:'#0F172A', fontFamily:'inherit', outline:'none', transition:'border-color .15s', boxSizing:'border-box' }}
                  onFocus={e => e.target.style.borderColor='#6366F1'} onBlur={e => e.target.style.borderColor='#E2E8F0'} />
              </div>
            </div>
            <div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#64748B', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'8px' }}>Trading Plan</label>
              <AutoTextarea value={plan} onChange={e => { setPlan(e.target.value); markDirty() }} placeholder="What are you watching? Key levels, bias read, what needs to happen for you to take a trade..." minHeight={110} />
            </div>
          </>)}

          {/* FORECAST: Plan for the week */}
          {isForecast && (
            <div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#64748B', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'8px' }}>Plan for the Week</label>
              <AutoTextarea value={plan} onChange={e => { setPlan(e.target.value); markDirty() }} placeholder="Macro backdrop, key themes, currencies to focus on, what you need to see to trade..." minHeight={120} />
            </div>
          )}

          {/* CHARTS: both daily and forecast */}
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
              <label style={{ fontSize:'11px', fontWeight:'600', color:'#64748B', letterSpacing:'.06em', textTransform:'uppercase' }}>
                {isForecast ? 'Charts to Watch' : 'Chart Images'}
              </label>
              {[chart1,chart2,chart3,chart4].filter(v=>v&&v.trim()).length < 4 && (
                <button type="button" onClick={() => {
                  if (!chart1) { setChart1(' '); markDirty() }
                  else if (!chart2) { setChart2(' '); markDirty() }
                  else if (!chart3) { setChart3(' '); markDirty() }
                  else { setChart4(' '); markDirty() }
                }}
                  style={{ background:'#F8FAFC', border:'1.5px solid #E2E8F0', borderRadius:'8px', padding:'6px 12px', fontSize:'12px', fontWeight:'600', color:'#475569', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:'5px' }}>
                  <span style={{ fontSize:'14px', lineHeight:1 }}>+</span> Add Chart
                </button>
              )}
            </div>
            {[[chart1,setChart1,chartNote1,setChartNote1,chartTf1,setChartTf1,noteOpen1,setNoteOpen1],[chart2,setChart2,chartNote2,setChartNote2,chartTf2,setChartTf2,noteOpen2,setNoteOpen2],[chart3,setChart3,chartNote3,setChartNote3,chartTf3,setChartTf3,noteOpen3,setNoteOpen3],[chart4,setChart4,chartNote4,setChartNote4,chartTf4,setChartTf4,noteOpen4,setNoteOpen4]].map(([val,setter,note,setNote,tf,setTf,noteOpen,setNoteOpen],i) => val ? (
              <div key={i} style={{ marginBottom:'16px', background:'#F8FAFC', borderRadius:'12px', padding:'12px 14px', border:'1px solid #E2E8F0' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
                  <select value={tf} onChange={e => { setTf(e.target.value); markDirty() }}
                    style={{ background:'#FFFFFF', border:'1.5px solid #E2E8F0', borderRadius:'8px', padding:'5px 10px', fontSize:'12px', fontWeight:'600', color: tf ? '#0F172A' : '#94A3B8', fontFamily:'inherit', outline:'none', cursor:'pointer', flex:1, maxWidth:'120px' }}>
                    <option value="">Timeframe</option>
                    {['Daily','4H','1H','30M','15M','5M'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span style={{ fontSize:'10px', color:'#94A3B8', flex:1 }}>Chart {i+1}</span>
                  <button type="button" onClick={() => { setter(''); setNote(''); setTf(''); setNoteOpen(false); markDirty() }}
                    style={{ background:'none', border:'none', color:'#CBD5E1', cursor:'pointer', fontSize:'14px', padding:'0' }}>✕</button>
                </div>
                <input type="url" value={val.trim()} onChange={e => { setter(e.target.value); markDirty() }}
                  placeholder="Paste TradingView snapshot URL..."
                  style={{ width:'100%', background:'#FFFFFF', border:'1.5px solid #E2E8F0', borderRadius:'8px', padding:'9px 12px', fontSize:'12px', color:'#0F172A', fontFamily:"'JetBrains Mono',monospace", outline:'none', boxSizing:'border-box', marginBottom:'8px', transition:'border-color .15s' }}
                  onFocus={e => e.target.style.borderColor='#6366F1'} onBlur={e => e.target.style.borderColor='#E2E8F0'} />
                {!noteOpen && (
                  <button type="button" onClick={() => setNoteOpen(true)}
                    style={{ background:'none', border:'1px dashed #CBD5E1', borderRadius:'8px', padding:'6px 12px', fontSize:'11px', color:'#94A3B8', cursor:'pointer', fontFamily:'inherit', marginBottom: val.trim() ? '10px' : '0', display:'inline-flex', alignItems:'center', gap:'5px' }}>
                    <span>+</span> Add note
                  </button>
                )}
                {noteOpen && (
                  <div style={{ marginBottom: val.trim() ? '10px' : '0', position:'relative' }}>
                    <AutoTextarea value={note} onChange={e => { setNote(e.target.value); markDirty() }}
                      placeholder={isForecast ? "What are you watching on this chart — key levels, setup, bias..." : "Chart analysis notes..."}
                      minHeight={60} />
                    {!note && <button type="button" onClick={() => setNoteOpen(false)}
                      style={{ position:'absolute', top:'6px', right:'8px', background:'none', border:'none', color:'#CBD5E1', cursor:'pointer', fontSize:'12px', padding:'0' }}>✕</button>}
                  </div>
                )}
                {val.trim() && <ChartImage url={val.trim()} label={tf || `Chart ${i+1}`} large />}
              </div>
            ) : null)}
          </div>

          {/* Save button for forecast */}
          {isForecast && (
            <button onClick={saveNote} disabled={saving}
              style={{ alignSelf:'flex-start', background: saving ? '#E2E8F0' : '#0F172A', color: saving ? '#94A3B8' : '#FFFFFF', border:'none', borderRadius:'12px', padding:'11px 24px', fontSize:'13px', fontWeight:'600', cursor: saving ? 'default' : 'pointer', fontFamily:'inherit', letterSpacing:'-.01em', boxShadow: saving ? 'none' : '0 4px 14px rgba(15,23,42,.25)', transition:'all .15s' }}>
              {saving ? 'Saving...' : autoSaving ? 'Auto-saving...' : 'Save Forecast'}
            </button>
          )}

        </div>
      </div>
      )}

      {/* ── TRADES ── */}
      <div style={{ order: isWeekly ? 2 : 3, marginBottom:'16px' }}>
        {!isWeekly && !isForecast && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
            <span style={{ fontSize:'13px', fontWeight:'700', color:'#0F172A' }}>Trades</span>
            <button onClick={openTradeForm}
              style={{ background:'#6366F1', color:'#fff', border:'none', borderRadius:'10px', padding:'8px 16px', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:'6px' }}>
              <span style={{ fontSize:'15px', lineHeight:1 }}>+</span> Log Trade
            </button>
          </div>
        )}
        {isWeekly && weekTrades.length > 0 && (
          <div>
            <div style={{ fontSize:'13px', fontWeight:'700', color:'#0F172A', marginBottom:'12px' }}>Week's Trades</div>
            {weekTrades.map(t => <TradeCard key={t.id} t={t} onDelete={onDeleteTrade} />)}
          </div>
        )}
        {!isWeekly && !isForecast && (
          <>
            {showTradeForm && (
              <TradeForm onSave={handleAddTrade} onCancel={() => { setShowTradeForm(false); try { sessionStorage.setItem(FORM_OPEN,'false') } catch(e) {} }} />
            )}
            {dayTrades.map(t => <TradeCard key={t.id} t={t} onDelete={onDeleteTrade} />)}
          </>
        )}
      </div>

      {/* ── WEEKLY REVIEW CARD (Saturday only) ── */}
      {isWeekly && (
        <div style={{ order:1, background:'#FFFFFF', borderRadius:'20px', boxShadow:'0 1px 3px rgba(0,0,0,.06),0 8px 24px rgba(0,0,0,.05)', marginBottom:'16px', overflow:'hidden' }}>
          <div style={{ padding:'18px 24px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'32px', height:'32px', borderRadius:'10px', background:'#ECFDF5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>📊</div>
            <span style={{ fontSize:'14px', fontWeight:'600', color:'#0F172A' }}>End of Week Review</span>
          </div>
          <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:'18px' }}>
            {/* Followed rules toggle */}
            <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px', background:'#F8FAFC', borderRadius:'12px', border:'1px solid #E2E8F0' }}>
              <span style={{ fontSize:'13px', fontWeight:'600', color:'#334155', flex:1 }}>Did you follow your rules this week?</span>
              {['Yes','Mostly','No'].map(v => (
                <button key={v} onClick={() => { setFollowedPlan(v); markDirty() }}
                  style={{ padding:'5px 14px', borderRadius:'8px', border:`1.5px solid ${followedPlan===v?'#6366F1':'#E2E8F0'}`, background: followedPlan===v?'#6366F1':'transparent', color: followedPlan===v?'#fff':'#64748B', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit', transition:'all .15s' }}>
                  {v}
                </button>
              ))}
            </div>
            {/* How did week go */}
            <div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#64748B', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'8px' }}>How did the week go?</label>
              <AutoTextarea value={eodReview} onChange={e => { setEodReview(e.target.value); markDirty() }}
                placeholder="Overall feel of the week — market conditions, your execution, what stood out..."
                minHeight={90} />
            </div>
            {/* What went well / improve */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#10B981', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'8px' }}>What went well</label>
                <AutoTextarea value={wentWell} onChange={e => { setWentWell(e.target.value); markDirty() }}
                  placeholder="Best decisions, good habits, what worked..."
                  minHeight={80} style={{ background:'#F0FDF4', border:'1.5px solid #BBF7D0', borderRadius:'12px' }} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#EF4444', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'8px' }}>What to improve</label>
                <AutoTextarea value={improve} onChange={e => { setImprove(e.target.value); markDirty() }}
                  placeholder="One key focus for next week..."
                  minHeight={80} style={{ background:'#FEF2F2', border:'1.5px solid #FECACA', borderRadius:'12px' }} />
              </div>
            </div>
            {/* Charts for review */}
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                <label style={{ fontSize:'11px', fontWeight:'600', color:'#64748B', letterSpacing:'.06em', textTransform:'uppercase' }}>Charts</label>
                {[chart1,chart2,chart3,chart4].filter(v=>v&&v.trim()).length < 4 && (
                  <button type="button" onClick={() => {
                    if (!chart1) { setChart1(' '); markDirty() }
                    else if (!chart2) { setChart2(' '); markDirty() }
                    else if (!chart3) { setChart3(' '); markDirty() }
                    else { setChart4(' '); markDirty() }
                  }}
                    style={{ background:'#F8FAFC', border:'1.5px solid #E2E8F0', borderRadius:'8px', padding:'6px 12px', fontSize:'12px', fontWeight:'600', color:'#475569', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:'5px' }}>
                    <span style={{ fontSize:'14px', lineHeight:1 }}>+</span> Add Chart
                  </button>
                )}
              </div>
              {[[chart1,setChart1,chartNote1,setChartNote1,chartTf1,setChartTf1,noteOpen1,setNoteOpen1],[chart2,setChart2,chartNote2,setChartNote2,chartTf2,setChartTf2,noteOpen2,setNoteOpen2],[chart3,setChart3,chartNote3,setChartNote3,chartTf3,setChartTf3,noteOpen3,setNoteOpen3],[chart4,setChart4,chartNote4,setChartNote4,chartTf4,setChartTf4,noteOpen4,setNoteOpen4]].map(([val,setter,note,setNote,tf,setTf,noteOpen,setNoteOpen],i) => val ? (
                <div key={i} style={{ marginBottom:'16px', background:'#F8FAFC', borderRadius:'12px', padding:'12px 14px', border:'1px solid #E2E8F0' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
                    <select value={tf} onChange={e => { setTf(e.target.value); markDirty() }}
                      style={{ background:'#FFFFFF', border:'1.5px solid #E2E8F0', borderRadius:'8px', padding:'5px 10px', fontSize:'12px', fontWeight:'600', color: tf ? '#0F172A' : '#94A3B8', fontFamily:'inherit', outline:'none', cursor:'pointer', flex:1, maxWidth:'120px' }}>
                      <option value="">Timeframe</option>
                      {['Daily','4H','1H','30M','15M','5M'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <span style={{ fontSize:'10px', color:'#94A3B8', flex:1 }}>Chart {i+1}</span>
                    <button type="button" onClick={() => { setter(''); setNote(''); setTf(''); setNoteOpen(false); markDirty() }}
                      style={{ background:'none', border:'none', color:'#CBD5E1', cursor:'pointer', fontSize:'14px', padding:'0' }}>✕</button>
                  </div>
                  <input type="url" value={val.trim()} onChange={e => { setter(e.target.value); markDirty() }}
                    placeholder="Paste TradingView snapshot URL..."
                    style={{ width:'100%', background:'#FFFFFF', border:'1.5px solid #E2E8F0', borderRadius:'8px', padding:'9px 12px', fontSize:'12px', color:'#0F172A', fontFamily:"'JetBrains Mono',monospace", outline:'none', boxSizing:'border-box', marginBottom:'8px', transition:'border-color .15s' }}
                    onFocus={e => e.target.style.borderColor='#6366F1'} onBlur={e => e.target.style.borderColor='#E2E8F0'} />
                  {!noteOpen && (
                    <button type="button" onClick={() => setNoteOpen(true)}
                      style={{ background:'none', border:'1px dashed #CBD5E1', borderRadius:'8px', padding:'6px 12px', fontSize:'11px', color:'#94A3B8', cursor:'pointer', fontFamily:'inherit', marginBottom: val.trim() ? '10px' : '0', display:'inline-flex', alignItems:'center', gap:'5px' }}>
                      <span>+</span> Add note
                    </button>
                  )}
                  {noteOpen && (
                    <div style={{ marginBottom: val.trim() ? '10px' : '0', position:'relative' }}>
                      <AutoTextarea value={note} onChange={e => { setNote(e.target.value); markDirty() }}
                        placeholder="Chart analysis notes..." minHeight={60} />
                      {!note && <button type="button" onClick={() => setNoteOpen(false)}
                        style={{ position:'absolute', top:'6px', right:'8px', background:'none', border:'none', color:'#CBD5E1', cursor:'pointer', fontSize:'12px', padding:'0' }}>✕</button>}
                    </div>
                  )}
                  {val.trim() && <ChartImage url={val.trim()} label={tf || `Chart ${i+1}`} large />}
                </div>
              ) : null)}
            </div>
            {/* Save */}
            <button onClick={saveNote} disabled={saving}
              style={{ alignSelf:'flex-start', background: saving ? '#E2E8F0' : '#0F172A', color: saving ? '#94A3B8' : '#FFFFFF', border:'none', borderRadius:'12px', padding:'11px 24px', fontSize:'13px', fontWeight:'600', cursor: saving ? 'default' : 'pointer', fontFamily:'inherit', letterSpacing:'-.01em', boxShadow: saving ? 'none' : '0 4px 14px rgba(15,23,42,.25)', transition:'all .15s' }}>
              {saving ? 'Saving...' : autoSaving ? 'Auto-saving...' : 'Save Review'}
            </button>
          </div>
        </div>
      )}

      {/* ── EOD REVIEW CARD (daily only) ── */}
      {!isWeekly && !isForecast && (
        <div style={{ order:4, background:'#FFFFFF', borderRadius:'20px', boxShadow:'0 1px 3px rgba(0,0,0,.06),0 8px 24px rgba(0,0,0,.05)', marginBottom:'16px', overflow:'hidden' }}>
          <div style={{ padding:'18px 24px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'32px', height:'32px', borderRadius:'10px', background:'#FFF7ED', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>✍️</div>
            <span style={{ fontSize:'14px', fontWeight:'600', color:'#0F172A' }}>End of Day Review</span>
          </div>
          <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:'16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px', background:'#F8FAFC', borderRadius:'12px', border:'1px solid #E2E8F0' }}>
              <span style={{ fontSize:'13px', fontWeight:'600', color:'#334155', flex:1 }}>Did you follow your plan?</span>
              {['Yes','Mostly','No'].map(v => (
                <button key={v} onClick={() => { setFollowedPlan(v); markDirty() }}
                  style={{ padding:'5px 14px', borderRadius:'8px', border:`1.5px solid ${followedPlan===v?'#6366F1':'#E2E8F0'}`, background: followedPlan===v?'#6366F1':'transparent', color: followedPlan===v?'#fff':'#64748B', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit', transition:'all .15s' }}>
                  {v}
                </button>
              ))}
            </div>
            <div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#64748B', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'8px' }}>How did the session go?</label>
              <AutoTextarea value={eodReview} onChange={e => { setEodReview(e.target.value); markDirty() }}
                placeholder="Overall feel of the session — how price moved, your execution, anything notable..."
                minHeight={90} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#10B981', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'8px' }}>What went well</label>
                <AutoTextarea value={wentWell} onChange={e => { setWentWell(e.target.value); markDirty() }}
                  placeholder="Execution, patience, market reads..."
                  minHeight={80} style={{ background:'#F0FDF4', border:'1.5px solid #BBF7D0', borderRadius:'12px' }} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#EF4444', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'8px' }}>What to improve</label>
                <AutoTextarea value={improve} onChange={e => { setImprove(e.target.value); markDirty() }}
                  placeholder="One specific thing for tomorrow..."
                  minHeight={80} style={{ background:'#FEF2F2', border:'1.5px solid #FECACA', borderRadius:'12px' }} />
              </div>
            </div>
            <button onClick={saveNote} disabled={saving}
              style={{ alignSelf:'flex-start', background: saving ? '#E2E8F0' : '#0F172A', color: saving ? '#94A3B8' : '#FFFFFF', border:'none', borderRadius:'12px', padding:'11px 24px', fontSize:'13px', fontWeight:'600', cursor: saving ? 'default' : 'pointer', fontFamily:'inherit', letterSpacing:'-.01em', boxShadow: saving ? 'none' : '0 4px 14px rgba(15,23,42,.25)', transition:'all .15s' }}>
              {saving ? 'Saving...' : autoSaving ? 'Auto-saving...' : 'Save Day'}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
