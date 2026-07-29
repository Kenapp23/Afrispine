// ── Trading Fee Calculation ──────────────────────────────────────
// Flat fee under £500, 0.5% for £500–£10k, 0.3% for £10k+
const TRADING_FEE_FLAT_GBP = parseFloat(process.env.TRADING_FEE_FLAT_GBP || '1.50');
const TRADING_FEE_PCT_MID = parseFloat(process.env.TRADING_FEE_PCT_MID || '0.005'); // 0.5%
const TRADING_FEE_PCT_LARGE = parseFloat(process.env.TRADING_FEE_PCT_LARGE || '0.003'); // 0.3%

export function calculateTradingFee(amountGbp: number): number {
  if (amountGbp < 500) return TRADING_FEE_FLAT_GBP;
  if (amountGbp <= 10000) return amountGbp * TRADING_FEE_PCT_MID;
  return amountGbp * TRADING_FEE_PCT_LARGE;
}

// ── FX Conversion Fee ────────────────────────────────────────────
// Always 1.5% of the GBP investment amount
const INVESTMENT_FX_MARGIN_PCT = parseFloat(process.env.INVESTMENT_FX_MARGIN_PCT || '1.5');

export function calculateFxMargin(amountGbp: number, marginPct = INVESTMENT_FX_MARGIN_PCT): number {
  return amountGbp * (marginPct / 100);
}

// ── AUM Fee (quarterly) ──────────────────────────────────────────
// 0.125% per quarter (0.5% per year)
export const AUM_FEE_ANNUAL_PCT = parseFloat(process.env.AUM_FEE_ANNUAL_PCT || '0.005');
export const AUM_FEE_QUARTERLY_PCT = parseFloat(process.env.AUM_FEE_QUARTERLY_PCT || '0.00125');

export function calculateAumFee(aumValueUsd: number): number {
  return aumValueUsd * AUM_FEE_QUARTERLY_PCT;
}

// ── Settlement Date Calculation ──────────────────────────────────
// Per exchange T+N rules, skipping weekends
const SETTLEMENT_DAYS: Record<string, number> = {
  NSE: 3,   // Kenya T+3
  NGX: 3,   // Nigeria T+3
  JSE: 3,   // South Africa T+3
  GSE: 2,   // Ghana T+2
  BRVM: 3,  // West Africa T+3
  LuSE: 4,  // Zambia T+4
  USE: 3,   // Uganda T+3
  EGX: 3,   // Egypt T+3
};

export function calculateSettlementDate(exchange: string, orderDate: Date): Date {
  const days = SETTLEMENT_DAYS[exchange] || 3;
  const settlement = new Date(orderDate);
  let added = 0;
  while (added < days) {
    settlement.setDate(settlement.getDate() + 1);
    if (settlement.getDay() !== 0 && settlement.getDay() !== 6) added++;
  }
  return settlement;
}

// ── Exchange Currency Mapping ────────────────────────────────────
export const EXCHANGE_CURRENCIES: Record<string, string> = {
  NSE: 'KES',
  NGX: 'NGN',
  JSE: 'ZAR',
  GSE: 'GHS',
  BRVM: 'XOF',
  LuSE: 'ZMW',
  USE: 'UGX',
  EGX: 'EGP',
  DSE: 'TZS',
};

// ── Exchange Suffix Mapping (for mystocks ticker format) ─────────
export const EXCHANGE_SUFFIXES: Record<string, string> = {
  NSE: 'KE',
  NGX: 'NG',
  JSE: 'ZA',
  GSE: 'GH',
  BRVM: 'BF',
  LuSE: 'ZM',
  USE: 'UG',
  EGX: 'EG',
  DSE: 'TZ',
};

export function toMystocksTicker(ticker: string, exchange: string): string {
  const suffix = EXCHANGE_SUFFIXES[exchange];
  if (!suffix) return ticker;
  if (ticker.includes('.')) return ticker; // already has suffix
  return `${ticker}.${suffix}`;
}

export function stripTickerSuffix(mystocksTicker: string): { ticker: string; exchange: string } {
  const parts = mystocksTicker.split('.');
  if (parts.length === 2) {
    // Reverse lookup
    const suffixToExchange: Record<string, string> = {
      KE: 'NSE', NG: 'NGX', ZA: 'JSE', GH: 'GSE',
      BF: 'BRVM', ZM: 'LuSE', UG: 'USE', EG: 'EGX', TZ: 'DSE',
    };
    return {
      ticker: parts[0],
      exchange: suffixToExchange[parts[1]] || parts[1],
    };
  }
  return { ticker: mystocksTicker, exchange: '' };
}

