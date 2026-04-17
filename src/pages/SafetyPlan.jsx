import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { saveSafetyPlan, getSafetyPlan, deleteSafetyPlan, checkSafetyPlanExists } from '../api/client'
import { Save, Loader2, CheckCircle, ChevronLeft, CloudUpload, CloudDownload, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react'

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

// ── AES-GCM encryption via Web Crypto API ──────────────────────────────────

async function deriveKey(pin) {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(pin), 'PBKDF2', false, ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('safepoint-salt'), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

async function encrypt(text, pin) {
  const key = await deriveKey(pin)
  const iv  = crypto.getRandomValues(new Uint8Array(12))
  const enc = new TextEncoder()
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(text))
  // Pack iv + ciphertext → base64
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), iv.byteLength)
  return btoa(String.fromCharCode(...combined))
}

async function decrypt(b64, pin) {
  const key = await deriveKey(pin)
  const combined = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
  const iv         = combined.slice(0, 12)
  const ciphertext = combined.slice(12)
  const plaintext  = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(plaintext)
}

// ── Helpers ────────────────────────────────────────────────────────────────

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null') || {} }
  catch { return {} }
}

function getLoggedInUser() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null') }
  catch { return null }
}

const EMPTY_PLAN = Object.fromEntries(STEPS.map(s => [s.key, '']))

// ── Component ──────────────────────────────────────────────────────────────

