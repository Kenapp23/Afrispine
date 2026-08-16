'use client';

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Copy, MessageCircle, X, Share2, Download } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────

interface AchievementCardProps {
  /** New prop name */
  cardType?: string;
  /** New prop name */
  cardData?: Record<string, string>;
  /** Legacy prop name (backward compat) */
  type?: string;
  /** Legacy prop name (backward compat) */
  data?: Record<string, string>;
  visible: boolean;
  onClose: () => void;
}

// ─── Share text generators per card type ───────────────────────

function getShareText(type: string, data: Record<string, string>): string {
  const COUNTRY_NAMES: Record<string, string> = {
    NG: 'Nigeria', KE: 'Kenya', GH: 'Ghana', ZA: 'South Africa', TZ: 'Tanzania', UG: 'Uganda',
  };
  const CURRENCY_SYM: Record<string, string> = {
    GBP: '\u00A3', USD: '$', KES: 'KSh', NGN: '\u20A6', GHS: 'GH\u00A2', ZAR: 'R',
  };

  switch (type) {
    case 'stock_purchase':
    case 'first_investment': {
      const company = data.companyName || data.stock || 'a company';
      const country = data.stockCountry ? ` (${COUNTRY_NAMES[data.stockCountry] || data.stockCountry})` : '';
      return `I just bought shares in ${company}${country} via @AfriSpine! Investing in Africa's future.`;
    }
    case 'first_send': {
      const sym = CURRENCY_SYM[data.currency || 'GBP'] || '';
      const countryName = COUNTRY_NAMES[data.country || ''] || data.country || 'home';
      return `I just sent ${sym}${data.amount} to ${countryName} via @AfriSpine. Fast, affordable transfers to Africa!`;
    }
    case 'ipo_registration':
    case 'ipo_registered': {
      const name = data.ipoName || data.ipo || 'an upcoming IPO';
      return `I'm registered for the ${name} IPO via @AfriSpine! Don't miss out.`;
    }
    case 'savings_milestone': {
      const parts: string[] = [];
      if (data.totalSent && data.totalSent !== '0') parts.push(`\u00A3${data.totalSent} sent`);
      if (data.totalInvested && data.totalInvested !== '0') parts.push(`\u00A3${data.totalInvested} invested`);
      if (data.totalSaved && data.totalSaved !== '0') parts.push(`\u00A3${data.totalSaved} saved`);
      const stats = parts.length > 0 ? `: ${parts.join(', ')}` : '';
      return `My AfriSpine milestone${stats}. Building wealth across Africa with @AfriSpine!`;
    }
    case 'dividend_received': {
      const company = data.companyName || 'an African company';
      return `${company} just paid me a dividend of ${data.amount}! African stocks pay real returns via @AfriSpine.`;
    }
    default:
      return 'Check out AfriSpine — the smartest way to transfer money and explore African markets!';
  }
}

// ─── Component ─────────────────────────────────────────────────

export function AchievementCard({
  cardType,
  cardData,
  type,
  data,
  visible,
  onClose,
}: AchievementCardProps) {
  const [copying, setCopying] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Resolve props — new names take precedence, fall back to legacy
  const resolvedType = cardType || type || 'stock_purchase';
  const resolvedData = cardData || data || {};

  // Build the card URL with individual query params (not JSON blob)
  const cardUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set('type', resolvedType);
    for (const [key, value] of Object.entries(resolvedData)) {
      if (value !== undefined && value !== '') {
        params.set(key, value);
      }
    }
    return `/api/share/card?${params.toString()}`;
  }, [resolvedType, resolvedData]);

  const shareText = useMemo(
    () => getShareText(resolvedType, resolvedData),
    [resolvedType, resolvedData],
  );

  const shareUrl = 'https://www.afri-spine.com';

  // ─── Handlers ──────────────────────────────────────────────

  const handleWebShare = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'AfriSpine Achievement',
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or API failed, fall through to WhatsApp
      }
    }
    // Fallback to WhatsApp
    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
      '_blank',
    );
  }, [shareText, shareUrl]);

  function handleWhatsApp() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
      '_blank',
    );
  }

  function handleX() {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      '_blank',
    );
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setCopying(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopying(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      // Use html2canvas-like approach: render card in a hidden iframe and capture
      // Since we don't have html2canvas, we open the card URL in a new tab for screenshot
      const win = window.open(cardUrl, '_blank');
      if (win) {
        // Brief delay then show instructions
        setTimeout(() => {
          toast.info('Right-click or long-press the card to save as image', {
            duration: 4000,
          });
        }, 1000);
      } else {
        toast.error('Pop-up blocked — please allow pop-ups to download the card');
      }
    } catch {
      toast.error('Failed to open card for download');
    } finally {
      setTimeout(() => setDownloading(false), 1500);
    }
  }

  const canWebShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden rounded-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Achievement Unlocked</DialogTitle>
        </DialogHeader>

        {/* Card Preview */}
        <div className="relative w-full bg-gray-950 rounded-t-xl">
          <iframe
            src={cardUrl}
            className="w-full border-0"
            style={{ height: '420px' }}
            title="Achievement Card"
            sandbox="allow-same-origin allow-scripts allow-popups"
          />
        </div>

        {/* Share Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 bg-white border-t border-gray-100 rounded-b-xl">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Share2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground font-medium truncate">
              Share your achievement
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* WhatsApp — uses Web Share on mobile, direct link on desktop */}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800"
              onClick={canWebShare ? handleWebShare : handleWhatsApp}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </Button>

            {/* X / Twitter */}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleX}
            >
              <X className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">X</span>
            </Button>

            {/* Copy Link */}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleCopy}
              disabled={copying}
            >
              <Copy className="h-3.5 w-3.5" />
              {copying ? 'Copied!' : 'Copy Link'}
            </Button>

            {/* Download / Save */}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleDownload}
              disabled={downloading}
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{downloading ? 'Opening...' : 'Download'}</span>
            </Button>

            {/* Close */}
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}