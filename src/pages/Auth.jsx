import { useState } from 'react'
import { registerUser, verifyUser } from '../api/client'
import { Copy, CheckCircle, Loader2 } from 'lucide-react'

export default function Auth() {
  const [tab, setTab] = useState('register')
  const [pin, setPin] = useState('')
  const [userCode, setUserCode] = useState('')
  const [verifyPin, setVerifyPin] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleRegister = async () => {
    if (!/^\d{4,6}$/.test(pin)) {
      setError('PIN must be 4-6 digits')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await registerUser(pin)
      setResult(data)
    } catch {
      setError('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await verifyUser(userCode, verifyPin)
      setResult(data)
    } catch {
      setError('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(result.userCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex-1 flex flex-col max-w-sm mx-auto w-full px-6 py-8">
      <h2
        className="mb-2"
        style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.8rem' }}
      >
        Anonymous Identity
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
        No email or name required. Your code and PIN are the only way to access your data.
      </p>

      {/* Tabs */}
      <div
        className="flex rounded-xl p-1 mb-6"
        style={{ background: 'var(--sand-dark)' }}
      >
        {['register', 'verify'].map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setResult(null); setError(null) }}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: tab === t ? 'var(--white)' : 'transparent',
              color: tab === t ? 'var(--charcoal)' : 'var(--muted)',
            }}
          >
            {t === 'register' ? 'New user' : 'Return user'}
          </button>
        ))}
      </div>

      {tab === 'register' ? (
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>
              Choose a PIN (4-6 digits)
            </label>
            <input
              value={pin}
              onChange={e => setPin(e.target.value)}
              type="password"
              maxLength={6}
              placeholder="e.g. 1234"
              className="w-full px-4 py-3 rounded-xl border outline-none"
              style={{ borderColor: 'var(--sand-dark)', fontFamily: "'DM Sans', sans-serif" }}
            />
          </div>

          {error && <p className="text-sm" style={{ color: 'var(--high)' }}>{error}</p>}

          <button
            onClick={handleRegister}
            disabled={loading}
            className="flex items-center justify-center gap-2 py-3 rounded-xl font-medium"
            style={{ background: 'var(--sage-dark)', color: 'var(--white)' }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Generate my code'}
          </button>

          {result?.userCode && (
            <div
              className="rounded-2xl p-4 mt-2"
              style={{ background: '#EDF4EE', border: '1px solid var(--sage-light)' }}
            >
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--sage-dark)' }}>
                Your anonymous code
              </p>
              <div className="flex items-center justify-between">
                <span
                  className="font-mono text-lg font-semibold"
                  style={{ color: 'var(--charcoal)' }}
                >
                  {result.userCode}
                </span>
                <button onClick={copyCode} style={{ color: 'var(--sage-dark)' }}>
                  {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                </button>
              </div>
              <p className="text-xs mt-3" style={{ color: 'var(--muted)' }}>
                Save this code. You will need it together with your PIN to access your safety plan from another device.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <input
            value={userCode}
            onChange={e => setUserCode(e.target.value)}
            placeholder="Your code (e.g. blue-river-42)"
            className="w-full px-4 py-3 rounded-xl border outline-none text-sm"
            style={{ borderColor: 'var(--sand-dark)', fontFamily: "'DM Sans', sans-serif" }}
          />
          <input
            value={verifyPin}
            onChange={e => setVerifyPin(e.target.value)}
            type="password"
            maxLength={6}
            placeholder="Your PIN"
            className="w-full px-4 py-3 rounded-xl border outline-none text-sm"
            style={{ borderColor: 'var(--sand-dark)', fontFamily: "'DM Sans', sans-serif" }}
          />

          {error && <p className="text-sm" style={{ color: 'var(--high)' }}>{error}</p>}

          <button
            onClick={handleVerify}
            disabled={loading}
            className="flex items-center justify-center gap-2 py-3 rounded-xl font-medium"
            style={{ background: 'var(--sage-dark)', color: 'var(--white)' }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Verify credentials'}
          </button>

          {result && (
            <div
              className="rounded-xl p-4 flex items-center gap-3"
              style={{
                background: result.valid ? '#EDF4EE' : '#FDECEA',
                color: result.valid ? 'var(--sage-dark)' : 'var(--high)',
              }}
            >
              <CheckCircle size={18} />
              <span className="text-sm font-medium">
                {result.valid ? 'Credentials verified successfully.' : 'Invalid code or PIN.'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
