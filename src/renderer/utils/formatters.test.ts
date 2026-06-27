import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateMonthlyAmount,
  FREQUENCY_MULTIPLIERS,
  formatFrequency,
  formatCurrency,
  setCurrencyConfig,
  getCurrencyConfig,
} from './formatters';

describe('calculateMonthlyAmount', () => {
  it('returns the amount unchanged for monthly', () => {
    expect(calculateMonthlyAmount(1000, 'monthly')).toBe(1000);
  });

  it('annualizes weekly amounts exactly (×12 = 52 weeks)', () => {
    // 100/week → 100 * 52/12 per month → *12 == 5200/year
    expect(calculateMonthlyAmount(100, 'weekly') * 12).toBeCloseTo(5200, 6);
  });

  it('annualizes biweekly amounts exactly (×12 = 26 periods)', () => {
    expect(calculateMonthlyAmount(100, 'biweekly') * 12).toBeCloseTo(2600, 6);
  });

  it('treats semi-monthly as twice per month', () => {
    expect(calculateMonthlyAmount(500, 'semi-monthly')).toBe(1000);
  });

  it('spreads yearly amounts across 12 months', () => {
    expect(calculateMonthlyAmount(1200, 'yearly')).toBeCloseTo(100, 6);
  });

  it('spreads quarterly amounts across 3 months', () => {
    expect(calculateMonthlyAmount(300, 'quarterly')).toBeCloseTo(100, 6);
  });

  it('counts one-time amounts as zero monthly impact', () => {
    expect(calculateMonthlyAmount(9999, 'one-time')).toBe(0);
  });

  it('returns 0 for an unknown frequency instead of NaN', () => {
    // This is the guard that the Charts component used to lack.
    expect(calculateMonthlyAmount(100, 'fortnightly')).toBe(0);
    expect(calculateMonthlyAmount(100, '' as string)).toBe(0);
  });

  it('handles a zero amount', () => {
    expect(calculateMonthlyAmount(0, 'weekly')).toBe(0);
  });

  it('every defined multiplier produces a finite number', () => {
    for (const freq of Object.keys(FREQUENCY_MULTIPLIERS)) {
      expect(Number.isFinite(calculateMonthlyAmount(123.45, freq))).toBe(true);
    }
  });
});

describe('formatFrequency', () => {
  it('maps known frequencies to friendly labels', () => {
    expect(formatFrequency('biweekly')).toBe('Bi-weekly');
    expect(formatFrequency('every-6-months')).toBe('Every 6 Months');
    expect(formatFrequency('one-time')).toBe('One-time');
  });

  it('falls back to the raw value for unknown frequencies', () => {
    expect(formatFrequency('whenever')).toBe('whenever');
  });
});

describe('currency formatting', () => {
  beforeEach(() => {
    setCurrencyConfig('USD');
  });

  it('formats USD with two decimals and grouping', () => {
    expect(formatCurrency(1234.5)).toBe('1,234.50');
  });

  it('honours an explicit decimals override', () => {
    expect(formatCurrency(1234.567, 0)).toBe('1,235');
  });

  it('defaults JPY to zero decimals', () => {
    setCurrencyConfig('JPY');
    expect(formatCurrency(1234.56)).toBe('1,235');
  });

  it('ignores unsupported currency codes and keeps the previous config', () => {
    setCurrencyConfig('USD');
    setCurrencyConfig('XYZ');
    expect(getCurrencyConfig().code).toBe('USD');
  });
});
