import { useEconomicCalendar, currencyFlag, getFFWeekDays } from '../lib/useEconomicCalendar'

const CCY_COL = { USD:'#1D4ED8', GBP:'#6D28D9', EUR:'#065F46' }
const CCY_BG  = { USD:'#DBEAFE', GBP:'#EDE9FE', EUR:'#D1FAE5' }

export default function EconomicCalendar() {
  const { events, loading, error, fetchedAt, eventsForDate } = useEconomicCalendar()
  const weekDays = getFFWeekDays()
  const today    = new Date().toLocaleDateString('en-CA')

  const usd = events.filter(e=>e.country==='USD').length
  const gbp = events.filter(e=>e.country==='GBP').length
  const eur = events.filter(e=>e.country==='EUR').length
  const weekLabel = `${weekDays[0].month} ${weekDays[0].dayNum} – ${weekDays[6].month} ${weekDays[6].dayNum}`

  function refresh() {
    sessionStorage.removeItem('tt_econ_v21')
    window.location.reload()
  }

  return (
    <div className="page active">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'16px', flexWrap:'wrap', gap:'10px' }}>
        <div>
          <h1 style={{ fontSize:'20px', fontWeight:'800', color:'var(--text)', marginBottom:'4px' }}>Economic Calendar</h1>
          <div style={{ fontSize:'11px', color:'var(--muted)', fontWeight:'600' }}>🔴 High impact · USD · GBP · EUR · {weekLabel}</div>
        </div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap' }}>
          {[['🇺🇸','USD',usd],['🇬🇧','GBP',gbp],['🇪🇺','EUR',eur]].map(([flag,cur,n]) => (
            <div key={cur} style={{ display:'flex', alignItems:'center', gap:'4px', padding:'4px 10px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'6px', fontSize:'11px', fontWeight:'700' }}>
              <span>{flag}</span>
              <span style={{ color:CCY_COL[cur] }}>{cur}</span>
              <span style={{ color:'var(--muted)' }}>{n}</span>
            </div>
          ))}
          {fetchedAt && <span style={{ fontSize:'10px', color:'var(--muted2)' }}>Updated {fetchedAt.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</span>}
          <button onClick={refresh} style={{ background:'none', border:'1px solid var(--border)', borderRadius:'6px', padding:'4px 10px', cursor:'pointer', fontSize:'13px', color:'var(--muted)', fontFamily:'inherit' }}>↻</button>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign:'center', padding:'60px', color:'var(--muted)' }}>
          <div style={{ width:'24px', height:'24px', border:'3px solid var(--border)', borderTop:'3px solid var(--blue)', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 12px' }} />
          <div style={{ fontSize:'13px' }}>Loading calendar...</div>
        </div>
      )}

      {!loading && error && (
        <div style={{ padding:'14px', background:'var(--red-bg)', border:'1px solid var(--red-dim)', borderRadius:'var(--r)', color:'var(--red)', fontSize:'13px', fontWeight:'600', marginBottom:'14px' }}>
          ⚠️ {error} — <button onClick={refresh} style={{ color:'var(--blue)', background:'none', border:'none', cursor:'pointer', fontWeight:'700', fontSize:'13px', fontFamily:'inherit' }}>Try again</button>
        </div>
      )}

      {!loading && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
          {weekDays.map((day, di) => {
            const dayEvs  = eventsForDate(day.dateStr)
            const isToday = day.dateStr === today
            const bg      = isToday ? 'rgba(251,191,36,.05)' : day.isWeekend ? 'var(--surface2)' : 'var(--surface)'

            return (
              <div key={day.dateStr} style={{ borderLeft: isToday ? '3px solid var(--amber)' : '3px solid transparent', borderBottom: di < 6 ? '1px solid var(--border)' : 'none' }}>
                {/* Day header */}
                <div style={{ padding:'8px 16px 4px', display:'flex', alignItems:'center', gap:'8px', background: isToday ? 'rgba(251,191,36,.08)' : day.isWeekend ? 'var(--surface2)' : 'transparent', opacity: day.isWeekend ? .6 : 1 }}>
                  <span style={{ fontSize:'12px', fontWeight:'800', color: isToday ? 'var(--amber)' : 'var(--text2)' }}>{day.dayName}</span>
                  <span style={{ fontSize:'11px', color:'var(--muted)' }}>{day.month} {day.dayNum}</span>
                  {isToday && <span style={{ padding:'1px 7px', borderRadius:'20px', background:'var(--amber)', color:'#fff', fontSize:'9px', fontWeight:'800' }}>TODAY</span>}
                  {!day.isWeekend && dayEvs.length === 0 && (
                    <span style={{ fontSize:'11px', color:'var(--muted2)', fontStyle:'italic', marginLeft:'4px' }}>No high-impact events</span>
                  )}
                  {dayEvs.length > 0 && <span style={{ marginLeft:'auto', fontSize:'10px', fontWeight:'700', color:'var(--red)' }}>🔴 {dayEvs.length}</span>}
                </div>
                {/* Events */}
                {dayEvs.map((e, ei) => (
                  <div key={ei} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 16px', borderTop:'1px solid var(--border)', background: bg, transition:'background .1s' }}
                    onMouseEnter={ev=>ev.currentTarget.style.background='var(--surface2)'}
                    onMouseLeave={ev=>ev.currentTarget.style.background=bg}>
                    {/* Time */}
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', fontWeight:'600', color:'var(--muted)', minWidth:'44px' }}>{e.time||'—'}</span>
                    {/* Currency badge */}
                    <span style={{ display:'inline-flex', alignItems:'center', gap:'3px', padding:'2px 7px', borderRadius:'4px', background:CCY_BG[e.country]||'var(--surface2)', fontSize:'10px', fontWeight:'800', color:CCY_COL[e.country]||'var(--muted)', flexShrink:0 }}>
                      <span>{currencyFlag(e.country)}</span>
                      <span>{e.country}</span>
                    </span>
                    {/* Red square */}
                    <div style={{ width:'9px', height:'9px', background:'var(--red)', borderRadius:'2px', flexShrink:0 }} />
                    {/* Event name */}
                    <span style={{ fontSize:'13px', fontWeight:'600', color:'var(--text)', flex:1 }}>{e.title}</span>
                    {/* Values */}
                    {e.actual   && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', fontWeight:'700', color:'var(--green)' }}>{e.actual}</span>}
                    {e.forecast && !e.actual && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'var(--text2)' }}>F: {e.forecast}</span>}
                    {e.previous && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'var(--muted)' }}>P: {e.previous}</span>}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      <div style={{ textAlign:'center', marginTop:'10px', fontSize:'10px', color:'var(--muted2)' }}>
        Data from <a href="https://www.forexfactory.com" target="_blank" rel="noopener noreferrer" style={{ color:'var(--blue)', textDecoration:'none', fontWeight:'600' }}>ForexFactory.com</a>
      </div>
    </div>
  )
}
