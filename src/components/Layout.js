import { fUSD, f2, computeStats } from '../lib/stats'
import AccountManager from './AccountManager'

const NAV_ITEMS = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'log',       icon: '📝', label: 'Log'       },
  { id: 'calendar',  icon: '📅', label: 'Calendar'  },
  { id: 'news',      icon: '🔴', label: 'News'      },
  { id: 'analysis',  icon: '🔬', label: 'Analysis'  },
  { id: 'playbook',  icon: '📖', label: 'Playbook'  },
]

export default function Layout({ page, onNav, trades, user, onSignOut, onExport, onImport, darkMode, onToggleDark, accounts, activeAccountId, onSwitchAccount, onCreateAccount, onEditAccount, onDeleteAccount, children }) {
  const s = computeStats(trades)
  const retColor = s.totalPL >= 0 ? 'var(--green)' : 'var(--red)'

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* ── Sidebar (desktop) ── */}
      <aside style={{ width: 'var(--nav-w)', position: 'fixed', top: 0, left: 0, height: '100vh', background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', zIndex: 50, transition: 'background .2s' }} className="sidebar">
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/favicon.svg" alt="logo" style={{ width: '28px', height: '28px', borderRadius: '7px' }} />
          <div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text)', letterSpacing: '-.02em', lineHeight: 1 }}>Trade<span style={{ color: 'var(--blue)' }}>Tracker</span></div>
            <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: '2px' }}>ICT / SMC · '26</div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => onNav(item.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 10px', borderRadius: 'var(--r-sm)', cursor: 'pointer', fontSize: '13px', fontWeight: page === item.id ? '700' : '600', color: page === item.id ? 'var(--blue)' : 'var(--muted)', background: page === item.id ? 'var(--blue-bg)' : 'transparent', border: 'none', width: '100%', textAlign: 'left', marginBottom: '2px', transition: 'all .15s', fontFamily: 'inherit' }}>
              <span style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', background: page === item.id ? 'var(--blue-dim)' : 'var(--surface2)', flexShrink: 0, transition: 'background .15s' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
          <AccountManager accounts={accounts||[]} activeAccountId={activeAccountId} onSwitch={onSwitchAccount} onCreate={onCreateAccount} onEdit={onEditAccount} onDelete={onDeleteAccount} />
          <div style={{ height: '8px' }} />
          <div style={{ background: 'var(--surface2)', borderRadius: 'var(--r-sm)', padding: '12px 14px', marginBottom: '10px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '9px', fontWeight: '800', color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: '3px' }}>Account Equity</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '16px', fontWeight: '700', color: 'var(--text)' }}>{fUSD(s.equity)}</div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: retColor, marginTop: '2px' }}>{f2(s.totalPL)} all time</div>
          </div>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
            <button className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={onExport}>↑ Export</button>
            <label className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center', cursor: 'pointer' }}>
              ↓ Import<input type="file" accept=".json" style={{ display: 'none' }} onChange={onImport} />
            </label>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={onToggleDark}>{darkMode ? '☀️ Light' : '🌙 Dark'}</button>
            <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center', color: 'var(--red)' }} onClick={onSignOut}>Sign out</button>
          </div>
          {user && <div style={{ fontSize: '10px', color: 'var(--muted2)', marginTop: '8px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>}
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main" style={{ marginLeft: 'var(--nav-w)', flex: 1, minHeight: '100vh' }}>
        {/* Topbar */}
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 20px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40, gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/favicon.svg" alt="logo" style={{ width: '22px', height: '22px', borderRadius: '5px', display: 'none' }} className="mobile-logo" />
            <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text)' }}>
              {NAV_ITEMS.find(n => n.id === page)?.icon} {NAV_ITEMS.find(n => n.id === page)?.label}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button className="btn btn-icon btn-ghost" onClick={onToggleDark} title="Toggle dark mode" style={{ fontSize: '16px' }}>{darkMode ? '☀️' : '🌙'}</button>
            <button className="btn btn-outline btn-sm" onClick={onExport}>↑ Export</button>
            <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
              ↓ Import<input type="file" accept=".json" style={{ display: 'none' }} onChange={onImport} />
            </label>
          </div>
        </div>

        {children}
      </div>

      {/* ── Bottom nav (mobile only) ── */}
      <nav className="bot-nav" style={{ display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, height: 'var(--bot-h)', background: 'var(--surface)', borderTop: '1px solid var(--border)', zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', height: '100%', padding: '0 4px' }}>
          {NAV_ITEMS.map(item => {
            const isActive = page === item.id
            return (
              <button key={item.id} onClick={() => onNav(item.id)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit', padding: '6px 2px', borderRadius: '10px', margin: '4px 2px', transition: 'all .15s', position: 'relative', background: isActive ? 'var(--blue-bg)' : 'transparent' }}>
                {/* Active dot indicator */}
                {isActive && <div style={{ position: 'absolute', top: '4px', width: '18px', height: '3px', borderRadius: '2px', background: 'var(--blue)' }} />}
                <span style={{ fontSize: '22px', lineHeight: 1, transition: 'transform .15s', transform: isActive ? 'translateY(1px) scale(1.1)' : 'none' }}>{item.icon}</span>
                <span style={{ fontSize: '10px', fontWeight: isActive ? '800' : '600', color: isActive ? 'var(--blue)' : 'var(--muted)', letterSpacing: '.02em', transition: 'color .15s' }}>{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <style>{`
        @media(max-width:768px){
          .sidebar{display:none!important}
          .main{margin-left:0!important;padding-bottom:calc(var(--bot-h) + 8px)}
          .bot-nav{display:block!important}
          .mobile-logo{display:block!important}
        }
      `}</style>
    </div>
  )
}
