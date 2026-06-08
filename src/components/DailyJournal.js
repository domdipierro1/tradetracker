import React, { useState, useEffect, useCallback, useRef } from 'react'
import { computeStats, f2 } from '../lib/stats'
import { useEconomicCalendar, currencyFlag, formatFFTime, getNoTradeReason } from '../lib/useEconomicCalendar'

// ── CONSTANTS ────────────────────────────────────────────────────
const TIMES   = ['02:00','02:30','03:00','03:30','04:00','04:30','05:00','05:30','06:00','06:30','07:00','07:30','08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00']
const SYMBOLS = ['AUD/USD','EUR/USD','GBP/USD','NZD/USD','USD/CAD','USD/CHF','USD/JPY','NQ','ES','DAX','Gold','Silver']
const LEVELS  = ['Prev Month High','Prev Month Low','Prev Week High','Prev Week Low','Prev Day High','Prev Day Low','4H Fair Value Gap','4H Order Block','4H Breaker Block','4H Mitigation Block','Daily Fair Value Gap','Daily Order Block','Daily Breaker Block','Daily Mitigation Block']
const EMOTIONS = ['Calm','Patient','Focused','Confident','FOMO','Anxious','Bored','Frustrated','Overconfident','Hesitant','Revenge urge','Greedy','Fearful']
const TAG_MISTAKES = ['Entered early','Chased entry','Moved stop','Oversized','Undersized','Took partial too early','Exited early','Held too long','No confirmation','Traded outside killzone','Wrong bias','Revenge trade','Overtraded','FOMO entry']

// Built-in preset map by category key
const PRESETS = { level: LEVELS, emotion: EMOTIONS, mistake_tag: TAG_MISTAKES }
const CUSTOM_KEY = cat => `tt26_custom_${cat}`

// Parse a stored multi-value field into an array (handles old single-string format)
function parseLevels(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  try {
    const p = JSON.parse(raw)
    if (Array.isArray(p)) return p
    return raw ? [String(raw)] : []
  } catch {
    return raw ? [String(raw)] : []   // old single-value string
  }
}
function getCustom(cat) {
  try { return JSON.parse(localStorage.getItem(CUSTOM_KEY(cat)) || '[]') } catch { return [] }
}
function addCustom(cat, name) {
  const v = (name || '').trim()
  if (!v) return getCustom(cat)
  const cur = getCustom(cat)
  const builtin = PRESETS[cat] || []
  if (cur.includes(v) || builtin.includes(v)) return cur
  const next = [...cur, v]
  try { localStorage.setItem(CUSTOM_KEY(cat), JSON.stringify(next)) } catch {}
  return next
}
function removeCustomPreset(cat, name) {
  const next = getCustom(cat).filter(c => c !== name)
  try { localStorage.setItem(CUSTOM_KEY(cat), JSON.stringify(next)) } catch {}
  return next
}
const MISTAKES= ['No mistake','Wrong bias','Level not aligned with bias','Entered outside killzone','No breaker block formed','Entered before breaker closed','Premature entry — no confirmation','Moved stop too early','Took partial too early','Revenge trade','Overtraded']
const GRADE_ITEMS = [
  'Preparation',
  'Patience',
  'Entry Quality',
  'Risk',
  'Exit Discipline',
]