// ── Order Reference Generator ────────────────────────────────────
export function generateOrderReference(): string {
  const count = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  return `INV-2026-${count}`;
}

// ── Full Investment Quote Calculator ─────────────────────────────
export interface InvestmentQuote {
  ticker: string;
  exchange: string;
  companyName: string;
  currentPriceLocal: number;
  currencyLocal: string;
  gbpToUsdRate: number;
  usdToLocalRate: number;
  investMode: 'amount' | 'shares';
  // Inputs
  investmentAmountGbp: number;
  sharesRequested: number;
  // Calculated
  investmentAmountUsd: number;
  fxFeeGbp: number;
  tradingFeeGbp: number;
  totalChargedGbp: number;
  totalChargedUsd: number;
  netInvestmentUsd: number;
  estimatedShares: number;
  settlementDate: string;
  settlementDays: number;
  orderType: string;
  limitPriceUsd: number | null;
  quoteExpiresAt: string;
  reference: string;
}

export function buildQuote(params: {
  ticker: string;
  exchange: string;
  companyName: string;
  currentPriceLocal: number;
  currencyLocal: string;
  gbpToUsdRate: number;
  usdToLocalRate: number;
  mode: 'amount' | 'shares';
  amountGbp: number;
  shares: number;
  orderType: string;
  limitPriceUsd: number | null;
}): InvestmentQuote {
  const {
    ticker, exchange, companyName, currentPriceLocal,
    currencyLocal, gbpToUsdRate, usdToLocalRate,
    mode, amountGbp, shares, orderType, limitPriceUsd,
  } = params;

  const settlementDays = SETTLEMENT_DAYS[exchange] || 3;
  const settlementDate = calculateSettlementDate(exchange, new Date());
  const quoteExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min
  const reference = generateOrderReference();

  if (mode === 'amount') {
    const fxFeeGbp = calculateFxMargin(amountGbp);
    const tradingFeeGbp = calculateTradingFee(amountGbp);
    const totalChargedGbp = amountGbp + fxFeeGbp + tradingFeeGbp;
    const totalChargedUsd = totalChargedGbp * gbpToUsdRate;
    const netInvestmentUsd = (amountGbp - fxFeeGbp - tradingFeeGbp) * gbpToUsdRate;
    const priceUsd = currentPriceLocal / usdToLocalRate;
    const estimatedShares = priceUsd > 0 ? Math.floor(netInvestmentUsd / priceUsd) : 0;

    return {
      ticker, exchange, companyName, currentPriceLocal, currencyLocal,
      gbpToUsdRate, usdToLocalRate, investMode: 'amount',
      investmentAmountGbp: amountGbp,
      sharesRequested: estimatedShares,
      investmentAmountUsd: netInvestmentUsd,
      fxFeeGbp, tradingFeeGbp, totalChargedGbp, totalChargedUsd,
      netInvestmentUsd, estimatedShares,
      settlementDate: settlementDate.toISOString(),
      settlementDays, orderType, limitPriceUsd,
      quoteExpiresAt: quoteExpiresAt.toISOString(),
      reference,
    };
  } else {
    // Invest by shares
    const priceUsd = currentPriceLocal / usdToLocalRate;
    const investmentAmountUsd = shares * priceUsd;
    const amountGbpCalc = investmentAmountUsd / gbpToUsdRate;
    const fxFeeGbp = calculateFxMargin(amountGbpCalc);
    const tradingFeeGbp = calculateTradingFee(amountGbpCalc);
    const totalChargedGbp = amountGbpCalc + fxFeeGbp + tradingFeeGbp;
    const totalChargedUsd = totalChargedGbp * gbpToUsdRate;

    return {
      ticker, exchange, companyName, currentPriceLocal, currencyLocal,
      gbpToUsdRate, usdToLocalRate, investMode: 'shares',
      investmentAmountGbp: totalChargedGbp,
      sharesRequested: shares,
      investmentAmountUsd,
      fxFeeGbp, tradingFeeGbp, totalChargedGbp, totalChargedUsd,
      netInvestmentUsd: investmentAmountUsd, estimatedShares: shares,
      settlementDate: settlementDate.toISOString(),
      settlementDays, orderType, limitPriceUsd,
      quoteExpiresAt: quoteExpiresAt.toISOString(),
      reference,
    };
  }
}