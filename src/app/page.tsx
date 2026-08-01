'use client';

import React, { useEffect, useSyncExternalStore } from 'react';
import { useAppStore, ViewName } from '@/stores/app';

// ─── Layouts ─────────────────────────────────────────────────
import { PublicLayout, SenderLayout, AdminLayout } from '@/components/afrispine/common/layout';

// ─── Auth Pages (eager — critical path) ─────────────────────
import { LoginPage } from '@/components/afrispine/auth/login-page';
import { SignupPage } from '@/components/afrispine/auth/signup-page';
import { AdminLoginPage } from '@/components/afrispine/auth/admin-login-page';
import { ForgotPasswordPage } from '@/components/afrispine/auth/forgot-password-page';
import { OnboardingPage } from '@/components/afrispine/auth/onboarding-page';
import { VerifyEmailPage } from '@/components/afrispine/auth/verify-email-page';

// ─── Public / Static Pages ──────────────────────────────────
import { LandingPage } from '@/components/afrispine/common/landing-page';
import { AboutPage } from '@/components/afrispine/common/about-page';
import { FaqPage } from '@/components/afrispine/common/faq-page';
import { ContactPage } from '@/components/afrispine/common/contact-page';
import { PricingPage } from '@/components/afrispine/common/pricing-page';
import { TermsPage } from '@/components/afrispine/common/terms-page';
import { PrivacyPage } from '@/components/afrispine/common/privacy-page';
import { AmlPolicyPage } from '@/components/afrispine/common/aml-policy-page';
import { BestRatesPage } from '@/components/afrispine/common/best-rates-page';
import { MarketsPage } from '@/components/afrispine/common/markets-page';
import { DangoteIpoPage } from '@/components/afrispine/common/dangote-ipo-page';
import ChinaCorridorPage from '@/components/afrispine/common/china-corridor-page';
import { IntraAfricaPage } from '@/components/afrispine/common/intra-africa-page';
import { BusinessLandingPage } from '@/components/afrispine/common/business-landing-page';
import { BusinessRegisterPage } from '@/components/afrispine/common/business-register-page';
import { BusinessSendPage } from '@/components/afrispine/common/business-send-page';

// ─── SEO Corridor Pages ─────────────────────────────────────
import { SeoSendUkKenya } from '@/components/afrispine/seo/seo-send-uk-kenya';
import { SeoSendUsNigeria } from '@/components/afrispine/seo/seo-send-us-nigeria';
import { SeoSendCanadaGhana } from '@/components/afrispine/seo/seo-send-canada-ghana';
import { SeoSendUkNigeria } from '@/components/afrispine/seo/seo-send-uk-nigeria';
import { SeoSendDangoteIpo } from '@/components/afrispine/seo/seo-send-dangote-ipo';

// ─── Sender Pages ───────────────────────────────────────────
import { DashboardPage } from '@/components/afrispine/sender/dashboard-page';
import { SendFlow } from '@/components/afrispine/send/send-flow';
import { TransfersPage } from '@/components/afrispine/sender/transfers-page';
import { TransferDetailPage } from '@/components/afrispine/sender/transfer-detail-page';
import { ProfilePage } from '@/components/afrispine/sender/profile-page';
import { NotificationsPage } from '@/components/afrispine/sender/notifications-page';
import { RecurringSendsPage } from '@/components/afrispine/sender/recurring-sends-page';
import { RateAlertsPage } from '@/components/afrispine/sender/rate-alerts-page';
import { AirtimePage } from '@/components/afrispine/sender/airtime-page';
import { BillsPage } from '@/components/afrispine/sender/bills-page';
import { GroupSendsPage } from '@/components/afrispine/sender/group-sends-page';
import { ChamaPage } from '@/components/afrispine/sender/chama-page';
import { KycPage } from '@/components/afrispine/sender/kyc-page';

