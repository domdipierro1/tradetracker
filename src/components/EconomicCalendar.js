import { useEconomicCalendar, currencyFlag, formatFFTime } from '../lib/useEconomicCalendar'

const CURRENCY_COLORS = {
  USD: { text: '#2563EB', bg: '#EFF6FF' },
  GBP: { text: '#7C3AED', bg: '#F5F3FF' },
  EUR: { text: '#059669', bg: '#ECFDF5' },
}

function groupByDay(events) {
  const map = {}
  events.forEach(e => {
    if (!e.date) return
    const parts = e.date.split('-')
    if (parts.length !== 3) return
    const key = `${parts[2]}-${parts[0]}-${parts[1]}`
    if (!map[key]) map[key] = []
    map[key].push(e)
  })
  return map
}

function formatDayHeader(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.toLocaleDateString('en-US', { weekday: 'short' })
  const month = d.toLocaleDateString('en-US', { month: 'short' })
  const date = d.getDate()
  return { day, month, date, full: d }
}

export default function EconomicCalendar() {
  const { events, loading, error, fetchedAt } = useEconomicCalendar()
  const today = new Date().toISOString().split('T')[0]
  const grouped = groupByDay(events)
  const sortedDates = Object.keys(grouped).sort()

  const usd = events.filter(e => e.country === 'USD').length
  const gbp = events.filter(e => e.country === 'GBP').length
  const eur = events.filter(e => e.country === 'EUR').length

  return (
    <div className="page active">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text)' }}>Economic Calendar</h1>
          <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', marginTop: '2px' }}>High impact events · USD · GBP · EUR · This week</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {[['🇺🇸','USD',usd,'--blue'],['🇬🇧','GBP',gbp,'--purple'],['🇪🇺','EUR',eur,'--green']].map(([flag,cur,count,col])=>(
            <div key={cur} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'5px 10px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-xs)', fontSize:'12px', fontWeight:'700' }}>
              <span>{flag}</span>
              <span style={{ color:`var(${col})` }}>{cur}</span>
              <span style={{ color:'var(--muted)', fontWeight:'600' }}>{count}</span>
            </div>
          ))}
          {fetchedAt && <span style={{ fontSize:'10px', color:'var(--muted2)' }}>Updated {fetchedAt.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</span>}
        </div>
      </div>

      {/* ICT rule reminder */}
      <div style={{ display:'flex', gap:'8px', alignItems:'center', padding:'10px 14px', background:'var(--amber-bg)', border:'1px solid var(--amber-dim)', borderRadius:'var(--r-sm)', marginBottom:'16px' }}>
        <span style={{ fontSize:'14px', flexShrink:0 }}>⚠️</span>
        <span style={{ fontSize:'12px', color:'var(--text2)', fontWeight:'500', lineHeight:'1.5' }}>
          <strong>ICT Rule:</strong> Avoid entries 15 minutes either side of any red folder event. Wait for the dust to settle before trading.
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign:'center', padding:'48px', color:'var(--muted)' }}>
          <div style={{ width:'28px', height:'28px', border:'3px solid var(--border)', borderTop:'3px solid var(--blue)', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 12px' }} />
          <div style={{ fontSize:'13px', fontWeight:'600' }}>Loading Forex Factory calendar...</div>
        </div>
      )}

      {!loading && error && (
        <div style={{ padding:'14px', background:'var(--red-bg)', border:'1px solid var(--red-dim)', borderRadius:'var(--r)', color:'var(--red)', fontSize:'13px', fontWeight:'600' }}>
          ⚠️ Could not load calendar — {error}
        </div>
      )}

      {!loading && events.length === 0 && !error && (
        <div style={{ textAlign:'center', padding:'48px', color:'var(--muted)' }}>
          <div style={{ fontSize:'32px', marginBottom:'10px' }}>📅</div>
          <div style={{ fontSize:'13px', fontWeight:'600' }}>No high-impact events this week</div>
        </div>
      )}

      {/* Calendar table — FF style */}
      {!loading && sortedDates.length > 0 && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
          {/* Column headers */}
          <div style={{ display:'grid', gridTemplateColumns:'90px 70px 70px 1fr 90px 90px 90px', background:'var(--surface2)', borderBottom:'2px solid var(--border)', padding:'8px 0' }}>
            {['Date','Time','Ccy','Event','Actual','Forecast','Previous'].map((h,i)=>(
              <div key={h} style={{ padding:'0 12px', fontSize:'10px', fontWeight:'800', color:'var(--muted)', letterSpacing:'.07em', textTransform:'uppercase', textAlign: i >= 4 ? 'center' : 'left' }}>{h}</div>
            ))}
          </div>

          {sortedDates.map((dateStr, di) => {
            const { day, month, date } = formatDayHeader(dateStr)
            const isToday = dateStr === today
            const dayEvents = grouped[dateStr]

            return (
              <div key={dateStr}>
                {dayEvents.map((e, ei) => {
                  const colors = CURRENCY_COLORS[e.country] || { text:'var(--muted)', bg:'var(--surface2)' }
                  const hasActual = e.actual && e.actual !== ''
                  const time = formatFFTime(e.time)

                  return (
                    <div key={ei}
                      style={{ display:'grid', gridTemplateColumns:'90px 70px 70px 1fr 90px 90px 90px', alignItems:'center', borderBottom:'1px solid var(--border)', background: isToday ? 'rgba(251,191,36,.04)' : ei % 2 === 0 ? 'var(--surface)' : 'var(--surface2)', transition:'background .1s', minHeight:'44px' }}
                      onMouseEnter={e2 => e2.currentTarget.style.background = 'var(--blue-bg)'}
                      onMouseLeave={e2 => e2.currentTarget.style.background = isToday ? 'rgba(251,191,36,.04)' : ei % 2 === 0 ? 'var(--surface)' : 'var(--surface2)'}>

                      {/* Date — only show on first event of day */}
                      <div style={{ padding:'0 12px' }}>
                        {ei === 0 ? (
                          <div style={{ display:'flex', flexDirection:'column' }}>
                            <span style={{ fontSize:'11px', fontWeight:'800', color: isToday ? 'var(--amber)' : 'var(--text2)' }}>{day}</span>
                            <span style={{ fontSize:'10px', color:'var(--muted)', fontWeight:'600' }}>{month} {date}</span>
                            {isToday && <span style={{ fontSize:'9px', fontWeight:'800', color:'var(--amber)', letterSpacing:'.04em' }}>TODAY</span>}
                          </div>
                        ) : (
                          <div style={{ borderLeft:'2px solid var(--border)', height:'28px', marginLeft:'12px' }} />
                        )}
                      </div>

                      {/* Time */}
                      <div style={{ padding:'0 12px', fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', fontWeight:'600', color:'var(--muted)' }}>
                        {time}
                      </div>

                      {/* Currency */}
                      <div style={{ padding:'0 12px' }}>
                        <div style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'2px 7px', borderRadius:'4px', background:colors.bg, border:`1px solid ${colors.bg}` }}>
                          <span style={{ fontSize:'11px' }}>{currencyFlag(e.country)}</span>
                          <span style={{ fontSize:'10px', fontWeight:'800', color:colors.text }}>{e.country}</span>
                        </div>
                      </div>

                      {/* Event name + red impact icon */}
                      <div style={{ padding:'0 12px', display:'flex', alignItems:'center', gap:'8px' }}>
                        {/* Red folder icon */}
                        <div style={{ width:'10px', height:'10px', borderRadius:'2px', background:'var(--red)', flexShrink:0 }} title="High impact" />
                        <span style={{ fontSize:'13px', fontWeight:'600', color:'var(--text)', lineHeight:'1.3' }}>{e.title}</span>
                      </div>

                      {/* Actual */}
                      <div style={{ padding:'0 12px', textAlign:'center' }}>
                        {hasActual ? (
                          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', fontWeight:'700', color:'var(--green)' }}>{e.actual}</span>
                        ) : <span style={{ color:'var(--muted2)', fontSize:'12px' }}>—</span>}
                      </div>

                      {/* Forecast */}
                      <div style={{ padding:'0 12px', textAlign:'center' }}>
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:'var(--text2)' }}>{e.forecast || '—'}</span>
                      </div>

                      {/* Previous */}
                      <div style={{ padding:'0 12px', textAlign:'center' }}>
                        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:'var(--muted)' }}>{e.previous || '—'}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {!loading && events.length > 0 && (
        <div style={{ textAlign:'center', marginTop:'12px', fontSize:'11px', color:'var(--muted2)' }}>
          Data from <a href="https://www.forexfactory.com/calendar" target="_blank" rel="noopener noreferrer" style={{ color:'var(--blue)', textDecoration:'none', fontWeight:'600' }}>ForexFactory.com</a> · High impact only · Updates hourly
        </div>
      )}
    </div>
  )
}
