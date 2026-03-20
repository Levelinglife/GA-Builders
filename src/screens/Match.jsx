import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, query, where, orderBy, serverTimestamp, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'
import PropertyCard from '../components/PropertyCard'

const TYPE_OPTIONS = ['Any', 'Residential', 'Commercial', 'Mixed Use', 'Plot / Land']

const EMPTY_REQ = {
  clientName: '', contact: '', block: '',
  type: 'Any', minSize: '', maxSize: '', maxBudget: '', notes: '',
}

export default function Match() {
  const [req, setReq] = useState(EMPTY_REQ)
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedReqs, setSavedReqs] = useState([])
  const [showSaved, setShowSaved] = useState(false)

  useEffect(() => { fetchSaved() }, [])

  async function fetchSaved() {
    try {
      const q = query(collection(db, 'requirements'), where('status', '==', 'active'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      setSavedReqs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) { console.error(err) }
  }

  function handleChange(e) {
    setReq(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setSaved(false)
  }

  function loadRequirement(r) {
    setReq({ clientName: r.clientName || '', contact: r.contact || '', block: r.block || '', type: r.type || 'Any', minSize: r.minSize || '', maxSize: r.maxSize || '', maxBudget: r.maxBudget || '', notes: r.notes || '' })
    setShowSaved(false)
    setSearched(false)
    setResults([])
  }

  async function handleDeleteReq(id) {
    await deleteDoc(doc(db, 'requirements', id))
    setSavedReqs(prev => prev.filter(r => r.id !== id))
  }

  async function handleSearch() {
    setSearching(true)
    setSearched(false)
    try {
      const q = query(collection(db, 'properties'), where('status', '==', 'for_sale'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      if (req.block.trim()) data = data.filter(p => p.block?.toLowerCase().includes(req.block.toLowerCase()))
      if (req.type !== 'Any') data = data.filter(p => p.type === req.type)
      if (req.minSize) data = data.filter(p => !p.plotSize || Number(p.plotSize) >= Number(req.minSize))
      if (req.maxSize) data = data.filter(p => !p.plotSize || Number(p.plotSize) <= Number(req.maxSize))
      if (req.maxBudget) data = data.filter(p => !p.price || Number(p.price) <= Number(req.maxBudget))
      setResults(data)
    } catch (err) { console.error(err) }
    finally { setSearching(false); setSearched(true) }
  }

  async function handleSave() {
    if (!req.clientName.trim()) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'requirements'), { ...req, status: 'active', createdAt: serverTimestamp() })
      setSaved(true)
      fetchSaved()
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  return (
    <div className="pb-28">
      <div className="bg-primary px-5 pt-12 pb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-white text-2xl">Find Match</h1>
          <p className="text-white/50 text-sm mt-0.5">Enter what your buyer needs</p>
        </div>
        <button onClick={() => setShowSaved(v => !v)} className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <span className="text-white text-sm font-medium">{savedReqs.length}</span>
        </button>
      </div>

      {showSaved && (
        <div className="bg-surface border-b border-gray-100 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Saved Requirements</p>
          {savedReqs.length === 0 ? (
            <p className="text-text-muted text-sm py-2">No saved requirements yet</p>
          ) : (
            <div className="flex flex-col gap-2">
              {savedReqs.map(r => (
                <div key={r.id} className="flex items-center justify-between bg-surface-raised rounded-xl px-4 py-3">
                  <button className="flex-1 text-left" onClick={() => loadRequirement(r)}>
                    <p className="font-medium text-text-primary text-sm">{r.clientName}</p>
                    <p className="text-text-muted text-xs mt-0.5">
                      {[r.block, r.type !== 'Any' && r.type, r.maxBudget && `₹${formatPrice(r.maxBudget)}`].filter(Boolean).join(' · ')}
                    </p>
                  </button>
                  <button onClick={() => handleDeleteReq(r.id)} className="ml-3 text-text-muted active:text-red-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="px-5 py-5 flex flex-col gap-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Client Name</label>
            <input name="clientName" value={req.clientName} onChange={handleChange} placeholder="Buyer name"
              className="w-full bg-surface-raised rounded-xl px-4 py-3 text-text-primary outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Contact</label>
            <input name="contact" value={req.contact} onChange={handleChange} placeholder="98XXXXXXXX" type="tel"
              className="w-full bg-surface-raised rounded-xl px-4 py-3 text-text-primary outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Block / Sector</label>
          <input name="block" value={req.block} onChange={handleChange} placeholder="e.g. Block B"
            className="w-full bg-surface-raised rounded-xl px-4 py-3 text-text-primary outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Property Type</label>
          <select name="type" value={req.type} onChange={handleChange}
            className="w-full bg-surface-raised rounded-xl px-4 py-3 text-text-primary outline-none focus:ring-2 focus:ring-primary/20">
            {TYPE_OPTIONS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Min Size (sq yd)</label>
            <input name="minSize" value={req.minSize} onChange={handleChange} placeholder="80" type="number"
              className="w-full bg-surface-raised rounded-xl px-4 py-3 text-text-primary outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Max Size (sq yd)</label>
            <input name="maxSize" value={req.maxSize} onChange={handleChange} placeholder="150" type="number"
              className="w-full bg-surface-raised rounded-xl px-4 py-3 text-text-primary outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Max Budget (₹)</label>
          <input name="maxBudget" value={req.maxBudget} onChange={handleChange} placeholder="e.g. 6000000 for 60L" type="number"
            className="w-full bg-surface-raised rounded-xl px-4 py-3 text-text-primary outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        <div className="flex gap-3">
          <button onClick={handleSearch} disabled={searching}
            className="flex-1 bg-primary text-white font-display font-bold text-base py-4 rounded-2xl active:scale-[0.98] transition-transform disabled:opacity-60">
            {searching ? 'Searching...' : 'Find Match'}
          </button>
          {req.clientName.trim() && (
            <button onClick={handleSave} disabled={saving || saved}
              className={`px-5 py-4 rounded-2xl font-semibold text-sm transition-all active:scale-[0.98]
                ${saved ? 'bg-green-50 text-green-600' : 'bg-surface-raised text-text-secondary'}`}>
              {saved ? '✓ Saved' : saving ? '...' : 'Save'}
            </button>
          )}
        </div>

        {searched && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-3">
              <p className="font-display font-bold text-text-primary text-lg">Results</p>
              <span className="text-sm text-text-muted">{results.length} found</span>
            </div>
            {results.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-text-muted font-medium">No matches found</p>
                <p className="text-text-muted text-sm mt-1">Try relaxing the filters</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {results.map(p => <PropertyCard key={p.id} property={p} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function formatPrice(price) {
  if (price >= 10000000) return (price / 10000000).toFixed(1) + ' Cr'
  if (price >= 100000) return (price / 100000).toFixed(1) + ' L'
  return Number(price).toLocaleString('en-IN')
}