// ─── Wealth Pages ───────────────────────────────────────────
import { WealthLandingPage } from '@/components/afrispine/wealth/wealth-landing-page';
import { WealthMarketPage } from '@/components/afrispine/wealth/wealth-market-page';
import { WealthStockPage } from '@/components/afrispine/wealth/wealth-stock-page';
import { WealthPortfolioPage } from '@/components/afrispine/wealth/wealth-portfolio-page';
import { WealthBuyPage } from '@/components/afrispine/wealth/wealth-buy-page';
import { WealthBondsPage } from '@/components/afrispine/wealth/wealth-bonds-page';
import { WealthWatchlistPage } from '@/components/afrispine/wealth/wealth-watchlist-page';
import { WealthActivationPage } from '@/components/afrispine/wealth/wealth-activation-page';

// ─── Gift Pages ─────────────────────────────────────────────
import GiftsHubPage from '@/components/afrispine/gifts/gifts-hub-page';
import GiftsSendPage from '@/components/afrispine/gifts/gifts-send-page';
import GiftsRedeemPage from '@/components/afrispine/gifts/gifts-redeem-page';
import MerchantOnboardingPage from '@/components/afrispine/gifts/merchant-onboarding-page';

// ─── Digest Pages ───────────────────────────────────────────
import { DigestCurrentIssuePage } from '@/components/afrispine/digest/digest-current-issue-page';
import { DigestArchivePage } from '@/components/afrispine/digest/digest-archive-page';
import { DigestIssuePage } from '@/components/afrispine/digest/digest-issue-page';
import { DigestStoryPage } from '@/components/afrispine/digest/digest-story-page';
import { DigestAdvertisePage } from '@/components/afrispine/digest/digest-advertise-page';
import { DigestSubscribePage } from '@/components/afrispine/digest/digest-subscribe-page';

// ─── Admin Pages ────────────────────────────────────────────
import { AdminDashboard as AdminDashboardPage } from '@/components/afrispine/admin/admin-dashboard';
import { AdminTransactionsPage } from '@/components/afrispine/admin/admin-transactions-page';
import { AdminSendersPage } from '@/components/afrispine/admin/admin-senders-page';
import { AdminProvidersPage } from '@/components/afrispine/admin/admin-providers-page';
import { AdminRevenuePage } from '@/components/afrispine/admin/admin-revenue-page';
import { AdminBillingPage } from '@/components/afrispine/admin/admin-billing-page';
import { AdminSettlementPage } from '@/components/afrispine/admin/admin-settlement-page';
import { AdminCompliancePage } from '@/components/afrispine/admin/admin-compliance-page';
import { AdminSettingsPage } from '@/components/afrispine/admin/admin-settings-page';
import { AdminBusinessPage } from '@/components/afrispine/admin/admin-business-page';
import { AdminWealthPage } from '@/components/afrispine/admin/admin-wealth-page';
import { AdminDigestPage } from '@/components/afrispine/admin/admin-digest-page';
import { AdminGiftProvidersPage } from '@/components/afrispine/admin/admin-gift-providers-page';
import AdminGiftCardsPage from '@/components/afrispine/admin/admin-gift-cards-page';
import { AdminTestingDashboard } from '@/components/afrispine/admin/admin-testing-dashboard';
import { AdminPartnersPage } from '@/components/afrispine/admin/admin-partners-page';

