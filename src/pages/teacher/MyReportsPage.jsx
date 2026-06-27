import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { getReportsByClass } from '../../firebase/services'
import { exportReportToWord } from '../../utils/exportWord'
import { OBSERVATION_CATEGORIES } from '../../data/observationParams'
import { PageSpinner, EmptyState } from '../../components/UI'
import { formatDateTime, round1 } from '../../utils/helpers'

export default function MyReportsPage() {
  const { profile } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [reports, setReports] = useState([])
  const [active, setActive] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        if (!profile?.classId) { setReports([]); return }
        const rep = await getReportsByClass(profile.classId)
        if (!cancelled) setReports(rep)
      } catch (e) {
        if (!cancelled) toast.error('Could not load reports: ' + e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.classId])

  if (loading) return <PageSpinner label="Loading your reports…" />

  return (
    <div>
      <div className="page-header"><h1>My Reports</h1><p>AI-generated reports your admin has shared with your class.</p></div>

      <div className="card">
        {reports.length === 0 ? (
          <EmptyState icon="file-text" message="No reports have been shared with you yet." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Class</th><th>Period</th><th>Shared on</th><th>Overall Avg</th><th></th></tr></thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => setActive(r)}>
                    <td>{r.classDisplayName}</td>
                    <td>{r.period}</td>
                    <td>{formatDateTime(r.sharedAt)}</td>
                    <td>{r.avgScore != null ? `${round1(r.avgScore)} / 3` : '—'}</td>
                    <td>
                      <button className="btn btn-sm btn-export" onClick={(e) => { e.stopPropagation(); exportReportToWord(r) }}>
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

      {active && (
        <div className="report-preview">
          <div className="report-preview-header">
            <span className="school-logo"><img src="/assets/logo/logo.png" alt="logo" /></span>
            <div>
              <h2>{active.classDisplayName}</h2>
              <span>{active.period} · Overall avg {active.avgScore != null ? `${round1(active.avgScore)} / 3` : '—'}</span>
            </div>
          </div>
          <div className="report-body">
            <div className="report-ai-output">
              {OBSERVATION_CATEGORIES.map(cat => (
                active.categorySummaries?.[cat.id] ? (
                  <div key={cat.id}>
                    <h4>{cat.label}</h4>
                    <p>{active.categorySummaries[cat.id]}</p>
                  </div>
                ) : null
              ))}
              <h4>Overall Summary</h4>
              <p>{active.overallSummary}</p>
              <h4>Strengths</h4>
              <ul>{(active.strengths || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
              <h4>Recommendations</h4>
              <ul>{(active.recommendations || []).map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
            <div className="btn-group" style={{ marginTop: 16 }}>
              <button className="btn" onClick={() => setActive(null)}>Close</button>
              <button className="btn btn-export" onClick={() => exportReportToWord(active)}>
                <i className="ti ti-file-type-doc" /> Export Word
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
