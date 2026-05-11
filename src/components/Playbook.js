const SECTIONS = [
  {
    title: 'Pre-Trade Checklist',
    accent: 'var(--blue)',
    rules: [
      ['🔭', 'HTF Bias', 'Weekly → Daily → 4H aligned. Know if you are in Premium or Discount before opening a chart.'],
      ['💧', 'Session Liquidity', 'Identify session high/low targets before the open. Where is the liquidity resting?'],
      ['📐', 'Premium / Discount', 'Map the FVG or OB range. Only enter from discount for longs, premium for shorts.'],
      ['🔗', 'SMT Divergence', 'Check your correlation asset (DXY vs Indices, EUR vs GBP). Divergence = higher conviction.'],
      ['📰', 'Kill Zones', 'Avoid entries 15 min either side of high-impact news. Trade London/NY kill zones only.'],
    ]
  },
  {
    title: 'Entry Rules',
    accent: 'var(--green)',
    rules: [
      ['⚡', 'Displacement Required', 'Price must displace impulsively through a level — creeping through does not count.'],
      ['📦', 'FVG Must Print', 'A Fair Value Gap must form on the 15m after displacement. No FVG = no trade.'],
      ['⚖️', '50% Rule', 'Wait for price to retrace to 50% equilibrium of the displacement range. Never chase.'],
      ['🕐', '1m / 5m Confirmation', 'Wait for a 1m engulfing candle or IFVG fill at the 50% level before entry.'],
      ['✅', 'Clean Reaction', 'Price must react immediately and decisively from your level. Sloppy = no trade.'],
    ]
  },
  {
    title: 'Risk Management',
    accent: 'var(--amber)',
    rules: [
      ['💰', 'Max Risk Per Trade', '1% standard. 1.5% on A+ setups only. Never exceed 2% on any single trade.'],
      ['🛑', 'Stop Placement', 'Beyond the sweep point or FVG origin candle. Never arbitrary, never tight.'],
      ['🎯', '2R Minimum Target', 'Do not enter unless 2R is clearly visible and realistic before entry.'],
      ['📉', 'Daily Loss Limit', 'Stop trading after -3% in a single day. Close the platform and return tomorrow.'],
      ['📅', 'Weekly Loss Limit', 'Stop trading after -5% in a week. Review every trade, identify the pattern.'],
    ]
  },
  {
    title: 'Post-Trade Review',
    accent: 'var(--purple)',
    rules: [
      ['🏆', 'Grade Every Trade', 'A+ = textbook execution. A = good. B = acceptable but flawed. C = shouldn\'t have taken it.'],
      ['📝', 'Log Mistakes Honestly', 'One mistake per trade. Accuracy requires honesty — patterns only emerge over 50+ trades.'],
      ['📸', 'Screenshot Required', 'Entry + exit screenshot on every single trade. Non-negotiable. No exceptions.'],
      ['📓', 'Journal Entry', 'Minimum one sentence: WHY you took the trade and WHAT happened to price after entry.'],
      ['🔄', 'Weekly Review', 'Every Sunday: review all trades, find your top repeated mistake, set one improvement goal.'],
    ]
  }
]

export default function Playbook() {
  return (
    <div className="page active" style={{ maxWidth: '700px' }}>
      {SECTIONS.map(sec => (
        <div key={sec.title} style={{ marginBottom: '24px' }}>
          <div className="sh" style={{ marginTop: '0' }}><h2>{sec.title}</h2></div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
            {sec.rules.map(([icon, name, detail], i) => (
              <div key={name} style={{ display: 'flex', gap: '14px', padding: '14px 18px', borderBottom: i < sec.rules.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'flex-start' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0, background: sec.accent + '18' }}>{icon}</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text)', marginBottom: '3px' }}>{name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: '1.6' }}>{detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ background: 'var(--blue-bg)', border: '1px solid var(--blue-dim)', borderRadius: 'var(--r)', padding: '18px', marginTop: '8px' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--blue)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: '8px' }}>Core Philosophy</div>
        <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: '1.8' }}>
          Respect session liquidity. Trade displacement (continuation) or sweeps (reversal). Never guess — wait for the 50% equilibrium retracement. If price slices through the 50% level without a confirmed reaction, the trade idea is dead. <strong>Level or nothing.</strong>
        </div>
      </div>
    </div>
  )
}
