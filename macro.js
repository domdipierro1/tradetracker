// api/macro.js — Central bank rates + CPI inflation via Trading Economics free guest API
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')

  const BANKS = [
    { id: 'fed',  name: 'Federal Reserve',  currency: 'USD', flag: '🇺🇸', country: 'united-states',  color: '#1D4ED8' },
    { id: 'boe',  name: 'Bank of England',  currency: 'GBP', flag: '🇬🇧', country: 'united-kingdom', color: '#7C3AED' },
    { id: 'ecb',  name: 'European CB',      currency: 'EUR', flag: '🇪🇺', country: 'euro-area',       color: '#065F46' },
    { id: 'boj',  name: 'Bank of Japan',    currency: 'JPY', flag: '🇯🇵', country: 'japan',           color: '#B45309' },
    { id: 'snb',  name: 'Swiss Natl Bank',  currency: 'CHF', flag: '🇨🇭', country: 'switzerland',    color: '#DC2626' },
    { id: 'rba',  name: 'Reserve Bank AU',  currency: 'AUD', flag: '🇦🇺', country: 'australia',      color: '#D97706' },
    { id: 'rbnz', name: 'Reserve Bank NZ',  currency: 'NZD', flag: '🇳🇿', country: 'new-zealand',    color: '#059669' },
    { id: 'boc',  name: 'Bank of Canada',   currency: 'CAD', flag: '🇨🇦', country: 'canada',         color: '#EF4444' },
  ]

  const GK = 'guest:guest'

  async function fetchIndicator(country, indicator) {
    const url = `https://api.tradingeconomics.com/country/indicator/${country}/${indicator}?c=${GK}`
    const r = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(8000),
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const data = await r.json()
    if (!Array.isArray(data) || !data[0]) throw new Error('Empty')
    const d = data[0]
    return {
      value:    d.Value     ?? d.LastValue    ?? null,
      previous: d.PreviousValue               ?? null,
      date:     d.LastUpdate ?? d.DateTime    ?? null,
      unit:     d.Unit                        ?? '%',
    }
  }

  async function fetchBank(bank) {
    const [rate, cpi, gdp] = await Promise.allSettled([
      fetchIndicator(bank.country, 'interest-rate'),
      fetchIndicator(bank.country, 'inflation-cpi'),
      fetchIndicator(bank.country, 'gdp-growth-rate'),
    ])
    return {
      ...bank,
      rate: rate.status === 'fulfilled' ? rate.value : { value: null, error: rate.reason?.message },
      cpi:  cpi.status  === 'fulfilled' ? cpi.value  : { value: null, error: cpi.reason?.message  },
      gdp:  gdp.status  === 'fulfilled' ? gdp.value  : { value: null, error: gdp.reason?.message  },
    }
  }

  try {
    const results = await Promise.allSettled(BANKS.map(b => fetchBank(b)))
    const data = results.map((r, i) =>
      r.status === 'fulfilled' ? r.value : { ...BANKS[i], rate: { value: null }, cpi: { value: null } }
    )
    return res.status(200).json({ ok: true, data, fetched_at: new Date().toISOString() })
  } catch (e) {
    return res.status(200).json({ ok: false, data: [], error: e.message })
  }
}
