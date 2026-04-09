import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage.jsx'
import { ChevronLeft, ExternalLink, Leaf } from 'lucide-react'
import { getWellbeingResources } from '../api/client'

const CATEGORY_COLORS = {
  Anxiety:    { bg: '#EDF4EE', color: 'var(--sage-dark)' },
  Mindfulness:{ bg: '#EEF4F8', color: '#4A7A9B' },
  Sleep:      { bg: '#F4F0EE', color: '#7A6B5A' },
  Resilience: { bg: '#F4EEF4', color: '#7A6B8A' },
  Exercise:   { bg: '#EDF4EE', color: 'var(--sage-dark)' },
  Nutrition:  { bg: '#F8F4EE', color: '#8A7A5A' },
  Social:     { bg: '#EEF4F8', color: '#4A7A9B' },
  'Self-care':{ bg: '#F4F0EE', color: '#7A6B5A' },
}

export default function Wellbeing() {
  const navigate   = useNavigate()
  const { t }      = useLanguage()
  const [resources, setResources] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [expanded,  setExpanded]  = useState(null)

  useEffect(() => {
    getWellbeingResources()
      .then(data => { setResources(data); setLoading(false) })
      .catch(() => { setError('Could not load resources.'); setLoading(false) })
  }, [])

  // Group by category
  const grouped = resources.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = []
    acc[r.category].push(r)
    return acc
  }, {})

  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate('/')} style={{ color: 'var(--muted)' }}>
          <ChevronLeft size={22} />
        </button>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.8rem' }}>
          Wellbeing Resources
        </h2>
      </div>
      <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
        Self-help articles and guides to support your mental wellness.
      </p>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--sand-dark)', borderTopColor: 'var(--sage)' }} />
        </div>
      )}

      {error && (
        <p className="text-sm text-center py-8" style={{ color: 'var(--high)' }}>{error}</p>
      )}

      {!loading && !error && (
        <div className="flex flex-col gap-6">
          {Object.entries(grouped).map(([category, items]) => {
            const palette = CATEGORY_COLORS[category] || { bg: 'var(--sand-dark)', color: 'var(--muted)' }
            return (
              <div key={category}>
                {/* Category label */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: palette.bg, color: palette.color }}>
                    {category}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {items.map(resource => (
                    <div key={resource.id}
                      className="rounded-2xl overflow-hidden"
                      style={{ background: 'var(--white)', border: '1px solid var(--sand-dark)' }}>

                      {/* Card header */}
                      <button
                        onClick={() => setExpanded(expanded === resource.id ? null : resource.id)}
                        className="w-full flex items-start justify-between gap-3 px-5 py-4 text-left"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color: 'var(--charcoal)' }}>
                            {resource.title}
                          </p>
                          {resource.description && (
                            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                              {resource.description}
                            </p>
                          )}
                        </div>
                        <span style={{ color: 'var(--muted)', fontSize: '0.7rem', flexShrink: 0, marginTop: 2 }}>
                          {expanded === resource.id ? '▲' : '▼'}
                        </span>
                      </button>

                      {/* Expanded excerpt + link */}
                      {expanded === resource.id && (
                        <div className="px-5 pb-4"
                          style={{ borderTop: '1px solid var(--sand-dark)', paddingTop: '0.75rem' }}>
                          {resource.excerpt ? (
                            <p className="text-sm mb-4" style={{ color: 'var(--charcoal)', lineHeight: 1.7 }}>
                              {resource.excerpt}
                            </p>
                          ) : (
                            <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
                              No summary available yet.
                            </p>
                          )}
                          <a href={resource.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-sm font-medium"
                            style={{ color: palette.color }}>
                            Read full article <ExternalLink size={14} />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
