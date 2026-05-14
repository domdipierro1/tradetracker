import { useState } from 'react'

const CHECKLIST = [
  {
    phase: '1. Bias',
    color: 'var(--blue)',
    bg:    'var(--blue-bg)',
    items: [
      'Weekly chart reviewed — direction of current weekly candle determined',
      'Daily chart reviewed — next daily candle direction determined using previous candles',
      'Bias is clearly Bullish or Bearish — not uncertain',
    ],
  },
  {
    phase: '2. Key Level',
    color: 'var(--purple)',
    bg:    'var(--purple-bg)',
    items: [
      'Key level identified on the chart (Monthly/Weekly/Daily H&L or 4H PD array)',
      'Key level is aligned with the directional bias',
      'Price has not yet reached the level — still approaching',
    ],
  },
  {
    phase: '3. Killzone',
    color: 'var(--amber)',
    bg:    'var(--amber-bg)',
    items: [
      'Current time is within 02:00–10:00 NY (London or New York AM)',
      'Price action is trading into the key level during the killzone',
    ],
  },
  {
    phase: '4. Reversal Signature',
    color: 'var(--red)',
    bg:    'var(--red-bg)',
    items: [
      '30m or 15m breaker block has formed at the key level',
      'Price has closed below the breaker (Short) or above the breaker (Long)',
      'The breaker is clear and decisive — not ambiguous',
    ],
  },
  {
    phase: '5. Entry',
    color: 'var(--green)',
    bg:    'var(--green-bg)',
    items: [
      'Entry timeframe selected — 15m preferred, 30m or 5m if clearer',
      'Entry candle is clear — not entering mid-candle',
      'Stop placed correctly — above/below the breaker block',
      'Target at 2R calculated before entry',
      'Risk confirmed at 1%',
    ],
  },
]

const ALL = CHECKLIST.flatMap((s, si) => s.items.map((item, ii) => ({ text: item, si, ii, color: s.color })))

const LEVELS = [
  { name: 'Monthly',  items: ['Prev Month High', 'Prev Month Low'] },
  { name: 'Weekly',   items: ['Prev Week High', 'Prev Week Low'] },
  { name: 'Daily',    items: ['Prev Day High', 'Prev Day Low'] },
  { name: '4H PD Arrays', items: ['4H Fair Value Gap', '4H Order Block', '4H Breaker Block', '4H Mitigation Block'] },
  { name: 'Daily PD Arrays', items: ['Daily Fair Value Gap', 'Daily Order Block', 'Daily Breaker Block', 'Daily Mitigation Block'] },
]

const SESSIONS = [
  { name: 'London',       time: '02:00 – 05:00 NY',  note: 'GBP, EUR pairs. European open volatility.',  color: 'var(--blue)'   },
  { name: 'New York AM',  time: '06:00 – 10:00 NY',  note: 'USD pairs, indices, Gold. Highest volume.',  color: 'var(--green)'  },
]

