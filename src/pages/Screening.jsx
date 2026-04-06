import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAssessmentContext } from '../App'
import { useLanguage } from '../hooks/useLanguage.jsx'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { saveProgress, clearProgress, loadProgress } from '../utils/screeningProgress'

const PHQ9_QUESTIONS = {
  en: {
    self:  [
      'Little interest or pleasure in doing things',
      'Feeling down, depressed, or hopeless',
      'Trouble falling or staying asleep, or sleeping too much',
      'Feeling tired or having little energy',
      'Poor appetite or overeating',
      'Feeling bad about yourself — or that you are a failure',
      'Trouble concentrating on things',
      'Moving or speaking so slowly that other people could have noticed',
      'Thoughts that you would be better off dead, or of hurting yourself',
    ],
    proxy: [
      'Little interest or pleasure in doing things',
      'Seeming down, depressed, or hopeless',
      'Trouble falling or staying asleep, or sleeping too much',
      'Seeming tired or having little energy',
      'Changes in appetite — eating much less or much more than usual',
      'Expressing feelings of worthlessness or being a failure',
      'Trouble concentrating or making decisions',
      'Moving or speaking unusually slowly, or seeming restless or agitated',
      'Expressing thoughts of being better off dead, or of hurting themselves',
    ],
  },
  es: {
    self:  [
      'Poco interés o placer en hacer las cosas',
      'Sentirse deprimido, triste o sin esperanza',
      'Dificultad para quedarse dormido, permanecer dormido o dormir demasiado',
      'Sentirse cansado o tener poca energía',
      'Poco apetito o comer en exceso',
      'Sentirse mal consigo mismo — o que es un fracaso',
      'Dificultad para concentrarse en las cosas',
      'Moverse o hablar tan lento que otras personas lo han notado',
      'Pensamientos de que estaría mejor muerto, o de hacerse daño',
    ],
    proxy: [
      'Poco interés o placer en hacer las cosas',
      'Parecer deprimido, triste o sin esperanza',
      'Dificultad para quedarse dormido o dormir demasiado',
      'Parecer cansado o tener poca energía',
      'Cambios en el apetito — comer mucho menos o mucho más de lo habitual',
      'Expresar sentimientos de inutilidad o fracaso',
      'Dificultad para concentrarse o tomar decisiones',
      'Moverse o hablar inusualmente lento, o parecer inquieto o agitado',
      'Expresar pensamientos de estar mejor muerto o de hacerse daño',
    ],
  },
}

const GAD7_QUESTIONS = {
  en: {
    self:  [
      'Feeling nervous, anxious, or on edge',
      'Not being able to stop or control worrying',
      'Worrying too much about different things',
      'Trouble relaxing',
      'Being so restless that it is hard to sit still',
      'Becoming easily annoyed or irritable',
      'Feeling afraid, as if something awful might happen',
    ],
    proxy: [
      'Seeming nervous, anxious, or on edge',
      'Unable to stop or control worrying',
      'Worrying excessively about different things',
      'Difficulty relaxing or unwinding',
      'Seeming restless or unable to sit still',
      'Becoming easily annoyed or irritable',
      'Seeming afraid, as if something awful might happen',
    ],
  },
  es: {
    self:  [
      'Sentirse nervioso, ansioso o con los nervios de punta',
      'No poder dejar de preocuparse o controlar la preocupación',
      'Preocuparse demasiado por diferentes cosas',
      'Dificultad para relajarse',
      'Estar tan inquieto que es difícil quedarse quieto',
      'Irritarse o enojarse fácilmente',
      'Sentir miedo, como si algo terrible pudiera pasar',
    ],
    proxy: [
      'Parecer nervioso, ansioso o con los nervios de punta',
      'No poder dejar de preocuparse',
      'Preocuparse excesivamente por diferentes cosas',
      'Dificultad para relajarse',
      'Parecer inquieto o incapaz de quedarse quieto',
      'Irritarse o enojarse fácilmente',
      'Parecer asustado, como si algo terrible pudiera pasar',
    ],
  },
}

