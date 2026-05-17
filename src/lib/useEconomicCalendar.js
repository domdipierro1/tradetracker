import { useState, useEffect } from 'react'

// Fresh cache key — clears all previous broken caches
const CK = 'tt_econ_v20'
const TTL = 60 * 60 * 1000

export function currencyFlag(c) {
  return { USD:'🇺🇸', GBP:'🇬🇧', EUR:'🇪🇺' }[c] || ''
}

export function formatFFTime(t) {
  if (!t || t.trim() === '') return ''
  return t
}

export function useEconomicCalendar() {
  const [events,    setEvents]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [fetchedAt, setFetchedAt] = useState(null)

  useEffect(() => {
    async function load() {
      // Cache check
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

      // Our Vercel API handles the date parsing correctly
      try {
        const r = await fetch('/api/calendar', { signal: AbortSignal.timeout(10000) })
        if (r.ok) {
          const json = await r.json()
          if (json.events && json.events.length > 0) {
            setEvents(json.events)
            setFetchedAt(new Date())
            try { sessionStorage.setItem(CK, JSON.stringify({ events: json.events, ts: Date.now() })) } catch {}
            setLoading(false)
            return
          }
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
