import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAssessmentContext } from '../App'
import { useLanguage } from '../hooks/useLanguage.jsx'
import ExportPdf from '../components/ExportPdf'
import WellnessResources from '../components/WellnessResources'
import ExportFhir from '../components/ExportFhir'
import { Phone, MapPin, FileText, TrendingUp, AlertTriangle, CheckCircle, AlertCircle, Brain, BarChart2 } from 'lucide-react'

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

  // Combined score — numeric representation 0–100
  const combinedScore = computeCombinedScore(result)

  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-8">

      {/* Risk badge */}
      <div className="rounded-2xl p-5 mb-6 flex items-start gap-4"
        style={{ background: config.bg, color: config.color }}>
        <div className="mt-0.5">{config.icon}</div>
        <div>
          <div className="font-semibold text-lg mb-1">{t(config.label)}</div>
          <div className="text-sm" style={{ color: 'var(--charcoal)', opacity: 0.8 }}>
            {t(config.msg)}
          </div>
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

      {/* ── Reported concerns ── */}
      {assessment.concerns?.length > 0 && (
        <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--white)' }}>
          <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--charcoal)' }}>
            Reported concerns
          </h3>
          <div className="flex flex-wrap gap-2">
            {assessment.concerns.map(concern => {
              const isHigh = ['Suicidal thoughts', 'Thoughts of self-harm'].includes(concern)
              return (
                <span key={concern} className="text-xs px-3 py-1 rounded-full"
                  style={{
                    background: isHigh ? '#FDECEA' : 'var(--sand-dark)',
                    color:      isHigh ? '#a32d2d' : 'var(--muted)',
                    fontWeight: isHigh ? 500 : 400,
                  }}>
                  {concern}
                </span>
              )
            })}
          </div>
        </div>
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
              severity={result.phq9Score >= 20 ? t('severe') : result.phq9Score >= 10 ? t('moderate') : t('mild')}
              color={result.phq9Score >= 20 ? 'var(--high)' : result.phq9Score >= 10 ? 'var(--medium)' : 'var(--low)'}
              percent={Math.round((result.phq9Score / 27) * 100)}
              tooltip={`Your score: ${result.phq9Score} / 27. Ranges: 0–4 minimal, 5–9 mild, 10–14 moderate, 15–19 moderately severe, 20–27 severe.`}
            />
          )}
          {result.gad7Score != null && (
            <ScoreRow label="GAD-7 (Anxiety)" score={result.gad7Score} max={21}
              severity={result.gad7Score >= 15 ? t('severe') : result.gad7Score >= 10 ? t('moderate') : t('mild')}
              color={result.gad7Score >= 15 ? 'var(--high)' : result.gad7Score >= 10 ? 'var(--medium)' : 'var(--low)'}
              percent={Math.round((result.gad7Score / 21) * 100)}
              tooltip={`Your score: ${result.gad7Score} / 21. Ranges: 0–4 minimal, 5–9 mild, 10–14 moderate, 15–21 severe.`}
            />
          )}
        </div>
      </div>

      {/* ── AI Text score ── */}
      {result.aiAnalysis && (
        <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--white)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Brain size={16} style={{ color: 'var(--muted)' }} />
            <h3 className="font-semibold" style={{ color: 'var(--charcoal)' }}>
              AI Text Analysis
            </h3>
          </div>
          <div className="flex flex-col gap-3">
            <ScoreRow
              label="Risk level from text"
              score={null}
              scoreLabel={result.aiAnalysis.riskLevel}
              percent={Math.round(result.aiAnalysis.confidence * 100)}
              color={RISK_COLOR[result.aiAnalysis.riskLevel] || 'var(--muted)'}
              severity={`${Math.round(result.aiAnalysis.confidence * 100)}% confidence`}
              tooltip={`A fine-tuned DistilBERT model analyzed your free text and classified it as ${result.aiAnalysis.riskLevel} risk with ${Math.round(result.aiAnalysis.confidence * 100)}% confidence. The bar shows how certain the model is — higher confidence means the text more clearly matched patterns from the training data. This is one of three signals used in the final assessment.`}
            />
            {/* Per-class scores */}
            <div className="flex gap-2 mt-1">
              {['low', 'medium', 'high'].map(level => (
                <div key={level} className="flex-1">
                  <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--muted)' }}>
                    <span className="capitalize">{level}</span>
                    <span>{Math.round((result.aiAnalysis.scores?.[level] || 0) * 100)}%</span>
                  </div>
                  <div className="h-1 rounded-full" style={{ background: 'var(--sand-dark)' }}>
                    <div className="h-full rounded-full"
                      style={{
                        width:      `${Math.round((result.aiAnalysis.scores?.[level] || 0) * 100)}%`,
                        background: RISK_COLOR[level.toUpperCase()],
                      }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Signals */}
          {result.aiAnalysis.signals?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--muted)' }}>
                {t('signalsDetected')}
              </p>
              <div className="flex flex-wrap gap-2">
                {result.aiAnalysis.signals.map(s => (
                  <span key={s} className="text-xs px-3 py-1 rounded-full"
                    style={{ background: 'var(--sand-dark)', color: 'var(--muted)' }}>
                    {s.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Combined score ── */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: 'var(--white)' }}>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle size={16} style={{ color: 'var(--muted)' }} />
          <h3 className="font-semibold" style={{ color: 'var(--charcoal)' }}>
            Combined Assessment
          </h3>
        </div>

        {/* Combined score bar */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex-1">
            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--sand-dark)' }}>
              <div className="h-full rounded-full transition-all"
                style={{ width: `${combinedScore}%`, background: config.color }} />
            </div>
          </div>
          <span className="font-bold text-lg" style={{ color: config.color, minWidth: 48 }}>
            {combinedScore}
            <span className="text-xs font-normal" style={{ color: 'var(--muted)' }}>/100</span>
          </span>
        </div>

        {/* How it was computed */}
        <div className="text-xs" style={{ color: 'var(--muted)' }}>
          <p className="mb-1">
            <span className="font-medium">Sources: </span>
            {[
              result.phq9Score != null && `PHQ-9 (${result.phq9Score}/27)`,
              result.gad7Score != null && `GAD-7 (${result.gad7Score}/21)`,
              result.aiAnalysis && `AI text (${Math.round(result.aiAnalysis.confidence * 100)}%)`,
              assessment.concerns?.length > 0 && `${assessment.concerns.length} concern${assessment.concerns.length > 1 ? 's' : ''}`,
            ].filter(Boolean).join(' + ')}
          </p>
          <p>{result.explanation}</p>
        </div>
      </div>

      {/* Wellness resources — shown for LOW risk only */}
      {result.riskLevel === 'LOW' && (
        <WellnessResources
          phq9Score={result.phq9Score}
          gad7Score={result.gad7Score}
        />
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button onClick={() => navigate('/resources')}
          className="flex items-center justify-center gap-2 py-3 rounded-xl font-medium"
          style={{ background: 'var(--sage-dark)', color: 'var(--white)' }}>
          <MapPin size={18} /> {t('findSupportNearMe')}
        </button>
        <button onClick={() => navigate('/safety-plan')}
          className="flex items-center justify-center gap-2 py-3 rounded-xl border font-medium"
          style={{ borderColor: 'var(--sand-dark)', color: 'var(--charcoal)' }}>
          <FileText size={18} /> {t('buildMySafetyPlan')}
        </button>
        <button onClick={() => navigate('/progress')}
          className="flex items-center justify-center gap-2 py-3 rounded-xl border font-medium"
          style={{ borderColor: 'var(--sand-dark)', color: 'var(--charcoal)' }}>
          <TrendingUp size={18} /> {t('trackMyProgress')}
        </button>
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
function computeCombinedScore(result) {
  let total = 0
  let weight = 0

  if (result.phq9Score != null) {
    total  += (result.phq9Score / 27) * 40
    weight += 40
  }
  if (result.gad7Score != null) {
    total  += (result.gad7Score / 21) * 30
    weight += 30
  }
  if (result.aiAnalysis) {
    // Map risk level to a 0–1 value weighted by confidence
    const riskVal = { LOW: 0.2, MEDIUM: 0.55, HIGH: 0.9 }[result.aiAnalysis.riskLevel] || 0.2
    total  += riskVal * result.aiAnalysis.confidence * 30
    weight += 30
  }

  if (weight === 0) return 0
  // Normalize to available weight
  return Math.min(100, Math.round((total / weight) * 100))
}

function ScoreRow({ label, score, max, percent, color, severity, tooltip }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <div className="flex justify-between text-sm mb-1 items-center">
        <span style={{ color: 'var(--charcoal)' }}>{label}</span>
        <span className="flex items-center gap-1.5">
          <span className="font-semibold" style={{ color }}>
            {score != null ? `${score}/${max} — ` : ''}{severity}
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
