import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getClasses, getAllTeachers, addClass, updateClass, deleteClass, assignTeacherToClass, removeTeacherFromClass } from '../../firebase/services'
import { PageSpinner, EmptyState, Modal, Pill } from '../../components/UI'
import ConfirmModal from '../../components/ConfirmModal'
import { useToast } from '../../contexts/ToastContext'

export default function ClassesPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [modal, setModal] = useState(null) // 'add' | { edit } | null
  const [toDelete, setToDelete] = useState(null)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const load = async () => {
    const deptId = profile?.departmentId
    const [cls, tch] = await Promise.all([getClasses(deptId), getAllTeachers(deptId)])
    setClasses(cls)
    setTeachers(tch)
    setLoading(false)
  }
  useEffect(() => { load() }, [profile?.departmentId])

  if (loading) return <PageSpinner label="Loading classes…" />

  return (
    <div>
      <div className="page-header page-header-row">
        <div>
          <h1>Classes</h1>
          <p>Create classes manually and assign one or more teachers to each.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>
          <i className="ti ti-plus" /> Add Class
        </button>
      </div>

      <div className="card">
        {classes.length === 0 ? (
          <EmptyState icon="school" message="No classes added yet." actionLabel="Add Class" onAction={() => setModal('add')} />
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Class</th><th>Strength</th><th>Teacher(s) assigned</th><th></th></tr></thead>
              <tbody>
                {classes.map(c => (
                  <tr key={c.id}>
                    <td>{c.displayName}</td>
                    <td>{c.strength || '—'}</td>
                    <td>
                      {(c.teacherNames || []).length
                        ? c.teacherNames.map(n => <Pill key={n} label={n} cls="pill-green" />)
                        : <Pill label="Unassigned" cls="pill-gray" />}
                    </td>
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-sm" onClick={() => setModal({ edit: c })}><i className="ti ti-edit" /> Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => setToDelete(c)}><i className="ti ti-trash" /></button>
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
        <ClassModal teachers={teachers} departmentId={profile?.departmentId} onClose={() => setModal(null)} onSaved={() => { setModal(null); load() }} />
      )}
      {modal?.edit && (
        <ClassModal teachers={teachers} departmentId={profile?.departmentId} existing={modal.edit} onClose={() => setModal(null)} onSaved={() => { setModal(null); load() }} />
      )}

      {toDelete && (
        <ConfirmModal
          title="Delete class?"
          message={`This will permanently delete "${toDelete.displayName}" and unassign its teacher(s). Existing observations for this class will not be deleted.`}
          onCancel={() => setToDelete(null)}
          onConfirm={async () => {
            setSaving(true)
            try {
              await deleteClass(toDelete.id)
              toast.success('Class deleted.')
              setToDelete(null)
              load()
            } catch (e) {
              toast.error('Could not delete: ' + e.message)
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

function ClassModal({ teachers, existing, departmentId, onClose, onSaved }) {
  const [className, setClassName] = useState(existing?.className || '')
  const [section, setSection] = useState(existing?.section || '')
  const [strength, setStrength] = useState(existing?.strength ? String(existing.strength) : '')
  // Local working copy of assigned teacher IDs so chips can be added/removed
  // before hitting Save — actual sync calls happen on submit.
  const [teacherIds, setTeacherIds] = useState(existing?.teacherIds || [])
  const [addTeacherId, setAddTeacherId] = useState('')
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const teacherById = (id) => teachers.find(t => t.id === id)
  const availableToAdd = teachers.filter(t => !teacherIds.includes(t.id))

  const handleAddChip = () => {
    if (!addTeacherId) return
    setTeacherIds(prev => [...prev, addTeacherId])
    setAddTeacherId('')
  }
  const handleRemoveChip = (id) => setTeacherIds(prev => prev.filter(t => t !== id))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!className.trim()) { toast.error('Class name is required.'); return }
    setSaving(true)
    try {
      let classId = existing?.id
      if (existing) {
        await updateClass(existing.id, { className: className.trim(), section: section.trim(), strength })
      } else {
        classId = await addClass({ className: className.trim(), section: section.trim(), strength, departmentId })
      }

      const previousIds = existing?.teacherIds || []
      const toAdd = teacherIds.filter(id => !previousIds.includes(id))
      const toRemove = previousIds.filter(id => !teacherIds.includes(id))

      for (const id of toRemove) await removeTeacherFromClass(id)
      for (const id of toAdd) await assignTeacherToClass(classId, id)

      toast.success(existing ? 'Class updated.' : 'Class created.')
      onSaved()
    } catch (e2) {
      toast.error('Could not save: ' + e2.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={existing ? 'Edit Class' : 'Add Class'} onClose={onClose} footer={
      <>
        <button className="btn" onClick={onClose} disabled={saving}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </>
    }>
      <form onSubmit={handleSubmit}>
        <div className="form-grid-2">
          <div className="fgroup" style={{ marginBottom: 14 }}>
            <label>Class name</label>
            <input type="text" value={className} onChange={(e) => setClassName(e.target.value)} placeholder="e.g. LKG" />
          </div>
          <div className="fgroup" style={{ marginBottom: 14 }}>
            <label>Section (optional)</label>
            <input type="text" value={section} onChange={(e) => setSection(e.target.value)} placeholder="e.g. A" />
          </div>
        </div>
        <div className="fgroup" style={{ marginBottom: 14 }}>
          <label>Strength (no. of children)</label>
          <input type="number" min="0" value={strength} onChange={(e) => setStrength(e.target.value)} placeholder="e.g. 20" />
        </div>

        <div className="fgroup" style={{ marginBottom: 8 }}>
          <label>Teacher(s) assigned</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {teacherIds.length === 0 && <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>No teachers assigned yet.</span>}
            {teacherIds.map(id => {
              const t = teacherById(id)
              return (
                <span className="pill pill-green" key={id} style={{ paddingRight: 6 }}>
                  {t?.name || 'Unknown'}
                  <i className="ti ti-x" style={{ cursor: 'pointer', marginLeft: 4 }} onClick={() => handleRemoveChip(id)} />
                </span>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={addTeacherId} onChange={(e) => setAddTeacherId(e.target.value)} style={{ flex: 1 }}>
              <option value="">Select a teacher to add…</option>
              {availableToAdd.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}{t.classId && t.classId !== existing?.id ? ' (currently on another class)' : ''}
                </option>
              ))}
            </select>
            <button type="button" className="btn btn-sm" onClick={handleAddChip} disabled={!addTeacherId}>
              <i className="ti ti-plus" /> Add
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 6 }}>
            Adding a teacher who is already on another class will move them to this one.
          </p>
        </div>
      </form>
    </Modal>
  )
}
