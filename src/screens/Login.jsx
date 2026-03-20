import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    if (!email || !password) {
      setError('Enter your email and password')
      return
    }
    setLoading(true)
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      setError('Wrong email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary flex flex-col justify-between px-6 py-16">

      {/* Top */}
      <div className="flex flex-col gap-1 mt-8">
        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z" />
          </svg>
        </div>
        <h1 className="font-display font-bold text-white text-3xl">GA Builders</h1>
        <p className="text-white/50 text-sm mt-1">Your property intelligence</p>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            autoComplete="email"
            className="w-full bg-white/10 rounded-xl px-4 py-4 text-white placeholder-white/30 outline-none focus:bg-white/15 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full bg-white/10 rounded-xl px-4 py-4 text-white placeholder-white/30 outline-none focus:bg-white/15 transition-colors"
          />
        </div>

        {error && (
          <p className="text-red-300 text-sm bg-red-500/10 rounded-xl px-4 py-3">{error}</p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-white text-primary font-display font-bold text-base py-4 rounded-2xl mt-2 active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </div>

      {/* Bottom hint */}
      <p className="text-white/20 text-xs text-center">
        Create your account in Firebase Console → Authentication → Users
      </p>

    </div>
  )
}
