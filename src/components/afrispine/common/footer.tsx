'use client';

import React from 'react';
import { useAppStore, ViewName } from '@/stores/app';

const footerLinks: { label: string; view: ViewName }[] = [
  { label: 'Terms of Service', view: 'terms' },
  { label: 'Privacy Policy', view: 'privacy' },
  { label: 'AML Policy', view: 'aml-policy' },
  { label: 'Contact', view: 'contact' },
  { label: 'Best Rates', view: 'best-rates' },
  { label: 'How it works', view: 'landing' },
  { label: 'About', view: 'about' },
  { label: 'FAQ', view: 'faq' },
  { label: 'AfriSpine Digest', view: 'digest-current' },
  { label: 'Advertise', view: 'digest-advertise' },
];

export function Footer() {
  const navigate = useAppStore((s) => s.navigate);

  return (
    <footer className="mt-auto border-t border-border/40 bg-white py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Row 1: Links */}
        <div className="flex flex-wrap justify-center gap-4">
          {footerLinks.map((link) => (
            <button
              key={link.view}
              onClick={() => navigate(link.view)}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Row 2: Legal disclaimer */}
        <p className="mt-6 text-center text-[12px] leading-relaxed text-muted-foreground/70">
          &copy; 2026 AfriSpine Ltd. Registered in Kenya. AfriSpine is a payment
          routing platform, not a bank or money transmitter. Transactions are
          processed by Paystack (a Stripe company). Funds are delivered by licensed
          partner providers. AfriSpine does not hold customer funds at any time.
        </p>
      </div>
    </footer>
  );
}