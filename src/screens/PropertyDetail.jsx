import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, onSnapshot, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'
import StatusBadge from '../components/StatusBadge'

export default function PropertyDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'properties', id), (snap) => {
      if (snap.exists()) setProperty({ id: snap.id, ...snap.data() })
      setLoading(false)
    }, (err) => {
      console.error(err)
      setLoading(false)
    })
    return () => unsub()
  }, [id])

  function handleDelete() {
    if (!window.confirm('Delete this property? This cannot be undone.')) return
    navigate('/')
    deleteDoc(doc(db, 'properties', id)).catch(console.error)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  )

  if (!property) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <p className="text-text-muted">Property not found</p>
      <button onClick={() => navigate('/')} className="text-accent font-medium">Go back</button>
    </div>
  )

  const photos = property.photos || []

  return (
    <div className="pb-8">
      {/* Photo Hero */}
      <div className="relative w-full h-72 bg-surface-raised">
        {photos.length > 0 ? (
          <img src={photos[photoIndex]} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-raised">
            <svg className="w-16 h-16 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z" />
            </svg>
          </div>
        )}

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-12 left-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Edit button */}
        <button
          onClick={() => navigate(`/edit/${id}`)}
          className="absolute top-12 right-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        {/* Photo dots */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
            {photos.map((_, i) => (
              <button key={i} onClick={() => setPhotoIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === photoIndex ? 'bg-accent w-4' : 'bg-white/50'}`} />
            ))}
          </div>
        )}
      </div>

      {/* Scrollable photo strip */}
      {photos.length > 1 && (
        <div className="flex gap-2 px-5 py-3 overflow-x-auto scroll-hidden bg-surface">
          {photos.map((url, i) => (
            <button key={i} onClick={() => setPhotoIndex(i)}>
              <img src={url} alt="" className={`w-16 h-16 object-cover rounded-xl flex-shrink-0 transition-opacity
                ${i === photoIndex ? 'opacity-100 ring-2 ring-accent' : 'opacity-50'}`} />
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="px-5 py-4">
        <div className="flex items-start justify-between mb-1">
          <StatusBadge status={property.status} />
          {property.price && (
            <span className="font-display font-bold text-accent text-lg">
              ₹{formatPrice(property.price)}
            </span>
          )}
        </div>

        <h1 className="font-display font-bold text-4xl text-text-primary mt-2">
          #{property.houseNo}
        </h1>
        {property.block && (
          <p className="text-text-secondary text-base mt-1">{property.block}</p>
        )}
      </div>

      {/* Info Grid */}
      <div className="mx-5 grid grid-cols-2 gap-3 mb-5">
        {property.plotSize && (
          <InfoTile label="Plot Size" value={`${property.plotSize} Gaj`} />
        )}
        {property.floors && (
          <InfoTile label="Floors" value={property.floors} />
        )}
        {property.type && (
          <InfoTile label="Type" value={property.type} />
        )}
      </div>

      {/* Owner Details */}
      <div className="mx-5 bg-surface rounded-2xl p-4 mb-4 border border-accent/5">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Owner Details</p>
        <Row label="Owner" value={property.ownerName || '—'} />
        {property.contact && (
          <a href={`tel:${property.contact}`} className="block">
            <Row label="Contact" value={property.contact} highlight />
          </a>
        )}
      </div>

      {/* Notes */}
      {property.notes && (
        <div className="mx-5 bg-surface rounded-2xl p-4 mb-4 border border-accent/5">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Notes</p>
          <p className="text-text-primary text-sm leading-relaxed">{property.notes}</p>
        </div>
      )}

      {/* Delete */}
      <div className="mx-5">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="w-full py-3 rounded-2xl text-red-400 bg-red-500/10 text-sm font-semibold active:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          {deleting ? 'Deleting...' : 'Delete Property'}
        </button>
      </div>
    </div>
  )
}

function InfoTile({ label, value }) {
  return (
    <div className="bg-surface rounded-xl p-3 border border-accent/5">
      <p className="text-xs text-text-muted uppercase tracking-wider font-medium mb-1">{label}</p>
      <p className="text-text-primary font-display font-semibold text-base">{value}</p>
    </div>
  )
}

function Row({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-accent/5 last:border-0">
      <span className="text-text-muted text-sm">{label}</span>
      <span className={`text-sm font-medium ${highlight ? 'text-accent underline underline-offset-2' : 'text-text-primary'}`}>{value}</span>
    </div>
  )
}

function formatPrice(price) {
  const num = Number(price)
  if (isNaN(num)) return price
  if (num >= 10000000) return (num / 10000000).toFixed(1) + ' Cr'
  if (num >= 100000) return (num / 100000).toFixed(1) + ' L'
  return num.toLocaleString('en-IN')
}
