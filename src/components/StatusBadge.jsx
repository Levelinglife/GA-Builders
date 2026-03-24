const STATUS_STYLES = {
  buying: { label: 'Buying', bg: 'bg-blue-500/20', text: 'text-blue-400' },
  selling: { label: 'Selling', bg: 'bg-green-500/20', text: 'text-green-400' },
  rent: { label: 'Rent', bg: 'bg-purple-500/20', text: 'text-purple-400' },
  occupied: { label: 'Occupied', bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  construction: { label: 'Construction', bg: 'bg-orange-500/20', text: 'text-orange-400' },
  constructed: { label: 'Constructed', bg: 'bg-teal-500/20', text: 'text-teal-400' },
}

export default function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.occupied
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide backdrop-blur-sm ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  )
}
