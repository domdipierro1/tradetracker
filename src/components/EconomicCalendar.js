import { useEconomicCalendar, currencyFlag, formatFFTime } from '../lib/useEconomicCalendar'

const CURRENCY_COLORS = {
  USD: { bg: 'var(--blue-bg)',   border: 'var(--blue-dim)',   text: 'var(--blue)'   },
  GBP: { bg: 'var(--purple-bg)', border: 'var(--purple-dim)', text: 'var(--purple)' },
  EUR: { bg: 'var(--green-bg)',  border: 'var(--green-dim)',  text: 'var(--green)'  },
}

function EventRow({ event, isToday }) {
  const colors = CURRENCY_COLORS[event.country] || { bg: 'var(--surface2)', border: 'var(--border)', text: 'var(--muted)' }
  const hasActual = event.actual && event.actual !== ''

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 16px', borderBottom: '1px solid var(--border)', background: isToday ? 'var(--amber-bg)' : 'transparent', transition: 'background .1s' }}
      onMouseEnter={e => { if (!isToday) e.currentTarget.style.background = 'var(--surface2)' }}
      onMouseLeave={e => { if (!isToday) e.currentTarget.style.background = 'transparent' }}>

      {/* Time */}
      <div style={{ minWidth: '52px', fontFamily: "'JetBrains Mono',monospace", fontSize: '12px', fontWeight: '600', color: 'var(--muted)', paddingTop: '2px' }}>
        {formatFFTime(event.time)}
      </div>

      {/* Currency badge */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '6px', background: colors.bg, border: `1px solid ${colors.border}`, minWidth: '58px', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: '12px' }}>{currencyFlag(event.country)}</span>
        <span style={{ fontSize: '11px', fontWeight: '800', color: colors.text }}>{event.country}</span>
      </div>

      {/* Red impact dot */}
      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--red)', flexShrink: 0, marginTop: '6px' }} title="High impact" />

      {/* Event name */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)', lineHeight: '1.3', marginBottom: '4px' }}>{event.title}</div>
        {(event.forecast || event.previous || event.actual) && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {event.actual && (
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--green)' }}>
                Actual: <span style={{ fontFamily: "'JetBrains Mono',monospace" }}>{event.actual}</span>
              </span>
            )}
            {event.forecast && (
              <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600' }}>
                Forecast: <span style={{ fontFamily: "'JetBrains Mono',monospace" }}>{event.forecast}</span>
              </span>
            )}
            {event.previous && (
              <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600' }}>
                Previous: <span style={{ fontFamily: "'JetBrains Mono',monospace" }}>{event.previous}</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function DaySection({ dateStr, events, todayStr }) {
  const date = new Date(dateStr + 'T12:00:00')
  const isToday = dateStr === todayStr
  const dayName = date.toLocaleDateString('en-GB', { weekday: 'long' })
  const dateLabel = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })

  return (
    <div style={{ marginBottom: '16px', background: 'var(--surface)', border: `1px solid ${isToday ? 'var(--amber-dim)' : 'var(--border)'}`, borderRadius: 'var(--r)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
      {/* Day header */}
      <div style={{ padding: '10px 16px', background: isToday ? 'var(--amber-bg)' : 'var(--surface2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div>
          <span style={{ fontSize: '13px', fontWeight: '800', color: isToday ? 'var(--amber)' : 'var(--text)', marginRight: '8px' }}>{dayName}</span>
          <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: '600' }}>{dateLabel}</span>
        </div>
        {isToday && <span style={{ padding: '2px 8px', borderRadius: '20px', background: 'var(--amber)', color: '#fff', fontSize: '10px', fontWeight: '800' }}>TODAY</span>}
        <div style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: '700', color: 'var(--red)' }}>🔴 {events.length} event{events.length > 1 ? 's' : ''}</div>
      </div>

      {/* Events */}
      {events.map((e, i) => <EventRow key={i} event={e} isToday={isToday} />)}
    </div>
  )
}

