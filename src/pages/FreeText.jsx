import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAssessmentContext } from '../App'
import { useLanguage } from '../hooks/useLanguage.jsx'
import { analyzeRisk } from '../api/client'
import { ChevronRight, ChevronLeft, Loader2, ChevronDown } from 'lucide-react'

// ── Concerns list ────────────────────────────────────────────────────────────
const CONCERNS = {
  col1: {
    label: 'Mood & thoughts',
    labelEs: 'Estado de ánimo y pensamientos',
    items: [
      { id: 'self-harm',   label: 'Thoughts of self-harm',    labelEs: 'Pensamientos de autolesión',    highRisk: true  },
      { id: 'suicidal',    label: 'Suicidal thoughts',        labelEs: 'Pensamientos suicidas',         highRisk: true  },
      { id: 'hopeless',    label: 'Feeling hopeless',         labelEs: 'Sentirse sin esperanza',        highRisk: false },
      { id: 'worthless',   label: 'Feeling worthless',        labelEs: 'Sentirse sin valor',            highRisk: false },
      { id: 'burden',      label: 'Feeling like a burden',    labelEs: 'Sentirse una carga',            highRisk: false },
      { id: 'anger',       label: 'Anger / irritability',     labelEs: 'Enojo / irritabilidad',         highRisk: false },
      { id: 'panic',       label: 'Panic attacks',            labelEs: 'Ataques de pánico',             highRisk: false },
    ]
  },
  col2: {
    label: 'Life & physical',
    labelEs: 'Vida y físico',
    items: [
      { id: 'sleep',       label: 'Sleep problems',           labelEs: 'Problemas de sueño',            highRisk: false },
      { id: 'fatigue',     label: 'No energy / fatigue',      labelEs: 'Sin energía / fatiga',          highRisk: false },
      { id: 'interest',    label: 'Loss of interest',         labelEs: 'Pérdida de interés',            highRisk: false },
      { id: 'lonely',      label: 'Loneliness / isolation',   labelEs: 'Soledad / aislamiento',         highRisk: false },
      { id: 'relation',    label: 'Relationship problems',    labelEs: 'Problemas de relación',         highRisk: false },
      { id: 'work',        label: 'Work / school stress',     labelEs: 'Estrés laboral / escolar',      highRisk: false },
      { id: 'grief',       label: 'Grief / loss',             labelEs: 'Duelo / pérdida',               highRisk: false },
    ]
  }
}

const HIGH_RISK_CONCERNS = new Set(['Thoughts of self-harm', 'Suicidal thoughts'])