const PHQ9_LOINC = [
  { linkId: 'phq9-q1', code: '44250-9' },
  { linkId: 'phq9-q2', code: '44255-8' },
  { linkId: 'phq9-q3', code: '44259-0' },
  { linkId: 'phq9-q4', code: '44254-1' },
  { linkId: 'phq9-q5', code: '44251-7' },
  { linkId: 'phq9-q6', code: '44258-2' },
  { linkId: 'phq9-q7', code: '44252-5' },
  { linkId: 'phq9-q8', code: '44253-3' },
  { linkId: 'phq9-q9', code: '44260-8' },
]

const GAD7_LOINC = [
  { linkId: 'gad7-q1', code: '69725-0' },
  { linkId: 'gad7-q2', code: '68509-9' },
  { linkId: 'gad7-q3', code: '69733-4' },
  { linkId: 'gad7-q4', code: '69734-2' },
  { linkId: 'gad7-q5', code: '69735-9' },
  { linkId: 'gad7-q6', code: '69736-7' },
  { linkId: 'gad7-q7', code: '69689-8' },
]

const ANSWER_OPTIONS_EN = [
  { label: 'Not at all',              value: 0 },
  { label: 'Several days',            value: 1 },
  { label: 'More than half the days', value: 2 },
  { label: 'Nearly every day',        value: 3 },
]

const ANSWER_OPTIONS_ES = [
  { label: 'Para nada',                    value: 0 },
  { label: 'Varios días',                  value: 1 },
  { label: 'Más de la mitad de los días',  value: 2 },
  { label: 'Casi todos los días',          value: 3 },
]



