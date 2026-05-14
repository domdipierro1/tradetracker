// api/calendar.js — Fetches FF calendar, parses datetime correctly
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200')

  const TARGET = ['USD', 'GBP', 'EUR']

  // Try both FF CDN URLs
  const URLS = [
    'https://cdn-nfs.faireconomy.media/ff_calendar_thisweek.json',
    'https://nfs.faireconomy.media/ff_calendar_thisweek.json',
  ]

  for (const url of URLS) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Referer': 'https://www.forexfactory.com/',
        },
        signal: AbortSignal.timeout(8000),
      })

      if (!response.ok) continue
      const data = await response.json()
      if (!Array.isArray(data) || data.length === 0) continue

      // Log first event to debug
      console.log('FF first event:', JSON.stringify(data[0]))

      const events = data
        .filter(e => TARGET.includes(e.country) && (e.impact === 'High' || e.impact === 'Holiday'))
        .map(e => {
          // FF date field can be:
          // 1. ISO datetime: "2026-05-14T08:30:00-0400" (contains time!)
          // 2. Date only: "2026-05-14"
          // 3. Old format: "05-14-2026"
          let date = ''
          let time = e.time || ''

          const rawDate = e.date || ''

          if (rawDate.includes('T')) {
            // ISO datetime — extract date and time from it
            const dt = new Date(rawDate)
            if (!isNaN(dt)) {
              // Date in YYYY-MM-DD
              date = dt.toISOString().split('T')[0]
              // Time as HH:MM in local NY time (UTC-4 or UTC-5)
              // The datetime already includes timezone offset so just format it
              const localH = String(dt.getHours()).padStart(2, '0')
              const localM = String(dt.getMinutes()).padStart(2, '0')
              // If no separate time field, derive from datetime
              if (!time) {
                time = `${localH}:${localM}`
              }
            }
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
            date = rawDate
          } else if (/^\d{2}-\d{2}-\d{4}$/.test(rawDate)) {
            const [m, d, y] = rawDate.split('-')
            date = `${y}-${m}-${d}`
          } else {
            date = rawDate
          }

          // Convert 12h time to 24h if needed (e.g. "8:30am" -> "08:30")
          if (time && /\d(am|pm)/i.test(time)) {
            const m = time.match(/(\d{1,2}):(\d{2})(am|pm)/i)
            if (m) {
              let h = parseInt(m[1])
              const min = m[2], ap = m[3].toLowerCase()
              if (ap === 'pm' && h !== 12) h += 12
              if (ap === 'am' && h === 12) h = 0
              time = `${String(h).padStart(2,'0')}:${min}`
            }
          }

          const isHoliday = e.impact === 'Holiday' || (e.title || '').toLowerCase().includes('holiday')
          if (isHoliday) time = 'All Day'

          return {
            title:     e.title    || '',
            country:   e.country  || '',
            date,
            time,
            impact:    e.impact   || '',
            forecast:  e.forecast || null,
            previous:  e.previous || null,
            actual:    e.actual   || null,
            isHoliday,
          }
        })

      return res.status(200).json({ ok: true, events, source: url, fetched_at: new Date().toISOString() })
    } catch (err) {
      console.error(`${url} failed:`, err.message)
      continue
    }
  }

  return res.status(200).json({ ok: false, events: [], error: 'All sources failed', fetched_at: new Date().toISOString() })
}
