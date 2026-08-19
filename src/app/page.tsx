'use client';

import React, { useEffect, useSyncExternalStore, type ComponentType } from 'react';
import dynamic from 'next/dynamic';
import { useAppStore, type ViewName } from '@/stores/app';

// ─── Loading skeleton ──────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
        <span className="text-sm text-gray-400">Loading…</span>
      </div>
    </div>
  );
}

// ─── Dynamic import helper ─────────────────────────────────
const d = <P extends object>(loader: () => Promise<{ default: ComponentType<P> }>) =>
  dynamic(loader, { loading: () => <PageSkeleton /> });

// Creator Platform Pages
const CreatorLandingPage = d(() => import('@/components/creator/creator-landing-page').then(m => ({ default: m.CreatorLandingPage })));
const CreatorAboutPage = d(() => import('@/components/creator/creator-about-page').then(m => ({ default: m.CreatorAboutPage })));
const CreatorContactPage = d(() => import('@/components/creator/creator-contact-page').then(m => ({ default: m.CreatorContactPage })));
const CreatorTermsPage = d(() => import('@/components/creator/creator-terms-page').then(m => ({ default: m.CreatorTermsPage })));
const CreatorPrivacyPage = d(() => import('@/components/creator/creator-privacy-page').then(m => ({ default: m.CreatorPrivacyPage })));
const CreatorWatchPage = d(() => import('@/components/creator/creator-watch-page').then(m => ({ default: m.CreatorWatchPage })));
const CreatorApplyPage = d(() => import('@/components/creator/creator-apply-page').then(m => ({ default: m.CreatorApplyPage })));
const SponsorLandingPage = d(() => import('@/components/creator/sponsor-landing-page').then(m => ({ default: m.SponsorLandingPage })));
const SponsorDashboardPage = d(() => import('@/components/creator/sponsor-dashboard-page').then(m => ({ default: m.SponsorDashboardPage })));
const SponsorCampaignDetailPage = d(() => import('@/components/creator/sponsor-campaign-detail-page').then(m => ({ default: m.SponsorCampaignDetailPage })));
const CreatorDashboardPage = d(() => import('@/components/creator/creator-dashboard-page').then(m => ({ default: m.CreatorDashboardPage })));
const AdminSponsorBrandsPage = d(() => import('@/components/afrispine/admin/admin-sponsor-brands-page').then(m => ({ default: m.AdminSponsorBrandsPage })));
const CreatorProfileCardPage = d(() => import('@/components/creator/creator-profile-card-page').then(m => ({ default: m.CreatorProfileCardPage })));
const CreatorOnboardPage = d(() => import('@/components/creator/creator-onboarding-wizard').then(m => ({ default: m.CreatorOnboardingWizard })));
const Admin2FAPage = d(() => import('@/components/afrispine/admin/admin-2fa-page').then(m => ({ default: m.Admin2FAPage })));
const AdminReconciliationPage = d(() => import('@/components/afrispine/admin/admin-reconciliation-page').then(m => ({ default: m.AdminReconciliationPage })));
const AdminModerationPage = d(() => import('@/components/afrispine/admin/admin-moderation-page').then(m => ({ default: m.AdminModerationPage })));
const AdminInquiriesPage = d(() => import('@/components/afrispine/admin/admin-inquiries-page').then(m => ({ default: m.AdminInquiriesPage })));
const WatchPartyLobby = d(() => import('@/components/creator/watch-party-lobby').then(m => ({ default: m.WatchPartyLobby })));
const WatchPartyOverlay = d(() => import('@/components/creator/watch-party-overlay').then(m => ({ default: m.WatchPartyOverlay })));

