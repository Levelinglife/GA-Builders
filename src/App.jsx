import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'

import Login from './screens/Login'
import Home from './screens/Home'
import AddProperty from './screens/AddProperty'
import PropertyDetail from './screens/PropertyDetail'
import Match from './screens/Match'
import BottomNav from './components/BottomNav'

export default function App() {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u))
    return () => unsub()
  }, [])

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto min-h-screen">
        <Login />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <div className="max-w-md mx-auto min-h-screen bg-background relative">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/property/:id" element={<PropertyDetail />} />
          <Route path="/add" element={<AddProperty />} />
          <Route path="/edit/:id" element={<AddProperty />} />
          <Route path="/match" element={<Match />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  )
}
