// api/calendar.js
// Vercel serverless function — proxies Forex Factory calendar JSON
// Filters to red folder events for USD, GBP, EUR only
// Called by the React app to avoid CORS issues

export default async function handler(req, res) {
  // Allow CORS from your own app
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200') // Cache 1hr on Vercel edge

  try {
    // Forex Factory JSON feed — returns current week's events
    const ffUrl = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json'

    const response = await fetch(ffUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TradeTracker/1.0)',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`FF feed returned ${response.status}`)
    }

    const data = await response.json()

    // Filter: only HIGH impact (red folder) for USD, GBP, EUR
    const TARGET_CURRENCIES = ['USD', 'GBP', 'EUR']
    const filtered = data.filter(event =>
      event.impact === 'High' &&
      TARGET_CURRENCIES.includes(event.country)
    )

    // Clean and format the response
    const events = filtered.map(e => ({
      title:    e.title,
      country:  e.country,
      date:     e.date,       // e.g. "01-13-2026"
      time:     e.time,       // e.g. "8:30am"
      impact:   e.impact,
      forecast: e.forecast || null,
      previous: e.previous || null,
      actual:   e.actual   || null,
    }))

    return res.status(200).json({
      ok: true,
      events,
      fetched_at: new Date().toISOString(),
      count: events.length,
    })

  } catch (err) {
    console.error('Calendar proxy error:', err.message)

    // Return empty rather than crashing the app
    return res.status(200).json({
      ok: false,
      events: [],
      error: err.message,
      fetched_at: new Date().toISOString(),
      count: 0,
    })
  }
}
