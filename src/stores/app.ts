import { create } from 'zustand';

export type ViewName =
  | 'terms' | 'privacy' | 'aml-policy' | 'best-rates' | 'contact' | 'landing' | 'pricing' | 'signup' | 'login' | 'forgot-password' | 'onboarding'
  | 'about' | 'faq' | 'business' | 'business-register' | 'business-send'
  | 'dashboard' | 'send' | 'transfers' | 'transfer-detail' | 'profile'
  | 'verify' | 'notifications'
  | 'recurring-sends' | 'rate-alerts' | 'airtime' | 'bills' | 'group-sends'
  | 'admin-login' | 'admin-dashboard' | 'admin-transactions' | 'admin-senders'
  | 'admin-providers' | 'admin-revenue' | 'admin-billing' | 'admin-settlement'
  | 'admin-compliance' | 'admin-settings' | 'admin-business' | 'admin-wealth'
  | 'admin-gift-providers'
  | 'markets' | 'dangote-ipo' | 'china-corridor' | 'intra-africa'
  | 'wealth-landing' | 'wealth-market' | 'wealth-stock' | 'wealth-portfolio' | 'wealth-buy' | 'wealth-watchlist' | 'wealth-bonds' | 'wealth-activation'
  | 'gifts' | 'gifts-send' | 'gifts-redeem' | 'gifts-merchant'
  | 'chama' | 'kyc'
  | 'send-uk-kenya' | 'send-us-nigeria' | 'send-canada-ghana' | 'send-uk-nigeria' | 'send-dangote-ipo'
  | 'digest-current' | 'digest-archive' | 'digest-issue' | 'digest-story'
  | 'digest-advertise' | 'digest-subscribe'
  | 'admin-digest';

interface AppState {
  currentView: ViewName;
  viewParams: Record<string, string>;
  navigate: (view: ViewName, params?: Record<string, string>) => void;

  sender: any | null;
  admin: any | null;
  sessionToken: string | null;
  adminSessionToken: string | null;
  /** Atomic: set sender + token + navigate in one state update */
  loginAsSender: (s: any, token: string, view?: ViewName) => void;
  /** Atomic: set admin + token + navigate in one state update */
  loginAsAdmin: (a: any, token: string, view?: ViewName) => void;
  logoutSender: () => void;
  logoutAdmin: () => void;
  logout: () => void;

  sendStep: number;
  sendCorridor: { from: string; to: string };
  sendCurrency: string;
  sendAmount: number;
  receiveCurrency: string;
  receiveAmount: number;
  fxRate: number;
  feePct: number;
  feeAmount: number;
  totalCharged: number;
  selectedRail: string;
  selectedNetwork: string;
  selectedProvider: any | null;
  quoteExpiresAt: string | null;
  quoteId: string | null;
  recipientName: string;
  recipientPhone: string;
  recipientCountry: string;
  recipientBankName: string;
  recipientAccountNumber: string;
  recipientBankCode: string;
  recipientRippleAddress: string;
  recipientPapssIban: string;
  saveCardForRecurring: boolean;
  paymentLink: string | null;
  currentTransaction: any | null;
  senderId: string | null;

  // Detected sender country for geo-localization
  detectedCountry: string | null;
  setDetectedCountry: (c: string | null) => void;

  preferredCurrency: string;
  setPreferredCurrency: (c: string) => void;

  // Bill payment flow state
  billStep: number;
  billType: string | null;
  setBillStep: (s: number) => void;
  setBillType: (t: string | null) => void;
  resetBillFlow: () => void;

  // Business FX state
  bizStep: number;
  bizSellCurrency: string;
  bizBuyCurrency: string;
  bizSellAmount: number;
  bizBuyAmount: number;
  bizFxRate: number;
  bizMarginPct: number;
  bizMarginAmount: number;
  bizTotalCharged: number;
  bizQuoteExpiresAt: string | null;
  bizBeneficiaryName: string;
  bizBeneficiaryBank: string;
  bizBeneficiaryAccount: string;
  bizBeneficiarySwift: string;
  bizBeneficiaryCountry: string;
  bizPurposeOfPayment: string;
  setBizStep: (s: number) => void;
  updateBizQuote: (d: Partial<AppState>) => void;
  resetBizFlow: () => void;

