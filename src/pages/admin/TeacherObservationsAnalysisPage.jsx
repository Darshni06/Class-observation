import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getAllObservations, getAllReports, getClasses } from '../../firebase/services'
import { categoriesInObservations, avgCategoryMarks, reportScoreText, TOTAL_MARKS } from '../../data/observationParams'
import { exportReportToWord } from '../../utils/exportWord'
import { PageSpinner, EmptyState, Pill } from '../../components/UI'
import { formatDate, formatDateTime, observationStatus, round1 } from '../../utils/helpers'

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
      const [obs, rep, cls] = await Promise.all([
        getAllObservations(deptId), getAllReports(deptId), getClasses(deptId),
      ])
      setObservations(obs)
      setReports(rep)
      setClasses(cls)
      const firstWithTeacherObs = cls.find(c =>
        obs.some(o => o.classId === c.id && o.createdByRole === 'teacher')
      )
      setClassId(firstWithTeacherObs?.id || cls[0]?.id || '')
      setLoading(false)
    })()
  }, [profile?.departmentId])

  const classObs    = useMemo(() => observations.filter(o => o.classId === classId), [observations, classId])
  const adminObs    = useMemo(() => classObs.filter(o => (o.createdByRole || 'admin') === 'admin'), [classObs])
  const teacherObs  = useMemo(() => classObs.filter(o => o.createdByRole === 'teacher'), [classObs])
  const teacherReports = useMemo(() => reports.filter(r => r.classId === classId && r.createdByRole === 'teacher'), [reports, classId])

  // Average marks per category for a list of observations
  const avgMarksFor = (list, catId) => avgCategoryMarks(list, catId)
  const shownCategories = useMemo(() => categoriesInObservations(classObs), [classObs])
  const avgTotalFor = (list) => {
    const vals = list.map(o => o.totalMarks).filter(v => v != null)
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  }

  const selectedClass = classes.find(c => c.id === classId)

  if (loading) return <PageSpinner label="Loading…" />

  return (
    <div>
      <div className="page-header">
        <h1>Teacher Observations</h1>
        <p>Review what teachers have recorded about their own class, and compare it against your observations — marks out of {TOTAL_MARKS}.</p>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="fgroup" style={{ maxWidth: 360 }}>
            <label>Class</label>
            <select value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Select class…</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.displayName}{observations.some(o => o.classId === c.id && o.createdByRole === 'teacher') ? ' ★' : ''}
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
              {avgTotalFor(adminObs) != null && (
                <div className="trend">Avg {round1(avgTotalFor(adminObs))} / {TOTAL_MARKS} marks</div>
              )}
            </div>
            <div className="stat-card">
              <div className="label">Teacher self-observations</div>
              <div className="value">{teacherObs.length}</div>
              {avgTotalFor(teacherObs) != null && (
                <div className="trend">Avg {round1(avgTotalFor(teacherObs))} / {TOTAL_MARKS} marks</div>
              )}
            </div>
            <div className="stat-card">
              <div className="label">Teacher-generated reports</div>
              <div className="value">{teacherReports.length}</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Marks by category — Admin vs Teacher self-assessment</span></div>
            <div className="card-body">
              {teacherObs.length === 0 ? (
                <EmptyState icon="chart-bar" message={`${selectedClass?.displayName || 'This class'} has no teacher-submitted observations yet.`} />
              ) : (
                shownCategories.map(cat => {
                  const adminVal   = avgMarksFor(adminObs, cat.id)
                  const teacherVal = avgMarksFor(teacherObs, cat.id)
                  const toBar = (val) => val != null ? (val / cat.maxMarks) * 100 : 0

                  return (
                    <div key={cat.id} style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-800)', marginBottom: 6 }}>
                        {cat.label}
                        <span style={{ color: 'var(--gray-400)', fontWeight: 400, marginLeft: 6, fontSize: 11 }}>
                          max {cat.maxMarks} marks
                        </span>
                      </div>
                      {/* Admin bar */}
                      <div className="progress-bar-wrap" style={{ marginBottom: 4 }}>
                        <div className="progress-bar-label">
                          <span style={{ fontSize: 11 }}>Admin</span>
                          <span>{adminVal != null ? `${round1(adminVal)} / ${cat.maxMarks}` : '—'}</span>
                        </div>
                        <div className="progress-bar-track">
                          <div className="progress-bar-fill" style={{ width: `${toBar(adminVal)}%`, background: 'var(--purple-700)' }} />
                        </div>
                      </div>
                      {/* Teacher bar */}
                      <div className="progress-bar-wrap">
                        <div className="progress-bar-label">
                          <span style={{ fontSize: 11 }}>Teacher (self)</span>
                          <span>{teacherVal != null ? `${round1(teacherVal)} / ${cat.maxMarks}` : '—'}</span>
                        </div>
                        <div className="progress-bar-track">
                          <div className="progress-bar-fill" style={{ width: `${toBar(teacherVal)}%`, background: 'var(--green-600)' }} />
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              {teacherObs.length > 0 && (
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 13, fontWeight: 600 }}>
                  <div style={{ display: 'flex', gap: 32 }}>
                    <span style={{ color: 'var(--purple-700)' }}>
                      Admin avg total: {avgTotalFor(adminObs) != null ? `${round1(avgTotalFor(adminObs))} / ${TOTAL_MARKS}` : '—'}
                    </span>
                    <span style={{ color: 'var(--green-700)' }}>
                      Teacher (self) avg total: {avgTotalFor(teacherObs) != null ? `${round1(avgTotalFor(teacherObs))} / ${TOTAL_MARKS}` : '—'}
                    </span>
                  </div>
                </div>
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
                  <thead>
                    <tr><th>Date</th><th>Observer</th><th>Total Marks</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {teacherObs.map(o => {
                      const st = observationStatus(o)
                      return (
                        <tr key={o.id}>
                          <td>{formatDate(o.date)}</td>
                          <td>{o.observerName}</td>
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

          <div className="card">
            <div className="card-header"><span className="card-title">Teacher-generated reports</span></div>
            {teacherReports.length === 0 ? (
              <EmptyState icon="file-text" message="No reports generated by this class's teacher(s) yet." />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Period</th><th>Created</th><th>Avg Total Marks</th><th></th></tr></thead>
                  <tbody>
                    {teacherReports.map(r => (
                      <tr key={r.id}>
                        <td>{r.period}</td>
                        <td>{formatDateTime(r.createdAt)}</td>
                        <td>{reportScoreText(r)}</td>
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
