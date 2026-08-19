/**
 * Client-side Supabase Realtime helper for Watch Party.
 *
 * Uses Broadcast channels — lightweight, no DB triggers needed,
 * no RLS configuration required. Messages are ephemeral (in-memory),
 * so we persist state (playback position, member count) via REST API.
 *
 * Design:
 *   - Channel name: `room:{roomCode}`
 *   - Host sends: play, pause, seek, heartbeat events
 *   - All members subscribe and react
 *   - Member count comes from the REST API (`/api/watch-party/room`)
 *
 * Gracefully degrades when Supabase is not configured:
 *   - The channel connects but silently fails (no crash)
 *   - UI shows "Reconnecting" state, which is honest
 */
import { createClient, RealtimeChannel, RealtimeClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const realtimeReady = !!(supabaseUrl && supabaseAnonKey)

/** Lazy singleton — created once on first use */
let _rtClient: RealtimeClient | null = null

function getRealtimeClient(): RealtimeClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null
  if (!_rtClient) {
    _rtClient = createClient(supabaseUrl, supabaseAnonKey).realtime
  }
  return _rtClient
}

// ─── Event types ───────────────────────────────────────────────

export type PartyEventType =
  | 'play'
  | 'pause'
  | 'seek'
  | 'heartbeat'
  | 'member-join'
  | 'member-leave'
  | 'sync-request'
  | 'sync-response'

export interface PartyEvent {
  type: PartyEventType
  roomCode: string
  userId: string
  payload: {
    isPlaying?: boolean
    playbackSeconds?: number
    count?: number
  }
  timestamp: number
}

// ─── Channel subscription helper ───────────────────────────────

/**
 * Subscribe to a watch party room's broadcast channel.
 *
 * Returns an object with:
 *   - channel: the RealtimeChannel (call .unsubscribe() on cleanup)
 *   - send: function to broadcast events to the room
 *   - connected: whether the realtime client is configured at all
 */
export function joinRealtimeRoom(
  roomCode: string,
  handlers: {
    onEvent?: (event: PartyEvent) => void
    onStatusChange?: (status: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR') => void
  },
) {
  const client = getRealtimeClient()

  if (!client) {
    // No Supabase configured — return a no-op stub
    return {
      channel: null as unknown as RealtimeChannel,
      send: () => {},
      connected: false,
    }
  }

  const channelName = `room:${roomCode}`

  const channel: RealtimeChannel = client.channel(channelName, {
    config: {
      broadcast: { self: true }, // Host receives their own events
      presence: { key: '' },
    },
  })

  channel
    .on('broadcast', { event: 'party-event' }, (payload: { payload: PartyEvent }) => {
      handlers.onEvent?.(payload.payload)
    })
    .subscribe((status, err) => {
      handlers.onStatusChange?.(status)
      if (err) {
        console.warn('[supabase-realtime] channel error:', err)
      }
    })

  const send = (event: PartyEvent) => {
    channel.send({
      type: 'broadcast',
      event: 'party-event',
      payload: event,
    })
  }

  return { channel, send, connected: true }
}

// ─── Event constructors ────────────────────────────────────────

export function makePlayEvent(roomCode: string, userId: string, playbackSeconds: number): PartyEvent {
  return { type: 'play', roomCode, userId, payload: { isPlaying: true, playbackSeconds }, timestamp: Date.now() }
}

export function makePauseEvent(roomCode: string, userId: string, playbackSeconds: number): PartyEvent {
  return { type: 'pause', roomCode, userId, payload: { isPlaying: false, playbackSeconds }, timestamp: Date.now() }
}

export function makeSeekEvent(roomCode: string, userId: string, playbackSeconds: number): PartyEvent {
  return { type: 'seek', roomCode, userId, payload: { playbackSeconds }, timestamp: Date.now() }
}

export function makeHeartbeatEvent(roomCode: string, userId: string, count: number): PartyEvent {
  return { type: 'heartbeat', roomCode, userId, payload: { count }, timestamp: Date.now() }
}

export function makeSyncRequestEvent(roomCode: string, userId: string): PartyEvent {
  return { type: 'sync-request', roomCode, userId, payload: {}, timestamp: Date.now() }
}

export function makeSyncResponseEvent(roomCode: string, userId: string, isPlaying: boolean, playbackSeconds: number, count: number): PartyEvent {
  return { type: 'sync-response', roomCode, userId, payload: { isPlaying, playbackSeconds, count }, timestamp: Date.now() }
}