import { useState, useEffect, useCallback } from 'react'
import { computeStats, f2 } from '../lib/stats'
import { useEconomicCalendar, currencyFlag, formatFFTime } from '../lib/useEconomicCalendar'

// ── CONSTANTS ────────────────────────────────────────────────────
const MOODS   = ['Focused','Confident','Patient','Calm','Anxious','Rushed','Tired','Distracted','Tilted']
const TIMES   = ['02:00','02:30','03:00','03:30','04:00','04:30','05:00','05:30','06:00','06:30','07:00','07:30','08:00','08:30','09:00','09:30','10:00']
const SYMBOLS = ['AUD/USD','EUR/USD','GBP/USD','NZD/USD','USD/CHF','USD/CAD','USD/JPY','NQ','ES','YM','DAX','UK100','Gold','Silver','EUR/AUD','EUR/CAD','EUR/JPY','EUR/NZD','EUR/GBP','GBP/AUD','GBP/CAD','GBP/JPY','GBP/NZD','AUD/NZD']
const LEVELS  = ['Prev Month High','Prev Month Low','Prev Week High','Prev Week Low','Prev Day High','Prev Day Low','4H Fair Value Gap','4H Order Block','4H Breaker Block','4H Mitigation Block','Daily Fair Value Gap','Daily Order Block','Daily Breaker Block','Daily Mitigation Block']
const MISTAKES= ['No mistake','Wrong bias','Level not aligned with bias','Entered outside killzone','No breaker block formed','Entered before breaker closed','Premature entry — no confirmation','Moved stop too early','Took partial too early','Revenge trade','Overtraded']

const EMPTY_TRADE = { time:'', symbol:'', direction:'', bias:'', session:'', level:'', pd_array:'', entry_tf:'', r:'', outcome:'', mistake:'No mistake', screenshot:'', screenshot2:'', journal:'' }
const TRADE_DRAFT = 'tt26_trade_draft'
const FORM_OPEN   = 'tt26_form_open'


