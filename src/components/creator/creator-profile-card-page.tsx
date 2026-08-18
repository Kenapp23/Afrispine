'use client';

import { useAppStore } from '@/stores/app';
import { CreatorProfileCard } from './creator-profile-card';

/**
 * SPA wrapper for the Creator Profile Card.
 * Expects viewParams.handle (or ?handle=xxx in hash) to be set.
 * Supports viewParams.mode = 'fan' | 'brand' | 'booking'.
 */
export function CreatorProfileCardPage() {
  const viewParams = useAppStore((s) => s.viewParams);
  const handle = viewParams?.handle || '';
  const mode = (viewParams?.mode as 'fan' | 'brand' | 'booking') || 'fan';

  if (!handle) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-zinc-400 text-lg">No creator handle specified.</p>
          <a
            href="#watch"
            className="inline-block text-emerald-500 hover:text-emerald-400 underline"
          >
            Discover creators
          </a>
        </div>
      </div>
    );
  }

  return <CreatorProfileCard handle={handle} mode={mode} />;
}
