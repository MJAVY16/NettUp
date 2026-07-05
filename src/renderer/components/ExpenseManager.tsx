import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Expense } from '../types';
import { formatCurrencyWithSymbol, calculateMonthlyAmount } from '../utils/formatters';
import { EXPENSE_CATEGORIES } from '../utils/categories';

interface ExpenseManagerProps {
  expenses: Expense[];
  onAdd: (expense: Expense) => void;
  onUpdate: (id: string, updates: Partial<Expense>) => void;
  onDelete: (id: string) => void;
}

const ExpenseManager: React.FC<ExpenseManagerProps> = ({ expenses, onAdd, onUpdate, onDelete }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'recurring' | 'one-time'>('all');
  const [showPaid, setShowPaid] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'amount'>('name');
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState<Partial<Expense>>({
    name: '',
    amount: 0,
    category: 'Food',
    frequency: 'monthly',
    date: new Date().toISOString().split('T')[0],
    isEssential: false,
    isSubscription: false,
    isPaid: false,
    notes: ''
  });

  const categories = EXPENSE_CATEGORIES;

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
      } as Expense);
    }
    setFormData({
      name: '',
      amount: 0,
      category: 'Food',
      frequency: 'monthly',
      date: new Date().toISOString().split('T')[0],
      isEssential: false,
      isSubscription: false,
      isPaid: false,
      notes: ''
    });
    setShowAddForm(false);
  };

  const handleEdit = (expense: Expense) => {
    setFormData(expense);
    setEditingId(expense.id);
    setShowAddForm(true);
    setOpenMenuId(null);
  };

  const handleDuplicate = (expense: Expense) => {
    const { id, ...expenseWithoutId } = expense;
    const duplicatedExpense = {
      ...expenseWithoutId,
      id: Date.now().toString(),
      name: `${expense.name} (Copy)`
    };
    setOpenMenuId(null);
    onAdd(duplicatedExpense as Expense);
  };

  const calculateMonthlyExpense = (expense: Expense): number => {
    return calculateMonthlyAmount(expense.amount, expense.frequency);
  };

  const totalMonthlyExpenses = expenses.reduce((sum, expense) => sum + calculateMonthlyExpense(expense), 0);
  const essentialExpenses = expenses.filter(e => e.isEssential).reduce((sum, expense) => sum + calculateMonthlyExpense(expense), 0);
  const nonEssentialExpenses = totalMonthlyExpenses - essentialExpenses;

  const paidCount = expenses.filter(e => e.frequency === 'one-time' && e.isPaid).length;

  // Filter and sort
  const filteredAndSortedExpenses = useMemo(() => {
    let filtered = expenses;

    if (filterType === 'recurring') {
      filtered = filtered.filter(e => e.frequency !== 'one-time');
    } else if (filterType === 'one-time') {
      filtered = filtered.filter(e => e.frequency === 'one-time');
    }

    if (!showPaid) {
      filtered = filtered.filter(e => !(e.frequency === 'one-time' && e.isPaid));
    }

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'category': return a.category.localeCompare(b.category);
        case 'amount': return calculateMonthlyExpense(b) - calculateMonthlyExpense(a);
        case 'name':
        default: return a.name.localeCompare(b.name);
      }
    });
  }, [expenses, filterType, showPaid, sortBy]);

  const formatFrequencyLabel = (freq: string): string => {
    const labels: Record<string, string> = {
      'weekly': 'Weekly',
      'biweekly': 'Bi-weekly',
      'semi-monthly': 'Semi-monthly',
      'monthly': 'Monthly',
      'every-2-months': 'Every 2 Months',
      'quarterly': 'Quarterly',
      'every-4-months': 'Every 4 Months',
      'every-6-months': 'Every 6 Months',
      'yearly': 'Yearly',
      'one-time': 'One-time'
    };
    return labels[freq] || freq;
  };

  return (
    <div className="expense-manager">
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Expense Tracking</h2>
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Cancel' : '+ Add Expense'}
          </button>
        </div>

        <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Total Expenses</span>
            </div>
            <div className="stat-card-value">{formatCurrencyWithSymbol(totalMonthlyExpenses)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Essential</span>
            </div>
            <div className="stat-card-value">{formatCurrencyWithSymbol(essentialExpenses)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Non-Essential</span>
            </div>
            <div className="stat-card-value">{formatCurrencyWithSymbol(nonEssentialExpenses)}</div>
          </div>
        </div>

        {showAddForm && (
          <form ref={formRef} onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
            <div className="form-group">
              <label className="form-label">Expense Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Groceries, Netflix, Gym"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
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
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Frequency</label>
                <select
                  className="form-select"
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value as Expense['frequency'] })}
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly (Every 2 weeks)</option>
                  <option value="semi-monthly">Semi-monthly (1st & 15th)</option>
                  <option value="monthly">Monthly</option>
                  <option value="every-2-months">Every 2 Months</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="every-4-months">Every 4 Months</option>
                  <option value="every-6-months">Every 6 Months</option>
                  <option value="yearly">Yearly</option>
                  <option value="one-time">One-time</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: '1rem', alignItems: 'center' }}>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isEssential}
                    onChange={(e) => setFormData({ ...formData, isEssential: e.target.checked })}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Essential
                </label>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.isSubscription}
                    onChange={(e) => setFormData({ ...formData, isSubscription: e.target.checked })}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Subscription
                </label>
              </div>
              {formData.frequency === 'one-time' && (
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.isPaid}
                      onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                      style={{ marginRight: '0.5rem' }}
                    />
                    Paid
                  </label>
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
            </div>
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Update Expense' : 'Add Expense'}
            </button>
          </form>
        )}

        {/* Filter & Sort Bar */}
        {expenses.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
              {(['all', 'recurring', 'one-time'] as const).map(ft => (
                <button
                  key={ft}
                  className={`btn btn-sm ${filterType === ft ? 'btn-primary' : ''}`}
                  style={{ padding: '0.25rem 0.5rem', fontSize: '11px', opacity: filterType === ft ? 1 : 0.6 }}
                  onClick={() => setFilterType(ft)}
                >
                  {ft === 'all' ? 'All' : ft === 'recurring' ? 'Recurring' : 'One-time'}
                </button>
              ))}
              <span style={{ margin: '0 0.25rem', color: 'var(--text-dim)' }}>|</span>
              <button
                className={`btn btn-sm ${showPaid ? 'btn-primary' : ''}`}
                style={{ padding: '0.25rem 0.5rem', fontSize: '11px', opacity: showPaid ? 1 : 0.6 }}
                onClick={() => setShowPaid(!showPaid)}
              >
                Show Paid ({paidCount})
              </button>
            </div>
            <select
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '11px' }}
            >
              <option value="name">Sort: Name</option>
              <option value="category">Sort: Category</option>
              <option value="amount">Sort: Monthly Amount</option>
            </select>
          </div>
        )}

        {filteredAndSortedExpenses.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Frequency</th>
                <th>Monthly</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedExpenses.map((expense) => (
                <tr key={expense.id} style={{
                  opacity: expense.frequency === 'one-time' && expense.isPaid ? 0.5 : 1
                }}>
                  <td>
                    <span>{expense.name}</span>
                    {expense.isSubscription && (
                      <span className="badge badge-info" style={{ marginLeft: '0.5rem', fontSize: '9px', padding: '0.1rem 0.3rem' }}>SUB</span>
                    )}
                    {expense.frequency === 'one-time' && expense.isPaid && (
                      <span className="badge badge-success" style={{ marginLeft: '0.5rem', fontSize: '9px', padding: '0.1rem 0.3rem' }}>PAID</span>
                    )}
                  </td>
                  <td>{expense.category}</td>
                  <td>{formatCurrencyWithSymbol(expense.amount)}</td>
                  <td>
                    <span className="badge badge-primary">{formatFrequencyLabel(expense.frequency)}</span>
                  </td>
                  <td>{formatCurrencyWithSymbol(calculateMonthlyExpense(expense))}</td>
                  <td>
                    <span className={`badge badge-${expense.isEssential ? 'warning' : 'success'}`}>
                      {expense.isEssential ? 'Essential' : 'Non-Essential'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {expense.frequency === 'one-time' && !expense.isPaid && (
                        <button
                          className="btn btn-icon"
                          title="Mark as Paid"
                          onClick={() => onUpdate(expense.id, { isPaid: true })}
                        >
                          <i className="bi bi-check-circle"></i>
                        </button>
                      )}
                      <button className="btn btn-icon" onClick={() => handleEdit(expense)}>
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button className="btn btn-icon" onClick={() => onDelete(expense.id)}>
                        <i className="bi bi-trash"></i>
                      </button>
                      <div style={{ position: 'relative' }}>
                        <button
                          className="btn btn-icon"
                          onClick={() => setOpenMenuId(openMenuId === expense.id ? null : expense.id)}
                        >
                          <i className="bi bi-three-dots-vertical"></i>
                        </button>
                        {openMenuId === expense.id && (
                          <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="dropdown-menu-item"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicate(expense);
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
              ))}
            </tbody>
          </table>
        ) : expenses.length > 0 ? (
          <div className="empty-state">
            <div className="empty-state-text">No expenses match the current filter</div>
            <button className="btn btn-primary" onClick={() => { setFilterType('all'); setShowPaid(true); }}>
              Show All Expenses
            </button>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><i className="bi bi-cart"></i></div>
            <div className="empty-state-text">No expenses added yet</div>
            <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
              Add Your First Expense
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseManager;
