import { Budget, Expense } from '../types';
import { calculateMonthlyAmount } from './formatters';

/**
 * Derives the amount spent in a budget category from the live expense list.
 *
 * Budget spending is always computed from expenses rather than stored, so it
 * can never drift out of sync when expenses are added, edited or removed.
 *
 * The result is scaled to match the budget's period so it can be compared
 * directly against `allocated`: a 'yearly' budget gets twelve months of
 * spending, a 'monthly' budget gets one. Defaults to monthly.
 *
 * @param expenses The full expense list.
 * @param category The budget category to total spending for.
 * @param period   The budget period the result should be scaled to.
 * @returns Spending for the category, expressed in the requested period.
 */
export function calculateBudgetSpent(
  expenses: Expense[],
  category: string,
  period: Budget['period'] = 'monthly'
): number {
  const monthly = expenses
    .filter(e => e.category === category)
    .reduce((sum, expense) => sum + calculateMonthlyAmount(expense.amount, expense.frequency), 0);

  return period === 'yearly' ? monthly * 12 : monthly;
}

/**
 * Normalises a budget's allocated amount to its monthly equivalent, so budgets
 * with different periods can be summed on a common basis.
 */
export function monthlyAllocated(budget: Pick<Budget, 'allocated' | 'period'>): number {
  return budget.period === 'yearly' ? budget.allocated / 12 : budget.allocated;
}
