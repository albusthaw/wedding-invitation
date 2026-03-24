# Major Update - 2026-03-24 (v12)

## Summary
Fixed Server Component render error on Invitation Letter creation caused by nested HTML layout and isomorphic-dompurify JSDOM/Turbopack SSR incompatibility. Replaced isomorphic-dompurify with sanitize-html. Fixed galleryPhotos JSON string parsing bug.

## Changes

### Server Component Render Error Fix (#32 — Post-Security-Hardening Bug)
- **Symptom:** "An error occurred in the Server Components render" when creating/viewing invitation letters after v11 security hardening.
- **Root causes identified:**
  1. `src/app/[slug]/layout.tsx` had nested `<html>` and `<body>` tags conflicting with root layout — causes React SSR hydration failures
  2. `isomorphic-dompurify` (added in v11) depends on JSDOM which is incompatible with Turbopack's SSR bundling — causes silent module loading failures during Server Component rendering
- **Fix:**
  - Removed nested `<html>/<body>` from `[slug]/layout.tsx` — now returns `<>{children}</>`
  - Replaced `isomorphic-dompurify` with `sanitize-html` (pure JS, no DOM dependency)
  - Updated `src/lib/sanitize.ts` to use `sanitize-html` API with equivalent security rules
  - Added try-catch to `[slug]/page.tsx` Server Component (`getInvitationBySlug`, `generateMetadata`)

### Gallery Photos Not Showing Fix (#34)
- **Symptom:** Photo gallery never displayed on public invitation pages even when photos exist.
- **Root cause:** `galleryPhotos` stored as `JSON.stringify([...])` (a string), but `InvitationPage` checks `Array.isArray()` which returns false for strings.
- **Fix:** Added JSON parse in `[slug]/page.tsx` serialization — parses string values before passing to client component.

## Files Changed
- `src/app/[slug]/layout.tsx` — Removed nested `<html>/<body>` tags
- `src/app/[slug]/page.tsx` — Added error handling, fixed galleryPhotos serialization
- `src/lib/sanitize.ts` — Replaced isomorphic-dompurify with sanitize-html
- `package.json` — Swapped isomorphic-dompurify → sanitize-html + @types/sanitize-html
- `CLAUDE.md` — Bug patterns #32, #33, #34; updated #22 note
- `majorupdate.md` — This file

## Testing
- Build succeeds (no warnings) ✓
- All 65 unit tests pass ✓
- All routes registered ✓
- Type checking passes ✓
- Public invitation page renders with single `<html>` tag (no nesting) ✓
- HTML sanitization works correctly with sanitize-html ✓

## Dependency Change
- **Removed:** `isomorphic-dompurify` (required JSDOM, caused Turbopack SSR issues)
- **Added:** `sanitize-html` + `@types/sanitize-html` (pure JS, no DOM dependency)
