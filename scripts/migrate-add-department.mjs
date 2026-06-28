// ─────────────────────────────────────────────────────────────────────────
// ONE-TIME MIGRATION: backfill departmentId on all existing data
//
// Run this exactly once, after adding department support to an existing
// deployment. It signs in as your EXISTING admin account and stamps
// `departmentId: "dept-1"` (or whatever you set DEPARTMENT_ID to below) onto
// every classes/users/observations/reports document that doesn't already
// have one.
//
// HOW TO RUN — read the README's "Adding a second department" section
// first, since this requires temporarily relaxing your Firestore rules.
//
//   node scripts/migrate-add-department.mjs
//
// Requires the same Firebase web config as your .env file, plus the
// existing admin's email/password, all read from environment variables so
// no secrets are hard-coded here:
//
//   VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID,
//   VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID
//   MIGRATION_ADMIN_EMAIL, MIGRATION_ADMIN_PASSWORD
//
// On Mac/Linux you can just run it with your .env values exported, e.g.:
//   export $(grep -v '^#' .env | xargs) MIGRATION_ADMIN_EMAIL=you@school.edu MIGRATION_ADMIN_PASSWORD=yourpassword
//   node scripts/migrate-add-department.mjs
// ─────────────────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, collection, getDocs, doc, writeBatch, updateDoc } from 'firebase/firestore'

const DEPARTMENT_ID = 'dept-1' // the existing department's ID — change if you want a different name

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

const ADMIN_EMAIL = process.env.MIGRATION_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.MIGRATION_ADMIN_PASSWORD

async function main() {
  if (!firebaseConfig.apiKey || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Missing required environment variables. See the comment at the top of this file.')
    process.exit(1)
  }

  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const db = getFirestore(app)

  console.log(`Signing in as ${ADMIN_EMAIL}...`)
  await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD)
  console.log('Signed in.')

  // IMPORTANT: this admin's own user doc must already have departmentId set
  // (do this manually in Firebase Console BEFORE running this script), or
  // the stricter rules will reject every write below once redeployed.

  const collections = ['classes', 'users', 'observations', 'reports']
  for (const colName of collections) {
    console.log(`\nScanning "${colName}"...`)
    const snap = await getDocs(collection(db, colName))
    const toUpdate = snap.docs.filter(d => d.data().departmentId === undefined)
    console.log(`  ${snap.size} total documents, ${toUpdate.length} missing departmentId.`)

    // Firestore batches max out at 500 writes
    for (let i = 0; i < toUpdate.length; i += 450) {
      const chunk = toUpdate.slice(i, i + 450)
      const batch = writeBatch(db)
      chunk.forEach(d => batch.update(doc(db, colName, d.id), { departmentId: DEPARTMENT_ID }))
      await batch.commit()
      console.log(`  Updated ${Math.min(i + 450, toUpdate.length)} / ${toUpdate.length}`)
    }
  }

  console.log('\nMigration complete. Now redeploy the strict firestore.rules and you are done.')
  process.exit(0)
}

main().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
