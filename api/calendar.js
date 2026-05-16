export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600')

  const TARGET = ['USD', 'GBP', 'EUR']
  const weekOffset = parseInt(req.query?.week || '0', 10) || 0

  function getMonday(offset) {
    const now = new Date()
    const dow = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7)
    monday.setHours(0, 0, 0, 0)
    return monday
  }

  const monday = getMonday(weekOffset)
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
  const from = monday.toISOString().split('T')[0]
  const to   = sunday.toISOString().split('T')[0]

  // FF month name for URL
  const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
  const ffWeekParam = `${months[monday.getMonth()]}${monday.getDate()}.${monday.getFullYear()}`

  function parseFFJson(data) {
    if (!Array.isArray(data) || !data.length) return null
    const events = data.filter(e => TARGET.includes(e.country) && (e.impact === 'High' || e.impact === 'Holiday')).map(e => {
      const raw = e.date || ''; let date = '', time = e.time || ''
      const isHoliday = e.impact === 'Holiday'
      if (raw.includes('T')) {
        try {
          const dt = new Date(raw)
          date = dt.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
          if (!isHoliday) time = dt.toLocaleTimeString('en-GB', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false })
        } catch { date = raw.split('T')[0] }
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) date = raw
      if (time && /\d(am|pm)/i.test(time)) {
        const m = time.match(/(\d{1,2}):(\d{2})(am|pm)/i)
        if (m) { let h = parseInt(m[1]); if (m[3]==='pm'&&h!==12) h+=12; if (m[3]==='am'&&h===12) h=0; time=`${String(h).padStart(2,'0')}:${m[2]}` }
      }
      return { title: e.title||'', country: e.country||'', date, time, impact: e.impact||'High', forecast: e.forecast||null, previous: e.previous||null, actual: e.actual||null, isHoliday }
    })
    return events.length ? events : null
  }

  const H = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Referer': 'https://www.forexfactory.com/',
    'Origin': 'https://www.forexfactory.com',
    'Cache-Control': 'no-cache',
  }

  // Try all sources
  const jsonUrls = [
    weekOffset === 0 ? 'https://cdn-nfs.faireconomy.media/ff_calendar_thisweek.json' : 'https://cdn-nfs.faireconomy.media/ff_calendar_nextweek.json',
    weekOffset === 0 ? 'https://nfs.faireconomy.media/ff_calendar_thisweek.json' : 'https://nfs.faireconomy.media/ff_calendar_nextweek.json',
  ]

  for (const url of jsonUrls) {
    try {
      const r = await fetch(url, { headers: H, signal: AbortSignal.timeout(10000) })
      if (!r.ok) { console.log(`${url}: ${r.status}`); continue }
      const data = await r.json()
      const events = parseFFJson(data)
      if (events?.length) {
        return res.status(200).json({ ok: true, events, source: url, week: weekOffset, from, to, fetched_at: new Date().toISOString() })
      }
    } catch(e) { console.error(`${url}: ${e.message}`) }
  }

  // Fallback: FF calendar page HTML scrape for any week
  try {
    const url = `https://www.forexfactory.com/calendar?week=${ffWeekParam}`
    console.log('Trying HTML scrape:', url)
    const r = await fetch(url, {
      headers: { ...H, Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
      signal: AbortSignal.timeout(12000),
    })
    if (r.ok) {
      const html = await r.text()
      // Check if we got actual calendar data
      if (html.includes('calendar__cell') || html.includes('calendarComponentStates')) {
        // Try to extract JSON data embedded in page
        const jsonMatch = html.match(/calendarComponentStates\s*=\s*(\{[\s\S]+?\});/) ||
                          html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]+?\});/)
        if (jsonMatch) {
          try {
            const pageData = JSON.parse(jsonMatch[1])
            console.log('Got embedded JSON from FF page')
            // Try to find calendar events in the page data
          } catch(e) {}
        }
        return res.status(200).json({ ok: false, events: [], week: weekOffset, from, to, error: `FF page loaded but parsing HTML isn't supported in serverless. Week: ${ffWeekParam}`, fetched_at: new Date().toISOString() })
      }
    }
  } catch(e) { console.error('HTML scrape failed:', e.message) }

  return res.status(200).json({ ok: false, events: [], week: weekOffset, from, to, error: 'Could not load calendar', fetched_at: new Date().toISOString() })
}
