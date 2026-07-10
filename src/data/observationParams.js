// ─────────────────────────────────────────────────────────────────────────
// Observation parameter taxonomy
// Source: "Observer's Class observation template.xlsx" (updated version).
//
// 7 categories, weighted to total 60 marks:
//   Prepared Environment                                  15% = 9 marks
//   Classroom Management & Teamwork / Behaviour Norms    15% = 9 marks
//   Child-Centered Observations & Planning               10% = 6 marks
//   Communication (with Student, with Parents)           10% = 6 marks
//   Montessori Practice & Delivery                       10% = 6 marks
//   Professional Development & Initiative / Teamwork     10% = 6 marks
//   Class Performance                                    30% = 18 marks
//
// Scoring per parameter: 3 = Good, 2 = Average, 1 = Needs improvement.
// Category marks = (avg level / 3) × maxMarks.
// Total marks = sum of all category marks (max 60).
//
// Parameters with scorable: false accept remarks only and are excluded
// from the category average (e.g. Notable Moments).
//
// Categories with directScore: true have a single overall level input
// instead of sub-parameters (profDevelopment, classPerformance).
// ─────────────────────────────────────────────────────────────────────────

export const TOTAL_MARKS = 60

export const LEVEL_OPTIONS = [3, 2, 1]
export const LEVEL_LABELS = { 3: 'Good', 2: 'Average', 1: 'Needs improvement' }

