import { useState, useEffect } from 'react'

const STORAGE_KEY = 'safepoint_history'
const MAX_ENTRIES = 30

/**
 * Hook for managing assessment history in localStorage.
 * Uses a ref-based deduplication to prevent double-saves from React StrictMode.
 */
export function useHistory() {
  const [history, setHistory] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  // Re-read from localStorage on mount to ensure we have latest data
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setHistory(JSON.parse(raw))
    } catch {}
  }, [])

  const addEntry = (result) => {
    setHistory(prev => {
      // Deduplicate: skip if same result was saved within the last 5 seconds
      if (prev.length > 0) {
        const last = prev[0]
        const diff = Date.now() - new Date(last.timestamp).getTime()
        if (diff < 5000 &&
            last.riskLevel === result.riskLevel &&
            last.phq9Score === result.phq9Score &&
            last.gad7Score === result.gad7Score) {
          return prev
        }
      }

      const entry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        riskLevel: result.riskLevel,
        phq9Score: result.phq9Score,
        gad7Score: result.gad7Score,
        confidence: result.confidence,
        signals: result.aiAnalysis?.signals || [],
      }

      const updated = [entry, ...prev].slice(0, MAX_ENTRIES)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }

  const clearHistory = () => {
    localStorage.removeItem(STORAGE_KEY)
    setHistory([])
  }

  return { history, addEntry, clearHistory }
}
