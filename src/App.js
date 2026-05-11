import { useState, useEffect, useMemo } from 'react'
import './index.css'
import {
  supabase, fetchTrades, insertTrade, updateTrade, deleteTrade, signOut,
  fetchDailyNotes, upsertDailyNote, deleteDailyNote,
  fetchAccounts, createAccount, updateAccount, deleteAccount
} from './lib/supabase'
import AuthPage from './components/AuthPage'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import TradeLog from './components/TradeLog'
import Calendar from './components/Calendar'
import NewsTab from './components/NewsTab'
import Analysis from './components/Analysis'
import Playbook from './components/Playbook'

export default function App() {
  const [user, setUser]               = useState(null)
  const [loading, setLoading]         = useState(true)
  const [trades, setTrades]           = useState([])
  const [dailyNotes, setDailyNotes]   = useState([])
  const [accounts, setAccounts]       = useState([])
  const [activeAccountId, setActiveAccountId] = useState(null)
  const [page, setPage]               = useState('dashboard')
  const [darkMode, setDark]           = useState(() => localStorage.getItem('tt26_dark') === 'true')
  const [toast, setToastMsg]          = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode)
    localStorage.setItem('tt26_dark', darkMode)
  }, [darkMode])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadAll(session.user.id)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadAll(session.user.id)
      else { setTrades([]); setDailyNotes([]); setAccounts([]); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadAll(userId) {
    try {
      setLoading(true)
      const [t, n, accts] = await Promise.all([
        fetchTrades(userId),
        fetchDailyNotes(userId),
        fetchAccounts(userId),
      ])

      // If no accounts exist yet, create a default one
      let accountList = accts || []
      if (accountList.length === 0) {
        const defaultAccount = await createAccount({
          user_id: userId,
          name: 'Main Account',
          starting_balance: 100000,
          currency: 'USD',
          account_type: 'Live',
          color: '#2563EB',
          is_default: true,
        })
        accountList = [defaultAccount]
      }

      setAccounts(accountList)
      setTrades(t || [])
      setDailyNotes(n || [])

      // Restore last active account or use first
      const savedId = localStorage.getItem('tt26_active_account')
      const validId = accountList.find(a => a.id === savedId)?.id || accountList[0]?.id
      setActiveAccountId(validId)

    } catch (err) {
      console.error('Load error:', err)
      showToast('Error loading data')
    } finally {
      setLoading(false)
    }
  }

  // Trades filtered to active account
  const accountTrades = useMemo(() =>
    trades.filter(t => t.account_id === activeAccountId || (!t.account_id && accounts.length <= 1)),
    [trades, activeAccountId, accounts]
  )

  // Notes filtered to active account
  const accountNotes = useMemo(() =>
    dailyNotes.filter(n => n.account_id === activeAccountId || (!n.account_id && accounts.length <= 1)),
    [dailyNotes, activeAccountId, accounts]
  )

  // Active account object
  const activeAccount = useMemo(() =>
    accounts.find(a => a.id === activeAccountId),
    [accounts, activeAccountId]
  )

  const startingBalance = activeAccount?.starting_balance || 100000

  function showToast(msg) {
    setToastMsg(msg); setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2500)
  }

  // ── Account handlers ──────────────────────────────────────────
  function handleSwitchAccount(id) {
    setActiveAccountId(id)
    localStorage.setItem('tt26_active_account', id)
    showToast(`Switched to ${accounts.find(a => a.id === id)?.name}`)
  }

  async function handleCreateAccount(data) {
    if (!user) return
    try {
      const acc = await createAccount({ ...data, user_id: user.id })
      setAccounts(prev => [...prev, acc])
      setActiveAccountId(acc.id)
      localStorage.setItem('tt26_active_account', acc.id)
      showToast(`Account "${acc.name}" created ✓`)
    } catch (err) { showToast('Error creating account: ' + err.message) }
  }

  async function handleEditAccount(id, updates) {
    try {
      const acc = await updateAccount(id, updates)
      setAccounts(prev => prev.map(a => a.id === id ? acc : a))
      showToast('Account updated ✓')
    } catch (err) { showToast('Error updating account: ' + err.message) }
  }

  async function handleDeleteAccount(id) {
    try {
      await deleteAccount(id)
      setAccounts(prev => prev.filter(a => a.id !== id))
      setTrades(prev => prev.filter(t => t.account_id !== id))
      setDailyNotes(prev => prev.filter(n => n.account_id !== id))
      const remaining = accounts.filter(a => a.id !== id)
      if (remaining.length > 0) {
        setActiveAccountId(remaining[0].id)
        localStorage.setItem('tt26_active_account', remaining[0].id)
      }
      showToast('Account deleted')
    } catch (err) { showToast('Error deleting account: ' + err.message) }
  }

  // ── Trade handlers ────────────────────────────────────────────
  async function handleAdd(tradeData) {
    if (!user) return
    try {
      const t = await insertTrade({ ...tradeData, user_id: user.id, account_id: activeAccountId })
      setTrades(prev => [...prev, t].sort((a,b) => a.date.localeCompare(b.date)))
    } catch (err) { showToast('Error saving: ' + err.message) }
  }

  async function handleEdit(id, updates) {
    try {
      const t = await updateTrade(id, updates)
      setTrades(prev => prev.map(x => x.id === id ? t : x).sort((a,b) => a.date.localeCompare(b.date)))
    } catch (err) { showToast('Error updating: ' + err.message) }
  }

  async function handleDelete(id) {
    try {
      await deleteTrade(id)
      setTrades(prev => prev.filter(t => t.id !== id))
    } catch (err) { showToast('Error deleting: ' + err.message) }
  }

  // ── Note handlers ─────────────────────────────────────────────
  async function handleSaveNote(noteData) {
    if (!user) return
    try {
      const n = await upsertDailyNote({ ...noteData, user_id: user.id, account_id: activeAccountId })
      setDailyNotes(prev => {
        const filtered = prev.filter(x => !(x.date === n.date && x.account_id === n.account_id))
        return [...filtered, n].sort((a,b) => b.date.localeCompare(a.date))
      })
      return n
    } catch (err) { showToast('Error saving note: ' + err.message); throw err }
  }

  async function handleDeleteNote(id) {
    try {
      await deleteDailyNote(id)
      setDailyNotes(prev => prev.filter(n => n.id !== id))
    } catch (err) { showToast('Error deleting note: ' + err.message) }
  }

  // ── Export / Import ───────────────────────────────────────────
  function handleExport() {
    const blob = new Blob([JSON.stringify({
      trades: accountTrades, dailyNotes: accountNotes,
      account: activeAccount,
      exportedAt: new Date().toISOString(), v: '4.0'
    }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `tradetracker_${activeAccount?.name?.replace(/\s+/g,'_') || 'export'}_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    showToast('Exported ✓')
  }

  function handleImport(e) {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      try {
        const data = JSON.parse(ev.target.result)
        if (data.trades && Array.isArray(data.trades)) {
          if (window.confirm(`Import ${data.trades.length} trades into "${activeAccount?.name}"?`)) {
            const existing = new Set(trades.map(t => t.id))
            let added = 0
            for (const t of data.trades) {
              if (!existing.has(t.id)) {
                const { id, user_id, created_at, account_id, ...clean } = t
                await handleAdd(clean); added++
              }
            }
            if (data.dailyNotes) {
              for (const n of data.dailyNotes) {
                const { id, user_id, created_at, updated_at, account_id, ...clean } = n
                await handleSaveNote(clean)
              }
            }
            showToast(`${added} trades imported ✓`)
          }
        } else showToast('Invalid file format')
      } catch { showToast('Could not read file') }
    }
    reader.readAsText(file); e.target.value = ''
  }

  async function handleSignOut() {
    await signOut(); setUser(null); setTrades([]); setDailyNotes([]); setAccounts([])
  }

  function handleNav(id) {
    setPage(id); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Loading screen ────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text)' }}>Trade<span style={{ color: 'var(--blue)' }}>Tracker</span></div>
      <div style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTop: '3px solid var(--blue)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  if (!user) return <AuthPage onAuth={u => { setUser(u); loadAll(u.id) }} />

  const pageProps = { trades: accountTrades, toast: showToast, startingBalance, currency: activeAccount?.currency || 'USD' }

  return (
    <>
      <Layout
        page={page} onNav={handleNav}
        trades={accountTrades} user={user}
        onSignOut={handleSignOut}
        onExport={handleExport} onImport={handleImport}
        darkMode={darkMode} onToggleDark={() => setDark(d => !d)}
        accounts={accounts} activeAccountId={activeAccountId} startingBalance={startingBalance}
        onSwitchAccount={handleSwitchAccount}
        onCreateAccount={handleCreateAccount}
        onEditAccount={handleEditAccount}
        onDeleteAccount={handleDeleteAccount}
      >
        {page === 'dashboard' && <Dashboard {...pageProps} />}
        {page === 'log'       && <TradeLog  {...pageProps} onAdd={handleAdd} onEdit={handleEdit} onDelete={handleDelete} />}
        {page === 'calendar'  && <Calendar  trades={accountTrades} dailyNotes={accountNotes} onSaveNote={handleSaveNote} onDeleteNote={handleDeleteNote} toast={showToast} />}
        {page === 'news'      && <NewsTab />}
        {page === 'analysis'  && <Analysis  {...pageProps} />}
        {page === 'playbook'  && <Playbook />}
      </Layout>
      <div className={`toast ${toastVisible ? 'show' : ''}`}>{toast}</div>
    </>
  )
}
