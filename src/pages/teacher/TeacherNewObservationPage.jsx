import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import {
  getClasses, addObservation, updateObservation, getObservation,
} from '../../firebase/services'
import {
  TOTAL_MARKS, CURRENT_VERSION, getTemplate, buildBlankScores, buildBlankCategoryRemarks,
  buildBlankCounts, normalizeScores, detectTemplateVersion,
} from '../../data/observationParams'
import ObservationCategories from '../../components/ObservationForm'
import { PageSpinner, Pill } from '../../components/UI'
import { todayISO, nowTime24 } from '../../utils/helpers'

export default function TeacherNewObservationPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { profile } = useAuth()
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [myClass, setMyClass] = useState(null)

  const [observerName, setObserverName] = useState('')
  const [date, setDate]                 = useState(todayISO())
  const [time, setTime]                 = useState(nowTime24())
  const [durationMins, setDurationMins] = useState('')
  const [templateVersion, setTemplateVersion] = useState(CURRENT_VERSION)
  const template = getTemplate(templateVersion)
  const [scores, setScores]             = useState(buildBlankScores())
  const [categoryRemarks, setCategoryRemarks] = useState(buildBlankCategoryRemarks())
  const [counts, setCounts]             = useState(buildBlankCounts())
  const [positivePoints, setPositivePoints] = useState('')
  const [areasToImprove, setAreasToImprove] = useState('')

  useEffect(() => {
    (async () => {
      const classes = await getClasses(profile?.departmentId)
      const mine = classes.find(c => c.id === profile?.classId) || null
      setMyClass(mine)

      if (isEdit) {
        const obs = await getObservation(id)
        if (obs) {
          setObserverName(obs.observerName || '')
          setDate(obs.date || todayISO())
          setTime(obs.time || nowTime24())
          setDurationMins(obs.durationMins != null ? String(obs.durationMins) : '')
          // An existing observation is edited in the template it was created
          // with; only brand-new observations use the current template.
          const ver = detectTemplateVersion(obs)
          const tpl = getTemplate(ver)
          setTemplateVersion(ver)
          setScores(normalizeScores(obs.scores, tpl))
          setCategoryRemarks({ ...buildBlankCategoryRemarks(tpl), ...(obs.categoryRemarks || {}) })
          setCounts({ ...buildBlankCounts(tpl), ...Object.fromEntries(Object.entries(obs.engagementCounts || {}).map(([k, v]) => [k, v == null ? '' : String(v)])) })
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

  const validateHeader = () => {
    if (!myClass) return 'You are not assigned to a class yet. Contact your admin.'
    if (!observerName.trim()) return 'Please enter the observer name.'
    if (!date) return 'Please select a date.'
    const strength = myClass?.strength
    if (strength) {
      const over = Object.values(cleanCounts).some(v => v != null && v > strength)
      if (over) return `Engagement counts cannot be more than the class strength (${strength}).`
    }
    return null
  }

  const cleanCounts = Object.fromEntries(
    Object.entries(counts).map(([k, v]) => [k, v === '' || v == null ? null : Math.max(0, parseInt(v, 10) || 0)]),
  )

  const buildPayload = (status) => ({
    classId: myClass.id,
    classDisplayName: myClass.displayName,
    departmentId: profile?.departmentId,
    teacherIds:   myClass.teacherIds   || [],
    teacherNames: myClass.teacherNames || [],
    observerName: observerName.trim(),
    date, time,
    durationMins: durationMins ? Number(durationMins) : null,
    status, scores,
    templateVersion,
    ...(template.remarkMode === 'category' ? { categoryRemarks } : {}),
    ...(template.categories.some(c => c.kind === 'counts') ? { engagementCounts: cleanCounts, classStrength: myClass?.strength ?? null } : {}),
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
        await addObservation(payload, profile?.id, 'teacher')
        toast.success(status === 'published' ? 'Observation published.' : 'Saved as draft.')
      }
      navigate('/teacher/observations')
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
        <p>
          Record a classroom observation session for your class.
          Scoring: 3 = Good · 2 = Average · 1 = Needs improvement.
          Total marks: <strong>{TOTAL_MARKS}</strong>.
        </p>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Session details</span></div>
        <div className="card-body">
          <div className="form-grid-3">
            <div className="fgroup">
              <label>Class</label>
              <div style={{ paddingTop: 6 }}>
                {myClass ? <Pill label={myClass.displayName} cls="pill-green" /> : <Pill label="No class assigned" cls="pill-gray" />}
              </div>
            </div>
            <div className="fgroup">
              <label>Teacher(s)</label>
              <div style={{ paddingTop: 6 }}>
                {(myClass?.teacherNames || []).length
                  ? myClass.teacherNames.map(n => <Pill key={n} label={n} cls="pill-green" />)
                  : <Pill label="—" cls="pill-gray" />}
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

      <ObservationCategories
        template={template}
        scores={scores} setScores={setScores}
        categoryRemarks={categoryRemarks} setCategoryRemarks={setCategoryRemarks}
        counts={counts} setCounts={setCounts}
        classStrength={myClass?.strength}
      />

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
        <button className="btn" onClick={() => navigate('/teacher/observations')} disabled={saving}>Cancel</button>
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
