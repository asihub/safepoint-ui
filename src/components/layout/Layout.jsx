import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { useLanguage } from '../../hooks/useLanguage.jsx'

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t, lang, switchLang } = useLanguage()
  const isHome = location.pathname === '/'

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

        <div className="flex items-center gap-3">
          {/* Language switcher */}
          <div
            className="flex rounded-full overflow-hidden border text-xs font-medium"
            style={{ borderColor: 'var(--sand-dark)' }}
          >
            {['en', 'es'].map(l => (
              <button
                key={l}
                onClick={() => switchLang(l)}
                className="px-3 py-1 transition-all"
                style={{
                  background: lang === l ? 'var(--sage-dark)' : 'transparent',
                  color: lang === l ? 'var(--white)' : 'var(--muted)',
                }}
              >
                {l === 'en' ? 'EN' : 'ES'}
              </button>
            ))}
          </div>

          {!isHome && (
            <button
              onClick={() => navigate('/safety-plan')}
              className="text-sm px-3 py-1.5 rounded-full border transition-colors hover:opacity-80"
              style={{ borderColor: 'var(--sage)', color: 'var(--sage-dark)', fontSize: '0.8rem' }}
            >
              {t('mySafetyPlan')}
            </button>
          )}
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
        <a href="tel:911" className="underline">911</a>.
      </footer>
    </div>
  )
}
