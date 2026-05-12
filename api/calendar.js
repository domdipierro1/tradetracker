// api/calendar.js
// Proxies Forex Factory calendar via JBlanked API (no key needed for week endpoint)
// Falls back to direct FF JSON feed

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600')

  const TARGET = ['USD', 'GBP', 'EUR']

  // Try JBlanked FF API first — returns properly formatted times
  const sources = [
    {
      url: 'https://www.jblanked.com/news/api/forex-factory/calendar/week/?impact=High',
      parse: (data) => {
        // JBlanked returns array of events with date_utc, time, currency, event, impact
        if (!Array.isArray(data)) return null
        return data
          .filter(e => TARGET.includes(e.currency))
          .map(e => ({
            title:     e.event || e.title || e.name || '',
            country:   e.currency,
            date:      e.date_utc ? e.date_utc.split('T')[0] : (e.date || ''),
            time:      e.time || e.time_utc || '',
            impact:    'High',
            forecast:  e.forecast || null,
            previous:  e.previous || null,
            actual:    e.actual   || null,
            isHoliday: false,
          }))
      }
    },
    {
      url: 'https://nfs.faireconomy.media/ff_calendar_thisweek.json',
      parse: (data) => {
        if (!Array.isArray(data)) return null
        return data
          .filter(e => (e.impact === 'High' || e.impact === 'Holiday') && TARGET.includes(e.country))
          .map(e => ({
            title:     e.title  || '',
            country:   e.country,
            date:      e.date   || '',
            time:      e.time   || '',
            impact:    e.impact,
            forecast:  e.forecast || null,
            previous:  e.previous || null,
            actual:    e.actual   || null,
            isHoliday: e.impact === 'Holiday' || (e.title || '').toLowerCase().includes('holiday'),
          }))
      }
    }
  ]

  for (const source of sources) {
    try {
      const response = await fetch(source.url, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      })
      if (!response.ok) continue
      const data = await response.json()
      const events = source.parse(data)
      if (!events || events.length === 0) continue

      return res.status(200).json({
        ok: true,
        events,
        source: source.url,
        fetched_at: new Date().toISOString(),
      })
    } catch (err) {
      console.error(`Source ${source.url} failed:`, err.message)
      continue
    }
  }

  return res.status(200).json({ ok: false, events: [], error: 'All sources failed', fetched_at: new Date().toISOString() })
}
