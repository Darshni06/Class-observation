import { isCounts, countKey, timeKey, setNumbers, embeddedCounts } from '../data/observationParams'

// Parses "3 – X / 2 – Y / 1 – Z" into [{num, text}, ...]
function parsedScale(scale) {
  if (!scale) return []
  return scale.split(' / ').map(s => s.trim()).map(part => ({
    num: part.match(/^(\d)/)?.[1] || null,
    text: part,
  }))
}

export function ScaleCriteria({ scale }) {
  if (!scale) return (
    <div style={{ fontSize: 10, color: 'var(--gray-400)', fontStyle: 'italic', marginTop: 4 }}>
      Narrative only — no level required.
    </div>
  )
  const colorClass = { '3': 'obs-scale-line-3', '2': 'obs-scale-line-2', '1': 'obs-scale-line-1' }
  return (
    <div className="obs-scale-criteria">
      {parsedScale(scale).map((part, i) => (
        <div key={i} className={`obs-scale-line ${colorClass[part.num] || ''}`}>{part.text}</div>
      ))}
    </div>
  )
}

// Renders every category card of the given template. Works for the current
// template (one remarks box per category) and for older templates being
// edited (remarks per parameter) so legacy observations stay editable as-is.
export default function ObservationCategories({
  template, scores, setScores, categoryRemarks, setCategoryRemarks,
  counts, setCounts, classStrength,
}) {
  const perCategory = template.remarkMode === 'category'

  const setLevel = (catId, paramId, level) =>
    setScores(prev => ({ ...prev, [catId]: { ...prev[catId], [paramId]: { ...prev[catId][paramId], level } } }))
  const setRemark = (catId, paramId, remark) =>
    setScores(prev => ({ ...prev, [catId]: { ...prev[catId], [paramId]: { ...prev[catId][paramId], remark } } }))

  const renderCounts = (cat) => (
    <div className="obs-counts-block" key={cat.id}>
                <div className="obs-section-label">
                  <i className={`ti ti-${cat.icon || 'bulb'}`} />
                  {cat.label}
                  <span className="scored-tag">Counts — not scored</span>
                </div>
                <p className="obs-counts-hint" style={{ marginTop: 0 }}>
                  {cat.description}{classStrength ? ` Class strength: ${classStrength}.` : ''}
                </p>
                {setNumbers(cat).map(n => (
                  <div key={n} style={{ marginTop: 14 }}>
                    <div className="obs-count-settime">
                      <strong>Recording {n}</strong>
                      <label htmlFor={`cnt-time-${n}`}>Time</label>
                      <input
                        id={`cnt-time-${n}`} type="time"
                        value={counts?.[timeKey(n)] ?? ''}
                        onChange={(e) => setCounts(prev => ({ ...prev, [timeKey(n)]: e.target.value }))}
                      />
                    </div>
                    <div className="obs-counts-grid">
                      {cat.fields.map(f => (
                        <div className="obs-count-field" key={f.id}>
                          <label htmlFor={`cnt-${f.id}-${n}`}>{f.label}</label>
                          <input
                            id={`cnt-${f.id}-${n}`} type="number" min="0" inputMode="numeric"
                            max={classStrength || undefined}
                            value={counts?.[countKey(f.id, n)] ?? ''}
                            onChange={(e) => setCounts(prev => ({ ...prev, [countKey(f.id, n)]: e.target.value }))}
                            placeholder="0"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
    </div>
  )

  return (
    <>
      {template.version !== 'v3' && (
        <div className="obs-legacy-note">
          This observation was recorded with an earlier version of the form, so it is shown and edited in that same format. Its marks are not affected by the newer form.
        </div>
      )}

      {template.categories.map(cat => {
        if (isCounts(cat) && cat.embedIn) return null
        const rowCls = perCategory ? 'cat-remark-mode' : ''
        return (
          <div className="card" key={cat.id}>
            <div className="card-body">
              <div className="obs-section-label">
                <i className={`ti ti-${cat.icon}`} />
                {cat.label}
                {cat.maxMarks ? <span className="obs-section-marks">{cat.maxMarks} marks</span> : null}
                {cat.scored !== false && <span className="scored-tag">Included in averages</span>}
              </div>

              <div className={`col-header ${rowCls}`}>
                <span>Parameter</span>
                <span>Description</span>
                <span>Level &amp; Criteria</span>
                {!perCategory && <span>Remarks</span>}
              </div>

              {cat.params.map(p => (
                <div className={`obs-param-row ${rowCls}`} key={p.id}>
                  <div className="obs-param-name">{p.name}</div>
                  <div className="obs-param-desc">{p.description}</div>
                  <div className="obs-level-col">
                    {p.scorable !== false ? (
                      <>
                        <select
                          className="obs-level-select"
                          value={scores[cat.id]?.[p.id]?.level ?? ''}
                          onChange={(e) => setLevel(cat.id, p.id, e.target.value === '' ? null : Number(e.target.value))}
                        >
                          <option value="">— select —</option>
                          <option value="3">3</option>
                          <option value="2">2</option>
                          <option value="1">1</option>
                        </select>
                        <ScaleCriteria scale={p.scale} />
                      </>
                    ) : (
                      <ScaleCriteria scale={null} />
                    )}
                  </div>
                  {!perCategory && (
                    <textarea
                      className="obs-remark-textarea"
                      placeholder="Write your remark here…"
                      value={scores[cat.id]?.[p.id]?.remark ?? ''}
                      onChange={(e) => setRemark(cat.id, p.id, e.target.value)}
                    />
                  )}
                </div>
              ))}

              {embeddedCounts(template, cat.id) && renderCounts(embeddedCounts(template, cat.id))}

              {perCategory && (
                <div className="obs-cat-remarks">
                  <label htmlFor={`rem-${cat.id}`}>Remarks — {cat.label}</label>
                  <textarea
                    id={`rem-${cat.id}`}
                    className="obs-remark-textarea"
                    placeholder="Overall remarks for this category…"
                    value={categoryRemarks?.[cat.id] ?? ''}
                    onChange={(e) => setCategoryRemarks(prev => ({ ...prev, [cat.id]: e.target.value }))}
                  />
                </div>
              )}
            </div>
          </div>
        )
      })}
    </>
  )
}
