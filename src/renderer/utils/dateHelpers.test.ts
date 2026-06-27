import { describe, it, expect } from 'vitest';
import { getNextPaymentDate } from './dateHelpers';

// Helper: build a local date at noon to avoid any DST/midnight edge effects.
const at = (y: number, m: number, d: number) => new Date(y, m, d, 12, 0, 0);

describe('getNextPaymentDate', () => {
  it('returns this month when the due day is still ahead', () => {
    const result = getNextPaymentDate(20, at(2026, 5, 10)); // Jun 10 -> due 20th
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(5); // June
    expect(result.getDate()).toBe(20);
  });

  it('returns this month when today IS the due day', () => {
    const result = getNextPaymentDate(15, at(2026, 5, 15));
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(15);
  });

  it('rolls to next month once the due day has passed', () => {
    const result = getNextPaymentDate(5, at(2026, 5, 10)); // Jun 10, due 5th passed
    expect(result.getMonth()).toBe(6); // July
    expect(result.getDate()).toBe(5);
  });

  it('clamps day 31 to a 30-day month instead of overflowing', () => {
    // Apr 15, due 31 -> still this month, but April has 30 days.
    const result = getNextPaymentDate(31, at(2026, 3, 15));
    expect(result.getMonth()).toBe(3); // still April, NOT May
    expect(result.getDate()).toBe(30);
  });

  it('clamps day 31 to February (non-leap year)', () => {
    // Feb 10 2026, due 31 -> Feb 28 (2026 is not a leap year).
    const result = getNextPaymentDate(31, at(2026, 1, 10));
    expect(result.getMonth()).toBe(1); // February
    expect(result.getDate()).toBe(28);
  });

  it('clamps day 30 to February in a leap year to the 29th', () => {
    // Feb 10 2024 (leap), due 30 -> Feb 29.
    const result = getNextPaymentDate(30, at(2024, 1, 10));
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(29);
  });

  it('rolls from December into the next calendar year', () => {
    // Dec 20 2026, due 5th passed -> Jan 5 2027.
    const result = getNextPaymentDate(5, at(2026, 11, 20));
    expect(result.getFullYear()).toBe(2027);
    expect(result.getMonth()).toBe(0); // January
    expect(result.getDate()).toBe(5);
  });

  it('clamps when rolling into a short next month', () => {
    // Jan 31 2026, due 31 passed today? today is the 31st so it is this month.
    // Use Feb scenario: Jan 31, due 30 -> already passed (31 > 30) -> Feb, clamp to 28.
    const result = getNextPaymentDate(30, at(2026, 0, 31));
    expect(result.getMonth()).toBe(1); // February
    expect(result.getDate()).toBe(28);
  });
});
