import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { collection, addDoc, doc, onSnapshot, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'

const STATUS_OPTIONS = [
  { value: 'for_sale', label: 'For Sale' },
  { value: 'rented', label: 'Rented' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'construction', label: 'Under Construction' },
  { value: 'closed', label: 'Closed / No Action' },
]

const TYPE_OPTIONS = [
  'Residential',
  'Commercial',
  'Mixed Use',
  'Plot / Land',
]

const EMPTY_FORM = {
  houseNo: '',
  ownerName: '',
  block: '',
  plotSize: '',
  floors: '',
  type: 'Residential',
  status: 'occupied',
  price: '',
  contact: '',
  notes: '',
}

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
            houseNo: data.houseNo || '',
            ownerName: data.ownerName || '',
            block: data.block || '',
            plotSize: data.plotSize || '',
            floors: data.floors || '',
            type: data.type || 'Residential',
            status: data.status || 'occupied',
            price: data.price || '',
            contact: data.contact || '',
            notes: data.notes || '',
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
    setPhotos(prev => [...prev, ...files].slice(0, 8))
  }

  async function uploadPhotos(propertyId) {
    const urls = [...existingPhotos]
    for (const file of photos) {
      const storageRef = ref(storage, `properties/${propertyId}/${Date.now()}_${file.name}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      urls.push(url)
    }
    return urls
  }

  async function handleSave() {
    if (!form.houseNo.trim()) {
      setError('House number is required')
      return
    }
    setError('')

    try {
      if (isEdit) {
        // For edits: navigate away immediately, save in background
        navigate(`/property/${id}`)
        updateDoc(doc(db, 'properties', id), {
          ...form,
          updatedAt: serverTimestamp(),
        }).catch(console.error)
        // Upload photos silently in background
        if (photos.length > 0) {
          uploadPhotos(id).then(photoUrls => {
            updateDoc(doc(db, 'properties', id), { photos: photoUrls })
          }).catch(console.error)
        }
      } else {
        // Generate a new doc ref with ID immediately — no network wait
        const newDocRef = doc(collection(db, 'properties'))
        // Navigate instantly using the pre-generated ID
        navigate(`/property/${newDocRef.id}`)
        // Save to Firestore entirely in background
        setDoc(newDocRef, {
          ...form,
          photos: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch(console.error)
        // Upload photos in background
        if (photos.length > 0) {
          uploadPhotos(newDocRef.id).then(photoUrls => {
            updateDoc(newDocRef, { photos: photoUrls })
          }).catch(console.error)
        }
      }
    } catch (err) {
      console.error(err)
      setError(err.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="bg-primary px-5 pt-12 pb-5 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-white/80 active:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="font-display font-bold text-white text-xl">
          {isEdit ? 'Edit Property' : 'Add Property'}
        </h1>
      </div>

      <div className="px-5 py-6 flex flex-col gap-5">

        {/* House Number */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
            House Number *
          </label>
          <input
            name="houseNo"
            value={form.houseNo}
            onChange={handleChange}
            placeholder="e.g. B-47 or 108"
            className="w-full bg-surface-raised rounded-xl px-4 py-3 text-text-primary font-display font-bold text-lg outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Owner + Contact */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Owner Name</label>
            <input name="ownerName" value={form.ownerName} onChange={handleChange} placeholder="Owner name"
              className="w-full bg-surface-raised rounded-xl px-4 py-3 text-text-primary outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Contact</label>
            <input name="contact" value={form.contact} onChange={handleChange} placeholder="98XXXXXXXX" type="tel"
              className="w-full bg-surface-raised rounded-xl px-4 py-3 text-text-primary outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>

        {/* Block / Sector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Block / Sector</label>
          <input name="block" value={form.block} onChange={handleChange} placeholder="e.g. Block B, Sector 7"
            className="w-full bg-surface-raised rounded-xl px-4 py-3 text-text-primary outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        {/* Plot Size + Floors */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Plot Size (Gaj)</label>
            <input name="plotSize" value={form.plotSize} onChange={handleChange} placeholder="100" type="number"
              className="w-full bg-surface-raised rounded-xl px-4 py-3 text-text-primary outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Floors</label>
            <input name="floors" value={form.floors} onChange={handleChange} placeholder="G+2"
              className="w-full bg-surface-raised rounded-xl px-4 py-3 text-text-primary outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>

        {/* Type + Status */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Type</label>
            <select name="type" value={form.type} onChange={handleChange}
              className="w-full bg-surface-raised rounded-xl px-4 py-3 text-text-primary outline-none focus:ring-2 focus:ring-primary/20">
              {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Status</label>
            <select name="status" value={form.status} onChange={handleChange}
              className="w-full bg-surface-raised rounded-xl px-4 py-3 text-text-primary outline-none focus:ring-2 focus:ring-primary/20">
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {/* Price */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Price / Asking Price (₹)</label>
          <input name="price" value={form.price} onChange={handleChange} placeholder="e.g. 8500000" type="number"
            className="w-full bg-surface-raised rounded-xl px-4 py-3 text-text-primary outline-none focus:ring-2 focus:ring-primary/20" />
        </div>

        {/* Photos */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
            Photos ({existingPhotos.length + photos.length}/8)
          </label>

          {/* Existing photo thumbnails */}
          {existingPhotos.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto scroll-hidden pb-1">
              {existingPhotos.map((url, i) => (
                <img key={i} src={url} alt="" className="w-20 h-20 object-cover rounded-xl flex-shrink-0" />
              ))}
            </div>
          )}

          {/* New photo previews */}
          {photos.length > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto scroll-hidden pb-1">
              {photos.map((file, i) => (
                <img key={i} src={URL.createObjectURL(file)} alt="" className="w-20 h-20 object-cover rounded-xl flex-shrink-0 opacity-80" />
              ))}
            </div>
          )}

          <label className="flex items-center justify-center gap-3 w-full bg-surface-raised rounded-xl px-4 py-4 border-2 border-dashed border-gray-200 cursor-pointer active:bg-gray-100">
            <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span className="text-text-secondary text-sm font-medium">Add photos from camera or gallery</span>
            <input type="file" accept="image/*" multiple onChange={handlePhotos} className="hidden" />
          </label>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Notes</label>
          <textarea name="notes" value={form.notes} onChange={handleChange}
            placeholder="Corner plot, east facing, disputed title, renovation done, etc."
            rows={3}
            className="w-full bg-surface-raised rounded-xl px-4 py-3 text-text-primary outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full bg-primary text-white font-display font-bold text-base py-4 rounded-2xl active:scale-[0.98] transition-transform mt-2"
        >
          {isEdit ? 'Save Changes' : 'Save Property'}
        </button>

      </div>
    </div>
  )
}