const EMPTY_TRADE = { time:'', symbol:'', direction:'', bias:'', session:'', level:'', pd_array:'', entry_tf:'', trade_type:'', r:'', mae:'', mfe:'', outcome:'', mistake:'No mistake', emotions:'', mistake_tags:'', screenshot:'', screenshot2:'', journal:'' }
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
  const { events: allEvents, eventsForDate, loading } = useEconomicCalendar()
  const liveEvents = eventsForDate(dateStr)
  const events = liveEvents.length > 0 ? liveEvents : (savedEvents || [])

  // Snapshot as soon as loading finishes — but ONLY capture when we actually
  // have live events for this date. Past days return no live data (the calendar
  // API only serves the current week), so we must never overwrite a saved snapshot.
  const notified = React.useRef(false)
  React.useEffect(() => {
    if (!loading && !notified.current) {
      notified.current = true
      if (liveEvents.length > 0) {
        onEventsLoaded && onEventsLoaded(liveEvents)
      }
    }
  }, [loading])

  // ── NO-TRADE RULES — uses shared getNoTradeReason so journal + calendar match ──
  const noTradeWarning = React.useMemo(() => {
    if (loading) return null
    return getNoTradeReason(dateStr, allEvents)
  }, [loading, allEvents, dateStr])

  if (loading) return null

  const warnBg    = noTradeWarning?.type === 'holiday' ? '#FEF3C7' : noTradeWarning?.type === 'quiet' ? '#F0F9FF' : '#FEF2F2'
  const warnBorder = noTradeWarning?.type === 'holiday' ? '#FDE68A' : noTradeWarning?.type === 'quiet' ? '#BAE6FD' : '#FECACA'
  const warnColor  = noTradeWarning?.type === 'holiday' ? '#92400E' : noTradeWarning?.type === 'quiet' ? '#0369A1' : '#991B1B'

  return (
    <div style={{ marginBottom:'14px' }}>
      {/* Economic events card */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
        <div style={{ padding:'10px 16px', borderBottom: events.length > 0 ? '1px solid var(--border)' : 'none', background: noTradeWarning ? 'var(--red-bg)' : 'var(--surface2)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <span style={{ fontSize:'12px' }}>📅</span>
            <span style={{ fontSize:'11px', fontWeight:'600', color:'var(--text2)', letterSpacing:'.04em', textTransform:'uppercase' }}>Today's News</span>
            {events.length > 0 && <span style={{ fontSize:'11px', color:'var(--muted)', marginLeft:'auto' }}>{events.length} event{events.length > 1 ? 's' : ''}</span>}
            {liveEvents.length === 0 && (savedEvents||[]).length > 0 && <span style={{ fontSize:'9px', fontWeight:'700', color:'var(--muted2)', background:'var(--surface3)', padding:'2px 7px', borderRadius:'4px', letterSpacing:'.05em', marginLeft: events.length > 0 ? '8px' : 'auto' }}>SAVED</span>}
          </div>
          <div style={{ fontSize:'12px', fontWeight:'500', color: noTradeWarning ? 'var(--red)' : 'var(--muted)', marginTop:'4px', marginLeft:'20px' }}>
            {noTradeWarning ? (
              <>Non Trading Day{noTradeWarning.label && <span style={{ color:'var(--muted)', fontStyle:'italic', fontWeight:'400', marginLeft:'7px' }}>— {noTradeWarning.label}</span>}</>
            ) : events.length > 0 ? `${events.length} high-impact event${events.length > 1 ? 's' : ''}` : 'No news today'}
          </div>
        </div>
        {events.length > 0 && (
          <div style={{ display:'flex', flexDirection:'column' }}>
            {events.map((e, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 16px', borderBottom: i < events.length-1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:'var(--muted)', minWidth:'48px' }}>{e.isHoliday ? 'All Day' : (e.time || '—')}</span>
                <span style={{ fontSize:'10px', fontWeight:'700', color:'#1E293B', background:'#F1F5F9', padding:'2px 8px', borderRadius:'4px' }}>{e.country}</span>
                <div style={{ width:'11px', height:'11px', borderRadius:'3px', background: e.isHoliday ? '#94A3B8' : '#EF4444', flexShrink:0 }} />
                <span style={{ fontSize:'12px', color:'var(--text)', flex:1 }}>{e.title}</span>
                {!e.isHoliday && e.forecast && !e.actual && <span style={{ fontSize:'11px', color:'var(--muted)', fontFamily:"'JetBrains Mono',monospace" }}>F: {e.forecast}</span>}
                {!e.isHoliday && e.actual && <span style={{ fontSize:'11px', color:'var(--green)', fontFamily:"'JetBrains Mono',monospace", fontWeight:'600' }}>A: {e.actual}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


// ── TAG COMBOBOX — autocomplete + dropdown + multi-select + custom ──
function TagCombobox({ cat, selected, onChange, placeholder, accent = 'var(--blue)' }) {
  const [custom, setCustom] = useState(getCustom(cat))
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const boxRef = useRef(null)
  const sel = Array.isArray(selected) ? selected : []
  const allPresets = [...(PRESETS[cat] || []), ...custom.filter(c => !(PRESETS[cat] || []).includes(c))]

  useEffect(() => {
    function onDoc(e) { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const q = text.trim().toLowerCase()
  const matches = allPresets.filter(p => p.toLowerCase().includes(q) && !sel.includes(p))
  const exactExists = allPresets.some(p => p.toLowerCase() === q) || sel.some(s => s.toLowerCase() === q)

  function add(name) {
    const v = (name || '').trim()
    if (!v) return
    if (!(PRESETS[cat] || []).includes(v) && !getCustom(cat).includes(v)) setCustom(addCustom(cat, v))
    if (!sel.includes(v)) onChange([...sel, v])
    setText(''); setOpen(true)
  }
  function remove(name) { onChange(sel.filter(s => s !== name)) }
  function deletePreset(name, e) {
    e.stopPropagation()
    setCustom(removeCustomPreset(cat, name))
    if (sel.includes(name)) onChange(sel.filter(s => s !== name))
  }

  return (
    <div ref={boxRef} style={{ position:'relative' }}>
      {/* Selected chips */}
      {sel.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginBottom:'8px' }}>
          {sel.map(s => (
            <span key={s} style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:accent, color:'#fff', fontSize:'11.5px', fontWeight:'600', padding:'4px 10px', borderRadius:'20px' }}>
              {s}
              <span onClick={() => remove(s)} style={{ cursor:'pointer', fontSize:'13px', lineHeight:1, opacity:.8 }}>×</span>
            </span>
          ))}
        </div>
      )}
      {/* Input + caret */}
      <div style={{ display:'flex', alignItems:'center', position:'relative' }}>
        <input className="form-input" value={text}
          onChange={e => { setText(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); if (text.trim()) add(matches[0] && matches[0].toLowerCase() === q ? matches[0] : text.trim()) }
            if (e.key === 'Escape') setOpen(false)
          }}
          placeholder={placeholder || 'Type to search or add…'}
          style={{ flex:1, fontSize:'12.5px', padding:'9px 30px 9px 12px' }} />
        <span onClick={() => setOpen(o => !o)} style={{ position:'absolute', right:'10px', cursor:'pointer', color:'var(--muted2)', fontSize:'10px', userSelect:'none' }}>▼</span>
      </div>
      {/* Dropdown */}
      {open && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, marginTop:'4px', background:'var(--surface)', border:'1px solid var(--border2)', borderRadius:'var(--r-sm)', boxShadow:'var(--shadow-md)', zIndex:50, maxHeight:'240px', overflowY:'auto' }}>
          {/* Add-new row */}
          {text.trim() && !exactExists && (
            <div onClick={() => add(text.trim())}
              style={{ padding:'9px 13px', cursor:'pointer', fontSize:'12.5px', fontWeight:'600', color:accent, borderBottom: matches.length ? '1px solid var(--border)' : 'none', display:'flex', alignItems:'center', gap:'6px' }}>
              <span style={{ fontSize:'14px', lineHeight:1 }}>+</span> Add “{text.trim()}”
            </div>
          )}
          {(text.trim() ? matches : allPresets.filter(p => !sel.includes(p))).map(p => {
            const isCustom = !(PRESETS[cat] || []).includes(p)
            return (
              <div key={p} onClick={() => add(p)}
                style={{ padding:'8px 13px', cursor:'pointer', fontSize:'12.5px', color:'var(--text2)', display:'flex', alignItems:'center', gap:'8px', transition:'background .1s' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--surface2)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <span style={{ flex:1 }}>{p}</span>
                {isCustom && <span onClick={e => deletePreset(p, e)} title="Delete preset" style={{ color:'var(--muted2)', fontSize:'13px', lineHeight:1 }}>×</span>}
              </div>
            )
          })}
          {!text.trim() && allPresets.filter(p => !sel.includes(p)).length === 0 && (
            <div style={{ padding:'10px 13px', fontSize:'12px', color:'var(--muted2)' }}>All added — type to create a new one</div>
          )}
        </div>
      )}
    </div>
  )
}

function TradeForm({ onSave, onCancel, initialData }) {
  const [form, setForm] = useState(() => {
    if (initialData) return { ...EMPTY_TRADE, ...initialData, r: initialData.r ?? initialData.r_multiple ?? initialData.pl ?? '' }
    try { const s = localStorage.getItem(TRADE_DRAFT); return s ? { ...EMPTY_TRADE, ...JSON.parse(s) } : EMPTY_TRADE } catch(e) { return EMPTY_TRADE }
  })
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)
  const isEdit = !!initialData

  const set  = k => e => { const u = { ...form, [k]: e.target.value }; setForm(u); if (!isEdit) { try { localStorage.setItem(TRADE_DRAFT, JSON.stringify(u)) } catch(e) {} } }
  const setV = (k, v) => { const u = { ...form, [k]: v }; setForm(u); if (!isEdit) { try { localStorage.setItem(TRADE_DRAFT, JSON.stringify(u)) } catch(e) {} } }

  function clear() { try { localStorage.removeItem(TRADE_DRAFT); sessionStorage.setItem(FORM_OPEN,'false') } catch(e) {} }

  async function submit(e) {
    e.preventDefault()
    if (!form.outcome) { setErr('Please select an outcome (Win/Loss/Break Even)'); return }
    if (form.r === '' || form.r === null || form.r === undefined || isNaN(parseFloat(form.r))) { setErr('R multiple is required (e.g. 2, -1, 1.5)'); return }
    setSaving(true)
    try {
      const rVal = parseFloat(form.r) || 0
      await onSave({ ...form, r_multiple: rVal, pl: rVal, risk: 1, mae: form.mae ? parseFloat(form.mae) : null, mfe: form.mfe ? parseFloat(form.mfe) : null })
      clear(); if (!isEdit) setForm(EMPTY_TRADE)
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
      <div style={{ fontSize:'13px', fontWeight:'600', color:'var(--text)', marginBottom:'16px' }}>{isEdit ? 'Edit Trade' : 'Log Trade'}</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:'11px', marginBottom:'12px' }}>
        <div className="form-group">
          <label className="form-label">Time (EST)</label>
          <input className="form-input" type="time" value={form.time} onChange={set('time')} step="60" />
        </div>
        {sel('symbol', 'Symbol', SYMBOLS)}
        {sel('direction', 'Direction', ['Long','Short'])}
        {sel('trade_type', 'Trade Type', ['SMR', 'Continuation', 'Not in Plan'])}
        {sel('bias', 'Bias', ['Bullish','Bearish'])}
        {sel('session', 'Session', ['London (02:00–05:00)','New York AM (06:00–10:00)'])}
        {sel('entry_tf', 'Entry TF', ['5m','15m','30m'])}
        <div className="form-group">
          <label className="form-label">R Multiple</label>
          <input className="form-input" type="number" step="0.1" value={form.r} onChange={set('r')} placeholder="e.g. +2, -1, +1.5" />
          <div style={{ fontSize:'10px', color:'var(--muted)', marginTop:'3px' }}>Positive = win (+2R), Negative = loss (-1R)</div>
        </div>
        {sel('outcome', 'Outcome', ['Win','Loss','Break Even'])}
      </div>
      {/* Key Levels — autocomplete combobox */}
      <div className="form-group" style={{ marginBottom:'11px' }}>
        <label className="form-label">Key Levels <span style={{ textTransform:'none', fontWeight:'400', color:'var(--muted2)' }}>· type to search or add, click ▼ for full list</span></label>
        <TagCombobox cat="level" selected={parseLevels(form.level)}
          onChange={arr => setV('level', JSON.stringify(arr))}
          placeholder="Type a level (e.g. 4H Order Block) or add your own…" accent="var(--blue)" />
      </div>
      {/* Emotions + Mistakes tags */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'11px', marginBottom:'11px' }}>
        <div className="form-group">
          <label className="form-label">Emotions</label>
          <TagCombobox cat="emotion" selected={parseLevels(form.emotions)}
            onChange={arr => setV('emotions', JSON.stringify(arr))}
            placeholder="How did you feel? (e.g. FOMO, Calm)…" accent="#7C3AED" />
        </div>
        <div className="form-group">
          <label className="form-label">Mistakes</label>
          <TagCombobox cat="mistake_tag" selected={parseLevels(form.mistake_tags)}
            onChange={arr => setV('mistake_tags', JSON.stringify(arr))}
            placeholder="Any mistakes? (e.g. Moved stop)…" accent="#E11D48" />
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'11px', marginBottom:'11px' }}>
        <div className="form-group">
          <div style={{ display:'flex', gap:'6px', marginBottom:'6px', alignItems:'center' }}>
            <select className="form-input" style={{ flex:'0 0 auto', width:'90px', padding:'4px 8px', fontSize:'11px' }}
              value={form.screenshot_tf||''} onChange={e => setForm(f=>({...f, screenshot_tf:e.target.value}))}>
              <option value="">Timeframe</option>
              {['W','D','4H','1H','30M','15M','5M'].map(t=><option key={t}>{t}</option>)}
            </select>
            <span style={{ fontSize:'11px', color:'var(--muted)', fontWeight:'600' }}>Chart 1</span>
          </div>
          <input className="form-input" type="url" value={form.screenshot} onChange={set('screenshot')} placeholder="Paste TradingView snapshot URL..." />
          {form.screenshot && form.screenshot.trim() && (
            <div style={{ marginTop:'8px' }}><ChartImage url={form.screenshot.trim()} label={form.screenshot_tf || 'Chart 1'} large /></div>
          )}
        </div>
        <div className="form-group">
          <div style={{ display:'flex', gap:'6px', marginBottom:'6px', alignItems:'center' }}>
            <select className="form-input" style={{ flex:'0 0 auto', width:'90px', padding:'4px 8px', fontSize:'11px' }}
              value={form.screenshot2_tf||''} onChange={e => setForm(f=>({...f, screenshot2_tf:e.target.value}))}>
              <option value="">Timeframe</option>
              {['W','D','4H','1H','30M','15M','5M'].map(t=><option key={t}>{t}</option>)}
            </select>
            <span style={{ fontSize:'11px', color:'var(--muted)', fontWeight:'600' }}>Chart 2</span>
          </div>
          <input className="form-input" type="url" value={form.screenshot2||''} onChange={set('screenshot2')} placeholder="Paste TradingView snapshot URL..." />
          {form.screenshot2 && form.screenshot2.trim() && (
            <div style={{ marginTop:'8px' }}><ChartImage url={form.screenshot2.trim()} label={form.screenshot2_tf || 'Chart 2'} large /></div>
          )}
        </div>
      </div>
      <div className="form-group" style={{ marginBottom:'14px' }}>
        <label className="form-label">Trade Notes</label>
        <textarea className="form-input" value={form.journal} onChange={set('journal')} placeholder="Why you took this trade, what happened, execution notes..." style={{ minHeight:'70px' }} />
      </div>
      {err && <div style={{ color:'var(--red)', fontSize:'12px', marginBottom:'10px' }}>{err}</div>}
      <div style={{ display:'flex', gap:'8px' }}>
        <button type="submit" className="btn btn-blue" disabled={saving}>{saving ? 'Saving...' : isEdit ? 'Update Trade' : 'Save Trade'}</button>
        <button type="button" className="btn btn-outline" onClick={() => { clear(); onCancel() }}>Cancel</button>
      </div>
    </form>
  )
}

