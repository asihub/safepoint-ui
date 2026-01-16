import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { useAssessmentContext } from '../App'
import { getFacilities } from '../api/client'
import { MapPin, Phone, Loader2, Search } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix Leaflet default marker icon (broken in Vite by default)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function Resources() {
  const { assessment } = useAssessmentContext()
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [location, setLocation] = useState(assessment.location)
  const [zip, setZip] = useState('')
  const [locationLabel, setLocationLabel] = useState(null)
  const [showMap, setShowMap] = useState(true)

  // Try geolocation on mount
  useEffect(() => {
    if (!location) {
      navigator.geolocation?.getCurrentPosition(
        pos => {
          setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
          setLocationLabel('your current location')
        },
        () => setError('location_denied')
      )
    }
  }, [])

  // Fetch facilities when location is available
  useEffect(() => {
    if (!location) return
    setLoading(true)
    setError(null)
    getFacilities(location.latitude, location.longitude, assessment.insuranceType)
      .then(data => setFacilities(data))
      .catch(() => setError('fetch_failed'))
      .finally(() => setLoading(false))
  }, [location])

  const handleZipSearch = () => {
    const clean = zip.trim()
    if (!/^\d{5}$/.test(clean)) {
      setError('invalid_zip')
      return
    }
    // Approximate coordinates from ZIP prefix
    const prefix = parseInt(clean.substring(0, 3))
    let lat = 39.5, lng = -98.35
    if (prefix < 200)      { lat = 40.7;  lng = -74.0  }
    else if (prefix < 400) { lat = 38.9;  lng = -77.0  }
    else if (prefix < 500) { lat = 33.7;  lng = -84.4  }
    else if (prefix < 600) { lat = 41.9;  lng = -87.6  }
    else if (prefix < 700) { lat = 38.6;  lng = -90.2  }
    else if (prefix < 800) { lat = 29.8;  lng = -95.4  }
    else if (prefix < 900) { lat = 39.7;  lng = -104.9 }
    else                   { lat = 34.0;  lng = -118.2 }
    setLocation({ latitude: lat, longitude: lng })
    setLocationLabel(`ZIP ${clean}`)
    setError(null)
  }

  const mapCenter = location
    ? [location.latitude, location.longitude]
    : [39.5, -98.35]

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-6 py-8">
      <h2
        className="mb-2"
        style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.8rem' }}
      >
        Support near you
      </h2>
      <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
        Mental health treatment facilities in your area.
        {assessment.insuranceType && assessment.insuranceType !== 'UNKNOWN' &&
          ` Filtered for ${assessment.insuranceType.toLowerCase()} insurance.`}
      </p>

      {/* 988 — always shown */}
      <a
        href="tel:988"
        className="flex items-center gap-3 px-4 py-4 rounded-2xl mb-4 font-medium"
        style={{ background: 'var(--sage-dark)', color: 'var(--white)' }}
      >
        <Phone size={20} />
        <div>
          <div className="font-semibold">988 Suicide & Crisis Lifeline</div>
          <div className="text-xs" style={{ opacity: 0.75 }}>
            Free, confidential — call or text 988
          </div>
        </div>
      </a>

      {/* ZIP code input */}
      <div
        className="rounded-2xl p-4 mb-4"
        style={{ background: 'var(--white)', border: '1px solid var(--sand-dark)' }}
      >
        <p className="text-sm font-medium mb-3" style={{ color: 'var(--charcoal)' }}>
          {location && error !== 'location_denied'
            ? `Showing results near ${locationLabel || 'your location'}`
            : 'Enter your ZIP code to find nearby facilities'}
        </p>
        <div className="flex gap-2">
          <input
            value={zip}
            onChange={e => setZip(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleZipSearch()}
            placeholder="e.g. 92101"
            maxLength={5}
            className="flex-1 px-3 py-2 rounded-xl border text-sm outline-none"
            style={{ borderColor: 'var(--sand-dark)', fontFamily: "'DM Sans', sans-serif" }}
          />
          <button
            onClick={handleZipSearch}
            className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: 'var(--sage-dark)', color: 'var(--white)' }}
          >
            <Search size={16} /> Search
          </button>
        </div>
        {error === 'invalid_zip' && (
          <p className="text-xs mt-2" style={{ color: 'var(--high)' }}>
            Please enter a valid 5-digit ZIP code.
          </p>
        )}
      </div>

      {/* Map */}
      {location && (
        <div className="rounded-2xl overflow-hidden mb-4" style={{ height: 280 }}>
          <MapContainer key={`${location.latitude}-${location.longitude}`}
            center={mapCenter}
            zoom={11}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* User location marker */}
            <Marker position={mapCenter}>
              <Popup>Your location</Popup>
            </Marker>
            {/* Facility markers */}
            {facilities.map((f, i) => {
              const lat = parseFloat(f.latitude)
              const lng = parseFloat(f.longitude)
              if (!lat || !lng) return null
              return (
                <Marker key={i} position={[lat, lng]}>
                  <Popup>
                    <strong>{f.name1 || f.name}</strong>
                    {f.street1 && <><br />{f.street1}</>}
                    {f.city && <><br />{f.city}, {f.state}</>}
                    {f.phone && <><br /><a href={`tel:${f.phone}`}>{f.phone}</a></>}
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8" style={{ color: 'var(--muted)' }}>
          <Loader2 size={20} className="animate-spin mr-2" />
          Finding facilities near you...
        </div>
      )}

      {/* Fetch error */}
      {error === 'fetch_failed' && (
        <div className="rounded-xl p-4 mb-4" style={{ background: '#FDECEA', color: 'var(--high)' }}>
          <p className="text-sm">Could not load facilities. Please try again.</p>
        </div>
      )}

      {/* No results */}
      {!loading && !error && facilities.length === 0 && location && (
        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
          No facilities found nearby. Try a different ZIP code or insurance filter.
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
  const name    = facility.name1 || facility.name || 'Mental Health Facility'
  const street  = facility.street1 || ''
  const city    = facility.city || ''
  const state   = facility.state || ''
  const address = [street, city, state].filter(Boolean).join(', ')
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
          <MapPin size={13} className="mt-0.5 flex-shrink-0" />
          <span>{address}</span>
        </div>
      )}
      {phone && (
        <a
          href={`tel:${phone}`}
          className="flex items-center gap-2 text-xs font-medium"
          style={{ color: 'var(--sage-dark)' }}
        >
          <Phone size={13} />
          {phone}
        </a>
      )}
    </div>
  )
}
