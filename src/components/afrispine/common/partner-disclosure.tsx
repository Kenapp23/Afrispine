'use client';

import { ShieldCheck } from 'lucide-react';

interface PartnerDisclosureProps {
  variant?: 'inline' | 'card' | 'banner';
  className?: string;
}

export function PartnerDisclosure({ variant = 'inline', className = '' }: PartnerDisclosureProps) {
  if (variant === 'card') {
    return (
      <div className={`rounded-lg border border-amber-200 bg-amber-50/50 p-3 ${className}`}>
        <div className="flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800 leading-relaxed">
            Payments and investment services are processed by AfriSpine's regulated partners. AfriSpine does not hold, custody, or execute transactions directly.
          </p>
        </div>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`border-t border-amber-200 bg-amber-50/30 px-4 py-2 ${className}`}>
        <p className="text-center text-[11px] text-amber-700">
          <ShieldCheck className="inline h-3 w-3 mr-1 -mt-0.5" />
          Payments and investments are processed by AfriSpine's regulated partners. AfriSpine is a non-custodial platform.
        </p>
      </div>
    );
  }

  // inline (default)
  return (
    <p className={`text-[11px] text-muted-foreground leading-relaxed ${className}`}>
      <ShieldCheck className="inline h-3 w-3 mr-1 -mt-0.5" />
      Processed by AfriSpine's regulated partners. AfriSpine does not hold or execute transactions.
    </p>
  );
}
