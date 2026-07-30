import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ── African country codes (ISO 3166-1 alpha-2) ──────────────────────
const AFRICAN_COUNTRIES = new Set([
  "AO", "BF", "BI", "BJ", "BW", "CD", "CF", "CG", "CI", "CM", "CV", "DJ",
  "DZ", "EG", "EH", "ER", "ET", "GA", "GH", "GM", "GN", "GQ", "GW", "KE",
  "KM", "LR", "LS", "LY", "MA", "MG", "ML", "MR", "MU", "MW", "MZ", "NA",
  "NE", "NG", "RE", "RW", "SC", "SD", "SL", "SN", "SO", "SS", "ST", "SZ",
  "TD", "TG", "TN", "TZ", "UG", "ZA", "ZM", "ZW",
  // Often associated
  "EH", "SH", "YT",
]);

function isAfricanCountry(code: string): boolean {
  return AFRICAN_COUNTRIES.has(code.toUpperCase());
}

// ── Simulated FX rates for African corridors ────────────────────────
const FX_RATES: Record<string, number> = {
  "NGN-USD": 0.00064,
  "USD-NGN": 1550,
  "KES-USD": 0.0065,
  "USD-KES": 153.5,
  "GHS-USD": 0.083,
  "USD-GHS": 12.05,
  "ZAR-USD": 0.054,
  "USD-ZAR": 18.5,
  "UGX-USD": 0.00026,
  "USD-UGX": 3800,
  "TZS-USD": 0.00037,
  "USD-TZS": 2700,
  "XOF-USD": 0.0016,
  "USD-XOF": 620,
  "EGP-USD": 0.0206,
  "USD-EGP": 48.5,
  "MAD-USD": 0.10,
  "USD-MAD": 10.0,
  "RWF-USD": 0.00075,
  "USD-RWF": 1330,
  "ETB-USD": 0.0083,
  "USD-ETB": 120.5,
  "GHS-NGN": 18.5,
  "NGN-GHS": 0.054,
  "KES-NGN": 10.0,
  "NGN-KES": 0.10,
  "KES-UGX": 24.75,
  "UGX-KES": 0.0404,
  "ZAR-NGN": 46.0,
  "NGN-ZAR": 0.0217,
};

function getFxRate(from: string, to: string): number {
  const key = `${from}-${to}`;
  if (FX_RATES[key]) return FX_RATES[key];
  // Cross via USD
  const toUsd = FX_RATES[`${from}-USD`];
  const fromUsd = FX_RATES[`USD-${to}`];
  if (toUsd && fromUsd) return toUsd * fromUsd;
  return 1.0; // fallback
}

