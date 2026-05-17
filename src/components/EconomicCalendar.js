import { useEconomicCalendar, currencyFlag, getFFWeekDays } from '../lib/useEconomicCalendar'

const CCY = {
  USD: { bg:'#DBEAFE', text:'#1D4ED8' },
  GBP: { bg:'#EDE9FE', text:'#6D28D9' },
  EUR: { bg:'#D1FAE5', text:'#065F46' },
}

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
          <div style={{ fontSize:'11px', color:'var(--muted)', fontWeight:'600' }}>
            🔴 High impact · USD · GBP · EUR · {weekLabel}
          </div>
        </div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap' }}>
          {[['🇺🇸','USD',usd,'#1D4ED8'],['🇬🇧','GBP',gbp,'#6D28D9'],['🇪🇺','EUR',eur,'#065F46']].map(([flag,cur,n,col]) => (
            <div key={cur} style={{ display:'flex', alignItems:'center', gap:'4px', padding:'4px 10px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'6px', fontSize:'11px', fontWeight:'700' }}>
              <span>{flag}</span><span style={{color:col}}>{cur}</span><span style={{color:'var(--muted)'}}>{n}</span>
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
          {/* Column headers */}
          <div style={{ display:'grid', gridTemplateColumns:'110px 80px 80px 28px 1fr 90px 90px 90px', background:'var(--surface2)', borderBottom:'2px solid var(--border2)' }}>
            {['Date','Time (EST)','Currency','','Event','Actual','Forecast','Previous'].map((h,i) => (
              <div key={i} style={{ padding:'8px 10px', fontSize:'10px', fontWeight:'700', color:'var(--muted)', letterSpacing:'.06em', textTransform:'uppercase', textAlign: i>=5?'center':'left' }}>{h}</div>
            ))}
          </div>

          {weekDays.map((day, di) => {
            const dayEvs  = eventsForDate(day.dateStr)
            const isToday = day.dateStr === today
            const bg      = isToday ? 'rgba(251,191,36,.06)' : day.isWeekend ? 'var(--surface2)' : 'var(--surface)'

            return (
              <div key={day.dateStr} style={{ borderLeft: isToday ? '3px solid var(--amber)' : '3px solid transparent', borderBottom: di < 6 ? '1px solid var(--border)' : 'none' }}>
                {dayEvs.length === 0 ? (
                  <div style={{ display:'grid', gridTemplateColumns:'110px 80px 80px 28px 1fr 90px 90px 90px', alignItems:'center', minHeight:'38px', background:bg, opacity:day.isWeekend?.55:1 }}>
                    <div style={{ padding:'8px 10px' }}>
                      <div style={{ fontSize:'12px', fontWeight:'800', color: isToday?'var(--amber)':day.isWeekend?'var(--muted2)':'var(--text2)' }}>{day.dayName}</div>
                      <div style={{ fontSize:'10px', color:'var(--muted2)' }}>{day.month} {day.dayNum}</div>
                      {isToday && <div style={{ fontSize:'9px', fontWeight:'800', color:'var(--amber)' }}>TODAY</div>}
                    </div>
                    <div style={{ gridColumn:'2/-1', padding:'8px 10px', fontSize:'12px', color:'var(--muted2)', fontStyle:'italic' }}>
                      {!day.isWeekend && 'No high-impact events'}
                    </div>
                  </div>
                ) : dayEvs.map((e, ei) => {
                  const c = CCY[e.country] || { bg:'var(--surface2)', text:'var(--muted)' }
                  return (
                    <div key={ei} style={{ display:'grid', gridTemplateColumns:'110px 80px 80px 28px 1fr 90px 90px 90px', alignItems:'center', minHeight:'44px', background:isToday?'rgba(251,191,36,.04)':bg, borderTop:ei>0?'1px solid var(--border)':'none', transition:'background .1s' }}
                      onMouseEnter={ev=>ev.currentTarget.style.background='var(--surface2)'}
                      onMouseLeave={ev=>ev.currentTarget.style.background=isToday?'rgba(251,191,36,.04)':bg}>
                      <div style={{ padding:'8px 10px' }}>
                        {ei===0 ? <>
                          <div style={{ fontSize:'12px', fontWeight:'800', color:isToday?'var(--amber)':'var(--text2)' }}>{day.dayName}</div>
                          <div style={{ fontSize:'10px', color:'var(--muted)' }}>{day.month} {day.dayNum}</div>
                          {isToday && <div style={{ fontSize:'9px', fontWeight:'800', color:'var(--amber)' }}>TODAY</div>}
                        </> : <div style={{ borderLeft:'2px solid var(--border)', height:'20px', marginLeft:'18px' }} />}
                      </div>
                      <div style={{ padding:'8px 10px', fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', fontWeight:'600', color:'var(--muted)' }}>{e.time||'—'}</div>
                      <div style={{ padding:'8px 10px' }}>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:'3px', padding:'2px 7px', borderRadius:'4px', background:c.bg }}>
                          <span style={{ fontSize:'11px' }}>{currencyFlag(e.country)}</span>
                          <span style={{ fontSize:'10px', fontWeight:'800', color:c.text }}>{e.country}</span>
                        </span>
                      </div>
                      <div style={{ display:'flex', justifyContent:'center' }}>
                        <div style={{ width:'10px', height:'10px', background:'var(--red)', borderRadius:'2px' }} />
                      </div>
                      <div style={{ padding:'8px 10px', fontSize:'13px', fontWeight:'600', color:'var(--text)' }}>{e.title}</div>
                      <div style={{ padding:'8px 10px', textAlign:'center', fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', fontWeight:'700', color:'var(--green)' }}>
                        {e.actual || <span style={{color:'var(--muted2)'}}>—</span>}
                      </div>
                      <div style={{ padding:'8px 10px', textAlign:'center', fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:'var(--text2)' }}>
                        {e.forecast || <span style={{color:'var(--muted2)'}}>—</span>}
                      </div>
                      <div style={{ padding:'8px 10px', textAlign:'center', fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:'var(--muted)' }}>
                        {e.previous || <span style={{color:'var(--muted2)'}}>—</span>}
                      </div>
                    </div>
                  )
                })}
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
