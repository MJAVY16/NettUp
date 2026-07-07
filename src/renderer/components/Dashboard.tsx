import React from 'react';
import { FinancialProject, FinancialSummary } from '../types';
import { formatCurrencyWithSymbol, calculateMonthlyAmount } from '../utils/formatters';
import { getNextPaymentDate } from '../utils/dateHelpers';
import { format } from 'date-fns';
import PayPeriods from './PayPeriods';

interface DashboardProps {
  project: FinancialProject;
  onUpdateSettings: (settings: Partial<FinancialProject['settings']>) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ project, onUpdateSettings }) => {
  const calculateSummary = (): FinancialSummary => {
    const totalMonthlyIncome = project.incomes.reduce((sum, income) => {
      return sum + calculateMonthlyAmount(income.amount, income.frequency);
    }, 0);

    const totalDebt = project.debts.reduce((sum, debt) => sum + debt.balance, 0);
    const monthlyDebtPayments = project.debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);

    const totalMonthlyExpenses = project.expenses.reduce((sum, expense) => {
      return sum + calculateMonthlyAmount(expense.amount, expense.frequency);
    }, 0);

    const netIncome = totalMonthlyIncome - totalMonthlyExpenses - monthlyDebtPayments;
    const debtToIncomeRatio = totalMonthlyIncome > 0 ? (monthlyDebtPayments / totalMonthlyIncome) * 100 : 0;
    const savingsRate = totalMonthlyIncome > 0 ? (netIncome / totalMonthlyIncome) * 100 : 0;
    const emergencyFund = (totalMonthlyExpenses + monthlyDebtPayments) * 6;

    return {
      totalIncome: totalMonthlyIncome,
      totalDebt,
      totalExpenses: totalMonthlyExpenses,
      netIncome,
      debtToIncomeRatio,
      monthlyDebtPayments,
      savingsRate,
      emergencyFund
    };
  };

  const summary = calculateSummary();

  const getDebtRatioStatus = (ratio: number) => {
    if (ratio < 20) return { text: 'Excellent', color: 'var(--success-color)' };
    if (ratio < 36) return { text: 'Good', color: 'var(--primary-color)' };
    if (ratio < 50) return { text: 'Fair', color: 'var(--warning-color)' };
    return { text: 'Poor', color: 'var(--danger-color)' };
  };

  const getSavingsRateStatus = (rate: number) => {
    if (rate >= 20) return { text: 'Excellent', color: 'var(--success-color)' };
    if (rate >= 10) return { text: 'Good', color: 'var(--primary-color)' };
    if (rate >= 5) return { text: 'Fair', color: 'var(--warning-color)' };
    return { text: 'Needs Improvement', color: 'var(--danger-color)' };
  };

  const debtRatioStatus = getDebtRatioStatus(summary.debtToIncomeRatio);
  const savingsRateStatus = getSavingsRateStatus(summary.savingsRate);

  // Sort debts by actual next payment date
  const upcomingDebts = project.debts
    .map(debt => ({
      id: debt.id,
      name: debt.name,
      minimumPayment: debt.minimumPayment,
      interestRate: debt.interestRate,
      dueDate: debt.dueDate,
      nextPaymentDate: getNextPaymentDate(debt.dueDate)
    }))
    .sort((a, b) => a.nextPaymentDate.getTime() - b.nextPaymentDate.getTime())
    .slice(0, 5);

  const highInterestDebts = project.debts
    .filter(debt => debt.interestRate > 15)
    .sort((a, b) => b.interestRate - a.interestRate);

  return (
    <div className="dashboard">
      <div className="section">
        <h2 className="section-title" style={{ marginBottom: '1.5rem' }}>
          Financial Overview
        </h2>

        <div className="dashboard-grid">
          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Monthly Income</span>
              <span><i className="bi bi-cash-coin"></i></span>
            </div>
            <div className="stat-card-value" style={{ color: 'var(--success-color)' }}>
              {formatCurrencyWithSymbol(summary.totalIncome)}
            </div>
            <div className="stat-card-change positive">
              {project.incomes.length} income sources
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Total Debt</span>
              <span><i className="bi bi-credit-card"></i></span>
            </div>
            <div className="stat-card-value" style={{ color: 'var(--danger-color)' }}>
              {formatCurrencyWithSymbol(summary.totalDebt)}
            </div>
            <div className="stat-card-change">
              {project.debts.length} active debts
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Debt-to-Income Ratio</span>
              <span><i className="bi bi-graph-up"></i></span>
            </div>
            <div className="stat-card-value" style={{ color: debtRatioStatus.color }}>
              {summary.debtToIncomeRatio.toFixed(1)}%
            </div>
            <div className="stat-card-change">
              Status: {debtRatioStatus.text}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Monthly Expenses</span>
              <span><i className="bi bi-cart"></i></span>
            </div>
            <div className="stat-card-value">
              {formatCurrencyWithSymbol(summary.totalExpenses)}
            </div>
            <div className="stat-card-change">
              + {formatCurrencyWithSymbol(summary.monthlyDebtPayments)} debt payments
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Net Income</span>
              <span><i className="bi bi-currency-dollar"></i></span>
            </div>
            <div className="stat-card-value" style={{
              color: summary.netIncome >= 0 ? 'var(--success-color)' : 'var(--danger-color)'
            }}>
              {formatCurrencyWithSymbol(summary.netIncome)}
            </div>
            <div className="stat-card-change">
              After all expenses & debts
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-header">
              <span className="stat-card-title">Savings Rate</span>
              <span><i className="bi bi-bank"></i></span>
            </div>
            <div className="stat-card-value" style={{ color: savingsRateStatus.color }}>
              {summary.savingsRate.toFixed(1)}%
            </div>
            <div className="stat-card-change">
              Status: {savingsRateStatus.text}
            </div>
          </div>
        </div>
      </div>

      <PayPeriods project={project} onUpdateSettings={onUpdateSettings} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="section">
          <h3 className="section-title">Financial Health Score</h3>
          <div style={{ padding: '1rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Debt-to-Income Ratio</span>
                <span style={{ color: debtRatioStatus.color, fontWeight: 600 }}>
                  {summary.debtToIncomeRatio.toFixed(1)}%
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${Math.min(summary.debtToIncomeRatio, 100)}%`,
                    background: debtRatioStatus.color
                  }}
                />
              </div>
              <small style={{ color: 'var(--text-secondary)' }}>
                Recommended: Below 36%
              </small>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Savings Rate</span>
                <span style={{ color: savingsRateStatus.color, fontWeight: 600 }}>
                  {summary.savingsRate.toFixed(1)}%
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${Math.min(Math.max(summary.savingsRate, 0), 100)}%`,
                    background: savingsRateStatus.color
                  }}
                />
              </div>
              <small style={{ color: 'var(--text-secondary)' }}>
                Recommended: Above 20%
              </small>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Emergency Fund (6 months)</span>
                <span style={{ fontWeight: 600 }}>
                  {formatCurrencyWithSymbol(Math.max(summary.emergencyFund, 0))}
                </span>
              </div>
              <small style={{ color: 'var(--text-secondary)' }}>
                Based on 6 months of expenses + debt payments
              </small>
            </div>
          </div>
        </div>

        <div className="section">
          <h3 className="section-title">Upcoming Payments</h3>
          {upcomingDebts.length > 0 ? (
            <div style={{ padding: '1rem' }}>
              {upcomingDebts.map(debt => (
                <div key={debt.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  borderBottom: '1px solid var(--border-color)'
                }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{debt.name}</div>
                    <small style={{ color: 'var(--text-secondary)' }}>
                      Due: {format(debt.nextPaymentDate, 'MMM dd, yyyy')}
                    </small>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, color: 'var(--danger-color)' }}>
                      {formatCurrencyWithSymbol(debt.minimumPayment)}
                    </div>
                    <small style={{ color: 'var(--text-secondary)' }}>
                      {debt.interestRate}% APR
                    </small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '2rem' }}>
              <div className="empty-state-text">No debts to pay</div>
            </div>
          )}
        </div>
      </div>

      {project.savingsGoals.length > 0 && (
        <div className="section">
          <h3 className="section-title">
            <i className="bi bi-flag"></i> Savings Goals Progress
          </h3>
          <div style={{ padding: '1rem' }}>
            {project.savingsGoals.map(goal => {
              const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
              const isCompleted = goal.currentAmount >= goal.targetAmount;
              return (
                <div key={goal.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.75rem', borderBottom: '1px solid var(--border-color)'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{goal.name}</div>
                    <div style={{ width: '200px', marginTop: '0.25rem' }}>
                      <div className="progress-bar">
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${Math.min(progress, 100)}%`,
                            backgroundColor: isCompleted ? 'var(--success-color)' : 'var(--primary-color)'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, color: isCompleted ? 'var(--success-color)' : 'var(--text-primary)' }}>
                      {formatCurrencyWithSymbol(goal.currentAmount)} / {formatCurrencyWithSymbol(goal.targetAmount)}
                    </div>
                    <small style={{ color: 'var(--text-secondary)' }}>
                      {isCompleted ? 'Completed' : `${progress.toFixed(0)}%`}
                    </small>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {highInterestDebts.length > 0 && (
        <div className="section">
          <h3 className="section-title" style={{ color: 'var(--warning-color)' }}>
            <i className="bi bi-exclamation-triangle"></i> High Interest Debts (Above 15% APR)
          </h3>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Balance</th>
                <th>Interest Rate</th>
                <th>Monthly Interest</th>
                <th>Min Payment</th>
              </tr>
            </thead>
            <tbody>
              {highInterestDebts.map(debt => {
                const monthlyInterest = (debt.balance * (debt.interestRate / 100)) / 12;
                return (
                  <tr key={debt.id}>
                    <td>{debt.name}</td>
                    <td style={{ color: 'var(--danger-color)' }}>
                      {formatCurrencyWithSymbol(debt.balance)}
                    </td>
                    <td>
                      <span className="badge badge-danger">{debt.interestRate}%</span>
                    </td>
                    <td>{formatCurrencyWithSymbol(monthlyInterest)}</td>
                    <td>{formatCurrencyWithSymbol(debt.minimumPayment)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{
            padding: '1rem',
            background: 'rgba(243, 156, 18, 0.1)',
            borderRadius: '6px',
            marginTop: '1rem'
          }}>
            <strong><i className="bi bi-lightbulb"></i> Tip:</strong> Consider paying off high-interest debts first to save money on interest charges.
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;