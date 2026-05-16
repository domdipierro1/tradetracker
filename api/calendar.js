// api/calendar.js — Economic calendar for any week
// Primary: FF calendar.php with week parameter (full year)
// Fallback: FF thisweek/nextweek JSON files

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600')

  const TARGET = ['USD', 'GBP', 'EUR']
  const weekOffset = parseInt(req.query?.week || '0', 10) || 0

  // Get Monday of the requested week
  function getMonday(offset) {
    const now = new Date()
    const dow = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7)
    monday.setHours(0, 0, 0, 0)
    return monday
  }

  // Format date as FF expects: "may19.2026"
  function toFFDate(date) {
    const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
    return `${months[date.getMonth()]}${date.getDate()}.${date.getFullYear()}`
  }

  const monday = getMonday(weekOffset)
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
  const ffWeekParam = toFFDate(monday)
  const from = monday.toISOString().split('T')[0]
  const to   = sunday.toISOString().split('T')[0]

  // Parse FF JSON array (from CDN files)
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
            if (!isHoliday) time = dt.toLocaleTimeString('en-GB', { timeZone: 'America/New_York', hour:'2-digit', minute:'2-digit', hour12:false })
          } catch { date = raw.split('T')[0] }
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) date = raw
        else if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) { const [m,d,y]=raw.split('-'); date=`${y}-${m}-${d}` }
        if (time && /\d(am|pm)/i.test(time)) {
          const m = time.match(/(\d{1,2}):(\d{2})(am|pm)/i)
          if (m) { let h=parseInt(m[1]); if(m[3]==='pm'&&h!==12)h+=12; if(m[3]==='am'&&h===12)h=0; time=`${String(h).padStart(2,'0')}:${m[2]}` }
        }
        return { title:e.title||'', country:e.country||'', date, time, impact:e.impact||'High', forecast:e.forecast||null, previous:e.previous||null, actual:e.actual||null, isHoliday }
      })
  }

  // Parse FF HTML page (from calendar.php)
  function parseFFHtml(html) {
    if (!html || !html.includes('calendar__row')) return null
    const events = []
    // Extract rows via regex
    const rowRegex = /<tr[^>]*class="[^"]*calendar__row[^"]*"[^>]*>([\s\S]*?)<\/tr>/g
    let rowMatch
    let currentDate = ''
    while ((rowMatch = rowRegex.exec(html)) !== null) {
      const row = rowMatch[1]
      // Date cell
      const dateMatch = row.match(/calendar__date[^>]*>([\s\S]*?)<\/td>/)
      if (dateMatch) {
        const dateText = dateMatch[1].replace(/<[^>]+>/g,'').trim()
        if (dateText) currentDate = dateText
      }
      // Currency
      const ccyMatch = row.match(/calendar__currency[^>]*>\s*([A-Z]{3})\s*<\/td>/)
      if (!ccyMatch) continue
      const country = ccyMatch[1]
      if (!TARGET.includes(country)) continue
      // Impact
      const impactMatch = row.match(/impact[^"]*--([a-z]+)[^"]*">/)
      const impactStr = impactMatch ? impactMatch[1] : ''
      if (impactStr !== 'high' && impactStr !== 'holiday') continue
      // Time
      const timeMatch = row.match(/calendar__time[^>]*>([\s\S]*?)<\/td>/)
      const time = timeMatch ? timeMatch[1].replace(/<[^>]+>/g,'').trim() : ''
      // Event name
      const eventMatch = row.match(/calendar__event-title[^>]*>([\s\S]*?)<\/span>/)
      const title = eventMatch ? eventMatch[1].replace(/<[^>]+>/g,'').trim() : ''
      // Forecast/Previous/Actual
      const fcMatch = row.match(/calendar__forecast[^>]*>([\s\S]*?)<\/td>/)
      const prMatch = row.match(/calendar__previous[^>]*>([\s\S]*?)<\/td>/)
      const acMatch = row.match(/calendar__actual[^>]*>([\s\S]*?)<\/td>/)
      const forecast = fcMatch ? fcMatch[1].replace(/<[^>]+>/g,'').trim() || null : null
      const previous = prMatch ? prMatch[1].replace(/<[^>]+>/g,'').trim() || null : null
      const actual   = acMatch ? acMatch[1].replace(/<[^>]+>/g,'').trim() || null : null
      // Parse date - FF shows like "Mon May 19"
      let date = ''
      try {
        const d = new Date(`${currentDate} ${monday.getFullYear()}`)
        if (!isNaN(d)) date = d.toISOString().split('T')[0]
      } catch {}
      events.push({ title, country, date, time, impact: impactStr === 'holiday' ? 'Holiday' : 'High', forecast, previous, actual, isHoliday: impactStr === 'holiday' })
    }
    return events.length ? events : null
  }

  const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/json,*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.forexfactory.com/',
    'Cache-Control': 'no-cache',
  }

  const SOURCES = [
    // FF thisweek/nextweek JSON (most reliable for current/next week)
    { url: weekOffset === 0 ? 'https://cdn-nfs.faireconomy.media/ff_calendar_thisweek.json' : 'https://cdn-nfs.faireconomy.media/ff_calendar_nextweek.json', parse: parseFFJson },
    { url: weekOffset === 0 ? 'https://nfs.faireconomy.media/ff_calendar_thisweek.json' : 'https://nfs.faireconomy.media/ff_calendar_nextweek.json', parse: parseFFJson },
    // FF calendar.php with week param (works for any week in the year)
    { url: `https://www.forexfactory.com/calendar?week=${ffWeekParam}`, parse: parseFFHtml, accept: 'text/html' },
  ]

  for (const source of SOURCES) {
    try {
      const r = await fetch(source.url, {
        headers: { ...HEADERS, Accept: source.accept || 'application/json, text/html, */*' },
        signal: AbortSignal.timeout(12000),
      })
      if (!r.ok) { console.log(`${source.url}: ${r.status}`); continue }
      const contentType = r.headers.get('content-type') || ''
      let events
      if (contentType.includes('json') || source.url.includes('.json')) {
        const data = await r.json(); events = source.parse(data)
      } else {
        const html = await r.text(); events = source.parse(html)
      }
      if (!events || events.length === 0) { console.log(`No events from ${source.url}`); continue }
      console.log(`Got ${events.length} events from ${source.url}`)
      return res.status(200).json({ ok: true, events, source: source.url, week: weekOffset, from, to, fetched_at: new Date().toISOString() })
    } catch (e) { console.error(`${source.url}: ${e.message}`); continue }
  }

  return res.status(200).json({ ok: false, events: [], week: weekOffset, from, to, error: 'Could not load calendar data', fetched_at: new Date().toISOString() })
}
