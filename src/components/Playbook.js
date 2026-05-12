import { useState } from 'react'

const PLAN = {
  philosophy: 'Mark out the Previous Day High and Low. On the 30m chart, wait for a clean break and retest of the daily level. Price must clearly close beyond the level, retrace to it, and confirm with a 30m or 1H engulfing candle. Target is 1.5R. If there is no clean engulfing on the retest — do not enter.',
  levels: [
    { name: 'PDH', full: 'Previous Day High', note: 'Mark before session open. Key resistance/breakout level.' },
    { name: 'PDL', full: 'Previous Day Low',  note: 'Mark before session open. Key support/breakdown level.' },
  ],
  setups: [
    {
      type: 'PDH Break & Retest',
      direction: 'Long',
      color: 'var(--green)',
      bg: 'var(--green-bg)',
      steps: [
        'Price clearly closes above PDH on 30m chart',
        'Price retests PDH from above (acts as support)',
        '30m or 1H bullish engulfing candle confirms on retest',
        'Enter on close of engulfing candle',
        'Stop below the low of the engulfing candle',
        'Target 1.5R',
      ]
    },
    {
      type: 'PDL Break & Retest',
      direction: 'Short',
      color: 'var(--red)',
      bg: 'var(--red-bg)',
      steps: [
        'Price clearly closes below PDL on 30m chart',
        'Price retests PDL from below (acts as resistance)',
        '30m or 1H bearish engulfing candle confirms on retest',
        'Enter on close of engulfing candle',
        'Stop above the high of the engulfing candle',
        'Target 1.5R',
      ]
    },
  ],
  invalidation: 'If price fails to produce a clear engulfing candle on the retest — stand aside. If price wicks through the level but closes back through it — the break is invalid. No engulfing = no trade.',
  risk: [
    { label: 'Standard',   value: '1.0%',  note: 'Default every trade',   col: 'var(--text)'  },
    { label: 'A+ Setup',   value: '1.5%',  note: 'High conviction only',  col: 'var(--amber)' },
    { label: 'Maximum',    value: '2.5%',  note: 'Never exceed this',     col: 'var(--red)'   },
    { label: 'Target',     value: '1.5R',  note: 'Default take profit',   col: 'var(--green)' },
  ],
  sessions: [
    { name: 'London Open',  time: '07:00 – 10:00 GMT', note: 'Best for GBP/EUR pairs and indices',  color: 'var(--blue)'   },
    { name: 'AM Session',   time: '13:00 – 17:00 GMT', note: 'Best for US indices and USD pairs',   color: 'var(--green)'  },
    { name: 'PM Session',   time: '17:00 – 20:00 GMT', note: 'Continuation moves, lower priority', color: 'var(--amber)'  },
    { name: 'Asia',         time: '23:00 – 07:00 GMT', note: 'Range setting, avoid trading',        color: 'var(--purple)' },
  ],
  mistakes: [
    'Entering without a clear engulfing candle',
    'Trading a wick break — requires a close beyond PDH/PDL',
    'FOMO entry after missing the retest',
    'Wrong bias — ensure break direction matches higher timeframe',
    'Moving stop to break-even too early',
    'Not waiting for candle close before entering',
  ],
  review: [
    'Did price clearly close beyond the PDH/PDL?',
    'Was the retest clean — price touching the level, not spiking through?',
    'Was the engulfing candle clear and decisive?',
    'Did I enter on the close or did I anticipate?',
    'Was my stop correctly placed below/above the engulfing candle?',
  ],
}

const CHECKLIST = [
  {
    phase: 'Pre-Session Prep',
    color: 'var(--blue)',
    bg:    'var(--blue-bg)',
    items: [
      'Mark PDH and PDL on the chart before session open',
      'Note which direction the higher timeframe favours',
      'Identify any confluence at PDH/PDL (e.g. weekly level, round number)',
      'Set alerts at PDH and PDL levels',
    ],
  },
  {
    phase: 'The Break',
    color: 'var(--purple)',
    bg:    'var(--purple-bg)',
    items: [
      '30m candle has CLOSED clearly above PDH (not just wicked)',
      '30m candle has CLOSED clearly below PDL (not just wicked)',
      'Break candle is decisive — not a small bodied doji',
    ],
  },
  {
    phase: 'The Retest',
    color: 'var(--amber)',
    bg:    'var(--amber-bg)',
    items: [
      'Price has pulled back to the PDH/PDL level',
      'Level is holding — price is not slicing straight through',
      '30m or 1H engulfing candle has printed at the level',
      'Engulfing candle has closed — not entered early on anticipation',
    ],
  },
  {
    phase: 'Entry & Management',
    color: 'var(--green)',
    bg:    'var(--green-bg)',
    items: [
      'Stop placed below the low of the engulfing (Long) or above the high (Short)',
      'Target set at 1.5R',
      'Risk % calculated and position sized correctly',
      'No news events within 15 minutes of entry',
    ],
  },
]

