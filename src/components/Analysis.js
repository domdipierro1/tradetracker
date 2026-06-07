import { useMemo } from 'react'
import { computeStats, f2, f1, fP, fR } from '../lib/stats'

const HOURS = ['2:00','3:00','4:00','5:00','6:00','7:00','8:00','9:00','10:00']
// 30-minute slots across the session (02:00–15:00 EST)
const SLOTS = []
for (let h = 2; h <= 15; h++) { SLOTS.push(`${String(h).padStart(2,'0')}:00`); if (h < 15) SLOTS.push(`${String(h).padStart(2,'0')}:30`) }
// Round any HH:MM to its 30-min slot, e.g. "08:37" -> "08:30"
function toSlot(time) {
  if (!time) return null
  const m = String(time).match(/^(\d{1,2}):(\d{2})/)
  if (!m) return null
  const h = parseInt(m[1],10), min = parseInt(m[2],10)
  if (isNaN(h)||isNaN(min)) return null
  return `${String(h).padStart(2,'0')}:${min < 30 ? '00' : '30'}`
}
const DOW   = ['Monday','Tuesday','Wednesday','Thursday','Friday']

// ── SECTION HEADER ───────────────────────────────────────────────
function SectionHeader({ title, sub }) {
  return (
    <div style={{ marginBottom:'16px' }}>
      <h2 style={{ fontSize:'17px', fontWeight:'700', color:'#14181F', letterSpacing:'-.02em', marginBottom:'2px' }}>{title}</h2>
      {sub && <p style={{ fontSize:'12px', color:'#717A88', margin:0 }}>{sub}</p>}
    </div>
  )
}

