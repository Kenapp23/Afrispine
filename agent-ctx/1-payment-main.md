# Task ID: 1-payment — Phase 1: Payment Plumbing

## Summary
Implemented the complete Phase 1 Payment Plumbing for the AfriSpine content platform. This includes Daraja M-Pesa STK Push and B2C payout functions, checkout initiation/status polling, an async Daraja callback webhook with atomic ticket creation (60/40 revenue split), a creator payout drain function, and all social content API routes (feed, foryou, search, follow, like, share, comments).

## Files Created (11)
1. `src/app/api/content/checkout/initiate/route.ts` — STK Push checkout initiation
2. `src/app/api/content/checkout/status/[merchantRequestId]/route.ts` — Status polling
3. `src/app/api/webhooks/mpesa-content-callback/route.ts` — Daraja async callback
4. `src/lib/payments/content-payout-processor.ts` — Creator payout drain function
5. `src/app/api/content/feed/route.ts` — Public video feed
6. `src/app/api/content/foryou/route.ts` — Personalized feed (v1 stub)
7. `src/app/api/content/search/route.ts` — Video search
8. `src/app/api/content/follow/route.ts` — Follow/unfollow creator
9. `src/app/api/content/like/route.ts` — Like/unlike video
10. `src/app/api/content/share/route.ts` — Share video with referral code
11. `src/app/api/content/comments/route.ts` — Read/post comments

## Files Modified (1)
1. `src/lib/daraja.ts` — Added `initiateStkPush()` and `initiateB2CPayout()` with exported types `StkPushResponse` and `B2CPayoutResponse`

## Key Design Decisions
- All routes check `dbReady` before querying and use try/catch for graceful degradation
- IdempotencyRecord pattern follows the existing send/initialize approach
- Webhook always returns 200 to Daraja (even on internal errors)
- Creator payout auto-queues when balance >= KES 1000 (within the same atomic transaction)
- Follow/like routes are idempotent (P2002 unique constraint violations return success)
- Share reuses existing referral codes from prior shares by the same user
- No remittance code was touched
