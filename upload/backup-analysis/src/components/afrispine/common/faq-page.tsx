'use client';

import React from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft } from 'lucide-react';

const faqs = [
  {
    question: 'Is AfriSpine available in the US?',
    answer:
      'Yes. Any US cardholder can send money to Africa using AfriSpine. Cards are charged in USD.',
  },
  {
    question: 'How does AfriSpine compare to Western Union?',
    answer:
      'AfriSpine charges 1.5% with no hidden fees. Traditional providers often charge 3–8% plus FX spread.',
  },
  {
    question: 'Is my money safe?',
    answer:
      'Your payment is processed by Paystack (owned by Stripe, valued at $95B). AfriSpine never holds your money.',
  },
  {
    question: 'What countries can I send to?',
    answer:
      'Kenya (M-Pesa), Nigeria (Bank Transfer), Ghana (MTN MoMo), Uganda, Tanzania, and South Africa.',
  },
  {
    question: 'How long does a transfer take?',
    answer:
      'Most transfers to mobile money (M-Pesa, MTN) arrive within 30 minutes. Bank transfers take 1–2 hours.',
  },
  {
    question: 'What are the fees?',
    answer:
      'Flat 1.5% fee. The rate is locked for 15 minutes. No hidden charges.',
  },
  {
    question: 'Can I pay bills for family in Africa?',
    answer:
      'Yes! You can pay KPLC electricity, Nairobi Water, DStv/GOtv subscriptions, and airtime top-ups directly from the diaspora.',
  },
  {
    question: 'Does AfriSpine offer business/corporate FX?',
    answer:
      'Yes. AfriSpine Business offers corporate FX from $5,000 at 0.5–1% margin with same-day settlement. Visit /business for details.',
  },
];

export function FaqPage() {
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

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
        Frequently Asked Questions
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Everything you need to know about sending money with AfriSpine
      </p>

      <div className="mt-8">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-sm font-medium text-gray-900 hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Bottom CTA */}
      <div className="mt-12 rounded-xl border border-border/60 bg-gray-50/50 p-6 text-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Still have questions?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Our support team is available to help you 24/7.
        </p>
        <Button
          onClick={() => navigate('contact')}
          className="mt-4 bg-emerald-600 text-white hover:bg-emerald-700"
        >
          Contact Support
        </Button>
      </div>
    </div>
  );
}