import React from 'react'
import { computeStats } from '../lib/stats'

import AccountManager from './AccountManager'

const NAV = [
  { id: 'dashboard', label: 'Dashboard',         short: 'Dash' },
  { id: 'journal',   label: 'Journal',            short: 'Jour' },
  { id: 'calendar',  label: 'Calendar',           short: 'Cal'  },
  { id: 'news',      label: 'Economic Calendar',  short: 'News' },
  { id: 'macro',     label: 'Macro',              short: 'Mcro' },
  { id: 'analysis',  label: 'Analysis',           short: 'Anal' },
  { id: 'playbook',  label: 'Playbook',           short: 'Play' },
]

export default function Layout({ page, onNav, trades, user, onSignOut, onExport, onImport, darkMode, onToggleDark, accounts, activeAccountId, onSwitchAccount, onCreateAccount, onEditAccount, onDeleteAccount, startingBalance, children }) {
  const s  = computeStats(trades, startingBalance || 100000)
  const up = s.totalPL >= 0

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg)' }}>

      {/* SIDEBAR */}
      <aside className="sidebar" style={{ width:'var(--nav-w)', position:'fixed', top:0, left:0, height:'100vh', background:'var(--surface)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', zIndex:50 }}>
        <div style={{ padding:'22px 20px 18px', display:'flex', alignItems:'center', gap:'11px' }}>
          <div style={{ width:'30px', height:'30px', borderRadius:'9px', background:'var(--blue)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 2px 8px rgba(79,70,229,.32)' }}>
            <span style={{ color:'#fff', fontSize:'15px', fontWeight:'800', lineHeight:1, fontFamily:"'Bricolage Grotesque',sans-serif" }}>T</span>
          </div>
          <span style={{ fontSize:'16px', fontWeight:'700', color:'var(--text)', letterSpacing:'-.03em', fontFamily:"'Bricolage Grotesque',sans-serif" }}>TradeTracker</span>
        </div>

        <nav style={{ flex:1, padding:'8px 12px', overflowY:'auto' }}>
          <div style={{ padding:'12px 10px 8px', fontSize:'9px', fontWeight:'700', color:'var(--muted2)', letterSpacing:'.12em', textTransform:'uppercase' }}>Navigation</div>
          {NAV.map(item => {
            const active = page === item.id
            return (
              <button key={item.id} onClick={() => onNav(item.id)}
                style={{ display:'flex', alignItems:'center', gap:'11px', padding:'9px 12px', borderRadius:'10px', cursor:'pointer', fontSize:'13px', fontWeight: active ? '600' : '500', color: active ? '#fff' : 'var(--muted)', background: active ? 'var(--blue)' : 'transparent', border:'none', width:'100%', textAlign:'left', marginBottom:'2px', transition:'all .15s var(--ease)', fontFamily:'inherit', boxShadow: active ? '0 2px 8px rgba(79,70,229,.28)' : 'none', letterSpacing:'-.01em' }}
                onMouseEnter={e => { if(!active){ e.currentTarget.style.background='var(--surface2)'; e.currentTarget.style.color='var(--text)' } }}
                onMouseLeave={e => { if(!active){ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--muted)' } }}>
                <div style={{ width:'5px', height:'5px', borderRadius:'50%', background: active ? '#fff' : 'var(--border2)', flexShrink:0, transition:'background .15s' }} />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div style={{ padding:'12px', borderTop:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:'8px' }}>
          <AccountManager accounts={accounts||[]} activeAccountId={activeAccountId} onSwitch={onSwitchAccount} onCreate={onCreateAccount} onEdit={onEditAccount} onDelete={onDeleteAccount} />
          <div style={{ background:'linear-gradient(135deg, var(--surface2), var(--surface3))', borderRadius:'var(--r-sm)', padding:'13px 15px', border:'1px solid var(--border)' }}>
            <div style={{ fontSize:'9px', fontWeight:'700', color:'var(--muted)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:'5px' }}>Account Equity</div>
            <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'19px', fontWeight:'700', color: up ? 'var(--green)' : 'var(--red)', letterSpacing:'-.04em' }}>{up?'+':''}{(s.totalR||0).toFixed(2)}R</div>
            <div style={{ fontSize:'10.5px', color:'var(--muted)', marginTop:'3px', fontWeight:'500' }}>{s.wins||0}W / {s.losses||0}L · {s.n||0} trades</div>
          </div>
          <div style={{ display:'flex', gap:'5px' }}>
            <button className="btn btn-outline btn-sm" style={{ flex:1, justifyContent:'center', fontSize:'10.5px' }} onClick={onExport}>Export</button>
            <label className="btn btn-outline btn-sm" style={{ flex:1, justifyContent:'center', cursor:'pointer', fontSize:'10.5px' }}>
              Import<input type="file" accept=".json" style={{ display:'none' }} onChange={onImport} />
            </label>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ justifyContent:'center', fontSize:'10.5px', color:'var(--red)' }} onClick={onSignOut}>Sign out</button>
          {user && <div style={{ fontSize:'9.5px', color:'var(--muted2)', textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</div>}
        </div>
      </aside>

      {/* MAIN */}
      <div className="main" style={{ marginLeft:'var(--nav-w)', flex:1, minHeight:'100vh', display:'flex', flexDirection:'column' }}>
        <header style={{ background:'rgba(255,255,255,.82)', backdropFilter:'blur(12px)', borderBottom:'1px solid var(--border)', padding:'0 36px', height:'56px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:40 }}>
          <span style={{ fontSize:'15px', fontWeight:'700', color:'var(--text)', fontFamily:"'Bricolage Grotesque',sans-serif", letterSpacing:'-.02em' }}>{NAV.find(n => n.id === page)?.label}</span>
          <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
            <button className="btn btn-outline btn-sm" onClick={onExport}>Export</button>
            <label className="btn btn-outline btn-sm" style={{ cursor:'pointer' }}>Import<input type="file" accept=".json" style={{ display:'none' }} onChange={onImport} /></label>
          </div>
        </header>
        <div style={{ flex:1 }}>{children}</div>
      </div>

      {/* BOTTOM NAV */}
      <nav className="bot-nav" style={{ display:'none', position:'fixed', bottom:0, left:0, right:0, background:'rgba(255,255,255,.92)', backdropFilter:'blur(12px)', borderTop:'1px solid var(--border)', zIndex:1000, paddingBottom:'env(safe-area-inset-bottom, 0px)' }}>
        <div style={{ display:'flex', height:'54px', overflowX:'auto', scrollbarWidth:'none' }}>
          {NAV.map(item => {
            const active = page === item.id
            const icons = { dashboard:'⊞', journal:'✎', calendar:'◫', news:'◷', macro:'◈', analysis:'◉', playbook:'☰' }
            return (
              <button key={item.id} onClick={() => onNav(item.id)}
                style={{ flex:'1 0 0', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'3px', border:'none', background:'transparent', cursor:'pointer', padding:'4px 2px', position:'relative', WebkitTapHighlightColor:'transparent', minWidth:'46px' }}>
                {active && <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'22px', height:'2.5px', borderRadius:'0 0 3px 3px', background:'var(--blue)' }} />}
                <span style={{ fontSize:'16px', lineHeight:1, opacity: active ? 1 : 0.4, color: active ? 'var(--blue)' : 'var(--muted)' }}>{icons[item.id]||'•'}</span>
                <span style={{ fontSize:'8px', fontWeight: active ? '700' : '500', color: active ? 'var(--blue)' : 'var(--muted2)', letterSpacing:'.02em', textTransform:'uppercase', lineHeight:1, whiteSpace:'nowrap' }}>{item.short||item.label.slice(0,4)}</span>
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
