import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { useAssessmentContext } from '../App'
import { useLanguage } from '../hooks/useLanguage.jsx'
import { getFacilities } from '../api/client'
import { MapPin, Phone, Loader2, Search } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Distance options — label and value in meters (SAMHSA limitValue)
const DISTANCE_OPTIONS = [
  { label: '5 miles',  miles: 5,  meters: 8047  },
  { label: '10 miles', miles: 10, meters: 16093 },
  { label: '25 miles', miles: 25, meters: 40234 },
  { label: '50 miles', miles: 50, meters: 80467 },
]

export default function Resources() {
  const { assessment } = useAssessmentContext()
  const { t }          = useLanguage()

  const [facilities,     setFacilities]     = useState([])
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState(null)
  const [location,       setLocation]       = useState(assessment.location)
  const [zip,            setZip]            = useState('')
  const [locationLabel,  setLocationLabel]  = useState(null)
  const [distanceIdx,    setDistanceIdx]    = useState(1) // default 10 miles

  const distance = DISTANCE_OPTIONS[distanceIdx]

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

  // Fetch facilities when location or distance changes
  useEffect(() => {
    if (!location) return
    setLoading(true)
    setError(null)
    getFacilities(location.latitude, location.longitude, assessment.insuranceType, 25, distance.meters)
      .then(data => setFacilities(data))
      .catch(() => setError('fetch_failed'))
      .finally(() => setLoading(false))
  }, [location, distanceIdx])

  const handleZipSearch = async () => {
    const clean = zip.trim()
    if (!/^\d{5}$/.test(clean)) { setError('invalid_zip'); return }
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${clean}&country=US&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      const data = await res.json()
      if (data.length === 0) { setError('zip_not_found'); setLoading(false); return }
      const { lat, lon, display_name } = data[0]
      const parts = display_name.split(', ')
      const label = parts.length >= 2 ? `${parts[0]}, ${parts[1]}` : `ZIP ${clean}`
      setLocation({ latitude: parseFloat(lat), longitude: parseFloat(lon) })
      setLocationLabel(label)
    } catch {
      setError('geocode_failed')
    } finally {
      setLoading(false)
    }
  }

  const mapCenter = location ? [location.latitude, location.longitude] : [39.5, -98.35]

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-6 py-8">
      <h2 className="mb-2" style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.8rem' }}>
        {t('supportNearYou')}
      </h2>
      <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
        {t('resourcesSubtitle')}
        {assessment.insuranceType && assessment.insuranceType !== 'UNKNOWN' &&
          ` Filtered for ${assessment.insuranceType.toLowerCase()} insurance.`}
      </p>

      {/* 988 */}
      <a href="tel:988"
        className="flex items-center gap-3 px-4 py-4 rounded-2xl mb-4 font-medium"
        style={{ background: 'var(--sage-dark)', color: 'var(--white)' }}>
        <Phone size={20} />
        <div>
          <div className="font-semibold">{t('crisis988Title')}</div>
          <div className="text-xs" style={{ opacity: 0.75 }}>{t('crisis988Subtitle')}</div>
        </div>
      </a>

      {/* ZIP + Distance filter */}
      <div className="rounded-2xl p-4 mb-4"
        style={{ background: 'var(--white)', border: '1px solid var(--sand-dark)' }}>
        <p className="text-sm font-medium mb-3" style={{ color: 'var(--charcoal)' }}>
          {location && error !== 'location_denied'
            ? `${t('showingResultsNear')} ${locationLabel || 'your location'}`
            : t('enterZip')}
        </p>

        {/* ZIP input row */}
        <div className="flex gap-2 mb-3">
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
            style={{ background: 'var(--sage-dark)', color: 'var(--white)' }}>
            <Search size={16} /> {t('search')}
          </button>
        </div>

        {/* Distance filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: 'var(--muted)', flexShrink: 0 }}>
            Within:
          </span>
          <div className="flex gap-1.5 flex-wrap">
            {DISTANCE_OPTIONS.map((opt, i) => (
              <button key={i} onClick={() => setDistanceIdx(i)}
                className="text-xs px-3 py-1 rounded-full border transition-all"
                style={{
                  background:   distanceIdx === i ? 'var(--sage-dark)' : 'transparent',
                  color:        distanceIdx === i ? 'var(--white)'     : 'var(--muted)',
                  borderColor:  distanceIdx === i ? 'var(--sage-dark)' : 'var(--sand-dark)',
                  fontWeight:   distanceIdx === i ? 600 : 400,
                }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {error === 'invalid_zip' && (
          <p className="text-xs mt-2" style={{ color: 'var(--high)' }}>
            {t('invalidZip')}
          </p>
        )}
        {error === 'zip_not_found' && (
          <p className="text-xs mt-2" style={{ color: 'var(--high)' }}>
            {t('zipNotFound')}
          </p>
        )}
        {error === 'geocode_failed' && (
          <p className="text-xs mt-2" style={{ color: 'var(--high)' }}>
            {t('geocodeFailed')}
          </p>
        )}
      </div>

      {/* Map */}
      {location && (
        <div className="rounded-2xl overflow-hidden mb-4" style={{ height: 280 }}>
          <MapContainer
            key={`${location.latitude}-${location.longitude}-${distanceIdx}`}
            center={mapCenter} zoom={distanceIdx <= 1 ? 11 : distanceIdx === 2 ? 10 : 9}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={mapCenter}><Popup>Your location</Popup></Marker>
            {facilities.map((f, i) => {
              const lat = parseFloat(f.latitude)
              const lng = parseFloat(f.longitude)
              if (!lat || !lng) return null
              return (
                <Marker key={i} position={[lat, lng]}>
                  <Popup>
                    <strong>{f.name1 || f.name}</strong>
                    {f.street1 && <><br />{f.street1}</>}
                    {f.city    && <><br />{f.city}, {f.state}</>}
                    {f.phone   && <><br /><a href={`tel:${f.phone}`}>{f.phone}</a></>}
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
          {t('findingFacilities')}
        </div>
      )}

      {/* Results count */}
      {!loading && facilities.length > 0 && (
        <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
          {facilities.length} facilities found within {distance.label}
        </p>
      )}

      {/* No results */}
      {!loading && !error && facilities.length === 0 && location && (
        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
          {t('noFacilities')}
        </p>
      )}

      {/* Facility list */}
      <div className="flex flex-col gap-3">
        {facilities.map((f, i) => <FacilityCard key={i} facility={f} />)}
      </div>
    </div>
  )
}

function FacilityCard({ facility }) {
  const name    = facility.name1 || facility.name || 'Mental Health Facility'
  const street  = facility.street1 || ''
  const city    = facility.city    || ''
  const state   = facility.state   || ''
  const address = [street, city, state].filter(Boolean).join(', ')
  const phone   = facility.phone

  return (
    <div className="rounded-2xl p-4"
      style={{ background: 'var(--white)', border: '1px solid var(--sand-dark)' }}>
      <div className="font-semibold text-sm mb-2" style={{ color: 'var(--charcoal)' }}>{name}</div>
      {address && (
        <div className="flex items-start gap-2 text-xs mb-2" style={{ color: 'var(--muted)' }}>
          <MapPin size={13} className="mt-0.5 flex-shrink-0" /><span>{address}</span>
        </div>
      )}
      {phone && (
        <a href={`tel:${phone}`} className="flex items-center gap-2 text-xs font-medium"
          style={{ color: 'var(--sage-dark)' }}>
          <Phone size={13} />{phone}
        </a>
      )}
    </div>
  )
}
