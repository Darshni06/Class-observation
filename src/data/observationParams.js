// ─────────────────────────────────────────────────────────────────────────
// Observation parameter taxonomy
// Source: "Class observation template - Sample.xlsx" provided by the school.
// Every section / parameter from that sheet is represented here. Categories
// marked `scored: true` are averaged into the dashboard / progress charts;
// the other two (Writing-Workbook, Teacher's record) are administrative
// checklists that are still captured (level + remark) but kept out of the
// classroom-quality averages since they measure something different.
//
// Levels are uniform across the whole form: 3 = Good, 2 = Average,
// 1 = Needs improvement, and a parameter can also be left unscored (null)
// if it doesn't apply to a particular session.
// ─────────────────────────────────────────────────────────────────────────

export const LEVEL_OPTIONS = [3, 2, 1]

export const LEVEL_LABELS = {
  3: 'Good',
  2: 'Average',
  1: 'Needs improvement',
}

export const OBSERVATION_CATEGORIES = [
  {
    id: 'environment',
    label: 'Environment',
    icon: 'ti-leaf',
    scored: true,
    params: [
      {
        id: 'env_prepared',
        name: 'Prepared environment',
        description: 'Are materials ready for the child? Any dependency on adults? Pencils/papers/EPL readiness? Filling grains or water. Mats/oil cloths arrangement.',
      },
      {
        id: 'env_snack',
        name: 'Snack & lunch corner',
        description: 'Snack corner norms followed — towel, spoon, 4 children at a time, etc. Did children bring healthy food? Spilled food after eating?',
      },
      {
        id: 'env_noise',
        name: 'Noise level',
        description: '3 = Purposeful · 2 = Moderate noise level — purposeful · 1 = High noise level — unpurposeful',
      },
      {
        id: 'env_materials',
        name: 'Montessori materials',
        description: '3 = Neat and tidy · 2 = Used properly · 1 = Any incomplete or damaged materials',
      },
    ],
  },
  {
    id: 'norms',
    label: 'Norms',
    icon: 'ti-list-check',
    scored: true,
    params: [
      {
        id: 'norms_ground_adults',
        name: 'Ground rules — adults',
        description: 'Are adults following ground rules? 3 = Most of the time · 2 = Sometimes · 1 = Rarely',
      },
      {
        id: 'norms_ground_children',
        name: 'Ground rules — children',
        description: 'Are children following ground rules? 3 = Most of the time · 2 = Sometimes · 1 = Rarely',
      },
      {
        id: 'norms_reiterate',
        name: 'Adults reiterating norms',
        description: 'Whether adults reiterate norms to children. 3 = Most of the time · 2 = Sometimes · 1 = Rarely',
      },
      {
        id: 'norms_strategies',
        name: 'Strategies in following norms',
        description: 'Note the strategies used to help children follow norms.',
      },
    ],
  },
  {
    id: 'children',
    label: 'Children',
    icon: 'ti-heart',
    scored: true,
    params: [
      {
        id: 'child_social',
        name: 'Social & emotional behaviour',
        description: "Settling of children; able to express feelings/needs; interaction with others during snack/lunch; helping peers/adults; respectful & compassionate; adult ↔ child approach.",
      },
      {
        id: 'child_independence',
        name: 'Independence',
        description: 'Able to choose activities, take care of themselves, perseverance in their activities.',
      },
      {
        id: 'child_movement',
        name: 'Movement in the environment',
        description: 'Purposeful movement.',
      },
      {
        id: 'child_choosing',
        name: 'Choosing activities',
        description: "Mostly suggested by the adult, or the child's own choice?",
      },
      {
        id: 'child_concentration',
        name: 'Involvement / concentration',
        description: 'Interest of the child; less/no distraction; repetition; offering challenging activities.',
      },
      {
        id: 'child_older',
        name: 'Older children — language & reading',
        description: 'Identifying and tracing sounds correctly? Are they writing? Verbalising what they are reading?',
      },
      {
        id: 'child_support',
        name: 'Children needing support',
        description: 'Remedial plan for children who need extra support.',
      },
      {
        id: 'child_levelcheck',
        name: 'Level check',
        description: 'Whether children are working with activities that challenge their current level.',
      },
      {
        id: 'child_notable',
        name: 'Notable moment',
        description: "Any exploratory activity or touching moment by a child? Learning from a child's behaviour? Sudden change or interest in learning?",
      },
    ],
  },
  {
    id: 'teacherRole',
    label: "Teacher's role",
    icon: 'ti-chalkboard',
    scored: true,
    params: [
      {
        id: 'tr_walk',
        name: 'Observation during walk',
        description: 'Able to write notes? Knowing when to intervene and when not to — how and when?',
      },
      {
        id: 'tr_presentations',
        name: 'Giving presentations',
        description: 'Clear or doubtful presentation? Presentation delivered within the time period?',
      },
      {
        id: 'tr_approach',
        name: 'Approach to children & adults',
        description: 'How is the approach done?',
      },
      {
        id: 'tr_roleplay',
        name: 'Roleplays',
        description: 'Planned for any scenarios in the environment?',
      },
      {
        id: 'tr_communication',
        name: 'Communication',
        description: 'Communicating in English with children, Tamil during Tamil activities. Encouraging children to ask questions / respond in English.',
      },
      {
        id: 'tr_planning',
        name: 'Planning for the day',
        description: 'Aware of lesson plan and presentations; understanding between adults in observing and giving presentations; implementing the schedule; understanding the level of all children.',
      },
    ],
  },
  {
    id: 'writingWorkbook',
    label: 'Writing / Workbook',
    icon: 'ti-notebook',
    scored: false,
    params: [
      {
        id: 'ww_english',
        name: 'English notebook',
        description: 'Is the English notebook/writing being maintained and updated appropriately?',
      },
      {
        id: 'ww_tamil',
        name: 'Tamil notebook',
        description: 'Is the Tamil notebook/writing being maintained and updated appropriately?',
      },
      {
        id: 'ww_maths',
        name: 'Maths notebook',
        description: 'Is the Maths notebook/writing being maintained and updated appropriately?',
      },
      {
        id: 'ww_culture',
        name: 'Culture notebook',
        description: 'Is the Culture notebook/writing being maintained and updated appropriately?',
      },
    ],
  },
  {
    id: 'teachersRecord',
    label: "Teacher's record",
    icon: 'ti-clipboard-text',
    scored: false,
    params: [
      {
        id: 'rec_weekly',
        name: 'Weekly planner',
        description: '3 = Up to date · 2 = Partially updated · 1 = Not updated',
      },
      {
        id: 'rec_daily',
        name: 'Daily / detailed observation',
        description: '3 = Up to date · 2 = Partially updated · 1 = Not updated',
      },
      {
        id: 'rec_digital_prekg',
        name: 'Digital checklist — PreKG',
        description: 'Monthly digital checklist entered for all PreKG children.',
      },
      {
        id: 'rec_digital_lkg',
        name: 'Digital checklist — LKG',
        description: 'Monthly digital checklist entered for all LKG children.',
      },
      {
        id: 'rec_digital_ukg',
        name: 'Digital checklist — UKG',
        description: 'Monthly digital checklist entered for all UKG children.',
      },
    ],
  },
]

