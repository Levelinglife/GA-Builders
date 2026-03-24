import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { collection, doc, onSnapshot, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'

const STATUS_OPTIONS = [
  { value: 'for_sale', label: '🏷️ For Sale', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  { value: 'rented', label: '🔑 Rented', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { value: 'occupied', label: '🏠 Occupied', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  { value: 'construction', label: '🏗️ Construction', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  { value: 'closed', label: '🚫 Closed', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
]

const TYPE_OPTIONS = ['Residential', 'Commercial', 'Mixed Use', 'Plot / Land']

const EMPTY_FORM = {
  houseNo: '', ownerName: '', block: '', plotSize: '', floors: '',
  type: 'Residential', status: 'occupied', price: '', contact: '', notes: '',
}

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

export default function AddProperty() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(EMPTY_FORM)
  const [photos, setPhotos] = useState([])
  const [existingPhotos, setExistingPhotos] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showMore, setShowMore] = useState(false)

  useEffect(() => {
    let loaded = false
    if (isEdit) {
      const unsub = onSnapshot(doc(db, 'properties', id), (snap) => {
        if (snap.exists() && !loaded) {
          loaded = true
          const data = snap.data()
          setForm({
            houseNo: data.houseNo || '', ownerName: data.ownerName || '',
            block: data.block || '', plotSize: data.plotSize || '',
            floors: data.floors || '', type: data.type || 'Residential',
            status: data.status || 'occupied', price: data.price || '',
            contact: data.contact || '', notes: data.notes || '',
          })
          setExistingPhotos(data.photos || [])
          // Auto-show "more" section if extra fields have data
          if (data.floors || data.price || data.contact || data.notes) setShowMore(true)
        }
      }, console.error)
      return () => unsub()
    }
  }, [id])

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handlePhotos(e) {
    const files = Array.from(e.target.files)
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setError(`"${file.name}" is not an image and was skipped.`)
        return false
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" is too large (max 10MB) and was skipped.`)
        return false
      }
      return true
    })
    setPhotos(prev => [...prev, ...validFiles].slice(0, 10))
  }

  function removeNewPhoto(index) { setPhotos(prev => prev.filter((_, i) => i !== index)) }
  function removeExistingPhoto(index) { setExistingPhotos(prev => prev.filter((_, i) => i !== index)) }

  function compressImage(file) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(file), 10000)
      try {
        const img = new Image()
        const url = URL.createObjectURL(file)
        img.onload = () => {
          clearTimeout(timeout)
          URL.revokeObjectURL(url)
          const MAX = 1200
          let { width, height } = img
          if (width > MAX) { height = Math.round(height * MAX / width); width = MAX }
          const canvas = document.createElement('canvas')
          canvas.width = width; canvas.height = height
          canvas.getContext('2d').drawImage(img, 0, 0, width, height)
          canvas.toBlob(blob => resolve(blob || file), 'image/jpeg', 0.8)
        }
        img.onerror = () => { clearTimeout(timeout); URL.revokeObjectURL(url); resolve(file) }
        img.src = url
      } catch { clearTimeout(timeout); resolve(file) }
    })
  }

  async function uploadPhotos(propertyId, docRef) {
    const urls = [...existingPhotos]
    const failedNames = []
    for (let i = 0; i < photos.length; i++) {
      try {
        const compressed = await compressImage(photos[i])
        const storageRef = ref(storage, `properties/${propertyId}/${Date.now()}_${photos[i].name}`)
        await uploadBytes(storageRef, compressed)
        const url = await getDownloadURL(storageRef)
        urls.push(url)
      } catch (err) {
        console.error(`Failed to upload ${photos[i].name}:`, err)
        failedNames.push(photos[i].name)
      }
    }
    // Update the doc with final photo URLs
    try {
      await updateDoc(docRef, { photos: urls })
    } catch (err) {
      console.error('Failed to update photos on doc:', err)
    }
    // Show error notification if any uploads failed
    if (failedNames.length > 0) {
      setError(`Failed to upload: ${failedNames.join(', ')}. Other photos were saved.`)
    }
    return urls
  }

  function handleSave() {
    if (!form.houseNo.trim()) {
      setError('House / Plot number is required')
      return
    }
    setSaving(true)
    setError('')

    try {
      if (isEdit) {
        const docRef = doc(db, 'properties', id)
        // Navigate instantly
        navigate(`/property/${id}`)
        // Save in background
        updateDoc(docRef, {
          ...form, photos: existingPhotos, updatedAt: serverTimestamp(),
        }).catch(e => { console.error('Update failed:', e); setError('Failed to save changes. Please try again.') })
        // Upload new photos in background
        if (photos.length > 0) {
          uploadPhotos(id, docRef).catch(console.error)
        }
      } else {
        const docRef = doc(collection(db, 'properties'))
        // Navigate instantly
        navigate(`/property/${docRef.id}`)
        // Create in background
        setDoc(docRef, {
          ...form, photos: [], createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
        }).catch(e => { console.error('Create failed:', e); setError('Failed to save property. Please try again.') })
        // Upload photos in background
        if (photos.length > 0) {
          uploadPhotos(docRef.id, docRef).catch(console.error)
        }
      }
    } catch (err) {
      console.error(err)
      setError(err.message || 'Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="bg-primary px-5 pt-12 pb-5 flex items-center gap-4 border-b border-accent/10">
        <button onClick={() => navigate(-1)} className="text-text-muted active:text-accent transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-display font-bold text-accent text-xl">
          {isEdit ? 'Edit Property' : 'Quick Add'}
        </h1>
      </div>

      <div className="px-5 py-5 flex flex-col gap-4">

        {/* ─── ESSENTIAL FIELDS (always visible) ─── */}
        <div className="bg-surface-raised rounded-2xl p-4 border border-accent/5">
          {/* House No — BIG and prominent */}
          <input
            name="houseNo" value={form.houseNo} onChange={handleChange}
            placeholder="House / Plot No. *"
            autoFocus
            className="w-full bg-transparent text-text-primary font-display font-bold text-2xl outline-none placeholder-text-muted/40 mb-4"
          />
          <div className="grid grid-cols-2 gap-3">
            <input name="ownerName" value={form.ownerName} onChange={handleChange} placeholder="Owner Name"
              className="bg-surface rounded-xl px-3 py-2.5 text-text-primary outline-none text-sm border border-transparent focus:border-accent/30" />
            <input name="block" value={form.block} onChange={handleChange} placeholder="Block / Sector"
              className="bg-surface rounded-xl px-3 py-2.5 text-text-primary outline-none text-sm border border-transparent focus:border-accent/30" />
          </div>
        </div>

        {/* ─── STATUS — tap to select (visual, fast) ─── */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 px-1">Status</p>
          <div className="flex gap-2 overflow-x-auto scroll-hidden pb-1">
            {STATUS_OPTIONS.map(s => (
              <button key={s.value} onClick={() => setForm(prev => ({ ...prev, status: s.value }))}
                className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-sm font-medium transition-all border
                  ${form.status === s.value
                    ? s.color + ' scale-[1.02]'
                    : 'bg-surface-raised text-text-muted border-transparent'}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ─── TYPE — tap to select ─── */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 px-1">Type</p>
          <div className="flex gap-2 overflow-x-auto scroll-hidden pb-1">
            {TYPE_OPTIONS.map(t => (
              <button key={t} onClick={() => setForm(prev => ({ ...prev, type: t }))}
                className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-sm font-medium transition-all border
                  ${form.type === t
                    ? 'bg-accent/10 text-accent border-accent/20'
                    : 'bg-surface-raised text-text-muted border-transparent'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* ─── PLOT SIZE — single quick field ─── */}
        <div className="flex gap-3">
          <div className="flex-1 bg-surface-raised rounded-xl px-3 py-2.5 flex items-center gap-2 border border-transparent focus-within:border-accent/30">
            <span className="text-text-muted text-sm">📐</span>
            <input name="plotSize" value={form.plotSize} onChange={handleChange} placeholder="Plot Size (Gaj)" type="number"
              className="bg-transparent text-text-primary outline-none text-sm flex-1 min-w-0" />
          </div>
          <div className="flex-1 bg-surface-raised rounded-xl px-3 py-2.5 flex items-center gap-2 border border-transparent focus-within:border-accent/30">
            <span className="text-text-muted text-sm">₹</span>
            <input name="price" value={form.price} onChange={handleChange} placeholder="Price" type="number"
              className="bg-transparent text-text-primary outline-none text-sm flex-1 min-w-0" />
          </div>
        </div>

        {/* ─── PHOTOS — camera-first design ─── */}
        <div>
          <div className="flex gap-2 overflow-x-auto scroll-hidden pb-1">
            {/* Existing photos */}
            {existingPhotos.map((url, i) => (
              <div key={'e' + i} className="relative flex-shrink-0">
                <img src={url} alt="" className="w-20 h-20 object-cover rounded-xl" />
                <button onClick={() => removeExistingPhoto(i)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            {/* New photos */}
            {photos.map((file, i) => (
              <div key={'n' + i} className="relative flex-shrink-0">
                <img src={URL.createObjectURL(file)} alt="" className="w-20 h-20 object-cover rounded-xl opacity-80" />
                <button onClick={() => removeNewPhoto(i)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}

            {/* Add photo button */}
            <label className="flex-shrink-0 w-20 h-20 bg-surface-raised rounded-xl border-2 border-dashed border-accent/20 flex flex-col items-center justify-center cursor-pointer active:bg-surface gap-1">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
              <span className="text-text-muted text-[10px]">Photo</span>
              <input type="file" accept="image/*" multiple onChange={handlePhotos} className="hidden" />
            </label>
          </div>
        </div>

        {/* ─── MORE DETAILS (expandable) ─── */}
        <button onClick={() => setShowMore(v => !v)}
          className="flex items-center justify-center gap-2 text-text-muted text-sm py-2">
          <span>{showMore ? 'Less details' : 'More details'}</span>
          <svg className={`w-4 h-4 transition-transform ${showMore ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showMore && (
          <div className="flex flex-col gap-3 animate-fade-in">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-raised rounded-xl px-3 py-2.5 flex items-center gap-2 border border-transparent focus-within:border-accent/30">
                <span className="text-text-muted text-sm">🏢</span>
                <input name="floors" value={form.floors} onChange={handleChange} placeholder="Floors (G+2)"
                  className="bg-transparent text-text-primary outline-none text-sm flex-1 min-w-0" />
              </div>
              <div className="bg-surface-raised rounded-xl px-3 py-2.5 flex items-center gap-2 border border-transparent focus-within:border-accent/30">
                <span className="text-text-muted text-sm">📞</span>
                <input name="contact" value={form.contact} onChange={handleChange} placeholder="Contact" type="tel"
                  className="bg-transparent text-text-primary outline-none text-sm flex-1 min-w-0" />
              </div>
            </div>
            <textarea name="notes" value={form.notes} onChange={handleChange}
              placeholder="Notes — corner plot, east facing, disputed, renovated..."
              rows={2}
              className="w-full bg-surface-raised rounded-xl px-3 py-2.5 text-text-primary outline-none border border-transparent focus:border-accent/30 text-sm resize-none" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 rounded-xl px-4 py-3 border border-red-500/20">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Save Button */}
        <button onClick={handleSave} disabled={saving}
          className="w-full bg-accent text-primary font-display font-bold text-base py-4 rounded-2xl active:scale-[0.98] transition-all disabled:opacity-60 shadow-lg shadow-accent/20">
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : '+ Save Property'}
        </button>
      </div>
    </div>
  )
}
