import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getObservationsByClass, getReportsByClass } from '../../firebase/services'
import { exportObservationsToExcel } from '../../utils/exportExcel'
import { exportReportToWord, exportReportsToZip } from '../../utils/exportWord'
import { useToast } from '../../contexts/ToastContext'
import { PageSpinner, EmptyState } from '../../components/UI'

// Same as the admin's Export page, scoped to the teacher's own class.
export default function TeacherExportPage() {
  const { profile } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [observations, setObservations] = useState([])
  const [reports, setReports] = useState([])

  const [obsFrom, setObsFrom] = useState('')
  const [obsTo, setObsTo] = useState('')
  const [repPeriod, setRepPeriod] = useState('')

  useEffect(() => {
    (async () => {
      if (!profile?.classId) { setLoading(false); return }
      const [obs, rep] = await Promise.all([
        getObservationsByClass(profile.classId, profile.departmentId), getReportsByClass(profile.classId, profile.departmentId),
      ])
      setObservations(obs)
      setReports(rep)
      setLoading(false)
    })()
  }, [profile?.classId])

  const filteredObs = useMemo(() => observations.filter(o => {
    if (obsFrom && o.date < obsFrom) return false
    if (obsTo && o.date > obsTo) return false
    return true
  }), [observations, obsFrom, obsTo])

  const filteredReports = useMemo(() => reports.filter(r => {
    if (repPeriod && !r.period?.toLowerCase().includes(repPeriod.toLowerCase())) return false
    return true
  }), [reports, repPeriod])

  const handleExportExcel = () => {
    if (filteredObs.length === 0) { toast.error('No observations match these filters.'); return }
    exportObservationsToExcel(filteredObs)
    toast.success(`Exported ${filteredObs.length} observation(s) to Excel.`)
  }

  const handleExportWord = async () => {
    if (filteredReports.length === 0) { toast.error('No reports match these filters.'); return }
    try {
      if (filteredReports.length === 1) {
        await exportReportToWord(filteredReports[0])
      } else {
        await exportReportsToZip(filteredReports)
      }
      toast.success(`Exported ${filteredReports.length} report(s) to Word.`)
    } catch (e) {
      toast.error('Export failed: ' + e.message)
    }
  }

  const handlePrintObservations = () => window.print()

  if (loading) return <PageSpinner label="Loading export data…" />

  if (!profile?.classId) {
    return (
      <div>
        <div className="page-header"><h1>Export</h1></div>
        <div className="card"><EmptyState icon="file-export" message="You are not assigned to a class yet. Contact your admin." /></div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>Export</h1>
        <p>Export your class's observation records to Excel and reports to Word.</p>
      </div>

      <div className="form-grid-2" style={{ alignItems: 'flex-start' }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Observations → Excel (.xlsx)</span></div>
          <div className="card-body">
            <div className="form-grid-2">
              <div className="fgroup">
                <label>From date</label>
                <input type="date" value={obsFrom} onChange={(e) => setObsFrom(e.target.value)} />
              </div>
              <div className="fgroup">
                <label>To date</label>
                <input type="date" value={obsTo} onChange={(e) => setObsTo(e.target.value)} />
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--gray-600)', marginBottom: 14 }}>
              {filteredObs.length} observation(s) will be included, one worksheet each, formatted like the school's
              original observation template.
            </p>
            <div className="btn-group">
              <button className="btn btn-export" onClick={handleExportExcel}>
                <i className="ti ti-file-spreadsheet" /> Export Excel
              </button>
              <button className="btn no-print" onClick={handlePrintObservations} title="Use your browser's print dialog to save as PDF">
                <i className="ti ti-printer" /> Print / Save as PDF
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Reports → Word (.docx)</span></div>
          <div className="card-body">
            <div className="fgroup" style={{ marginBottom: 14 }}>
              <label>Period contains</label>
              <input type="text" value={repPeriod} onChange={(e) => setRepPeriod(e.target.value)} placeholder='e.g. "Term 2"' />
            </div>
            {filteredReports.length === 0 ? (
              <EmptyState icon="file-text" message="No reports match these filters." />
            ) : (
              <p style={{ fontSize: 12, color: 'var(--gray-600)', margin: '10px 0 14px' }}>
                {filteredReports.length} report(s) will be exported{filteredReports.length > 1 ? ' as a .zip of Word documents' : ' as a single Word document'}.
              </p>
            )}
            <div className="btn-group">
              <button className="btn btn-export" onClick={handleExportWord} disabled={filteredReports.length === 0}>
                <i className="ti ti-file-type-doc" /> Export Word
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
