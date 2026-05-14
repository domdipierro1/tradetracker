// api/calendar.js — Fetches FF calendar with correct EST times
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200')

  const TARGET = ['USD', 'GBP', 'EUR']

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

      // Log first event for debugging
      console.log('FF sample:', JSON.stringify(data[0]))

      const events = data
        .filter(e => TARGET.includes(e.country) && (e.impact === 'High' || e.impact === 'Holiday'))
        .map(e => {
          const rawDate = e.date || ''
          const rawTime = e.time || ''
          const isHoliday = e.impact === 'Holiday' || (e.title || '').toLowerCase().includes('holiday')

          let date = ''
          let time = isHoliday ? 'All Day' : ''

          if (rawDate.includes('T')) {
            // ISO datetime like "2026-05-14T08:30:00-0400"
            // Parse it and convert to EST (UTC-5) or EDT (UTC-4)
            // Easiest: use Intl to format in America/New_York timezone
            try {
              const dt = new Date(rawDate)
              if (!isNaN(dt)) {
                // Get date in NY timezone
                const nyDateStr = dt.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
                date = nyDateStr // already YYYY-MM-DD from en-CA locale

                if (!isHoliday) {
                  // Get time in NY timezone
                  const nyTimeStr = dt.toLocaleTimeString('en-GB', {
                    timeZone: 'America/New_York',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })
                  time = nyTimeStr // e.g. "08:30"
                }
              }
            } catch (err) {
              // Fallback: just split on T
              date = rawDate.split('T')[0]
              time = rawTime
            }
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
            date = rawDate
            time = isHoliday ? 'All Day' : rawTime
          } else if (/^\d{2}-\d{2}-\d{4}$/.test(rawDate)) {
            const [m, d, y] = rawDate.split('-')
            date = `${y}-${m}-${d}`
            time = isHoliday ? 'All Day' : rawTime
          } else {
            date = rawDate
            time = isHoliday ? 'All Day' : rawTime
          }

          // Convert 12h time string to 24h if still needed
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

      return res.status(200).json({
        ok: true,
        events,
        source: url,
        fetched_at: new Date().toISOString(),
        server_tz: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
    } catch (err) {
      console.error(`${url} failed:`, err.message)
      continue
    }
  }

  return res.status(200).json({ ok: false, events: [], error: 'All sources failed', fetched_at: new Date().toISOString() })
}
