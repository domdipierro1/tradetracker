import { useState } from 'react'
import { useEconomicCalendar, currencyFlag, formatFFTime } from '../lib/useEconomicCalendar'

const CURRENCY_COLORS = {
  USD: { text: '#1D4ED8', bg: '#DBEAFE' },
  GBP: { text: '#6D28D9', bg: '#EDE9FE' },
  EUR: { text: '#065F46', bg: '#D1FAE5' },
}

// Build full week Mon–Sun starting from this week's Monday
function getWeekDays() {
  const now = new Date()
  const dow = now.getDay() // 0=Sun
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1))
  
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const year  = d.getFullYear()
    const month = String(d.getMonth()+1).padStart(2,'0')
    const date  = String(d.getDate()).padStart(2,'0')
    days.push({
      dateStr: `${year}-${month}-${date}`,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum:  d.getDate(),
      month:   d.toLocaleDateString('en-US', { month: 'short' }),
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
    })
  }
  return days
}

export default function EconomicCalendar() {
  const { events, loading, error, fetchedAt, eventsForDate } = useEconomicCalendar()
  const [refreshKey, setRefreshKey] = useState(0)
  const today = new Date().toISOString().split('T')[0]
  const weekDays = getWeekDays()

  const usd = events.filter(e => e.country === 'USD').length
  const gbp = events.filter(e => e.country === 'GBP').length
  const eur = events.filter(e => e.country === 'EUR').length

  return (
    <div className="page active">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px', flexWrap:'wrap', gap:'10px' }}>
        <div>
          <h1 style={{ fontSize:'18px', fontWeight:'800', color:'var(--text)' }}>Economic Calendar</h1>
          <div style={{ fontSize:'11px', color:'var(--muted)', marginTop:'2px', fontWeight:'600' }}>
            🔴 High impact · USD · GBP · EUR · Current week
          </div>
        </div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap' }}>
          {[['🇺🇸','USD',usd,'--blue'],['🇬🇧','GBP',gbp,'--purple'],['🇪🇺','EUR',eur,'--green']].map(([flag,cur,count,col])=>(
            <div key={cur} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'5px 10px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-xs)', fontSize:'11px', fontWeight:'700' }}>
              <span>{flag}</span>
              <span style={{ color:`var(${col})` }}>{cur}</span>
              <span style={{ color:'var(--muted)' }}>{count}</span>
            </div>
          ))}
          {fetchedAt && <span style={{ fontSize:'10px', color:'var(--muted2)' }}>Updated {fetchedAt.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</span>}
          <button className="btn btn-outline btn-sm" onClick={() => { sessionStorage.removeItem('tt26_econ_v2'); window.location.reload() }}>↻</button>
        </div>
      </div>

      {/* ICT rule */}
      <div style={{ display:'flex', gap:'8px', alignItems:'center', padding:'9px 14px', background:'var(--amber-bg)', border:'1px solid var(--amber-dim)', borderRadius:'var(--r-sm)', marginBottom:'14px' }}>
        <span style={{ fontSize:'13px' }}>⚠️</span>
        <span style={{ fontSize:'12px', color:'var(--text2)', fontWeight:'500' }}>
          <strong>ICT Rule:</strong> Avoid entries 15 minutes either side of any red folder event.
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign:'center', padding:'48px', color:'var(--muted)' }}>
          <div style={{ width:'28px', height:'28px', border:'3px solid var(--border)', borderTop:'3px solid var(--blue)', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 12px' }} />
          <div style={{ fontSize:'13px', fontWeight:'600' }}>Loading Forex Factory calendar...</div>
          <div style={{ fontSize:'11px', color:'var(--muted2)', marginTop:'6px' }}>Connecting to feed...</div>
        </div>
      )}

      {!loading && error && (
        <div style={{ padding:'14px', background:'var(--red-bg)', border:'1px solid var(--red-dim)', borderRadius:'var(--r)', color:'var(--red)', fontSize:'13px', fontWeight:'600', marginBottom:'14px' }}>
          ⚠️ {error} — <button onClick={() => { sessionStorage.removeItem('tt26_econ_v2'); window.location.reload() }} style={{ color:'var(--blue)', background:'none', border:'none', cursor:'pointer', fontWeight:'700', fontFamily:'inherit', fontSize:'13px' }}>Try again</button>
        </div>
      )}

      {/* FF-style table */}
      {!loading && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
          
          {/* Column headers — exactly like FF */}
          <div style={{ display:'grid', gridTemplateColumns:'100px 80px 70px 30px 1fr 90px 90px 90px', background:'var(--surface2)', borderBottom:'2px solid var(--border2)' }}>
            {[['Date','left'],['Time','left'],['Currency','left'],['','left'],['Event','left'],['Actual','center'],['Forecast','center'],['Previous','center']].map(([h,align],i)=>(
              <div key={i} style={{ padding:'8px 10px', fontSize:'10px', fontWeight:'800', color:'var(--muted)', letterSpacing:'.07em', textTransform:'uppercase', textAlign:align }}>
                {h}
              </div>
            ))}
          </div>

          {/* All 7 days Mon–Sun */}
          {weekDays.map((day, di) => {
            const dayEvents = eventsForDate(day.dateStr)
            const isToday   = day.dateStr === today
            const rowBg     = isToday ? 'rgba(251,191,36,.06)' : day.isWeekend ? 'var(--surface2)' : 'var(--surface)'
            const dayBorder = isToday ? '2px solid var(--amber)' : 'none'

            return (
              <div key={day.dateStr} style={{ borderLeft: dayBorder, borderBottom: di < 6 ? '1px solid var(--border)' : 'none' }}>
                
                {/* Day row — always shown even if no events */}
                {dayEvents.length === 0 ? (
                  <div style={{ display:'grid', gridTemplateColumns:'100px 80px 70px 30px 1fr 90px 90px 90px', alignItems:'center', minHeight:'40px', background:rowBg, opacity: day.isWeekend ? .6 : 1 }}>
                    <div style={{ padding:'8px 10px' }}>
                      <div style={{ fontSize:'12px', fontWeight:'800', color: isToday ? 'var(--amber)' : day.isWeekend ? 'var(--muted2)' : 'var(--text2)' }}>{day.dayName}</div>
                      <div style={{ fontSize:'10px', color:'var(--muted2)', fontWeight:'600' }}>{day.month} {day.dayNum}</div>
                      {isToday && <div style={{ fontSize:'9px', fontWeight:'800', color:'var(--amber)', letterSpacing:'.04em', marginTop:'1px' }}>TODAY</div>}
                    </div>
                    <div style={{ padding:'8px 10px', gridColumn:'2 / -1', fontSize:'12px', color:'var(--muted2)', fontStyle:'italic' }}>
                      {day.isWeekend ? '' : 'No high-impact events'}
                    </div>
                  </div>
                ) : (
                  /* Event rows for this day */
                  dayEvents.map((e, ei) => {
                    const colors = CURRENCY_COLORS[e.country] || { text:'var(--muted)', bg:'var(--surface2)' }
                    const hasActual = e.actual && e.actual.trim() !== ''
                    const time = formatFFTime(e.time)

                    return (
                      <div key={ei}
                        style={{ display:'grid', gridTemplateColumns:'100px 80px 70px 30px 1fr 90px 90px 90px', alignItems:'center', minHeight:'44px', background: isToday ? 'rgba(251,191,36,.04)' : ei % 2 === 0 ? rowBg : (day.isWeekend ? 'var(--surface2)' : 'var(--surface2)'), borderTop: ei > 0 ? '1px solid var(--border)' : 'none', transition:'background .1s', cursor:'default' }}
                        onMouseEnter={e2 => e2.currentTarget.style.background='var(--blue-bg)'}
                        onMouseLeave={e2 => e2.currentTarget.style.background= isToday ? 'rgba(251,191,36,.04)' : ei%2===0?rowBg:'var(--surface2)'}>

                        {/* Date — only on first event */}
                        <div style={{ padding:'8px 10px' }}>
                          {ei === 0 ? (
                            <div>
                              <div style={{ fontSize:'12px', fontWeight:'800', color: isToday ? 'var(--amber)' : 'var(--text2)' }}>{day.dayName}</div>
                              <div style={{ fontSize:'10px', color:'var(--muted)', fontWeight:'600' }}>{day.month} {day.dayNum}</div>
                              {isToday && <div style={{ fontSize:'9px', fontWeight:'800', color:'var(--amber)', letterSpacing:'.04em', marginTop:'1px' }}>TODAY</div>}
                            </div>
                          ) : (
                            <div style={{ borderLeft:'2px solid var(--border)', height:'24px', marginLeft:'16px' }} />
                          )}
                        </div>

                        {/* Time */}
                        <div style={{ padding:'8px 10px', fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', fontWeight:'600', color:'var(--muted)' }}>
                          {time}
                        </div>

                        {/* Currency */}
                        <div style={{ padding:'8px 10px' }}>
                          <div style={{ display:'inline-flex', alignItems:'center', gap:'3px', padding:'2px 7px', borderRadius:'4px', background:colors.bg }}>
                            <span style={{ fontSize:'10px' }}>{currencyFlag(e.country)}</span>
                            <span style={{ fontSize:'10px', fontWeight:'800', color:colors.text }}>{e.country}</span>
                          </div>
                        </div>

                        {/* Red impact square */}
                        <div style={{ padding:'0 6px', display:'flex', justifyContent:'center' }}>
                          <div style={{ width:'11px', height:'11px', background:'var(--red)', borderRadius:'2px', flexShrink:0 }} title="High impact" />
                        </div>

                        {/* Event name */}
                        <div style={{ padding:'8px 10px' }}>
                          <span style={{ fontSize:'13px', fontWeight:'600', color:'var(--text)' }}>{e.title}</span>
                        </div>

                        {/* Actual */}
                        <div style={{ padding:'8px 10px', textAlign:'center' }}>
                          {hasActual
                            ? <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', fontWeight:'700', color:'var(--green)' }}>{e.actual}</span>
                            : <span style={{ color:'var(--muted2)', fontSize:'12px' }}>—</span>}
                        </div>

                        {/* Forecast */}
                        <div style={{ padding:'8px 10px', textAlign:'center' }}>
                          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:'var(--text2)' }}>{e.forecast || '—'}</span>
                        </div>

                        {/* Previous */}
                        <div style={{ padding:'8px 10px', textAlign:'center' }}>
                          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:'var(--muted)' }}>{e.previous || '—'}</span>
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

      {/* Mobile scroll hint */}
      <div style={{ textAlign:'center', marginTop:'10px', fontSize:'10px', color:'var(--muted2)' }}>
        ← Scroll to see all columns on mobile &nbsp;·&nbsp; Data from <a href="https://www.forexfactory.com/calendar" target="_blank" rel="noopener noreferrer" style={{ color:'var(--blue)', textDecoration:'none', fontWeight:'600' }}>ForexFactory.com</a>
      </div>
    </div>
  )
}