// Auth Pages
const LoginPage = d(() => import('@/components/afrispine/auth/login-page').then(m => ({ default: m.LoginPage })));
const SignupPage = d(() => import('@/components/afrispine/auth/signup-page').then(m => ({ default: m.SignupPage })));
const AdminLoginPage = d(() => import('@/components/afrispine/auth/admin-login-page').then(m => ({ default: m.AdminLoginPage })));
const ForgotPasswordPage = d(() => import('@/components/afrispine/auth/forgot-password-page').then(m => ({ default: m.ForgotPasswordPage })));
const OnboardingPage = d(() => import('@/components/afrispine/auth/onboarding-page').then(m => ({ default: m.OnboardingPage })));
const VerifyEmailPage = d(() => import('@/components/afrispine/auth/verify-email-page').then(m => ({ default: m.VerifyEmailPage })));

// Public / Static Pages
const LandingPage = d(() => import('@/components/afrispine/common/landing-page').then(m => ({ default: m.LandingPage })));
const AboutPage = d(() => import('@/components/afrispine/common/about-page').then(m => ({ default: m.AboutPage })));
const FaqPage = d(() => import('@/components/afrispine/common/faq-page').then(m => ({ default: m.FaqPage })));
const ContactPage = d(() => import('@/components/afrispine/common/contact-page').then(m => ({ default: m.ContactPage })));
const PricingPage = d(() => import('@/components/afrispine/common/pricing-page').then(m => ({ default: m.PricingPage })));
const TermsPage = d(() => import('@/components/afrispine/common/terms-page').then(m => ({ default: m.TermsPage })));
const PrivacyPage = d(() => import('@/components/afrispine/common/privacy-page').then(m => ({ default: m.PrivacyPage })));
const AmlPolicyPage = d(() => import('@/components/afrispine/common/aml-policy-page').then(m => ({ default: m.AmlPolicyPage })));
const BestRatesPage = d(() => import('@/components/afrispine/common/best-rates-page').then(m => ({ default: m.BestRatesPage })));
const MarketsPage = d(() => import('@/components/afrispine/common/markets-page').then(m => ({ default: m.MarketsPage })));
const DangoteIpoPage = d(() => import('@/components/afrispine/common/dangote-ipo-page').then(m => ({ default: m.DangoteIpoPage })));
const ChinaCorridorPage = d(() => import('@/components/afrispine/common/china-corridor-page'));
const IntraAfricaPage = d(() => import('@/components/afrispine/common/intra-africa-page').then(m => ({ default: m.IntraAfricaPage })));
const BusinessLandingPage = d(() => import('@/components/afrispine/common/business-landing-page').then(m => ({ default: m.BusinessLandingPage })));
const BusinessRegisterPage = d(() => import('@/components/afrispine/common/business-register-page').then(m => ({ default: m.BusinessRegisterPage })));
const BusinessSendPage = d(() => import('@/components/afrispine/common/business-send-page').then(m => ({ default: m.BusinessSendPage })));

// SEO Pages
const SeoSendUkKenya = d(() => import('@/components/afrispine/seo/seo-send-uk-kenya').then(m => ({ default: m.SeoSendUkKenya })));
const SeoSendUsNigeria = d(() => import('@/components/afrispine/seo/seo-send-us-nigeria').then(m => ({ default: m.SeoSendUsNigeria })));
const SeoSendCanadaGhana = d(() => import('@/components/afrispine/seo/seo-send-canada-ghana').then(m => ({ default: m.SeoSendCanadaGhana })));
const SeoSendUkNigeria = d(() => import('@/components/afrispine/seo/seo-send-uk-nigeria').then(m => ({ default: m.SeoSendUkNigeria })));
const SeoSendDangoteIpo = d(() => import('@/components/afrispine/seo/seo-send-dangote-ipo').then(m => ({ default: m.SeoSendDangoteIpo })));

