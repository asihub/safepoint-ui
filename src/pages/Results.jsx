import { useNavigate } from 'react-router-dom'
import { useAssessmentContext } from '../App'
import { Phone, MapPin, FileText, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react'

const RISK_CONFIG = {
  LOW: {
    color: 'var(--low)',
    bg: '#EDF4EE',
    icon: <CheckCircle size={24} />,
    label: 'Low Risk',
    message: 'Your responses suggest you are managing relatively well right now.',
  },
  MEDIUM: {
    color: 'var(--medium)',
    bg: '#FDF6E3',
    icon: <AlertCircle size={24} />,
    label: 'Moderate Risk',
    message: 'Your responses suggest you may benefit from speaking with a mental health professional.',
  },
  HIGH: {
    color: 'var(--high)',
    bg: '#FDECEA',
    icon: <AlertTriangle size={24} />,
    label: 'High Risk',
    message: 'Your responses suggest you may need immediate support. Please reach out now.',
  },
}

export default function Results() {
  const navigate = useNavigate()
  const { assessment } = useAssessmentContext()
  const result = assessment.result

  if (!result) {
    navigate('/')
    return null
  }

  const config = RISK_CONFIG[result.riskLevel] || RISK_CONFIG.LOW

  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-8">

      {/* Risk badge */}
      <div
        className="rounded-2xl p-5 mb-6 flex items-start gap-4"
        style={{ background: config.bg, color: config.color }}
      >
        <div className="mt-0.5">{config.icon}</div>
        <div>
          <div className="font-semibold text-lg mb-1">{config.label}</div>
          <div className="text-sm" style={{ color: 'var(--charcoal)', opacity: 0.8 }}>
            {config.message}
          </div>
        </div>
      </div>

      {/* 988 CTA — shown for HIGH */}
      {result.show988 && (
        <a
          href="tel:988"
          className="flex items-center justify-center gap-3 py-4 rounded-2xl mb-6 font-semibold text-white"
          style={{ background: 'var(--high)' }}
        >
          <Phone size={20} />
          Call or Text 988 Now
        </a>
      )}

      {/* Scores */}
      <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--white)' }}>
        <h3 className="font-semibold mb-4" style={{ color: 'var(--charcoal)' }}>
          Questionnaire scores
        </h3>
        <div className="flex flex-col gap-3">
          {result.phq9Score != null && (
            <ScoreRow label="PHQ-9 (Depression)" score={result.phq9Score} max={27}
              severity={result.phq9Score >= 20 ? 'severe' : result.phq9Score >= 10 ? 'moderate' : 'mild'} />
          )}
          {result.gad7Score != null && (
            <ScoreRow label="GAD-7 (Anxiety)" score={result.gad7Score} max={21}
              severity={result.gad7Score >= 15 ? 'severe' : result.gad7Score >= 10 ? 'moderate' : 'mild'} />
          )}
        </div>
      </div>

      {/* AI signals */}
      {result.aiAnalysis?.signals?.length > 0 && (
        <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--white)' }}>
          <h3 className="font-semibold mb-3" style={{ color: 'var(--charcoal)' }}>
            Signals detected in your text
          </h3>
          <div className="flex flex-wrap gap-2">
            {result.aiAnalysis.signals.map(s => (
              <span
                key={s}
                className="text-xs px-3 py-1 rounded-full"
                style={{ background: 'var(--sand-dark)', color: 'var(--muted)' }}
              >
                {s.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 mt-2">
        <button
          onClick={() => navigate('/resources')}
          className="flex items-center justify-center gap-2 py-3 rounded-xl font-medium"
          style={{ background: 'var(--sage-dark)', color: 'var(--white)' }}
        >
          <MapPin size={18} /> Find support near me
        </button>
        <button
          onClick={() => navigate('/safety-plan')}
          className="flex items-center justify-center gap-2 py-3 rounded-xl border font-medium"
          style={{ borderColor: 'var(--sand-dark)', color: 'var(--charcoal)' }}
        >
          <FileText size={18} /> Build my safety plan
        </button>
      </div>
    </div>
  )
}

function ScoreRow({ label, score, max, severity }) {
  const color = severity === 'severe' ? 'var(--high)'
              : severity === 'moderate' ? 'var(--medium)'
              : 'var(--low)'

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span style={{ color: 'var(--charcoal)' }}>{label}</span>
        <span className="font-semibold" style={{ color }}>
          {score}/{max} — {severity}
        </span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: 'var(--sand-dark)' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${(score / max) * 100}%`, background: color }}
        />
      </div>
    </div>
  )
}
