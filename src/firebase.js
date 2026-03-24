import { initializeApp } from 'firebase/app'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyDOq57TGgnQUlyXLhuMJiZ9aw2ZhQayqeY",
  authDomain: "ga-builders.firebaseapp.com",
  projectId: "ga-builders",
  storageBucket: "ga-builders.firebasestorage.app",
  messagingSenderId: "276691535944",
  appId: "1:276691535944:web:bbce3975e9fe769de2707d",
}

const app = initializeApp(firebaseConfig)

// Connect exactly to the named 'ai-studio' database you linked
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
}, "ai-studio-e7df4aa7-b061-4f2c-99eb-940880e9d903")

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export default app
