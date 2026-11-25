// ─────────────────────────────────────────────────────────────────────────
// Observation template registry.
//
// CURRENT template = v3 (this file). Older templates (v0, v1, v2) live frozen
// in ./legacyTemplates.js. Every observation document carries (or is detected
// to carry) a template version, and is always displayed, edited, scored and
// exported under ITS OWN template — so changing the form never changes old data.
//
// v3 — 60 marks, 4 scored categories + 1 counts-only category:
//   Prepared Environment                         15
//   Classroom Management & Teamwork / Norms      15
//   Child-Centered Observations & Planning       10
//   Engagement & Concentration (children counts)  — (not scored)
//   Communication                                10
//   Montessori Practice & Delivery               10
//
// Scoring: level 3/2/1 per parameter; category marks = (avg level / 3) × max.
// Remarks in v3 are entered ONCE PER CATEGORY (categoryRemarks).
// ─────────────────────────────────────────────────────────────────────────
import { V0_CATEGORIES, V1_CATEGORIES, V2_CATEGORIES } from './legacyTemplates'

export const LEVEL_OPTIONS = [3, 2, 1]
export const LEVEL_LABELS = { 3: 'Good', 2: 'Average', 1: 'Needs improvement' }

const find = (cats, catId, paramId) =>
  cats.find(c => c.id === catId).params.find(p => p.id === paramId)

const keep = (catId, ids) => ids.map(id => find(V2_CATEGORIES, catId, id))
const v2cat = (id) => V2_CATEGORIES.find(c => c.id === id)

// ── v3 categories (built from the unchanged v2 parameters + the requested edits)
const V3_CATEGORIES = [
  // 1. Prepared Environment — unchanged
  { ...v2cat('environment'), params: V2_CATEGORIES[0].params },

  // 2. Classroom Management — Transitions + Movement merged; Strategies removed
  {
    ...v2cat('classroom'),
    params: [
      ...keep('classroom', ['cls_ground_adults', 'cls_ground_children', 'cls_reinforcing']),
      {
        id: 'cls_transitions_movement',
        name: 'Transitions, Movement in the Environment',
        description: "Children transition between activities calmly, independently, and purposefully. Children move carefully, carry materials correctly, and respect others' workspaces.",
        scale: '3 – Smooth, independent transitions and consistently appropriate movement / 2 – Minor reminders needed for transitions or movement / 1 – Frequent adult intervention or inappropriate movement',
        scorable: true,
      },
      ...keep('classroom', ['cls_grace', 'cls_conflict', 'cls_snack', 'cls_care', 'cls_noise']),
    ],
  },

  // 3. Child-Centered — Independence + Choice merged; Purposeful Movement,
  //    Engagement & Concentration and Academic Readiness removed
  {
    ...v2cat('childCentered'),
    params: [
      ...keep('childCentered', ['cc_social']),
      {
        id: 'cc_independence_choice',
        name: 'Independence & Choice of Activities',
        description: 'Chooses work independently based on interest and developmental readiness rather than adult suggestions, cares for self and environment, completes activities with perseverance, and seeks help appropriately.',
        scale: '3 – Highly independent, activities mostly self-selected / 2 – Occasional support needed, balanced between self-choice and adult suggestion / 1 – Frequent adult dependency, mostly adult-directed',
        scorable: true,
      },
      ...keep('childCentered', ['cc_support', 'cc_challenge', 'cc_obs_planning', 'cc_notable']),
    ],
  },

  // 4. Engagement & Concentration — admin types children COUNTS (not scored)
  {
    id: 'engagement',
    label: 'Engagement & Concentration',
    icon: 'bulb',
    kind: 'counts',
    scored: false,
    maxMarks: 0,
    weightPercent: 0,
    description: 'Enter the number of children observed for each behaviour, with the time of each recording.',
    sets: 2,
    fields: [
      { id: 'sustained_interest', label: 'Children showing sustained interest' },
      { id: 'repeats_work',       label: 'Children repeating work voluntarily' },
      { id: 'focused',            label: 'Children remaining focused with minimal distractions' },
      { id: 'busy_work',          label: 'Children doing busy work' },
    ],
    params: [],
  },

  // 5. Communication — unchanged
  { ...v2cat('communication'), params: V2_CATEGORIES.find(c => c.id === 'communication').params },

  // 6. Montessori — Intervention + Approach merged
  {
    ...v2cat('montessori'),
    params: [
      ...keep('montessori', ['mp_observation', 'mp_presentations']),
      {
        id: 'mp_intervention_approach',
        name: 'Intervention & Approach to Children',
        description: 'Adult intervenes only when required (safety, misuse of material, disturbance) using appropriate Montessori guidance, and interacts respectfully and patiently, encouraging independence while maintaining positive relationships.',
        scale: '3 – Appropriate, timely intervention; consistently respectful and encouraging / 2 – Occasional unnecessary or delayed intervention; approach sometimes appropriate / 1 – Frequent unnecessary intervention; approach needs improvement',
        scorable: true,
      },
      ...keep('montessori', ['mp_collaboration', 'mp_daily_plan', 'mp_knowledge', 'mp_implementation', 'mp_records', 'mp_followup']),
    ],
  },
]

