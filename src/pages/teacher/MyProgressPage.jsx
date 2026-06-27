import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { getPublishedObservationsByClass } from '../../firebase/services'
import { OBSERVATION_CATEGORIES } from '../../data/observationParams'
import { PageSpinner, EmptyState, ProgressBarRow } from '../../components/UI'
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
        const obs = await getPublishedObservationsByClass(profile.classId)
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

  const scoredCats = OBSERVATION_CATEGORIES.filter(c => c.scored)

  const categoryAverages = useMemo(() => {
    const out = {}
    scoredCats.forEach(cat => {
      const vals = observations.map(o => o.categoryAverages?.[cat.id]).filter(v => v != null)
      out[cat.id] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
    })
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [observations])

  if (loading) return <PageSpinner label="Loading your progress…" />

  if (observations.length === 0) {
    return (
      <div>
        <div className="page-header"><h1>My Progress</h1><p>Track your class's average scores over time.</p></div>
        <div className="card"><EmptyState icon="chart-bar" message="No published observations yet — progress will appear here." /></div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header"><h1>My Progress</h1><p>Average scores by category across all published observations for your class.</p></div>

      <div className="card">
        <div className="card-header"><span className="card-title">Average score by category</span></div>
        <div className="card-body">
          {scoredCats.map(cat => (
            <ProgressBarRow key={cat.id} label={cat.label} value={categoryAverages[cat.id] != null ? round1(categoryAverages[cat.id]) : null} />
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Score history</span></div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                {scoredCats.map(cat => <th key={cat.id}>{cat.label}</th>)}
                <th>Overall</th>
              </tr>
            </thead>
            <tbody>
              {observations.map(o => (
                <tr key={o.id}>
                  <td>{formatDate(o.date)}</td>
                  {scoredCats.map(cat => (
                    <td key={cat.id}>{o.categoryAverages?.[cat.id] != null ? round1(o.categoryAverages[cat.id]) : '—'}</td>
                  ))}
                  <td><strong>{o.overallAverage != null ? round1(o.overallAverage) : '—'}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
