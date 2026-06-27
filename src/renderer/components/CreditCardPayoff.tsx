import React, { useState, useMemo } from 'react';
import { Debt } from '../types';
import { formatCurrencyWithSymbol } from '../utils/formatters';

interface CreditCardPayoffProps {
  debts: Debt[];
}

type PayoffStrategy = 'avalanche' | 'snowball' | 'utilization';

const UTILIZATION_TARGETS = [
  { percentage: 60, label: '60%' },
  { percentage: 50, label: '50%' },
  { percentage: 30, label: '30%' },
  { percentage: 20, label: '20%' },
  { percentage: 10, label: '10%' },
  { percentage: 6, label: '6%' },
];

const CreditCardPayoff: React.FC<CreditCardPayoffProps> = ({ debts }) => {
  const [selectedStrategy, setSelectedStrategy] = useState<PayoffStrategy>('avalanche');

  const creditCards = useMemo(() => {
    const cards = debts.filter(d => d.type === 'credit-card' && d.creditLimit && d.creditLimit > 0);

    switch (selectedStrategy) {
      case 'avalanche':
        return [...cards].sort((a, b) => b.interestRate - a.interestRate);
      case 'snowball':
        return [...cards].sort((a, b) => a.balance - b.balance);
      case 'utilization':
        return [...cards].sort((a, b) => {
          const utilA = (a.balance / (a.creditLimit || 1)) * 100;
          const utilB = (b.balance / (b.creditLimit || 1)) * 100;
          return utilB - utilA;
        });
      default:
        return cards;
    }
  }, [debts, selectedStrategy]);

  // Smooth green -> yellow -> red scale: the higher the utilization, the redder.
  const getUtilizationColor = (percentage: number): string => {
    const f = Math.min(1, Math.max(0, percentage / 100));
    return `hsl(${120 * (1 - f)}, 75%, 45%)`;
  };

  const calculatePayoffTargets = (balance: number, creditLimit: number) => {
    const currentUtilization = (balance / creditLimit) * 100;
    return UTILIZATION_TARGETS
      .filter(target => target.percentage < currentUtilization)
      .map(target => ({
        ...target,
        targetBalance: (target.percentage / 100) * creditLimit,
        amountToPay: balance - (target.percentage / 100) * creditLimit
      }));
  };

  const strategies = [
    { key: 'avalanche' as const, label: 'Avalanche', desc: 'Highest APR first - saves most money on interest' },
    { key: 'snowball' as const, label: 'Snowball', desc: 'Smallest balance first - quick psychological wins' },
    { key: 'utilization' as const, label: 'Utilization', desc: 'Highest utilization first - improves credit score fastest' }
  ];

  if (creditCards.length === 0) {
    return (
      <div className="credit-card-payoff">
        <div className="section">
          <h2 className="section-title">Credit Card Payoff Strategies</h2>
          <div className="empty-state">
            <div className="empty-state-icon"><i className="bi bi-credit-card"></i></div>
            <div className="empty-state-text">No credit cards with limits found</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Add credit cards with credit limits in the Debts section to see payoff strategies.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="credit-card-payoff">
      <div className="section">
        <h2 className="section-title">Credit Card Payoff Strategies</h2>

        <div style={{
          padding: '1rem', background: 'rgba(0, 212, 255, 0.05)', border: '1px solid var(--info-color)',
          borderRadius: '6px', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem'
        }}>
          <i className="bi bi-info-circle" style={{ color: 'var(--info-color)', fontSize: '1.1rem', marginTop: '2px' }}></i>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Choose a payoff strategy to prioritize your credit card payments. Each strategy optimizes for a different financial goal.
          </span>
        </div>

        {/* Strategy Selector */}
        <div style={{
          padding: '1.25rem', background: 'var(--surface-color)', borderRadius: '8px',
          border: '1px solid var(--border-color)', marginBottom: '1.5rem'
        }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Choose Your Strategy</h3>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {strategies.map(s => (
              <button
                key={s.key}
                className={`btn ${selectedStrategy === s.key ? 'btn-primary' : ''}`}
                style={{
                  flex: 1, padding: '0.5rem', fontSize: '13px', fontWeight: 600,
                  opacity: selectedStrategy === s.key ? 1 : 0.6
                }}
                onClick={() => setSelectedStrategy(s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {strategies.find(s => s.key === selectedStrategy)?.desc}
          </div>
        </div>

        {/* Credit Cards */}
        {creditCards.map((card, index) => {
          const utilization = (card.balance / card.creditLimit!) * 100;
          const payoffTargets = calculatePayoffTargets(card.balance, card.creditLimit!);
          const available = card.creditLimit! - card.balance;

          return (
            <div key={card.id} style={{
              padding: '1.25rem', background: 'var(--surface-color)', borderRadius: '8px',
              border: '1px solid var(--border-color)', marginBottom: '1rem'
            }}>
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: index === 0 ? 'var(--primary-color)' : 'var(--text-dim)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 700, color: '#fff'
                  }}>
                    #{index + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>{card.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {selectedStrategy === 'avalanche' && `${card.interestRate}% APR`}
                      {selectedStrategy === 'snowball' && `Balance: ${formatCurrencyWithSymbol(card.balance)}`}
                      {selectedStrategy === 'utilization' && `${utilization.toFixed(0)}% utilization`}
                    </div>
                  </div>
                </div>
                <span style={{
                  padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '12px', fontWeight: 600,
                  background: getUtilizationColor(utilization), color: '#fff'
                }}>
                  {utilization.toFixed(0)}% used
                </span>
              </div>

              {/* Stats Row */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0',
                borderBottom: '1px solid var(--border-color)', marginBottom: '1rem'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Balance</div>
                  <div style={{ fontWeight: 600, color: 'var(--danger-color)' }}>{formatCurrencyWithSymbol(card.balance)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Limit</div>
                  <div style={{ fontWeight: 600 }}>{formatCurrencyWithSymbol(card.creditLimit!)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Available</div>
                  <div style={{ fontWeight: 600, color: 'var(--success-color)' }}>{formatCurrencyWithSymbol(available)}</div>
                </div>
              </div>

              {/* Payoff Targets */}
              {payoffTargets.length > 0 ? (
                <div>
                  <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem' }}>Pay to Reach Target:</h4>
                  {payoffTargets.map(target => (
                    <div key={target.percentage} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{
                          padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                          background: getUtilizationColor(target.percentage), color: '#fff', minWidth: '40px', textAlign: 'center'
                        }}>
                          {target.label}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Balance: {formatCurrencyWithSymbol(target.targetBalance)}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Pay</div>
                        <div style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
                          {formatCurrencyWithSymbol(target.amountToPay)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem' }}>
                  <i className="bi bi-check-circle" style={{ color: 'var(--success-color)' }}></i>
                  <span style={{ color: 'var(--success-color)', fontWeight: 500 }}>
                    Utilization is already at {utilization.toFixed(0)}% - great job!
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CreditCardPayoff;
