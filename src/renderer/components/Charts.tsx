import React from 'react';
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { FinancialProject } from '../types';
import { calculateMonthlyAmount } from '../utils/formatters';
import { expenseChargeForMonth } from '../utils/projection';
import { format } from 'date-fns';

interface ChartsProps {
  project: FinancialProject;
}

const Charts: React.FC<ChartsProps> = ({ project }) => {
  // Vibrant, distinct colors for pie chart categories
  const COLORS = [
    '#00ff9f', // Bright green
    '#ff3366', // Hot pink
    '#00d4ff', // Cyan
    '#ffcc00', // Gold
    '#9d4edd', // Purple
    '#ff6b35', // Orange
    '#06ffa5', // Mint
    '#ff006e', // Magenta
    '#00ffff', // Aqua
    '#ffd60a', // Yellow
    '#06d6a0', // Teal
    '#ff5400'  // Bright orange-red
  ];

  // Generate unique hatch patterns for different categories
  const HATCH_PATTERNS = [
    { id: 'hatch0', path: 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2' }, // Diagonal down-right
    { id: 'hatch1', path: 'M-1,3 l2,2 M0,0 l4,4 M3,-1 l2,2' }, // Diagonal down-left
    { id: 'hatch2', path: 'M0,0 l0,4 M2,0 l0,4' }, // Vertical lines
    { id: 'hatch3', path: 'M0,0 l4,0 M0,2 l4,0' }, // Horizontal lines
    { id: 'hatch4', path: 'M0,2 l4,0 M2,0 l0,4' }, // Cross hatch
    { id: 'hatch5', path: 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2 M-1,3 l2,2 M0,0 l4,4 M3,-1 l2,2' }, // Double diagonal
    { id: 'hatch6', path: 'M0,0 l4,4 M0,4 l4,-4' }, // X pattern
    { id: 'hatch7', path: 'M1,0 l0,4 M3,0 l0,4 M0,1 l4,0 M0,3 l4,0' }, // Grid
    { id: 'hatch8', path: 'M0,1 l4,0 M0,3 l4,0' }, // Thick horizontal
    { id: 'hatch9', path: 'M1,0 l0,4 M3,0 l0,4' }, // Thick vertical
    { id: 'hatch10', path: 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2' }, // Diagonal repeat
    { id: 'hatch11', path: 'M0,0 l4,0 M0,4 l4,0' }, // Wide horizontal
  ];

  // Theme-aware styling. Spy keeps its neon "blueprint" look (hatch fills,
  // accent grids); Light/Dark get solid fills, a muted palette, and neutral
  // grid/axis colors for a cleaner, modern chart.
  const isSpy = (document.documentElement.getAttribute('data-theme') || 'light') === 'spy';
  const MODERN_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#06b6d4', '#e11d48'];
  const palette = isSpy ? COLORS : MODERN_COLORS;
  const gridStroke = isSpy ? 'var(--primary-color)' : 'var(--border-color)';
  const gridOpacity = isSpy ? 0.2 : 0.6;
  const axisStroke = isSpy ? 'var(--primary-color)' : 'var(--text-secondary)';
  const cellFill = (prefix: string, index: number) =>
    isSpy ? `url(#${prefix}-${HATCH_PATTERNS[index % HATCH_PATTERNS.length].id})` : palette[index % palette.length];
  const cellStroke = (index: number) => (isSpy ? COLORS[index % COLORS.length] : 'var(--surface-color)');

  const incomeByCategory = project.incomes.reduce((acc, income) => {
    const monthly = calculateMonthlyAmount(income.amount, income.frequency);
    acc[income.category] = (acc[income.category] || 0) + monthly;
    return acc;
  }, {} as Record<string, number>);

  const incomeData = Object.entries(incomeByCategory).map(([name, value]) => ({
    name,
    value: parseFloat(value.toFixed(2))
  }));

  const expenseByCategory = project.expenses.reduce((acc, expense) => {
    const monthly = calculateMonthlyAmount(expense.amount, expense.frequency);
    acc[expense.category] = (acc[expense.category] || 0) + monthly;
    return acc;
  }, {} as Record<string, number>);

  const expenseData = Object.entries(expenseByCategory).map(([name, value]) => ({
    name,
    value: parseFloat(value.toFixed(2))
  }));

  const debtByType = project.debts.reduce((acc, debt) => {
    acc[debt.type] = (acc[debt.type] || 0) + debt.balance;
    return acc;
  }, {} as Record<string, number>);

  const debtData = Object.entries(debtByType).map(([name, value]) => ({
    name: name.replace('-', ' '),
    value: parseFloat(value.toFixed(2))
  }));

  const totalMonthlyIncome = project.incomes.reduce((sum, income) => {
    return sum + calculateMonthlyAmount(income.amount, income.frequency);
  }, 0);

  const totalMonthlyExpenses = project.expenses.reduce((sum, expense) => {
    return sum + calculateMonthlyAmount(expense.amount, expense.frequency);
  }, 0);

  const totalMonthlyDebtPayments = project.debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);

  const monthlyOverview = [
    { name: 'Income', value: parseFloat(totalMonthlyIncome.toFixed(2)), fill: '#27ae60' },
    { name: 'Expenses', value: parseFloat(totalMonthlyExpenses.toFixed(2)), fill: '#e74c3c' },
    { name: 'Debt Payments', value: parseFloat(totalMonthlyDebtPayments.toFixed(2)), fill: '#f39c12' },
    { name: 'Net Savings', value: parseFloat(Math.max(0, totalMonthlyIncome - totalMonthlyExpenses - totalMonthlyDebtPayments).toFixed(2)), fill: '#3498db' }
  ];

  const debtProgress = project.debts.map(debt => ({
    name: debt.name,
    type: debt.type,
    balance: parseFloat(debt.balance.toFixed(2)),
    paid: parseFloat((debt.originalAmount ? debt.originalAmount - debt.balance : 0).toFixed(2)),
    interest: parseFloat(debt.interestRate.toFixed(2)),
    isPaymentPlan: debt.type === 'payment-plan' && (debt.totalPayments || 0) > 0,
    totalPayments: debt.totalPayments || 0,
    paymentsMade: debt.paymentsMade || 0
  }));

  // Calculate realistic 12-month projection accounting for debt payoffs
  const cashFlow = [];
  const currentDate = new Date();

  // Track each debt's remaining balance and status
  const debtTracker = project.debts.map(debt => ({
    id: debt.id,
    name: debt.name,
    remainingBalance: debt.balance,
    monthlyPayment: debt.minimumPayment,
    interestRate: debt.interestRate,
    isPaymentPlan: debt.type === 'payment-plan' && (debt.totalPayments || 0) > 0,
    totalPayments: debt.totalPayments || 0,
    paymentsMade: debt.paymentsMade || 0,
    isPaidOff: false
  }));

  let cumulativeSavings = 0;

  for (let i = 0; i < 12; i++) {
    const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);

    // This month's actual expenses: monthly items every month, plus any
    // yearly/periodic items that truly bill in this specific month (spikes up).
    const monthExpenses = project.expenses.reduce(
      (sum, e) => sum + expenseChargeForMonth(e, monthDate.getFullYear(), monthDate.getMonth()),
      0
    );

    // Calculate this month's active debt payments
    let monthlyDebtPayments = 0;

    debtTracker.forEach(debt => {
      if (!debt.isPaidOff) {
        monthlyDebtPayments += debt.monthlyPayment;

        // Calculate interest for this month
        const monthlyInterest = (debt.remainingBalance * (debt.interestRate / 100)) / 12;

        // Calculate principal payment (payment minus interest)
        const principalPayment = Math.max(0, debt.monthlyPayment - monthlyInterest);

        // Update remaining balance
        debt.remainingBalance = Math.max(0, debt.remainingBalance - principalPayment);

        // For payment plans, track payments made
        if (debt.isPaymentPlan) {
          debt.paymentsMade += 1;

          // Check if payment plan is complete
          if (debt.paymentsMade >= debt.totalPayments || debt.remainingBalance <= 0) {
            debt.isPaidOff = true;
            debt.remainingBalance = 0;
          }
        } else {
          // For other debts, check if balance is paid off
          if (debt.remainingBalance <= 0) {
            debt.isPaidOff = true;
            debt.remainingBalance = 0;
          }
        }
      }
    });

    // Calculate net flow for this month with current active debts
    const netFlow = totalMonthlyIncome - monthExpenses - monthlyDebtPayments;
    cumulativeSavings += netFlow;

    cashFlow.push({
      month: format(monthDate, 'MMM yyyy'),
      income: parseFloat(totalMonthlyIncome.toFixed(2)),
      expenses: parseFloat((monthExpenses + monthlyDebtPayments).toFixed(2)),
      net: parseFloat(netFlow.toFixed(2)),
      cumulative: parseFloat(cumulativeSavings.toFixed(2))
    });
  }

  return (
    <div className="charts">
      <div className="section">
        <h2 className="section-title">Financial Analytics</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--primary-color)', boxShadow: 'var(--shadow)' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--primary-color)' }}>Monthly Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyOverview}>
                <defs>
                  <pattern id="diagonalHatch" patternUnits="userSpaceOnUse" width="4" height="4">
                    <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="var(--primary-color)" strokeWidth="0.5" opacity="0.3" />
                  </pattern>
                </defs>
                <CartesianGrid strokeDasharray="5 5" stroke={gridStroke} opacity={gridOpacity} />
                <XAxis dataKey="name" stroke={axisStroke} style={{ fontSize: '12px', fontFamily: 'var(--font-family)' }} />
                <YAxis stroke={axisStroke} style={{ fontSize: '12px', fontFamily: 'var(--font-family)' }} />
                <Tooltip
                  formatter={(value: any) => `$${parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  contentStyle={{ background: 'var(--surface-color)', border: '1px solid var(--primary-color)', fontFamily: 'var(--font-family)', fontSize: '12px' }}
                  labelStyle={{ color: 'var(--primary-color)' }}
                  cursor={false}
                />
                <Legend wrapperStyle={{ fontFamily: 'var(--font-family)', fontSize: '12px' }} onClick={() => {}} />
                <Bar
                  dataKey="value"
                  fill={isSpy ? 'url(#diagonalHatch)' : 'var(--primary-color)'}
                  stroke={isSpy ? 'var(--primary-color)' : 'none'}
                  strokeWidth={1.5}
                  name="Amount"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--secondary-color)', boxShadow: 'var(--shadow)' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--secondary-color)' }}>Income Distribution</h3>
            <div
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
              onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
              onDoubleClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
              style={{ userSelect: 'none' }}
            >
            <ResponsiveContainer width="100%" height={450}>
              <PieChart>
                <defs>
                  {HATCH_PATTERNS.map((pattern, index) => (
                    <pattern key={pattern.id} id={`income-${pattern.id}`} patternUnits="userSpaceOnUse" width="4" height="4">
                      <path d={pattern.path} stroke={COLORS[index % COLORS.length]} strokeWidth="0.8" opacity="0.6" />
                    </pattern>
                  ))}
                </defs>
                <Pie
                  data={incomeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  fill="transparent"
                  stroke="var(--secondary-color)"
                  strokeWidth={2}
                  dataKey="value"
                  isAnimationActive={false}
                >
                  {incomeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={cellFill('income', index)}
                      stroke={cellStroke(index)}
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => `$${parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  contentStyle={{ background: 'var(--surface-color)', border: '1px solid var(--secondary-color)', fontFamily: 'var(--font-family)', fontSize: '12px' }}
                  labelStyle={{ color: 'var(--secondary-color)' }}
                />
                <Legend wrapperStyle={{ fontFamily: 'var(--font-family)', fontSize: '12px' }} onClick={() => {}} />
              </PieChart>
            </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--warning-color)', boxShadow: 'var(--shadow)' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--warning-color)' }}>Expense Breakdown</h3>
            <div
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
              onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
              onDoubleClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
              style={{ userSelect: 'none' }}
            >
            <ResponsiveContainer width="100%" height={450}>
              <PieChart>
                <defs>
                  {HATCH_PATTERNS.map((pattern, index) => (
                    <pattern key={pattern.id} id={`expense-${pattern.id}`} patternUnits="userSpaceOnUse" width="4" height="4">
                      <path d={pattern.path} stroke={COLORS[index % COLORS.length]} strokeWidth="0.8" opacity="0.6" />
                    </pattern>
                  ))}
                </defs>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  fill="transparent"
                  stroke="var(--warning-color)"
                  strokeWidth={2}
                  dataKey="value"
                  isAnimationActive={false}
                >
                  {expenseData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={cellFill('expense', index)}
                      stroke={cellStroke(index)}
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => `$${parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  contentStyle={{ background: 'var(--surface-color)', border: '1px solid var(--warning-color)', fontFamily: 'var(--font-family)', fontSize: '12px' }}
                  labelStyle={{ color: 'var(--warning-color)' }}
                />
                <Legend wrapperStyle={{ fontFamily: 'var(--font-family)', fontSize: '12px' }} onClick={() => {}} />
              </PieChart>
            </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--danger-color)', boxShadow: 'var(--shadow)' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--danger-color)' }}>Debt by Type</h3>
            {debtData.length > 0 ? (
              <div
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                onDoubleClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                style={{ userSelect: 'none' }}
              >
              <ResponsiveContainer width="100%" height={450}>
                <PieChart>
                  <defs>
                    {HATCH_PATTERNS.map((pattern, index) => (
                      <pattern key={pattern.id} id={`debt-${pattern.id}`} patternUnits="userSpaceOnUse" width="4" height="4">
                        <path d={pattern.path} stroke={COLORS[index % COLORS.length]} strokeWidth="0.8" opacity="0.6" />
                      </pattern>
                    ))}
                  </defs>
                  <Pie
                    data={debtData}
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    fill="transparent"
                    stroke="var(--danger-color)"
                    strokeWidth={2}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {debtData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={cellFill('debt', index)}
                        stroke={cellStroke(index)}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => `$${parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    contentStyle={{ background: 'var(--surface-color)', border: '1px solid var(--danger-color)', fontFamily: 'var(--font-family)', fontSize: '12px' }}
                    labelStyle={{ color: 'var(--danger-color)' }}
                  />
                  <Legend wrapperStyle={{ fontFamily: 'var(--font-family)', fontSize: '12px' }} onClick={() => {}} />
                </PieChart>
              </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ height: 450, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: 'var(--text-secondary)' }}>No debt data available</p>
              </div>
            )}
          </div>
        </div>

        <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--info-color)', boxShadow: 'var(--shadow)', marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--info-color)' }}>12-Month Cash Flow Projection</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={cashFlow}>
              <defs>
                <pattern id="cashFlowHatch" patternUnits="userSpaceOnUse" width="4" height="4">
                  <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="var(--info-color)" strokeWidth="0.5" opacity="0.1" />
                </pattern>
              </defs>
              <CartesianGrid strokeDasharray="5 5" stroke={gridStroke} opacity={gridOpacity} />
              <XAxis dataKey="month" stroke={axisStroke} style={{ fontSize: '12px', fontFamily: 'var(--font-family)' }} />
              <YAxis stroke={axisStroke} style={{ fontSize: '12px', fontFamily: 'var(--font-family)' }} />
              <Tooltip
                formatter={(value: any) => `$${parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                contentStyle={{ background: 'var(--surface-color)', border: '1px solid var(--info-color)', fontFamily: 'var(--font-family)', fontSize: '12px' }}
                labelStyle={{ color: 'var(--info-color)' }}
              />
              <Legend wrapperStyle={{ fontFamily: 'var(--font-family)', fontSize: '12px' }} />
              <Line type="monotone" dataKey="income" stroke="var(--success-color)" strokeWidth={2} name="Income" dot={{ fill: 'var(--success-color)', r: 3 }} />
              <Line type="monotone" dataKey="expenses" stroke="var(--danger-color)" strokeWidth={2} name="Expenses" strokeDasharray="5 5" dot={{ fill: 'var(--danger-color)', r: 3 }} />
              <Line type="monotone" dataKey="net" stroke="var(--secondary-color)" strokeWidth={2} name="Net" dot={{ fill: 'var(--secondary-color)', r: 3 }} />
              <Line type="monotone" dataKey="cumulative" stroke="var(--info-color)" strokeWidth={2} name="Cumulative Savings" strokeDasharray="8 4" dot={{ fill: 'var(--info-color)', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {debtProgress.length > 0 && (
          <div style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--success-color)', boxShadow: 'var(--shadow)' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--success-color)' }}>Debt Payoff Progress</h3>

            {/* SVG patterns for hatching */}
            <svg width="0" height="0" style={{ position: 'absolute' }}>
              <defs>
                <pattern id="paidHatch" patternUnits="userSpaceOnUse" width="4" height="4">
                  <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="var(--success-color)" strokeWidth="0.5" opacity="0.5" />
                </pattern>
                <pattern id="balanceHatch" patternUnits="userSpaceOnUse" width="4" height="4">
                  <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" stroke="#ff3366" strokeWidth="0.5" opacity="0.5" />
                </pattern>
              </defs>
            </svg>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {debtProgress.map((debt, index) => {
                let percentage: number;
                let progressText: string;

                if (debt.isPaymentPlan) {
                  const paymentsMade = debt.paymentsMade || 0;
                  const totalPayments = debt.totalPayments || 1;
                  const paymentsRemaining = totalPayments - paymentsMade;
                  percentage = (paymentsMade / totalPayments) * 100;
                  progressText = `${paymentsMade} of ${totalPayments} Payments • ${paymentsRemaining} Remaining`;
                } else {
                  const total = debt.paid + debt.balance;
                  percentage = total > 0 ? (debt.paid / total) * 100 : 0;
                  progressText = `Paid: $${debt.paid.toLocaleString()} • Remaining: $${debt.balance.toLocaleString()}`;
                }

                return (
                  <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {/* Debt name and stats */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{
                        fontFamily: 'var(--font-family)',
                        fontSize: '14px',
                        color: 'var(--success-color)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {debt.name}
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-family)',
                        fontSize: '13px',
                        color: 'var(--text-secondary)'
                      }}>
                        {percentage.toFixed(1)}% Complete
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      height: '32px',
                      background: 'var(--surface-color)',
                      border: '1px solid var(--success-color)',
                      overflow: 'hidden'
                    }}>
                      {/* Paid portion (green) */}
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${percentage}%`,
                        background: isSpy ? 'url(#paidHatch)' : 'var(--success-color)',
                        borderRight: percentage > 0 && percentage < 100 ? '1px solid var(--success-color)' : 'none',
                        transition: 'width 0.3s ease'
                      }}>
                        {isSpy && (
                          <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                            <rect width="100%" height="100%" fill="url(#paidHatch)" />
                          </svg>
                        )}
                      </div>

                      {/* Remaining portion (red) */}
                      <div style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        height: '100%',
                        width: `${100 - percentage}%`,
                        background: isSpy ? 'url(#balanceHatch)' : 'var(--danger-color)',
                        transition: 'width 0.3s ease'
                      }}>
                        {isSpy && (
                          <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                            <rect width="100%" height="100%" fill="url(#balanceHatch)" />
                          </svg>
                        )}
                      </div>

                      {/* Center text overlay */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-family)',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#fff',
                        textShadow: '0 0 4px #000, 0 0 8px #000',
                        pointerEvents: 'none'
                      }}>
                        {progressText}
                      </div>
                    </div>

                    {/* Additional details */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontFamily: 'var(--font-family)',
                      fontSize: '12px',
                      color: 'var(--text-dim)'
                    }}>
                      <span>
                        {debt.isPaymentPlan
                          ? `Balance: $${debt.balance.toLocaleString()}`
                          : `Total: $${(debt.paid + debt.balance).toLocaleString()}`
                        }
                      </span>
                      <span>Interest Rate: {debt.interest}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Charts;