// Sender Pages
const DashboardPage = d(() => import('@/components/afrispine/sender/dashboard-page').then(m => ({ default: m.DashboardPage })));
const SendFlow = d(() => import('@/components/afrispine/send/send-flow').then(m => ({ default: m.SendFlow })));
const TransfersPage = d(() => import('@/components/afrispine/sender/transfers-page').then(m => ({ default: m.TransfersPage })));
const TransferDetailPage = d(() => import('@/components/afrispine/sender/transfer-detail-page').then(m => ({ default: m.TransferDetailPage })));
const ProfilePage = d(() => import('@/components/afrispine/sender/profile-page').then(m => ({ default: m.ProfilePage })));
const NotificationsPage = d(() => import('@/components/afrispine/sender/notifications-page').then(m => ({ default: m.NotificationsPage })));
const RecurringSendsPage = d(() => import('@/components/afrispine/sender/recurring-sends-page').then(m => ({ default: m.RecurringSendsPage })));
const RateAlertsPage = d(() => import('@/components/afrispine/sender/rate-alerts-page').then(m => ({ default: m.RateAlertsPage })));
const AirtimePage = d(() => import('@/components/afrispine/sender/airtime-page').then(m => ({ default: m.AirtimePage })));
const BillsPage = d(() => import('@/components/afrispine/sender/bills-page').then(m => ({ default: m.BillsPage })));
const GroupSendsPage = d(() => import('@/components/afrispine/sender/group-sends-page').then(m => ({ default: m.GroupSendsPage })));
const ChamaPage = d(() => import('@/components/afrispine/sender/chama-page').then(m => ({ default: m.ChamaPage })));
const KycPage = d(() => import('@/components/afrispine/sender/kyc-page').then(m => ({ default: m.KycPage })));

// Wealth Pages
const WealthLandingPage = d(() => import('@/components/afrispine/wealth/wealth-landing-page').then(m => ({ default: m.WealthLandingPage })));
const WealthMarketPage = d(() => import('@/components/afrispine/wealth/wealth-market-page').then(m => ({ default: m.WealthMarketPage })));
const WealthStockPage = d(() => import('@/components/afrispine/wealth/wealth-stock-page').then(m => ({ default: m.WealthStockPage })));
const WealthPortfolioPage = d(() => import('@/components/afrispine/wealth/wealth-portfolio-page').then(m => ({ default: m.WealthPortfolioPage })));
const WealthBuyPage = d(() => import('@/components/afrispine/wealth/wealth-buy-page').then(m => ({ default: m.WealthBuyPage })));
const WealthBondsPage = d(() => import('@/components/afrispine/wealth/wealth-bonds-page').then(m => ({ default: m.WealthBondsPage })));
const WealthWatchlistPage = d(() => import('@/components/afrispine/wealth/wealth-watchlist-page').then(m => ({ default: m.WealthWatchlistPage })));
const WealthActivationPage = d(() => import('@/components/afrispine/wealth/wealth-activation-page').then(m => ({ default: m.WealthActivationPage })));

// Gift Pages
const GiftsHubPage = d(() => import('@/components/afrispine/gifts/gifts-hub-page'));
const GiftsSendPage = d(() => import('@/components/afrispine/gifts/gifts-send-page'));
const GiftsRedeemPage = d(() => import('@/components/afrispine/gifts/gifts-redeem-page'));
const MerchantOnboardingPage = d(() => import('@/components/afrispine/gifts/merchant-onboarding-page'));

// Digest Pages
const DigestCurrentIssuePage = d(() => import('@/components/afrispine/digest/digest-current-issue-page').then(m => ({ default: m.DigestCurrentIssuePage })));
const DigestArchivePage = d(() => import('@/components/afrispine/digest/digest-archive-page').then(m => ({ default: m.DigestArchivePage })));
const DigestIssuePage = d(() => import('@/components/afrispine/digest/digest-issue-page').then(m => ({ default: m.DigestIssuePage })));
const DigestStoryPage = d(() => import('@/components/afrispine/digest/digest-story-page').then(m => ({ default: m.DigestStoryPage })));
const DigestAdvertisePage = d(() => import('@/components/afrispine/digest/digest-advertise-page').then(m => ({ default: m.DigestAdvertisePage })));
const DigestSubscribePage = d(() => import('@/components/afrispine/digest/digest-subscribe-page').then(m => ({ default: m.DigestSubscribePage })));

