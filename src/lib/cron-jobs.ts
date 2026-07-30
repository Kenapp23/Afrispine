import { db } from '@/lib/db';
import { initializeTransaction, chargeAuthorization } from '@/lib/paystack';
import { getFxRate, applyMargin } from '@/lib/fx';

/**
 * Process all due recurring sends.
 * Designed to be called by an external scheduler (Vercel Cron, node-cron, etc.)
 * or via POST /api/cron/recurring
 */
export async function processRecurringSends() {
  const now = new Date();
  console.log(`[cron:recurring] Processing at ${now.toISOString()}`);

  const dueSends = await db.recurringSend.findMany({
    where: {
      isActive: true,
      nextRunAt: { lte: now },
    },
    include: {
      sender: { include: { subscription: true } },
      recipient: true,
    },
  });

  console.log(`[cron:recurring] Found ${dueSends.length} due sends`);

  const results: { id: string; status: string; error?: string }[] = [];

  for (const rs of dueSends) {
    try {
      // Check sender has saved Paystack auth
      const auth = await db.senderPaystackAuth.findUnique({
        where: { senderId: rs.senderId },
      });

      if (!auth || !auth.isActive) {
        console.warn(`[cron:recurring] No saved card for sender ${rs.senderId}, pausing`);
        await db.recurringSend.update({ where: { id: rs.id }, data: { isActive: false } });
        results.push({ id: rs.id, status: 'paused', error: 'No saved payment method' });
        continue;
      }

      // Get FX rate
      const baseRate = await getFxRate(rs.currencySend.substring(0, 2).toUpperCase(), rs.currencyReceive.substring(0, 2).toUpperCase());
      const rate = await applyMargin(baseRate, `${rs.currencySend}-${rs.currencyReceive}`);
      const feePct = rs.sender?.subscription?.plan === 'pro' ? 0.75 : 1.5;
      const feeAmount = rs.amount * (feePct / 100);
      const receiveAmount = rs.amount * rate - feeAmount;
      const totalCharged = rs.amount + feeAmount;

      // Generate reference
      const ref = `AFSP-RECUR-${rs.id}-${Date.now()}`;

      // Charge saved card
      const chargeResult = await chargeAuthorization({
        authorization_code: auth.authorizationCode,
        email: auth.email,
        amount: totalCharged,
        reference: ref,
      });

      if (!chargeResult.status) {
        console.error(`[cron:recurring] Charge failed for ${rs.id}: ${chargeResult.message}`);
        results.push({ id: rs.id, status: 'failed', error: chargeResult.message });
        continue;
      }

      // Create transaction record
      await db.transaction.create({
        data: {
          reference: `TXN-RECUR-${new Date().getFullYear()}-${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`,
          senderId: rs.senderId,
          recipientId: rs.recipientId,
          status: 'payment_confirmed',
          amountSend: rs.amount,
          currencySend: rs.currencySend,
          amountReceive: Math.round(receiveAmount * 100) / 100,
          currencyReceive: rs.currencyReceive,
          fxRate: rate,
          feePct,
          feeAmount: Math.round(feeAmount * 100) / 100,
          totalCharged: Math.round(totalCharged * 100) / 100,
          rail: rs.rail,
          paystackRef: ref,
          paymentConfirmedAt: new Date(),
          amlResult: 'pending',
        },
      });

      // Update next run
      const nextRun = calculateNextRunDate(rs.frequency, rs.dayOfMonth);
      await db.recurringSend.update({
        where: { id: rs.id },
        data: {
          lastRunAt: now,
          nextRunAt: nextRun,
          totalRuns: { increment: 1 },
        },
      });

      results.push({ id: rs.id, status: 'success' });
    } catch (e: any) {
      console.error(`[cron:recurring] Error for ${rs.id}:`, e);
      results.push({ id: rs.id, status: 'error', error: e.message });
    }
  }

  return results;
}

function calculateNextRunDate(frequency: string, dayOfMonth: number): Date {
  const now = new Date();
  if (frequency === 'weekly') {
    const next = new Date(now);
    next.setDate(next.getDate() + 7);
    next.setHours(9, 0, 0, 0);
    return next;
  }
  const targetDay = Math.min(dayOfMonth, 28);
  let month = now.getMonth() + 1;
  let year = now.getFullYear();
  if (month > 11) { month = 0; year++; }
  return new Date(year, month, targetDay, 9, 0, 0, 0);
}

/**
 * Check rate alerts and notify triggered ones.
 */
export async function processRateAlerts() {
  const alerts = await db.rateAlert.findMany({
    where: { isActive: true, triggeredAt: null },
    include: { sender: true },
  });

  console.log(`[cron:rateAlerts] Checking ${alerts.length} active alerts`);

  for (const alert of alerts) {
    try {
      const rate = await getFxRate(alert.fromCurrency, alert.toCurrency);
      const triggered = (alert.direction === 'above' && rate >= alert.targetRate) ||
                        (alert.direction === 'below' && rate <= alert.targetRate);

      if (triggered) {
        // Notify
        const { sendEmail, sendSms } = await import('@/lib/notifications');
        const message = `${alert.fromCurrency}/${alert.toCurrency} has hit ${alert.targetRate}! Send money now.`;

        if (alert.notifyEmail && alert.sender?.email) {
          await sendEmail(alert.sender.email, `Rate Alert: ${alert.fromCurrency}/${alert.toCurrency}`, message);
        }
        if (alert.notifySms && alert.sender?.phone) {
          await sendSms(alert.sender.phone, message);
        }

        await db.rateAlert.update({
          where: { id: alert.id },
          data: { triggeredAt: new Date() },
        });
        console.log(`[cron:rateAlerts] Triggered alert ${alert.id}: ${alert.fromCurrency}/${alert.toCurrency} ${alert.direction} ${alert.targetRate}`);
      }
    } catch (e: any) {
      console.error(`[cron:rateAlerts] Error for ${alert.id}:`, e);
    }
  }
  return { checked: alerts.length };
}