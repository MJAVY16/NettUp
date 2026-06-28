import React from 'react';
import { DuePayment } from '../utils/paymentHelpers';
import { formatCurrencyWithSymbol } from '../utils/formatters';

interface DuePaymentsModalProps {
  payments: DuePayment[];
  onConfirm: (due: DuePayment) => void;
  onConfirmAll: () => void;
  onDismiss: () => void;
}

const smallBtn: React.CSSProperties = { padding: '0.35rem 0.8rem', fontSize: '11px' };

const DuePaymentsModal: React.FC<DuePaymentsModalProps> = ({ payments, onConfirm, onConfirmAll, onDismiss }) => {
  if (payments.length === 0) return null;
  const total = payments.reduce((sum, p) => sum + p.totalAmount, 0);

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <span className="modal-title"><i className="bi bi-calendar-check"></i> Payments Due</span>
          <button className="btn btn-icon" onClick={onDismiss}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="modal-body">
          <p style={{ marginTop: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            These scheduled payments are now due. Confirm to apply them to your balances.
          </p>
          {payments.map(p => (
            <div key={p.debt.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              gap: '1rem', padding: '0.6rem 0', borderBottom: '1px solid var(--border-color)'
            }}>
              <div>
                <div style={{ fontWeight: 600 }}>{p.debt.name}</div>
                <small style={{ color: 'var(--text-secondary)' }}>
                  {p.cycles > 1
                    ? `${p.cycles} payments × ${formatCurrencyWithSymbol(p.amount)} = ${formatCurrencyWithSymbol(p.totalAmount)}`
                    : formatCurrencyWithSymbol(p.amount)}
                </small>
              </div>
              <button className="btn btn-primary" style={smallBtn} onClick={() => onConfirm(p)}>Confirm</button>
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onDismiss} style={{ border: '1px solid var(--border-color)' }}>Not now</button>
          <button className="btn btn-primary" onClick={onConfirmAll}>
            Confirm All ({formatCurrencyWithSymbol(total)})
          </button>
        </div>
      </div>
    </div>
  );
};

export default DuePaymentsModal;
