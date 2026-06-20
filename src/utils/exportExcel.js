import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { formatDate, formatTime } from './helpers'

// ─────────────────────────────────────────────────────────────────────────
// This mirrors the school's original "Class observation template.xlsx"
// row-for-row: same Section / Parameter / Scale wording, same grouping and
// blank separator rows. Each exported observation becomes one worksheet
// laid out exactly like that template, with Level + Remarks filled in from
// the actual recorded data.
// ─────────────────────────────────────────────────────────────────────────

// type: 'data' row → { section, parameter, scale, categoryId, paramId }
// type: 'blank' → spacer row (as in the original)
// type: 'summary' → positive points / areas to improve, value pulled from
//                   the observation directly rather than scores[][]
const TEMPLATE_ROWS = [
  { type: 'data', section: 'Environment', parameter: 'Prepared Environment', scale: 'Are materials ready for the child?\nAny dependency on adults?\nPencils/Papers/EPL readiness?\nFilling Grains or water\nMats/Oil cloths arrangement', categoryId: 'environment', paramId: 'env_prepared' },
  { type: 'data', section: '', parameter: 'Snack and Lunch Corner', scale: 'Snack corner norms followed? using towel, spoon, 4 children at a time etc.,\nWere Children brought healthy food?\nSpilled food after eating?', categoryId: 'environment', paramId: 'env_snack' },
  { type: 'data', section: '', parameter: 'Noise level', scale: '3 - Purposeful\n2 - moderate noise level - purposeful\n1 - high noise level - unpurposeful', categoryId: 'environment', paramId: 'env_noise' },
  { type: 'data', section: '', parameter: 'Montessori Materials', scale: '3 - Neat and tidy\n2 - Used properly\n1 - Any incomplete or damaged materials', categoryId: 'environment', paramId: 'env_materials' },
  { type: 'blank' },
  { type: 'data', section: 'Norms', parameter: 'Ground Rules', scale: 'Adults followed?\n3- Most of the time followed\n2 - Sometimes followed\n1- Rarely followed', categoryId: 'norms', paramId: 'norms_ground_adults' },
  { type: 'data', section: '', parameter: '', scale: 'Children followed?\n3- Most of the time followed\n2 - Sometimes followed\n1- Rarely followed', categoryId: 'norms', paramId: 'norms_ground_children' },
  { type: 'data', section: '', parameter: '', scale: 'Whether adults reiterating norms to children\n3- Most of the time followed\n2 - Sometimes followed\n1- Rarely followed', categoryId: 'norms', paramId: 'norms_reiterate' },
  { type: 'data', section: '', parameter: 'Strategies in following norms', scale: '', categoryId: 'norms', paramId: 'norms_strategies' },
  { type: 'blank' },
  { type: 'data', section: 'Children', parameter: 'Social and emotional behaviour', scale: 'Settling of children\nAble to express their feelings, needs\nHow they interact with others during snack time or lunch time?\nHelping peers/adults\nRespectful, Compassionate\nAdult approaching children and vice-versa', categoryId: 'children', paramId: 'child_social' },
  { type: 'data', section: '', parameter: 'Independent', scale: 'Able to choose activities, take care of themselves, perseverance in their activities', categoryId: 'children', paramId: 'child_independence' },
  { type: 'data', section: '', parameter: 'How the children move in the environments?', scale: 'Purposeful movement', categoryId: 'children', paramId: 'child_movement' },
  { type: 'data', section: '', parameter: 'How the children choosing the activities?', scale: 'Mostly suggested or their choice', categoryId: 'children', paramId: 'child_choosing' },
  { type: 'data', section: '', parameter: 'Involved / Concentrated', scale: 'Interest of the child\nLess / No distraction\nRepetition\nOffering challenging activities', categoryId: 'children', paramId: 'child_concentration' },
  { type: 'data', section: '', parameter: 'Older children', scale: 'Identification and tracing sounds correctly?\nAre they writing?\nVerbalize what they are reading?', categoryId: 'children', paramId: 'child_older' },
  { type: 'data', section: '', parameter: 'Children needs support', scale: 'Remedial Plan', categoryId: 'children', paramId: 'child_support' },
  { type: 'data', section: '', parameter: 'Check level of the child', scale: 'Whether they work with challenging activities?', categoryId: 'children', paramId: 'child_levelcheck' },
  { type: 'data', section: '', parameter: 'Notable moment', scale: "Any exploratory activities? or touching moment by a child?\nAny learning from child's behaviour?\nSudden changes or interests in child's learning", categoryId: 'children', paramId: 'child_notable' },
  { type: 'blank' },
  { type: 'data', section: 'Teachers role', parameter: 'Observation during walk', scale: 'Able to write notes?\nWhen to intervene and when not to? - How and when intervene?', categoryId: 'teacherRole', paramId: 'tr_walk' },
  { type: 'data', section: '', parameter: 'Giving presentations - how they are giving', scale: 'Clear/doubtful presentation\nPresentations within the timeperiod', categoryId: 'teacherRole', paramId: 'tr_presentations' },
  { type: 'data', section: '', parameter: 'Approach to children and adults', scale: 'How it is done?', categoryId: 'teacherRole', paramId: 'tr_approach' },
  { type: 'data', section: '', parameter: 'Roleplays done?', scale: 'Planned for any scenarios in the environment?', categoryId: 'teacherRole', paramId: 'tr_roleplay' },
  { type: 'data', section: '', parameter: 'Communication', scale: 'Communicating with English with children, Tamil during Tamil activities\nEncouraging children to ask questions/respond in English', categoryId: 'teacherRole', paramId: 'tr_communication' },
  { type: 'data', section: '', parameter: 'Planning for the day', scale: 'Aware of lesson plan and presentations\nUnderstanding between the adults - in observing and giving presentations\nImplementing the schedule or planned activities\nUnderstanding level of all the children by both the adults', categoryId: 'teacherRole', paramId: 'tr_planning' },
  { type: 'blank' },
  { type: 'header', section: 'Writing / Workbook', parameter: 'Usage of Note book writing' },
  { type: 'data', section: '', parameter: 'English', scale: '', categoryId: 'writingWorkbook', paramId: 'ww_english' },
  { type: 'data', section: '', parameter: 'Tamil', scale: '', categoryId: 'writingWorkbook', paramId: 'ww_tamil' },
  { type: 'data', section: '', parameter: 'Maths', scale: '', categoryId: 'writingWorkbook', paramId: 'ww_maths' },
  { type: 'data', section: '', parameter: 'Culture', scale: '', categoryId: 'writingWorkbook', paramId: 'ww_culture' },
  { type: 'blank' },
  { type: 'data', section: "Teacher's record", parameter: 'Weekly planner', scale: '', categoryId: 'teachersRecord', paramId: 'rec_weekly' },
  { type: 'data', section: '', parameter: 'Daily observation', scale: '', categoryId: 'teachersRecord', paramId: 'rec_daily' },
  { type: 'header', section: '', parameter: 'Digital document - Checklist' },
  { type: 'data', section: '', parameter: 'Prekg', scale: '', categoryId: 'teachersRecord', paramId: 'rec_digital_prekg' },
  { type: 'data', section: '', parameter: 'Lkg', scale: '', categoryId: 'teachersRecord', paramId: 'rec_digital_lkg' },
  { type: 'data', section: '', parameter: 'Ukg', scale: '', categoryId: 'teachersRecord', paramId: 'rec_digital_ukg' },
  { type: 'blank' },
  { type: 'summary', parameter: 'Postive points to retain always in the class', field: 'positivePoints' },
  { type: 'summary', parameter: 'To improve', field: 'areasToImprove' },
]

