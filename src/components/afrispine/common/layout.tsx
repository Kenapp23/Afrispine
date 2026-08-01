'use client';

import React from 'react';
import { ViewName } from '@/stores/app';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Footer } from './footer';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import {
  LayoutDashboard,
  Send,
  ArrowLeft,
  ArrowLeftRight,
  User,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Settings,
  Users,
  Banknote,
  Receipt,
  Landmark,
  Scale,
  CreditCard,
  BarChart3,
  RefreshCw,
  Smartphone,
  Bell,
  MoreHorizontal,
  Briefcase,
  TrendingUp,
  Home,
  Gift,
  Globe,
  Newspaper,
  Store,
  FlaskConical,
  KeyRound,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

// ─── Language Selector ──────────────────────────────────────
const LANGS = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'sw', label: 'Kiswahili', flag: '🇰🇪' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
];

function LangSelector() {
  const { i18n } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [lang, setLang] = React.useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('afrispine_lang') || 'en';
    return 'en';
  });

  const change = (code: string) => {
    setLang(code);
    localStorage.setItem('afrispine_lang', code);
    setOpen(false);
    // Directly change i18n language
    i18n.changeLanguage(code);
    // Trigger a custom event so components can react
    window.dispatchEvent(new CustomEvent('langchange', { detail: code }));
  };

  const current = LANGS.find(l => l.code === lang) || LANGS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden lg:inline text-xs">{current.flag} {current.label}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-border py-1 z-50 min-w-[140px]">
          {LANGS.map(l => (
            <button
              key={l.code}
              onClick={() => change(l.code)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/60 transition-colors ${lang === l.code ? 'text-emerald-600 font-medium' : 'text-foreground'}`}
            >
              {l.flag} {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Public Navbar ─────────────────────────────────────────────
export function PublicNavbar() {
  const { t } = useTranslation();
  const navigate = useAppStore((s) => s.navigate);
  const [open, setOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <button
          onClick={() => navigate('landing')}
          className="flex items-center gap-2.5"
        >
          <img
            src="/afrispine-logo.jpg"
            alt="AfriSpine"
            className="h-8 w-8 rounded-md object-cover sm:h-9 sm:w-9"
          />
          <span className="text-lg font-bold text-emerald-600 sm:text-xl tracking-tight">AfriSpine</span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 sm:flex">
          <button onClick={() => navigate('markets')} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">{t('nav.markets')}</button>
          <button onClick={() => navigate('business')} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">{t('nav.business')}</button>
          <button onClick={() => navigate('pricing')} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">{t('nav.pricing')}</button>
          <button onClick={() => navigate('faq')} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">{t('nav.faq')}</button>
          <LangSelector />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('login')}
            className="text-sm font-medium text-muted-foreground"
          >
            {t('nav.login')}
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('signup')}
            className="bg-emerald-600 text-white hover:bg-emerald-500"
          >
            {t('nav.signup')}
          </Button>

        </nav>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden p-2 rounded-md hover:bg-gray-100"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="sm:hidden border-t border-border/40 bg-white px-4 py-3 space-y-2">
          <button
            onClick={() => { navigate('markets'); setOpen(false); }}
            className="block w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-50"
          >
            {t('nav.markets')}
          </button>
          <button
            onClick={() => { navigate('business'); setOpen(false); }}
            className="block w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-50"
          >
            {t('nav.business')}
          </button>
          <button
            onClick={() => { navigate('pricing'); setOpen(false); }}
            className="block w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-50"
          >
            {t('nav.pricing')}
          </button>
          <button
            onClick={() => { navigate('faq'); setOpen(false); }}
            className="block w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-50"
          >
            {t('nav.faq')}
          </button>
          <Separator />
          <button
            onClick={() => { navigate('login'); setOpen(false); }}
            className="block w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-50"
          >
            {t('nav.login')}
          </button>
          <Button
            size="sm"
            onClick={() => { navigate('signup'); setOpen(false); }}
            className="w-full bg-emerald-600 text-white hover:bg-emerald-500"
          >
            {t('nav.signup')}
          </Button>

        </div>
      )}
    </header>
  );
}

// ─── Public Layout ────────────────────────────────────────────
export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const currentView = useAppStore((s) => s.currentView);
  const navigate = useAppStore((s) => s.navigate);

  // Pages where the top-level navbar is enough (standard public pages)
  const navOnlyPages: ViewName[] = ['landing', 'pricing', 'faq', 'about', 'contact', 'terms', 'privacy', 'aml-policy', 'best-rates', 'business', 'business-register', 'business-send', 'login', 'signup', 'forgot-password'];
  const showTopBar = !navOnlyPages.includes(currentView);

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNavbar />
      {/* Contextual back/home bar for non-standard public pages */}
      {showTopBar && (
        <div className="border-b border-border/40 bg-white/60 backdrop-blur-sm">
          <div className="mx-auto flex h-10 max-w-7xl items-center gap-2 px-4 sm:px-6">
            <button
              onClick={() => navigate('landing')}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md px-2 py-1 -ml-2 hover:bg-muted/60"
            >
              <ArrowLeft className="h-4 w-4" />
              <Home className="h-3.5 w-3.5" />
              <span>{t('nav.home')}</span>
            </button>
            {currentView === 'dangote-ipo' && (
              <>
                <span className="text-muted-foreground/40">/</span>
                <button
                  onClick={() => navigate('markets')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md px-2 py-1 hover:bg-muted/60"
                >
                  {t('nav.markets')}
                </button>
                <span className="text-muted-foreground/40">/</span>
                <span className="text-sm font-medium text-foreground">{t('breadcrumb.dangoteIpo')}</span>
              </>
            )}
            {currentView === 'markets' && (
              <>
                <span className="text-muted-foreground/40">/</span>
                <span className="text-sm font-medium text-foreground">{t('breadcrumb.markets')}</span>
              </>
            )}
            {currentView === 'intra-africa' && (
              <>
                <span className="text-muted-foreground/40">/</span>
                <span className="text-sm font-medium text-foreground">{t('breadcrumb.intraAfrica')}</span>
              </>
            )}
            {currentView === 'china-corridor' && (
              <>
                <span className="text-muted-foreground/40">/</span>
                <span className="text-sm font-medium text-foreground">{t('breadcrumb.chinaCorridor')}</span>
              </>
            )}
          </div>
        </div>
      )}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

// ─── Sender Sidebar ───────────────────────────────────────────
interface NavItem {
  view: ViewName;
  label: string;
  icon: React.ElementType;
  group?: string;
}

const senderLinks: NavItem[] = [
  { view: 'dashboard', label: 'nav.dashboard', icon: LayoutDashboard },
  { view: 'send', label: 'nav.send', icon: Send },
  { view: 'wealth-landing', label: 'nav.invest', icon: TrendingUp, group: 'sidebar.wealth' },
  { view: 'bills', label: 'nav.bills', icon: Receipt },
  { view: 'gifts', label: 'nav.gifts', icon: Gift },
  { view: 'chama', label: 'Chamas', icon: Users },
  { view: 'wealth-portfolio', label: 'nav.portfolio', icon: Briefcase, group: 'sidebar.wealth' },
  { view: 'wealth-bonds', label: 'nav.bonds', icon: Landmark, group: 'sidebar.wealth' },
  { view: 'wealth-watchlist', label: 'nav.watchlist', icon: BarChart3, group: 'sidebar.wealth' },
  { view: 'transfers', label: 'nav.transfers', icon: ArrowLeftRight },
  { view: 'profile', label: 'nav.profile', icon: User },
  { view: 'verify', label: 'sidebar.kyc', icon: ShieldCheck },
  { view: 'notifications', label: 'nav.notifications', icon: Bell },
];

// ─── Sidebar Content (shared) ─────────────────────────────────
function SidebarContent({
  links,
  onNavigate,
  activeView,
  onLogout,
  headerLabel,
  userName,
}: {
  links: NavItem[];
  onNavigate: (v: ViewName) => void;
  activeView: ViewName;
  onLogout: () => void;
  headerLabel: string;
  userName?: string;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <button
          onClick={() => onNavigate(activeView.startsWith('admin-') ? 'admin-dashboard' as ViewName : 'dashboard' as ViewName)}
          className="flex items-center gap-2"
        >
          <img
            src="/afrispine-logo.jpg"
            alt="AfriSpine"
            className="h-8 w-auto rounded-md object-contain"
          />
          <span className="text-lg font-bold text-emerald-600">AfriSpine</span>
        </button>
        {headerLabel && (
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">
            {t(headerLabel)}
          </p>
        )}
      </div>

      <Separator />

      {/* Nav links — scrollable so logout stays visible */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {links.map((link, idx) => {
          const Icon = link.icon;
          const isActive = activeView === link.view;
          const showGroupHeader = link.group && (idx === 0 || links[idx - 1]?.group !== link.group);

          return (
            <React.Fragment key={link.view}>
              {showGroupHeader && (
                <p className="mt-4 mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {t(link.group)}
                </p>
              )}
              <button
                onClick={() => onNavigate(link.view)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  link.group ? 'pl-7' : ''
                } ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t(link.label)}
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      <Separator />

      {/* User + logout */}
      <div className="px-3 py-4">
        {userName && (
          <div className="flex items-center gap-3 px-3 mb-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold">
                {userName
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium truncate max-w-[120px]">
              {userName}
            </span>
          </div>
        )}
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {t('nav.logout')}
        </button>
      </div>
    </div>
  );
}

// ─── Sender Layout ──────────────────────────────────────────────
// Map of views → their parent view (for back navigation)
const SENDER_BACK_MAP: Partial<Record<ViewName, ViewName>> = {
  'wealth-market': 'wealth-landing',
  'wealth-stock': 'wealth-market',
  'wealth-buy': 'wealth-stock',
  'wealth-portfolio': 'wealth-landing',
  'wealth-bonds': 'wealth-landing',
  'wealth-watchlist': 'wealth-landing',
  'wealth-activation': 'dashboard',
  'transfer-detail': 'transfers',
  send: 'dashboard',
  profile: 'dashboard',
  verify: 'dashboard',
  notifications: 'dashboard',
  'recurring-sends': 'dashboard',
  'rate-alerts': 'dashboard',
  airtime: 'dashboard',
  bills: 'dashboard',
  'group-sends': 'dashboard',
  'gifts-send': 'gifts',
  'gifts-redeem': 'gifts',
  'gifts-merchant': 'gifts',
  chama: 'dashboard',
  kyc: 'dashboard',
};

// Map of views → their breadcrumb label
const SENDER_BREADCRUMB: Partial<Record<ViewName, string>> = {
  'wealth-market': 'breadcrumb.marketsSub',
  'wealth-stock': 'breadcrumb.stockDetail',
  'wealth-buy': 'breadcrumb.placeOrder',
  'wealth-portfolio': 'breadcrumb.portfolio',
  'wealth-bonds': 'breadcrumb.bonds',
  'wealth-watchlist': 'breadcrumb.watchlist',
  'wealth-activation': 'breadcrumb.activateAccount',
  'transfer-detail': 'breadcrumb.transferDetail',
  'gifts-send': 'Send Gift',
  'gifts-redeem': 'Redeem Voucher',
  'gifts-merchant': 'Merchant Onboarding',
  chama: 'Chama',
  kyc: 'KYC Verification',
};

export function SenderLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const navigate = useAppStore((s) => s.navigate);
  const currentView = useAppStore((s) => s.currentView);
  const viewParams = useAppStore((s) => s.viewParams);
  const sender = useAppStore((s) => s.sender);
  const logoutSender = useAppStore((s) => s.logoutSender);
  const userName = sender?.fullName || sender?.email || 'User';

  const parentView = SENDER_BACK_MAP[currentView];
  const breadcrumb = SENDER_BREADCRUMB[currentView];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-border/40 bg-white">
        <SidebarContent
          links={senderLinks}
          onNavigate={(v) => navigate(v)}
          activeView={currentView}
          onLogout={logoutSender}
          headerLabel={''}
          userName={userName}
        />
      </aside>

      {/* Main content area */}
      <main className="flex-1 lg:pl-64">
        {/* Breadcrumb back bar for drill-down pages */}
        {parentView && (
          <div className="border-b border-border/30 bg-white/70 backdrop-blur-sm">
            <div className="mx-auto flex h-10 max-w-[1100px] items-center gap-2 px-4 sm:px-6">
              <button
                onClick={() => {
                  if (currentView === 'wealth-buy') {
                    // Go back to stock page preserving the ticker
                    navigate('wealth-stock', { ticker: viewParams.ticker || '' });
                  } else {
                    navigate(parentView);
                  }
                }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md px-2 py-1 -ml-2 hover:bg-muted/60"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{t('common.back')}</span>
              </button>
              {breadcrumb && (
                <>
                  <span className="text-muted-foreground/40">/</span>
                  <span className="text-sm font-medium text-foreground">{t(breadcrumb)}</span>
                </>
              )}
            </div>
          </div>
        )}
        <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6">{children}</div>
      </main>

      {/* Mobile bottom tabs — 4 primary + More + Logout */}
      <MobileSenderNav
        links={senderLinks}
        activeView={currentView}
        onNavigate={(v) => navigate(v)}
        onLogout={logoutSender}
      />
    </div>
  );
}

// ─── Admin Sidebar ──────────────────────────────────────────────
const adminLinks: NavItem[] = [
  { view: 'admin-dashboard', label: 'admin.dashboard', icon: BarChart3 },
  { view: 'admin-transactions', label: 'admin.transactions', icon: ArrowLeftRight },
  { view: 'admin-senders', label: 'admin.senders', icon: Users },
  { view: 'admin-providers', label: 'admin.providers', icon: Landmark },
  { view: 'admin-revenue', label: 'admin.revenue', icon: Banknote },
  { view: 'admin-billing', label: 'admin.billing', icon: Receipt },
  { view: 'admin-settlement', label: 'admin.settlement', icon: CreditCard },
  { view: 'admin-compliance', label: 'admin.compliance', icon: Scale },
  { view: 'admin-business', label: 'admin.business', icon: Briefcase },
  { view: 'admin-wealth', label: 'admin.wealth', icon: TrendingUp },
  { view: 'admin-digest', label: 'Digest', icon: Newspaper },
  { view: 'admin-gift-providers', label: 'admin.giftProviders', icon: Store },
  { view: 'admin-gift-cards', label: 'admin.giftCards', icon: Gift },
  { view: 'admin-testing', label: 'admin.testing', icon: FlaskConical },
  { view: 'admin-partners', label: 'admin.partners', icon: KeyRound, group: 'admin.system' },
  { view: 'admin-settings', label: 'admin.settings', icon: Settings },
];

// ─── Admin Layout ───────────────────────────────────────────────
export function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useAppStore((s) => s.navigate);
  const currentView = useAppStore((s) => s.currentView);
  const admin = useAppStore((s) => s.admin);
  const logoutAdmin = useAppStore((s) => s.logoutAdmin);
  const userName = admin?.name || admin?.email || 'Admin';

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-border/40 bg-white">
        <SidebarContent
          links={adminLinks}
          onNavigate={(v) => navigate(v)}
          activeView={currentView}
          onLogout={logoutAdmin}
          headerLabel="nav.admin"
          userName={userName}
        />
      </aside>

      {/* Main content area */}
      <main className="flex-1 lg:pl-64">
        <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6">{children}</div>
      </main>

      {/* Mobile bottom tabs - first 4 nav + More menu + Logout */}
      <MobileAdminNav
        links={adminLinks}
        activeView={currentView}
        onNavigate={(v) => navigate(v)}
        onLogout={logoutAdmin}
        userName={userName}
      />
    </div>
  );
}

// ─── Mobile Admin Bottom Nav ───────────────────────────────────
function MobileAdminNav({
  links,
  activeView,
  onNavigate,
  onLogout,
  userName,
}: {
  links: NavItem[];
  activeView: ViewName;
  onNavigate: (v: ViewName) => void;
  onLogout: () => void;
  userName: string;
}) {
  const { t } = useTranslation();
  const [moreOpen, setMoreOpen] = React.useState(false);
  const primaryLinks = links.slice(0, 4);
  const moreLinks = links.slice(4);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-white lg:hidden safe-area-pb">
        <div className="flex items-center justify-around py-2">
          {primaryLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeView === link.view;
            return (
              <button
                key={link.view}
                onClick={() => onNavigate(link.view)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md transition-colors ${
                  isActive ? 'text-emerald-600' : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{t(link.label)}</span>
              </button>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md transition-colors ${
              moreLinks.some((l) => l.view === activeView) ? 'text-emerald-600' : 'text-muted-foreground'
            }`}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] font-medium">{t('nav.more')}</span>
          </button>

          {/* Logout button — always visible in bottom bar */}
          <button
            onClick={onLogout}
            className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md text-muted-foreground hover:text-red-500 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-[10px] font-medium">{t('nav.logout')}</span>
          </button>
        </div>
      </nav>

      {/* More menu sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh]">
          <SheetHeader>
            <SheetTitle className="text-left">{t('nav.moreOptions')}</SheetTitle>
          </SheetHeader>
          <div className="mt-2 space-y-1 pb-4">
            {moreLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeView === link.view;
              return (
                <button
                  key={link.view}
                  onClick={() => { onNavigate(link.view); setMoreOpen(false); }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t(link.label)}
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

// ─── Mobile Sender Bottom Nav ─────────────────────────────────
const SENDER_MOBILE_PRIMARY: ViewName[] = ['dashboard', 'send', 'wealth-landing', 'transfers'];

function MobileSenderNav({
  links,
  activeView,
  onNavigate,
  onLogout,
}: {
  links: NavItem[];
  activeView: ViewName;
  onNavigate: (v: ViewName) => void;
  onLogout: () => void;
}) {
  const { t } = useTranslation();
  const [moreOpen, setMoreOpen] = React.useState(false);
  const primaryLinks = links.filter((l) => SENDER_MOBILE_PRIMARY.includes(l.view));
  const moreLinks = links.filter((l) => !SENDER_MOBILE_PRIMARY.includes(l.view));

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-white lg:hidden">
        <div className="flex items-center justify-around py-2">
          {primaryLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeView === link.view;
            return (
              <button
                key={link.view}
                onClick={() => onNavigate(link.view)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md transition-colors ${
                  isActive ? 'text-emerald-600' : 'text-muted-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{t(link.label)}</span>
              </button>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md transition-colors ${
              moreLinks.some((l) => l.view === activeView) ? 'text-emerald-600' : 'text-muted-foreground'
            }`}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] font-medium">{t('nav.more')}</span>
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md text-muted-foreground hover:text-red-500 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-[10px] font-medium">{t('nav.logout')}</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh]">
          <SheetHeader>
            <SheetTitle className="text-left">{t('nav.moreOptions')}</SheetTitle>
          </SheetHeader>
          <div className="mt-2 space-y-1 pb-4">
            {moreLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeView === link.view;
              return (
                <button
                  key={link.view}
                  onClick={() => { onNavigate(link.view); setMoreOpen(false); }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t(link.label)}
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}