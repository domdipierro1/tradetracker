import { useState, useMemo } from 'react'
import { f2, fUSD, fR, equityCurveForTrades, BAL } from '../lib/stats'

const TIMES = ['2:00','3:00','4:00','5:00','6:00','7:00','8:00','9:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00']
const EMPTY = { date: new Date().toISOString().split('T')[0], time: '', symbol: '', direction: '', setup: '', bias: '', smt: '', session: '', risk: '', outcome: '', grade: '', r_multiple: '', pl: '', mistake: '', screenshot: '', journal: '' }

function TradeForm({ initial, onSave, onCancel, title }) {
  const [form, setForm] = useState(initial || EMPTY)
  const [err, setErr] = useState('')
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  function submit(e) {
    e.preventDefault()
    if (!form.date || !form.outcome || form.pl === '') { setErr('Date, outcome and P/L % are required.'); return }
    onSave({ ...form, pl: parseFloat(form.pl), risk: form.risk ? parseFloat(form.risk) : null, r_multiple: form.r_multiple ? parseFloat(form.r_multiple) : null })
  }

  const sel = (id, label, opts) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <select className="form-input" value={form[id]} onChange={set(id)}>
        <option value="">—</option>
        {opts.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
  const inp = (id, label, type = 'text', placeholder = '') => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input className="form-input" type={type} value={form[id]} onChange={set(id)} placeholder={placeholder} />
    </div>
  )

  return (
    <form onSubmit={submit}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: '12px', marginBottom: '12px' }}>
        {inp('date', 'Date', 'date')}
        {sel('time', 'Time', TIMES)}
        {sel('symbol', 'Symbol', ['US100','US500','EUR/USD','GBP/USD','DAX'])}
        {sel('direction', 'Direction', ['Long','Short'])}
        {sel('setup', 'Setup', ['1m','5m','15m'])}
        {sel('bias', 'HTF Bias', ['Bullish','Bearish','Neutral'])}
        {sel('smt', 'SMT', ['Yes','No'])}
        {sel('session', 'Session', ['London','AM','PM','Asia'])}
        {inp('risk', 'Risk %', 'number', '1.0')}
        {sel('outcome', 'Outcome', ['Win','Loss','Break Even'])}
        {sel('grade', 'Grade', ['A+','A','B','C'])}
        {inp('r_multiple', 'R-Multiple', 'number', '2.0')}
        {inp('pl', 'P/L % (type 2 for 2%)', 'number', '2.0')}
        {sel('mistake', 'Mistake', ['FOMO entry','Moved stop','Revenge trade','Overtraded','Wrong bias','Hesitated','Early exit','Late entry','No mistake'])}
        {inp('screenshot', 'Screenshot URL', 'url', 'https://...')}
      </div>
      <div className="form-group" style={{ marginBottom: '14px' }}>
        <label className="form-label">Journal Note</label>
        <textarea className="form-input" value={form.journal} onChange={set('journal')} placeholder="Why you took this trade, what happened, what you'd do differently..." style={{ minHeight: '72px' }} />
      </div>
      {err && <div style={{ color: 'var(--red)', fontSize: '12px', fontWeight: '600', marginBottom: '10px' }}>{err}</div>}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="submit" className="btn btn-blue">{title || 'Save'}</button>
        {onCancel && <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  )
}

