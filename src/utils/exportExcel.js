import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { templateOf, isCounts, TOTAL_MARKS, round2 } from '../data/observationParams'
import { formatDate, formatTime } from './helpers'

// ─────────────────────────────────────────────────────────────────────────
// Exports each observation as one worksheet, laid out like the school's
// updated observation template. Columns:
//   A: Category | B: Parameter | C: Description | D: Scale | E: Level | F: Marks | G: Remarks
//
// Below the parameter rows: summary table of marks per category and total
// marks out of 60.
// ─────────────────────────────────────────────────────────────────────────

const safeSheetName = (name, usedNames) => {
  let base = (name || 'Observation').replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 26)
  let candidate = base
  let i = 2
  while (usedNames.has(candidate)) {
    candidate = `${base.slice(0, 26 - String(i).length - 1)} ${i}`
    i++
  }
  usedNames.add(candidate)
  return candidate
}

function buildSheetAOA(obs) {
  const rows = []
  const template = templateOf(obs)       // each observation uses its own template
  const perCategory = template.remarkMode === 'category'
  const pctOf = (cat) => (cat.maxMarks && template.totalMarks ? `${Math.round((cat.maxMarks / template.totalMarks) * 100)}%` : '')

  rows.push(['KAMALA NIKETAN', '', 'Class Observation Report', '', '', '', ''])
  rows.push(['Class:', obs.classDisplayName || '', '', 'Observer:', obs.observerName || '', '', ''])
  rows.push(['Teacher(s):', (obs.teacherNames || []).join(', '), '', 'Date:', formatDate(obs.date), 'Time:', formatTime(obs.time)])
  rows.push([])
  rows.push(['Category', 'Parameter', 'Description', 'Scale', 'Level', 'Marks', 'Remarks'])

  template.categories.forEach(cat => {
    if (isCounts(cat)) {
      const counts = obs.engagementCounts || {}
      let first = true
      cat.fields.forEach(f => {
        rows.push([first ? cat.label : '', f.label, 'Number of children', '', counts[f.id] ?? '', '', ''])
        first = false
      })
      if (obs.classStrength) rows.push(['', 'Class strength', '', '', obs.classStrength, '', ''])
      rows.push([])
      return
    }

    const catMarks = obs.categoryMarks?.[cat.id]
    const catAvg   = obs.categoryAverages?.[cat.id]
    let firstParam = true

    cat.params.forEach(p => {
      const entry = obs.scores?.[cat.id]?.[p.id]
      rows.push([
        firstParam ? cat.label : '',
        p.name,
        p.description || '',
        p.scale || '',
        p.scorable !== false ? (entry?.level ?? '') : '(narrative only)',
        '',
        perCategory ? '' : (entry?.remark || ''),
      ])
      firstParam = false
    })

    if (perCategory) {
      rows.push(['', `Remarks — ${cat.label}`, '', '', '', '', obs.categoryRemarks?.[cat.id] || ''])
    }

    if (cat.maxMarks) {
      rows.push([
        '', `▸ ${cat.label} subtotal`,
        `${pctOf(cat) ? `Weight: ${pctOf(cat)}   ` : ''}Max marks: ${cat.maxMarks}`,
        catAvg != null ? `Avg level: ${round2(catAvg)} / 3` : 'Not scored',
        '',
        catMarks != null ? `${round2(catMarks)} / ${cat.maxMarks}` : '—',
        '',
      ])
    }
    rows.push([])
  })

  const scored = template.categories.filter(c => !isCounts(c) && c.maxMarks)
  if (scored.length) {
    rows.push([])
    rows.push(['MARKS SUMMARY', '', '', '', '', '', ''])
    rows.push(['Category', 'Weight', 'Max Marks', 'Avg Level (1-3)', 'Marks Earned', '', ''])
    scored.forEach(cat => {
      const catMarks = obs.categoryMarks?.[cat.id]
      const catAvg   = obs.categoryAverages?.[cat.id]
      rows.push([cat.label, pctOf(cat), cat.maxMarks,
        catAvg != null ? round2(catAvg) : '—', catMarks != null ? round2(catMarks) : '—', '', ''])
    })
    rows.push([])
    rows.push(['TOTAL MARKS', '', template.totalMarks || TOTAL_MARKS, '',
      obs.totalMarks != null ? round2(obs.totalMarks) : '—', '', ''])
  }

  rows.push([])
  rows.push(['Positive points to retain always in the class', '', obs.positivePoints || '', '', '', '', ''])
  rows.push(['Areas to improve', '', obs.areasToImprove || '', '', '', '', ''])
  return rows
}

export function exportObservationsToExcel(observations, filenameSuffix = '') {
  const wb = XLSX.utils.book_new()
  const usedNames = new Set()

  observations.forEach(obs => {
    const aoa = buildSheetAOA(obs)
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    ws['!cols'] = [
      { wch: 30 }, // A: Category
      { wch: 30 }, // B: Parameter
      { wch: 45 }, // C: Description
      { wch: 45 }, // D: Scale
      { wch: 8  }, // E: Level
      { wch: 14 }, // F: Marks
      { wch: 40 }, // G: Remarks
    ]
    const sheetName = safeSheetName(
      `${formatDate(obs.date, 'ddMMM')}-${obs.classDisplayName}`,
      usedNames,
    )
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
  })

  if (observations.length === 0) {
    const ws = XLSX.utils.aoa_to_sheet([['No observations matched the selected filters.']])
    XLSX.utils.book_append_sheet(wb, ws, 'Empty')
  }

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const stamp = formatDate(new Date().toISOString().slice(0, 10), 'yyyy-MM-dd')
  saveAs(
    new Blob([buf], { type: 'application/octet-stream' }),
    `observations-export${filenameSuffix}-${stamp}.xlsx`,
  )
}
