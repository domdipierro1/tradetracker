// src/lib/useEconomicCalendar.js
// Fetches red-folder events from our Vercel proxy
// Caches in sessionStorage so we only fetch once per session

import { useState, useEffect } from 'react'

const CACHE_KEY = 'tt26_econ_events'
const CACHE_TTL = 60 * 60 * 1000 // 1 hour in ms

export function useEconomicCalendar() {
  const [events, setEvents]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [fetchedAt, setFetchedAt] = useState(null)

  useEffect(() => {
    async function load() {
      // Check cache first
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

      // Fetch from our serverless proxy
      try {
        const res = await fetch('/api/calendar')
        const data = await res.json()
        const evs = data.events || []
        setEvents(evs)
        setFetchedAt(new Date())
        // Cache it
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

  // Helper: get events for a specific date string "YYYY-MM-DD"
  function eventsForDate(dateStr) {
    return events.filter(e => {
      if (!e.date) return false
      // FF format is "MM-DD-YYYY"
      const parts = e.date.split('-')
      if (parts.length !== 3) return false
      const normalized = `${parts[2]}-${parts[0]}-${parts[1]}`
      return normalized === dateStr
    })
  }

  // Helper: events for a specific currency
  function eventsForCurrency(currency) {
    return events.filter(e => e.country === currency)
  }

  // Helper: events this week grouped by date
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

// Currency flag emoji
export function currencyFlag(currency) {
  const flags = { USD: '🇺🇸', GBP: '🇬🇧', EUR: '🇪🇺' }
  return flags[currency] || '🌍'
}

// Format FF time "8:30am" → "08:30"
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
