'use client';

const TESTIMONIALS = [
  {
    quote:
      "I sent KPLC tokens to my mum in Kisumu from Edinburgh. She had electricity within 10 minutes. AfriSpine is magic.",
    author: 'Wanjiru N.',
    city: 'Edinburgh',
    flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  },
  {
    quote:
      "Bought Safaricom shares for my nephew's 18th birthday. His first investment. From Toronto to Nairobi. Priceless.",
    author: 'Kwame A.',
    city: 'Toronto',
    flag: '🇨🇦',
  },
  {
    quote:
      "I'm in 3 different chamas from London. AfriSpine keeps me contributing like I never left Nairobi.",
    author: 'Fatuma M.',
    city: 'London',
    flag: '🇬🇧',
  },
];

export default function Testimonials() {
  return (
    <section className="w-full py-10 sm:py-16 px-4 sm:px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 text-center mb-8 sm:mb-10">
          Join 10,000+ diaspora Africans building home from abroad
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.author}
              className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 flex flex-col"
            >
              {/* Stars */}
              <div className="text-amber-400 text-sm mb-4" aria-label="5 out of 5 stars">
                ★★★★★
              </div>

              {/* Quote */}
              <blockquote className="text-gray-700 text-sm sm:text-base leading-relaxed flex-1 mb-6">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-2">
                <span className="text-base">{t.flag}</span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.author}</p>
                  <p className="text-gray-500 text-xs">{t.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}