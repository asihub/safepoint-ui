import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../hooks/useLanguage.jsx'
import {
  ChevronLeft, ExternalLink,
  Wind, Moon, Dumbbell, Apple, Users, Heart, Shield, Sparkles,
} from 'lucide-react'
import { getWellbeingResources } from '../api/client'

const PAGE_SIZE = 5

const CATEGORIES = [
  { key: 'All',        label: 'All',         icon: <Sparkles size={14} /> },
  { key: 'Anxiety',    label: 'Anxiety',     icon: <Wind size={14} /> },
  { key: 'Mindfulness',label: 'Mindfulness', icon: <Sparkles size={14} /> },
  { key: 'Sleep',      label: 'Sleep',       icon: <Moon size={14} /> },
  { key: 'Resilience', label: 'Resilience',  icon: <Shield size={14} /> },
  { key: 'Exercise',   label: 'Exercise',    icon: <Dumbbell size={14} /> },
  { key: 'Nutrition',  label: 'Nutrition',   icon: <Apple size={14} /> },
  { key: 'Social',     label: 'Social',      icon: <Users size={14} /> },
  { key: 'Self-care',  label: 'Self-care',   icon: <Heart size={14} /> },
]

const CATEGORY_META = {
  Anxiety:    { bg: '#EDF4EE', color: 'var(--sage-dark)', icon: <Wind size={15} /> },
  Mindfulness:{ bg: '#EEF4F8', color: '#4A7A9B',          icon: <Sparkles size={15} /> },
  Sleep:      { bg: '#F4F0EE', color: '#7A6B5A',          icon: <Moon size={15} /> },
  Resilience: { bg: '#F4EEF4', color: '#7A6B8A',          icon: <Shield size={15} /> },
  Exercise:   { bg: '#EDF4EE', color: 'var(--sage-dark)', icon: <Dumbbell size={15} /> },
  Nutrition:  { bg: '#F8F4EE', color: '#8A7A5A',          icon: <Apple size={15} /> },
  Social:     { bg: '#EEF4F8', color: '#4A7A9B',          icon: <Users size={15} /> },
  'Self-care':{ bg: '#F4F0EE', color: '#7A6B5A',          icon: <Heart size={15} /> },
}

export default function Wellbeing() {
  const navigate  = useNavigate()
  const [resources, setResources] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [expanded,  setExpanded]  = useState(null)
  const [activeCategory, setActiveCategory] = useState('All')
  const [page, setPage] = useState(1)

  useEffect(() => {
    getWellbeingResources()
      .then(data => { setResources(data); setLoading(false) })
      .catch(() => { setError('Could not load resources.'); setLoading(false) })
  }, [])

  // Filter
  const filtered = activeCategory === 'All'
    ? resources
    : resources.filter(r => r.category === activeCategory)

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleCategoryChange = (key) => {
    setActiveCategory(key)
    setPage(1)
    setExpanded(null)
  }

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
      <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>
        Self-help articles and guides to support your mental wellness.
      </p>

      {/* Category filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map(cat => {
          const active = activeCategory === cat.key
          const meta   = CATEGORY_META[cat.key]
          return (
            <button
              key={cat.key}
              onClick={() => handleCategoryChange(cat.key)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all"
              style={{
                background:   active ? (meta?.bg  ?? 'var(--sage-dark)') : 'transparent',
                color:        active ? (meta?.color ?? 'var(--white)')    : 'var(--muted)',
                borderColor:  active ? (meta?.color ?? 'var(--sage-dark)'): 'var(--sand-dark)',
                fontWeight:   active ? 600 : 400,
              }}
            >
              {cat.icon}
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--sand-dark)', borderTopColor: 'var(--sage)' }} />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-center py-8" style={{ color: 'var(--high)' }}>{error}</p>
      )}

      {/* Results count */}
      {!loading && !error && (
        <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
          {filtered.length} article{filtered.length !== 1 ? 's' : ''}
          {activeCategory !== 'All' ? ` in ${activeCategory}` : ''}
        </p>
      )}

      {/* Pagination top */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => { setPage(p => Math.max(1, p - 1)); setExpanded(null); window.scrollTo(0, 0) }}
            disabled={page === 1}
            className="px-4 py-1.5 rounded-xl text-xs font-medium border transition-all"
            style={{
              borderColor: 'var(--sand-dark)',
              color: page === 1 ? 'var(--sand-dark)' : 'var(--charcoal)',
              opacity: page === 1 ? 0.4 : 1,
            }}>
            ← Prev
          </button>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => { setPage(p => Math.min(totalPages, p + 1)); setExpanded(null); window.scrollTo(0, 0) }}
            disabled={page === totalPages}
            className="px-4 py-1.5 rounded-xl text-xs font-medium border transition-all"
            style={{
              borderColor: 'var(--sand-dark)',
              color: page === totalPages ? 'var(--sand-dark)' : 'var(--charcoal)',
              opacity: page === totalPages ? 0.4 : 1,
            }}>
            Next →
          </button>
        </div>
      )}

      {/* Resource list */}
      {!loading && !error && (
        <div className="flex flex-col gap-3">
          {paginated.map(resource => {
            const palette = CATEGORY_META[resource.category] ?? { bg: 'var(--sand-dark)', color: 'var(--muted)', icon: null }
            const isOpen  = expanded === resource.id
            return (
              <div key={resource.id}
                className="rounded-2xl overflow-hidden"
                style={{ background: 'var(--white)', border: '1px solid var(--sand-dark)' }}>

                {/* Card header */}
                <button
                  onClick={() => setExpanded(isOpen ? null : resource.id)}
                  className="w-full flex items-start justify-between gap-3 px-5 py-4 text-left"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <div className="flex-1">
                    {/* Category badge with icon */}
                    <div className="flex items-center gap-1 mb-1.5">
                      <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: palette.bg, color: palette.color }}>
                        {palette.icon}
                        {resource.category}
                      </span>
                    </div>
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
                    {isOpen ? '▲' : '▼'}
                  </span>
                </button>

                {/* Expanded excerpt + link */}
                {isOpen && (
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
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => { setPage(p => Math.max(1, p - 1)); setExpanded(null); window.scrollTo(0, 0) }}
            disabled={page === 1}
            className="px-4 py-1.5 rounded-xl text-xs font-medium border transition-all"
            style={{
              borderColor: 'var(--sand-dark)',
              color: page === 1 ? 'var(--sand-dark)' : 'var(--charcoal)',
              opacity: page === 1 ? 0.4 : 1,
            }}>
            ← Prev
          </button>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => { setPage(p => Math.min(totalPages, p + 1)); setExpanded(null); window.scrollTo(0, 0) }}
            disabled={page === totalPages}
            className="px-4 py-1.5 rounded-xl text-xs font-medium border transition-all"
            style={{
              borderColor: 'var(--sand-dark)',
              color: page === totalPages ? 'var(--sand-dark)' : 'var(--charcoal)',
              opacity: page === totalPages ? 0.4 : 1,
            }}>
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
