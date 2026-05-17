import { useState, useEffect } from 'react'

const CK = 'tt_econ_v21'
const TTL = 60 * 60 * 1000

export function currencyFlag(c) {
  return { USD:'🇺🇸', GBP:'🇬🇧', EUR:'🇪🇺' }[c] || ''
}

// FF week = Sun to Sat
// Returns the 7 days of the current FF week
export function getFFWeekDays() {
  const now = new Date()
  const dow = now.getDay() // 0=Sun, 6=Sat
  // Start of this FF week = most recent Sunday (or today if Sunday)
  const sunday = new Date(now)
  sunday.setDate(now.getDate() - dow)
  sunday.setHours(0,0,0,0)

  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    const y  = d.getFullYear()
    const m  = String(d.getMonth()+1).padStart(2,'0')
    const dd = String(d.getDate()).padStart(2,'0')
    days.push({
      dateStr:    `${y}-${m}-${dd}`,
      dayName:    d.toLocaleDateString('en-GB', { weekday: 'short' }),
      dayNum:     d.getDate(),
      month:      d.toLocaleDateString('en-GB', { month: 'short' }),
      isWeekend:  d.getDay() === 0 || d.getDay() === 6,
    })
  }
  return days
}

export function useEconomicCalendar() {
  const [events,    setEvents]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [fetchedAt, setFetchedAt] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const c = sessionStorage.getItem(CK)
        if (c) {
          const p = JSON.parse(c)
          if (Date.now() - p.ts < TTL) {
            setEvents(p.events); setFetchedAt(new Date(p.ts))
            setLoading(false); return
          }
        }
      } catch {}

      try {
        const r = await fetch('/api/calendar', { signal: AbortSignal.timeout(12000) })
        if (r.ok) {
          const json = await r.json()
          const evs = json.events || []
          setEvents(evs)
          setFetchedAt(new Date())
          try { sessionStorage.setItem(CK, JSON.stringify({ events: evs, ts: Date.now() })) } catch {}
          setLoading(false)
          return
        }
      } catch {}

      setError('Could not load calendar')
      setLoading(false)
    }
    load()
  }, [])

  function eventsForDate(dateStr) {
    return events.filter(e => e.date === dateStr)
  }

  return { events, loading, error, fetchedAt, eventsForDate }
}
