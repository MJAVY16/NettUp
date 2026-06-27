/**
 * Calculates the next occurrence of a monthly payment due day.
 *
 * The due day is clamped to the number of days in the target month so a debt
 * due on the 31st doesn't silently roll forward into the following month
 * (e.g. "Feb 31" resolves to Feb 28/29, not Mar 3).
 *
 * @param dueDay Day of the month the payment is due (1-31).
 * @param today  Reference date; defaults to now. Injectable for testing.
 */
export function getNextPaymentDate(dueDay: number, today: Date = new Date()): Date {
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const clampedDay = (year: number, month: number) => Math.min(dueDay, daysInMonth(year, month));

  // If the due day hasn't passed this month, the payment is this month.
  if (currentDay <= dueDay) {
    return new Date(currentYear, currentMonth, clampedDay(currentYear, currentMonth));
  }

  // Otherwise it's next month.
  const nextMonth = new Date(currentYear, currentMonth + 1, 1);
  const ny = nextMonth.getFullYear();
  const nm = nextMonth.getMonth();
  return new Date(ny, nm, clampedDay(ny, nm));
}
