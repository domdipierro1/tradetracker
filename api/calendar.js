export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200')

  const TARGET = ['USD', 'GBP', 'EUR']

  // FF week = Sun-Sat. On Sunday, "this week" on FF is actually in nextweek.json
  // because FF's week starts Sunday, and today being Sunday means we want
  // the week that starts today — which FF calls "next week"
  const nowUTC = new Date()
  const dayEST = parseInt(nowUTC.toLocaleString('en-US', { timeZone:'America/New_York', weekday:'short' }).slice(0,3) === 'Sun' ? '0' : '1')
  const isEST_Sunday = nowUTC.toLocaleDateString('en-US', { timeZone:'America/New_York', weekday:'long' }) === 'Sunday'

  // Try nextweek first on Sunday, otherwise thisweek first
  const urls = isEST_Sunday
    ? [
        'https://cdn-nfs.faireconomy.media/ff_calendar_nextweek.json',
        'https://nfs.faireconomy.media/ff_calendar_nextweek.json',
        'https://cdn-nfs.faireconomy.media/ff_calendar_thisweek.json',
        'https://nfs.faireconomy.media/ff_calendar_thisweek.json',
      ]
    : [
        'https://cdn-nfs.faireconomy.media/ff_calendar_thisweek.json',
        'https://nfs.faireconomy.media/ff_calendar_thisweek.json',
      ]

  function parseEvent(e) {
    let date = '', time = ''
    const raw = e.date || ''
    if (raw.includes('T')) {
      try {
        const dt = new Date(raw)
        date = dt.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
        time = dt.toLocaleTimeString('en-GB', {
          timeZone: 'America/New_York',
          hour: '2-digit', minute: '2-digit', hour12: false
        })
      } catch { date = raw.split('T')[0] }
    } else if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) {
      const [m,d,y] = raw.split('-')
      date = `${y}-${m}-${d}`
      time = e.time || ''
    } else {
      date = raw
      time = e.time || ''
    }
    return {
      title: e.title||'', country: e.country||'', date, time,
      forecast: e.forecast||null, previous: e.previous||null, actual: e.actual||null
    }
  }

  for (const url of urls) {
    try {
      const r = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000)
      })
      if (!r.ok) { console.log(`${url}: ${r.status}`); continue }
      const data = await r.json()
      if (!Array.isArray(data) || !data.length) { console.log(`${url}: empty`); continue }
      const events = data
        .filter(e => e.impact === 'High' && TARGET.includes(e.country))
        .map(parseEvent)
      console.log(`${url}: ${events.length} events, isSunday=${isEST_Sunday}`)
      return res.status(200).json({ ok: true, events, source: url, isSunday: isEST_Sunday })
    } catch(err) { console.log(`${url}: ${err.message}`); continue }
  }

  return res.status(200).json({ ok: false, events: [], error: 'Could not fetch' })
}
