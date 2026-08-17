# Afrispine Phase 1 — Worklog

---
Task ID: 1
Agent: Main Agent
Task: Implement Phase 1 — Premiere→VOD, Card Renderer, You're In, Dynamic Pricing

Work Log:
- Read and analyzed full codebase: schema, watch page, M-Pesa callback, foryou scorer, payout processor, page.tsx SPA router, stores/app.ts
- §1.1: Added 5 new fields to Video model in prisma/schema.prisma: `releaseMode`, `premiereAt`, `premiereWindowEnds`, `vodRevSharePct`, `backstageVideoId` (self-referencing). Pushed schema to SQLite with `bun run db:push`.
- §1.2: Created `/api/cron/premiere-transition` endpoint — GET handler finds expired premieres and flips releaseMode to 'standard'. Designed for Vercel Cron.
- §1.3: Updated `mpesa-content-callback/route.ts` — now fetches video.vodRevSharePct and uses it (falling back to default 0.60) instead of hardcoded CREATOR_SHARE_PCT. One calculation path, fed by the video's rate.
- §1.4: Added `PremiereCountdownBadge` inline component to watch page — shows countdown to premiere start or window close with amber styling.
- §2.1: Built `AfriSpineCard` component with `profile` and `show` modes. Dark theater tones, film-strip decoration, emerald accents, verified badges, follow button, share sheet (Web Share API + clipboard fallback).
- §2.2: Extracted `src/lib/poster-utils.ts` — shared `CATEGORY_SOLID_GRADIENTS`, `getCategoryGradient()`, `formatCount()`, `getInitials()`.
- §2.3: Created `/c/[handle]/page.tsx` — public OG page with generateMetadata for WhatsApp/X link unfurling, redirects to SPA.
- §2.4: Updated `/w/[videoId]/page.tsx` — now includes releaseMode, premiere status in OG metadata.
- §2.5: Created `/api/content/creator-profile/route.ts` — public API returning creator profile with recent videos.
- §3: Built `YoureInScreen` component — post-purchase overlay with success animation, AfriSpineCard (show mode), share button, backstage teaser (conditional on backstageVideoId). Integrated into watch page: triggers after successful payment flash.
- §4.1: Created `src/lib/scoring.ts` — `getCreatorAggregate()`, `computeCreatorValueScore()` (0-100, 4 dimensions mirroring foryou weights), `priceMultiplier()` (3 tiers: 0.8/1.0/1.4).
- §4.2: Created `/api/content/creator-value/route.ts` — returns value score, tier label, and dynamic pricing per slotType.
- §4.3: Updated sponsor landing page rate cards to show "From KES X". Updated sponsor dashboard campaign builder to show "From KES X".
- Updated `foryou/route.ts` to include releaseMode, premiereAt, premiereWindowEnds, backstageVideoId in response.
- All code passes `bun run lint` with zero errors.

Stage Summary:
- 12 files created/modified across schema, API, components, and lib
- §1 Premiere→VOD state machine: complete (schema + cron + rev-share + UI countdown)
- §2 System A Card Renderer: complete (profile + show modes, OG pages, share routes, shared utils)
- §3 You're In screen: complete (post-purchase overlay with card, share, backstage teaser)
- §4 System C Dynamic Pricing: complete (scoring function, API, "From KES X" display)
- Nothing from Phase 2 (merch, AI creative engine, badge embed, collab matching) was added
- VOD rev-share defaults to 0.60 (same as existing 60/40) — one-line change when Kennedy confirms
