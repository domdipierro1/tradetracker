// api/rates.js — Central bank interest rates via multiple free sources
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200') // cache 1hr

  const BANKS = [
    { id: 'fed',   name: 'Federal Reserve',  currency: 'USD', flag: '🇺🇸', color: '#1D4ED8' },
    { id: 'boe',   name: 'Bank of England',  currency: 'GBP', flag: '🇬🇧', color: '#7C3AED' },
    { id: 'ecb',   name: 'European CB',      currency: 'EUR', flag: '🇪🇺', color: '#065F46' },
    { id: 'boj',   name: 'Bank of Japan',    currency: 'JPY', flag: '🇯🇵', color: '#B45309' },
    { id: 'snb',   name: 'Swiss Natl Bank',  currency: 'CHF', flag: '🇨🇭', color: '#DC2626' },
    { id: 'rba',   name: 'Reserve Bank AU',  currency: 'AUD', flag: '🇦🇺', color: '#D97706' },
    { id: 'rbnz',  name: 'Reserve Bank NZ',  currency: 'NZD', flag: '🇳🇿', color: '#059669' },
    { id: 'boc',   name: 'Bank of Canada',   currency: 'CAD', flag: '🇨🇦', color: '#DC2626' },
  ]

  // Trading Economics countries for each bank
  const TE_COUNTRIES = {
    fed:  'united-states',
    boe:  'united-kingdom',
    ecb:  'euro-area',
    boj:  'japan',
    snb:  'switzerland',
    rba:  'australia',
    rbnz: 'new-zealand',
    boc:  'canada',
  }

  async function fetchRate(bankId) {
    const country = TE_COUNTRIES[bankId]
    const url = `https://api.tradingeconomics.com/country/indicator/${country}/interest-rate?c=guest:guest`
    try {
      const r = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000)
      })
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      const data = await r.json()
      if (!Array.isArray(data) || !data[0]) throw new Error('No data')
      const d = data[0]
      return {
        rate:     d.Value ?? d.LastValue ?? null,
        previous: d.PreviousValue ?? null,
        date:     d.LastUpdate ?? d.DateTime ?? null,
        unit:     d.Unit ?? '%',
      }
    } catch(e) {
      return { rate: null, previous: null, date: null, error: e.message }
    }
  }

  try {
    const results = await Promise.allSettled(BANKS.map(b => fetchRate(b.id)))
    const rates = BANKS.map((bank, i) => ({
      ...bank,
      ...(results[i].status === 'fulfilled' ? results[i].value : { rate: null, error: 'Failed' })
    }))
    return res.status(200).json({ ok: true, rates, fetched_at: new Date().toISOString() })
  } catch(e) {
    return res.status(200).json({ ok: false, rates: [], error: e.message })
  }
}
