import React, { useState, useRef, useEffect } from 'react';
import { SavingsGoal, Milestone } from '../types';
import { formatCurrencyWithSymbol } from '../utils/formatters';

interface GoalsManagerProps {
  goals: SavingsGoal[];
  milestones: Milestone[];
  onAddGoal: (goal: SavingsGoal) => void;
  onUpdateGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  onDeleteGoal: (id: string) => void;
  onAddMilestone: (milestone: Milestone) => void;
  onUpdateMilestone: (id: string, updates: Partial<Milestone>) => void;
}

const GOAL_ICONS: Record<string, string> = {
  emergency: 'bi-shield-check',
  vacation: 'bi-airplane',
  car: 'bi-car-front',
  home: 'bi-house',
  education: 'bi-book',
  retirement: 'bi-graph-up-arrow',
  wedding: 'bi-heart',
  other: 'bi-flag'
};

const GOAL_COLORS: Record<string, string> = {
  emergency: '#4CAF50',
  vacation: '#2196F3',
  car: '#FF9800',
  home: '#9C27B0',
  education: '#00BCD4',
  retirement: '#607D8B',
  wedding: '#E91E63',
  other: '#795548'
};

const CATEGORY_LABELS: Record<string, string> = {
  emergency: 'Emergency Fund',
  vacation: 'Vacation',
  car: 'Car',
  home: 'Home',
  education: 'Education',
  retirement: 'Retirement',
  wedding: 'Wedding',
  other: 'Other'
};

