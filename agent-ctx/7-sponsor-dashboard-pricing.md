# Task ID: 7 — Sponsor Dashboard Pricing Tiers & Payment Flow UI

## Agent: Main Agent

## Files Modified
1. **`src/components/creator/sponsor-dashboard-page.tsx`** — Complete rewrite of pricing display and payment status in sponsor dashboard

## Changes Made

### Campaign Creation Form
- **Removed** budget input field — cost is now auto-calculated from slot pricing
- **Added** pricing fetch from `GET /api/admin/sponsor-pricing` on page load
- Each slot type checkbox shows its estimated cost as a green pill badge (e.g. `KES 5,000`)
- Real-time "Total Estimated Cost: KES X" summary bar below slot checkboxes
- "Pricing pending — admin will set the rate" amber warning when no pricing configured
- Payment flow note: "After submission, your campaign will be reviewed. Once approved, you'll receive an M-Pesa prompt to pay."
- Campaign submission validation: requires name, objective, and at least 1 slot (no budget)
- Success toast shows total cost from API response

### Campaign List
- **Status badges** updated for new flow:
  - `pending_review` → "Under Review" (amber)
  - `awaiting_payment` → "Awaiting Payment" (orange)
  - `active` → "Live" (green)
  - `completed` → "Completed" (gray)
  - `rejected` → "Rejected" (red)
  - `paused` → "Paused" (gray)
- **Payment status badges** (shown for non-pending_review campaigns):
  - `unpaid` → "Pending Review" (amber)
  - `pending` → "Payment Pending" (amber)
  - `paid` → "Paid" (green)
  - `failed` → "Payment Failed" (red)
- Orange "Payment Pending" highlighted bar with estimated cost for `awaiting_payment` campaigns
- "Budget" column renamed to "Cost" using `totalCost` from API

### New Types
- `SponsorPricingData` — for pricing records
- `PricingBreakdownItem` — for cost breakdown per slot
- `CampaignData` extended with `paymentStatus`, `totalCost`, `pricingBreakdown`

### New Helpers
- `getStatusLabel()` — maps status to display label
- `getPaymentStatusBadge()` — returns Badge component for payment status
- `pricingMap` — useMemo Map for O(1) slot cost lookups
- `estimatedTotal` — useMemo computed total for selected slots

## Lint: Passes clean (0 errors)