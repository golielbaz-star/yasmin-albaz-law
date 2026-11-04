import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

function getApp() {
  if (getApps().length > 0) return getApps()[0]

  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ?.replace(/\\n/g, '\n')
    .replace(/^"|"$/g, '')

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: privateKey!,
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  })
}

export const db = new Proxy({} as ReturnType<typeof getFirestore>, {
  get(_, prop) {
    return (getFirestore(getApp()) as any)[prop]
  }
})

export const storage = new Proxy({} as ReturnType<typeof getStorage>, {
  get(_, prop) {
    return (getStorage(getApp()) as any)[prop]
  }
})
