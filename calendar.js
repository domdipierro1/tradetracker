// api/calendar.js — FF calendar with proper next week support
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600')

  const TARGET = ['USD', 'GBP', 'EUR']
  const weekOffset = parseInt(req.query?.week || '0', 10) || 0

  function parseEvents(data) {
    if (!Array.isArray(data) || data.length === 0) return null
    return data
      .filter(e => TARGET.includes(e.country) && (e.impact === 'High' || e.impact === 'Holiday'))
      .map(e => {
        const rawDate = e.date || ''
        const isHoliday = e.impact === 'Holiday' || (e.title || '').toLowerCase().includes('holiday')
        let date = '', time = isHoliday ? 'All Day' : (e.time || '')
        if (rawDate.includes('T')) {
          try {
            const dt = new Date(rawDate)
            if (!isNaN(dt)) {
              date = dt.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
              if (!isHoliday) {
                time = dt.toLocaleTimeString('en-GB', {
                  timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false
                })
              }
            }
          } catch { date = rawDate.split('T')[0] }
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
          date = rawDate
        } else if (/^\d{2}-\d{2}-\d{4}$/.test(rawDate)) {
          const [m, d, y] = rawDate.split('-'); date = `${y}-${m}-${d}`
        }
        // Convert 12h time
        if (time && /\d(am|pm)/i.test(time)) {
          const m = time.match(/(\d{1,2}):(\d{2})(am|pm)/i)
          if (m) {
            let h = parseInt(m[1]); const min = m[2], ap = m[3].toLowerCase()
            if (ap === 'pm' && h !== 12) h += 12
            if (ap === 'am' && h === 12) h = 0
            time = `${String(h).padStart(2,'0')}:${min}`
          }
        }
        return { title: e.title||'', country: e.country||'', date, time, impact: e.impact||'', forecast: e.forecast||null, previous: e.previous||null, actual: e.actual||null, isHoliday }
      })
  }

  const ffSlug = weekOffset === 0 ? 'thisweek' : 'nextweek'

  // Multiple CDN attempts with different headers
  const URLS = [
    `https://cdn-nfs.faireconomy.media/ff_calendar_${ffSlug}.json`,
    `https://nfs.faireconomy.media/ff_calendar_${ffSlug}.json`,
  ]

  const HEADERS_LIST = [
    {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.forexfactory.com/',
      'Origin': 'https://www.forexfactory.com',
      'Cache-Control': 'no-cache',
    },
    {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'application/json',
    },
  ]

  for (const url of URLS) {
    for (const headers of HEADERS_LIST) {
      try {
        const response = await fetch(url, { headers, signal: AbortSignal.timeout(10000) })
        if (!response.ok) { console.log(`${url} → ${response.status}`); continue }
        const data = await response.json()
        const events = parseEvents(data)
        if (!events || events.length === 0) continue
        return res.status(200).json({ ok: true, events, source: url, week: weekOffset, fetched_at: new Date().toISOString() })
      } catch (err) { console.error(`${url}: ${err.message}`); continue }
    }
  }

  // Next week not available yet
  if (weekOffset === 1) {
    return res.status(200).json({
      ok: false, events: [],
      error: "Next week's calendar isn't available yet — Forex Factory publishes it mid-week.",
      week: weekOffset, fetched_at: new Date().toISOString()
    })
  }

  return res.status(200).json({ ok: false, events: [], error: 'Could not load calendar', fetched_at: new Date().toISOString() })
}
