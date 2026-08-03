/**
 * Currency formatting utilities for AfriSpine.
 */

/**
 * Format a number as currency string
 * @param amount - The amount to format
 * @param currency - Currency code (e.g. 'USD', 'GBP', 'NGN', 'KES')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback for unsupported currency codes
    return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
  }
}

/**
 * Format a number with comma separators (no currency symbol)
 */
export function formatNumber(amount: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    GBP: '£',
    EUR: '€',
    NGN: '₦',
    KES: 'KSh',
    GHS: '₵',
    ZAR: 'R',
    UGX: 'USh',
    TZS: 'TSh',
    RWF: 'FRw',
    XOF: 'CFA',
    XAF: 'FCFA',
    CNY: '¥',
  };
  return symbols[currency.toUpperCase()] || currency.toUpperCase();
}