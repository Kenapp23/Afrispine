const RATE_CACHE: Record<string, { rate: number; fetchedAt: number }> = {};
const CACHE_TTL = 5 * 60 * 1000;

const BASE_RATES: Record<string, number> = {
  'GBP-KES': 169.3, 'USD-KES': 129.5, 'EUR-KES': 145.2,
  'GBP-NGN': 1950, 'USD-NGN': 1500, 'GBP-GHS': 15.2,
  'USD-GHS': 11.5, 'GBP-UGX': 4750, 'USD-UGX': 3650,
  'GBP-TZS': 3250, 'USD-TZS': 2500, 'GBP-RWF': 1550,
  'USD-RWF': 1190, 'GBP-ZAR': 23.5, 'USD-ZAR': 18.0,
  'GBP-ZMW': 33.5, 'USD-ZMW': 25.7, 'GBP-SNH': 870,
  'USD-SNH': 670, 'GBP-CMH': 760, 'USD-CMH': 585,
};

export async function getFxRate(from: string, to: string): Promise<number> {
  const key = `${from}-${to}`;
  const cached = RATE_CACHE[key];
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) return cached.rate;
  
  const rate = BASE_RATES[key] || (from === to ? 1 : 150);
  RATE_CACHE[key] = { rate, fetchedAt: Date.now() };
  return rate;
}

export async function applyMargin(rate: number, corridor: string): Promise<number> {
  return rate * 0.985; // 1.5% margin
}

export function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
