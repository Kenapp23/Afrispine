'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Copy, Check, X, Play, Pause, MonitorPlay,
  Wifi, WifiOff, Loader2, MessageCircle,
} from 'lucide-react';
import { useAppStore } from '@/stores/app';
import {
  joinRealtimeRoom,
  realtimeReady,
  makePlayEvent,
  makePauseEvent,
  makeSeekEvent,
  makeHeartbeatEvent,
  makeSyncRequestEvent,
  makeSyncResponseEvent,
  type PartyEvent,
} from '@/lib/supabase-realtime';

interface WatchPartyOverlayProps {
  roomCode: string;
  videoId: string;
  isHost: boolean;
  userId: string;
  onClose?: () => void;
}

export function WatchPartyOverlay({ roomCode, videoId, isHost, userId, onClose }: WatchPartyOverlayProps) {
  const navigate = useAppStore((s) => s.navigate);
  const channelRef = useRef<ReturnType<typeof joinRealtimeRoom> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const memberCountRef = useRef(1);
  // Refs for playback state used inside intervals (avoids re-subscribing)
  const isPlayingRef = useRef(false);
  const playbackSecondsRef = useRef(0);

  const [memberCount, setMemberCount] = useState(1);
  const [connected, setConnected] = useState(realtimeReady);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSeconds, setPlaybackSeconds] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);

  // Keep refs in sync with state
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { playbackSecondsRef.current = playbackSeconds; }, [playbackSeconds]);

  // ─── Supabase Realtime connection ─────────────────────────
  useEffect(() => {
    const { channel, send, connected: rtConnected } = joinRealtimeRoom(roomCode, {
      onEvent: (event: PartyEvent) => {
        switch (event.type) {
          case 'play':
            setIsPlaying(true);
            setPlaybackSeconds(event.payload.playbackSeconds ?? 0);
            window.dispatchEvent(new CustomEvent('watch-party-sync', {
              detail: { isPlaying: true, playbackSeconds: event.payload.playbackSeconds ?? 0 },
            }));
            break;

          case 'pause':
            setIsPlaying(false);
            setPlaybackSeconds(event.payload.playbackSeconds ?? 0);
            window.dispatchEvent(new CustomEvent('watch-party-sync', {
              detail: { isPlaying: false, playbackSeconds: event.payload.playbackSeconds ?? 0 },
            }));
            break;

          case 'seek':
            setPlaybackSeconds(event.payload.playbackSeconds ?? 0);
            window.dispatchEvent(new CustomEvent('watch-party-seek', {
              detail: { playbackSeconds: event.payload.playbackSeconds ?? 0 },
            }));
            break;

          case 'heartbeat':
            if (event.payload.count !== undefined) {
              memberCountRef.current = event.payload.count;
              setMemberCount(event.payload.count);
            }
            break;

          case 'sync-request': {
            if (isHost) {
              send(makeSyncResponseEvent(roomCode, userId, isPlayingRef.current, playbackSecondsRef.current, memberCountRef.current));
            }
            break;
          }

          case 'sync-response': {
            if (!isHost && event.userId !== userId) {
              setIsPlaying(event.payload.isPlaying ?? false);
              setPlaybackSeconds(event.payload.playbackSeconds ?? 0);
              if (event.payload.count !== undefined) {
                memberCountRef.current = event.payload.count;
                setMemberCount(event.payload.count);
              }
              window.dispatchEvent(new CustomEvent('watch-party-sync', {
                detail: { isPlaying: event.payload.isPlaying ?? false, playbackSeconds: event.payload.playbackSeconds ?? 0 },
              }));
            }
            break;
          }

          case 'member-join':
            if (event.payload.count !== undefined) {
              memberCountRef.current = event.payload.count;
              setMemberCount(event.payload.count);
            }
            break;
        }
      },
      onStatusChange: (status) => {
        setConnected(status === 'SUBSCRIBED');
      },
    });

    channelRef.current = { channel, send, connected: rtConnected };

    // Non-host requests sync from host
    if (rtConnected && !isHost) {
      setTimeout(() => {
        send(makeSyncRequestEvent(roomCode, userId));
      }, 500);
    }

    // Heartbeat every 15s — poll member count from REST API and broadcast
    heartbeatRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/watch-party/room?roomCode=${roomCode}`);
        if (res.ok) {
          const data = await res.json();
          const count = data.memberCount || 1;
          memberCountRef.current = count;
          setMemberCount(count);
          if (rtConnected) {
            send(makeHeartbeatEvent(roomCode, userId, count));
          }
        }
      } catch { /* non-critical */ }
    }, 15000);

    // Persist playback state to DB periodically (host only)
    let syncInterval: ReturnType<typeof setInterval> | null = null;
    if (isHost) {
      syncInterval = setInterval(async () => {
        try {
          await fetch('/api/watch-party/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomCode, isPlaying: isPlayingRef.current, playbackSeconds: playbackSecondsRef.current }),
          });
        } catch { /* non-critical */ }
      }, 5000);
    }

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (syncInterval) clearInterval(syncInterval);
      if (channel) {
        channel.unsubscribe();
      }
      channelRef.current = null;
    };
  }, [roomCode, userId, isHost]);

  // ─── Host controls ──────────────────────────────────────
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    window.dispatchEvent(new CustomEvent('watch-party-sync', {
      detail: { isPlaying: true, playbackSeconds },
    }));
    channelRef.current?.send(makePlayEvent(roomCode, userId, playbackSeconds));
  }, [roomCode, userId, playbackSeconds]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    window.dispatchEvent(new CustomEvent('watch-party-sync', {
      detail: { isPlaying: false, playbackSeconds },
    }));
    channelRef.current?.send(makePauseEvent(roomCode, userId, playbackSeconds));
  }, [roomCode, userId, playbackSeconds]);

  const handleSeek = useCallback((seconds: number) => {
    setPlaybackSeconds(seconds);
    window.dispatchEvent(new CustomEvent('watch-party-seek', {
      detail: { playbackSeconds: seconds },
    }));
    channelRef.current?.send(makeSeekEvent(roomCode, userId, seconds));
  }, [roomCode, userId]);

  // ─── Copy room code ─────────────────────────────────────
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopiedCode(true);
      toast.success('Room code copied!');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  // ─── WhatsApp share ─────────────────────────────────────
  const shareWhatsApp = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${baseUrl}/#watch-party?roomCode=${roomCode}`;
    const text = `Join my watch party on AfriSpine! ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // ─── Navigate to lobby ──────────────────────────────────
  const goToLobby = () => {
    navigate('watch-party', { roomCode, videoId });
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="absolute top-20 right-3 z-40 w-72 rounded-2xl bg-gray-900/95 backdrop-blur-md border border-emerald-500/30 shadow-2xl shadow-emerald-500/10 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-4 pt-4 pb-3">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MonitorPlay className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Watch Party</h3>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${connected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {connected ? <Wifi className="h-2.5 w-2.5" /> : <WifiOff className="h-2.5 w-2.5" />}
                {connected ? 'Live' : (realtimeReady ? 'Reconnecting' : 'Offline')}
              </div>
              {onClose && (
                <button onClick={onClose} className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                  <X className="h-3.5 w-3.5 text-white/60" />
                </button>
              )}
            </div>
          </div>

          {/* Member count */}
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[11px] gap-1">
              <Users className="h-3 w-3" />
              {memberCount} watching{memberCount > 1 ? ` with you` : ''}
            </Badge>
            {isHost && (
              <Badge variant="secondary" className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px]">
                Host
              </Badge>
            )}
          </div>
        </div>

        {/* Room code */}
        <div className="px-4 py-2">
          <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2">
            <span className="text-xs text-white/50">Code</span>
            <span className="flex-1 text-lg font-mono font-bold tracking-widest text-emerald-400">{roomCode}</span>
            <button onClick={copyCode} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">
              {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-white/50" />}
            </button>
          </div>
        </div>

        {/* Playback controls (host only) */}
        {isHost && (
          <div className="px-4 py-2">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={isPlaying ? handlePause : handlePlay}
                className="h-8 w-8 rounded-full bg-emerald-600 hover:bg-emerald-500 p-0"
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
              </Button>
              <span className="text-xs font-mono text-white/60">{formatTime(playbackSeconds)}</span>
              <button
                onClick={() => handleSeek(Math.max(0, playbackSeconds - 10))}
                className="ml-auto h-7 px-2 rounded-lg bg-white/5 text-white/50 text-[10px] font-medium hover:bg-white/10 transition-colors"
              >-10s</button>
              <button
                onClick={() => handleSeek(playbackSeconds + 10)}
                className="h-7 px-2 rounded-lg bg-white/5 text-white/50 text-[10px] font-medium hover:bg-white/10 transition-colors"
              >+10s</button>
            </div>
          </div>
        )}

        {/* Sync status for members */}
        {!isHost && (
          <div className="px-4 py-2">
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
              <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />
              <span className="text-[11px] font-medium text-emerald-400">
                {isPlaying ? `Synced at ${formatTime(playbackSeconds)}` : 'Waiting for host...'}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-4 pb-4 pt-2 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={shareWhatsApp}
            className="flex-1 h-8 text-white/70 hover:text-white hover:bg-white/10 gap-1.5 text-xs"
          >
            <MessageCircle className="h-3.5 w-3.5 text-green-500" />
            Share
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToLobby}
            className="flex-1 h-8 text-white/70 hover:text-white hover:bg-white/10 gap-1.5 text-xs"
          >
            <Users className="h-3.5 w-3.5 text-emerald-400" />
            Lobby
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