  setSendStep: (s: number) => void;
  updateQuote: (d: Partial<AppState>) => void;
  resetSendFlow: () => void;
}

const initialState = {
  sendStep: 1, sendCorridor: { from: 'US', to: 'KE' }, sendCurrency: 'USD', sendAmount: 100,
  receiveCurrency: 'KES', receiveAmount: 0, fxRate: 153.78, feePct: 1.5, feeAmount: 1.5,
  totalCharged: 101.5, selectedRail: 'mobile_money', selectedNetwork: 'm-pesa',
  selectedProvider: null, quoteExpiresAt: null, quoteId: null, recipientName: '',
  recipientPhone: '', recipientCountry: 'KE',
  recipientBankName: '', recipientAccountNumber: '', recipientBankCode: '',
  recipientRippleAddress: '', recipientPapssIban: '',
  saveCardForRecurring: false,
  paymentLink: null, currentTransaction: null, senderId: null,
  detectedCountry: null,
  preferredCurrency: 'USD',
  billStep: 1, billType: null,
  bizStep: 1, bizSellCurrency: 'USD', bizBuyCurrency: 'KES', bizSellAmount: 50000,
  bizBuyAmount: 0, bizFxRate: 129.4, bizMarginPct: 0.75, bizMarginAmount: 375,
  bizTotalCharged: 50375, bizQuoteExpiresAt: null,
  bizBeneficiaryName: '', bizBeneficiaryBank: '', bizBeneficiaryAccount: '',
  bizBeneficiarySwift: '', bizBeneficiaryCountry: 'KE', bizPurposeOfPayment: '',
};

export const useAppStore = create<AppState>((set) => ({
  currentView: 'landing',
  viewParams: {},
  navigate: (view, params = {}) => set({ currentView: view, viewParams: params }),

  sender: null, admin: null, sessionToken: null, adminSessionToken: null,

  loginAsSender: (s, token, view = 'dashboard') =>
    set({
      sender: s, sessionToken: token, currentView: view, viewParams: {},
      admin: null, adminSessionToken: null,
    }),

  loginAsAdmin: (a, token, view = 'admin-dashboard') =>
    set({
      admin: a, adminSessionToken: token, currentView: view, viewParams: {},
      sender: null, sessionToken: null,
    }),

  logoutSender: () => {
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    return set({ sender: null, sessionToken: null, currentView: 'landing', viewParams: {} });
  },

  logoutAdmin: () => {
    fetch('/api/auth/admin/logout', { method: 'POST' }).catch(() => {});
    return set({ admin: null, adminSessionToken: null, currentView: 'landing', viewParams: {} });
  },

  logout: () => {
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    fetch('/api/auth/admin/logout', { method: 'POST' }).catch(() => {});
    return set({ sender: null, admin: null, sessionToken: null, adminSessionToken: null, currentView: 'landing', viewParams: {} });
  },

  ...initialState,

  setDetectedCountry: (c) => set({ detectedCountry: c }),

  setPreferredCurrency: (c) => set({ preferredCurrency: c }),

  setBillStep: (s) => set({ billStep: s }),
  setBillType: (t) => set({ billType: t, billStep: 2 }),
  resetBillFlow: () => set({ billStep: 1, billType: null }),

  setBizStep: (s) => set({ bizStep: s }),
  updateBizQuote: (d) => set((s) => ({ ...s, ...d })),
  resetBizFlow: () => set({
    bizStep: 1, bizSellCurrency: 'USD', bizBuyCurrency: 'KES', bizSellAmount: 50000,
    bizBuyAmount: 0, bizFxRate: 129.4, bizMarginPct: 0.75, bizMarginAmount: 375,
    bizTotalCharged: 50375, bizQuoteExpiresAt: null,
    bizBeneficiaryName: '', bizBeneficiaryBank: '', bizBeneficiaryAccount: '',
    bizBeneficiarySwift: '', bizBeneficiaryCountry: 'KE', bizPurposeOfPayment: '',
  }),

  setSendStep: (s) => set({ sendStep: s }),
  updateQuote: (d) => set((s) => ({ ...s, ...d })),
  resetSendFlow: () => set({ ...initialState, sendStep: 1 }),
}));