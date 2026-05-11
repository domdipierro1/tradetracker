import { useState, useEffect } from 'react'

const CACHE_KEY = 'tt26_econ_v3'
const CACHE_TTL = 60 * 60 * 1000

// Normalize any date format to YYYY-MM-DD
function normalizeDate(dateStr) {
  if (!dateStr) return ''
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr
  // MM-DD-YYYY (Forex Factory format)
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const [m, d, y] = dateStr.split('-')
    return `${y}-${m}-${d}`
  }
  // Try parsing as date
  try {
    const d = new Date(dateStr)
    if (!isNaN(d)) {
      return d.toISOString().split('T')[0]
    }
  } catch {}
  return dateStr
}

export function useEconomicCalendar() {
  const [events, setEvents]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [fetchedAt, setFetchedAt] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY)
        if (cached) {
          const p = JSON.parse(cached)
          if (Date.now() - p.ts < CACHE_TTL) {
            setEvents(p.events); setFetchedAt(new Date(p.ts)); setLoading(false); return
          }
        }
      } catch {}

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
          const items = Array.isArray(raw) ? raw : (raw.events || [])

          const TARGET = ['USD','GBP','EUR']
          const filtered = items
            .filter(e => e.impact === 'High' && TARGET.includes(e.country))
            .map(e => ({
              title:    e.title,
              country:  e.country,
              date:     normalizeDate(e.date), // always YYYY-MM-DD
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
        } catch { continue }
      }

      setError('Could not load — check connection')
      setLoading(false)
    }
    load()
  }, [])

  // dateStr is always YYYY-MM-DD here
  function eventsForDate(dateStr) {
    return events.filter(e => e.date === dateStr)
  }

  return { events, loading, error, fetchedAt, eventsForDate }
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
