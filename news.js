// api/news.js - Fetches top headlines from RSS feeds, returns ~5 per source
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=1800')

  const FEEDS = [
    { name: 'ForexLive',       url: 'https://www.forexlive.com/feed/news',          icon: '📡', color: '#0EA5E9' },
    { name: 'FXStreet',        url: 'https://www.fxstreet.com/rss/news',            icon: '📰', color: '#7C3AED' },
    { name: 'Reuters Markets', url: 'https://feeds.reuters.com/reuters/businessNews',icon: '📊', color: '#DC2626' },
    { name: 'ZeroHedge',       url: 'https://feeds.feedburner.com/zerohedge/feed',  icon: '⚡', color: '#D97706' },
    { name: 'Investing.com',   url: 'https://www.investing.com/rss/news.rss',       icon: '💹', color: '#059669' },
  ]

  const results = await Promise.allSettled(FEEDS.map(f => fetchFeed(f)))
  let all = []
  results.forEach(r => { if (r.status === 'fulfilled') all = all.concat(r.value) })
  all.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))

  // Return top 15 overall — just the key headlines
  return res.status(200).json({
    ok: true,
    articles: all.slice(0, 15),
    fetched_at: new Date().toISOString(),
    sources: FEEDS.map((f, i) => ({
      name: f.name,
      ok: results[i].status === 'fulfilled',
      count: results[i].status === 'fulfilled' ? results[i].value.length : 0,
    }))
  })
}

async function fetchFeed(feed) {
  try {
    const r = await fetch(feed.url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/rss+xml,*/*' },
      signal: AbortSignal.timeout(6000),
    })
    if (!r.ok) return []
    const xml = await r.text()
    return parseRSS(xml, feed).slice(0, 3) // max 3 per source
  } catch { return [] }
}

function parseRSS(xml, feed) {
  const items = []
  const re = /<item[^>]*>([\s\S]*?)<\/item>/gi
  let m
  while ((m = re.exec(xml)) !== null) {
    const item = m[1]
    const title   = clean(extract(item, 'title'))
    const link    = clean(extract(item, 'link'))
    const pubDate = extract(item, 'pubDate') || extract(item, 'dc:date')
    const desc    = clean(extract(item, 'description') || extract(item, 'summary'))
    if (!title || !link) continue
    items.push({
      id:      `${feed.name}-${Buffer.from(link).toString('base64').slice(0,12)}`,
      title,
      link:    link.replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
      pubDate: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      desc:    desc ? desc.slice(0, 200) : '',
      source:  feed.name,
      icon:    feed.icon,
      color:   feed.color,
    })
  }
  return items
}

function extract(xml, tag) {
  const patterns = [
    new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'),
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'),
  ]
  for (const p of patterns) { const m = xml.match(p); if (m && m[1].trim()) return m[1].trim() }
  return ''
}

function clean(s) {
  return s.replace(/<[^>]+>/g, '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ').replace(/<!\[CDATA\[|\]\]>/g,'').trim()
}
