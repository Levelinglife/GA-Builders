import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyA53R8HCNdp5GtNeHgym4Jgt2G8e4T-ZHE",
  authDomain: "gen-lang-client-0683605153.firebaseapp.com",
  projectId: "gen-lang-client-0683605153",
  storageBucket: "gen-lang-client-0683605153.firebasestorage.app",
  messagingSenderId: "1018400864072",
  appId: "1:1018400864072:web:9bf81d4a3044702036657d",
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const storage = getStorage(app)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export default app
