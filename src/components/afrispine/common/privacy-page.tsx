'use client';

import React from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function PrivacyPage() {
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

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Privacy Policy</h1>
      <p className="mt-2 text-xs text-muted-foreground">Last updated: January 2026</p>

      <div className="mt-8 space-y-8 text-sm text-muted-foreground leading-relaxed">
        {/* 1. Who We Are */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Who We Are</h2>
          <p>
            This Privacy Policy describes how AfriSpine Ltd (&quot;AfriSpine,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), a company registered in the Republic of Kenya, collects, uses, stores, and shares your personal information when you use our website and money transfer routing service. For questions about this policy, contact us at{' '}
            <a href="mailto:privacy@afri-spine.com" className="text-emerald-600 underline underline-offset-2 hover:text-emerald-700">
              privacy@afri-spine.com
            </a>.
          </p>
        </section>

        {/* 2. What Data We Collect */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">2. What Data We Collect</h2>
          <p>We collect the following categories of personal information:</p>
          <ul className="mt-3 list-disc pl-5 space-y-2">
            <li><strong className="text-gray-700">Identity Information:</strong> Your full legal name, email address, phone number, date of birth, and country of residence as provided during registration.</li>
            <li><strong className="text-gray-700">KYC Verification Data:</strong> Images or copies of your government-issued identification document (passport, national ID, or driver&apos;s licence), and a selfie or biometric photograph captured during identity verification.</li>
            <li><strong className="text-gray-700">Transaction Data:</strong> Details of transfers you initiate and receive, including amounts, currencies, dates, recipient names and details, delivery methods, and transaction statuses.</li>
            <li><strong className="text-gray-700">Technical Data:</strong> Your IP address, browser type and version, operating system, device identifiers, and information about how you interact with our platform.</li>
            <li><strong className="text-gray-700">Recipient Information:</strong> The name, phone number, and in some cases bank account details of individuals to whom you send money.</li>
          </ul>
          <p className="mt-3">
            We do not collect, store, or have access to your full card number, CVV, or other sensitive payment card data. All payment card information is handled directly by Eversend on their secure infrastructure.
          </p>
        </section>

        {/* 3. Why We Collect It */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Why We Collect It</h2>
          <p>We use your personal information for the following purposes:</p>
          <ul className="mt-3 list-disc pl-5 space-y-2">
            <li><strong className="text-gray-700">KYC and AML Compliance:</strong> To verify your identity in compliance with Know Your Customer and anti-money laundering regulations.</li>
            <li><strong className="text-gray-700">Transaction Processing:</strong> To process your money transfers, communicate with delivery providers, and deliver funds to your intended recipients.</li>
            <li><strong className="text-gray-700">Fraud Detection and Prevention:</strong> To detect, investigate, and prevent fraudulent transactions, unauthorised access, and other forms of financial crime.</li>
            <li><strong className="text-gray-700">Legal Compliance:</strong> To comply with applicable laws, regulations, court orders, and lawful requests from government authorities or regulators.</li>
            <li><strong className="text-gray-700">Communication:</strong> To send you transaction confirmations, status updates, security alerts, and other important notifications about your account and transfers.</li>
            <li><strong className="text-gray-700">Service Improvement:</strong> To analyse usage patterns, improve our platform, and develop new features and services.</li>
          </ul>
        </section>

        {/* 4. Who We Share It With */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Who We Share It With</h2>
          <p>We may share your personal information with the following categories of third parties:</p>
          <ul className="mt-3 list-disc pl-5 space-y-2">
            <li><strong className="text-gray-700">Eversend:</strong> Payment processing service used to collect your payment for transfers.</li>
            <li><strong className="text-gray-700">Smile Identity:</strong> Identity verification services used for KYC checks, including ID document verification and biometric liveness detection.</li>
            <li><strong className="text-gray-700">Licensed Delivery Providers:</strong> Licensed financial service providers in destination countries that deliver funds to your recipients.</li>
            <li><strong className="text-gray-700">Africa&apos;s Talking:</strong> Communications platform used to send SMS notifications to you and your recipients regarding transfer status.</li>
            <li><strong className="text-gray-700">Resend:</strong> Email delivery service used to send transactional emails such as confirmations and alerts.</li>
            <li><strong className="text-gray-700">Supabase:</strong> Database and authentication infrastructure provider that hosts our application data.</li>
          </ul>
          <p className="mt-3">
            We do not sell your personal information to any third party. We do not share your information with advertising networks, data brokers, or for marketing purposes beyond our own service communications.
          </p>
        </section>

        {/* 5. How Long We Keep It */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">5. How Long We Keep It</h2>
          <p>We retain your personal information for the following periods:</p>
          <ul className="mt-3 list-disc pl-5 space-y-2">
            <li><strong className="text-gray-700">Transaction Records:</strong> Retained for a minimum of seven (7) years from the date of the transaction, in accordance with anti-money laundering record-keeping requirements.</li>
            <li><strong className="text-gray-700">KYC Verification Data:</strong> Retained for a minimum of five (5) years after your last transaction, or for the duration of your account being active, whichever is longer.</li>
            <li><strong className="text-gray-700">Account Information:</strong> Retained for the duration that your account is active and for two (2) years following account closure or deletion.</li>
          </ul>
          <p className="mt-3">
            You may request deletion of your account and personal data by contacting us at{' '}
            <a href="mailto:privacy@afri-spine.com" className="text-emerald-600 underline underline-offset-2 hover:text-emerald-700">
              privacy@afri-spine.com
            </a>. We will process your request in accordance with applicable data protection laws, noting that certain data must be retained for legal and regulatory compliance purposes even after a deletion request.
          </p>
        </section>

        {/* 6. Your Rights */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Your Rights</h2>
          <p>Under applicable data protection laws, you have the following rights with respect to your personal information:</p>
          <ul className="mt-3 list-disc pl-5 space-y-2">
            <li><strong className="text-gray-700">Right of Access:</strong> You may request a copy of the personal information we hold about you.</li>
            <li><strong className="text-gray-700">Right to Rectification:</strong> You may request correction of any inaccurate or incomplete personal information.</li>
            <li><strong className="text-gray-700">Right to Deletion:</strong> You may request deletion of your personal information, subject to legal retention requirements.</li>
            <li><strong className="text-gray-700">Right to Object:</strong> You may object to the processing of your personal information for marketing purposes.</li>
          </ul>
          <p className="mt-3">
            If you are a data subject located in Kenya, you also have the right to lodge a complaint with the Office of the Data Protection Commissioner (ODPC) if you believe that your data protection rights have been violated. To exercise any of these rights, please contact us at{' '}
            <a href="mailto:privacy@afri-spine.com" className="text-emerald-600 underline underline-offset-2 hover:text-emerald-700">
              privacy@afri-spine.com
            </a>.
          </p>
        </section>

        {/* 7. Security */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Security</h2>
          <p>
            We implement appropriate technical and organisational measures to protect your personal information, including Transport Layer Security (TLS) encryption for all data in transit, AES-256 encryption for data at rest, access controls that limit who can access personal information, and regular security assessments.
          </p>
          <p className="mt-3">
            While we strive to protect your personal information, no method of electronic transmission or storage is 100% secure. We cannot guarantee the absolute security of your data. You are responsible for maintaining the confidentiality of your account credentials and for notifying us immediately of any unauthorised use of your account.
          </p>
        </section>

        {/* 8. Cookies */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Cookies</h2>
          <p>
            AfriSpine uses only essential cookies that are strictly necessary for the operation of our platform. These include authentication cookies that maintain your logged-in session and security cookies that help detect and prevent fraudulent activity. We do not use advertising cookies, analytics tracking cookies, or any third-party cookies for profiling or targeted advertising purposes.
          </p>
        </section>

        {/* 9. Changes */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. When we make material changes, we will notify you by sending an email to the address associated with your account. We will also update the &quot;Last updated&quot; date at the top of this page. Your continued use of the AfriSpine service after any changes to this Privacy Policy constitutes your acceptance of the updated terms.
          </p>
        </section>
      </div>
    </div>
  );
}