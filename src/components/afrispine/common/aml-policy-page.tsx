'use client';

import React from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function AmlPolicyPage() {
  const navigate = useAppStore((s) => s.navigate);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('landing')}
        className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back
      </Button>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">AML &amp; Compliance Policy</h1>
      <p className="mt-2 text-xs text-muted-foreground">Last updated: January 2026</p>

      <div className="mt-8 space-y-8 text-sm text-muted-foreground leading-relaxed">
        {/* Our Commitment */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Our Commitment to Financial Crime Prevention</h2>
          <p>
            AfriSpine Ltd is committed to preventing money laundering, terrorist financing, proliferation financing, and other forms of financial crime. As a payment routing platform facilitating international money transfers to Africa, we recognise our responsibility to maintain robust anti-money laundering (AML) and counter-terrorism financing (CTF) controls. This policy outlines the measures we have implemented to detect, prevent, and report suspicious activity.
          </p>
        </section>

        {/* Regulatory Position */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Our Regulatory Position</h2>
          <p>
            AfriSpine operates in accordance with the Proceeds of Crime and Anti-Money Laundering Act (POCAMLA) of Kenya, which sets out the legal framework for AML compliance in Kenya. We align our policies and procedures with the Financial Action Task Force (FATF) Forty Recommendations, which represent the international standard for AML and CTF measures.
          </p>
          <p className="mt-3">
            In addition to domestic requirements, AfriSpine complies with applicable sanctions regulations, including those administered by the United States Office of Foreign Assets Control (OFAC), Her Majesty&apos;s Treasury (HM Treasury) of the United Kingdom, and the European Union. We also adhere to guidance issued by the Central Bank of Kenya (CBK) as it relates to cross-border payment services and financial crime prevention.
          </p>
        </section>

        {/* KYC */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Know Your Customer (KYC)</h2>
          <p>
            All users of the AfriSpine platform must be at least eighteen (18) years of age and must complete a Know Your Customer (KYC) verification process before they are permitted to send money. Our KYC process is designed to establish and verify the identity of each user.
          </p>
          <p className="mt-3">
            The KYC process requires the following information and verification steps:
          </p>
          <ul className="mt-3 list-disc pl-5 space-y-2">
            <li><strong className="text-gray-700">Legal Name:</strong> The user&apos;s full legal name as it appears on their government-issued identification.</li>
            <li><strong className="text-gray-700">Date of Birth:</strong> To confirm the user is at least 18 years of age.</li>
            <li><strong className="text-gray-700">Government-Issued ID:</strong> A valid passport, national identity card, or driver&apos;s licence, verified through our identity verification partner, Smile ID. The document is checked for authenticity, validity, and a biometric match against the user&apos;s submitted photograph.</li>
            <li><strong className="text-gray-700">Biometric Liveness Check:</strong> A real-time selfie is captured and analysed to confirm the user is a live person and matches the photograph on their submitted identification document.</li>
          </ul>
          <p className="mt-3">
            For transactions that exceed defined thresholds, or in cases where our automated systems flag potential risk indicators, we apply enhanced due diligence (EDD) measures. Enhanced due diligence may include requesting additional identification documents, proof of address, source of funds documentation, and conducting a more detailed review of the user&apos;s transaction history and profile.
          </p>
        </section>

        {/* Transaction Monitoring */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Transaction Monitoring</h2>
          <p>
            AfriSpine monitors all transactions for indicators of money laundering, terrorist financing, sanctions evasion, and other financial crime. Our monitoring programme includes:
          </p>
          <ul className="mt-3 list-disc pl-5 space-y-2">
            <li><strong className="text-gray-700">PEP &amp; Sanctions Screening:</strong> All users are screened against global Politically Exposed Person (PEP) databases and international sanctions lists using our AML compliance partner, PEPChecker. This real-time screening checks names against OFAC Specially Designated Nationals (SDN) List, United Nations Security Council consolidated sanctions lists, European Union sanctions lists, and HM Treasury consolidated lists. PEP matches are escalated for enhanced due diligence review.</li>
            <li><strong className="text-gray-700">Sanctioned Country Blocking:</strong> Transactions involving senders or recipients in comprehensively sanctioned countries and regions are blocked. This includes, but is not limited to, Iran, the Democratic People&apos;s Republic of Korea (North Korea), Syria, Cuba, Russia, Belarus, Myanmar (Burma), Sudan, Libya, and Somalia.</li>
            <li><strong className="text-gray-700">Pattern Detection:</strong> We monitor for unusual transaction patterns that may indicate structuring, layering, or other money laundering techniques, including rapid successive transfers, round-dollar amounts, transfers to multiple unrelated recipients, and transfers inconsistent with the user&apos;s stated purpose or profile.</li>
          </ul>
          <p className="mt-3">
            When a transaction is flagged by our monitoring systems, it is referred to our compliance team for manual review. The compliance team will assess the transaction and determine whether it should be released, blocked, or reported to the relevant authorities. Flagged transactions are not automatically refunded. Any refund decision is made by the compliance team following a thorough review and in accordance with our Refund Policy and applicable legal obligations.
          </p>
        </section>

        {/* Record Keeping */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Record Keeping</h2>
          <p>
            In compliance with POCAMLA and international AML standards, AfriSpine retains all KYC documentation, transaction records, and compliance-related records for a minimum of seven (7) years from the date of the relevant transaction or customer relationship. These records are stored securely and are accessible only to authorised compliance and legal personnel. Records are made available to competent authorities upon lawful request.
          </p>
        </section>

        {/* Reporting */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Reporting</h2>
          <p>
            AfriSpine files Suspicious Transaction Reports (STRs) with the Financial Reporting Centre (FRC) of Kenya in accordance with POCAMLA. We also cooperate fully with law enforcement agencies, regulatory authorities, and other competent bodies in Kenya and internationally when required by law or when the circumstances warrant such cooperation. Our compliance team is trained to identify and escalate suspicious activity promptly and in accordance with established procedures.
          </p>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Contact</h2>
          <p>
            For compliance-related enquiries or to report suspected financial crime, please contact our compliance team:
          </p>
          <div className="mt-3 rounded-lg bg-gray-50 p-4 text-sm">
            <p className="font-medium text-gray-900">Compliance &amp; Legal</p>
            <p>
              Email:{' '}
              <a href="mailto:compliance@afri-spine.com" className="text-emerald-600 underline underline-offset-2 hover:text-emerald-700">
                compliance@afri-spine.com
              </a>
            </p>
            <p>
              Legal:{' '}
              <a href="mailto:legal@afri-spine.com" className="text-emerald-600 underline underline-offset-2 hover:text-emerald-700">
                legal@afri-spine.com
              </a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}