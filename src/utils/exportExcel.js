import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { OBSERVATION_CATEGORIES } from '../data/observationParams'
import { formatDate, formatTime, round1 } from './helpers'

// Exports a Summary sheet (one row per observation) and a Detailed Scores
// sheet (one row per observation x parameter) — flattening the nested
// scores object is far more usable in Excel than one column per parameter.
export function exportObservationsToExcel(observations, filenameSuffix = '') {
  const summaryRows = observations.map(o => ({
    Date: formatDate(o.date),
    Time: formatTime(o.time),
    Teacher: (o.teacherNames || []).join(', '),
    Class: o.classDisplayName || '',
    Observer: o.observerName || '',
    'Duration (mins)': o.durationMins ?? '',
    Status: o.status === 'published' ? (o.fullyScored ? 'Complete' : 'Partial') : 'Draft',
    'Environment Avg': round1(o.categoryAverages?.environment) ?? '',
    'Norms Avg': round1(o.categoryAverages?.norms) ?? '',
    'Children Avg': round1(o.categoryAverages?.children) ?? '',
    "Teacher's Role Avg": round1(o.categoryAverages?.teacherRole) ?? '',
    'Overall Avg': round1(o.overallAverage) ?? '',
    'Positive Points': o.positivePoints || '',
    'Areas To Improve': o.areasToImprove || '',
  }))

  const detailRows = []
  observations.forEach(o => {
    OBSERVATION_CATEGORIES.forEach(cat => {
      cat.params.forEach(p => {
        const entry = o.scores?.[cat.id]?.[p.id]
        if (!entry || (entry.level == null && !entry.remark)) return
        detailRows.push({
          Date: formatDate(o.date),
          Teacher: (o.teacherNames || []).join(', '),
          Class: o.classDisplayName || '',
          Category: cat.label,
          Parameter: p.name,
          Level: entry.level ?? '',
          Remark: entry.remark || '',
        })
      })
    })
  })

  const wb = XLSX.utils.book_new()
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows)
  const wsDetail  = XLSX.utils.json_to_sheet(detailRows)
  wsSummary['!cols'] = [
    { wch: 12 }, { wch: 10 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 14 },
    { wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 16 }, { wch: 12 },
    { wch: 30 }, { wch: 30 },
  ]
  wsDetail['!cols'] = [
    { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 28 }, { wch: 8 }, { wch: 40 },
  ]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')
  XLSX.utils.book_append_sheet(wb, wsDetail, 'Detailed Scores')

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const stamp = formatDate(new Date().toISOString().slice(0, 10), 'yyyy-MM-dd')
  saveAs(new Blob([buf], { type: 'application/octet-stream' }), `observations-export${filenameSuffix}-${stamp}.xlsx`)
}
