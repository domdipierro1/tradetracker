import { useState } from 'react'

const PLAN = {
  philosophy: 'Respect session liquidity. Trade displacement (continuation) or sweeps (reversal). Never guess — wait for the 50% equilibrium retracement. If price slices through the 50% level without a confirmed reaction, the trade idea is dead. Do not chase.',
  sessions: [
    { name: 'London',     time: '00:00 – 06:00 EST', color: 'var(--blue)'   },
    { name: 'AM Session', time: '06:00 – 12:00 EST', color: 'var(--green)'  },
    { name: 'PM Session', time: '12:00 – 18:00 EST', color: 'var(--amber)'  },
    { name: 'Asia',       time: '18:00 – 00:00 EST', color: 'var(--purple)' },
  ],
  setups: [
    { type: 'Continuation', trigger: 'Price breaks/displaces through previous session high/low', target: 'Next liquidity pool or session high/low' },
    { type: 'Sweep (Reversal)', trigger: 'Price sweeps previous session/day high or low', target: 'Opposite side of the current session' },
  ],
  workflow: [
    { n: '01', title: 'Identify Displacement', desc: '15m FVG prints following a break of a session high/low.' },
    { n: '02', title: 'Wait for Equilibrium',  desc: 'Price must return to 50% of the impulse leg. Discount for buys, Premium for sells.' },
    { n: '03', title: 'Confirm Entry',         desc: 'Drop to 1m/5m. Look for Engulfing candle or Inversion FVG.' },
    { n: '04', title: 'Reaction',              desc: 'Price must show an immediate, clean reaction away from the level.' },
  ],
  risk: [
    { label: 'Standard',  value: '1.0%', note: 'Default every trade',      col: 'var(--text)' },
    { label: 'A+ Setup',  value: '1.5%', note: 'High conviction only',     col: 'var(--amber)' },
    { label: 'Maximum',   value: '2.5%', note: 'Never exceed this',        col: 'var(--red)' },
    { label: 'Target R',  value: '2R',   note: 'Minimum before entry',     col: 'var(--green)' },
  ],
  profit: [
    { n:1, action: 'Scale out 50%',           when: 'At first sign of consolidation or next session boundary' },
    { n:2, action: 'Move stop to break-even', when: 'Once the partial is taken' },
    { n:3, action: 'Let remainder run',       when: 'To the primary liquidity target' },
  ],
  review: [
    'Did I follow the 50% rule, or did I FOMO?',
    'Was the HTF bias aligned with the trade direction?',
    'Did the session level act as intended?',
    'What was my emotional state before entry?',
  ],
}

const CHECKLIST = [
  {
    phase: 'Pre-Trade Bias',
    color: 'var(--blue)',
    bg:    'var(--blue-bg)',
    items: [
      'HTF bias confirmed (Weekly / Daily / 4H)',
      'Session liquidity identified',
      'Premium / Discount zone mapped',
      'Correlation asset checked (SMT)',
    ],
  },
  {
    phase: 'Entry Execution',
    color: 'var(--purple)',
    bg:    'var(--purple-bg)',
    items: [
      'Price swept session high/low OR displaced through it',
      '15m FVG printed post-displacement',
      'Price retraced to 50% equilibrium',
      '1m / 5m Engulfing or IFVG confirmed',
      'Immediate clean reaction from level',
    ],
  },
  {
    phase: 'Risk Management',
    color: 'var(--amber)',
    bg:    'var(--amber-bg)',
    items: [
      'Stop placed beyond sweep point or retest structure',
      'Risk % set (1% / 1.5% / 2.5%)',
      '2R target identified before entry',
      'No FOMO — level or nothing',
    ],
  },
  {
    phase: 'Post-Trade Review',
    color: 'var(--green)',
    bg:    'var(--green-bg)',
    items: [
      '50% rule followed (no early entry)?',
      'HTF bias aligned with direction?',
      'Session level acted as intended?',
      'Emotional state logged?',
    ],
  },
]