const MISTAKES = [
  'Wrong bias — weekly/daily read was incorrect',
  'Level not aligned with bias',
  'Entered outside killzone (before 02:00 or after 10:00 NY)',
  'No breaker block formed — anticipated rather than waited',
  'Entered before breaker closed',
  'Breaker was unclear or too small to be valid',
  'Moved stop to break-even too early',
  'Took profit too early before 2R',
  'Revenge trade after a loss',
  'Overtraded — multiple setups same session',
]

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
          Market, Maker & Models
        </h1>
        <p style={{ fontSize:'12px', color:'var(--muted)', lineHeight:'1.6', maxWidth:'520px' }}>
          Bias from weekly and daily. Key level aligned with bias. Killzone entry. Breaker block reversal signature. 1% risk to 2R target.
        </p>
      </div>

      {/* Tabs */}
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
        <div style={{ maxWidth:'600px' }}>
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'16px 18px', marginBottom:'16px', boxShadow:'var(--shadow)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
              <div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'20px', fontWeight:'600', color: ready ? 'var(--green)' : 'var(--text)' }}>
                  {done}<span style={{ color:'var(--muted)', fontSize:'14px', fontWeight:'400' }}> / {total}</span>
                </div>
                <div style={{ fontSize:'10px', color:'var(--muted)', marginTop:'2px' }}>
                  {ready ? '✓ All checks complete — ready to enter' : `${total - done} remaining`}
                </div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={reset}>Reset</button>
            </div>
            <div style={{ height:'3px', background:'var(--surface3)', borderRadius:'2px', overflow:'hidden' }}>
              <div style={{ width: pct+'%', height:'100%', background: ready ? 'var(--green)' : 'var(--blue)', transition:'width .25s', borderRadius:'2px' }} />
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
        <div style={{ maxWidth:'700px', display:'flex', flexDirection:'column', gap:'12px' }}>

          {/* Framework */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
            <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border)', background:'var(--blue-bg)' }}>
              <span style={{ fontSize:'11px', fontWeight:'600', color:'var(--blue)' }}>Framework</span>
            </div>
            <div style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:'12px' }}>
              {[
                { label:'Methodology',  value:'Market, Maker & Models' },
                { label:'Bias TF',      value:'Weekly & Daily (discretionary)' },
                { label:'Context TF',   value:'Daily & 4H' },
                { label:'Entry TF',     value:'30m / 15m / 5m' },
                { label:'Sessions',     value:'02:00 – 10:00 NY (London + New York AM)' },
                { label:'Risk',         value:'1% per trade' },
                { label:'Target',       value:'2R (2%)' },
              ].map((r, i) => (
                <div key={i} style={{ display:'flex', gap:'16px', alignItems:'baseline', borderBottom: i < 6 ? '1px solid var(--border)' : 'none', paddingBottom: i < 6 ? '10px' : '0' }}>
                  <div style={{ fontSize:'10px', fontWeight:'600', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em', minWidth:'90px', flexShrink:0 }}>{r.label}</div>
                  <div style={{ fontSize:'13px', color:'var(--text2)' }}>{r.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Key levels */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
            <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontSize:'11px', fontWeight:'600', color:'var(--text)' }}>Key Levels</span>
            </div>
            <div style={{ padding:'16px 18px', display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'16px' }}>
              {LEVELS.map((group, i) => (
                <div key={i}>
                  <div style={{ fontSize:'10px', fontWeight:'600', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:'8px' }}>{group.name}</div>
                  {group.items.map((item, j) => (
                    <div key={j} style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'5px' }}>
                      <div style={{ width:'4px', height:'4px', borderRadius:'50%', background:'var(--border2)', flexShrink:0 }} />
                      <span style={{ fontSize:'12px', color:'var(--text2)' }}>{item}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* The model step by step */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
            <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border)', background:'var(--purple-bg)' }}>
              <span style={{ fontSize:'11px', fontWeight:'600', color:'var(--purple)' }}>The Model — Step by Step</span>
            </div>
            {[
              { n:'01', title:'Establish Bias',           desc:'Review the weekly chart to determine the direction of the current weekly candle. Then use the daily chart to determine the next daily candle direction using previous candles. Bias must be clearly Bullish or Bearish.' },
              { n:'02', title:'Identify Key Level',        desc:'Mark Monthly, Weekly, Daily highs/lows or 4H PD arrays (FVG, OB, Breaker, Mitigation Block) that align with your bias. Price should still be approaching the level.' },
              { n:'03', title:'Wait for Killzone',         desc:'Do not look for entries outside 02:00–10:00 NY time. Price must trade into your key level during London or New York AM session.' },
              { n:'04', title:'Reversal Signature',        desc:'On the 30m or 15m, wait for a breaker block to form at the key level. This is the confirmation that the level is being respected. Wait for price to close beyond the breaker — do not anticipate.' },
              { n:'05', title:'Entry',                     desc:'Enter on the 15m preferably. Use 30m or 5m only if the candle structure is clearer. Stop goes above/below the breaker block. Target 2R before entering.' },
            ].map((step, i, arr) => (
              <div key={i} style={{ display:'flex', gap:'14px', padding:'14px 18px', alignItems:'flex-start', borderBottom: i < arr.length-1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', fontWeight:'600', color:'var(--muted)', minWidth:'22px', marginTop:'1px' }}>{step.n}</div>
                <div>
                  <div style={{ fontSize:'12px', fontWeight:'600', color:'var(--text)', marginBottom:'3px' }}>{step.title}</div>
                  <div style={{ fontSize:'12px', color:'var(--text2)', lineHeight:'1.7' }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Sessions */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
            <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontSize:'11px', fontWeight:'600', color:'var(--text)' }}>Trading Window</span>
            </div>
            {SESSIONS.map((s, i) => (
              <div key={i} style={{ display:'flex', gap:'14px', alignItems:'center', padding:'12px 18px', borderBottom: i < SESSIONS.length-1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:s.color, flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'12px', fontWeight:'600', color:'var(--text)', marginBottom:'1px' }}>{s.name}</div>
                  <div style={{ fontSize:'11px', color:'var(--muted)' }}>{s.note}</div>
                </div>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:'var(--muted)', whiteSpace:'nowrap' }}>{s.time}</div>
              </div>
            ))}
          </div>

          {/* Premium / Discount */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
            <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontSize:'11px', fontWeight:'600', color:'var(--text)' }}>Premium & Discount</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }}>
              <div style={{ padding:'16px 18px', borderRight:'1px solid var(--border)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'8px' }}>
                  <span style={{ fontSize:'12px', color:'var(--red)' }}>▲</span>
                  <span style={{ fontSize:'11px', fontWeight:'600', color:'var(--red)' }}>Premium</span>
                </div>
                <div style={{ fontSize:'12px', color:'var(--text2)', lineHeight:'1.7' }}>
                  Price is in the upper half of the current range (above 50% equilibrium). Used for <strong style={{ color:'var(--text)', fontWeight:'600' }}>Short entries</strong>. Look for Sells from Premium PD arrays.
                </div>
              </div>
              <div style={{ padding:'16px 18px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'8px' }}>
                  <span style={{ fontSize:'12px', color:'var(--green)' }}>▼</span>
                  <span style={{ fontSize:'11px', fontWeight:'600', color:'var(--green)' }}>Discount</span>
                </div>
                <div style={{ fontSize:'12px', color:'var(--text2)', lineHeight:'1.7' }}>
                  Price is in the lower half of the current range (below 50% equilibrium). Used for <strong style={{ color:'var(--text)', fontWeight:'600' }}>Long entries</strong>. Look for Buys from Discount PD arrays.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RISK RULES */}
      {tab === 'risk' && (
        <div style={{ maxWidth:'580px', display:'flex', flexDirection:'column', gap:'12px' }}>

          {/* Risk */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
            <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border)', background:'var(--amber-bg)' }}>
              <span style={{ fontSize:'11px', fontWeight:'600', color:'var(--amber)' }}>Position Sizing</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)' }}>
              {[
                { label:'Risk Per Trade', value:'1%',  note:'Every trade — no exceptions',   col:'var(--text)'  },
                { label:'Target',         value:'2R',  note:'2% return on 1% risk',          col:'var(--green)' },
                { label:'Risk/Reward',    value:'1:2', note:'Minimum before taking a trade', col:'var(--blue)'  },
              ].map((r, i) => (
                <div key={i} style={{ padding:'16px 18px', borderRight: i<2 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontSize:'9px', fontWeight:'600', color:'var(--muted)', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:'6px' }}>{r.label}</div>
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'22px', fontWeight:'600', color:r.col, marginBottom:'3px' }}>{r.value}</div>
                  <div style={{ fontSize:'10px', color:'var(--muted2)' }}>{r.note}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Stop & entry */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
            <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border)' }}>
              <span style={{ fontSize:'11px', fontWeight:'600', color:'var(--text)' }}>Stop Loss & Entry Rules</span>
            </div>
            {[
              { label:'Stop — Long',  value:'Above the breaker block that formed at the key level' },
              { label:'Stop — Short', value:'Below the breaker block that formed at the key level' },
              { label:'Entry',        value:'On close of candle — 15m preferred, 30m or 5m if clearer' },
              { label:'Target',       value:'2R from entry price' },
              { label:'Partials',     value:'Optional at 1R — move stop to break-even, let remainder run to 2R' },
            ].map((r, i, arr) => (
              <div key={i} style={{ display:'flex', gap:'14px', padding:'12px 18px', alignItems:'flex-start', borderBottom: i<arr.length-1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontSize:'10px', fontWeight:'600', color:'var(--muted)', width:'90px', flexShrink:0, textTransform:'uppercase', letterSpacing:'.05em', paddingTop:'1px' }}>{r.label}</div>
                <div style={{ fontSize:'12px', color:'var(--text2)', lineHeight:'1.6' }}>{r.value}</div>
              </div>
            ))}
          </div>

          {/* Common mistakes */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
            <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border)', background:'var(--amber-bg)' }}>
              <span style={{ fontSize:'11px', fontWeight:'600', color:'var(--amber)' }}>Common Mistakes</span>
            </div>
            {MISTAKES.map((m, i) => (
              <div key={i} style={{ display:'flex', gap:'12px', alignItems:'center', padding:'10px 18px', borderBottom: i<MISTAKES.length-1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width:'4px', height:'4px', borderRadius:'50%', background:'var(--amber)', flexShrink:0 }} />
                <span style={{ fontSize:'12px', color:'var(--text2)', lineHeight:'1.5' }}>{m}</span>
              </div>
            ))}
          </div>

          {/* Post-trade */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--shadow)' }}>
            <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--border)', background:'var(--green-bg)' }}>
              <span style={{ fontSize:'11px', fontWeight:'600', color:'var(--green)' }}>Post-Trade Review Questions</span>
            </div>
            {[
              'Was my bias clearly established before I looked for a setup?',
              'Was the key level aligned with that bias?',
              'Did price trade into the level during 02:00–10:00 NY?',
              'Was there a clear breaker block on the 30m or 15m?',
              'Did I wait for the breaker to close before entering?',
              'Was my entry in Premium (Short) or Discount (Long)?',
            ].map((q, i, arr) => (
              <div key={i} style={{ display:'flex', gap:'12px', alignItems:'center', padding:'10px 18px', borderBottom: i<arr.length-1 ? '1px solid var(--border)' : 'none' }}>
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
