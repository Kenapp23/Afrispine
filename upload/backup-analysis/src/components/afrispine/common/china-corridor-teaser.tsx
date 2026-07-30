'use client';

import { useAppStore } from '@/stores/app';

export default function ChinaCorridorTeaser() {
  const navigate = useAppStore((s) => s.navigate);

  return (
    <section className="w-full bg-gradient-to-r from-red-700 to-emerald-800 py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="text-center sm:text-left flex-1">
          <div className="flex items-center gap-2 justify-center sm:justify-start mb-3">
            <span className="bg-white/20 text-white text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full tracking-wide uppercase">
              BETA — Join the waiting list
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3">
            🇨🇳 → 🌍 Sending money to China for business?
          </h2>
          <p className="text-white/85 text-sm sm:text-base leading-relaxed max-w-xl">
            AfriSpine Business China Corridor — pay suppliers in CNY directly from Kenya, Nigeria, Ghana.
            Same-day settlement. 0.8% flat fee.
          </p>
        </div>

        <button
          onClick={() => navigate('china-corridor')}
          className="inline-flex items-center gap-2 bg-white text-red-700 hover:bg-white/90 font-semibold px-6 py-3 rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap shrink-0"
        >
          Learn more
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}