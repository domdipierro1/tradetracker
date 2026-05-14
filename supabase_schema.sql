// All stats calculated in R multiples
// pl field stores R value directly (e.g. +2, -1, +1.5)
// 1R = 1% risk per trade

export const BAL = 100000

export function computeStats(trades, startingBalance) {
  const wins   = trades.filter(t => t.outcome === 'Win')
  const losses = trades.filter(t => t.outcome === 'Loss')
  const bes    = trades.filter(t => t.outcome === 'Break Even')
  const n      = trades.length

  // All P/L in R
  const totalR    = trades.reduce((s, t) => s + (t.pl || t.r_multiple || 0), 0)
  const winRate   = n ? wins.length / n : 0
  const avgWin    = wins.length   ? wins.reduce((s,t) => s+(t.pl||t.r_multiple||0),0)/wins.length : 0
  const avgLoss   = losses.length ? losses.reduce((s,t) => s+(t.pl||t.r_multiple||0),0)/losses.length : 0
  const bestTrade = n ? Math.max(...trades.map(t => t.pl||t.r_multiple||0)) : 0
  const worstTrade= n ? Math.min(...trades.map(t => t.pl||t.r_multiple||0)) : 0
  const wlRatio   = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0
  const expectancy= (winRate * avgWin) + ((1-winRate) * avgLoss)

  // Profit factor
  const grossWin  = wins.reduce((s,t) => s+(t.pl||t.r_multiple||0),0)
  const grossLoss = Math.abs(losses.reduce((s,t) => s+(t.pl||t.r_multiple||0),0))
  const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0

  // Max drawdown in R (peak to trough)
  let peak = 0, trough = 0, maxDD = 0, running = 0
  trades.forEach(t => {
    running += (t.pl||t.r_multiple||0)
    if (running > peak) peak = running
    const dd = peak - running
    if (dd > maxDD) { maxDD = dd; trough = running }
  })

  // Streak
  let curStreak = 0, maxWinStreak = 0, maxLossStreak = 0
  let streakType = null
  trades.forEach(t => {
    const isWin = t.outcome === 'Win'
    if (isWin) {
      if (streakType === 'win') curStreak++
      else { streakType = 'win'; curStreak = 1 }
      if (curStreak > maxWinStreak) maxWinStreak = curStreak
    } else if (t.outcome === 'Loss') {
      if (streakType === 'loss') curStreak++
      else { streakType = 'loss'; curStreak = 1 }
      if (curStreak > maxLossStreak) maxLossStreak = curStreak
    }
  })

  return {
    n, wins: wins.length, losses: losses.length, bes: bes.length,
    totalR, totalPL: totalR, // keep totalPL alias for compatibility
    winRate, avgWin, avgLoss, bestTrade, worstTrade,
    wlRatio, expectancy, profitFactor, maxDD,
    maxWinStreak, maxLossStreak,
    equity: totalR, // equity in R terms
  }
}

// Equity curve — cumulative R over time
export function equityCurveForTrades(trades) {
  let r = 0
  return [
    { label: 'Start', r: 0 },
    ...trades.map((t, i) => {
      r += (t.pl || t.r_multiple || 0)
      return { label: t.date, r: parseFloat(r.toFixed(2)) }
    })
  ]
}

// Format R value
export function fR(r) {
  if (r == null || isNaN(r)) return '—'
  const n = parseFloat(r)
  return (n >= 0 ? '+' : '') + n.toFixed(2) + 'R'
}

// Format R short
export function f2(r) {
  if (r == null || isNaN(r)) return '—'
  const n = parseFloat(r)
  return (n >= 0 ? '+' : '') + n.toFixed(2) + 'R'
}

export function f1(r) {
  if (r == null || isNaN(r)) return '—'
  const n = parseFloat(r)
  return (n >= 0 ? '+' : '') + n.toFixed(1) + 'R'
}

// Keep fUSD for account equity display (not trade P/L)
export function fUSD(v) {
  if (v == null || isNaN(v)) return '—'
  return '$' + Math.round(v).toLocaleString('en-US')
}

export function fP(v) {
  if (v == null || isNaN(v)) return '—'
  return (v * 100).toFixed(1) + '%'
}

// Breakdown stats by category
export function breakdownStats(trades, key, items) {
  return items.map(item => {
    const group = trades.filter(t => t[key] === item)
    return { label: item, ...computeStats(group) }
  })
}
