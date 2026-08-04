---
Task ID: 1
Agent: Main Agent
Task: Replace fake logo placeholders with real fetched brand logos

Work Log:
- Diagnosed root cause: BrandLogo component fell back to colored initial boxes because (a) it used LOCAL_LOGO_MAP pointing to non-existent SVG files, and (b) Clearbit logo.clearbit.com is unreachable from the sandbox
- Discovered icon.horse icon service works from sandbox (returns 32-256px favicons/logos)
- Replaced all 122 Clearbit URLs in merchants.ts with icon.horse URLs
- Rewrote BrandLogo component in gifts-send-page.tsx: resolves URL from brand.logoUrl > MERCHANTS lookup by slug, renders <img> directly, neutral gray fallback
- Updated GiftCardBrandCard in gifts-hub-page.tsx with same MERCHANTS-based logo resolution
- Fixed invalid Samsung/LG URLs (had path suffix like /ke)
- Fixed user-specified domains: flyawa.com.gh, flyairpeace.com, azamtv.co.tz
- Verified: all 122 brands have icon.horse URLs, 26/26 Kenya brands load in browser, 12/12 visual test passed

Stage Summary:
- 3 files modified: merchants.ts, gifts-send-page.tsx, gifts-hub-page.tsx
- All 122 brands now use icon.horse/icon/{domain} URLs
- Colored category boxes replaced with neutral gray initial fallback
- Committed as b388009 and pushed to GitHub
