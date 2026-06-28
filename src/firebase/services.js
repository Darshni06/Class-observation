import {
  collection, doc, getDocs, getDoc, addDoc, setDoc, updateDoc,
  deleteDoc, query, where, serverTimestamp, runTransaction,
} from 'firebase/firestore'
import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { db, auth } from './config'
import { computeAverages, isFullyScored } from '../data/observationParams'

// ─── Auth ───────────────────────────────────────────────────────────────────

export const loginUser = (email, password) =>
  signInWithEmailAndPassword(auth, email, password)

export const logoutUser = () => signOut(auth)

export const resetPasswordEmail = (email) => sendPasswordResetEmail(auth, email)

// Create a teacher account (admin use only). departmentId is always the
// CREATING ADMIN's own department — a teacher always belongs to whichever
// department the admin who made them belongs to.
export const createTeacherAccount = async (email, password, { name, classId, departmentId }) => {
  const { initializeApp, getApps, deleteApp } = await import('firebase/app')
  const { getAuth, createUserWithEmailAndPassword } = await import('firebase/auth')

  const mainApp = getApps()[0]
  const config  = mainApp.options

  const secondaryApp  = initializeApp(config, 'temp_admin_create_' + Date.now())
  const secondaryAuth = getAuth(secondaryApp)

  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password)
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      email,
      name,
      role: 'teacher',
      classId: null,
      departmentId,
      createdAt: serverTimestamp(),
    })
    if (classId) {
      await assignTeacherToClass(classId, cred.user.uid)
    }
    return cred.user.uid
  } finally {
    await deleteApp(secondaryApp)
  }
}

// ─── Users / Teachers ───────────────────────────────────────────────────────

export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// departmentId is required — an admin only ever sees teachers in their own
// department, and the query must filter on it directly so Firestore can
// verify the security rule without fetching anything out of scope.
export const getAllTeachers = async (departmentId) => {
  const q = query(
    collection(db, 'users'),
    where('role', '==', 'teacher'),
    where('departmentId', '==', departmentId),
  )
  const snap = await getDocs(q)
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
}

export const updateTeacherProfile = async (uid, data) => {
  await updateDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() })
}

// Removes the teacher's portal profile and unassigns them from their class.
// Note: this does NOT delete the underlying Firebase Auth account — doing
// that from a pure frontend app would require the Admin SDK (a Cloud
// Function), which is out of scope here. See the README.
export const deleteTeacherProfile = async (uid) => {
  await removeTeacherFromClass(uid)
  await deleteDoc(doc(db, 'users', uid))
}

// ─── Classes ────────────────────────────────────────────────────────────────
// A class can have MULTIPLE teachers (e.g. two co-teachers for one room).
// Each teacher still belongs to exactly one class at a time. Every class
// belongs to exactly one department, set at creation and never changed.

const classDisplayName = (className, section) =>
  section ? `${className} - ${section}` : className

export const getClasses = async (departmentId) => {
  const q = query(collection(db, 'classes'), where('departmentId', '==', departmentId))
  const snap = await getDocs(q)
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
}

