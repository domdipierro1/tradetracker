// api/calendar.js
// Uses JBlanked range API for reliable any-week fetching
// ?week=0 = this week, ?week=1 = next week
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200')

  const TARGET = ['USD', 'GBP', 'EUR']
  const weekOffset = parseInt(req.query?.week || '0', 10) || 0

  // Calculate Mon-Sun date range for the requested week
  function getWeekRange(offset) {
    const now = new Date()
    const dow = now.getDay() // 0=Sun
    const monday = new Date(now)
    monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1) + (offset * 7))
    monday.setHours(0,0,0,0)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    const fmt = d => d.toISOString().split('T')[0]
    return { from: fmt(monday), to: fmt(sunday) }
  }

  const { from, to } = getWeekRange(weekOffset)

  // Try JBlanked range API first (most reliable, supports any week)
  // Then fall back to FF direct files for this week / next week
  const SOURCES = [
    {
      url: `https://www.jblanked.com/news/api/forex-factory/calendar/range/?from=${from}&to=${to}&impact=High`,
      parse: (data) => {
        if (!Array.isArray(data)) return null
        return data
          .filter(e => TARGET.includes(e.currency || e.country))
          .map(e => ({
            title:    e.event || e.title || '',
            country:  e.currency || e.country || '',
            date:     e.date_utc ? e.date_utc.split('T')[0] : (e.date || ''),
            time:     e.time || '',
            impact:   'High',
            forecast: e.forecast || null,
            previous: e.previous || null,
            actual:   e.actual || null,
            isHoliday: false,
          }))
      }
    },
    {
      url: weekOffset === 0
        ? 'https://cdn-nfs.faireconomy.media/ff_calendar_thisweek.json'
        : 'https://cdn-nfs.faireconomy.media/ff_calendar_nextweek.json',
      parse: (data) => {
        if (!Array.isArray(data)) return null
        return data
          .filter(e => TARGET.includes(e.country) && (e.impact === 'High' || e.impact === 'Holiday'))
          .map(e => {
            const rawDate = e.date || ''
            const isHoliday = e.impact === 'Holiday' || (e.title || '').toLowerCase().includes('holiday')
            let date = '', time = isHoliday ? 'All Day' : (e.time || '')
            if (rawDate.includes('T')) {
              try {
                const dt = new Date(rawDate)
                date = dt.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
                if (!isHoliday) {
                  time = dt.toLocaleTimeString('en-GB', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false })
                }
              } catch { date = rawDate.split('T')[0] }
            } else if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
              date = rawDate
            } else if (/^\d{2}-\d{2}-\d{4}$/.test(rawDate)) {
              const [m, d, y] = rawDate.split('-'); date = `${y}-${m}-${d}`
            }
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
    }
  ]

  for (const source of SOURCES) {
    try {
      const response = await fetch(source.url, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json', 'Referer': 'https://www.forexfactory.com/' },
        signal: AbortSignal.timeout(8000),
      })
      if (!response.ok) continue
      const data = await response.json()
      const events = source.parse(data)
      if (!events || events.length === 0) continue
      return res.status(200).json({ ok: true, events, source: source.url, week: weekOffset, from, to, fetched_at: new Date().toISOString() })
    } catch (err) { console.error(`Failed:`, err.message); continue }
  }

  return res.status(200).json({ ok: false, events: [], error: 'All sources failed', week: weekOffset, from, to, fetched_at: new Date().toISOString() })
}
