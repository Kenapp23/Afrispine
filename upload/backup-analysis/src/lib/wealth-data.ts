// ── Simulated African market data for Phase 1 ──────────────────
// In production, this would call mystocks.africa and Mansa APIs.

export interface ExchangeInfo {
  id: string;
  name: string;
  country: string;
  flag: string;
  indexName: string;
  indexValue: number;
  indexChange: number;
  indexChangePct: number;
  marketCapUsd: string;
  return2025: string;
  currency: string;
  topMover: { ticker: string; name: string; change: string };
}

export interface StockQuote {
  ticker: string;
  name: string;
  exchange: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  marketCap: string;
  peRatio: number | null;
  dividendYield: number | null;
  week52High: number;
  week52Low: number;
  sector: string;
  description: string;
}

export const EXCHANGES: ExchangeInfo[] = [
  { id: 'ngx', name: 'NGX Nigeria', country: 'Nigeria', flag: 'NG', indexName: 'All-Share', indexValue: 232049, indexChange: 1530, indexChangePct: 0.66, marketCapUsd: '$114B+', return2025: '+51%', currency: 'NGN', topMover: { ticker: 'DANGCEM', name: 'Dangote Cement', change: '+3.2%' } },
  { id: 'nse', name: 'NSE Kenya', country: 'Kenya', flag: 'KE', indexName: 'NSE 20', indexValue: 3139, indexChange: 8, indexChangePct: 0.25, marketCapUsd: '$27.4B', return2025: '+56%', currency: 'KES', topMover: { ticker: 'SCOM', name: 'Safaricom', change: '+1.1%' } },
  { id: 'jse', name: 'JSE South Africa', country: 'South Africa', flag: 'ZA', indexName: 'JSE Top 40', indexValue: 78420, indexChange: 770, indexChangePct: 0.98, marketCapUsd: '$1.4T', return2025: '+12%', currency: 'ZAR', topMover: { ticker: 'NPN', name: 'Naspers', change: '+2.1%' } },
  { id: 'gse', name: 'GSE Ghana', country: 'Ghana', flag: 'GH', indexName: 'GSE Composite', indexValue: 4820, indexChange: 9, indexChangePct: 0.18, marketCapUsd: '$22.6B', return2025: '+134%', currency: 'GHS', topMover: { ticker: 'MTNGH', name: 'MTN Ghana', change: '+1.5%' } },
  { id: 'egx', name: 'EGX Egypt', country: 'Egypt', flag: 'EG', indexName: 'EGX 30', indexValue: 32100, indexChange: -120, indexChangePct: -0.37, marketCapUsd: '$180B', return2025: '+40%', currency: 'EGP', topMover: { ticker: 'ORAS', name: 'Orascom', change: '+0.8%' } },
  { id: 'brvm', name: 'BRVM', country: 'West Africa (8)', flag: 'SN', indexName: 'BRVM Composite', indexValue: 285, indexChange: 1.1, indexChangePct: 0.40, marketCapUsd: '$18B', return2025: '+22%', currency: 'XOF', topMover: { ticker: 'SONATEL', name: 'Sonatel', change: '+0.5%' } },
];