export const addClass = async ({ className, section, strength, departmentId }) => {
  const ref = await addDoc(collection(db, 'classes'), {
    className,
    section: section || '',
    displayName: classDisplayName(className, section),
    strength: Number(strength) || 0,
    departmentId,
    teacherIds: [],
    teacherNames: [],
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export const updateClass = async (classId, { className, section, strength }) => {
  await updateDoc(doc(db, 'classes', classId), {
    className,
    section: section || '',
    displayName: classDisplayName(className, section),
    strength: Number(strength) || 0,
    updatedAt: serverTimestamp(),
  })
}

export const deleteClass = async (classId) => {
  const classSnap = await getDoc(doc(db, 'classes', classId))
  const classData = classSnap.data()
  const teacherIds = classData?.teacherIds || []
  for (const tId of teacherIds) {
    await updateDoc(doc(db, 'users', tId), { classId: null, updatedAt: serverTimestamp() })
  }
  await deleteDoc(doc(db, 'classes', classId))
}

// Moves a teacher onto a class (removing them from any previous class
// first). Also re-syncs the teacher's departmentId to the class's
// departmentId as a safety net — in normal use they already match, since an
// admin can only ever pick from teachers/classes in their own department.
export const assignTeacherToClass = async (classId, teacherId) => {
  await runTransaction(db, async (tx) => {
    const teacherRef = doc(db, 'users', teacherId)
    const teacherSnap = await tx.get(teacherRef)
    if (!teacherSnap.exists()) throw new Error('Teacher not found')
    const teacherData = teacherSnap.data()
    const teacherName = teacherData.name || ''

    // Remove from previous class, if different
    if (teacherData.classId && teacherData.classId !== classId) {
      const oldClassRef = doc(db, 'classes', teacherData.classId)
      const oldClassSnap = await tx.get(oldClassRef)
      if (oldClassSnap.exists()) {
        const oldData = oldClassSnap.data()
        tx.update(oldClassRef, {
          teacherIds: (oldData.teacherIds || []).filter(id => id !== teacherId),
          teacherNames: (oldData.teacherNames || []).filter(n => n !== teacherName),
        })
      }
    }

    const classRef = doc(db, 'classes', classId)
    const classSnap = await tx.get(classRef)
    if (!classSnap.exists()) throw new Error('Class not found')
    const classData = classSnap.data()
    const newTeacherIds = Array.from(new Set([...(classData.teacherIds || []), teacherId]))
    const newTeacherNames = Array.from(new Set([...(classData.teacherNames || []), teacherName]))

    tx.update(classRef, { teacherIds: newTeacherIds, teacherNames: newTeacherNames })
    tx.update(teacherRef, { classId, departmentId: classData.departmentId, updatedAt: serverTimestamp() })
  })
}

// Removes a teacher from whichever class they're currently on.
export const removeTeacherFromClass = async (teacherId) => {
  await runTransaction(db, async (tx) => {
    const teacherRef = doc(db, 'users', teacherId)
    const teacherSnap = await tx.get(teacherRef)
    if (!teacherSnap.exists()) return
    const teacherData = teacherSnap.data()
    if (!teacherData.classId) return

    const classRef = doc(db, 'classes', teacherData.classId)
    const classSnap = await tx.get(classRef)
    if (classSnap.exists()) {
      const classData = classSnap.data()
      tx.update(classRef, {
        teacherIds: (classData.teacherIds || []).filter(id => id !== teacherId),
        teacherNames: (classData.teacherNames || []).filter(n => n !== teacherData.name),
      })
    }
    tx.update(teacherRef, { classId: null, updatedAt: serverTimestamp() })
  })
}

// ─── Observations ───────────────────────────────────────────────────────────
// Observations belong to a CLASS, not an individual teacher — one class, one
// observation per session, visible to every teacher assigned to that class.
// Every observation also carries its class's departmentId, denormalized at
// creation, so department-scoped queries don't need an extra join/lookup.

const withComputedScores = (data) => {
  const { categoryAverages, overallAverage } = computeAverages(data.scores)
  return {
    ...data,
    categoryAverages,
    overallAverage,
    fullyScored: isFullyScored(data.scores),
  }
}

// `data` must already include `departmentId` (the page building the payload
// sets it from the selected/own class's departmentId).
export const addObservation = async (data, createdByUid, creatorRole = 'admin') => {
  const ref = await addDoc(collection(db, 'observations'), {
    ...withComputedScores(data),
    createdBy: createdByUid,
    createdByRole: creatorRole, // 'admin' | 'teacher' — used for the admin's comparison/analysis page
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export const updateObservation = async (id, data) => {
  await updateDoc(doc(db, 'observations', id), {
    ...withComputedScores(data),
    updatedAt: serverTimestamp(),
  })
}

export const deleteObservation = async (id) => {
  await deleteDoc(doc(db, 'observations', id))
}

export const getObservation = async (id) => {
  const snap = await getDoc(doc(db, 'observations', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// Full list for one department — used by admin screens, filtered/sorted
// further client-side (by class, status, date, search, etc).
export const getAllObservations = async (departmentId) => {
  const q = query(collection(db, 'observations'), where('departmentId', '==', departmentId))
  const snap = await getDocs(q)
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
}

// Published observations for one class — used by the read-only "My
// Feedback" / "My Progress" teacher pages, which should only ever show
// finalized sessions, never someone's half-finished draft.
export const getPublishedObservationsByClass = async (classId, departmentId) => {
  const q = query(
    collection(db, 'observations'),
    where('classId', '==', classId),
    where('status', '==', 'published'),
    where('departmentId', '==', departmentId),
  )
  const snap = await getDocs(q)
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
}

// ALL observations (draft + published) for one class — used by the
// teacher's own management pages (New/All Observations, Generate Report,
// Export) now that teachers can author observations too, and by the
// admin's Teacher Observations analysis page.
export const getObservationsByClass = async (classId, departmentId) => {
  const q = query(
    collection(db, 'observations'),
    where('classId', '==', classId),
    where('departmentId', '==', departmentId),
  )
  const snap = await getDocs(q)
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
}

// ─── Reports ────────────────────────────────────────────────────────────────

// `data` must already include `departmentId`.
export const addReport = async (data, createdByUid, creatorRole = 'admin') => {
  const ref = await addDoc(collection(db, 'reports'), {
    ...data,
    sharedWithTeacher: creatorRole === 'teacher', // a teacher's own report is visible to them immediately
    sharedAt: creatorRole === 'teacher' ? serverTimestamp() : null,
    createdBy: createdByUid,
    createdByRole: creatorRole, // 'admin' | 'teacher'
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export const updateReport = async (id, data) => {
  await updateDoc(doc(db, 'reports', id), { ...data, updatedAt: serverTimestamp() })
}

export const shareReportWithTeacher = async (id) => {
  await updateDoc(doc(db, 'reports', id), {
    sharedWithTeacher: true,
    sharedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export const deleteReport = async (id) => {
  await deleteDoc(doc(db, 'reports', id))
}

export const getReport = async (id) => {
  const snap = await getDoc(doc(db, 'reports', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export const getAllReports = async (departmentId) => {
  const q = query(collection(db, 'reports'), where('departmentId', '==', departmentId))
  const snap = await getDocs(q)
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
}

// Shared reports for one class — used by the teacher portal.
export const getReportsByClass = async (classId, departmentId) => {
  const q = query(
    collection(db, 'reports'),
    where('classId', '==', classId),
    where('sharedWithTeacher', '==', true),
    where('departmentId', '==', departmentId),
  )
  const snap = await getDocs(q)
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
}