// Admin Pages
const AdminDashboard = d(() => import('@/components/afrispine/admin/admin-dashboard').then(m => ({ default: m.AdminDashboard })));
const AdminTransactionsPage = d(() => import('@/components/afrispine/admin/admin-transactions-page').then(m => ({ default: m.AdminTransactionsPage })));
const AdminSendersPage = d(() => import('@/components/afrispine/admin/admin-senders-page').then(m => ({ default: m.AdminSendersPage })));
const AdminProvidersPage = d(() => import('@/components/afrispine/admin/admin-providers-page').then(m => ({ default: m.AdminProvidersPage })));
const AdminRevenuePage = d(() => import('@/components/afrispine/admin/admin-revenue-page').then(m => ({ default: m.AdminRevenuePage })));
const AdminBillingPage = d(() => import('@/components/afrispine/admin/admin-billing-page').then(m => ({ default: m.AdminBillingPage })));
const AdminSettlementPage = d(() => import('@/components/afrispine/admin/admin-settlement-page').then(m => ({ default: m.AdminSettlementPage })));
const AdminCompliancePage = d(() => import('@/components/afrispine/admin/admin-compliance-page').then(m => ({ default: m.AdminCompliancePage })));
const AdminSettingsPage = d(() => import('@/components/afrispine/admin/admin-settings-page').then(m => ({ default: m.AdminSettingsPage })));
const AdminBusinessPage = d(() => import('@/components/afrispine/admin/admin-business-page').then(m => ({ default: m.AdminBusinessPage })));
const AdminWealthPage = d(() => import('@/components/afrispine/admin/admin-wealth-page').then(m => ({ default: m.AdminWealthPage })));
const AdminDigestPage = d(() => import('@/components/afrispine/admin/admin-digest-page').then(m => ({ default: m.AdminDigestPage })));
const AdminGiftProvidersPage = d(() => import('@/components/afrispine/admin/admin-gift-providers-page').then(m => ({ default: m.AdminGiftProvidersPage })));
const AdminGiftCardsPage = d(() => import('@/components/afrispine/admin/admin-gift-cards-page'));
const AdminTestingDashboard = d(() => import('@/components/afrispine/admin/admin-testing-dashboard').then(m => ({ default: m.AdminTestingDashboard })));
const AdminPartnersPage = d(() => import('@/components/afrispine/admin/admin-partners-page').then(m => ({ default: m.AdminPartnersPage })));

// Layouts
const PublicLayout = d(() => import('@/components/afrispine/common/layout').then(m => ({ default: m.PublicLayout })));
const SenderLayout = d(() => import('@/components/afrispine/common/layout').then(m => ({ default: m.SenderLayout })));
const AdminLayout = d(() => import('@/components/afrispine/common/layout').then(m => ({ default: m.AdminLayout })));

