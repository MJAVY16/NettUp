import React, { useState } from 'react';
import { Budget, Expense } from '../types';
import { formatCurrencyWithSymbol } from '../utils/formatters';
import { calculateBudgetSpent, monthlyAllocated } from '../utils/budgetHelpers';
import { EXPENSE_CATEGORIES } from '../utils/categories';

interface BudgetManagerProps {
  budgets: Budget[];
  expenses: Expense[];
  onAdd: (budget: Budget) => void;
  onUpdate: (id: string, updates: Partial<Budget>) => void;
  onDelete: (id: string) => void;
}

const BudgetManager: React.FC<BudgetManagerProps> = ({ budgets, expenses, onAdd, onUpdate, onDelete }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Budget>>({
    category: '',
    allocated: 0,
    period: 'monthly'
  });

  const categories = EXPENSE_CATEGORIES;

  // Spent is always derived from the live expense list (never stored), scaled
  // to the budget's own period so it lines up with `allocated`.
  const calculateSpent = (category: string, period: Budget['period']): number =>
    calculateBudgetSpent(expenses, category, period);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      onUpdate(editingId, { ...formData });
      setEditingId(null);
    } else {
      onAdd({
        ...formData,
        id: Date.now().toString()
      } as Budget);
    }
    setFormData({
      category: '',
      allocated: 0,
      period: 'monthly'
    });
    setShowAddForm(false);
  };

  const handleEdit = (budget: Budget) => {
    setFormData(budget);
    setEditingId(budget.id);
    setShowAddForm(true);
  };

  // Totals are summed on a common monthly basis so monthly and yearly budgets
  // can be combined meaningfully.
  const totalAllocated = budgets.reduce((sum, budget) => sum + monthlyAllocated(budget), 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + calculateSpent(budget.category, 'monthly'), 0);
  const remaining = totalAllocated - totalSpent;

  return (
    <div className="budget-manager">
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Budget Planning</h2>
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Cancel' : '+ Add Budget'}
          </button>
        </div>

        <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Total Budget (Monthly)</span>
            </div>
            <div className="stat-card-value">{formatCurrencyWithSymbol(totalAllocated)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Total Spent (Monthly)</span>
            </div>
            <div className="stat-card-value">{formatCurrencyWithSymbol(totalSpent)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Remaining</span>
            </div>
            <div className="stat-card-value" style={{
              color: remaining >= 0 ? 'var(--success-color)' : 'var(--danger-color)'
            }}>
              {formatCurrencyWithSymbol(remaining)}
            </div>
          </div>
        </div>

        {showAddForm && (
          <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Allocated Amount</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.allocated}
                  onChange={(e) => setFormData({ ...formData, allocated: parseFloat(e.target.value) })}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Period</label>
                <select
                  className="form-select"
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value as Budget['period'] })}
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Update Budget' : 'Add Budget'}
            </button>
          </form>
        )}

        {budgets.length > 0 ? (
          <div>
            {budgets.map((budget) => {
              const updatedSpent = calculateSpent(budget.category, budget.period);
              const percentage = budget.allocated > 0 ? (updatedSpent / budget.allocated) * 100 : 0;
              const isOverBudget = updatedSpent > budget.allocated;

              return (
                <div key={budget.id} style={{
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  background: 'var(--surface-color)',
                  borderRadius: '8px',
                  border: `1px solid ${isOverBudget ? 'var(--danger-color)' : 'var(--border-color)'}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <h4 style={{ margin: 0 }}>{budget.category}</h4>
                      <small style={{ color: 'var(--text-secondary)' }}>
                        {budget.period === 'monthly' ? 'Monthly' : 'Yearly'} Budget
                      </small>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-icon"
                        onClick={() => handleEdit(budget)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-icon"
                        onClick={() => onDelete(budget.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span>
                        {formatCurrencyWithSymbol(updatedSpent)} / {formatCurrencyWithSymbol(budget.allocated)}
                      </span>
                      <span style={{
                        color: isOverBudget ? 'var(--danger-color)' : percentage > 80 ? 'var(--warning-color)' : 'var(--success-color)',
                        fontWeight: 600
                      }}>
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${Math.min(percentage, 100)}%`,
                          background: isOverBudget ? 'var(--danger-color)' : percentage > 80 ? 'var(--warning-color)' : 'var(--success-color)'
                        }}
                      />
                    </div>
                  </div>

                  {isOverBudget && (
                    <div style={{
                      marginTop: '0.5rem',
                      padding: '0.5rem',
                      background: 'rgba(231, 76, 60, 0.1)',
                      borderRadius: '4px',
                      color: 'var(--danger-color)',
                      fontSize: '0.875rem'
                    }}>
                      <i className="bi bi-exclamation-triangle"></i> Over budget by {formatCurrencyWithSymbol(updatedSpent - budget.allocated)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><i className="bi bi-list-check"></i></div>
            <div className="empty-state-text">No budgets created yet</div>
            <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
              Create Your First Budget
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetManager;