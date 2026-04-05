import { useNavigate } from 'react-router-dom'
import { useAssessmentContext } from '../App'
import { useLanguage } from '../hooks/useLanguage'
import { Heart, Users, Shield } from 'lucide-react'

export default function Home() {
  const navigate = useNavigate()
  const { setMode, reset } = useAssessmentContext()
  const { t } = useLanguage()

  const start = (mode) => {
    reset()
    setMode(mode)
    navigate('/screening')
  }

  const startCrisis = () => {
    reset()
    setMode('self')
    navigate('/resources')
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      {/* Hero */}
      <div className="text-center mb-12 max-w-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'var(--sage-light)' }}>
            <Shield size={28} style={{ color: 'var(--sage-dark)' }} />
          </div>
        </div>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2.5rem', lineHeight: 1.15, color: 'var(--charcoal)', marginBottom: '1rem' }}>
          {t('heroTitle')}
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '1rem', lineHeight: 1.6 }}>
          {t('heroSubtitle')}
        </p>
      </div>

      {/* Mode selection */}
      <div className="flex flex-col gap-4 w-full max-w-lg">
        <ModeCard icon={<Heart size={22} />} title={t('modeQuickCheck')}
          description={t('modeQuickCheckDesc')} onClick={() => start('self')} primary />
        <ModeCard icon={<Users size={22} />} title={t('modeHelpNow')}
          description={t('modeHelpNowDesc')} onClick={() => startCrisis()} urgent />
        <ModeCard icon={<Shield size={22} />} title={t('modeWorriedAbout')}
          description={t('modeWorriedAboutDesc')} onClick={() => start('proxy')} />
      </div>

      <p className="mt-10 text-sm" style={{ color: 'var(--muted)' }}>
        {t('crisisPrompt')}{' '}
        <a href="tel:988" className="font-semibold underline" style={{ color: 'var(--sage-dark)' }}>
          {t('callOrText988')}
        </a>
      </p>
    </div>
  )
}

function ModeCard({ icon, title, description, onClick, primary, urgent }) {
  const bg = urgent ? 'var(--high)' : primary ? 'var(--sage-dark)' : 'var(--white)'
  const color = urgent || primary ? 'var(--white)' : 'var(--charcoal)'
  const border = urgent || primary ? 'none' : '1px solid var(--sand-dark)'
  return (
    <button onClick={onClick} className="w-full text-left px-5 py-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{ background: bg, color, border, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <div className="flex items-center gap-3 mb-1">
        <span style={{ opacity: 0.85 }}>{icon}</span>
        <span className="font-semibold" style={{ fontSize: '1rem' }}>{title}</span>
      </div>
      <p style={{ fontSize: '0.85rem', opacity: 0.75, paddingLeft: '2.2rem' }}>{description}</p>
    </button>
  )
}
