import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
} from 'docx'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import { formatDate } from './helpers'
import { OBSERVATION_CATEGORIES } from '../data/observationParams'

const GREEN = '0F6E56'
const GREEN_DARK = '085041'
const GRAY = '5F5E5A'

const metaCell = (label, value) => new TableCell({
  width: { size: 50, type: WidthType.PERCENTAGE },
  borders: noBorders(),
  margins: { top: 60, bottom: 60, left: 0, right: 100 },
  children: [
    new Paragraph({ children: [new TextRun({ text: label.toUpperCase(), size: 16, color: '888780', bold: true })] }),
    new Paragraph({ children: [new TextRun({ text: value || '—', size: 22, bold: true, color: '1A1A1A' })], spacing: { before: 40 } }),
  ],
})

function noBorders() {
  const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
  return { top: none, bottom: none, left: none, right: none }
}

const bulletParagraphs = (items, color = '1A1A1A') =>
  (items && items.length ? items : ['—']).map(text => new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 100 },
    children: [new TextRun({ text, size: 22, color })],
  }))

// Builds a docx.Document for one report
export function buildReportDocument(report) {
  const sections = []

  sections.push(
    new Paragraph({
      children: [new TextRun({ text: 'KAMALA NIKETAN', bold: true, size: 20, color: GREEN, characterSpacing: 20 })],
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Class Observation Report', bold: true, size: 36, color: '1A1A1A' })],
      spacing: { before: 100, after: 200 },
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: noBorders(),
      rows: [
        new TableRow({ children: [metaCell('Teacher(s)', (report.teacherNames || []).join(', ')), metaCell('Class', report.classDisplayName)] }),
        new TableRow({ children: [metaCell('Period', report.period), metaCell('Observations covered', String(report.observationIds?.length || 0))] }),
        new TableRow({ children: [metaCell('Overall average score', report.avgScore != null ? `${report.avgScore.toFixed(1)} / 3` : '—'), metaCell('Generated on', formatDate(new Date().toISOString().slice(0, 10)))] }),
      ],
    }),
    new Paragraph({ text: '', spacing: { after: 200 } }),
    ...OBSERVATION_CATEGORIES.flatMap(cat => {
      const text = report.categorySummaries?.[cat.id]
      if (!text) return []
      return [
        new Paragraph({
          children: [new TextRun({ text: cat.label.toUpperCase(), bold: true, size: 22, color: GREEN_DARK, characterSpacing: 10 })],
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E1F5EE' } },
          spacing: { after: 120 },
        }),
        new Paragraph({
          children: [new TextRun({ text, size: 22, color: '2C2C2A' })],
          spacing: { after: 240 },
        }),
      ]
    }),
    new Paragraph({
      children: [new TextRun({ text: 'OVERALL SUMMARY', bold: true, size: 22, color: GREEN_DARK, characterSpacing: 10 })],
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E1F5EE' } },
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [new TextRun({ text: report.overallSummary || 'No summary available.', size: 22, color: '2C2C2A' })],
      spacing: { after: 240 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'STRENGTHS', bold: true, size: 22, color: GREEN_DARK, characterSpacing: 10 })],
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E1F5EE' } },
      spacing: { after: 120 },
    }),
    ...bulletParagraphs(report.strengths),
    new Paragraph({ text: '', spacing: { after: 120 } }),
    new Paragraph({
      children: [new TextRun({ text: 'RECOMMENDATIONS', bold: true, size: 22, color: GREEN_DARK, characterSpacing: 10 })],
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E1F5EE' } },
      spacing: { after: 120 },
    }),
    ...bulletParagraphs(report.recommendations),
    new Paragraph({ text: '', spacing: { after: 300 } }),
    new Paragraph({
      children: [new TextRun({ text: 'Kamala Niketan Class Observation Portal — AI-assisted summary generated from structured classroom observations.', size: 16, italics: true, color: GRAY })],
    }),
  )

  return new Document({
    sections: [{
      properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
      children: sections,
    }],
  })
}

const safeFilename = (s) => (s || 'report').replace(/[^a-z0-9-_ ]/gi, '').trim().replace(/\s+/g, '-')

export async function exportReportToWord(report) {
  const doc = buildReportDocument(report)
  const blob = await Packer.toBlob(doc)
  const name = `${safeFilename(report.classDisplayName)}-${safeFilename(report.period)}.docx`
  saveAs(blob, name)
}

// Bundles multiple reports into a single .zip of .docx files
export async function exportReportsToZip(reports, zipName = 'report-cards.zip') {
  const zip = new JSZip()
  for (const report of reports) {
    const doc = buildReportDocument(report)
    const blob = await Packer.toBlob(doc)
    const name = `${safeFilename(report.classDisplayName)}-${safeFilename(report.period)}.docx`
    zip.file(name, blob)
  }
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  saveAs(zipBlob, zipName)
}
