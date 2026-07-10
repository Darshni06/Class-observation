import { OBSERVATION_CATEGORIES } from '../data/observationParams'
import { formatDate } from './helpers'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

function describeObservation(obs) {
  const lines = [`Observation on ${formatDate(obs.date)} (${obs.classDisplayName}, observed by ${obs.observerName}):`]
  if (obs.totalMarks != null) {
    lines.push(`Total marks for this session: ${Math.round(obs.totalMarks * 10) / 10} / 60`)
  }
  OBSERVATION_CATEGORIES.forEach(cat => {
    const catMarks = obs.categoryMarks?.[cat.id]
    const rows = cat.params
      .map(p => {
        const entry = obs.scores?.[cat.id]?.[p.id]
        if (!entry || (entry.level == null && !entry.remark)) return null
        const levelTxt = p.scorable !== false && entry.level != null
          ? `Level ${entry.level}/3`
          : p.scorable === false ? '(narrative only)' : 'Not scored'
        const remarkTxt = entry.remark ? ` — Remark: ${entry.remark}` : ''
        return `  - ${p.name}: ${levelTxt}${remarkTxt}`
      })
      .filter(Boolean)
    if (rows.length) {
      const marksNote = catMarks != null
        ? ` [${Math.round(catMarks * 10) / 10}/${cat.maxMarks} marks, ${Math.round(cat.weightPercent * 100)}% weight]`
        : ''
      lines.push(`[${cat.label}${marksNote}]`)
      lines.push(...rows)
    }
  })
  if (obs.positivePoints) lines.push(`Positive points noted: ${obs.positivePoints}`)
  if (obs.areasToImprove) lines.push(`Areas to improve noted: ${obs.areasToImprove}`)
  return lines.join('\n')
}

const CATEGORY_KEY_LIST = OBSERVATION_CATEGORIES.map(c => `"${c.id}"`).join(', ')
const CATEGORY_LABEL_LINES = OBSERVATION_CATEGORIES.map(c =>
  `- "${c.id}" = ${c.label} (${Math.round(c.weightPercent * 100)}% weight, max ${c.maxMarks} marks)`
).join('\n')

function buildPrompt({ classDisplayName, teacherNames, period, observations }) {
  const observationBlocks = observations.map(describeObservation).join('\n\n')

  return `You are an experienced Montessori pedagogical consultant writing a classroom observation report for a class's professional development file.

Write in a warm, specific, and constructive tone — grounded in concrete details (what children and the teachers actually did), encouraging of strengths, and gently direct about areas needing attention. Avoid generic corporate language. Avoid repeating raw level numbers in the prose; translate them into descriptive observations instead.

Class: ${classDisplayName}
Teacher(s): ${teacherNames.join(', ') || 'Not assigned'}
Reporting period: ${period}
Number of observations included: ${observations.length}

Here is the structured data from classroom observations. Each category is scored on a 1-3 scale and weighted toward a total of 60 marks:

${observationBlocks}

The categories and their weights are:
${CATEGORY_LABEL_LINES}

For EACH category, write one concise, well-formed paragraph (3-5 sentences) synthesizing everything recorded under that category's parameters across all observations — weave into flowing prose, do not list parameters. If a category has little or no data, say so briefly.

Also note the overall marks scored across the observation period in your summary.

Respond with ONLY a JSON object (no markdown fences, no extra commentary) in exactly this shape:
{
  "categorySummaries": {
    "environment": "paragraph for Prepared Environment",
    "classroom": "paragraph for Classroom Management & Teamwork",
    "childCentered": "paragraph for Child-Centered Observations & Planning",
    "communication": "paragraph for Communication",
    "montessori": "paragraph for Montessori Practice & Delivery",
    "profDevelopment": "paragraph for Professional Development & Initiative",
    "classPerformance": "paragraph for Class Performance"
  },
  "overallSummary": "3-4 sentence high-level synthesis including overall marks context.",
  "strengths": ["3 to 6 specific, evidence-based strengths, each a complete sentence."],
  "recommendations": ["3 to 6 specific, actionable recommendations, each a complete sentence."]
}`
}

function cleanJson(text) {
  let t = text.trim()
  t = t.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '')
  return t.trim()
}

export async function generateObservationReport({ classDisplayName, teacherNames, period, observations }) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  if (!apiKey) {
    throw new Error("Groq API key is not configured. Add VITE_GROQ_API_KEY to your .env file and to Vercel's project environment variables.")
  }
  if (!observations?.length) {
    throw new Error('Select at least one observation to generate a report.')
  }

  const prompt = buildPrompt({ classDisplayName, teacherNames, period, observations })

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.6,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    throw new Error(`Groq API error (${res.status}): ${errBody || res.statusText}`)
  }

  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text) throw new Error('Groq returned an empty response. Please try again.')

  let parsed
  try {
    parsed = JSON.parse(cleanJson(text))
  } catch {
    throw new Error('Could not parse the AI response. Please try generating again.')
  }

  const categorySummaries = {}
  OBSERVATION_CATEGORIES.forEach(cat => {
    categorySummaries[cat.id] = parsed.categorySummaries?.[cat.id] || ''
  })

  return {
    categorySummaries,
    overallSummary: parsed.overallSummary || '',
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
  }
}
