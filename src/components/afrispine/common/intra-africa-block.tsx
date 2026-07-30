'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAppStore } from '@/stores/app';

export default function IntraAfricaBlock() {
  const navigate = useAppStore((s) => s.navigate);
  const [displayCount, setDisplayCount] = useState(0);
  const targetCount = useRef(0);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch('/api/markets/intra-africa/count');
      const data = await res.json();
      targetCount.current = data.total || 0;
    } catch {
      targetCount.current = 0;
    }
  }, []);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  useEffect(() => {
    const target = targetCount.current;
    if (target === 0) {
      // No registrations yet — show a teaser count
      const teaser = 312;
      const duration = 2000;
      const startTime = performance.now();
      function animate(currentTime: number) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayCount(Math.round(teaser * eased));
        if (progress < 1) requestAnimationFrame(animate);
      }
      requestAnimationFrame(animate);
      return;
    }
    const duration = 2000;
    const startTime = performance.now();
    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayCount(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, []);

  return (
    <section className="w-full bg-gradient-to-br from-amber-950 via-amber-900 to-orange-950 py-10 px-4 sm:py-16 sm:px-6">
      <div className="max-w-3xl mx-auto text-center">
        {/* Heading */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-amber-300 mb-4">
          Send Money Within Africa
        </h2>
        <p className="text-lg sm:text-xl text-amber-200/80 font-medium mb-2">
          Intra-Africa Payments — Coming Soon via PAPSS
        </p>

        {/* Stats row */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mb-6 mt-6">
          <div className="text-sm sm:text-base text-amber-100/70">
            <span className="text-amber-400 font-semibold">18 African countries</span> at launch
          </div>
          <div className="text-sm sm:text-base text-amber-100/70">
            <span className="text-amber-400 font-semibold">No USD conversion</span> — local to local
          </div>
          <div className="text-sm sm:text-base text-amber-100/70">
            <span className="text-amber-400 font-semibold">Near-instant</span> settlement
          </div>
        </div>

        {/* Description */}
        <p className="text-amber-100/50 text-sm sm:text-base mb-8 max-w-xl mx-auto leading-relaxed">
          Moving money between African countries no longer means converting to USD and back.
          AfriSpine will route transfers through PAPSS — the continent&apos;s own payment infrastructure.
          Register your interest and be the first to know when it goes live.
        </p>

        {/* Live counter */}
        <div className="mb-8">
          <p className="text-amber-400/70 text-xs sm:text-sm uppercase tracking-wider mb-1">
            People registered
          </p>
          <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tabular-nums">
            {displayCount.toLocaleString()}
          </p>
          <p className="text-amber-200/40 text-sm mt-1">waiting for Intra-Africa corridors</p>
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate('intra-africa')}
          className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-amber-950 font-semibold px-6 py-3 sm:px-8 sm:py-3.5 rounded-lg transition-colors text-sm sm:text-base"
        >
          Register interest — it&apos;s free
          <span aria-hidden="true">&rarr;</span>
        </button>
      </div>
    </section>
  );
}