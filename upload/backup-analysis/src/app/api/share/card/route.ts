import { NextRequest, NextResponse } from 'next/server';

// ─── Country Config ────────────────────────────────────────────

const COUNTRY_FLAGS: Record<string, string> = {
  NG: '\u{1F1F3}\u{1F1EC}',
  KE: '\u{1F1F0}\u{1F1EA}',
  GH: '\u{1F1EC}\u{1F1ED}',
  ZA: '\u{1F1FF}\u{1F1E6}',
  TZ: '\u{1F1F9}\u{1F1FF}',
  UG: '\u{1F1FA}\u{1F1EC}',
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: '\u00A3',
  USD: '$',
  KES: 'KSh',
  NGN: '\u20A6',
  GHS: 'GH\u00A2',
  ZAR: 'R',
  TZS: 'TSh',
  UGX: 'UGX',
};

const COUNTRY_NAMES: Record<string, string> = {
  NG: 'Nigeria',
  KE: 'Kenya',
  GH: 'Ghana',
  ZA: 'South Africa',
  TZ: 'Tanzania',
  UG: 'Uganda',
};

// ─── Gradient Themes per Country ───────────────────────────────

interface GradientTheme {
  bg: string;
  accent: string;
  textAccent: string;
  overlay?: string;
}

function getCountryTheme(country: string): GradientTheme {
  switch (country) {
    case 'NG':
      return {
        bg: 'linear-gradient(135deg, #065F46 0%, #047857 35%, #059669 65%, #10B981 100%)',
        accent: '#F0C040',
        textAccent: '#A7F3D0',
        overlay: 'radial-gradient(ellipse at 90% 10%, rgba(16,185,129,0.3) 0%, transparent 60%)',
      };
    case 'KE':
      return {
        bg: 'linear-gradient(135deg, #991B1B 0%, #DC2626 30%, #065F46 60%, #047857 100%)',
        accent: '#FDE047',
        textAccent: '#FCA5A5',
        overlay: 'radial-gradient(ellipse at 80% 20%, rgba(253,224,71,0.15) 0%, transparent 50%)',
      };
    case 'GH':
      return {
        bg: 'linear-gradient(135deg, #92400E 0%, #B45309 30%, #D97706 60%, #F59E0B 100%)',
        accent: '#FEF3C7',
        textAccent: '#FDE68A',
        overlay: 'radial-gradient(ellipse at 85% 15%, rgba(254,243,199,0.2) 0%, transparent 55%)',
      };
    case 'ZA':
      return {
        bg: 'linear-gradient(135deg, #1E3A5F 0%, #1E40AF 35%, #1D4ED8 55%, #F59E0B 85%, #D97706 100%)',
        accent: '#FBBF24',
        textAccent: '#93C5FD',
        overlay: 'radial-gradient(ellipse at 75% 85%, rgba(251,191,36,0.2) 0%, transparent 50%)',
      };
    default:
      return {
        bg: 'linear-gradient(135deg, #022C22 0%, #064E3B 30%, #065F46 60%, #047857 100%)',
        accent: '#D4A017',
        textAccent: '#A7F3D0',
        overlay: 'radial-gradient(ellipse at 80% 15%, rgba(16,185,129,0.25) 0%, transparent 55%)',
      };
  }
}

// ─── Card Builders ─────────────────────────────────────────────

function buildStockPurchaseCard(params: Record<string, string>): string {
  const {
    ticker = 'STK',
    companyName = 'A Great Company',
    exchange = 'NSE',
    shares = '100',
    senderCity = 'London',
    stockCountry = '',
  } = params;

  const theme = getCountryTheme(stockCountry);
  const flag = COUNTRY_FLAGS[stockCountry] || '\u{1F30D}';
  const countryName = COUNTRY_NAMES[stockCountry] || 'Africa';

  const headlines: Record<string, string> = {
    NG: `I'm now a shareholder in ${companyName}`,
    KE: `I own a piece of ${companyName}`,
    GH: `Invested in ${companyName} — Ghana's growth`,
    ZA: `${companyName} is in my portfolio`,
  };

  const subtitles: Record<string, string> = {
    NG: 'Investing in Nigeria from afar',
    KE: "Kenya's future is in our hands",
    GH: 'Akwaaba to African investing',
    ZA: 'Investing in the Rainbow Nation',
  };

  const headline = headlines[stockCountry] || `I'm now a shareholder in ${companyName}`;
  const subtitle = subtitles[stockCountry] || 'Building African wealth from the diaspora';

  return `
    <div class="card" style="background: ${theme.bg}; position: relative;">
      ${theme.overlay ? `<div class="card-overlay" style="position:absolute;inset:0;background:${theme.overlay};pointer-events:none;"></div>` : ''}
      <div class="card-content">
        <div class="flag-large">${flag}</div>
        <div class="badge-row">
          <span class="badge">${exchange}</span>
          <span class="badge">${shares} shares</span>
        </div>
        <h1 class="headline">${headline}</h1>
        <p class="ticker">${ticker}</p>
        <p class="subtitle">${subtitle}</p>
        <div class="meta">
          <span>${senderCity}</span>
          <span class="dot">&middot;</span>
          <span>${countryName}</span>
        </div>
      </div>
      <div class="wordmark">Afri<span>Spine</span></div>
    </div>`;
}

