import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Debt } from '../types';
import { formatCurrencyWithSymbol } from '../utils/formatters';
import { severityColor } from '../utils/debtHelpers';

interface DebtManagerProps {
  debts: Debt[];
  onAdd: (debt: Debt) => void;
  onUpdate: (id: string, updates: Partial<Debt>) => void;
  onDelete: (id: string) => void;
}

const DebtManager: React.FC<DebtManagerProps> = ({ debts, onAdd, onUpdate, onDelete }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<Debt['type'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'type' | 'balance' | 'interest' | 'name'>('type');
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState<Partial<Debt>>({
    name: '',
    type: 'loan',
    balance: 0,
    originalAmount: 0,
    creditLimit: 0,
    interestRate: 0,
    minimumPayment: 0,
    dueDate: 1,
    totalPayments: 0,
    paymentsMade: 0,
    notes: ''
  });

  useEffect(() => {
    if (showAddForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showAddForm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdate(editingId, formData);
      setEditingId(null);
    } else {
      onAdd({
        ...formData,
        id: Date.now().toString()
      } as Debt);
    }
    setFormData({
      name: '',
      type: 'loan',
      balance: 0,
      originalAmount: 0,
      creditLimit: 0,
      interestRate: 0,
      minimumPayment: 0,
      dueDate: 1,
      totalPayments: 0,
      paymentsMade: 0,
      notes: ''
    });
    setShowAddForm(false);
  };

  const handleEdit = (debt: Debt) => {
    setFormData(debt);
    setEditingId(debt.id);
    setShowAddForm(true);
    setOpenMenuId(null);
  };

  const handleDuplicate = (debt: Debt) => {
    const { id, ...debtWithoutId } = debt;
    const duplicatedDebt = {
      ...debtWithoutId,
      id: Date.now().toString(),
      name: `${debt.name} (Copy)`
    };
    setOpenMenuId(null);
    onAdd(duplicatedDebt as Debt);
  };

  const totalDebt = debts.reduce((sum, debt) => sum + debt.balance, 0);
  const totalMinimumPayments = debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
  const averageInterestRate = debts.length > 0
    ? debts.reduce((sum, debt) => sum + debt.interestRate, 0) / debts.length
    : 0;

  const getDebtTypeColor = (type: Debt['type']): string => {
    const colors: Record<Debt['type'], string> = {
      'credit-card': 'danger',
      'loan': 'warning',
      'mortgage': 'primary',
      'auto': 'success',
      'student': 'primary',
      'personal': 'warning',
      'payment-plan': 'info',
      'other': 'secondary'
    };
    return colors[type] || 'secondary';
  };

  const getDebtTypeLabel = (type: Debt['type']): string => {
    const labels: Record<Debt['type'], string> = {
      'credit-card': 'Credit Card',
      'loan': 'Personal Loan',
      'mortgage': 'Mortgage',
      'auto': 'Auto Loan',
      'student': 'Student Loan',
      'personal': 'Personal',
      'payment-plan': 'Payment Plan',
      'other': 'Other'
    };
    return labels[type] || type;
  };

  // Filter and sort debts
  const filteredAndSortedDebts = useMemo(() => {
    let filtered = filterType === 'all' ? debts : debts.filter(d => d.type === filterType);

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'balance': return b.balance - a.balance;
        case 'interest': return b.interestRate - a.interestRate;
        case 'name': return a.name.localeCompare(b.name);
        case 'type':
        default: return a.type.localeCompare(b.type);
      }
    });
  }, [debts, filterType, sortBy]);

  const filterTypes: Array<{ value: Debt['type'] | 'all'; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'loan', label: 'Loans' },
    { value: 'mortgage', label: 'Mortgage' },
    { value: 'auto', label: 'Auto' },
    { value: 'student', label: 'Student' },
    { value: 'personal', label: 'Personal' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <div className="debt-manager">
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Debt Management</h2>
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Cancel' : '+ Add Debt'}
          </button>
        </div>

        <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Total Debt</span>
            </div>
            <div className="stat-card-value" style={{ color: 'var(--danger-color)' }}>
              {formatCurrencyWithSymbol(totalDebt)}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Monthly Payments</span>
            </div>
            <div className="stat-card-value">{formatCurrencyWithSymbol(totalMinimumPayments)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Avg Interest Rate</span>
            </div>
            <div className="stat-card-value">{averageInterestRate.toFixed(2)}%</div>
          </div>
        </div>

        {showAddForm && (
          <form ref={formRef} onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
            <div className="form-group">
              <label className="form-label">Debt Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Chase Credit Card, Car Loan, Affirm"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select
                  className="form-select"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Debt['type'] })}
                >
                  <option value="loan">Personal Loan</option>
                  <option value="mortgage">Mortgage</option>
                  <option value="auto">Auto Loan</option>
                  <option value="student">Student Loan</option>
                  <option value="personal">Personal</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Current Balance</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.balance}
                  onChange={(e) => {
                    const newBalance = parseFloat(e.target.value);
                    const updates: Partial<Debt> = { balance: newBalance };
                    // Auto-recalculate paymentsMade for payment plans
                    if (formData.type === 'payment-plan' && formData.minimumPayment && formData.minimumPayment > 0 && formData.totalPayments) {
                      const paymentsNeeded = Math.ceil(newBalance / formData.minimumPayment);
                      updates.paymentsMade = Math.max(0, formData.totalPayments - paymentsNeeded);
                    }
                    setFormData({ ...formData, ...updates });
                  }}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">
                  {formData.type === 'credit-card' ? 'Credit Limit' : 'Original Amount'}
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.type === 'credit-card' ? formData.creditLimit : formData.originalAmount}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (formData.type === 'credit-card') {
                      setFormData({ ...formData, creditLimit: value });
                    } else {
                      setFormData({ ...formData, originalAmount: value });
                    }
                  }}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Interest Rate (%)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: parseFloat(e.target.value) })}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Minimum Payment</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.minimumPayment}
                  onChange={(e) => setFormData({ ...formData, minimumPayment: parseFloat(e.target.value) })}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            {formData.type === 'payment-plan' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Total Number of Payments</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.totalPayments}
                      onChange={(e) => setFormData({ ...formData, totalPayments: parseInt(e.target.value) })}
                      min="1"
                      placeholder="e.g., 12 monthly payments"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payments Made So Far</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.paymentsMade}
                      onChange={(e) => setFormData({ ...formData, paymentsMade: parseInt(e.target.value) })}
                      min="0"
                      max={formData.totalPayments || 999}
                      placeholder="e.g., 3"
                    />
                  </div>
                </div>
                {formData.minimumPayment && formData.minimumPayment > 0 && (
                  <div style={{
                    padding: '1rem',
                    background: 'color-mix(in srgb, var(--info-color) 5%, transparent)',
                    border: '1px solid var(--info-color)',
                    borderRadius: '4px',
                    marginTop: '0.5rem',
                    marginBottom: '1.5rem',
                    fontFamily: 'var(--font-family)',
                    fontSize: '11px'
                  }}>
                    <div style={{ marginBottom: '0.5rem', color: 'var(--info-color)', fontWeight: 600 }}>
                      <i className="bi bi-calculator"></i> SMART CALCULATOR
                    </div>
                    {(() => {
                      const paymentsRemaining = (formData.totalPayments || 0) - (formData.paymentsMade || 0);
                      const calculatedBalance = paymentsRemaining * formData.minimumPayment;
                      const calculatedPayments = formData.balance && formData.balance > 0
                        ? Math.ceil(formData.balance / formData.minimumPayment)
                        : 0;

                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '12px' }}>
                          <div>
                            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                              Payments Remaining: <strong style={{ color: 'var(--text-primary)' }}>{paymentsRemaining}</strong>
                            </div>
                            <div style={{ color: 'var(--text-dim)' }}>
                              Calculated Balance: <strong style={{ color: 'var(--info-color)' }}>
                                {formatCurrencyWithSymbol(calculatedBalance)}
                              </strong>
                            </div>
                            {Math.abs(calculatedBalance - (formData.balance || 0)) > 0.01 && (
                              <button
                                type="button"
                                className="btn btn-sm"
                                style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '12px', background: 'var(--info-color)', border: 'none' }}
                                onClick={() => setFormData({ ...formData, balance: calculatedBalance })}
                              >
                                <i className="bi bi-arrow-repeat"></i> Use This Balance
                              </button>
                            )}
                          </div>
                          <div>
                            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                              Based on Balance: <strong style={{ color: 'var(--text-primary)' }}>
                                {formatCurrencyWithSymbol(formData.balance || 0)}
                              </strong>
                            </div>
                            <div style={{ color: 'var(--text-dim)' }}>
                              Payments Needed: <strong style={{ color: 'var(--info-color)' }}>
                                {calculatedPayments} payments
                              </strong>
                            </div>
                            {calculatedPayments > 0 && calculatedPayments !== paymentsRemaining && (
                              <button
                                type="button"
                                className="btn btn-sm"
                                style={{ marginTop: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '12px', background: 'var(--info-color)', border: 'none' }}
                                onClick={() => setFormData({
                                  ...formData,
                                  totalPayments: calculatedPayments + (formData.paymentsMade || 0)
                                })}
                              >
                                <i className="bi bi-arrow-repeat"></i> Set Total Payments
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Due Date (Day of Month)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: parseInt(e.target.value) })}
                  required
                  min="1"
                  max="31"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Notes (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional details..."
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Update Debt' : 'Add Debt'}
            </button>
          </form>
        )}

        {/* Filter & Sort Bar */}
        {debts.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
              {filterTypes.map(ft => {
                const count = ft.value === 'all' ? debts.length : debts.filter(d => d.type === ft.value).length;
                if (ft.value !== 'all' && count === 0) return null;
                return (
                  <button
                    key={ft.value}
                    className={`btn btn-sm ${filterType === ft.value ? 'btn-primary' : ''}`}
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '11px',
                      opacity: filterType === ft.value ? 1 : 0.6
                    }}
                    onClick={() => setFilterType(ft.value)}
                  >
                    {ft.label} ({count})
                  </button>
                );
              })}
            </div>
            <select
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '11px' }}
            >
              <option value="type">Sort: Type</option>
              <option value="balance">Sort: Balance</option>
              <option value="interest">Sort: Interest Rate</option>
              <option value="name">Sort: Name</option>
            </select>
          </div>
        )}

        {filteredAndSortedDebts.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Balance</th>
                <th>Interest Rate</th>
                <th>Min Payment</th>
                <th>Progress</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedDebts.map((debt) => {
                let progress = 0;
                let progressLabel = '';
                let progressColor = '';

                if (debt.type === 'credit-card' && debt.creditLimit) {
                  // Credit utilization: the more of the limit used, the redder.
                  progress = (debt.balance / debt.creditLimit) * 100;
                  progressLabel = `${progress.toFixed(0)}% used`;
                  progressColor = severityColor(debt.balance / debt.creditLimit);
                } else if (debt.type === 'payment-plan' && debt.totalPayments && debt.paymentsMade !== undefined) {
                  // Payment plan: the fewer payments remaining, the greener.
                  progress = (debt.paymentsMade / debt.totalPayments) * 100;
                  progressLabel = `${debt.paymentsMade}/${debt.totalPayments} payments`;
                  progressColor = severityColor(1 - debt.paymentsMade / debt.totalPayments);
                } else if (debt.originalAmount) {
                  // Other debts: the less balance remaining, the greener.
                  progress = ((debt.originalAmount - debt.balance) / debt.originalAmount) * 100;
                  progressLabel = `${progress.toFixed(0)}% paid`;
                  progressColor = severityColor(debt.balance / debt.originalAmount);
                }

                return (
                  <tr key={debt.id}>
                    <td>{debt.name}</td>
                    <td>
                      <span className={`badge badge-${getDebtTypeColor(debt.type)}`}>
                        {getDebtTypeLabel(debt.type)}
                      </span>
                    </td>
                    <td style={{ color: 'var(--danger-color)' }}>
                      {formatCurrencyWithSymbol(debt.balance)}
                    </td>
                    <td>{debt.interestRate}%</td>
                    <td>{formatCurrencyWithSymbol(debt.minimumPayment)}</td>
                    <td>
                      {(progress > 0 || progressLabel) ? (
                        <div style={{ width: '120px' }}>
                          <div className="progress-bar">
                            <div
                              className="progress-bar-fill"
                              style={{ width: `${Math.min(progress, 100)}%`, background: progressColor }}
                            />
                          </div>
                          <small>{progressLabel}</small>
                        </div>
                      ) : null}
                    </td>
                    <td>Day {debt.dueDate}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button className="btn btn-icon" onClick={() => handleEdit(debt)}>
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button className="btn btn-icon" onClick={() => onDelete(debt.id)}>
                          <i className="bi bi-trash"></i>
                        </button>
                        <div style={{ position: 'relative' }}>
                          <button
                            className="btn btn-icon"
                            onClick={() => setOpenMenuId(openMenuId === debt.id ? null : debt.id)}
                          >
                            <i className="bi bi-three-dots-vertical"></i>
                          </button>
                          {openMenuId === debt.id && (
                            <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                              <button
                                className="dropdown-menu-item"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicate(debt);
                                }}
                              >
                                <i className="bi bi-files"></i> Duplicate
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : debts.length > 0 ? (
          <div className="empty-state">
            <div className="empty-state-text">No debts match the current filter</div>
            <button className="btn btn-primary" onClick={() => setFilterType('all')}>
              Show All Debts
            </button>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><i className="bi bi-credit-card-2-back"></i></div>
            <div className="empty-state-text">No debts added yet</div>
            <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
              Add Your First Debt
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebtManager;
