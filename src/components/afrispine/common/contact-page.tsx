'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/stores/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Mail, Clock, Building2, MapPin } from 'lucide-react';

const subjectOptions = [
  { value: 'general', label: 'General' },
  { value: 'transfer-issue', label: 'Transfer Issue' },
  { value: 'refund-request', label: 'Refund Request' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'business', label: 'Business' },
];

export function ContactPage() {
  const navigate = useAppStore((s) => s.navigate);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) return;
    setSending(true);
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      setSent(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch {
      // silent fail for UI-only form
    } finally {
      setSending(false);
    }
  };

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

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Contact AfriSpine</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        We&apos;re here to help. Reach out to the right team below or send us a message.
      </p>

      {/* Contact cards */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/60 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
              <Mail className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Customer Support</h3>
              <a
                href="mailto:support@afri-spine.com"
                className="text-sm text-emerald-600 hover:text-emerald-700"
              >
                support@afri-spine.com
              </a>
            </div>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Response within 24 hours
          </p>
        </div>

        <div className="rounded-xl border border-border/60 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
              <Building2 className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Compliance &amp; Legal</h3>
              <div className="text-sm text-muted-foreground">
                <a
                  href="mailto:compliance@afri-spine.com"
                  className="text-emerald-600 hover:text-emerald-700"
                >
                  compliance@afri-spine.com
                </a>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            <a
              href="mailto:legal@afri-spine.com"
              className="text-emerald-600 hover:text-emerald-700"
            >
              legal@afri-spine.com
            </a>
          </p>
        </div>

        <div className="rounded-xl border border-border/60 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
              <Mail className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Business Enquiries</h3>
              <a
                href="mailto:business@afri-spine.com"
                className="text-sm text-emerald-600 hover:text-emerald-700"
              >
                business@afri-spine.com
              </a>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
              <MapPin className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Registered Address</h3>
              <p className="text-sm text-muted-foreground">AfriSpine Ltd, Nairobi, Kenya</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact form */}
      <div className="mt-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Send us a message</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Fill out the form below and we&apos;ll get back to you as soon as possible.
        </p>

        {sent && (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            Thank you! Your message has been sent. We&apos;ll respond within 24 hours.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="contact-name" className="text-sm font-medium text-gray-700">
                Name
              </label>
              <Input
                id="contact-name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="contact-email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                id="contact-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="contact-subject" className="text-sm font-medium text-gray-700">
              Subject
            </label>
            <Select value={subject} onValueChange={setSubject} required>
              <SelectTrigger id="contact-subject">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjectOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="contact-message" className="text-sm font-medium text-gray-700">
              Message
            </label>
            <Textarea
              id="contact-message"
              placeholder="Tell us how we can help..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
            />
          </div>

          <Button
            type="submit"
            disabled={sending || !name || !email || !subject || !message}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </form>
      </div>
    </div>
  );
}