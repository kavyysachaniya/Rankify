import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function AuthScreen() {
  const { login, signup } = useAuth()
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = mode === 'login'
      ? await login(username, password)
      : await signup(username, displayName, password)

    setLoading(false)
    if (!result.ok) setError(result.error)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">Rankify</h1>
          <p className="text-gray-500 text-sm">
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#141416] border border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-[0_8px_60px_rgba(0,0,0,0.4)]">
          <div>
            <label className="block text-gray-400 text-xs font-semibold tracking-wider uppercase mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. john_doe"
              className="w-full bg-white/[0.05] text-white rounded-lg px-3 py-2.5 outline-none border border-white/[0.08] focus:border-white/20 transition-colors placeholder:text-gray-600"
              autoComplete="username"
            />
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-gray-400 text-xs font-semibold tracking-wider uppercase mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full bg-white/[0.05] text-white rounded-lg px-3 py-2.5 outline-none border border-white/[0.08] focus:border-white/20 transition-colors placeholder:text-gray-600"
              />
            </div>
          )}

          <div>
            <label className="block text-gray-400 text-xs font-semibold tracking-wider uppercase mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="w-full bg-white/[0.05] text-white rounded-lg px-3 py-2.5 pr-10 outline-none border border-white/[0.08] focus:border-white/20 transition-colors placeholder:text-gray-600"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.092 1.092a4 4 0 00-5.558-5.558z" clipRule="evenodd" />
                    <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                    <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold py-2.5 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '...' : mode === 'login' ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <div className="bg-[#141416] border border-white/[0.08] rounded-2xl p-4 text-center">
          {mode === 'login' ? (
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <button onClick={() => { setMode('signup'); setError('') }} className="text-amber-400 font-semibold hover:text-amber-300 cursor-pointer">
                Sign up
              </button>
            </p>
          ) : (
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <button onClick={() => { setMode('login'); setError('') }} className="text-amber-400 font-semibold hover:text-amber-300 cursor-pointer">
                Log in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
