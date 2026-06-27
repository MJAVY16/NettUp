import React, { useEffect, useRef, useState } from 'react';
import { formatCurrencyWithSymbol } from '../utils/formatters';
import { calculateBudgetSpent } from '../utils/budgetHelpers';

interface ReportPayload {
  title: string;
  data: {
    summary: {
      totalMonthlyIncome: number;
      totalMonthlyExpenses: number;
      totalMonthlyDebtPayments: number;
      netMonthlyIncome: number;
      totalDebtBalance: number;
      debtToIncomeRatio: number;
    };
    incomes: Array<any>;
    debts: Array<any>;
    expenses: Array<any>;
    budgets: Array<any>;
  };
}

const ReportPage: React.FC = () => {
  const [payload, setPayload] = useState<ReportPayload | null>(null);
  const signaled = useRef(false);

  // Step 1: Tell main we're mounted as soon as the component is ready
  useEffect(() => {
    console.log('[REPORT-PAGE] Component mounted');
    const reportSignal = (window as any).reportSignal;
    console.log('[REPORT-PAGE] window.reportSignal available?', !!reportSignal);

    if (reportSignal?.mounted) {
      console.log('[REPORT-PAGE] Calling reportSignal.mounted()...');
      reportSignal.mounted();
      console.log('[REPORT-PAGE] mounted() called');
    } else {
      console.error('[REPORT-PAGE] reportSignal.mounted not available!');
    }
  }, []);

  // Step 2: Receive data from main via preload and signal ready after rendering
  useEffect(() => {
    console.log('[REPORT-PAGE] Setting up REPORT_DATA event listener...');

    const onData = (e: Event) => {
      const ce = e as CustomEvent<ReportPayload>;
      console.log('[REPORT-PAGE] Data received via REPORT_DATA event');
      console.log('[REPORT-PAGE] Data summary:', {
        title: ce.detail?.title,
        incomes: ce.detail?.data?.incomes?.length || 0,
        debts: ce.detail?.data?.debts?.length || 0,
        expenses: ce.detail?.data?.expenses?.length || 0,
        budgets: ce.detail?.data?.budgets?.length || 0
      });

      setPayload(ce.detail);
      console.log('[REPORT-PAGE] Payload set, waiting for fonts and layout...');

      // Wait for fonts/charts to finish rendering, then signal ready
      const waitFonts = (document as any).fonts?.ready ?? Promise.resolve();
      waitFonts.then(() => {
        console.log('[REPORT-PAGE] Fonts loaded, scheduling ready signal...');
        setTimeout(() => {
          console.log('[REPORT-PAGE] Ready timeout fired');
          console.log('[REPORT-PAGE] signaled.current:', signaled.current);

          if (!signaled.current) {
            const reportSignal = (window as any).reportSignal;
            if (reportSignal?.ready) {
              console.log('[REPORT-PAGE] Calling reportSignal.ready()...');
              reportSignal.ready();
              signaled.current = true;
              console.log('[REPORT-PAGE] ready() called');
            } else {
              console.error('[REPORT-PAGE] reportSignal.ready not available!');
            }
          } else {
            console.log('[REPORT-PAGE] Already signaled, skipping');
          }
        }, 300);
      });
    };

    window.addEventListener('REPORT_DATA', onData as EventListener);
    console.log('[REPORT-PAGE] REPORT_DATA event listener registered');

    return () => {
      console.log('[REPORT-PAGE] Removing REPORT_DATA event listener');
      window.removeEventListener('REPORT_DATA', onData as EventListener);
    };
  }, []);

  if (!payload) {
    console.log('[REPORT-PAGE] Rendering: Preparing report...');
    return (
      <>
        <style>{`
          /* Hide all theme effects for PDF report */
          html, body {
            background: #ffffff !important;
            animation: none !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
          }
          body::before,
          body::after,
          body *::before,
          body *::after,
          .app::before,
          .app::after,
          .app *::before,
          .app *::after {
            display: none !important;
            content: none !important;
            background: none !important;
            animation: none !important;
          }
          * {
            animation: none !important;
          }
          #root, .app {
            background: transparent !important;
            min-height: auto !important;
            height: auto !important;
          }
        `}</style>
        <div style={{
          width: '100%',
          minHeight: '100vh',
          padding: 48,
          fontFamily: 'Arial, sans-serif',
          backgroundColor: '#ffffff',
          color: '#000000'
        }}>
          <p>Preparing report...</p>
        </div>
      </>
    );
  }

  console.log('[REPORT-PAGE] Rendering: Report with data');

  const { title, data } = payload;
  const { summary, incomes, debts, expenses, budgets } = data;

  return (
    <>
      <style>{`
        /* Hide all theme effects for PDF report */
        html, body {
          background: #ffffff !important;
          animation: none !important;
          overflow: visible !important;
          margin: 0 !important;
          padding: 0 !important;
          height: auto !important;
        }
        body::before,
        body::after,
        body *::before,
        body *::after,
        .app::before,
        .app::after,
        .app *::before,
        .app *::after {
          display: none !important;
          content: none !important;
          background: none !important;
          animation: none !important;
        }
        * {
          animation: none !important;
        }
        #root, .app {
          background: transparent !important;
          min-height: auto !important;
          height: auto !important;
        }
      `}</style>
      <div style={{
        width: '100%',
        minHeight: '100vh',
        fontFamily: 'Arial, sans-serif',
        padding: '48px',
        backgroundColor: '#ffffff',
        color: '#000000'
      }}>
        {/* Header */}
      <div style={{ marginBottom: 32, borderBottom: '2px solid #333', paddingBottom: 16 }}>
        <h1 style={{ fontSize: 28, margin: 0, fontWeight: 'bold' }}>{title}</h1>
        <p style={{ fontSize: 12, margin: '8px 0 0 0', color: '#666' }}>
          Generated on {new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>

      {/* Financial Summary */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16, fontWeight: 'bold' }}>Financial Summary</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Monthly Income</td>
              <td style={{ padding: '8px 0', textAlign: 'right' }}>{formatCurrencyWithSymbol(summary.totalMonthlyIncome)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Monthly Expenses</td>
              <td style={{ padding: '8px 0', textAlign: 'right' }}>{formatCurrencyWithSymbol(summary.totalMonthlyExpenses)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Monthly Debt Payments</td>
              <td style={{ padding: '8px 0', textAlign: 'right' }}>{formatCurrencyWithSymbol(summary.totalMonthlyDebtPayments)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Net Monthly Income</td>
              <td style={{ padding: '8px 0', textAlign: 'right', color: summary.netMonthlyIncome >= 0 ? '#28a745' : '#dc3545' }}>
                {formatCurrencyWithSymbol(summary.netMonthlyIncome)}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Total Debt Balance</td>
              <td style={{ padding: '8px 0', textAlign: 'right' }}>{formatCurrencyWithSymbol(summary.totalDebtBalance)}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Debt-to-Income Ratio</td>
              <td style={{ padding: '8px 0', textAlign: 'right' }}>{summary.debtToIncomeRatio.toFixed(1)}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Income Sources */}
      {incomes && incomes.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, marginBottom: 16, fontWeight: 'bold' }}>Income Sources</h2>
          {incomes.map((income, idx) => (
            <div key={idx} style={{
              marginBottom: 16,
              paddingBottom: 16,
              borderBottom: '1px solid #eee',
              pageBreakInside: 'avoid',
              breakInside: 'avoid'
            }}>
              <h3 style={{ fontSize: 14, marginBottom: 8, fontWeight: 'bold' }}>{income.source}</h3>
              <div style={{ fontSize: 11, lineHeight: 1.6 }}>
                <div><strong>Amount:</strong> {formatCurrencyWithSymbol(income.amount)} ({income.frequency})</div>
                <div><strong>Category:</strong> {income.category}</div>
                {income.notes && <div><strong>Notes:</strong> {income.notes}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Debts */}
      {debts && debts.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, marginBottom: 16, fontWeight: 'bold' }}>Debts</h2>
          {debts.map((debt, idx) => (
            <div key={idx} style={{
              marginBottom: 16,
              paddingBottom: 16,
              borderBottom: '1px solid #eee',
              pageBreakInside: 'avoid',
              breakInside: 'avoid'
            }}>
              <h3 style={{ fontSize: 14, marginBottom: 8, fontWeight: 'bold' }}>{debt.name}</h3>
              <div style={{ fontSize: 11, lineHeight: 1.6 }}>
                <div><strong>Type:</strong> {debt.type}</div>
                <div><strong>Balance:</strong> {formatCurrencyWithSymbol(debt.balance)}</div>
                <div><strong>Interest Rate:</strong> {debt.interestRate}%</div>
                <div><strong>Minimum Payment:</strong> {formatCurrencyWithSymbol(debt.minimumPayment)}</div>
                {debt.notes && <div><strong>Notes:</strong> {debt.notes}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expenses */}
      {expenses && expenses.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, marginBottom: 16, fontWeight: 'bold' }}>Expenses</h2>
          {expenses.map((expense, idx) => (
            <div key={idx} style={{
              marginBottom: 16,
              paddingBottom: 16,
              borderBottom: '1px solid #eee',
              pageBreakInside: 'avoid',
              breakInside: 'avoid'
            }}>
              <h3 style={{ fontSize: 14, marginBottom: 8, fontWeight: 'bold' }}>{expense.name}</h3>
              <div style={{ fontSize: 11, lineHeight: 1.6 }}>
                <div><strong>Amount:</strong> {formatCurrencyWithSymbol(expense.amount)} ({expense.frequency})</div>
                <div><strong>Category:</strong> {expense.category}</div>
                <div><strong>Essential:</strong> {expense.isEssential ? 'Yes' : 'No'}</div>
                {expense.notes && <div><strong>Notes:</strong> {expense.notes}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Budgets */}
      {budgets && budgets.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, marginBottom: 16, fontWeight: 'bold' }}>Budgets</h2>
          {budgets.map((budget, idx) => {
            const spent = calculateBudgetSpent(expenses || [], budget.category, budget.period);
            const remaining = budget.allocated - spent;
            const percentUsed = budget.allocated > 0 ? (spent / budget.allocated * 100).toFixed(1) : '0.0';
            return (
              <div key={idx} style={{
                marginBottom: 16,
                paddingBottom: 16,
                borderBottom: '1px solid #eee',
                pageBreakInside: 'avoid',
                breakInside: 'avoid'
              }}>
                <h3 style={{ fontSize: 14, marginBottom: 8, fontWeight: 'bold' }}>{budget.category}</h3>
                <div style={{ fontSize: 11, lineHeight: 1.6 }}>
                  <div><strong>Allocated:</strong> {formatCurrencyWithSymbol(budget.allocated)}</div>
                  <div><strong>Spent:</strong> {formatCurrencyWithSymbol(spent)}</div>
                  <div><strong>Remaining:</strong> {formatCurrencyWithSymbol(remaining)} ({percentUsed}% used)</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 48, paddingTop: 16, borderTop: '1px solid #ddd', fontSize: 10, color: '#666', textAlign: 'center' }}>
        Generated by NettUp
      </div>
      </div>
    </>
  );
};

export default ReportPage;
