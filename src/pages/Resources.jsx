import { useState, useEffect } from 'react'
import { useAssessmentContext } from '../App'
import { getFacilities } from '../api/client'
import { MapPin, Phone, Clock, Loader2, Navigation } from 'lucide-react'

export default function Resources() {
  const { assessment } = useAssessmentContext()
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [location, setLocation] = useState(assessment.location)

  useEffect(() => {
    if (!location) {
      // Request geolocation
      navigator.geolocation?.getCurrentPosition(
        pos => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => setError('Location access denied. Please enable location to find nearby resources.')
      )
    }
  }, [])

  useEffect(() => {
    if (!location) return
    setLoading(true)
    getFacilities(location.latitude, location.longitude, assessment.insuranceType)
      .then(data => setFacilities(data))
      .catch(() => setError('Could not load facilities. Please try again.'))
      .finally(() => setLoading(false))
  }, [location])

  return (
    <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-8">
      <h2
        className="mb-2"
        style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.8rem' }}
      >
        Support near you
      </h2>
      <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>
        Mental health treatment facilities in your area.
        {assessment.insuranceType && assessment.insuranceType !== 'UNKNOWN' &&
          ` Filtered for ${assessment.insuranceType.toLowerCase()} insurance.`}
      </p>

      {/* 988 always shown */}
      <a
        href="tel:988"
        className="flex items-center gap-3 px-4 py-3 rounded-xl mb-6 font-medium"
        style={{ background: 'var(--sage-dark)', color: 'var(--white)' }}
      >
        <Phone size={18} />
        <div>
          <div className="font-semibold">988 Suicide & Crisis Lifeline</div>
          <div className="text-xs opacity-75">Free, confidential — call or text 988</div>
        </div>
      </a>

      {loading && (
        <div className="flex items-center justify-center py-12" style={{ color: 'var(--muted)' }}>
          <Loader2 size={24} className="animate-spin mr-3" />
          Finding facilities near you...
        </div>
      )}

      {error && (
        <div className="rounded-xl p-4" style={{ background: '#FDECEA', color: 'var(--high)' }}>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && facilities.length === 0 && location && (
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          No facilities found nearby. Try adjusting your insurance filter.
        </p>
      )}

      {/* Facility list */}
      <div className="flex flex-col gap-3">
        {facilities.map((f, i) => (
          <FacilityCard key={i} facility={f} />
        ))}
      </div>
    </div>
  )
}

function FacilityCard({ facility }) {
  const name    = facility.name1 || facility.name || 'Facility'
  const address = [facility.street1, facility.city, facility.state].filter(Boolean).join(', ')
  const phone   = facility.phone

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'var(--white)', border: '1px solid var(--sand-dark)' }}
    >
      <div className="font-semibold text-sm mb-2" style={{ color: 'var(--charcoal)' }}>
        {name}
      </div>
      {address && (
        <div className="flex items-start gap-2 text-xs mb-2" style={{ color: 'var(--muted)' }}>
          <MapPin size={14} className="mt-0.5 flex-shrink-0" />
          {address}
        </div>
      )}
      {phone && (
        <a
          href={`tel:${phone}`}
          className="flex items-center gap-2 text-xs font-medium"
          style={{ color: 'var(--sage-dark)' }}
        >
          <Phone size={14} />
          {phone}
        </a>
      )}
    </div>
  )
}
