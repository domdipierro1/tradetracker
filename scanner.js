// api/scanner.js
// Fetches PDH, PDL and current price for all 24 instruments from Yahoo Finance
// Called server-side to avoid CORS issues

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300') // 2 min cache

  const SYMBOLS = [
    { sym: 'AUD/USD', yf: 'AUDUSD=X', dp: 5 },
    { sym: 'EUR/USD', yf: 'EURUSD=X', dp: 5 },
    { sym: 'GBP/USD', yf: 'GBPUSD=X', dp: 5 },
    { sym: 'NZD/USD', yf: 'NZDUSD=X', dp: 5 },
    { sym: 'USD/CAD', yf: 'USDCAD=X', dp: 5 },
    { sym: 'USD/CHF', yf: 'USDCHF=X', dp: 5 },
    { sym: 'USD/JPY', yf: 'USDJPY=X', dp: 3 },
    { sym: 'NQ',      yf: 'NQ=F',     dp: 2 },
    { sym: 'ES',      yf: 'ES=F',     dp: 2 },
    { sym: 'Gold',    yf: 'GC=F',     dp: 2 },
    { sym: 'Silver',  yf: 'SI=F',     dp: 3 },
  ]

  async function fetchOne(symbol) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol.yf}?interval=1d&range=5d`
    try {
      const r = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      })
      if (!r.ok) return { ...symbol, ok: false, error: `HTTP ${r.status}` }
      const json = await r.json()
      const result = json?.chart?.result?.[0]
      if (!result) return { ...symbol, ok: false, error: 'No result' }

      const quotes = result.indicators?.quote?.[0]
      const highs  = quotes?.high  || []
      const lows   = quotes?.low   || []
      const meta   = result.meta

      const price = meta?.regularMarketPrice ?? meta?.previousClose ?? null
      const prev  = meta?.previousClose ?? null
      const n     = highs.length

      // Previous completed day = second to last bar
      const pdh = n >= 2 ? highs[n - 2] : (n === 1 ? highs[0] : null)
      const pdl = n >= 2 ? lows[n - 2]  : (n === 1 ? lows[0]  : null)

      return { ...symbol, ok: true, price, prev, pdh, pdl }
    } catch (err) {
      return { ...symbol, ok: false, error: err.message }
    }
  }

  try {
    // Fetch all in parallel
    const results = await Promise.allSettled(SYMBOLS.map(s => fetchOne(s)))
    const data = results.map((r, i) =>
      r.status === 'fulfilled' ? r.value : { ...SYMBOLS[i], ok: false, error: 'Failed' }
    )

    return res.status(200).json({
      ok: true,
      data,
      fetched_at: new Date().toISOString(),
      count: data.filter(d => d.ok).length,
    })
  } catch (err) {
    return res.status(200).json({
      ok: false,
      data: [],
      error: err.message,
      fetched_at: new Date().toISOString(),
    })
  }
}
