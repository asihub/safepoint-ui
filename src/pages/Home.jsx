import { useNavigate } from 'react-router-dom'
import { useAssessmentContext } from '../App'
import { Heart, Users, Shield } from 'lucide-react'

export default function Home() {
  const navigate = useNavigate()
  const { setMode, reset } = useAssessmentContext()

  const start = (mode) => {
    reset()
    setMode(mode)
    navigate('/screening')
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">

      {/* Hero */}
      <div className="text-center mb-12 max-w-lg">
        <div className="flex justify-center mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'var(--sage-light)' }}
          >
            <Shield size={28} style={{ color: 'var(--sage-dark)' }} />
          </div>
        </div>
        <h1
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '2.5rem',
            lineHeight: 1.15,
            color: 'var(--charcoal)',
            marginBottom: '1rem',
          }}
        >
          A safe place to check in with yourself
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '1rem', lineHeight: 1.6 }}>
          Anonymous. Free. No account required.
          Takes about 5 minutes.
        </p>
      </div>

      {/* Mode selection */}
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <ModeCard
          icon={<Heart size={22} />}
          title="Quick Check"
          description="I want to understand how I'm feeling"
          onClick={() => start('self')}
          primary
        />
        <ModeCard
          icon={<Users size={22} />}
          title="I Need Help Now"
          description="I'm in distress and need immediate support"
          onClick={() => start('self')}
          urgent
        />
        <ModeCard
          icon={<Shield size={22} />}
          title="I'm Worried About Someone"
          description="I want to assess someone else's situation"
          onClick={() => start('proxy')}
        />
      </div>

      {/* Crisis line */}
      <p className="mt-10 text-sm" style={{ color: 'var(--muted)' }}>
        In crisis right now?{' '}
        <a
          href="tel:988"
          className="font-semibold underline"
          style={{ color: 'var(--sage-dark)' }}
        >
          Call or text 988
        </a>
      </p>
    </div>
  )
}

function ModeCard({ icon, title, description, onClick, primary, urgent }) {
  const bg = urgent
    ? 'var(--high)'
    : primary
    ? 'var(--sage-dark)'
    : 'var(--white)'

  const color = urgent || primary ? 'var(--white)' : 'var(--charcoal)'
  const border = urgent || primary ? 'none' : '1px solid var(--sand-dark)'

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-5 py-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
      style={{ background: bg, color, border, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
    >
      <div className="flex items-center gap-3 mb-1">
        <span style={{ opacity: 0.85 }}>{icon}</span>
        <span className="font-semibold" style={{ fontSize: '1rem' }}>{title}</span>
      </div>
      <p style={{ fontSize: '0.85rem', opacity: 0.75, paddingLeft: '2.2rem' }}>
        {description}
      </p>
    </button>
  )
}
