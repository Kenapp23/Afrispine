// AfriSpine - Africa's Premier Fintech Platform
'use client'

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight, Shield, Zap, Globe, TrendingUp, CreditCard,
  ChevronRight, CheckCircle2, Menu, X, BarChart3, Lock, Users,
} from 'lucide-react';

/* ─── Animated Section Wrapper ─── */
function FadeInSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Navigation ─── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Providers', href: '#providers' },
    { label: 'Pricing', href: '#pricing' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b' : 'bg-transparent'
      }`}
      role="banner"
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16" aria-label="Main navigation">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="AfriSpine Home">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <span className={`font-bold text-lg tracking-tight transition-colors ${scrolled ? 'text-gray-900' : 'text-white'}`}>AfriSpine</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                scrolled ? 'text-gray-600 hover:text-emerald-700 hover:bg-emerald-50' : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" className={scrolled ? 'text-gray-700 hover:text-emerald-700' : 'text-white hover:text-white hover:bg-white/10'}>
            Sign In
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all">
            Get Started <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 rounded-lg"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen
            ? <X className={`h-5 w-5 ${scrolled ? 'text-gray-900' : 'text-white'}`} />
            : <Menu className={`h-5 w-5 ${scrolled ? 'text-gray-900' : 'text-white'}`} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b shadow-lg">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 font-medium transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 border-t flex flex-col gap-2">
              <Button variant="outline" className="w-full">Sign In</Button>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                Get Started <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

/* ─── Hero Section ─── */
function HeroSection() {
  return (
    <section
      className="relative min-h-[100vh] flex items-center justify-center overflow-hidden"
      aria-label="Hero"
    >
      {/* Background Image + Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/hero-bg.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/90 via-emerald-900/80 to-gray-950/90" />

      {/* Decorative Grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center py-24 sm:py-32">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <Badge className="mb-6 bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30">
            <Zap className="h-3 w-3 mr-1.5" />
            Built for Africa, by Africa
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight max-w-4xl mx-auto">
            The Future of
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200">
              African Finance
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            Unify payments, wealth management, and market data across Africa&apos;s leading fintech providers —
            all through one powerful API platform.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold text-base px-8 py-6 shadow-xl shadow-emerald-500/25 hover:shadow-emerald-400/30 transition-all"
            >
              Start Building Free <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 hover:text-white text-base px-8 py-6"
            >
              View Documentation
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-white/50 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Bank-Grade Security</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>30+ African Markets</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span>99.99% Uptime</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}

/* ─── Stats Bar ─── */
function StatsBar() {
  const stats = [
    { value: '50M+', label: 'Transactions Processed' },
    { value: '12', label: 'African Markets' },
    { value: '99.99%', label: 'API Uptime' },
    { value: '<50ms', label: 'Avg. Response Time' },
  ];

  return (
    <section className="py-16 bg-white" aria-label="Platform statistics">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <FadeInSection key={stat.label} delay={i * 0.1} className="text-center">
              <p className="text-3xl sm:text-4xl font-extrabold text-emerald-600">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Features Section ─── */
function FeaturesSection() {
  const features = [
    {
      icon: <CreditCard className="h-6 w-6" />,
      title: 'Unified Payments',
      description: 'Accept payments via mobile money, bank transfer, cards, and more across 30+ African payment methods through a single integration.',
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: 'Wealth & Markets',
      description: 'Access real-time African stock market data, portfolio analytics, and automated wealth management tools.',
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Bank-Grade Security',
      description: 'Enterprise encryption, PCI DSS compliance, and multi-layered authentication protect every transaction.',
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Lightning Fast',
      description: 'Sub-50ms response times with global edge caching and intelligent request routing across Africa.',
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: 'Pan-African Reach',
      description: 'One API, 12+ markets. Expand across borders without rebuilding your payment infrastructure.',
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: 'Real-Time Analytics',
      description: 'Live dashboards, transaction monitoring, and predictive insights to optimize your financial operations.',
    },
  ];

  return (
    <section id="features" className="py-20 sm:py-28 bg-gray-50/50" aria-label="Platform features">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeInSection className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-4">Features</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Everything You Need to Build Finance in Africa
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A comprehensive platform designed specifically for the unique challenges and opportunities of African financial markets.
          </p>
        </FadeInSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <FadeInSection key={feature.title} delay={i * 0.08}>
              <Card className="h-full border-0 shadow-sm hover:shadow-md transition-shadow bg-white group">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works ─── */
function HowItWorksSection() {
  const steps = [
    {
      step: '01',
      title: 'Create Your Account',
      description: 'Sign up in under 2 minutes. No lengthy onboarding — just your email and a password to get started.',
    },
    {
      step: '02',
      title: 'Connect Providers',
      description: 'Link your preferred African fintech providers — Flutterwave, Fincra, MyStocks, and more — through our dashboard.',
    },
    {
      step: '03',
      title: 'Integrate & Go Live',
      description: 'Use our unified REST API to start processing payments, accessing market data, and managing wealth instantly.',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-white" aria-label="How it works">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeInSection className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-4">How It Works</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Go Live in Three Simple Steps
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From sign-up to processing your first transaction in minutes, not months.
          </p>
        </FadeInSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-px bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-200" aria-hidden="true" />

          {steps.map((item, i) => (
            <FadeInSection key={item.step} delay={i * 0.15} className="relative">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white font-bold text-lg mb-6 shadow-lg shadow-emerald-600/25 relative z-10">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">{item.description}</p>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Providers Section ─── */
function ProvidersSection() {
  const providers = [
    { name: 'Flutterwave', category: 'Payments', description: 'Accept payments from across Africa and the world with card, bank transfer, and mobile money support.' },
    { name: 'Fincra', category: 'Payments', description: 'Multi-currency business accounts, cross-border payments, and compliance tools for African businesses.' },
    { name: 'MyStocks Africa', category: 'Markets', description: 'Real-time African equity market data, portfolio tracking, and investment analytics.' },
    { name: 'Openverse', category: 'Content', description: 'Access millions of free and openly licensed images and media for your financial content needs.' },
  ];

  return (
    <section id="providers" className="py-20 sm:py-28 bg-gray-50/50" aria-label="Integrated providers">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeInSection className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-4">Integrations</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Connect Africa&apos;s Best Fintech Providers
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            One platform, multiple providers. We handle the complexity so you can focus on building.
          </p>
        </FadeInSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {providers.map((p, i) => (
            <FadeInSection key={p.name} delay={i * 0.1}>
              <Card className="h-full border-0 shadow-sm hover:shadow-md transition-all bg-white">
                <CardContent className="p-6 flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <Globe className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{p.name}</h3>
                      <Badge variant="outline" className="text-[10px] font-medium">{p.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
                  </div>
                </CardContent>
              </Card>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing Section ─── */
function PricingSection() {
  const plans = [
    {
      name: 'Starter',
      price: 'Free',
      period: 'forever',
      description: 'Perfect for exploring the platform and building your first integration.',
      features: ['1,000 API calls/month', '2 provider connections', 'Community support', 'Sandbox environment', 'Basic analytics'],
      cta: 'Start Free',
      highlighted: false,
    },
    {
      name: 'Growth',
      price: '$49',
      period: '/month',
      description: 'For scaling businesses that need reliable, high-volume financial operations.',
      features: ['50,000 API calls/month', 'All provider connections', 'Priority email support', 'Production environment', 'Advanced analytics', 'Webhook management', 'Multi-currency support'],
      cta: 'Get Started',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large organizations with custom compliance and volume requirements.',
      features: ['Unlimited API calls', 'Dedicated account manager', 'SLA guarantee (99.99%)', 'Custom integrations', 'On-premise deployment option', 'Audit logs & compliance', 'SSO & advanced security'],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 sm:py-28 bg-white" aria-label="Pricing plans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeInSection className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-4">Pricing</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start free and scale as you grow. No hidden fees, no surprises.
          </p>
        </FadeInSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, i) => (
            <FadeInSection key={plan.name} delay={i * 0.1}>
              <Card className={`h-full flex flex-col border-0 shadow-sm ${
                plan.highlighted
                  ? 'ring-2 ring-emerald-500 shadow-emerald-500/10 relative'
                  : 'hover:shadow-md transition-shadow'
              }`}>
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-600 text-white shadow-sm">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-6 flex flex-col flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                  <div className="mt-6 mb-6">
                    <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 flex-1" role="list">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-gray-700">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full mt-8 ${
                      plan.highlighted
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                  >
                    {plan.cta} <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA Section ─── */
function CTASection() {
  return (
    <section className="py-20 sm:py-28 bg-emerald-950 relative overflow-hidden" aria-label="Call to action">
      {/* Decorative elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-400/5 rounded-full blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <FadeInSection>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
            Ready to Build the Future of
            <span className="text-emerald-400"> African Finance?</span>
          </h2>
          <p className="mt-6 text-lg text-emerald-100/70 max-w-2xl mx-auto">
            Join thousands of developers and businesses already using AfriSpine to power their financial products across the continent.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-semibold text-base px-8 py-6 shadow-xl shadow-emerald-500/25"
            >
              Create Free Account <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200 text-base px-8 py-6"
            >
              Talk to Sales
            </Button>
          </div>
        </FadeInSection>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  const footerLinks = {
    Platform: ['Features', 'Pricing', 'API Docs', 'Status', 'Changelog'],
    Company: ['About Us', 'Careers', 'Blog', 'Press', 'Partners'],
    Resources: ['Documentation', 'API Reference', 'SDKs', 'Guides', 'Community'],
    Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Compliance'],
  };

  return (
    <footer className="bg-gray-950 text-gray-400 border-t border-gray-800" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4" aria-label="AfriSpine Home">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">AfriSpine</span>
            </Link>
            <p className="text-sm leading-relaxed">
              Unifying Africa&apos;s financial infrastructure into one powerful platform.
            </p>
            <div className="flex gap-3 mt-4">
              <Lock className="h-4 w-4 text-gray-500" aria-label="Secure" />
              <Users className="h-4 w-4 text-gray-500" aria-label="Community" />
              <Globe className="h-4 w-4 text-gray-500" aria-label="Global" />
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-white mb-4">{title}</h3>
              <ul className="space-y-2.5" role="list">
                {links.map((link) => (
                  <li key={link}>
                    {link === 'Status' ? (
                      <Link href="/health" className="text-sm hover:text-emerald-400 transition-colors">
                        {link}
                      </Link>
                    ) : (
                      <a href="#" className="text-sm hover:text-emerald-400 transition-colors">
                        {link}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm">&copy; {new Date().getFullYear()} AfriSpine. All rights reserved.</p>
          <p className="text-sm">Built with <span className="text-emerald-400">&hearts;</span> for Africa</p>
        </div>
      </div>
    </footer>
  );
}

/* ─── Main Page ─── */
export default function AfriSpineLandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <StatsBar />
        <FeaturesSection />
        <HowItWorksSection />
        <ProvidersSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
