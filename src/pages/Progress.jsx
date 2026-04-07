import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingDown, TrendingUp, Minus, Trash2, ChevronLeft } from 'lucide-react'

const STORAGE_KEY = 'safepoint_history'

const RISK_VALUE = { LOW: 1, MEDIUM: 2, HIGH: 3 }
const RISK_COLOR = {
  LOW:    'var(--low)',
  MEDIUM: 'var(--medium)',
  HIGH:   'var(--high)',
}

// Read history directly from localStorage — no hooks, no async
function readHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export default function Progress() {
  const navigate = useNavigate()
  const [history, setHistory] = useState(readHistory)
  const [page, setPage]       = useState(1)
  const [expandedId, setExpandedId]   = useState(null)
  const [confirmDeleteId, setConfirmDeleteId]   = useState(null)
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)
  const PAGE_SIZE = 10

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
        <h2
          className="mb-2"
          style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.6rem' }}
        >
          No history yet
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
          Complete your first assessment to start tracking your progress over time.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-xl font-medium"
          style={{ background: 'var(--sage-dark)', color: 'var(--white)' }}
        >
          Start assessment
        </button>
      </div>
    )
  }

  const trend = history.length >= 2
    ? RISK_VALUE[history[0].riskLevel] - RISK_VALUE[history[1].riskLevel]
    : 0

  const TrendIcon = trend < 0 ? TrendingDown : trend > 0 ? TrendingUp : Minus
  const trendColor = trend < 0 ? 'var(--low)' : trend > 0 ? 'var(--high)' : 'var(--muted)'
  const trendLabel = trend < 0 ? 'Improving' : trend > 0 ? 'Worsening' : 'Stable'

  const chartData = [...history].reverse().slice(-10)

  const phq9Severity = (s) => s >= 20 ? 'Severe' : s >= 15 ? 'Moderately severe' : s >= 10 ? 'Moderate' : s >= 5 ? 'Mild' : 'Minimal'
  const gad7Severity = (s) => s >= 15 ? 'Severe' : s >= 10 ? 'Moderate' : s >= 5 ? 'Mild' : 'Minimal'
  const chartHeight = 120

  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-8">

      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} style={{ color: 'var(--muted)' }}>
          <ChevronLeft size={22} />
        </button>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.8rem', flex: 1 }}>
          My Progress
        </h2>

      </div>

      {/* Trend summary */}
      <div
        className="rounded-2xl p-5 mb-6 flex items-center gap-4"
        style={{ background: 'var(--white)', border: '1px solid var(--sand-dark)' }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'var(--sand-dark)' }}
        >
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
      {chartData.length > 1 && (
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: 'var(--white)', border: '1px solid var(--sand-dark)' }}
        >
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--charcoal)' }}>
            Risk level over time
          </h3>
          <div className="flex items-end gap-2" style={{ height: chartHeight }}>
            {chartData.map((entry, i) => {
              const val = RISK_VALUE[entry.riskLevel] || 1
              const barHeight = (val / 3) * (chartHeight - 20)
              const color = RISK_COLOR[entry.riskLevel]
              const date = new Date(entry.timestamp)
              const label = `${date.getMonth() + 1}/${date.getDate()}`
              return (
                <div key={entry.id} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-lg"
                    style={{ height: barHeight, background: color, minHeight: 8 }}
                    title={entry.riskLevel}
                  />
                  <span style={{ color: 'var(--muted)', fontSize: '0.65rem' }}>{label}</span>
                </div>
              )
            })}
          </div>
          <div className="flex justify-end gap-4 mt-3">
            {Object.entries(RISK_COLOR).map(([level, color]) => (
              <div key={level} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>{level}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History list */}
      <div
        className="rounded-2xl mb-6"
        style={{ background: 'var(--white)', border: '1px solid var(--sand-dark)' }}
      >
        <div className="flex items-center px-5 pt-4 pb-3">
          <h3 className="text-sm font-semibold flex-1" style={{ color: 'var(--charcoal)' }}>
            Assessment history
          </h3>
          {confirmDeleteAll ? (
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'var(--muted)' }}>Delete all?</span>
              <button onClick={() => { clearHistory(); setConfirmDeleteAll(false) }}
                className="text-xs px-2 py-0.5 rounded"
                style={{ background: 'var(--high)', color: 'var(--white)', border: 'none', cursor: 'pointer' }}>
                Delete
              </button>
              <button onClick={() => setConfirmDeleteAll(false)}
                className="text-xs px-2 py-0.5 rounded border"
                style={{ borderColor: 'var(--sand-dark)', color: 'var(--muted)', background: 'none', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDeleteAll(true)}
              className="flex items-center gap-1 text-xs"
              style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
              <Trash2 size={13} /> Delete all
            </button>
          )}
        </div>
        {/* Pagination controls — top */}
        {history.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-5 py-2"
            style={{ borderBottom: '1px solid var(--sand-dark)' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="text-xs px-3 py-1 rounded-lg border transition-all"
              style={{
                borderColor: 'var(--sand-dark)',
                color: page === 1 ? 'var(--sand-dark)' : 'var(--charcoal)',
                opacity: page === 1 ? 0.4 : 1,
              }}>← Prev</button>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              Page {page} of {Math.ceil(history.length / PAGE_SIZE)}
            </span>
            <button onClick={() => setPage(p => Math.min(Math.ceil(history.length / PAGE_SIZE), p + 1))}
              disabled={page === Math.ceil(history.length / PAGE_SIZE)}
              className="text-xs px-3 py-1 rounded-lg border transition-all"
              style={{
                borderColor: 'var(--sand-dark)',
                color: page === Math.ceil(history.length / PAGE_SIZE) ? 'var(--sand-dark)' : 'var(--charcoal)',
                opacity: page === Math.ceil(history.length / PAGE_SIZE) ? 0.4 : 1,
              }}>Next →</button>
          </div>
        )}
        <div className="flex flex-col">
          {history.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((entry, i) => {
            const date = new Date(entry.timestamp)
            const dateStr = date.toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric'
            })
            const timeStr = date.toLocaleTimeString('en-US', {
              hour: 'numeric', minute: '2-digit'
            })
            const isExpanded = expandedId === entry.id
            return (
              <div key={entry.id}
                style={{ borderTop: i > 0 ? '1px solid var(--sand-dark)' : 'none' }}>
                {/* Row header — clickable */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  className="w-full flex items-center px-5 py-3 gap-3 text-left"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <div className="flex-1">
                    <div className="text-xs font-medium" style={{ color: 'var(--charcoal)' }}>
                      {dateStr} · {timeStr}
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full"
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
                  <span style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-5 pb-4 pt-1"
                    style={{ background: 'var(--sand)', borderTop: '1px solid var(--sand-dark)' }}>
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
                      {entry.confidence != null && (
                        <div className="flex justify-between text-xs">
                          <span style={{ color: 'var(--muted)' }}>AI confidence</span>
                          <span style={{ color: 'var(--charcoal)' }}>
                            <strong>{Math.round(entry.confidence * 100)}%</strong>
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
      </div>


    </div>
  )
}
