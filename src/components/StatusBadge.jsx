const STATUS_STYLES = {
  for_sale: { label: 'For Sale', bg: 'bg-status-sale-bg', text: 'text-status-sale' },
  rented: { label: 'Rented', bg: 'bg-status-rent-bg', text: 'text-status-rent' },
  occupied: { label: 'Occupied', bg: 'bg-status-occupied-bg', text: 'text-status-occupied' },
  construction: { label: 'Under Construction', bg: 'bg-status-construction-bg', text: 'text-status-construction' },
  closed: { label: 'Closed', bg: 'bg-gray-100', text: 'text-gray-500' },
}

export default function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.occupied
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  )
}
