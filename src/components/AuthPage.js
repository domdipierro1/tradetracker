import { useState } from 'react'
import { signIn, signUp } from '../lib/supabase'

export default function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    try {
      if (mode === 'login') {
        const { data, error } = await signIn(email, password)
        if (error) throw error
        onAuth(data.user)
      } else {
        const { error } = await signUp(email, password)
        if (error) throw error
        setSuccess('Account created! Check your email to confirm, then log in.')
        setMode('login')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text)', letterSpacing: '-.02em' }}>
            Trade<span style={{ color: 'var(--blue)' }}>Tracker</span>
          </div>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: '4px' }}>ICT / SMC Journal '26</div>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '28px', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text)', marginBottom: '20px' }}>
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>

              {error && <div style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-dim)', borderRadius: 'var(--r-xs)', padding: '10px 12px', fontSize: '12px', fontWeight: '600' }}>{error}</div>}
              {success && <div style={{ background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green-dim)', borderRadius: 'var(--r-xs)', padding: '10px 12px', fontSize: '12px', fontWeight: '600' }}>{success}</div>}

              <button className="btn btn-blue" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '13px', marginTop: '4px' }}>
                {loading ? <span className="spin" style={{ fontSize: '16px' }}>⏳</span> : mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </div>
          </form>

          <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '12px', color: 'var(--muted)' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess(''); }}
              style={{ color: 'var(--blue)', fontWeight: '700', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: 'var(--muted2)' }}>
          Your data is securely stored and syncs across all your devices.
        </div>
      </div>
    </div>
  )
}
