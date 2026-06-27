import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getObservationsByClass, deleteObservation } from '../../firebase/services'
import { PageSpinner, EmptyState, Pill } from '../../components/UI'
import ConfirmModal from '../../components/ConfirmModal'
import { useToast } from '../../contexts/ToastContext'
import { formatDate, observationStatus, round1 } from '../../utils/helpers'

// Same idea as the admin's All Observations page, but scoped to the
// teacher's own class — no class/teacher filter needed since there's only
// ever one class in view.
export default function TeacherAllObservationsPage() {
  const { profile } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [observations, setObservations] = useState([])
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [fStatus, setFStatus] = useState('')
  const [fFrom, setFFrom] = useState('')
  const [fTo, setFTo] = useState('')
  const [search, setSearch] = useState('')

  const load = async () => {
    if (!profile?.classId) { setObservations([]); setLoading(false); return }
    const obs = await getObservationsByClass(profile.classId)
    setObservations(obs)
    setLoading(false)
  }

  useEffect(() => { load() }, [profile?.classId])

  const filtered = useMemo(() => {
    return observations.filter(o => {
      if (fStatus) {
        const st = observationStatus(o).key
        if (st !== fStatus) return false
      }
      if (fFrom && o.date < fFrom) return false
      if (fTo && o.date > fTo) return false
      if (search) {
        const hay = `${o.observerName} ${(o.teacherNames || []).join(' ')}`.toLowerCase()
        if (!hay.includes(search.toLowerCase())) return false
      }
      return true
    })
  }, [observations, fStatus, fFrom, fTo, search])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteObservation(toDelete.id)
      toast.success('Observation deleted.')
      setToDelete(null)
      load()
    } catch (e) {
      toast.error('Could not delete: ' + e.message)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <PageSpinner label="Loading observations…" />

  if (!profile?.classId) {
    return (
      <div>
        <div className="page-header"><h1>All Observations</h1></div>
        <div className="card"><EmptyState icon="clipboard-list" message="You are not assigned to a class yet. Contact your admin." /></div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header page-header-row">
        <div>
          <h1>All Observations</h1>
          <p>{filtered.length} of {observations.length} observations for your class</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/teacher/new')}>
          <i className="ti ti-clipboard-plus" /> New Observation
        </button>
      </div>

      <div className="filter-bar">
        <input type="text" placeholder="Search observer, teacher…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ minWidth: 220 }} />
        <select value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="complete">Complete</option>
          <option value="partial">Partial</option>
        </select>
        <input type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)} title="From date" />
        <input type="date" value={fTo} onChange={(e) => setFTo(e.target.value)} title="To date" />
        {(fStatus || fFrom || fTo || search) && (
          <button className="btn btn-sm" onClick={() => { setFStatus(''); setFFrom(''); setFTo(''); setSearch('') }}>
            <i className="ti ti-x" /> Clear filters
          </button>
        )}
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <EmptyState icon="clipboard-list" message="No observations match these filters." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Date</th><th>Observer</th><th>Overall Avg</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map(o => {
                  const st = observationStatus(o)
                  return (
                    <tr key={o.id}>
                      <td>{formatDate(o.date)}</td>
                      <td>{o.observerName}</td>
                      <td>{o.overallAverage != null ? `${round1(o.overallAverage)} / 3` : '—'}</td>
                      <td><Pill label={st.label} cls={st.cls} /></td>
                      <td>
                        <div className="btn-group">
                          <button className="btn btn-sm" onClick={() => navigate(`/teacher/observations/${o.id}/edit`)}>
                            <i className="ti ti-edit" /> Edit
                          </button>
                          <button className="btn btn-sm btn-ai" onClick={() => navigate(`/teacher/generate-report?obsId=${o.id}`)}>
                            <i className="ti ti-sparkles" /> Report
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => setToDelete(o)}>
                            <i className="ti ti-trash" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toDelete && (
        <ConfirmModal
          title="Delete observation?"
          message={`This will permanently delete the observation dated ${formatDate(toDelete.date)}.`}
          onCancel={() => setToDelete(null)}
          onConfirm={handleDelete}
          loading={deleting}
        />
      )}
    </div>
  )
}