// ─── URL-to-View mapping ─────────────────────────────────────
const URL_VIEW_MAP: Record<string, ViewName> = {
  '/': 'landing',
  '/login': 'login',
  '/signup': 'signup',
  '/forgot-password': 'forgot-password',
  '/onboarding': 'onboarding',
  '/verify': 'verify',
  '/admin-login': 'admin-login',
  '/pricing': 'pricing',
  '/faq': 'faq',
  '/about': 'about',
  '/contact': 'contact',
  '/terms': 'terms',
  '/privacy': 'privacy',
  '/aml-policy': 'aml-policy',
  '/best-rates': 'best-rates',
  '/business': 'business',
  '/business/register': 'business-register',
  '/business/send': 'business-send',
  '/markets': 'markets',
  '/dangote-ipo': 'dangote-ipo',
  '/china-corridor': 'china-corridor',
  '/intra-africa': 'intra-africa',
  '/send/uk-kenya': 'send-uk-kenya',
  '/send/us-nigeria': 'send-us-nigeria',
  '/send/canada-ghana': 'send-canada-ghana',
  '/send/uk-nigeria': 'send-uk-nigeria',
  '/send/dangote-ipo': 'send-dangote-ipo',
  '/dashboard': 'dashboard',
  '/send': 'send',
  '/transfers': 'transfers',
  '/profile': 'profile',
  '/notifications': 'notifications',
  '/recurring-sends': 'recurring-sends',
  '/rate-alerts': 'rate-alerts',
  '/airtime': 'airtime',
  '/bills': 'bills',
  '/group-sends': 'group-sends',
  '/chama': 'chama',
  '/kyc': 'kyc',
  '/wealth': 'wealth-landing',
  '/wealth/market': 'wealth-market',
  '/wealth/stock': 'wealth-stock',
  '/wealth/portfolio': 'wealth-portfolio',
  '/wealth/buy': 'wealth-buy',
  '/wealth/bonds': 'wealth-bonds',
  '/wealth/watchlist': 'wealth-watchlist',
  '/wealth/activation': 'wealth-activation',
  '/gifts': 'gifts',
  '/gifts/send': 'gifts-send',
  '/gifts/redeem': 'gifts-redeem',
  '/gifts/merchant': 'gifts-merchant',
  '/digest': 'digest-current',
  '/digest/archive': 'digest-archive',
  '/digest/issue': 'digest-issue',
  '/digest/story': 'digest-story',
  '/digest/advertise': 'digest-advertise',
  '/digest/subscribe': 'digest-subscribe',
  '/admin': 'admin-dashboard',
  '/admin/transactions': 'admin-transactions',
  '/admin/senders': 'admin-senders',
  '/admin/providers': 'admin-providers',
  '/admin/revenue': 'admin-revenue',
  '/admin/billing': 'admin-billing',
  '/admin/settlement': 'admin-settlement',
  '/admin/compliance': 'admin-compliance',
  '/admin/settings': 'admin-settings',
  '/admin/business': 'admin-business',
  '/admin/wealth': 'admin-wealth',
  '/admin/digest': 'admin-digest',
  '/admin/gift-providers': 'admin-gift-providers',
  '/admin/gift-cards': 'admin-gift-cards',
  '/admin/testing': 'admin-testing',
  '/admin/partners': 'admin-partners',
};

const ADMIN_VIEWS: ViewName[] = [
  'admin-dashboard', 'admin-transactions', 'admin-senders', 'admin-providers',
  'admin-revenue', 'admin-billing', 'admin-settlement', 'admin-compliance',
  'admin-settings', 'admin-business', 'admin-wealth', 'admin-digest', 'admin-gift-providers', 'admin-gift-cards', 'admin-testing', 'admin-partners',
];

const SENDER_VIEWS: ViewName[] = [
  'dashboard', 'send', 'transfers', 'transfer-detail', 'profile',
  'notifications', 'recurring-sends', 'rate-alerts', 'airtime', 'bills',
  'group-sends', 'chama', 'kyc',
  'wealth-landing', 'wealth-market', 'wealth-stock', 'wealth-portfolio',
  'wealth-buy', 'wealth-bonds', 'wealth-watchlist', 'wealth-activation',
  'gifts', 'gifts-send', 'gifts-redeem', 'gifts-merchant',
];

const AUTH_VIEWS: ViewName[] = ['login', 'signup', 'forgot-password', 'onboarding', 'verify'];

