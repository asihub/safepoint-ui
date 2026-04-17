import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAssessmentContext } from '../App'
import { clearProgress } from '../utils/screeningProgress'
import { TrendingDown, TrendingUp, Minus, Trash2, ChevronLeft, CloudUpload, CloudDownload, ShieldCheck, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { saveProgressBackup, getProgressBackup, checkProgressBackupExists, deleteProgressBackup } from '../api/client'

const STORAGE_KEY = 'safepoint_history'
const AUTH_KEY    = 'sp_user'

function getLoggedInUser() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null') }
  catch { return null }
}

// ── AES-GCM encryption (same as SafetyPlan) ──────────────────────────────

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

async function encryptData(text, pin) {
  const key = await deriveKey(pin)
  const iv  = crypto.getRandomValues(new Uint8Array(12))
  const enc = new TextEncoder()
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(text))
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), iv.byteLength)
  return btoa(String.fromCharCode(...combined))
}

async function decryptData(b64, pin) {
  const key = await deriveKey(pin)
  const combined  = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
  const iv        = combined.slice(0, 12)
  const ciphertext = combined.slice(12)
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(plaintext)
}

const RISK_VALUE = { LOW: 1, MEDIUM: 2, HIGH: 3 }
const RISK_COLOR = {
  LOW:    'var(--low)',
  MEDIUM: 'var(--medium)',
  HIGH:   'var(--high)',
}

function readHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const PAGE_SIZE = 10

function Pagination({ page, totalPages, setPage }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between">
      <button
        onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0) }}
        disabled={page === 1}
        className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
        style={{
          borderColor: 'var(--sand-dark)',
          color: page === 1 ? 'var(--sand-dark)' : 'var(--charcoal)',
          opacity: page === 1 ? 0.4 : 1,
        }}>← Prev</button>
      <span className="text-xs" style={{ color: 'var(--muted)' }}>
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0, 0) }}
        disabled={page === totalPages}
        className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
        style={{
          borderColor: 'var(--sand-dark)',
          color: page === totalPages ? 'var(--sand-dark)' : 'var(--charcoal)',
          opacity: page === totalPages ? 0.4 : 1,
        }}>Next →</button>
    </div>
  )
}

