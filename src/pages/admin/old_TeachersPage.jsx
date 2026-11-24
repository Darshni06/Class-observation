import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
  getAllTeachers, getClasses, createTeacherAccount, updateTeacherProfile,
  deleteTeacherProfile, assignTeacherToClass, removeTeacherFromClass, resetPasswordEmail,
} from '../../firebase/services'
import { PageSpinner, EmptyState, Modal, Pill } from '../../components/UI'
import ConfirmModal from '../../components/ConfirmModal'
import { useToast } from '../../contexts/ToastContext'
import { initials } from '../../utils/helpers'

export default function TeachersPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [teachers, setTeachers] = useState([])
  const [classes, setClasses] = useState([])
  const [modal, setModal] = useState(null) // 'add' | { edit: teacher } | null
  const [toDelete, setToDelete] = useState(null)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const load = async () => {
    const deptId = profile?.departmentId
    const [tch, cls] = await Promise.all([getAllTeachers(deptId), getClasses(deptId)])
    setTeachers(tch)
    setClasses(cls)
    setLoading(false)
  }
  useEffect(() => { load() }, [profile?.departmentId])

  if (loading) return <PageSpinner label="Loading teachers…" />

  const classNameFor = (classId) => classes.find(c => c.id === classId)?.displayName || '—'

  return (
    <div>
      <div className="page-header page-header-row">
        <div>
          <h1>Teachers</h1>
          <p>Create teacher accounts and assign them to classes.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>
          <i className="ti ti-user-plus" /> Add Teacher
        </button>
      </div>

      <div className="card">
        {teachers.length === 0 ? (
          <EmptyState icon="users" message="No teachers added yet." actionLabel="Add Teacher" onAction={() => setModal('add')} />
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th></th><th>Name</th><th>Email</th><th>Assigned Class</th><th></th></tr></thead>
              <tbody>
                {teachers.map(t => (
                  <tr key={t.id}>
                    <td><span className="nav-avatar">{initials(t.name)}</span></td>
                    <td>{t.name}</td>
                    <td>{t.email}</td>
                    <td>{t.classId ? <Pill label={classNameFor(t.classId)} cls="pill-green" /> : <Pill label="Unassigned" cls="pill-gray" />}</td>
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-sm" onClick={() => setModal({ edit: t })}><i className="ti ti-edit" /> Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => setToDelete(t)}><i className="ti ti-trash" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal === 'add' && (
        <AddTeacherModal classes={classes} departmentId={profile?.departmentId} onClose={() => setModal(null)} onSaved={() => { setModal(null); load() }} />
      )}
      {modal?.edit && (
        <EditTeacherModal teacher={modal.edit} classes={classes} onClose={() => setModal(null)} onSaved={() => { setModal(null); load() }} />
      )}

      {toDelete && (
        <ConfirmModal
          title="Remove teacher?"
          message={`This removes ${toDelete.name}'s portal access and unassigns their class. Their Firebase Auth login will still exist unless removed from the Firebase console.`}
          onCancel={() => setToDelete(null)}
          onConfirm={async () => {
            setSaving(true)
            try {
              await deleteTeacherProfile(toDelete.id)
              toast.success('Teacher removed.')
              setToDelete(null)
              load()
            } catch (e) {
              toast.error('Could not remove: ' + e.message)
            } finally {
              setSaving(false)
            }
          }}
          loading={saving}
        />
      )}
    </div>
  )
}

function AddTeacherModal({ classes, departmentId, onClose, onSaved }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [classId, setClassId] = useState('')
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || password.length < 6) {
      toast.error('Please fill all fields. Password must be at least 6 characters.')
      return
    }
    setSaving(true)
    try {
      await createTeacherAccount(email.trim(), password, { name: name.trim(), classId: classId || null, departmentId })
      toast.success(`Teacher account created for ${name.trim()}. Share the temporary password with them securely.`)
      onSaved()
    } catch (e2) {
      toast.error('Could not create account: ' + (e2.code === 'auth/email-already-in-use' ? 'this email is already in use.' : e2.message))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Add Teacher" onClose={onClose} footer={
      <>
        <button className="btn" onClick={onClose} disabled={saving}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Creating…' : 'Create Account'}</button>
      </>
    }>
      <form onSubmit={handleSubmit}>
        <div className="fgroup" style={{ marginBottom: 14 }}>
          <label>Full name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Raman" />
        </div>
        <div className="fgroup" style={{ marginBottom: 14 }}>
          <label>Email address</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teacher@kamalaniketan.edu" />
        </div>
        <div className="fgroup" style={{ marginBottom: 14 }}>
          <label>Temporary password</label>
          <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
        </div>
        <div className="fgroup">
          <label>Assign class (optional)</label>
          <select value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">Unassigned</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.displayName}</option>)}
          </select>
        </div>
      </form>
    </Modal>
  )
}

function EditTeacherModal({ teacher, classes, onClose, onSaved }) {
  const [name, setName] = useState(teacher.name || '')
  const [classId, setClassId] = useState(teacher.classId || '')
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateTeacherProfile(teacher.id, { name: name.trim() })
      if (classId !== (teacher.classId || '')) {
        if (classId) await assignTeacherToClass(classId, teacher.id)
        else await removeTeacherFromClass(teacher.id)
      }
      toast.success('Teacher updated.')
      onSaved()
    } catch (e2) {
      toast.error('Could not update: ' + e2.message)
    } finally {
      setSaving(false)
    }
  }

  const handleResetPassword = async () => {
    try {
      await resetPasswordEmail(teacher.email)
      toast.success(`Password reset email sent to ${teacher.email}.`)
    } catch (e2) {
      toast.error('Could not send reset email: ' + e2.message)
    }
  }

  return (
    <Modal title="Edit Teacher" onClose={onClose} footer={
      <>
        <button className="btn" onClick={onClose} disabled={saving}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
      </>
    }>
      <form onSubmit={handleSubmit}>
        <div className="fgroup" style={{ marginBottom: 14 }}>
          <label>Full name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="fgroup" style={{ marginBottom: 14 }}>
          <label>Email address</label>
          <input type="email" value={teacher.email} disabled style={{ background: 'var(--gray-100)' }} />
        </div>
        <div className="fgroup" style={{ marginBottom: 14 }}>
          <label>Assigned class</label>
          <select value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">Unassigned</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.displayName}</option>)}
          </select>
        </div>
        <button type="button" className="btn btn-sm" onClick={handleResetPassword}>
          <i className="ti ti-key" /> Send password reset email
        </button>
      </form>
    </Modal>
  )
}
