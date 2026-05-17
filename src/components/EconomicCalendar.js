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
          {[['USD',usd],['GBP',gbp],['EUR',eur]].map(([cur,n]) => (
            <div key={cur} style={{ display:'flex', alignItems:'center', gap:'4px', padding:'4px 10px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'6px', fontSize:'11px', fontWeight:'700' }}>
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
        <div style={{ background:'#FFFFFF', borderRadius:'20px', boxShadow:'0 1px 3px rgba(0,0,0,.06),0 8px 24px rgba(0,0,0,.05)', overflow:'hidden' }}>
          {/* Title bar */}
          <div style={{ padding:'14px 20px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'3px', height:'16px', borderRadius:'2px', background:'#EF4444', flexShrink:0 }} />
            <span style={{ fontSize:'13px', fontWeight:'700', color:'#0F172A' }}>This Week's Events</span>
            <span style={{ marginLeft:'auto', fontSize:'11px', color:'#94A3B8' }}>
              {events.length > 0 ? `${events.length} high-impact` : 'No high-impact events'} · USD · GBP · EUR
            </span>
          </div>

          {/* Days */}
          <div>
            {weekDays.map((day, di) => {
              const dayEvs  = eventsForDate(day.dateStr)
              const isToday = day.dateStr === today

              return (
                <div key={day.dateStr} style={{ borderBottom: di < 6 ? '1px solid #F8FAFC' : 'none' }}>
                  {/* Day header */}
                  <div style={{ padding:'8px 20px 4px', display:'flex', alignItems:'center', gap:'8px' }}>
                    <span style={{ fontSize:'10px', fontWeight:'700', color: isToday ? 'var(--amber)' : '#94A3B8', letterSpacing:'.06em', textTransform:'uppercase' }}>
                      {day.dayName} {day.dayNum} {day.month.toUpperCase()}
                    </span>
                    {isToday && <span style={{ padding:'1px 6px', borderRadius:'20px', background:'var(--amber)', color:'#fff', fontSize:'9px', fontWeight:'800' }}>TODAY</span>}
                    {!day.isWeekend && dayEvs.length === 0 && (
                      <span style={{ fontSize:'11px', color:'#94A3B8', fontStyle:'italic' }}>No high-impact events</span>
                    )}
                  </div>

                  {/* Events */}
                  {dayEvs.map((e, ei) => (
                    <div key={ei} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'8px 20px', borderTop: ei > 0 ? '1px solid #F8FAFC' : 'none' }}>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:'#64748B', minWidth:'44px' }}>{e.time||'—'}</span>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:'3px', padding:'2px 8px', borderRadius:'4px', background:CCY_BG[e.country]||'#F1F5F9', fontSize:'10px', fontWeight:'800', color:CCY_COL[e.country]||'#64748B', flexShrink:0 }}>
                        {e.country}
                      </span>
                      <div style={{ width:'8px', height:'8px', borderRadius:'2px', background:'#EF4444', flexShrink:0 }} />
                      <span style={{ fontSize:'13px', fontWeight:'600', color:'#334155', flex:1 }}>{e.title}</span>
                      {e.actual   && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', fontWeight:'700', color:'#10B981' }}>{e.actual}</span>}
                      {e.forecast && !e.actual && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:'#64748B' }}>{e.forecast}</span>}
                      {e.previous && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:'#94A3B8' }}>{e.previous}</span>}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ textAlign:'center', marginTop:'10px', fontSize:'10px', color:'var(--muted2)' }}>
        Data from <a href="https://www.forexfactory.com" target="_blank" rel="noopener noreferrer" style={{ color:'var(--blue)', textDecoration:'none', fontWeight:'600' }}>ForexFactory.com</a>
      </div>
    </div>
  )
}