export const OBSERVATION_CATEGORIES = [
  {
    id: 'environment',
    label: 'Prepared Environment',
    icon: 'leaf',
    weightPercent: 0.15,
    maxMarks: 9,
    scored: true,
    directScore: false,
    params: [
      {
        id: 'env_materials_readiness',
        name: 'Materials Readiness',
        description: 'All materials required for the day are displayed, complete, and ready for use.',
        scale: '3 – All ready / 2 – Minor items missing / 1 – Several materials not ready',
        scorable: true,
      },
      {
        id: 'env_accessibility',
        name: 'Accessibility',
        description: "Materials are placed within the child's reach, allowing independent access.",
        scale: '3 – Fully accessible / 2 – Few materials inaccessible / 1 – Mostly adult-dependent',
        scorable: true,
      },
      {
        id: 'env_order',
        name: 'Order & Organization',
        description: 'Shelves are neat, orderly, and materials are arranged from simple to complex, left to right.',
        scale: '3 – Well organized / 2 – Minor disorder / 1 – Untidy/disorganized',
        scorable: true,
      },
      {
        id: 'env_completeness',
        name: 'Completeness of Materials',
        description: 'Every activity has all its components and control of error.',
        scale: '3 – Complete / 2 – One or two incomplete sets / 1 – Many incomplete materials',
        scorable: true,
      },
      {
        id: 'env_cleanliness',
        name: 'Cleanliness',
        description: 'Shelves, materials, mats, chowkies are clean.',
        scale: '3 – Very clean / 2 – Minor cleaning needed / 1 – Untidy/dirty',
        scorable: true,
      },
      {
        id: 'env_aesthetics',
        name: 'Environment Aesthetics & Natural Elements',
        description: 'The classroom is clean, beautiful, uncluttered, child-sized, inviting, and enriched with well-maintained plants, flowers, natural materials, and appropriate Montessori décor.',
        scale: '3 – Attractive, organized, natural elements well maintained / 2 – Generally inviting with minor improvements needed / 1 – Cluttered, unattractive, or natural elements missing/poorly maintained',
        scorable: true,
      },
    ],
  },
  {
    id: 'classroom',
    label: 'Classroom Management & Teamwork / Academic / Behaviour Norms',
    icon: 'list-check',
    weightPercent: 0.15,
    maxMarks: 9,
    scored: true,
    directScore: false,
    params: [
      {
        id: 'cls_ground_adults',
        name: 'Ground Rules – Adults',
        description: 'Adults consistently follow and model classroom ground rules.',
        scale: '3 – Most of the time / 2 – Sometimes / 1 – Rarely',
        scorable: true,
      },
      {
        id: 'cls_ground_children',
        name: 'Ground Rules – Children',
        description: 'Children independently follow classroom expectations and routines.',
        scale: '3 – Most of the time / 2 – Sometimes / 1 – Rarely',
        scorable: true,
      },
      {
        id: 'cls_reinforcing',
        name: 'Reinforcing Norms',
        description: 'Adults consistently reiterate and reinforce classroom norms in a positive manner.',
        scale: '3 – Most of the time / 2 – Sometimes / 1 – Rarely',
        scorable: true,
      },
      {
        id: 'cls_transitions',
        name: 'Transitions',
        description: 'Children transition between activities calmly, independently, and purposefully.',
        scale: '3 – Smooth and independent / 2 – Minor reminders needed / 1 – Frequent adult intervention',
        scorable: true,
      },
      {
        id: 'cls_movement',
        name: 'Movement in the Environment',
        description: "Children move carefully, carry materials correctly, and respect others' workspaces.",
        scale: '3 – Consistently appropriate / 2 – Occasional reminders / 1 – Frequent inappropriate movement',
        scorable: true,
      },
      {
        id: 'cls_grace',
        name: 'Grace & Courtesy',
        description: 'Children demonstrate respect, patience, waiting for turns, and courteous interactions.',
        scale: '3 – Consistently observed / 2 – Sometimes observed / 1 – Rarely observed',
        scorable: true,
      },
      {
        id: 'cls_conflict',
        name: 'Conflict Resolution',
        description: 'Adults guide children to resolve conflicts respectfully and independently.',
        scale: '3 – Consistently facilitated / 2 – Sometimes facilitated / 1 – Adult solves conflicts directly',
        scorable: true,
      },
      {
        id: 'cls_snack',
        name: 'Snack & Lunch Corner',
        description: 'Snack norms followed (towel, spoon, limited children, healthy food, cleaning spills, returning utensils).',
        scale: '3 – All norms followed / 2 – Minor reminders needed / 1 – Norms not consistently followed',
        scorable: true,
      },
      {
        id: 'cls_care',
        name: 'Care of the Environment',
        description: 'Children clean spills, return materials, push chairs in, roll mats, and maintain the environment.',
        scale: '3 – Independently practiced / 2 – Occasional reminders / 1 – Mostly adult dependent',
        scorable: true,
      },
      {
        id: 'cls_strategies',
        name: 'Strategies for Following Norms',
        description: 'Adults use positive guidance, modelling, Grace & Courtesy lessons, and redirection instead of repeated verbal corrections.',
        scale: '3 – Consistently used / 2 – Sometimes used / 1 – Rarely used',
        scorable: true,
      },
      {
        id: 'cls_noise',
        name: 'Noise Level',
        description: 'The classroom maintains a calm, purposeful atmosphere that supports concentration and respectful communication.',
        scale: '3 – Calm, purposeful noise that supports learning / 2 – Moderate noise, mostly purposeful with occasional reminders needed / 1 – High, unpurposeful noise that disrupts concentration',
        scorable: true,
      },
    ],
  },
  {
    id: 'childCentered',
    label: 'Child-Centered Observations & Planning',
    icon: 'heart',
    weightPercent: 0.10,
    maxMarks: 6,
    scored: true,
    directScore: false,
    params: [
      {
        id: 'cc_social',
        name: 'Social & Emotional Development',
        description: 'Settling into the environment, expressing feelings and needs appropriately, interacting respectfully during work/snack/lunch, showing empathy, helping peers/adults, and comfortable approaching adults and peers.',
        scale: '3 – Consistently demonstrated / 2 – Sometimes demonstrated / 1 – Needs frequent support',
        scorable: true,
      },
      {
        id: 'cc_independence',
        name: 'Independence',
        description: 'Chooses work independently, cares for self and environment, completes activities with perseverance, and seeks help appropriately when needed.',
        scale: '3 – Highly independent / 2 – Occasional support needed / 1 – Frequent adult dependency',
        scorable: true,
      },
      {
        id: 'cc_movement',
        name: 'Purposeful Movement',
        description: "Moves calmly and purposefully, carries materials carefully, respects others' workspace, and follows movement norms.",
        scale: '3 – Consistently purposeful / 2 – Occasional reminders needed / 1 – Frequent inappropriate movement',
        scorable: true,
      },
      {
        id: 'cc_choice',
        name: 'Choice of Activities',
        description: 'Selects activities independently based on interest and developmental readiness rather than relying on adult suggestions.',
        scale: '3 – Mostly self-selected / 2 – Balanced between self-choice and adult suggestion / 1 – Mostly adult-directed',
        scorable: true,
      },
      {
        id: 'cc_engagement',
        name: 'Engagement & Concentration',
        description: 'Shows sustained interest, repeats work voluntarily, remains focused with minimal distractions, and is offered appropriate challenges.',
        scale: '3 – Deep concentration observed / 2 – Moderate engagement / 1 – Frequently distracted',
        scorable: true,
      },
      {
        id: 'cc_academic',
        name: 'Academic Readiness (Older Children)',
        description: 'Demonstrates age-appropriate literacy skills such as identifying sounds, blending, reading, writing, and verbalizing what is read.',
        scale: '3 – Consistently demonstrates skills / 2 – Developing with occasional support / 1 – Needs significant support',
        scorable: true,
      },
      {
        id: 'cc_support',
        name: 'Children Requiring Additional Support',
        description: 'Children needing support are identified, receive follow-up lessons/remedial plans, and are working at an appropriate level with gradual progression.',
        scale: '3 – Individual support plan evident / 2 – Partial support provided / 1 – No clear follow-up observed',
        scorable: true,
      },
      {
        id: 'cc_challenge',
        name: 'Appropriate Challenge',
        description: 'Children are working at their individual developmental level with activities that extend learning without causing frustration.',
        scale: '3 – Well-matched challenge / 2 – Mostly appropriate / 1 – Activities too easy or too difficult',
        scorable: true,
      },
      {
        id: 'cc_obs_planning',
        name: 'Observation-Based Planning',
        description: 'Adult observations are reflected in lesson presentations, follow-up activities, and individualized planning.',
        scale: '3 – Planning clearly based on observations / 2 – Partially evident / 1 – No evidence of observation-based planning',
        scorable: true,
      },
      {
        id: 'cc_notable',
        name: 'Notable Moments',
        description: 'Significant observations recorded: emerging interests, exploratory behaviour, acts of kindness, new skills, behavioural changes, or moments that inform future planning.',
        scale: null,
        scorable: false, // remarks-only, no level scale
      },
    ],
  },
  {
    id: 'communication',
    label: 'Communication (with Student, with Parents)',
    icon: 'message-2',
    weightPercent: 0.10,
    maxMarks: 6,
    scored: true,
    directScore: false,
    params: [
      {
        id: 'comm_children',
        name: 'Communication with Children',
        description: 'Adults communicate consistently in English during classroom interactions and use Tamil appropriately during Tamil activities. Language is clear, respectful, and age-appropriate.',
        scale: '3 – Consistently followed / 2 – Sometimes followed / 1 – Rarely followed',
        scorable: true,
      },
      {
        id: 'comm_encourage',
        name: 'Encouraging Child Communication',
        description: 'Adults encourage children to ask questions, express ideas, and respond confidently in English without pressure.',
        scale: '3 – Consistently encouraged / 2 – Sometimes encouraged / 1 – Rarely encouraged',
        scorable: true,
      },
    ],
  },
  {
    id: 'montessori',
    label: 'Montessori Practice & Delivery',
    icon: 'chalkboard',
    weightPercent: 0.10,
    maxMarks: 6,
    scored: true,
    directScore: false,
    params: [
      {
        id: 'mp_observation',
        name: 'Observation Skills',
        description: 'Adults observe children objectively, record meaningful notes, and know when to observe without interrupting and when intervention is necessary.',
        scale: '3 – Consistently demonstrated / 2 – Sometimes demonstrated / 1 – Needs improvement',
        scorable: true,
      },
      {
        id: 'mp_intervention',
        name: 'Intervention',
        description: 'Adult intervenes only when required (safety, misuse of material, disturbance, or after adequate observation) and uses appropriate Montessori guidance.',
        scale: '3 – Appropriate and timely intervention / 2 – Occasional unnecessary/delayed intervention / 1 – Frequent unnecessary intervention',
        scorable: true,
      },
      {
        id: 'mp_presentations',
        name: 'Lesson Presentations',
        description: 'Presentations are accurate, sequential, clear, child-paced, and completed within an appropriate time.',
        scale: '3 – Clear and accurate / 2 – Minor improvements needed / 1 – Inaccurate or unclear',
        scorable: true,
      },
      {
        id: 'mp_approach',
        name: 'Approach to Children',
        description: 'Adults interact respectfully, patiently, and encourage independence while maintaining positive relationships.',
        scale: '3 – Consistently appropriate / 2 – Sometimes appropriate / 1 – Needs improvement',
        scorable: true,
      },
      {
        id: 'mp_collaboration',
        name: 'Collaboration Between Adults',
        description: 'Adults communicate effectively, understand their respective roles, and coordinate observations and lesson presentations.',
        scale: '3 – Strong collaboration / 2 – Partial collaboration / 1 – Limited coordination',
        scorable: true,
      },
      {
        id: 'mp_daily_plan',
        name: 'Daily Planning',
        description: "Adults are aware of the day's lesson plan, presentations, follow-up lessons, and classroom schedule.",
        scale: '3 – Fully prepared / 2 – Partially prepared / 1 – Not prepared',
        scorable: true,
      },
      {
        id: 'mp_knowledge',
        name: 'Knowledge of Children',
        description: "Adults demonstrate awareness of each child's developmental level, interests, current lessons, and next presentations.",
        scale: '3 – Strong understanding of all children / 2 – Good understanding of most children / 1 – Limited understanding',
        scorable: true,
      },
      {
        id: 'mp_implementation',
        name: 'Implementation of Plan',
        description: 'Planned lessons, presentations, and classroom routines are implemented effectively throughout the work cycle.',
        scale: '3 – Consistently implemented / 2 – Mostly implemented / 1 – Frequently not implemented',
        scorable: true,
      },
      {
        id: 'mp_records',
        name: 'Student Records',
        description: 'Weekly planner, daily observations, checklists, and digital records are updated accurately and on time.',
        scale: '3 – Complete and up to date / 2 – Minor pending updates / 1 – Incomplete or outdated',
        scorable: true,
      },
      {
        id: 'mp_followup',
        name: 'Follow-up Planning',
        description: 'Observation records are used to plan follow-up lessons, remedial support, and extension activities for individual children.',
        scale: '3 – Clearly evident / 2 – Partially evident / 1 – Not evident',
        scorable: true,
      },
    ],
  },
  {
    id: 'profDevelopment',
    label: 'Professional Development & Initiative / Professional Behaviour & Teamwork',
    icon: 'award',
    weightPercent: 0.10,
    maxMarks: 6,
    scored: true,
    directScore: true,
    params: [
      {
        id: 'prof_direct',
        name: 'Overall Professional Development & Initiative / Professional Behaviour & Teamwork',
        description: "Rate the teacher's overall professional development, initiative shown, professional behaviour, and contribution to teamwork.",
        scale: '3 – Good / 2 – Average / 1 – Needs improvement',
        scorable: true,
      },
    ],
  },
  {
    id: 'classPerformance',
    label: 'Class Performance',
    icon: 'trophy',
    weightPercent: 0.30,
    maxMarks: 18,
    scored: true,
    directScore: true,
    params: [
      {
        id: 'class_direct',
        name: 'Overall Class Performance',
        description: 'Rate the overall performance of the class — quality of work cycle, level of engagement, independence, and progress.',
        scale: '3 – Good / 2 – Average / 1 – Needs improvement',
        scorable: true,
      },
    ],
  },
]

