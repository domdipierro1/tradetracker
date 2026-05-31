// api/earnings.js
// Fetches Mag 7 earnings dates from multiple free sources
// Primary: FMP free tier (no key needed for basic calendar)
// Fallback: hardcoded known dates

const MAG7_TICKERS = ['AAPL','MSFT','GOOGL','AMZN','NVDA','META','TSLA']
const MAG7_META = {
  AAPL:  { company: 'Apple',     color: '#555555', logo: '' },
  MSFT:  { company: 'Microsoft', color: '#00A4EF', logo: 'M' },
  GOOGL: { company: 'Alphabet',  color: '#4285F4', logo: 'G' },
  AMZN:  { company: 'Amazon',    color: '#FF9900', logo: 'a' },
  NVDA:  { company: 'Nvidia',    color: '#76B900', logo: 'N' },
  META:  { company: 'Meta',      color: '#0866FF', logo: 'f' },
  TSLA:  { company: 'Tesla',     color: '#CC0000', logo: 'T' },
}

// Hardcoded fallback — Q2 2026 season (Jul-Aug 2026)
const FALLBACK = [
  { ticker:'GOOGL', date:'2026-07-28', time:'After Close', quarter:'Q2 2026' },
  { ticker:'TSLA',  date:'2026-07-22', time:'After Close', quarter:'Q2 2026' },
  { ticker:'MSFT',  date:'2026-07-29', time:'After Close', quarter:'Q2 2026' },
  { ticker:'META',  date:'2026-07-29', time:'After Close', quarter:'Q2 2026' },
  { ticker:'AAPL',  date:'2026-07-30', time:'After Close', quarter:'Q2 2026' },
  { ticker:'AMZN',  date:'2026-07-30', time:'After Close', quarter:'Q2 2026' },
  { ticker:'NVDA',  date:'2026-08-27', time:'After Close', quarter:'Q2 2026' },
]

function buildResponse(earnings) {
  return earnings
    .filter(e => MAG7_TICKERS.includes(e.ticker))
    .map(e => ({
      ...e,
      ...MAG7_META[e.ticker],
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate=86400') // 12hr cache

  // Try FMP free API (no key needed for basic earnings calendar)
  // Gets next 3 months of earnings
  try {
    const today = new Date().toISOString().split('T')[0]
    const future = new Date(); future.setMonth(future.getMonth() + 3)
    const to = future.toISOString().split('T')[0]

    const url = `https://financialmodelingprep.com/api/v3/earning_calendar?from=${today}&to=${to}&apikey=demo`
    const r = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    })

    if (r.ok) {
      const data = await r.json()
      if (Array.isArray(data) && data.length > 0) {
        const mag7 = data
          .filter(e => MAG7_TICKERS.includes(e.symbol))
          .map(e => ({
            ticker:  e.symbol,
            date:    e.date,
            time:    e.time === 'bmo' ? 'Before Open' : e.time === 'amc' ? 'After Close' : 'During Market',
            quarter: e.fiscalDateEnding ? `Q ending ${e.fiscalDateEnding}` : '',
            eps_est: e.epsEstimated,
            rev_est: e.revenueEstimated,
          }))

        if (mag7.length > 0) {
          return res.status(200).json({
            ok: true,
            earnings: buildResponse(mag7),
            source: 'FMP',
            fetched_at: new Date().toISOString(),
          })
        }
      }
    }
  } catch (e) {
    console.error('FMP failed:', e.message)
  }

  // Try Alpha Vantage earnings calendar (truly free, no key)
  try {
    const url = 'https://www.alphavantage.co/query?function=EARNINGS_CALENDAR&horizon=3month&apikey=demo'
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (r.ok) {
      const text = await r.text()
      // Alpha Vantage returns CSV
      const lines = text.split('\n').slice(1).filter(Boolean)
      const mag7 = lines
        .map(line => {
          const [symbol,,reportDate,,fiscalDateEnding,,,] = line.split(',')
          return { ticker: symbol?.trim(), date: reportDate?.trim(), quarter: fiscalDateEnding?.trim(), time: 'TBC' }
        })
        .filter(e => MAG7_TICKERS.includes(e.ticker) && e.date)

      if (mag7.length > 0) {
        return res.status(200).json({
          ok: true,
          earnings: buildResponse(mag7),
          source: 'AlphaVantage',
          fetched_at: new Date().toISOString(),
        })
      }
    }
  } catch (e) {
    console.error('AlphaVantage failed:', e.message)
  }

  // Fallback to hardcoded dates
  return res.status(200).json({
    ok: true,
    earnings: buildResponse(FALLBACK),
    source: 'fallback',
    fetched_at: new Date().toISOString(),
    note: 'Using estimated dates — live API unavailable',
  })
}
