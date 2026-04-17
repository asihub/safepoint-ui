import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAssessmentContext } from '../App'
import { useLanguage } from '../hooks/useLanguage.jsx'
import ExportPdf from '../components/ExportPdf'
import ExportFhir from '../components/ExportFhir'
import { Phone, MapPin, FileText, TrendingUp, AlertTriangle, CheckCircle, AlertCircle, Brain, BarChart2, ChevronLeft, Leaf } from 'lucide-react'

const STORAGE_KEY = 'safepoint_history'
const MAX_ENTRIES = 30

function saveToHistory(result) {
  try {
    const raw  = localStorage.getItem(STORAGE_KEY)
    const prev = raw ? JSON.parse(raw) : []
    if (prev.length > 0) {
      const last = prev[0]
      const diff = Date.now() - new Date(last.timestamp).getTime()
      if (diff < 5000 && last.riskLevel === result.riskLevel &&
          last.phq9Score === result.phq9Score && last.gad7Score === result.gad7Score) return
    }
    const entry = {
      id:         Date.now(),
      timestamp:  new Date().toISOString(),
      riskLevel:  result.riskLevel,
      phq9Score:  result.phq9Score,
      gad7Score:  result.gad7Score,
      confidence: result.confidence,
      signals:    result.aiAnalysis?.signals || [],
    }
    const updated = [entry, ...prev].slice(0, MAX_ENTRIES)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (e) {
    console.warn('Could not save to history:', e)
  }
}

const RISK_CONFIG = {
  LOW:    { color: 'var(--low)',    bg: '#EDF4EE', icon: <CheckCircle size={24} />,  label: 'lowRisk',    msg: 'lowRiskMsg' },
  MEDIUM: { color: 'var(--medium)', bg: '#FDF6E3', icon: <AlertCircle size={24} />,  label: 'mediumRisk', msg: 'mediumRiskMsg' },
  HIGH:   { color: 'var(--high)',   bg: '#FDECEA', icon: <AlertTriangle size={24} />, label: 'highRisk',   msg: 'highRiskMsg' },
}

const RISK_COLOR = { LOW: 'var(--low)', MEDIUM: 'var(--medium)', HIGH: 'var(--high)' }

export default function Results() {
  const navigate   = useNavigate()
  const { assessment } = useAssessmentContext()
  const { t }      = useLanguage()
  const result     = assessment.result

  useEffect(() => { if (result) saveToHistory(result) }, [])

  if (!result) { navigate('/'); return null }

  const config = RISK_CONFIG[result.riskLevel] || RISK_CONFIG.LOW

  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} style={{ color: 'var(--muted)' }}>
          <ChevronLeft size={22} />
        </button>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.8rem' }}>
          {t('myResults')}
        </h2>
      </div>

      {/* Risk badge */}
      <div className="rounded-2xl p-5 mb-6 flex items-start gap-4"
        style={{ background: config.bg, color: config.color }}>
        <div className="mt-0.5">{config.icon}</div>
        <div>
          <div className="font-semibold text-lg mb-1">{t(config.label)}</div>
          <div className="text-sm" style={{ color: 'var(--charcoal)', opacity: 0.8 }}>
            {t(config.msg)}
          </div>
          {result.riskLevel === 'MEDIUM' && (
            <button onClick={() => navigate('/resources')}
              className="mt-3 text-sm font-medium underline"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: config.color, padding: 0 }}>
              Find mental health support near you →
            </button>
          )}
        </div>
      </div>

      {/* 988 CTA */}
      {result.show988 && (
        <a href="tel:988"
          className="flex items-center justify-center gap-3 py-4 rounded-2xl mb-6 font-semibold text-white"
          style={{ background: 'var(--high)' }}>
          <Phone size={20} /> {t('callOrText988Now')}
        </a>
      )}

      {/* ── Questionnaire scores ── */}
      <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--white)' }}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={16} style={{ color: 'var(--muted)' }} />
          <h3 className="font-semibold" style={{ color: 'var(--charcoal)' }}>
            {t('questionnaireScores')}
          </h3>
        </div>
        <div className="flex flex-col gap-3">
          {result.phq9Score != null && (
            <ScoreRow label="PHQ-9 (Depression)" score={result.phq9Score} max={27}
              severity={result.phq9Score >= 20 ? 'HIGH' : result.phq9Score >= 10 ? 'MEDIUM' : 'LOW'}
              color={result.phq9Score >= 20 ? 'var(--high)' : result.phq9Score >= 10 ? 'var(--medium)' : 'var(--low)'}
              percent={result.phq9Score >= 20 ? 100 : result.phq9Score >= 10 ? 60 : 25}
              tooltip={`Score: ${result.phq9Score}/27. Clinical severity: ${result.phq9Score >= 20 ? 'severe' : result.phq9Score >= 15 ? 'moderately severe' : result.phq9Score >= 10 ? 'moderate' : result.phq9Score >= 5 ? 'mild' : 'minimal'}.`}
            />
          )}
          {result.gad7Score != null && (
            <ScoreRow label="GAD-7 (Anxiety)" score={result.gad7Score} max={21}
              severity={result.gad7Score >= 15 ? 'HIGH' : result.gad7Score >= 10 ? 'MEDIUM' : 'LOW'}
              color={result.gad7Score >= 15 ? 'var(--high)' : result.gad7Score >= 10 ? 'var(--medium)' : 'var(--low)'}
              percent={result.gad7Score >= 15 ? 100 : result.gad7Score >= 10 ? 60 : 25}
              tooltip={`Score: ${result.gad7Score}/21. Clinical severity: ${result.gad7Score >= 15 ? 'severe' : result.gad7Score >= 10 ? 'moderate' : result.gad7Score >= 5 ? 'mild' : 'minimal'}.`}
            />
          )}
        </div>
      </div>

      {/* ── AI Text score ── */}


      {result.aiAnalysis && (() => {
        const ai = result.aiAnalysis
        const aiColor = RISK_COLOR[ai.riskLevel] || 'var(--muted)'
        const aiPercent = ai.riskLevel === 'HIGH' ? 100 : ai.riskLevel === 'MEDIUM' ? 60 : 25
        const aiSeverity = `${ai.riskLevel} (${Math.round(ai.confidence * 100)}% confidence)`
        return (
          <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--white)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Brain size={16} style={{ color: 'var(--muted)' }} />
              <h3 className="font-semibold" style={{ color: 'var(--charcoal)' }}>
                AI Text Analysis
              </h3>
            </div>
            <div className="flex flex-col gap-3">
              <ScoreRow
                label="Crisis level from text"
                score={null}
                percent={aiPercent}
                color={aiColor}
                severity={aiSeverity}
                tooltip={`A fine-tuned DistilBERT model analyzed your free text and classified it as ${ai.riskLevel} risk with ${Math.round(ai.confidence * 100)}% confidence. This is one of the signals used in the final assessment.`}
              />
            </div>
            {ai.signals?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--muted)' }}>
                  {t('signalsDetected')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {ai.signals.map(s => (
                    <span key={s} className="text-xs px-3 py-1 rounded-full"
                      style={{ background: 'var(--sand-dark)', color: 'var(--muted)' }}>
                      {s.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })()}



      {/* Actions */}
      <div className="flex flex-col gap-3">
        {result.riskLevel === 'LOW' && (
          <button
            onClick={() => navigate('/wellbeing')}
            className="flex items-center justify-center gap-2 py-3 rounded-xl border font-medium w-full"
            style={{ borderColor: 'var(--sand-dark)', color: 'var(--charcoal)' }}>
            <Leaf size={18} />
            Wellbeing Resources
          </button>
        )}
        <ExportPdf result={result} />
        <ExportFhir result={result} />
      </div>
    </div>
  )
}

/**
 * Computes a combined 0–100 score from all available signals.
 * PHQ-9 contributes 40%, GAD-7 contributes 30%, AI confidence contributes 30%.
 */
function ScoreRow({ label, score, max, percent, color, severity, tooltip }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <div className="flex justify-between text-sm mb-1 items-center">
        <span style={{ color: 'var(--charcoal)' }}>{label}</span>
        <span className="flex items-center gap-1.5">
          <span className="font-semibold" style={{ color }}>
            {severity}
          </span>
          {tooltip && (
            <span className="relative">
              <button
                onClick={() => setOpen(o => !o)}
                className="w-4 h-4 rounded-full text-xs flex items-center justify-center leading-none flex-shrink-0"
                style={{ background: 'var(--sand-dark)', color: 'var(--muted)', fontWeight: 700, border: '1px solid var(--muted)' }}>
                ?
              </button>
              {open && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                  <span
                    className="absolute right-0 bottom-full mb-2 z-20 text-xs font-normal rounded-xl px-3 py-2.5 w-60 text-left shadow-lg"
                    style={{ background: 'var(--charcoal)', color: 'var(--white)', lineHeight: 1.6 }}>
                    {tooltip}
                    <span className="absolute right-2 top-full w-0 h-0"
                      style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid var(--charcoal)' }} />
                  </span>
                </>
              )}
            </span>
          )}
        </span>
      </div>
      <div className="h-1.5 rounded-full" style={{ background: 'var(--sand-dark)' }}>
        <div className="h-full rounded-full transition-all"
          style={{ width: `${percent}%`, background: color }} />
      </div>
    </div>
  )
}