const ALL = CHECKLIST.flatMap((s, si) => s.items.map((item, ii) => ({ text: item, si, ii, color: s.color })))

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
      <div style={{ marginBottom:'24px' }}>
        <h1 style={{ fontSize:'18px', fontWeight:'600', color:'var(--text)', letterSpacing:'-.02em', marginBottom:'4px' }}>
          PDH / PDL Break & Retest
        </h1>
        <p style={{ fontSize:'12px', color:'var(--muted)', lineHeight:'1.6', maxWidth:'480px' }}>
          Mark the Previous Day High and Low. Wait for a clean break and retest confirmed by a 30m or 1H engulfing candle. Target 1.5R.
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

      {/* CHECKLIST */}
      {tab === 'checklist' && (
        <div style={{ maxWidth:'580px' }}>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'16px 18px', marginBottom:'16px', boxShadow:'var(--shadow)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
              <div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'20px', fontWeight:'600', color: ready ? 'var(--green)' : 'var(--text)' }}>
                  {done}<span style={{ color:'var(--muted)', fontSize:'14px', fontWeight:'400' }}> / {total}</span>
                </div>
                <div style={{ fontSize:'10px', color:'var(--muted)', marginTop:'2px' }}>
                  {ready ? '✓ All checks complete — ready to enter' : `${total - done} checks remaining`}
                </div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={reset}>Reset</button>
            </div>
            <div style={{ height:'3px', background:'var(--surface3)', borderRadius:'2px', overflow:'hidden' }}>
              <div style={{ width: pct+'%', height:'100%', background: ready ? 'var(--green)' : 'var(--blue)', transition:'width .25s var(--ease)', borderRadius:'2px' }} />
            </div>
          </div>

          {CHECKLIST.map((section, si) => (
            <div key={si} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', marginBottom:'10px', overflow:'hidden', boxShadow:'var(--shadow)' }}>
              <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', background: section.bg }}>
                <span style={{ fontSize:'11px', fontWeight:'600', color: section.color }}>{section.phase}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color: section.color }}>
                  {section.items.filter((_, ii) => {
                    const idx = ALL.findIndex(a => a.si === si && a.ii === ii)
                    return idx >= 0 && checked[idx]
                  }).length}/{section.items.length}
                </span>
              </div>
              {section.items.map((text) => {
                const i = flatIdx++
                const isDone = checked[i]
                return (
                  <label key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px', borderBottom:'1px solid var(--border)', cursor:'pointer', background: isDone ? 'var(--surface2)' : 'var(--surface)', transition:'background .1s' }}
                    onMouseEnter={e => { if (!isDone) e.currentTarget.style.background='var(--surface2)' }}
                    onMouseLeave={e => { if (!isDone) e.currentTarget.style.background='var(--surface)' }}>
                    <div onClick={() => toggle(i)}
                      style={{ width:'16px', height:'16px', borderRadius:'4px', flexShrink:0, border: isDone ? 'none' : '1.5px solid var(--border2)', background: isDone ? section.color : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s' }}>
                      {isDone && <span style={{ color:'#fff', fontSize:'10px', fontWeight:'700', lineHeight:1 }}>✓</span>}
                    </div>
                    <span style={{ fontSize:'12px', color: isDone ? 'var(--muted)' : 'var(--text2)', textDecoration: isDone ? 'line-through' : 'none', lineHeight:'1.5', transition:'all .15s' }}>
                      {text}
                    </span>
                  </label>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* TRADE PLAN */}
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

          {/* Key levels */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
            <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontSize:'11px', fontWeight:'600', color:'var(--text)' }}>Key Levels to Mark</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }}>
              {PLAN.levels.map((l, i) => (
                <div key={i} style={{ padding:'16px 18px', borderRight: i===0 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'18px', fontWeight:'700', color: i===0 ? 'var(--green)' : 'var(--red)', marginBottom:'4px' }}>{l.name}</div>
                  <div style={{ fontSize:'11px', fontWeight:'600', color:'var(--text)', marginBottom:'3px' }}>{l.full}</div>
                  <div style={{ fontSize:'11px', color:'var(--muted)', lineHeight:'1.5' }}>{l.note}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Two setups side by side */}
          {PLAN.setups.map((setup, si) => (
            <div key={si} style={{ background:'var(--surface)', border:`1px solid var(--border)`, borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
              <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border)', background: setup.bg, display:'flex', alignItems:'center', gap:'10px' }}>
                <span style={{ fontSize:'11px', fontWeight:'700', color: setup.color }}>{setup.type}</span>
                <span style={{ padding:'2px 8px', borderRadius:'4px', fontSize:'10px', fontWeight:'600', background: setup.color, color:'#fff' }}>{setup.direction}</span>
              </div>
              {setup.steps.map((step, i) => (
                <div key={i} style={{ display:'flex', gap:'14px', padding:'11px 18px', alignItems:'flex-start', borderBottom: i < setup.steps.length-1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', fontWeight:'600', color:'var(--muted)', minWidth:'18px', marginTop:'1px' }}>{String(i+1).padStart(2,'0')}</div>
                  <div style={{ fontSize:'12px', color:'var(--text2)', lineHeight:'1.6' }}>{step}</div>
                </div>
              ))}
            </div>
          ))}

          {/* Invalidation */}
          <div style={{ padding:'14px 18px', background:'var(--red-bg)', border:'1px solid var(--red-dim)', borderRadius:'var(--r)' }}>
            <div style={{ fontSize:'10px', fontWeight:'700', color:'var(--red)', marginBottom:'5px', letterSpacing:'.06em', textTransform:'uppercase' }}>Invalidation Rules</div>
            <p style={{ fontSize:'12px', color:'var(--text2)', lineHeight:'1.7' }}>{PLAN.invalidation}</p>
          </div>

          {/* Sessions */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
            <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontSize:'11px', fontWeight:'600', color:'var(--text)' }}>Session Windows</span>
            </div>
            {PLAN.sessions.map((s, i) => (
              <div key={i} style={{ display:'flex', gap:'14px', alignItems:'center', padding:'11px 18px', borderBottom: i < PLAN.sessions.length-1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:s.color, flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'12px', fontWeight:'600', color:'var(--text)' }}>{s.name}</div>
                  <div style={{ fontSize:'11px', color:'var(--muted)', marginTop:'1px' }}>{s.note}</div>
                </div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'var(--muted)', whiteSpace:'nowrap' }}>{s.time}</div>
              </div>
            ))}
          </div>

          {/* Common mistakes */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
            <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border)', background:'var(--amber-bg)' }}>
              <span style={{ fontSize:'11px', fontWeight:'600', color:'var(--amber)' }}>Common Mistakes to Avoid</span>
            </div>
            {PLAN.mistakes.map((m, i) => (
              <div key={i} style={{ display:'flex', gap:'12px', alignItems:'center', padding:'10px 18px', borderBottom: i < PLAN.mistakes.length-1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width:'4px', height:'4px', borderRadius:'50%', background:'var(--amber)', flexShrink:0 }} />
                <span style={{ fontSize:'12px', color:'var(--text2)', lineHeight:'1.5' }}>{m}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RISK RULES */}
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

          {/* Entry rules */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
            <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontSize:'11px', fontWeight:'600', color:'var(--text)' }}>Entry & Stop Rules</span>
            </div>
            {[
              { label:'Entry',       value:'Close of 30m or 1H engulfing candle' },
              { label:'Stop — Long', value:'Below the low of the engulfing candle' },
              { label:'Stop — Short',value:'Above the high of the engulfing candle' },
              { label:'Target',      value:'1.5R from entry' },
              { label:'Timeframe',   value:'30m chart primary, 1H for entry confirmation' },
            ].map((r, i, arr) => (
              <div key={i} style={{ display:'flex', gap:'14px', padding:'12px 18px', alignItems:'center', borderBottom: i < arr.length-1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontSize:'10px', fontWeight:'600', color:'var(--muted)', width:'80px', flexShrink:0, textTransform:'uppercase', letterSpacing:'.05em' }}>{r.label}</div>
                <div style={{ fontSize:'12px', color:'var(--text2)' }}>{r.value}</div>
              </div>
            ))}
          </div>

          {/* Post-trade review */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
            <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border)', background:'var(--green-bg)' }}>
              <span style={{ fontSize:'11px', fontWeight:'600', color:'var(--green)' }}>Post-Trade Review</span>
            </div>
            {PLAN.review.map((q, i) => (
              <div key={i} style={{ display:'flex', gap:'12px', alignItems:'center', padding:'10px 18px', borderBottom: i < PLAN.review.length-1 ? '1px solid var(--border)' : 'none' }}>
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
