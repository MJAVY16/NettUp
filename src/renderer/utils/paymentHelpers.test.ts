import { describe, it, expect } from 'vitest';
import { mostRecentDueDate, countDuePayments, getDuePaymentForDebt, applyDuePayment } from './paymentHelpers';
import { Debt } from '../types';

const at = (y: number, m: number, d: number) => new Date(y, m, d, 12, 0, 0);

const debt = (over: Partial<Debt>): Debt => ({
  id: '1', name: 'x', type: 'loan', balance: 1000, interestRate: 5,
  minimumPayment: 100, dueDate: 15, ...over,
});

describe('mostRecentDueDate', () => {
  it('returns this month when the due day has passed', () => {
    const r = mostRecentDueDate(15, at(2026, 5, 20)); // Jun 20 -> Jun 15
    expect(r.getMonth()).toBe(5);
    expect(r.getDate()).toBe(15);
  });

  it('returns last month when the due day is still ahead', () => {
    const r = mostRecentDueDate(15, at(2026, 5, 10)); // Jun 10 -> May 15
    expect(r.getMonth()).toBe(4);
    expect(r.getDate()).toBe(15);
  });

  it('clamps day 31 to a short month', () => {
    const r = mostRecentDueDate(31, at(2026, 1, 28)); // Feb 28 2026 -> Feb 28 (clamped)
    expect(r.getMonth()).toBe(1);
    expect(r.getDate()).toBe(28);
  });
});

describe('countDuePayments', () => {
  it('is zero when nothing has elapsed', () => {
    expect(countDuePayments(15, at(2026, 5, 15), at(2026, 5, 20))).toBe(0);
  });

  it('counts one cycle after a due date passes', () => {
    // since May 15, today Jun 20 -> Jun 15 due => 1
    expect(countDuePayments(15, at(2026, 4, 15), at(2026, 5, 20))).toBe(1);
  });

  it('counts multiple missed cycles', () => {
    // since Jan 15, today May 20 -> Feb,Mar,Apr,May = 4
    expect(countDuePayments(15, at(2026, 0, 15), at(2026, 4, 20))).toBe(4);
  });

  it('does not count a due date that is still in the future', () => {
    expect(countDuePayments(15, at(2026, 4, 15), at(2026, 5, 10))).toBe(0); // Jun 15 not reached
  });
});

describe('getDuePaymentForDebt', () => {
  it('returns null without a baseline lastPaymentDate', () => {
    expect(getDuePaymentForDebt(debt({}), at(2026, 5, 20))).toBeNull();
  });

  it('returns null for closed or zero-balance debts', () => {
    expect(getDuePaymentForDebt(debt({ isClosed: true, lastPaymentDate: at(2026, 4, 15).toISOString() }), at(2026, 5, 20))).toBeNull();
    expect(getDuePaymentForDebt(debt({ balance: 0, lastPaymentDate: at(2026, 4, 15).toISOString() }), at(2026, 5, 20))).toBeNull();
  });

  it('reports cycles and total when due', () => {
    const d = debt({ lastPaymentDate: at(2026, 2, 15).toISOString(), minimumPayment: 100 });
    const due = getDuePaymentForDebt(d, at(2026, 5, 20)); // Apr,May,Jun = 3
    expect(due?.cycles).toBe(3);
    expect(due?.totalAmount).toBe(300);
  });
});

describe('applyDuePayment', () => {
  it('reduces balance by amount*cycles, clamped at 0', () => {
    const d = debt({ balance: 250, minimumPayment: 100, lastPaymentDate: at(2026, 2, 15).toISOString() });
    const due = getDuePaymentForDebt(d, at(2026, 5, 20))!; // 3 cycles, 300
    const upd = applyDuePayment(due);
    expect(upd.balance).toBe(0); // 250 - 300 clamped
    expect(upd.lastPaymentDate).toBeDefined();
  });

  it('advances paymentsMade for installment plans, capped at total', () => {
    const d = debt({ type: 'payment-plan', totalPayments: 6, paymentsMade: 4, minimumPayment: 50, balance: 100, lastPaymentDate: at(2026, 2, 15).toISOString() });
    const due = getDuePaymentForDebt(d, at(2026, 5, 20))!; // 3 cycles
    const upd = applyDuePayment(due);
    expect(upd.paymentsMade).toBe(6); // 4 + 3 capped at 6
  });
});
