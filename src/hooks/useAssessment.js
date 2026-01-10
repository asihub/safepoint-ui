import { useState } from 'react'

// Global assessment state shared across screens
const initialState = {
  mode: null,              // 'self' | 'proxy'
  questionnaireScores: {}, // { phq9: 14, gad7: 10, ... }
  freeText: '',
  insuranceType: 'UNKNOWN',
  location: null,          // { latitude, longitude }
  result: null,            // AnalysisResponse from API
}

export function useAssessment() {
  const [assessment, setAssessment] = useState(initialState)

  const setMode = (mode) =>
    setAssessment(prev => ({ ...prev, mode }))

  const setScore = (key, value) =>
    setAssessment(prev => ({
      ...prev,
      questionnaireScores: { ...prev.questionnaireScores, [key]: value }
    }))

  const setFreeText = (text) =>
    setAssessment(prev => ({ ...prev, freeText: text }))

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
    setFreeText,
    setInsurance,
    setLocation,
    setResult,
    reset,
  }
}
