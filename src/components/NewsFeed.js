import { useState } from 'react'
import { useNewsFeed, autoSentiment, timeAgo } from '../lib/useNewsFeed'

const SENTIMENT_CONFIG = {
  bullish: { label: '▲ Bullish', bg: 'var(--green-bg)',  border: 'var(--green-dim)',  text: 'var(--green)'  },
  bearish: { label: '▼ Bearish', bg: 'var(--red-bg)',    border: 'var(--red-dim)',    text: 'var(--red)'    },
  neutral: { label: '● Neutral', bg: 'var(--surface2)',  border: 'var(--border)',     text: 'var(--muted)'  },
}

const SOURCE_COLORS = {
  'ForexLive':      '#0EA5E9',
  'FXStreet':       '#7C3AED',
  'Reuters Markets':'#DC2626',
  'ZeroHedge':      '#D97706',
  'Investing.com':  '#059669',
}

function SentimentBadge({ sentiment, onClick, small }) {
  const cfg = SENTIMENT_CONFIG[sentiment] || SENTIMENT_CONFIG.neutral
  return (
    <button onClick={onClick}
      style={{ display: 'inline-flex', alignItems: 'center', padding: small ? '2px 7px' : '3px 9px', borderRadius: '6px', fontSize: small ? '10px' : '11px', fontWeight: '700', background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.text, cursor: onClick ? 'pointer' : 'default', fontFamily: 'inherit', transition: 'all .15s', whiteSpace: 'nowrap' }}>
      {cfg.label}
    </button>
  )
}