function buildFirstSendCard(params: Record<string, string>): string {
  const {
    amount = '100',
    currency = 'GBP',
    country = 'KE',
    deliveryMinutes = '2',
  } = params;

  const flag = COUNTRY_FLAGS[country] || '\u{1F30D}';
  const countryName = COUNTRY_NAMES[country] || 'home';
  const sym = CURRENCY_SYMBOLS[currency] || currency;

  const headlines: Record<string, string> = {
    NG: 'Sending love to Nigeria',
    KE: 'Keeping it in the family',
    GH: 'Ghana, here it comes',
    ZA: 'Sending love to South Africa',
  };

  const headline = headlines[country] || `I just sent money home to ${countryName}`;
  const gradient = country === 'NG'
    ? 'linear-gradient(135deg, #7C2D12 0%, #C2410C 25%, #EA580C 50%, #F59E0B 100%)'
    : country === 'KE'
      ? 'linear-gradient(135deg, #451A03 0%, #78350F 25%, #B45309 50%, #F59E0B 100%)'
      : country === 'GH'
        ? 'linear-gradient(135deg, #713F12 0%, #A16207 25%, #CA8A04 50%, #FACC15 100%)'
        : country === 'ZA'
          ? 'linear-gradient(135deg, #1C1917 0%, #44403C 25%, #78716C 50%, #D4A017 100%)'
          : 'linear-gradient(135deg, #7C2D12 0%, #C2410C 30%, #EA580C 55%, #F59E0B 100%)';

  return `
    <div class="card" style="background: ${gradient}; position: relative;">
      <div class="card-overlay" style="position:absolute;inset:0;background:radial-gradient(ellipse at 85% 10%, rgba(250,204,21,0.2) 0%, transparent 50%);pointer-events:none;"></div>
      <div class="card-content">
        <div class="flag-large">${flag}</div>
        <div class="badge-row">
          <span class="badge">Money Sent</span>
          <span class="badge">${deliveryMinutes} min delivery</span>
        </div>
        <h1 class="headline">${headline}</h1>
        <p class="amount">${sym}${amount}</p>
        <p class="subtitle">Sent to ${countryName} via AfriSpine</p>
      </div>
      <div class="wordmark">Afri<span>Spine</span></div>
    </div>`;
}

function buildIpoRegistrationCard(params: Record<string, string>): string {
  const { ipoName = 'Dangote Refinery' } = params;

  return `
    <div class="card" style="background: linear-gradient(135deg, #1C1917 0%, #292524 25%, #44403C 50%, #57534E 75%, #D4A017 100%); position: relative;">
      <div class="card-overlay" style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%, rgba(212,160,23,0.08) 0%, transparent 70%);pointer-events:none;"></div>
      <div class="card-content">
        <div class="flag-large" style="font-size: 56px;">\u{1F1F3}\u{1F1EC}</div>
        <div class="badge-row">
          <span class="badge" style="background:rgba(212,160,23,0.25);border-color:rgba(212,160,23,0.5);color:#FBBF24;">IPO Registration</span>
          <span class="badge" style="background:rgba(212,160,23,0.25);border-color:rgba(212,160,23,0.5);color:#FBBF24;">Confirmed</span>
        </div>
        <h1 class="headline">I'm in for the ${ipoName} IPO</h1>
        <p class="subtitle" style="color:#D6D3D1;">Nigeria's biggest refinery, owned by all of us</p>
        <div class="meta" style="color:#A8A29E;">
          <span>Pre-registered</span>
          <span class="dot">&middot;</span>
          <span>AfriSpine</span>
        </div>
      </div>
      <div class="wordmark" style="color:#E7E5E4;">Afri<span style="color:#D4A017;">Spine</span></div>
    </div>`;
}

