'use client';

import React, { useState } from 'react';
import { Copy, MessageCircle, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface ReferralShareProps {
  referralCode: string;
  message?: string;
  compact?: boolean;
  className?: string;
}
function getBaseUrl(): string {
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}
function buildShareLink(code: string): string {
  return getBaseUrl() + '/signup?ref=' + code;
}
function buildWhatsAppUrl(link: string, message: string): string {
  const text = encodeURIComponent(message + ' ' + link);
  return 'https://wa.me/?text=' + text;
}
function buildFacebookUrl(link: string): string {
  return 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(link);
}
function buildTwitterUrl(link: string, message: string): string {
  return 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(message) + '&url=' + encodeURIComponent(link);
}

export function ReferralShareButtons({ referralCode, message, compact, className }: ReferralShareProps) {
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const link = buildShareLink(referralCode);
  const defaultMsg = message || 'Join me on AfriSpine — the easiest way to send money and gift cards to Africa!';
  const waUrl = buildWhatsAppUrl(link, defaultMsg);
  const fbUrl = buildFacebookUrl(link);
  const twUrl = buildTwitterUrl(link, defaultMsg);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  if (dismissed) return null;

  if (compact) {
    return (
      <div className={'flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm ' + (className || '')}>
        <MessageCircle className="h-4 w-4 text-emerald-600 shrink-0" />
        <span className="text-emerald-800 flex-1">Know someone else sending money home?</span>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full bg-green-600 text-white text-xs font-medium px-3 py-1 hover:bg-green-700 transition-colors shrink-0"
        >
          Share via WhatsApp
        </a>
        <button onClick={() => setDismissed(true)} className="text-emerald-400 hover:text-emerald-600 shrink-0">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className={'rounded-xl border border-gray-200 bg-white ' + (className || '')}>
      <div className="p-5 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Refer a friend</h3>
          <p className="text-sm text-muted-foreground mt-1">Share your link and help others discover AfriSpine.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg bg-gray-50 border border-gray-200 px-4 py-2.5 font-mono text-sm font-semibold text-gray-900 tracking-wider">
            {referralCode}
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
        <div className="flex gap-2">
          <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-600 text-white text-sm font-medium px-4 py-2.5 hover:bg-green-700 transition-colors">
            <span>WhatsApp</span>
          </a>
          <a href={fbUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2.5 hover:bg-blue-700 transition-colors">
            <span>Facebook</span>
          </a>
          <a href={twUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gray-900 text-white text-sm font-medium px-4 py-2.5 hover:bg-gray-800 transition-colors">
            <span>X</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export function IpoReferralShare({ referralCode, className }: { referralCode: string; className?: string }) {
  const link = buildShareLink(referralCode);
  const ipoMsg = 'I just registered for the Dangote Refinery IPO through AfriSpine — you can too!';
  const waUrl = buildWhatsAppUrl(link, ipoMsg);

  return (
    <div className={'flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm ' + (className || '')}>
      <MessageCircle className="h-4 w-4 text-emerald-600 shrink-0" />
      <span className="text-emerald-800 flex-1">Tell a friend about the Dangote IPO</span>
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded-full bg-green-600 text-white text-xs font-medium px-3 py-1 hover:bg-green-700 transition-colors shrink-0"
      >
        Share via WhatsApp
      </a>
    </div>
  );
}
