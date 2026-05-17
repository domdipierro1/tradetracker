// api/calendar.js
// Vercel serverless function — proxies Forex Factory calendar JSON
// Filters to red folder events for USD, GBP, EUR only

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')

  try {
    const ffUrl = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json'
    const response = await fetch(ffUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TradeTracker/1.0)',
        'Accept': 'application/json',
      },
    })
    if (!response.ok) throw new Error(`FF feed returned ${response.status}`)
    const data = await response.json()
    const TARGET_CURRENCIES = ['USD', 'GBP', 'EUR']
    const filtered = data.filter(event =>
      event.impact === 'High' &&
      TARGET_CURRENCIES.includes(event.country)
    )
    const events = filtered.map(e => ({
      title:    e.title,
      country:  e.country,
      date:     e.date,
      time:     e.time,
      impact:   e.impact,
      forecast: e.forecast || null,
      previous: e.previous || null,
      actual:   e.actual   || null,
    }))
    return res.status(200).json({ ok: true, events, fetched_at: new Date().toISOString(), count: events.length })
  } catch (err) {
    console.error('Calendar proxy error:', err.message)
    return res.status(200).json({ ok: false, events: [], error: err.message, fetched_at: new Date().toISOString(), count: 0 })
  }
}
