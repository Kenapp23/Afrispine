import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireSenderAuth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const sender = await requireSenderAuth(req);
    const senderId = sender.id;

    // ── 1. Total sent (GBP) + countries ──────────────────────────────────
    const deliveredTxs = await db.transaction.findMany({
      where: { senderId, status: 'delivered' },
      select: {
        amountSend: true,
        currencySend: true,
        recipientId: true,
        recipient: { select: { country: true } },
      },
    });

    // Sum only GBP transactions for the main total
    const totalSentGbp = deliveredTxs
      .filter((t) => t.currencySend === 'GBP')
      .reduce((sum, t) => sum + t.amountSend, 0);

    // Collect unique recipient countries
    const countries = new Set<string>();
    for (const tx of deliveredTxs) {
      if (tx.recipient?.country) {
        const c = tx.recipient.country;
        const label: Record<string, string> = {
          KE: 'Kenya', NG: 'Nigeria', GH: 'Ghana', TZ: 'Tanzania',
          UG: 'Uganda', ZA: 'South Africa', CM: 'Cameroon', SN: 'Senegal',
          CI: "Côte d'Ivoire", RW: 'Rwanda', ET: 'Ethiopia', MZ: 'Mozambique',
        };
        countries.add(label[c] || c);
      }
    }
    const countryList = Array.from(countries);

    // ── 2. Fees saved (WU 7% avg − AfriSpine 1.5% = 5.5% savings) ──────
    const feesSaved = Math.round(totalSentGbp * 0.055 * 100) / 100;

    // ── 3. Portfolio value ──────────────────────────────────────────────
    const investmentAccount = await db.investmentAccount.findUnique({
      where: { senderId },
      select: {
        totalValueUsd: true,
        totalInvestedUsd: true,
        totalGainLossUsd: true,
        createdAt: true,
      },
    });

    let portfolioValue = 0;
    let portfolioChangePct = 0;
    if (investmentAccount && investmentAccount.totalInvestedUsd > 0) {
      portfolioValue = investmentAccount.totalValueUsd;
      portfolioChangePct =
        Math.round(
          (investmentAccount.totalGainLossUsd / investmentAccount.totalInvestedUsd) * 10000
        ) / 100;
    }

    // ── 4. Dividends earned ─────────────────────────────────────────────
    const dividendResult = await db.dividendPayment.aggregate({
      where: { senderId },
      _sum: { netUsd: true },
    });
    const totalDividends = dividendResult._sum.netUsd ?? 0;

    // ── 5. Chama/Esusu totals ───────────────────────────────────────────
    const chamaMemberships = await db.savingsCircleMember.findMany({
      where: { senderId },
      include: {
        circle: {
          select: {
            name: true,
            type: true,
            memberCount: true,
            currentCycle: true,
            status: true,
          },
        },
      },
    });

    const chamaTotal = chamaMemberships.reduce((s, m) => s + m.totalContributed, 0);
    const chamaLabel =
      chamaMemberships.length > 0
        ? `${chamaMemberships[0].circle.type.charAt(0).toUpperCase() + chamaMemberships[0].circle.type.slice(1)}`
        : 'Chama';
    const totalChamaMembers = chamaMemberships.length > 0
      ? chamaMemberships.reduce((max, m) => Math.max(max, m.circle.memberCount), 0)
      : 0;
    const chamaCycles = chamaMemberships.length > 0
      ? chamaMemberships.reduce((max, m) => Math.max(max, m.circle.currentCycle), 0)
      : 0;

    // ── 6. Gifts sent ───────────────────────────────────────────────────
    const giftCount = await db.giftVoucher.count({
      where: { senderId },
    });

    const giftRedeemedResult = await db.giftVoucher.aggregate({
      where: { senderId, status: 'redeemed' },
      _sum: { amountLocal: true },
    });
    const giftRedeemedLocal = giftRedeemedResult._sum.amountLocal ?? 0;

    // Pick a representative currency from redeemed vouchers
    const sampleGift = await db.giftVoucher.findFirst({
      where: { senderId, status: 'redeemed', amountLocal: { gt: 0 } },
      select: { currencyLocal: true },
    });
    const giftCurrency = sampleGift?.currencyLocal || 'KES';

    // ── Build response ──────────────────────────────────────────────────
    const hasAnyData =
      totalSentGbp > 0 ||
      portfolioValue > 0 ||
      totalDividends > 0 ||
      chamaTotal > 0 ||
      giftCount > 0;

    return NextResponse.json({
      hasData: hasAnyData,
      totalSent: Math.round(totalSentGbp * 100) / 100,
      totalSentFormatted: `£${totalSentGbp.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      countries: countryList,
      countrySubtitle:
        countryList.length > 0
          ? countryList.length === 1
            ? `To ${countryList[0]}`
            : `To ${countryList[0]} and ${countryList.length - 1} other${countryList.length > 2 ? 's' : ''}`
          : '',
      feesSaved,
      feesSavedFormatted: `£${feesSaved.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      portfolioValue,
      portfolioFormatted: `$${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      portfolioChangePct,
      portfolioChangeFormatted: portfolioChangePct >= 0 ? `+${portfolioChangePct}%` : `${portfolioChangePct}%`,
      hasPortfolio: !!investmentAccount,
      totalDividends: Math.round(totalDividends * 100) / 100,
      dividendsFormatted: `$${(Math.round(totalDividends * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      chamaTotal: Math.round(chamaTotal * 100) / 100,
      chamaFormatted: `£${chamaTotal.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      chamaLabel,
      chamaMembers: totalChamaMembers,
      chamaCycles,
      giftCount,
      giftRedeemedLocal: Math.round(giftRedeemedLocal * 100) / 100,
      giftRedeemedFormatted: giftRedeemedLocal > 0
        ? `${giftCurrency} ${Math.round(giftRedeemedLocal).toLocaleString()} in vouchers redeemed`
        : '',
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error('[Sender Impact] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch impact data' }, { status: 500 });
  }
}