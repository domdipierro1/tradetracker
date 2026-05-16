// api/calendar.js
// Uses MQL5 calendar range (free, no key, full year) as primary
// Falls back to FF thisweek/nextweek JSON
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600')

  const TARGET = ['USD', 'GBP', 'EUR']
  const weekOffset = parseInt(req.query?.week || '0', 10) || 0

  // Calculate Mon–Sun for the requested week
  function getWeekRange(offset) {
    const now = new Date()
    const dow = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7)
    monday.setHours(0, 0, 0, 0)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    const fmt = d => d.toISOString().split('T')[0]
    return { from: fmt(monday), to: fmt(sunday) }
  }

  const { from, to } = getWeekRange(weekOffset)

  function parseFFEvents(data) {
    if (!Array.isArray(data) || !data.length) return null
    return data
      .filter(e => TARGET.includes(e.country) && (e.impact === 'High' || e.impact === 'Holiday'))
      .map(e => {
        const raw = e.date || ''
        const isHoliday = e.impact === 'Holiday' || (e.title||'').toLowerCase().includes('holiday')
        let date = '', time = isHoliday ? 'All Day' : (e.time || '')
        if (raw.includes('T')) {
          try {
            const dt = new Date(raw)
            date = dt.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
            if (!isHoliday) time = dt.toLocaleTimeString('en-GB', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false })
          } catch { date = raw.split('T')[0] }
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) { date = raw }
        else if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) { const [m,d,y]=raw.split('-'); date=`${y}-${m}-${d}` }
        if (time && /\d(am|pm)/i.test(time)) {
          const m = time.match(/(\d{1,2}):(\d{2})(am|pm)/i)
          if (m) { let h=parseInt(m[1]); if(m[3]==='pm'&&h!==12)h+=12; if(m[3]==='am'&&h===12)h=0; time=`${String(h).padStart(2,'0')}:${m[2]}` }
        }
        return { title:e.title||'', country:e.country||'', date, time, impact:e.impact||'', forecast:e.forecast||null, previous:e.previous||null, actual:e.actual||null, isHoliday }
      })
  }

  function parseMQL5Events(data) {
    if (!Array.isArray(data) || !data.length) return null
    const CCY_MAP = { 'USD':'USD','EUR':'EUR','GBP':'GBP','United States':'USD','Euro':'EUR','United Kingdom':'GBP' }
    return data
      .filter(e => {
        const ccy = e.Currency || e.currency || ''
        return TARGET.includes(ccy) && (e.Importance === 3 || e.impact === 'High')
      })
      .map(e => {
        const rawDate = e.DateTime || e.date || ''
        let date = '', time = ''
        if (rawDate.includes('T')) {
          try {
            const dt = new Date(rawDate)
            date = dt.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
            time = dt.toLocaleTimeString('en-GB', { timeZone: 'America/New_York', hour:'2-digit', minute:'2-digit', hour12:false })
          } catch { date = rawDate.split('T')[0] }
        } else { date = rawDate }
        return {
          title:   e.EventName || e.Name || e.title || '',
          country: e.Currency || e.currency || '',
          date, time,
          impact:   'High',
          forecast: e.ForecastValue ?? e.forecast ?? null,
          previous: e.PreviousValue ?? e.previous ?? null,
          actual:   e.ActualValue ?? e.actual ?? null,
          isHoliday: false,
        }
      })
  }

  const SOURCES = [
    // MQL5 range — free, no key, full year
    {
      url: `https://www.mql5.com/en/economic-calendar/content?from=${from}&to=${to}&currencies=USD,GBP,EUR&importance=3`,
      parse: parseMQL5Events,
      headers: { 'User-Agent':'Mozilla/5.0', 'Accept':'application/json', 'X-Requested-With':'XMLHttpRequest', 'Referer':'https://www.mql5.com/en/economic-calendar' },
    },
    // MQL5 alternative URL format
    {
      url: `https://www.mql5.com/en/economic-calendar/content?from=${from}&to=${to}&importance=3`,
      parse: parseMQL5Events,
      headers: { 'User-Agent':'Mozilla/5.0', 'Accept':'application/json', 'X-Requested-With':'XMLHttpRequest', 'Referer':'https://www.mql5.com/en/economic-calendar' },
    },
    // FF CDN
    {
      url: weekOffset === 0
        ? 'https://cdn-nfs.faireconomy.media/ff_calendar_thisweek.json'
        : 'https://cdn-nfs.faireconomy.media/ff_calendar_nextweek.json',
      parse: parseFFEvents,
      headers: { 'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept':'application/json', 'Referer':'https://www.forexfactory.com/', 'Origin':'https://www.forexfactory.com' },
    },
    // FF direct
    {
      url: weekOffset === 0
        ? 'https://nfs.faireconomy.media/ff_calendar_thisweek.json'
        : 'https://nfs.faireconomy.media/ff_calendar_nextweek.json',
      parse: parseFFEvents,
      headers: { 'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept':'application/json', 'Referer':'https://www.forexfactory.com/' },
    },
  ]

  for (const source of SOURCES) {
    try {
      const r = await fetch(source.url, {
        headers: source.headers || { 'User-Agent':'Mozilla/5.0', 'Accept':'application/json' },
        signal: AbortSignal.timeout(10000),
      })
      if (!r.ok) { console.log(`${source.url}: ${r.status}`); continue }
      const data = await r.json()
      const events = source.parse(data)
      if (!events || events.length === 0) continue
      console.log(`Got ${events.length} events from ${source.url}`)
      return res.status(200).json({ ok: true, events, source: source.url, week: weekOffset, from, to, fetched_at: new Date().toISOString() })
    } catch (e) { console.error(`${source.url}: ${e.message}`); continue }
  }

  return res.status(200).json({
    ok: false, events: [], week: weekOffset, from, to,
    error: weekOffset === 1 ? "Next week's calendar isn't published yet — check back Sunday morning" : 'Could not load calendar',
    fetched_at: new Date().toISOString()
  })
}
