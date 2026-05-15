import { computeStats } from '../lib/stats'

import AccountManager from './AccountManager'

const NAV = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'journal',   label: 'Journal'    },
  { id: 'calendar',  label: 'Econ Cal'   },
  { id: 'news',      label: 'Economic Calendar', short: 'News' },
  { id: 'analysis',  label: 'Analysis'   },
  { id: 'playbook',  label: 'Playbook'   },
]

function sym(currency) {
  return { USD:'$', GBP:'£', EUR:'€', AUD:'A$', CAD:'C$' }[currency] || '$'
}

export default function Layout({ page, onNav, trades, user, onSignOut, onExport, onImport, darkMode, onToggleDark, accounts, activeAccountId, onSwitchAccount, onCreateAccount, onEditAccount, onDeleteAccount, startingBalance, children }) {
  const s  = computeStats(trades, startingBalance || 100000)
  const ac = accounts?.find(a => a.id === activeAccountId)
  const cs = sym(ac?.currency)
  const up = s.totalPL >= 0

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg)' }}>

      {/* SIDEBAR */}
      <aside className="sidebar" style={{ width:'var(--nav-w)', position:'fixed', top:0, left:0, height:'100vh', background:'var(--surface)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', zIndex:50 }}>
        <div style={{ padding:'20px 18px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'24px', height:'24px', borderRadius:'6px', background:'var(--blue)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <span style={{ color:'#fff', fontSize:'12px', fontWeight:'800', lineHeight:1 }}>T</span>
          </div>
          <span style={{ fontSize:'13px', fontWeight:'600', color:'var(--text)', letterSpacing:'-.02em' }}>TradeTracker</span>
        </div>

        <nav style={{ flex:1, padding:'8px', overflowY:'auto' }}>
          <div style={{ padding:'10px 10px 4px', fontSize:'9px', fontWeight:'600', color:'var(--muted2)', letterSpacing:'.1em', textTransform:'uppercase' }}>Navigation</div>
          {NAV.map(item => {
            const active = page === item.id
            return (
              <button key={item.id} onClick={() => onNav(item.id)}
                style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 10px', borderRadius:'6px', cursor:'pointer', fontSize:'12px', fontWeight: active ? '600' : '400', color: active ? 'var(--text)' : 'var(--muted)', background: active ? 'var(--surface2)' : 'transparent', border:'none', width:'100%', textAlign:'left', marginBottom:'1px', transition:'all .12s', fontFamily:'Inter,sans-serif' }}>
                <div style={{ width:'4px', height:'4px', borderRadius:'50%', background: active ? 'var(--blue)' : 'var(--border2)', flexShrink:0, transition:'background .12s' }} />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div style={{ padding:'8px', borderTop:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:'6px' }}>
          <AccountManager accounts={accounts||[]} activeAccountId={activeAccountId} onSwitch={onSwitchAccount} onCreate={onCreateAccount} onEdit={onEditAccount} onDelete={onDeleteAccount} />
          <div style={{ background:'var(--surface2)', borderRadius:'var(--r-sm)', padding:'10px 12px', border:'1px solid var(--border)' }}>
            <div style={{ fontSize:'9px', fontWeight:'600', color:'var(--muted)', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:'3px' }}>Account Equity</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'15px', fontWeight:'600', color:'var(--text)' }}>{(s.totalR||0).toFixed(2)}R</div>
            <div style={{ fontSize:'10px', color: up ? 'var(--green)' : 'var(--red)', marginTop:'1px', fontWeight:'500' }}>{s.wins||0}W / {s.losses||0}L · {s.n||0} trades</div>
          </div>
          <div style={{ display:'flex', gap:'4px' }}>
            <button className="btn btn-outline btn-sm" style={{ flex:1, justifyContent:'center', fontSize:'10px' }} onClick={onExport}>↑ Export</button>
            <label className="btn btn-outline btn-sm" style={{ flex:1, justifyContent:'center', cursor:'pointer', fontSize:'10px' }}>
              ↓ Import<input type="file" accept=".json" style={{ display:'none' }} onChange={onImport} />
            </label>
          </div>
          <div style={{ display:'flex', gap:'4px' }}>
            <button className="btn btn-ghost btn-sm" style={{ flex:1, justifyContent:'center', fontSize:'10px' }} onClick={onToggleDark}>{darkMode ? 'Light' : 'Dark'}</button>
            <button className="btn btn-ghost btn-sm" style={{ flex:1, justifyContent:'center', fontSize:'10px', color:'var(--red)' }} onClick={onSignOut}>Sign out</button>
          </div>
          {user && <div style={{ fontSize:'9px', color:'var(--muted2)', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</div>}
        </div>
      </aside>

      {/* MAIN */}
      <div className="main" style={{ marginLeft:'var(--nav-w)', flex:1, minHeight:'100vh', display:'flex', flexDirection:'column' }}>
        <header style={{ background:'var(--surface)', borderBottom:'1px solid var(--border)', padding:'0 28px', height:'48px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:40 }}>
          <span style={{ fontSize:'13px', fontWeight:'500', color:'var(--text)' }}>{NAV.find(n => n.id === page)?.label}</span>
          <div style={{ display:'flex', gap:'5px', alignItems:'center' }}>
            <button className="btn btn-icon btn-ghost" onClick={onToggleDark} style={{ fontSize:'13px' }}>{darkMode ? '○' : '●'}</button>
            <button className="btn btn-outline btn-sm" onClick={onExport}>Export</button>
            <label className="btn btn-outline btn-sm" style={{ cursor:'pointer' }}>Import<input type="file" accept=".json" style={{ display:'none' }} onChange={onImport} /></label>
          </div>
        </header>
        <div style={{ flex:1 }}>{children}</div>
      </div>

      {/* BOTTOM NAV */}
      <nav className="bot-nav" style={{ display:'none', position:'fixed', bottom:0, left:0, right:0, height:'var(--bot-h)', background:'var(--surface)', borderTop:'1px solid var(--border)', zIndex:100, paddingBottom:'env(safe-area-inset-bottom)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', height:'100%' }}>
          {NAV.map(item => {
            const active = page === item.id
            return (
              <button key={item.id} onClick={() => onNav(item.id)}
                style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'2px', cursor:'pointer', border:'none', background:'none', fontFamily:'Inter,sans-serif', transition:'all .12s', padding:'4px 2px', position:'relative' }}>
                {active && <div style={{ position:'absolute', top:'4px', width:'14px', height:'2px', borderRadius:'1px', background:'var(--blue)' }} />}
                <div style={{ width:'6px', height:'6px', borderRadius:'50%', background: active ? 'var(--blue)' : 'var(--border2)', margin:'4px 0 2px', transition:'background .12s' }} />
                <span style={{ fontSize:'8px', fontWeight: active ? '600' : '400', color: active ? 'var(--blue)' : 'var(--muted)', letterSpacing:'.04em', textTransform:'uppercase' }}>{item.short || item.label.slice(0,4)}</span>
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
        }
      `}</style>
    </div>
  )
}
