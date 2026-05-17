import { useState, useEffect } from 'react'

const CACHE_KEY = 'tt26_econ_events'
const CACHE_TTL = 60 * 60 * 1000

export function useEconomicCalendar() {
  const [events, setEvents]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [fetchedAt, setFetchedAt] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (Date.now() - parsed.ts < CACHE_TTL) {
            setEvents(parsed.events)
            setFetchedAt(new Date(parsed.ts))
            setLoading(false)
            return
          }
        }
      } catch {}

      try {
        const res = await fetch('/api/calendar')
        const data = await res.json()
        const evs = data.events || []
        setEvents(evs)
        setFetchedAt(new Date())
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ events: evs, ts: Date.now() }))
      } catch (err) {
        setError('Could not load economic calendar')
        setEvents([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function eventsForDate(dateStr) {
    return events.filter(e => {
      if (!e.date) return false
      const parts = e.date.split('-')
      if (parts.length !== 3) return false
      const normalized = `${parts[2]}-${parts[0]}-${parts[1]}`
      return normalized === dateStr
    })
  }

  function eventsForCurrency(currency) {
    return events.filter(e => e.country === currency)
  }

  function eventsByDate() {
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

  return { events, loading, error, fetchedAt, eventsForDate, eventsForCurrency, eventsByDate }
}

export function currencyFlag(currency) {
  const flags = { USD: '🇺🇸', GBP: '🇬🇧', EUR: '🇪🇺' }
  return flags[currency] || '🌍'
}

export function formatFFTime(timeStr) {
  if (!timeStr) return 'All Day'
  if (timeStr.toLowerCase().includes('tentative')) return 'Tentative'
  try {
    const match = timeStr.match(/(\d+):(\d+)(am|pm)/i)
    if (!match) return timeStr
    let h = parseInt(match[1])
    const m = match[2]
    const ampm = match[3].toLowerCase()
    if (ampm === 'pm' && h !== 12) h += 12
    if (ampm === 'am' && h === 12) h = 0
    return `${String(h).padStart(2,'0')}:${m}`
  } catch {
    return timeStr
  }
}
