import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getAllObservations, getClasses, getAllReports } from '../../firebase/services'
import { exportObservationsToExcel } from '../../utils/exportExcel'
import { exportReportToWord, exportReportsToZip } from '../../utils/exportWord'
import { useToast } from '../../contexts/ToastContext'
import { PageSpinner, EmptyState } from '../../components/UI'
import { formatDate } from '../../utils/helpers'

export default function ExportPage() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [observations, setObservations] = useState([])
  const [reports, setReports] = useState([])
  const [classes, setClasses] = useState([])
  const toast = useToast()

  const [obsClass, setObsClass] = useState('')
  const [obsFrom, setObsFrom] = useState('')
  const [obsTo, setObsTo] = useState('')

  const [repClass, setRepClass] = useState('')
  const [repPeriod, setRepPeriod] = useState('')

  useEffect(() => {
    (async () => {
      const [obs, rep, cls] = await Promise.all([
        getAllObservations(profile?.departmentId), getAllReports(profile?.departmentId), getClasses(profile?.departmentId),
      ])
      setObservations(obs)
      setReports(rep)
      setClasses(cls)
      setLoading(false)
    })()
  }, [])

  const filteredObs = useMemo(() => observations.filter(o => {
    if (obsClass && o.classId !== obsClass) return false
    if (obsFrom && o.date < obsFrom) return false
    if (obsTo && o.date > obsTo) return false
    return true
  }), [observations, obsClass, obsFrom, obsTo])

  const filteredReports = useMemo(() => reports.filter(r => {
    if (repClass && r.classId !== repClass) return false
    if (repPeriod && !r.period?.toLowerCase().includes(repPeriod.toLowerCase())) return false
    return true
  }), [reports, repClass, repPeriod])

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

  return (
    <div>
      <div className="page-header">
        <h1>Export</h1>
        <p>Export observation records to Excel and AI-generated reports to Word.</p>
      </div>

      <div className="form-grid-2" style={{ alignItems: 'flex-start' }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Observations → Excel (.xlsx)</span></div>
          <div className="card-body">
            <div className="fgroup">
              <label>Class</label>
              <select value={obsClass} onChange={(e) => setObsClass(e.target.value)}>
                <option value="">All classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.displayName}</option>)}
              </select>
            </div>
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
              {filteredObs.length} observation(s) will be included — a Summary sheet plus a Detailed Scores sheet.
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
            <div className="fgroup">
              <label>Class</label>
              <select value={repClass} onChange={(e) => setRepClass(e.target.value)}>
                <option value="">All classes</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.displayName}</option>)}
              </select>
            </div>
            <div className="fgroup">
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

      <div className="card no-print" style={{ display: 'none' }} />
    </div>
  )
}
