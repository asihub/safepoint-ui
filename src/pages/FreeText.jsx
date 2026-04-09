import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAssessmentContext } from '../App'
import { useLanguage } from '../hooks/useLanguage.jsx'
import { analyzeRisk } from '../api/client'
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react'

export default function FreeText() {
  const navigate = useNavigate()
  const { assessment, setFreeText, setResult } = useAssessmentContext()
  const { t, lang } = useLanguage()

  const [text,    setText]    = useState(() => {
    const saved = JSON.parse(localStorage.getItem('sp_progress') || '{}')
    if (saved.freeText !== undefined) return saved.freeText
    return assessment.freeText || ''
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  // Auto-save freeText to sp_progress on every change
  useEffect(() => {
    const existing = JSON.parse(localStorage.getItem('sp_progress') || '{}')
    if (Object.keys(existing).length === 0) return
    localStorage.setItem('sp_progress', JSON.stringify({
      ...existing,
      freeText: text,
      stage: 'freetext',
      timestamp: Date.now(),
    }))
  }, [text])

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    setFreeText(text)

    try {
      const result = await analyzeRisk({
        questionnaireScores: assessment.questionnaireScores,
        freeText:            text || undefined,
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

  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} style={{ color: 'var(--muted)' }}>
          <ChevronLeft size={22} />
        </button>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.8rem' }}>
          {t('howAreYouFeeling')}
        </h2>
      </div>

      <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
        {t('freeTextSubtitle')}
      </p>

      <textarea value={text} onChange={e => setText(e.target.value)}
        placeholder={t('freeTextPlaceholder')} rows={8}
        className="w-full p-4 rounded-2xl border resize-none text-sm outline-none mb-6"
        style={{ background: 'var(--white)', borderColor: 'var(--sand-dark)', color: 'var(--charcoal)', lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}
      />

      {error && <p className="text-sm mb-4" style={{ color: 'var(--high)' }}>{error}</p>}

      <div className="flex gap-3">
        <button onClick={() => {
            const existing = JSON.parse(localStorage.getItem('sp_progress') || '{}')
            localStorage.setItem('sp_progress', JSON.stringify({
              ...existing,
              freeText: text,
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
