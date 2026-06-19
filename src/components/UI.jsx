import { levelClass } from '../utils/helpers'

export function Spinner() {
  return <div className="spinner" />
}

export function PageSpinner({ label = 'Loading…' }) {
  return (
    <div className="spinner-page">
      <Spinner />
      <span>{label}</span>
    </div>
  )
}

export function StatCard({ label, value, icon, color = 'green', trend }) {
  return (
    <div className="stat-card">
      <div className={`icon-wrap icon-${color}`}><i className={`ti ti-${icon}`} /></div>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {trend && <div className="trend">{trend}</div>}
    </div>
  )
}

export function Pill({ label, cls = 'pill-gray', icon }) {
  return (
    <span className={`pill ${cls}`}>
      {icon && <i className={`ti ti-${icon}`} />}
      {label}
    </span>
  )
}

export function LevelBadge({ level }) {
  return <span className={`lvl ${levelClass(level)}`}>{level || '—'}</span>
}

export function EmptyState({ icon = 'inbox', message, actionLabel, onAction }) {
  return (
    <div className="empty">
      <i className={`ti ti-${icon}`} />
      <p>{message}</p>
      {actionLabel && (
        <button className="btn btn-primary" onClick={onAction}>{actionLabel}</button>
      )}
    </div>
  )
}

export function ProgressBarRow({ label, value, max = 3 }) {
  const pct = value === null || value === undefined ? 0 : Math.min(100, (value / max) * 100)
  const color = value >= 2.5 ? 'var(--green-600)' : value >= 1.5 ? 'var(--amber-600)' : 'var(--red-700)'
  return (
    <div className="progress-bar-wrap">
      <div className="progress-bar-label">
        <span>{label}</span>
        <span>{value === null || value === undefined ? '—' : value.toFixed(1)} / {max}</span>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export function Modal({ title, onClose, children, footer, wide }) {
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.() }}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn-icon" onClick={onClose}><i className="ti ti-x" /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
