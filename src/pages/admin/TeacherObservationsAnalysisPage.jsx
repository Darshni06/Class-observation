import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getAllObservations, getAllReports, getClasses } from '../../firebase/services'
import { OBSERVATION_CATEGORIES } from '../../data/observationParams'
import { exportReportToWord } from '../../utils/exportWord'
import { PageSpinner, EmptyState, ProgressBarRow, Pill } from '../../components/UI'
import { formatDate, formatDateTime, observationStatus, round1 } from '../../utils/helpers'

// Lets the admin see what teachers have recorded about their OWN class
// (self-observations), and compares it side-by-side against the admin's
// own observations for that same class — a simple analysis view, not a
// replacement for either party's own pages.
export default function TeacherObservationsAnalysisPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [observations, setObservations] = useState([])
  const [reports, setReports] = useState([])
  const [classes, setClasses] = useState([])
  const [classId, setClassId] = useState('')

  useEffect(() => {
    (async () => {
      const deptId = profile?.departmentId
      const [obs, rep, cls] = await Promise.all([getAllObservations(deptId), getAllReports(deptId), getClasses(deptId)])
      setObservations(obs)
      setReports(rep)
      setClasses(cls)
      // Default to the first class that actually has a teacher-submitted observation
      const firstWithTeacherObs = cls.find(c => obs.some(o => o.classId === c.id && o.createdByRole === 'teacher'))
      setClassId(firstWithTeacherObs?.id || cls[0]?.id || '')
      setLoading(false)
    })()
  }, [])

  const scoredCats = OBSERVATION_CATEGORIES.filter(c => c.scored)

  const classObs = useMemo(() => observations.filter(o => o.classId === classId), [observations, classId])
  // Observations created before this feature existed have no createdByRole — treat as admin's own.
  const adminObs   = useMemo(() => classObs.filter(o => (o.createdByRole || 'admin') === 'admin'), [classObs])
  const teacherObs = useMemo(() => classObs.filter(o => o.createdByRole === 'teacher'), [classObs])
  const teacherReports = useMemo(() => reports.filter(r => r.classId === classId && r.createdByRole === 'teacher'), [reports, classId])

  const avgFor = (list, catId) => {
    const vals = list.map(o => o.categoryAverages?.[catId]).filter(v => v != null)
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  }

  const selectedClass = classes.find(c => c.id === classId)
  const classesWithTeacherData = classes.filter(c => observations.some(o => o.classId === c.id && o.createdByRole === 'teacher'))

  if (loading) return <PageSpinner label="Loading…" />

  return (
    <div>
      <div className="page-header">
        <h1>Teacher Observations</h1>
        <p>Review what teachers have recorded about their own class, and compare it against your observations for the same class.</p>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="fgroup" style={{ maxWidth: 360 }}>
            <label>Class</label>
            <select value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Select class…</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.displayName}{classesWithTeacherData.some(cc => cc.id === c.id) ? ' (has teacher submissions)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!classId ? (
        <div className="card"><EmptyState icon="users" message="Select a class to see the comparison." /></div>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="label">Admin observations</div>
              <div className="value">{adminObs.length}</div>
            </div>
            <div className="stat-card">
              <div className="label">Teacher self-observations</div>
              <div className="value">{teacherObs.length}</div>
            </div>
            <div className="stat-card">
              <div className="label">Teacher-generated reports</div>
              <div className="value">{teacherReports.length}</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Average score by category — Admin vs Teacher self-assessment</span></div>
            <div className="card-body">
              {teacherObs.length === 0 ? (
                <EmptyState icon="chart-bar" message={`${selectedClass?.displayName || 'This class'} has no teacher-submitted observations yet.`} />
              ) : (
                scoredCats.map(cat => (
                  <div key={cat.id} style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-800)', marginBottom: 6 }}>{cat.label}</div>
                    <ProgressBarRow label="Admin" value={round1(avgFor(adminObs, cat.id))} />
                    <ProgressBarRow label="Teacher (self)" value={round1(avgFor(teacherObs, cat.id))} />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Teacher-submitted observations</span></div>
            {teacherObs.length === 0 ? (
              <EmptyState icon="clipboard-list" message="No self-observations submitted by this class's teacher(s) yet." />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Date</th><th>Observer</th><th>Overall Avg</th><th>Status</th></tr></thead>
                  <tbody>
                    {teacherObs.map(o => {
                      const st = observationStatus(o)
                      return (
                        <tr key={o.id}>
                          <td>{formatDate(o.date)}</td>
                          <td>{o.observerName}</td>
                          <td>{o.overallAverage != null ? `${round1(o.overallAverage)} / 3` : '—'}</td>
                          <td><Pill label={st.label} cls={st.cls} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Teacher-generated reports</span></div>
            {teacherReports.length === 0 ? (
              <EmptyState icon="file-text" message="No reports generated by this class's teacher(s) yet." />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Period</th><th>Created</th><th>Overall Avg</th><th></th></tr></thead>
                  <tbody>
                    {teacherReports.map(r => (
                      <tr key={r.id}>
                        <td>{r.period}</td>
                        <td>{formatDateTime(r.createdAt)}</td>
                        <td>{r.avgScore != null ? `${round1(r.avgScore)} / 3` : '—'}</td>
                        <td>
                          <button className="btn btn-sm btn-export" onClick={() => exportReportToWord(r)}>
                            <i className="ti ti-file-type-doc" /> Word
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
