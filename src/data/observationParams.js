// ─────────────────────────────────────────────────────────────────────────
// Observation parameter taxonomy
// Source: "Observer's Class observation template.xlsx" (updated version).
//
// 5 categories, marks sum to 60:
//   Prepared Environment                            15 marks  (25%)
//   Classroom Management & Teamwork / Beh. Norms   15 marks  (25%)
//   Child-Centered Observations & Planning          10 marks  (16.7%)
//   Communication (with Student, with Parents)      10 marks  (16.7%)
//   Montessori Practice & Delivery                  10 marks  (16.7%)
//                                                  ─────────
//                                                   60 marks  total
//
// Scoring per parameter: 3 = Good, 2 = Average, 1 = Needs improvement.
// Category marks = (avg level / 3) × maxMarks.
// Total marks    = sum of all category marks (max 60).
//
// `scorable: false` parameters (Notable Moments) accept remarks only and
// are excluded from the category average.
// ─────────────────────────────────────────────────────────────────────────

export const TOTAL_MARKS = 60

export const LEVEL_OPTIONS = [3, 2, 1]
export const LEVEL_LABELS = { 3: 'Good', 2: 'Average', 1: 'Needs improvement' }

export const OBSERVATION_CATEGORIES = [
  // ── 1. Prepared Environment ─────────────────────────────────────── 15 marks
  {
    id: 'environment',
    label: 'Prepared Environment',
    icon: 'leaf',
    weightPercent: 0.25,   // 15/60
    maxMarks: 15,
    scored: true,
    directScore: false,
    params: [
      {
        id: 'env_materials_readiness',
        name: 'Materials Readiness',
        description: 'All materials required for the day are displayed, complete, and ready for use.',
        scale: '3 – All materials ready and displayed / 2 – Minor items missing / 1 – Several materials not ready or absent',
        scorable: true,
      },
      {
        id: 'env_accessibility',
        name: 'Accessibility',
        description: "Materials are placed within the child's reach, allowing independent access.",
        scale: '3 – Fully accessible by children independently / 2 – Few materials require adult help / 1 – Mostly adult-dependent for access',
        scorable: true,
      },
      {
        id: 'env_order',
        name: 'Order & Organization',
        description: 'Shelves are neat, orderly, and materials are arranged from simple to complex, left to right.',
        scale: '3 – Well organized, simple to complex / 2 – Minor disorder present / 1 – Untidy or disorganized',
        scorable: true,
      },
      {
        id: 'env_completeness',
        name: 'Completeness of Materials',
        description: 'Every activity has all its components and control of error.',
        scale: '3 – All materials complete / 2 – One or two incomplete sets / 1 – Many materials incomplete',
        scorable: true,
      },
      {
        id: 'env_cleanliness',
        name: 'Cleanliness',
        description: 'Shelves, materials, mats, and chowkies are clean.',
        scale: '3 – Very clean throughout / 2 – Minor cleaning needed in places / 1 – Untidy or dirty',
        scorable: true,
      },
      {
        id: 'env_aesthetics',
        name: 'Environment Aesthetics & Natural Elements',
        description: 'The classroom is clean, beautiful, uncluttered, child-sized, and inviting, enriched with well-maintained plants, flowers, natural materials, and appropriate Montessori décor.',
        scale: '3 – Attractive, organized, natural elements well maintained / 2 – Generally inviting, minor improvements needed / 1 – Cluttered, unattractive, or natural elements missing or poorly maintained',
        scorable: true,
      },
    ],
  },

  // ── 2. Classroom Management & Teamwork / Academic / Behaviour Norms ─ 15 marks
  {
    id: 'classroom',
    label: 'Classroom Management & Teamwork / Academic / Behaviour Norms',
    icon: 'list-check',
    weightPercent: 0.25,   // 15/60
    maxMarks: 15,
    scored: true,
    directScore: false,
    params: [
      {
        id: 'cls_ground_adults',
        name: 'Ground Rules – Adults',
        description: 'Adults consistently follow and model classroom ground rules.',
        scale: '3 – Consistently followed by adults / 2 – Sometimes followed / 1 – Rarely followed',
        scorable: true,
      },
      {
        id: 'cls_ground_children',
        name: 'Ground Rules – Children',
        description: 'Children independently follow classroom expectations and routines.',
        scale: '3 – Consistently followed by children / 2 – Sometimes followed / 1 – Rarely followed',
        scorable: true,
      },
      {
        id: 'cls_reinforcing',
        name: 'Reinforcing Norms',
        description: 'Adults consistently reiterate and reinforce classroom norms in a positive manner.',
        scale: '3 – Consistently reinforced positively / 2 – Sometimes reinforced / 1 – Rarely reinforced',
        scorable: true,
      },
      {
        id: 'cls_transitions',
        name: 'Transitions',
        description: 'Children transition between activities calmly, independently, and purposefully.',
        scale: '3 – Smooth and independent transitions / 2 – Minor reminders needed / 1 – Frequent adult intervention required',
        scorable: true,
      },
      {
        id: 'cls_movement',
        name: 'Movement in the Environment',
        description: "Children move carefully, carry materials correctly, and respect others' workspaces.",
        scale: '3 – Consistently appropriate movement / 2 – Occasional reminders needed / 1 – Frequent inappropriate movement',
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
        scale: '3 – Consistently facilitated by adult / 2 – Sometimes facilitated / 1 – Adult resolves conflicts directly',
        scorable: true,
      },
      {
        id: 'cls_snack',
        name: 'Snack & Lunch Corner',
        description: 'Snack corner norms followed — towel, spoon, limited children at a time, healthy food, cleaning spills, returning utensils.',
        scale: '3 – All norms consistently followed / 2 – Minor reminders needed / 1 – Norms not consistently followed',
        scorable: true,
      },
      {
        id: 'cls_care',
        name: 'Care of the Environment',
        description: 'Children clean spills, return materials, push chairs in, roll mats, and maintain the environment.',
        scale: '3 – Independently practiced / 2 – Occasional reminders needed / 1 – Mostly adult-dependent',
        scorable: true,
      },
      {
        id: 'cls_strategies',
        name: 'Strategies for Following Norms',
        description: 'Adults use positive guidance, modelling, Grace & Courtesy lessons, and redirection instead of repeated verbal corrections.',
        scale: '3 – Positive strategies consistently used / 2 – Sometimes used / 1 – Rarely used, relies on verbal corrections',
        scorable: true,
      },
      {
        id: 'cls_noise',
        name: 'Noise Level',
        description: 'The classroom maintains a calm, purposeful atmosphere that supports concentration and respectful communication.',
        scale: '3 – Calm, purposeful noise that supports learning / 2 – Moderate noise, mostly purposeful with occasional reminders / 1 – High, unpurposeful noise that disrupts concentration',
        scorable: true,
      },
    ],
  },

  // ── 3. Child-Centered Observations & Planning ─────────────────────  10 marks
  {
    id: 'childCentered',
    label: 'Child-Centered Observations & Planning',
    icon: 'heart',
    weightPercent: 0.1667, // 10/60
    maxMarks: 10,
    scored: true,
    directScore: false,
    params: [
      {
        id: 'cc_social',
        name: 'Social & Emotional Development',
        description: 'Settling into the environment, expressing feelings and needs appropriately, interacting respectfully, showing empathy, helping peers/adults, and comfortable approaching adults and peers.',
        scale: '3 – Consistently demonstrated / 2 – Sometimes demonstrated / 1 – Needs frequent support',
        scorable: true,
      },
      {
        id: 'cc_independence',
        name: 'Independence',
        description: 'Chooses work independently, cares for self and environment, completes activities with perseverance, and seeks help appropriately.',
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
        description: 'Demonstrates age-appropriate literacy skills — identifying sounds, blending, reading, writing, verbalizing what is read.',
        scale: '3 – Consistently demonstrates skills / 2 – Developing with occasional support / 1 – Needs significant support',
        scorable: true,
      },
      {
        id: 'cc_support',
        name: 'Children Requiring Additional Support',
        description: 'Children needing support are identified, receive follow-up lessons/remedial plans, and are working at an appropriate level with gradual progression.',
        scale: '3 – Individual support plan clearly evident / 2 – Partial support provided / 1 – No clear follow-up observed',
        scorable: true,
      },
      {
        id: 'cc_challenge',
        name: 'Appropriate Challenge',
        description: 'Children are working at their individual developmental level with activities that extend learning without causing frustration.',
        scale: '3 – Well-matched challenge for each child / 2 – Mostly appropriate / 1 – Activities too easy or too difficult',
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
        description: 'Significant observations recorded — emerging interests, exploratory behaviour, acts of kindness, new skills, behavioural changes, or moments that inform future planning.',
        scale: null,      // remarks-only; no level scale
        scorable: false,
      },
    ],
  },

  // ── 4. Communication ──────────────────────────────────────────────  10 marks
  {
    id: 'communication',
    label: 'Communication (with Student, with Parents)',
    icon: 'message-2',
    weightPercent: 0.1667, // 10/60
    maxMarks: 10,
    scored: true,
    directScore: false,
    params: [
      {
        id: 'comm_children',
        name: 'Communication with Children',
        description: 'Adults communicate consistently in English during classroom interactions and use Tamil appropriately during Tamil activities. Language is clear, respectful, and age-appropriate.',
        scale: '3 – Consistently followed, language appropriate / 2 – Sometimes followed / 1 – Rarely followed or language not appropriate',
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

  // ── 5. Montessori Practice & Delivery ────────────────────────────  10 marks
  {
    id: 'montessori',
    label: 'Montessori Practice & Delivery',
    icon: 'chalkboard',
    weightPercent: 0.1667, // 10/60
    maxMarks: 10,
    scored: true,
    directScore: false,
    params: [
      {
        id: 'mp_observation',
        name: 'Observation Skills',
        description: 'Adults observe children objectively, record meaningful notes, and know when to observe without interrupting and when intervention is necessary.',
        scale: '3 – Consistently demonstrated with written notes / 2 – Sometimes demonstrated / 1 – Needs improvement, intervention often premature or delayed',
        scorable: true,
      },
      {
        id: 'mp_intervention',
        name: 'Intervention',
        description: 'Adult intervenes only when required (safety, misuse of material, disturbance) and uses appropriate Montessori guidance.',
        scale: '3 – Appropriate and timely intervention / 2 – Occasional unnecessary or delayed intervention / 1 – Frequent unnecessary intervention',
        scorable: true,
      },
      {
        id: 'mp_presentations',
        name: 'Lesson Presentations',
        description: 'Presentations are accurate, sequential, clear, child-paced, and completed within an appropriate time.',
        scale: '3 – Clear, accurate, and well-paced / 2 – Minor improvements needed / 1 – Inaccurate or unclear presentation',
        scorable: true,
      },
      {
        id: 'mp_approach',
        name: 'Approach to Children',
        description: 'Adults interact respectfully, patiently, and encourage independence while maintaining positive relationships.',
        scale: '3 – Consistently respectful and encouraging / 2 – Sometimes appropriate / 1 – Needs improvement in approach',
        scorable: true,
      },
      {
        id: 'mp_collaboration',
        name: 'Collaboration Between Adults',
        description: 'Adults communicate effectively, understand their respective roles, and coordinate observations and lesson presentations.',
        scale: '3 – Strong collaboration evident / 2 – Partial collaboration / 1 – Limited coordination between adults',
        scorable: true,
      },
      {
        id: 'mp_daily_plan',
        name: 'Daily Planning',
        description: "Adults are aware of the day's lesson plan, presentations, follow-up lessons, and classroom schedule.",
        scale: '3 – Fully prepared and aware / 2 – Partially prepared / 1 – Not prepared for the day',
        scorable: true,
      },
      {
        id: 'mp_knowledge',
        name: 'Knowledge of Children',
        description: "Adults demonstrate awareness of each child's developmental level, interests, current lessons, and next presentations.",
        scale: "3 – Strong understanding of all children / 2 – Good understanding of most children / 1 – Limited understanding of children's levels",
        scorable: true,
      },
      {
        id: 'mp_implementation',
        name: 'Implementation of Plan',
        description: 'Planned lessons, presentations, and classroom routines are implemented effectively throughout the work cycle.',
        scale: '3 – Consistently and fully implemented / 2 – Mostly implemented / 1 – Frequently not implemented',
        scorable: true,
      },
      {
        id: 'mp_records',
        name: 'Student Records',
        description: 'Weekly planner, daily observations, checklists, and digital records are updated accurately and on time.',
        scale: '3 – Complete and fully up to date / 2 – Minor pending updates / 1 – Incomplete or outdated records',
        scorable: true,
      },
      {
        id: 'mp_followup',
        name: 'Follow-up Planning',
        description: 'Observation records are used to plan follow-up lessons, remedial support, and extension activities for individual children.',
        scale: '3 – Clearly evident in planning / 2 – Partially evident / 1 – Not evident in planning',
        scorable: true,
      },
    ],
  },
]

// ─── Lookup helpers ────────────────────────────────────────────────────────

export const getCategory  = (id) => OBSERVATION_CATEGORIES.find(c => c.id === id)
export const getParam     = (catId, paramId) => getCategory(catId)?.params.find(p => p.id === paramId)

// Build a blank scores object { [categoryId]: { [paramId]: { level: null, remark: '' } } }
export const buildBlankScores = () => {
  const scores = {}
  OBSERVATION_CATEGORIES.forEach(cat => {
    scores[cat.id] = {}
    cat.params.forEach(p => { scores[cat.id][p.id] = { level: null, remark: '' } })
  })
  return scores
}

// ─── Scoring ───────────────────────────────────────────────────────────────
//
//   category marks  = (avgLevel / 3) × maxMarks
//   total marks     = Σ category marks  (max 60)

export const computeAverages = (scores) => {
  const categoryAverages = {}
  const categoryMarks    = {}
  let   totalMarks       = 0

  OBSERVATION_CATEGORIES.forEach(cat => {
    const levels = cat.params
      .filter(p => p.scorable !== false)
      .map(p => scores?.[cat.id]?.[p.id]?.level)
      .filter(l => l === 1 || l === 2 || l === 3)

    if (levels.length === 0) {
      categoryAverages[cat.id] = null
      categoryMarks[cat.id]    = null
    } else {
      const avg               = levels.reduce((a, b) => a + b, 0) / levels.length
      const marks             = (avg / 3) * cat.maxMarks
      categoryAverages[cat.id] = avg
      categoryMarks[cat.id]    = marks
      totalMarks              += marks
    }
  })

  const validAvgs    = Object.values(categoryAverages).filter(v => v != null)
  const overallAverage = validAvgs.length
    ? validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length
    : null

  return { categoryAverages, categoryMarks, totalMarks, overallAverage }
}

// Whether every scorable parameter has been given a level
export const isFullyScored = (scores) =>
  OBSERVATION_CATEGORIES.every(cat =>
    cat.params
      .filter(p => p.scorable !== false)
      .every(p => { const l = scores?.[cat.id]?.[p.id]?.level; return l === 1 || l === 2 || l === 3 })
  )

export const round1 = (n) => (n == null ? null : Math.round(n  * 10)  / 10)
export const round2 = (n) => (n == null ? null : Math.round(n  * 100) / 100)
