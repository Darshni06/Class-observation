import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  getClasses, getAllObservations, getAllReports,
  addReport, shareReportWithTeacher, deleteReport,
} from '../../firebase/services'
import { generateObservationReport } from '../../utils/geminiService'
import { exportReportToWord } from '../../utils/exportWord'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { PageSpinner, EmptyState, Pill } from '../../components/UI'
import ConfirmModal from '../../components/ConfirmModal'
import { formatDate, formatDateTime, round1 } from '../../utils/helpers'

export default function GenerateReportPage() {
  const [searchParams] = useSearchParams()
  const preselectObsId = searchParams.get('obsId')
  const { profile } = useAuth()
  const toast = useToast()

  const [loading, setLoading]     = useState(true)
  const [classes, setClasses]     = useState([])
  const [allObs, setAllObs]       = useState([])
  const [reports, setReports]     = useState([])
  const [classId, setClassId]     = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [period, setPeriod] = useState('')
  const [generating, setGenerating] = useState(false)
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState(null)

  useEffect(() => {
    (async () => {
      const [cls, obs, rep] = await Promise.all([getClasses(), getAllObservations(), getAllReports()])
      setClasses(cls)
      setAllObs(obs)
      setReports(rep)
      if (preselectObsId) {
        const found = obs.find(o => o.id === preselectObsId)
        if (found) {
          setClassId(found.classId)
          setSelectedIds([preselectObsId])
        }
      }
      setLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const classObs = useMemo(() => allObs.filter(o => o.classId === classId), [allObs, classId])
  const selectedClass = useMemo(() => classes.find(c => c.id === classId), [classes, classId])
  const selectedObservations = useMemo(() => classObs.filter(o => selectedIds.includes(o.id)), [classObs, selectedIds])

  const handleClassChange = (newClassId) => {
    setClassId(newClassId)
    setSelectedIds([])
    setDraft(null)
  }

  const toggleSelect = (obsId) => {
    setSelectedIds(prev => prev.includes(obsId) ? prev.filter(i => i !== obsId) : [...prev, obsId])
  }

  const avgScore = useMemo(() => {
    const vals = selectedObservations.map(o => o.overallAverage).filter(v => v != null)
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  }, [selectedObservations])

  const handleGenerate = async () => {
    if (!classId) { toast.error('Select a class first.'); return }
    if (selectedIds.length === 0) { toast.error('Select at least one observation.'); return }
    if (!period.trim()) { toast.error('Enter a label for the reporting period (e.g. "Term 2, 2026").'); return }

    setGenerating(true)
    setDraft(null)
    try {
      const result = await generateObservationReport({
        classDisplayName: selectedClass?.displayName || '',
        teacherNames: selectedClass?.teacherNames || [],
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
        title: `${selectedClass?.displayName} — ${period.trim()}`,
        classId,
        classDisplayName: selectedClass?.displayName || '',
        teacherIds: selectedClass?.teacherIds || [],
        teacherNames: selectedClass?.teacherNames || [],
        period: period.trim(),
        observationIds: selectedIds,
        overallSummary: draft.overallSummary,
        strengths: draft.strengths,
        recommendations: draft.recommendations,
        avgScore,
        status: 'generated',
      }
      const id = await addReport(reportData, profile?.id)
      toast.success('Report saved.')
      setReports(prev => [{ id, ...reportData, sharedWithTeacher: false, createdAt: { seconds: Date.now() / 1000 } }, ...prev])
      setDraft(null)
      setSelectedIds([])
      setPeriod('')
    } catch (e) {
      toast.error('Could not save report: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleShare = async (report) => {
    try {
      await shareReportWithTeacher(report.id)
      toast.success(`Report shared with ${(report.teacherNames || []).join(', ') || 'the class'}.`)
      setReports(prev => prev.map(r => r.id === report.id ? { ...r, sharedWithTeacher: true } : r))
    } catch (e) {
      toast.error('Could not share: ' + e.message)
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

  return (
    <div>
      <div className="page-header">
        <h1>Generate Report</h1>
        <p>Select a class and its observations — the AI will draft a structured summary you can review, save, and share with that class's teacher(s).</p>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">1. Choose observations</span></div>
        <div className="card-body">
          <div className="form-grid-2">
            <div className="fgroup">
              <label>Class</label>
              <select value={classId} onChange={(e) => handleClassChange(e.target.value)}>
                <option value="">Select class…</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.displayName}</option>)}
              </select>
            </div>
            <div className="fgroup">
              <label>Reporting period label</label>
              <input type="text" value={period} onChange={(e) => setPeriod(e.target.value)} placeholder='e.g. "Term 2, 2026"' />
            </div>
          </div>

          {classId && (
            <div style={{ marginBottom: 10 }}>
              {(selectedClass?.teacherNames || []).length
                ? selectedClass.teacherNames.map(n => <Pill key={n} label={n} cls="pill-green" />)
                : <Pill label="No teacher assigned to this class" cls="pill-gray" />}
            </div>
          )}

          {classId && (
            classObs.length === 0 ? (
              <EmptyState icon="clipboard-list" message="No observations recorded for this class yet." />
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
            )
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
              <h2>{selectedClass?.displayName}</h2>
              <span>{period} · {selectedObservations.length} observation(s) · Overall avg {avgScore != null ? `${round1(avgScore)} / 3` : '—'}</span>
            </div>
          </div>
          <div className="report-body">
            <div className="report-ai-output">
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
        <div className="card-header"><span className="card-title">Generated reports</span></div>
        {reports.length === 0 ? (
          <EmptyState icon="file-text" message="No reports generated yet." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Class</th><th>Teacher(s)</th><th>Period</th><th>Created</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id}>
                    <td>{r.classDisplayName}</td>
                    <td>{(r.teacherNames || []).join(', ') || '—'}</td>
                    <td>{r.period}</td>
                    <td>{formatDateTime(r.createdAt)}</td>
                    <td><Pill label={r.sharedWithTeacher ? 'Shared' : 'Generated'} cls={r.sharedWithTeacher ? 'pill-green' : 'pill-gray'} /></td>
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-sm btn-export" onClick={() => exportReportToWord(r)}>
                          <i className="ti ti-file-type-doc" /> Word
                        </button>
                        {!r.sharedWithTeacher && (
                          <button className="btn btn-sm btn-primary" onClick={() => handleShare(r)}>
                            <i className="ti ti-share" /> Share
                          </button>
                        )}
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
          message={`This will permanently delete the report for ${toDelete.classDisplayName}.`}
          onCancel={() => setToDelete(null)}
          onConfirm={handleDeleteReport}
        />
      )}
    </div>
  )
}
