import { useMemo } from 'react'
import { computeStats, f2, f1, fP, fR } from '../lib/stats'

const HOURS = ['2:00','3:00','4:00','5:00','6:00','7:00','8:00','9:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00']
const DOW = ['Monday','Tuesday','Wednesday','Thursday','Friday']

function DataBar({ value, max, positive }) {
  const pct = Math.min(100, Math.abs(value) / Math.max(max, 0.01) * 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span className={value >= 0 ? 'num-up' : 'num-dn'} style={{ minWidth: '52px', fontSize: '12px' }}>{f1(value)}</span>
      <div style={{ width: '60px', height: '6px', background: 'var(--border)', borderRadius: '3px', flexShrink: 0 }}>
        <div style={{ width: pct + '%', height: '100%', borderRadius: '3px', background: value >= 0 ? 'var(--green)' : 'var(--red)', transition: 'width .5s ease' }} />
      </div>
    </div>
  )
}

function BreakdownTable({ title, key: k, items, trades, accent = 'var(--blue)' }) {
  const withDow = trades.map(t => ({ ...t, dow: t.date ? ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(t.date).getDay()] : null }))
  const rows = items.map(item => {
    const group = withDow.filter(t => t[k] === item)
    return { label: item, ...computeStats(group) }
  })
  const maxPL = Math.max(...rows.map(r => Math.abs(r.totalPL)), 0.01)

  return (
    <div className="tbl-card">
      <div className="tbl-hdr" style={{ borderLeft: `3px solid ${accent}` }}>
        <span className="tbl-hdr-title">{title}</span>
      </div>
      <div className="tbl-wrap">
        <table style={{ fontSize: '12px' }}>
          <thead><tr><th></th><th>Trades</th><th>Win %</th><th>Avg Win</th><th>Avg Loss</th><th>% Gain</th><th>Exp/Trade</th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.label}>
                <td style={{ fontWeight: '700', color: 'var(--text)' }}>{r.label}</td>
                <td className="num">{r.n}</td>
                <td><span className={r.winRate >= .5 ? 'num-up' : 'num-dn'}>{fP(r.winRate)}</span></td>
                <td className="num-up">{r.avgWin ? f2(r.avgWin) : '—'}</td>
                <td className="num-dn">{r.avgLoss ? f2(r.avgLoss) : '—'}</td>
                <td><DataBar value={r.totalPL} max={maxPL} /></td>
                <td className={r.exp > 0 ? 'num-up' : 'num-dn'}>{r.exp ? f2(r.exp) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Analysis({ trades, startingBalance }) {
  // Best setup combinations
  const combos = useMemo(() => {
    const map = {}
    trades.forEach(t => {
      if (!t.setup || !t.session || !t.direction) return
      const key = `${t.setup} + ${t.session} + ${t.direction}`
      if (!map[key]) map[key] = []
      map[key].push(t)
    })
    return Object.entries(map)
      .map(([key, ts]) => ({ key, ...computeStats(ts) }))
      .filter(c => c.n >= 3)
      .sort((a, b) => b.exp - a.exp)
      .slice(0, 10)
  }, [trades])

  // Time heatmap
  const maxTimePL = useMemo(() => Math.max(...HOURS.map(h => Math.abs(trades.filter(t => t.time === h).reduce((s, t) => s + (t.pl || 0), 0))), 0.01), [trades])

  const withDow = trades.map(t => ({ ...t, dow: t.date ? ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(t.date).getDay()] : null }))

  return (
    <div className="page active">
      <div className="sh"><h2>Setup Combination Analysis</h2><span className="sh-right">Min. 3 trades · sorted by expectancy</span></div>
      <div className="tbl-card" style={{ marginBottom: '24px' }}>
        <div className="tbl-wrap">
          {combos.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
              Need trades with Setup + Session + Direction filled in (min. 3 per combination)
            </div>
          ) : (
            <table>
              <thead><tr><th>Combination</th><th>Trades</th><th>Win %</th><th>Avg Win</th><th>Avg Loss</th><th>Avg R</th><th>Expectancy</th><th>% Gain</th></tr></thead>
              <tbody>
                {combos.map((c, i) => (
                  <tr key={c.key}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {i === 0 && <span title="Best combination" style={{ fontSize: '14px' }}>🏆</span>}
                        <span style={{ fontWeight: '700', fontFamily: "'JetBrains Mono',monospace", fontSize: '12px', color: 'var(--text)' }}>{c.key}</span>
                      </div>
                    </td>
                    <td className="num">{c.n}</td>
                    <td><span className={c.winRate >= .5 ? 'num-up' : 'num-dn'}>{fP(c.winRate)}</span></td>
                    <td className="num-up">{c.avgWin ? f2(c.avgWin) : '—'}</td>
                    <td className="num-dn">{c.avgLoss ? f2(c.avgLoss) : '—'}</td>
                    <td className="num">{fR(c.avgR)}</td>
                    <td><span className={c.exp > 0 ? 'num-up' : 'num-dn'} style={{ fontWeight: '700' }}>{c.exp ? f2(c.exp) : '—'}</span></td>
                    <td className={c.totalPL >= 0 ? 'num-up' : 'num-dn'}>{f2(c.totalPL)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="sh"><h2>Breakdown by Category</h2></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(360px,1fr))', gap: '14px', marginBottom: '24px' }} className="breakdown-grid">
        <BreakdownTable title="By Symbol"    k="symbol"    items={['NQ','ES','YM','DAX','FTSE100','GC','SI','EUR/USD','GBP/USD','AUD/USD','USD/JPY','GBP/JPY','EUR/JPY']} trades={trades} accent="var(--blue)"   />
        <BreakdownTable title="By Setup"     k="setup"     items={['Prev Month High','Prev Month Low','Prev Week High','Prev Week Low','Prev Day High','Prev Day Low','4H Fair Value Gap','4H Order Block','4H Breaker Block','4H Mitigation Block','Daily Fair Value Gap','Daily Order Block','Daily Breaker Block','Daily Mitigation Block']}                           trades={trades} accent="var(--purple)" />
        <BreakdownTable title="By Direction" k="direction" items={['Long','Short']}                            trades={trades} accent="var(--green)"  />
        <BreakdownTable title="By Session"   k="session"   items={['London','New York','Overlap','Asia']}                 trades={trades} accent="var(--blue)"   />
        <BreakdownTable title="By Day"       k="dow"       items={DOW}                                         trades={withDow} accent="var(--purple)"/>
        <BreakdownTable title="By HTF Bias"  k="bias"      items={['Bullish','Bearish']}             trades={trades} accent="var(--amber)"  />
      </div>

      <div className="sh"><h2>Time of Day Performance</h2></div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '18px', marginBottom: '24px', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {HOURS.map(h => {
            const ht = trades.filter(t => t.time === h)
            const pl = ht.reduce((s, t) => s + (t.pl || 0), 0)
            const intensity = ht.length ? Math.min(1, Math.abs(pl) / maxTimePL) : 0
            const hasData = ht.length > 0
            const bg = !hasData ? 'var(--surface2)' : pl > 0 ? `rgba(5,150,105,${.12 + intensity * .55})` : `rgba(220,38,38,${.12 + intensity * .55})`
            const textColor = intensity > .5 && hasData ? '#fff' : hasData && pl > 0 ? 'var(--green)' : hasData ? 'var(--red)' : 'var(--muted2)'
            return (
              <div key={h} style={{ background: bg, borderRadius: '10px', padding: '10px 12px', minWidth: '68px', textAlign: 'center', border: `1.5px solid ${hasData && pl > 0 ? 'var(--green-dim)' : hasData && pl < 0 ? 'var(--red-dim)' : 'var(--border)'}`, transition: 'transform .15s', cursor: 'default' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = ''}>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--muted)', marginBottom: '4px', letterSpacing: '.04em' }}>{h}</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '13px', fontWeight: '700', color: textColor }}>{hasData ? f1(pl) : '—'}</div>
                <div style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '2px' }}>{ht.length} trades</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
