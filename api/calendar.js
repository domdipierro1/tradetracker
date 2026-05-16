export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200')

  const TARGET = ['USD', 'GBP', 'EUR']
  const weekOffset = parseInt(req.query?.week || '0', 10) || 0

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

  const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
  const ffParam = `${months[monday.getMonth()]}${monday.getDate()}.${monday.getFullYear()}`

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
        if (time && /\d(am|pm)/i.test(time)) {
          const m = time.match(/(\d{1,2}):(\d{2})(am|pm)/i)
          if (m) { let h=parseInt(m[1]); if(m[3]==='pm'&&h!==12)h+=12; if(m[3]==='am'&&h===12)h=0; time=`${String(h).padStart(2,'0')}:${m[2]}` }
        }
        return { title:e.title||'', country:e.country||'', date, time, impact:e.impact||'High', forecast:e.forecast||null, previous:e.previous||null, actual:e.actual||null, isHoliday }
      })
  }

  function parseFFHtml(html, year) {
    if (!html || !html.includes('calendar__row')) return null
    const events = []
    let curDate = ''
    // Split into rows
    const rows = html.split('<tr class="calendar__row')
    for (const row of rows.slice(1)) {
      // Date
      const dm = row.match(/class="calendar__cell calendar__date[^"]*"[^>]*>([\s\S]*?)<\/td>/)
      if (dm) {
        const raw = dm[1].replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim()
        if (raw) curDate = raw
      }
      // Currency
      const cm = row.match(/class="calendar__cell calendar__currency"[^>]*>\s*([A-Z]{3})\s*<\/td>/)
      if (!cm || !TARGET.includes(cm[1])) continue
      // Impact
      if (!row.includes('impact--high') && !row.includes('impact--holiday')) continue
      const isHoliday = row.includes('impact--holiday')
      // Time
      const tm = row.match(/class="calendar__cell calendar__time"[^>]*>([\s\S]*?)<\/td>/)
      let time = tm ? tm[1].replace(/<[^>]+>/g,'').trim() : ''
      // Event
      const em = row.match(/class="calendar__event"[^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/)
      const title = em ? em[1].replace(/<[^>]+>/g,'').trim() : ''
      // Forecast / Previous / Actual
      const fc = row.match(/class="[^"]*calendar__forecast[^"]*"[^>]*>([\s\S]*?)<\/td>/)
      const pr = row.match(/class="[^"]*calendar__previous[^"]*"[^>]*>([\s\S]*?)<\/td>/)
      const ac = row.match(/class="[^"]*calendar__actual[^"]*"[^>]*>([\s\S]*?)<\/td>/)
      const forecast = fc ? fc[1].replace(/<[^>]+>/g,'').trim()||null : null
      const previous = pr ? pr[1].replace(/<[^>]+>/g,'').trim()||null : null
      const actual   = ac ? ac[1].replace(/<[^>]+>/g,'').trim()||null : null
      // Parse date: FF shows "Mon May 19" style
      let date = ''
      if (curDate) {
        try {
          const d = new Date(`${curDate} ${year}`)
          if (!isNaN(d)) date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
        } catch {}
      }
      if (!title) continue
      events.push({ title, country:cm[1], date, time, impact: isHoliday?'Holiday':'High', forecast, previous, actual, isHoliday })
    }
    return events.length ? events : null
  }

  const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache',
  }

  // 1. Try FF JSON files (fast, work for this week and next week)
  const jsonUrls = [
    weekOffset === 0
      ? 'https://cdn-nfs.faireconomy.media/ff_calendar_thisweek.json'
      : 'https://cdn-nfs.faireconomy.media/ff_calendar_nextweek.json',
    weekOffset === 0
      ? 'https://nfs.faireconomy.media/ff_calendar_thisweek.json'
      : 'https://nfs.faireconomy.media/ff_calendar_nextweek.json',
  ]

  for (const url of jsonUrls) {
    try {
      const r = await fetch(url, { headers: { ...BROWSER_HEADERS, Accept:'application/json' }, signal: AbortSignal.timeout(8000) })
      if (!r.ok) continue
      const data = await r.json()
      const events = parseFFJson(data)
      if (events?.length) {
        console.log(`JSON source: ${events.length} events from ${url}`)
        return res.status(200).json({ ok:true, events, source:'ff_json', week:weekOffset, from, to, fetched_at:new Date().toISOString() })
      }
    } catch(e) { console.error('JSON source failed:', e.message) }
  }

  // 2. For any week: scrape FF calendar page
  const ffUrl = `https://www.forexfactory.com/calendar?week=${ffParam}`
  console.log('Trying HTML scrape:', ffUrl)
  try {
    const r = await fetch(ffUrl, { headers: BROWSER_HEADERS, signal: AbortSignal.timeout(15000) })
    console.log('FF HTML status:', r.status)
    if (r.ok) {
      const html = await r.text()
      console.log('HTML length:', html.length, 'has calendar_row:', html.includes('calendar__row'))
      const events = parseFFHtml(html, monday.getFullYear())
      if (events?.length) {
        console.log(`HTML scrape: ${events.length} events`)
        return res.status(200).json({ ok:true, events, source:'ff_html', week:weekOffset, from, to, fetched_at:new Date().toISOString() })
      }
      // Even if parse fails, return what we got so we can debug
      if (html.length > 1000) {
        console.log('HTML sample:', html.substring(0, 500))
      }
    }
  } catch(e) { console.error('HTML scrape failed:', e.message) }

  return res.status(200).json({ ok:false, events:[], week:weekOffset, from, to, error:'Could not load calendar', fetched_at:new Date().toISOString() })
}