// ─── Page renderers (lazy-safe: all imported at module level) ───
function renderPublicPage(view: ViewName): React.ReactNode {
  switch (view) {
    case 'landing': return <LandingPage />;
    case 'about': return <AboutPage />;
    case 'faq': return <FaqPage />;
    case 'contact': return <ContactPage />;
    case 'pricing': return <PricingPage />;
    case 'terms': return <TermsPage />;
    case 'privacy': return <PrivacyPage />;
    case 'aml-policy': return <AmlPolicyPage />;
    case 'best-rates': return <BestRatesPage />;
    case 'markets': return <MarketsPage />;
    case 'dangote-ipo': return <DangoteIpoPage />;
    case 'china-corridor': return <ChinaCorridorPage />;
    case 'intra-africa': return <IntraAfricaPage />;
    case 'business': return <BusinessLandingPage />;
    case 'business-register': return <BusinessRegisterPage />;
    case 'business-send': return <BusinessSendPage />;
    case 'send-uk-kenya': return <SeoSendUkKenya />;
    case 'send-us-nigeria': return <SeoSendUsNigeria />;
    case 'send-canada-ghana': return <SeoSendCanadaGhana />;
    case 'send-uk-nigeria': return <SeoSendUkNigeria />;
    case 'send-dangote-ipo': return <SeoSendDangoteIpo />;
    case 'digest-current': return <DigestCurrentIssuePage />;
    case 'digest-archive': return <DigestArchivePage />;
    case 'digest-issue': return <DigestIssuePage />;
    case 'digest-story': return <DigestStoryPage />;
    case 'digest-advertise': return <DigestAdvertisePage />;
    case 'digest-subscribe': return <DigestSubscribePage />;
    default: return null;
  }
}

function renderSenderPage(view: ViewName): React.ReactNode {
  switch (view) {
    case 'dashboard': return <DashboardPage />;
    case 'send': return <SendFlow />;
    case 'transfers': return <TransfersPage />;
    case 'transfer-detail': return <TransferDetailPage />;
    case 'profile': return <ProfilePage />;
    case 'notifications': return <NotificationsPage />;
    case 'recurring-sends': return <RecurringSendsPage />;
    case 'rate-alerts': return <RateAlertsPage />;
    case 'airtime': return <AirtimePage />;
    case 'bills': return <BillsPage />;
    case 'group-sends': return <GroupSendsPage />;
    case 'chama': return <ChamaPage />;
    case 'kyc': return <KycPage />;
    case 'wealth-landing': return <WealthLandingPage />;
    case 'wealth-market': return <WealthMarketPage />;
    case 'wealth-stock': return <WealthStockPage />;
    case 'wealth-portfolio': return <WealthPortfolioPage />;
    case 'wealth-buy': return <WealthBuyPage />;
    case 'wealth-bonds': return <WealthBondsPage />;
    case 'wealth-watchlist': return <WealthWatchlistPage />;
    case 'wealth-activation': return <WealthActivationPage />;
    case 'gifts': return <GiftsHubPage />;
    case 'gifts-send': return <GiftsSendPage />;
    case 'gifts-redeem': return <GiftsRedeemPage />;
    case 'gifts-merchant': return <MerchantOnboardingPage />;
    default: return null;
  }
}

function renderAdminPage(view: ViewName): React.ReactNode {
  switch (view) {
    case 'admin-dashboard': return <AdminDashboardPage />;
    case 'admin-transactions': return <AdminTransactionsPage />;
    case 'admin-senders': return <AdminSendersPage />;
    case 'admin-providers': return <AdminProvidersPage />;
    case 'admin-revenue': return <AdminRevenuePage />;
    case 'admin-billing': return <AdminBillingPage />;
    case 'admin-settlement': return <AdminSettlementPage />;
    case 'admin-compliance': return <AdminCompliancePage />;
    case 'admin-settings': return <AdminSettingsPage />;
    case 'admin-business': return <AdminBusinessPage />;
    case 'admin-wealth': return <AdminWealthPage />;
    case 'admin-digest': return <AdminDigestPage />;
    case 'admin-gift-providers': return <AdminGiftProvidersPage />;
    case 'admin-gift-cards': return <AdminGiftCardsPage />;
    case 'admin-testing': return <AdminTestingDashboard />;
    case 'admin-partners': return <AdminPartnersPage />;
    default: return null;
  }
}

