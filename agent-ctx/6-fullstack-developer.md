# Task 6 — Admin Merchant Management with Platform Sync

## Agent: fullstack-developer

## Summary
Implemented admin merchant management using PlatformConfig key/value overrides. Merchants remain as a static array in `src/lib/merchants.ts`; admin actions (enable/disable/delete) are persisted via PlatformConfig entries and reflected across the platform via two API endpoints.

## Changes Made

### 1. `src/lib/merchants.ts`
- Added `MERCHANTS` export — combined array of ALL merchants (including `isActive: false` ones) for admin use.
- `allMerchants` now derived from `MERCHANTS.filter(m => m.isActive)` instead of inline array.

### 2. `src/app/api/admin/merchants/route.ts` (NEW)
- **GET**: Returns all merchants from static data with computed `status` (active/disabled/deleted) from PlatformConfig. Requires admin auth via `requireAdmin()`.
- **PATCH**: Enable/disable a merchant by setting/removing `merchant_disabled_{id}` in PlatformConfig.
- **DELETE**: Soft-delete a merchant by setting `merchant_deleted_{id}` in PlatformConfig (also clears disabled flag).
- Uses batch query pattern to fetch all overrides in one DB call.

### 3. `src/app/api/merchants/route.ts` (NEW — PUBLIC)
- **GET**: Returns only active, non-disabled, non-deleted merchants. Supports `?country=KE` query param.
- Used by the gifts hub and other user-facing pages.

### 4. `src/components/afrispine/admin/admin-gift-providers-page.tsx` (REWRITTEN)
- Fetches merchants from `/api/admin/merchants` on mount.
- Full table with columns: Merchant (logo + name + description), Country (with flag), Category, Status (badge), Actions.
- Summary stats: Total, Active, Disabled, Deleted.
- Filters: Search (name/country/category), Country dropdown (from API), Status dropdown.
- Actions: Enable/Disable toggle button, Delete button.
- Loading skeletons, action loading spinners, sticky table header with scroll.
- Admin dark theme consistent with other admin pages (bg-gray-900, gray-800 cards, etc.).
- Deleted rows shown at 60% opacity with disabled action buttons.

### 5. `src/components/afrispine/gifts/gifts-hub-page.tsx` (UPDATED)
- Replaced static `allMerchants` / `getMerchantsByCountry` imports with API fetch from `/api/merchants?country={code}`.
- Added loading state with skeleton grid while fetching.
- Merchant count now dynamically reflects API response.
- Country filter tabs trigger re-fetch with query param.

## PlatformConfig Key Convention
- `merchant_disabled_{merchantId}` → `"true"` means merchant is hidden from users
- `merchant_deleted_{merchantId}` → `"true"` means merchant is soft-deleted (never shown)

## Verification
- `bun run lint` passes with exit code 0, no errors.
