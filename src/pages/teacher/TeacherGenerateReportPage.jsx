import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  getClasses, getObservationsByClass, getReportsByClass,
  addReport, deleteReport,
} from '../../firebase/services'
import { generateObservationReport } from '../../utils/geminiService'
import { exportReportToWord } from '../../utils/exportWord'
import { OBSERVATION_CATEGORIES } from '../../data/observationParams'
import { useToast } from '../../contexts/ToastContext'
import { PageSpinner, EmptyState, Pill } from '../../components/UI'
import ConfirmModal from '../../components/ConfirmModal'
import { formatDate, formatDateTime, round1 } from '../../utils/helpers'

// Same as the admin's Generate Report page, but scoped to the teacher's own
// class (no class picker) and with no "Share" button — a teacher's own
// report is visible to them immediately, and admin always sees everything.
export default function TeacherGenerateReportPage() {
  const [searchParams] = useSearchParams()
  const preselectObsId = searchParams.get('obsId')
  const { profile } = useAuth()
  const toast = useToast()

  const [loading, setLoading]     = useState(true)
  const [myClass, setMyClass]     = useState(null)
  const [classObs, setClassObs]   = useState([])
  const [reports, setReports]     = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [period, setPeriod] = useState('')
  const [generating, setGenerating] = useState(false)
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState(null)

  useEffect(() => {
    (async () => {
      if (!profile?.classId) { setLoading(false); return }
      const [classes, obs, rep] = await Promise.all([
        getClasses(), getObservationsByClass(profile.classId), getReportsByClass(profile.classId),
      ])
      setMyClass(classes.find(c => c.id === profile.classId) || null)
      setClassObs(obs)
      setReports(rep)
      if (preselectObsId && obs.some(o => o.id === preselectObsId)) {
        setSelectedIds([preselectObsId])
      }
      setLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.classId])

  const toggleSelect = (obsId) => {
    setSelectedIds(prev => prev.includes(obsId) ? prev.filter(i => i !== obsId) : [...prev, obsId])
  }

  const selectedObservations = useMemo(() => classObs.filter(o => selectedIds.includes(o.id)), [classObs, selectedIds])

  const avgScore = useMemo(() => {
    const vals = selectedObservations.map(o => o.overallAverage).filter(v => v != null)
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  }, [selectedObservations])

  const handleGenerate = async () => {
    if (selectedIds.length === 0) { toast.error('Select at least one observation.'); return }
    if (!period.trim()) { toast.error('Enter a label for the reporting period (e.g. "Term 2, 2026").'); return }

    setGenerating(true)
    setDraft(null)
    try {
      const result = await generateObservationReport({
        classDisplayName: myClass?.displayName || '',
        teacherNames: myClass?.teacherNames || [],
        period: period.trim(),
        observations: selectedObservations,
      })
      setDraft(result)
      toast.success('Report generated. Review it below before saving.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveReport = async () => {
    setSaving(true)
    try {
      const reportData = {
        title: `${myClass?.displayName} — ${period.trim()}`,
        classId: myClass.id,
        classDisplayName: myClass.displayName,
        teacherIds: myClass.teacherIds || [],
        teacherNames: myClass.teacherNames || [],
        period: period.trim(),
        observationIds: selectedIds,
        categorySummaries: draft.categorySummaries,
        overallSummary: draft.overallSummary,
        strengths: draft.strengths,
        recommendations: draft.recommendations,
        avgScore,
        status: 'generated',
      }
      const id = await addReport(reportData, profile?.id, 'teacher')
      toast.success('Report saved.')
      setReports(prev => [{ id, ...reportData, sharedWithTeacher: true, createdByRole: 'teacher', createdAt: { seconds: Date.now() / 1000 } }, ...prev])
      setDraft(null)
      setSelectedIds([])
      setPeriod('')
    } catch (e) {
      toast.error('Could not save report: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteReport = async () => {
    try {
      await deleteReport(toDelete.id)
      toast.success('Report deleted.')
      setReports(prev => prev.filter(r => r.id !== toDelete.id))
      setToDelete(null)
    } catch (e) {
      toast.error('Could not delete: ' + e.message)
    }
  }

  if (loading) return <PageSpinner label="Loading…" />

  if (!profile?.classId || !myClass) {
    return (
      <div>
        <div className="page-header"><h1>Generate Report</h1></div>
        <div className="card"><EmptyState icon="sparkles" message="You are not assigned to a class yet. Contact your admin." /></div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>Generate Report</h1>
        <p>Select observations from your class — the AI will draft a structured summary you can review, save, and export.</p>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">1. Choose observations</span></div>
        <div className="card-body">
          <div className="fgroup" style={{ marginBottom: 14 }}>
            <label>Reporting period label</label>
            <input type="text" value={period} onChange={(e) => setPeriod(e.target.value)} placeholder='e.g. "Term 2, 2026"' />
          </div>

          {classObs.length === 0 ? (
            <EmptyState icon="clipboard-list" message="No observations recorded for your class yet." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th></th><th>Date</th><th>Observer</th><th>Overall Avg</th></tr>
                </thead>
                <tbody>
                  {classObs.map(o => (
                    <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => toggleSelect(o.id)}>
                      <td><input type="checkbox" checked={selectedIds.includes(o.id)} onChange={() => toggleSelect(o.id)} /></td>
                      <td>{formatDate(o.date)}</td>
                      <td>{o.observerName}</td>
                      <td>{o.overallAverage != null ? `${round1(o.overallAverage)} / 3` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="btn-group" style={{ marginTop: 14 }}>
            <button className="btn btn-ai" onClick={handleGenerate} disabled={generating}>
              <i className="ti ti-sparkles" /> {generating ? 'Generating…' : 'Generate with AI'}
            </button>
          </div>
        </div>
      </div>

      {generating && (
        <div className="card"><div className="ai-generating">
          <div className="dot-flash"><span /><span /><span /></div>
          The AI is reading the observation scores and remarks…
        </div></div>
      )}

      {draft && !generating && (
        <div className="report-preview">
          <div className="report-preview-header">
            <span className="school-logo"><img src="/assets/logo/logo.png" alt="logo" /></span>
            <div>
              <h2>{myClass.displayName}</h2>
              <span>{period} · {selectedObservations.length} observation(s) · Overall avg {avgScore != null ? `${round1(avgScore)} / 3` : '—'}</span>
            </div>
          </div>
          <div className="report-body">
            <div className="report-ai-output">
              {OBSERVATION_CATEGORIES.map(cat => (
                draft.categorySummaries?.[cat.id] ? (
                  <div key={cat.id}>
                    <h4>{cat.label}</h4>
                    <p>{draft.categorySummaries[cat.id]}</p>
                  </div>
                ) : null
              ))}
              <h4>Overall Summary</h4>
              <p>{draft.overallSummary}</p>
              <h4>Strengths</h4>
              <ul>{draft.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
              <h4>Recommendations</h4>
              <ul>{draft.recommendations.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
            <div className="btn-group" style={{ marginTop: 16 }}>
              <button className="btn" onClick={() => setDraft(null)}>Discard</button>
              <button className="btn btn-primary" onClick={handleSaveReport} disabled={saving}>
                <i className="ti ti-device-floppy" /> {saving ? 'Saving…' : 'Save Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header"><span className="card-title">Reports for your class</span></div>
        {reports.length === 0 ? (
          <EmptyState icon="file-text" message="No reports yet." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Period</th><th>Created</th><th>By</th><th></th></tr></thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id}>
                    <td>{r.period}</td>
                    <td>{formatDateTime(r.createdAt)}</td>
                    <td><Pill label={r.createdByRole === 'teacher' ? 'You' : 'Admin'} cls={r.createdByRole === 'teacher' ? 'pill-green' : 'pill-purple'} /></td>
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-sm btn-export" onClick={() => exportReportToWord(r)}>
                          <i className="ti ti-file-type-doc" /> Word
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => setToDelete(r)}>
                          <i className="ti ti-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toDelete && (
        <ConfirmModal
          title="Delete report?"
          message={toDelete.createdByRole === 'admin'
            ? 'This report was generated by your admin. Deleting it removes it for everyone — are you sure?'
            : 'This will permanently delete this report.'}
          onCancel={() => setToDelete(null)}
          onConfirm={handleDeleteReport}
        />
      )}
    </div>
  )
}
