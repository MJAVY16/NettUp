import { Expense } from '../types';

const MONTHLY_FREQS: Expense['frequency'][] = ['weekly', 'biweekly', 'semi-monthly', 'monthly'];
const PER_MONTH: Record<string, number> = { weekly: 4.33, biweekly: 2.17, 'semi-monthly': 2, monthly: 1 };
const CYCLE_MONTHS: Record<string, number> = { 'every-2-months': 2, quarterly: 3, 'every-4-months': 4, 'every-6-months': 6, yearly: 12 };

// Parse a stored "YYYY-MM-DD" as a LOCAL date (avoids the UTC-parse day shift).
function parseLocal(iso: string): Date {
  const [y, m, d] = iso.split('T')[0].split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/**
 * The amount an expense contributes to a specific calendar month, for true
 * month-by-month projection. Monthly-recurring items contribute their
 * monthly-equivalent every month; yearly/periodic items contribute their full
 * amount ONLY in the month they actually bill (so the projection spikes up on
 * a yearly renewal instead of smearing it flat across the year).
 */
export function expenseChargeForMonth(e: Expense, year: number, month: number): number {
  if (MONTHLY_FREQS.includes(e.frequency)) {
    return e.amount * (PER_MONTH[e.frequency] || 1);
  }
  if (e.frequency === 'one-time') {
    if (e.isPaid || !e.date) return 0;
    const d = parseLocal(e.date);
    return d.getFullYear() === year && d.getMonth() === month ? e.amount : 0;
  }
  const cycle = CYCLE_MONTHS[e.frequency];
  if (!cycle || !e.date) return 0;
  const anchor = parseLocal(e.date);
  const monthsDiff = (year - anchor.getFullYear()) * 12 + (month - anchor.getMonth());
  return ((monthsDiff % cycle) + cycle) % cycle === 0 ? e.amount : 0;
}