const GoalsManager: React.FC<GoalsManagerProps> = ({
  goals, milestones, onAddGoal, onUpdateGoal, onDeleteGoal, onAddMilestone, onUpdateMilestone
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [celebratingMilestone, setCelebratingMilestone] = useState<Milestone | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState<Partial<SavingsGoal>>({
    name: '',
    targetAmount: 0,
    currentAmount: 0,
    category: 'other',
    notes: ''
  });

  useEffect(() => {
    if (showAddForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showAddForm]);

  // Check for new milestones when goals update
  useEffect(() => {
    goals.forEach(goal => {
      const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
      const thresholds = [25, 50, 75, 100];

      thresholds.forEach(threshold => {
        if (progress >= threshold) {
          const exists = milestones.find(
            m => m.entityId === goal.id && m.milestone === threshold && m.type === 'savings'
          );
          if (!exists) {
            onAddMilestone({
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              type: 'savings',
              entityId: goal.id,
              entityName: goal.name,
              milestone: threshold,
              achievedAt: new Date().toISOString(),
              celebrated: false
            });
          }
        }
      });
    });
  }, [goals]);

  // Find uncelebrated milestone to celebrate
  useEffect(() => {
    const uncelebrated = milestones.find(m => !m.celebrated && m.type === 'savings');
    if (uncelebrated && !celebratingMilestone) {
      setCelebratingMilestone(uncelebrated);
    }
  }, [milestones]);

  const handleCelebrate = () => {
    if (celebratingMilestone) {
      onUpdateMilestone(celebratingMilestone.id, { celebrated: true });
      setCelebratingMilestone(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isCompleted = (formData.currentAmount || 0) >= (formData.targetAmount || 0);

    if (editingId) {
      onUpdateGoal(editingId, {
        ...formData,
        completedAt: isCompleted ? new Date().toISOString() : undefined
      });
      setEditingId(null);
    } else {
      onAddGoal({
        ...formData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        completedAt: isCompleted ? new Date().toISOString() : undefined
      } as SavingsGoal);
    }
    setFormData({ name: '', targetAmount: 0, currentAmount: 0, category: 'other', notes: '' });
    setShowAddForm(false);
  };

  const handleEdit = (goal: SavingsGoal) => {
    setFormData(goal);
    setEditingId(goal.id);
    setShowAddForm(true);
  };

  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount).length;

  return (
    <div className="goals-manager">
      {/* Milestone Celebration Modal */}
      {celebratingMilestone && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            background: 'var(--surface-color)', borderRadius: '16px', padding: '2.5rem',
            textAlign: 'center', maxWidth: '400px', width: '90%',
            border: '2px solid var(--success-color)',
            boxShadow: '0 0 30px rgba(0, 255, 159, 0.2)',
            animation: 'scaleIn 0.3s ease'
          }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'rgba(0, 255, 159, 0.1)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem'
            }}>
              <i className="bi bi-trophy" style={{ fontSize: '2.5rem', color: 'var(--success-color)' }}></i>
            </div>
            <h2 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>Milestone Reached!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              <strong>{celebratingMilestone.entityName}</strong> has reached <strong>{celebratingMilestone.milestone}%</strong> of its goal!
            </p>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              {celebratingMilestone.milestone === 100 ? 'Goal achieved! Amazing work!' :
               celebratingMilestone.milestone >= 75 ? 'Almost there! Keep going!' :
               celebratingMilestone.milestone >= 50 ? 'Halfway there!' : 'Great start! Keep it up!'}
            </p>
            {celebratingMilestone.milestone === 100 && (
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎉🎊⭐</div>
            )}
            <button className="btn btn-primary" onClick={handleCelebrate} style={{ padding: '0.75rem 2rem' }}>
              <i className="bi bi-check-lg"></i> Continue
            </button>
          </div>
        </div>
      )}

      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Savings Goals</h2>
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Cancel' : '+ Add Goal'}
          </button>
        </div>

        <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Savings Goals</span>
            </div>
            <div className="stat-card-value">{goals.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Total Saved</span>
            </div>
            <div className="stat-card-value" style={{ color: 'var(--success-color)' }}>
              {formatCurrencyWithSymbol(totalSaved)}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Completed</span>
            </div>
            <div className="stat-card-value" style={{ color: 'var(--success-color)' }}>{completedGoals}</div>
          </div>
        </div>

        {showAddForm && (
          <form ref={formRef} onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
            <div className="form-group">
              <label className="form-label">Goal Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Emergency Fund, Vacation to Japan"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as SavingsGoal['category'] })}
                >
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Target Amount</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: parseFloat(e.target.value) })}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Current Amount</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.currentAmount}
                  onChange={(e) => setFormData({ ...formData, currentAmount: parseFloat(e.target.value) })}
                  min="0"
                  step="0.01"
                />
              </div>
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
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Update Goal' : 'Add Goal'}
            </button>
          </form>
        )}

        {goals.length > 0 ? (
          <div>
            {goals.map(goal => {
              const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
              const remaining = goal.targetAmount - goal.currentAmount;
              const isCompleted = goal.currentAmount >= goal.targetAmount;
              const goalColor = GOAL_COLORS[goal.category] || GOAL_COLORS.other;
              const goalIcon = GOAL_ICONS[goal.category] || GOAL_ICONS.other;

              return (
                <div key={goal.id} style={{
                  marginBottom: '1rem', padding: '1.25rem',
                  background: 'var(--surface-color)', borderRadius: '8px',
                  border: isCompleted ? '2px solid var(--success-color)' : '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '42px', height: '42px', borderRadius: '50%',
                        background: `${goalColor}20`, display: 'flex',
                        alignItems: 'center', justifyContent: 'center'
                      }}>
                        <i className={`bi ${goalIcon}`} style={{ fontSize: '1.25rem', color: goalColor }}></i>
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '1rem' }}>{goal.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {CATEGORY_LABELS[goal.category] || goal.category}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-icon" onClick={() => handleEdit(goal)}>
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button className="btn btn-icon" onClick={() => onDeleteGoal(goal.id)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>{formatCurrencyWithSymbol(goal.currentAmount)} / {formatCurrencyWithSymbol(goal.targetAmount)}</span>
                    <span style={{ color: isCompleted ? 'var(--success-color)' : goalColor, fontWeight: 600 }}>
                      {Math.min(progress, 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="progress-bar" style={{ marginBottom: '0.75rem' }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${Math.min(progress, 100)}%`,
                        backgroundColor: isCompleted ? 'var(--success-color)' : goalColor
                      }}
                    />
                  </div>

                  {isCompleted ? (
                    <div style={{
                      padding: '0.5rem', background: 'rgba(0, 255, 159, 0.05)',
                      borderRadius: '4px', textAlign: 'center', color: 'var(--success-color)', fontWeight: 600
                    }}>
                      <i className="bi bi-check-circle"></i> Completed
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Remaining: {formatCurrencyWithSymbol(remaining)}
                      </span>
                      <button
                        className="btn btn-sm"
                        style={{ background: goalColor, border: 'none', color: '#fff', padding: '0.25rem 0.75rem', fontSize: '12px' }}
                        onClick={() => handleEdit(goal)}
                      >
                        <i className="bi bi-plus"></i> Add Funds
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon"><i className="bi bi-flag"></i></div>
            <div className="empty-state-text">No savings goals yet</div>
            <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
              Add Your First Goal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalsManager;
