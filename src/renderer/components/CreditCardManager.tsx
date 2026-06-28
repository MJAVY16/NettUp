import React, { useState } from 'react';
import { Debt } from '../types';
import { formatCurrencyWithSymbol } from '../utils/formatters';
import { severityColor } from '../utils/debtHelpers';

interface CreditCardManagerProps {
  cards: Debt[];
  onAdd: (debt: Debt) => void;
  onUpdate: (id: string, updates: Partial<Debt>) => void;
  onDelete: (id: string) => void;
}

const emptyForm: Partial<Debt> = {
  name: '',
  type: 'credit-card',
  balance: 0,
  creditLimit: 0,
  isClosed: false,
  interestRate: 0,
  minimumPayment: 0,
  dueDate: 1,
  notes: ''
};

const CreditCardManager: React.FC<CreditCardManagerProps> = ({ cards, onAdd, onUpdate, onDelete }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Debt>>(emptyForm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdate(editingId, { ...formData, type: 'credit-card' });
      setEditingId(null);
    } else {
      onAdd({ ...formData, type: 'credit-card', id: Date.now().toString() } as Debt);
    }
    setFormData(emptyForm);
    setShowAddForm(false);
  };

  const handleEdit = (card: Debt) => {
    setFormData(card);
    setEditingId(card.id);
    setShowAddForm(true);
  };

  // You owe the balance on every card (open or closed)...
  const totalBalance = cards.reduce((sum, c) => sum + c.balance, 0);
  // ...but only open cards have usable limit, so available credit and overall
  // utilization are computed from open cards alone.
  const openCards = cards.filter(c => !c.isClosed);
  const totalLimit = openCards.reduce((sum, c) => sum + (c.creditLimit || 0), 0);
  const openBalance = openCards.reduce((sum, c) => sum + c.balance, 0);
  const totalAvailable = Math.max(0, totalLimit - openBalance);
  const overallUtil = totalLimit > 0 ? (openBalance / totalLimit) * 100 : 0;

  return (
    <div className="credit-card-manager">
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Credit Cards</h2>
          <button className="btn btn-primary" onClick={() => { setShowAddForm(!showAddForm); setEditingId(null); setFormData(emptyForm); }}>
            {showAddForm ? 'Cancel' : '+ Add Card'}
          </button>
        </div>

        {cards.length > 0 && (
          <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {cards.length} {cards.length === 1 ? 'card' : 'cards'} · Balance{' '}
            <strong style={{ color: 'var(--danger-color)' }}>{formatCurrencyWithSymbol(totalBalance)}</strong> · Available{' '}
            <strong style={{ color: 'var(--success-color)' }}>{formatCurrencyWithSymbol(totalAvailable)}</strong> · Utilization{' '}
            <strong style={{ color: severityColor(overallUtil / 100) }}>{overallUtil.toFixed(0)}%</strong>
          </div>
        )}

        {showAddForm && (
          <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
            <div className="form-group">
              <label className="form-label">Card Name</label>
              <input
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Chase Sapphire, Amex Gold"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Current Balance</label>
                <input type="number" className="form-input" min="0" step="0.01" required
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) })} />
              </div>
              <div className="form-group">
                <label className="form-label">Credit Limit</label>
                <input type="number" className="form-input" min="0" step="0.01" required
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) })} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Interest Rate (% APR)</label>
                <input type="number" className="form-input" min="0" step="0.01"
                  value={formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: parseFloat(e.target.value) })} />
              </div>
              <div className="form-group">
                <label className="form-label">Minimum Payment</label>
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
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={!!formData.isClosed}
                  onChange={(e) => {
                    const closed = e.target.checked;
                    setFormData(prev => {
                      if (closed) {
                        // Cache the current limit, then default the live limit to 0.
                        return {
                          ...prev,
                          isClosed: true,
                          previousCreditLimit: prev.creditLimit || prev.previousCreditLimit || 0,
                          creditLimit: 0,
                        };
                      }
                      // Reopen: keep a limit entered while closed, else restore the cached one.
                      const restored = prev.creditLimit && prev.creditLimit > 0
                        ? prev.creditLimit
                        : (prev.previousCreditLimit || 0);
                      return { ...prev, isClosed: false, creditLimit: restored, previousCreditLimit: undefined };
                    });
                  }} />
                Card is closed (still owe the balance, but no available credit)
              </label>
            </div>
            <button type="submit" className="btn btn-primary">{editingId ? 'Update Card' : 'Add Card'}</button>
          </form>
        )}

        {cards.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Card</th>
                <th>Utilization</th>
                <th>Balance</th>
                <th>Limit</th>
                <th>Available</th>
                <th>Min Payment</th>
                <th>Due</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cards.map(card => {
                const limit = card.creditLimit || 0;
                const utilization = limit > 0 ? (card.balance / limit) * 100 : 0;
                const available = card.isClosed ? 0 : Math.max(0, limit - card.balance);
                const color = severityColor(utilization / 100);
                return (
                  <tr key={card.id} style={card.isClosed ? { opacity: 0.6 } : undefined}>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {card.name}
                        {card.isClosed && (
                          <span className="badge" style={{ marginLeft: '0.5rem', borderColor: 'var(--text-dim)', color: 'var(--text-dim)' }}>Closed</span>
                        )}
                      </div>
                      <small style={{ color: 'var(--text-secondary)' }}>{card.interestRate}% APR</small>
                    </td>
                    <td style={{ minWidth: '140px' }}>
                      {card.isClosed ? (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                          <i className="bi bi-lock"></i> Closed
                        </span>
                      ) : (
                        <>
                          <div className="progress-bar">
                            <div className="progress-bar-fill" style={{ width: `${Math.min(utilization, 100)}%`, background: color }} />
                          </div>
                          <small style={{ color }}>{utilization.toFixed(0)}% used</small>
                        </>
                      )}
                    </td>
                    <td style={{ color: 'var(--danger-color)' }}>{formatCurrencyWithSymbol(card.balance)}</td>
                    <td>{formatCurrencyWithSymbol(limit)}</td>
                    <td style={{ color: 'var(--success-color)' }}>{formatCurrencyWithSymbol(available)}</td>
                    <td>{formatCurrencyWithSymbol(card.minimumPayment)}</td>
                    <td>Day {card.dueDate}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button className="btn btn-icon" onClick={() => handleEdit(card)}><i className="bi bi-pencil"></i></button>
                        <button className="btn btn-icon" onClick={() => onDelete(card.id)}><i className="bi bi-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><i className="bi bi-credit-card-2-front"></i></div>
            <div className="empty-state-text">No credit cards yet</div>
            <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>Add Your First Card</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditCardManager;
