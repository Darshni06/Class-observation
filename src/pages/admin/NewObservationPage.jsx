import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import {
  getClasses, addObservation, updateObservation, getObservation,
} from '../../firebase/services'
import { OBSERVATION_CATEGORIES, buildBlankScores } from '../../data/observationParams'
import { PageSpinner, Pill } from '../../components/UI'
import { todayISO, nowTime24 } from '../../utils/helpers'

export default function NewObservationPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { profile } = useAuth()
  const toast = useToast()

  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [classes, setClasses]   = useState([])

  const [classId, setClassId]       = useState('')
  const [observerName, setObserverName] = useState('')
  const [date, setDate]             = useState(todayISO())
  const [time, setTime]             = useState(nowTime24())
  const [durationMins, setDurationMins] = useState('')
  const [scores, setScores]         = useState(buildBlankScores())
  const [positivePoints, setPositivePoints] = useState('')
  const [areasToImprove, setAreasToImprove] = useState('')

  useEffect(() => {
    (async () => {
      const cls = await getClasses(profile?.departmentId)
      setClasses(cls)

      if (isEdit) {
        const obs = await getObservation(id)
        if (obs) {
          setClassId(obs.classId || '')
          setObserverName(obs.observerName || '')
          setDate(obs.date || todayISO())
          setTime(obs.time || nowTime24())
          setDurationMins(obs.durationMins != null ? String(obs.durationMins) : '')
          setScores(obs.scores || buildBlankScores())
          setPositivePoints(obs.positivePoints || '')
          setAreasToImprove(obs.areasToImprove || '')
        }
      } else {
        setObserverName(profile?.name || '')
      }
      setLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const setLevel = (catId, paramId, level) => {
    setScores(prev => ({
      ...prev,
      [catId]: { ...prev[catId], [paramId]: { ...prev[catId][paramId], level } },
    }))
  }
  const setRemark = (catId, paramId, remark) => {
    setScores(prev => ({
      ...prev,
      [catId]: { ...prev[catId], [paramId]: { ...prev[catId][paramId], remark } },
    }))
  }

  const selectedClass = useMemo(() => classes.find(c => c.id === classId), [classes, classId])

  const validateHeader = () => {
    if (!classId) return 'Please select a class.'
    if (!observerName.trim()) return 'Please enter the observer name.'
    if (!date) return 'Please select a date.'
    return null
  }

  const buildPayload = (status) => ({
    classId,
    classDisplayName: selectedClass?.displayName || '',
    departmentId: profile?.departmentId,
    teacherIds: selectedClass?.teacherIds || [],
    teacherNames: selectedClass?.teacherNames || [],
    observerName: observerName.trim(),
    date,
    time,
    durationMins: durationMins ? Number(durationMins) : null,
    status,
    scores,
    positivePoints: positivePoints.trim(),
    areasToImprove: areasToImprove.trim(),
  })

  const handleSave = async (status) => {
    const err = validateHeader()
    if (err) { toast.error(err); return }
    setSaving(true)
    try {
      const payload = buildPayload(status)
      if (isEdit) {
        await updateObservation(id, payload)
        toast.success(status === 'published' ? 'Observation published.' : 'Draft updated.')
      } else {
        await addObservation(payload, profile?.id, 'admin')
        toast.success(status === 'published' ? 'Observation published.' : 'Saved as draft.')
      }
      navigate('/admin/observations')
    } catch (e) {
      toast.error('Could not save: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageSpinner label="Loading form…" />

  return (
    <div>
      <div className="page-header">
        <h1>{isEdit ? 'Edit Observation' : 'New Observation'}</h1>
        <p>Record a classroom observation session. Level scale: 3 = Good · 2 = Average · 1 = Needs improvement.</p>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Session details</span></div>
        <div className="card-body">
          <div className="form-grid-3">
            <div className="fgroup">
              <label>Class</label>
              <select value={classId} onChange={(e) => setClassId(e.target.value)}>
                <option value="">Select class…</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.displayName}</option>)}
              </select>
            </div>
            <div className="fgroup">
              <label>Teacher(s)</label>
              <div style={{ paddingTop: 6 }}>
                {selectedClass?.teacherNames?.length
                  ? selectedClass.teacherNames.map(n => <Pill key={n} label={n} cls="pill-green" />)
                  : <Pill label="No teacher assigned yet" cls="pill-gray" />}
              </div>
            </div>
            <div className="fgroup">
              <label>Observer</label>
              <input type="text" value={observerName} onChange={(e) => setObserverName(e.target.value)} placeholder="Observer's name" />
            </div>
          </div>
          <div className="form-grid-3">
            <div className="fgroup">
              <label>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="fgroup">
              <label>Time</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div className="fgroup">
              <label>Duration (mins)</label>
              <input type="number" min="0" value={durationMins} onChange={(e) => setDurationMins(e.target.value)} placeholder="e.g. 45" />
            </div>
          </div>
        </div>
      </div>

      {OBSERVATION_CATEGORIES.map(cat => (
        <div className="card" key={cat.id}>
          <div className="card-body">
            <div className="obs-section-label">
              <i className={`ti ti-${cat.icon}`} />
              {cat.label}
              <span className="scored-tag">{cat.scored ? 'Included in averages' : 'Administrative record'}</span>
            </div>
            <div className="col-header">
              <span>Parameter</span><span>Description</span><span>Level</span><span>Remarks</span>
            </div>
            {cat.params.map(p => (
              <div className="obs-param-row" key={p.id}>
                <div className="obs-param-name">{p.name}</div>
                <div className="obs-param-desc">{p.description}</div>
                <div className="obs-level-col">
                  <select
                    className="obs-level-select"
                    value={scores[cat.id]?.[p.id]?.level ?? ''}
                    onChange={(e) => setLevel(cat.id, p.id, e.target.value === '' ? null : Number(e.target.value))}
                  >
                    <option value="">—</option>
                    <option value="3">3</option>
                    <option value="2">2</option>
                    <option value="1">1</option>
                  </select>
                </div>
                <textarea
                  className="obs-remark-textarea"
                  placeholder="Write your remark here…"
                  value={scores[cat.id]?.[p.id]?.remark ?? ''}
                  onChange={(e) => setRemark(cat.id, p.id, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="card">
        <div className="card-header"><span className="card-title">Summary</span></div>
        <div className="card-body">
          <div className="form-grid-2">
            <div className="fgroup">
              <label>Positive points to retain</label>
              <textarea rows={4} value={positivePoints} onChange={(e) => setPositivePoints(e.target.value)} placeholder="What should always be retained in this class?" />
            </div>
            <div className="fgroup">
              <label>Areas to improve</label>
              <textarea rows={4} value={areasToImprove} onChange={(e) => setAreasToImprove(e.target.value)} placeholder="What needs attention going forward?" />
            </div>
          </div>
        </div>
      </div>

      <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
        <button className="btn" onClick={() => navigate('/admin/observations')} disabled={saving}>Cancel</button>
        <button className="btn" onClick={() => handleSave('draft')} disabled={saving}>
          <i className="ti ti-file-pencil" /> Save as Draft
        </button>
        <button className="btn btn-primary" onClick={() => handleSave('published')} disabled={saving}>
          <i className="ti ti-send" /> {saving ? 'Saving…' : 'Save & Publish'}
        </button>
      </div>
    </div>
  )
}