export const STOCKS: Record<string, StockQuote[]> = {
  nse: [
    { ticker: 'SCOM', name: 'Safaricom', exchange: 'NSE', price: 40.50, change: 0.25, changePct: 0.62, volume: 2400000, marketCap: '$7.2B', peRatio: 14.2, dividendYield: 8.2, week52High: 44.80, week52Low: 31.20, sector: 'Telecoms', description: 'Africa\'s most profitable telecom. M-Pesa processes $314B/year across 7 countries.' },
    { ticker: 'EQTY', name: 'Equity Group', exchange: 'NSE', price: 48.00, change: 0.80, changePct: 1.69, volume: 890000, marketCap: '$4.8B', peRatio: 6.2, dividendYield: 5.1, week52High: 55.50, week52Low: 38.00, sector: 'Banking', description: 'East Africa\'s largest bank by customer accounts. Operating in 7 countries.' },
    { ticker: 'KCB', name: 'KCB Group', exchange: 'NSE', price: 44.75, change: -0.25, changePct: -0.56, volume: 1200000, marketCap: '$3.9B', peRatio: 5.8, dividendYield: 6.4, week52High: 50.20, week52Low: 36.50, sector: 'Banking', description: 'Kenya\'s largest commercial bank by assets. Strong regional expansion.' },
    { ticker: 'COOP', name: 'Co-operative Bank', exchange: 'NSE', price: 16.20, change: 0.10, changePct: 0.62, volume: 3400000, marketCap: '$1.4B', peRatio: 4.8, dividendYield: 7.3, week52High: 18.90, week52Low: 12.50, sector: 'Banking', description: 'Kenya\'s third-largest bank with deep co-operative movement ties.' },
    { ticker: 'SBIC', name: 'SBIC Insurance', exchange: 'NSE', price: 12.80, change: 0.40, changePct: 3.23, volume: 560000, marketCap: '$0.5B', peRatio: 8.5, dividendYield: 3.2, week52High: 15.60, week52Low: 8.90, sector: 'Insurance', description: 'One of Kenya\'s largest insurance providers with growing regional footprint.' },
    { ticker: 'BTCK', name: 'Bata Kenya', exchange: 'NSE', price: 78.50, change: -1.20, changePct: -1.51, volume: 45000, marketCap: '$0.3B', peRatio: 11.0, dividendYield: 2.8, week52High: 95.00, week52Low: 65.00, sector: 'Manufacturing', description: 'Leading footwear retailer and manufacturer in East Africa.' },
    { ticker: 'UACG', name: 'Uchumi Supermarket', exchange: 'NSE', price: 4.20, change: 0.05, changePct: 1.20, volume: 780000, marketCap: '$0.1B', peRatio: null, dividendYield: 0, week52High: 5.80, week52Low: 3.10, sector: 'Retail', description: 'One of Kenya\'s oldest supermarket chains undergoing turnaround.' },
    { ticker: 'LIMT', name: 'Limuru Tea', exchange: 'NSE', price: 210.00, change: 5.00, changePct: 2.44, volume: 12000, marketCap: '$0.1B', peRatio: 9.2, dividendYield: 4.1, week52High: 240.00, week52Low: 160.00, sector: 'Agriculture', description: 'Premium tea producer with estates in Kenya\'s highlands.' },
  ],
  ngx: [
    { ticker: 'DANGCEM', name: 'Dangote Cement', exchange: 'NGX', price: 8500, change: 270, changePct: 3.28, volume: 5200000, marketCap: '$14.5B', peRatio: 7.8, dividendYield: 6.5, week52High: 9200, week52Low: 6100, sector: 'Manufacturing', description: 'Africa\'s largest cement producer. Operates in 10 countries.' },
    { ticker: 'MTNN', name: 'MTN Nigeria', exchange: 'NGX', price: 280.50, change: 3.10, changePct: 1.12, volume: 18000000, marketCap: '$6.0B', peRatio: 5.2, dividendYield: 9.1, week52High: 310.00, week52Low: 195.00, sector: 'Telecoms', description: 'Nigeria\'s largest telecom with 80M+ subscribers.' },
    { ticker: 'ZENITHBANK', name: 'Zenith Bank', exchange: 'NGX', price: 42.30, change: 0.80, changePct: 1.93, volume: 9500000, marketCap: '$4.1B', peRatio: 4.5, dividendYield: 10.2, week52High: 48.00, week52Low: 28.50, sector: 'Banking', description: 'Nigeria\'s largest bank by market cap. Strong digital banking growth.' },
    { ticker: 'GTCO', name: 'Guaranty Trust', exchange: 'NGX', price: 58.90, change: 1.40, changePct: 2.44, volume: 6200000, marketCap: '$5.2B', peRatio: 5.1, dividendYield: 8.8, week52High: 65.00, week52Low: 38.00, sector: 'Banking', description: 'Tier-1 Nigerian bank with operations across Anglophone West Africa.' },
    { ticker: 'BUACEMENT', name: 'BUA Cement', exchange: 'NGX', price: 120.00, change: -0.50, changePct: -0.42, volume: 2100000, marketCap: '$5.8B', peRatio: 8.2, dividendYield: 5.0, week52High: 140.00, week52Low: 85.00, sector: 'Manufacturing', description: 'Second-largest cement producer in Nigeria.' },
    { ticker: 'NESTLE', name: 'Nestle Nigeria', exchange: 'NGX', price: 1890.00, change: 25.00, changePct: 1.34, volume: 180000, marketCap: '$4.5B', peRatio: 18.5, dividendYield: 2.1, week52High: 2050, week52Low: 1350, sector: 'Manufacturing', description: 'Leading food and beverage company in Nigeria.' },
    { ticker: 'AIRTELAFRI', name: 'Airtel Africa', exchange: 'NGX', price: 2150.00, change: 35.00, changePct: 1.65, volume: 560000, marketCap: '$3.8B', peRatio: 6.0, dividendYield: 4.5, week52High: 2400, week52Low: 1650, sector: 'Telecoms', description: 'Pan-African telecom operating in 14 countries. Strong mobile money growth.' },
    { ticker: 'SEPLAT', name: 'Seplat Energy', exchange: 'NGX', price: 3200.00, change: -45.00, changePct: -1.39, volume: 420000, marketCap: '$3.2B', peRatio: 3.8, dividendYield: 7.8, week52High: 4000, week52Low: 2500, sector: 'Energy', description: 'Leading Nigerian independent oil and gas exploration company.' },
  ],
  jse: [
    { ticker: 'NPN', name: 'Naspers', exchange: 'JSE', price: 1285.00, change: 26.50, changePct: 2.11, volume: 3200000, marketCap: '$52B', peRatio: 22.0, dividendYield: 0.5, week52High: 1400, week52Low: 950, sector: 'Technology', description: 'Global internet and entertainment group. Majority owner of Prosus.' },
    { ticker: 'AGL', name: 'Anglo American', exchange: 'JSE', price: 985.00, change: -8.50, changePct: -0.86, volume: 5600000, marketCap: '$38B', peRatio: 8.5, dividendYield: 4.2, week52High: 1200, week52Low: 780, sector: 'Mining', description: 'Global mining major with operations in diamonds, platinum, copper, iron ore.' },
    { ticker: 'SOL', name: 'Sasol', exchange: 'JSE', price: 425.00, change: 3.80, changePct: 0.90, volume: 1800000, marketCap: '$7.8B', peRatio: 6.2, dividendYield: 5.8, week52High: 520, week52Low: 310, sector: 'Energy', description: 'Integrated energy and chemicals company. Global leader in Fischer-Tropsch technology.' },
    { ticker: 'FSR', name: 'FirstRand', exchange: 'JSE', price: 82.50, change: 1.20, changePct: 1.48, volume: 8900000, marketCap: '$28B', peRatio: 9.8, dividendYield: 4.5, week52High: 95.00, week52Low: 62.00, sector: 'Banking', description: 'South Africa\'s largest financial services group (FNB, RMB, WesBank).' },
    { ticker: 'SBK', name: 'Standard Bank', exchange: 'JSE', price: 215.00, change: 2.80, changePct: 1.32, volume: 4500000, marketCap: '$22B', peRatio: 8.0, dividendYield: 5.2, week52High: 250, week52Low: 170, sector: 'Banking', description: 'Africa\'s largest bank by assets. Operations in 20+ African countries.' },
    { ticker: 'MTN', name: 'MTN Group', exchange: 'JSE', price: 188.00, change: 1.50, changePct: 0.80, volume: 7200000, marketCap: '$33B', peRatio: 7.5, dividendYield: 5.0, week52High: 220, week52Low: 135, sector: 'Telecoms', description: 'Africa\'s largest mobile operator. 290M+ subscribers across 19 markets.' },
  ],
  gse: [
    { ticker: 'MTNGH', name: 'MTN Ghana', exchange: 'GSE', price: 0.95, change: 0.014, changePct: 1.50, volume: 4500000, marketCap: '$1.8B', peRatio: 12.0, dividendYield: 3.5, week52High: 1.10, week52Low: 0.38, sector: 'Telecoms', description: 'Ghana\'s largest telecom. 2025 GSE winner: +134%. Massive 4G expansion.' },
    { ticker: 'GCB', name: 'GCB Bank', exchange: 'GSE', price: 6.80, change: 0.12, changePct: 1.80, volume: 890000, marketCap: '$0.9B', peRatio: 4.2, dividendYield: 8.5, week52High: 7.50, week52Low: 2.80, sector: 'Banking', description: 'Ghana\'s largest indigenous bank. Strong SME and retail banking.' },
    { ticker: 'EBG', name: 'Ecobank Ghana', exchange: 'GSE', price: 0.28, change: 0.005, changePct: 1.82, volume: 2100000, marketCap: '$0.5B', peRatio: 3.8, dividendYield: 9.2, week52High: 0.35, week52Low: 0.12, sector: 'Banking', description: 'Subsidiary of Ecobank Transnational. Pan-African banking reach.' },
    { ticker: 'CAL', name: 'CalBank', exchange: 'GSE', price: 3.20, change: 0.08, changePct: 2.56, volume: 560000, marketCap: '$0.4B', peRatio: 5.5, dividendYield: 5.0, week52High: 3.80, week52Low: 1.50, sector: 'Banking', description: 'Fast-growing Ghanaian bank with strong digital banking focus.' },
    { ticker: 'GOIL', name: 'GOIL', exchange: 'GSE', price: 4.50, change: -0.10, changePct: -2.17, volume: 340000, marketCap: '$0.3B', peRatio: 6.0, dividendYield: 3.8, week52High: 6.20, week52Low: 3.00, sector: 'Energy', description: 'Ghana\'s only indigenous oil marketing company.' },
    { ticker: 'UNIL', name: 'Unilever Ghana', exchange: 'GSE', price: 12.50, change: 0.30, changePct: 2.46, volume: 120000, marketCap: '$0.2B', peRatio: 15.0, dividendYield: 2.0, week52High: 15.00, week52Low: 8.50, sector: 'Manufacturing', description: 'Fast-moving consumer goods manufacturer. Household brands across West Africa.' },
  ],
  egx: [
    { ticker: 'ORAS', name: 'Orascom', exchange: 'EGX', price: 520.00, change: 4.20, changePct: 0.81, volume: 1800000, marketCap: '$6.2B', peRatio: 8.5, dividendYield: 4.0, week52High: 600, week52Low: 380, sector: 'Construction', description: 'Leading Egyptian construction and telecom conglomerate.' },
    { ticker: 'COMI', name: 'Commercial International Bank', exchange: 'EGX', price: 98.50, change: 1.20, changePct: 1.23, volume: 2200000, marketCap: '$8.5B', peRatio: 7.2, dividendYield: 5.5, week52High: 115, week52Low: 72, sector: 'Banking', description: 'Egypt\'s largest private-sector bank.' },
    { ticker: 'EGYS', name: 'Elsewedy Electric', exchange: 'EGX', price: 42.80, change: -0.60, changePct: -1.38, volume: 950000, marketCap: '$3.2B', peRatio: 9.0, dividendYield: 3.2, week52High: 55, week52Low: 35, sector: 'Manufacturing', description: 'Leading Egyptian cable and electrical equipment manufacturer.' },
    { ticker: 'HRHO', name: 'Heliopolis Housing', exchange: 'EGX', price: 135.00, change: 2.50, changePct: 1.89, volume: 680000, marketCap: '$2.8B', peRatio: 6.5, dividendYield: 4.8, week52High: 160, week52Low: 95, sector: 'Real Estate', description: 'Major Egyptian real estate developer focused on new cities.' },
  ],
  brvm: [
    { ticker: 'SONATEL', name: 'Sonatel', exchange: 'BRVM', price: 28500, change: 150, changePct: 0.53, volume: 45000, marketCap: '$5.2B', peRatio: 10.0, dividendYield: 6.5, week52High: 32000, week52Low: 22000, sector: 'Telecoms', description: 'Senegal\'s largest telecom. Orange subsidiary covering West Africa.' },
    { ticker: 'SODECI', name: 'SODECI', exchange: 'BRVM', price: 18000, change: 200, changePct: 1.12, volume: 28000, marketCap: '$3.8B', peRatio: 12.5, dividendYield: 5.0, week52High: 21000, week52Low: 14000, sector: 'Utilities', description: 'Ivory Coast water utility monopoly. Stable dividend payer.' },
    { ticker: 'BOA', name: 'Bank of Africa', exchange: 'BRVM', price: 8500, change: 50, changePct: 0.59, volume: 65000, marketCap: '$2.1B', peRatio: 5.5, dividendYield: 7.0, week52High: 10000, week52Low: 6500, sector: 'Banking', description: 'Pan-African banking group operating in 18 countries.' },
    { ticker: 'SGA', name: 'Societe Generale Guinee', exchange: 'BRVM', price: 32000, change: 0, changePct: 0, volume: 8000, marketCap: '$0.8B', peRatio: 7.0, dividendYield: 5.5, week52High: 38000, week52Low: 25000, sector: 'Banking', description: 'Guinea\'s largest bank. Subsidiary of Societe Generale group.' },
  ],
};

