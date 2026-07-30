// ── AfriSpine Shared Constants & Config ────────────────────────────────

export const SOURCE_COUNTRIES = [
  { code: 'UK', label: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', symbol: '£' },
  { code: 'US', label: 'United States', flag: '🇺🇸', currency: 'USD', symbol: '$' },
  { code: 'EU', label: 'European Union', flag: '🇪🇺', currency: 'EUR', symbol: '€' },
] as const

export type DestCode = 'KE' | 'NG' | 'GH' | 'TZ' | 'UG' | 'SN' | 'RW'

export const DESTINATIONS: Record<string, {
  name: string; flag: string; tag: string; currency: string;
  prefix: string; provider: string; deliveryMethod: string;
}> = {
  KE: { name: 'Kenya', flag: '🇰🇪', tag: 'M-Pesa', currency: 'KES', prefix: '+254', provider: 'Safaricom M-Pesa', deliveryMethod: 'mobile_money' },
  NG: { name: 'Nigeria', flag: '🇳🇬', tag: 'MoMo', currency: 'NGN', prefix: '+234', provider: 'MTN MoMo', deliveryMethod: 'mobile_money' },
  GH: { name: 'Ghana', flag: '🇬🇭', tag: 'MoMo', currency: 'GHS', prefix: '+233', provider: 'Airtel Money', deliveryMethod: 'mobile_money' },
  TZ: { name: 'Tanzania', flag: '🇹🇿', tag: 'M-Pesa', currency: 'TZS', prefix: '+255', provider: 'Vodacom M-Pesa', deliveryMethod: 'mobile_money' },
  UG: { name: 'Uganda', flag: '🇺🇬', tag: 'MoMo', currency: 'UGX', prefix: '+256', provider: 'MTN MoMo', deliveryMethod: 'mobile_money' },
  SN: { name: 'Senegal', flag: '🇸🇳', tag: 'Orange Money', currency: 'XOF', prefix: '+221', provider: 'Orange Money', deliveryMethod: 'mobile_money' },
  RW: { name: 'Rwanda', flag: '🇷🇼', tag: 'MoMo', currency: 'RWF', prefix: '+250', provider: 'MTN MoMo', deliveryMethod: 'mobile_money' },
}

// Fallback FX rates (used when live API unavailable)
export const FALLBACK_FX: Record<string, number> = {
  GBP_KES: 170.5, USD_KES: 153.5, EUR_KES: 185.2,
  GBP_NGN: 1950, USD_NGN: 1580, EUR_NGN: 1700,
  GBP_GHS: 18.5, USD_GHS: 15.1, EUR_GHS: 20.2,
  GBP_TZS: 3200, USD_TZS: 2650, EUR_TZS: 3500,
  GBP_UGX: 4600, USD_UGX: 3820, EUR_UGX: 5000,
  GBP_XOF: 740, USD_XOF: 620, EUR_XOF: 655.96,
  GBP_RWF: 1550, USD_RWF: 1300, EUR_RWF: 1680,
}

// Fee percentages per corridor
export const FEE_PCT: Record<string, number> = {
  KE: 1.5, NG: 2.0, GH: 1.7, TZ: 1.9, UG: 1.8, SN: 1.6, RW: 1.7,
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: '£', USD: '$', EUR: '€', KES: 'KES', NGN: '₦', GHS: '₵',
  TZS: 'TZS', UGX: 'UGX', XOF: 'CFA', RWF: 'RWF',
}

export function getCurrencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code] || code
}

export function getFxRate(base: string, target: string): number {
  return FALLBACK_FX[`${base}_${target}`] || 100
}

export function generateRef(prefix: string = 'AS'): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let ref = `${prefix}-`
  for (let i = 0; i < 8; i++) ref += chars.charAt(Math.floor(Math.random() * chars.length))
  return ref
}

export const TRANSFER_REASONS = [
  { value: 'family', label: 'Family Support' },
  { value: 'education', label: 'Education' },
  { value: 'business', label: 'Business' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'other', label: 'Other' },
]

export const ID_TYPES = [
  { value: 'passport', label: 'Passport' },
  { value: 'national_id', label: 'National ID' },
  { value: 'drivers_license', label: "Driver's License" },
]

export const DELIVERY_METHODS = [
  { value: 'mobile_money', label: 'Mobile Money', icon: 'Smartphone' },
  { value: 'bank', label: 'Bank Transfer', icon: 'Building2' },
  { value: 'cash', label: 'Cash Pickup', icon: 'Banknote' },
]

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  quote:           { label: 'Quoted', color: 'text-yellow-700', bg: 'bg-yellow-100 border-yellow-300' },
  kyc_pending:     { label: 'KYC Pending', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300' },
  payment_pending: { label: 'Payment Pending', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300' },
  processing:      { label: 'Processing', color: 'text-orange-700', bg: 'bg-orange-100 border-orange-300' },
  delivered:       { label: 'Delivered', color: 'text-green-700', bg: 'bg-green-100 border-green-300' },
  failed:          { label: 'Failed', color: 'text-red-700', bg: 'bg-red-100 border-red-300' },
  refunded:        { label: 'Refunded', color: 'text-gray-700', bg: 'bg-gray-100 border-gray-300' },
  matched:         { label: 'Matched', color: 'text-purple-700', bg: 'bg-purple-100 border-purple-300' },
}