// ── Template registry ─────────────────────────────────────────────────────
export const TEMPLATES = {
  v0: { version: 'v0', totalMarks: null, remarkMode: 'param',    categories: V0_CATEGORIES },
  v1: { version: 'v1', totalMarks: 60,   remarkMode: 'param',    categories: V1_CATEGORIES },
  v2: { version: 'v2', totalMarks: 60,   remarkMode: 'param',    categories: V2_CATEGORIES },
  v3: { version: 'v3', totalMarks: 60,   remarkMode: 'category', categories: V3_CATEGORIES },
}
export const CURRENT_VERSION  = 'v3'
export const CURRENT_TEMPLATE = TEMPLATES[CURRENT_VERSION]
export const TOTAL_MARKS = 60
export const OBSERVATION_CATEGORIES = CURRENT_TEMPLATE.categories

export const getTemplate = (version) => TEMPLATES[version] || CURRENT_TEMPLATE

// Which template does a saved observation belong to?
export const detectTemplateVersion = (doc) => {
  if (doc?.templateVersion && TEMPLATES[doc.templateVersion]) return doc.templateVersion
  const s = doc?.scores
  if (!s || typeof s !== 'object') return CURRENT_VERSION
  if (s.norms || s.teacherRole || s.children) return 'v0'
  if (s.profDevelopment || s.classPerformance) return 'v1'
  if (s.environment || s.classroom) return 'v2'
  return CURRENT_VERSION
}
export const templateOf = (doc) => getTemplate(detectTemplateVersion(doc))

// ── Lookups ───────────────────────────────────────────────────────────────
export const getCategory = (id, template = CURRENT_TEMPLATE) => template.categories.find(c => c.id === id)
export const getParam = (catId, paramId, template = CURRENT_TEMPLATE) =>
  getCategory(catId, template)?.params.find(p => p.id === paramId)

export const isCounts = (cat) => cat.kind === 'counts'
export const scorableParams = (cat) => (cat.params || []).filter(p => p.scorable !== false)

// ── Blank values ──────────────────────────────────────────────────────────
export const buildBlankScores = (template = CURRENT_TEMPLATE) => {
  const scores = {}
  template.categories.forEach(cat => {
    if (isCounts(cat)) return
    scores[cat.id] = {}
    cat.params.forEach(p => { scores[cat.id][p.id] = { level: null, remark: '' } })
  })
  return scores
}
export const buildBlankCategoryRemarks = (template = CURRENT_TEMPLATE) => {
  const r = {}
  template.categories.forEach(cat => { if (!isCounts(cat)) r[cat.id] = '' })
  return r
}
// Engagement counts are recorded in `sets` (default 1) — each set has its own
// time. Set 1 keeps the original keys (so earlier v3 data is unchanged);
// set 2 uses a `_2` suffix. Time keys: `_time`, `_time_2`.
export const countKey = (fieldId, set = 1) => (set === 1 ? fieldId : `${fieldId}_${set}`)
export const timeKey  = (set = 1) => (set === 1 ? '_time' : `_time_${set}`)
export const isTimeKey = (k) => k.startsWith('_time')
export const setNumbers = (cat) => Array.from({ length: cat.sets || 1 }, (_, i) => i + 1)

export const buildBlankCounts = (template = CURRENT_TEMPLATE) => {
  const out = {}
  template.categories.filter(isCounts).forEach(cat => {
    setNumbers(cat).forEach(n => {
      out[timeKey(n)] = ''
      cat.fields.forEach(f => { out[countKey(f.id, n)] = '' })
    })
  })
  return out
}

// Merge stored scores into a blank structure of the given template, so
// every expected key exists (older docs may lack some keys).
export const normalizeScores = (scores, template = CURRENT_TEMPLATE) => {
  const blank = buildBlankScores(template)
  template.categories.forEach(cat => {
    if (isCounts(cat)) return
    cat.params.forEach(p => {
      const e = scores?.[cat.id]?.[p.id]
      if (e) blank[cat.id][p.id] = { level: e.level ?? null, remark: e.remark || '' }
    })
  })
  return blank
}

