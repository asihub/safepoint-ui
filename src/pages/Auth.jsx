import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerUser, verifyUser, deleteUser } from '../api/client'
import { Copy, CheckCircle, Loader2, ChevronLeft, User, Trash2, Info } from 'lucide-react'

const STORAGE_KEY = 'sp_user'

function loadLocalUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveLocalUser(userCode) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ userCode }))
}

function clearLocalUser() {
  localStorage.removeItem(STORAGE_KEY)
}

function generatePin() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

const ADJECTIVES = ['calm', 'bright', 'pure', 'safe', 'kind', 'warm', 'clear', 'soft', 'bold', 'wise']
const NOUNS      = ['path', 'wave', 'step', 'hope', 'dawn', 'lake', 'peak', 'star', 'moon', 'tree']

function generateUsername() {
  const adj  = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const num  = Math.floor(10 + Math.random() * 90)
  return `${adj}-${noun}-${num}`
}

export default function Auth() {
  const navigate  = useNavigate()
  const [mode,    setMode]    = useState(null)      // null | 'loggedIn' | 'register' | 'signin'
  const [user,    setUser]    = useState(null)       // { userCode }
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [copied,  setCopied]  = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Form fields
  const [username,  setUsername]  = useState(generateUsername)
  const [pin,       setPin]       = useState(generatePin)
  const [userCode,  setUserCode]  = useState('')
  const [verifyPin, setVerifyPin] = useState('')

  // On mount — check localStorage
  useEffect(() => {
    const local = loadLocalUser()
    if (local?.userCode) {
      setUser(local)
      setMode('loggedIn')
    } else {
      setMode('choice') // show register / sign in choice
    }
  }, [])

  // ── Register ──────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!username.trim()) { setError('Please enter or generate a username'); return }
    if (!/^[a-z0-9-]{1,20}$/.test(username.trim())) { setError('Username must be max 20 characters: letters, digits and - only'); return }
    if (!/^\d{4}$/.test(pin)) { setError('PIN must be exactly 4 digits'); return }
    setLoading(true); setError(null)
    try {
      const data = await registerUser(pin, username.trim())
      saveLocalUser(data.userCode)
      setUser({ userCode: data.userCode })
      setMode('loggedIn')
    } catch {
      setError('Registration failed. Please try again.')
    } finally { setLoading(false) }
  }

  // ── Sign in ───────────────────────────────────────────────────────────────
  const handleSignIn = async () => {
    if (!userCode.trim() || !verifyPin.trim()) { setError('Please enter your code and PIN'); return }
    setLoading(true); setError(null)
    try {
      const data = await verifyUser(userCode.trim(), verifyPin)
      if (data.valid) {
        saveLocalUser(userCode.trim())
        setUser({ userCode: userCode.trim() })
        setMode('loggedIn')
      } else {
        setError('Invalid code or PIN. Please try again.')
      }
    } catch {
      setError('Sign in failed. Please try again.')
    } finally { setLoading(false) }
  }

  // ── Delete account ────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setLoading(true); setError(null)
    try {
      await deleteUser(user.userCode, verifyPin)
      clearLocalUser()
      setUser(null)
      setConfirmDelete(false)
      setVerifyPin('')
      setMode('choice')
    } catch {
      setError('Failed to delete account. Please try again.')
    } finally { setLoading(false) }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(user.userCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const signOut = () => {
    clearLocalUser()
    setUser(null)
    setMode('choice')
    setConfirmDelete(false)
    setVerifyPin('')
    setError(null)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} style={{ color: 'var(--muted)' }}>
          <ChevronLeft size={22} />
        </button>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.8rem' }}>
          My Account
        </h2>
      </div>

      {/* ── Logged in ── */}
      {mode === 'loggedIn' && user && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--sand-dark)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'var(--sand-dark)' }}>
                <User size={18} style={{ color: 'var(--muted)' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Your anonymous code</p>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold" style={{ color: 'var(--charcoal)' }}>
                    {user.userCode}
                  </span>
                  <button onClick={copyCode} style={{ color: 'var(--sage-dark)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    {copied ? <CheckCircle size={15} /> : <Copy size={15} />}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Use this code and your PIN to access your safety plan from another device. No email or name is stored.
            </p>
          </div>

          <button onClick={signOut}
            className="py-3 rounded-xl border font-medium text-sm"
            style={{ borderColor: 'var(--sand-dark)', color: 'var(--muted)', background: 'none' }}>
            Sign out from this device
          </button>

          {/* Delete account */}
          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)}
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm"
              style={{ color: 'var(--high)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <Trash2 size={15} /> Delete my account
            </button>
          ) : (
            <div className="rounded-2xl p-4" style={{ background: '#FDECEA', border: '1px solid #f0b4b4' }}>
              <p className="text-sm font-medium mb-3" style={{ color: '#a32d2d' }}>
                Enter your PIN to confirm account deletion. This cannot be undone.
              </p>
              <input value={verifyPin} onChange={e => setVerifyPin(e.target.value)}
                type="password" maxLength={6} placeholder="Your PIN"
                className="w-full px-4 py-3 rounded-xl border outline-none text-sm mb-3"
                style={{ borderColor: '#f0b4b4', fontFamily: "'DM Sans', sans-serif" }} />
              {error && <p className="text-xs mb-2" style={{ color: '#a32d2d' }}>{error}</p>}
              <div className="flex gap-2">
                <button onClick={handleDelete} disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium"
                  style={{ background: 'var(--high)', color: 'var(--white)', border: 'none', cursor: 'pointer' }}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Delete account'}
                </button>
                <button onClick={() => { setConfirmDelete(false); setVerifyPin(''); setError(null) }}
                  className="px-4 py-2 rounded-xl text-sm border"
                  style={{ borderColor: '#f0b4b4', color: '#a32d2d', background: 'none', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Choice ── */}
      {mode === 'choice' && (
        <div className="flex flex-col gap-4">
          <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>
            No email or name required. Your code and PIN are the only way to access your data.
          </p>
          <button onClick={() => { setMode('register'); setError(null) }}
            className="flex flex-col items-start px-5 py-4 rounded-2xl font-medium text-left"
            style={{ background: 'var(--sage-dark)', color: 'var(--white)', border: 'none', cursor: 'pointer' }}>
            <span className="text-base">Create account</span>
            <span className="text-xs font-normal mt-0.5" style={{ opacity: 0.8 }}>Get an anonymous code and PIN</span>
          </button>
          <button onClick={() => { setMode('signin'); setError(null) }}
            className="flex flex-col items-start px-5 py-4 rounded-2xl font-medium text-left"
            style={{ background: 'var(--white)', color: 'var(--charcoal)', border: '1px solid var(--sand-dark)', cursor: 'pointer' }}>
            <span className="text-base">I already have a code</span>
            <span className="text-xs font-normal mt-0.5" style={{ color: 'var(--muted)' }}>Sign in with your code and PIN</span>
          </button>
        </div>
      )}

      {/* ── Register ── */}
      {mode === 'register' && (
        <div className="flex flex-col gap-4">
          <button onClick={() => { setMode('choice'); setError(null) }}
            className="flex items-center gap-1 text-sm mb-2"
            style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            ← Back
          </button>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                Username
              </label>
              <button onClick={() => setUsername(generateUsername())}
                className="text-xs"
                style={{ color: 'var(--sage-dark)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Generate
              </button>
            </div>
            <input value={username} onChange={e => setUsername(e.target.value)}
              type="text" maxLength={20} placeholder="e.g. pure-path-79" autoComplete="off"
              className="w-full px-4 py-3 rounded-xl border outline-none"
              style={{ borderColor: 'var(--sand-dark)', fontFamily: "'DM Sans', sans-serif" }} />

          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                PIN (4 digits)
              </label>
              <button onClick={() => setPin(generatePin())}
                className="text-xs"
                style={{ color: 'var(--sage-dark)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Generate
              </button>
            </div>
            <input value={pin} onChange={e => setPin(e.target.value)}
              type="text" inputMode="numeric" maxLength={4} placeholder="e.g. 1234"
              className="w-full px-4 py-3 rounded-xl border outline-none"
              style={{ borderColor: 'var(--sand-dark)', fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.15em' }} />

          </div>
          {error && <p className="text-sm" style={{ color: 'var(--high)' }}>{error}</p>}
          <div className="flex items-start gap-2 mt-1"
            style={{ borderTop: '1px solid var(--sand-dark)', paddingTop: '0.75rem' }}>
            <Info size={13} style={{ color: 'var(--muted)', flexShrink: 0, marginTop: 1 }} />
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Save your username and PIN — you will need them to access your data.
            </p>
          </div>
          <button onClick={handleRegister} disabled={loading}
            className="flex items-center justify-center gap-2 py-3 rounded-xl font-medium"
            style={{ background: 'var(--sage-dark)', color: 'var(--white)', border: 'none', cursor: 'pointer' }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Create Account'}
          </button>
        </div>
      )}

      {/* ── Sign in ── */}
      {mode === 'signin' && (
        <div className="flex flex-col gap-4">
          <button onClick={() => { setMode('choice'); setError(null) }}
            className="flex items-center gap-1 text-sm mb-2"
            style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            ← Back
          </button>
          <input value={userCode} onChange={e => setUserCode(e.target.value)}
            placeholder="Your code (e.g. pure-path-79)" autoComplete="off"
            className="w-full px-4 py-3 rounded-xl border outline-none text-sm"
            style={{ borderColor: 'var(--sand-dark)', fontFamily: "'DM Sans', sans-serif" }} />
          <input value={verifyPin} onChange={e => setVerifyPin(e.target.value)}
            type="password" maxLength={6} placeholder="Your PIN"
            className="w-full px-4 py-3 rounded-xl border outline-none text-sm"
            style={{ borderColor: 'var(--sand-dark)', fontFamily: "'DM Sans', sans-serif" }} />
          {error && <p className="text-sm" style={{ color: 'var(--high)' }}>{error}</p>}
          <button onClick={handleSignIn} disabled={loading}
            className="flex items-center justify-center gap-2 py-3 rounded-xl font-medium"
            style={{ background: 'var(--sage-dark)', color: 'var(--white)', border: 'none', cursor: 'pointer' }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Sign in'}
          </button>
        </div>
      )}

    </div>
  )
}
