import { useState, useEffect } from 'react'

const CACHE_KEY = 'tt26_econ_v15_w0'
const CACHE_TTL = 60 * 60 * 1000

function getWeekDates() {
  const now = new Date()
  const dow = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1))
  monday.setHours(0, 0, 0, 0)
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday); d.setDate(monday.getDate() + i)
    const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    const names = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    days.push({ date: ds, dateStr: ds, label: names[d.getDay()], dayName: names[d.getDay()], isWeekend: d.getDay()===0||d.getDay()===6, dateObj: d })
  }
  return days
}

export function currencyFlag(c) {
  return { USD:'🇺🇸', GBP:'🇬🇧', EUR:'🇪🇺', JPY:'🇯🇵', CAD:'🇨🇦', AUD:'🇦🇺', NZD:'🇳🇿', CHF:'🇨🇭' }[c] || '🏳️'
}

export function formatFFTime(t) { return t || '' }

export function useEconomicCalendar() {
  const [events,    setEvents]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [fetchedAt, setFetchedAt] = useState(null)

  useEffect(() => {
    setLoading(true); setEvents([]); setError(null)

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
      } catch(e) {}

      const TARGET = ['USD', 'GBP', 'EUR']

      function parseFFJson(raw) {
        const data = Array.isArray(raw) ? raw : (raw.events || [])
        if (!data.length) return null
        return data
          .filter(e => TARGET.includes(e.country) && (e.impact === 'High' || e.impact === 'Holiday'))
          .map(e => {
            const r = e.date || ''; let date = '', time = e.time || ''
            const isHoliday = e.impact === 'Holiday'
            if (r.includes('T')) {
              try {
                const dt = new Date(r)
                date = dt.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
                if (!isHoliday) time = dt.toLocaleTimeString('en-GB', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false })
              } catch { date = r.split('T')[0] }
            } else if (/^\d{4}-\d{2}-\d{2}$/.test(r)) date = r
            else if (/^\d{2}-\d{2}-\d{4}$/.test(r)) { const [m,d,y]=r.split('-'); date=`${y}-${m}-${d}` }
            if (time && /\d(am|pm)/i.test(time)) {
              const m = time.match(/(\d{1,2}):(\d{2})(am|pm)/i)
              if (m) { let h=parseInt(m[1]); if(m[3]==='pm'&&h!==12)h+=12; if(m[3]==='am'&&h===12)h=0; time=`${String(h).padStart(2,'0')}:${m[2]}` }
            }
            return { title:e.title||'', country:e.country||'', date, time, impact:e.impact||'High', forecast:e.forecast||null, previous:e.previous||null, actual:e.actual||null, isHoliday }
          })
      }

      const SOURCES = [
        `/api/calendar?t=${Math.floor(Date.now()/600000)}`,
        'https://corsproxy.io/?url=https%3A%2F%2Fcdn-nfs.faireconomy.media%2Fff_calendar_thisweek.json',
        'https://api.allorigins.win/raw?url=https%3A%2F%2Fnfs.faireconomy.media%2Fff_calendar_thisweek.json',
      ]

      for (const url of SOURCES) {
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
          if (!res.ok) continue
          const raw = await res.json()
          const events = parseFFJson(raw)
          if (!events || !events.length) continue
          setEvents(events)
          setFetchedAt(new Date())
          try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ events, ts: Date.now() })) } catch(e) {}
          setLoading(false)
          return
        } catch(e) { continue }
      }

      setError('Could not load calendar')
      setLoading(false)
    }
    load()
  }, [])

  function eventsForDate(dateStr) {
    return events.filter(e => e.date === dateStr)
  }

  return { events, loading, error, fetchedAt, eventsForDate, getWeekDays: getWeekDates }
}
