import { useState } from 'react'

// Global assessment state shared across screens
const initialState = {
  mode: null,                // 'self' | 'proxy'
  questionnaireScores: {},   // { phq9: 14, gad7: 10 }
  questionnaireAnswers: {},  // { phq9: [0,1,2,...], gad7: [1,2,...] } — per-item answers for FHIR
  freeText: '',
  insuranceType: 'UNKNOWN',
  location: null,
  result: null,
}

export function useAssessment() {
  const [assessment, setAssessment] = useState(initialState)

  const setMode = (mode) =>
    setAssessment(prev => ({ ...prev, mode }))

  // Save total score for a questionnaire
  const setScore = (key, value) =>
    setAssessment(prev => ({
      ...prev,
      questionnaireScores: { ...prev.questionnaireScores, [key]: value }
    }))

  // Save individual answers array for a questionnaire (for FHIR QuestionnaireResponse)
  const setAnswers = (key, answers) =>
    setAssessment(prev => ({
      ...prev,
      questionnaireAnswers: { ...prev.questionnaireAnswers, [key]: answers }
    }))

  const setFreeText = (text) =>
    setAssessment(prev => ({ ...prev, freeText: text }))

  const setConcerns = (concerns) =>
    setAssessment(prev => ({ ...prev, concerns }))

  const setInsurance = (type) =>
    setAssessment(prev => ({ ...prev, insuranceType: type }))

  const setLocation = (location) =>
    setAssessment(prev => ({ ...prev, location }))

  const setResult = (result) =>
    setAssessment(prev => ({ ...prev, result }))

  const reset = () => setAssessment(initialState)

  return {
    assessment,
    setMode,
    setScore,
    setAnswers,
    setFreeText,
    setConcerns,
    setInsurance,
    setLocation,
    setResult,
    reset,
  }
}
