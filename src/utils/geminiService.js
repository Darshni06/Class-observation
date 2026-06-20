import { OBSERVATION_CATEGORIES } from '../data/observationParams'
import { formatDate } from './helpers'

// Using Groq (console.groq.com) via its OpenAI-compatible Chat Completions
// endpoint. Groq has a free tier for hosted open models (Llama, etc).
// Get a key at https://console.groq.com/keys and set it as
// VITE_GROQ_API_KEY in your .env file (see .env.example).
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

function describeObservation(obs) {
  const lines = [`Observation on ${formatDate(obs.date)} (${obs.classDisplayName}, observed by ${obs.observerName}):`]
  OBSERVATION_CATEGORIES.forEach(cat => {
    const rows = cat.params
      .map(p => {
        const entry = obs.scores?.[cat.id]?.[p.id]
        if (!entry || (entry.level == null && !entry.remark)) return null
        const levelTxt = entry.level != null ? `Level ${entry.level}/3` : 'Not scored'
        const remarkTxt = entry.remark ? ` — Remark: ${entry.remark}` : ''
        return `  - ${p.name}: ${levelTxt}${remarkTxt}`
      })
      .filter(Boolean)
    if (rows.length) {
      lines.push(`[${cat.label}]`)
      lines.push(...rows)
    }
  })
  if (obs.positivePoints) lines.push(`Positive points noted: ${obs.positivePoints}`)
  if (obs.areasToImprove) lines.push(`Areas to improve noted: ${obs.areasToImprove}`)
  return lines.join('\n')
}

function buildPrompt({ classDisplayName, teacherNames, period, observations }) {
  const observationBlocks = observations.map(describeObservation).join('\n\n')

  return `You are an experienced Montessori pedagogical consultant writing a classroom observation report for a class's professional development file.

Write in a warm, specific, and constructive tone — the kind used in real Montessori classroom observation notes: grounded in concrete details (what children and the teachers actually did), encouraging of strengths, and gently direct about areas needing attention. Avoid generic corporate language. Avoid repeating raw level numbers in the prose; translate them into descriptive observations instead.

Class: ${classDisplayName}
Teacher(s): ${teacherNames.join(', ') || 'Not assigned'}
Reporting period: ${period}
Number of observations included: ${observations.length}

Here is the structured data gathered from classroom observations (category, parameter, level out of 3, and the observer's written remark):

${observationBlocks}

Respond with ONLY a JSON object (no markdown fences, no extra commentary) in exactly this shape:
{
  "overallSummary": "A 4-6 sentence narrative summary of the class's practice across the observation period, written in flowing prose.",
  "strengths": ["3 to 6 specific, evidence-based strengths, each a complete sentence."],
  "recommendations": ["3 to 6 specific, actionable, constructive recommendations, each a complete sentence."]
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
    throw new Error('Groq API key is not configured. Add VITE_GROQ_API_KEY to your .env file (and to Vercel\'s project environment variables).')
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
      messages: [
        { role: 'user', content: prompt },
      ],
    }),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    throw new Error(`Groq API error (${res.status}): ${errBody || res.statusText}`)
  }

  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text) {
    throw new Error('Groq returned an empty response. Please try again.')
  }

  let parsed
  try {
    parsed = JSON.parse(cleanJson(text))
  } catch {
    throw new Error('Could not parse the AI response. Please try generating again.')
  }

  return {
    overallSummary: parsed.overallSummary || '',
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
  }
}
