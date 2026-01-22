import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAssessmentContext } from '../App'
import { ChevronRight, ChevronLeft } from 'lucide-react'

// PHQ-9 — self and proxy versions
const PHQ9_SELF = {
  key: 'phq9',
  title: 'Over the last 2 weeks, how often have you been bothered by the following?',
  questions: [
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
}

const PHQ9_PROXY = {
  key: 'phq9',
  title: 'Over the last 2 weeks, how often has the person you are concerned about been bothered by the following?',
  questions: [
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
}

// GAD-7 — self and proxy versions
const GAD7_SELF = {
  key: 'gad7',
  title: 'Over the last 2 weeks, how often have you been bothered by the following?',
  questions: [
    'Feeling nervous, anxious, or on edge',
    'Not being able to stop or control worrying',
    'Worrying too much about different things',
    'Trouble relaxing',
    'Being so restless that it is hard to sit still',
    'Becoming easily annoyed or irritable',
    'Feeling afraid, as if something awful might happen',
  ],
}

const GAD7_PROXY = {
  key: 'gad7',
  title: 'Over the last 2 weeks, how often has the person you are concerned about shown the following?',
  questions: [
    'Seeming nervous, anxious, or on edge',
    'Unable to stop or control worrying',
    'Worrying excessively about different things',
    'Difficulty relaxing or unwinding',
    'Seeming restless or unable to sit still',
    'Becoming easily annoyed or irritable',
    'Seeming afraid, as if something awful might happen',
  ],
}

const OPTIONS = [
  { label: 'Not at all', value: 0 },
  { label: 'Several days', value: 1 },
  { label: 'More than half the days', value: 2 },
  { label: 'Nearly every day', value: 3 },
]

export default function Screening() {
  const navigate = useNavigate()
  const { setScore, assessment } = useAssessmentContext()

  const isProxy = assessment.mode === 'proxy'

  // Select questionnaires based on mode
  const QUESTIONNAIRES = isProxy
    ? [PHQ9_PROXY, GAD7_PROXY]
    : [PHQ9_SELF, GAD7_SELF]

  const [qIndex, setQIndex] = useState(0)
  const [aIndex, setAIndex] = useState(0)
  const [answers, setAnswers] = useState({})

  const q = QUESTIONNAIRES[qIndex]
  const totalQuestions = QUESTIONNAIRES.reduce((s, q) => s + q.questions.length, 0)
  const answeredSoFar = QUESTIONNAIRES.slice(0, qIndex).reduce((s, q) => s + q.questions.length, 0) + aIndex
  const progress = Math.round((answeredSoFar / totalQuestions) * 100)

  const currentAnswers = answers[q.key] || []
  const selected = currentAnswers[aIndex]

  const handleSelect = (value) => {
    const updated = [...currentAnswers]
    updated[aIndex] = value
    setAnswers(prev => ({ ...prev, [q.key]: updated }))
  }

  const handleNext = () => {
    if (selected === undefined) return

    if (aIndex < q.questions.length - 1) {
      setAIndex(aIndex + 1)
    } else {
      // Save total score for this questionnaire
      const allAnswers = [...(answers[q.key] || [])]
      allAnswers[aIndex] = selected
      const score = allAnswers.reduce((s, v) => s + (v || 0), 0)
      setScore(q.key, score)

      if (qIndex < QUESTIONNAIRES.length - 1) {
        setQIndex(qIndex + 1)
        setAIndex(0)
      } else {
        navigate('/text')
      }
    }
  }

  const handleBack = () => {
    if (aIndex > 0) {
      setAIndex(aIndex - 1)
    } else if (qIndex > 0) {
      setQIndex(qIndex - 1)
      setAIndex(QUESTIONNAIRES[qIndex - 1].questions.length - 1)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-8">

      {/* Proxy mode banner */}
      {isProxy && (
        <div
          className="rounded-xl px-4 py-2 mb-6 text-sm"
          style={{ background: 'var(--sand-dark)', color: 'var(--muted)' }}
        >
          You are completing this assessment on behalf of someone you are concerned about.
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--muted)' }}>
          <span>{q.key === 'phq9' ? 'Depression screening' : 'Anxiety screening'}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ background: 'var(--sand-dark)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: 'var(--sage)' }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1">
        <p className="text-xs font-medium mb-6" style={{ color: 'var(--muted)' }}>
          {q.title}
        </p>
        <h2
          className="mb-8"
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '1.4rem',
            lineHeight: 1.35,
            color: 'var(--charcoal)',
          }}
        >
          {q.questions[aIndex]}
        </h2>

        {/* Options */}
        <div className="flex flex-col gap-3">
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className="w-full text-left px-4 py-3.5 rounded-xl border transition-all"
              style={{
                background: selected === opt.value ? 'var(--sage-dark)' : 'var(--white)',
                color: selected === opt.value ? 'var(--white)' : 'var(--charcoal)',
                borderColor: selected === opt.value ? 'var(--sage-dark)' : 'var(--sand-dark)',
                fontWeight: selected === opt.value ? 500 : 400,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 px-4 py-3 rounded-xl border"
          style={{ borderColor: 'var(--sand-dark)', color: 'var(--muted)' }}
        >
          <ChevronLeft size={18} /> Back
        </button>
        <button
          onClick={handleNext}
          disabled={selected === undefined}
          className="flex-1 flex items-center justify-center gap-1 px-4 py-3 rounded-xl font-medium transition-all"
          style={{
            background: selected !== undefined ? 'var(--sage-dark)' : 'var(--sand-dark)',
            color: selected !== undefined ? 'var(--white)' : 'var(--muted)',
          }}
        >
          Next <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
