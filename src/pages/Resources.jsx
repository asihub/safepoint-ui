import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { useAssessmentContext } from '../App'
import { useLanguage } from '../hooks/useLanguage.jsx'
import { getFacilities } from '../api/client'
import { MapPin, Phone, Loader2, Search, ChevronLeft, Info } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom blue "you are here" icon for user location marker
const userLocationIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 18px; height: 18px;
    background: #2563eb;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 0 0 2px #2563eb, 0 2px 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize:   [18, 18],
  iconAnchor: [9, 9],
  popupAnchor:[0, -12],
})

const DISTANCE_OPTIONS = [
  { label: '5 miles',  meters: 8047  },
  { label: '10 miles', meters: 16093 },
  { label: '25 miles', meters: 40234 },
  { label: '50 miles', meters: 80467 },
]

// Map assessment insuranceType → SAMHSA PAY field value
function mapInsuranceToSamhsa(insuranceType) {
  const map = {
    'MEDICAID': 'Medicaid',
    'MEDICARE': 'Medicare',
    'SELF_PAY': 'Cash or self-payment',
    'OTHER':    'ALL',
    'UNKNOWN':  'ALL',
  }
  return map[insuranceType] || 'ALL'
}

// Extract unique values from services array for a given f2 code
function extractServiceValues(facilities, f2Code) {
  const values = new Set()
  facilities.forEach(f => {
    (f.services || []).forEach(s => {
      if (s.f2 === f2Code && s.f3) {
        s.f3.split(';').map(v => v.trim()).filter(Boolean).forEach(v => values.add(v))
      }
    })
  })
  return [...values].sort()
}

// Shorten long service names for display in dropdowns
function shortenLabel(label) {
  const map = {
    'Treatment for co-occurring substance use plus either serious mental illness (SMI) in adults and/or serious emotional disturbance (SED) in children': 'Co-occurring disorders',
    'Transitional housing, halfway house, or sober home': 'Transitional housing',
    'Federal military insurance (e.g., TRICARE)': 'TRICARE (military)',
    'Federal, or any government funding for substance use treatment programs': 'Federal govt funding',
    'IHS/Tribal/Urban (ITU) funds': 'IHS/Tribal funds',
    'State-financed health insurance plan other than Medicaid': 'State health insurance',
    'State mental health agency (or equivalent) funds': 'State mental health funds',
    'State welfare or child and family services funds': 'State welfare funds',
    'State corrections or juvenile justice funds': 'State corrections funds',
    'Community Mental Health Block Grants': 'Community MH grants',
    'Community Service Block Grants': 'Community service grants',
    'Private or Community foundation': 'Private foundation',
    'U.S. Department of VA funds': 'VA funds',
    'County or local government funds': 'County/local funds',
    'State education agency funds': 'State education funds',
  }
  return map[label] || label
}

// Check if a facility matches a filter value for a given f2 code
function facilityMatches(facility, f2Code, value) {
  if (value === 'ALL') return true
  return (facility.services || []).some(s =>
    s.f2 === f2Code && s.f3?.toLowerCase().includes(value.toLowerCase())
  )
}

function MapUpdater({ center, zoom, distanceChanged }) {
  const map = useMap()
  useEffect(() => {
    if (distanceChanged) {
      map.flyTo(center, zoom, { duration: 0.5 })
    } else {
      map.panTo(center, { duration: 0.5 })
    }
  }, [center[0], center[1], distanceChanged])
  return null
}

function MapUpdaterController({ center, distanceIdx }) {
  const prevIdx = useRef(distanceIdx)
  const zoom    = distanceIdx <= 1 ? 11 : distanceIdx === 2 ? 10 : 9
  const changed = prevIdx.current !== distanceIdx
  useEffect(() => { prevIdx.current = distanceIdx }, [distanceIdx])
  return <MapUpdater center={center} zoom={zoom} distanceChanged={changed} />
}

