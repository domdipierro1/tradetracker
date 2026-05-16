import { useState, useEffect } from 'react'

const BASE_CACHE_KEY = 'tt26_econ_v14'
const CACHE_TTL = 60 * 60 * 1000

function normalizeDate(d) {
  if (!d) return ''
  d = String(d).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d
  if (/^\d{2}-\d{2}-\d{4}$/.test(d)) {
    const [m, dy, y] = d.split('-')
    return `${y}-${m}-${dy}`
  }
  if (d.includes('T')) return d.split('T')[0]
  try { const dt = new Date(d); if (!isNaN(dt)) return dt.toISOString().split('T')[0] } catch {}
  return d
}

// Converts ANY time format FF sends → HH:MM
// FF sends times like "8:30am", "10:00am", "2:30pm"
export function formatFFTime(raw) {
  if (!raw || !String(raw).trim()) return 'All Day'
  const s = String(raw).trim().toLowerCase().replace(/\s/g, '')
  if (!s || s === 'allday' || s === 'all day') return 'All Day'
  if (s === 'tentative') return 'Tentative'
  if (s === 'holiday') return 'All Day'

  // Already HH:MM or HH:MM:SS
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) {
    const parts = s.split(':')
    return `${String(parseInt(parts[0])).padStart(2,'0')}:${parts[1]}`
  }

  // 12-hour with am/pm — covers "8:30am", "10:00pm", "2:30am"
  const m = s.match(/^(\d{1,2}):(\d{2})(am|pm)$/)
  if (m) {
    let h = parseInt(m[1], 10)
    const min = m[2], ap = m[3]
    if (ap === 'pm' && h !== 12) h += 12
    if (ap === 'am' && h === 12) h = 0
    return `${String(h).padStart(2,'0')}:${min}`
  }

  // Hour only e.g. "8am", "2pm"
  const m2 = s.match(/^(\d{1,2})(am|pm)$/)
  if (m2) {
    let h = parseInt(m2[1], 10)
    const ap = m2[2]
    if (ap === 'pm' && h !== 12) h += 12
    if (ap === 'am' && h === 12) h = 0
    return `${String(h).padStart(2,'0')}:00`
  }

  // ISO datetime
  if (s.includes('t')) {
    const part = s.split('t')[1]
    if (part) return part.slice(0, 5)
  }

  // Return raw if nothing matched — don't swallow unknown formats
  return raw
}

export function currencyFlag(c) {
  return { USD: '🇺🇸', GBP: '🇬🇧', EUR: '🇪🇺' }[c] || ''
}

export function useEconomicCalendar(weekOffset = 0) {
  const [events,    setEvents]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [fetchedAt, setFetchedAt] = useState(null)

  useEffect(() => {
    async function load() {
      // Check cache — but only use if cache key matches
      try {
        const c = sessionStorage.getItem(BASE_CACHE_KEY + '_w' + weekOffset)
        if (c) {
          const p = JSON.parse(c)
          if (Date.now() - p.ts < CACHE_TTL) {
            setEvents(p.events); setFetchedAt(new Date(p.ts)); setLoading(false); return
          }
        }
      } catch {}

      // Try our Vercel proxy first (best — full server-side fetch)
      // Then CORS proxies as fallback
      const ffFile = weekOffset === 0 ? 'ff_calendar_thisweek.json' : 'ff_calendar_nextweek.json'
      const SOURCES = [
        { url: `/api/calendar?week=${weekOffset}&t=${Math.floor(Date.now()/600000)}`, isOurApi: true },
        { url: `https://corsproxy.io/?url=${encodeURIComponent('https://cdn-nfs.faireconomy.media/' + ffFile)}`, isOurApi: false },
        { url: `https://corsproxy.io/?url=${encodeURIComponent('https://nfs.faireconomy.media/' + ffFile)}`, isOurApi: false },
      ]

      for (const source of SOURCES) {
        try {
          const res = await fetch(source.url, { signal: AbortSignal.timeout(8000) })
          if (!res.ok) continue
          const raw = await res.json()

          // Handle both {events:[]} from our API and raw [] from FF
          let items = source.isOurApi ? (raw.events || []) : (Array.isArray(raw) ? raw : [])
          if (!items.length) continue

          const TARGET = ['USD', 'GBP', 'EUR']
          const filtered = items
            .filter(e => {
              const ccy = e.country || ''
              return TARGET.includes(ccy) && (e.impact === 'High' || e.impact === 'Holiday')
            })
            .map(e => ({
              title:     e.title    || '',
              country:   e.country  || '',
              date:      normalizeDate(e.date || ''),
              time:      e.time     || '',   // preserve raw time string
              impact:    e.impact   || '',
              forecast:  e.forecast || null,
              previous:  e.previous || null,
              actual:    e.actual   || null,
              isHoliday: e.isHoliday || e.impact === 'Holiday' || (e.title || '').toLowerCase().includes('holiday'),
            }))

          setEvents(filtered)
          setFetchedAt(new Date())
          sessionStorage.setItem(BASE_CACHE_KEY + '_w' + weekOffset, JSON.stringify({ events: filtered, ts: Date.now() }))
          setLoading(false)
          return
        } catch { continue }
      }

      // If next week failed, try falling back to this week
      if (weekOffset === 1) {
        setError("Next week's calendar isn't published yet — showing this week")
      } else {
        setError('Could not load calendar')
      }
      setLoading(false)
    }
    load()
  }, [weekOffset])

  function eventsForDate(dateStr) {
    return events.filter(e => e.date === dateStr)
  }

  return { events, loading, error, fetchedAt, eventsForDate }
}
