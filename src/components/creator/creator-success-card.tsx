'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/stores/app';
import {
  FileText,
  ImageIcon,
  Video,
  Tag,
  MapPin,
  Wallet,
  Globe,
  ChevronRight,
  Loader2,
  Sparkles,
} from 'lucide-react';

/* -- Types ----------------------------------------------- */

interface StrengthChecks {
  hasBio: boolean;
  hasAvatar: boolean;
  hasVideo: boolean;
  hasCategory: boolean;
  hasLocation: boolean;
  hasPayoutNumber: boolean;
  isPublished: boolean;
}

interface SuggestedAction {
  key: string;
  label: string;
  description: string;
  action: string;
}

interface StrengthData {
  creatorId: string;
  score: number;
  checks: StrengthChecks;
  videoCount: number;
  suggestedActions: SuggestedAction[];
}

/* -- Helpers ----------------------------------------------- */

const ICON_MAP: Record<string, React.ReactNode> = {
  bio: <FileText className="h-4 w-4" />,
  avatar: <ImageIcon className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
  category: <Tag className="h-4 w-4" />,
  location: <MapPin className="h-4 w-4" />,
  publish: <Globe className="h-4 w-4" />,
  incomplete: <Sparkles className="h-4 w-4" />,
};

function getScoreColor(score: number) {
  if (score < 40) return { ring: 'text-red-500', bg: 'bg-red-50', text: 'text-red-700', track: 'stroke-red-100' };
  if (score < 70) return { ring: 'text-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', track: 'stroke-amber-100' };
  return { ring: 'text-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', track: 'stroke-emerald-100' };
}

function getScoreLabel(score: number) {
  if (score === 100) return 'Complete!';
  if (score >= 80) return 'Almost there';
  if (score >= 40) return 'Getting started';
  return 'Just beginning';
}

/* -- Circular Progress Ring ----------------------------------------------- */

function ProgressRing({ score, size = 96 }: { score: number; size?: number }) {
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const colors = getScoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        className="-rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={colors.track}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={`${colors.ring} transition-all duration-700 ease-out`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-xl font-extrabold ${colors.text}`}>{score}%</span>
      </div>
    </div>
  );
}

/* -- Check Indicators ----------------------------------------------- */

const CHECK_LABELS: { key: keyof StrengthChecks; label: string }[] = [
  { key: 'hasBio', label: 'Bio' },
  { key: 'hasAvatar', label: 'Avatar' },
  { key: 'hasVideo', label: 'Video' },
  { key: 'hasCategory', label: 'Category' },
  { key: 'hasLocation', label: 'Location' },
  { key: 'hasPayoutNumber', label: 'Payout' },
  { key: 'isPublished', label: 'Published' },
];

function CheckIndicator({ checks }: { checks: StrengthChecks }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
      {CHECK_LABELS.map(({ key, label }) => {
        const done = checks[key];
        return (
          <div
            key={key}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
              done
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-gray-50 text-gray-400'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                done ? 'bg-emerald-500' : 'bg-gray-300'
            }`}
            />
            {label}
          </div>
        );
      })}
    </div>
  );
}

/* -- Main Component ----------------------------------------------- */

export function CreatorSuccessCard({ creatorId }: { creatorId: string }) {
  const navigate = useAppStore((s) => s.navigate);
  const [data, setData] = useState<StrengthData | null>(null);
  const [loading, setLoading] = useState(!!creatorId);

  useEffect(() => {
    if (!creatorId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/creator/strength?creatorId=${encodeURIComponent(creatorId)}`);
        if (res.ok && !cancelled) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // Silently fail
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [creatorId]);

  if (!creatorId) return null;

  if (loading) {
    return (
      <Card className="border-gray-100">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const colors = getScoreColor(data.score);

  return (
    <Card className="border-gray-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-600" />
          Creator Success
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left: Score ring + checks */}
          <div className="flex flex-col items-center md:items-start gap-2 md:min-w-[200px]">
            <ProgressRing score={data.score} />
            <p className={`text-xs font-medium ${colors.text}`}>
              {getScoreLabel(data.score)}
            </p>
            <p className="text-[11px] text-gray-400">
              {data.videoCount} live {data.videoCount === 1 ? 'video' : 'videos'}
            </p>
            <CheckIndicator checks={data.checks} />
          </div>

          {/* Right: Suggested actions */}
          <div className="flex-1 min-w-0">
            {data.suggestedActions.length > 0 ? (
              <>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Suggested next steps
                </p>
                <div className="space-y-2">
                  {data.suggestedActions.map((action) => (
                    <button
                      key={action.key}
                      onClick={() => {
                        if (action.action === 'watch') {
                          navigate('watch');
                        } else {
                          navigate('creator-profile');
                        }
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-emerald-50 hover:border-emerald-200 transition-colors text-left group"
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors.bg} ${colors.text}`}>
                        {ICON_MAP[action.key] || <Sparkles className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 group-hover:text-emerald-700 transition-colors">
                          {action.label}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {action.description}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-emerald-500 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 mb-2">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="text-sm font-semibold text-emerald-700">All set!</p>
                <p className="text-xs text-gray-500 mt-1">Your profile is complete. Keep creating great content!</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
