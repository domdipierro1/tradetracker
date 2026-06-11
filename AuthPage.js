import { useState } from 'react'
import { signIn, signUp } from '../lib/supabase'

export default function AuthPage({ onAuth }) {
  const [mode, setMode]         = useState('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

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
        setSuccess('Account created — check your email to confirm, then sign in.')
        setMode('login')
      }
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflow: 'hidden' }}>

      {/* Subtle background grid */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 1px 1px, var(--border) 1px, transparent 0)', backgroundSize: '32px 32px', opacity: .4, pointerEvents: 'none' }} />

      {/* Glow */}
      <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '300px', background: 'radial-gradient(ellipse at center, rgba(45,106,79,.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', overflow: 'hidden', margin: '0 auto 14px' }}>
            <img src="/favicon.svg" alt="logo" style={{ width: '100%', height: '100%', display: 'block' }} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text)', letterSpacing: '-.03em', lineHeight: 1 }}>
            Trade<span style={{ color: 'var(--blue)' }}>Tracker</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '6px', fontWeight: '400' }}>
            ICT / SMC Trading Journal
          </div>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '28px', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text)', marginBottom: '6px', letterSpacing: '-.02em' }}>
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '24px' }}>
            {mode === 'login' ? 'Sign in to your account to continue' : 'Start tracking your trades today'}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Email address</label>
                <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>

              {error && (
                <div style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-dim)', borderRadius: 'var(--r-xs)', padding: '10px 12px', fontSize: '12px', fontWeight: '500', lineHeight: '1.5' }}>
                  {error}
                </div>
              )}
              {success && (
                <div style={{ background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green-dim)', borderRadius: 'var(--r-xs)', padding: '10px 12px', fontSize: '12px', fontWeight: '500', lineHeight: '1.5' }}>
                  {success}
                </div>
              )}

              <button className="btn btn-blue" type="submit" disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: '13px', fontWeight: '600', marginTop: '4px', letterSpacing: '-.01em' }}>
                {loading
                  ? <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,.3)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
                  : mode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </div>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'var(--muted)' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess('') }}
              style={{ color: 'var(--blue)', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
              {mode === 'login' ? 'Sign up free' : 'Sign in'}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '11px', color: 'var(--muted2)' }}>
          Your data syncs securely across all devices.
        </div>
      </div>
    </div>
  )
}
