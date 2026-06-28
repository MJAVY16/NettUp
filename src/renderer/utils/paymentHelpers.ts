import { Debt } from '../types';

/**
 * Most recent occurrence of `dueDay` on or before `ref`, clamped to the target
 * month's length (so a "31st" due day resolves to the last day of short months).
 */
export function mostRecentDueDate(dueDay: number, ref: Date): Date {
  const clampDay = (y: number, m: number) => Math.min(dueDay, new Date(y, m + 1, 0).getDate());
  const y = ref.getFullYear();
  const m = ref.getMonth();
  const thisMonth = new Date(y, m, clampDay(y, m));
  if (thisMonth.getTime() <= ref.getTime()) return thisMonth;
  const prev = new Date(y, m - 1, 1);
  return new Date(prev.getFullYear(), prev.getMonth(), clampDay(prev.getFullYear(), prev.getMonth()));
}

/**
 * Counts scheduled monthly payments that fall after `since` and on/before
 * `today` — i.e. how many payment cycles are now due.
 */
export function countDuePayments(dueDay: number, since: Date, today: Date): number {
  if (since.getTime() >= today.getTime()) return 0;
  let count = 0;
  let y = since.getFullYear();
  let m = since.getMonth();
  // Walk months forward from `since`; bounded as a safety net.
  for (let i = 0; i < 1200; i++) {
    const day = Math.min(dueDay, new Date(y, m + 1, 0).getDate());
    const due = new Date(y, m, day);
    if (due.getTime() > today.getTime()) break;
    if (due.getTime() > since.getTime()) count++;
    m++;
    if (m > 11) { m = 0; y++; }
  }
  return count;
}

export interface DuePayment {
  debt: Debt;
  cycles: number;       // number of payment periods now due
  amount: number;       // payment amount per cycle
  totalAmount: number;  // amount * cycles
  throughDate: string;  // ISO date the payment(s) bring the debt current to
}

/** Returns the due-payment info for a single debt, or null if nothing is due. */
export function getDuePaymentForDebt(debt: Debt, today: Date): DuePayment | null {
  // Closed cards or zero-balance debts have nothing to pay.
  if (debt.isClosed || debt.balance <= 0) return null;
  // Need a baseline; debts without one are baselined on load (see App).
  if (!debt.lastPaymentDate) return null;

  const since = new Date(debt.lastPaymentDate);
  const cycles = countDuePayments(debt.dueDate, since, today);
  if (cycles <= 0) return null;

  const amount = debt.minimumPayment || 0;
  const throughDate = mostRecentDueDate(debt.dueDate, today).toISOString();

  return {
    debt,
    cycles,
    amount,
    totalAmount: amount * cycles,
    throughDate,
  };
}

/** All debts with at least one payment now due. */
export function getDuePayments(debts: Debt[], today: Date): DuePayment[] {
  return debts
    .map(d => getDuePaymentForDebt(d, today))
    .filter((p): p is DuePayment => p !== null);
}

/**
 * Computes the field updates for applying a due payment: reduces the balance
 * (clamped at 0), advances paymentsMade for installment plans (capped at the
 * total), and stamps lastPaymentDate.
 */
export function applyDuePayment(due: DuePayment): Partial<Debt> {
  const { debt, cycles, amount, throughDate } = due;
  const updates: Partial<Debt> = {
    balance: Math.max(0, debt.balance - amount * cycles),
    lastPaymentDate: throughDate,
  };

  if (debt.type === 'payment-plan' && debt.totalPayments !== undefined) {
    const made = (debt.paymentsMade || 0) + cycles;
    updates.paymentsMade = Math.min(debt.totalPayments, made);
  }

  return updates;
}
