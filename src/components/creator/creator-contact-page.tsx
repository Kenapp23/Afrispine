'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/app';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Menu,
  X,
} from 'lucide-react';

export function CreatorContactPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const contactCards = [
    {
      icon: Mail,
      label: 'Email',
      value: 'info@afri-spine.com',
      href: 'mailto:info@afri-spine.com',
    },
    {
      icon: Phone,
      label: 'Phone',
      value: '+254 713 014 190',
      href: 'tel:+254713014190',
    },
    {
      icon: MapPin,
      label: 'Location',
      value: 'Nairobi, Kenya',
      href: undefined,
    },
  ];

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

          {/* Desktop nav */}
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
              className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors"
            >
              Privacy
            </button>
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-emerald-600 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu panel */}
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
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          {/* Heading */}
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
              Get in Touch
            </h1>
            <p className="mt-3 text-gray-500 max-w-md mx-auto">
              Have a question, partnership inquiry, or feedback? We&rsquo;d love to hear from you.
            </p>
          </div>

          {/* Contact Info Cards */}
          <div className="grid gap-4 sm:grid-cols-3 mb-14">
            {contactCards.map((card) => {
              const Wrapper = card.href ? 'a' : 'div';
              return (
                <Wrapper
                  key={card.label}
                  {...(card.href ? { href: card.href } : {})}
                  className="group flex flex-col items-center text-center gap-3 rounded-2xl border border-gray-100 bg-white p-6 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-600/5 transition-all"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <card.icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
                    {card.label}
                  </span>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                    {card.value}
                  </span>
                </Wrapper>
              );
            })}
          </div>

          {/* Contact Form */}
          <div className="mx-auto max-w-xl">
            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Send Us a Message</h2>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setName('');
                  setEmail('');
                  setMessage('');
                }}
                className="space-y-5"
              >
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    required
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
                  />
                </div>

                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow"
                  />
                </div>

                <div>
                  <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us how we can help..."
                    required
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-5 shadow-lg shadow-emerald-600/20"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Submit
                </Button>
              </form>
            </div>
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
                className="text-sm text-gray-400 hover:text-emerald-600 transition-colors"
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
