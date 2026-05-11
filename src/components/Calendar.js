import { useState } from 'react'
import { computeStats, f2, f1, fP } from '../lib/stats'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MOODS = ['focused','patient','disciplined','confident','rushed','tilted','distracted','anxious']
const CONSISTENCY = ['Always followed rules','Mostly followed rules','Sometimes broke rules','Frequently broke rules']

const DAILY_FIELDS = [
  { key: 'market_conditions', label: 'Market Conditions',       icon: '🌍', placeholder: 'Trending, ranging, news-driven? What was the overall character of the session...' },
  { key: 'htf_bias',          label: 'HTF Bias',                icon: '📐', placeholder: 'Your higher timeframe read going into the session. Premium/Discount, key levels...' },
  { key: 'observations',      label: 'Observations',            icon: '👁', placeholder: 'Setups you saw, what played out, what you missed, key levels that held or broke...' },
  { key: 'execution_review',  label: 'Execution Review',        icon: '⚡', placeholder: 'How did your execution compare to your plan? Were you patient? Did you wait for confirmation?' },
  { key: 'trading_errors',    label: 'Trading Errors',          icon: '⚠️', placeholder: 'Any mistakes beyond individual trades — overtrading, chasing, ignoring rules...' },
  { key: 'improvements',      label: "What I'd Do Differently", icon: '🎯', placeholder: 'One specific, actionable thing to improve tomorrow...' },
]

const WEEKLY_FIELDS = [
  { key: 'week_summary',      label: 'Week Summary',            icon: '📊', placeholder: 'Overall performance, key moments, how the week felt as a whole...' },
  { key: 'top_mistake',       label: 'Top Mistake This Week',   icon: '⚠️', placeholder: 'Most repeated error — be specific and honest. Pattern recognition requires honesty...' },
  { key: 'what_worked',       label: 'What Worked',             icon: '✅', placeholder: 'Setups, habits, or decisions that performed well this week...' },
  { key: 'next_week_goal',    label: 'Goal for Next Week',      icon: '🎯', placeholder: 'One specific, actionable improvement target. Not vague — be precise...' },
  { key: 'rule_compliance',   label: 'Rule Compliance',         icon: '📖', placeholder: 'Did you follow your playbook? Where did you deviate and why?' },
]

function FieldInput({ field, value, onChange, readOnly }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
        <span style={{ fontSize: '14px' }}>{field.icon}</span>
        <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--muted)', letterSpacing: '.07em', textTransform: 'uppercase' }}>{field.label}</span>
      </div>
      {readOnly ? (
        <div style={{ fontSize: '13px', color: value ? 'var(--text)' : 'var(--muted2)', lineHeight: '1.7', whiteSpace: 'pre-wrap', padding: '10px 12px', background: 'var(--surface)', borderRadius: 'var(--r-xs)', border: '1px solid var(--border)', minHeight: '44px', fontStyle: value ? 'normal' : 'italic' }}>
          {value || 'Not filled in'}
        </div>
      ) : (
        <textarea value={value || ''} onChange={e => onChange(field.key, e.target.value)} placeholder={field.placeholder}
          style={{ width: '100%', minHeight: '80px', padding: '10px 12px', borderRadius: 'var(--r-xs)', border: '1.5px solid var(--border)', background: 'var(--surface2)', fontSize: '13px', color: 'var(--text)', fontFamily: 'inherit', outline: 'none', resize: 'vertical', lineHeight: '1.6', transition: 'border-color .15s, background .15s' }}
          onFocus={e => { e.target.style.borderColor = 'var(--blue)'; e.target.style.background = 'var(--surface)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--surface2)' }}
        />
      )}
    </div>
  )
}