// ── Scoring ───────────────────────────────────────────────────────────────
//   category marks = (avgLevel / 3) × maxMarks   |   total = Σ category marks
export const computeAverages = (scores, template = CURRENT_TEMPLATE) => {
  const categoryAverages = {}
  const categoryMarks = {}
  let totalMarks = 0
  let anyMarks = false

  template.categories.forEach(cat => {
    if (isCounts(cat) || cat.scored === false) return
    const levels = scorableParams(cat)
      .map(p => scores?.[cat.id]?.[p.id]?.level)
      .filter(l => l === 1 || l === 2 || l === 3)
    if (levels.length === 0) {
      categoryAverages[cat.id] = null
      categoryMarks[cat.id] = null
    } else {
      const avg = levels.reduce((a, b) => a + b, 0) / levels.length
      categoryAverages[cat.id] = avg
      if (cat.maxMarks) {
        const marks = (avg / 3) * cat.maxMarks
        categoryMarks[cat.id] = marks
        totalMarks += marks
        anyMarks = true
      } else {
        categoryMarks[cat.id] = null
      }
    }
  })

  const valid = Object.values(categoryAverages).filter(v => v != null)
  const overallAverage = valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null
  return { categoryAverages, categoryMarks, totalMarks: anyMarks ? totalMarks : null, overallAverage }
}

export const isFullyScored = (scores, template = CURRENT_TEMPLATE) =>
  template.categories
    .filter(c => !isCounts(c) && c.scored !== false)
    .every(cat => scorableParams(cat).every(p => {
      const l = scores?.[cat.id]?.[p.id]?.level
      return l === 1 || l === 2 || l === 3
    }))

// ── Cross-version helpers (reports, analysis) ─────────────────────────────
// Global category order and labels, so a report always keeps every section
// it was generated with, even after the template changes.
const ORDER = []
const LABELS = {}
const LATEST_MAX = {}
;[V0_CATEGORIES, V1_CATEGORIES, V2_CATEGORIES, V3_CATEGORIES].forEach(cats => {
  cats.forEach(c => { if (!ORDER.includes(c.id)) ORDER.push(c.id); LABELS[c.id] = c.label; LATEST_MAX[c.id] = c.maxMarks || null })
})
// v3 order wins for the shared ids
const V3_IDS = V3_CATEGORIES.map(c => c.id)
const GLOBAL_ORDER = [...V3_IDS, ...ORDER.filter(id => !V3_IDS.includes(id))]
export const categoryLabelFor = (id, labels) => labels?.[id] || LABELS[id] || id

export const getReportSections = (report) => {
  const sums = report?.categorySummaries || {}
  const labels = report?.categoryLabels || {}
  return GLOBAL_ORDER
    .filter(id => sums[id] && String(sums[id]).trim())
    .map(id => ({ id, label: categoryLabelFor(id, labels), text: sums[id] }))
    .concat(Object.keys(sums)
      .filter(id => !GLOBAL_ORDER.includes(id) && String(sums[id] || '').trim())
      .map(id => ({ id, label: categoryLabelFor(id, labels), text: sums[id] })))
}

// Distinct list of categories (id, label, maxMarks) that appear in the given
// observations — used by analysis pages so old and new data both show.
export const categoriesInObservations = (observations, { includeCounts = false } = {}) => {
  const seen = new Map()
  ;(observations || []).forEach(o => {
    templateOf(o).categories.forEach(c => {
      if (isCounts(c) ? !includeCounts : c.scored === false) return
      if (!seen.has(c.id)) seen.set(c.id, { id: c.id, label: LABELS[c.id] || c.label, maxMarks: LATEST_MAX[c.id] || null })
    })
  })
  return GLOBAL_ORDER.filter(id => seen.has(id)).map(id => seen.get(id))
}

export const round1 = (n) => (n == null ? null : Math.round(n * 10) / 10)
export const round2 = (n) => (n == null ? null : Math.round(n * 100) / 100)

// Score text for a saved report. New reports store avgTotalMarks (out of 60);
// older reports only have avgScore (1–3 scale) and keep showing that.
export const reportScoreText = (r) => {
  if (r?.avgTotalMarks != null) return `${round1(r.avgTotalMarks)} / ${TOTAL_MARKS}`
  if (r?.avgScore != null) return `${round1(r.avgScore)} / 3 avg level`
  return '—'
}

// Average marks for one category across observations that may use different
// template versions. Each observation is measured against ITS OWN maximum and
// the average is expressed on the latest maximum, so nothing is recomputed.
export const avgCategoryMarks = (observations, catId) => {
  const pcts = []
  ;(observations || []).forEach(o => {
    const cat = getCategory(catId, templateOf(o))
    const m = o.categoryMarks?.[catId]
    if (m != null && cat?.maxMarks) pcts.push(m / cat.maxMarks)
  })
  const max = LATEST_MAX[catId]
  if (!pcts.length || !max) return null
  return (pcts.reduce((a, b) => a + b, 0) / pcts.length) * max
}
