import React, { useState } from 'react';
import { Income } from '../types';
import { formatCurrencyWithSymbol, calculateMonthlyAmount } from '../utils/formatters';

interface IncomeManagerProps {
  incomes: Income[];
  onAdd: (income: Income) => void;
  onUpdate: (id: string, updates: Partial<Income>) => void;
  onDelete: (id: string) => void;
}

const IncomeManager: React.FC<IncomeManagerProps> = ({ incomes, onAdd, onUpdate, onDelete }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Income>>({
    source: '',
    amount: 0,
    frequency: 'monthly',
    date: new Date().toISOString().split('T')[0],
    category: 'Salary',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdate(editingId, formData);
      setEditingId(null);
    } else {
      onAdd({
        ...formData,
        id: Date.now().toString()
      } as Income);
    }
    const defaultDate = new Date().toISOString().split('T')[0];
    setFormData({
      source: '',
      amount: 0,
      frequency: 'monthly',
      date: defaultDate,
      category: 'Salary',
      notes: ''
    });
    setShowAddForm(false);
  };

  const handleEdit = (income: Income) => {
    setFormData(income);
    setEditingId(income.id);
    setShowAddForm(true);
  };

  const calculateMonthlyIncome = (income: Income): number => {
    return calculateMonthlyAmount(income.amount, income.frequency);
  };

  const totalMonthlyIncome = incomes.reduce((sum, income) => sum + calculateMonthlyIncome(income), 0);
  const totalYearlyIncome = totalMonthlyIncome * 12;

  return (
    <div className="income-manager">
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Income Sources</h2>
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Cancel' : '+ Add Income'}
          </button>
        </div>

        <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Monthly Income</span>
            </div>
            <div className="stat-card-value">{formatCurrencyWithSymbol(totalMonthlyIncome)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Yearly Income</span>
            </div>
            <div className="stat-card-value">{formatCurrencyWithSymbol(totalYearlyIncome)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Income Sources</span>
            </div>
            <div className="stat-card-value">{incomes.length}</div>
          </div>
        </div>

        {showAddForm && (
          <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
            <div className="form-group">
              <label className="form-label">Income Source</label>
              <input
                type="text"
                className="form-input"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                required
                placeholder="e.g., Main Job, Freelancing"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Amount</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Frequency</label>
                <select
                  className="form-select"
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value as Income['frequency'] })}
                >
                  <option value="monthly">Monthly</option>
                  <option value="semi-monthly">Semi-monthly (1st & 15th)</option>
                  <option value="biweekly">Bi-weekly (Every 2 weeks)</option>
                  <option value="weekly">Weekly</option>
                  <option value="yearly">Yearly</option>
                  <option value="one-time">One-time</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Salary">Salary</option>
                <option value="Freelance">Freelance</option>
                <option value="Business">Business</option>
                <option value="Investment">Investment</option>
                <option value="Rental">Rental</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {formData.frequency === 'one-time' && (
              <div className="form-group">
                <label className="form-label">Date (for one-time income)</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
            )}
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
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Update Income' : 'Add Income'}
            </button>
          </form>
        )}

        {incomes.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Amount</th>
                <th>Frequency</th>
                <th>Category</th>
                <th>Monthly</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {incomes.map((income) => (
                <tr key={income.id}>
                  <td>{income.source}</td>
                  <td>{formatCurrencyWithSymbol(income.amount)}</td>
                  <td>
                    <span className="badge badge-primary">{income.frequency}</span>
                  </td>
                  <td>{income.category}</td>
                  <td>{formatCurrencyWithSymbol(calculateMonthlyIncome(income))}</td>
                  <td>
                    {income.frequency === 'one-time'
                      ? new Date(income.date).toLocaleDateString()
                      : 'Recurring'
                    }
                  </td>
                  <td>
                    <button
                      className="btn btn-icon"
                      onClick={() => handleEdit(income)}
                      style={{ marginRight: '0.5rem' }}
                    >
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button
                      className="btn btn-icon"
                      onClick={() => onDelete(income.id)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><i className="bi bi-currency-dollar"></i></div>
            <div className="empty-state-text">No income sources added yet</div>
            <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
              Add Your First Income
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default IncomeManager;