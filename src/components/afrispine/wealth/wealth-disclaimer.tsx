'use client';

import React from 'react';

// ─── Types ─────────────────────────────────────────────────
interface WealthDisclaimerProps {
  variant: 'general' | 'ipo';
  className?: string;
}

const GENERAL_TEXT =
  'Investing in African stock markets carries risk including possible loss of principal. Stock prices can go down as well as up. Past performance does not guarantee future returns. AfriSpine is not a licensed investment adviser. This is not investment advice. Exchange rates fluctuate and may affect the value of your investment when converted back to your home currency. Tax treatment of investment returns varies by country and individual circumstances. Consult a qualified financial adviser before investing.';

const IPO_ADDENDUM =
  ' No IPO prospectus has been filed as of July 2026. Final terms, pricing, and eligibility are subject to regulatory approval. Information on this page is based on publicly available sources and may not reflect final offer details. Do not invest money you cannot afford to lose.';

// ─── Component ─────────────────────────────────────────────
export function WealthDisclaimer({ variant, className = '' }: WealthDisclaimerProps) {
  return (
    <div
      className={`mx-auto max-w-2xl border-t border-border pt-4 ${className}`}
    >
      <p className="text-xs leading-relaxed text-gray-400 text-center">
        {GENERAL_TEXT}
        {variant === 'ipo' && (
          <span className="mt-2 block">{IPO_ADDENDUM.trim()}</span>
        )}
      </p>
    </div>
  );
}