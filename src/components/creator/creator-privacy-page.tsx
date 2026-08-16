'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/app';
import { Menu, X } from 'lucide-react';

const sections = [
  {
    title: '1. Data Collection',
    body: 'AfriSpine collects personal information you provide when creating an account, including your name, phone number, and email address. We also automatically collect device information, IP address, and usage data such as pages visited and content unlocked. This information helps us improve the platform experience and ensure security.',
  },
  {
    title: '2. M-Pesa Transaction Data',
    body: 'When you make a payment through M-Pesa, we receive transaction confirmation details including the transaction reference, amount paid, and timestamp. We do not store your M-Pesa PIN or full financial account details. All transaction data is processed in compliance with Safaricom’s integration requirements and is used solely for order confirmation and payout processing.',
  },
  {
    title: '3. Content Usage',
    body: 'We collect analytics on how you interact with content on the platform, including which creators you follow, content you unlock, and time spent on the platform. This data is used to personalise your feed, recommend relevant content, and provide creators with aggregated audience insights. Individual viewing habits are never shared publicly.',
  },
  {
    title: '4. Data Sharing',
    body: 'AfriSpine does not sell your personal data to third parties. We may share information with our payment processor (Safaricom M-Pesa) to facilitate transactions, and with creators in the form of aggregated, anonymised audience statistics. We may also disclose data when required by Kenyan law or to protect the rights and safety of our users and the platform.',
  },
  {
    title: '5. Data Security',
    body: 'We implement industry-standard security measures including TLS encryption for all data in transit and AES-256 encryption for sensitive data at rest. Access to personal data is restricted to authorised personnel on a need-to-know basis. We conduct regular security audits and vulnerability assessments to ensure the ongoing integrity of our systems.',
  },
  {
    title: '6. User Rights',
    body: 'Under the Kenya Data Protection Act 2019, you have the right to access, correct, delete, or port your personal data. You may withdraw consent for data processing at any time by contacting our data protection officer. Requests are typically processed within 30 days. Note that some data may be retained as required by law for transaction and compliance records.',
  },
  {
    title: '7. Contact',
    body: 'For any privacy-related inquiries or to exercise your data rights, please contact our Data Protection Officer at privacy@afri-spine.com or write to us at AfriSpine, Nairobi, Kenya. We aim to respond to all requests within 5 business days. If you are unsatisfied with our response, you may lodge a complaint with the Office of the Data Protection Commissioner in Kenya.',
  },
];

export function CreatorPrivacyPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ─── Navigation ─── */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('landing')}
            className="text-2xl font-extrabold tracking-tight text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            AfriSpine
          </button>

          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => navigate('about')}
              className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors"
            >
              About
            </button>
            <button
              onClick={() => navigate('terms')}
              className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors"
            >
              Terms
            </button>
            <button
              onClick={() => navigate('privacy')}
              className="text-sm font-medium text-emerald-600 transition-colors"
            >
              Privacy
            </button>
          </nav>

          <button
            className="md:hidden p-2 text-gray-600 hover:text-emerald-600 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2">
            <nav className="flex flex-col gap-1">
              <button
                onClick={() => { navigate('about'); setMobileMenuOpen(false); }}
                className="rounded-md px-3 py-2.5 text-left text-sm font-medium text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
              >
                About
              </button>
              <button
                onClick={() => { navigate('terms'); setMobileMenuOpen(false); }}
                className="rounded-md px-3 py-2.5 text-left text-sm font-medium text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
              >
                Terms
              </button>
              <button
                onClick={() => { navigate('privacy'); setMobileMenuOpen(false); }}
                className="rounded-md px-3 py-2.5 text-left text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                Privacy
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* ─── Main Content ─── */}
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
              Privacy Policy
            </h1>
            <p className="mt-2 text-sm text-gray-400">Last updated: January 2025</p>
          </div>

          <div className="space-y-8">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-bold text-gray-900 mb-2">{section.title}</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{section.body}</p>
              </section>
            ))}
          </div>
        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center gap-4">
            <nav className="flex items-center gap-6">
              <button
                onClick={() => navigate('terms')}
                className="text-sm text-gray-400 hover:text-emerald-600 transition-colors"
              >
                Terms
              </button>
              <button
                onClick={() => navigate('privacy')}
                className="text-sm text-emerald-600 transition-colors"
              >
                Privacy
              </button>
              <button
                onClick={() => navigate('contact')}
                className="text-sm text-gray-400 hover:text-emerald-600 transition-colors"
              >
                Contact
              </button>
            </nav>
            <div className="text-center space-y-1">
              <p className="text-sm text-gray-400">
                &copy; 2025 AfriSpine. All rights reserved.
              </p>
              <p className="text-xs text-gray-400">
                AfriSpine is fully owned by Rech Fish Market, a company registered in Kenya.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
