import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Shield } from 'lucide-react'

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
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
          <span
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '1.25rem',
              color: 'var(--charcoal)',
            }}
          >
            SafePoint
          </span>
        </button>

        {!isHome && (
          <button
            onClick={() => navigate('/safety-plan')}
            className="text-sm px-3 py-1.5 rounded-full border transition-colors hover:opacity-80"
            style={{
              borderColor: 'var(--sage)',
              color: 'var(--sage-dark)',
              fontSize: '0.8rem',
            }}
          >
            My Safety Plan
          </button>
        )}
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
        SafePoint does not store personal information.
        If you are in immediate danger, call{' '}
        <a href="tel:911" className="underline">911</a>.
      </footer>
    </div>
  )
}