// ── ISO 20022 pacs.008 message builder ──────────────────────────────
function buildIso20022Pacs008(params: {
  msgId: string;
  senderBank: string;
  senderCountry: string;
  senderCurrency: string;
  sendAmount: number;
  recipientName: string;
  recipientPhone: string;
  recvBank: string;
  recvCountry: string;
  recvCurrency: string;
  recvAmount: number;
  sessionId: string;
}): string {
  const now = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.10">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>${params.msgId}</MsgId>
      <CreDtTm>${now}</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <CtrlSum>${params.sendAmount.toFixed(2)}</CtrlSum>
      <InitgPty>
        <Nm>${params.senderBank}</Nm>
        <PstlAdr>
          <Ctry>${params.senderCountry}</Ctry>
        </PstlAdr>
      </InitgPty>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <InstrId>${params.sessionId}</InstrId>
        <EndToEndId>${params.sessionId}-E2E</EndToEndId>
        <TxId>${params.msgId}-TX</TxId>
      </PmtId>
      <Amt>
        <InstdAmt Ccy="${params.senderCurrency}">${params.sendAmount.toFixed(2)}</InstdAmt>
        <EqvtAmt Ccy="${params.recvCurrency}">${params.recvAmount.toFixed(2)}</EqvtAmt>
      </Amt>
      <CdtrAgt>
        <FinInstnId>
          <Nm>${params.recvBank}</Nm>
          <PstlAdr>
            <Ctry>${params.recvCountry}</Ctry>
          </PstlAdr>
        </FinInstnId>
      </CdtrAgt>
      <Cdtr>
        <Nm>${params.recipientName}</Nm>
        <PstlAdr>
          <Ctry>${params.recvCountry}</Ctry>
          <AdrLine>Tel: ${params.recipientPhone}</AdrLine>
        </PstlAdr>
      </Cdtr>
      <RmtInf>
        <Ustrd>AFRISPINE - ${params.senderCountry} to ${params.recvCountry} payment via PAPSS</Ustrd>
      </RmtInf>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>`;
}

// ── Standard fee schedule (bps of send amount) ──────────────────────
const BASE_FEE_BPS = 50; // 0.50% base fee
const NETTED_FEE_BPS = 25; // 0.25% discounted fee when netted
const MIN_FEE_USD = 0.50;

// ── POST: Initiate PAPSS payment ────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sendAmount,
      sendCurrency,
      recvCurrency,
      senderCountry,
      recvCountry,
      senderBank,
      recipientName,
      recipientPhone,
    } = body;

    // Validate required fields
    if (
      !sendAmount ||
      !sendCurrency ||
      !recvCurrency ||
      !senderCountry ||
      !recvCountry ||
      !senderBank ||
      !recipientName ||
      !recipientPhone
    ) {
      return NextResponse.json(
        { error: "Missing required fields. Provide: sendAmount, sendCurrency, recvCurrency, senderCountry, recvCountry, senderBank, recipientName, recipientPhone" },
        { status: 400 }
      );
    }

    const senderUp = senderCountry.toUpperCase();
    const recvUp = recvCountry.toUpperCase();

    // Intra-Africa validation
    if (!isAfricanCountry(senderUp)) {
      return NextResponse.json(
        { error: `Sender country ${senderCountry} is not an African country. PAPSS only supports intra-Africa payments.` },
        { status: 400 }
      );
    }
    if (!isAfricanCountry(recvUp)) {
      return NextResponse.json(
        { error: `Recipient country ${recvCountry} is not an African country. PAPSS only supports intra-Africa payments.` },
        { status: 400 }
      );
    }

    // Generate session ID
    const timestamp = Date.now();
    const hexTimestamp = timestamp.toString(16).toUpperCase().padStart(12, "0");
    const sessionId = `PAPSS-${hexTimestamp}`;

    // Generate ISO 20022 message ID
    const isoMsgId = `AFSP-${timestamp}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Calculate FX and amounts
    const fxRate = getFxRate(sendCurrency, recvCurrency);
    const recvAmount = sendAmount * fxRate;

    // ── Netting simulation ───────────────────────────────────────────
    const corridorKey = `${senderUp}-${recvUp}`;
    const currencyPair = `${sendCurrency}-${recvCurrency}`;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const offsettingSessions = await db.papssSession.findMany({
      where: {
        senderCountry: { in: [senderUp, recvUp] },
        recvCountry: { in: [senderUp, recvUp] },
        sendCurrency: { in: [sendCurrency, recvCurrency] },
        recvCurrency: { in: [sendCurrency, recvCurrency] },
        createdAt: { gte: twentyFourHoursAgo },
        status: { in: ["initiated", "settled"] },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const isNetted = offsettingSessions.length >= 2;
    const feeBps = isNetted ? NETTED_FEE_BPS : BASE_FEE_BPS;
    const rawFee = (sendAmount * feeBps) / 10000;
    const fee = Math.max(rawFee, MIN_FEE_USD);

    // Build ISO 20022 message
    const iso20022Message = buildIso20022Pacs008({
      msgId: isoMsgId,
      senderBank,
      senderCountry: senderUp,
      senderCurrency: sendCurrency,
      sendAmount,
      recipientName,
      recipientPhone,
      recvBank: "PAPSS-Clearing-Hub",
      recvCountry: recvUp,
      recvCurrency: recvCurrency,
      recvAmount,
      sessionId,
    });

    // Estimated settlement time
    const estimatedSettlementMs = Math.floor(Math.random() * 5000);
    const estimatedSettlementTime = `${(estimatedSettlementMs / 1000).toFixed(1)}s`;

    // Write to DB
    const session = await db.papssSession.create({
      data: {
        sessionId,
        senderBank,
        recvBank: "PAPSS-Clearing-Hub",
        senderCountry: senderUp,
        recvCountry: recvUp,
        sendCurrency,
        recvCurrency,
        sendAmount,
        recvAmount,
        fxRate,
        status: "initiated",
        iso20022MsgId: isoMsgId,
        iso20022Msg: iso20022Message,
        pipProtocol: "pacs.008",
        nettingGroupId: isNetted ? `NET-${corridorKey}-${timestamp.toString(16)}` : null,
        feeAmount: fee,
        feeCurrency: sendCurrency,
      },
    });

    // Simulate settlement with random delay (0-5 seconds)
    const settlementDelay = estimatedSettlementMs;
    setTimeout(async () => {
      try {
        await db.papssSession.update({
          where: { id: session.id },
          data: {
            status: "settled",
            settlementTime: new Date(),
          },
        });
      } catch {
        // Settlement update failed silently
      }
    }, settlementDelay);

    return NextResponse.json({
      sessionId: session.sessionId,
      iso20022Message,
      iso20022MsgId: isoMsgId,
      nettingResult: {
        netted: isNetted,
        offsettingFlowsFound: offsettingSessions.length,
        nettingGroupId: isNetted ? `NET-${corridorKey}-${timestamp.toString(16)}` : null,
        feeReduction: isNetted ? "50%" : null,
      },
      settlementStatus: "initiated",
      fee: {
        amount: fee,
        currency: sendCurrency,
        rateBps: feeBps,
      },
      estimatedSettlementTime,
      fxRate,
      sendAmount,
      recvAmount,
      createdAt: session.createdAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `PAPSS payment initiation failed: ${message}` },
      { status: 500 }
    );
  }
}

// ── GET: Retrieve all PAPSS sessions with summary stats ─────────────
export async function GET() {
  try {
    const sessions = await db.papssSession.findMany({
      orderBy: { createdAt: "desc" },
    });

    const totalSessions = sessions.length;
    const settledSessions = sessions.filter((s) => s.status === "settled");
    const pendingSessions = sessions.filter((s) => s.status === "initiated");

    const totalSendVolume = sessions.reduce((sum, s) => sum + s.sendAmount, 0);
    const totalFeesCollected = sessions.reduce((sum, s) => sum + s.feeAmount, 0);

    const nettedSessions = sessions.filter((s) => s.nettingGroupId !== null);
    const nettedVolume = nettedSessions.reduce((sum, s) => sum + s.sendAmount, 0);

    // Corridor breakdown
    const corridorMap: Record<string, { count: number; volume: number }> = {};
    for (const s of sessions) {
      const key = `${s.senderCountry}→${s.recvCountry}`;
      if (!corridorMap[key]) corridorMap[key] = { count: 0, volume: 0 };
      corridorMap[key].count += 1;
      corridorMap[key].volume += s.sendAmount;
    }

    // Average settlement time for settled sessions
    let avgSettlementTimeMs: number | null = null;
    if (settledSessions.length > 0) {
      const settlementTimes = settledSessions
        .filter((s) => s.settlementTime !== null)
        .map((s) => s.settlementTime!.getTime() - s.createdAt.getTime());
      if (settlementTimes.length > 0) {
        avgSettlementTimeMs =
          settlementTimes.reduce((a, b) => a + b, 0) / settlementTimes.length;
      }
    }

    return NextResponse.json({
      summary: {
        totalSessions,
        settled: settledSessions.length,
        pending: pendingSessions.length,
        netted: nettedSessions.length,
        totalSendVolume,
        totalFeesCollected,
        nettedVolume,
        avgSettlementTimeMs: avgSettlementTimeMs
          ? `${(avgSettlementTimeMs / 1000).toFixed(2)}s`
          : null,
        topCorridors: Object.entries(corridorMap)
          .sort((a, b) => b[1].volume - a[1].volume)
          .slice(0, 10)
          .map(([corridor, data]) => ({ corridor, ...data })),
      },
      sessions,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to retrieve PAPSS sessions: ${message}` },
      { status: 500 }
    );
  }
}