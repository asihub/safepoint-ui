import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Shield, User, UserCheck } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage'

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t, lang, switchLang } = useLanguage()
  const isHome = location.pathname === '/'
  const authUser = (() => { try { return JSON.parse(localStorage.getItem('sp_user') || 'null') } catch { return null } })()
  const isLoggedIn = !!authUser?.username
  // Disable language switcher during screening to prevent mid-questionnaire language change
  const isScreening = location.pathname === '/screening'
  // Show back-to-results button on secondary pages
  const showBackToResults = false

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--sand)' }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: 'var(--sand-dark)', background: 'var(--white)' }}
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 hover:opacity-70 transition-opacity"
        >
          <Shield size={22} style={{ color: 'var(--sage-dark)' }} />
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.25rem', color: 'var(--charcoal)' }}>
            {t('appName')}
          </span>
        </button>

        {showBackToResults && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-full border transition-colors hover:opacity-80"
            style={{ borderColor: 'var(--sand-dark)', color: 'var(--muted)', fontSize: '0.8rem' }}>
            ← Results
          </button>
        )}

        <div className="flex items-center gap-3">
            <button onClick={() => navigate('/auth')}
              title={isLoggedIn ? authUser.username : 'Sign in to back up your safety plan'}
              className="flex items-center justify-center w-8 h-8 rounded-full border transition-colors hover:opacity-80"
              style={{
                borderColor: isLoggedIn ? 'var(--sage-dark)' : 'var(--sand-dark)',
                background:  isLoggedIn ? 'var(--sage-dark)' : 'transparent',
                color:       isLoggedIn ? 'var(--white)'     : 'var(--muted)',
              }}>
              {isLoggedIn ? <UserCheck size={15} /> : <User size={15} />}
            </button>
          {/* Language switcher — disabled during screening */}
          <div
            className="flex rounded-full overflow-hidden border text-xs font-medium"
            style={{ borderColor: 'var(--sand-dark)', opacity: isScreening ? 0.4 : 1 }}
          >
            {['en', 'es'].map(l => (
              <button
                key={l}
                onClick={() => !isScreening && switchLang(l)}
                disabled={isScreening}
                className="px-3 py-1 transition-all"
                style={{
                  background: lang === l ? 'var(--sage-dark)' : 'transparent',
                  color: lang === l ? 'var(--white)' : 'var(--muted)',
                  cursor: isScreening ? 'not-allowed' : 'pointer',
                }}
              >
                {l === 'en' ? 'EN' : 'ES'}
              </button>
            ))}
          </div>


        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* Footer */}
      <footer
        className="text-center py-4 text-xs"
        style={{ color: 'var(--muted)', borderTop: '1px solid var(--sand-dark)' }}
      >
        {t('footerText')}{' '}
        <a href="tel:988" className="underline font-medium">988</a>
        {' '}{t('footerOr')}{' '}
        <a href="tel:911" className="underline font-medium">911</a>.
      </footer>
    </div>
  )
}