// ─── URL-to-View mapping ─────────────────────────────────────
// TODO(kennedy-decision): remittance routes should move under /transfer or a subdomain
const URL_VIEW_MAP: Record<string, ViewName> = {
  '/': 'landing',
  '/login': 'login', '/signup': 'signup', '/forgot-password': 'forgot-password',
  '/onboarding': 'onboarding', '/verify': 'verify', '/admin-login': 'admin-login',
  '/pricing': 'pricing', '/faq': 'faq', '/about': 'about', '/contact': 'contact',
  '/terms': 'terms', '/privacy': 'privacy', '/aml-policy': 'aml-policy',
  '/best-rates': 'best-rates', '/business': 'business',
  '/business/register': 'business-register', '/business/send': 'business-send',
  '/markets': 'markets', '/dangote-ipo': 'dangote-ipo',
  '/china-corridor': 'china-corridor', '/intra-africa': 'intra-africa',
  '/send/uk-kenya': 'send-uk-kenya', '/send/us-nigeria': 'send-us-nigeria',
  '/send/canada-ghana': 'send-canada-ghana', '/send/uk-nigeria': 'send-uk-nigeria',
  '/send/dangote-ipo': 'send-dangote-ipo',
  '/dashboard': 'dashboard', '/send': 'send', '/transfers': 'transfers',
  '/profile': 'profile', '/notifications': 'notifications',
  '/recurring-sends': 'recurring-sends', '/rate-alerts': 'rate-alerts',
  '/airtime': 'airtime', '/bills': 'bills', '/group-sends': 'group-sends',
  '/chama': 'chama', '/kyc': 'kyc',
  '/wealth': 'wealth-landing', '/wealth/market': 'wealth-market',
  '/wealth/stock': 'wealth-stock', '/wealth/portfolio': 'wealth-portfolio',
  '/wealth/buy': 'wealth-buy', '/wealth/bonds': 'wealth-bonds',
  '/wealth/watchlist': 'wealth-watchlist', '/wealth/activation': 'wealth-activation',
  '/gifts': 'gifts', '/gifts/send': 'gifts-send',
  '/gifts/redeem': 'gifts-redeem', '/gifts/merchant': 'gifts-merchant',
  '/digest': 'digest-current', '/digest/archive': 'digest-archive',
  '/digest/issue': 'digest-issue', '/digest/story': 'digest-story',
  '/digest/advertise': 'digest-advertise', '/digest/subscribe': 'digest-subscribe',
  '/admin': 'admin-dashboard', '/admin/transactions': 'admin-transactions',
  '/admin/senders': 'admin-senders', '/admin/providers': 'admin-providers',
  '/admin/revenue': 'admin-revenue', '/admin/billing': 'admin-billing',
  '/admin/settlement': 'admin-settlement', '/admin/compliance': 'admin-compliance',
  '/admin/settings': 'admin-settings', '/admin/business': 'admin-business',
  '/admin/wealth': 'admin-wealth', '/admin/digest': 'admin-digest',
  '/admin/gift-providers': 'admin-gift-providers',
  '/admin/gift-cards': 'admin-gift-cards', '/admin/testing': 'admin-testing',
  '/admin/partners': 'admin-partners',
  '/watch': 'watch', '/apply': 'creator-apply',
  '/sponsor': 'sponsor-landing', '/sponsor/dashboard': 'sponsor-dashboard',
  '/sponsor/campaign': 'sponsor-campaign-detail',
  '/creator/dashboard': 'creator-dashboard',
  '/admin/sponsor-brands': 'admin-sponsor-brands',
  '/admin/2fa': 'admin-2fa', '/admin/reconciliation': 'admin-reconciliation', '/admin/moderation': 'admin-moderation',
  '/admin/inquiries': 'admin-inquiries',
  '/c/profile': 'creator-profile', '/c/onboard': 'creator-onboard',
  '/watch-party': 'watch-party', '/party': 'party',
};

const ADMIN_VIEWS: ViewName[] = [
  'admin-dashboard', 'admin-transactions', 'admin-senders', 'admin-providers',
  'admin-revenue', 'admin-billing', 'admin-settlement', 'admin-compliance',
  'admin-settings', 'admin-business', 'admin-wealth', 'admin-digest',
  'admin-gift-providers', 'admin-gift-cards', 'admin-testing', 'admin-partners',
  'admin-sponsor-brands', 'admin-2fa', 'admin-reconciliation', 'admin-moderation',
  'admin-inquiries',
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
const CREATOR_VIEWS: ViewName[] = ['landing', 'about', 'contact', 'terms', 'privacy', 'watch', 'creator-apply', 'sponsor-landing', 'sponsor-dashboard', 'sponsor-campaign-detail', 'creator-dashboard', 'creator-profile', 'creator-onboard', 'watch-party', 'party'];

function renderCreatorPage(view: ViewName): React.ReactNode {
  switch (view) {
    case 'landing': return <CreatorLandingPage />;
    case 'about': return <CreatorAboutPage />;
    case 'contact': return <CreatorContactPage />;
    case 'terms': return <CreatorTermsPage />;
    case 'privacy': return <CreatorPrivacyPage />;
    case 'watch': return <CreatorWatchPage />;
    case 'creator-apply': return <CreatorApplyPage />;
    case 'sponsor-landing': return <SponsorLandingPage />;
    case 'sponsor-dashboard': return <SponsorDashboardPage />;
    case 'sponsor-campaign-detail': return <SponsorCampaignDetailPage />;
    case 'creator-dashboard': return <CreatorDashboardPage />;
    case 'creator-profile': return <CreatorProfileCardPage />;
    case 'creator-onboard': return <CreatorOnboardPage />;
    case 'watch-party': return <WatchPartyLobby />;
    case 'party': return <WatchPartyLobby />;
    default: return null;
  }
}

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
    case 'admin-dashboard': return <AdminDashboard />;
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
    case 'admin-sponsor-brands': return <AdminSponsorBrandsPage />;
    case 'admin-2fa': return <Admin2FAPage />;
    case 'admin-reconciliation': return <AdminReconciliationPage />;
    case 'admin-moderation': return <AdminModerationPage />;
    case 'admin-inquiries': return <AdminInquiriesPage />;
    default: return null;
  }
}

