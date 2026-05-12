import { useState, useEffect } from 'react'

const CACHE_KEY = 'tt26_econ_v7'
const CACHE_TTL = 60 * 60 * 1000

// Normalize ANY date → YYYY-MM-DD
function normalizeDate(d) {
  if (!d) return ''
  d = String(d).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d
  if (/^\d{2}-\d{2}-\d{4}$/.test(d)) {
    const [m,dy,y] = d.split('-'); return `${y}-${m}-${dy}`
  }
  // ISO with time: "2026-05-13T08:30:00Z"
  if (d.includes('T')) return d.split('T')[0]
  try { const dt=new Date(d); if(!isNaN(dt)) return dt.toISOString().split('T')[0] } catch{}
  return d
}

// Convert ANY time string → HH:MM
// Handles: "8:30am", "10:00am", "2:30pm", "08:30", "08:30:00", ISO times
export function formatFFTime(t) {
  if (!t || !String(t).trim()) return 'All Day'
  const s = String(t).trim().toLowerCase()
  if (s === '' || s === 'all day' || s === 'allday' || s === 'null') return 'All Day'
  if (s === 'tentative') return 'Tentative'

  // HH:MM:SS or HH:MM
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(s)) return s.slice(0,5)

  // ISO with time: "2026-05-13T08:30:00Z"
  if (s.includes('t')) {
    const timePart = s.split('t')[1]
    if (timePart) return timePart.slice(0,5)
  }

  // 12-hour: "8:30am", "10:00pm", "2:30am"
  const m = s.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/)
  if (m) {
    let h = parseInt(m[1], 10)
    const min = m[2], ap = m[3]
    if (ap === 'pm' && h !== 12) h += 12
    if (ap === 'am' && h === 12) h = 0
    return `${String(h).padStart(2,'0')}:${min}`
  }

  // Just hour: "8am", "2pm"
  const m2 = s.match(/^(\d{1,2})\s*(am|pm)$/)
  if (m2) {
    let h = parseInt(m2[1], 10)
    const ap = m2[2]
    if (ap === 'pm' && h !== 12) h += 12
    if (ap === 'am' && h === 12) h = 0
    return `${String(h).padStart(2,'0')}:00`
  }

  return t // return raw if we can't parse
}

export function currencyFlag(c) {
  return { USD:'🇺🇸', GBP:'🇬🇧', EUR:'🇪🇺' }[c] || ''
}

export function useEconomicCalendar() {
  const [events,    setEvents]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [fetchedAt, setFetchedAt] = useState(null)

  useEffect(() => {
    async function load() {
      // Check cache
      try {
        const c = sessionStorage.getItem(CACHE_KEY)
        if (c) {
          const p = JSON.parse(c)
          if (Date.now() - p.ts < CACHE_TTL) {
            setEvents(p.events); setFetchedAt(new Date(p.ts)); setLoading(false); return
          }
        }
      } catch {}

      // Try our API proxy first, then direct CORS proxies
      const SOURCES = [
        '/api/calendar',
        'https://corsproxy.io/?url=https://nfs.faireconomy.media/ff_calendar_thisweek.json',
        'https://api.allorigins.win/raw?url=https://nfs.faireconomy.media/ff_calendar_thisweek.json',
      ]

      for (const src of SOURCES) {
        try {
          const res = await fetch(src, { signal: AbortSignal.timeout(8000) })
          if (!res.ok) continue
          const raw = await res.json()

          // Handle both {events:[]} from our API and raw [] from FF
          let items = Array.isArray(raw) ? raw : (raw.events || [])
          if (!items.length) continue

          const TARGET = ['USD','GBP','EUR']
          const filtered = items
            .filter(e => {
              const ccy = e.country || e.currency || ''
              const impact = e.impact || ''
              return TARGET.includes(ccy) && (impact === 'High' || impact === 'Holiday')
            })
            .map(e => {
              const ccy = e.country || e.currency || ''
              const rawTime = e.time || e.time_utc || ''
              const rawDate = e.date || e.date_utc || ''
              return {
                title:     e.title || e.event || e.name || '',
                country:   ccy,
                date:      normalizeDate(rawDate),
                time:      rawTime,   // keep raw — formatted at display time
                impact:    e.impact  || 'High',
                forecast:  e.forecast || null,
                previous:  e.previous || null,
                actual:    e.actual   || null,
                isHoliday: e.isHoliday || e.impact === 'Holiday' || (e.title||'').toLowerCase().includes('holiday'),
              }
            })

          setEvents(filtered)
          setFetchedAt(new Date())
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ events: filtered, ts: Date.now() }))
          setLoading(false)
          return
        } catch { continue }
      }

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