function TradeCard({ t }) {
  const ob = o => o === 'Win' ? 'badge-win' : o === 'Loss' ? 'badge-loss' : 'badge-be'
  const gb = g => g === 'A+' ? 'badge-aplus' : g === 'A' ? 'badge-a' : g === 'B' ? 'badge-b' : 'badge-c'
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '13px', marginBottom: '10px', background: 'var(--surface2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '9px', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: '800', fontSize: '14px' }}>{t.symbol || '—'}</span>
        {t.time && <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: "'Geist Mono',monospace" }}>@ {t.time}</span>}
        {t.direction && <span className={`badge badge-${t.direction.toLowerCase()}`}>{t.direction}</span>}
        {t.outcome && <span className={`badge ${ob(t.outcome)}`}>{t.outcome}</span>}
        {t.grade && <span className={`badge ${gb(t.grade)}`}>{t.grade}</span>}
        <span className={(t.pl||0) >= 0 ? 'num-up' : 'num-dn'} style={{ marginLeft: 'auto', fontSize: '14px', fontWeight: '700' }}>{f2(t.pl||0)}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(100px,1fr))', gap: '6px', fontSize: '11px', marginBottom: (t.journal || (t.mistake && t.mistake !== 'No mistake')) ? '10px' : '0' }}>
        {[['Setup',t.setup],['Session',t.session],['Bias',t.bias],['R',t.r_multiple?`${t.r_multiple}R`:null],['Risk',t.risk?`${t.risk}%`:null]].filter(([,v])=>v).map(([l,v])=>(
          <div key={l}><span style={{ color: 'var(--muted)', fontWeight: '700' }}>{l}: </span><span style={{ color: 'var(--text2)', fontFamily: "'Geist Mono',monospace", fontWeight: '600' }}>{v}</span></div>
        ))}
      </div>
      {t.mistake && t.mistake !== 'No mistake' && <div style={{ fontSize: '12px', color: 'var(--red)', fontWeight: '600', padding: '7px 10px', background: 'var(--red-bg)', borderRadius: 'var(--r-xs)', marginBottom: t.journal ? '10px' : '0', border: '1px solid var(--red-dim)' }}>⚠️ {t.mistake}</div>}
      {t.journal && <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.65', whiteSpace: 'pre-wrap', padding: '10px 12px', background: 'var(--surface)', borderRadius: 'var(--r-xs)', border: '1px solid var(--border)' }}>{t.journal}</div>}
      {t.screenshot && <a href={t.screenshot} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '8px', fontSize: '11px', color: 'var(--blue)', fontWeight: '600', textDecoration: 'none' }}>📸 Screenshot →</a>}
    </div>
  )
}