// Get Mon-Sun range for a given date
function getWeekRange(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  const dow = d.getDay()
  const mon = new Date(d); mon.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
  const fmt = dt => dt.toISOString().split('T')[0]
  return { mon: fmt(mon), sun: fmt(sun) }
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
function DayNews({ dateStr }) {
  const { eventsForDate, loading } = useEconomicCalendar()
  const events = eventsForDate(dateStr)
  if (loading || events.length === 0) return null
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
      await onSave({ ...form, r_multiple: rVal, pl: rVal, risk: 1 })
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
          <label className="form-label">HTF Chart URL</label>
          <input className="form-input" type="url" value={form.screenshot} onChange={set('screenshot')} placeholder="Paste TradingView snapshot URL..." />
        </div>
        <div className="form-group">
          <label className="form-label">Entry Chart URL</label>
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
  const up = (t.pl||0) >= 0
  const ob = o => o==='Win'?'badge-win':o==='Loss'?'badge-loss':'badge-be'
  return (
    <div style={{ border:`1px solid ${up?'var(--green-dim)':'var(--red-dim)'}`, borderRadius:'var(--r)', marginBottom:'12px', background:'var(--surface)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
      {/* Header */}
      <div style={{ padding:'12px 16px', background: up?'var(--green-bg)':'var(--red-bg)', display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', borderBottom:'1px solid var(--border)' }}>
        <span style={{ fontWeight:'700', fontSize:'14px' }}>{t.symbol||'—'}</span>
        {t.time && <span style={{ fontSize:'11px', color:'var(--muted)', fontFamily:"'JetBrains Mono',monospace" }}>{t.time} NY</span>}
        {t.direction && <span className={`badge badge-${t.direction.toLowerCase()}`}>{t.direction}</span>}
        {t.outcome && <span className={`badge ${ob(t.outcome)}`}>{t.outcome}</span>}
        <span style={{ marginLeft:'auto', fontFamily:"'JetBrains Mono',monospace", fontSize:'15px', fontWeight:'700', color: up?'var(--green)':'var(--red)' }}>{f2(t.pl||t.r_multiple||0)}</span>
        {onDelete && <button onClick={() => { if(window.confirm('Delete this trade?')) onDelete(t.id) }} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:'12px', padding:'0 2px' }}>✕</button>}
      </div>
      {/* Details */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', borderBottom:'1px solid var(--border)' }}>
        {[['Bias',t.bias],['Session',t.session],['Key Level',t.level||t.setup],['P/D',t.pd_array],['Entry TF',t.entry_tf||t.smt],['Risk',t.risk?`${t.risk}%`:null],['R',t.r_multiple?`${t.r_multiple}R`:null]].filter(([,v])=>v).map(([l,v],i)=>(
          <div key={i} style={{ padding:'9px 14px', borderRight:'1px solid var(--border)', borderBottom:'1px solid var(--border)' }}>
            <div style={{ fontSize:'9px', fontWeight:'600', color:'var(--muted)', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:'2px' }}>{l}</div>
            <div style={{ fontSize:'12px', color:'var(--text2)' }}>{v}</div>
          </div>
        ))}
      </div>
      {/* Mistake */}
      {t.mistake && t.mistake !== 'No mistake' && (
        <div style={{ padding:'9px 16px', background:'var(--red-bg)', borderBottom:'1px solid var(--border)', fontSize:'12px', color:'var(--red)' }}>⚠️ {t.mistake}</div>
      )}
      {/* Journal */}
      {t.journal && (
        <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ fontSize:'9px', fontWeight:'600', color:'var(--muted)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'5px' }}>Trade Notes</div>
          <div style={{ fontSize:'13px', color:'var(--text)', lineHeight:'1.7', whiteSpace:'pre-wrap' }}>{t.journal}</div>
        </div>
      )}
      {/* Charts - inline display */}
      {(t.screenshot || t.screenshot2) && (
        <div style={{ padding:'14px 16px' }}>
          <div style={{ fontSize:'9px', fontWeight:'600', color:'var(--muted)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'10px' }}>Charts</div>
          <div style={{ display:'grid', gridTemplateColumns: t.screenshot && t.screenshot2 ? '1fr 1fr' : '1fr', gap:'12px' }}>
            {t.screenshot  && <ChartImage url={t.screenshot}  label="HTF Context" large />}
            {t.screenshot2 && <ChartImage url={t.screenshot2} label="Entry Chart"  large />}
          </div>
        </div>
      )}
    </div>
  )
}

// ── MAIN COMPONENT ───────────────────────────────────────────────
export default function DailyJournal({ trades, dailyNotes, onSaveNote, onDeleteNote, onAddTrade, onDeleteTrade, toast, dateStr: propDateStr, isWeekly: propIsWeekly }) {
  const today = toDateStr(new Date())
  const [dateStr, setDateStr] = useState(propDateStr || today)
  const isWeekly = propIsWeekly || false
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
  const weekRange = isWeekly ? getWeekRange(dateStr) : null
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
  const [eodReview,  setEodReview]  = useState('')
  const [followedPlan, setFollowedPlan] = useState('')
  const [wentWell,   setWentWell]   = useState('')
  const [improve,    setImprove]    = useState('')
  const [noteDirty,  setNoteDirty]  = useState(false)

  // Load note data when date changes
  useEffect(() => {
    if (existingNote) {
      setMood(existingNote.mood || '')
      setBias(existingNote.htf_bias || '')
      setPlan(existingNote.market_conditions || '')
      setChart1(existingNote.observations || '')
      setChart2(existingNote.execution_review || '')
      setEodReview(existingNote.trading_errors || '')
      setFollowedPlan(existingNote.consistency || '')
      setWentWell(existingNote.what_worked || '')
      setImprove(existingNote.improvements || '')
    } else {
      setMood(''); setBias(''); setPlan(''); setChart1(''); setChart2('')
      setEodReview(''); setFollowedPlan(''); setWentWell(''); setImprove('')
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
        note_type:        isWeekly ? 'week' : 'day',
        note:             plan,
        mood,
        htf_bias:         bias,
        market_conditions: plan,
        observations:     chart1,
        execution_review: chart2,
        trading_errors:   eodReview,
        consistency:      followedPlan,
        what_worked:      wentWell,
        improvements:     improve,
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
    <div className="page active">

      {/* ── PAGE HEADER ── */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'10px' }}>
        <div>
          <h1 style={{ fontSize:'18px', fontWeight:'600', color:'var(--text)', letterSpacing:'-.02em' }}>
            {isWeekly ? 'Weekly Review' : isToday ? 'Today' : displayDate}
          </h1>
          {isWeekly && weekRange && (
            <div style={{ fontSize:'12px', color:'var(--muted)', marginTop:'2px' }}>
              Week of {new Date(weekRange.mon+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'})} – {new Date(weekRange.sun+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
            </div>
          )}
          {!isWeekly && !isToday && <div style={{ fontSize:'12px', color:'var(--muted)', marginTop:'2px' }}>{displayDate}</div>}
        </div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          {noteDirty && (
            <button className="btn btn-blue btn-sm" onClick={saveNote} disabled={saving}>
              {saving ? 'Saving...' : '💾 Save'}
            </button>
          )}
        </div>
      </div>

      {/* ── WEEKLY STATS BAR ── */}
      {isWeekly && weekTrades.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))', gap:'8px', marginBottom:'14px' }}>
          {[
            { label:'Week R',   v: f2(weekR),    col: weekR>=0?'var(--green)':'var(--red)' },
            { label:'Trades',   v: weekTrades.length, col:'var(--text)' },
            { label:'Wins',     v: weekWins,     col:'var(--green)' },
            { label:'Losses',   v: weekLosses,   col: weekLosses>0?'var(--red)':'var(--text)' },
          ].map((s,i) => (
            <div key={i} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', padding:'10px 13px', boxShadow:'var(--shadow)' }}>
              <div style={{ fontSize:'9px', fontWeight:'600', color:'var(--muted)', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:'3px' }}>{s.label}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'17px', fontWeight:'600', color:s.col }}>{s.v}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── TODAY'S NEWS ── */}
      <DayNews dateStr={dateStr} />

      {/* ── DAY STATS (if trades exist and not weekly) ── */}
      {!isWeekly && dayTrades.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))', gap:'8px', marginBottom:'14px' }}>
          {[
            { label:'Total R', v: f2(dayPL), col: dayUp?'var(--green)':'var(--red)' },
            { label:'Trades',  v: dayTrades.length, col:'var(--text)' },
            { label:'Wins',    v: wins,    col:'var(--green)' },
            { label:'Losses',  v: losses,  col: losses>0?'var(--red)':'var(--text)' },
          ].map((s,i) => (
            <div key={i} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', padding:'10px 13px', boxShadow:'var(--shadow)' }}>
              <div style={{ fontSize:'9px', fontWeight:'600', color:'var(--muted)', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:'3px' }}>{s.label}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'17px', fontWeight:'600', color:s.col }}>{s.v}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── THE DAY PLAN ── */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--shadow)', marginBottom:'14px' }}>
        <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border)', background:'var(--blue-bg)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:'11px', fontWeight:'600', color: isWeekly ? 'var(--purple)' : 'var(--blue)' }}>{isWeekly ? '📋 Weekly Review' : '📋 Day Plan'}</span>
          {noteDirty && <span style={{ fontSize:'10px', color:'var(--muted)', fontStyle:'italic' }}>Unsaved changes</span>}
        </div>
        <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:'14px' }}>

          {/* Mood + Bias row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
            <div className="form-group">
              <label className="form-label">Mood</label>
              <select className="form-input" value={mood} onChange={e => { setMood(e.target.value); markDirty() }}>
                <option value="">How are you feeling?</option>
                {MOODS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Bias Today</label>
              <input className="form-input" value={bias} onChange={e => { setBias(e.target.value); markDirty() }} placeholder={isWeekly ? "Overall bias heading into next week..." : "e.g. Bearish NQ, Bullish GBP/USD..."} />
            </div>
          </div>

          {/* Trading Plan */}
          <div className="form-group">
            <label className="form-label">{isWeekly ? "Week Summary" : "Trading Plan"}</label>
            <textarea className="form-input" value={plan} onChange={e => { setPlan(e.target.value); markDirty() }}
              placeholder={isWeekly ? "Overall week summary — how did the week go, key themes, what you observed..." : "What are you watching today? Key levels, your bias read, what you need to see to take a trade..."}
              style={{ minHeight:'100px' }} />
          </div>

          {/* Chart images */}
          <div>
            <div style={{ fontSize:'10px', fontWeight:'600', color:'var(--muted)', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:'10px' }}>Chart Images</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px' }}>
              <div className="form-group">
                <label className="form-label">Chart 1 URL</label>
                <input className="form-input" type="url" value={chart1} onChange={e => { setChart1(e.target.value); markDirty() }} placeholder="Paste TradingView snapshot URL..." />
              </div>
              <div className="form-group">
                <label className="form-label">Chart 2 URL</label>
                <input className="form-input" type="url" value={chart2} onChange={e => { setChart2(e.target.value); markDirty() }} placeholder="Paste TradingView snapshot URL..." />
              </div>
            </div>
            {(chart1 || chart2) && (
              <div style={{ display:'grid', gridTemplateColumns: chart1 && chart2 ? '1fr 1fr' : '1fr', gap:'12px' }}>
                <ChartImage url={chart1} label="Chart 1" large />
                <ChartImage url={chart2} label="Chart 2" large />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── TRADES ── */}
      <div style={{ marginBottom:'14px' }}>
        {!isWeekly && (
          <>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
              <span style={{ fontSize:'11px', fontWeight:'600', color:'var(--muted)', letterSpacing:'.07em', textTransform:'uppercase' }}>
                Trades {dayTrades.length > 0 && `(${dayTrades.length})`}
              </span>
              {!showTradeForm && (
                <button className="btn btn-blue btn-sm" onClick={openTradeForm}>+ Log Trade</button>
              )}
            </div>
            {showTradeForm && (
              <div style={{ marginBottom:'14px' }}>
                <TradeForm onSave={handleAddTrade} onCancel={() => { setShowTradeForm(false); try { sessionStorage.setItem(FORM_OPEN,'false') } catch(e) {} }} />
              </div>
            )}
            {dayTrades.length === 0 && !showTradeForm && (
              <div style={{ padding:'24px', textAlign:'center', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', color:'var(--muted)', fontSize:'13px', boxShadow:'var(--shadow)' }}>
                No trades logged for this day
              </div>
            )}
            {dayTrades.map(t => (
              <TradeCard key={t.id} t={t} onDelete={isToday ? onDeleteTrade : null} />
            ))}
          </>
        )}

        {isWeekly && (
          <>
            <div style={{ fontSize:'11px', fontWeight:'600', color:'var(--muted)', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:'12px' }}>
              Week Trades {weekTrades.length > 0 && `(${weekTrades.length})`}
            </div>
            {weekTrades.length === 0 ? (
              <div style={{ padding:'24px', textAlign:'center', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', color:'var(--muted)', fontSize:'13px', boxShadow:'var(--shadow)' }}>
                No trades logged this week
              </div>
            ) : weekTrades.map(t => (
              <TradeCard key={t.id} t={t} onDelete={null} />
            ))}
          </>
        )}
      </div>

      {/* ── END OF DAY REVIEW ── */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--shadow)', marginBottom:'14px' }}>
        <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border)', background:'var(--green-bg)' }}>
          <span style={{ fontSize:'11px', fontWeight:'600', color:'var(--green)' }}>{isWeekly ? '📝 End of Week Review' : '📝 End of Day Review'}</span>
        </div>
        <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:'14px' }}>

          <div className="form-group">
            <label className="form-label">{isWeekly ? "Did you follow your rules this week?" : "Did you follow your plan?"}</label>
            <div style={{ display:'flex', gap:'6px', paddingTop:'4px', flexWrap:'wrap' }}>
              {['Yes','Mostly','No'].map(v => (
                <button key={v} type="button" onClick={() => { setFollowedPlan(v); markDirty() }}
                  style={{ padding:'5px 14px', borderRadius:'20px', fontSize:'11px', fontWeight: followedPlan===v ? '600':'400', border:`1px solid ${followedPlan===v ? 'var(--blue-dim)':'var(--border)'}`, background: followedPlan===v ? 'var(--blue-bg)':'var(--surface2)', color: followedPlan===v ? 'var(--blue)':'var(--muted)', cursor:'pointer', fontFamily:'inherit', transition:'all .12s' }}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">How did the day go?</label>
            <textarea className="form-input" value={eodReview} onChange={e => { setEodReview(e.target.value); markDirty() }}
placeholder={isWeekly ? "How did the week go overall? Key patterns, market behaviour, notable setups..." : "Overall feel of the session, how price moved, any notable observations..."} style={{ minHeight:'80px' }} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
            <div className="form-group">
              <label className="form-label">What went well?</label>
              <textarea className="form-input" value={wentWell} onChange={e => { setWentWell(e.target.value); markDirty() }}
  placeholder={isWeekly ? "Best trades, good decisions, habits that worked..." : "Execution, patience, reading the market..."} style={{ minHeight:'70px' }} />
            </div>
            <div className="form-group">
              <label className="form-label">What to improve?</label>
              <textarea className="form-input" value={improve} onChange={e => { setImprove(e.target.value); markDirty() }}
  placeholder={isWeekly ? "Key focus for next week — one specific improvement..." : "One specific thing for tomorrow..."} style={{ minHeight:'70px' }} />
            </div>
          </div>

          <button className="btn btn-blue" onClick={saveNote} disabled={saving} style={{ alignSelf:'flex-start' }}>
            {saving ? 'Saving...' : isWeekly ? '💾 Save Week' : '💾 Save Day'}
          </button>
        </div>
      </div>
    </div>
  )
}