const safeSheetName = (name, usedNames) => {
  let base = name.replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 28) || 'Observation'
  let candidate = base
  let i = 2
  while (usedNames.has(candidate)) {
    candidate = `${base.slice(0, 28 - String(i).length - 1)} ${i}`
    i++
  }
  usedNames.add(candidate)
  return candidate
}

function buildSheetAOA(obs) {
  const rows = []
  rows.push(['Parameters for Observation', '', 'Name of the Observer :', obs.observerName || ''])
  rows.push([`Physical Environment : ${obs.classDisplayName || ''}`, '', "Teacher's Name :", (obs.teacherNames || []).join(', ')])
  rows.push(['', '', 'Date of observation :', formatDate(obs.date), 'Time :', formatTime(obs.time)])
  rows.push(['Sections', 'Parameter', 'Scale', 'Level', 'Remarks'])

  TEMPLATE_ROWS.forEach((r) => {
    if (r.type === 'blank') {
      rows.push(['', '', '', '', ''])
      return
    }
    if (r.type === 'header') {
      rows.push([r.section || '', r.parameter, '', '', ''])
      return
    }
    const entry = obs.scores?.[r.categoryId]?.[r.paramId]
    rows.push([
      r.section || '',
      r.parameter || '',
      (r.scale || '').replace(/\n/g, ' / '),
      entry?.level ?? '',
      entry?.remark || '',
    ])
  })

  // Append the two summary rows' actual text into the Remarks column
  const ppRowIdx = rows.findIndex(row => row[1] === 'Postive points to retain always in the class')
  if (ppRowIdx !== -1) rows[ppRowIdx][4] = obs.positivePoints || ''
  const improveRowIdx = rows.findIndex(row => row[1] === 'To improve')
  if (improveRowIdx !== -1) rows[improveRowIdx][4] = obs.areasToImprove || ''

  return rows
}

export function exportObservationsToExcel(observations, filenameSuffix = '') {
  const wb = XLSX.utils.book_new()
  const usedNames = new Set()

  observations.forEach(obs => {
    const aoa = buildSheetAOA(obs)
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    ws['!cols'] = [{ wch: 20 }, { wch: 30 }, { wch: 45 }, { wch: 8 }, { wch: 40 }]
    const sheetName = safeSheetName(`${formatDate(obs.date, 'ddMMM')}-${obs.classDisplayName}`, usedNames)
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
  })

  if (observations.length === 0) {
    const ws = XLSX.utils.aoa_to_sheet([['No observations matched the selected filters.']])
    XLSX.utils.book_append_sheet(wb, ws, 'Empty')
  }

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const stamp = formatDate(new Date().toISOString().slice(0, 10), 'yyyy-MM-dd')
  saveAs(new Blob([buf], { type: 'application/octet-stream' }), `observations-export${filenameSuffix}-${stamp}.xlsx`)
}
