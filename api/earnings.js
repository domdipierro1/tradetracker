export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate=86400')

  const KEY = process.env.FINNHUB_API_KEY || process.env.FINNHUB_KEY || ''
  if (!KEY) {
    return res.status(200).json({ ok: false, earnings: [], error: 'Add FINNHUB_API_KEY to Vercel env vars' })
  }

  const now  = new Date()
  const from = now.toISOString().split('T')[0]
  const to   = new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const TICKERS = ['AAPL','MSFT','AMZN','GOOGL','META','TSLA','NVDA']
  const NAMES   = { AAPL:'Apple', MSFT:'Microsoft', AMZN:'Amazon', GOOGL:'Alphabet', META:'Meta', TSLA:'Tesla', NVDA:'NVIDIA' }

  try {
    // Fetch earnings calendar for all tickers at once
    const url = `https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}&token=${KEY}`
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (!r.ok) throw new Error(`Finnhub returned ${r.status}`)
    const data = await r.json()
    const all  = data?.earningsCalendar || []

    // Filter to Mag 7 only, take next occurrence of each
    const seen = new Set()
    const earnings = all
      .filter(e => TICKERS.includes(e.symbol) && !seen.has(e.symbol) && seen.add(e.symbol))
      .map(e => ({
        symbol: e.symbol,
        name:   NAMES[e.symbol] || e.symbol,
        date:   e.date,
        time:   e.hour === 'amc' ? 'After Market' : e.hour === 'bmo' ? 'Before Market' : e.hour === 'dmh' ? 'During Market' : 'TBC',
        confirmed: true,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return res.status(200).json({ ok: true, earnings, source: 'finnhub' })
  } catch(err) {
    console.error('Earnings error:', err.message)
    return res.status(200).json({ ok: false, earnings: [], error: err.message })
  }
}
