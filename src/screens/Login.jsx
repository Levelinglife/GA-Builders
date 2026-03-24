import { useState } from 'react'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    setLoading(true)
    setError('')
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign in was cancelled.')
      } else {
        setError(err.message || 'Failed to sign in. Please try again.')
        console.error(err)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary flex flex-col justify-between px-6 py-16">

      {/* Top */}
      <div className="flex flex-col gap-1 mt-8 text-center items-center">
        <div className="w-20 h-20 rounded-2xl overflow-hidden mb-6 shadow-lg shadow-accent/20">
          <img src="/logo.jpeg" alt="GA Builders" className="w-full h-full object-cover" />
        </div>
        <h1 className="font-display font-bold text-accent text-4xl">GA Builders</h1>
        <p className="text-text-muted text-base mt-2">Your property intelligence</p>
      </div>

      {/* Form Area */}
      <div className="flex flex-col gap-4 items-center">
        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 rounded-xl px-4 py-3 text-center">{error}</p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full max-w-[320px] bg-accent text-primary font-display font-bold text-base py-4 px-6 rounded-full flex items-center justify-center gap-3 mt-2 hover:bg-accent-light active:scale-[0.98] transition-all disabled:opacity-70 shadow-xl shadow-accent/20"
        >
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="truncate">
            {loading ? 'Connecting to Google...' : 'Continue with Google'}
          </span>
        </button>
      </div>

      <p className="text-text-muted/40 text-xs text-center flex-shrink-0">
        Securely powered by Google Sign-In
      </p>

    </div>
  )
}
