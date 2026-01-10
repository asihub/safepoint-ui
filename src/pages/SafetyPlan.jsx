import { useState, useEffect } from 'react'
import { saveSafetyPlan, getSafetyPlan } from '../api/client'
import { Save, Loader2, CheckCircle } from 'lucide-react'

const STEPS = [
  { key: 'warningSigns', label: 'Warning signs', hint: 'What tells you that a crisis might be coming? (thoughts, feelings, behaviors)' },
  { key: 'copingStrategies', label: 'Internal coping strategies', hint: 'Things I can do on my own to take my mind off my problems' },
  { key: 'socialDistractions', label: 'Social distractions', hint: 'People and settings that provide distraction and support' },
  { key: 'trustedContacts', label: 'People I can ask for help', hint: 'Name and contact for people I trust' },
  { key: 'professionalResources', label: 'Professional resources', hint: 'Therapist, doctor, crisis lines (e.g. 988)' },
  { key: 'environmentSafety', label: 'Making the environment safe', hint: 'Steps to remove or reduce access to means of self-harm' },
]

export default function SafetyPlan() {
  const [userCode, setUserCode] = useState('')
  const [pin, setPin] = useState('')
  const [plan, setPlan] = useState({})
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)
  const [loaded, setLoaded] = useState(false)

  const handleLoad = async () => {
    if (!userCode || !pin) return
    setLoading(true)
    setError(null)
    try {
      const data = await getSafetyPlan(userCode, pin)
      setPlan({
        warningSigns: data.warningSigns || '',
        copingStrategies: data.copingStrategies || '',
        socialDistractions: data.socialDistractions || '',
        trustedContacts: data.trustedContacts || '',
        professionalResources: data.professionalResources || '',
        environmentSafety: data.environmentSafety || '',
      })
      setLoaded(true)
    } catch {
      setError('No safety plan found for this code and PIN.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!userCode || !pin) return
    setLoading(true)
    setError(null)
    try {
      await saveSafetyPlan({ userCode, pin, ...plan })
      setSaved(true)
      setLoaded(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Could not save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-8">
      <h2
        className="mb-2"
        style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.8rem' }}
      >
        My Safety Plan
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
        Based on the Stanley-Brown Safety Planning Intervention.
        Your plan is saved securely using your code and PIN only.
      </p>

      {/* Credentials */}
      <div className="rounded-2xl p-4 mb-6" style={{ background: 'var(--white)' }}>
        <div className="flex gap-3 mb-3">
          <input
            value={userCode}
            onChange={e => setUserCode(e.target.value)}
            placeholder="Your code (e.g. blue-river-42)"
            className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
            style={{ borderColor: 'var(--sand-dark)', fontFamily: "'DM Sans', sans-serif" }}
          />
          <input
            value={pin}
            onChange={e => setPin(e.target.value)}
            placeholder="PIN"
            type="password"
            maxLength={6}
            className="w-20 px-3 py-2 rounded-lg border text-sm outline-none"
            style={{ borderColor: 'var(--sand-dark)', fontFamily: "'DM Sans', sans-serif" }}
          />
        </div>
        <button
          onClick={handleLoad}
          className="text-sm px-4 py-2 rounded-lg"
          style={{ background: 'var(--sand-dark)', color: 'var(--charcoal)' }}
        >
          Load existing plan
        </button>
        <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
          No account? Register at <a href="/auth" className="underline">Auth page</a> to get a code.
        </p>
      </div>

      {/* Plan steps */}
      <div className="flex flex-col gap-4 mb-6">
        {STEPS.map((step, i) => (
          <div key={step.key}>
            <label className="text-sm font-medium mb-1 block" style={{ color: 'var(--charcoal)' }}>
              {i + 1}. {step.label}
            </label>
            <p className="text-xs mb-2" style={{ color: 'var(--muted)' }}>{step.hint}</p>
            <textarea
              value={plan[step.key] || ''}
              onChange={e => setPlan(prev => ({ ...prev, [step.key]: e.target.value }))}
              rows={3}
              className="w-full p-3 rounded-xl border text-sm resize-none outline-none"
              style={{
                background: 'var(--white)',
                borderColor: 'var(--sand-dark)',
                fontFamily: "'DM Sans', sans-serif",
                lineHeight: 1.5,
              }}
            />
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm mb-3" style={{ color: 'var(--high)' }}>{error}</p>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={loading || !userCode || !pin}
        className="flex items-center justify-center gap-2 py-3 rounded-xl font-medium"
        style={{
          background: saved ? 'var(--low)' : 'var(--sage-dark)',
          color: 'var(--white)',
        }}
      >
        {loading ? (
          <><Loader2 size={18} className="animate-spin" /> Saving...</>
        ) : saved ? (
          <><CheckCircle size={18} /> Saved!</>
        ) : (
          <><Save size={18} /> Save safety plan</>
        )}
      </button>
    </div>
  )
}
