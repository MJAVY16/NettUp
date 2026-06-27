import React, { useState } from 'react';
import { FinancialProject } from '../types';
import { formatCurrencyWithSymbol, calculateMonthlyAmount } from '../utils/formatters';

interface ReportGeneratorProps {
  project: FinancialProject;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ project }) => {
  const [generating, setGenerating] = useState(false);

  const calculateTotals = () => {
    const totalMonthlyIncome = project.incomes.reduce((sum, income) => {
      return sum + calculateMonthlyAmount(income.amount, income.frequency);
    }, 0);

    const totalDebtBalance = project.debts.reduce((sum, debt) => sum + debt.balance, 0);

    const totalMonthlyDebtPayments = project.debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);

    const totalMonthlyExpenses = project.expenses.reduce((sum, expense) => {
      return sum + calculateMonthlyAmount(expense.amount, expense.frequency);
    }, 0);

    const netMonthlyIncome = totalMonthlyIncome - totalMonthlyExpenses - totalMonthlyDebtPayments;
    const debtToIncomeRatio = totalMonthlyIncome > 0 ? (totalMonthlyDebtPayments / totalMonthlyIncome) * 100 : 0;

    return {
      totalMonthlyIncome,
      totalDebtBalance,
      totalMonthlyDebtPayments,
      totalMonthlyExpenses,
      netMonthlyIncome,
      debtToIncomeRatio
    };
  };

  const generatePDF = async () => {
    console.log('[REPORT-GEN] Starting PDF generation...');
    setGenerating(true);

    try {
      const totals = calculateTotals();
      console.log('[REPORT-GEN] Calculated totals:', totals);
      console.log('[REPORT-GEN] Project data:', {
        incomes: project.incomes.length,
        debts: project.debts.length,
        expenses: project.expenses.length,
        budgets: project.budgets.length
      });

      const payload = {
        title: `${project.name} - Financial Report`,
        data: {
          summary: totals,
          incomes: project.incomes,
          debts: project.debts,
          expenses: project.expenses,
          budgets: project.budgets,
          savingsGoals: project.savingsGoals
        },
        printOptions: {
          pageSize: 'Letter' as const,
          printBackground: true
        },
        save: true
      };

      console.log('[REPORT-GEN] Sending PDF export request with payload:', JSON.stringify(payload, null, 2));

      await window.reports.exportPDF(payload);

      console.log('[REPORT-GEN] PDF generation completed successfully');
      setGenerating(false);
    } catch (error) {
      console.error('[REPORT-GEN] Error generating PDF:', error);
      console.error('[REPORT-GEN] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      alert('Failed to generate PDF report. Please try again.');
      setGenerating(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="section">
      <h2 className="section-title">
        <i className="bi bi-file-earmark-pdf"></i> PDF Report Generator
      </h2>

      {/* Summary Preview */}
      <div style={{
        padding: '1.5rem',
        background: 'rgba(0, 212, 255, 0.05)',
        border: '1px solid var(--info-color)',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{
          margin: '0 0 1rem 0',
          fontSize: '1rem',
          color: 'var(--info-color)',
          fontFamily: 'var(--font-family)',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Report Preview
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          fontFamily: 'var(--font-family)',
          fontSize: '11px'
        }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Monthly Income</div>
            <div style={{ color: 'var(--success-color)', fontWeight: 600, fontSize: '14px' }}>
              {formatCurrencyWithSymbol(totals.totalMonthlyIncome)}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Monthly Expenses</div>
            <div style={{ color: 'var(--warning-color)', fontWeight: 600, fontSize: '14px' }}>
              {formatCurrencyWithSymbol(totals.totalMonthlyExpenses)}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Total Debt</div>
            <div style={{ color: 'var(--danger-color)', fontWeight: 600, fontSize: '14px' }}>
              {formatCurrencyWithSymbol(totals.totalDebtBalance)}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Net Income</div>
            <div style={{
              color: totals.netMonthlyIncome >= 0 ? 'var(--success-color)' : 'var(--danger-color)',
              fontWeight: 600,
              fontSize: '14px'
            }}>
              {formatCurrencyWithSymbol(totals.netMonthlyIncome)}
            </div>
          </div>
        </div>
      </div>

      {/* Report Contents */}
      <div style={{
        padding: '1rem',
        background: 'rgba(0, 0, 0, 0.2)',
        border: '1px solid var(--primary-color)',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{
          margin: '0 0 1rem 0',
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-family)',
          textTransform: 'uppercase'
        }}>
          Report Will Include:
        </h3>

        <ul style={{
          margin: 0,
          paddingLeft: '1.5rem',
          fontFamily: 'var(--font-family)',
          fontSize: '11px',
          color: 'var(--text-primary)',
          lineHeight: '1.8'
        }}>
          <li>Financial Summary (income, expenses, debt ratios)</li>
          <li>Income Sources ({project.incomes.length} items)</li>
          <li>Debts ({project.debts.length} items)</li>
          <li>Expenses ({project.expenses.length} items)</li>
          <li>Budgets ({project.budgets.length} items)</li>
          <li>Savings Goals ({project.savingsGoals.length} items)</li>
        </ul>
      </div>

      {/* Generate Button */}
      <button
        onClick={generatePDF}
        disabled={generating}
        className="btn btn-primary"
        style={{
          width: '100%',
          padding: '1rem',
          fontSize: '14px',
          fontFamily: 'var(--font-family)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          opacity: generating ? 0.6 : 1,
          cursor: generating ? 'not-allowed' : 'pointer'
        }}
      >
        <i className="bi bi-download"></i> {generating ? 'Generating PDF...' : 'Generate PDF Report'}
      </button>

      {/* Info */}
      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        background: 'rgba(0, 212, 255, 0.1)',
        border: '1px solid var(--info-color)',
        borderRadius: '4px',
        fontFamily: 'var(--font-family)',
        fontSize: '12px',
        color: 'var(--text-dim)'
      }}>
        <i className="bi bi-info-circle"></i> The PDF will be generated using Chrome's print engine and automatically saved to your chosen location.
      </div>
    </div>
  );
};

export default ReportGenerator;
