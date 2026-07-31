'use client';

import React from 'react';
import { useAppStore, ViewName } from '@/stores/app';
import { Separator } from '@/components/ui/separator';
import { Shield, Building2 } from 'lucide-react';

interface FooterLink {
  label: string;
  view?: ViewName;
}

const companyLinks: FooterLink[] = [
  { label: 'About Us', view: 'about' },
  { label: 'Careers', view: 'contact' },
  { label: 'Press', view: 'about' },
  { label: 'AfriSpine Digest', view: 'digest-current' },
];

const productLinks: FooterLink[] = [
  { label: 'Transfer Money', view: 'send' },
  { label: 'Business FX', view: 'business' },
  { label: 'Wealth', view: 'wealth-landing' },
  { label: 'Gifts & Occasions', view: 'gifts' },
];

const resourceLinks: FooterLink[] = [
  { label: 'FAQ', view: 'faq' },
  { label: 'Help Centre', view: 'contact' },
  { label: 'Best Rates', view: 'best-rates' },
  { label: 'Advertise', view: 'digest-advertise' },
];

const legalLinks: FooterLink[] = [
  { label: 'Terms of Service', view: 'terms' },
  { label: 'Privacy Policy', view: 'privacy' },
  { label: 'AML Policy', view: 'aml-policy' },
  { label: 'Contact Us', view: 'contact' },
];

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  const navigate = useAppStore((s) => s.navigate);
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            {link.view ? (
              <button
                onClick={() => navigate(link.view!)}
                className="text-sm text-muted-foreground transition-colors hover:text-emerald-600"
              >
                {link.label}
              </button>
            ) : (
              <span className="text-sm text-muted-foreground">
                {link.label}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialIcon({ letter, label }: { letter: string; label: string }) {
  return (
    <button
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-emerald-100 hover:text-emerald-700"
    >
      <span className="text-xs font-bold">{letter}</span>
    </button>
  );
}

export function Footer() {
  const navigate = useAppStore((s) => s.navigate);

  return (
    <footer className="mt-auto border-t border-border/40 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 lg:py-16">
        {/* Top section: Logo + Socials */}
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between mb-10">
          <div className="max-w-xs">
            <button
              onClick={() => navigate('landing')}
              className="text-xl font-bold text-emerald-600 tracking-tight"
            >
              AfriSpine
            </button>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The modern way for the African diaspora to transfer money home. Fast,
              fair, and built for Africans, by Africans.
            </p>
            {/* Social Icons */}
            <div className="mt-5 flex items-center gap-2">
              <SocialIcon letter="X" label="Twitter / X" />
              <SocialIcon letter="in" label="LinkedIn" />
              <SocialIcon letter="f" label="Facebook" />
              <SocialIcon letter="ig" label="Instagram" />
            </div>
          </div>

          {/* 4-column link grid */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-8 sm:grid-cols-4">
            <FooterColumn title="Company" links={companyLinks} />
            <FooterColumn title="Product" links={productLinks} />
            <FooterColumn title="Resources" links={resourceLinks} />
            <FooterColumn title="Legal" links={legalLinks} />
          </div>
        </div>

        <Separator className="my-8" />

        {/* Regulatory & Partner Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mb-8">
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 overflow-hidden">
              <img src="/partner-fincra.png" alt="Fincra" className="h-5 w-auto object-contain" />
            </div>
            <div>
              <span className="font-medium text-gray-700">Payment processing</span>
              <br />
              Fincra
            </div>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 overflow-hidden">
              <img src="/partner-smileid.svg" alt="Smile ID" className="h-5 w-auto object-contain" />
            </div>
            <div>
              <span className="font-medium text-gray-700">KYC verification</span>
              <br />
              Smile ID
            </div>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 overflow-hidden">
              <img src="/partner-pepchecker.png" alt="PEPChecker" className="h-5 w-auto object-contain rounded" />
            </div>
            <div>
              <span className="font-medium text-gray-700">AML screening</span>
              <br />
              PEPChecker
            </div>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50">
              <Building2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <span className="font-medium text-gray-700">Regulated by</span>
              <br />
              CBK Kenya licensed partners
            </div>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50">
              <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <span className="font-medium text-gray-700">PCI DSS</span>
              <br />
              Level 1 compliant
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Legal Disclaimer */}
        <div className="space-y-3">
          <p className="text-center text-xs leading-relaxed text-muted-foreground/80">
            &copy; {new Date().getFullYear()} AfriSpine Ltd. Registered in Kenya. AfriSpine is a
            payment routing platform, not a bank or money transmitter. Transactions are
            processed by Fincra. Funds are delivered by licensed
            partner providers in each recipient country. AfriSpine does not hold customer
            funds at any time.
          </p>
          <p className="text-center text-[11px] leading-relaxed text-muted-foreground/60 max-w-4xl mx-auto">
            AfriSpine complies with applicable Anti-Money Laundering (AML) and
            Counter-Terrorism Financing (CTF) regulations. Exchange rates are indicative
            and may vary at the time of transaction. Final rates and fees are confirmed
            before payment. Service availability may vary by corridor and recipient
            method. By using AfriSpine, you agree to our Terms of Service and Privacy
            Policy.
          </p>
        </div>
      </div>
    </footer>
  );
}
