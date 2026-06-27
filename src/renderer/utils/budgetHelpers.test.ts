import { describe, it, expect } from 'vitest';
import { calculateBudgetSpent, monthlyAllocated } from './budgetHelpers';
import { Expense } from '../types';

const expense = (over: Partial<Expense>): Expense => ({
  id: Math.random().toString(),
  name: 'x',
  amount: 0,
  category: 'Food',
  frequency: 'monthly',
  date: '2026-01-01',
  isEssential: false,
  ...over,
});

describe('calculateBudgetSpent', () => {
  it('returns 0 when there are no expenses', () => {
    expect(calculateBudgetSpent([], 'Food')).toBe(0);
  });

  it('sums only expenses in the requested category', () => {
    const expenses = [
      expense({ category: 'Food', amount: 100, frequency: 'monthly' }),
      expense({ category: 'Food', amount: 50, frequency: 'monthly' }),
      expense({ category: 'Housing', amount: 1000, frequency: 'monthly' }),
    ];
    expect(calculateBudgetSpent(expenses, 'Food')).toBe(150);
  });

  it('normalises mixed frequencies to monthly before summing', () => {
    const expenses = [
      expense({ category: 'Food', amount: 1200, frequency: 'yearly' }),   // 100/mo
      expense({ category: 'Food', amount: 100, frequency: 'weekly' }),    // 433.33/mo
    ];
    // 100 + 100*52/12
    expect(calculateBudgetSpent(expenses, 'Food')).toBeCloseTo(100 + (100 * 52) / 12, 6);
  });

  it('ignores one-time expenses (zero monthly impact)', () => {
    const expenses = [
      expense({ category: 'Food', amount: 500, frequency: 'one-time' }),
      expense({ category: 'Food', amount: 200, frequency: 'monthly' }),
    ];
    expect(calculateBudgetSpent(expenses, 'Food')).toBe(200);
  });

  it('returns 0 for a category with no matching expenses', () => {
    const expenses = [expense({ category: 'Food', amount: 100 })];
    expect(calculateBudgetSpent(expenses, 'Entertainment')).toBe(0);
  });

  it('does not throw on an unknown frequency (guarded to 0)', () => {
    const expenses = [expense({ category: 'Food', amount: 100, frequency: 'fortnightly' as any })];
    expect(calculateBudgetSpent(expenses, 'Food')).toBe(0);
  });

  it('defaults to a monthly basis', () => {
    const expenses = [expense({ category: 'Food', amount: 200, frequency: 'monthly' })];
    expect(calculateBudgetSpent(expenses, 'Food')).toBe(200);
  });

  it('scales spending to a yearly basis for yearly budgets', () => {
    const expenses = [expense({ category: 'Food', amount: 200, frequency: 'monthly' })];
    // 200/mo compared against a yearly allocation -> 2400/yr
    expect(calculateBudgetSpent(expenses, 'Food', 'yearly')).toBe(2400);
  });
});

describe('monthlyAllocated', () => {
  it('passes monthly allocations through unchanged', () => {
    expect(monthlyAllocated({ allocated: 500, period: 'monthly' })).toBe(500);
  });

  it('divides yearly allocations across 12 months', () => {
    expect(monthlyAllocated({ allocated: 1200, period: 'yearly' })).toBe(100);
  });
});
