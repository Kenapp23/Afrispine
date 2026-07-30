'use client'

import { useAppStore } from '@/stores/app'
import { featuredMerchants } from '@/lib/merchants'

const occasions = [
  { icon: '🎄', label: 'Christmas' },
  { icon: '👶', label: 'New Baby' },
  { icon: '🎓', label: 'Graduation' },
  { icon: '💒', label: 'Wedding' },
  { icon: '🎂', label: 'Birthday' },
  { icon: '🏠', label: 'New Home' },
] as const

export default function GiftingStrip() {
  const navigate = useAppStore((s) => s.navigate)

  return (
    <section className="bg-gradient-to-r from-amber-50 to-orange-50 py-14 px-4 sm:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-bold tracking-tight text-amber-950 sm:text-3xl">
          Send the gift of Africa to someone you love
        </h2>

        {/* Occasion icons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {occasions.map((o) => (
            <div
              key={o.label}
              className="flex flex-col items-center gap-1.5"
            >
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 text-2xl shadow-sm sm:h-14 sm:w-14 sm:text-3xl"
                aria-hidden="true"
              >
                {o.icon}
              </span>
              <span className="text-xs font-medium text-amber-900 sm:text-sm">
                {o.label}
              </span>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-xl text-sm leading-relaxed text-amber-800 sm:text-base">
          Send a gift voucher redeemable at{' '}
          {featuredMerchants.slice(0, 6).map((m, i) => (
            <span key={m.id}>
              {i > 0 && ', '}
              <span className="font-semibold">{m.name}</span>
            </span>
          ))}{' '}
          and 100+ more stores across Africa. Your love, delivered.
        </p>

        <button
          onClick={() => navigate('gifts')}
          className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-amber-700 px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 sm:mt-8 sm:text-base"
        >
          Send a gift →
        </button>
      </div>
    </section>
  )
}