export default function Home() {
  const currentView = useAppStore((s) => s.currentView);
  const navigate = useAppStore((s) => s.navigate);
  const sender = useAppStore((s) => s.sender);
  const admin = useAppStore((s) => s.admin);

  // Detect client-side mount without hydration mismatch (React 18+ pattern)
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Restore session from httpOnly cookie on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.type === 'sender' && data.sender) {
          // Restore sender state WITHOUT navigating away from current view
          useAppStore.setState({
            sender: data.sender,
            sessionToken: 'restored',
            admin: null,
            adminSessionToken: null,
          });
        } else if (data.success && data.type === 'admin' && data.admin) {
          useAppStore.setState({
            admin: data.admin,
            adminSessionToken: 'restored',
            sender: null,
            sessionToken: null,
          });
        }
      } catch {}
    })();
  }, []);

  // Sync URL/hash → Zustand view on mount & popstate
  useEffect(() => {
    const sync = () => {
      const hashPath = window.location.hash.replace(/^#/, '');
      const path = hashPath || window.location.pathname;
      const v = URL_VIEW_MAP[path];
      if (v) {
        // If the view came from the pathname (Vercel rewrite), clean the URL
        // to a pure hash format to prevent doubled paths like /admin-login#/admin-login
        if (!hashPath && window.location.pathname !== '/') {
          window.history.replaceState({}, '', '#' + window.location.pathname);
        }
        navigate(v);
      }
    };
    sync();
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    // Ensure database is seeded (idempotent)
    fetch('/api/seed', { method: 'POST' }).catch(() => {});
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, []);

  // Sync Zustand → browser URL (hash-based for SPA compatibility)
  useEffect(() => {
    const entry = Object.entries(URL_VIEW_MAP).find(([, v]) => v === currentView);
    const target = entry?.[0] || '/';
    const hash = '#' + target;
    if (window.location.hash !== hash) {
      window.history.pushState({}, '', hash);
    }
  }, [currentView]);

  // Auth guards
  useEffect(() => {
    if (SENDER_VIEWS.includes(currentView) && !sender) navigate('login');
    if (ADMIN_VIEWS.includes(currentView) && !admin) navigate('admin-login');
  }, [currentView, sender, admin]);

  // Before mount: show minimal loading shell to prevent SSR flash of wrong page
  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <span className="text-2xl font-bold text-emerald-600">AfriSpine</span>
      </div>
    );
  }

  // ─── Admin Login: full-page dark layout (no public wrapper) ──
  if (currentView === 'admin-login') return <AdminLoginPage />;

  // ─── Auth pages: center card in minimal public wrapper ──────
  if (AUTH_VIEWS.includes(currentView)) {
    let content: React.ReactNode;
    switch (currentView) {
      case 'login': content = <LoginPage />; break;
      case 'signup': content = <SignupPage />; break;
      case 'forgot-password': content = <ForgotPasswordPage />; break;
      case 'onboarding': content = <OnboardingPage />; break;
      case 'verify': content = <VerifyEmailPage />; break;
      default: content = null;
    }
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <nav className="border-b border-gray-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-14 items-center justify-between">
              <button onClick={() => navigate('landing')} className="text-xl font-bold text-emerald-600">AfriSpine</button>
            </div>
          </div>
        </nav>
        <main className="flex-1">{content}</main>
        <footer className="border-t border-gray-100 mt-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">AfriSpine &copy; {new Date().getFullYear()}</p>
          </div>
        </footer>
      </div>
    );
  }

  // ─── Sender views (authenticated) ──────────────────────────
  if (SENDER_VIEWS.includes(currentView) && sender) {
    return (
      <SenderLayout>
        {renderSenderPage(currentView)}
      </SenderLayout>
    );
  }

  // ─── Admin views (authenticated) ───────────────────────────
  if (ADMIN_VIEWS.includes(currentView) && admin) {
    return (
      <AdminLayout>
        {renderAdminPage(currentView)}
      </AdminLayout>
    );
  }

  // ─── Public / Static pages ────────────────────────────────
  const publicContent = renderPublicPage(currentView);
  if (publicContent) {
    return <PublicLayout>{publicContent}</PublicLayout>;
  }

  // ─── Fallback: Landing page ────────────────────────────────
  return <PublicLayout><LandingPage /></PublicLayout>;
}
