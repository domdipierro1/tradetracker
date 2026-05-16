import React, { useState, useEffect } from 'react'
import { useEconomicCalendar, currencyFlag, formatFFTime } from '../lib/useEconomicCalendar'

const CCY_COLORS = {
  USD: { text:'#1D4ED8', bg:'#DBEAFE' },
  GBP: { text:'#6D28D9', bg:'#EDE9FE' },
  EUR: { text:'#065F46', bg:'#D1FAE5' },
}

function getWeekDays() {
  const now = new Date()
  const dow = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const y = d.getFullYear()
    const m = String(d.getMonth()+1).padStart(2,'0')
    const dd = String(d.getDate()).padStart(2,'0')
    return {
      dateStr:   `${y}-${m}-${dd}`,
      dayName:   d.toLocaleDateString('en-US', { weekday:'short' }),
      dayNum:    d.getDate(),
      month:     d.toLocaleDateString('en-US', { month:'short' }),
      isWeekend: d.getDay()===0 || d.getDay()===6,
    }
  })
}


// ── MAG 7 EARNINGS HOOK ─────────────────────────────────────────
function useMag7(weekDates) {
  const [earnings, setEarnings] = useState([])
  useEffect(() => {
    const CACHE_KEY = 'tt_earnings_v2'
    const CACHE_TTL = 12 * 60 * 60 * 1000
    async function load() {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY)
        if (cached) {
          const p = JSON.parse(cached)
          if (Date.now() - p.ts < CACHE_TTL) { setEarnings(p.data); return }
        }
      } catch(e) {}
      try {
        const r = await fetch('/api/earnings', { signal: AbortSignal.timeout(10000) })
        if (r.ok) {
          const json = await r.json()
          if (json.earnings?.length) {
            setEarnings(json.earnings)
            try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: json.earnings, ts: Date.now() })) } catch(e) {}
          }
        }
      } catch(e) { console.error('Earnings fetch failed:', e.message) }
    }
    load()
  }, [])
  return earnings.filter(e => weekDates.includes(e.date))
}

