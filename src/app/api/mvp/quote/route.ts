import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const SEND_CURRENCIES: Record<string, { rate: number; currency: string; symbol: string; label: string }> = {
  UK: { rate: 1, currency: "GBP", symbol: "\u00a3", label: "United Kingdom" },
  US: { rate: 1.27, currency: "USD", symbol: "$", label: "United States" },
  EU: { rate: 1.17, currency: "EUR", symbol: "\u20ac", label: "European Union" },
};

const RECEIVE_RATES: Record<string, {
  rate: number; currency: string; name: string;
  prefix: string; deliveryMethod: string; provider: string;
}> = {
  KE: { rate: 193.5, currency: "KES", name: "Kenya", prefix: "+254", deliveryMethod: "M-Pesa", provider: "Safaricom M-Pesa" },
  NG: { rate: 1975, currency: "NGN", name: "Nigeria", prefix: "+234", deliveryMethod: "MoMo", provider: "MTN MoMo" },
  GH: { rate: 18.2, currency: "GHS", name: "Ghana", prefix: "+233", deliveryMethod: "MoMo", provider: "MTN MoMo" },
  TZ: { rate: 3350, currency: "TZS", name: "Tanzania", prefix: "+255", deliveryMethod: "M-Pesa", provider: "Vodacom M-Pesa" },
  UG: { rate: 4850, currency: "UGX", name: "Uganda", prefix: "+256", deliveryMethod: "MoMo", provider: "MTN MoMo" },
};

const FEE_PCT = 0.015;
const QUOTE_TTL_MINUTES = 15;

function generateQuoteRef(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `Q-${ts}-${rand}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sendCountry, receiveCountry, sendAmount, sendCurrency: requestedCurrency } = body;

    if (!sendCountry || !receiveCountry) {
      return NextResponse.json({ error: "Send and receive countries are required" }, { status: 400 });
    }
    if (!sendAmount || sendAmount < 1) {
      return NextResponse.json({ error: "Minimum send amount is 1" }, { status: 400 });
    }
    if (sendAmount > 5000) {
      return NextResponse.json({ error: "Maximum amount per transaction is 5,000" }, { status: 400 });
    }

    const recv = RECEIVE_RATES[receiveCountry];
    if (!recv) {
      return NextResponse.json(
        { error: `Country not supported yet. Launch corridor: UK \u2192 Kenya (M-Pesa).` },
        { status: 400 }
      );
    }

    const send = SEND_CURRENCIES[sendCountry] || SEND_CURRENCIES.UK;
    const sendCurrency = requestedCurrency || send.currency;

    const baseRate = recv.rate / send.rate;
    const jitter = 0.9985 + Math.random() * 0.003;
    const fxRate = Math.round(baseRate * jitter * 100) / 100;

    const feeAmount = Math.round(sendAmount * FEE_PCT * 100) / 100;
    const netAmount = sendAmount - feeAmount;
    const recvAmount = Math.round(netAmount * fxRate * 100) / 100;

    const quoteRef = generateQuoteRef();
    const expiresAt = new Date(Date.now() + QUOTE_TTL_MINUTES * 60 * 1000);

    const provider = await db.liquidityProvider.upsert({
      where: { id: `provider-${receiveCountry}` },
      update: { successRate: 0.94 + Math.random() * 0.05 },
      create: {
        id: `provider-${receiveCountry}`,
        name: recv.provider,
        type: "mno",
        baseUrl: `https://api.partner.${receiveCountry.toLowerCase()}.afrispine.com`,
        supportedCorridors: JSON.stringify([`${sendCountry}_${receiveCountry}`]),
        active: true,
        successRate: 0.95 + Math.random() * 0.04,
        avgSettleSeconds: 30,
        feeBps: FEE_PCT * 10000,
      },
    });

    const quote = await db.quote.create({
      data: {
        quoteRef, corridor: `${sendCountry}_${receiveCountry}`,
        sendAmount, sendCurrency, recvAmount, recvCurrency: recv.currency,
        fxRate, feeAmount, feePct: FEE_PCT * 100,
        providerId: provider.id, expiresAt, status: "active",
      },
    });

    return NextResponse.json({
      quoteRef: quote.quoteRef, corridor: quote.corridor,
      sendAmount: quote.sendAmount, sendCurrency: quote.sendCurrency, sendSymbol: send.symbol,
      recvAmount: quote.recvAmount, recvCurrency: quote.recvCurrency,
      fxRate: quote.fxRate, feeAmount: quote.feeAmount, feePct: quote.feePct,
      expiresAt: quote.expiresAt.toISOString(), ttlSeconds: QUOTE_TTL_MINUTES * 60,
      provider: { name: provider.name, type: provider.type, successRate: Math.round(provider.successRate * 100), avgSettleSeconds: provider.avgSettleSeconds },
      delivery: { method: recv.deliveryMethod, estimatedTime: "~30 minutes", country: recv.name, phonePrefix: recv.prefix },
    });
  } catch (error) {
    console.error("[MVP Quote] Error:", error);
    return NextResponse.json({ error: "Failed to generate quote" }, { status: 500 });
  }
}
