'use client';

import React from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function TermsPage() {
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

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Terms of Service</h1>
      <p className="mt-2 text-xs text-muted-foreground">Last updated: January 2026</p>

      <div className="mt-8 space-y-8 text-sm text-muted-foreground leading-relaxed">
        {/* 1. About AfriSpine */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">1. About AfriSpine</h2>
          <p>
            AfriSpine Ltd (&quot;AfriSpine,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is a company registered in the Republic of Kenya. AfriSpine operates as a non-custodial payment routing platform that connects senders with licensed financial service providers for the purpose of facilitating international money transfers to recipients in Africa.
          </p>
          <p className="mt-3">
            AfriSpine is not a bank, a money transmitter, or a licensed financial institution. We do not hold, store, or custody customer funds at any point during the transfer process. All funds collected from senders are processed directly by our payment processing partner, and disbursements to recipients are made by licensed partner providers in the destination country.
          </p>
        </section>

        {/* 2. The Service */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">2. The Service</h2>
          <p>
            AfriSpine provides a payment routing service that allows individuals to send money from the United Kingdom and the United States to recipients in Kenya, Nigeria, and Ghana. Our platform automatically selects the optimal delivery rail from a network of licensed providers based on speed, cost, and availability.
          </p>
          <p className="mt-3">
            Supported send corridors include United Kingdom to Kenya, United Kingdom to Nigeria, United Kingdom to Ghana, United States to Kenya, and additional corridors as listed on our platform. Delivery methods available to recipients include mobile money (M-Pesa, MTN Mobile Money), bank transfers, and other payout methods as indicated for each corridor.
          </p>
          <p className="mt-3">
            Our service charges a fee of between 1% and 3% of the transfer amount, which is clearly displayed before you confirm any transaction. When you initiate a transfer, we provide you with a real-time exchange rate quote that is locked for a period of fifteen (15) minutes. If your payment is not completed within this lock window, the quoted rate will expire and a new rate will need to be obtained.
          </p>
        </section>

        {/* 3. Eligibility */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Eligibility</h2>
          <p>
            To use the AfriSpine service, you must be at least eighteen (18) years of age. You must provide accurate, complete, and current information during the registration and verification process. You are responsible for maintaining the accuracy of your account information and notifying us promptly of any changes.
          </p>
          <p className="mt-3">
            You must complete our Know Your Customer (KYC) verification process before you can send money. KYC verification requires you to provide a valid government-issued identification document and may include additional verification steps such as biometric checks.
          </p>
          <p className="mt-3">
            You may not use the AfriSpine service if you are located in a country or region that is subject to comprehensive economic sanctions, or if your use of the service would violate any applicable laws or regulations. You must be a resident of a country from which we accept senders, as listed on our platform.
          </p>
        </section>

        {/* 4. Fees and Exchange Rates */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Fees and Exchange Rates</h2>
          <p>
            AfriSpine charges a service fee of between 1% and 3% of the transfer amount. The exact fee for your transfer will be displayed clearly before you confirm the transaction. The exchange rate applied to your transfer is the rate quoted to you at the time of initiating the transfer.
          </p>
          <p className="mt-3">
            Exchange rate quotes are locked for a period of fifteen (15) minutes from the time they are generated. If you do not complete payment within this window, the rate will expire and a new quote will be required. We do not guarantee any specific exchange rate outside of the quoted and locked period.
          </p>
          <p className="mt-3">
            Our fees are non-refundable once the transfer has been successfully delivered to the recipient. Fees are separate from any charges that may be imposed by your bank, card issuer, or the recipient&apos;s mobile money provider or bank.
          </p>
        </section>

        {/* 5. Payment Processing */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Payment Processing</h2>
          <p>
            All payments made through the AfriSpine platform are processed by Fincra, a licensed payment service provider. When you enter your card details, you are interacting directly with Fincra&apos;s secure payment infrastructure. AfriSpine does not store, process, or have access to your full card number, CVV, or other sensitive card data.
          </p>
          <p className="mt-3">
            By making a payment through AfriSpine, you also agree to be bound by Fincra&apos;s Terms of Service, which are available on Fincra&apos;s website. Any disputes relating to card charges, payment authorisation, or payment security are governed by Fincra&apos;s terms and applicable payment network rules.
          </p>
        </section>

        {/* 6. Refund Policy */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Refund Policy</h2>
          <p>
            AfriSpine will issue a full refund of your transfer amount (including the service fee) in the following circumstances: the delivery provider fails to deliver funds to the recipient due to a provider-side error; a technical error on our platform or our provider&apos;s system prevents the transfer from being completed; or an incorrect routing decision by AfriSpine results in the transfer being sent to the wrong rail or provider.
          </p>
          <p className="mt-3">
            Refund requests must be submitted within twenty-four (24) hours of the failed or erroneous transfer. Refunds are processed back to the original payment method via Fincra and typically take between five (5) and ten (10) business days to appear in your account, depending on your bank or card issuer&apos;s processing times.
          </p>
          <p className="mt-3">
            AfriSpine will not issue a refund where the transfer has been successfully delivered to the recipient as directed, or where the failure is caused by incorrect information provided by the sender (such as an incorrect phone number or bank account details). If you believe you are entitled to a refund, please contact us at{' '}
            <a href="mailto:support@afri-spine.com" className="text-emerald-600 underline underline-offset-2 hover:text-emerald-700">
              support@afri-spine.com
            </a>.
          </p>
        </section>

        {/* 7. Prohibited Use */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Prohibited Use</h2>
          <p>
            You may not use the AfriSpine service for any purpose that is unlawful, fraudulent, or that facilitates money laundering, terrorist financing, or any other form of financial crime. You may not use the service to send money to or from countries or regions subject to comprehensive sanctions, including but not limited to Iran, the Democratic People&apos;s Republic of Korea (North Korea), Syria, Cuba, Russia, Belarus, Myanmar (Burma), Sudan, Libya, and Somalia.
          </p>
          <p className="mt-3">
            You may not use the service to make business-to-business payments, corporate payments, or payments on behalf of a business entity unless you have a prior written agreement with AfriSpine authorising such use. You may not use the service for any activity that violates applicable laws or regulations in your jurisdiction, the recipient&apos;s jurisdiction, or any intermediate jurisdiction through which the transfer passes.
          </p>
          <p className="mt-3">
            AfriSpine reserves the right to refuse, block, or reverse any transaction that we reasonably suspect is associated with prohibited activity, and we may suspend or terminate your account for violations of this provision.
          </p>
        </section>

        {/* 8. KYC and AML */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">8. KYC and AML</h2>
          <p>
            In compliance with applicable anti-money laundering (AML) and counter-terrorism financing (CTF) regulations, AfriSpine requires all users to complete Know Your Customer (KYC) verification before sending money. KYC verification is conducted through our identity verification partner, Smile Identity, and involves the collection and verification of your legal name, date of birth, and a valid government-issued identification document.
          </p>
          <p className="mt-3">
            AfriSpine screens all users and transactions against applicable sanctions lists, including the United States Office of Foreign Assets Control (OFAC) Specially Designated Nationals (SDN) List, United Nations Security Council consolidated sanctions lists, and European Union sanctions lists. In cases where a potential match is identified, the transaction will be placed on hold and referred for manual review by our compliance team.
          </p>
          <p className="mt-3">
            AfriSpine reserves the right to decline to onboard a user, refuse a transaction, or terminate an account if the results of KYC verification or sanctions screening are unsatisfactory or if we are unable to verify the user&apos;s identity to our satisfaction.
          </p>
        </section>

        {/* 9. Limitation of Liability */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, AfriSpine&apos;s total liability arising out of or in connection with these Terms or your use of the service shall not exceed the total amount of the specific transfer giving rise to the claim. In no event shall AfriSpine be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, loss of data, or loss of business opportunity, regardless of the theory of liability.
          </p>
          <p className="mt-3">
            AfriSpine is not liable for any failure, delay, or error caused by our delivery providers, payment processors, telecommunications providers, or any other third-party service used in the delivery of your transfer. While we carefully vet all providers in our network, the final delivery of funds is the responsibility of the licensed provider executing the payout.
          </p>
        </section>

        {/* 10. Governing Law */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Governing Law</h2>
          <p>
            These Terms of Service are governed by and construed in accordance with the laws of the Republic of Kenya, without regard to its conflict of laws provisions. Any dispute arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of Nairobi, Kenya.
          </p>
        </section>

        {/* 11. Contact */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">11. Contact</h2>
          <p>
            If you have any questions or concerns about these Terms of Service, please contact us at:
          </p>
          <div className="mt-3 rounded-lg bg-gray-50 p-4 text-sm">
            <p className="font-medium text-gray-900">AfriSpine Ltd</p>
            <p>Nairobi, Kenya</p>
            <p>
              Email:{' '}
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