export default function FreeText() {
  const navigate = useNavigate()
  const { assessment, setFreeText, setResult, setConcerns } = useAssessmentContext()
  const { t, lang } = useLanguage()

  const [text,          setText]          = useState(() => {
    const saved = JSON.parse(localStorage.getItem('sp_progress') || '{}')
    if (saved.freeText !== undefined) return saved.freeText
    return assessment.freeText || ''
  })
  const [selected,      setSelected]      = useState(() => {
    const saved = JSON.parse(localStorage.getItem('sp_progress') || '{}')
    if (saved.concerns !== undefined) return new Set(saved.concerns)
    return new Set(assessment.concerns || [])
  })
  const [dropdownOpen,  setDropdownOpen]  = useState(false)
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState(null)
  const dropdownRef = useRef(null)

  // Auto-save freeText and concerns to sp_progress on every change
  useEffect(() => {
    const existing = JSON.parse(localStorage.getItem('sp_progress') || '{}')
    if (Object.keys(existing).length === 0) return // don't save if no assessment in progress
    localStorage.setItem('sp_progress', JSON.stringify({
      ...existing,
      freeText: text,
      concerns: [...selected],
      stage: 'freetext',
      timestamp: Date.now(),
    }))
  }, [text, selected])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggleConcern = (label) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(label) ? next.delete(label) : next.add(label)
      return next
    })
  }

  const removeTag = (label) => {
    setSelected(prev => { const n = new Set(prev); n.delete(label); return n })
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    const concernsList = [...selected]
    setFreeText(text)
    setConcerns(concernsList)

    try {
      const result = await analyzeRisk({
        questionnaireScores: assessment.questionnaireScores,
        freeText:            text || undefined,
        concerns:            concernsList,
        proxyMode:           assessment.mode === 'proxy',
        lang,
      })
      setResult(result)
      localStorage.removeItem('sp_progress')
      navigate('/results')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const allItems = [...CONCERNS.col1.items, ...CONCERNS.col2.items]
  const hasHighRisk = [...selected].some(l => HIGH_RISK_CONCERNS.has(l))

  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-8">
      <h2 className="mb-2" style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.6rem' }}>
        {t('howAreYouFeeling')}
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
        {t('freeTextSubtitle')}
      </p>

      {/* ── Concerns dropdown ── */}
      <div ref={dropdownRef} className="mb-4">
        <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--muted)' }}>
          {lang === 'es' ? 'Selecciona tus preocupaciones (opcional)' : 'Select your concerns (optional)'}
        </label>

        {/* Trigger */}
        <button
          onClick={() => setDropdownOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all"
          style={{
            borderColor: dropdownOpen ? 'var(--sage-dark)' : 'var(--sand-dark)',
            background:  'var(--white)',
            color:       selected.size > 0 ? 'var(--charcoal)' : 'var(--muted)',
          }}>
          <span>
            {selected.size > 0
              ? `${selected.size} concern${selected.size > 1 ? 's' : ''} selected`
              : lang === 'es' ? 'Seleccionar...' : 'Select concerns...'}
          </span>
          <ChevronDown size={16} style={{
            color: 'var(--muted)',
            transform: dropdownOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
          }} />
        </button>

        {/* Panel */}
        {dropdownOpen && (
          <div className="rounded-xl border mt-1 overflow-hidden"
            style={{ background: 'var(--white)', borderColor: 'var(--sand-dark)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              {[CONCERNS.col1, CONCERNS.col2].map((col, ci) => (
                <div key={ci} style={{
                  padding: '12px 14px',
                  borderRight: ci === 0 ? '1px solid var(--sand-dark)' : 'none',
                }}>
                  <div className="text-xs font-medium mb-2" style={{ color: 'var(--muted)' }}>
                    {lang === 'es' ? col.labelEs : col.label}
                  </div>
                  {col.items.map(item => {
                    const label   = lang === 'es' ? item.labelEs : item.label
                    const checked = selected.has(item.label) // always use EN label as key
                    return (
                      <button key={item.id}
                        onClick={() => toggleConcern(item.label)}
                        className="w-full flex items-center gap-2 py-1.5 text-left"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px 0' }}>
                        {/* Checkbox */}
                        <div style={{
                          width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                          border: `1.5px solid ${checked
                            ? (item.highRisk ? '#c0453a' : 'var(--sage-dark)')
                            : (item.highRisk ? '#c0453a' : 'var(--sand-dark)')}`,
                          background: checked
                            ? (item.highRisk ? '#c0453a' : 'var(--sage-dark)')
                            : 'var(--white)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {checked && (
                            <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                              <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <span className="text-xs" style={{
                          color: item.highRisk ? '#c0453a' : 'var(--charcoal)',
                          fontWeight: item.highRisk ? 500 : 400,
                        }}>
                          {label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected tags */}
        {selected.size > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {[...selected].map(label => {
              const isHigh = HIGH_RISK_CONCERNS.has(label)
              const item   = allItems.find(i => i.label === label)
              const display = lang === 'es' ? (item?.labelEs || label) : label
              return (
                <span key={label} className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full"
                  style={{
                    background: isHigh ? '#FDECEA' : 'var(--sand-dark)',
                    color:      isHigh ? '#a32d2d' : 'var(--muted)',
                  }}>
                  {display}
                  <button onClick={() => removeTag(label)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', lineHeight: 1, padding: 0, fontSize: 14 }}>
                    ×
                  </button>
                </span>
              )
            })}
          </div>
        )}

        {/* High risk warning */}
        {hasHighRisk && (
          <p className="text-xs mt-2" style={{ color: '#a32d2d' }}>
            {lang === 'es'
              ? 'Tus selecciones incluyen señales de alto riesgo que afectarán tu evaluación.'
              : 'Your selections include high-risk signals that will affect your assessment.'}
          </p>
        )}
      </div>

      {/* ── Free text ── */}
      <textarea value={text} onChange={e => setText(e.target.value)}
        placeholder={t('freeTextPlaceholder')} rows={5}
        className="w-full p-4 rounded-2xl border resize-none text-sm outline-none mb-6"
        style={{ background: 'var(--white)', borderColor: 'var(--sand-dark)', color: 'var(--charcoal)', lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}
      />

      {error && <p className="text-sm mb-4" style={{ color: 'var(--high)' }}>{error}</p>}

      <div className="flex gap-3">
        <button onClick={() => {
            // Save freeText and concerns, go back to last GAD-7 question
            const existing = JSON.parse(localStorage.getItem('sp_progress') || '{}')
            localStorage.setItem('sp_progress', JSON.stringify({
              ...existing,
              freeText: text,
              concerns: [...selected],
              // Put back to last GAD-7 question (qIndex=1, aIndex=6)
              qIndex: 1,
              aIndex: 6,
              stage: 'screening',
              timestamp: Date.now(),
            }))
            navigate('/screening')
          }}
          className="flex items-center gap-1 px-4 py-3 rounded-xl font-medium transition-all"
          style={{ background: 'var(--sage-dark)', color: 'var(--white)', border: 'none' }}>
          <ChevronLeft size={18} /> {t('prev')}
        </button>
        <button onClick={handleSubmit} disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium"
          style={{ background: 'var(--sage-dark)', color: 'var(--white)' }}>
          {loading
            ? <><Loader2 size={18} className="animate-spin" /> {t('analyzing')}</>
            : <>{t('submitAndSeeResults')} <ChevronRight size={18} /></>}
        </button>
      </div>
    </div>
  )
}
