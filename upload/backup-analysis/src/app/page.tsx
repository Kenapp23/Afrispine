'use client';

import '@/lib/i18n';

import React, { Suspense } from 'react';
import { useAppStore, ViewName } from '@/stores/app';
import { PublicLayout, SenderLayout, AdminLayout } from '@/components/afrispine/common/layout';
import { LandingPage } from '@/components/afrispine/common/landing-page';
import { LoginPage } from '@/components/afrispine/auth/login-page';
import { AdminLoginPage } from '@/components/afrispine/auth/admin-login-page';

// ─── Lazy-loaded components ─────────────────────────────────────
const lazy = (loader: () => Promise<{ default: React.FC<any> }>) =>
  React.lazy(loader);

const PricingPage = lazy(() => import('@/components/afrispine/common/pricing-page').then(m => ({ default: m.PricingPage })));
const TermsPage = lazy(() => import('@/components/afrispine/common/terms-page').then(m => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('@/components/afrispine/common/privacy-page').then(m => ({ default: m.PrivacyPage })));
const AmlPolicyPage = lazy(() => import('@/components/afrispine/common/aml-policy-page').then(m => ({ default: m.AmlPolicyPage })));
const BestRatesPage = lazy(() => import('@/components/afrispine/common/best-rates-page').then(m => ({ default: m.BestRatesPage })));
const ContactPage = lazy(() => import('@/components/afrispine/common/contact-page').then(m => ({ default: m.ContactPage })));
const AboutPage = lazy(() => import('@/components/afrispine/common/about-page').then(m => ({ default: m.AboutPage })));
const FaqPage = lazy(() => import('@/components/afrispine/common/faq-page').then(m => ({ default: m.FaqPage })));
const BusinessLandingPage = lazy(() => import('@/components/afrispine/common/business-landing-page').then(m => ({ default: m.BusinessLandingPage })));
const BusinessRegisterPage = lazy(() => import('@/components/afrispine/common/business-register-page').then(m => ({ default: m.BusinessRegisterPage })));
const BusinessSendPage = lazy(() => import('@/components/afrispine/common/business-send-page').then(m => ({ default: m.BusinessSendPage })));
const SignupPage = lazy(() => import('@/components/afrispine/auth/signup-page').then(m => ({ default: m.SignupPage })));
const ForgotPasswordPage = lazy(() => import('@/components/afrispine/auth/forgot-password-page').then(m => ({ default: m.ForgotPasswordPage })));
const OnboardingPage = lazy(() => import('@/components/afrispine/auth/onboarding-page').then(m => ({ default: m.OnboardingPage })));
const MarketsPage = lazy(() => import('@/components/afrispine/common/markets-page').then(m => ({ default: m.MarketsPage })));
const DangoteIpoPage = lazy(() => import('@/components/afrispine/common/dangote-ipo-page').then(m => ({ default: m.DangoteIpoPage })));
const ChinaCorridorPage = lazy(() => import('@/components/afrispine/common/china-corridor-page').then(m => ({ default: m.default })));
const IntraAfricaPage = lazy(() => import('@/components/afrispine/common/intra-africa-page').then(m => ({ default: m.IntraAfricaPage })));
const SeoSendUkKenya = lazy(() => import('@/components/afrispine/seo/seo-send-uk-kenya').then(m => ({ default: m.SeoSendUkKenya })));
const SeoSendUsNigeria = lazy(() => import('@/components/afrispine/seo/seo-send-us-nigeria').then(m => ({ default: m.SeoSendUsNigeria })));
const SeoSendCanadaGhana = lazy(() => import('@/components/afrispine/seo/seo-send-canada-ghana').then(m => ({ default: m.SeoSendCanadaGhana })));
const SeoSendUkNigeria = lazy(() => import('@/components/afrispine/seo/seo-send-uk-nigeria').then(m => ({ default: m.SeoSendUkNigeria })));
const SeoSendDangoteIpo = lazy(() => import('@/components/afrispine/seo/seo-send-dangote-ipo').then(m => ({ default: m.SeoSendDangoteIpo })));

// Sender views
const SenderDashboardPage = lazy(() => import('@/components/afrispine/sender/dashboard-page').then(m => ({ default: m.DashboardPage })));
const TransfersPage = lazy(() => import('@/components/afrispine/sender/transfers-page').then(m => ({ default: m.TransfersPage })));
const TransferDetailPage = lazy(() => import('@/components/afrispine/sender/transfer-detail-page').then(m => ({ default: m.TransferDetailPage })));
const ProfilePage = lazy(() => import('@/components/afrispine/sender/profile-page').then(m => ({ default: m.ProfilePage })));
const SendFlow = lazy(() => import('@/components/afrispine/send/send-flow').then(m => ({ default: m.SendFlow })));
const RecurringSendsPage = lazy(() => import('@/components/afrispine/sender/recurring-sends-page').then(m => ({ default: m.RecurringSendsPage })));
const RateAlertsPage = lazy(() => import('@/components/afrispine/sender/rate-alerts-page').then(m => ({ default: m.RateAlertsPage })));
const AirtimePage = lazy(() => import('@/components/afrispine/sender/airtime-page').then(m => ({ default: m.AirtimePage })));
const BillsPage = lazy(() => import('@/components/afrispine/sender/bills-page').then(m => ({ default: m.BillsPage })));
const GroupSendsPage = lazy(() => import('@/components/afrispine/sender/group-sends-page').then(m => ({ default: m.GroupSendsPage })));
const KycPage = lazy(() => import('@/components/afrispine/sender/kyc-page').then(m => ({ default: m.KycPage })));
const NotificationsPage = lazy(() => import('@/components/afrispine/sender/notifications-page').then(m => ({ default: m.NotificationsPage })));
const WealthLandingPage = lazy(() => import('@/components/afrispine/wealth/wealth-landing-page').then(m => ({ default: m.WealthLandingPage })));
const WealthMarketPage = lazy(() => import('@/components/afrispine/wealth/wealth-market-page').then(m => ({ default: m.WealthMarketPage })));
const WealthStockPage = lazy(() => import('@/components/afrispine/wealth/wealth-stock-page').then(m => ({ default: m.WealthStockPage })));
const WealthPortfolioPage = lazy(() => import('@/components/afrispine/wealth/wealth-portfolio-page').then(m => ({ default: m.WealthPortfolioPage })));
const WealthBuyPage = lazy(() => import('@/components/afrispine/wealth/wealth-buy-page').then(m => ({ default: m.WealthBuyPage })));
const WealthWatchlistPage = lazy(() => import('@/components/afrispine/wealth/wealth-watchlist-page').then(m => ({ default: m.WealthWatchlistPage })));
const WealthBondsPage = lazy(() => import('@/components/afrispine/wealth/wealth-bonds-page').then(m => ({ default: m.WealthBondsPage })));
const WealthActivationPage = lazy(() => import('@/components/afrispine/wealth/wealth-activation-page').then(m => ({ default: m.WealthActivationPage })));
const GiftsHubPage = lazy(() => import('@/components/afrispine/gifts/gifts-hub-page').then(m => ({ default: m.default })));
const GiftsSendPage = lazy(() => import('@/components/afrispine/gifts/gifts-send-page').then(m => ({ default: m.default })));
const GiftsRedeemPage = lazy(() => import('@/components/afrispine/gifts/gifts-redeem-page').then(m => ({ default: m.default })));
const MerchantOnboardingPage = lazy(() => import('@/components/afrispine/gifts/merchant-onboarding-page').then(m => ({ default: m.MerchantOnboardingPage })));
const ChamaPage = lazy(() => import('@/components/afrispine/sender/chama-page').then(m => ({ default: m.ChamaPage })));

// Digest views
const DigestCurrentIssuePage = lazy(() => import('@/components/afrispine/digest/digest-current-issue-page').then(m => ({ default: m.DigestCurrentIssuePage })));
const DigestArchivePage = lazy(() => import('@/components/afrispine/digest/digest-archive-page').then(m => ({ default: m.DigestArchivePage })));
const DigestIssuePage = lazy(() => import('@/components/afrispine/digest/digest-issue-page').then(m => ({ default: m.DigestIssuePage })));
const DigestStoryPage = lazy(() => import('@/components/afrispine/digest/digest-story-page').then(m => ({ default: m.DigestStoryPage })));
const DigestAdvertisePage = lazy(() => import('@/components/afrispine/digest/digest-advertise-page').then(m => ({ default: m.DigestAdvertisePage })));
const DigestSubscribePage = lazy(() => import('@/components/afrispine/digest/digest-subscribe-page').then(m => ({ default: m.DigestSubscribePage })));

// Admin views
const AdminDashboard = lazy(() => import('@/components/afrispine/admin/admin-dashboard').then(m => ({ default: m.AdminDashboard })));
const AdminSendersPage = lazy(() => import('@/components/afrispine/admin/admin-senders').then(m => ({ default: m.AdminSendersPage })));
const AdminCompliancePage = lazy(() => import('@/components/afrispine/admin/admin-compliance').then(m => ({ default: m.AdminCompliancePage })));
const AdminProvidersPage = lazy(() => import('@/components/afrispine/admin/admin-providers').then(m => ({ default: m.AdminProvidersPage })));
const AdminSettingsPage = lazy(() => import('@/components/afrispine/admin/admin-settings').then(m => ({ default: m.AdminSettingsPage })));
const AdminBusinessPage = lazy(() => import('@/components/afrispine/admin/admin-business-page').then(m => ({ default: m.AdminBusinessPage })));
const AdminWealthPage = lazy(() => import('@/components/afrispine/admin/admin-wealth-page').then(m => ({ default: m.AdminWealthPage })));
const AdminTransactionsPage = lazy(() => import('@/components/afrispine/admin/admin-transactions').then(m => ({ default: m.AdminTransactionsPage })));
const AdminRevenuePage = lazy(() => import('@/components/afrispine/admin/admin-revenue').then(m => ({ default: m.AdminRevenuePage })));
const AdminBillingPage = lazy(() => import('@/components/afrispine/admin/admin-billing').then(m => ({ default: m.AdminBillingPage })));
const AdminSettlementPage = lazy(() => import('@/components/afrispine/admin/admin-settlement').then(m => ({ default: m.AdminSettlementPage })));
const AdminDigestPage = lazy(() => import('@/components/afrispine/admin/admin-digest-page').then(m => ({ default: m.AdminDigestPage })));

// ─── Loading fallback ───────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

// ─── Public (unauthenticated) views ─────────────────────────────
const publicViews: Partial<Record<ViewName, React.LazyExoticComponent<React.FC>>> = {
  landing: LandingPage as any,
  pricing: PricingPage,
  markets: MarketsPage,
  'dangote-ipo': DangoteIpoPage,
  terms: TermsPage,
  privacy: PrivacyPage,
  'aml-policy': AmlPolicyPage,
  'best-rates': BestRatesPage,
  contact: ContactPage,
  login: LoginPage as any,
  signup: SignupPage,
  'forgot-password': ForgotPasswordPage,
  about: AboutPage,
  faq: FaqPage,
  business: BusinessLandingPage,
  'business-register': BusinessRegisterPage,
  'business-send': BusinessSendPage,
  'china-corridor': ChinaCorridorPage,
  'intra-africa': IntraAfricaPage,
  'send-uk-kenya': SeoSendUkKenya,
  'send-us-nigeria': SeoSendUsNigeria,
  'send-canada-ghana': SeoSendCanadaGhana,
  'send-uk-nigeria': SeoSendUkNigeria,
  'send-dangote-ipo': SeoSendDangoteIpo,
  'gifts-merchant': MerchantOnboardingPage,
  'digest-current': DigestCurrentIssuePage,
  'digest-archive': DigestArchivePage,
  'digest-issue': DigestIssuePage,
  'digest-story': DigestStoryPage,
  'digest-advertise': DigestAdvertisePage,
  'digest-subscribe': DigestSubscribePage,
};

// ─── Sender (authenticated) views ───────────────────────────────
const senderViews: Partial<Record<ViewName, React.LazyExoticComponent<React.FC>>> = {
  onboarding: OnboardingPage,
  dashboard: SenderDashboardPage,
  send: SendFlow,
  transfers: TransfersPage,
  'transfer-detail': TransferDetailPage,
  profile: ProfilePage,
  verify: KycPage,
  notifications: NotificationsPage,
  'recurring-sends': RecurringSendsPage,
  'rate-alerts': RateAlertsPage,
  airtime: AirtimePage,
  bills: BillsPage,
  'group-sends': GroupSendsPage,
  'wealth-landing': WealthLandingPage,
  'wealth-market': WealthMarketPage,
  'wealth-stock': WealthStockPage,
  'wealth-portfolio': WealthPortfolioPage,
  'wealth-buy': WealthBuyPage,
  'wealth-watchlist': WealthWatchlistPage,
  'wealth-bonds': WealthBondsPage,
  'wealth-activation': WealthActivationPage,
  gifts: GiftsHubPage,
  'gifts-send': GiftsSendPage,
  'gifts-redeem': GiftsRedeemPage,
  chama: ChamaPage,
};

// ─── Admin views ────────────────────────────────────────────────
const adminViews: Partial<Record<ViewName, React.LazyExoticComponent<React.FC>>> = {
  'admin-dashboard': AdminDashboard,
  'admin-transactions': AdminTransactionsPage,
  'admin-senders': AdminSendersPage,
  'admin-providers': AdminProvidersPage,
  'admin-revenue': AdminRevenuePage,
  'admin-billing': AdminBillingPage,
  'admin-settlement': AdminSettlementPage,
  'admin-compliance': AdminCompliancePage,
  'admin-settings': AdminSettingsPage,
  'admin-business': AdminBusinessPage,
  'admin-wealth': AdminWealthPage,
  'admin-digest': AdminDigestPage,
};

export default function HomePage() {
  const currentView = useAppStore((s) => s.currentView);
  const sessionToken = useAppStore((s) => s.sessionToken);
  const adminSessionToken = useAppStore((s) => s.adminSessionToken);
  const navigate = useAppStore((s) => s.navigate);
  const set = useAppStore((s) => s.setState);
  const loginAsSender = useAppStore((s) => s.loginAsSender);
  const loginAsAdmin = useAppStore((s) => s.loginAsAdmin);

  // Skip SSR entirely — this is a pure SPA with client-side routing.
  // Prevents hydration mismatches from lazy-loaded components, i18n, cookies, etc.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  // Session restoring state to prevent auth guard race condition
  const [sessionRestoring, setSessionRestoring] = React.useState(true);

  // Restore session from cookie on mount (only client-side)
  React.useEffect(() => {
    if (!mounted) return;
    // Parse deep link params from URL hash (e.g. #/send?from=USD&to=KES&amount=50)
    const hash = window.location.hash;
    if (hash.startsWith('#/')) {
      const [viewPart, queryPart] = hash.slice(2).split('?');
      const viewName = viewPart as ViewName;
      const params: Record<string, string> = {};
      if (queryPart) {
        new URLSearchParams(queryPart).forEach((v, k) => { params[k] = v; });
      }
      // Validate view name
      if (['send', 'signup', 'login', 'pricing', 'markets', 'dangote-ipo', 'business', 'faq', 'contact', 'about', 'landing', 'wealth-landing', 'wealth-market', 'wealth-stock', 'wealth-portfolio', 'wealth-bonds', 'wealth-buy', 'wealth-activation', 'wealth-watchlist', 'china-corridor', 'intra-africa', 'gifts', 'gifts-send', 'gifts-redeem', 'gifts-merchant', 'chama', 'send-uk-kenya', 'send-us-nigeria', 'send-canada-ghana', 'send-uk-nigeria', 'send-dangote-ipo', 'digest-current', 'digest-archive', 'digest-issue', 'digest-story', 'digest-advertise', 'digest-subscribe'].includes(viewName)) {
        set({ currentView: viewName, viewParams: params });
        // Clean hash
        window.history.replaceState(null, '', window.location.pathname);
      }
    }

    if (!sessionToken && !adminSessionToken) {
      // Try to restore sender session
      fetch('/api/auth/me')
        .then((r) => {
          if (r.ok) return r.json();
          throw new Error('no sender session');
        })
        .then((data) => {
          // Get token from cookie — the API already verified it
          const match = document.cookie.match(/afrispine_session=([^;]+)/);
          if (match) {
            const senderWithFullName = {
              ...data.sender,
              fullName: `${data.sender.firstName || ''} ${data.sender.lastName || ''}`.trim(),
            };
            loginAsSender(senderWithFullName, match[1]); // defaults to 'dashboard'
          }
        })
        .catch(() => {
          // Try to restore admin session
          fetch('/api/auth/admin/me')
            .then((r) => {
              if (r.ok) return r.json();
              throw new Error('no admin session');
            })
            .then((data) => {
              const match = document.cookie.match(/afrispine_admin_session=([^;]+)/);
              if (match) loginAsAdmin(data.admin, match[1]); // defaults to 'admin-dashboard'
            })
            .catch(() => {});
        })
        .finally(() => setSessionRestoring(false));
    } else {
      setSessionRestoring(false);
    }
  }, [mounted, loginAsSender, loginAsAdmin, sessionToken, adminSessionToken, set]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auth guard: redirect unauthenticated users trying to access protected views
  // ONLY fires after session restoration is complete
  const isSenderView = currentView in senderViews;
  const isAdminView = currentView in adminViews;

  React.useEffect(() => {
    if (sessionRestoring) return; // Don't redirect while session is being restored
    if (isSenderView && !sessionToken) {
      navigate('login');
    }
    if (isAdminView && !adminSessionToken) {
      navigate('admin-login');
    }
  }, [currentView, sessionToken, adminSessionToken, navigate, isSenderView, isAdminView, sessionRestoring]);

  // Don't render anything meaningful during SSR — return identical shell
  // to avoid any hydration mismatch. Real UI renders only after mount.
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Render admin login — completely separate from sender public layout
  if (currentView === 'admin-login') {
    return <AdminLoginPage />;
  }

  // Render public views (sender-facing)
  if (!isSenderView && !isAdminView) {
    const PageComponent = publicViews[currentView];
    if (PageComponent) {
      return (
        <PublicLayout>
          <Suspense fallback={<PageLoader />}>
            <PageComponent />
          </Suspense>
        </PublicLayout>
      );
    }
  }

  // Render sender views
  if (isSenderView && sessionToken) {
    const PageComponent = senderViews[currentView];
    if (PageComponent) {
      return (
        <SenderLayout>
          <Suspense fallback={<PageLoader />}>
            <PageComponent />
          </Suspense>
        </SenderLayout>
      );
    }
  }

  // Render admin views
  if (isAdminView && adminSessionToken) {
    const PageComponent = adminViews[currentView];
    if (PageComponent) {
      return (
        <AdminLayout>
          <Suspense fallback={<PageLoader />}>
            <PageComponent />
          </Suspense>
        </AdminLayout>
      );
    }
  }

  // Fallback: render landing page
  return (
    <PublicLayout>
      <LandingPage />
    </PublicLayout>
  );
}