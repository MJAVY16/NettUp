import React from 'react';
import { FinancialProject, Income, Debt, Expense } from '../types';
import { formatCurrencyWithSymbol } from '../utils/formatters';
import { startOfMonth, endOfMonth, getDaysInMonth, eachWeekOfInterval, endOfWeek, getDate, format } from 'date-fns';

interface PayPeriodsProps {
  project: FinancialProject;
  onUpdateSettings: (settings: Partial<FinancialProject['settings']>) => void;
}

interface LineItem {
  name: string;
  amount: number;
  kind: 'debt' | 'expense';
  note?: string;
}

interface PayPeriod {
  label: string;
  subtitle: string;
  items: LineItem[];
  need: number;    // total to pay out this period
  income: number;
  net: number;     // income - need
}

// Weekly-or-more-frequent expenses hit every month; the rest are periodic.
const MONTHLY_RECURRING: Expense['frequency'][] = ['weekly', 'biweekly', 'semi-monthly', 'monthly'];

const CYCLE_MONTHS: Record<string, number> = {
  'every-2-months': 2,
  'quarterly': 3,
  'every-4-months': 4,
  'every-6-months': 6,
  'yearly': 12,
};

const PayPeriods: React.FC<PayPeriodsProps> = ({ project, onUpdateSettings }) => {
  const { incomes, debts, expenses } = project;

  // Primary cadence drives how the month is split into paychecks.
  const getPrimaryPayFrequency = (): 'weekly' | 'biweekly' | 'semi-monthly' | 'monthly' => {
    const freqs = incomes.map(i => i.frequency);
    if (freqs.includes('weekly')) return 'weekly';
    if (freqs.includes('biweekly')) return 'biweekly';
    if (freqs.includes('semi-monthly')) return 'semi-monthly';
    return 'monthly';
  };

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = getDaysInMonth(now);
  const mode = project.settings.payPeriodMode || 'auto';
  const primary = mode === 'auto' ? getPrimaryPayFrequency() : mode;

  // Parse a stored "YYYY-MM-DD" as a LOCAL date. `new Date("2026-07-01")`
  // parses as UTC midnight, which rolls back a day in western timezones and
  // would misassign due days near a period boundary.
  const parseLocal = (iso: string): Date => {
    const [y, m, d] = iso.split('T')[0].split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };
  const dayOf = (iso?: string) => (iso ? parseLocal(iso).getDate() : 1);

  // Whether an expense actually charges in the current month, and on which day.
  // Unlike a naive port, yearly/periodic items only count in their real cycle
  // month — not every month — so a pay period reflects what's truly billed.
  const expenseThisMonth = (e: Expense): { charges: boolean; day: number; amount: number; proratable: boolean } => {
    const day = dayOf(e.date);
    if (MONTHLY_RECURRING.includes(e.frequency)) {
      // Weekly/biweekly/semi-monthly bill multiple times a month → prorate.
      const proratable = e.frequency !== 'monthly';
      return { charges: true, day, amount: e.amount, proratable };
    }
    if (e.frequency === 'one-time') {
      if (e.isPaid || !e.date) return { charges: false, day, amount: 0, proratable: false };
      const d = parseLocal(e.date);
      return { charges: d.getFullYear() === year && d.getMonth() === month, day, amount: e.amount, proratable: false };
    }
    const cycle = CYCLE_MONTHS[e.frequency];
    if (!cycle || !e.date) return { charges: false, day, amount: 0, proratable: false };
    const anchor = parseLocal(e.date);
    const monthsDiff = (year - anchor.getFullYear()) * 12 + (month - anchor.getMonth());
    const onCycle = ((monthsDiff % cycle) + cycle) % cycle === 0;
    return { charges: onCycle, day, amount: e.amount, proratable: false };
  };

  const perMonthMultiplier: Record<string, number> = { weekly: 4.33, biweekly: 2.17, 'semi-monthly': 2 };

  const buildPeriod = (label: string, subtitle: string, startDay: number, endDay: number, totalPeriods: number): PayPeriod => {
    const daysInRange = endDay - startDay + 1;
    const frac = daysInRange / daysInMonth;
    const items: LineItem[] = [];

    // Debts: minimum payment lands in the period containing its due day.
    debts.forEach(d => {
      if (d.dueDate >= startDay && d.dueDate <= endDay && d.minimumPayment > 0) {
        items.push({ name: d.name, amount: d.minimumPayment, kind: 'debt' });
      }
    });

    // Expenses that charge this month, assigned by day (periodic ones prorated).
    expenses.forEach(e => {
      const info = expenseThisMonth(e);
      if (!info.charges) return;
      if (info.proratable) {
        const monthlyEq = e.amount * (perMonthMultiplier[e.frequency] || 1);
        const share = monthlyEq * frac;
        if (share > 0) items.push({ name: e.name, amount: share, kind: 'expense', note: e.frequency });
      } else if (info.day >= startDay && info.day <= endDay) {
        items.push({ name: e.name, amount: info.amount, kind: 'expense', note: e.frequency !== 'monthly' ? e.frequency : undefined });
      }
    });

    // Income allocated to this period.
    const income = incomes.reduce((sum, inc) => {
      const payDay = dayOf(inc.date);
      switch (inc.frequency) {
        case 'weekly': return sum + inc.amount * 4.33 * frac;
        case 'biweekly': return sum + inc.amount * 2.17 * frac;
        case 'semi-monthly': return totalPeriods === 2 ? sum + inc.amount : sum + inc.amount * 2 * frac;
        case 'monthly': return (payDay >= startDay && payDay <= endDay) ? sum + inc.amount : sum;
        case 'yearly': return sum + (inc.amount / 12) * frac;
        default: return sum;
      }
    }, 0);

    const need = items.reduce((s, i) => s + i.amount, 0);
    items.sort((a, b) => b.amount - a.amount);
    return { label, subtitle, items, need, income, net: income - need };
  };

  const buildPeriods = (): PayPeriod[] => {
    if (primary === 'weekly') {
      const weeks = eachWeekOfInterval({ start: startOfMonth(now), end: endOfMonth(now) }, { weekStartsOn: 0 });
      const periods: PayPeriod[] = [];
      weeks.forEach((ws, idx) => {
        const we = endOfWeek(ws, { weekStartsOn: 0 });
        if (ws.getMonth() !== month && we.getMonth() !== month) return;
        const startDay = Math.max(1, getDate(ws));
        const endDay = Math.min(daysInMonth, we.getMonth() === month ? getDate(we) : daysInMonth);
        const label = `${format(new Date(year, month, startDay), 'MMM d')} – ${endDay}`;
        periods.push(buildPeriod(label, `Week ${idx + 1}`, startDay, endDay, weeks.length));
      });
      return periods;
    }
    // Two-paycheck months split at the 15th: the check received on the 1st
    // covers bills due days 1–14, and the check on the 15th covers 15–end.
    if (primary === 'biweekly' || primary === 'semi-monthly') {
      return [
        buildPeriod('1 – 14', 'Paid on the 1st', 1, 14, 2),
        buildPeriod(`15 – ${daysInMonth}`, 'Paid on the 15th', 15, daysInMonth, 2),
      ];
    }
    return [buildPeriod(format(now, 'MMMM yyyy'), 'Full month', 1, daysInMonth, 1)];
  };

  const periods = buildPeriods();
  const patternLabel: Record<string, string> = {
    weekly: 'Weekly',
    biweekly: 'Every 2 weeks',
    'semi-monthly': 'Semi-monthly (1st & 15th)',
    monthly: 'Monthly',
  };

  return (
    <div className="section">
      <div className="section-header" style={{ alignItems: 'baseline' }}>
        <h3 className="section-title" style={{ marginBottom: 0 }}>
          <i className="bi bi-calendar2-week"></i> Pay Periods — {format(now, 'MMMM yyyy')}
        </h3>
        <select
          className="form-select"
          value={mode}
          onChange={(e) => onUpdateSettings({ payPeriodMode: e.target.value as FinancialProject['settings']['payPeriodMode'] })}
          style={{ width: 'auto', padding: '0.25rem 2rem 0.25rem 0.6rem', fontSize: '0.85rem' }}
          title="How the month is split into paychecks"
        >
          <option value="auto">Auto — {patternLabel[getPrimaryPayFrequency()]}</option>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Every 2 weeks (1st & 15th)</option>
          <option value="semi-monthly">Semi-monthly (1st & 15th)</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 1rem' }}>
        What you actually have to pay in each paycheck window this month. Yearly and periodic items only appear in the month they truly bill.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: periods.length > 1 ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
        {periods.map((p, i) => (
          <div key={i} className="stat-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="section-header" style={{ marginBottom: '0.75rem', alignItems: 'baseline' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>{p.label}</span>
              <small style={{ color: 'var(--text-secondary)' }}>{p.subtitle}</small>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Need to pay</div>
                <div style={{ fontWeight: 700, color: 'var(--danger-color)' }}>{formatCurrencyWithSymbol(p.need)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Income</div>
                <div style={{ fontWeight: 700, color: 'var(--success-color)' }}>{formatCurrencyWithSymbol(p.income)}</div>
              </div>
            </div>

            <div style={{
              padding: '0.5rem 0.75rem', borderRadius: '6px', marginBottom: '0.75rem',
              background: p.net >= 0 ? 'color-mix(in srgb, var(--success-color) 12%, transparent)' : 'color-mix(in srgb, var(--danger-color) 12%, transparent)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontWeight: 600, color: p.net >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                {p.net >= 0 ? 'Left over' : 'Shortfall'}
              </span>
              <span style={{ fontWeight: 700, color: p.net >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
                {formatCurrencyWithSymbol(Math.abs(p.net))}
              </span>
            </div>

            {p.items.length > 0 ? (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                {p.items.map((it, j) => (
                  <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.85rem' }}>
                    <span>
                      <i className={`bi ${it.kind === 'debt' ? 'bi-credit-card' : 'bi-arrow-repeat'}`} style={{ color: 'var(--text-dim)', marginRight: '0.4rem' }}></i>
                      {it.name}
                      {it.note && <small style={{ color: 'var(--text-dim)' }}> · {it.note}</small>}
                    </span>
                    <span style={{ color: 'var(--danger-color)' }}>{formatCurrencyWithSymbol(it.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <small style={{ color: 'var(--text-secondary)' }}>Nothing due this period.</small>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PayPeriods;
