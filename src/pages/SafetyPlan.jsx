import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { saveSafetyPlan, getSafetyPlan } from '../api/client'
import { Save, Loader2, CheckCircle, ChevronLeft, CloudUpload, CloudDownload } from 'lucide-react'

const STEPS = [
  { key: 'warningSigns',         label: 'Warning signs',               hint: 'What tells you that a crisis might be coming? (thoughts, feelings, behaviors)' },
  { key: 'copingStrategies',     label: 'Internal coping strategies',  hint: 'Things I can do on my own to take my mind off my problems' },
  { key: 'socialDistractions',   label: 'Social distractions',         hint: 'People and settings that provide distraction and support' },
  { key: 'trustedContacts',      label: 'People I can ask for help',   hint: 'Name and contact for people I trust' },
  { key: 'professionalResources',label: 'Professional resources',      hint: 'Therapist, doctor, crisis lines (e.g. 988)' },
  { key: 'environmentSafety',    label: 'Making the environment safe', hint: 'Steps to remove or reduce access to means of self-harm' },
]

const LOCAL_KEY = 'safepoint_safety_plan'
const AUTH_KEY  = 'sp_user'

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null') || {} }
  catch { return {} }
}

function getLoggedInUser() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null') }
  catch { return null }
}

export default function SafetyPlan() {
  const navigate = useNavigate()
  const [plan, setPlan]             = useState(loadLocal)
  const [localSaved, setLocalSaved] = useState(false)
  const [serverLoading, setServerLoading]   = useState(false)
  const [serverSaved, setServerSaved]       = useState(false)
  const [serverRestored, setServerRestored] = useState(false)
  const [error, setError]           = useState(null)

  const user = getLoggedInUser()
  const isLoggedIn = !!user?.username

  const handleSaveLocal = () => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(plan))
      setLocalSaved(true)
      setTimeout(() => setLocalSaved(false), 2500)
    } catch {
      setError('Could not save locally.')
    }
  }

  const handleBackup = async () => {
    if (!isLoggedIn) return
    setServerLoading('backup')
    setError(null)
    try {
      await saveSafetyPlan({ userCode: user.username, pin: user.pin, ...plan })
      setServerSaved(true)
      setTimeout(() => setServerSaved(false), 2500)
    } catch {
      setError('Could not back up. Please try again.')
    } finally {
      setServerLoading(false)
    }
  }

  const handleRestore = async () => {
    if (!isLoggedIn) return
    setServerLoading('restore')
    setError(null)
    try {
      const data = await getSafetyPlan(user.username, user.pin)
      const restored = {
        warningSigns:          data.warningSigns          || '',
        copingStrategies:      data.copingStrategies      || '',
        socialDistractions:    data.socialDistractions    || '',
        trustedContacts:       data.trustedContacts        || '',
        professionalResources: data.professionalResources || '',
        environmentSafety:     data.environmentSafety     || '',
      }
      setPlan(restored)
      localStorage.setItem(LOCAL_KEY, JSON.stringify(restored))
      setServerRestored(true)
      setTimeout(() => setServerRestored(false), 2500)
    } catch {
      setError('Could not restore. Please try again.')
    } finally {
      setServerLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-8">

      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate('/')} style={{ color: 'var(--muted)' }}>
          <ChevronLeft size={22} />
        </button>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.8rem' }}>
          My Safety Plan
        </h2>
      </div>
      <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
        Based on the Stanley-Brown Safety Planning Intervention.
      </p>

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

      {/* Actions */}
      <div className="flex flex-col gap-3">

        {/* Save locally */}
        <button
          onClick={handleSaveLocal}
          className="flex items-center justify-center gap-2 py-3 rounded-xl font-medium"
          style={{
            background: localSaved ? 'var(--low)' : 'var(--sage-dark)',
            color: 'var(--white)',
          }}>
          {localSaved
            ? <><CheckCircle size={18} /> Saved locally!</>
            : <><Save size={18} /> Save locally</>}
        </button>

        {/* Server backup/restore */}
        <div className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--sand-dark)', background: 'var(--white)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--sand-dark)' }}>
            <p className="text-xs font-semibold" style={{ color: 'var(--charcoal)' }}>
              Server backup
            </p>
            {isLoggedIn ? (
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                Signed in as <strong style={{ color: 'var(--charcoal)' }}>{user.username}</strong>
              </span>
            ) : (
              <Link to="/auth"
                className="text-xs font-medium underline"
                style={{ color: 'var(--sage-dark)' }}>
                Sign in to enable
              </Link>
            )}
          </div>

          {/* Buttons */}
          <div className="flex">
            <button
              onClick={handleBackup}
              disabled={!isLoggedIn || serverLoading !== false}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium"
              style={{
                background: serverSaved ? '#EDF4EE' : 'none',
                color: serverSaved ? 'var(--low)' : isLoggedIn ? 'var(--charcoal)' : 'var(--muted)',
                borderRight: '1px solid var(--sand-dark)',
                opacity: !isLoggedIn ? 0.45 : 1,
                cursor: isLoggedIn && !serverLoading ? 'pointer' : 'default',
                border: 'none',
                borderRight: '1px solid var(--sand-dark)',
              }}>
              {serverLoading === 'backup'
                ? <><Loader2 size={15} className="animate-spin" /> Saving...</>
                : serverSaved
                  ? <><CheckCircle size={15} /> Backed up!</>
                  : <><CloudUpload size={15} /> Back up</>}
            </button>

            <button
              onClick={handleRestore}
              disabled={!isLoggedIn || serverLoading !== false}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium"
              style={{
                background: serverRestored ? '#EDF4EE' : 'none',
                color: serverRestored ? 'var(--low)' : isLoggedIn ? 'var(--charcoal)' : 'var(--muted)',
                opacity: !isLoggedIn ? 0.45 : 1,
                cursor: isLoggedIn && !serverLoading ? 'pointer' : 'default',
                border: 'none',
              }}>
              {serverLoading === 'restore'
                ? <><Loader2 size={15} className="animate-spin" /> Restoring...</>
                : serverRestored
                  ? <><CheckCircle size={15} /> Restored!</>
                  : <><CloudDownload size={15} /> Restore</>}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
