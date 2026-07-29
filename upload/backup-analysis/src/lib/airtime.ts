const AT_API_KEY = () => process.env.AT_API_KEY || '';
const AT_USERNAME = () => process.env.AT_USERNAME || 'afri_spine_sandbox';
const AIRTIME_MARGIN_PCT = parseFloat(process.env.AIRTIME_MARGIN_PCT || '5');

export interface AirtimeRequest {
  phone: string;
  country: string; // KE, NG, GH, UG, TZ
  amount: number;  // in local currency
  network?: string;
}

export interface AirtimeNetwork {
  id: string;
  label: string;
  country: string;
  countryCode: string;
  currencyCode: string;
}

export const SUPPORTED_NETWORKS: AirtimeNetwork[] = [
  // Kenya
  { id: 'safaricom_ke', label: 'Safaricom', country: 'Kenya', countryCode: 'KE', currencyCode: 'KES' },
  { id: 'airtel_ke', label: 'Airtel', country: 'Kenya', countryCode: 'KE', currencyCode: 'KES' },
  { id: 'telkom_ke', label: 'Telkom', country: 'Kenya', countryCode: 'KE', currencyCode: 'KES' },
  // Nigeria
  { id: 'mtn_ng', label: 'MTN', country: 'Nigeria', countryCode: 'NG', currencyCode: 'NGN' },
  { id: 'airtel_ng', label: 'Airtel', country: 'Nigeria', countryCode: 'NG', currencyCode: 'NGN' },
  { id: 'glo_ng', label: 'Glo', country: 'Nigeria', countryCode: 'NG', currencyCode: 'NGN' },
  // Ghana
  { id: 'mtn_gh', label: 'MTN', country: 'Ghana', countryCode: 'GH', currencyCode: 'GHS' },
  { id: 'vodafone_gh', label: 'Vodafone', country: 'Ghana', countryCode: 'GH', currencyCode: 'GHS' },
  { id: 'airteltigo_gh', label: 'AirtelTigo', country: 'Ghana', countryCode: 'GH', currencyCode: 'GHS' },
  // Uganda
  { id: 'mtn_ug', label: 'MTN', country: 'Uganda', countryCode: 'UG', currencyCode: 'UGX' },
  { id: 'airtel_ug', label: 'Airtel', country: 'Uganda', countryCode: 'UG', currencyCode: 'UGX' },
  // Tanzania
  { id: 'vodacom_tz', label: 'Vodacom', country: 'Tanzania', countryCode: 'TZ', currencyCode: 'TZS' },
  { id: 'airtel_tz', label: 'Airtel', country: 'Tanzania', countryCode: 'TZ', currencyCode: 'TZS' },
];

export function getNetworksForCountry(countryCode: string): AirtimeNetwork[] {
  return SUPPORTED_NETWORKS.filter(n => n.countryCode === countryCode.toUpperCase());
}

/**
 * Get the currency code for a country.
 */
export function getCurrencyForCountry(countryCode: string): string {
  const network = SUPPORTED_NETWORKS.find(n => n.countryCode === countryCode.toUpperCase());
  return network?.currencyCode || 'KES';
}

/**
 * Send airtime via Africa's Talking API.
 */
export async function sendAirtime(request: AirtimeRequest): Promise<{
  success: boolean;
  messageId?: string;
  amount?: string;
  phone?: string;
  discount?: string;
  status?: string;
  error?: string;
}> {
  const apiKey = AT_API_KEY();
  const username = AT_USERNAME();

  if (!apiKey) {
    // Fallback: simulate for development
    console.log(`[AIRTIME] SIMULATED: ${request.amount} ${getCurrencyForCountry(request.country)} to ${request.phone}`);
    return {
      success: true,
      messageId: `AT-SIM-${Date.now()}`,
      amount: String(request.amount),
      phone: request.phone,
      discount: String(request.amount * (AIRTIME_MARGIN_PCT / 100)),
      status: 'simulated',
    };
  }

  const currencyCode = getCurrencyForCountry(request.country);

  try {
    const response = await fetch('https://api.africastalking.com/version1/airtime/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey': apiKey,
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        username: username,
        recipients: JSON.stringify([{
          phoneNumber: request.phone,
          amount: `${currencyCode} ${request.amount}`,
          currencyCode,
        }]),
      }),
    });

    const data = await response.json();

    if (data.responses && data.responses.length > 0) {
      const r = data.responses[0];
      return {
        success: r.status === 'Success',
        messageId: r.requestId,
        amount: r.amount,
        phone: r.phoneNumber,
        discount: r.discount,
        status: r.status,
        error: r.errorMessage,
      };
    }

    return { success: false, error: 'No response from Africa\'s Talking' };
  } catch (e: any) {
    console.error('[AIRTIME] Error:', e);
    return { success: false, error: e.message };
  }
}