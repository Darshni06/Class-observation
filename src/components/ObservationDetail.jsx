import { templateOf, isCounts, embeddedCounts, countKey, timeKey, setNumbers, round1 } from '../data/observationParams'
import { LevelBadge } from './UI'
import { formatTime } from '../utils/helpers'

// Read-only view of one observation, rendered in the template it was
// recorded with (so old observations look exactly as they always did).
export default function ObservationDetail({ obs }) {
  const template = templateOf(obs)

  const renderCounts = (cat) => {
    const counts = obs.engagementCounts || {}
          const sets = setNumbers(cat).map(n => ({
            n, time: counts[timeKey(n)],
            filled: cat.fields.filter(f => counts[countKey(f.id, n)] != null && counts[countKey(f.id, n)] !== ''),
          })).filter(x => x.filled.length)
          if (!sets.length) return null
    return (
      <div className="obs-counts-block" key={cat.id}>
              <div className="feedback-section-title"><i className={`ti ti-${cat.icon || 'bulb'}`} /> {cat.label}</div>
              {sets.map(x => (
                <div key={x.n}>
                  {(sets.length > 1 || x.time) && (
                    <div className="obs-counts-timechip">Recording {x.n}{x.time ? ` · ${formatTime(x.time)}` : ''}</div>
                  )}
                  {x.filled.map(f => (
                    <div className="obs-count-chip" key={f.id}>
                      <b>{counts[countKey(f.id, x.n)]}</b>
                      <span>{f.label}</span>
                    </div>
                  ))}
                </div>
              ))}
              {obs.classStrength ? <div className="obs-counts-hint">Out of {obs.classStrength} children.</div> : null}
      </div>
    )
  }

  return (
    <>
      {template.categories.map(cat => {
        if (isCounts(cat) && cat.embedIn) return null
        const rows = cat.params
          .map(p => ({ p, entry: obs.scores?.[cat.id]?.[p.id] }))
          .filter(({ entry }) => entry && (entry.level != null || entry.remark))
        const catRemark = obs.categoryRemarks?.[cat.id]
        const embedded = embeddedCounts(template, cat.id)
        const embeddedNode = embedded ? renderCounts(embedded) : null
        if (rows.length === 0 && !catRemark && !embeddedNode) return null
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
            {embeddedNode}
            {catRemark && <div className="summary-box" style={{ marginTop: 8 }}>{catRemark}</div>}
          </div>
        )
      })}
    </>
  )
}
