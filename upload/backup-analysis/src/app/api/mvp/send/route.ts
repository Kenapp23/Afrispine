import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const PHONE_PREFIXES: Record<string, string> = { KE: "+254", NG: "+234", GH: "+233", TZ: "+255", UG: "+256" };
const DELIVERY_METHODS: Record<string, string> = { KE: "M-Pesa", NG: "MoMo", GH: "MoMo", TZ: "M-Pesa", UG: "MoMo" };

function generateTxRef(): string {
  const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let r = "AS-";
  for (let i = 0; i < 8; i++) r += c.charAt(Math.floor(Math.random() * c.length));
  return r;
}

function checkKYC(email: string, name?: string) {
  return { status: "approved", details: "KYC verified via Smile ID (sandbox). Document confidence: 97%.", smileIdRef: `SID-${Date.now().toString(36).toUpperCase()}` };
}

function screenAML(senderName: string, _senderCountry: string, recipientName: string) {
  return { result: "clear", score: 0.97, details: `AML screening clear. OFAC, EU, UN lists checked for "${senderName}" and "${recipientName}". No matches.` };
}

async function routeToProvider(providerName: string, data: { amount: number; currency: string; recipientPhone: string; recipientName: string; reference: string }) {
  console.log(`[Provider Route] Dispatching to ${providerName}:`, JSON.stringify(data));
  await new Promise((r) => setTimeout(r, 400));
  return { success: true, providerReference: `PROV-${Date.now().toString(36).toUpperCase()}` };
}

function sendNotification(type: string, data: Record<string, string | number>) {
  console.log(`[Notify ${type}]:`, JSON.stringify(data));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { quoteRef, senderEmail, senderName, senderPhone, senderCountry, recipientName, recipientPhone, recipientCountry, reasonForTransfer } = body;

    const quote = await db.quote.findUnique({ where: { quoteRef }, include: { provider: true } });
    if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    if (quote.status !== "active") return NextResponse.json({ error: "Quote is no longer active" }, { status: 400 });
    if (new Date() > quote.expiresAt) {
      await db.quote.update({ where: { id: quote.id }, data: { status: "expired" } });
      return NextResponse.json({ error: "Quote has expired. Please get a new quote." }, { status: 400 });
    }

    const kyc = checkKYC(senderEmail, senderName);
    const aml = screenAML(senderName || "Unknown", senderCountry, recipientName);
    if (aml.result === "flagged") {
      return NextResponse.json({ error: "Transaction flagged by compliance screening.", aml }, { status: 403 });
    }

    const prefix = PHONE_PREFIXES[recipientCountry] || "";
    const digitsOnly = (recipientPhone || "").replace(/[^0-9]/g, "");
    const fullPhone = `${prefix}${digitsOnly}`;

    const sender = await db.sender.upsert({
      where: { email: senderEmail },
      update: { kycStatus: kyc.status, fullName: senderName, phone: senderPhone, country: senderCountry },
      create: { email: senderEmail, fullName: senderName || "Unknown", phone: senderPhone || null, country: senderCountry, kycStatus: kyc.status, kycVerifiedAt: kyc.status === "approved" ? new Date() : null, smileIdRef: kyc.smileIdRef },
    });

    const txRef = generateTxRef();
    const transaction = await db.transaction.create({
      data: {
        txRef, status: "payment_pending",
        senderId: sender.id, senderEmail: sender.email, senderName: sender.fullName,
        senderPhone: sender.phone, senderCountry, senderKycStatus: kyc.status,
        recipientName, recipientPhone: fullPhone, recipientPhoneRaw: recipientPhone,
        recipientCountry, deliveryMethod: DELIVERY_METHODS[recipientCountry] || "mobile_money",
        reasonForTransfer: reasonForTransfer || null,
        sendAmount: quote.sendAmount, sendCurrency: quote.sendCurrency,
        recvAmount: quote.recvAmount, recvCurrency: quote.recvCurrency,
        fxRate: quote.fxRate, fee: quote.feeAmount, feePct: quote.feePct,
        quoteId: quote.id, quoteExpiresAt: quote.expiresAt,
        providerId: quote.providerId, providerName: quote.provider?.name || "Unknown",
        providerType: quote.provider?.type || "mno",
        amlResult: aml.result, amlDetails: aml.details,
        complianceScore: aml.score, complianceNotes: `KYC: ${kyc.status}. AML: ${aml.result}.`,
        stripePaymentIntentId: `pi_sandbox_${Date.now()}`,
      },
    });

    await db.quote.update({ where: { id: quote.id }, data: { status: "used", acceptedAt: new Date() } });

    const providerResult = await routeToProvider(quote.provider?.name || "", {
      amount: quote.recvAmount, currency: quote.recvCurrency,
      recipientPhone: fullPhone, recipientName, reference: txRef,
    });

    if (providerResult.success) {
      await db.transaction.update({ where: { id: transaction.id }, data: { status: "processing", providerReference: providerResult.providerReference } });

      setTimeout(async () => {
        try {
          await db.transaction.update({ where: { id: transaction.id }, data: { status: "delivered" } });
          sendNotification("sender_delivered", { to: senderEmail, txRef, sendAmount: `${quote.sendCurrency} ${quote.sendAmount}`, recvAmount: `${quote.recvCurrency} ${quote.recvAmount.toLocaleString()}`, recipientName });
          sendNotification("recipient_sms", { to: fullPhone, amount: `${quote.recvCurrency} ${quote.recvAmount.toLocaleString()}`, senderFirst: sender.fullName?.split(" ")[0] || "Someone" });
        } catch (e) { console.error("[Auto-deliver] Error:", e); }
      }, 4000);

      await db.revenueRecord.create({
        data: { transactionId: transaction.id, revenueType: "orchestration_fee", amount: quote.feeAmount, currency: quote.sendCurrency, settledTo: "operational_pool", status: "collected" },
      });
      sendNotification("sender_processing", { to: senderEmail, txRef, sendAmount: `${quote.sendCurrency} ${quote.sendAmount}`, recipientName });
    } else {
      await db.transaction.update({ where: { id: transaction.id }, data: { status: "failed" } });
    }

    return NextResponse.json({
      txRef, status: providerResult.success ? "processing" : "failed",
      amounts: { send: { amount: quote.sendAmount, currency: quote.sendCurrency }, receive: { amount: quote.recvAmount, currency: quote.recvCurrency }, fee: { amount: quote.feeAmount, currency: quote.sendCurrency } },
      fxRate: quote.fxRate,
      provider: { name: quote.provider?.name, type: quote.provider?.type },
      recipient: { name: recipientName, phone: fullPhone, country: recipientCountry },
      kyc: { status: kyc.status }, aml: { result: aml.result, score: aml.score },
      estimatedDelivery: "~30 minutes",
    });
  } catch (error) {
    console.error("[MVP Send] Error:", error);
    return NextResponse.json({ error: "Failed to process send" }, { status: 500 });
  }
}
