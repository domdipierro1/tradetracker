import { useState } from 'react'
import { useNewsFeed, autoSentiment, timeAgo } from '../lib/useNewsFeed'

const SENTIMENT = {
  bullish: { label: '▲ Bullish', bg: 'var(--green-bg)',  border: 'var(--green-dim)',  text: 'var(--green)'  },
  bearish: { label: '▼ Bearish', bg: 'var(--red-bg)',    border: 'var(--red-dim)',    text: 'var(--red)'    },
  neutral: { label: '● Neutral', bg: 'var(--surface2)',  border: 'var(--border)',     text: 'var(--muted)'  },
}

export default function NewsFeed() {
  const { articles, sources, loading, error, fetchedAt, load, setSentiment, getSentiment } = useNewsFeed()
  const [refreshing, setRefreshing] = useState(false)

  // Overall sentiment
  const total = articles.length || 1
  const bull = articles.filter(a => (getSentiment(a.id) || autoSentiment(a.title)) === 'bullish').length
  const bear = articles.filter(a => (getSentiment(a.id) || autoSentiment(a.title)) === 'bearish').length
  const overall = bull > bear ? 'BULLISH' : bear > bull ? 'BEARISH' : 'NEUTRAL'
  const overallColor = bull > bear ? 'var(--green)' : bear > bull ? 'var(--red)' : 'var(--muted)'

  async function handleRefresh() {
    setRefreshing(true)
    sessionStorage.removeItem('tt26_news_feed')
    await load(true)
    setRefreshing(false)
  }

  return (
    <div className="page active">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px', flexWrap:'wrap', gap:'10px' }}>
        <div>
          <h1 style={{ fontSize:'18px', fontWeight:'800', color:'var(--text)' }}>Market Headlines</h1>
          <div style={{ fontSize:'11px', color:'var(--muted)', fontWeight:'600', marginTop:'2px' }}>
            Top stories · ForexLive · FXStreet · Reuters · ZeroHedge · Investing.com
          </div>
        </div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          {fetchedAt && <span style={{ fontSize:'10px', color:'var(--muted2)' }}>Updated {fetchedAt.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</span>}
          <button className="btn btn-outline btn-sm" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? '⏳' : '↻'} Refresh
          </button>
        </div>
      </div>

      {/* Sentiment bar */}
      {!loading && articles.length > 0 && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'14px 18px', marginBottom:'16px', boxShadow:'var(--shadow)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'10px', flexWrap:'wrap' }}>
            <div>
              <div style={{ fontSize:'9px', fontWeight:'800', color:'var(--muted)', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:'2px' }}>Today's Sentiment</div>
              <div style={{ fontSize:'20px', fontWeight:'800', color:overallColor }}>{overall}</div>
            </div>
            <div style={{ display:'flex', gap:'14px' }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontFamily:"'Geist Mono',monospace", fontSize:'16px', fontWeight:'700', color:'var(--green)' }}>{Math.round(bull/total*100)}%</div>
                <div style={{ fontSize:'9px', fontWeight:'700', color:'var(--muted)', textTransform:'uppercase' }}>Bullish</div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontFamily:"'Geist Mono',monospace", fontSize:'16px', fontWeight:'700', color:'var(--red)' }}>{Math.round(bear/total*100)}%</div>
                <div style={{ fontSize:'9px', fontWeight:'700', color:'var(--muted)', textTransform:'uppercase' }}>Bearish</div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontFamily:"'Geist Mono',monospace", fontSize:'16px', fontWeight:'700', color:'var(--text)' }}>{articles.length}</div>
                <div style={{ fontSize:'9px', fontWeight:'700', color:'var(--muted)', textTransform:'uppercase' }}>Stories</div>
              </div>
            </div>
          </div>
          {/* Bar */}
          <div style={{ height:'6px', borderRadius:'3px', background:'var(--border)', overflow:'hidden', display:'flex' }}>
            <div style={{ width:Math.round(bull/total*100)+'%', background:'var(--green)', transition:'width .5s' }} />
            <div style={{ width:Math.round(bear/total*100)+'%', background:'var(--red)', transition:'width .5s' }} />
          </div>
          <div style={{ fontSize:'10px', color:'var(--muted)', marginTop:'6px' }}>
            Tap ▲ ▼ on any headline to tag your own sentiment read
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign:'center', padding:'48px', color:'var(--muted)' }}>
          <div style={{ width:'28px', height:'28px', border:'3px solid var(--border)', borderTop:'3px solid var(--blue)', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 12px' }} />
          <div style={{ fontSize:'13px', fontWeight:'600' }}>Loading headlines...</div>
        </div>
      )}

      {!loading && error && (
        <div style={{ padding:'12px 14px', background:'var(--red-bg)', border:'1px solid var(--red-dim)', borderRadius:'var(--r)', color:'var(--red)', fontSize:'13px', fontWeight:'600', marginBottom:'14px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Headline cards — clean and compact */}
      {!loading && articles.map((a, i) => {
        const tagged   = getSentiment(a.id)
        const auto     = autoSentiment(a.title)
        const sentiment = tagged || auto
        const cfg      = SENTIMENT[sentiment]
        const leftColor = sentiment === 'bullish' ? 'var(--green)' : sentiment === 'bearish' ? 'var(--red)' : 'var(--border2)'

        return (
          <div key={a.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', marginBottom:'8px', overflow:'hidden', display:'flex', boxShadow:'var(--shadow)', transition:'box-shadow .15s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow='var(--shadow-md)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow='var(--shadow)'}>

            {/* Sentiment colour strip */}
            <div style={{ width:'4px', flexShrink:0, background:leftColor, transition:'background .2s' }} />

            <div style={{ flex:1, padding:'11px 14px' }}>
              {/* Source row */}
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'6px' }}>
                <span style={{ fontSize:'12px' }}>{a.icon}</span>
                <span style={{ fontSize:'10px', fontWeight:'800', color:a.color, letterSpacing:'.04em', textTransform:'uppercase' }}>{a.source}</span>
                <span style={{ fontSize:'10px', color:'var(--muted2)', fontWeight:'600' }}>{timeAgo(a.pubDate)}</span>
                {!tagged && <span style={{ fontSize:'9px', color:'var(--muted2)', marginLeft:'2px' }}>auto</span>}
                {/* Sentiment tag */}
                <div style={{ marginLeft:'auto', display:'inline-flex', alignItems:'center', padding:'2px 8px', borderRadius:'5px', fontSize:'10px', fontWeight:'700', background:cfg.bg, border:`1px solid ${cfg.border}`, color:cfg.text }}>
                  {cfg.label}
                </div>
              </div>

              {/* Headline */}
              <a href={a.link} target="_blank" rel="noopener noreferrer" style={{ fontSize:'13px', fontWeight:'600', color:'var(--text)', textDecoration:'none', lineHeight:'1.45', display:'block', marginBottom: a.desc ? '6px' : '8px' }}
                onMouseEnter={e => e.target.style.color='var(--blue)'}
                onMouseLeave={e => e.target.style.color='var(--text)'}>
                {a.title}
              </a>

              {/* Short desc if available */}
              {a.desc && (
                <div style={{ fontSize:'12px', color:'var(--muted)', lineHeight:'1.5', marginBottom:'8px' }}>
                  {a.desc.length > 140 ? a.desc.slice(0,140)+'…' : a.desc}
                </div>
              )}

              {/* Quick sentiment buttons */}
              <div style={{ display:'flex', gap:'4px' }}>
                {['bullish','bearish','neutral'].map(s => (
                  <button key={s} onClick={() => setSentiment(a.id, tagged === s ? null : s)}
                    style={{ fontSize:'10px', fontWeight:'700', padding:'3px 8px', borderRadius:'4px', border:`1px solid ${tagged===s ? SENTIMENT[s].border : 'var(--border)'}`, background:tagged===s?SENTIMENT[s].bg:'transparent', color:tagged===s?SENTIMENT[s].text:'var(--muted2)', cursor:'pointer', fontFamily:'inherit', transition:'all .15s' }}>
                    {s === 'bullish' ? '▲' : s === 'bearish' ? '▼' : '●'} {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
      })}

      {!loading && articles.length === 0 && !error && (
        <div style={{ textAlign:'center', padding:'40px', color:'var(--muted)' }}>
          <div style={{ fontSize:'32px', marginBottom:'10px' }}>📰</div>
          <div style={{ fontSize:'13px', fontWeight:'600' }}>No headlines loaded yet</div>
          <button className="btn btn-blue" style={{ marginTop:'14px' }} onClick={handleRefresh}>Load Headlines</button>
        </div>
      )}

      {!loading && articles.length > 0 && (
        <div style={{ textAlign:'center', marginTop:'10px', fontSize:'10px', color:'var(--muted2)' }}>
          Top {articles.length} stories · Updates every 15 minutes
        </div>
      )}
    </div>
  )
}