const ALL = CHECKLIST.flatMap((s, si) => s.items.map((item, ii) => ({ text: item, si, ii, color: s.color })))

function Divider() {
  return <div style={{ height:'1px', background:'var(--border)', margin:'0' }} />
}

function SectionHeader({ label }) {
  return (
    <div style={{ padding:'8px 0', marginBottom:'16px', marginTop:'4px' }}>
      <div style={{ fontSize:'9px', fontWeight:'600', color:'var(--muted)', letterSpacing:'.1em', textTransform:'uppercase' }}>{label}</div>
    </div>
  )
}

export default function Playbook() {
  const [tab, setTab]       = useState('checklist')
  const [checked, setChecked] = useState(() => ALL.map(() => false))

  const toggle = i => setChecked(p => p.map((v, idx) => idx === i ? !v : v))
  const reset  = () => setChecked(ALL.map(() => false))

  const done  = checked.filter(Boolean).length
  const total = ALL.length
  const pct   = Math.round(done / total * 100)
  const ready = done === total

  let flatIdx = 0

  const TABS = [
    { id: 'checklist', label: 'Checklist' },
    { id: 'plan',      label: 'Trade Plan' },
    { id: 'risk',      label: 'Risk Rules' },
  ]

  return (
    <div className="page active">

      {/* Page title */}
      <div style={{ marginBottom:'24px' }}>
        <h1 style={{ fontSize:'18px', fontWeight:'600', color:'var(--text)', letterSpacing:'-.02em', marginBottom:'4px' }}>Trading Execution Blueprint</h1>
        <p style={{ fontSize:'12px', color:'var(--muted)', lineHeight:'1.6', maxWidth:'480px' }}>
          ICT / SMC framework for identifying, executing and reviewing trades. Complete the checklist before every trade.
        </p>
      </div>

      {/* Tab selector */}
      <div style={{ display:'flex', gap:'0', marginBottom:'24px', background:'var(--surface2)', padding:'2px', borderRadius:'var(--r-xs)', border:'1px solid var(--border)', width:'fit-content' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding:'6px 14px', borderRadius:'5px', fontSize:'12px', fontWeight: tab===t.id ? '600' : '400', color: tab===t.id ? 'var(--text)' : 'var(--muted)', background: tab===t.id ? 'var(--surface)' : 'transparent', border:'none', cursor:'pointer', fontFamily:'inherit', transition:'all .12s', boxShadow: tab===t.id ? 'var(--shadow-xs)' : 'none' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── CHECKLIST ── */}
      {tab === 'checklist' && (
        <div style={{ maxWidth:'580px' }}>
          {/* Progress */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'16px 18px', marginBottom:'16px', boxShadow:'var(--shadow)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
              <div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'20px', fontWeight:'600', color: ready ? 'var(--green)' : 'var(--text)', letterSpacing:'-.02em' }}>
                  {done}<span style={{ color:'var(--muted)', fontSize:'14px', fontWeight:'400' }}> / {total}</span>
                </div>
                <div style={{ fontSize:'10px', color:'var(--muted)', marginTop:'2px' }}>
                  {ready ? '✓ All checks complete — ready to trade' : `${total - done} remaining`}
                </div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={reset}>Reset</button>
            </div>
            <div style={{ height:'3px', background:'var(--surface3)', borderRadius:'2px', overflow:'hidden' }}>
              <div style={{ width: pct+'%', height:'100%', background: ready ? 'var(--green)' : 'var(--blue)', transition:'width .25s var(--ease)', borderRadius:'2px' }} />
            </div>
          </div>

          {/* Checklist sections */}
          {CHECKLIST.map((section, si) => (
            <div key={si} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', marginBottom:'10px', overflow:'hidden', boxShadow:'var(--shadow)' }}>
              <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', background: section.bg }}>
                <span style={{ fontSize:'11px', fontWeight:'600', color: section.color, letterSpacing:'-.01em' }}>{section.phase}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color: section.color }}>
                  {section.items.filter((_, ii) => {
                    const idx = ALL.findIndex(a => a.si === si && a.ii === ii)
                    return idx >= 0 && checked[idx]
                  }).length}/{section.items.length}
                </span>
              </div>
              {section.items.map((text) => {
                const i = flatIdx++
                const done = checked[i]
                return (
                  <label key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px', borderBottom:'1px solid var(--border)', cursor:'pointer', background: done ? 'var(--surface2)' : 'var(--surface)', transition:'background .1s' }}
                    onMouseEnter={e => { if (!done) e.currentTarget.style.background='var(--surface2)' }}
                    onMouseLeave={e => { if (!done) e.currentTarget.style.background='var(--surface)' }}>
                    <div onClick={() => toggle(i)}
                      style={{ width:'16px', height:'16px', borderRadius:'4px', flexShrink:0, border: done ? 'none' : '1.5px solid var(--border2)', background: done ? section.color : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s' }}>
                      {done && <span style={{ color:'#fff', fontSize:'10px', fontWeight:'700', lineHeight:1 }}>✓</span>}
                    </div>
                    <span style={{ fontSize:'12px', fontWeight: done ? '400' : '400', color: done ? 'var(--muted)' : 'var(--text2)', textDecoration: done ? 'line-through' : 'none', lineHeight:'1.5', transition:'all .15s' }}>
                      {text}
                    </span>
                  </label>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* ── TRADE PLAN ── */}
      {tab === 'plan' && (
        <div style={{ maxWidth:'680px', display:'flex', flexDirection:'column', gap:'12px' }}>

          {/* Philosophy */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
            <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border)', background:'var(--blue-bg)' }}>
              <span style={{ fontSize:'11px', fontWeight:'600', color:'var(--blue)' }}>Core Philosophy</span>
            </div>
            <div style={{ padding:'16px 18px' }}>
              <p style={{ fontSize:'13px', color:'var(--text2)', lineHeight:'1.8', fontStyle:'italic' }}>"{PLAN.philosophy}"</p>
            </div>
          </div>

          {/* Sessions */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
            <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontSize:'11px', fontWeight:'600', color:'var(--text)' }}>Session Windows</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:'0' }}>
              {PLAN.sessions.map((s, i) => (
                <div key={i} style={{ padding:'14px 18px', borderRight: i < PLAN.sessions.length-1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:s.color, marginBottom:'8px' }} />
                  <div style={{ fontSize:'11px', fontWeight:'600', color:'var(--text)', marginBottom:'2px' }}>{s.name}</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:'var(--muted)' }}>{s.time}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Setup types */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
            <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontSize:'11px', fontWeight:'600', color:'var(--text)' }}>Setup Logic</span>
            </div>
            {PLAN.setups.map((s, i) => (
              <div key={i} style={{ padding:'14px 18px', borderBottom: i < PLAN.setups.length-1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>
                  <span style={{ fontSize:'10px', fontWeight:'700', color: i===0 ? 'var(--blue)' : 'var(--purple)', background: i===0 ? 'var(--blue-bg)' : 'var(--purple-bg)', padding:'2px 8px', borderRadius:'4px', whiteSpace:'nowrap', marginTop:'1px', flexShrink:0 }}>{s.type}</span>
                  <div>
                    <div style={{ fontSize:'12px', color:'var(--text2)', marginBottom:'3px', lineHeight:'1.5' }}><strong style={{ color:'var(--text)', fontWeight:'500' }}>Trigger:</strong> {s.trigger}</div>
                    <div style={{ fontSize:'12px', color:'var(--text2)', lineHeight:'1.5' }}><strong style={{ color:'var(--text)', fontWeight:'500' }}>Target:</strong> {s.target}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 4-step workflow */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
            <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border)', background:'var(--purple-bg)' }}>
              <span style={{ fontSize:'11px', fontWeight:'600', color:'var(--purple)' }}>Execution Workflow — 15m / 5m / 1m</span>
            </div>
            {PLAN.workflow.map((step, i) => (
              <div key={i} style={{ display:'flex', gap:'14px', padding:'14px 18px', alignItems:'flex-start', borderBottom: i < PLAN.workflow.length-1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', fontWeight:'600', color:'var(--muted)', minWidth:'22px', marginTop:'1px' }}>{step.n}</div>
                <div>
                  <div style={{ fontSize:'12px', fontWeight:'600', color:'var(--text)', marginBottom:'2px' }}>{step.title}</div>
                  <div style={{ fontSize:'12px', color:'var(--text2)', lineHeight:'1.6' }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── RISK RULES ── */}
      {tab === 'risk' && (
        <div style={{ maxWidth:'580px', display:'flex', flexDirection:'column', gap:'12px' }}>

          {/* Risk levels */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
            <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border)', background:'var(--amber-bg)' }}>
              <span style={{ fontSize:'11px', fontWeight:'600', color:'var(--amber)' }}>Position Sizing</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)' }}>
              {PLAN.risk.map((r, i) => (
                <div key={i} style={{ padding:'16px 18px', borderRight: i<3 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontSize:'9px', fontWeight:'600', color:'var(--muted)', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:'6px' }}>{r.label}</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'20px', fontWeight:'600', color:r.col, marginBottom:'3px' }}>{r.value}</div>
                  <div style={{ fontSize:'10px', color:'var(--muted2)' }}>{r.note}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Stop loss */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
            <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontSize:'11px', fontWeight:'600', color:'var(--text)' }}>Stop Loss Placement</span>
            </div>
            <div style={{ padding:'16px 18px' }}>
              <p style={{ fontSize:'12px', color:'var(--text2)', lineHeight:'1.7', marginBottom:'12px' }}>
                Place stop <strong style={{ color:'var(--text)' }}>beyond the sweep point</strong> or the retest structure.
              </p>
              <div style={{ padding:'12px 14px', background:'var(--red-bg)', border:'1px solid var(--red-dim)', borderRadius:'var(--r-xs)' }}>
                <div style={{ fontSize:'10px', fontWeight:'700', color:'var(--red)', marginBottom:'3px', letterSpacing:'.04em', textTransform:'uppercase' }}>Invalidation</div>
                <div style={{ fontSize:'12px', color:'var(--text2)', lineHeight:'1.6' }}>If price slices the 50% level without an Engulfing or IFVG reaction — the trade is dead. Do not chase.</div>
              </div>
            </div>
          </div>

          {/* Profit taking */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
            <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border)', background:'var(--green-bg)' }}>
              <span style={{ fontSize:'11px', fontWeight:'600', color:'var(--green)' }}>Profit Taking</span>
            </div>
            {PLAN.profit.map((s, i) => (
              <div key={i} style={{ display:'flex', gap:'14px', padding:'13px 18px', alignItems:'flex-start', borderBottom: i<2 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width:'20px', height:'20px', borderRadius:'5px', background:'var(--green-bg)', border:'1px solid var(--green-dim)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', fontWeight:'700', color:'var(--green)' }}>{s.n}</div>
                <div>
                  <div style={{ fontSize:'12px', fontWeight:'600', color:'var(--text)', marginBottom:'1px' }}>{s.action}</div>
                  <div style={{ fontSize:'12px', color:'var(--muted)', lineHeight:'1.5' }}>{s.when}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Review questions */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
            <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontSize:'11px', fontWeight:'600', color:'var(--text)' }}>Post-Trade Review</span>
            </div>
            {PLAN.review.map((q, i) => (
              <div key={i} style={{ display:'flex', gap:'12px', alignItems:'center', padding:'11px 18px', borderBottom: i<PLAN.review.length-1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width:'4px', height:'4px', borderRadius:'50%', background:'var(--border2)', flexShrink:0 }} />
                <span style={{ fontSize:'12px', color:'var(--text2)', lineHeight:'1.5' }}>{q}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
