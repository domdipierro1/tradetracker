import { useState, useEffect } from 'react'

const CK = 'tt_econ_v27'
const TTL = 60 * 60 * 1000

export function currencyFlag(c) {
  return { USD:'🇺🇸', GBP:'🇬🇧', EUR:'🇪🇺' }[c] || ''
}

export function formatFFTime(t) {
  if (!t || t.trim() === '') return ''
  const m = t.match(/(\d{1,2}):(\d{2})(am|pm)/i)
  if (!m) return t
  let h = parseInt(m[1])
  if (m[3].toLowerCase() === 'pm' && h !== 12) h += 12
  if (m[3].toLowerCase() === 'am' && h === 12) h = 0
  return `${String(h).padStart(2,'0')}:${m[2]}`
}

// FF week = Sun to Sat
// Returns the 7 days of the current FF week
export function getFFWeekDays() {
  const now = new Date()
  const dow = now.getDay() // 0=Sun, 6=Sat
  // Start of this FF week = most recent Sunday (or today if Sunday)
  const sunday = new Date(now)
  sunday.setDate(now.getDate() - dow)
  sunday.setHours(0,0,0,0)

  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    const y  = d.getFullYear()
    const m  = String(d.getMonth()+1).padStart(2,'0')
    const dd = String(d.getDate()).padStart(2,'0')
    days.push({
      dateStr:    `${y}-${m}-${dd}`,
      dayName:    d.toLocaleDateString('en-GB', { weekday: 'short' }),
      dayNum:     d.getDate(),
      month:      d.toLocaleDateString('en-GB', { month: 'short' }),
      isWeekend:  d.getDay() === 0 || d.getDay() === 6,
    })
  }
  return days
}

export function useEconomicCalendar() {
  const [events,    setEvents]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [fetchedAt, setFetchedAt] = useState(null)

  useEffect(() => {
    async function load() {
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

      try {
        const r = await fetch('/api/calendar', { signal: AbortSignal.timeout(12000) })
        if (r.ok) {
          const json = await r.json()
          const evs = json.events || []
          setEvents(evs)
          setFetchedAt(new Date())
          try { sessionStorage.setItem(CK, JSON.stringify({ events: evs, ts: Date.now() })) } catch {}
          setLoading(false)
          return
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

// ── SHARED DAY CLASSIFICATION ────────────────────────────────────
// Returns { type, label, tradeable } or null (= Normal Day, no note).
// Used by journal + calendar + econ page so the logic never diverges.
// Types: 'holiday' (hard no-trade), 'high' (big-three news day),
//        'high-prior' (day before big-three), 'red' (other red-folder day),
//        'red-prior' (day before red-folder), 'quiet' (no-news Monday).
export function getNoTradeReason(dateStr, allEvents) {
  if (!dateStr || !Array.isArray(allEvents)) return null
  const d = new Date(dateStr + 'T12:00:00')
  const dow = d.getDay()
  if (dow < 1 || dow > 5) return null // weekends

  const isNFP = e => {
    const t = (e.title || '').toLowerCase()
    if (t.includes('adp')) return false
    return t.includes('non-farm') || t.includes('nonfarm') || t.includes('nfp')
  }
  const isCPI = e => {
    const t = (e.title || '').toLowerCase()
    return t.includes('cpi') || t.includes('consumer price')
  }
  const isFOMC = e => {
    const t = (e.title || '').toLowerCase()
    if (t.includes('minute')) return false
    return t.includes('fomc') || t.includes('federal funds') || t.includes('fed funds') || t.includes('rate decision')
  }
  const isBigThree = e => isNFP(e) || isCPI(e) || isFOMC(e)

  const evOn = ds => allEvents.filter(e => e.date === ds && e.country === 'USD')
  const usdToday = evOn(dateStr)
  const tmr = new Date(d); tmr.setDate(d.getDate() + 1)
  const usdTmr = evOn(tmr.toLocaleDateString('en-CA'))

  const bigThreeName = e => isCPI(e) ? 'US CPI' : isNFP(e) ? 'US NFP' : isFOMC(e) ? 'US FOMC' : null

  // 1. Bank/market holiday — the only true No Trade Day
  if (usdToday.find(e => e.isHoliday)) return { type: 'holiday', label: 'No Trade Day · US bank holiday', tradeable: false }

  // 2. High Impact News Day — day OF CPI / NFP / FOMC (tradeable, caution)
  const bigToday = usdToday.find(isBigThree)
  if (bigToday) return { type: 'high', label: `High Impact News Day (${bigThreeName(bigToday)}) · trade with caution`, tradeable: true }

  // 3. Prior to High Impact News Day — day BEFORE big-three (tradeable, caution)
  const bigTmr = usdTmr.find(isBigThree)
  if (bigTmr) return { type: 'high-prior', label: `Prior to High Impact News Day (${bigThreeName(bigTmr)} tomorrow) · trade with caution`, tradeable: true }

  // 4. Red Folder News Day — day OF any other USD high-impact event (tradeable, caution)
  const redToday = usdToday.find(e => !e.isHoliday && !isBigThree(e))
  if (redToday) return { type: 'red', label: 'Red Folder News Day · trade with caution', tradeable: true }

  // 5. Prior to Red Folder News Day — day BEFORE other red-folder (tradeable, caution)
  const redTmr = usdTmr.find(e => !e.isHoliday && !isBigThree(e))
  if (redTmr) return { type: 'red-prior', label: 'Prior to Red Folder News Day · trade with caution', tradeable: true }

  // 6. No-News Monday — Monday with no USD news, unless the week has NFP/CPI
  if (dow === 1 && usdToday.length === 0) {
    const weekHasKey = [0,1,2,3,4].some(off => {
      const wd = new Date(d); wd.setDate(d.getDate() + off)
      return evOn(wd.toLocaleDateString('en-CA')).some(e => isNFP(e) || isCPI(e))
    })
    if (!weekHasKey) return { type: 'quiet', label: 'No-News Monday', tradeable: true }
  }

  return null // Normal Day
}
