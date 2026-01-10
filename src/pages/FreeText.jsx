import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAssessmentContext } from '../App'
import { analyzeRisk } from '../api/client'
import { ChevronRight, ChevronLeft, Loader2 } from 'lucide-react'

export default function FreeText() {
  const navigate = useNavigate()
  const { assessment, setFreeText, setResult, setInsurance } = useAssessmentContext()
  const [text, setText] = useState(assessment.freeText || '')
  const [insurance, setInsuranceLocal] = useState(assessment.insuranceType || 'UNKNOWN')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const INSURANCE_OPTIONS = [
    { value: 'UNKNOWN', label: 'Unknown / Not sure' },
    { value: 'MEDICAID', label: 'Medicaid' },
    { value: 'MEDICARE', label: 'Medicare' },
    { value: 'PRIVATE', label: 'Private insurance' },
    { value: 'NONE', label: 'No insurance' },
  ]

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    setFreeText(text)
    setInsurance(insurance)

    try {
      const result = await analyzeRisk({
        questionnaireScores: assessment.questionnaireScores,
        freeText: text || undefined,
        proxyMode: assessment.mode === 'proxy',
        insuranceType: insurance,
        latitude: assessment.location?.latitude,
        longitude: assessment.location?.longitude,
      })
      setResult(result)
      navigate('/results')
    } catch (e) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-8">

      <h2
        className="mb-2"
        style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.6rem' }}
      >
        How are you feeling?
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
        Optional — describe what's on your mind in your own words.
        This helps the AI understand your situation better.
      </p>

      {/* Text area */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="You can write anything here — there are no right or wrong answers..."
        rows={6}
        className="w-full p-4 rounded-2xl border resize-none text-sm outline-none focus:ring-2 mb-6"
        style={{
          background: 'var(--white)',
          borderColor: 'var(--sand-dark)',
          color: 'var(--charcoal)',
          lineHeight: 1.6,
          fontFamily: "'DM Sans', sans-serif",
        }}
      />

      {/* Insurance filter */}
      <label className="text-xs font-medium mb-2" style={{ color: 'var(--muted)' }}>
        Insurance type (for finding nearby resources)
      </label>
      <select
        value={insurance}
        onChange={(e) => setInsuranceLocal(e.target.value)}
        className="w-full p-3 rounded-xl border mb-8 text-sm outline-none"
        style={{
          background: 'var(--white)',
          borderColor: 'var(--sand-dark)',
          color: 'var(--charcoal)',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {INSURANCE_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {error && (
        <p className="text-sm mb-4" style={{ color: 'var(--high)' }}>{error}</p>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate('/screening')}
          className="flex items-center gap-1 px-4 py-3 rounded-xl border"
          style={{ borderColor: 'var(--sand-dark)', color: 'var(--muted)' }}
        >
          <ChevronLeft size={18} /> Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium"
          style={{ background: 'var(--sage-dark)', color: 'var(--white)' }}
        >
          {loading ? (
            <><Loader2 size={18} className="animate-spin" /> Analyzing...</>
          ) : (
            <>See my results <ChevronRight size={18} /></>
          )}
        </button>
      </div>
    </div>
  )
}
