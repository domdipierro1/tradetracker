import { useState, useEffect, useCallback } from 'react'
import { computeStats, f2 } from '../lib/stats'
import { useEconomicCalendar, currencyFlag, formatFFTime } from '../lib/useEconomicCalendar'

// ── CONSTANTS ────────────────────────────────────────────────────
const TIMES   = ['02:00','02:30','03:00','03:30','04:00','04:30','05:00','05:30','06:00','06:30','07:00','07:30','08:00','08:30','09:00','09:30','10:00']
const SYMBOLS = ['AUD/USD','EUR/USD','GBP/USD','NZD/USD','USD/CAD','USD/CHF','USD/JPY','NQ','ES','Gold','Silver']
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
  const [chart3,     setChart3]     = useState('')
  const [chart4,     setChart4]     = useState('')
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
      setChart3(existingNote.week_summary || '')
      setChart4(existingNote.top_mistake || '')
      setEodReview(existingNote.trading_errors || '')
      setFollowedPlan(existingNote.consistency || '')
      setWentWell(existingNote.what_worked || '')
      setImprove(existingNote.improvements || '')
    } else {
      setMood(''); setBias(''); setPlan(''); setChart1(''); setChart2('')
      setEodReview(''); setFollowedPlan(''); setWentWell(''); setImprove('')
      setChart3(''); setChart4('')
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
        week_summary:     chart3,
        top_mistake:      chart4,
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
    <div style={{ padding:'24px', maxWidth:'860px', margin:'0 auto' }}>

      {/* ── HEADER ── */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'24px', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <div style={{ fontSize:'11px', fontWeight:'600', color:'#94A3B8', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:'6px' }}>
            {isWeekly ? 'Weekly Review' : isToday ? 'Today' : 'Daily Journal'}
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
          {saving ? 'Saving...' : isWeekly ? 'Save Week' : 'Save Day'}
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
      <div style={{ background:'#FFFFFF', borderRadius:'20px', boxShadow:'0 1px 3px rgba(0,0,0,.06),0 8px 24px rgba(0,0,0,.05)', marginBottom:'16px', overflow:'hidden' }}>
        {/* Card header */}
        <div style={{ padding:'18px 24px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'32px', height:'32px', borderRadius:'10px', background: isWeekly ? '#F3E8FF' : '#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>
              {isWeekly ? '🗓' : '📋'}
            </div>
            <span style={{ fontSize:'14px', fontWeight:'600', color:'#0F172A' }}>{isWeekly ? 'Weekly Plan & Reflection' : 'Day Plan'}</span>
          </div>
          {noteDirty && <span style={{ fontSize:'11px', color:'#94A3B8', fontStyle:'italic' }}>Unsaved changes</span>}
        </div>

        <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:'18px' }}>
          {/* Mood + Bias */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
            <div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#64748B', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'8px' }}>
                {isWeekly ? 'Mental State' : 'Feeling'}
              </label>
              <textarea value={mood} onChange={e => { setMood(e.target.value); markDirty() }}
                placeholder={isWeekly ? "How did you feel this week? Patient, disciplined, emotional?" : "How are you feeling going into today's session?"}
                style={{ width:'100%', background:'#F8FAFC', border:'1.5px solid #E2E8F0', borderRadius:'12px', padding:'12px 14px', fontSize:'13px', color:'#0F172A', fontFamily:'inherit', outline:'none', resize:'vertical', minHeight:'70px', lineHeight:'1.6', transition:'border-color .15s', boxSizing:'border-box' }}
                onFocus={e => e.target.style.borderColor='#6366F1'}
                onBlur={e => e.target.style.borderColor='#E2E8F0'} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#64748B', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'8px' }}>
                {isWeekly ? 'Bias Next Week' : 'Bias Today'}
              </label>
              <input value={bias} onChange={e => { setBias(e.target.value); markDirty() }}
                placeholder={isWeekly ? "Directional bias heading into next week..." : "e.g. Bearish NQ, Bullish GBP/USD..."}
                style={{ width:'100%', background:'#F8FAFC', border:'1.5px solid #E2E8F0', borderRadius:'12px', padding:'12px 14px', fontSize:'13px', color:'#0F172A', fontFamily:'inherit', outline:'none', transition:'border-color .15s', boxSizing:'border-box' }}
                onFocus={e => e.target.style.borderColor='#6366F1'}
                onBlur={e => e.target.style.borderColor='#E2E8F0'} />
            </div>
          </div>

          {/* Plan textarea */}
          <div>
            <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#64748B', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'8px' }}>
              {isWeekly ? 'Week Summary' : 'Trading Plan'}
            </label>
            <textarea value={plan} onChange={e => { setPlan(e.target.value); markDirty() }}
              placeholder={isWeekly ? "Overall week — key themes, market behaviour, notable setups, observations..." : "What are you watching? Key levels, bias read, what needs to happen for you to take a trade..."}
              style={{ width:'100%', background:'#F8FAFC', border:'1.5px solid #E2E8F0', borderRadius:'12px', padding:'14px 16px', fontSize:'13px', color:'#0F172A', fontFamily:'inherit', outline:'none', resize:'vertical', minHeight:'110px', lineHeight:'1.7', transition:'border-color .15s', boxSizing:'border-box' }}
              onFocus={e => e.target.style.borderColor='#6366F1'}
              onBlur={e => e.target.style.borderColor='#E2E8F0'} />
          </div>

          {/* Chart images */}
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
              <label style={{ fontSize:'11px', fontWeight:'600', color:'#64748B', letterSpacing:'.06em', textTransform:'uppercase' }}>Chart Images</label>
              {[chart1,chart2,chart3,chart4].filter(v=>v&&v.trim()).length < 4 && (
                <button type="button" onClick={() => {
                  if (!chart1) { setChart1(' '); markDirty() }
                  else if (!chart2) { setChart2(' '); markDirty() }
                  else if (!chart3) { setChart3(' '); markDirty() }
                  else if (!chart4) { setChart4(' '); markDirty() }
                }}
                  style={{ background:'#F8FAFC', border:'1.5px solid #E2E8F0', borderRadius:'8px', padding:'6px 12px', fontSize:'12px', fontWeight:'600', color:'#475569', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:'5px' }}>
                  <span style={{ fontSize:'14px', lineHeight:1 }}>+</span> Add Chart
                </button>
              )}
            </div>
            {[[chart1,setChart1,'HTF Context'],[chart2,setChart2,'Entry Chart'],[chart3,setChart3,'Chart 3'],[chart4,setChart4,'Chart 4']].map(([val,setter,label],idx) => val ? (
              <div key={idx} style={{ marginBottom:'14px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'8px' }}>
                  <span style={{ fontSize:'11px', fontWeight:'600', color:'#64748B', textTransform:'uppercase', letterSpacing:'.05em' }}>{label}</span>
                  <button type="button" onClick={() => { setter(''); markDirty() }}
                    style={{ background:'none', border:'none', color:'#CBD5E1', cursor:'pointer', fontSize:'13px', padding:'0', lineHeight:1, fontWeight:'700' }}>✕</button>
                </div>
                <input type="url" value={val.trim()} onChange={e => { setter(e.target.value); markDirty() }}
                  placeholder="Paste TradingView snapshot URL..."
                  style={{ width:'100%', background:'#F8FAFC', border:'1.5px solid #E2E8F0', borderRadius:'10px', padding:'10px 14px', fontSize:'12px', color:'#0F172A', fontFamily:"'JetBrains Mono',monospace", outline:'none', marginBottom:'10px', boxSizing:'border-box', transition:'border-color .15s' }}
                  onFocus={e => e.target.style.borderColor='#6366F1'}
                  onBlur={e => e.target.style.borderColor='#E2E8F0'} />
                {val.trim() && <ChartImage url={val.trim()} label={label} large />}
              </div>
            ) : null)}
          </div>
        </div>
      </div>

      {/* ── TRADES ── */}
      <div style={{ marginBottom:'16px' }}>
        {!isWeekly && (
          <>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
              <div style={{ fontSize:'11px', fontWeight:'600', color:'#94A3B8', letterSpacing:'.08em', textTransform:'uppercase' }}>
                Trades {dayTrades.length > 0 && <span style={{ background:'#F1F5F9', color:'#475569', borderRadius:'6px', padding:'1px 7px', marginLeft:'4px', fontSize:'10px' }}>{dayTrades.length}</span>}
              </div>
              {!showTradeForm && (
                <button onClick={openTradeForm}
                  style={{ background:'#0F172A', color:'#FFFFFF', border:'none', borderRadius:'10px', padding:'8px 16px', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:'inherit', letterSpacing:'-.01em', boxShadow:'0 2px 8px rgba(15,23,42,.2)' }}>
                  + Log Trade
                </button>
              )}
            </div>
            {showTradeForm && (
              <div style={{ marginBottom:'14px' }}>
                <TradeForm onSave={handleAddTrade} onCancel={() => { setShowTradeForm(false); try { sessionStorage.setItem(FORM_OPEN,'false') } catch(e) {} }} />
              </div>
            )}
            {dayTrades.length === 0 && !showTradeForm && (
              <div style={{ padding:'32px', textAlign:'center', background:'#FFFFFF', borderRadius:'16px', border:'1.5px dashed #E2E8F0', color:'#94A3B8', fontSize:'13px' }}>
                No trades logged for this day
              </div>
            )}
            {dayTrades.map(t => <TradeCard key={t.id} t={t} onDelete={isToday ? onDeleteTrade : null} />)}
          </>
        )}
        {isWeekly && (
          <>
            <div style={{ fontSize:'11px', fontWeight:'600', color:'#94A3B8', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:'12px' }}>
              Week Trades {weekTrades.length > 0 && <span style={{ background:'#F1F5F9', color:'#475569', borderRadius:'6px', padding:'1px 7px', marginLeft:'4px', fontSize:'10px' }}>{weekTrades.length}</span>}
            </div>
            {weekTrades.length === 0
              ? <div style={{ padding:'32px', textAlign:'center', background:'#FFFFFF', borderRadius:'16px', border:'1.5px dashed #E2E8F0', color:'#94A3B8', fontSize:'13px' }}>No trades logged this week</div>
              : weekTrades.map(t => <TradeCard key={t.id} t={t} onDelete={null} />)
            }
          </>
        )}
      </div>

      {/* ── END OF DAY / WEEK REVIEW ── */}
      <div style={{ background:'#FFFFFF', borderRadius:'20px', boxShadow:'0 1px 3px rgba(0,0,0,.06),0 8px 24px rgba(0,0,0,.05)', marginBottom:'16px', overflow:'hidden' }}>
        <div style={{ padding:'18px 24px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'32px', height:'32px', borderRadius:'10px', background:'#ECFDF5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>
            {isWeekly ? '📊' : '✍️'}
          </div>
          <span style={{ fontSize:'14px', fontWeight:'600', color:'#0F172A' }}>{isWeekly ? 'End of Week Review' : 'End of Day Review'}</span>
        </div>

        <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:'18px' }}>
          {/* Followed plan pills */}
          <div>
            <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#64748B', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'10px' }}>
              {isWeekly ? 'Did you follow your rules this week?' : 'Did you follow your plan?'}
            </label>
            <div style={{ display:'flex', gap:'8px' }}>
              {['Yes','Mostly','No'].map(v => (
                <button key={v} type="button" onClick={() => { setFollowedPlan(v); markDirty() }}
                  style={{
                    padding:'8px 18px', borderRadius:'10px', fontSize:'12px', fontWeight:'600',
                    border:`1.5px solid ${followedPlan===v ? (v==='Yes'?'#10B981':v==='Mostly'?'#F59E0B':'#EF4444') : '#E2E8F0'}`,
                    background: followedPlan===v ? (v==='Yes'?'#ECFDF5':v==='Mostly'?'#FFFBEB':'#FEF2F2') : '#F8FAFC',
                    color: followedPlan===v ? (v==='Yes'?'#065F46':v==='Mostly'?'#92400E':'#7F1D1D') : '#94A3B8',
                    cursor:'pointer', fontFamily:'inherit', transition:'all .15s'
                  }}>
                  {v==='Yes'?'✓ Yes':v==='Mostly'?'~ Mostly':'✗ No'}
                </button>
              ))}
            </div>
          </div>

          {/* How did it go */}
          <div>
            <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#64748B', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'8px' }}>
              {isWeekly ? 'How did the week go?' : 'How did the session go?'}
            </label>
            <textarea value={eodReview} onChange={e => { setEodReview(e.target.value); markDirty() }}
              placeholder={isWeekly ? "Overall feel of the week — market conditions, your execution, what stood out..." : "Overall feel of the session — how price moved, your execution, anything notable..."}
              style={{ width:'100%', background:'#F8FAFC', border:'1.5px solid #E2E8F0', borderRadius:'12px', padding:'14px 16px', fontSize:'13px', color:'#0F172A', fontFamily:'inherit', outline:'none', resize:'vertical', minHeight:'90px', lineHeight:'1.7', transition:'border-color .15s', boxSizing:'border-box' }}
              onFocus={e => e.target.style.borderColor='#10B981'}
              onBlur={e => e.target.style.borderColor='#E2E8F0'} />
          </div>

          {/* Went well / Improve */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
            <div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#10B981', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'8px' }}>What went well</label>
              <textarea value={wentWell} onChange={e => { setWentWell(e.target.value); markDirty() }}
                placeholder={isWeekly ? "Best decisions, good habits, what worked..." : "Execution, patience, market reads..."}
                style={{ width:'100%', background:'#F0FDF4', border:'1.5px solid #BBF7D0', borderRadius:'12px', padding:'12px 14px', fontSize:'13px', color:'#0F172A', fontFamily:'inherit', outline:'none', resize:'vertical', minHeight:'80px', lineHeight:'1.6', transition:'border-color .15s', boxSizing:'border-box' }}
                onFocus={e => e.target.style.borderColor='#10B981'}
                onBlur={e => e.target.style.borderColor='#BBF7D0'} />
            </div>
            <div>
              <label style={{ display:'block', fontSize:'11px', fontWeight:'600', color:'#EF4444', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'8px' }}>What to improve</label>
              <textarea value={improve} onChange={e => { setImprove(e.target.value); markDirty() }}
                placeholder={isWeekly ? "One key focus for next week..." : "One specific thing for tomorrow..."}
                style={{ width:'100%', background:'#FEF2F2', border:'1.5px solid #FECACA', borderRadius:'12px', padding:'12px 14px', fontSize:'13px', color:'#0F172A', fontFamily:'inherit', outline:'none', resize:'vertical', minHeight:'80px', lineHeight:'1.6', transition:'border-color .15s', boxSizing:'border-box' }}
                onFocus={e => e.target.style.borderColor='#EF4444'}
                onBlur={e => e.target.style.borderColor='#FECACA'} />
            </div>
          </div>

          {/* Save */}
          <button onClick={saveNote} disabled={saving}
            style={{ alignSelf:'flex-start', background: saving ? '#E2E8F0' : '#0F172A', color: saving ? '#94A3B8' : '#FFFFFF', border:'none', borderRadius:'12px', padding:'11px 24px', fontSize:'13px', fontWeight:'600', cursor: saving ? 'default' : 'pointer', fontFamily:'inherit', letterSpacing:'-.01em', boxShadow: saving ? 'none' : '0 4px 14px rgba(15,23,42,.25)', transition:'all .15s' }}>
            {saving ? 'Saving...' : isWeekly ? 'Save Week' : 'Save Day'}
          </button>
        </div>
      </div>

      <div style={{ height:'20px' }} />
    </div>
  )
}
