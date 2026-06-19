import { format, parseISO, isValid } from 'date-fns'

export const formatDate = (isoDate, pattern = 'dd MMM yyyy') => {
  if (!isoDate) return '—'
  try {
    const d = parseISO(isoDate)
    return isValid(d) ? format(d, pattern) : isoDate
  } catch {
    return isoDate
  }
}

export const formatTime = (time24) => {
  if (!time24) return '—'
  const [h, m] = time24.split(':').map(Number)
  if (Number.isNaN(h)) return time24
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

export const formatDateTime = (ts) => {
  if (!ts?.seconds) return '—'
  return format(new Date(ts.seconds * 1000), 'dd MMM yyyy, h:mm a')
}

export const round1 = (n) => (n === null || n === undefined ? null : Math.round(n * 10) / 10)

// Observation status pill: draft | complete | partial
export const observationStatus = (obs) => {
  if (obs.status !== 'published') return { key: 'draft', label: 'Draft', cls: 'pill-gray' }
  if (obs.fullyScored) return { key: 'complete', label: 'Complete', cls: 'pill-green' }
  return { key: 'partial', label: 'Partial', cls: 'pill-amber' }
}

export const levelClass = (level) => {
  if (level === 3) return 'lvl-3'
  if (level === 2) return 'lvl-2'
  if (level === 1) return 'lvl-1'
  return 'lvl-0'
}

export const initials = (name = '') =>
  name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'

export const todayISO = () => format(new Date(), 'yyyy-MM-dd')

export const nowTime24 = () => format(new Date(), 'HH:mm')
