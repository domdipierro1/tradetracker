import { useState } from 'react'
import { computeStats, f2, f1 } from '../lib/stats'
import DailyJournal from './DailyJournal'


// Get Mon-Sun week containing a given date string
function getWeekRange(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  const dow = d.getDay() // 0=Sun
  const mon = new Date(d); mon.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
  const fmt = dt => dt.toISOString().split('T')[0]
  return { mon: fmt(mon), sun: fmt(sun) }
}

function getWeekR(trades, sundayDateStr) {
  const { mon, sun } = getWeekRange(sundayDateStr)
  return trades
    .filter(t => t.date >= mon && t.date <= sun)
    .reduce((s, t) => s + (t.pl || t.r_multiple || 0), 0)
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function Calendar({ trades, dailyNotes, onSaveNote, onDeleteNote, onAddTrade, onDeleteTrade, toast }) {
  const today      = new Date().toISOString().split('T')[0]
  const [month, setMonth] = useState(new Date().getMonth())
  const [selectedDate, setSelectedDate] = useState(null) // null = show grid, string = show journal
  const year = new Date().getFullYear()

  const moTrades = trades.filter(t => {
    const d = new Date(t.date)
    return d.getFullYear() === year && d.getMonth() === month
  })

  // Build day map
  const dayMap = {}
  moTrades.forEach(t => {
    const d = t.date
    if (!dayMap[d]) dayMap[d] = { trades:[], pl:0 }
    dayMap[d].trades.push(t)
    dayMap[d].pl += (t.pl||0)
  })

  const noteMap = {}
  ;(dailyNotes||[]).forEach(n => { noteMap[n.date] = n })

  const firstDow   = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month+1, 0).getDate()
  const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7

  function toDateStr(day) {
    return `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
  }

  function dayClass(day) {
    const dow = (firstDow + day - 1) % 7
    const ds  = toDateStr(day)
    const isToday = ds === today
    if (dow >= 5 && !isToday) return 'weekend'
    const d = dayMap[ds]
    const hasNote = !!noteMap[ds]
    if (!d?.trades.length) {
      if (isToday) return 'today-empty'
      if (hasNote) return 'note-only'
      return 'no-trade'
    }
    return d.pl > 0 ? 'win' : d.pl < 0 ? 'loss' : 'be'
  }

  const cellStyle = {
    win:          { bg:'var(--green-bg)', border:'var(--green-dim)' },
    loss:         { bg:'var(--red-bg)',   border:'var(--red-dim)'   },
    be:           { bg:'var(--amber-bg)', border:'var(--amber-dim)' },
    'no-trade':   { bg:'var(--surface)',  border:'var(--border)'    },
    'today-empty':{ bg:'var(--blue-bg)',  border:'var(--blue)'      },
    'note-only':  { bg:'var(--surface3)', border:'var(--border2)'   },
    weekend:      { bg:'var(--surface2)', border:'var(--border)'    },
  }
  const numCol = {
    win:'var(--green)', loss:'var(--red)', be:'var(--amber)',
    'no-trade':'var(--muted)', 'today-empty':'var(--blue)', weekend:'var(--muted2)'
  }

  // Month stats
  const ms = computeStats(moTrades)
  const mPL = moTrades.reduce((s,t) => s + (t.pl||t.r_multiple||0), 0)

  // If a date is selected, show the DailyJournal for that date
  if (selectedDate) {
    return (
      <div>
        {/* Back button */}
        <div style={{ padding:'12px 28px 0', display:'flex', alignItems:'center', gap:'10px', background:'var(--surface)', borderBottom:'1px solid var(--border)', marginBottom:'0' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelectedDate(null)}
            style={{ display:'flex', alignItems:'center', gap:'5px', color:'var(--muted)' }}>
            ← Calendar
          </button>
          <span style={{ fontSize:'12px', color:'var(--muted)' }}>
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long' })}
          </span>
        </div>
        <DailyJournal
          trades={trades}
          dailyNotes={dailyNotes}
          onSaveNote={onSaveNote}
          onDeleteNote={onDeleteNote}
          onAddTrade={onAddTrade}
          onDeleteTrade={onDeleteTrade}
          toast={toast}
          dateStr={selectedDate}
          isWeekly={new Date(selectedDate + 'T12:00:00').getDay() === 0}
        />
      </div>
    )
  }

  return (
    <div className="page active">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'16px', flexWrap:'wrap' }}>
        <div style={{ fontSize:'18px', fontWeight:'600', color:'var(--text)', flex:1, letterSpacing:'-.02em' }}>{MONTHS[month]} {year}</div>
        <button onClick={() => setMonth(m => Math.max(0,m-1))} style={{ width:'32px', height:'32px', borderRadius:'var(--r-xs)', border:'1px solid var(--border)', background:'var(--surface)', cursor:'pointer', fontSize:'16px', display:'flex', alignItems:'center', justifyContent:'center' }}>‹</button>
        <button onClick={() => setMonth(m => Math.min(11,m+1))} style={{ width:'32px', height:'32px', borderRadius:'var(--r-xs)', border:'1px solid var(--border)', background:'var(--surface)', cursor:'pointer', fontSize:'16px', display:'flex', alignItems:'center', justifyContent:'center' }}>›</button>
        <select value={month} onChange={e => setMonth(+e.target.value)} style={{ padding:'6px 10px', borderRadius:'var(--r-xs)', border:'1px solid var(--border)', background:'var(--surface)', fontSize:'12px', fontWeight:'500', color:'var(--text)', fontFamily:'inherit', outline:'none', cursor:'pointer' }}>
          {MONTHS.map((m,i) => <option key={i} value={i}>{m}</option>)}
        </select>
      </div>

      {/* Month KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))', gap:'8px', marginBottom:'16px' }}>
        {[
          { l:'Trades',   v:ms.n,                    c:'var(--text)' },
          { l:'Total R',  v: f2(mPL), c: mPL>=0?'var(--green)':'var(--red)' },
          { l:'Win Rate', v:`${(ms.winRate*100).toFixed(0)}%`, c: ms.winRate>=.5?'var(--green)':'var(--red)' },
          { l:'Wins',     v:ms.wins,                 c:'var(--green)' },
          { l:'Losses',   v:ms.losses,               c: ms.losses>0?'var(--red)':'var(--text)' },
          
        ].map((k,i) => (
          <div key={i} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', padding:'10px 13px', boxShadow:'var(--shadow)' }}>
            <div style={{ fontSize:'9px', fontWeight:'600', color:'var(--muted)', letterSpacing:'.07em', textTransform:'uppercase', marginBottom:'3px' }}>{k.l}</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'16px', fontWeight:'600', color:k.c }}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* DOW headers */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'4px', marginBottom:'4px' }}>
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d,i) => (
          <div key={d} style={{ textAlign:'center', fontSize:'10px', fontWeight:'600', color: i>=5?'var(--muted2)':'var(--muted)', padding:'4px 0', letterSpacing:'.04em' }}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'4px' }}>
        {Array.from({ length: totalCells }, (_, i) => {
          const day = i - firstDow + 1
          if (day < 1 || day > daysInMonth) return <div key={i} style={{ minHeight:'78px' }} />
          const ds  = toDateStr(day)
          const cls = dayClass(day)
          const cs  = cellStyle[cls]
          const d   = dayMap[ds]
          const isToday = ds === today
          const dow2 = (firstDow + day - 1) % 7
          const isSundayCell = dow2 === 6
          const pl  = d ? (d.trades.reduce((s,t) => s+(t.pl||t.r_multiple||0), 0)) : 0
          const cnt = d?.trades.length || 0

          return (
            <div key={i} onClick={() => setSelectedDate(ds)}
              style={{ background: isSundayCell ? 'var(--purple-bg)' : cs.bg, border:`1.5px solid ${isSundayCell ? 'var(--purple-dim)' : cs.border}`, borderRadius:'var(--r-sm)', minHeight:'78px', padding:'7px', display:'flex', flexDirection:'column', gap:'2px', cursor:'pointer', transition:'all .15s', position:'relative', opacity: cls==='weekend'?.55:1 }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow='var(--shadow-md)'; e.currentTarget.style.transform='translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow=''; e.currentTarget.style.transform='' }}>

              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                <div>
                  <span style={{ fontSize:'11px', fontWeight:'600', color:numCol[cls] }}>{day}</span>
                  {isToday && <div style={{ fontSize:'8px', fontWeight:'700', color:'var(--blue)', letterSpacing:'.04em' }}>TODAY</div>}
                </div>
                
              </div>

              {cnt > 0 && <>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'13px', fontWeight:'600', color:numCol[cls], marginTop:'auto', lineHeight:1.2 }}>
                  {f2(pl)}
                </span>
                <span style={{ fontSize:'9px', color:numCol[cls], opacity:.8 }}>{cnt} trade{cnt>1?'s':''}</span>
                <span style={{ display:'inline-flex', padding:'1px 5px', borderRadius:'3px', fontSize:'8px', fontWeight:'700', background: cls==='win'?'var(--green-dim)':cls==='loss'?'var(--red-dim)':'var(--amber-dim)', color: cls==='win'?'var(--green)':cls==='loss'?'var(--red)':'var(--amber)' }}>
                  {pl>0?'WIN':pl<0?'LOSS':'BE'}
                </span>
              </>}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:'10px', marginTop:'12px', flexWrap:'wrap', alignItems:'center' }}>
        {[['var(--green-bg)','var(--green-dim)','Win'],['var(--red-bg)','var(--red-dim)','Loss'],['var(--surface)','var(--border)','No trades'],['var(--blue-bg)','var(--blue)','Today']].map(([bg,bc,l]) => (
          <div key={l} style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'11px', color:'var(--muted)' }}>
            <span style={{ width:'10px', height:'10px', borderRadius:'2px', background:bg, border:`1.5px solid ${bc}`, display:'inline-block' }} />{l}
          </div>
        ))}
        <div style={{ marginLeft:'auto', fontSize:'10px', color:'var(--muted2)' }}>Click any day to open daily journal</div>
      </div>
    </div>
  )
}
