import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { collection, doc, onSnapshot, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

const STATUS_OPTIONS = [
  { value: 'for_sale', label: '🏷️ For Sale', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  { value: 'need_tenant', label: '📢 Need Tenant', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { value: 'need_rent_house', label: '🔍 Need Rent House', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  { value: 'rented', label: '🔑 Rented', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { value: 'occupied', label: '🏠 Occupied', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  { value: 'construction', label: '🏗️ Construction', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  { value: 'closed', label: '🚫 Closed', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
]

const TYPE_OPTIONS = ['Residential', 'Commercial', 'Mixed Use', 'Plot / Land']

const FLOOR_OPTIONS = [
  'Full House (Jad se)',
  'Basement',
  'Ground Floor',
  '1st Floor',
  '2nd Floor',
  '3rd Floor',
  '4th Floor',
  'Other'
]

const EMPTY_FORM = {
  houseNo: '', ownerName: '', block: '', plotSize: '', floors: '',
  type: 'Residential', status: 'occupied', price: '', contact: '', notes: '',
}

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

const InputField = ({ label, ...props }) => (
  <label className="flex flex-col gap-1.5 w-full">
    <span className="text-[15px] font-bold text-text-muted px-1 uppercase tracking-wider">{label}</span>
    <input
      {...props}
      className={`w-full bg-surface-raised rounded-xl px-4 py-3.5 text-text-primary outline-none text-[17px] border-2 border-surface/50 focus:border-accent shadow-sm transition-all focus:shadow-accent/20 placeholder-text-muted/30 ${props.className || ''}`}
    />
  </label>
)


export default function AddProperty() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const [form, setForm] = useState(EMPTY_FORM)
  const [photos, setPhotos] = useState([])
  const [existingPhotos, setExistingPhotos] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
      if (file.type.startsWith('video/')) {
        setError(`Skipped "${file.name}": The current free hosting (ImgBB) only supports images.`)
        return false
      }
      if (!file.type.startsWith('image/')) {
        setError(`"${file.name}" is not supported and was skipped.`)
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

    // IMPGBB FREE API KEY
    const IMGBB_API_KEY = 'efc9f4ca043d87a164bd03d15962024e'
    
    for (let i = 0; i < photos.length; i++) {
      try {
        const compressed = await compressImage(photos[i])
        
        const formData = new FormData()
        formData.append('image', compressed)
        
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
          method: 'POST',
          body: formData
        })
        
        const data = await res.json()
        if (data.success) {
          urls.push(data.data.url)
        } else {
          throw new Error('ImgBB API error')
        }

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
    <div className="pb-28 max-w-lg mx-auto">
      {/* Header */}
      <div className="bg-primary px-5 pt-12 pb-5 flex items-center gap-4 border-b border-accent/10 sticky top-0 z-10 shadow-sm">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-text-muted active:text-accent transition-colors">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-display font-bold text-accent text-2xl">
          {isEdit ? 'Edit Property' : 'Add Property'}
        </h1>
      </div>

      <div className="px-5 py-6 flex flex-col gap-8">

        {/* ─── BASIC INFO ─── */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold border-b border-accent/20 pb-2 text-text-primary">Basic Info</h2>
          <InputField label="House / Plot No. *" name="houseNo" value={form.houseNo} onChange={handleChange} placeholder="e.g. 154" autoFocus />
          <InputField label="Owner Name" name="ownerName" value={form.ownerName} onChange={handleChange} placeholder="First & Last Name" />
          <InputField label="Address" name="block" value={form.block} onChange={handleChange} placeholder="e.g. Block C, Sector 4" />
        </section>

        {/* ─── STATUS ─── */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold border-b border-accent/20 pb-2 text-text-primary">Status</h2>
          <div className="grid grid-cols-2 gap-3">
            {STATUS_OPTIONS.map(s => (
              <label key={s.value} className={`relative flex items-center gap-3 px-4 py-4 rounded-xl text-base font-semibold transition-all border-2 cursor-pointer
                ${form.status === s.value
                  ? s.color.replace('border-', 'border-[2px] border-') + ' shadow-md'
                  : 'bg-surface-raised text-text-muted border-surface/50 hover:bg-surface'}`}>
                <input type="radio" value={s.value} checked={form.status === s.value}
                  onChange={() => setForm(prev => ({ ...prev, status: s.value }))} className="hidden" />
                <div className={`w-5 h-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center ${form.status === s.value ? 'border-current' : 'border-text-muted/50'}`}>
                  {form.status === s.value && <div className="w-2.5 h-2.5 rounded-full bg-current" />}
                </div>
                <span className="leading-tight">{s.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* ─── PROPERTY TYPE ─── */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold border-b border-accent/20 pb-2 text-text-primary">Property Type</h2>
          <div className="grid grid-cols-2 gap-3">
            {TYPE_OPTIONS.map(t => (
              <label key={t} className={`relative flex items-center gap-3 px-4 py-4 rounded-xl text-base font-semibold transition-all border-2 cursor-pointer
                ${form.type === t
                  ? 'bg-accent/10 border-accent text-accent shadow-md'
                  : 'bg-surface-raised text-text-muted border-surface/50 hover:bg-surface'}`}>
                <input type="radio" value={t} checked={form.type === t}
                  onChange={() => setForm(prev => ({ ...prev, type: t }))} className="hidden" />
                <div className={`w-5 h-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center ${form.type === t ? 'border-accent' : 'border-text-muted/50'}`}>
                  {form.type === t && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
                </div>
                <span className="leading-tight">{t}</span>
              </label>
            ))}
          </div>
        </section>

        {/* ─── DIMENSIONS & PRICING ─── */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold border-b border-accent/20 pb-2 text-text-primary">Dimensions & Pricing</h2>
          <InputField label="Plot Size (Gaj)" name="plotSize" value={form.plotSize} onChange={handleChange} placeholder="e.g. 250" type="number" />
          
          <label className="flex flex-col gap-1.5 w-full">
            <span className="text-[15px] font-bold text-text-muted px-1 uppercase tracking-wider">Floor</span>
            <div className="relative">
              <select name="floors" value={form.floors} onChange={handleChange}
                className="w-full bg-surface-raised rounded-xl px-4 py-3.5 text-text-primary outline-none text-[17px] border-2 border-surface/50 focus:border-accent shadow-sm transition-all focus:shadow-accent/20 appearance-none">
                <option value="" disabled>Select Floor</option>
                {FLOOR_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <div className="absolute top-0 right-4 h-full flex items-center pointer-events-none text-text-muted">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </label>

          <InputField label="Price (₹)" name="price" value={form.price} onChange={handleChange} placeholder="e.g. 15000000" type="number" />
        </section>

        {/* ─── ADDITIONAL DETAILS ─── */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold border-b border-accent/20 pb-2 text-text-primary">Additional Details</h2>
          <InputField label="Contact Phone" name="contact" value={form.contact} onChange={handleChange} placeholder="Phone Number" type="tel" />
          <label className="flex flex-col gap-1.5 w-full">
            <span className="text-[15px] font-bold text-text-muted px-1 uppercase tracking-wider">Notes</span>
            <textarea name="notes" value={form.notes} onChange={handleChange}
              placeholder="Corner plot, east facing, etc."
              rows={4}
              className="w-full bg-surface-raised rounded-xl px-4 py-3.5 text-text-primary outline-none text-[17px] border-2 border-surface/50 focus:border-accent transition-colors resize-none placeholder-text-muted/30" />
          </label>
        </section>

        {/* ─── PHOTOS ─── */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold border-b border-accent/20 pb-2 text-text-primary">Photos (Optional)</h2>
          <div className="flex flex-wrap gap-4 pt-2">
            {/* Existing photos */}
            {existingPhotos.map((url, i) => (
              <div key={'e' + i} className="relative flex-shrink-0">
                <img src={url} alt="" className="w-24 h-24 object-cover rounded-xl shadow-sm border border-surface/50" />
                <button onClick={() => removeExistingPhoto(i)}
                  className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform border-[3px] border-primary">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            {/* New photos */}
            {photos.map((file, i) => (
              <div key={'n' + i} className="relative flex-shrink-0">
                <img src={URL.createObjectURL(file)} alt="" className="w-24 h-24 object-cover rounded-xl shadow-sm border border-surface/50 opacity-80" />
                <button onClick={() => removeNewPhoto(i)}
                  className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform border-[3px] border-primary">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}

            {/* Add photo/video button */}
            <label className="flex-shrink-0 w-24 h-24 bg-surface-raised rounded-xl border-2 border-dashed border-accent/40 flex flex-col items-center justify-center cursor-pointer active:bg-surface hover:bg-surface transition-colors gap-1.5 shadow-inner">
              <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v4a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v4z" />
              </svg>
              <span className="text-text-muted text-[11px] font-bold uppercase tracking-wide text-center leading-tight">Add Photo<br/>/ Video</span>
              <input type="file" accept="image/*,video/*" multiple onChange={handlePhotos} className="hidden" />
            </label>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 text-red-500 text-base bg-red-500/10 rounded-xl px-4 py-4 border-2 border-red-500/20 shadow-sm mt-2">
            <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Save Button */}
        <button onClick={handleSave} disabled={saving}
          className="w-full bg-accent text-primary font-display font-bold text-xl tracking-wide py-5 rounded-2xl active:scale-[0.98] transition-all disabled:opacity-60 shadow-xl shadow-accent/20 mt-4 border-2 border-accent/20 hover:bg-accent/90 focus:ring-4 focus:ring-accent/30 outline-none">
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Save Property'}
        </button>
      </div>
    </div>
  )
}
