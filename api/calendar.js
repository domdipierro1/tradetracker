// api/calendar.js — FF calendar with week offset support
// ?week=0 = this week, ?week=1 = next week, ?week=2 = week after, etc.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200')

  const TARGET = ['USD', 'GBP', 'EUR']
  const weekOffset = parseInt(req.query?.week || '0', 10) || 0

  // FF endpoints: thisweek, nextweek — for further weeks we use nextweek repeatedly
  // FF only provides thisweek and nextweek as named endpoints
  // For week 0: thisweek, week 1: nextweek, week 2+: not available from FF directly
  const FF_URLS = {
    0: [
      'https://cdn-nfs.faireconomy.media/ff_calendar_thisweek.json',
      'https://nfs.faireconomy.media/ff_calendar_thisweek.json',
    ],
    1: [
      'https://cdn-nfs.faireconomy.media/ff_calendar_nextweek.json',
      'https://nfs.faireconomy.media/ff_calendar_nextweek.json',
    ],
  }

  const urls = FF_URLS[weekOffset] || FF_URLS[0]

  function parseEvents(data) {
    if (!Array.isArray(data) || data.length === 0) return null
    return data
      .filter(e => TARGET.includes(e.country) && (e.impact === 'High' || e.impact === 'Holiday'))
      .map(e => {
        const rawDate = e.date || ''
        const rawTime = e.time || ''
        const isHoliday = e.impact === 'Holiday' || (e.title || '').toLowerCase().includes('holiday')
        let date = '', time = isHoliday ? 'All Day' : ''

        if (rawDate.includes('T')) {
          try {
            const dt = new Date(rawDate)
            if (!isNaN(dt)) {
              date = dt.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
              if (!isHoliday) {
                time = dt.toLocaleTimeString('en-GB', {
                  timeZone: 'America/New_York',
                  hour: '2-digit', minute: '2-digit', hour12: false
                })
              }
            }
          } catch { date = rawDate.split('T')[0]; time = rawTime }
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
          date = rawDate; time = isHoliday ? 'All Day' : rawTime
        } else if (/^\d{2}-\d{2}-\d{4}$/.test(rawDate)) {
          const [m, d, y] = rawDate.split('-')
          date = `${y}-${m}-${d}`; time = isHoliday ? 'All Day' : rawTime
        } else { date = rawDate; time = isHoliday ? 'All Day' : rawTime }

        // Convert 12h to 24h
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

        return { title: e.title||'', country: e.country||'', date, time, impact: e.impact||'', forecast: e.forecast||null, previous: e.previous||null, actual: e.actual||null, isHoliday }
      })
  }

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json', 'Referer': 'https://www.forexfactory.com/' },
        signal: AbortSignal.timeout(8000),
      })
      if (!response.ok) continue
      const data = await response.json()
      const events = parseEvents(data)
      if (!events) continue
      return res.status(200).json({ ok: true, events, source: url, week: weekOffset, fetched_at: new Date().toISOString() })
    } catch (err) { console.error(`${url} failed:`, err.message); continue }
  }

  return res.status(200).json({ ok: false, events: [], error: weekOffset > 1 ? 'Only this week and next week are available from Forex Factory' : 'All sources failed', fetched_at: new Date().toISOString() })
}
