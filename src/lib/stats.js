export const BAL = 100000

export function computeStats(trades, startingBalance) {
  const BAL = startingBalance || 100000
  const wins   = trades.filter(t => t.outcome === 'Win')
  const losses = trades.filter(t => t.outcome === 'Loss')
  const bes    = trades.filter(t => t.outcome === 'Break Even')
  const n      = trades.length
  const totalPL = trades.reduce((s, t) => s + (t.pl || 0), 0)
  const winRate = n ? wins.length / n : 0
  const avgWin  = wins.length   ? wins.reduce((s,t) => s+(t.pl||0),0)/wins.length   : 0
  const avgLoss = losses.length ? losses.reduce((s,t) => s+(t.pl||0),0)/losses.length : 0
  const grossWin  = wins.reduce((s,t) => s+(t.pl||0), 0)
  const grossLoss = Math.abs(losses.reduce((s,t) => s+(t.pl||0), 0))
  const pf  = grossLoss > 0 ? grossWin / grossLoss : 0
  const exp = n ? winRate * avgWin + (1 - winRate) * avgLoss : 0
  const wl  = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0

  // Equity curve
  let eq = BAL
  const curve = [BAL]
  trades.forEach(t => { eq = eq * (1 + (t.pl || 0) / 100); curve.push(eq) })

  // Max drawdown
  let peak = BAL, maxDD = 0
  curve.forEach(v => {
    if (v > peak) peak = v
    const dd = (v - peak) / peak * 100
    if (dd < maxDD) maxDD = dd
  })

  // Streaks
  let cw = 0, cl = 0, mw = 0, ml = 0
  trades.forEach(t => {
    if (t.outcome === 'Win')        { cw++; cl = 0; mw = Math.max(mw, cw) }
    else if (t.outcome === 'Loss')  { cl++; cw = 0; ml = Math.max(ml, cl) }
    else                            { cw = 0; cl = 0 }
  })

  // Avg R (wins only)
  const rWins = wins.filter(t => t.r_multiple)
  const avgR  = rWins.length ? rWins.reduce((s,t) => s+(t.r_multiple||0),0)/rWins.length : 0

  return {
    wins: wins.length, losses: losses.length, bes: bes.length,
    n, totalPL, winRate, avgWin, avgLoss,
    grossWin, grossLoss, pf, exp, wl,
    maxDD, mw, ml, cw, cl,
    curve, equity: curve[curve.length - 1], avgR,
    best:  wins.length   ? Math.max(...wins.map(t=>t.pl||0))   : 0,
    worst: losses.length ? Math.min(...losses.map(t=>t.pl||0)) : 0,
  }
}

export function breakdownStats(trades, key, items) {
  return items.map(item => {
    const group = trades.filter(t => t[key] === item)
    return { label: item, ...computeStats(group) }
  })
}

// Format helpers
export const f2  = n => n == null ? '—' : `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`
export const f1  = n => n == null ? '—' : `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`
export const fUSD = n => '$' + Math.round(n).toLocaleString('en-US')
export const fR  = n => n ? `${n.toFixed(1)}R` : '—'
export const fP  = n => (n * 100).toFixed(1) + '%'

export function equityCurveForTrades(trades, startingBalance) {
  const BAL = startingBalance || 100000
  let eq = BAL
  return trades.map(t => {
    const prev = eq
    eq = eq * (1 + (t.pl || 0) / 100)
    return { ...t, equity: eq, plDollar: (t.pl || 0) / 100 * prev }
  })
}

export function getDayOfWeek(dateStr) {
  return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(dateStr).getDay()]
}