export default function Screening() {
  const navigate = useNavigate()
  const { setScore, setAnswers, assessment } = useAssessmentContext()
  const { t, lang } = useLanguage()

  const isProxy = assessment.mode === 'proxy'
  const mode    = isProxy ? 'proxy' : 'self'

  const QUESTIONNAIRES = [
    {
      key:        'phq9',
      loincCode:  '44249-1',
      loincItems: PHQ9_LOINC,
      title:      isProxy ? t('phq9TitleProxy') : t('phq9Title'),
      questions:  PHQ9_QUESTIONS[lang]?.[mode] || PHQ9_QUESTIONS.en[mode],
    },
    {
      key:        'gad7',
      loincCode:  '69737-5',
      loincItems: GAD7_LOINC,
      title:      isProxy ? t('gad7TitleProxy') : t('gad7Title'),
      questions:  GAD7_QUESTIONS[lang]?.[mode] || GAD7_QUESTIONS.en[mode],
    },
  ]

  const OPTIONS = lang === 'es' ? ANSWER_OPTIONS_ES : ANSWER_OPTIONS_EN

  // Always start from the beginning — progress is only resumed from Home
  const [qIndex, setQIndex]        = useState(0)
  const [aIndex, setAIndex]        = useState(0)
  const [answers, setAnswersLocal] = useState({})

  // If assessment context has a saved position (set by Home resume), restore it once
  useEffect(() => {
    const saved = loadProgress()
    if (saved && saved.mode === assessment.mode) {
      setQIndex(saved.qIndex || 0)
      setAIndex(saved.aIndex || 0)
      setAnswersLocal(saved.answers || {})
    }
  }, [])

  const q              = QUESTIONNAIRES[qIndex]
  const totalQuestions = QUESTIONNAIRES.reduce((s, q) => s + q.questions.length, 0)
  const answeredSoFar  = QUESTIONNAIRES.slice(0, qIndex).reduce((s, q) => s + q.questions.length, 0) + aIndex
  const progress       = Math.round((answeredSoFar / totalQuestions) * 100)
  const currentAnswers = answers[q.key] || []
  const selected       = currentAnswers[aIndex]

  const handleSelect = (value) => {
    const updated = [...currentAnswers]
    updated[aIndex] = value
    const newAnswers = { ...answers, [q.key]: updated }
    setAnswersLocal(newAnswers)
    // Save progress on every answer
    saveProgress({ qIndex, aIndex, answers: newAnswers, mode: assessment.mode, stage: 'screening' })
  }

  const handleNext = () => {
    if (selected === undefined) return
    const allAnswers = [...currentAnswers]
    allAnswers[aIndex] = selected

    if (aIndex < q.questions.length - 1) {
      const newAnswers = { ...answers, [q.key]: allAnswers }
      setAnswersLocal(newAnswers)
      setAIndex(aIndex + 1)
      saveProgress({ qIndex, aIndex: aIndex + 1, answers: newAnswers, mode: assessment.mode, stage: 'screening' })
    } else {
      const score = allAnswers.reduce((s, v) => s + (v || 0), 0)
      setScore(q.key, score)
      setAnswers(q.key, allAnswers)

      if (qIndex < QUESTIONNAIRES.length - 1) {
        const newAnswers = { ...answers, [q.key]: allAnswers }
        setAnswersLocal(newAnswers)
        setQIndex(qIndex + 1)
        setAIndex(0)
        saveProgress({ qIndex: qIndex + 1, aIndex: 0, answers: newAnswers, mode: assessment.mode, stage: 'screening' })
      } else {
        // All questionnaires done — update stage to freetext, preserve existing freeText/concerns
        const existing = JSON.parse(localStorage.getItem('sp_progress') || '{}')
        localStorage.setItem('sp_progress', JSON.stringify({
          ...existing,
          stage: 'freetext',
          timestamp: Date.now(),
        }))
        navigate('/text')
      }
    }
  }

  const handleBack = () => {
    if (aIndex > 0) {
      setAIndex(aIndex - 1)
      saveProgress({ qIndex, aIndex: aIndex - 1, answers, mode: assessment.mode, stage: 'screening' })
    } else if (qIndex > 0) {
      const prevAIndex = QUESTIONNAIRES[qIndex - 1].questions.length - 1
      setQIndex(qIndex - 1)
      setAIndex(prevAIndex)
      saveProgress({ qIndex: qIndex - 1, aIndex: prevAIndex, answers, mode: assessment.mode, stage: 'screening' })
    } else {
      navigate('/')
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
          {isProxy ? t('modeWorriedAbout') : t('modeQuickCheck')}
        </h2>
      </div>

      {/* Proxy mode banner */}
      {isProxy && (
        <div className="rounded-xl px-4 py-2 mb-6 text-sm"
          style={{ background: 'var(--sand-dark)', color: 'var(--muted)' }}>
          {t('proxyBanner')}
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--muted)' }}>
          <span>{q.key === 'phq9' ? t('depressionScreening') : t('anxietyScreening')}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ background: 'var(--sand-dark)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: 'var(--sage)' }} />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1">
        <p className="text-xs font-medium mb-6" style={{ color: 'var(--muted)' }}>
          {q.title}
        </p>
        <h2 className="mb-8"
          style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.4rem', lineHeight: 1.35, color: 'var(--charcoal)' }}>
          {q.questions[aIndex]}
        </h2>

        <div className="flex flex-col gap-3">
          {OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => handleSelect(opt.value)}
              className="w-full text-left px-4 py-3.5 rounded-xl border transition-all"
              style={{
                background:  selected === opt.value ? 'var(--sage-dark)' : 'var(--white)',
                color:       selected === opt.value ? 'var(--white)'     : 'var(--charcoal)',
                borderColor: selected === opt.value ? 'var(--sage-dark)' : 'var(--sand-dark)',
                fontWeight:  selected === opt.value ? 500 : 400,
              }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        <button onClick={handleBack}
          disabled={qIndex === 0 && aIndex === 0}
          className="flex items-center gap-1 px-4 py-3 rounded-xl font-medium transition-all"
          style={{
            background: qIndex === 0 && aIndex === 0 ? 'var(--sand-dark)' : 'var(--sage-dark)',
            color:      'var(--white)',
            border:     'none',
          }}>
          <ChevronLeft size={18} /> {t('prev')}
        </button>
        <button onClick={handleNext} disabled={selected === undefined}
          className="flex-1 flex items-center justify-center gap-1 px-4 py-3 rounded-xl font-medium transition-all"
          style={{
            background: selected !== undefined ? 'var(--sage-dark)' : 'var(--sand-dark)',
            color:      selected !== undefined ? 'var(--white)'     : 'var(--muted)',
          }}>
          {t('next')} <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