// Simulated price history (60 data points for charts)
export function generatePriceHistory(basePrice: number, volatility: number = 0.02): { date: string; price: number }[] {
  const points: { date: string; price: number }[] = [];
  let price = basePrice * (1 - volatility * 20);
  const now = new Date();
  for (let i = 59; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    price = price * (1 + (Math.random() - 0.48) * volatility);
    points.push({ date: d.toISOString().split('T')[0], price: Math.round(price * 100) / 100 });
  }
  // Ensure last point is close to current price
  points[points.length - 1].price = basePrice;
  return points;
}

export function getStockByTicker(ticker: string): StockQuote | undefined {
  for (const stocks of Object.values(STOCKS)) {
    const found = stocks.find(s => s.ticker === ticker);
    if (found) return found;
  }
  return undefined;
}

export function getExchangeById(id: string): ExchangeInfo | undefined {
  return EXCHANGES.find(e => e.id === id);
}

export function getTopMovers(type: 'gainers' | 'losers' | 'active', limit = 10): StockQuote[] {
  const all = Object.values(STOCKS).flat();
  switch (type) {
    case 'gainers': return [...all].sort((a, b) => b.changePct - a.changePct).slice(0, limit);
    case 'losers': return [...all].sort((a, b) => a.changePct - b.changePct).slice(0, limit);
    case 'active': return [...all].sort((a, b) => b.volume - a.volume).slice(0, limit);
  }
}

// Fee calculations
export function calculateTradingFee(amountGbp: number): number {
  if (amountGbp < 500) return 1.50;
  if (amountGbp <= 10000) return amountGbp * 0.005;
  return amountGbp * 0.003;
}

export function calculateFxMargin(amountGbp: number, marginPct = 1.5): number {
  return amountGbp * (marginPct / 100);
}

export function generateOrderReference(): string {
  const count = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  return `INV-2026-${count}`;
}

// Simulated IPO registration counts by country
export function getIpoRegistrationStats(): { total: number; countries: number; byCountry: { country: string; count: number }[] } {
  // In production, this would query the database
  return {
    total: 2847,
    countries: 42,
    byCountry: [
      { country: 'United Kingdom', count: 1240 },
      { country: 'United States', count: 890 },
      { country: 'Canada', count: 340 },
      { country: 'Germany', count: 120 },
      { country: 'South Africa', count: 98 },
      { country: 'Kenya', count: 85 },
      { country: 'Australia', count: 74 },
    ],
  };
}