function ArticleCard({ article, userSentiment, onSetSentiment }) {
  const [expanded, setExpanded] = useState(false)
  const auto = autoSentiment(article.title)
  const tagged = userSentiment || null
  const displaySentiment = tagged || auto
  const isAutoTagged = !tagged
  const sourceColor = SOURCE_COLORS[article.source] || 'var(--muted)'

  function cycleSentiment() {
    const order = ['bullish', 'bearish', 'neutral']
    const current = tagged || auto
    const next = order[(order.indexOf(current) + 1) % order.length]
    onSetSentiment(article.id, next)
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', overflow: 'hidden', transition: 'box-shadow .15s, transform .15s', marginBottom: '8px' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.transform = '' }}>

      {/* Sentiment colour strip on left */}
      <div style={{ display: 'flex' }}>
        <div style={{ width: '4px', flexShrink: 0, background: displaySentiment === 'bullish' ? 'var(--green)' : displaySentiment === 'bearish' ? 'var(--red)' : 'var(--border)' }} />

        <div style={{ flex: 1, padding: '12px 14px' }}>
          {/* Source + time row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px' }}>{article.icon}</span>
            <span style={{ fontSize: '10px', fontWeight: '800', color: sourceColor, letterSpacing: '.04em', textTransform: 'uppercase' }}>{article.source}</span>
            <span style={{ fontSize: '10px', color: 'var(--muted2)', fontWeight: '600' }}>{timeAgo(article.pubDate)}</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
              {isAutoTagged && <span style={{ fontSize: '9px', color: 'var(--muted2)', fontWeight: '600' }}>auto</span>}
              <SentimentBadge sentiment={displaySentiment} onClick={cycleSentiment} small />
            </div>
          </div>

          {/* Title */}
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text)', lineHeight: '1.5', marginBottom: article.desc ? '6px' : '0', cursor: 'pointer' }}
            onClick={() => setExpanded(e => !e)}>
            {article.title}
          </div>

          {/* Expanded description */}
          {expanded && article.desc && (
            <div style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: '1.65', marginBottom: '8px', padding: '8px 10px', background: 'var(--surface2)', borderRadius: '6px', border: '1px solid var(--border)' }}>
              {article.desc}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
            {article.desc && (
              <button onClick={() => setExpanded(e => !e)}
                style={{ fontSize: '11px', fontWeight: '600', color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                {expanded ? 'Show less ↑' : 'Read more ↓'}
              </button>
            )}
            <a href={article.link} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted)', textDecoration: 'none', marginLeft: article.desc ? '0' : '0' }}>
              Full article →
            </a>
            {/* Quick sentiment buttons */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
              {['bullish','bearish','neutral'].map(s => (
                <button key={s} onClick={() => onSetSentiment(article.id, tagged === s ? null : s)}
                  style={{ fontSize: '9px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', border: `1px solid ${tagged === s ? SENTIMENT_CONFIG[s].border : 'var(--border)'}`, background: tagged === s ? SENTIMENT_CONFIG[s].bg : 'transparent', color: tagged === s ? SENTIMENT_CONFIG[s].text : 'var(--muted2)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
                  {s === 'bullish' ? '▲' : s === 'bearish' ? '▼' : '●'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NewsFeed() {
  const { articles, sources, loading, error, fetchedAt, load, setSentiment, getSentiment } = useNewsFeed()
  const [filterSource, setFilterSource] = useState('')
  const [filterSentiment, setFilterSentiment] = useState('')
  const [filterKeyword, setFilterKeyword] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  // Sentiment overview counts
  const taggedArticles = articles.filter(a => getSentiment(a.id))
  const bullCount = articles.filter(a => (getSentiment(a.id) || autoSentiment(a.title)) === 'bullish').length
  const bearCount = articles.filter(a => (getSentiment(a.id) || autoSentiment(a.title)) === 'bearish').length
  const neutCount = articles.filter(a => (getSentiment(a.id) || autoSentiment(a.title)) === 'neutral').length
  const total = bullCount + bearCount + neutCount

  const bullPct = total ? Math.round(bullCount / total * 100) : 0
  const bearPct = total ? Math.round(bearCount / total * 100) : 0

  const overallSentiment = bullCount > bearCount ? 'BULLISH' : bearCount > bullCount ? 'BEARISH' : 'NEUTRAL'
  const sentimentColor = bullCount > bearCount ? 'var(--green)' : bearCount > bullCount ? 'var(--red)' : 'var(--muted)'

  async function handleRefresh() {
    setRefreshing(true)
    await load(true)
    setRefreshing(false)
  }

  // Filter articles
  const filtered = articles.filter(a => {
    if (filterSource && a.source !== filterSource) return false
    if (filterSentiment) {
      const s = getSentiment(a.id) || autoSentiment(a.title)
      if (s !== filterSentiment) return false
    }
    if (filterKeyword) {
      const kw = filterKeyword.toLowerCase()
      if (!a.title.toLowerCase().includes(kw) && !a.desc?.toLowerCase().includes(kw)) return false
    }
    return true
  })

  const uniqueSources = [...new Set(articles.map(a => a.source))]

  return (
    <div className="page active">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text)', marginBottom: '3px' }}>Market News</h1>
          <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: '600' }}>
            ForexLive · FXStreet · Reuters · ZeroHedge · Investing.com
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {fetchedAt && <span style={{ fontSize: '11px', color: 'var(--muted2)', fontWeight: '600' }}>Updated {fetchedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>}
          <button className="btn btn-outline btn-sm" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? '⏳' : '↻'} Refresh
          </button>
        </div>
      </div>

      {/* Sentiment overview card */}
      {!loading && articles.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '16px 18px', marginBottom: '16px', boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '9px', fontWeight: '800', color: 'var(--muted)', letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: '2px' }}>Market Sentiment</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: sentimentColor }}>{overallSentiment}</div>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '18px', fontWeight: '700', color: 'var(--green)' }}>{bullPct}%</div>
                <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Bullish</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '18px', fontWeight: '700', color: 'var(--red)' }}>{bearPct}%</div>
                <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Bearish</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '18px', fontWeight: '700', color: 'var(--muted)' }}>{100 - bullPct - bearPct}%</div>
                <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Neutral</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '18px', fontWeight: '700', color: 'var(--text)' }}>{articles.length}</div>
                <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>Headlines</div>
              </div>
            </div>
          </div>

          {/* Sentiment bar */}
          <div style={{ height: '8px', borderRadius: '4px', background: 'var(--border)', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: bullPct + '%', background: 'var(--green)', transition: 'width .5s ease' }} />
            <div style={{ width: bearPct + '%', background: 'var(--red)', transition: 'width .5s ease' }} />
            <div style={{ flex: 1, background: 'var(--border2)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--green)' }}>▲ {bullCount} bullish</span>
            <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--muted)' }}>● {neutCount} neutral</span>
            <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--red)' }}>{bearCount} bearish ▼</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '8px', fontWeight: '500' }}>
            Sentiment is auto-detected from headlines. Tap ▲ ▼ ● on any article to override it manually.
          </div>
        </div>
      )}

      {/* Source status pills */}
      {!loading && sources.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {sources.map((s, i) => (
            <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', background: s.ok ? 'var(--green-bg)' : 'var(--red-bg)', border: `1px solid ${s.ok ? 'var(--green-dim)' : 'var(--red-dim)'}`, fontSize: '11px', fontWeight: '700', color: s.ok ? 'var(--green)' : 'var(--red)' }}>
              {s.ok ? '✓' : '✗'} {s.name} {s.ok && <span style={{ color: 'var(--muted)', fontWeight: '600' }}>({s.count})</span>}
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      {!loading && articles.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={filterKeyword} onChange={e => setFilterKeyword(e.target.value)} placeholder="🔍 Search headlines..."
            style={{ flex: 1, minWidth: '160px', padding: '8px 11px', borderRadius: 'var(--r-xs)', border: '1.5px solid var(--border)', background: 'var(--surface2)', fontSize: '12px', color: 'var(--text)', fontFamily: 'inherit', outline: 'none' }}
            onFocus={e => e.target.style.borderColor='var(--blue)'} onBlur={e => e.target.style.borderColor='var(--border)'} />
          <select value={filterSource} onChange={e => setFilterSource(e.target.value)}
            style={{ padding: '8px 11px', borderRadius: 'var(--r-xs)', border: '1.5px solid var(--border)', background: 'var(--surface)', fontSize: '12px', fontWeight: '600', color: 'var(--text)', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
            <option value="">All Sources</option>
            {uniqueSources.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterSentiment} onChange={e => setFilterSentiment(e.target.value)}
            style={{ padding: '8px 11px', borderRadius: 'var(--r-xs)', border: '1.5px solid var(--border)', background: 'var(--surface)', fontSize: '12px', fontWeight: '600', color: 'var(--text)', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
            <option value="">All Sentiment</option>
            <option value="bullish">▲ Bullish</option>
            <option value="bearish">▼ Bearish</option>
            <option value="neutral">● Neutral</option>
          </select>
          {(filterSource || filterSentiment || filterKeyword) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setFilterSource(''); setFilterSentiment(''); setFilterKeyword('') }}>Clear filters</button>
          )}
          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--muted)', marginLeft: 'auto' }}>{filtered.length} articles</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--muted)' }}>
          <div style={{ width: '28px', height: '28px', border: '3px solid var(--border)', borderTop: '3px solid var(--blue)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <div style={{ fontSize: '13px', fontWeight: '600' }}>Loading news from 5 sources...</div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div style={{ padding: '16px', background: 'var(--red-bg)', border: '1px solid var(--red-dim)', borderRadius: 'var(--r)', color: 'var(--red)', fontSize: '13px', fontWeight: '600', marginBottom: '16px' }}>
          ⚠️ {error} — <button onClick={() => load(true)} style={{ color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '700', fontFamily: 'inherit' }}>Try again</button>
        </div>
      )}

      {/* Articles */}
      {!loading && filtered.length === 0 && articles.length > 0 && (
        <div style={{ textAlign: 'center', padding: '32px', color: 'var(--muted)', fontSize: '13px' }}>No articles match your filters</div>
      )}

      {!loading && filtered.map(article => (
        <ArticleCard key={article.id} article={article} userSentiment={getSentiment(article.id)} onSetSentiment={setSentiment} />
      ))}

      {!loading && articles.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '11px', color: 'var(--muted2)' }}>
          Sources: ForexLive · FXStreet · Reuters · ZeroHedge · Investing.com · Updates every 15 minutes
        </div>
      )}
    </div>
  )
}
