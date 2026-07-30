'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAppStore } from '@/stores/app';

export default function DangoteIpoBlock() {
  const navigate = useAppStore((s) => s.navigate);
  const [displayCount, setDisplayCount] = useState(0);
  const targetCount = useRef(2847);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch('/api/markets/dangote-ipo/count');
      const data = await res.json();
      targetCount.current = data.total || 2847;
    } catch {
      targetCount.current = 2847;
    }
  }, []);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  useEffect(() => {
    const target = targetCount.current;
    const duration = 2000;
    const startTime = performance.now();
    const startValue = 0;

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (target - startValue) * eased);
      setDisplayCount(current);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, []);

  return (
    <section className="w-full bg-gray-950 py-10 px-4 sm:py-16 sm:px-6">
      <div className="max-w-3xl mx-auto text-center">
        {/* Heading */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-amber-400 mb-4">
          🔥 Dangote Refinery IPO — Africa&apos;s Biggest Ever
        </h2>

        {/* Stats row */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mb-6">
          <div className="text-sm sm:text-base text-gray-300">
            Estimated valuation: <span className="text-amber-500 font-semibold">$40–50 billion</span>
          </div>
          <div className="text-sm sm:text-base text-gray-300">
            Expected raise: <span className="text-amber-500 font-semibold">up to $5 billion</span>
          </div>
          <div className="text-sm sm:text-base text-gray-300">
            USD dividends: <span className="text-amber-500 font-semibold">✅ confirmed</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-400 text-sm sm:text-base mb-8 max-w-xl mx-auto leading-relaxed">
          Register your interest today. When the IPO opens, you&apos;ll be among the first to know.
          AfriSpine will let you buy Dangote Refinery shares directly from the diaspora — no broker needed.
        </p>

        {/* Live counter */}
        <div className="mb-8">
          <p className="text-amber-400/80 text-xs sm:text-sm uppercase tracking-wider mb-1">
            Live registration counter
          </p>
          <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tabular-nums">
            {displayCount.toLocaleString()}
          </p>
          <p className="text-gray-500 text-sm mt-1">investors already registered</p>
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate('dangote-ipo')}
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold px-6 py-3 sm:px-8 sm:py-3.5 rounded-lg transition-colors text-sm sm:text-base"
        >
          Register interest — it&apos;s free
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}