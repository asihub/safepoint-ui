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
  const chartHeight = 120

  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-8">

      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} style={{ color: 'var(--muted)' }}>
          <ChevronLeft size={22} />
        </button>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.8rem' }}>
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
        <h3 className="text-sm font-semibold px-5 pt-4 pb-3" style={{ color: 'var(--charcoal)' }}>
          Assessment history
        </h3>
        <div className="flex flex-col">
          {history.map((entry, i) => {
            const date = new Date(entry.timestamp)
            const dateStr = date.toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric'
            })
            const timeStr = date.toLocaleTimeString('en-US', {
              hour: 'numeric', minute: '2-digit'
            })
            return (
              <div
                key={entry.id}
                className="flex items-center px-5 py-3 gap-3"
                style={{ borderTop: i > 0 ? '1px solid var(--sand-dark)' : 'none' }}
              >
                <div className="flex-1">
                  <div className="text-xs font-medium" style={{ color: 'var(--charcoal)' }}>
                    {dateStr} · {timeStr}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    {entry.phq9Score != null && `PHQ-9: ${entry.phq9Score}`}
                    {entry.phq9Score != null && entry.gad7Score != null && ' · '}
                    {entry.gad7Score != null && `GAD-7: ${entry.gad7Score}`}
                  </div>
                </div>
                <span
                  className="text-xs font-semibold px-2 py-1 rounded-full"
                  style={{
                    background: RISK_COLOR[entry.riskLevel] + '22',
                    color: RISK_COLOR[entry.riskLevel],
                  }}
                >
                  {entry.riskLevel}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate('/')}
          className="flex-1 py-3 rounded-xl font-medium"
          style={{ background: 'var(--sage-dark)', color: 'var(--white)' }}
        >
          New assessment
        </button>
        <button
          onClick={() => {
            if (window.confirm('Delete all history? This cannot be undone.')) clearHistory()
          }}
          className="px-4 py-3 rounded-xl border"
          style={{ borderColor: 'var(--sand-dark)', color: 'var(--muted)' }}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  )
}