function buildSavingsMilestoneCard(params: Record<string, string>): string {
  const {
    totalSent = '0',
    totalInvested = '0',
    totalSaved = '0',
    chamaName = '',
    country = 'KE',
  } = params;

  const flag = COUNTRY_FLAGS[country] || '\u{1F30D}';
  const countryName = COUNTRY_NAMES[country] || 'Africa';

  const gradient = country === 'NG'
    ? 'linear-gradient(135deg, #064E3B 0%, #047857 30%, #059669 50%, #10B981 75%, #FBBF24 100%)'
    : country === 'GH'
      ? 'linear-gradient(135deg, #78350F 0%, #A16207 30%, #CA8A04 50%, #EAB308 100%)'
      : 'linear-gradient(135deg, #064E3B 0%, #047857 25%, #059669 50%, #34D399 75%, #FCD34D 100%)';

  const stats = [];
  if (totalSent && totalSent !== '0') stats.push({ label: 'Sent Home', value: `\u00A3${totalSent}` });
  if (totalInvested && totalInvested !== '0') stats.push({ label: 'Invested', value: `\u00A3${totalInvested}` });
  if (totalSaved && totalSaved !== '0') stats.push({ label: 'Saved', value: `\u00A3${totalSaved}` });

  const statsHtml = stats.map(s => `
        <div class="stat-item">
          <span class="stat-value">${s.value}</span>
          <span class="stat-label">${s.label}</span>
        </div>`).join('');

  return `
    <div class="card" style="background: ${gradient}; position: relative;">
      <div class="card-overlay" style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 80%, rgba(252,211,77,0.15) 0%, transparent 55%);pointer-events:none;"></div>
      <div class="card-content">
        <div class="flag-large">${flag}</div>
        <div class="badge-row">
          <span class="badge">Milestone</span>
          ${chamaName ? `<span class="badge">${chamaName}</span>` : ''}
        </div>
        <h1 class="headline">Since joining AfriSpine, I have:</h1>
        <div class="stats-row">
          ${statsHtml}
        </div>
        <p class="subtitle">Building ${countryName}'s future, one transfer at a time</p>
      </div>
      <div class="wordmark">Afri<span>Spine</span></div>
    </div>`;
}

function buildDividendReceivedCard(params: Record<string, string>): string {
  const {
    companyName = 'A Company',
    amount = '0',
    shares = '0',
    perShare = '0',
    stockCountry = '',
  } = params;

  const theme = getCountryTheme(stockCountry);
  const flag = COUNTRY_FLAGS[stockCountry] || '\u{1F30D}';
  const countryName = COUNTRY_NAMES[stockCountry] || 'Africa';

  return `
    <div class="card" style="background: ${theme.bg}; position: relative;">
      ${theme.overlay ? `<div class="card-overlay" style="position:absolute;inset:0;background:${theme.overlay};pointer-events:none;"></div>` : ''}
      <div class="card-content">
        <div class="flag-large">${flag}</div>
        <div class="badge-row">
          <span class="badge">Dividend Received</span>
          <span class="badge">${shares} shares</span>
        </div>
        <h1 class="headline">My African stocks paid me a dividend</h1>
        <p class="amount">${amount}</p>
        <p class="subtitle">${companyName} &middot; ${perShare} per share &middot; ${countryName}</p>
      </div>
      <div class="wordmark">Afri<span>Spine</span></div>
    </div>`;
}

// ─── Fallback card for unknown types ───────────────────────────

function buildDefaultCard(params: Record<string, string>): string {
  const headline = params.headline || 'A milestone reached!';
  const subtitle = params.subtitle || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return `
    <div class="card" style="background: linear-gradient(135deg, #022C22 0%, #064E3B 30%, #065F46 60%, #047857 100%); position: relative;">
      <div class="card-overlay" style="position:absolute;inset:0;background:radial-gradient(ellipse at 80% 15%, rgba(16,185,129,0.25) 0%, transparent 55%);pointer-events:none;"></div>
      <div class="card-content">
        <div class="flag-large" style="font-size:48px;">\u{2B50}</div>
        <div class="badge-row">
          <span class="badge">Achievement</span>
        </div>
        <h1 class="headline">${headline}</h1>
        <p class="subtitle">${subtitle}</p>
      </div>
      <div class="wordmark">Afri<span>Spine</span></div>
    </div>`;
}

// ─── Full HTML Page Template ───────────────────────────────────

