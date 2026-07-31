'use client';

import { Send, TrendingUp, Zap } from 'lucide-react';
import { useAppStore } from '@/stores/app';

const PILLARS = [
  {
    icon: Send,
    headline: 'Send money home',
    sub: 'From $10 to $10,000. Arrives in minutes. M-Pesa, MTN MoMo, bank — your choice.',
    cta: 'Send now →',
    navigateTo: 'signup' as const,
    highlight: '1.5% · No hidden fees',
    badge: null,
  },
  {
    icon: TrendingUp,
    headline: 'Own a piece of Africa',
    sub: 'Buy stocks on the NSE, NGX, JSE and more. From $10. Plus bonds paying 12–16%.',
    cta: 'Start investing →',
    navigateTo: 'wealth-landing' as const,
    highlight: '8 exchanges · From $10',
    badge: '🔥 Dangote IPO coming',
  },
  {
    icon: Zap,
    headline: 'Pay bills back home',
    sub: 'KPLC electricity, DStv, water, airtime. Pay directly from abroad. $1.50 flat fee.',
    cta: 'Pay a bill →',
    navigateTo: 'signup' as const,
    highlight: '$1.50 flat · Instant',
    badge: null,
  },
];

export default function ProductPillars() {
  const navigate = useAppStore((s) => s.navigate);
  const sender = useAppStore((s) => s.sender);

  return (
    <section className="w-full py-10 sm:py-16 px-4 sm:px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.headline}
                className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all duration-200 relative"
              >
                {/* Badge */}
                {pillar.badge && (
                  <span className="absolute -top-3 right-4 bg-amber-100 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full border border-amber-200">
                    {pillar.badge}
                  </span>
                )}

                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-emerald-600" />
                </div>

                {/* Headline */}
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                  {pillar.headline}
                </h3>

                {/* Sub */}
                <p className="text-gray-600 text-sm leading-relaxed mb-4 flex-1">
                  {pillar.sub}
                </p>

                {/* Highlight */}
                <p className="text-emerald-600 text-xs font-semibold mb-4">
                  {pillar.highlight}
                </p>

                {/* CTA */}
                <button
                  onClick={() => {
                    if (pillar.navigateTo === 'signup') {
                      navigate('signup');
                    } else if (pillar.navigateTo === 'bills' && sender) {
                      navigate('bills');
                    } else {
                      navigate(pillar.navigateTo);
                    }
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
                >
                  {pillar.cta}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}