export const WEBHOOK_SECRET = 'flw_simulated_secret';

export async function initPayment(params: { tx_ref: string; amount: number; currency: string; email: string; name: string; phone: string }) {
  return { paymentLink: `https://checkout.flutterwave.com/v3/hosted/pay?tx_ref=${params.tx_ref}` };
}

export async function verifyPayment(_tx_ref: string) {
  return { status: 'successful', tx_id: `FLW-${Date.now()}` };
}

export async function refundPayment(_flwTxId: string) {
  return { status: 'refund_processing' };
}