function renderFullPage(cardHtml: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1200" />
  <title>${title} — AfriSpine</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background: #111827;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      padding: 24px;
    }

    .card {
      width: 1200px;
      height: 630px;
      border-radius: 24px;
      overflow: hidden;
      position: relative;
      box-shadow: 0 25px 80px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.25);
    }

    .card-content {
      position: relative;
      z-index: 1;
      padding: 56px 64px;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .flag-large {
      font-size: 52px;
      line-height: 1;
      margin-bottom: 20px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    }

    .badge-row {
      display: flex;
      gap: 10px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 100px;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.3px;
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.25);
      color: #fff;
      backdrop-filter: blur(4px);
    }

    .headline {
      font-size: 38px;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.2;
      margin-bottom: 12px;
      max-width: 750px;
      text-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .ticker {
      font-size: 28px;
      font-weight: 700;
      color: rgba(255,255,255,0.9);
      margin-bottom: 8px;
      letter-spacing: 1px;
      font-variant-numeric: tabular-nums;
    }

    .amount {
      font-size: 48px;
      font-weight: 800;
      color: #ffffff;
      line-height: 1.1;
      margin-bottom: 10px;
      text-shadow: 0 2px 8px rgba(0,0,0,0.2);
      font-variant-numeric: tabular-nums;
    }

    .subtitle {
      font-size: 18px;
      color: rgba(255,255,255,0.8);
      line-height: 1.5;
      max-width: 600px;
      margin-bottom: 16px;
    }

    .meta {
      font-size: 14px;
      color: rgba(255,255,255,0.6);
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    }

    .meta .dot { opacity: 0.5; }

    .stats-row {
      display: flex;
      gap: 40px;
      margin: 24px 0 8px;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat-value {
      font-size: 36px;
      font-weight: 800;
      color: #ffffff;
      font-variant-numeric: tabular-nums;
      text-shadow: 0 2px 6px rgba(0,0,0,0.15);
    }

    .stat-label {
      font-size: 14px;
      color: rgba(255,255,255,0.7);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }

    .wordmark {
      position: absolute;
      bottom: 28px;
      right: 40px;
      font-size: 18px;
      font-weight: 800;
      color: rgba(255,255,255,0.5);
      letter-spacing: -0.5px;
      z-index: 2;
    }

    .wordmark span {
      color: #D4A017;
    }

    /* Decorative geometric accents */
    .card::before {
      content: '';
      position: absolute;
      top: -60px;
      right: -60px;
      width: 200px;
      height: 200px;
      border-radius: 50%;
      background: rgba(255,255,255,0.06);
      z-index: 0;
    }

    .card::after {
      content: '';
      position: absolute;
      bottom: -40px;
      left: 100px;
      width: 140px;
      height: 140px;
      border-radius: 50%;
      background: rgba(255,255,255,0.04);
      z-index: 0;
    }

    /* Responsive fallback — scale on smaller screens */
    @media (max-width: 1248px) {
      body { padding: 16px; }
      .card {
        width: 100%;
        max-width: 1200px;
        height: auto;
        aspect-ratio: 1200 / 630;
      }
      .headline { font-size: clamp(24px, 4vw, 38px); }
      .amount { font-size: clamp(32px, 5vw, 48px); }
      .stat-value { font-size: clamp(24px, 4vw, 36px); }
    }
  </style>
</head>
<body>
  ${cardHtml}
</body>
</html>`;
}

// ─── GET Handler ───────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'stock_purchase';

  // Collect all params (excluding 'type')
  const params: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    if (key !== 'type' && key !== 'data') {
      params[key] = value;
    }
  }

  // Also support legacy `data` JSON param for backward compatibility
  const dataParam = searchParams.get('data');
  if (dataParam) {
    try {
      const parsed = JSON.parse(dataParam);
      Object.assign(params, parsed);
    } catch {
      // ignore malformed JSON
    }
  }

  let cardHtml: string;
  let title: string;

  switch (type) {
    case 'stock_purchase':
    case 'first_investment': // backward compat
      cardHtml = buildStockPurchaseCard(params);
      title = 'Stock Purchase';
      break;
    case 'first_send':
      cardHtml = buildFirstSendCard(params);
      title = 'First Transfer';
      break;
    case 'ipo_registration':
    case 'ipo_registered': // backward compat
      cardHtml = buildIpoRegistrationCard(params);
      title = 'IPO Registration';
      break;
    case 'savings_milestone':
      cardHtml = buildSavingsMilestoneCard(params);
      title = 'Savings Milestone';
      break;
    case 'dividend_received':
      cardHtml = buildDividendReceivedCard(params);
      title = 'Dividend Received';
      break;
    default:
      cardHtml = buildDefaultCard(params);
      title = 'Achievement';
  }

  const html = renderFullPage(cardHtml, title);

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}