export default function SafetyPlan() {
  const navigate = useNavigate()
  const [plan, setPlan]             = useState(loadLocal)
  const [localSaved, setLocalSaved] = useState(false)
  const [serverLoading, setServerLoading]   = useState(false) // false | 'backup' | 'restore' | 'delete'
  const [serverSaved, setServerSaved]       = useState(false)
  const [serverRestored, setServerRestored] = useState(false)
  const [confirmDelete, setConfirmDelete]   = useState(false)
  const [error, setError]           = useState(null)

  const user       = getLoggedInUser()
  const isLoggedIn = !!(user?.username && user?.pin)
  const [backupExists, setBackupExists] = useState(null) // null=checking, true, false

  useEffect(() => {
    if (!isLoggedIn) { setBackupExists(false); return }
    checkSafetyPlanExists(user.username, user.pin)
      .then(exists => setBackupExists(exists))
      .catch(() => setBackupExists(false))
  }, [isLoggedIn])

  // ── Local save ────────────────────────────────────────────────────────────

  const handleSaveLocal = () => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(plan))
      setLocalSaved(true)
      setTimeout(() => setLocalSaved(false), 2500)
    } catch {
      setError('Could not save locally.')
    }
  }

  // ── Backup ────────────────────────────────────────────────────────────────

  const handleBackup = async () => {
    if (!isLoggedIn) return
    setServerLoading('backup')
    setError(null)
    try {
      const plaintext  = JSON.stringify(plan)
      const ciphertext = await encrypt(plaintext, user.pin)
      await saveSafetyPlan({
        userCode: user.username,
        pin:      user.pin,
        // Store all plan fields as encrypted blob in warningSigns,
        // other fields empty — server just stores whatever we send
        warningSigns:          ciphertext,
        copingStrategies:      '__encrypted__',
        socialDistractions:    '__encrypted__',
        trustedContacts:       '__encrypted__',
        professionalResources: '__encrypted__',
        environmentSafety:     '__encrypted__',
      })
      setBackupExists(true)
      setServerSaved(true)
      setTimeout(() => setServerSaved(false), 2500)
    } catch {
      setError('Could not back up. Please try again.')
    } finally {
      setServerLoading(false)
    }
  }

  // ── Restore ───────────────────────────────────────────────────────────────

  const handleRestore = async () => {
    if (!isLoggedIn) return
    setServerLoading('restore')
    setError(null)
    try {
      const data = await getSafetyPlan(user.username, user.pin)
      // Detect encrypted vs legacy plain-text backup
      let restored
      if (data.copingStrategies === '__encrypted__') {
        const plaintext = await decrypt(data.warningSigns, user.pin)
        restored = JSON.parse(plaintext)
      } else {
        // Legacy: plain text fields
        restored = {
          warningSigns:          data.warningSigns          || '',
          copingStrategies:      data.copingStrategies      || '',
          socialDistractions:    data.socialDistractions    || '',
          trustedContacts:       data.trustedContacts        || '',
          professionalResources: data.professionalResources || '',
          environmentSafety:     data.environmentSafety     || '',
        }
      }
      setPlan(restored)
      localStorage.setItem(LOCAL_KEY, JSON.stringify(restored))
      setServerRestored(true)
      setTimeout(() => setServerRestored(false), 2500)
    } catch {
      setError('Could not restore. The backup may be encrypted with a different PIN.')
    } finally {
      setServerLoading(false)
    }
  }

  // ── Delete from server ────────────────────────────────────────────────────

  const handleDeleteServer = async () => {
    if (!isLoggedIn) return
    setServerLoading('delete')
    setError(null)
    try {
      await deleteSafetyPlan(user.username, user.pin)
      setBackupExists(false)
      setConfirmDelete(false)
    } catch {
      setError('Could not delete backup. Please try again.')
    } finally {
      setServerLoading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const backupDisabled        = !isLoggedIn || serverLoading !== false
  const restoreDeleteDisabled = !isLoggedIn || serverLoading !== false || backupExists !== true

  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate('/')} style={{ color: 'var(--muted)' }}>
          <ChevronLeft size={22} />
        </button>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.8rem' }}>
          My Safety Plan
        </h2>
      </div>
      <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
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
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl"
          style={{ background: '#FEF2F0', border: '1px solid var(--high)' }}>
          <AlertTriangle size={14} style={{ color: 'var(--high)', flexShrink: 0 }} />
          <p className="text-xs" style={{ color: 'var(--high)' }}>{error}</p>
        </div>
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

        {/* Privacy disclaimer */}
        <div className="rounded-2xl px-4 py-3 flex items-start gap-3"
          style={{ background: '#EDF4EE', border: '1px solid var(--sage)' }}>
          <ShieldCheck size={16} style={{ color: 'var(--sage-dark)', flexShrink: 0, marginTop: 2 }} />
          <p className="text-xs" style={{ color: 'var(--sage-dark)', lineHeight: 1.6 }}>
            Your safety plan is stored locally on this device. Server backups are
            encrypted with your PIN using AES-256 before leaving your browser —
            SafePoint never sees your plan in plain text. Avoid using full names
            or phone numbers if you share this device.
          </p>
        </div>

        {/* Server backup card */}
        <div className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--sand-dark)', background: 'var(--white)' }}>

          {/* Card header */}
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--sand-dark)' }}>
            <p className="text-xs font-semibold" style={{ color: 'var(--charcoal)' }}>
              Encrypted server backup
            </p>
            {isLoggedIn ? (
              <span className="text-xs flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
                <strong style={{ color: 'var(--charcoal)' }}>{user.username}</strong>
                {backupExists === null && <Loader2 size={11} className="animate-spin" />}
                {backupExists === true  && <span style={{ color: 'var(--low)', fontSize: '0.65rem' }}>● backup found</span>}
                {backupExists === false && <span style={{ fontSize: '0.65rem' }}>○ no backup</span>}
              </span>
            ) : (
              <Link to="/auth" className="text-xs font-medium underline"
                style={{ color: 'var(--sage-dark)' }}>
                Sign in to enable
              </Link>
            )}
          </div>

          {/* Three action buttons */}
          <div className="flex">

            {/* Back up */}
            <button
              onClick={handleBackup}
              disabled={backupDisabled}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium"
              style={{
                background: serverSaved ? '#EDF4EE' : 'none',
                color: serverSaved ? 'var(--low)' : isLoggedIn ? 'var(--charcoal)' : 'var(--muted)',
                borderRight: '1px solid var(--sand-dark)',
                opacity: backupDisabled ? 0.45 : 1,
                cursor: backupDisabled ? 'default' : 'pointer',
                border: 'none',
                borderRight: '1px solid var(--sand-dark)',
              }}>
              {serverLoading === 'backup'
                ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
                : serverSaved
                  ? <><CheckCircle size={14} /> Backed up!</>
                  : <><CloudUpload size={14} /> Back up</>}
            </button>

            {/* Restore */}
            <button
              onClick={handleRestore}
              disabled={restoreDeleteDisabled}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium"
              style={{
                background: serverRestored ? '#EDF4EE' : 'none',
                color: serverRestored ? 'var(--low)' : isLoggedIn ? 'var(--charcoal)' : 'var(--muted)',
                borderRight: '1px solid var(--sand-dark)',
                opacity: restoreDeleteDisabled ? 0.45 : 1,
                cursor: restoreDeleteDisabled ? 'default' : 'pointer',
                border: 'none',
                borderRight: '1px solid var(--sand-dark)',
              }}>
              {serverLoading === 'restore'
                ? <><Loader2 size={14} className="animate-spin" /> Restoring...</>
                : serverRestored
                  ? <><CheckCircle size={14} /> Restored!</>
                  : <><CloudDownload size={14} /> Restore</>}
            </button>

            {/* Delete */}
            {confirmDelete ? (
              <div className="flex-1 flex items-center justify-center gap-1.5 py-3"
                style={{ borderLeft: 'none' }}>
                <button
                  onClick={handleDeleteServer}
                  disabled={serverLoading === 'delete'}
                  className="text-xs px-2 py-1 rounded-lg font-medium"
                  style={{ background: 'var(--high)', color: 'var(--white)', border: 'none', cursor: 'pointer' }}>
                  {serverLoading === 'delete'
                    ? <Loader2 size={12} className="animate-spin" />
                    : 'Confirm'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs px-2 py-1 rounded-lg border"
                  style={{ borderColor: 'var(--sand-dark)', color: 'var(--muted)', background: 'none', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => !restoreDeleteDisabled && setConfirmDelete(true)}
                disabled={restoreDeleteDisabled}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium"
                style={{
                  background: 'none',
                  color: restoreDeleteDisabled ? 'var(--muted)' : 'var(--high)',
                  opacity: restoreDeleteDisabled ? 0.45 : 1,
                  cursor: restoreDeleteDisabled ? 'default' : 'pointer',
                  border: 'none',
                }}>
                <Trash2 size={14} /> Delete
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
