import { useState } from 'react'

const ACCOUNT_TYPES = ['Live', 'Prop', 'Demo', 'Paper']
const ACCOUNT_COLORS = [
  '#2563EB', '#059669', '#DC2626', '#D97706',
  '#7C3AED', '#0EA5E9', '#DB2777', '#0D9488'
]
const CURRENCIES = ['USD', 'GBP', 'EUR', 'GBP']

const EMPTY_FORM = {
  name: '', starting_balance: '', currency: 'USD',
  account_type: 'Live', broker: '', color: '#2563EB'
}

function AccountForm({ initial, onSave, onCancel, title }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  const [err, setErr] = useState('')
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setErr('Account name is required'); return }
    if (!form.starting_balance || isNaN(parseFloat(form.starting_balance))) { setErr('Starting balance is required'); return }
    onSave({ ...form, starting_balance: parseFloat(form.starting_balance) })
  }

  return (
    <form onSubmit={submit}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '12px', marginBottom: '14px' }}>
        <div className="form-group" style={{ gridColumn: '1/-1' }}>
          <label className="form-label">Account Name</label>
          <input className="form-input" value={form.name} onChange={set('name')} placeholder="e.g. FTMO Challenge, Live Account..." />
        </div>
        <div className="form-group">
          <label className="form-label">Starting Balance</label>
          <input className="form-input" type="number" value={form.starting_balance} onChange={set('starting_balance')} placeholder="100000" />
        </div>
        <div className="form-group">
          <label className="form-label">Currency</label>
          <select className="form-input" value={form.currency} onChange={set('currency')}>
            {['USD','GBP','EUR','AUD','CAD'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Account Type</label>
          <select className="form-input" value={form.account_type} onChange={set('account_type')}>
            {ACCOUNT_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Broker (optional)</label>
          <input className="form-input" value={form.broker} onChange={set('broker')} placeholder="e.g. FTMO, IC Markets..." />
        </div>
        <div className="form-group">
          <label className="form-label">Colour</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingTop: '4px' }}>
            {ACCOUNT_COLORS.map(c => (
              <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                style={{ width: '24px', height: '24px', borderRadius: '50%', background: c, border: form.color === c ? '3px solid var(--text)' : '2px solid transparent', cursor: 'pointer', transition: 'transform .15s' }}
                onMouseEnter={e => e.target.style.transform = 'scale(1.2)'}
                onMouseLeave={e => e.target.style.transform = 'scale(1)'} />
            ))}
          </div>
        </div>
      </div>
      {err && <div style={{ color: 'var(--red)', fontSize: '12px', fontWeight: '600', marginBottom: '10px' }}>{err}</div>}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="submit" className="btn btn-blue">{title || 'Save'}</button>
        {onCancel && <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  )
}

export default function AccountManager({ accounts, activeAccountId, onSwitch, onCreate, onEdit, onDelete }) {
  const [showCreate, setShowCreate] = useState(false)
  const [editAccount, setEditAccount] = useState(null)
  const [showManager, setShowManager] = useState(false)

  const active = accounts.find(a => a.id === activeAccountId)

  return (
    <>
      {/* Account switcher pill — shown in sidebar/topbar */}
      <div style={{ position: 'relative' }}>
        <button onClick={() => setShowManager(m => !m)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 'var(--r-sm)', cursor: 'pointer', width: '100%', fontFamily: 'inherit', transition: 'all .15s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: active?.color || 'var(--blue)', flexShrink: 0 }} />
          <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{active?.name || 'Select Account'}</div>
            <div style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: '600' }}>{active?.account_type || ''} · {active?.currency || ''}</div>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--muted)' }}>▼</span>
        </button>
      </div>

      {/* Dropdown modal */}
      {showManager && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setShowManager(false) }}>
          <div className="modal" style={{ maxWidth: '520px' }}>
            <div className="modal-title">
              <span>Accounts</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowManager(false)}>✕</button>
            </div>

            {/* Account list */}
            <div style={{ marginBottom: '16px' }}>
              {accounts.map(acc => (
                <div key={acc.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: 'var(--r-sm)', marginBottom: '6px', background: acc.id === activeAccountId ? 'var(--blue-bg)' : 'var(--surface2)', border: `1.5px solid ${acc.id === activeAccountId ? 'var(--blue-dim)' : 'var(--border)'}`, cursor: 'pointer', transition: 'all .15s' }}
                  onClick={() => { onSwitch(acc.id); setShowManager(false) }}>
                  {/* Colour dot */}
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: acc.color || 'var(--blue)', flexShrink: 0 }} />
                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)' }}>{acc.name}</span>
                      <span style={{ padding: '1px 7px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', background: acc.id === activeAccountId ? 'var(--blue)' : 'var(--border)', color: acc.id === activeAccountId ? '#fff' : 'var(--muted)' }}>
                        {acc.id === activeAccountId ? 'Active' : acc.account_type}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600', marginTop: '2px' }}>
                      {acc.currency === 'GBP' ? '£' : acc.currency === 'EUR' ? '€' : '$'}{parseFloat(acc.starting_balance).toLocaleString()} starting
                      {acc.broker && ` · ${acc.broker}`}
                    </div>
                  </div>
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                    <button className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => { setEditAccount(acc); setShowCreate(false) }}
                      title="Edit">✏️</button>
                    {accounts.length > 1 && (
                      <button className="btn btn-ghost btn-icon btn-sm"
                        onClick={() => { if (window.confirm(`Delete "${acc.name}"? All trades for this account will be deleted.`)) { onDelete(acc.id); if (acc.id === activeAccountId) onSwitch(accounts.find(a => a.id !== acc.id)?.id) } }}
                        style={{ color: 'var(--red)' }} title="Delete">🗑</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Edit form */}
            {editAccount && (
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '16px', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text2)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '.04em' }}>Edit Account</div>
                <AccountForm initial={{ ...editAccount, starting_balance: editAccount.starting_balance.toString() }} title="Save Changes"
                  onSave={async updates => { await onEdit(editAccount.id, updates); setEditAccount(null) }}
                  onCancel={() => setEditAccount(null)} />
              </div>
            )}

            {/* Create form */}
            {showCreate ? (
              <div style={{ background: 'var(--blue-bg)', border: '1px solid var(--blue-dim)', borderRadius: 'var(--r-sm)', padding: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--blue)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '.04em' }}>New Account</div>
                <AccountForm title="Create Account"
                  onSave={async data => { await onCreate(data); setShowCreate(false); setShowManager(false) }}
                  onCancel={() => setShowCreate(false)} />
              </div>
            ) : (
              <button className="btn btn-blue" onClick={() => { setShowCreate(true); setEditAccount(null) }} style={{ width: '100%', justifyContent: 'center' }}>
                + Add New Account
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
