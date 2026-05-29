import { useState, useEffect } from 'react'
import { useEconomicCalendar, currencyFlag, getFFWeekDays } from '../lib/useEconomicCalendar'

const CCY_COL = { USD:'#1E293B', GBP:'#1E293B', EUR:'#1E293B', AUD:'#1E293B', CAD:'#1E293B', CHF:'#1E293B', JPY:'#1E293B', NZD:'#1E293B' }
const CCY_BG  = { USD:'#F1F5F9', GBP:'#F1F5F9', EUR:'#F1F5F9', AUD:'#F1F5F9', CAD:'#F1F5F9', CHF:'#F1F5F9', JPY:'#F1F5F9', NZD:'#F1F5F9' }

export default function EconomicCalendar() {
  const { events, loading, error, fetchedAt, eventsForDate } = useEconomicCalendar()
  const weekDays = getFFWeekDays()
  const today    = new Date().toLocaleDateString('en-CA')

  const usd = events.filter(e=>e.country==='USD').length
  const gbp = events.filter(e=>e.country==='GBP').length
  const eur = events.filter(e=>e.country==='EUR').length
  const aud = events.filter(e=>e.country==='AUD').length
  const cad = events.filter(e=>e.country==='CAD').length
  const chf = events.filter(e=>e.country==='CHF').length
  const jpy = events.filter(e=>e.country==='JPY').length
  const nzd = events.filter(e=>e.country==='NZD').length
  const weekLabel = `${weekDays[0].month} ${weekDays[0].dayNum} – ${weekDays[6].month} ${weekDays[6].dayNum}`

  function refresh() {
    sessionStorage.removeItem('tt_econ_v25')
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
          {[['USD',usd],['GBP',gbp],['EUR',eur],['AUD',aud],['CAD',cad],['CHF',chf],['JPY',jpy],['NZD',nzd]].filter(([,n])=>n>0).map(([cur,n]) => (
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
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color: '#64748B', minWidth:'44px' }}>{e.isHoliday ? 'All Day' : (e.time||'—')}</span>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:'3px', padding:'2px 8px', borderRadius:'4px', background: '#F1F5F9', fontSize:'10px', fontWeight:'700', color: '#1E293B', flexShrink:0 }}>
                        {e.country}
                      </span>
                      <div style={{ width:'11px', height:'11px', borderRadius:'3px', background: e.isHoliday ? '#94A3B8' : '#EF4444', flexShrink:0 }} />
                      <span style={{ fontSize:'13px', fontWeight: '600', color: '#334155', flex:1, fontStyle: 'normal' }}>{e.title}</span>
                      {!e.isHoliday && e.actual   && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', fontWeight:'700', color:'#10B981' }}>{e.actual}</span>}
                      {!e.isHoliday && e.forecast && !e.actual && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:'#64748B' }}>{e.forecast}</span>}
                      {!e.isHoliday && e.previous && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:'#94A3B8' }}>{e.previous}</span>}
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

      {/* Mag 7 Earnings */}
      <Mag7Earnings />
    </div>
  )
}

function Mag7Earnings() {
  const [earnings, setEarnings] = useState([])
  const [loading, setLoading]   = useState(true)
  const CK = 'tt_mag7_v2'

  useEffect(() => {
    async function load() {
      try {
        const cached = sessionStorage.getItem(CK)
        if (cached) {
          const p = JSON.parse(cached)
          if (Date.now() - p.ts < 12 * 60 * 60 * 1000) {
            setEarnings(p.earnings); setLoading(false); return
          }
        }
        const r = await fetch('/api/earnings')
        if (r.ok) {
          const data = await r.json()
          setEarnings(data.earnings || [])
          try { sessionStorage.setItem(CK, JSON.stringify({ earnings: data.earnings, ts: Date.now() })) } catch {}
        }
      } catch(e) { console.error('Earnings fetch error:', e) }
      setLoading(false)
    }
    load()
  }, [])

  const today = new Date().toLocaleDateString('en-CA')

  function fmt(dateStr) {
    const d = new Date(dateStr + 'T12:00:00')
    return d.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' })
  }

  function daysUntil(dateStr) {
    const diff = Math.ceil((new Date(dateStr + 'T12:00:00') - new Date()) / (1000*60*60*24))
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Tomorrow'
    return `${diff}d`
  }

  const LOGOS = { AAPL:'🍎', MSFT:'🪟', AMZN:'📦', GOOGL:'🔍', META:'🔵', TSLA:'⚡', NVDA:'🟢' }

  if (loading) return null
  if (!earnings.length) return null

  return (
    <div style={{ marginTop:'16px', background:'#FFFFFF', borderRadius:'20px', boxShadow:'0 1px 3px rgba(0,0,0,.06),0 8px 24px rgba(0,0,0,.05)', overflow:'hidden' }}>
      <div style={{ padding:'14px 20px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', gap:'10px' }}>
        <div style={{ width:'3px', height:'16px', borderRadius:'2px', background:'#6366F1', flexShrink:0 }} />
        <span style={{ fontSize:'13px', fontWeight:'700', color:'#0F172A' }}>Mag 7 Earnings</span>
        <span style={{ marginLeft:'auto', fontSize:'11px', color:'#94A3B8' }}>Next 90 days · Awareness only</span>
      </div>
      <div style={{ padding:'8px 0' }}>
        {earnings.map((e, i) => {
          const isToday = e.date === today
          const isClose = daysUntil(e.date) === 'Tomorrow'
          return (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 20px', borderBottom: i < earnings.length-1 ? '1px solid #F8FAFC' : 'none', background: isToday ? 'rgba(251,191,36,.06)' : 'transparent' }}>
              <span style={{ fontSize:'18px', width:'24px', textAlign:'center' }}>{LOGOS[e.symbol]||'📊'}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'13px', fontWeight:'700', color:'#0F172A' }}>{e.name} <span style={{ fontSize:'11px', fontWeight:'500', color:'#94A3B8' }}>{e.symbol}</span></div>
                <div style={{ fontSize:'11px', color:'#64748B' }}>{e.time}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:'12px', fontWeight:'600', color:'#334155' }}>{fmt(e.date)}</div>
                <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'2px' }}>
                  <span style={{ fontSize:'10px', fontWeight:'700', color: isToday?'var(--amber)':isClose?'var(--red)':'#94A3B8' }}>{daysUntil(e.date)}</span>
                  {e.confirmed
                    ? <span style={{ fontSize:'9px', fontWeight:'700', color:'#10B981', background:'#DCFCE7', padding:'1px 5px', borderRadius:'4px' }}>CONFIRMED</span>
                    : <span style={{ fontSize:'9px', fontWeight:'600', color:'#94A3B8', background:'#F1F5F9', padding:'1px 5px', borderRadius:'4px' }}>ESTIMATED</span>
                  }
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ padding:'8px 20px', fontSize:'10px', color:'#94A3B8', borderTop:'1px solid #F1F5F9' }}>
        ~ = estimated date · confirm at investor relations · for awareness only
      </div>
    </div>
  )
}
