'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Copy, Check, X, Play, Pause, MonitorPlay,
  Share2, Wifi, WifiOff, Loader2, MessageCircle,
} from 'lucide-react';
import { useAppStore } from '@/stores/app';

interface WatchPartyOverlayProps {
  roomCode: string;
  videoId: string;
  isHost: boolean;
  userId: string;
  onClose?: () => void;
}

export function WatchPartyOverlay({ roomCode, videoId, isHost, userId, onClose }: WatchPartyOverlayProps) {
  const navigate = useAppStore((s) => s.navigate);
  const socketRef = useRef<Socket | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [memberCount, setMemberCount] = useState(1);
  const [connected, setConnected] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSeconds, setPlaybackSeconds] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);

  // ─── Socket connection ───────────────────────────────────
  useEffect(() => {
    const socket = io('/?XTransformPort=3005', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-room', { roomCode, userId });
      socket.emit('sync-request', { roomCode });
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('connect_error', () => {
      setConnected(false);
    });

    socket.on('member-count', (data: { count: number }) => {
      setMemberCount(data.count);
    });

    socket.on('play-state', (data: { isPlaying: boolean; playbackSeconds: number }) => {
      setIsPlaying(data.isPlaying);
      setPlaybackSeconds(data.playbackSeconds);
      // Dispatch a custom event so the watch page can sync video playback
      window.dispatchEvent(new CustomEvent('watch-party-sync', {
        detail: { isPlaying: data.isPlaying, playbackSeconds: data.playbackSeconds },
      }));
    });

    socket.on('seek', (data: { playbackSeconds: number }) => {
      setPlaybackSeconds(data.playbackSeconds);
      window.dispatchEvent(new CustomEvent('watch-party-seek', {
        detail: { playbackSeconds: data.playbackSeconds },
      }));
    });

    socket.on('error', (data: { message: string }) => {
      toast.error(data.message);
    });

    // Heartbeat every 15s
    heartbeatRef.current = setInterval(() => {
      if (socket.connected) {
        socket.emit('heartbeat', { roomCode, userId });
      }
    }, 15000);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      socket.emit('leave-room', { roomCode, userId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomCode, userId]);

  // ─── Host controls ──────────────────────────────────────
  const handlePlay = useCallback(() => {
    socketRef.current?.emit('play', { roomCode, seconds: playbackSeconds });
    setIsPlaying(true);
    window.dispatchEvent(new CustomEvent('watch-party-sync', {
      detail: { isPlaying: true, playbackSeconds },
    }));
  }, [roomCode, playbackSeconds]);

  const handlePause = useCallback(() => {
    socketRef.current?.emit('pause', { roomCode, seconds: playbackSeconds });
    setIsPlaying(false);
    window.dispatchEvent(new CustomEvent('watch-party-sync', {
      detail: { isPlaying: false, playbackSeconds },
    }));
  }, [roomCode, playbackSeconds]);

  const handleSeek = useCallback((seconds: number) => {
    socketRef.current?.emit('seek', { roomCode, seconds });
    setPlaybackSeconds(seconds);
    window.dispatchEvent(new CustomEvent('watch-party-seek', {
      detail: { playbackSeconds: seconds },
    }));
  }, [roomCode]);

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
    const url = `${baseUrl}/party/${roomCode}`;
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
          {/* Emerald accent line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MonitorPlay className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Watch Party</h3>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${connected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                {connected ? <Wifi className="h-2.5 w-2.5" /> : <WifiOff className="h-2.5 w-2.5" />}
                {connected ? 'Live' : 'Reconnecting'}
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
              {/* Quick seek buttons */}
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