export default function Progress() {
  const navigate = useNavigate()
  const { setMode, reset } = useAssessmentContext()
  const [history, setHistory]               = useState(readHistory)
  const [page, setPage]                     = useState(1)
  const [expandedId, setExpandedId]         = useState(null)
  const [confirmDeleteId, setConfirmDeleteId]   = useState(null)
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)
  const [chartOffset, setChartOffset]           = useState(() => Math.max(0, [...readHistory()].length - 8))

  // ── Server backup state ──────────────────────────────────────────────────
  const user       = getLoggedInUser()
  const isLoggedIn = !!(user?.username && user?.pin)
  const [backupExists, setBackupExists]     = useState(null)
  const [serverLoading, setServerLoading]   = useState(false)
  const [serverSaved, setServerSaved]       = useState(false)
  const [serverRestored, setServerRestored] = useState(false)
  const [confirmDeleteBackup, setConfirmDeleteBackup] = useState(false)
  const [backupError, setBackupError]       = useState(null)

  useEffect(() => {
    if (!isLoggedIn) { setBackupExists(false); return }
    checkProgressBackupExists(user.username, user.pin)
      .then(exists => setBackupExists(exists))
      .catch(() => setBackupExists(false))
  }, [isLoggedIn])

  const handleBackup = async () => {
    if (!isLoggedIn) return
    setServerLoading('backup')
    setBackupError(null)
    try {
      const plaintext  = JSON.stringify(history)
      const ciphertext = await encryptData(plaintext, user.pin)
      await saveProgressBackup({ userCode: user.username, pin: user.pin, encryptedData: ciphertext })
      setBackupExists(true)
      setServerSaved(true)
      setTimeout(() => setServerSaved(false), 2500)
    } catch {
      setBackupError('Could not back up. Please try again.')
    } finally {
      setServerLoading(false)
    }
  }

  const handleRestore = async () => {
    if (!isLoggedIn) return
    setServerLoading('restore')
    setBackupError(null)
    try {
      const data      = await getProgressBackup(user.username, user.pin)
      const plaintext = await decryptData(data.encryptedData, user.pin)
      const restored  = JSON.parse(plaintext)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(restored))
      setHistory(restored)
      setPage(1)
      setServerRestored(true)
      setTimeout(() => setServerRestored(false), 2500)
    } catch {
      setBackupError('Could not restore. The backup may be encrypted with a different PIN.')
    } finally {
      setServerLoading(false)
    }
  }

  const handleDeleteBackup = async () => {
    if (!isLoggedIn) return
    setServerLoading('delete')
    setBackupError(null)
    try {
      await deleteProgressBackup(user.username, user.pin)
      setBackupExists(false)
      setConfirmDeleteBackup(false)
    } catch {
      setBackupError('Could not delete backup. Please try again.')
    } finally {
      setServerLoading(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(history.length / PAGE_SIZE))
  const paginated  = history.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const deleteEntry = (id) => {
    setHistory(prev => {
      const updated = prev.filter(e => e.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
    if (expandedId === id) setExpandedId(null)
  }

  const clearHistory = () => {
    localStorage.removeItem(STORAGE_KEY)
    setHistory([])
  }

  if (history.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="text-5xl mb-4">📈</div>
        <h2 className="mb-2"
          style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.6rem' }}>
          No history yet
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
          Complete your first assessment to start tracking your progress over time.
        </p>
        <button
          onClick={() => { clearProgress(); reset(); setMode('self'); navigate('/screening') }}
          className="px-6 py-3 rounded-xl font-medium"
          style={{ background: 'var(--sage-dark)', color: 'var(--white)' }}>
          Start assessment
        </button>
      </div>
    )
  }

  const trend = history.length >= 2
    ? RISK_VALUE[history[0].riskLevel] - RISK_VALUE[history[1].riskLevel]
    : 0

  const TrendIcon  = trend < 0 ? TrendingDown : trend > 0 ? TrendingUp : Minus
  const trendColor = trend < 0 ? 'var(--low)' : trend > 0 ? 'var(--high)' : 'var(--muted)'
  const trendLabel = trend < 0 ? 'Improving' : trend > 0 ? 'Worsening' : 'Stable'

  const chartData   = [...history].reverse()
  const chartHeight = 120

  const phq9Severity = (s) => s >= 20 ? 'Severe' : s >= 15 ? 'Moderately severe' : s >= 10 ? 'Moderate' : s >= 5 ? 'Mild' : 'Minimal'
  const gad7Severity = (s) => s >= 15 ? 'Severe' : s >= 10 ? 'Moderate' : s >= 5 ? 'Mild' : 'Minimal'

  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} style={{ color: 'var(--muted)' }}>
          <ChevronLeft size={22} />
        </button>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.8rem', flex: 1 }}>
          My Progress
        </h2>
      </div>

      {/* Trend summary */}
      <div className="rounded-2xl p-5 mb-4 flex items-center gap-4"
        style={{ background: 'var(--white)', border: '1px solid var(--sand-dark)' }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'var(--sand-dark)' }}>
          <TrendIcon size={22} style={{ color: trendColor }} />
        </div>
        <div>
          <div className="font-semibold" style={{ color: trendColor }}>{trendLabel}</div>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>
            Based on your last {history.length} assessment{history.length > 1 ? 's' : ''}
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-lg font-semibold" style={{ color: RISK_COLOR[history[0].riskLevel] }}>
            {history[0].riskLevel}
          </div>
          <div className="text-xs" style={{ color: 'var(--muted)' }}>Latest</div>
        </div>
      </div>

      {/* Bar chart */}
      {chartData.length > 1 && (() => {
        const CHART_WINDOW = 8
        const maxOffset = Math.max(0, chartData.length - CHART_WINDOW)
        return (
          <div className="rounded-2xl p-5 mb-6"
            style={{ background: 'var(--white)', border: '1px solid var(--sand-dark)' }}>
            {/* Title row — centered with nav arrows */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setChartOffset(o => Math.max(0, o - 1))}
                disabled={chartOffset === 0}
                style={{ background: 'none', border: 'none', cursor: chartOffset === 0 ? 'default' : 'pointer',
                  color: chartOffset === 0 ? 'var(--sand-dark)' : 'var(--muted)', padding: '2px 6px', fontSize: '1rem' }}>
                ←
              </button>
              <h3 className="text-sm font-semibold text-center" style={{ color: 'var(--charcoal)' }}>
                Risk level over time
              </h3>
              <button
                onClick={() => setChartOffset(o => Math.min(maxOffset, o + 1))}
                disabled={chartOffset >= maxOffset}
                style={{ background: 'none', border: 'none', cursor: chartOffset >= maxOffset ? 'default' : 'pointer',
                  color: chartOffset >= maxOffset ? 'var(--sand-dark)' : 'var(--muted)', padding: '2px 6px', fontSize: '1rem' }}>
                →
              </button>
            </div>
            <div className="flex items-end gap-2" style={{ height: chartHeight }}>
              {chartData.slice(chartOffset, chartOffset + CHART_WINDOW).map((entry) => {
                const val = RISK_VALUE[entry.riskLevel] || 1
                const barHeight = (val / 3) * (chartHeight - 20)
                return (
                  <div key={entry.id} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t-lg"
                      style={{ height: barHeight, background: RISK_COLOR[entry.riskLevel], minHeight: 8 }}
                      title={entry.riskLevel} />
                    <span style={{ color: 'var(--muted)', fontSize: '0.65rem' }}>
                      {`${new Date(entry.timestamp).getMonth() + 1}/${new Date(entry.timestamp).getDate()}`}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-center gap-4 mt-3">
              {Object.entries(RISK_COLOR).map(([level, color]) => (
                <div key={level} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>{level}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* History header */}
      <div className="rounded-2xl px-5 py-4 mb-3 flex items-center gap-3"
        style={{ background: 'var(--white)', border: '1px solid var(--sand-dark)' }}>
        <div className="flex-1">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--charcoal)' }}>
            Assessment history
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {history.length} session{history.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
        {confirmDeleteAll ? (
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--muted)' }}>Delete all?</span>
            <button onClick={() => { clearHistory(); setConfirmDeleteAll(false) }}
              className="text-xs px-2 py-1 rounded-lg"
              style={{ background: 'var(--high)', color: 'var(--white)', border: 'none', cursor: 'pointer' }}>
              Confirm
            </button>
            <button onClick={() => setConfirmDeleteAll(false)}
              className="text-xs px-2 py-1 rounded-lg border"
              style={{ borderColor: 'var(--sand-dark)', color: 'var(--muted)', background: 'none', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirmDeleteAll(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border"
            style={{ borderColor: 'var(--sand-dark)', color: 'var(--muted)', background: 'none', cursor: 'pointer' }}>
            <Trash2 size={12} /> Delete all
          </button>
        )}
      </div>

      {/* Pagination top */}
      <div className="mb-3">
        <Pagination page={page} totalPages={totalPages} setPage={setPage} />
      </div>

      {/* History cards */}
      <div className="flex flex-col gap-3 mb-3">
        {paginated.map((entry) => {
          const date    = new Date(entry.timestamp)
          const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          const isExpanded = expandedId === entry.id

          return (
            <div key={entry.id}
              className="rounded-2xl overflow-hidden"
              style={{ background: 'var(--white)', border: '1px solid var(--sand-dark)' }}>

              {/* Card header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                className="w-full flex items-center px-5 py-4 gap-3 text-left"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: 'var(--charcoal)' }}>
                    {dateStr}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    {timeStr}
                  </div>
                </div>

                <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{
                    background: RISK_COLOR[entry.riskLevel] + '22',
                    color: RISK_COLOR[entry.riskLevel],
                  }}>
                  {entry.riskLevel}
                </span>

                {confirmDeleteId === entry.id ? (
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { deleteEntry(entry.id); setConfirmDeleteId(null) }}
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ background: 'var(--high)', color: 'var(--white)', border: 'none', cursor: 'pointer' }}>
                      Delete
                    </button>
                    <button onClick={() => setConfirmDeleteId(null)}
                      className="text-xs px-2 py-0.5 rounded border"
                      style={{ borderColor: 'var(--sand-dark)', color: 'var(--muted)', background: 'none', cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(entry.id) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--muted)', flexShrink: 0 }}>
                    <Trash2 size={14} />
                  </button>
                )}

                <span style={{ color: 'var(--muted)', fontSize: '0.7rem', flexShrink: 0 }}>
                  {isExpanded ? '▲' : '▼'}
                </span>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-5 pb-4 pt-3"
                  style={{ borderTop: '1px solid var(--sand-dark)', background: 'var(--sand)' }}>
                  <div className="flex flex-col gap-2">
                    {entry.phq9Score != null && (
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'var(--muted)' }}>PHQ-9 (Depression)</span>
                        <span style={{ color: 'var(--charcoal)' }}>
                          <strong>{entry.phq9Score}</strong>/27 — {phq9Severity(entry.phq9Score)}
                        </span>
                      </div>
                    )}
                    {entry.gad7Score != null && (
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'var(--muted)' }}>GAD-7 (Anxiety)</span>
                        <span style={{ color: 'var(--charcoal)' }}>
                          <strong>{entry.gad7Score}</strong>/21 — {gad7Severity(entry.gad7Score)}
                        </span>
                      </div>
                    )}
                    {entry.aiRiskLevel != null && (
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'var(--muted)' }}>AI risk level</span>
                        <span className="font-semibold"
                          style={{ color: RISK_COLOR[entry.aiRiskLevel] ?? 'var(--charcoal)' }}>
                          {entry.aiRiskLevel}
                          {entry.confidence != null && (
                            <span className="font-normal" style={{ color: 'var(--muted)' }}>
                              {' '}(confidence {Math.round(entry.confidence * 100)}%)
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    {entry.signals?.length > 0 && (
                      <div className="flex justify-between text-xs">
                        <span style={{ color: 'var(--muted)' }}>AI signals</span>
                        <span style={{ color: 'var(--charcoal)' }}>
                          {entry.signals.map(s => s.replace(/_/g, ' ')).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Pagination bottom */}
      <Pagination page={page} totalPages={totalPages} setPage={setPage} />

      {/* ── Server backup ── */}
      <div className="mt-6 flex flex-col gap-3">

        {backupError && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: '#FEF2F0', border: '1px solid var(--high)' }}>
            <AlertTriangle size={14} style={{ color: 'var(--high)', flexShrink: 0 }} />
            <p className="text-xs" style={{ color: 'var(--high)' }}>{backupError}</p>
          </div>
        )}

        {/* Privacy note */}
        <div className="rounded-2xl px-4 py-3 flex items-start gap-3"
          style={{ background: '#EDF4EE', border: '1px solid var(--sage)' }}>
          <ShieldCheck size={16} style={{ color: 'var(--sage-dark)', flexShrink: 0, marginTop: 2 }} />
          <p className="text-xs" style={{ color: 'var(--sage-dark)', lineHeight: 1.6 }}>
            Progress backups are encrypted with your PIN using AES-256 before leaving
            your browser. SafePoint never sees your assessment history in plain text.
          </p>
        </div>

        {/* Backup card */}
        <div className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--sand-dark)', background: 'var(--white)' }}>

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

          <div className="flex">
            {/* Back up */}
            <button
              onClick={handleBackup}
              disabled={!isLoggedIn || serverLoading !== false}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium"
              style={{
                background: serverSaved ? '#EDF4EE' : 'none',
                color: serverSaved ? 'var(--low)' : isLoggedIn ? 'var(--charcoal)' : 'var(--muted)',
                borderRight: '1px solid var(--sand-dark)',
                opacity: !isLoggedIn ? 0.45 : 1,
                cursor: !isLoggedIn || serverLoading ? 'default' : 'pointer',
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
              disabled={!isLoggedIn || serverLoading !== false || backupExists !== true}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium"
              style={{
                background: serverRestored ? '#EDF4EE' : 'none',
                color: serverRestored ? 'var(--low)' : (isLoggedIn && backupExists) ? 'var(--charcoal)' : 'var(--muted)',
                borderRight: '1px solid var(--sand-dark)',
                opacity: (!isLoggedIn || backupExists !== true) ? 0.45 : 1,
                cursor: (!isLoggedIn || backupExists !== true || serverLoading) ? 'default' : 'pointer',
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
            {confirmDeleteBackup ? (
              <div className="flex-1 flex items-center justify-center gap-1.5 py-3">
                <button
                  onClick={handleDeleteBackup}
                  disabled={serverLoading === 'delete'}
                  className="text-xs px-2 py-1 rounded-lg font-medium"
                  style={{ background: 'var(--high)', color: 'var(--white)', border: 'none', cursor: 'pointer' }}>
                  {serverLoading === 'delete' ? <Loader2 size={12} className="animate-spin" /> : 'Confirm'}
                </button>
                <button onClick={() => setConfirmDeleteBackup(false)}
                  className="text-xs px-2 py-1 rounded-lg border"
                  style={{ borderColor: 'var(--sand-dark)', color: 'var(--muted)', background: 'none', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => backupExists === true && !serverLoading && setConfirmDeleteBackup(true)}
                disabled={!isLoggedIn || serverLoading !== false || backupExists !== true}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium"
                style={{
                  background: 'none',
                  color: (isLoggedIn && backupExists === true) ? 'var(--high)' : 'var(--muted)',
                  opacity: (!isLoggedIn || backupExists !== true) ? 0.45 : 1,
                  cursor: (!isLoggedIn || backupExists !== true || serverLoading) ? 'default' : 'pointer',
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
