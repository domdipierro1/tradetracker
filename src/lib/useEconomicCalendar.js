import { useState, useEffect } from 'react'

const BASE_CACHE_KEY = 'tt26_econ_v15'
const CACHE_TTL = 60 * 60 * 1000

function getMonday(offset) {
  const now = new Date()
  const dow = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function getWeekDates(offset) {
  const monday = getMonday(offset)
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday); d.setDate(monday.getDate() + i)
    const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    days.push({ date: ds, dateStr: ds, label: dayNames[d.getDay()], dayName: dayNames[d.getDay()], isWeekend: d.getDay()===0||d.getDay()===6, dateObj: d })
  }
  return days
}

export function currencyFlag(c) {
  return { USD:'🇺🇸', GBP:'🇬🇧', EUR:'🇪🇺', JPY:'🇯🇵', CAD:'🇨🇦', AUD:'🇦🇺', NZD:'🇳🇿', CHF:'🇨🇭' }[c] || '🏳️'
}

export function formatFFTime(t) { return t || '' }

export function useEconomicCalendar() {
  const weekOffset = 0
  const [events,    setEvents]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [fetchedAt, setFetchedAt] = useState(null)
  const CACHE_KEY = BASE_CACHE_KEY + '_w' + weekOffset

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
      const monday = getMonday(weekOffset)
      const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
      const ffSlug  = 'thisweek'
      const ffParam = `${months[monday.getMonth()]}${monday.getDate()}.${monday.getFullYear()}`

      function parseFFJson(data) {
        if (!Array.isArray(data) || !data.length) return null
        return data
          .filter(e => TARGET.includes(e.country) && (e.impact === 'High' || e.impact === 'Holiday'))
          .map(e => {
            const raw = e.date || ''; let date = '', time = e.time || ''
            const isHoliday = e.impact === 'Holiday'
            if (raw.includes('T')) {
              try {
                const dt = new Date(raw)
                date = dt.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
                if (!isHoliday) time = dt.toLocaleTimeString('en-GB', { timeZone: 'America/New_York', hour:'2-digit', minute:'2-digit', hour12:false })
              } catch { date = raw.split('T')[0] }
            } else if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) date = raw
            else if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) { const [m,d,y]=raw.split('-'); date=`${y}-${m}-${d}` }
            if (time && /\d(am|pm)/i.test(time)) {
              const m = time.match(/(\d{1,2}):(\d{2})(am|pm)/i)
              if (m) { let h=parseInt(m[1]); if(m[3]==='pm'&&h!==12)h+=12; if(m[3]==='am'&&h===12)h=0; time=`${String(h).padStart(2,'0')}:${m[2]}` }
            }
            return { title:e.title||'', country:e.country||'', date, time, impact:e.impact||'High', forecast:e.forecast||null, previous:e.previous||null, actual:e.actual||null, isHoliday }
          })
      }

      // Sources to try in order
      const SOURCES = [
        { url: `/api/calendar?t=${Math.floor(Date.now()/600000)}`, isOurApi: true },
        { url: `https://corsproxy.io/?url=${encodeURIComponent('https://cdn-nfs.faireconomy.media/ff_calendar_thisweek.json')}`, isOurApi: false },
        { url: `https://api.allorigins.win/raw?url=${encodeURIComponent('https://nfs.faireconomy.media/ff_calendar_thisweek.json')}`, isOurApi: false },
      ]

      for (const source of SOURCES) {
        try {
          const res = await fetch(source.url, { signal: AbortSignal.timeout(10000) })
          if (!res.ok) continue
          let items = []

          {
            const raw = await res.json()
            const data = source.isOurApi ? (raw.events || []) : (Array.isArray(raw) ? raw : [])
            items = source.isOurApi ? data : (parseFFJson(data) || [])
            if (source.isOurApi) {
              // Already filtered and parsed by our API
              items = data
            }
          if (!items.length) continue

          // Filter to target currencies if not already done
          const filtered = source.isOurApi ? items : items.filter(e => TARGET.includes(e.country||''))

          if (!filtered.length) continue

          setEvents(filtered)
          setFetchedAt(new Date())
          try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ events: filtered, ts: Date.now() })) } catch(e) {}
          setLoading(false)
          return
        } catch(e) { continue }
      }

      setError('Could not load calendar')
      setLoading(false)
    }
    load()
  }, [weekOffset])

  function eventsForDate(dateStr) {
    return events.filter(e => e.date === dateStr)
  }

  return { events, loading, error, fetchedAt, eventsForDate, getWeekDays: () => getWeekDates(weekOffset) }
}
