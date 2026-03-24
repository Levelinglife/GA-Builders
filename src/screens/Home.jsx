import { useState, useEffect } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import PropertyCard from '../components/PropertyCard'

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Buying', value: 'buying' },
  { label: 'Selling', value: 'selling' },
  { label: 'Rent', value: 'rent' },
  { label: 'Occupied', value: 'occupied' },
  { label: 'Construction', value: 'construction' },
  { label: 'Constructed', value: 'constructed' },
]

export default function Home() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const [aiFilters, setAiFilters] = useState(null)
  const [isAiLoading, setIsAiLoading] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'))

    // Safety cap: never show spinner for more than 2.5 seconds
    const timeout = setTimeout(() => setLoading(false), 2500)

    const unsub = onSnapshot(q, (snap) => {
      clearTimeout(timeout)
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setProperties(data)
      setLoading(false)
    }, (err) => {
      clearTimeout(timeout)
      console.error('Error fetching properties:', err)
      setLoading(false)
    })
    return () => { unsub(); clearTimeout(timeout) }
  }, [])

  async function handleAISearch() {
    if (!search.trim()) return
    let key = localStorage.getItem('gemini_api_key')
    if (!key) {
      key = window.prompt('Please enter your Gemini API Key to use AI Search:')
      if (!key) return
      localStorage.setItem('gemini_api_key', key)
    }

    setIsAiLoading(true)
    try {
      const prompt = `Extract property search criteria from this query: "${search}". 
        Return ONLY valid JSON with these optional keys: 
        "minSize" (number in Gaj), "maxSize" (number in Gaj), "budget" (number), "block" (string), "type" (string, one of 'Residential', 'Commercial', 'Mixed Use', 'Plot / Land'), "status" (string, one of 'for_sale', 'rented', 'occupied', 'construction').
        No markdown formatting. E.g. {"budget": 6000000, "block": "B"}`

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      })

      const data = await response.json()
      if (data.error) throw new Error(data.error.message)

      let resultText = data.candidates[0].content.parts[0].text
      if (resultText.startsWith('```json')) {
        resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim()
      } else if (resultText.startsWith('```')) {
        resultText = resultText.replace(/```/g, '').trim()
      }
      
      const criteria = JSON.parse(resultText.trim())
      setAiFilters(criteria)
      
    } catch (err) {
      console.error(err)
      if (err.message.includes('API_KEY_INVALID')) {
        localStorage.removeItem('gemini_api_key')
        alert('Invalid API key. Please try again.')
      } else {
        alert('AI Parsing failed. Ensure your API key is correct.')
      }
    } finally {
      setIsAiLoading(false)
    }
  }

  const filtered = properties.filter(p => {
    if (aiFilters) {
      if (aiFilters.minSize && (!p.plotSize || Number(p.plotSize) < aiFilters.minSize)) return false
      if (aiFilters.maxSize && (!p.plotSize || Number(p.plotSize) > aiFilters.maxSize)) return false
      if (aiFilters.budget && (!p.price || Number(p.price) > aiFilters.budget)) return false
      if (aiFilters.block && (!p.block || !p.block.toLowerCase().includes(aiFilters.block.toLowerCase()))) return false
      if (aiFilters.type && p.type !== aiFilters.type) return false
      if (aiFilters.status && p.status !== aiFilters.status) return false
      return true
    }

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
      <div className="bg-primary px-5 pt-12 pb-5 border-b border-accent/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg overflow-hidden shadow-md">
            <img src="/logo.jpeg" alt="GA Builders" className="w-full h-full object-cover" />
          </div>
          <h1 className="font-display font-bold text-accent text-2xl">Properties</h1>
        </div>

        {/* Search */}
        <div className="flex items-center bg-surface rounded-xl px-4 py-3 gap-2 border border-accent/10">
          <svg className="w-5 h-5 text-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by ID, block, or Ask AI..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAISearch()}
            className="bg-transparent text-text-primary placeholder-text-muted text-sm flex-1 outline-none min-w-0"
          />
          {search && (
            <button onClick={() => { setSearch(''); setAiFilters(null) }}>
              <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button 
             onClick={handleAISearch} 
             disabled={!search || isAiLoading}
             className="bg-accent text-primary rounded-lg px-3 py-1.5 text-xs font-display font-extrabold shadow-sm whitespace-nowrap active:scale-95 transition-all disabled:opacity-50 ml-1"
           >
             {isAiLoading ? 'Wait...' : 'AI ✨'}
          </button>
        </div>

        {aiFilters && (
          <div className="mt-4 bg-accent/10 border border-accent/20 rounded-xl px-4 py-3 flex justify-between items-start backdrop-blur-sm">
             <div>
               <p className="text-accent text-xs font-semibold uppercase mb-1 flex items-center gap-1.5">
                 <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                 </svg>
                 AI Filter Applied
               </p>
               <p className="text-text-secondary text-sm font-medium">
                 {Object.entries(aiFilters).map(([k,v]) => `${k}: ${v}`).join(', ') || 'General Match'}
               </p>
             </div>
             <button onClick={() => { setAiFilters(null); setSearch('') }} className="text-text-muted hover:text-accent mt-0.5">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
          </div>
        )}
      </div>

      {/* Filter Pills */}
      {!aiFilters && (
        <div className="flex gap-2 px-5 py-4 overflow-x-auto scroll-hidden">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors
                ${filter === f.value
                  ? 'bg-accent text-primary'
                  : 'bg-surface-raised text-text-secondary'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      <div className={`px-5 flex flex-col gap-4 ${aiFilters ? 'pt-5' : ''}`}>
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
            <p className="text-text-muted text-base font-medium">No properties found</p>
            {aiFilters ? (
              <p className="text-text-muted text-sm mt-1">Try a different AI prompt</p>
            ) : (
              <p className="text-text-muted text-sm mt-1">Tap + to add your first one</p>
            )}
          </div>
        ) : (
          filtered.map(p => <PropertyCard key={p.id} property={p} />)
        )}
      </div>
    </div>
  )
}
