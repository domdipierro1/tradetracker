// src/lib/useNewsFeed.js
import { useState, useEffect, useCallback } from 'react'

const CACHE_KEY = 'tt26_news_feed'
const CACHE_TTL = 15 * 60 * 1000 // 15 minutes

// Keywords to auto-detect sentiment
const BULLISH_WORDS = ['surge', 'rally', 'gain', 'rise', 'beat', 'strong', 'upside', 'optimism', 'growth', 'hawkish', 'record high', 'outperform', 'upgrade', 'accelerat', 'boom']
const BEARISH_WORDS  = ['crash', 'drop', 'fall', 'decline', 'miss', 'weak', 'downside', 'pessimism', 'recession', 'dovish', 'record low', 'underperform', 'downgrade', 'contraction', 'slump', 'risk-off', 'sell-off']

export function autoSentiment(title) {
  const lower = title.toLowerCase()
  const bullScore = BULLISH_WORDS.filter(w => lower.includes(w)).length
  const bearScore = BEARISH_WORDS.filter(w => lower.includes(w)).length
  if (bullScore > bearScore) return 'bullish'
  if (bearScore > bullScore) return 'bearish'
  return 'neutral'
}

export function useNewsFeed() {
  const [articles, setArticles]   = useState([])
  const [sources, setSources]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [fetchedAt, setFetchedAt] = useState(null)
  const [userSentiment, setUserSentiment] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tt26_news_sentiment') || '{}') }
    catch { return {} }
  })

  const load = useCallback(async (force = false) => {
    setLoading(true); setError(null)

    if (!force) {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (Date.now() - parsed.ts < CACHE_TTL) {
            setArticles(parsed.articles)
            setSources(parsed.sources || [])
            setFetchedAt(new Date(parsed.ts))
            setLoading(false)
            return
          }
        }
      } catch {}
    }

    try {
      const res = await fetch('/api/news')
      const data = await res.json()
      const arts = data.articles || []
      setArticles(arts)
      setSources(data.sources || [])
      setFetchedAt(new Date())
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ articles: arts, sources: data.sources, ts: Date.now() }))
    } catch (err) {
      setError('Could not load news feed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function setSentiment(articleId, sentiment) {
    const updated = { ...userSentiment, [articleId]: sentiment }
    setUserSentiment(updated)
    localStorage.setItem('tt26_news_sentiment', JSON.stringify(updated))
  }

  function getSentiment(articleId) {
    return userSentiment[articleId] || null
  }

  return { articles, sources, loading, error, fetchedAt, load, setSentiment, getSentiment }
}

export function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}
