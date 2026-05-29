export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate=86400')

  const KEY = process.env.FINNHUB_API_KEY || process.env.FINNHUB_KEY || ''
  const TICKERS = ['AAPL','MSFT','AMZN','GOOGL','META','TSLA','NVDA']
  const NAMES   = { AAPL:'Apple', MSFT:'Microsoft', AMZN:'Amazon', GOOGL:'Alphabet', META:'Meta', TSLA:'Tesla', NVDA:'NVIDIA' }

  // Estimated Q2 2026 dates based on historical patterns (not yet officially announced)
  const ESTIMATES = {
    TSLA:  { date:'2026-07-22', time:'After Market' },
    GOOGL: { date:'2026-07-28', time:'After Market' },
    META:  { date:'2026-07-29', time:'After Market' },
    MSFT:  { date:'2026-07-29', time:'After Market' },
    AAPL:  { date:'2026-07-30', time:'After Market' },
    AMZN:  { date:'2026-07-30', time:'After Market' },
    NVDA:  { date:'2026-08-27', time:'After Market' },
  }

  const today = new Date().toISOString().split('T')[0]
  const confirmed = {}

  // Try Finnhub for confirmed dates
  if (KEY) {
    try {
      const to = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const url = `https://finnhub.io/api/v1/calendar/earnings?from=${today}&to=${to}&token=${KEY}`
      const r = await fetch(url, { signal: AbortSignal.timeout(10000) })
      if (r.ok) {
        const data = await r.json()
        const seen = new Set()
        for (const e of (data?.earningsCalendar || [])) {
          if (TICKERS.includes(e.symbol) && !seen.has(e.symbol)) {
            seen.add(e.symbol)
            confirmed[e.symbol] = {
              date: e.date,
              time: e.hour === 'amc' ? 'After Market' : e.hour === 'bmo' ? 'Before Market' : 'TBC',
            }
          }
        }
      }
    } catch(e) { console.error('Finnhub error:', e.message) }
  }

  // Merge: use confirmed if available, else estimate
  const earnings = TICKERS
    .map(symbol => {
      const conf = confirmed[symbol]
      const est  = ESTIMATES[symbol]
      if (conf) return { symbol, name: NAMES[symbol], ...conf, confirmed: true }
      if (est && est.date >= today) return { symbol, name: NAMES[symbol], ...est, confirmed: false }
      return null
    })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date))

  return res.status(200).json({ ok: true, earnings })
}
