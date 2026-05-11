import { useState, useEffect } from 'react'

const CACHE_KEY = 'tt26_econ_v5'
const CACHE_TTL = 60 * 60 * 1000

function normalizeDate(d) {
  if (!d) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d
  if (/^\d{2}-\d{2}-\d{4}$/.test(d)) { const [m,dy,y]=d.split('-'); return `${y}-${m}-${dy}` }
  try { const dt=new Date(d); if(!isNaN(dt)) return dt.toISOString().split('T')[0] } catch {}
  return d
}

// Convert FF time like "8:30am" to "08:30" or keep "All Day" / "Tentative"
export function formatFFTime(t) {
  if (!t || t.trim() === '') return 'All Day'
  const lower = t.toLowerCase().trim()
  if (lower === 'all day' || lower === 'tentative') return lower === 'tentative' ? 'Tentative' : 'All Day'
  const m = lower.match(/(\d{1,2}):(\d{2})(am|pm)/)
  if (!m) return t
  let h = parseInt(m[1])
  const min = m[2], ap = m[3]
  if (ap === 'pm' && h !== 12) h += 12
  if (ap === 'am' && h === 12) h = 0
  return `${String(h).padStart(2,'0')}:${min}`
}

export function currencyFlag(c) {
  return { USD:'🇺🇸', GBP:'🇬🇧', EUR:'🇪🇺' }[c] || '🌍'
}

export function useEconomicCalendar() {
  const [events,    setEvents]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [fetchedAt, setFetchedAt] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const c = sessionStorage.getItem(CACHE_KEY)
        if (c) {
          const p = JSON.parse(c)
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
            .filter(e => (e.impact === 'High' || e.impact === 'Holiday' || (e.title || '').toLowerCase().includes('holiday')) && TARGET.includes(e.country))
            .map(e => ({
              title:     e.title,
              country:   e.country,
              date:      normalizeDate(e.date),
              time:      e.time || '',
              impact:    e.impact,
              forecast:  e.forecast || null,
              previous:  e.previous || null,
              actual:    e.actual   || null,
              isHoliday: e.impact === 'Holiday' || (e.title || '').toLowerCase().includes('holiday'),
            }))

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