export default function TradeLog({ trades, onAdd, onEdit, onDelete, toast, startingBalance }) {
  const [showForm, setShowForm] = useState(false)
  const [editTrade, setEditTrade] = useState(null)
  const [filterSym, setFilterSym] = useState('')
  const [filterOut, setFilterOut] = useState('')
  const [filterGr, setFilterGr] = useState('')
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [mobileView, setMobileView] = useState('cards') // 'cards' or 'table'

  const withEq = useMemo(() => equityCurveForTrades(trades, startingBalance || 100000), [trades, startingBalance])
  const eqMap = useMemo(() => { const m = {}; withEq.forEach(t => m[t.id] = t); return m }, [withEq])

  const filtered = useMemo(() => {
    let f = trades.filter(t =>
      (!filterSym || t.symbol === filterSym) &&
      (!filterOut || t.outcome === filterOut) &&
      (!filterGr  || t.grade === filterGr) &&
      (!search || [t.symbol, t.setup, t.session, t.journal, t.mistake].some(v => v && v.toLowerCase().includes(search.toLowerCase())))
    )
    f = [...f].sort((a, b) => {
      let va = a[sortCol], vb = b[sortCol]
      if (sortCol === 'pl' || sortCol === 'r_multiple') { va = parseFloat(va) || 0; vb = parseFloat(vb) || 0 }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return f
  }, [trades, filterSym, filterOut, filterGr, search, sortCol, sortDir])

  function handleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  function ThH({ col, children }) {
    return <th onClick={() => handleSort(col)} style={{ cursor: 'pointer', userSelect: 'none' }}>
      {children}{sortCol === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
    </th>
  }

  const outBadge = o => o === 'Win' ? 'badge-win' : o === 'Loss' ? 'badge-loss' : 'badge-be'
  const grBadge  = g => g === 'A+' ? 'badge-aplus' : g === 'A' ? 'badge-a' : g === 'B' ? 'badge-b' : 'badge-c'

  return (
    <div className="page active">
      {/* Add form toggle */}
      {!showForm && !editTrade && (
        <button className="btn btn-blue" onClick={() => setShowForm(true)} style={{ marginBottom: '16px', fontSize: '13px', padding: '10px 18px' }}>
          + Log New Trade
        </button>
      )}

      {showForm && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '20px', marginBottom: '20px', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text2)', letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '3px', height: '14px', borderRadius: '2px', background: 'var(--blue)', display: 'inline-block' }} />Log New Trade
          </div>
          <TradeForm title="Add Trade" onSave={async t => { await onAdd(t); setShowForm(false); toast('Trade added ✓') }} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {/* Edit modal */}
      {editTrade && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setEditTrade(null) }}>
          <div className="modal">
            <div className="modal-title">Edit Trade <button className="btn btn-ghost btn-icon" onClick={() => setEditTrade(null)}>✕</button></div>
            <TradeForm initial={editTrade} title="Save Changes"
              onSave={async t => { await onEdit(editTrade.id, t); setEditTrade(null); toast('Trade updated ✓') }}
              onCancel={() => setEditTrade(null)} />
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px' }}>
        <input className="form-input" placeholder="🔍 Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '160px', padding: '7px 11px', fontSize: '12px' }} />
        {[['filterSym', ['US100','US500','EUR/USD','GBP/USD','DAX'], 'All Symbols', setFilterSym, filterSym],
          ['filterOut', ['Win','Loss','Break Even'], 'All Outcomes', setFilterOut, filterOut],
          ['filterGr',  ['A+','A','B','C'],          'All Grades',   setFilterGr,  filterGr]].map(([key, opts, placeholder, setter, val]) => (
          <select key={key} value={val} onChange={e => setter(e.target.value)}
            style={{ padding: '7px 11px', borderRadius: 'var(--r-xs)', border: '1.5px solid var(--border)', background: 'var(--surface)', fontSize: '12px', fontWeight: '600', color: 'var(--text)', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
            <option value="">{placeholder}</option>
            {opts.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--muted)', marginLeft: 'auto' }}>{filtered.length} trades</span>
        {/* Mobile view toggle */}
        <button className="btn btn-ghost btn-sm" onClick={() => setMobileView(v => v === 'cards' ? 'table' : 'cards')} style={{ display: 'none' }} id="view-toggle">
          {mobileView === 'cards' ? '☰ Table' : '⊞ Cards'}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--muted)' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📝</div>
          <p style={{ fontSize: '14px' }}>{trades.length === 0 ? 'No trades yet — log your first trade above' : 'No trades match your filters'}</p>
        </div>
      ) : (
        <>
          {/* Mobile card view */}
          <div style={{ display: 'none' }} className="mobile-cards">
            {filtered.slice().reverse().map((t, i) => {
              const eq = eqMap[t.id] || {}
              return (
                <div key={t.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 16px', marginBottom: '10px', boxShadow: 'var(--shadow)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '800', color: 'var(--text)', fontSize: '14px' }}>{t.symbol || '—'}</span>
                      {t.direction && <span className={`badge badge-${t.direction.toLowerCase()}`}>{t.direction}</span>}
                      {t.outcome && <span className={`badge ${outBadge(t.outcome)}`}>{t.outcome}</span>}
                      {t.grade && <span className={`badge ${grBadge(t.grade)}`}>{t.grade}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditTrade(t)} title="Edit">✏️</button>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { if (window.confirm('Delete this trade?')) { onDelete(t.id); toast('Deleted') } }} style={{ color: 'var(--red)' }}>🗑</button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: t.journal ? '10px' : '0' }}>
                    <div><div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '2px' }}>Date</div><div className="num">{t.date}</div></div>
                    <div><div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '2px' }}>P/L %</div><div className={t.pl >= 0 ? 'num-up' : 'num-dn'}>{f2(t.pl || 0)}</div></div>
                    <div><div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '2px' }}>P/L $</div><div className={eq.plDollar >= 0 ? 'num-up' : 'num-dn'}>{eq.plDollar != null ? (eq.plDollar >= 0 ? '+' : '') + fUSD(eq.plDollar) : '—'}</div></div>
                    <div><div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '2px' }}>Equity</div><div className="num">{eq.equity ? fUSD(eq.equity) : '—'}</div></div>
                    <div><div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '2px' }}>Setup</div><div className="num">{t.setup || '—'}</div></div>
                    <div><div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '2px' }}>R</div><div className="num">{t.r_multiple ? fR(t.r_multiple) : '—'}</div></div>
                  </div>
                  {t.mistake && t.mistake !== 'No mistake' && <div style={{ fontSize: '11px', color: 'var(--red)', fontWeight: '600', marginBottom: t.journal ? '6px' : '0' }}>⚠️ {t.mistake}</div>}
                  {t.journal && <div style={{ fontSize: '12px', color: 'var(--text2)', borderTop: '1px solid var(--border)', paddingTop: '8px', lineHeight: '1.5' }}>{t.journal}</div>}
                </div>
              )
            })}
          </div>

          {/* Desktop table view */}
          <div className="tbl-card desktop-table">
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <ThH col="date">Date</ThH>
                    <ThH col="symbol">Symbol</ThH>
                    <th>Dir</th>
                    <th>Setup</th>
                    <th>Session</th>
                    <th>Outcome</th>
                    <th>Grade</th>
                    <ThH col="r_multiple">R</ThH>
                    <ThH col="pl">P/L %</ThH>
                    <th>P/L $</th>
                    <th>Equity</th>
                    <th>Mistake</th>
                    <th>Note</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice().reverse().map((t, i) => {
                    const eq = eqMap[t.id] || {}
                    return (
                      <tr key={t.id}>
                        <td className="num" style={{ color: 'var(--muted)' }}>{filtered.length - i}</td>
                        <td className="num">{t.date}</td>
                        <td style={{ fontWeight: '700' }}>{t.symbol || '—'}</td>
                        <td>{t.direction ? <span className={`badge badge-${t.direction.toLowerCase()}`}>{t.direction}</span> : '—'}</td>
                        <td className="num">{t.setup || '—'}</td>
                        <td style={{ color: 'var(--muted)' }}>{t.session || '—'}</td>
                        <td>{t.outcome ? <span className={`badge ${outBadge(t.outcome)}`}>{t.outcome}</span> : '—'}</td>
                        <td>{t.grade ? <span className={`badge ${grBadge(t.grade)}`}>{t.grade}</span> : '—'}</td>
                        <td className="num">{t.r_multiple ? fR(t.r_multiple) : '—'}</td>
                        <td className={(t.pl||0) >= 0 ? 'num-up' : 'num-dn'}>{f2(t.pl||0)}</td>
                        <td className={(eq.plDollar||0) >= 0 ? 'num-up' : 'num-dn'}>{eq.plDollar != null ? (eq.plDollar>=0?'+':'')+fUSD(eq.plDollar) : '—'}</td>
                        <td className="num">{eq.equity ? fUSD(eq.equity) : '—'}</td>
                        <td style={{ fontSize: '11px', color: 'var(--red)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.mistake && t.mistake !== 'No mistake' ? t.mistake : '—'}</td>
                        <td style={{ fontSize: '11px', color: 'var(--muted)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={t.journal}>{t.journal ? (t.journal.length > 30 ? t.journal.slice(0,30)+'…' : t.journal) : '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditTrade(t)} title="Edit">✏️</button>
                            <button className="btn btn-red btn-sm" onClick={() => { if (window.confirm('Delete this trade?')) { onDelete(t.id); toast('Deleted') } }}>✕</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <style>{`
        @media(max-width:768px){
          .mobile-cards{display:block!important}
          .desktop-table{display:none!important}
          #view-toggle{display:inline-flex!important}
        }
      `}</style>
    </div>
  )
}
