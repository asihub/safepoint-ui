const PROGRESS_KEY = 'sp_progress'
const TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export function saveProgress(data) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify({ ...data, timestamp: Date.now() }))
}

export function clearProgress() {
  localStorage.removeItem(PROGRESS_KEY)
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (Date.now() - data.timestamp > TTL_MS) {
      clearProgress()
      return null
    }
    return data
  } catch {
    return null
  }
}
