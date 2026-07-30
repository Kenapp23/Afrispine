import { db } from '@/lib/db';
import { callProvider } from '@/lib/providers/adapters';

export async function selectBestProvider(sendCurrency: string, receiveCurrency: string, rail: string) {
  const corridor = `${sendCurrency}→${receiveCurrency}`;

  const providers = await db.provider.findMany({
    where: { isActive: true },
  });

  const matched = providers.filter(p => {
    try {
      const corridors: Array<{from: string; to: string}> = JSON.parse(p.supportedCorridors || '[]');
      const rails = p.supportedRails.split(',').map(r => r.trim());
      const corridorMatch = corridors.some(c =>
        c.from.toUpperCase() === sendCurrency.toUpperCase() &&
        c.to.toUpperCase() === receiveCurrency.toUpperCase()
      );
      const railMatch = rails.includes(rail);
      return corridorMatch && railMatch;
    } catch { return false; }
  });

  if (matched.length === 0) return null;

  // Score: reliability*0.4 + speed*0.3 + cost_inverse*0.3
  const scored = matched.map(p => {
    const costInverse = Math.max(100 - (p.billingRate * 10), 0);
    const score = (p.weightReliability * 0.4) + (p.weightSpeed * 0.3) + (costInverse * 0.3);
    return { provider: p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].provider;
}

export function generateReference(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  return `TXN-${year}-${num}`;
}

export async function instructProvider(provider: any, transaction: any) {
  try {
    const result = await callProvider(provider, {
      amount: transaction.amountSend,
      currency: transaction.currencySend,
      receiveCurrency: transaction.currencyReceive,
      recipientName: transaction.recipientName || '',
      recipientPhone: transaction.recipientPhone || '',
      deliveryMethod: transaction.deliveryMethod || 'mobile_money',
      mobileNetwork: transaction.mobileNetwork || '',
      bankName: transaction.bankName || '',
      accountNumber: transaction.accountNumber || '',
      reference: transaction.reference,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/webhooks/${provider.slug}`,
      senderId: transaction.senderId || '',
      recipientCountry: transaction.recipientCountry || '',
      bankCode: '',
      purposeOfTransfer: '',
    });
    return { success: result.success, reference: result.providerReference };
  } catch (e: any) {
    console.error(`[instructProvider] ${provider.slug} error:`, e);
    return { success: false, reference: null };
  }
}