import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getAllObservations, getAllTeachers, getAllReports, getClasses } from '../../firebase/services'
import { StatCard, PageSpinner, EmptyState, Pill } from '../../components/UI'
import { categoriesInObservations, avgCategoryMarks, TOTAL_MARKS } from '../../data/observationParams'
import { formatDate, observationStatus, round1 } from '../../utils/helpers'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [observations, setObservations] = useState([])
  const [teachers, setTeachers] = useState([])
  const [reports, setReports] = useState([])
  const [classes, setClasses] = useState([])
  const navigate = useNavigate()
  const { profile } = useAuth()

  useEffect(() => {
    (async () => {
      const deptId = profile?.departmentId
      const [obs, tch, rep, cls] = await Promise.all([
        getAllObservations(deptId), getAllTeachers(deptId), getAllReports(deptId), getClasses(deptId),
      ])
      setObservations(obs)
      setTeachers(tch)
      setReports(rep)
      setClasses(cls)
      setLoading(false)
    })()
  }, [profile?.departmentId])

  if (loading) return <PageSpinner label="Loading dashboard…" />

  const recent = observations.slice(0, 6)
  const thisMonthCount = observations.filter(o => o.date?.slice(0, 7) === new Date().toISOString().slice(0, 7)).length

  // Average marks per category across all observations
  const categoryAvgMarks = {}
  const shownCategories = categoriesInObservations(observations)
  shownCategories.forEach(cat => { categoryAvgMarks[cat.id] = avgCategoryMarks(observations, cat.id) })

  // Overall avg total marks
  const totalMarksVals = observations.map(o => o.totalMarks).filter(v => v != null)
  const avgTotalMarks = totalMarksVals.length
    ? totalMarksVals.reduce((a, b) => a + b, 0) / totalMarksVals.length
    : null

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
        {avgTotalMarks != null && (
          <StatCard label="Avg Total Marks" value={`${round1(avgTotalMarks)} / ${TOTAL_MARKS}`} icon="chart-bar" color="purple" />
        )}
      </div>

      <div className="form-grid-2" style={{ alignItems: 'flex-start' }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Average marks by category</span></div>
          <div className="card-body">
            {shownCategories.map(cat => {
              const val = categoryAvgMarks[cat.id]
              const pct = val != null ? (val / (cat.maxMarks || 1)) * 100 : 0
              const color = pct >= 66 ? 'var(--green-600)' : pct >= 33 ? 'var(--amber-600)' : 'var(--red-700)'
              return (
                <div className="progress-bar-wrap" key={cat.id}>
                  <div className="progress-bar-label">
                    <span style={{ fontSize: 11 }}>{cat.label}</span>
                    <span>{val != null ? `${round1(val)} / ${cat.maxMarks}` : '—'}</span>
                  </div>
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              )
            })}
            {avgTotalMarks != null && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 13, fontWeight: 600, color: 'var(--green-800)' }}>
                Overall average: {round1(avgTotalMarks)} / {TOTAL_MARKS} marks
              </div>
            )}
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
                    <tr><th>Date</th><th>Class</th><th>Marks</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {recent.map(o => {
                      const st = observationStatus(o)
                      return (
                        <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/observations/${o.id}/edit`)}>
                          <td>{formatDate(o.date)}</td>
                          <td>{o.classDisplayName}</td>
                          <td>{o.totalMarks != null ? `${round1(o.totalMarks)} / ${TOTAL_MARKS}` : '—'}</td>
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
