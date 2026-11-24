import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { getPublishedObservationsByClass } from '../../firebase/services'
import { categoriesInObservations, avgCategoryMarks, TOTAL_MARKS } from '../../data/observationParams'
import { PageSpinner, EmptyState } from '../../components/UI'
import { formatDate, round1 } from '../../utils/helpers'

export default function MyProgressPage() {
  const { profile } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [observations, setObservations] = useState([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        if (!profile?.classId) { setObservations([]); return }
        const obs = await getPublishedObservationsByClass(profile.classId, profile.departmentId)
        if (!cancelled) setObservations(obs)
      } catch (e) {
        if (!cancelled) toast.error('Could not load progress: ' + e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.classId])

  // Average marks per category across all published observations
  const categoryAvgMarks = useMemo(() => {
    const out = {}
    categoriesInObservations(observations).forEach(cat => { out[cat.id] = avgCategoryMarks(observations, cat.id) })
    return out
  }, [observations])

  const shownCategories = useMemo(() => categoriesInObservations(observations), [observations])

  const avgTotalMarks = useMemo(() => {
    const vals = observations.map(o => o.totalMarks).filter(v => v != null)
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  }, [observations])

  if (loading) return <PageSpinner label="Loading your progress…" />

  if (!profile?.classId) {
    return (
      <div>
        <div className="page-header"><h1>My Progress</h1></div>
        <div className="card"><EmptyState icon="chart-bar" message="You are not assigned to a class yet. Contact your admin." /></div>
      </div>
    )
  }

  if (observations.length === 0) {
    return (
      <div>
        <div className="page-header"><h1>My Progress</h1><p>Track your class's marks over time.</p></div>
        <div className="card"><EmptyState icon="chart-bar" message="No published observations yet — progress will appear here." /></div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header"><h1>My Progress</h1><p>Marks by category across all published observations for your class (out of {TOTAL_MARKS} total marks).</p></div>

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
                  <span style={{ fontSize: 11 }}>
                    {cat.label}
                    <span style={{ color: 'var(--gray-400)', marginLeft: 6, fontSize: 10 }}>
                      (max {cat.maxMarks} marks)
                    </span>
                  </span>
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
              Overall average total marks: {round1(avgTotalMarks)} / {TOTAL_MARKS}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Session-by-session score history</span></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                {shownCategories.map(cat => (
                  <th key={cat.id} style={{ fontSize: 10, whiteSpace: 'normal', minWidth: 70 }}>
                    {cat.label.split(' ')[0]}<br />
                    <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>/ {cat.maxMarks}</span>
                  </th>
                ))}
                <th>Total<br /><span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>/ {TOTAL_MARKS}</span></th>
              </tr>
            </thead>
            <tbody>
              {observations.map(o => (
                <tr key={o.id}>
                  <td>{formatDate(o.date)}</td>
                  {shownCategories.map(cat => (
                    <td key={cat.id}>
                      {o.categoryMarks?.[cat.id] != null ? round1(o.categoryMarks[cat.id]) : '—'}
                    </td>
                  ))}
                  <td><strong>{o.totalMarks != null ? round1(o.totalMarks) : '—'}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
