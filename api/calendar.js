// api/calendar.js - Forex Factory calendar + bank holidays proxy
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')

  try {
    const ffUrl = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json'
    const response = await fetch(ffUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TradeTracker/1.0)' },
    })
    if (!response.ok) throw new Error(`FF returned ${response.status}`)
    const data = await response.json()

    const TARGET = ['USD', 'GBP', 'EUR']
    const filtered = data.filter(e =>
      (e.impact === 'High' || e.impact === 'Holiday') &&
      TARGET.includes(e.country)
    ).map(e => ({
      title:    e.title,
      country:  e.country,
      date:     e.date,
      time:     e.time,
      impact:   e.impact,
      forecast: e.forecast || null,
      previous: e.previous || null,
      actual:   e.actual   || null,
      isHoliday: e.impact === 'Holiday' || e.title?.toLowerCase().includes('holiday'),
    }))

    return res.status(200).json({ ok: true, events: filtered, fetched_at: new Date().toISOString() })
  } catch (err) {
    return res.status(200).json({ ok: false, events: [], error: err.message, fetched_at: new Date().toISOString() })
  }
}
