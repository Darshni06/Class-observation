import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllObservations, getAllTeachers, getAllReports, getClasses } from '../../firebase/services'
import { StatCard, PageSpinner, ProgressBarRow, EmptyState, Pill } from '../../components/UI'
import { OBSERVATION_CATEGORIES } from '../../data/observationParams'
import { formatDate, observationStatus, round1 } from '../../utils/helpers'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [observations, setObservations] = useState([])
  const [teachers, setTeachers] = useState([])
  const [reports, setReports] = useState([])
  const [classes, setClasses] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    (async () => {
      const [obs, tch, rep, cls] = await Promise.all([
        getAllObservations(), getAllTeachers(), getAllReports(), getClasses(),
      ])
      setObservations(obs)
      setTeachers(tch)
      setReports(rep)
      setClasses(cls)
      setLoading(false)
    })()
  }, [])

  if (loading) return <PageSpinner label="Loading dashboard…" />

  const scoredCats = OBSERVATION_CATEGORIES.filter(c => c.scored)
  const categoryAvgAcrossAll = {}
  scoredCats.forEach(cat => {
    const vals = observations.map(o => o.categoryAverages?.[cat.id]).filter(v => v != null)
    categoryAvgAcrossAll[cat.id] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  })

  const recent = observations.slice(0, 6)
  const thisMonthCount = observations.filter(o => o.date?.slice(0, 7) === new Date().toISOString().slice(0, 7)).length

  return (
    <div>
      <div className="page-header page-header-row">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of classroom observations across Kamala Niketan.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/new')}>
          <i className="ti ti-clipboard-plus" /> New Observation
        </button>
      </div>

      <div className="stat-grid">
        <StatCard label="Total Observations" value={observations.length} icon="clipboard-list" color="green" trend={`${thisMonthCount} this month`} />
        <StatCard label="Teachers" value={teachers.length} icon="users" color="purple" />
        <StatCard label="Classes" value={classes.length} icon="school" color="amber" />
        <StatCard label="Reports Generated" value={reports.length} icon="sparkles" color="green" />
      </div>

      <div className="form-grid-2" style={{ alignItems: 'flex-start' }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Average score by category</span></div>
          <div className="card-body">
            {scoredCats.map(cat => (
              <ProgressBarRow key={cat.id} label={cat.label} value={categoryAvgAcrossAll[cat.id] != null ? round1(categoryAvgAcrossAll[cat.id]) : null} />
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Recent observations</span></div>
          <div className="card-body" style={{ padding: 0 }}>
            {recent.length === 0 ? (
              <div style={{ padding: 20 }}>
                <EmptyState icon="clipboard-list" message="No observations recorded yet." actionLabel="Create one" onAction={() => navigate('/admin/new')} />
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Date</th><th>Class</th><th>Teacher(s)</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {recent.map(o => {
                      const st = observationStatus(o)
                      return (
                        <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/observations/${o.id}/edit`)}>
                          <td>{formatDate(o.date)}</td>
                          <td>{o.classDisplayName}</td>
                          <td>{(o.teacherNames || []).join(', ') || '—'}</td>
                          <td><Pill label={st.label} cls={st.cls} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
