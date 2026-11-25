import { templateOf, isCounts, round1 } from '../data/observationParams'
import { LevelBadge } from './UI'

// Read-only view of one observation, rendered in the template it was
// recorded with (so old observations look exactly as they always did).
export default function ObservationDetail({ obs }) {
  const template = templateOf(obs)

  return (
    <>
      {template.categories.map(cat => {
        if (isCounts(cat)) {
          const counts = obs.engagementCounts || {}
          const filled = cat.fields.filter(f => counts[f.id] != null && counts[f.id] !== '')
          if (!filled.length) return null
          return (
            <div className="feedback-section" key={cat.id}>
              <div className="feedback-section-title"><i className={`ti ti-${cat.icon || 'bulb'}`} /> {cat.label}</div>
              <div>
                {filled.map(f => (
                  <div className="obs-count-chip" key={f.id}>
                    <b>{counts[f.id]}</b>
                    <span>{f.label}</span>
                  </div>
                ))}
              </div>
              {obs.classStrength ? <div className="obs-counts-hint">Out of {obs.classStrength} children.</div> : null}
            </div>
          )
        }

        const rows = cat.params
          .map(p => ({ p, entry: obs.scores?.[cat.id]?.[p.id] }))
          .filter(({ entry }) => entry && (entry.level != null || entry.remark))
        const catRemark = obs.categoryRemarks?.[cat.id]
        if (rows.length === 0 && !catRemark) return null
        const marks = obs.categoryMarks?.[cat.id]

        return (
          <div className="feedback-section" key={cat.id}>
            <div className="feedback-section-title">
              <i className={`ti ti-${cat.icon}`} /> {cat.label}
              {marks != null && cat.maxMarks ? (
                <span style={{ marginLeft: 'auto', fontWeight: 600, textTransform: 'none' }}>
                  {round1(marks)} / {cat.maxMarks}
                </span>
              ) : null}
            </div>
            {rows.map(({ p, entry }) => (
              <div className="feedback-row" key={p.id}>
                <LevelBadge level={entry.level} />
                <div style={{ flex: 1 }}>
                  <div className="feedback-param">{p.name}</div>
                  {entry.remark && <div className="feedback-remark">{entry.remark}</div>}
                </div>
              </div>
            ))}
            {catRemark && <div className="summary-box" style={{ marginTop: 8 }}>{catRemark}</div>}
          </div>
        )
      })}
    </>
  )
}
