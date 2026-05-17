export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1200')

  const TARGET = ['USD', 'GBP', 'EUR']

  try {
    // CDN URL is more reliable than direct
    const r = await fetch('https://cdn-nfs.faireconomy.media/ff_calendar_thisweek.json', {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
    })
    if (!r.ok) throw new Error(`Status ${r.status}`)
    const data = await r.json()

    const events = data
      .filter(e => e.impact === 'High' && TARGET.includes(e.country))
      .map(e => {
        let date = '', time = ''
        const raw = e.date || ''

        if (raw.includes('T')) {
          // ISO datetime e.g. "2026-05-14T08:30:00-0400"
          // Parse and convert to EST/EDT using America/New_York
          try {
            const dt = new Date(raw)
            date = dt.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
            time = dt.toLocaleTimeString('en-GB', {
              timeZone: 'America/New_York',
              hour: '2-digit', minute: '2-digit', hour12: false
            })
          } catch {
            date = raw.split('T')[0]
            time = ''
          }
        } else if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) {
          // MM-DD-YYYY format
          const [m, d, y] = raw.split('-')
          date = `${y}-${m}-${d}`
          time = e.time || ''
        } else {
          date = raw
          time = e.time || ''
        }

        // Convert 12h time if needed e.g. "8:30am"
        if (time && /\d(am|pm)/i.test(time)) {
          const m = time.match(/(\d{1,2}):(\d{2})(am|pm)/i)
          if (m) {
            let h = parseInt(m[1])
            if (m[3].toLowerCase() === 'pm' && h !== 12) h += 12
            if (m[3].toLowerCase() === 'am' && h === 12) h = 0
            time = `${String(h).padStart(2,'0')}:${m[2]}`
          }
        }

        return {
          title:    e.title    || '',
          country:  e.country  || '',
          date,
          time,
          forecast: e.forecast || null,
          previous: e.previous || null,
          actual:   e.actual   || null,
        }
      })

    return res.status(200).json({ ok: true, events })
  } catch(err) {
    // Try fallback URL
    try {
      const r2 = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
      })
      if (r2.ok) {
        const data2 = await r2.json()
        const events2 = data2
          .filter(e => e.impact === 'High' && TARGET.includes(e.country))
          .map(e => {
            let date = '', time = ''
            const raw = e.date || ''
            if (raw.includes('T')) {
              try {
                const dt = new Date(raw)
                date = dt.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
                time = dt.toLocaleTimeString('en-GB', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false })
              } catch { date = raw.split('T')[0] }
            } else if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) {
              const [m,d,y] = raw.split('-'); date = `${y}-${m}-${d}`; time = e.time||''
            } else { date = raw; time = e.time||'' }
            return { title:e.title||'', country:e.country||'', date, time, forecast:e.forecast||null, previous:e.previous||null, actual:e.actual||null }
          })
        return res.status(200).json({ ok: true, events: events2 })
      }
    } catch {}
    return res.status(200).json({ ok: false, events: [], error: err.message })
  }
}
