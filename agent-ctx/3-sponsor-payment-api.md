# Task ID: 3 — Sponsor Flat-Rate Prepaid Payment System

## Agent: Payment API Agent

## Files Created
1. **`src/app/api/admin/sponsor-pricing/route.ts`** — GET (list all pricings ordered by slotType) + POST (admin-only upsert of SponsorPricing records)
2. **`src/app/api/sponsor/campaigns/[id]/approve/route.ts`** — POST: Admin approves a campaign, calculates total cost from SponsorPricing, initiates M-Pesa STK Push
3. **`src/app/api/webhooks/mpesa-sponsor-callback/route.ts`** — POST: Handles Daraja STK callback for sponsor payments (activates campaign + slots on success, marks failed on failure)

## Files Modified
4. **`src/lib/admin-auth.ts`** — Added `adminAuth(req)` convenience function that returns `AdminJwtPayload | null`
5. **`src/app/api/sponsor/campaigns/route.ts`** — Enhanced GET to include SponsorPricing + totalCost/pricingBreakdown per campaign; enhanced POST to calculate totalCost from pricing and include in response

## Implementation Details

### SponsorPricing Admin API (`/api/admin/sponsor-pricing`)
- GET: Returns all records ordered by slotType ascending
- POST: Accepts `{ pricings: Array<{ slotType, label, priceKes, impressionsIncluded? }> }`, upserts each
- Admin auth via `adminAuth(req)` from `@/lib/admin-auth`

### Campaign Approve (`/api/sponsor/campaigns/[id]/approve`)
- Validates admin auth, checks campaign is `pending_review`
- Looks up SponsorPricing for each unique slot type in campaign's slots
- Falls back to KES 5000 default if no pricing record exists
- Sets campaign to `awaiting_payment`, stores `merchantRequestId`, fires STK Push
- On STK failure, reverts campaign to `pending_review`
- Returns `{ merchantRequestId, totalCost }`

### M-Pesa Sponsor Callback (`/api/webhooks/mpesa-sponsor-callback`)
- Mirrors structure of `mpesa-content-callback`
- Always returns 200 to Daraja
- On success: updates campaign (`paymentStatus=paid`, `status=active`, `paidAt`, `approvedAt`, `mpesaReceiptNumber`), activates all pending slots in transaction
- On failure: updates campaign `paymentStatus=failed`

### Campaigns Route Enhancement
- GET: Now includes `pricings` array (all SponsorPricing records), `totalCost` and `pricingBreakdown` per campaign
- POST: Calculates `totalCost` from SponsorPricing, returns it alongside campaign + `pricingBreakdown`
- Helper functions `getPricingMap()` and `calculateTotalCost()` for reuse

## Lint: Passes clean (0 errors)