export default function Home() {
  const currentView = useAppStore((s) => s.currentView);
  const navigate = useAppStore((s) => s.navigate);
  const sender = useAppStore((s) => s.sender);
  const admin = useAppStore((s) => s.admin);

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.type === 'sender' && data.sender) {
          useAppStore.setState({ sender: data.sender, sessionToken: 'restored', admin: null, adminSessionToken: null });
        } else if (data.success && data.type === 'admin' && data.admin) {
          useAppStore.setState({ admin: data.admin, adminSessionToken: 'restored', sender: null, sessionToken: null });
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    const sync = () => {
      // Handle ?v=videoId deep links from /w/:videoId OG pages
      const urlParams = new URLSearchParams(window.location.search);
      const videoId = urlParams.get('v');
      if (videoId) {
        navigate('watch', { videoId });
        window.history.replaceState({}, '', '#watch');
        return;
      }
      const hashPath = window.location.hash.replace(/^#/, '');
      // Parse query params from hash (e.g., #c/profile?handle=xxx&mode=brand)
      let path = hashPath || window.location.pathname;
      let params: Record<string, string> = {};
      const qIdx = path.indexOf('?');
      if (qIdx !== -1) {
        const queryStr = path.slice(qIdx + 1);
        path = path.slice(0, qIdx);
        new URLSearchParams(queryStr).forEach((val, key) => { params[key] = val; });
      }
      const v = URL_VIEW_MAP[path];
      if (v) {
        if (!hashPath && window.location.pathname !== '/') {
          window.history.replaceState({}, '', '#' + window.location.pathname);
        }
        navigate(v, params);
      }
    };
    sync();
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    fetch('/api/seed', { method: 'POST' }).catch(() => {});
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, []);

  useEffect(() => {
    const entry = Object.entries(URL_VIEW_MAP).find(([, v]) => v === currentView);
    const target = entry?.[0] || '/';
    let hash = '#' + target;
    // Append viewParams as query string in the hash
    const vp = useAppStore.getState().viewParams;
    const qs = Object.entries(vp).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    if (qs) hash += '?' + qs;
    if (window.location.hash !== hash) {
      window.history.pushState({}, '', hash);
    }
  }, [currentView]);

  useEffect(() => {
    if (SENDER_VIEWS.includes(currentView) && !sender) navigate('login');
    if (ADMIN_VIEWS.includes(currentView) && !admin) navigate('admin-login');
  }, [currentView, sender, admin]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <span className="text-2xl font-bold text-emerald-600">AfriSpine</span>
      </div>
    );
  }

  if (currentView === 'admin-login') return <AdminLoginPage />;

  if (CREATOR_VIEWS.includes(currentView)) {
    const creatorContent = renderCreatorPage(currentView);
    if (creatorContent) return creatorContent;
  }

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

  if (SENDER_VIEWS.includes(currentView) && sender) {
    return <SenderLayout>{renderSenderPage(currentView)}</SenderLayout>;
  }

  if (ADMIN_VIEWS.includes(currentView) && admin) {
    return <AdminLayout>{renderAdminPage(currentView)}</AdminLayout>;
  }

  const publicContent = renderPublicPage(currentView);
  if (publicContent) {
    return <PublicLayout>{publicContent}</PublicLayout>;
  }

  return <PublicLayout><LandingPage /></PublicLayout>;
}
