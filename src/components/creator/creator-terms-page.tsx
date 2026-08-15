'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/app';
import { Menu, X } from 'lucide-react';

const sections = [
  {
    title: '1. Service Description',
    body: 'AfriSpine is a digital content platform that enables African creators to monetise premium video, photo, and written content through M-Pesa payments. Users browse, unlock, and enjoy exclusive content while creators earn revenue from every purchase. The platform operates primarily in Kenya and is expanding across East Africa.',
  },
  {
    title: '2. User Accounts',
    body: 'To access premium content, you must create an account with a valid phone number and M-Pesa-registered mobile number. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. AfriSpine reserves the right to suspend accounts that violate these terms.',
  },
  {
    title: '3. Content Rules',
    body: 'All content uploaded to AfriSpine must comply with Kenyan law and our community guidelines. Prohibited content includes, but is not limited to, hate speech, explicit adult material, misinformation, and content that infringes on third-party rights. AfriSpine reserves the right to remove any content without prior notice.',
  },
  {
    title: '4. Payment Terms',
    body: 'Payments for premium content are processed exclusively through M-Pesa. Upon initiating an unlock, you will receive an STK push prompt on your registered phone number. Once payment is confirmed, access to the content is granted immediately. All prices are displayed in Kenya Shillings (KES) and are inclusive of applicable taxes.',
  },
  {
    title: '5. Refunds',
    body: 'Due to the digital nature of content on AfriSpine, refunds are generally not available once content has been unlocked. In exceptional cases, such as technical failures preventing access to purchased content, you may request a refund within 24 hours by contacting our support team. All refund decisions are made at AfriSpine\'s sole discretion.',
  },
  {
    title: '6. Creator Terms',
    body: 'Approved creators receive 60% of all revenue generated from their content, while AfriSpine retains 40% to cover platform costs, payment processing fees, and operational expenses. Payouts are processed weekly via M-Pesa to the creator\'s registered mobile number. Creators must maintain accurate payout details and are responsible for any applicable tax obligations.',
  },
  {
    title: '7. Intellectual Property',
    body: 'Creators retain full ownership of the content they upload to AfriSpine. By publishing content on the platform, creators grant AfriSpine a non-exclusive, worldwide licence to host, distribute, and display the content for the purpose of operating the service. Users may not download, reproduce, or redistribute content without explicit permission from the creator.',
  },
  {
    title: '8. Limitation of Liability',
    body: 'AfriSpine provides the platform on an "as is" basis and makes no warranties regarding the availability, accuracy, or quality of content. In no event shall AfriSpine be liable for any indirect, incidental, or consequential damages arising from the use of the platform. Our total liability shall not exceed the amount paid by you in the 12 months preceding the claim.',
  },
  {
    title: '9. Governing Law',
    body: 'These Terms of Service are governed by and construed in accordance with the laws of the Republic of Kenya. Any disputes arising from the use of AfriSpine shall be resolved through arbitration in Nairobi, Kenya, in accordance with the Arbitration Act of 1995. By using the platform, you consent to the exclusive jurisdiction of Kenyan courts.',
  },
];

export function CreatorTermsPage() {
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
              className="text-sm font-medium text-emerald-600 transition-colors"
            >
              Terms
            </button>
            <button
              onClick={() => navigate('privacy')}
              className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors"
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
                className="rounded-md px-3 py-2.5 text-left text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                Terms
              </button>
              <button
                onClick={() => { navigate('privacy'); setMobileMenuOpen(false); }}
                className="rounded-md px-3 py-2.5 text-left text-sm font-medium text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
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
              Terms of Service
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">
              &copy; 2025 AfriSpine. All rights reserved.
            </p>
            <nav className="flex items-center gap-6">
              <button
                onClick={() => navigate('terms')}
                className="text-sm text-emerald-600 transition-colors"
              >
                Terms
              </button>
              <button
                onClick={() => navigate('privacy')}
                className="text-sm text-gray-400 hover:text-emerald-600 transition-colors"
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
          </div>
        </div>
      </footer>
    </div>
  );
}