// ─── Lookup helpers ────────────────────────────────────────────────────────

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

// ─── Scoring ───────────────────────────────────────────────────────────────
// Category marks  = (avg level / 3) × maxMarks
// Total marks     = sum of all category marks (max 60)

export const computeAverages = (scores) => {
  const categoryAverages = {}
  const categoryMarks = {}
  let totalMarks = 0

  OBSERVATION_CATEGORIES.forEach(cat => {
    const scorableParams = cat.params.filter(p => p.scorable !== false)
    const levels = scorableParams
      .map(p => scores?.[cat.id]?.[p.id]?.level)
      .filter(l => l === 1 || l === 2 || l === 3)

    if (levels.length === 0) {
      categoryAverages[cat.id] = null
      categoryMarks[cat.id] = null
    } else {
      const avg = levels.reduce((a, b) => a + b, 0) / levels.length
      const marks = (avg / 3) * cat.maxMarks
      categoryAverages[cat.id] = avg
      categoryMarks[cat.id] = marks
      totalMarks += marks
    }
  })

  const validAvgs = Object.values(categoryAverages).filter(v => v != null)
  const overallAverage = validAvgs.length
    ? validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length
    : null

  return { categoryAverages, categoryMarks, totalMarks, overallAverage }
}

// Whether every scorable parameter has been given a level
export const isFullyScored = (scores) => {
  return OBSERVATION_CATEGORIES.every(cat =>
    cat.params
      .filter(p => p.scorable !== false)
      .every(p => {
        const lvl = scores?.[cat.id]?.[p.id]?.level
        return lvl === 1 || lvl === 2 || lvl === 3
      })
  )
}

export const round1 = (n) => (n == null ? null : Math.round(n * 10) / 10)
export const round2 = (n) => (n == null ? null : Math.round(n * 100) / 100)