export default function Calendar({ trades, dailyNotes, onSaveNote, onDeleteNote, toast }) {
  const [month, setMonth] = useState(new Date().getMonth())
  const [modal, setModal] = useState(null)
  const [formData, setFormData] = useState({})
  const [mood, setMood] = useState('')
  const [consistency, setConsistency] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const year = 2026
  const today = new Date().toISOString().split('T')[0]

  const moTrades = trades.filter(t => { const d = new Date(t.date); return d.getFullYear()===year && d.getMonth()===month })
  const ms = computeStats(moTrades)

  const dayMap = {}
  moTrades.forEach(t => { const d = new Date(t.date).getDate(); if (!dayMap[d]) dayMap[d]={trades:[],pl:0}; dayMap[d].trades.push(t); dayMap[d].pl+=(t.pl||0) })

  const noteMap = {}
  ;(dailyNotes||[]).forEach(n => { noteMap[n.date]=n })

  const toDateStr = d => `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  const firstDow = (new Date(year,month,1).getDay()+6)%7
  const daysInMonth = new Date(year,month+1,0).getDate()
  const totalCells = Math.ceil((firstDow+daysInMonth)/7)*7

  function dayClass(day) {
    const dow = (firstDow+day-1)%7
    const ds = toDateStr(day)
    const isToday = ds === today
    if (dow>=5 && !isToday) return 'weekend'
    const d = dayMap[day]
    if (!d||!d.trades.length) return isToday ? 'today-empty' : 'no-trade'
    return d.pl>0?'win':d.pl<0?'loss':'be'
  }

  function openDay(day) {
    const dow = (firstDow+day-1)%7
    // Sunday = dow 6, show weekly review
    if (dow===6) { openWeeklyReview(day); return }
    const ds = toDateStr(day)
    const existing = noteMap[ds]
    setFormData(existing ? {...existing} : {})
    setMood(existing?.mood||'')
    setEditing(!existing?.market_conditions)
    setModal({ type:'day', day, ds, existing: existing||null })
  }

  function openWeeklyReview(day) {
    const ds = toDateStr(day)
    const existing = noteMap[ds]
    setFormData(existing ? {...existing} : {})
    setConsistency(existing?.consistency||'')
    setEditing(!existing?.week_summary)
    setModal({ type:'week', day, ds, existing: existing||null })
  }

  function setField(key, val) { setFormData(d=>({...d,[key]:val})) }

  async function saveNote() {
    setSaving(true)
    try {
      const isWeek = modal.type==='week'
      const payload = {
        ...(modal.existing?.id ? {id: modal.existing.id} : {}),
        date: modal.ds,
        note_type: modal.type,
        mood: mood||null,
        consistency: consistency||null,
        note: isWeek ? (formData.week_summary||'') : (formData.market_conditions||formData.observations||''),
        ...formData,
      }
      const updated = await onSaveNote(payload)
      setModal(m=>({...m, existing: updated}))
      setEditing(false)
      toast('Saved ✓')
    } catch(e) { toast('Error saving: '+e.message) }
    finally { setSaving(false) }
  }

  async function deleteNote() {
    if (!modal.existing?.id) return
    if (!window.confirm('Delete this note?')) return
    await onDeleteNote(modal.existing.id)
    setModal(m=>({...m, existing:null}))
    setFormData({}); setMood(''); setConsistency(''); setEditing(true)
    toast('Deleted')
  }

  // Stats for week containing a Sunday
  function weekTrades(sundayDay) {
    const monDay = sundayDay - 6
    return moTrades.filter(t => { const d = new Date(t.date).getDate(); return d>=monDay && d<=sundayDay })
  }

  const kpis = [
    {l:'Trades',  v:ms.n,            c:'blue'},
    {l:'Wins',    v:ms.wins,         c:'up'},
    {l:'Losses',  v:ms.losses,       c:'down'},
    {l:'Win Rate',v:fP(ms.winRate),  c:ms.winRate>=.5?'up':'down'},
    {l:'P/L',     v:f2(ms.totalPL),  c:ms.totalPL>=0?'up':'down'},
    {l:'Notes',   v:(dailyNotes||[]).filter(n=>{const d=new Date(n.date);return d.getFullYear()===year&&d.getMonth()===month}).length, c:'blue'},
  ]

  const dayStyles = {
    win:       {background:'var(--green-bg)',borderColor:'var(--green-dim)'},
    loss:      {background:'var(--red-bg)',  borderColor:'var(--red-dim)'},
    be:        {background:'var(--amber-bg)',borderColor:'var(--amber-dim)'},
    'no-trade':{background:'var(--surface)', borderColor:'var(--border)'},
    weekend:   {background:'var(--surface2)',borderColor:'var(--border)',opacity:.6},
  }
  const plCol = {win:'var(--green)',loss:'var(--red)',be:'var(--amber)','no-trade':'var(--muted2)',weekend:'var(--muted2)'}
  const numCol = {win:'var(--green)',loss:'var(--red)',be:'var(--amber)','no-trade':'var(--muted)',weekend:'var(--muted2)'}

  return (
    <div className="page active">
      {/* Nav */}
      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px', flexWrap:'wrap' }}>
        <div style={{ fontSize:'20px', fontWeight:'800', color:'var(--text)', flex:1 }}>{MONTHS[month]} {year}</div>
        <button onClick={()=>setMonth(m=>Math.max(0,m-1))} style={{ width:'36px', height:'36px', borderRadius:'var(--r-xs)', border:'1.5px solid var(--border)', background:'var(--surface)', cursor:'pointer', fontSize:'18px', display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
        <button onClick={()=>setMonth(m=>Math.min(11,m+1))} style={{ width:'36px', height:'36px', borderRadius:'var(--r-xs)', border:'1.5px solid var(--border)', background:'var(--surface)', cursor:'pointer', fontSize:'18px', display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
        <select value={month} onChange={e=>setMonth(+e.target.value)} style={{ padding:'7px 12px', borderRadius:'var(--r-xs)', border:'1.5px solid var(--border)', background:'var(--surface)', fontSize:'12px', fontWeight:'600', color:'var(--text)', fontFamily:'inherit', outline:'none', cursor:'pointer' }}>
          {MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}
        </select>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))', gap:'10px', marginBottom:'18px' }}>
        {kpis.map((k,i)=>(
          <div key={i} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', padding:'11px 13px', boxShadow:'var(--shadow)' }}>
            <div style={{ fontSize:'9px', fontWeight:'800', color:'var(--muted)', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:'3px' }}>{k.l}</div>
            <div style={{ fontFamily:"'Geist Mono',monospace", fontSize:'17px', fontWeight:'700', color:k.c==='up'?'var(--green)':k.c==='down'?'var(--red)':k.c==='blue'?'var(--blue)':'var(--text)' }}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* DOW headers */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'5px', marginBottom:'5px' }}>
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d,i)=>(
          <div key={d} style={{ textAlign:'center', fontSize:'11px', fontWeight:'700', color:i===6?'var(--purple)':i<5?'var(--text2)':'var(--muted2)', padding:'5px 0', letterSpacing:'.04em' }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'5px' }}>
        {Array.from({length:totalCells},(_,i)=>{
          const day = i-firstDow+1
          if (day<1||day>daysInMonth) return <div key={i} style={{ minHeight:'82px' }} />
          const dow = (firstDow+day-1)%7
          const isSun = dow===6
          const cls = dayClass(day)
          const d = dayMap[day]
          const hasTrades = d&&d.trades.length>0
          const ds = toDateStr(day)
          const hasNote = !!noteMap[ds]
          const pl = d?d.pl:0
          const cnt = d?d.trades.length:0

          // Sunday style — purple tint
          const sunStyle = isSun ? { background:'var(--purple-bg)', borderColor:'var(--purple-dim)' } : {}

          return (
            <div key={i} onClick={()=>openDay(day)}
              style={{ ...dayStyles[cls], ...sunStyle, borderRadius:'var(--r-sm)', minHeight:'82px', padding:'8px', display:'flex', flexDirection:'column', gap:'3px', cursor:'pointer', border:'1.5px solid', transition:'all .15s', position:'relative' }}
              onMouseEnter={e=>{e.currentTarget.style.boxShadow='var(--shadow-md)';e.currentTarget.style.transform='translateY(-1px)'}}
              onMouseLeave={e=>{e.currentTarget.style.boxShadow='';e.currentTarget.style.transform=''}}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                <span style={{ fontSize:'11px', fontWeight:'700', color:isSun?'var(--purple)':numCol[cls] }}>{day}</span>
                <div style={{ display:'flex', gap:'2px' }}>
                  {hasNote && <span style={{ fontSize:'10px' }} title="Has note">📝</span>}
                  {isSun && <span style={{ fontSize:'10px' }} title="Weekly review">📋</span>}
                </div>
              </div>
              {isSun && !hasTrades && (
                <span style={{ fontSize:'10px', fontWeight:'700', color:'var(--purple)', opacity:.8, marginTop:'auto' }}>Review</span>
              )}
              {hasTrades && <>
                <span style={{ fontFamily:"'Geist Mono',monospace", fontSize:'14px', fontWeight:'700', lineHeight:'1.2', color:isSun?'var(--purple)':plCol[cls], marginTop:'auto' }}>{f1(pl)}</span>
                <span style={{ fontSize:'10px', fontWeight:'600', color:isSun?'var(--purple)':numCol[cls], opacity:.8 }}>{cnt} trade{cnt>1?'s':''}</span>
                <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 5px', borderRadius:'4px', fontSize:'9px', fontWeight:'800', letterSpacing:'.04em', background:cls==='win'?'var(--green-dim)':cls==='loss'?'var(--red-dim)':'var(--amber-dim)', color:cls==='win'?'var(--green)':cls==='loss'?'var(--red)':'var(--amber)' }}>
                  {pl>0?'WIN':pl<0?'LOSS':'BE'}
                </span>
              </>}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:'12px', marginTop:'14px', flexWrap:'wrap', alignItems:'center' }}>
        {[['var(--green-bg)','var(--green-dim)','Win'],['var(--red-bg)','var(--red-dim)','Loss'],['var(--surface)','var(--border)','No trades'],['var(--purple-bg)','var(--purple-dim)','Sunday review']].map(([bg,bc,label])=>(
          <div key={label} style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', fontWeight:'600', color:'var(--muted)' }}>
            <span style={{ width:'11px', height:'11px', borderRadius:'3px', background:bg, border:`1.5px solid ${bc}`, display:'inline-block' }}/>{label}
          </div>
        ))}
        <div style={{ marginLeft:'auto', fontSize:'11px', color:'var(--muted)' }}>Tap any day to add a note · Sundays for weekly review</div>
      </div>

      {/* ── MODAL ── */}
      {modal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setModal(null)}}>
          <div className="modal" style={{ maxWidth:'660px' }}>

            {/* Modal header */}
            <div className="modal-title">
              <div>
                <div style={{ fontSize:'16px', fontWeight:'800', color:'var(--text)' }}>
                  {modal.type==='week' ? '📋 Weekly Review' : '📝 Daily Note'}
                </div>
                <div style={{ fontSize:'12px', color:'var(--muted)', fontWeight:'600', marginTop:'2px' }}>
                  {MONTHS[month]} {modal.day}, {year}
                  {modal.type==='week' && ' — Week Review'}
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={()=>setModal(null)}>✕</button>
            </div>

            {/* Day P/L summary */}
            {modal.type==='day' && dayMap[modal.day]?.trades.length>0 && (
              <div style={{ marginBottom:'16px', display:'flex', gap:'16px', alignItems:'center', padding:'12px 16px', background:dayMap[modal.day].pl>=0?'var(--green-bg)':'var(--red-bg)', borderRadius:'var(--r-sm)', border:`1px solid ${dayMap[modal.day].pl>=0?'var(--green-dim)':'var(--red-dim)'}` }}>
                <div style={{ fontFamily:"'Geist Mono',monospace", fontSize:'22px', fontWeight:'700', color:dayMap[modal.day].pl>=0?'var(--green)':'var(--red)' }}>{f2(dayMap[modal.day].pl)}</div>
                <div style={{ fontSize:'11px', color:'var(--muted)', fontWeight:'600' }}>total day P/L · {dayMap[modal.day].trades.length} trade{dayMap[modal.day].trades.length>1?'s':''}</div>
              </div>
            )}

            {/* Week stats */}
            {modal.type==='week' && (()=>{
              const wt = weekTrades(modal.day)
              const ws = computeStats(wt)
              return wt.length>0 && (
                <div style={{ marginBottom:'16px', display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))', gap:'8px' }}>
                  {[['Trades',ws.n,'var(--blue)'],['Wins',ws.wins,'var(--green)'],['Losses',ws.losses,'var(--red)'],['Win Rate',fP(ws.winRate),ws.winRate>=.5?'var(--green)':'var(--red)'],['P/L',f2(ws.totalPL),ws.totalPL>=0?'var(--green)':'var(--red)']].map(([l,v,c])=>(
                    <div key={l} style={{ background:'var(--surface2)', borderRadius:'var(--r-xs)', padding:'8px 10px', border:'1px solid var(--border)' }}>
                      <div style={{ fontSize:'9px', fontWeight:'800', color:'var(--muted)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'2px' }}>{l}</div>
                      <div style={{ fontFamily:"'Geist Mono',monospace", fontSize:'15px', fontWeight:'700', color:c }}>{v}</div>
                    </div>
                  ))}
                </div>
              )
            })()}

            {/* Note form / view */}
            <div style={{ background:modal.type==='week'?'var(--purple-bg)':'var(--blue-bg)', border:`1px solid ${modal.type==='week'?'var(--purple-dim)':'var(--blue-dim)'}`, borderRadius:'var(--r-sm)', padding:'16px', marginBottom:'16px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
                <div style={{ fontSize:'11px', fontWeight:'800', color:modal.type==='week'?'var(--purple)':'var(--blue)', letterSpacing:'.06em', textTransform:'uppercase' }}>
                  {modal.type==='week'?'📋 Weekly Review':'📝 Daily Notes'}
                </div>
                <div style={{ display:'flex', gap:'6px' }}>
                  {!editing && modal.existing && <>
                    <button className="btn btn-outline btn-sm" onClick={()=>setEditing(true)}>✏️ Edit</button>
                    <button className="btn btn-red btn-sm" onClick={deleteNote}>Delete</button>
                  </>}
                </div>
              </div>

              {/* Mood / Consistency selectors */}
              {editing && (
                <div style={{ display:'flex', gap:'10px', marginBottom:'14px', flexWrap:'wrap' }}>
                  {modal.type==='day' && (
                    <div style={{ flex:1, minWidth:'150px' }}>
                      <div style={{ fontSize:'10px', fontWeight:'800', color:'var(--muted)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'5px' }}>😊 Mood</div>
                      <select value={mood} onChange={e=>setMood(e.target.value)} style={{ width:'100%', padding:'8px 10px', borderRadius:'var(--r-xs)', border:'1.5px solid var(--border)', background:'var(--surface)', fontSize:'12px', fontWeight:'600', color:'var(--text)', fontFamily:'inherit', outline:'none' }}>
                        <option value="">Select mood...</option>
                        {MOODS.map(m=><option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  )}
                  {modal.type==='week' && (
                    <div style={{ flex:1, minWidth:'200px' }}>
                      <div style={{ fontSize:'10px', fontWeight:'800', color:'var(--muted)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'5px' }}>📖 Rule Compliance</div>
                      <select value={consistency} onChange={e=>setConsistency(e.target.value)} style={{ width:'100%', padding:'8px 10px', borderRadius:'var(--r-xs)', border:'1.5px solid var(--border)', background:'var(--surface)', fontSize:'12px', fontWeight:'600', color:'var(--text)', fontFamily:'inherit', outline:'none' }}>
                        <option value="">Select...</option>
                        {CONSISTENCY.map(c=><option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Show mood/consistency in read mode */}
              {!editing && (mood||consistency) && (
                <div style={{ display:'flex', gap:'8px', marginBottom:'14px', flexWrap:'wrap' }}>
                  {mood && <span style={{ padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'700', background:'var(--surface)', color:'var(--blue)', textTransform:'capitalize' }}>😊 {mood}</span>}
                  {consistency && <span style={{ padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'700', background:'var(--surface)', color:'var(--purple)', textTransform:'capitalize' }}>📖 {consistency}</span>}
                </div>
              )}

              {/* Fields */}
              {(modal.type==='day' ? DAILY_FIELDS : WEEKLY_FIELDS).map(field => (
                <FieldInput key={field.key} field={field} value={formData[field.key]} onChange={setField} readOnly={!editing} />
              ))}

              {/* Save / Cancel */}
              {editing && (
                <div style={{ display:'flex', gap:'8px', marginTop:'4px' }}>
                  {modal.existing && <button className="btn btn-outline btn-sm" onClick={()=>{setEditing(false);setFormData(modal.existing?{...modal.existing}:{});setMood(modal.existing?.mood||'');setConsistency(modal.existing?.consistency||'')}}>Cancel</button>}
                  <button className="btn btn-blue" onClick={saveNote} disabled={saving} style={{ marginLeft: modal.existing?'0':'auto' }}>
                    {saving ? '⏳ Saving...' : '💾 Save Note'}
                  </button>
                </div>
              )}

              {!editing && !modal.existing && (
                <button className="btn btn-blue btn-sm" onClick={()=>setEditing(true)}>+ Add Note</button>
              )}
            </div>

            {/* Trades for the day */}
            {modal.type==='day' && dayMap[modal.day]?.trades.length>0 && (
              <>
                <div style={{ fontSize:'11px', fontWeight:'800', color:'var(--muted)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'10px' }}>Trades</div>
                {dayMap[modal.day].trades.map((t,i)=><TradeCard key={i} t={t} />)}
              </>
            )}

            {/* Week trades summary */}
            {modal.type==='week' && (()=>{
              const wt = weekTrades(modal.day)
              return wt.length>0 && (
                <>
                  <div style={{ fontSize:'11px', fontWeight:'800', color:'var(--muted)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:'10px' }}>This Week's Trades</div>
                  {wt.map((t,i)=><TradeCard key={i} t={t} />)}
                </>
              )
            })()}

            {modal.type==='day' && !dayMap[modal.day]?.trades.length && !modal.existing && !editing && (
              <div style={{ textAlign:'center', padding:'20px', color:'var(--muted)', fontSize:'13px' }}>No trades on this day. Add a note to record your observations.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
