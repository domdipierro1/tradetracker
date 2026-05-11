// api/news.js
// Vercel serverless function — fetches and merges RSS feeds from
// ForexLive, FXStreet, Reuters, ZeroHedge, Investing.com
// Parses XML server-side to avoid CORS issues

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')
  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=1800') // Cache 15min

  const FEEDS = [
    {
      name:  'ForexLive',
      url:   'https://www.forexlive.com/feed/news',
      color: '#0EA5E9',
      icon:  '📡',
    },
    {
      name:  'FXStreet',
      url:   'https://www.fxstreet.com/rss/news',
      color: '#7C3AED',
      icon:  '📰',
    },
    {
      name:  'Reuters Markets',
      url:   'https://feeds.reuters.com/reuters/businessNews',
      color: '#DC2626',
      icon:  '📊',
    },
    {
      name:  'ZeroHedge',
      url:   'https://feeds.feedburner.com/zerohedge/feed',
      color: '#D97706',
      icon:  '⚡',
    },
    {
      name:  'Investing.com',
      url:   'https://www.investing.com/rss/news.rss',
      color: '#059669',
      icon:  '💹',
    },
  ]

  // Fetch all feeds in parallel
  const results = await Promise.allSettled(
    FEEDS.map(feed => fetchFeed(feed))
  )

  // Merge all articles
  let allArticles = []
  results.forEach((result, i) => {
    if (result.status === 'fulfilled' && result.value.length > 0) {
      allArticles = allArticles.concat(result.value)
    }
  })

  // Sort by date descending
  allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))

  // Limit to 100 most recent
  allArticles = allArticles.slice(0, 100)

  return res.status(200).json({
    ok: true,
    articles: allArticles,
    count: allArticles.length,
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
    const response = await fetch(feed.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TradeTracker/1.0; +https://tradetracker.app)',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(8000), // 8s timeout per feed
    })

    if (!response.ok) return []

    const xml = await response.text()
    return parseRSS(xml, feed)
  } catch (err) {
    console.error(`Failed to fetch ${feed.name}:`, err.message)
    return []
  }
}

function parseRSS(xml, feed) {
  const articles = []

  // Extract all <item> blocks
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi
  let match

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1]

    const title   = extractTag(item, 'title')
    const link    = extractTag(item, 'link') || extractAttr(item, 'link', 'href')
    const pubDate = extractTag(item, 'pubDate') || extractTag(item, 'dc:date') || extractTag(item, 'published')
    const desc    = extractTag(item, 'description') || extractTag(item, 'summary')
    const category = extractTag(item, 'category')

    if (!title || !link) continue

    // Clean HTML from description
    const cleanDesc = desc
      ? desc.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').trim().slice(0, 280)
      : ''

    const cleanTitle = title.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim()

    if (!cleanTitle) continue

    articles.push({
      id:       `${feed.name}-${Buffer.from(link).toString('base64').slice(0, 16)}`,
      title:    cleanTitle,
      link:     link.replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
      pubDate:  pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      desc:     cleanDesc,
      source:   feed.name,
      color:    feed.color,
      icon:     feed.icon,
      category: category || '',
    })
  }

  return articles.slice(0, 25) // max 25 per source
}

function extractTag(xml, tag) {
  const patterns = [
    new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'),
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'),
  ]
  for (const re of patterns) {
    const m = xml.match(re)
    if (m && m[1].trim()) return m[1].trim()
  }
  return ''
}

function extractAttr(xml, tag, attr) {
  const re = new RegExp(`<${tag}[^>]*${attr}="([^"]+)"`, 'i')
  const m = xml.match(re)
  return m ? m[1] : ''
}