// ── BREAKDOWN TABLE ───────────────────────────────────────────────
// ── TAG PERFORMANCE — array-valued tags (emotions/mistakes) ──────
function TagPerformance({ title, field, trades, accent = '#7C3AED' }) {
  const parse = raw => {
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p : (raw ? [String(raw)] : []) }
    catch { return raw ? [String(raw)] : [] }
  }
  const tagMap = {}
  trades.forEach(t => {
    parse(t[field]).forEach(tag => {
      if (!tagMap[tag]) tagMap[tag] = []
      tagMap[tag].push(t)
    })
  })
  const rows = Object.keys(tagMap).map(tag => {
    const group = tagMap[tag]
    const s = computeStats(group)
    return { label: tag, ...s }
  }).filter(r => r.n > 0).sort((a, b) => (a.totalR || 0) - (b.totalR || 0)) // worst first

  if (rows.length === 0) return null
  const maxR = Math.max(...rows.map(r => Math.abs(r.totalR || 0)), 0.01)
  const G = '1fr 36px 50px 36px 76px 50px'

  return (
    <div style={{ background:'#FFFFFF', borderRadius:'20px', overflow:'hidden', boxShadow:'0 1px 2px rgba(20,24,31,.04), 0 1px 8px rgba(20,24,31,.04)' }}>
      <div style={{ padding:'14px 18px', borderBottom:'1px solid #E9ECF1', display:'flex', alignItems:'center', gap:'10px' }}>
        <div style={{ width:'3px', height:'16px', borderRadius:'2px', background: accent, flexShrink:0 }} />
        <span style={{ fontSize:'13px', fontWeight:'700', color:'#14181F' }}>{title}</span>
        <span style={{ marginLeft:'auto', fontSize:'11px', color:'#717A88' }}>{rows.length} tag{rows.length===1?'':'s'}</span>
      </div>
      <div style={{ padding:'0 18px' }}>
        <div style={{ display:'grid', gridTemplateColumns:G, padding:'8px 0 6px', borderBottom:'1px solid #E9ECF1' }}>
          {['','Tr','Win%','W','Total R','Exp'].map((h,i) => (
            <div key={i} style={{ fontSize:'9px', fontWeight:'700', color:'#717A88', letterSpacing:'.06em', textTransform:'uppercase', textAlign:i===0?'left':'right' }}>{h}</div>
          ))}
        </div>
        {rows.map((r, i) => {
          const barPct = Math.min(100, Math.abs(r.totalR||0) / maxR * 100)
          const rCol = (r.totalR||0) >= 0 ? '#059669' : '#E11D48'
          return (
            <div key={r.label} style={{ display:'grid', gridTemplateColumns:G, borderBottom: i<rows.length-1?'1px solid #F4F6F8':'none', margin:'0 -18px', padding:'9px 18px', transition:'background .1s' }}
              onMouseEnter={e=>e.currentTarget.style.background='#F8FAFC'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div style={{ fontWeight:'600', color:'#334155', fontSize:'12px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', paddingRight:'6px' }} title={r.label}>{r.label}</div>
              <div style={{ textAlign:'right', fontFamily:"'JetBrains Mono',monospace", color:'#64748B', fontSize:'11px' }}>{r.n}</div>
              <div style={{ textAlign:'right', fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', fontWeight:'600', color: r.winRate>=.5?'#059669':'#E11D48' }}>{fP(r.winRate)}</div>
              <div style={{ textAlign:'right', fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#059669', fontWeight:'500' }}>{r.wins||0}</div>
              <div style={{ display:'flex', alignItems:'center', gap:'4px', justifyContent:'flex-end' }}>
                <div style={{ width:'28px', height:'3px', background:'#F1F5F9', borderRadius:'2px', overflow:'hidden', flexShrink:0 }}>
                  <div style={{ width:barPct+'%', height:'100%', background:rCol, borderRadius:'2px' }} />
                </div>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', fontWeight:'700', color:rCol, minWidth:'30px', textAlign:'right' }}>{f1(r.totalR||0)}</span>
              </div>
              <div style={{ textAlign:'right', fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', fontWeight:'600', color:(r.expectancy||0)>0?'#059669':'#E11D48' }}>{r.expectancy?f2(r.expectancy):'—'}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── BREAKDOWN TABLE ──────────────────────────────────────────────
function BreakdownTable({ title, k, items, trades, accent = '#4F46E5' }) {
  const kzOf = (time) => {
    if (!time) return null
    const h = parseInt(String(time).slice(0,2), 10)
    if (isNaN(h)) return null
    if (h >= 2 && h < 5)  return 'London (02–05)'
    if (h >= 5 && h < 8)  return 'Overlap (05–08)'
    if (h >= 8 && h < 11) return 'NY AM (08–11)'
    return 'Other'
  }
  const withDow = trades.map(t => ({
    ...t,
    dow: t.date ? ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(t.date).getDay()] : null,
    killzone: kzOf(t.time)
  }))

  const rows = items.map(item => {
    const group = withDow.filter(t => t[k] === item)
    const s = computeStats(group)
    return { label: item, ...s }
  }).filter(r => r.n > 0)

  const maxR = Math.max(...rows.map(r => Math.abs(r.totalR || 0)), 0.01)
  if (rows.length === 0) return null

  const G = '1fr 36px 50px 36px 76px 50px'

  return (
    <div style={{ background:'#FFFFFF', borderRadius:'20px', overflow:'hidden', boxShadow:'0 1px 2px rgba(20,24,31,.04), 0 1px 8px rgba(20,24,31,.04)' }}>
      <div style={{ padding:'14px 18px', borderBottom:'1px solid #E9ECF1', display:'flex', alignItems:'center', gap:'10px' }}>
        <div style={{ width:'3px', height:'16px', borderRadius:'2px', background: accent, flexShrink:0 }} />
        <span style={{ fontSize:'13px', fontWeight:'700', color:'#14181F' }}>{title}</span>
        <span style={{ marginLeft:'auto', fontSize:'11px', color:'#717A88' }}>{rows.length} categor{rows.length===1?'y':'ies'}</span>
      </div>
      <div style={{ padding:'0 18px' }}>
        <div style={{ display:'grid', gridTemplateColumns:G, padding:'8px 0 6px', borderBottom:'1px solid #E9ECF1' }}>
          {['','Tr','Win%','W','Total R','Exp'].map((h,i) => (
            <div key={i} style={{ fontSize:'9px', fontWeight:'700', color:'#717A88', letterSpacing:'.06em', textTransform:'uppercase', textAlign:i===0?'left':'right' }}>{h}</div>
          ))}
        </div>
        {rows.map((r, i) => {
          const barPct = Math.min(100, Math.abs(r.totalR||0) / maxR * 100)
          const rCol = (r.totalR||0) >= 0 ? '#059669' : '#E11D48'
          return (
            <div key={r.label} style={{ display:'grid', gridTemplateColumns:G, padding:'9px 0', borderBottom: i<rows.length-1?'1px solid #F4F6F8':'none', transition:'background .1s', margin:'0 -18px', padding:'9px 18px' }}
              onMouseEnter={e=>e.currentTarget.style.background='#F8FAFC'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div style={{ fontWeight:'600', color:'#334155', fontSize:'12px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', paddingRight:'6px' }} title={r.label}>{r.label}</div>
              <div style={{ textAlign:'right', fontFamily:"'JetBrains Mono',monospace", color:'#64748B', fontSize:'11px' }}>{r.n}</div>
              <div style={{ textAlign:'right', fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', fontWeight:'600', color: r.winRate>=.5?'#059669':'#E11D48' }}>{fP(r.winRate)}</div>
              <div style={{ textAlign:'right', fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#059669', fontWeight:'500' }}>{r.wins||0}</div>
              <div style={{ display:'flex', alignItems:'center', gap:'4px', justifyContent:'flex-end' }}>
                <div style={{ width:'28px', height:'3px', background:'#F1F5F9', borderRadius:'2px', overflow:'hidden', flexShrink:0 }}>
                  <div style={{ width:barPct+'%', height:'100%', background:rCol, borderRadius:'2px' }} />
                </div>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', fontWeight:'700', color:rCol, minWidth:'30px', textAlign:'right' }}>{f1(r.totalR||0)}</span>
              </div>
              <div style={{ textAlign:'right', fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', fontWeight:'600', color:(r.expectancy||0)>0?'#059669':'#E11D48' }}>{r.expectancy?f2(r.expectancy):'—'}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


const GRADE_ITEMS = ['Preparation','Patience','Entry Quality','Risk','Exit Discipline']

export default function Analysis({ trades, dailyNotes }) {
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
    Math.max(...SLOTS.map(slot => Math.abs(trades.filter(t => toSlot(t.time) === slot).reduce((s,t) => s+(t.pl||t.r_multiple||0),0))), 0.01),
    [trades]
  )

  const isEmpty = trades.length === 0

  return (
    <div style={{ padding:'24px', maxWidth:'1100px', margin:'0 auto' }}>

      {/* Page title */}
      <div style={{ marginBottom:'30px' }}>
        <h1 style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:'30px', fontWeight:'800', color:'#14181F', letterSpacing:'-.04em', marginBottom:'4px', lineHeight:1.05 }}>Analysis</h1>
        <p style={{ fontSize:'13.5px', color:'#717A88' }}>
          {isEmpty ? 'Log trades to see performance breakdowns' : `${trades.length} trade${trades.length>1?'s':''} analysed across every dimension`}
        </p>
      </div>

      {isEmpty && (
        <div style={{ padding:'48px', textAlign:'center', background:'#FFFFFF', borderRadius:'20px', boxShadow:'0 1px 2px rgba(20,24,31,.04), 0 1px 8px rgba(20,24,31,.04)', color:'#717A88', fontSize:'14px' }}>
          No trades logged yet. Start journalling to see your analysis.
        </div>
      )}

      {!isEmpty && (
        <>
          {/* ── COMBO TABLE ── */}
          <div style={{ marginBottom:'32px' }}>
            <SectionHeader title="Best Setup Combinations" sub="Level · Session · Direction — sorted by expectancy · min 2 trades" />
            <div style={{ background:'#FFFFFF', borderRadius:'20px', overflow:'hidden', boxShadow:'0 1px 2px rgba(20,24,31,.04), 0 1px 8px rgba(20,24,31,.04)' }}>
              {combos.length === 0 ? (
                <div style={{ padding:'32px', textAlign:'center', color:'#717A88', fontSize:'13px' }}>
                  Need trades with Level + Session + Direction filled in (min. 2 per combination)
                </div>
              ) : (
                <div>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'12px' }}>
                    <thead>
                      <tr style={{ background:'#F8FAFC' }}>
                        {['#','Combination','Trades','Win %','Avg Win','Avg Loss','Exp/R','Total R'].map((h,i) => (
                          <th key={i} style={{ padding:'10px 14px', textAlign: i<=1?'left':'right', fontSize:'10px', fontWeight:'600', color:'#717A88', letterSpacing:'.07em', textTransform:'uppercase', borderBottom:'1px solid #E9ECF1', whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {combos.map((c,i) => (
                        <tr key={c.key} style={{ borderBottom: i<combos.length-1?'1px solid #F4F6F8':'none', transition:'background .1s' }}
                          onMouseEnter={e => e.currentTarget.style.background='#F8FAFC'}
                          onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                          <td style={{ padding:'12px 14px', width:'36px' }}>
                            {i === 0
                              ? <span style={{ background:'#FEF9C3', color:'#854D0E', fontSize:'10px', fontWeight:'700', padding:'2px 7px', borderRadius:'6px' }}>🏆 #1</span>
                              : <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'#A4ABB7' }}>#{i+1}</span>
                            }
                          </td>
                          <td style={{ padding:'12px 14px' }}>
                            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', fontWeight:'600', color:'#334155' }}>{c.key}</span>
                          </td>
                          <td style={{ padding:'12px 14px', textAlign:'right', fontFamily:"'JetBrains Mono',monospace", color:'#475569', fontSize:'12px' }}>{c.n}</td>
                          <td style={{ padding:'12px 14px', textAlign:'right' }}>
                            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', fontWeight:'600', color: c.winRate>=.5?'#059669':'#E11D48' }}>{fP(c.winRate)}</span>
                          </td>
                          <td style={{ padding:'12px 14px', textAlign:'right', fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:'#059669', fontWeight:'500' }}>{c.avgWin ? f2(c.avgWin) : '—'}</td>
                          <td style={{ padding:'12px 14px', textAlign:'right', fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:'#E11D48', fontWeight:'500' }}>{c.avgLoss ? f2(c.avgLoss) : '—'}</td>
                          <td style={{ padding:'12px 14px', textAlign:'right', fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', fontWeight:'700', color: (c.expectancy||0)>0?'#059669':'#E11D48' }}>{c.expectancy ? f2(c.expectancy) : '—'}</td>
                          <td style={{ padding:'12px 14px', textAlign:'right', fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', fontWeight:'700', color: (c.totalR||0)>=0?'#059669':'#E11D48' }}>{f2(c.totalR||0)}</td>
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
              <BreakdownTable title="By Symbol"    k="symbol"    items={[...new Set(trades.map(t=>t.symbol).filter(Boolean))].sort()} trades={trades} accent="#4F46E5" />
              <TagPerformance title="By Key Level" field="level" trades={trades} accent="#7C3AED" />
              <BreakdownTable title="By Trade Type" k="trade_type" items={['SMR Continuation','Not in Plan']} trades={trades} accent="#4F46E5" />
  <BreakdownTable title="By Direction" k="direction" items={['Long','Short']} trades={trades} accent="#059669" />
              <BreakdownTable title="By Session"   k="session"   items={['London (02:00–05:00)','New York AM (06:00–10:00)']} trades={trades} accent="#0D9488" />
              <BreakdownTable title="By Killzone"  k="killzone"  items={['London (02–05)','Overlap (05–08)','NY AM (08–11)','Other']} trades={trades} accent="#0D9488" />
              <BreakdownTable title="By Day"       k="dow"       items={DOW} trades={trades} accent="#D97706" />
              <BreakdownTable title="By Bias"      k="bias"      items={['Bullish','Bearish']} trades={trades} accent="#E11D48" />
              <BreakdownTable title="By P/D Array" k="pd_array"  items={['Premium','Discount']} trades={trades} accent="#4F46E5" />
              <BreakdownTable title="By Entry TF"  k="entry_tf"  items={['5m','15m','30m']} trades={trades} accent="#059669" />
              <TagPerformance title="By Emotion"   field="emotions"     trades={trades} accent="#7C3AED" />
              <TagPerformance title="By Mistake"   field="mistake_tags" trades={trades} accent="#E11D48" />
            </div>
          </div>

          {/* ── MAE / MFE ── */}
          {trades.some(t => t.mae != null || t.mfe != null) && (
            <div style={{ marginBottom:'32px' }}>
              <SectionHeader title="MAE / MFE Analysis" sub="Most Adverse & Favourable Excursion in R — how far trades moved against/for you" />
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:'14px' }}>

                {/* MAE summary */}
                <div style={{ background:'#FFFFFF', borderRadius:'20px', padding:'22px 24px', boxShadow:'0 1px 2px rgba(20,24,31,.04), 0 1px 8px rgba(20,24,31,.04)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
                    <div style={{ width:'3px', height:'18px', borderRadius:'2px', background:'#E11D48' }} />
                    <span style={{ fontSize:'13px', fontWeight:'700', color:'#14181F' }}>MAE — Max Against You</span>
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
                            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'14px', fontWeight:'700', color:'#059669' }}>{avgWinMAE}R</span>
                          </div>
                        )}
                        {avgLossMAE && (
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'#FEF2F2', borderRadius:'10px', border:'1px solid #FECACA' }}>
                            <span style={{ fontSize:'12px', color:'#7F1D1D', fontWeight:'500' }}>Avg MAE on Losers</span>
                            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'14px', fontWeight:'700', color:'#E11D48' }}>{avgLossMAE}R</span>
                          </div>
                        )}
                        <div style={{ fontSize:'11px', color:'#717A88', padding:'8px 12px', background:'#F8FAFC', borderRadius:'8px', lineHeight:'1.6' }}>
                          {avgWinMAE && parseFloat(avgWinMAE) < 0.5 ? '✓ Winners barely move against you — stop placement is good' :
                           avgWinMAE && parseFloat(avgWinMAE) > 1 ? '⚠ Winners going deep before turning — consider tighter stops' :
                           'Keep tracking to build a meaningful sample'}
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {/* MFE summary */}
                <div style={{ background:'#FFFFFF', borderRadius:'20px', padding:'22px 24px', boxShadow:'0 1px 2px rgba(20,24,31,.04), 0 1px 8px rgba(20,24,31,.04)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
                    <div style={{ width:'3px', height:'18px', borderRadius:'2px', background:'#059669' }} />
                    <span style={{ fontSize:'13px', fontWeight:'700', color:'#14181F' }}>MFE — Max In Your Favour</span>
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
                            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'14px', fontWeight:'700', color:'#059669' }}>{avgWinMFE}R</span>
                          </div>
                        )}
                        {avgLossMFE && (
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'#FEF2F2', borderRadius:'10px', border:'1px solid #FECACA' }}>
                            <span style={{ fontSize:'12px', color:'#7F1D1D', fontWeight:'500' }}>Avg MFE on Losers</span>
                            <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'14px', fontWeight:'700', color:'#E11D48' }}>{avgLossMFE}R</span>
                          </div>
                        )}
                        {earlyExits.length > 0 && (
                          <div style={{ fontSize:'11px', color:'#92400E', padding:'8px 12px', background:'#FFFBEB', borderRadius:'8px', border:'1px solid #FDE68A', lineHeight:'1.6' }}>
                            ⚠ {earlyExits.length} winner{earlyExits.length>1?'s':''} reached beyond 2.3R — consider trailing your stop
                          </div>
                        )}
                        {!earlyExits.length && avgWinMFE && (
                          <div style={{ fontSize:'11px', color:'#717A88', padding:'8px 12px', background:'#F8FAFC', borderRadius:'8px', lineHeight:'1.6' }}>
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
            <SectionHeader title="Time of Day" sub="R performance by 30-min EST slot · 02:00–15:00" />
            <div style={{ background:'#FFFFFF', borderRadius:'20px', padding:'22px 24px', boxShadow:'0 1px 2px rgba(20,24,31,.04), 0 1px 8px rgba(20,24,31,.04)' }}>
              <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                {SLOTS.filter(slot => trades.some(t => toSlot(t.time) === slot)).map(slot => {
                  const ht  = trades.filter(t => toSlot(t.time) === slot)
                  const pl  = ht.reduce((s,t) => s+(t.pl||t.r_multiple||0), 0)
                  const has = ht.length > 0
                  const intensity = has ? Math.min(1, Math.abs(pl) / maxTimePL) : 0
                  const bg  = !has ? '#F8FAFC' : pl > 0 ? `rgba(16,185,129,${.1+intensity*.5})` : `rgba(239,68,68,${.1+intensity*.5})`
                  const tc  = !has ? '#CBD5E1' : pl > 0 ? (intensity>.5?'#FFFFFF':'#065F46') : (intensity>.5?'#FFFFFF':'#7F1D1D')
                  const border = !has ? '#F1F5F9' : pl > 0 ? '#BBF7D0' : '#FECACA'
                  return (
                    <div key={slot} style={{ background:bg, borderRadius:'14px', padding:'12px 14px', minWidth:'72px', textAlign:'center', border:`1.5px solid ${border}`, transition:'transform .15s', cursor:'default', flex:'1' }}
                      onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
                      onMouseLeave={e => e.currentTarget.style.transform=''}>
                      <div style={{ fontSize:'10px', fontWeight:'600', color:'#717A88', marginBottom:'5px', letterSpacing:'.05em' }}>{slot}</div>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'14px', fontWeight:'700', color:tc, lineHeight:1, marginBottom:'4px' }}>{has ? f1(pl) : '—'}</div>
                      <div style={{ fontSize:'10px', color:'#717A88' }}>{ht.length}t</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}

      <GradingAnalysis dailyNotes={dailyNotes} />

      <div style={{ height:'20px' }} />
    </div>
  )
}

// ── GRADING ANALYSIS — long-term pillar performance + reasons ────
function GradingAnalysis({ dailyNotes }) {
  const stats = GRADE_ITEMS.map((label, idx) => {
    let sum = 0, count = 0, lowDays = 0
    const reasons = []
    ;(dailyNotes || []).forEach(n => {
      if (!n.checklist_data) return
      try {
        const cd = JSON.parse(n.checklist_data)
        const g = (cd.grades || [])[idx]
        if (g > 0) {
          sum += g; count++
          if (g <= 3) lowDays++
          const r = (cd.gradeReasons || [])[idx]
          if (g <= 4 && r && r.trim()) reasons.push({ date: n.date, score: g, text: r.trim() })
        }
      } catch {}
    })
    reasons.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    return { label, avg: count ? sum / count : 0, count, lowDays, reasons }
  }).filter(s => s.count > 0).sort((a, b) => a.avg - b.avg)

  if (stats.length === 0) return null
  const colAvg = a => a >= 4 ? '#059669' : a >= 3 ? '#D97706' : '#E11D48'

  return (
    <>
      <SectionHeader title="Process Grading" sub="Average score per area across all graded days · weakest first" />
      <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:'12px', marginBottom:'28px' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background:'#FFFFFF', borderRadius:'16px', border:'1px solid #E9ECF1', boxShadow:'0 1px 2px rgba(20,24,31,.04), 0 1px 8px rgba(20,24,31,.04)', overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'14px 18px', borderBottom: s.reasons.length ? '1px solid #F4F6F8' : 'none' }}>
              <span style={{ fontSize:'14px', fontWeight:'700', color:'#14181F', flex:1 }}>{s.label}</span>
              <span style={{ fontSize:'11px', color:'#717A88' }}>{s.count} {s.count === 1 ? 'day' : 'days'}</span>
              {s.lowDays > 0 && <span style={{ fontSize:'10px', fontWeight:'600', color:'#E11D48', background:'#FDECEF', padding:'2px 8px', borderRadius:'20px' }}>low {s.lowDays}</span>}
              <div style={{ width:'110px', height:'6px', background:'#F1F5F9', borderRadius:'3px', overflow:'hidden' }}>
                <div style={{ width:`${(s.avg/5)*100}%`, height:'100%', background:colAvg(s.avg), borderRadius:'3px' }} />
              </div>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'17px', fontWeight:'700', color:colAvg(s.avg), minWidth:'40px', textAlign:'right' }}>{s.avg.toFixed(1)}</span>
            </div>
            {s.reasons.length > 0 && (
              <div style={{ padding:'10px 18px 14px' }}>
                <div style={{ fontSize:'9px', fontWeight:'700', color:'#A4ABB7', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:'8px' }}>Why not a 5</div>
                {s.reasons.slice(0, 6).map((r, i) => (
                  <div key={i} style={{ display:'flex', gap:'10px', padding:'5px 0', alignItems:'flex-start' }}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'#A4ABB7', minWidth:'62px', paddingTop:'1px' }}>{new Date(r.date+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</span>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', fontWeight:'700', color:colAvg(r.score), minWidth:'14px' }}>{r.score}</span>
                    <span style={{ fontSize:'12px', color:'#475569', flex:1, lineHeight:'1.5' }}>{r.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
