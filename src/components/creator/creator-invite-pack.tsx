'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Share2, Copy, Check, Download, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CreatorInvitePackProps {
  creatorHandle: string;
  creatorName: string;
  referralCode?: string;
}

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || 'https://www.afri-spine.com';

export function CreatorInvitePack({
  creatorHandle,
  creatorName,
  referralCode,
}: CreatorInvitePackProps) {
  const [copied, setCopied] = useState(false);

  const profileUrl = referralCode
    ? `${BASE_URL}/c/profile?handle=${encodeURIComponent(creatorHandle)}&ref=${encodeURIComponent(referralCode)}`
    : `${BASE_URL}/c/profile?handle=${encodeURIComponent(creatorHandle)}`;

  const handleWhatsApp = useCallback(() => {
    const message = `Check out ${creatorName} on AfriSpine! ${profileUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }, [creatorName, profileUrl]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success('Profile link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  }, [profileUrl]);

  const handleDownloadPoster = useCallback(() => {
    // For now, open the profile URL so the creator can save the page as a reference.
    // A future enhancement could use html2canvas to render the profile card as an image.
    window.open(profileUrl, '_blank', 'noopener,noreferrer');
  }, [profileUrl]);

  return (
    <Card className="border-gray-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Share2 className="h-5 w-5 text-emerald-600" />
          Share Your Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500 mb-4">
          Grow your audience — share your AfriSpine profile with one tap.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {/* WhatsApp */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
            onClick={handleWhatsApp}
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>

          {/* Copy Link */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            onClick={handleCopyLink}
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>

          {/* Download Poster */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            onClick={handleDownloadPoster}
          >
            <Download className="h-4 w-4" />
            Download Poster
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
