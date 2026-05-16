// api/calendar.js
// Primary: Finnhub free economic calendar (full year, any date range)
// Fallback: FF thisweek/nextweek JSON

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')

  const TARGET = ['USD', 'GBP', 'EUR']
  const weekOffset = parseInt(req.query?.week || '0', 10) || 0
  const FINNHUB_KEY = process.env.FINNHUB_API_KEY || ''

  function getMonday(offset) {
    const now = new Date()
    const dow = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7)
    monday.setHours(0, 0, 0, 0)
    return monday
  }

  const monday = getMonday(weekOffset)
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
  const from = monday.toISOString().split('T')[0]
  const to   = sunday.toISOString().split('T')[0]

  // Currency mapping for Finnhub
  const CCY_KEYWORDS = {
    USD: ['United States','Federal Reserve','Fed','FOMC','NFP','CPI','GDP','Unemployment','ISM','PMI','Retail','Housing'],
    GBP: ['United Kingdom','UK','Britain','BoE','Bank of England','Claimant','MPC'],
    EUR: ['Euro','Eurozone','ECB','European','Germany','France','Italy','Spain'],
  }

  function parseFinnhub(data) {
    if (!data?.economicCalendar) return null
    const events = data.economicCalendar
    if (!Array.isArray(events) || !events.length) return null

    const EUR_COUNTRIES = ['EU','DE','FR','IT','ES','PT','NL','BE','AT','FI','IE','GR']

    return events
      .map(e => {
        const c = (e.country || '').toUpperCase()
        let country = null
        if (c === 'US') country = 'USD'
        else if (c === 'GB') country = 'GBP'
        else if (EUR_COUNTRIES.includes(c)) country = 'EUR'
        if (!country) return null

        // Finnhub uses 'impact' field: low/medium/high or number 1-3
        const imp = String(e.impact || '').toLowerCase()
        const impNum = parseInt(e.impact)
        const isHigh = imp === 'high' || imp === '3' || impNum === 3 || imp === 'medium' || imp === '2' || impNum === 2
        if (!isHigh) return null

        // Parse date/time
        let date = '', time = ''
        if (e.time) {
          const dt = new Date(e.time * 1000)
          date = dt.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
          time = dt.toLocaleTimeString('en-GB', { timeZone: 'America/New_York', hour:'2-digit', minute:'2-digit', hour12:false })
        } else if (e.date) {
          date = e.date.split('T')[0]
        }

        const fmt = v => v != null && v !== '' ? String(v) : null

        return {
          title:     e.event || '',
          country,
          date,
          time,
          impact:    'High',
          forecast:  fmt(e.estimate),
          previous:  fmt(e.prev),
          actual:    fmt(e.actual),
          isHoliday: false,
        }
      })
      .filter(Boolean)
  }

  function parseFFJson(data) {
    if (!Array.isArray(data) || !data.length) return null
    return data
      .filter(e => TARGET.includes(e.country) && (e.impact === 'High' || e.impact === 'Holiday'))
      .map(e => {
        const raw = e.date || ''; let date = '', time = e.time || ''
        const isHoliday = e.impact === 'Holiday'
        if (raw.includes('T')) {
          try {
            const dt = new Date(raw)
            date = dt.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
            if (!isHoliday) time = dt.toLocaleTimeString('en-GB', { timeZone:'America/New_York', hour:'2-digit', minute:'2-digit', hour12:false })
          } catch { date = raw.split('T')[0] }
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) date = raw
        if (time && /\d(am|pm)/i.test(time)) {
          const m = time.match(/(\d{1,2}):(\d{2})(am|pm)/i)
          if (m) { let h=parseInt(m[1]); if(m[3]==='pm'&&h!==12)h+=12; if(m[3]==='am'&&h===12)h=0; time=`${String(h).padStart(2,'0')}:${m[2]}` }
        }
        return { title:e.title||'', country:e.country||'', date, time, impact:e.impact||'High', forecast:e.forecast||null, previous:e.previous||null, actual:e.actual||null, isHoliday }
      })
  }

  const H = { 'User-Agent':'Mozilla/5.0', 'Accept':'application/json', 'Referer':'https://www.forexfactory.com/' }

  // Try Finnhub first (if key available — works for any week)
  if (FINNHUB_KEY) {
    try {
      const url = `https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}&token=${FINNHUB_KEY}`
      const r = await fetch(url, { signal: AbortSignal.timeout(8000) })
      if (r.ok) {
        const data = await r.json()
        const events = parseFinnhub(data)
        if (events?.length) {
          return res.status(200).json({ ok:true, events, source:'finnhub', week:weekOffset, from, to, fetched_at:new Date().toISOString() })
        }
      }
    } catch(e) { console.error('Finnhub failed:', e.message) }
  }

  // FF JSON fallback (only works for this week / next week)
  const ffSlug = weekOffset === 0 ? 'thisweek' : 'nextweek'
  for (const base of ['https://cdn-nfs.faireconomy.media', 'https://nfs.faireconomy.media']) {
    try {
      const r = await fetch(`${base}/ff_calendar_${ffSlug}.json`, { headers: H, signal: AbortSignal.timeout(8000) })
      if (!r.ok) continue
      const data = await r.json()
      const events = parseFFJson(data)
      if (events?.length) {
        return res.status(200).json({ ok:true, events, source:'ff_json', week:weekOffset, from, to, fetched_at:new Date().toISOString() })
      }
    } catch(e) { continue }
  }

  return res.status(200).json({
    ok: false, events: [], week: weekOffset, from, to,
    error: FINNHUB_KEY ? 'Could not load calendar' : 'Add FINNHUB_API_KEY to Vercel env vars for full year access',
    fetched_at: new Date().toISOString()
  })
}
