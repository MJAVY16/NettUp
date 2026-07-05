import React from 'react';
import { Debt } from '../types';
import { formatCurrencyWithSymbol, getCurrencyConfig } from '../utils/formatters';
import { getNextPaymentDate } from '../utils/dateHelpers';
import ProviderLogo, { PROVIDER_LABELS } from './ProviderLogo';

interface InstallmentScheduleModalProps {
  plan: Debt;
  onClose: () => void;
}

interface ScheduleRow {
  index: number;   // 0-based payment number
  date: Date;
  amount: number;
  paid: boolean;
  isNext: boolean;
}

/**
 * Reconstructs an Affirm-style payment schedule from the stored plan fields.
 *
 * The app doesn't record each historical payment date, so dates are derived
 * from the due day: the payment at index `paymentsMade` lands on the next due
 * date, earlier ones step backward a month each, later ones step forward.
 * Upcoming amounts are sized so they sum exactly to the remaining balance
 * (the final payment absorbs the rounding remainder, as Affirm does).
 */
function buildSchedule(plan: Debt, today: Date): ScheduleRow[] {
  const total = plan.totalPayments || 0;
  if (total <= 0) return [];
  const made = Math.min(Math.max(plan.paymentsMade || 0, 0), total);
  const payment = plan.minimumPayment || 0;
  const remainingCount = total - made;

  const nextDue = getNextPaymentDate(plan.dueDate, today); // date of payment index `made`
  const anchorY = nextDue.getFullYear();
  const anchorM = nextDue.getMonth();
  const clampDay = (y: number, m: number) => Math.min(plan.dueDate, new Date(y, m + 1, 0).getDate());
  const dateFor = (i: number) => {
    const d = new Date(anchorY, anchorM + (i - made), 1);
    return new Date(d.getFullYear(), d.getMonth(), clampDay(d.getFullYear(), d.getMonth()));
  };

  const rows: ScheduleRow[] = [];
  for (let i = 0; i < total; i++) {
    const paid = i < made;
    let amount = payment;
    if (!paid) {
      const j = i - made; // position within the remaining payments
      amount = j === remainingCount - 1
        ? Math.max(0, plan.balance - payment * (remainingCount - 1))
        : payment;
    }
    rows.push({ index: i, date: dateFor(i), amount, paid, isNext: i === made });
  }
  return rows;
}

const InstallmentScheduleModal: React.FC<InstallmentScheduleModalProps> = ({ plan, onClose }) => {
  const rows = buildSchedule(plan, new Date());
  const locale = getCurrencyConfig().locale;
  const fmtDate = (d: Date) => d.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });

  const total = plan.totalPayments || 0;
  const made = Math.min(Math.max(plan.paymentsMade || 0, 0), total);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ProviderLogo provider={plan.provider || 'other'} size={22} />
            {plan.name}
          </span>
          <button className="btn btn-icon" onClick={onClose}><i className="bi bi-x-lg"></i></button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              {PROVIDER_LABELS[plan.provider || 'other']} · {made} of {total} paid
            </span>
            <span>
              Remaining <strong style={{ color: 'var(--danger-color)' }}>{formatCurrencyWithSymbol(plan.balance)}</strong>
            </span>
          </div>

          {rows.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-text">
                Add the total number of payments to this plan to see its schedule.
              </div>
            </div>
          ) : (
            <div>
              {rows.map(row => (
                <div
                  key={row.index}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)'
                  }}
                >
                  <i
                    className={`bi ${row.paid ? 'bi-check-circle-fill' : row.isNext ? 'bi-arrow-right-circle-fill' : 'bi-circle'}`}
                    style={{ color: row.paid ? 'var(--success-color)' : row.isNext ? 'var(--primary-color)' : 'var(--text-dim)', fontSize: '1rem' }}
                  ></i>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: row.isNext ? 600 : 400,
                      textDecoration: row.paid ? 'line-through' : 'none',
                      color: row.paid ? 'var(--text-dim)' : 'var(--text-primary)'
                    }}>
                      {fmtDate(row.date)}
                    </div>
                    <small style={{ color: 'var(--text-secondary)' }}>
                      Payment {row.index + 1} of {total}
                      {row.paid ? ' · Paid' : row.isNext ? ' · Next due' : ''}
                    </small>
                  </div>
                  <div style={{
                    textDecoration: row.paid ? 'line-through' : 'none',
                    color: row.paid ? 'var(--text-dim)' : 'var(--text-primary)',
                    fontWeight: 600
                  }}>
                    {formatCurrencyWithSymbol(row.amount)}
                  </div>
                </div>
              ))}
              <div style={{ marginTop: '0.75rem', fontSize: '11px', color: 'var(--text-dim)' }}>
                <i className="bi bi-info-circle"></i> Dates are estimated from the due day (day {plan.dueDate} of each month).
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default InstallmentScheduleModal;
