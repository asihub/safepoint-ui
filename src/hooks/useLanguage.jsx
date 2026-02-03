import { useState, createContext, useContext } from 'react'
import { translations } from './translations'

export const LanguageContext = createContext(null)

/**
 * Language context provider — wraps the app.
 * Provides t() function for translations and language switcher.
 */
export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    // Detect browser language on first load
    const saved = localStorage.getItem('safepoint_lang')
    if (saved) return saved
    const browser = navigator.language?.toLowerCase()
    return browser?.startsWith('es') ? 'es' : 'en'
  })

  const switchLang = (newLang) => {
    setLang(newLang)
    localStorage.setItem('safepoint_lang', newLang)
  }

  // Translation function — falls back to English if key missing
  const t = (key) => translations[lang]?.[key] ?? translations.en[key] ?? key

  return (
    <LanguageContext.Provider value={{ lang, switchLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
