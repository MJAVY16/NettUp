import React from 'react';
import { FinancialProject } from '../types';
import { formatCurrencyWithSymbol, calculateMonthlyAmount } from '../utils/formatters';
import { severityColor } from '../utils/debtHelpers';

interface AnalyticsProps {
  project: FinancialProject;
}

const Analytics: React.FC<AnalyticsProps> = ({ project }) => {
  // Calculate monthly payment by debt type
  const debtByType = project.debts.reduce((acc, debt) => {
    if (!acc[debt.type]) {
      acc[debt.type] = { total: 0, payment: 0, count: 0 };
    }
    acc[debt.type].total += debt.balance;
    acc[debt.type].payment += debt.minimumPayment;
    acc[debt.type].count += 1;
    return acc;
  }, {} as Record<string, { total: number; payment: number; count: number }>);

  const totalDebtPayment = Object.values(debtByType).reduce((sum, type) => sum + type.payment, 0);

  // Calculate monthly expenses by category
  const expenseByCategory = project.expenses.reduce((acc, expense) => {
    const monthlyAmount = calculateMonthlyAmount(expense.amount, expense.frequency);

    if (!acc[expense.category]) {
      acc[expense.category] = { total: 0, count: 0, essential: 0, nonEssential: 0 };
    }
    acc[expense.category].total += monthlyAmount;
    acc[expense.category].count += 1;
    if (expense.isEssential) {
      acc[expense.category].essential += monthlyAmount;
    } else {
      acc[expense.category].nonEssential += monthlyAmount;
    }
    return acc;
  }, {} as Record<string, { total: number; count: number; essential: number; nonEssential: number }>);

  const totalExpenses = Object.values(expenseByCategory).reduce((sum, cat) => sum + cat.total, 0);

  // Generate savings tips
  const savingsTips = [];

  // High interest debt tip
  const highInterestDebts = project.debts.filter(d => d.interestRate > 15);
  if (highInterestDebts.length > 0) {
    const monthlyInterest = highInterestDebts.reduce((sum, debt) => {
      return sum + (debt.balance * (debt.interestRate / 100) / 12);
    }, 0);
    savingsTips.push({
      type: 'high-interest',
      title: 'Pay Off High-Interest Debts First',
      amount: monthlyInterest,
      description: `You're paying ${formatCurrencyWithSymbol(monthlyInterest)}/month in interest on high-rate debts (>15% APR). Focus on paying these off first to save money.`
    });
  }

  // Non-essential expenses tip
  const nonEssentialTotal = Object.values(expenseByCategory).reduce((sum, cat) => sum + cat.nonEssential, 0);
  if (nonEssentialTotal > 0) {
    const potentialSavings = nonEssentialTotal * 0.3; // Assume 30% reduction possible
    savingsTips.push({
      type: 'non-essential',
      title: 'Reduce Non-Essential Expenses',
      amount: potentialSavings,
      description: `You're spending ${formatCurrencyWithSymbol(nonEssentialTotal)}/month on non-essentials. Cutting back by 30% could save ${formatCurrencyWithSymbol(potentialSavings)}/month.`
    });
  }

  // Credit card utilization tip
  const creditCards = project.debts.filter(d => d.type === 'credit-card' && d.creditLimit);
  const highUtilization = creditCards.filter(cc => (cc.balance / (cc.creditLimit || 1)) > 0.3);
  if (highUtilization.length > 0) {
    const extraPayment = highUtilization.reduce((sum, cc) => {
      const targetBalance = (cc.creditLimit || 0) * 0.3;
      return sum + Math.max(0, cc.balance - targetBalance);
    }, 0);

    // Calculate monthly interest savings from paying down to 30%
    const monthlyInterestSavings = highUtilization.reduce((sum, cc) => {
      const targetBalance = (cc.creditLimit || 0) * 0.3;
      const amountToPayDown = Math.max(0, cc.balance - targetBalance);
      const monthlySavings = (amountToPayDown * (cc.interestRate / 100)) / 12;
      return sum + monthlySavings;
    }, 0);

    savingsTips.push({
      type: 'credit-utilization',
      title: 'Lower Credit Card Utilization',
      amount: monthlyInterestSavings,
      description: `You have ${highUtilization.length} card(s) over 30% utilization. Paying down ${formatCurrencyWithSymbol(extraPayment)} total would save ${formatCurrencyWithSymbol(monthlyInterestSavings)}/month in interest and improve your credit score.`
    });
  }

  const debtTypeLabels: Record<string, string> = {
    'credit-card': 'Credit Cards',
    'loan': 'Personal Loans',
    'mortgage': 'Mortgage',
    'auto': 'Auto Loans',
    'student': 'Student Loans',
    'personal': 'Personal',
    'payment-plan': 'Payment Plans',
    'other': 'Other'
  };

  // Credit Card Utilization Calculator
  const creditCardsWithLimits = project.debts.filter(d => d.type === 'credit-card' && d.creditLimit && d.creditLimit > 0);

  return (
    <div className="analytics">
      <h2 className="section-title" style={{ marginBottom: '1.5rem' }}>Financial Analytics</h2>

      {/* Credit Card Utilization Tracker */}
      {creditCardsWithLimits.length > 0 && (
        <div className="section">
            <h3 className="section-title"><i className="bi bi-credit-card-2-front"></i> Credit Card Utilization Tracker</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Card Name</th>
                    <th>Balance</th>
                    <th>Credit Limit</th>
                    <th>Available</th>
                    <th>Current %</th>
                    <th>Pay for 6%</th>
                    <th>Pay for 10%</th>
                    <th>Pay for 20%</th>
                    <th>Pay for 30%</th>
                  </tr>
                </thead>
                <tbody>
                  {creditCardsWithLimits.map(card => {
                    const balance = card.balance;
                    const limit = card.creditLimit || 0;
                    const available = limit - balance;
                    const currentUtilization = limit > 0 ? (balance / limit) * 100 : 0;

                    // Calculate amounts to pay for different utilization targets
                    const target6 = Math.max(0, balance - (limit * 0.06));
                    const target10 = Math.max(0, balance - (limit * 0.10));
                    const target20 = Math.max(0, balance - (limit * 0.20));
                    const target30 = Math.max(0, balance - (limit * 0.30));

                    return (
                      <tr key={card.id}>
                        <td style={{ fontWeight: 500 }}>{card.name}</td>
                        <td>{formatCurrencyWithSymbol(balance)}</td>
                        <td>{formatCurrencyWithSymbol(limit)}</td>
                        <td style={{ color: 'var(--success-color)' }}>{formatCurrencyWithSymbol(available)}</td>
                        <td>
                          <span style={{
                            color: severityColor(currentUtilization / 100),
                            fontWeight: 600
                          }}>
                            {currentUtilization.toFixed(1)}%
                          </span>
                        </td>
                        <td>{target6 > 0 ? formatCurrencyWithSymbol(target6) : '-'}</td>
                        <td>{target10 > 0 ? formatCurrencyWithSymbol(target10) : '-'}</td>
                        <td>{target20 > 0 ? formatCurrencyWithSymbol(target20) : '-'}</td>
                        <td>{target30 > 0 ? formatCurrencyWithSymbol(target30) : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: 'color-mix(in srgb, var(--info-color) 8%, transparent)',
              border: '1px solid var(--info-color)',
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-family)',
              fontSize: '11px',
              color: 'var(--text-secondary)'
            }}>
              <strong style={{ color: 'var(--info-color)' }}><i className="bi bi-info-circle"></i> TIP:</strong> Keeping credit utilization below 30% is good for your credit score. Below 10% is excellent.
              <br/>
              <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                Last updated: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        )}

        {/* Debt Payment Breakdown */}
        <div className="section" style={{ marginTop: '1.5rem' }}>
          <h3 className="section-title">Monthly Debt Payments by Type</h3>
          {Object.keys(debtByType).length > 0 ? (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Debts</th>
                    <th>Total Balance</th>
                    <th>Monthly Payment</th>
                    <th>% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(debtByType).map(([type, data]) => {
                    const percentage = totalDebtPayment > 0 ? (data.payment / totalDebtPayment * 100) : 0;
                    return (
                      <tr key={type}>
                        <td style={{ fontWeight: 500 }}>{debtTypeLabels[type] || type}</td>
                        <td>{data.count}</td>
                        <td>{formatCurrencyWithSymbol(data.total)}</td>
                        <td style={{ color: 'var(--danger-color)' }}>{formatCurrencyWithSymbol(data.payment)}/mo</td>
                        <td>{percentage.toFixed(0)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '2px solid var(--border-color)', fontWeight: 700 }}>
                <span>Total Monthly Debt Payments</span>
                <span style={{ color: 'var(--danger-color)', fontSize: '1.4rem' }}>{formatCurrencyWithSymbol(totalDebtPayment)}</span>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-text">No debts to analyze</div>
            </div>
          )}
        </div>

        {/* Expense Breakdown */}
        <div className="section" style={{ marginTop: '1.5rem' }}>
          <h3 className="section-title">Monthly Expenses by Category</h3>
          {Object.keys(expenseByCategory).length > 0 ? (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Items</th>
                    <th>Essential</th>
                    <th>Non-essential</th>
                    <th>Monthly</th>
                    <th>% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(expenseByCategory).map(([category, data]) => {
                    const percentage = totalExpenses > 0 ? (data.total / totalExpenses * 100) : 0;
                    return (
                      <tr key={category}>
                        <td style={{ fontWeight: 500 }}>{category}</td>
                        <td>{data.count}</td>
                        <td>{formatCurrencyWithSymbol(data.essential)}</td>
                        <td>{formatCurrencyWithSymbol(data.nonEssential)}</td>
                        <td style={{ fontWeight: 600 }}>{formatCurrencyWithSymbol(data.total)}/mo</td>
                        <td>{percentage.toFixed(0)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '2px solid var(--border-color)', fontWeight: 700 }}>
                <span>Total Monthly Expenses</span>
                <span style={{ fontSize: '1.4rem' }}>{formatCurrencyWithSymbol(totalExpenses)}</span>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-state-text">No expenses to analyze</div>
            </div>
          )}
        </div>

        {/* Savings Tips */}
        {savingsTips.length > 0 && (
          <div className="section" style={{ marginTop: '1.5rem' }}>
            <h3 className="section-title"><i className="bi bi-lightbulb"></i> Savings Opportunities</h3>
            <div>
              {savingsTips.map((tip, index) => (
                <div key={index} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.5rem',
                  padding: '0.9rem 0', borderBottom: '1px solid var(--border-color)'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '0.3rem' }}>{tip.title}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{tip.description}</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--success-color)', whiteSpace: 'nowrap' }}>
                    {formatCurrencyWithSymbol(tip.amount)}
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '0.9rem', fontWeight: 700 }}>
                <span>Total Potential Monthly Savings</span>
                <span style={{ color: 'var(--success-color)', fontSize: '1.4rem' }}>
                  {formatCurrencyWithSymbol(savingsTips.reduce((sum, tip) => sum + tip.amount, 0))}
                </span>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default Analytics;