// ── TRADE CARD ───────────────────────────────────────────────────
function TradeCard({ t, onDelete, onEdit, onOpenDay }) {
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
        {onOpenDay ? (
          <button onClick={() => onOpenDay(t.date)} title="Open this day's journal"
            style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'inline-flex', alignItems:'center', gap:'5px', fontFamily:'inherit' }}>
            <span style={{ fontSize:'15px', fontWeight:'700', color:'#0F172A', letterSpacing:'-.01em', textDecoration:'underline', textDecorationColor:'#CBD5E1', textUnderlineOffset:'3px' }}>{t.symbol || '—'}</span>
            <span style={{ fontSize:'10px', color:'#94A3B8' }}>↗</span>
          </button>
        ) : (
          <span style={{ fontSize:'15px', fontWeight:'700', color:'#0F172A', letterSpacing:'-.01em' }}>{t.symbol || '—'}</span>
        )}
        {onOpenDay && t.date && <span style={{ fontSize:'10px', color:'#94A3B8', fontFamily:"'JetBrains Mono',monospace" }}>{new Date(t.date+'T12:00:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})}</span>}
        {t.time && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#94A3B8', background:'#F1F5F9', padding:'2px 7px', borderRadius:'6px' }}>{t.time} EST</span>}
        {t.direction && (
          <span style={{ fontSize:'11px', fontWeight:'700', padding:'3px 9px', borderRadius:'7px', background: t.direction==='Long'?'#DCFCE7':'#FEE2E2', color: t.direction==='Long'?'#14532D':'#7F1D1D', border: `1px solid ${t.direction==='Long'?'#BBF7D0':'#FECACA'}` }}>{t.direction}</span>
        )}
        {t.outcome && (
          <span style={{ fontSize:'11px', fontWeight:'700', padding:'3px 9px', borderRadius:'7px', background:oc.bg, color:oc.col, border:`1px solid ${oc.border}` }}>{t.outcome}</span>
        )}
        <div style={{ display:'flex', gap:'6px', marginLeft:'auto', alignItems:'center' }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'18px', fontWeight:'700', color: up ? '#10B981' : '#EF4444', marginRight:'4px' }}>
            {rVal >= 0 ? '+' : ''}{rVal.toFixed ? rVal.toFixed(2) : rVal}R
          </span>
          {onEdit && (
            <button onClick={() => onEdit(t)}
              style={{ background:'none', border:'1px solid #E2E8F0', borderRadius:'7px', cursor:'pointer', color:'#64748B', fontSize:'11px', fontWeight:'600', padding:'4px 10px', fontFamily:'inherit' }}>Edit</button>
          )}
          {onDelete && (
            <button onClick={() => { if(window.confirm('Delete this trade?')) onDelete(t.id) }}
              style={{ background:'none', border:'none', cursor:'pointer', color:'#CBD5E1', fontSize:'14px', padding:'0 2px', lineHeight:1, fontWeight:'700' }}>✕</button>
          )}
        </div>
      </div>

      {/* Details grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', borderBottom:`1px solid #F1F5F9` }}>
        {[['Bias',t.bias],['Session',t.session?.replace(' (02:00–05:00)','')?.replace(' (06:00–10:00)','')],['Key Level',parseLevels(t.level).join(', ')||t.setup],['Entry TF',t.entry_tf||t.smt],['Risk',t.risk?`${t.risk}%`:null],['R Target',t.r_multiple?`${t.r_multiple}R`:null]].filter(([,v])=>v).map(([l,v],i)=>(
          <div key={i} style={{ padding:'10px 14px', borderRight:'1px solid #F1F5F9', borderBottom:'1px solid #F1F5F9' }}>
            <div style={{ fontSize:'9px', fontWeight:'600', color:'#94A3B8', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:'3px' }}>{l}</div>
            <div style={{ fontSize:'12px', fontWeight:'500', color:'#334155' }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Emotion + Mistake tags */}
      {(parseLevels(t.emotions).length > 0 || parseLevels(t.mistake_tags).length > 0) && (
        <div style={{ padding:'10px 20px', borderBottom:'1px solid #F1F5F9', display:'flex', flexWrap:'wrap', gap:'6px', alignItems:'center' }}>
          {parseLevels(t.emotions).map(e => (
            <span key={'e'+e} style={{ fontSize:'11px', fontWeight:'600', color:'#7C3AED', background:'#F2ECFE', border:'1px solid #D2BEF9', padding:'3px 9px', borderRadius:'20px' }}>{e}</span>
          ))}
          {parseLevels(t.mistake_tags).map(m => (
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


// ── DYNAMIC CHART LIST ───────────────────────────────────────────
// Unlimited charts; Add button sits at the bottom so no scrolling up.
function ChartList({ charts, setCharts, markDirty, isForecast }) {
  // charts is now an array of GROUPS: { label, note, noteOpen, images:[{url,tf}] }
  const TFS = ['W','D','4H','1H','30M','15M','5M']
  const [lightbox, setLightbox] = React.useState(null) // {url, label}

  function updateGroup(gi, patch) {
    setCharts(prev => prev.map((g, idx) => idx === gi ? { ...g, ...patch } : g))
    markDirty()
  }
  function removeGroup(gi) {
    setCharts(prev => prev.filter((_, idx) => idx !== gi))
    markDirty()
  }
  function addGroup() {
    setCharts(prev => [...prev, { label:'', note:'', noteOpen:false, images:[{ url:'', tf:'' }] }])
    markDirty()
  }
  function updateImage(gi, ii, patch) {
    setCharts(prev => prev.map((g, idx) => {
      if (idx !== gi) return g
      const images = (g.images||[]).map((im, j) => j === ii ? { ...im, ...patch } : im)
      return { ...g, images }
    }))
    markDirty()
  }
  function addImage(gi) {
    setCharts(prev => prev.map((g, idx) => idx === gi ? { ...g, images:[...(g.images||[]), { url:'', tf:'' }] } : g))
    markDirty()
  }
  function removeImage(gi, ii) {
    setCharts(prev => prev.map((g, idx) => idx === gi ? { ...g, images:(g.images||[]).filter((_, j) => j !== ii) } : g))
    markDirty()
  }

  return (
    <div>
      {charts.map((g, gi) => {
        const images = g.images || []
        return (
        <div key={gi} style={{ marginBottom:'16px', background:'#F8FAFC', borderRadius:'14px', padding:'14px 16px', border:'1px solid #E2E8F0' }}>
          {/* Group label */}
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
            <input value={g.label||''} onChange={e => updateGroup(gi, { label: e.target.value })}
              placeholder="Label (e.g. EU, GBP, DXY)…"
              style={{ flex:1, background:'#FFFFFF', border:'1.5px solid #E2E8F0', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', fontWeight:'600', color:'#0F172A', fontFamily:'inherit', outline:'none', transition:'border-color .15s' }}
              onFocus={e => e.target.style.borderColor='#4F46E5'} onBlur={e => e.target.style.borderColor='#E2E8F0'} />
            <span style={{ fontSize:'11px', color:'#94A3B8', whiteSpace:'nowrap' }}>{images.length} chart{images.length===1?'':'s'}</span>
            <button type="button" onClick={() => removeGroup(gi)} title="Remove group"
              style={{ background:'none', border:'none', color:'#CBD5E1', cursor:'pointer', fontSize:'15px', padding:'0 2px' }}>✕</button>
          </div>

          {/* Thumbnail grid */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:'10px', marginBottom:'12px' }}>
            {images.map((im, ii) => (
              <div key={ii} style={{ background:'#FFFFFF', border:'1px solid #E2E8F0', borderRadius:'10px', padding:'8px', position:'relative' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'6px' }}>
                  <select value={im.tf||''} onChange={e => updateImage(gi, ii, { tf: e.target.value })}
                    style={{ flex:1, background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:'6px', padding:'3px 6px', fontSize:'11px', fontWeight:'600', color: im.tf ? '#0F172A' : '#94A3B8', fontFamily:'inherit', outline:'none', cursor:'pointer' }}>
                    <option value="">TF</option>
                    {TFS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button type="button" onClick={() => removeImage(gi, ii)}
                    style={{ background:'none', border:'none', color:'#CBD5E1', cursor:'pointer', fontSize:'13px', padding:'0 2px', lineHeight:1 }}>✕</button>
                </div>
                <input type="url" value={im.url||''} onChange={e => updateImage(gi, ii, { url: e.target.value })}
                  placeholder="Paste chart URL…"
                  style={{ width:'100%', background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:'6px', padding:'6px 8px', fontSize:'10.5px', color:'#0F172A', fontFamily:"'JetBrains Mono',monospace", outline:'none', boxSizing:'border-box', marginBottom: im.url && im.url.trim() ? '8px' : '0' }} />
                {im.url && im.url.trim() && (
                  <div onClick={() => setLightbox({ url: im.url.trim(), label: (g.label?g.label+' · ':'') + (im.tf||`Chart ${ii+1}`) })}
                    style={{ cursor:'zoom-in', borderRadius:'8px', overflow:'hidden', aspectRatio:'16/10', background:'#F1F5F9', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <img src={im.url.trim()} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                      onError={e => { e.target.style.display='none'; e.target.parentElement.innerHTML='<span style=\"font-size:10px;color:#94A3B8;text-align:center;padding:8px\">Preview unavailable — tap to open</span>'; e.target.parentElement.onclick = () => window.open(im.url.trim(),'_blank') }} />
                  </div>
                )}
              </div>
            ))}
            {/* Add image tile */}
            <button type="button" onClick={() => addImage(gi)}
              style={{ background:'#FFFFFF', border:'1.5px dashed #CBD5E1', borderRadius:'10px', minHeight:'92px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'4px', color:'#94A3B8', fontFamily:'inherit', transition:'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#4F46E5'; e.currentTarget.style.color='#4F46E5' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#CBD5E1'; e.currentTarget.style.color='#94A3B8' }}>
              <span style={{ fontSize:'18px', lineHeight:1 }}>+</span>
              <span style={{ fontSize:'10.5px', fontWeight:'600' }}>Add chart</span>
            </button>
          </div>

          {/* Shared note for the group */}
          {!g.noteOpen && !(g.note && g.note.trim()) ? (
            <button type="button" onClick={() => updateGroup(gi, { noteOpen: true })}
              style={{ background:'none', border:'1px dashed #CBD5E1', borderRadius:'8px', padding:'6px 12px', fontSize:'11px', color:'#94A3B8', cursor:'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:'5px' }}>
              <span>+</span> Add note
            </button>
          ) : (
            <AutoTextarea value={g.note||''} onChange={e => updateGroup(gi, { note: e.target.value })}
              placeholder={isForecast ? "What are you watching across these charts — levels, bias, the setup you want…" : "Analysis across these charts…"}
              minHeight={64} style={{ background:'#FFFFFF', border:'1.5px solid #E2E8F0', borderRadius:'8px' }} />
          )}
        </div>
        )
      })}
      <button type="button" onClick={addGroup}
        style={{ width:'100%', background:'#F8FAFC', border:'1.5px dashed #CBD5E1', borderRadius:'10px', padding:'11px', fontSize:'12.5px', fontWeight:'600', color:'#475569', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', transition:'all .15s' }}
        onMouseEnter={e => { e.currentTarget.style.background='#EEF0FE'; e.currentTarget.style.borderColor='#4F46E5'; e.currentTarget.style.color='#4F46E5' }}
        onMouseLeave={e => { e.currentTarget.style.background='#F8FAFC'; e.currentTarget.style.borderColor='#CBD5E1'; e.currentTarget.style.color='#475569' }}>
        <span style={{ fontSize:'15px', lineHeight:1 }}>+</span> Add Chart Group
      </button>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)}
          style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.82)', zIndex:9999, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', cursor:'zoom-out' }}>
          <div style={{ color:'#fff', fontSize:'13px', fontWeight:'600', marginBottom:'12px' }}>{lightbox.label}</div>
          <img src={lightbox.url} alt="" style={{ maxWidth:'94vw', maxHeight:'82vh', objectFit:'contain', borderRadius:'10px', boxShadow:'0 20px 60px rgba(0,0,0,.5)' }}
            onClick={e => e.stopPropagation()} />
          <button onClick={() => setLightbox(null)} style={{ marginTop:'16px', background:'rgba(255,255,255,.14)', color:'#fff', border:'1px solid rgba(255,255,255,.3)', borderRadius:'8px', padding:'8px 18px', fontSize:'13px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit' }}>Close</button>
        </div>
      )}
    </div>
  )
}


// ── WEEKLY ECON SNAPSHOT ─────────────────────────────────────────
// Shows Mon-Fri high-impact events for the week being reviewed
function WeeklyEconNews({ weekRange, useNextWeek, onEventsLoaded, savedEvents }) {
  const { eventsForDate, loading } = useEconomicCalendar()

  const weekdays = React.useMemo(() => {
    const days = []
    let start
    if (useNextWeek) {
      const now = new Date()
      const dow = now.getDay()
      start = new Date(now)
      start.setDate(now.getDate() + (dow === 0 ? 1 : 8 - dow))
      start.setHours(0,0,0,0)
    } else {
      if (!weekRange) return []
      start = new Date(weekRange.mon + 'T12:00:00')
    }
    for (let i = 0; i < 5; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i)
      const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0')
      days.push(`${y}-${m}-${dd}`)
    }
    return days
  }, [weekRange?.mon, useNextWeek])

  const liveEvents = weekdays.flatMap(ds => eventsForDate(ds))
  const events = liveEvents.length > 0 ? liveEvents : (savedEvents || [])

  // Snapshot once loading is done — only when live events exist, so we never
  // wipe a saved weekly snapshot when revisiting a past week.
  const notified = React.useRef(false)
  React.useEffect(() => {
    if (!loading && weekdays.length > 0 && !notified.current) {
      notified.current = true
      if (liveEvents.length > 0) {
        onEventsLoaded && onEventsLoaded(liveEvents)
      }
    }
  }, [loading, weekdays.length])

  if (loading) return null

  // Group events by date
  const grouped = {}
  events.forEach(e => { if (!grouped[e.date]) grouped[e.date] = []; grouped[e.date].push(e) })

  return (
    <div style={{ background:'#FFFFFF', borderRadius:'20px', boxShadow:'0 1px 3px rgba(0,0,0,.06),0 8px 24px rgba(0,0,0,.05)', marginBottom:'16px', overflow:'hidden' }}>
      <div style={{ padding:'14px 20px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', gap:'10px' }}>
        <div style={{ width:'3px', height:'16px', borderRadius:'2px', background:'#EF4444', flexShrink:0 }} />
        <span style={{ fontSize:'13px', fontWeight:'700', color:'#0F172A' }}>
          {useNextWeek ? "Coming Week's Events" : "Past Week's Events"}
        </span>
        <span style={{ marginLeft:'auto', fontSize:'11px', color:'#94A3B8' }}>
          {events.length > 0 ? `${events.length} high-impact` : 'No high-impact events'} · USD · GBP · EUR
        </span>
      </div>
      <div>
        {weekdays.map(ds => {
          const dayEvs = grouped[ds] || []
          const d = new Date(ds + 'T12:00:00')
          const dayLabel = d.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })
          return (
            <div key={ds} style={{ borderBottom:'1px solid #F8FAFC' }}>
              <div style={{ padding:'8px 20px 4px', display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ fontSize:'10px', fontWeight:'700', color:'#94A3B8', letterSpacing:'.06em', textTransform:'uppercase' }}>{dayLabel}</span>
                {dayEvs.length === 0 && <span style={{ fontSize:'10px', color:'#94A3B8', fontStyle:'italic' }}>No high-impact events</span>}
              </div>
              {dayEvs.map((e, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'6px 20px', borderTop: i > 0 ? '1px solid #F8FAFC' : 'none' }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#64748B', minWidth:'40px' }}>{e.isHoliday ? 'All Day' : (e.time || '—')}</span>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:'3px', padding:'1px 6px', borderRadius:'4px', background:'#F1F5F9', fontSize:'10px', fontWeight:'700', color:'#1E293B', flexShrink:0 }}>
                    {e.country}
                  </span>
                  <div style={{ width:'11px', height:'11px', borderRadius:'3px', background: e.isHoliday ? '#94A3B8' : '#EF4444', flexShrink:0 }} />
                  <span style={{ fontSize:'12px', fontWeight:'600', color:'#334155', flex:1 }}>{e.title}</span>
                  {!e.isHoliday && e.actual && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', fontWeight:'700', color:'#10B981' }}>{e.actual}</span>}
                  {!e.isHoliday && e.forecast && !e.actual && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#64748B' }}>{e.forecast}</span>}
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
export default function DailyJournal({ trades, dailyNotes, onSaveNote, onDeleteNote, onAddTrade, onEditTrade, onDeleteTrade, toast, dateStr: propDateStr, isWeekly: propIsWeekly, onOpenJournal }) {
  const today = toDateStr(new Date())
  const [dateStr, setDateStr] = useState(propDateStr || today)
  const isWeekly   = propIsWeekly === true
  const isForecast  = propIsWeekly === 'forecast'
  const [showTradeForm, setShowTradeForm] = useState(() => {
    try { return sessionStorage.getItem(FORM_OPEN) === 'true' } catch { return false }
  })
  const [editingTrade, setEditingTrade] = useState(null)
  const tradeFormRef = useRef(null)

  function startEditTrade(tr) {
    setEditingTrade(tr)
    setShowTradeForm(true)
    try { sessionStorage.setItem(FORM_OPEN,'true') } catch(e) {}
    // Scroll to the form once it has rendered
    setTimeout(() => {
      if (tradeFormRef.current) tradeFormRef.current.scrollIntoView({ behavior:'smooth', block:'center' })
    }, 60)
  }
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
  const [charts,     setCharts]     = useState([])  // dynamic chart list: {url, tf, note, noteOpen}
  const [checklist,  setChecklist]  = useState([])
  const [grades,     setGrades]     = useState([])  // 1-5 rating per GRADE_ITEM
  const [gradeReasons, setGradeReasons] = useState([])  // "why not a 5" per GRADE_ITEM
  const [tradeType,   setTradeType]   = useState('')
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
      eodReview, followedPlan, wentWell, improve, checklist, tradeType, charts, grades, gradeReasons])

  // Load note data when date changes
  useEffect(() => {
    if (existingNote) {
      setMood(existingNote.mood || '')
      // htf_bias stores TF JSON, so only use it for TFs not for bias text
      setPlan(existingNote.market_conditions && !existingNote.market_conditions.startsWith('[') ? existingNote.market_conditions : '')
      setChart1(existingNote.observations || '')
      setChart2(existingNote.execution_review || '')
      setChart3(existingNote.week_summary || '')
      try { const notes = JSON.parse(existingNote.top_mistake||'[]'); setChartNote1(notes[0]||''); setChartNote2(notes[1]||''); setChartNote3(notes[2]||''); setChartNote4(notes[3]||''); setNoteOpen1(!!notes[0]); setNoteOpen2(!!notes[1]); setNoteOpen3(!!notes[2]); setNoteOpen4(!!notes[3]) } catch(e) { setChartNote1(''); setChartNote2(''); setChartNote3(''); setChartNote4('') }
      try { const tfs = JSON.parse(existingNote.htf_bias||'[]'); setChartTf1(tfs[0]||''); setChartTf2(tfs[1]||''); setChartTf3(tfs[2]||''); setChartTf4(tfs[3]||'') } catch(e) { setChartTf1(''); setChartTf2(''); setChartTf3(''); setChartTf4('') }
      // Dynamic charts: prefer chart_groups JSON (grouped shape), migrate old shapes
      try {
        const cg = JSON.parse(existingNote.chart_groups || '[]')
        if (Array.isArray(cg) && cg.length > 0) {
          if (cg[0] && Array.isArray(cg[0].images)) {
            // Already grouped shape
            setCharts(cg.map(g => ({ label: g.label||'', note: g.note||'', noteOpen: !!(g.note && g.note.trim()), images: (g.images||[]).map(im => ({ url: im.url||'', tf: im.tf||'' })) })))
          } else {
            // Old flat list [{url,tf,note}] → wrap into one group
            const images = cg.map(c => ({ url: c.url||'', tf: c.tf||'' })).filter(im => im.url.trim())
            const note = cg.map(c => c.note).filter(n => n && n.trim()).join('\n')
            setCharts(images.length || note ? [{ label:'', note, noteOpen: !!note, images: images.length ? images : [{ url:'', tf:'' }] }] : [])
          }
        } else {
          // Migrate from very old 4-slot columns
          const urls  = [existingNote.observations||'', existingNote.execution_review||'', existingNote.week_summary||'']
          let notes = [], tfs = []
          try { notes = JSON.parse(existingNote.top_mistake||'[]') } catch(e) {}
          try { tfs   = JSON.parse(existingNote.htf_bias||'[]') } catch(e) {}
          const images = []
          let note = ''
          for (let i=0;i<4;i++){
            if ((urls[i]||'').trim()) images.push({ url: urls[i], tf: tfs[i]||'' })
            if ((notes[i]||'').trim()) note += (note?'\n':'') + notes[i]
          }
          setCharts(images.length || note ? [{ label:'', note, noteOpen: !!note, images: images.length ? images : [{ url:'', tf:'' }] }] : [])
        }
      } catch(e) { setCharts([]) }
      try { setEconSnapshot(JSON.parse(existingNote.econ_snapshot||'[]')) } catch(e) { setEconSnapshot([]) }
      try { const cd = JSON.parse(existingNote.checklist_data||'{}'); setChecklist(cd.checks||[]); setTradeType(cd.type||''); setGrades(cd.grades||[]); setGradeReasons(cd.gradeReasons||[]) } catch(e) { setChecklist([]); setTradeType(''); setGrades([]); setGradeReasons([]) }
      setEodReview(existingNote.trading_errors && !existingNote.trading_errors.startsWith('[') ? existingNote.trading_errors : '')
      setFollowedPlan(existingNote.consistency || '')
      setWentWell(existingNote.what_worked || '')
      setImprove(existingNote.improvements && !existingNote.improvements.startsWith('[') ? existingNote.improvements : '')
      setBias('')  // bias field separate from TF JSON
    } else {
      setMood(''); setBias(''); setPlan(''); setChart1(''); setChart2('')
      setEodReview(''); setFollowedPlan(''); setWentWell(''); setImprove('')
      setChart3(''); setChart4('')
      setChartNote1(''); setChartNote2(''); setChartNote3(''); setChartNote4('')
      setChartTf1(''); setChartTf2(''); setChartTf3(''); setChartTf4('')
      setNoteOpen1(false); setNoteOpen2(false); setNoteOpen3(false); setNoteOpen4(false)
      setCharts([])
      setChecklist([])
      setTradeType('')
      setGrades([])
      setGradeReasons([])
    }
    setNoteDirty(false)
  }, [dateStr, existingNote?.id])

  function markDirty() { setNoteDirty(true) }

  async function saveNote() {
    // Don't save if there's no actual content (prevents ghost note icons)
    const hasContent = [mood, plan, eodReview, wentWell, improve, followedPlan,
      chart1, chart2, chart3, chart4, chartNote1, chartNote2, chartNote3, chartNote4
    ].some(v => v && v.trim().length > 0) || checklist.some(v => v) || !!tradeType
      || charts.some(g => (g.images||[]).some(im => im.url && im.url.trim()) || (g.note && g.note.trim()) || (g.label && g.label.trim()))
      || (Array.isArray(econSnapshot) && econSnapshot.length > 0)
      || grades.some(g => g > 0)
    if (!hasContent && !existingNote) { setNoteDirty(false); return }

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
        htf_bias:         JSON.stringify([chartTf1,chartTf2,chartTf3,chartTf4]),
        top_mistake:      JSON.stringify([chartNote1,chartNote2,chartNote3,chartNote4]),
        econ_snapshot:    JSON.stringify(econSnapshot),
        chart_groups:     JSON.stringify(charts.map(g => ({ label: g.label||'', note: g.note||'', images: (g.images||[]).filter(im => im.url && im.url.trim()).map(im => ({ url: im.url, tf: im.tf||'' })) })).filter(g => g.images.length > 0 || (g.note && g.note.trim()) || (g.label && g.label.trim()))),
        checklist_data:   JSON.stringify({ type: tradeType, checks: checklist, grades, gradeReasons }),
      })
      setNoteDirty(false)
      toast('Day saved ✓')
    } catch(e) { toast('Error saving: ' + e.message) }
    setSaving(false)
  }

  async function handleAddTrade(tradeData) {
    try {
      if (editingTrade) {
        await onEditTrade(editingTrade.id, { ...tradeData })
        setEditingTrade(null)
        toast('Trade updated ✓')
      } else {
        await onAddTrade({ ...tradeData, date: dateStr })
        toast('Trade logged ✓')
      }
      setShowTradeForm(false)
      try { sessionStorage.setItem(FORM_OPEN,'false') } catch(e) {}
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

      {/* ── CORE VALUES BANNER — daily only, above news ── */}
      {!isWeekly && !isForecast && (
        <div style={{ marginBottom:'16px', padding:'14px 20px', background:'linear-gradient(135deg, #F7F6FF 0%, #FCFCFF 100%)', border:'1px solid #ECEAFB', borderRadius:'14px', textAlign:'center' }}>
          <div style={{ fontFamily:"'Bricolage Grotesque', sans-serif", fontSize:'13.5px', fontWeight:'600', color:'#4F46E5', letterSpacing:'.01em' }}>
            {['Health','Consciousness','Depth','Purpose','Love','Family','Growth'].join('  ·  ')}
          </div>
        </div>
      )}

      {/* ── ECONOMIC EVENTS ── */}
      {!isWeekly && !isForecast && (
        <DayNews dateStr={dateStr} onEventsLoaded={evs => { setEconSnapshot(evs); markDirty() }} savedEvents={econSnapshot} />
      )}
      {isWeekly && weekRange && (
        <WeeklyEconNews weekRange={weekRange} useNextWeek={false} onEventsLoaded={evs => { setEconSnapshot(evs); markDirty() }} savedEvents={econSnapshot} />
      )}
      {isForecast && weekRange && (
        <WeeklyEconNews weekRange={weekRange} useNextWeek={true} onEventsLoaded={evs => { setEconSnapshot(evs); markDirty() }} savedEvents={econSnapshot} />
      )}

      {/* ── DAY PLAN CARD ── */}
      {!isWeekly && !isForecast && (
        <div style={{ order:1, background:'#FFFFFF', borderRadius:'20px', boxShadow:'0 1px 3px rgba(0,0,0,.06),0 8px 24px rgba(0,0,0,.05)', marginBottom:'16px', overflow:'hidden' }}>
          <div style={{ padding:'18px 24px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ width:'32px', height:'32px', borderRadius:'10px', background:'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>📋</div>
              <span style={{ fontSize:'14px', fontWeight:'600', color:'#0F172A' }}>Day Plan</span>
            </div>
            {noteDirty && <span style={{ fontSize:'11px', color:'#94A3B8', fontStyle:'italic' }}>Unsaved changes</span>}
          </div>
          <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:'18px' }}>
            <div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#64748B', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'8px' }}>Mindset Going Into the Day</label>
              <AutoTextarea value={mood} onChange={e => { setMood(e.target.value); markDirty() }} placeholder="How are you feeling mentally? Focused, patient, distracted, emotional..." minHeight={70} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#64748B', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'8px' }}>Trading Plan</label>
              <AutoTextarea value={plan} onChange={e => { setPlan(e.target.value); markDirty() }} placeholder="What are you watching? Key levels, bias read, what needs to happen for you to take a trade..." minHeight={110} />
            </div>
            {/* Chart Images */}
            <div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#64748B', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'12px' }}>Chart Images</label>
              <ChartList charts={charts} setCharts={setCharts} markDirty={markDirty} isForecast={false} />
            </div>
          </div>
        </div>
      )}

      {/* ── FORECAST CARD (Sunday) ── */}
      {isForecast && (
        <div style={{ order:1, background:'#FFFFFF', borderRadius:'20px', boxShadow:'0 1px 3px rgba(0,0,0,.06),0 8px 24px rgba(0,0,0,.05)', marginBottom:'16px', overflow:'hidden' }}>
          <div style={{ padding:'18px 24px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ width:'32px', height:'32px', borderRadius:'10px', background:'#F3E8FF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>📋</div>
              <span style={{ fontSize:'14px', fontWeight:'600', color:'#0F172A' }}>Weekly Forecast</span>
            </div>
            {noteDirty && <span style={{ fontSize:'11px', color:'#94A3B8', fontStyle:'italic' }}>Unsaved changes</span>}
          </div>
          <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:'18px' }}>
            <div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#64748B', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'8px' }}>Plan for the Week</label>
              <AutoTextarea value={plan} onChange={e => { setPlan(e.target.value); markDirty() }} placeholder="Macro backdrop, key themes, currencies to focus on, what you need to see to trade..." minHeight={120} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#64748B', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'12px' }}>Charts to Watch</label>
              <ChartList charts={charts} setCharts={setCharts} markDirty={markDirty} isForecast={true} />
            </div>
            <button onClick={saveNote} disabled={saving}
              style={{ alignSelf:'flex-start', background:saving?'#E2E8F0':'#0F172A', color:saving?'#94A3B8':'#FFFFFF', border:'none', borderRadius:'12px', padding:'11px 24px', fontSize:'13px', fontWeight:'600', cursor:saving?'default':'pointer', fontFamily:'inherit', letterSpacing:'-.01em', boxShadow:saving?'none':'0 4px 14px rgba(15,23,42,.25)', transition:'all .15s' }}>
              {saving?'Saving...':autoSaving?'Auto-saving...':'Save Forecast'}
            </button>
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
            <div ref={tradeFormRef}>
            {showTradeForm && editingTrade && (
              <TradeForm key={editingTrade.id} onSave={handleAddTrade} initialData={editingTrade} onCancel={() => { setShowTradeForm(false); setEditingTrade(null); try { sessionStorage.setItem(FORM_OPEN,'false') } catch(e) {} }} />
            )}
            </div>
            <div style={{ display:'grid', gridTemplateColumns: weekTrades.length > 1 ? 'repeat(auto-fit, minmax(300px, 1fr))' : '1fr', gap:'12px' }}>
              {weekTrades.map(t => <TradeCard key={t.id} t={t} onDelete={onDeleteTrade} onEdit={startEditTrade} onOpenDay={onOpenJournal ? (d => onOpenJournal(d, false)) : null} />)}
            </div>
          </div>
        )}
        {!isWeekly && !isForecast && (
          <>
            <div ref={tradeFormRef}>
            {showTradeForm && (
              <TradeForm key={editingTrade ? editingTrade.id : 'new'} onSave={handleAddTrade} initialData={editingTrade} onCancel={() => { setShowTradeForm(false); setEditingTrade(null); try { sessionStorage.setItem(FORM_OPEN,'false') } catch(e) {} }} />
            )}
            </div>
            <div style={{ display:'grid', gridTemplateColumns: dayTrades.length > 1 ? 'repeat(auto-fit, minmax(300px, 1fr))' : '1fr', gap:'12px' }}>
              {dayTrades.map(t => <TradeCard key={t.id} t={t} onDelete={onDeleteTrade} onEdit={startEditTrade} />)}
            </div>
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
              <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#64748B', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'12px' }}>Charts</label>
              <ChartList charts={charts} setCharts={setCharts} markDirty={markDirty} isForecast={false} />
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

      {/* ── DAILY GRADING CARD — daily only ── */}
      {!isWeekly && !isForecast && (() => {
        const rated = grades.filter(g => g > 0)
        const total = rated.reduce((s, g) => s + g, 0)
        const maxTotal = GRADE_ITEMS.length * 5
        const avg = rated.length ? (total / rated.length) : 0
        const pct = Math.round((total / maxTotal) * 100)
        const avgColor = pct >= 80 ? '#10B981' : pct >= 60 ? '#D97706' : pct > 0 ? '#EF4444' : '#94A3B8'
        return (
        <div style={{ order:5, background:'#FFFFFF', borderRadius:'20px', boxShadow:'0 1px 3px rgba(0,0,0,.06),0 8px 24px rgba(0,0,0,.05)', marginBottom:'16px', overflow:'hidden' }}>
          <div style={{ padding:'18px 24px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'32px', height:'32px', borderRadius:'10px', background:'#EEF0FE', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>🎯</div>
            <span style={{ fontSize:'14px', fontWeight:'600', color:'#0F172A' }}>Performance Grading</span>
            <span style={{ fontSize:'11px', color:'#94A3B8', marginLeft:'auto' }}>Rate how you acted today, 1–5</span>
          </div>
          <div style={{ padding:'14px 24px 20px' }}>
            {GRADE_ITEMS.map((item, i) => {
              const val = grades[i] || 0
              const showWhy = val >= 1 && val <= 4
              return (
                <div key={i} style={{ padding:'12px 0', borderBottom: i < GRADE_ITEMS.length-1 ? '1px solid #F8FAFC' : 'none' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                    <span style={{ fontSize:'13.5px', fontWeight:'600', color:'#334155', flex:1 }}>{item}</span>
                    <div style={{ display:'flex', gap:'4px' }}>
                      {[1,2,3,4,5].map(n => (
                        <button key={n} type="button" onClick={() => { const g=[...grades]; while(g.length<GRADE_ITEMS.length) g.push(0); g[i] = (g[i]===n ? 0 : n); setGrades(g); markDirty() }}
                          style={{ width:'28px', height:'28px', borderRadius:'8px', border:`1.5px solid ${val>=n?'#4F46E5':'#E2E8F0'}`, background: val>=n?'#4F46E5':'transparent', color: val>=n?'#fff':'#CBD5E1', fontSize:'12px', fontWeight:'700', cursor:'pointer', fontFamily:"'JetBrains Mono',monospace", transition:'all .12s', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  {showWhy && (
                    <div style={{ marginTop:'10px' }}>
                      <AutoTextarea value={gradeReasons[i] || ''} onChange={e => { const r=[...gradeReasons]; while(r.length<GRADE_ITEMS.length) r.push(''); r[i]=e.target.value; setGradeReasons(r); markDirty() }}
                        placeholder="Why not a 5?" minHeight={44}
                        style={{ background:'#FEF9F4', border:'1.5px solid #FBE2C8', borderRadius:'10px', fontSize:'12.5px' }} />
                    </div>
                  )}
                </div>
              )
            })}
            {/* Total */}
            <div style={{ marginTop:'16px', padding:'16px 18px', background:'#F8FAFC', borderRadius:'14px', border:'1px solid #E2E8F0', display:'flex', alignItems:'center', gap:'16px' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'10px', fontWeight:'700', color:'#64748B', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:'4px' }}>Daily Score</div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'30px', fontWeight:'700', color:avgColor, letterSpacing:'-.04em', lineHeight:1 }}>
                  {rated.length ? pct : 0}<span style={{ fontSize:'18px' }}>%</span>
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'15px', fontWeight:'700', color:'#94A3B8' }}>{total}<span style={{ fontSize:'11px' }}>/{maxTotal}</span></div>
                <div style={{ fontSize:'10px', color:'#94A3B8', fontWeight:'600', marginTop:'2px' }}>{rated.length}/{GRADE_ITEMS.length} rated</div>
              </div>
            </div>
            <button onClick={saveNote} disabled={saving}
              style={{ marginTop:'16px', background: saving ? '#E2E8F0' : '#0F172A', color: saving ? '#94A3B8' : '#FFFFFF', border:'none', borderRadius:'12px', padding:'11px 24px', fontSize:'13px', fontWeight:'600', cursor: saving ? 'default' : 'pointer', fontFamily:'inherit', letterSpacing:'-.01em', boxShadow: saving ? 'none' : '0 4px 14px rgba(15,23,42,.25)', transition:'all .15s' }}>
              {saving ? 'Saving...' : autoSaving ? 'Auto-saving...' : 'Save Grading'}
            </button>
          </div>
        </div>
        )
      })()}

    </div>
  )
}
