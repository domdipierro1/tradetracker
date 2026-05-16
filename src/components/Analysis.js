import { useMemo } from 'react'
import { computeStats, f2, f1, fP, fR } from '../lib/stats'

const HOURS = ['2:00','3:00','4:00','5:00','6:00','7:00','8:00','9:00','10:00']
const DOW   = ['Monday','Tuesday','Wednesday','Thursday','Friday']

// ── SECTION HEADER ───────────────────────────────────────────────
function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom:'16px' }}>
      <h2 style={{ fontSize:'17px', fontWeight:'700', color:'#0F172A', letterSpacing:'-.02em', marginBottom:'2px' }}>{title}</h2>
      {sub && <p style={{ fontSize:'12px', color:'#94A3B8', margin:0 }}>{sub}</p>}
    </div>
  )
}

// ── BREAKDOWN TABLE ───────────────────────────────────────────────
function BreakdownTable({ title, k, items, trades, accent = '#6366F1' }) {
  const withDow = trades.map(t => ({
    ...t,
    dow: t.date ? ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(t.date).getDay()] : null
  }))

  const rows = items.map(item => {
    const group = withDow.filter(t => t[k] === item)
    const s = computeStats(group)
    return { label: item, ...s }
  }).filter(r => r.n > 0)

  const maxR = Math.max(...rows.map(r => Math.abs(r.totalR || 0)), 0.01)

  if (rows.length === 0) return null

  return (
    <div style={{ background:'#FFFFFF', borderRadius:'20px', overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.06),0 8px 24px rgba(0,0,0,.05)', marginBottom:'0' }}>
      {/* Card header */}
      <div style={{ padding:'16px 20px', borderBottom:'1px solid #F1F5F9', display:'flex', alignItems:'center', gap:'10px' }}>
        <div style={{ width:'3px', height:'18px', borderRadius:'2px', background: accent, flexShrink:0 }} />
        <span style={{ fontSize:'13px', fontWeight:'700', color:'#0F172A' }}>{title}</span>
        <span style={{ marginLeft:'auto', fontSize:'11px', color:'#94A3B8' }}>{rows.length} categories</span>
      </div>

      {/* Table */}
      <div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
          <thead>
            <tr style={{ background:'#F8FAFC' }}>
              {['','Trades','Win %','Avg Win','Avg Loss','Total R','Exp'].map((h,i) => (
                <th key={i} style={{ padding:'9px 14px', textAlign: i===0?'left':'right', fontSize:'10px', fontWeight:'600', color:'#94A3B8', letterSpacing:'.07em', textTransform:'uppercase', borderBottom:'1px solid #F1F5F9', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const barPct = Math.min(100, Math.abs(r.totalR || 0) / maxR * 100)
              const barCol = (r.totalR || 0) >= 0 ? '#10B981' : '#EF4444'
              return (
                <tr key={r.label} style={{ borderBottom: i < rows.length-1 ? '1px solid #F8FAFC' : 'none', transition:'background .1s' }}
                  onMouseEnter={e => e.currentTarget.style.background='#F8FAFC'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <td style={{ padding:'10px 12px', fontWeight:'600', color:'#334155', fontSize:'12px', maxWidth:'140px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.label}</td>
                  <td style={{ padding:'10px 12px', textAlign:'right', fontFamily:"'JetBrains Mono',monospace", color:'#475569', fontSize:'12px' }}>{r.n}</td>
                  <td style={{ padding:'10px 12px', textAlign:'right' }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', fontWeight:'600', color: r.winRate >= .5 ? '#10B981' : '#EF4444' }}>{fP(r.winRate)}</span>
                  </td>
                  <td style={{ padding:'10px 12px', textAlign:'right' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'5px', justifyContent:'flex-end' }}>
                      <div style={{ width:'36px', height:'4px', background:'#F1F5F9', borderRadius:'2px', overflow:'hidden' }}>
                        <div style={{ width: barPct+'%', height:'100%', background: barCol, borderRadius:'2px' }} />
                      </div>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', fontWeight:'600', color: barCol, minWidth:'34px', textAlign:'right' }}>{f1(r.totalR || 0)}</span>
                    </div>
                  </td>
                  <td style={{ padding:'10px 12px', textAlign:'right', fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', fontWeight:'600', color: (r.expectancy||0) > 0 ? '#10B981' : '#EF4444' }}>{r.expectancy ? f2(r.expectancy) : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Analysis({ trades }) {
  // Best combos
  const combos = useMemo(() => {
    const map = {}
    trades.forEach(t => {
      if (!t.level && !t.setup) return
      const lvl  = t.level || t.setup || ''
      const sess = (t.session||'').replace(' (02:00–05:00)','').replace(' (06:00–10:00)','')
      const dir  = t.direction || ''
      if (!dir) return
      const key = [lvl, sess, dir].filter(Boolean).join(' · ')
      if (!map[key]) map[key] = []
      map[key].push(t)
    })
    return Object.entries(map)
      .map(([key, ts]) => ({ key, ...computeStats(ts) }))
      .filter(c => c.n >= 2)
      .sort((a, b) => (b.expectancy||0) - (a.expectancy||0))
      .slice(0, 8)
  }, [trades])

  // Time of day
  const maxTimePL = useMemo(() =>
    Math.max(...HOURS.map(h => Math.abs(trades.filter(t => t.time === h).reduce((s,t) => s+(t.pl||t.r_multiple||0),0))), 0.01),
    [trades]
  )

  const isEmpty = trades.length === 0

  return (
    <div style={{ padding:'24px', maxWidth:'1100px', margin:'0 auto' }}>

      {/* Page title */}
      <div style={{ marginBottom:'28px' }}>
        <h1 style={{ fontSize:'22px', fontWeight:'700', color:'#0F172A', letterSpacing:'-.03em', marginBottom:'3px' }}>Analysis</h1>
        <p style={{ fontSize:'13px', color:'#94A3B8' }}>
          {isEmpty ? 'Log trades to see performance breakdowns' : `${trades.length} trade${trades.length>1?'s':''} analysed`}
        </p>
      </div>

      {isEmpty && (
        <div style={{ padding:'48px', textAlign:'center', background:'#FFFFFF', borderRadius:'20px', boxShadow:'0 1px 3px rgba(0,0,0,.06),0 8px 24px rgba(0,0,0,.05)', color:'#94A3B8', fontSize:'14px' }}>
          No trades logged yet. Start journalling to see your analysis.
        </div>
      )}

      {!isEmpty && (
        <>
          {/* ── COMBO TABLE ── */}
          <div style={{ marginBottom:'32px' }}>
            <SectionHeader title="Best Setup Combinations" sub="Level · Session · Direction — sorted by expectancy · min 2 trades" />
            <div style={{ background:'#FFFFFF', borderRadius:'20px', overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,.06),0 8px 24px rgba(0,0,0,.05)' }}>
              {combos.length === 0 ? (
                <div style={{ padding:'32px', textAlign:'center', color:'#94A3B8', fontSize:'13px' }}>
                  Need trades with Level + Session + Direction filled in (min. 2 per combination)
                </div>
              ) : (
                <div>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
                    <thead>
                      <tr style={{ background:'#F8FAFC' }}>
                        {['#','Combination','Trades','Win %','Avg Win','Avg Loss','Exp/R','Total R'].map((h,i) => (
                          <th key={i} style={{ padding:'10px 14px', textAlign: i<=1?'left':'right', fontSize:'10px', fontWeight:'600', color:'#94A3B8', letterSpacing:'.07em', textTransform:'uppercase', borderBottom:'1px solid #F1F5F9', whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {combos.map((c,i) => (
                        <tr key={c.key} style={{ borderBottom: i<combos.length-1?'1px solid #F8FAFC':'none', transition:'background .1s' }}
                          onMouseEnter={e => e.currentTarget.style.background='#F8FAFC'}
                          onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                          <td style={{ padding:'12px 14px', width:'36px' }}>
                            {i === 0
                              ? <span style={{ background:'#FEF9C3', color:'#854D0E', fontSize:'10px', fontWeight:'700', padding:'2px 7px', borderRadius:'6px' }}>🏆 #1</span>
                              : <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#CBD5E1' }}>#{i+1}</span>
                            }
                          </td>
                          <td style={{ padding:'12px 14px' }}>
                            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', fontWeight:'600', color:'#334155' }}>{c.key}</span>
                          </td>
                          <td style={{ padding:'12px 14px', textAlign:'right', fontFamily:"'JetBrains Mono',monospace", color:'#475569', fontSize:'12px' }}>{c.n}</td>
                          <td style={{ padding:'12px 14px', textAlign:'right' }}>
                            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', fontWeight:'600', color: c.winRate>=.5?'#10B981':'#EF4444' }}>{fP(c.winRate)}</span>
                          </td>
                          <td style={{ padding:'12px 14px', textAlign:'right', fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:'#10B981', fontWeight:'500' }}>{c.avgWin ? f2(c.avgWin) : '—'}</td>
                          <td style={{ padding:'12px 14px', textAlign:'right', fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:'#EF4444', fontWeight:'500' }}>{c.avgLoss ? f2(c.avgLoss) : '—'}</td>
                          <td style={{ padding:'12px 14px', textAlign:'right', fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', fontWeight:'700', color: (c.expectancy||0)>0?'#10B981':'#EF4444' }}>{c.expectancy ? f2(c.expectancy) : '—'}</td>
                          <td style={{ padding:'12px 14px', textAlign:'right', fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', fontWeight:'700', color: (c.totalR||0)>=0?'#10B981':'#EF4444' }}>{f2(c.totalR||0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ── BREAKDOWNS ── */}
          <div style={{ marginBottom:'32px' }}>
            <SectionHeader title="Breakdown by Category" sub="Only categories with at least one trade are shown" />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:'14px' }}>
              <BreakdownTable title="By Symbol"    k="symbol"    items={['AUD/USD','EUR/USD','GBP/USD','NZD/USD','USD/CAD','USD/CHF','USD/JPY','NQ','ES','Gold','Silver']} trades={trades} accent="#6366F1" />
              <BreakdownTable title="By Key Level" k="level"     items={['Prev Month High','Prev Month Low','Prev Week High','Prev Week Low','Prev Day High','Prev Day Low','4H Fair Value Gap','4H Order Block','4H Breaker Block','4H Mitigation Block','Daily Fair Value Gap','Daily Order Block','Daily Breaker Block','Daily Mitigation Block']} trades={trades} accent="#8B5CF6" />
              <BreakdownTable title="By Direction" k="direction" items={['Long','Short']} trades={trades} accent="#10B981" />
              <BreakdownTable title="By Session"   k="session"   items={['London (02:00–05:00)','New York AM (06:00–10:00)']} trades={trades} accent="#0EA5E9" />
              <BreakdownTable title="By Day"       k="dow"       items={DOW} trades={trades} accent="#F59E0B" />
              <BreakdownTable title="By Bias"      k="bias"      items={['Bullish','Bearish']} trades={trades} accent="#EF4444" />
              <BreakdownTable title="By P/D Array" k="pd_array"  items={['Premium','Discount']} trades={trades} accent="#6366F1" />
              <BreakdownTable title="By Entry TF"  k="entry_tf"  items={['5m','15m','30m']} trades={trades} accent="#10B981" />
            </div>
          </div>

          {/* ── MAE / MFE ── */}
          {trades.some(t => t.mae != null || t.mfe != null) && (
            <div style={{ marginBottom:'32px' }}>
              <SectionHeader title="MAE / MFE Analysis" sub="Most Adverse & Favourable Excursion in R — how far trades moved against/for you" />
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:'14px' }}>

                {/* MAE summary */}
                <div style={{ background:'#FFFFFF', borderRadius:'20px', padding:'22px 24px', boxShadow:'0 1px 3px rgba(0,0,0,.06),0 8px 24px rgba(0,0,0,.05)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
                    <div style={{ width:'3px', height:'18px', borderRadius:'2px', background:'#EF4444' }} />
                    <span style={{ fontSize:'13px', fontWeight:'700', color:'#0F172A' }}>MAE — Max Against You</span>
                  </div>
                  {(() => {
                    const wins = trades.filter(t => t.outcome==='Win' && t.mae!=null)
                    const loss = trades.filter(t => t.outcome==='Loss' && t.mae!=null)
                    const avgWinMAE = wins.length ? (wins.reduce((s,t)=>s+parseFloat(t.mae),0)/wins.length).toFixed(2) : null
                    const avgLossMAE = loss.length ? (loss.reduce((s,t)=>s+parseFloat(t.mae),0)/loss.length).toFixed(2) : null
                    return (
                      <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                        {avgWinMAE && (
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'#F0FDF4', borderRadius:'10px', border:'1px solid #BBF7D0' }}>
                            <span style={{ fontSize:'12px', color:'#065F46', fontWeight:'500' }}>Avg MAE on Winners</span>
                            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'14px', fontWeight:'700', color:'#10B981' }}>{avgWinMAE}R</span>
                          </div>
                        )}
                        {avgLossMAE && (
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'#FEF2F2', borderRadius:'10px', border:'1px solid #FECACA' }}>
                            <span style={{ fontSize:'12px', color:'#7F1D1D', fontWeight:'500' }}>Avg MAE on Losers</span>
                            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'14px', fontWeight:'700', color:'#EF4444' }}>{avgLossMAE}R</span>
                          </div>
                        )}
                        <div style={{ fontSize:'11px', color:'#94A3B8', padding:'8px 12px', background:'#F8FAFC', borderRadius:'8px', lineHeight:'1.6' }}>
                          {avgWinMAE && parseFloat(avgWinMAE) < 0.5 ? '✓ Winners barely move against you — stop placement is good' :
                           avgWinMAE && parseFloat(avgWinMAE) > 1 ? '⚠ Winners going deep before turning — consider tighter stops' :
                           'Keep tracking to build a meaningful sample'}
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {/* MFE summary */}
                <div style={{ background:'#FFFFFF', borderRadius:'20px', padding:'22px 24px', boxShadow:'0 1px 3px rgba(0,0,0,.06),0 8px 24px rgba(0,0,0,.05)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
                    <div style={{ width:'3px', height:'18px', borderRadius:'2px', background:'#10B981' }} />
                    <span style={{ fontSize:'13px', fontWeight:'700', color:'#0F172A' }}>MFE — Max In Your Favour</span>
                  </div>
                  {(() => {
                    const wins = trades.filter(t => t.outcome==='Win' && t.mfe!=null)
                    const loss = trades.filter(t => t.outcome==='Loss' && t.mfe!=null)
                    const avgWinMFE = wins.length ? (wins.reduce((s,t)=>s+parseFloat(t.mfe),0)/wins.length).toFixed(2) : null
                    const avgLossMFE = loss.length ? (loss.reduce((s,t)=>s+parseFloat(t.mfe),0)/loss.length).toFixed(2) : null
                    const targetR = 2
                    const earlyExits = wins.filter(t => t.mfe!=null && parseFloat(t.mfe) > targetR + 0.3)
                    return (
                      <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                        {avgWinMFE && (
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'#F0FDF4', borderRadius:'10px', border:'1px solid #BBF7D0' }}>
                            <span style={{ fontSize:'12px', color:'#065F46', fontWeight:'500' }}>Avg MFE on Winners</span>
                            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'14px', fontWeight:'700', color:'#10B981' }}>{avgWinMFE}R</span>
                          </div>
                        )}
                        {avgLossMFE && (
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'#FEF2F2', borderRadius:'10px', border:'1px solid #FECACA' }}>
                            <span style={{ fontSize:'12px', color:'#7F1D1D', fontWeight:'500' }}>Avg MFE on Losers</span>
                            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'14px', fontWeight:'700', color:'#EF4444' }}>{avgLossMFE}R</span>
                          </div>
                        )}
                        {earlyExits.length > 0 && (
                          <div style={{ fontSize:'11px', color:'#92400E', padding:'8px 12px', background:'#FFFBEB', borderRadius:'8px', border:'1px solid #FDE68A', lineHeight:'1.6' }}>
                            ⚠ {earlyExits.length} winner{earlyExits.length>1?'s':''} reached beyond 2.3R — consider trailing your stop
                          </div>
                        )}
                        {!earlyExits.length && avgWinMFE && (
                          <div style={{ fontSize:'11px', color:'#94A3B8', padding:'8px 12px', background:'#F8FAFC', borderRadius:'8px', lineHeight:'1.6' }}>
                            {parseFloat(avgWinMFE) <= 2.3 ? '✓ Trades reaching target without much overshoot — 2R target is well calibrated' : 'Keep tracking to build a meaningful sample'}
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* ── TIME HEATMAP ── */}
          <div style={{ marginBottom:'20px' }}>
            <SectionHeader title="Time of Day" sub="R performance by NY session hour · 02:00–10:00" />
            <div style={{ background:'#FFFFFF', borderRadius:'20px', padding:'22px 24px', boxShadow:'0 1px 3px rgba(0,0,0,.06),0 8px 24px rgba(0,0,0,.05)' }}>
              <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                {HOURS.map(h => {
                  const ht  = trades.filter(t => t.time === h)
                  const pl  = ht.reduce((s,t) => s+(t.pl||t.r_multiple||0), 0)
                  const has = ht.length > 0
                  const intensity = has ? Math.min(1, Math.abs(pl) / maxTimePL) : 0
                  const bg  = !has ? '#F8FAFC' : pl > 0 ? `rgba(16,185,129,${.1+intensity*.5})` : `rgba(239,68,68,${.1+intensity*.5})`
                  const tc  = !has ? '#CBD5E1' : pl > 0 ? (intensity>.5?'#FFFFFF':'#065F46') : (intensity>.5?'#FFFFFF':'#7F1D1D')
                  const border = !has ? '#F1F5F9' : pl > 0 ? '#BBF7D0' : '#FECACA'
                  return (
                    <div key={h} style={{ background:bg, borderRadius:'14px', padding:'12px 14px', minWidth:'72px', textAlign:'center', border:`1.5px solid ${border}`, transition:'transform .15s', cursor:'default', flex:'1' }}
                      onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
                      onMouseLeave={e => e.currentTarget.style.transform=''}>
                      <div style={{ fontSize:'10px', fontWeight:'600', color:'#94A3B8', marginBottom:'5px', letterSpacing:'.05em' }}>{h}</div>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'14px', fontWeight:'700', color:tc, lineHeight:1, marginBottom:'4px' }}>{has ? f1(pl) : '—'}</div>
                      <div style={{ fontSize:'10px', color:'#94A3B8' }}>{ht.length}t</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}

      <div style={{ height:'20px' }} />
    </div>
  )
}
