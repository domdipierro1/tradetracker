// Fetches FF calendar directly in the browser
// Uses a CORS proxy since FF blocks direct requests
import { useState, useEffect } from 'react'

const CACHE_KEY = 'tt26_econ_v2'
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

export function useEconomicCalendar() {
  const [events, setEvents]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [fetchedAt, setFetchedAt] = useState(null)

  useEffect(() => {
    async function load() {
      // Check cache
      try {
        const cached = sessionStorage.getItem(CACHE_KEY)
        if (cached) {
          const p = JSON.parse(cached)
          if (Date.now() - p.ts < CACHE_TTL) {
            setEvents(p.events); setFetchedAt(new Date(p.ts)); setLoading(false); return
          }
        }
      } catch {}

      // Try our own API first, then fall back to direct CORS proxy
      const sources = [
        '/api/calendar',
        'https://corsproxy.io/?url=https://nfs.faireconomy.media/ff_calendar_thisweek.json',
        'https://api.allorigins.win/raw?url=https://nfs.faireconomy.media/ff_calendar_thisweek.json',
      ]

      for (const src of sources) {
        try {
          const res = await fetch(src, { signal: AbortSignal.timeout(8000) })
          if (!res.ok) continue
          const raw = await res.json()

          // Handle both our API format {events:[]} and raw FF format [{...}]
          const items = Array.isArray(raw) ? raw : (raw.events || [])

          const TARGET = ['USD','GBP','EUR']
          const filtered = items
            .filter(e => e.impact === 'High' && TARGET.includes(e.country))
            .map(e => ({
              title:    e.title,
              country:  e.country,
              date:     e.date,
              time:     e.time,
              impact:   e.impact,
              forecast: e.forecast || null,
              previous: e.previous || null,
              actual:   e.actual   || null,
            }))

          setEvents(filtered)
          setFetchedAt(new Date())
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ events: filtered, ts: Date.now() }))
          setLoading(false)
          return
        } catch (err) {
          continue
        }
      }

      setError('Could not load — try refreshing')
      setLoading(false)
    }
    load()
  }, [])

  function eventsForDate(dateStr) {
    return events.filter(e => {
      if (!e.date) return false
      const p = e.date.split('-')
      if (p.length !== 3) return false
      return `${p[2]}-${p[0]}-${p[1]}` === dateStr
    })
  }

  function eventsByDate() {
    const map = {}
    events.forEach(e => {
      if (!e.date) return
      const p = e.date.split('-')
      if (p.length !== 3) return
      const k = `${p[2]}-${p[0]}-${p[1]}`
      if (!map[k]) map[k] = []
      map[k].push(e)
    })
    return map
  }

  return { events, loading, error, fetchedAt, eventsForDate, eventsByDate }
}

export function currencyFlag(c) {
  return { USD:'🇺🇸', GBP:'🇬🇧', EUR:'🇪🇺' }[c] || '🌍'
}

export function formatFFTime(t) {
  if (!t) return 'All Day'
  if (t.toLowerCase().includes('tentative')) return 'Tentative'
  try {
    const m = t.match(/(\d+):(\d+)(am|pm)/i)
    if (!m) return t
    let h = parseInt(m[1])
    const min = m[2], ap = m[3].toLowerCase()
    if (ap === 'pm' && h !== 12) h += 12
    if (ap === 'am' && h === 12) h = 0
    return `${String(h).padStart(2,'0')}:${min}`
  } catch { return t }
}
