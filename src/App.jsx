import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { createContext, useContext } from 'react'
import { useAssessment } from './hooks/useAssessment'
import { LanguageProvider } from './hooks/useLanguage'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import Screening from './pages/Screening'
import FreeText from './pages/FreeText'
import Results from './pages/Results'
import Resources from './pages/Resources'
import SafetyPlan from './pages/SafetyPlan'
import Auth from './pages/Auth'
import Progress from './pages/Progress'
import Wellbeing from './pages/Wellbeing'

export const AssessmentContext = createContext(null)
export function useAssessmentContext() {
  return useContext(AssessmentContext)
}

export default function App() {
  const assessment = useAssessment()

  return (
    <LanguageProvider>
      <AssessmentContext.Provider value={assessment}>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="screening" element={<Screening />} />
              <Route path="text" element={<FreeText />} />
              <Route path="results" element={<Results />} />
              <Route path="resources" element={<Resources />} />
              <Route path="safety-plan" element={<SafetyPlan />} />
              <Route path="auth" element={<Auth />} />
              <Route path="progress" element={<Progress />} />
              <Route path="wellbeing" element={<Wellbeing />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AssessmentContext.Provider>
    </LanguageProvider>
  )
}
