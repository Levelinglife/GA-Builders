import { useState, useEffect } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import PropertyCard from '../components/PropertyCard'

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'For Sale', value: 'for_sale' },
  { label: 'Rented', value: 'rented' },
  { label: 'Occupied', value: 'occupied' },
  { label: 'Construction', value: 'construction' },
]

export default function Home() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchProperties()
  }, [])

  async function fetchProperties() {
    try {
      const q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setProperties(data)
    } catch (err) {
      console.error('Error fetching properties:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = properties.filter(p => {
    const matchesFilter = filter === 'all' || p.status === filter
    const matchesSearch =
      !search ||
      p.houseNo?.toLowerCase().includes(search.toLowerCase()) ||
      p.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
      p.block?.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="bg-primary px-5 pt-12 pb-5">
        <h1 className="font-display font-bold text-white text-2xl mb-4">Properties</h1>

        {/* Search */}
        <div className="flex items-center bg-white/10 rounded-xl px-4 py-3 gap-3">
          <svg className="w-5 h-5 text-white/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by house no. or owner name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-white placeholder-white/50 text-sm flex-1 outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 px-5 py-4 overflow-x-auto scroll-hidden">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors
              ${filter === f.value
                ? 'bg-primary text-white'
                : 'bg-surface-raised text-text-secondary'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="px-5 flex flex-col gap-4">
        {loading ? (
          // Skeleton loader
          [1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl overflow-hidden animate-pulse">
              <div className="w-full h-52 bg-surface-raised" />
              <div className="p-4 bg-surface">
                <div className="h-6 w-20 bg-surface-raised rounded mb-2" />
                <div className="h-4 w-32 bg-surface-raised rounded" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-text-muted mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H3.75A.75.75 0 013 21V9.75z" />
            </svg>
            <p className="text-text-muted text-base font-medium">No properties yet</p>
            <p className="text-text-muted text-sm mt-1">Tap + to add your first one</p>
          </div>
        ) : (
          filtered.map(p => <PropertyCard key={p.id} property={p} />)
        )}
      </div>
    </div>
  )
}
