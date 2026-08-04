'use client'

import { useAppStore } from '@/stores/app'

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
    <section className="bg-gradient-to-r from-stone-50 to-neutral-100 py-14 px-4 sm:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
          Gift cards are coming soon
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
              <span className="text-xs font-medium text-stone-700 sm:text-sm">
                {o.label}
              </span>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-xl text-sm leading-relaxed text-stone-600 sm:text-base">
          We're building the easiest way to send gift cards across Africa. Browse 100+ brands and join the waitlist.
        </p>

        <button
          onClick={() => navigate('gifts')}
          className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-stone-700 px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 sm:mt-8 sm:text-base"
        >
          Join the Waitlist →
        </button>
      </div>
    </section>
  )
}
