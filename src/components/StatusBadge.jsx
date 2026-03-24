const STATUS_STYLES = {
  for_sale: { label: 'For Sale', bg: 'bg-status-sale-bg', text: 'text-status-sale' },
  need_tenant: { label: 'To Let', bg: 'bg-purple-500/20', text: 'text-purple-400' },
  need_rent_house: { label: 'Need Rent', bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
  rented: { label: 'Rented', bg: 'bg-status-rent-bg', text: 'text-status-rent' },
  occupied: { label: 'Occupied', bg: 'bg-status-occupied-bg', text: 'text-status-occupied' },
  construction: { label: 'Under Construction', bg: 'bg-status-construction-bg', text: 'text-status-construction' },
  closed: { label: 'Closed', bg: 'bg-surface-raised', text: 'text-text-muted' },
}

export default function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.occupied
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide backdrop-blur-sm ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  )
}