export default function Resources() {
  const navigate        = useNavigate()
  const { assessment } = useAssessmentContext()
  const { t, lang }    = useLanguage()

  // All facilities from API (unfiltered)
  const [allFacilities,  setAllFacilities]  = useState([])
  const [loading,        setLoading]        = useState(false)
  const [error,          setError]          = useState(null)
  const [location,       setLocation]       = useState(assessment.location)
  const [zip,            setZip]            = useState('')
  const [zipAutoFilled,  setZipAutoFilled]  = useState(false)
  const [locationLabel,  setLocationLabel]  = useState(null)
  const [distanceIdx,    setDistanceIdx]    = useState(1)

  // Filters — client-side
  const [insurance,      setInsurance]      = useState(
    mapInsuranceToSamhsa(assessment.insuranceType || 'OTHER')
  )
  const [careType,       setCareType]       = useState('Mental health treatment')
  const [page,           setPage]           = useState(1)
  const PAGE_SIZE = 10
  const distance  = DISTANCE_OPTIONS[distanceIdx]

  // Build dynamic filter options from loaded facilities
  const insuranceOptions = useMemo(() => extractServiceValues(allFacilities, 'PAY'), [allFacilities])
  const careTypeOptions  = useMemo(() => extractServiceValues(allFacilities, 'TC'),  [allFacilities])

  // Apply client-side filters
  const facilities = useMemo(() => {
    return allFacilities.filter(f =>
      facilityMatches(f, 'PAY', insurance) &&
      facilityMatches(f, 'TC',  careType) &&
      (f.street1 || f.phone)  // exclude if no address AND no phone
    )
  }, [allFacilities, insurance, careType])

  // Try geolocation on mount — also reverse geocode to fill ZIP field
  useEffect(() => {
    if (!location) {
      navigator.geolocation?.getCurrentPosition(
        async pos => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          setLocation({ latitude: lat, longitude: lng })
          setLocationLabel('your current location')
          // Reverse geocode to get ZIP
          try {
            const res  = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
              { headers: { 'Accept-Language': 'en' } }
            )
            const data = await res.json()
            const zipCode = data?.address?.postcode
            if (zipCode) { setZip(zipCode.slice(0, 5)); setZipAutoFilled(true) }
          } catch {
            // ignore — ZIP field stays empty
          }
        },
        () => setError('location_denied')
      )
    }
  }, [])

  // Fetch ALL facilities (no insurance/type filter) — filter client-side
  useEffect(() => {
    if (!location) return
    setLoading(true)
    setError(null)
    setPage(1)
    getFacilities(location.latitude, location.longitude, 'UNKNOWN', 200, distance.meters, 'both')
      .then(data => setAllFacilities(data))
      .catch(() => setError('fetch_failed'))
      .finally(() => setLoading(false))
  }, [location?.latitude, location?.longitude, distanceIdx])

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [insurance, careType])

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

  const mapCenter  = location ? [location.latitude, location.longitude] : [39.5, -98.35]
  const totalPages = Math.ceil(facilities.length / PAGE_SIZE)
  const paginated  = facilities.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Distance filter button
  const FilterBtn = ({ active, onClick, label }) => (
    <button onClick={onClick}
      className="text-xs px-3 py-1 rounded-full border transition-all whitespace-nowrap"
      style={{
        background:  active ? 'var(--sage-dark)' : 'transparent',
        color:       active ? 'var(--white)'     : 'var(--muted)',
        borderColor: active ? 'var(--sage-dark)' : 'var(--sand-dark)',
        fontWeight:  active ? 600 : 400,
      }}>
      {label}
    </button>
  )

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-6 py-8">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => navigate('/')} style={{ color: 'var(--muted)' }}>
          <ChevronLeft size={22} />
        </button>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.8rem' }}>
          {t('supportNearYou')}
        </h2>
      </div>
      <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
        {t('resourcesSubtitle')}
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

      {/* Search + filters card */}
      <div className="rounded-2xl p-4 mb-4"
        style={{ background: 'var(--white)', border: '1px solid var(--sand-dark)' }}>

        <p className="text-sm font-medium mb-3" style={{ color: 'var(--charcoal)' }}>
          {location && error !== 'location_denied'
            ? `${t('showingResultsNear')} ${locationLabel || 'your location'}`
            : t('enterZip')}
        </p>

        {/* ZIP */}
        <div className="flex gap-2 mb-4">
          <input value={zip} onChange={e => setZip(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleZipSearch()}
            placeholder="e.g. 92101" maxLength={5}
            className="flex-1 px-3 py-2 rounded-xl border text-sm outline-none"
            style={{ borderColor: 'var(--sand-dark)', fontFamily: "'DM Sans', sans-serif" }} />
          <button onClick={handleZipSearch}
            className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: 'var(--sage-dark)', color: 'var(--white)' }}>
            <Search size={16} /> {t('search')}
          </button>
        </div>

        {zipAutoFilled && !error && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <Info size={12} style={{ color: 'var(--muted)', flexShrink: 0 }} />
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              ZIP code is estimated from your location and may not be exact.
            </p>
          </div>
        )}

        {/* Distance */}
        <div className="mt-4"></div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium" style={{ color: 'var(--muted)', flexShrink: 0, minWidth: 60 }}>
            Within:
          </span>
          <div className="flex gap-1.5 flex-wrap">
            {DISTANCE_OPTIONS.map((opt, i) => (
              <FilterBtn key={i} value={i} active={distanceIdx === i}
                onClick={() => setDistanceIdx(i)} label={opt.label} />
            ))}
          </div>
        </div>

        {/* Insurance — dropdown */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium" style={{ color: 'var(--muted)', flexShrink: 0, minWidth: 60 }}>
            Insurance:
          </span>
          <div className="flex-1 min-w-0"><select
            value={insurance}
            onChange={e => setInsurance(e.target.value)}
            className="px-3 py-1.5 rounded-xl border text-xs outline-none"
            style={{
              borderColor: 'var(--sand-dark)',
              color: 'var(--charcoal)',
              fontFamily: "'DM Sans', sans-serif",
              background: 'var(--white)',
              width: '100%',
            }}>
            <option value="ALL">All types</option>
            {insuranceOptions.map(opt => (
              <option key={opt} value={opt}>{shortenLabel(opt)}</option>
            ))}
          </select></div>
        </div>

        {/* Care type — dropdown */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium" style={{ color: 'var(--muted)', flexShrink: 0, minWidth: 60 }}>
            Care type:
          </span>
          <select
            value={careType}
            onChange={e => setCareType(e.target.value)}
            className="px-3 py-1.5 rounded-xl border text-xs outline-none"
            style={{
              borderColor: 'var(--sand-dark)',
              color: 'var(--charcoal)',
              fontFamily: "'DM Sans', sans-serif",
              background: 'var(--white)',
              maxWidth: '100%',
              width: '100%',
              whiteSpace: 'normal',
            }}>
            <option value="ALL">All types</option>
            {careTypeOptions.map(opt => (
              <option key={opt} value={opt}>
                {shortenLabel(opt)}{opt === 'Mental health treatment' ? ' ★' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--sand-dark)' }}>
          <Info size={13} style={{ color: 'var(--muted)', flexShrink: 0, marginTop: 1 }} />
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Facilities may accept multiple insurance types and offer multiple care types.
            Counts by filter will not add up to the total.
          </p>
        </div>

        {/* Errors */}
        {error === 'invalid_zip'   && <p className="text-xs mt-2" style={{ color: 'var(--high)' }}>{t('invalidZip')}</p>}
        {error === 'zip_not_found' && <p className="text-xs mt-2" style={{ color: 'var(--high)' }}>{t('zipNotFound')}</p>}
        {error === 'geocode_failed'&& <p className="text-xs mt-2" style={{ color: 'var(--high)' }}>{t('geocodeFailed')}</p>}
      </div>

      {/* Results count */}
      {!loading && location && (
        <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
          {facilities.length > 0 ? (
            <>
              {facilities.length} facilit{facilities.length === 1 ? 'y' : 'ies'} found within {distance.label}
              {facilities.filter(f => !f.latitude || !f.longitude).length > 0 &&
                ` (${facilities.filter(f => !f.latitude || !f.longitude).length} without map location)`}
            </>
          ) : `No facilities found within ${distance.label} — try a larger radius or different filters`}
        </p>
      )}

      {/* Map */}
      {location && (
        <div className="rounded-2xl overflow-hidden mb-4" style={{ aspectRatio: '1 / 1', width: '100%' }}>
          <MapContainer
            key={`${location.latitude}-${location.longitude}-${facilities.length}`}
            center={mapCenter}
            zoom={distanceIdx <= 1 ? 11 : distanceIdx === 2 ? 10 : 9}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}>
            <MapUpdaterController center={mapCenter} distanceIdx={distanceIdx} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={mapCenter} icon={userLocationIcon}>
              <Popup>
                <strong>Your location</strong>
                {locationLabel && <><br />{locationLabel}</>}
              </Popup>
            </Marker>
            {facilities.map((f, i) => {
              const lat = parseFloat(f.latitude)
              const lng = parseFloat(f.longitude)
              if (!lat || !lng) return null
              // Extract insurance from services
              const payService = (f.services || []).find(s => s.f2 === 'PAY')
              const insurance  = payService?.f3 || null
              const tcService  = (f.services || []).find(s => s.f2 === 'TC')
              const careTypes  = tcService?.f3 || null
              return (
                <Marker key={i} position={[lat, lng]}>
                  <Popup>
                    <strong>{f.name1 || f.name}</strong>
                    {f.street1 && <><br />{f.street1}</>}
                    {f.city    && <><br />{f.city}, {f.state}</>}
                    {f.phone   && <><br /><a href={`tel:${f.phone}`}>{f.phone}</a><br /></>}
                    {careTypes && (
                      <>
                        <br />
                        <strong style={{fontSize:'0.85em'}}>Care Type:</strong>
                        <ul style={{margin:'2px 0 0 12px',padding:0,fontSize:'0.82em',color:'#444'}}>
                          {careTypes.split(';').map((c,i) => <li key={i}>{c.trim()}</li>)}
                        </ul>
                      </>
                    )}
                    {insurance && (
                      <>
                        <br />
                        <strong style={{fontSize:'0.85em'}}>Insurance:</strong>
                        <ul style={{margin:'2px 0 0 12px',padding:0,fontSize:'0.82em',color:'#444'}}>
                          {insurance.split(';').map((ins,i) => <li key={i}>{ins.trim()}</li>)}
                        </ul>
                      </>
                    )}
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

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mb-2 mt-2">
          <button onClick={() => { setPage(p => Math.max(1, p-1)); window.scrollTo(0,0) }}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
            style={{ borderColor: 'var(--sand-dark)', color: page === 1 ? 'var(--sand-dark)' : 'var(--charcoal)', opacity: page === 1 ? 0.4 : 1 }}>
            ← Prev
          </button>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            Page {page} of {totalPages}
          </span>
          <button onClick={() => { setPage(p => Math.min(totalPages, p+1)); window.scrollTo(0,0) }}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
            style={{ borderColor: 'var(--sand-dark)', color: page === totalPages ? 'var(--sand-dark)' : 'var(--charcoal)', opacity: page === totalPages ? 0.4 : 1 }}>
            Next →
          </button>
        </div>
      )}

      {/* Facility list */}
      <div className="flex flex-col gap-3">
        {paginated.map((f, i) => <FacilityCard key={(page-1)*PAGE_SIZE+i} facility={f} />)}
      </div>
    </div>
  )
}

function FacilityCard({ facility }) {
  const name     = facility.name1 || facility.name || 'Mental Health Facility'
  const street   = facility.street1 || ''
  const city     = facility.city    || ''
  const state    = facility.state   || ''
  const address  = [street, city, state].filter(Boolean).join(', ')
  const phone    = facility.phone
  const payService = (facility.services || []).find(s => s.f2 === 'PAY')
  const tcService  = (facility.services || []).find(s => s.f2 === 'TC')

  const hasCoords = facility.latitude && facility.longitude

  return (
    <div className="rounded-2xl p-4"
      style={{ background: 'var(--white)', border: '1px solid var(--sand-dark)' }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="font-semibold text-sm" style={{ color: 'var(--charcoal)' }}>{name}</div>
        {!hasCoords && (
          <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: 'var(--sand-dark)', color: 'var(--muted)' }}>
            No map location
          </span>
        )}
      </div>
      {address && (
        <div className="flex items-start gap-2 text-xs mb-1.5" style={{ color: 'var(--muted)' }}>
          <MapPin size={13} className="mt-0.5 flex-shrink-0" /><span>{address}</span>
        </div>
      )}
      {tcService?.f3 && (
        <p className="text-xs mb-1.5" style={{ color: 'var(--muted)' }}>
          <span style={{ fontWeight: 600, color: 'var(--charcoal)' }}>Care Type:</span> {tcService.f3}
        </p>
      )}
      {payService?.f3 && (
        <p className="text-xs mb-2" style={{ color: 'var(--muted)' }}>
          <span style={{ fontWeight: 600, color: 'var(--charcoal)' }}>Insurance:</span> {payService.f3}
        </p>
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
