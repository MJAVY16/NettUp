import React, { useState, useMemo } from 'react';
import { Debt } from '../types';
import { formatCurrencyWithSymbol } from '../utils/formatters';
import { severityColor } from '../utils/debtHelpers';
import ProviderLogo, { PROVIDER_OPTIONS, PROVIDER_LABELS } from './ProviderLogo';
import InstallmentScheduleModal from './InstallmentScheduleModal';

interface InstallmentManagerProps {
  plans: Debt[];
  onAdd: (debt: Debt) => void;
  onUpdate: (id: string, updates: Partial<Debt>) => void;
  onDelete: (id: string) => void;
}

const emptyForm: Partial<Debt> = {
  name: '',
  type: 'payment-plan',
  provider: 'affirm',
  balance: 0,
  originalAmount: 0,
  totalPayments: 0,
  paymentsMade: 0,
  minimumPayment: 0,
  interestRate: 0,
  dueDate: 1,
  notes: ''
};

const InstallmentManager: React.FC<InstallmentManagerProps> = ({ plans, onAdd, onUpdate, onDelete }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Debt>>(emptyForm);
  const [sortBy, setSortBy] = useState<'balance' | 'progress' | 'payment' | 'due' | 'name' | 'servicer'>('due');
  const [viewingPlan, setViewingPlan] = useState<Debt | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdate(editingId, { ...formData, type: 'payment-plan' });
      setEditingId(null);
    } else {
      onAdd({ ...formData, type: 'payment-plan', id: Date.now().toString() } as Debt);
    }
    setFormData(emptyForm);
    setShowAddForm(false);
  };

  const handleEdit = (plan: Debt) => {
    // Coerce a missing provider to a concrete value so the dropdown's displayed
    // option matches state — otherwise saving keeps provider undefined (the
    // "P" fallback) unless the user re-picks. WYSIWYG.
    setFormData({ ...plan, provider: plan.provider || 'affirm' });
    setEditingId(plan.id);
    setShowAddForm(true);
  };

  const totalRemaining = plans.reduce((sum, p) => sum + p.balance, 0);
  const totalMonthly = plans.reduce((sum, p) => sum + (p.minimumPayment || 0), 0);

  const sortedPlans = useMemo(() => {
    const pct = (p: Debt) => (p.totalPayments && p.totalPayments > 0 ? (p.paymentsMade || 0) / p.totalPayments : 0);
    return [...plans].sort((a, b) => {
      switch (sortBy) {
        case 'balance': return b.balance - a.balance;
        case 'progress': return pct(b) - pct(a);
        case 'payment': return (b.minimumPayment || 0) - (a.minimumPayment || 0);
        case 'name': return a.name.localeCompare(b.name);
        case 'servicer': return (a.provider || 'other').localeCompare(b.provider || 'other');
        case 'due':
        default: return a.dueDate - b.dueDate;
      }
    });
  }, [plans, sortBy]);

  return (
    <div className="installment-manager">
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Installment Plans</h2>
          <button className="btn btn-primary" onClick={() => { setShowAddForm(!showAddForm); setEditingId(null); setFormData(emptyForm); }}>
            {showAddForm ? 'Cancel' : '+ Add Plan'}
          </button>
        </div>

        {plans.length > 0 && (
          <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {plans.length} {plans.length === 1 ? 'plan' : 'plans'} · Remaining{' '}
            <strong style={{ color: 'var(--danger-color)' }}>{formatCurrencyWithSymbol(totalRemaining)}</strong> · Monthly{' '}
            <strong>{formatCurrencyWithSymbol(totalMonthly)}</strong>
          </div>
        )}

        {showAddForm && (
          <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Plan Name</label>
                <input className="form-input" value={formData.name} required
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., MacBook Pro, Sofa" />
              </div>
              <div className="form-group">
                <label className="form-label">Servicer</label>
                <select className="form-select" value={formData.provider || 'affirm'}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value as Debt['provider'] })}>
                  {PROVIDER_OPTIONS.map(p => (
                    <option key={p} value={p}>{PROVIDER_LABELS[p]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Remaining Balance</label>
                <input type="number" className="form-input" min="0" step="0.01" required
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) })} />
              </div>
              <div className="form-group">
                <label className="form-label">Original Amount</label>
                <input type="number" className="form-input" min="0" step="0.01"
                  value={formData.originalAmount}
                  onChange={(e) => setFormData({ ...formData, originalAmount: parseFloat(e.target.value) })} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Total Payments</label>
                <input type="number" className="form-input" min="0"
                  value={formData.totalPayments}
                  onChange={(e) => setFormData({ ...formData, totalPayments: parseInt(e.target.value) })} />
              </div>
              <div className="form-group">
                <label className="form-label">Payments Made</label>
                <input type="number" className="form-input" min="0" max={formData.totalPayments || 999}
                  value={formData.paymentsMade}
                  onChange={(e) => setFormData({ ...formData, paymentsMade: parseInt(e.target.value) })} />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Amount</label>
                <input type="number" className="form-input" min="0" step="0.01"
                  value={formData.minimumPayment}
                  onChange={(e) => setFormData({ ...formData, minimumPayment: parseFloat(e.target.value) })} />
              </div>
              <div className="form-group">
                <label className="form-label">Due Day</label>
                <input type="number" className="form-input" min="1" max="31"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: parseInt(e.target.value) })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input className="form-input" value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary">{editingId ? 'Update Plan' : 'Add Plan'}</button>
          </form>
        )}

        {plans.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <select
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '11px' }}
            >
              <option value="due">Sort: Due Date</option>
              <option value="balance">Sort: Remaining</option>
              <option value="progress">Sort: Progress</option>
              <option value="payment">Sort: Payment</option>
              <option value="servicer">Sort: Servicer</option>
              <option value="name">Sort: Name</option>
            </select>
          </div>
        )}

        {plans.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Progress</th>
                <th>Remaining</th>
                <th>Payment</th>
                <th>Original</th>
                <th>Due</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sortedPlans.map(plan => {
                const total = plan.totalPayments || 0;
                const made = plan.paymentsMade || 0;
                const progress = total > 0 ? (made / total) * 100 : 0;
                const remaining = Math.max(0, total - made);
                // Less remaining -> greener.
                const color = severityColor(total > 0 ? 1 - made / total : 1);
                return (
                  <tr key={plan.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ProviderLogo provider={plan.provider || 'other'} size={26} />
                        <div>
                          <div style={{ fontWeight: 600 }}>{plan.name}</div>
                          <small style={{ color: 'var(--text-secondary)' }}>{PROVIDER_LABELS[plan.provider || 'other']}</small>
                        </div>
                      </div>
                    </td>
                    <td style={{ minWidth: '140px' }}>
                      <div className="progress-bar">
                        <div className="progress-bar-fill" style={{ width: `${Math.min(progress, 100)}%`, background: color }} />
                      </div>
                      <small style={{ color }}>{made}/{total} · {remaining} left</small>
                    </td>
                    <td style={{ color: 'var(--danger-color)' }}>{formatCurrencyWithSymbol(plan.balance)}</td>
                    <td>{formatCurrencyWithSymbol(plan.minimumPayment)}</td>
                    <td>{formatCurrencyWithSymbol(plan.originalAmount || 0)}</td>
                    <td>Day {plan.dueDate}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button className="btn btn-icon" title="View schedule" onClick={() => setViewingPlan(plan)}><i className="bi bi-calendar3"></i></button>
                        <button className="btn btn-icon" onClick={() => handleEdit(plan)}><i className="bi bi-pencil"></i></button>
                        <button className="btn btn-icon" onClick={() => onDelete(plan.id)}><i className="bi bi-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><i className="bi bi-calendar-check"></i></div>
            <div className="empty-state-text">No installment plans yet</div>
            <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>Add Your First Plan</button>
          </div>
        )}
      </div>

      {viewingPlan && (
        <InstallmentScheduleModal plan={viewingPlan} onClose={() => setViewingPlan(null)} />
      )}
    </div>
  );
};

export default InstallmentManager;
