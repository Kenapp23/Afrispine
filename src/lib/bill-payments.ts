const AT_API_KEY = () => process.env.AT_API_KEY || '';
const AT_USERNAME = () => process.env.AT_USERNAME || 'afri_spine_sandbox';
export const BILL_PAY_FEE_GBP = parseFloat(process.env.BILL_PAY_FEE_GBP || '0.50');

export interface BillProvider {
  id: string;
  label: string;
  icon: string; // emoji
  country: string;
  category: string;
  fields: { name: string; label: string; placeholder: string; required: boolean }[];
}

export const BILL_PROVIDERS: BillProvider[] = [
  {
    id: 'kplc_prepaid',
    label: 'KPLC Prepaid',
    icon: '⚡',
    country: 'KE',
    category: 'electricity',
    fields: [
      { name: 'accountNumber', label: 'Meter Number', placeholder: 'Enter meter number', required: true },
      { name: 'amount', label: 'Amount (KES)', placeholder: 'Enter amount in KES', required: true },
    ],
  },
  {
    id: 'nairobi_water',
    label: 'Nairobi Water',
    icon: '💧',
    country: 'KE',
    category: 'water',
    fields: [
      { name: 'accountNumber', label: 'Account Number', placeholder: 'Enter account number', required: true },
      { name: 'amount', label: 'Amount (KES)', placeholder: 'Enter amount in KES', required: true },
    ],
  },
  {
    id: 'dstv',
    label: 'DStv / GOtv',
    icon: '📺',
    country: 'KE',
    category: 'tv',
    fields: [
      { name: 'smartCardNumber', label: 'Smart Card / IUC Number', placeholder: 'Enter smart card number', required: true },
      { name: 'package', label: 'Package', placeholder: 'e.g. DStv Compact', required: true },
      { name: 'amount', label: 'Amount (KES)', placeholder: 'Enter amount', required: true },
    ],
  },
  {
    id: 'nhif',
    label: 'NHIF',
    icon: '🏥',
    country: 'KE',
    category: 'insurance',
    fields: [
      { name: 'idNumber', label: 'ID Number', placeholder: 'Enter national ID number', required: true },
      { name: 'amount', label: 'Amount (KES)', placeholder: 'Enter contribution amount', required: true },
    ],
  },
];

export function getBillProvidersForCountry(countryCode: string): BillProvider[] {
  return BILL_PROVIDERS.filter(p => p.country === countryCode.toUpperCase());
}

/**
 * Pay a bill via Africa's Talking Payments (or partner API).
 */
export async function payBill(params: {
  provider: string;
  accountReference: string;
  amount: number;
  country: string;
  metadata?: Record<string, string>;
}): Promise<{
  success: boolean;
  transactionId?: string;
  status?: string;
  error?: string;
}> {
  const apiKey = AT_API_KEY();
  const username = AT_USERNAME();

  if (!apiKey) {
    // Simulate for development
    console.log(`[BILL] SIMULATED: ${params.amount} KES to ${params.provider} ref=${params.accountReference}`);
    return {
      success: true,
      transactionId: `BILL-SIM-${Date.now()}`,
      status: 'simulated',
    };
  }

  try {
    // Africa's Talking Payments - B2C or B2B depending on provider
    // This would be replaced with the actual bill payment API for each provider
    const response = await fetch(`https://api.africastalking.com/version1/billing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apiKey': apiKey,
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        username,
        productName: 'AfriSpine',
        phoneNumber: '',
        amount: params.amount,
        currencyCode: 'KES',
        metadata: {
          provider: params.provider,
          accountReference: params.accountReference,
          ...params.metadata,
        },
        narration: `Bill payment: ${params.provider}`,
      }),
    });

    const data = await response.json();
    return {
      success: data.status === 'Success',
      transactionId: data.transactionId || data.transactionId,
      status: data.status,
      error: data.description || data.errorMessage,
    };
  } catch (e: any) {
    console.error('[BILL] Error:', e);
    return { success: false, error: e.message };
  }
}