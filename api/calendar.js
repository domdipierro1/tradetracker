// api/calendar.js — FF thisweek.json, updates every Monday
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600')

  const TARGET = ['USD', 'GBP', 'EUR']

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
            if (!isHoliday) time = dt.toLocaleTimeString('en-GB', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false })
          } catch { date = raw.split('T')[0] }
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) date = raw
        else if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) { const [m,d,y] = raw.split('-'); date = `${y}-${m}-${d}` }
        if (time && /\d(am|pm)/i.test(time)) {
          const m = time.match(/(\d{1,2}):(\d{2})(am|pm)/i)
          if (m) { let h = parseInt(m[1]); if (m[3]==='pm'&&h!==12) h+=12; if (m[3]==='am'&&h===12) h=0; time = `${String(h).padStart(2,'0')}:${m[2]}` }
        }
        return { title: e.title||'', country: e.country||'', date, time, impact: e.impact||'High', forecast: e.forecast||null, previous: e.previous||null, actual: e.actual||null, isHoliday }
      })
  }

  const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Referer': 'https://www.forexfactory.com/',
  }

  for (const url of [
    'https://cdn-nfs.faireconomy.media/ff_calendar_thisweek.json',
    'https://nfs.faireconomy.media/ff_calendar_thisweek.json',
  ]) {
    try {
      const r = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) })
      if (!r.ok) continue
      const data = await r.json()
      const events = parseFFJson(data)
      if (events?.length) {
        return res.status(200).json({ ok: true, events, source: url, fetched_at: new Date().toISOString() })
      }
    } catch(e) { continue }
  }

  return res.status(200).json({ ok: false, events: [], error: 'Could not load calendar', fetched_at: new Date().toISOString() })
}
