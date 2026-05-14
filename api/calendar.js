// api/calendar.js
// Fetches Forex Factory calendar and returns events with correct times
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600')

  const TARGET = ['USD', 'GBP', 'EUR']

  try {
    const response = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.forexfactory.com/',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) throw new Error(`FF returned ${response.status}`)
    const data = await response.json()

    // Log a sample to see what time format FF actually sends
    if (data.length > 0) {
      console.log('FF sample event:', JSON.stringify(data[0]))
    }

    const events = data
      .filter(e => TARGET.includes(e.country) && (e.impact === 'High' || e.impact === 'Holiday'))
      .map(e => {
        // Normalize date from MM-DD-YYYY to YYYY-MM-DD
        let date = e.date || ''
        if (/^\d{2}-\d{2}-\d{4}$/.test(date)) {
          const [m, d, y] = date.split('-')
          date = `${y}-${m}-${d}`
        }

        // Keep raw time exactly as FF sends it - we'll convert in the frontend
        const time = e.time || ''

        return {
          title:     e.title    || '',
          country:   e.country  || '',
          date,
          time,               // raw from FF e.g. "8:30am"
          impact:    e.impact   || '',
          forecast:  e.forecast || null,
          previous:  e.previous || null,
          actual:    e.actual   || null,
          isHoliday: e.impact === 'Holiday' || (e.title || '').toLowerCase().includes('holiday'),
        }
      })

    return res.status(200).json({ ok: true, events, fetched_at: new Date().toISOString() })
  } catch (err) {
    console.error('Calendar error:', err.message)
    return res.status(200).json({ ok: false, events: [], error: err.message, fetched_at: new Date().toISOString() })
  }
}
