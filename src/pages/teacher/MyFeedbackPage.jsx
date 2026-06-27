import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { getPublishedObservationsByClass } from '../../firebase/services'
import { OBSERVATION_CATEGORIES } from '../../data/observationParams'
import { PageSpinner, EmptyState, LevelBadge } from '../../components/UI'
import { formatDate, formatTime, round1 } from '../../utils/helpers'

export default function MyFeedbackPage() {
  const { profile } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [observations, setObservations] = useState([])
  const [activeId, setActiveId] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        if (!profile?.classId) { setObservations([]); return }
        const obs = await getPublishedObservationsByClass(profile.classId)
        if (cancelled) return
        setObservations(obs)
        if (obs.length) setActiveId(obs[0].id)
      } catch (e) {
        if (!cancelled) toast.error('Could not load feedback: ' + e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.classId])

  if (loading) return <PageSpinner label="Loading your feedback…" />

  if (!profile?.classId) {
    return (
      <div>
        <div className="page-header"><h1>My Feedback</h1><p>Published classroom observations for your class.</p></div>
        <div className="card"><EmptyState icon="message-2" message="You are not assigned to a class yet. Contact your admin." /></div>
      </div>
    )
  }

  if (observations.length === 0) {
    return (
      <div>
        <div className="page-header"><h1>My Feedback</h1><p>Published classroom observations for your class.</p></div>
        <div className="card"><EmptyState icon="message-2" message="No feedback has been published for your class yet." /></div>
      </div>
    )
  }

  const active = observations.find(o => o.id === activeId) || observations[0]

  return (
    <div>
      <div className="page-header"><h1>My Feedback</h1><p>Published classroom observations for your class — review each session below.</p></div>

      <div className="tabs">
        {observations.map(o => (
          <button key={o.id} className={`tab ${o.id === active.id ? 'active' : ''}`} onClick={() => setActiveId(o.id)}>
            {formatDate(o.date)}
          </button>
        ))}
      </div>

      <div className="feedback-card">
        <div className="feedback-header">
          <div className="feedback-header-left">
            <h3>{formatDate(active.date)} · {formatTime(active.time)}</h3>
            <span>Observed by {active.observerName} · {active.classDisplayName}</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--green-800)' }}>
            Overall: {active.overallAverage != null ? `${round1(active.overallAverage)} / 3` : '—'}
          </span>
        </div>

        {OBSERVATION_CATEGORIES.map(cat => {
          const rows = cat.params
            .map(p => ({ p, entry: active.scores?.[cat.id]?.[p.id] }))
            .filter(({ entry }) => entry && (entry.level != null || entry.remark))
          if (rows.length === 0) return null
          return (
            <div className="feedback-section" key={cat.id}>
              <div className="feedback-section-title"><i className={`ti ti-${cat.icon}`} /> {cat.label}</div>
              {rows.map(({ p, entry }) => (
                <div className="feedback-row" key={p.id}>
                  <LevelBadge level={entry.level} />
                  <div style={{ flex: 1 }}>
                    <div className="feedback-param">{p.name}</div>
                    {entry.remark && <div className="feedback-remark">{entry.remark}</div>}
                  </div>
                </div>
              ))}
            </div>
          )
        })}

        {(active.positivePoints || active.areasToImprove) && (
          <div className="feedback-section">
            <div className="form-grid-2">
              {active.positivePoints && (
                <div>
                  <div className="feedback-section-title"><i className="ti ti-thumb-up" /> Positive points to retain</div>
                  <div className="summary-box summary-positive">{active.positivePoints}</div>
                </div>
              )}
              {active.areasToImprove && (
                <div>
                  <div className="feedback-section-title"><i className="ti ti-trending-up" /> Areas to improve</div>
                  <div className="summary-box summary-improve">{active.areasToImprove}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
