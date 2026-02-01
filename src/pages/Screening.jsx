import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAssessmentContext } from '../App'
import { ChevronRight, ChevronLeft } from 'lucide-react'

// PHQ-9 questions — self and proxy versions
const PHQ9_SELF = {
  key: 'phq9',
  loincCode: '44249-1',
  title: 'Over the last 2 weeks, how often have you been bothered by the following?',
  questions: [
    { text: 'Little interest or pleasure in doing things',                           loincCode: '44250-9' },
    { text: 'Feeling down, depressed, or hopeless',                                  loincCode: '44255-8' },
    { text: 'Trouble falling or staying asleep, or sleeping too much',               loincCode: '44259-0' },
    { text: 'Feeling tired or having little energy',                                 loincCode: '44254-1' },
    { text: 'Poor appetite or overeating',                                           loincCode: '44251-7' },
    { text: 'Feeling bad about yourself — or that you are a failure',                loincCode: '44258-2' },
    { text: 'Trouble concentrating on things',                                       loincCode: '44252-5' },
    { text: 'Moving or speaking so slowly that other people could have noticed',     loincCode: '44253-3' },
    { text: 'Thoughts that you would be better off dead, or of hurting yourself',    loincCode: '44260-8' },
  ],
}

const PHQ9_PROXY = {
  key: 'phq9',
  loincCode: '44249-1',
  title: 'Over the last 2 weeks, how often has the person you are concerned about been bothered by the following?',
  questions: [
    { text: 'Little interest or pleasure in doing things',                            loincCode: '44250-9' },
    { text: 'Seeming down, depressed, or hopeless',                                  loincCode: '44255-8' },
    { text: 'Trouble falling or staying asleep, or sleeping too much',               loincCode: '44259-0' },
    { text: 'Seeming tired or having little energy',                                 loincCode: '44254-1' },
    { text: 'Changes in appetite — eating much less or much more than usual',        loincCode: '44251-7' },
    { text: 'Expressing feelings of worthlessness or being a failure',               loincCode: '44258-2' },
    { text: 'Trouble concentrating or making decisions',                             loincCode: '44252-5' },
    { text: 'Moving or speaking unusually slowly, or seeming restless or agitated',  loincCode: '44253-3' },
    { text: 'Expressing thoughts of being better off dead, or of hurting themselves', loincCode: '44260-8' },
  ],
}

// GAD-7 questions — self and proxy versions
const GAD7_SELF = {
  key: 'gad7',
  loincCode: '69737-5',
  title: 'Over the last 2 weeks, how often have you been bothered by the following?',
  questions: [
    { text: 'Feeling nervous, anxious, or on edge',                      loincCode: '69725-0' },
    { text: 'Not being able to stop or control worrying',                loincCode: '68509-9' },
    { text: 'Worrying too much about different things',                  loincCode: '69733-4' },
    { text: 'Trouble relaxing',                                          loincCode: '69734-2' },
    { text: 'Being so restless that it is hard to sit still',            loincCode: '69735-9' },
    { text: 'Becoming easily annoyed or irritable',                      loincCode: '69736-7' },
    { text: 'Feeling afraid, as if something awful might happen',        loincCode: '69689-8' },
  ],
}

const GAD7_PROXY = {
  key: 'gad7',
  loincCode: '69737-5',
  title: 'Over the last 2 weeks, how often has the person you are concerned about shown the following?',
  questions: [
    { text: 'Seeming nervous, anxious, or on edge',                      loincCode: '69725-0' },
    { text: 'Unable to stop or control worrying',                        loincCode: '68509-9' },
    { text: 'Worrying excessively about different things',               loincCode: '69733-4' },
    { text: 'Difficulty relaxing or unwinding',                          loincCode: '69734-2' },
    { text: 'Seeming restless or unable to sit still',                   loincCode: '69735-9' },
    { text: 'Becoming easily annoyed or irritable',                      loincCode: '69736-7' },
    { text: 'Seeming afraid, as if something awful might happen',        loincCode: '69689-8' },
  ],
}

const OPTIONS = [
  { label: 'Not at all',              value: 0, code: 'LA6568-5' },
  { label: 'Several days',            value: 1, code: 'LA6569-3' },
  { label: 'More than half the days', value: 2, code: 'LA6570-1' },
  { label: 'Nearly every day',        value: 3, code: 'LA6571-9' },
]

export default function Screening() {
  const navigate = useNavigate()
  const { setScore, setAnswers, assessment } = useAssessmentContext()

  const isProxy = assessment.mode === 'proxy'
  const QUESTIONNAIRES = isProxy
    ? [PHQ9_PROXY, GAD7_PROXY]
    : [PHQ9_SELF, GAD7_SELF]

  const [qIndex, setQIndex] = useState(0)
  const [aIndex, setAIndex] = useState(0)
  const [answers, setAnswersLocal] = useState({}) // { phq9: [0,1,...], gad7: [...] }

  const q = QUESTIONNAIRES[qIndex]
  const totalQuestions = QUESTIONNAIRES.reduce((s, q) => s + q.questions.length, 0)
  const answeredSoFar = QUESTIONNAIRES.slice(0, qIndex).reduce((s, q) => s + q.questions.length, 0) + aIndex
  const progress = Math.round((answeredSoFar / totalQuestions) * 100)

  const currentAnswers = answers[q.key] || []
  const selected = currentAnswers[aIndex]

  const handleSelect = (value) => {
    const updated = [...currentAnswers]
    updated[aIndex] = value
    setAnswersLocal(prev => ({ ...prev, [q.key]: updated }))
  }

  const handleNext = () => {
    if (selected === undefined) return

    // Update answers array
    const allAnswers = [...currentAnswers]
    allAnswers[aIndex] = selected

    if (aIndex < q.questions.length - 1) {
      setAnswersLocal(prev => ({ ...prev, [q.key]: allAnswers }))
      setAIndex(aIndex + 1)
    } else {
      // Save score and full answers array to context
      const score = allAnswers.reduce((s, v) => s + (v || 0), 0)
      setScore(q.key, score)
      setAnswers(q.key, allAnswers)  // ← save per-item answers for FHIR

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
          {q.questions[aIndex].text}
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
