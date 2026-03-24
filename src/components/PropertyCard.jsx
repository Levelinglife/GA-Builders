import { useNavigate } from 'react-router-dom'
import StatusBadge from './StatusBadge'

export default function PropertyCard({ property }) {
  const navigate = useNavigate()
  const photo = property.photos?.[0] || null

  return (
    <div
      className="bg-surface rounded-2xl overflow-hidden shadow-sm active:scale-[0.98] transition-transform cursor-pointer border border-accent/5"
      onClick={() => navigate(`/property/${property.id}`)}
    >
      {/* Photo */}
      <div className="relative w-full h-52 bg-surface-raised">
        {photo ? (
          <img
            src={photo}
            alt={`House ${property.houseNo}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-raised">
            <svg className="w-12 h-12 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z" />
            </svg>
          </div>
        )}
        {/* Status tag overlaid on photo */}
        <div className="absolute top-3 right-3">
          <StatusBadge status={property.status} />
        </div>
      </div>

      {/* Info */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          <p className="font-display font-bold text-2xl text-text-primary leading-tight">
            #{property.houseNo}
          </p>
          <p className="text-text-secondary text-sm mt-0.5">{property.ownerName || 'No owner added'}</p>
          {property.block && (
            <p className="text-text-muted text-xs mt-0.5">{property.block}</p>
          )}
        </div>
        {property.price && (
          <p className="font-display font-semibold text-accent text-base">
            ₹{formatPrice(property.price)}
          </p>
        )}
      </div>
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
