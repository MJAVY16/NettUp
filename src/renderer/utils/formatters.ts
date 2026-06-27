export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  locale: string;
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', locale: 'en-US' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', locale: 'en-GB' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso', flag: '🇲🇽', locale: 'es-MX' },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar', flag: '🇨🇦', locale: 'en-CA' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', locale: 'ja-JP' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭', locale: 'de-CH' },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar', flag: '🇦🇺', locale: 'en-AU' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷', locale: 'pt-BR' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', locale: 'en-IN' }
];

let currentCurrencyCode = 'USD';
let currentLocale = 'en-US';

export function setCurrencyConfig(code: string) {
  const info = SUPPORTED_CURRENCIES.find(c => c.code === code);
  if (info) {
    currentCurrencyCode = info.code;
    currentLocale = info.locale;
  }
}

export function getCurrencyConfig(): CurrencyInfo {
  return SUPPORTED_CURRENCIES.find(c => c.code === currentCurrencyCode) || SUPPORTED_CURRENCIES[0];
}

/**
 * Format a number as currency without symbol
 */
export function formatCurrency(amount: number, decimals?: number): string {
  const dec = decimals ?? (currentCurrencyCode === 'JPY' ? 0 : 2);
  return amount.toLocaleString(currentLocale, {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec
  });
}

/**
 * Format a number as currency with symbol (e.g., "$1,234.56" or "¥1,235")
 */
export function formatCurrencyWithSymbol(amount: number, decimals?: number): string {
  const dec = decimals ?? (currentCurrencyCode === 'JPY' ? 0 : 2);
  try {
    return new Intl.NumberFormat(currentLocale, {
      style: 'currency',
      currency: currentCurrencyCode,
      minimumFractionDigits: dec,
      maximumFractionDigits: dec
    }).format(amount);
  } catch {
    // Fallback
    const info = getCurrencyConfig();
    return `${info.symbol}${formatCurrency(amount, dec)}`;
  }
}

/**
 * Frequency multipliers for converting to monthly amounts
 */
export const FREQUENCY_MULTIPLIERS: Record<string, number> = {
  'weekly': 52 / 12,    // 4.3333 — exact: 52 weeks / 12 months
  'biweekly': 26 / 12,  // 2.1667 — exact: 26 pay periods / 12 months
  'semi-monthly': 2,
  'monthly': 1,
  'every-2-months': 0.5,
  'quarterly': 1/3,
  'every-4-months': 0.25,
  'every-6-months': 1/6,
  'yearly': 1/12,
  'one-time': 0
};

/**
 * Convert an amount to its monthly equivalent based on frequency
 */
export function calculateMonthlyAmount(amount: number, frequency: string): number {
  return amount * (FREQUENCY_MULTIPLIERS[frequency] || 0);
}

/**
 * Format a frequency string for display
 */
export function formatFrequency(frequency: string): string {
  const labels: Record<string, string> = {
    'weekly': 'Weekly',
    'biweekly': 'Bi-weekly',
    'semi-monthly': 'Semi-monthly',
    'monthly': 'Monthly',
    'every-2-months': 'Every 2 Months',
    'quarterly': 'Quarterly',
    'every-4-months': 'Every 4 Months',
    'every-6-months': 'Every 6 Months',
    'yearly': 'Yearly',
    'one-time': 'One-time'
  };
  return labels[frequency] || frequency;
}
