'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/stores/app';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, MonitorPlay, Users, Loader2, Wifi, WifiOff,
  Copy, Check, Search, Play, MessageCircle,
} from 'lucide-react';

export function WatchPartyLobby() {
  const navigate = useAppStore((s) => s.navigate);
  const viewParams = useAppStore((s) => s.viewParams);
  const sender = useAppStore((s) => s.sender);

  const prefillCode = viewParams.roomCode || '';
  const [inputCode, setInputCode] = useState(prefillCode);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [roomInfo, setRoomInfo] = useState<{
    videoId: string;
    roomCode: string;
    videoTitle?: string;
    hostUserId?: string;
  } | null>(null);
  const [memberCount, setMemberCount] = useState(1);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const userId = sender?.id || `anon-${Date.now()}`;

  // ─── If prefillCode, auto-join on mount ─────────────────
  useEffect(() => {
    if (prefillCode) {
      handleJoin();
    }
  }, [prefillCode]);

  // ─── Cleanup on unmount ──────────────────────────────────
  useEffect(() => {
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (socketRef.current) {
        if (joined && inputCode) {
          socketRef.current.emit('leave-room', { roomCode: inputCode, userId });
        }
        socketRef.current.disconnect();
      }
    };
  }, []);

  const connectSocket = (roomCode: string) => {
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
    });

    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));

    socket.on('member-count', (data: { count: number }) => {
      setMemberCount(data.count);
    });

    socket.on('error', (data: { message: string }) => {
      toast.error(data.message);
    });

    heartbeatRef.current = setInterval(() => {
      if (socket.connected) {
        socket.emit('heartbeat', { roomCode, userId });
      }
    }, 15000);
  };

  const handleJoin = async () => {
    const code = inputCode.trim().toUpperCase();
    if (code.length !== 6) {
      toast.error('Enter a 6-character room code');
      return;
    }

    setJoining(true);
    try {
      const res = await fetch('/api/watch-party/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: code, userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to join');
        setJoining(false);
        return;
      }
      setRoomInfo(data);
      setJoined(true);
      connectSocket(code);
      toast.success('Joined watch party!');
    } catch {
      toast.error('Network error');
    } finally {
      setJoining(false);
    }
  };

  const goToWatch = () => {
    if (!roomInfo) return;
    navigate('watch', { videoId: roomInfo.videoId, roomCode: roomInfo.roomCode });
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomInfo?.roomCode || inputCode);
      toast.success('Copied!');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const shareWhatsApp = () => {
    const code = roomInfo?.roomCode || inputCode;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${baseUrl}/party/${code}`;
    const text = `Join my watch party on AfriSpine! ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-gray-950/80 backdrop-blur-md border-b border-white/10">
        <div className="mx-auto max-w-lg px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate('watch')} className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <MonitorPlay className="h-5 w-5 text-emerald-400" />
            <h1 className="text-lg font-bold text-white">Watch Party</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {!joined ? (
            <motion.div
              key="join"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-sm"
            >
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15">
                    <MonitorPlay className="h-8 w-8 text-emerald-400" />
                  </div>
                  <CardTitle className="text-xl text-white">Join a Watch Party</CardTitle>
                  <p className="mt-1 text-sm text-white/50">Enter the 6-character room code to join</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Input
                      value={inputCode}
                      onChange={e => setInputCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 6))}
                      placeholder="ABC123"
                      className="h-14 text-center text-2xl font-mono font-bold tracking-[0.3em] bg-white/5 border-white/10 text-emerald-400 placeholder:text-white/20 placeholder:tracking-widest placeholder:font-normal placeholder:text-sm"
                      maxLength={6}
                      onKeyDown={e => e.key === 'Enter' && handleJoin()}
                      autoFocus
                    />
                  </div>
                  <Button
                    onClick={handleJoin}
                    disabled={inputCode.length !== 6 || joining}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base rounded-xl"
                  >
                    {joining ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Join Party'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="room"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm space-y-4"
            >
              {/* Room card */}
              <Card className="bg-gray-900 border-emerald-500/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 gap-1">
                      <Wifi className={`h-3 w-3 ${connected ? '' : 'animate-pulse'}`} />
                      {connected ? 'Connected' : 'Connecting...'}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-white/50">
                      <Users className="h-4 w-4" />
                      <span className="text-sm font-medium">{memberCount}</span>
                    </div>
                  </div>

                  {/* Room code */}
                  <div className="flex items-center justify-center gap-3 rounded-xl bg-white/5 border border-white/10 p-4 mb-4">
                    <span className="text-3xl font-mono font-bold tracking-[0.2em] text-emerald-400">
                      {roomInfo?.roomCode}
                    </span>
                    <button onClick={copyCode} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">
                      <Copy className="h-4 w-4 text-white/50" />
                    </button>
                  </div>

                  {/* Video info */}
                  {roomInfo?.videoTitle && (
                    <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-4">
                      <p className="text-[11px] text-white/40 uppercase tracking-wider font-medium mb-1">Now Watching</p>
                      <h2 className="text-sm font-semibold text-white leading-snug">{roomInfo.videoTitle}</h2>
                    </div>
                  )}

                  {/* Actions */}
                  <Button
                    onClick={goToWatch}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base rounded-xl gap-2"
                  >
                    <Play className="h-5 w-5" />
                    Go to Watch
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={shareWhatsApp}
                    className="w-full h-10 text-white/60 hover:text-white hover:bg-white/5 gap-2 mt-2"
                  >
                    <MessageCircle className="h-4 w-4 text-green-500" />
                    Invite via WhatsApp
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-auto">
        <p className="text-center text-xs text-white/30 py-4">AfriSpine Watch Party</p>
      </footer>
    </div>
  );
}
