import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllObservations, getClasses, deleteObservation } from '../../firebase/services'
import { PageSpinner, EmptyState, Pill } from '../../components/UI'
import ConfirmModal from '../../components/ConfirmModal'
import { useToast } from '../../contexts/ToastContext'
import { formatDate, observationStatus, round1 } from '../../utils/helpers'

export default function AllObservationsPage() {
  const [loading, setLoading] = useState(true)
  const [observations, setObservations] = useState([])
  const [classes, setClasses] = useState([])
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

  const [fClass, setFClass] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [fFrom, setFFrom] = useState('')
  const [fTo, setFTo] = useState('')
  const [search, setSearch] = useState('')

  const load = async () => {
    const [obs, cls] = await Promise.all([getAllObservations(), getClasses()])
    setObservations(obs)
    setClasses(cls)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    return observations.filter(o => {
      if (fClass && o.classId !== fClass) return false
      if (fStatus) {
        const st = observationStatus(o).key
        if (st !== fStatus) return false
      }
      if (fFrom && o.date < fFrom) return false
      if (fTo && o.date > fTo) return false
      if (search) {
        const hay = `${(o.teacherNames || []).join(' ')} ${o.classDisplayName} ${o.observerName}`.toLowerCase()
        if (!hay.includes(search.toLowerCase())) return false
      }
      return true
    })
  }, [observations, fClass, fStatus, fFrom, fTo, search])

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

  return (
    <div>
      <div className="page-header page-header-row">
        <div>
          <h1>All Observations</h1>
          <p>{filtered.length} of {observations.length} observations</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/new')}>
          <i className="ti ti-clipboard-plus" /> New Observation
        </button>
      </div>

      <div className="filter-bar">
        <input type="text" placeholder="Search class, teacher, observer…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ minWidth: 220 }} />
        <select value={fClass} onChange={(e) => setFClass(e.target.value)}>
          <option value="">All classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.displayName}</option>)}
        </select>
        <select value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="complete">Complete</option>
          <option value="partial">Partial</option>
        </select>
        <input type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)} title="From date" />
        <input type="date" value={fTo} onChange={(e) => setFTo(e.target.value)} title="To date" />
        {(fClass || fStatus || fFrom || fTo || search) && (
          <button className="btn btn-sm" onClick={() => { setFClass(''); setFStatus(''); setFFrom(''); setFTo(''); setSearch('') }}>
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
                <tr>
                  <th>Date</th><th>Class</th><th>Teacher(s)</th><th>Observer</th>
                  <th>Overall Avg</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => {
                  const st = observationStatus(o)
                  return (
                    <tr key={o.id}>
                      <td>{formatDate(o.date)}</td>
                      <td>{o.classDisplayName}</td>
                      <td>{(o.teacherNames || []).join(', ') || '—'}</td>
                      <td>{o.observerName}</td>
                      <td>{o.overallAverage != null ? `${round1(o.overallAverage)} / 3` : '—'}</td>
                      <td><Pill label={st.label} cls={st.cls} /></td>
                      <td>
                        <div className="btn-group">
                          <button className="btn btn-sm" onClick={() => navigate(`/admin/observations/${o.id}/edit`)}>
                            <i className="ti ti-edit" /> Edit
                          </button>
                          <button className="btn btn-sm btn-ai" onClick={() => navigate(`/admin/reports?obsId=${o.id}`)}>
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
          message={`This will permanently delete the observation for ${toDelete.classDisplayName} on ${formatDate(toDelete.date)}.`}
          onCancel={() => setToDelete(null)}
          onConfirm={handleDelete}
          loading={deleting}
        />
      )}
    </div>
  )
}
