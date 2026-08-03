---
Task ID: 1
Agent: Main Agent
Task: Phase 1 Referral Integration — Fix signup referral capture, API validation, and broken WhatsApp link

Work Log:
- Explored entire project to map existing referral code (schema, API, components, pages)
- Discovered most of Phase 1 was already built in a previous session
- Identified 3 bugs to fix:
  1. signup-page.tsx did NOT read `?ref=` from URL or send `referralCode` in POST body
  2. auth/[...slug]/route.ts did NOT validate referral codes (accepted any string)
  3. send-flow.tsx StepConfirmation had a syntax error in WhatsApp href and the div was outside JSX return
- Fixed signup-page.tsx: Added `useEffect` to capture `?ref=` from URL, added `referralCode` to POST body, added "Referred by" badge with Users icon
- Fixed auth API: Added DB lookup to validate referral code exists before storing, silently ignores invalid codes (doesn't block signup)
- Fixed send-flow.tsx: Removed broken inline WhatsApp link, replaced with `<ReferralShareButtons compact />` component
- Verified existing referral-share.tsx, profile-page.tsx, dangote-ipo-page.tsx, and gifts-send-page.tsx all already have working referral share integration
- Ran `bun run lint` — zero errors

Stage Summary:
- 3 files modified: signup-page.tsx, auth/[...slug]/route.ts, send-flow.tsx
- Phase 1 referral flow is now complete end-to-end
- Phase 2 (server-side WhatsApp via Twilio) remains blocked pending real credentials from Kennedy