// Categories whose average feeds the dashboard / progress charts
export const SCORED_CATEGORY_IDS = OBSERVATION_CATEGORIES.filter(c => c.scored).map(c => c.id)

// Flat lookup helpers
export const getCategory = (categoryId) => OBSERVATION_CATEGORIES.find(c => c.id === categoryId)

export const getParam = (categoryId, paramId) => {
  const cat = getCategory(categoryId)
  return cat?.params.find(p => p.id === paramId)
}

// Build a blank scores object: { [categoryId]: { [paramId]: { level: null, remark: '' } } }
export const buildBlankScores = () => {
  const scores = {}
  OBSERVATION_CATEGORIES.forEach(cat => {
    scores[cat.id] = {}
    cat.params.forEach(p => {
      scores[cat.id][p.id] = { level: null, remark: '' }
    })
  })
  return scores
}

// Compute the average level for one category from a scores object.
// Returns null if no parameter in that category has been scored yet.
export const categoryAverage = (scores, categoryId) => {
  const cat = getCategory(categoryId)
  if (!cat || !scores?.[categoryId]) return null
  const levels = cat.params
    .map(p => scores[categoryId][p.id]?.level)
    .filter(l => l === 1 || l === 2 || l === 3)
  if (levels.length === 0) return null
  return levels.reduce((a, b) => a + b, 0) / levels.length
}

// Compute averages for every scored category + overall
export const computeAverages = (scores) => {
  const categoryAverages = {}
  SCORED_CATEGORY_IDS.forEach(id => {
    categoryAverages[id] = categoryAverage(scores, id)
  })
  const validAverages = Object.values(categoryAverages).filter(v => v !== null)
  const overallAverage = validAverages.length
    ? validAverages.reduce((a, b) => a + b, 0) / validAverages.length
    : null
  return { categoryAverages, overallAverage }
}

// Whether every SCORED parameter has been given a level (used to flag
// an observation as "complete" vs "partial" when publishing)
export const isFullyScored = (scores) => {
  return OBSERVATION_CATEGORIES
    .filter(c => c.scored)
    .every(cat => cat.params.every(p => {
      const lvl = scores?.[cat.id]?.[p.id]?.level
      return lvl === 1 || lvl === 2 || lvl === 3
    }))
}
