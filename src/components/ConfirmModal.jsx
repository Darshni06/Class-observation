import { Modal } from './UI'

export default function ConfirmModal({ title = 'Delete this item?', message, confirmLabel = 'Delete', onConfirm, onCancel, loading }) {
  return (
    <Modal title={title} onClose={onCancel} footer={
      <>
        <button className="btn" onClick={onCancel} disabled={loading}>Cancel</button>
        <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
          {loading ? 'Deleting…' : confirmLabel}
        </button>
      </>
    }>
      <div className="confirm-icon"><i className="ti ti-alert-triangle" /></div>
      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--gray-600)', lineHeight: 1.6 }}>
        {message || 'This action cannot be undone.'}
      </p>
    </Modal>
  )
}
