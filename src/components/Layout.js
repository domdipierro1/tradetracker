import { computeStats } from '../lib/stats'
import AccountManager from './AccountManager'

const NAV_ITEMS = [
  { id: 'dashboard', icon: '▣',  label: 'Dashboard' },
  { id: 'log',       icon: '≡',  label: 'Trade Log'  },
  { id: 'calendar',  icon: '◫',  label: 'Calendar'   },
  { id: 'news',      icon: '◈',  label: 'News'        },
  { id: 'analysis',  icon: '◎',  label: 'Analysis'   },
  { id: 'playbook',  icon: '◉',  label: 'Playbook'   },
]

function currencySymbol(currency) {
  return { USD:'$', GBP:'£', EUR:'€', AUD:'A$', CAD:'C$' }[currency] || '$'
}

function formatEquity(equity, currency) {
  const sym = currencySymbol(currency)
  if (equity >= 1000000) return sym + (equity/1000000).toFixed(2) + 'M'
  if (equity >= 1000)    return sym + Math.round(equity).toLocaleString('en-US')
  return sym + equity.toFixed(2)
}

export default function Layout({ page, onNav, trades, user, onSignOut, onExport, onImport, darkMode, onToggleDark, accounts, activeAccountId, onSwitchAccount, onCreateAccount, onEditAccount, onDeleteAccount, startingBalance, children }) {
  const s = computeStats(trades, startingBalance || 100000)
  const activeAccount = accounts?.find(a => a.id === activeAccountId)
  const currency = activeAccount?.currency || 'USD'
  const retUp = s.totalPL >= 0

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── SIDEBAR ── */}
      <aside className="sidebar" style={{ width: 'var(--nav-w)', position: 'fixed', top: 0, left: 0, height: '100vh', background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', zIndex: 50 }}>

        {/* Brand */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
            <img src="/favicon.svg" alt="logo" style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text)', letterSpacing: '-.02em', lineHeight: 1.2 }}>
              Trade<span style={{ color: 'var(--blue)' }}>Tracker</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {NAV_ITEMS.map(item => {
            const active = page === item.id
            return (
              <button key={item.id} onClick={() => onNav(item.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: 'var(--r-sm)', cursor: 'pointer', fontSize: '13px', fontWeight: active ? '600' : '500', color: active ? 'var(--blue)' : 'var(--muted)', background: active ? 'var(--blue-bg)' : 'transparent', border: 'none', width: '100%', textAlign: 'left', marginBottom: '1px', transition: 'all .15s', fontFamily: 'Geist, sans-serif', letterSpacing: '-.01em' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', background: active ? 'var(--blue-dim)' : 'var(--surface2)', flexShrink: 0, transition: 'background .15s', color: active ? 'var(--blue)' : 'var(--muted)', fontFamily: 'Geist, sans-serif' }}>{item.icon}</span>
                {item.label}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>

          {/* Account switcher */}
          <AccountManager accounts={accounts||[]} activeAccountId={activeAccountId} onSwitch={onSwitchAccount} onCreate={onCreateAccount} onEdit={onEditAccount} onDelete={onDeleteAccount} />

          {/* Equity card */}
          <div style={{ background: 'var(--surface2)', borderRadius: 'var(--r-sm)', padding: '12px 14px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '9px', fontWeight: '600', color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '4px' }}>Account Equity</div>
            <div style={{ fontFamily: "'Geist Mono', monospace", fontSize: '17px', fontWeight: '700', color: 'var(--text)', letterSpacing: '-.02em' }}>
              {formatEquity(s.equity, currency)}
            </div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: retUp ? 'var(--green)' : 'var(--red)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>{retUp ? '▲' : '▼'}</span>
              <span>{Math.abs(s.totalPL).toFixed(2)}%</span>
              <span style={{ color: 'var(--muted)', fontWeight: '400' }}>all time</span>
            </div>
          </div>

          {/* Actions row */}
          <div style={{ display: 'flex', gap: '5px' }}>
            <button className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: '11px' }} onClick={onExport}>↑ Export</button>
            <label className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center', cursor: 'pointer', fontSize: '11px' }}>
              ↓ Import<input type="file" accept=".json" style={{ display: 'none' }} onChange={onImport} />
            </label>
          </div>

          <div style={{ display: 'flex', gap: '5px' }}>
            <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: '11px' }} onClick={onToggleDark}>
              {darkMode ? '☀' : '◑'} {darkMode ? 'Light' : 'Dark'}
            </button>
            <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: '11px', color: 'var(--red)' }} onClick={onSignOut}>
              ⊘ Sign out
            </button>
          </div>

          {user && <div style={{ fontSize: '10px', color: 'var(--muted2)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingTop: '2px' }}>{user.email}</div>}
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="main" style={{ marginLeft: 'var(--nav-w)', flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* Topbar */}
        <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 28px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Mobile logo */}
            <img src="/favicon.svg" alt="logo" style={{ width: '22px', height: '22px', borderRadius: '5px', display: 'none' }} className="mobile-logo" />
            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', letterSpacing: '-.01em' }}>
              {NAV_ITEMS.find(n => n.id === page)?.label}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button className="btn btn-icon btn-ghost" onClick={onToggleDark} style={{ color: 'var(--muted)', fontSize: '15px' }}>{darkMode ? '☀' : '◑'}</button>
            <button className="btn btn-outline btn-sm" onClick={onExport}>↑ Export</button>
            <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
              ↓ Import<input type="file" accept=".json" style={{ display: 'none' }} onChange={onImport} />
            </label>
          </div>
        </header>

        <div style={{ flex: 1 }}>{children}</div>
      </div>

      {/* ── BOTTOM NAV (mobile) ── */}
      <nav className="bot-nav" style={{ display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, height: 'var(--bot-h)', background: 'var(--surface)', borderTop: '1px solid var(--border)', zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', height: '100%' }}>
          {NAV_ITEMS.map(item => {
            const active = page === item.id
            return (
              <button key={item.id} onClick={() => onNav(item.id)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'Geist, sans-serif', transition: 'all .15s', padding: '6px 2px', position: 'relative' }}>
                {active && <div style={{ position: 'absolute', top: '6px', width: '16px', height: '2px', borderRadius: '1px', background: 'var(--blue)', transition: 'all .2s var(--ease)' }} />}
                <span style={{ fontSize: '18px', lineHeight: 1, color: active ? 'var(--blue)' : 'var(--muted)', transform: active ? 'translateY(1px) scale(1.05)' : 'none', transition: 'all .2s var(--ease)', fontFamily: 'Geist, sans-serif' }}>{item.icon}</span>
                <span style={{ fontSize: '9px', fontWeight: active ? '700' : '500', color: active ? 'var(--blue)' : 'var(--muted)', letterSpacing: '.02em', textTransform: 'uppercase', transition: 'color .15s' }}>{item.label.slice(0,4)}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <style>{`
        @media(max-width:768px){
          .sidebar{display:none!important}
          .main{margin-left:0!important;padding-bottom:calc(var(--bot-h)+8px)}
          .bot-nav{display:block!important}
          .mobile-logo{display:block!important}
        }
      `}</style>
    </div>
  )
}