export default function EconomicCalendar() {
  const [refreshKey, setRefreshKey] = React.useState(0)
  // Always show current week - FF JSON updates every Monday automatically
  const weekOffset = 0
  const { events, loading, error, fetchedAt, eventsForDate } = useEconomicCalendar(weekOffset)
  const weekDays = getWeekDays()

  return (
    <div className="page active">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px', flexWrap:'wrap', gap:'10px' }}>
        <div>
          <h1 style={{ fontSize:'18px', fontWeight:'800', color:'var(--text)' }}>Economic Calendar</h1>
        </div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap' }}>
          {fetchedAt && <span style={{ fontSize:'10px', color:'var(--muted2)' }}>Updated {fetchedAt.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</span>}
          {fetchedAt && <span style={{ fontSize:'10px', color:'var(--muted2)' }}>Updated {fetchedAt.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</span>}
          <button className="btn btn-icon btn-ghost" onClick={() => { try { for(let i=1;i<=15;i++) { sessionStorage.removeItem('tt26_econ_v'+i); sessionStorage.removeItem('tt26_econ_v12_w0'); sessionStorage.removeItem('tt26_econ_v12_w1') } } catch(e){} window.location.reload() }} title="Refresh">↻</button>
        </div>
      </div>

      {/* ICT rule */}


      {loading && (
        <div style={{ textAlign:'center', padding:'48px', color:'var(--muted)' }}>
          <div style={{ width:'28px', height:'28px', border:'3px solid var(--border)', borderTop:'3px solid var(--blue)', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 12px' }} />
          <div style={{ fontSize:'13px', fontWeight:'600' }}>Loading calendar...</div>
        </div>
      )}

      {!loading && error && (
        <div style={{ padding:'12px 14px', background: error.includes('not yet available') ? 'var(--amber-bg)' : 'var(--red-bg)', border: `1px solid ${error.includes('not yet available') ? 'var(--amber-dim)' : 'var(--red-dim)'}`, borderRadius:'var(--r)', color: error.includes('not yet available') ? 'var(--amber)' : 'var(--red)', fontSize:'13px', fontWeight:'500' }}>
          {error.includes('not yet available') ? '📅' : '⚠️'} {error}
          {!error.includes('not yet available') && <button onClick={()=>{ for(let i=1;i<=15;i++) sessionStorage.removeItem('tt26_econ_v'+i); window.location.reload() }} style={{ marginLeft:'8px', color:'var(--blue)', background:'none', border:'none', cursor:'pointer', fontWeight:'700', fontFamily:'inherit', fontSize:'13px' }}>Retry</button>}
        </div>
      )}

      {!loading && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
          {/* Column headers */}
          <div style={{ display:'grid', gridTemplateColumns:'100px 75px 75px 28px 1fr 85px 85px 85px', background:'var(--surface2)', borderBottom:'2px solid var(--border2)' }}>
            {['Date','Time (EST)','Currency','','Event','Actual','Forecast','Previous'].map((h,i)=>(
              <div key={i} style={{ padding:'8px 10px', fontSize:'10px', fontWeight:'800', color:'var(--muted)', letterSpacing:'.07em', textTransform:'uppercase', textAlign:i>=5?'center':'left' }}>{h}</div>
            ))}
          </div>

          {weekDays.map((day, di) => {
            const dayEvents  = eventsForDate(day.dateStr)
            const isToday    = day.dateStr === today
            const rowBg      = isToday ? 'rgba(251,191,36,.05)' : day.isWeekend ? 'var(--surface2)' : 'var(--surface)'
            const accentBdr  = isToday ? '3px solid var(--amber)' : 'none'

            return (
              <div key={day.dateStr} style={{ borderLeft: accentBdr, borderBottom: di<6 ? '1px solid var(--border)' : 'none' }}>
                {dayEvents.length === 0 ? (
                  <div style={{ display:'grid', gridTemplateColumns:'100px 75px 75px 28px 1fr 85px 85px 85px', alignItems:'center', minHeight:'40px', background:rowBg, opacity:day.isWeekend?.6:1 }}>
                    <div style={{ padding:'8px 10px' }}>
                      <div style={{ fontSize:'12px', fontWeight:'800', color:isToday?'var(--amber)':day.isWeekend?'var(--muted2)':'var(--text2)' }}>{day.dayName}</div>
                      <div style={{ fontSize:'10px', color:'var(--muted2)', fontWeight:'600' }}>{day.month} {day.dayNum}</div>
                      {isToday && <div style={{ fontSize:'9px', fontWeight:'800', color:'var(--amber)', letterSpacing:'.04em' }}>TODAY</div>}
                    </div>
                    <div style={{ padding:'8px 10px', gridColumn:'2/-1', fontSize:'12px', color:'var(--muted2)', fontStyle:'italic' }}>
                      {!day.isWeekend && 'No high-impact events'}
                    </div>
                  </div>
                ) : (
                  dayEvents.map((e, ei) => {
                    const colors   = CCY_COLORS[e.country] || { text:'var(--muted)', bg:'var(--surface2)' }
                    const hasActual = e.actual && e.actual.trim() !== ''
                    const time     = formatFFTime(e.time)
                    const isHoliday = e.isHoliday

                    return (
                      <div key={ei}
                        style={{ display:'grid', gridTemplateColumns:'100px 75px 75px 28px 1fr 85px 85px 85px', alignItems:'center', minHeight:'44px', background:isToday?'rgba(251,191,36,.04)':ei%2===0?rowBg:'var(--surface2)', borderTop:ei>0?'1px solid var(--border)':'none', transition:'background .1s', cursor:'default' }}
                        onMouseEnter={e2=>e2.currentTarget.style.background='var(--blue-bg)'}
                        onMouseLeave={e2=>e2.currentTarget.style.background=isToday?'rgba(251,191,36,.04)':ei%2===0?rowBg:'var(--surface2)'}>

                        {/* Date */}
                        <div style={{ padding:'8px 10px' }}>
                          {ei===0 ? (
                            <div>
                              <div style={{ fontSize:'12px', fontWeight:'800', color:isToday?'var(--amber)':'var(--text2)' }}>{day.dayName}</div>
                              <div style={{ fontSize:'10px', color:'var(--muted)', fontWeight:'600' }}>{day.month} {day.dayNum}</div>
                              {isToday && <div style={{ fontSize:'9px', fontWeight:'800', color:'var(--amber)', letterSpacing:'.04em', marginTop:'1px' }}>TODAY</div>}
                            </div>
                          ) : <div style={{ borderLeft:'2px solid var(--border)', height:'22px', marginLeft:'16px' }} />}
                        </div>

                        {/* Time */}
                        <div style={{ padding:'8px 10px', fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', fontWeight:'600', color:isHoliday?'var(--muted2)':'var(--muted)' }}>
                          {isHoliday ? 'All Day' : time}
                        </div>

                        {/* Currency */}
                        <div style={{ padding:'8px 10px' }}>
                          <div style={{ display:'inline-flex', alignItems:'center', gap:'3px', padding:'2px 6px', borderRadius:'4px', background:colors.bg }}>
                            <span style={{ fontSize:'10px' }}>{currencyFlag(e.country)}</span>
                            <span style={{ fontSize:'10px', fontWeight:'800', color:colors.text }}>{e.country}</span>
                          </div>
                        </div>

                        {/* Impact icon */}
                        <div style={{ padding:'0 6px', display:'flex', justifyContent:'center' }}>
                          {isHoliday
                            ? <span style={{ fontSize:'13px' }} title="Bank Holiday">🏦</span>
                            : <div style={{ width:'11px', height:'11px', background:'var(--red)', borderRadius:'2px' }} title="High impact" />}
                        </div>

                        {/* Event */}
                        <div style={{ padding:'8px 10px', display:'flex', alignItems:'center', gap:'6px' }}>
                          <span style={{ fontSize:'13px', fontWeight:'600', color:isHoliday?'var(--muted)':'var(--text)', fontStyle:isHoliday?'italic':'normal' }}>{e.title}</span>
                        </div>

                        {/* Actual */}
                        <div style={{ padding:'8px 10px', textAlign:'center' }}>
                          {hasActual ? <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', fontWeight:'700', color:'var(--green)' }}>{e.actual}</span>
                            : <span style={{ color:'var(--muted2)', fontSize:'12px' }}>—</span>}
                        </div>

                        {/* Forecast */}
                        <div style={{ padding:'8px 10px', textAlign:'center' }}>
                          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:'var(--text2)' }}>{e.forecast||'—'}</span>
                        </div>

                        {/* Previous */}
                        <div style={{ padding:'8px 10px', textAlign:'center' }}>
                          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:'var(--muted)' }}>{e.previous||'—'}</span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )
          })}
        </div>
      )}

      <div style={{ textAlign:'center', marginTop:'10px', fontSize:'10px', color:'var(--muted2)' }}>
        Data from <a href="https://www.forexfactory.com/calendar" target="_blank" rel="noopener noreferrer" style={{ color:'var(--blue)', textDecoration:'none', fontWeight:'600' }}>ForexFactory.com</a> · Updates hourly · Scroll right on mobile
      </div>
    </div>
  )
}