export default function EconomicCalendar() {
  const { events, loading, error, fetchedAt, eventsByDate } = useEconomicCalendar()
  const todayStr = new Date().toISOString().split('T')[0]
  const grouped = eventsByDate()
  const sortedDates = Object.keys(grouped).sort()

  // Currency counts
  const usdCount = events.filter(e => e.country === 'USD').length
  const gbpCount = events.filter(e => e.country === 'GBP').length
  const eurCount = events.filter(e => e.country === 'EUR').length

  return (
    <div className="page active">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text)', marginBottom: '4px' }}>Economic Calendar</h1>
          <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: '600' }}>
            🔴 Red folder events · USD · GBP · EUR · This week
          </div>
        </div>
        {fetchedAt && (
          <div style={{ fontSize: '11px', color: 'var(--muted2)', fontWeight: '600', paddingTop: '4px' }}>
            Updated {fetchedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>

      {/* Currency summary pills */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[['USD', '🇺🇸', usdCount, 'blue'], ['GBP', '🇬🇧', gbpCount, 'purple'], ['EUR', '🇪🇺', eurCount, 'green']].map(([cur, flag, count, color]) => (
          <div key={cur} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'var(--surface)', border: `1px solid var(--${color}-dim)`, borderRadius: 'var(--r-sm)', boxShadow: 'var(--shadow)' }}>
            <span style={{ fontSize: '18px' }}>{flag}</span>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '800', color: `var(--${color})`, letterSpacing: '.06em' }}>{cur}</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '16px', fontWeight: '700', color: 'var(--text)', lineHeight: 1 }}>{count}</div>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: '600', alignSelf: 'flex-end', paddingBottom: '1px' }}>events</div>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'var(--red-bg)', border: '1px solid var(--red-dim)', borderRadius: 'var(--r-sm)', boxShadow: 'var(--shadow)' }}>
          <span style={{ fontSize: '18px' }}>🔴</span>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--red)', letterSpacing: '.06em' }}>TOTAL</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '16px', fontWeight: '700', color: 'var(--red)', lineHeight: 1 }}>{events.length}</div>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: '600', alignSelf: 'flex-end', paddingBottom: '1px' }}>this week</div>
        </div>
      </div>

      {/* Warning notice */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px 16px', background: 'var(--amber-bg)', border: '1px solid var(--amber-dim)', borderRadius: 'var(--r-sm)', marginBottom: '20px' }}>
        <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠️</span>
        <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: '1.6', fontWeight: '500' }}>
          <strong>ICT Rule:</strong> Avoid entries 15 minutes either side of any red folder event. During high-impact releases, spreads widen and price can sweep liquidity aggressively before the real move. Wait for the dust to settle.
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--muted)' }}>
          <div style={{ width: '28px', height: '28px', border: '3px solid var(--border)', borderTop: '3px solid var(--blue)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: '13px', fontWeight: '600' }}>Loading Forex Factory calendar...</div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{ padding: '20px', background: 'var(--red-bg)', border: '1px solid var(--red-dim)', borderRadius: 'var(--r)', color: 'var(--red)', fontSize: '13px', fontWeight: '600' }}>
          ⚠️ Could not load calendar — {error}. This usually means a network issue. Try refreshing.
        </div>
      )}

      {/* No events */}
      {!loading && !error && events.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--muted)' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📅</div>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>No red folder events this week</div>
          <div style={{ fontSize: '12px' }}>Check back Monday for next week's schedule</div>
        </div>
      )}

      {/* Events by day */}
      {!loading && sortedDates.map(dateStr => (
        <DaySection key={dateStr} dateStr={dateStr} events={grouped[dateStr]} todayStr={todayStr} />
      ))}

      {/* Forex Factory attribution */}
      {!loading && events.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: 'var(--muted2)' }}>
          Data sourced from <a href="https://www.forexfactory.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)', textDecoration: 'none', fontWeight: '600' }}>ForexFactory.com</a> · Updates every hour · Shows current week only
        </div>
      )}
    </div>
  )
}
