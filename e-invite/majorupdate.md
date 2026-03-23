# Major Update - 2026-03-23 (v6)

## Summary
Critical bug fixes for invitation/user/designer/messages CRUD, new Google Maps Plus Code feature, admin password reset, and AI designer improvements.

## Changes

### Bug Fixes

#### Missing POST Handler for User Creation (Critical)
- **Symptom:** Creating a new user shows "Failed to execute 'json' on 'Response': Unexpected end of JSON input"
- **Root cause:** `/api/users/route.ts` only had a GET handler — no POST handler existed. The client sent POST but got 405 Method Not Allowed with an empty body.
- **Fix:** Added POST handler to `/api/users/route.ts` with validation, duplicate email check, password hashing, and optional invitation assignment.

#### Missing PUT Handler for Invitation Updates (Critical)
- **Symptom:** Designer cannot save design changes; PUT requests to `/api/invitations/[id]` return 405.
- **Root cause:** `/api/invitations/[id]/route.ts` only had GET and DELETE handlers — no PUT handler existed. The designer page's save function silently failed.
- **Fix:** Added PUT handler to `/api/invitations/[id]/route.ts` supporting all invitation fields including designConfig, galleryPhotos, musicFile, customCss, customHtml, mapPlusCode, and needsRepublish.

#### Invitation Letters Not Appearing After Creation
- **Symptom:** After creating an invitation letter, it does not appear in the Invitations list page. Dashboard shows it correctly.
- **Root cause:** Multiple client-side `fetch()` calls throughout the app could return stale cached data due to Next.js fetch caching behavior. The Dashboard page works because it's a Server Component that queries the database directly, while the Invitations page is a Client Component fetching from the API.
- **Fix:** Added `{ cache: "no-store" }` to all client-side `fetch()` calls for `/api/invitations`, `/api/users`, and `/api/messages` across all dashboard pages (invitations, designer, messages, users, new invitation, new user).

#### Designer Not Picking Up Draft Invitation Letters
- **Symptom:** The AI Designer page doesn't show invitations or can't save designs.
- **Root cause:** Same as above — missing PUT handler and stale fetch cache.
- **Fix:** PUT handler added + cache-busting on designer page fetch.

#### Messages Not Picking Up Invitation Letters
- **Symptom:** Messages page filter dropdown is empty, can't filter by invitation.
- **Root cause:** Same fetch caching issue — the invitations list for the filter dropdown was cached.
- **Fix:** Cache-busting on messages page invitations fetch.

### New Features

#### Google Maps Plus Code Button (Feature)
- **What:** Added a map location button next to the venue name on public invitation pages.
- **How:** New `mapPlusCode` field on `InvitationLetter` model. When populated, a small map pin button appears next to the venue name that opens Google Maps with the Plus Code.
- **Format:** Google Maps Plus Codes (e.g., `X3XP+44 Mandalay, Myanmar (Burma)`)
- **Files:** Schema, create/edit invitation forms, server action, API PUT handler, `WeddingDetails.tsx`, `InvitationPage.tsx`, `[slug]/InvitationPage.tsx`, `[slug]/page.tsx`

#### Admin Password Reset (Feature)
- **What:** Admins can now reset any user's password directly from the Users page.
- **How:** "Reset Password" button on each user row opens a modal to set a new password. Uses the existing PUT `/api/users/[id]` endpoint.
- **Access:** Admin-only (the PUT endpoint checks `session.user.role === "ADMIN"`).
- **Files:** `src/app/dashboard/users/page.tsx`

#### AI Designer Improvements
- **Better prompt:** Expanded font suggestions, explicit JSON format example, contrast rule, cohesive theme guidance.
- **Config validation:** The designer API now validates returned config — checks hex color format, required fields, boolean types. Falls back to current config for invalid values instead of failing.
- **Files:** `src/app/api/designer/generate/route.ts`

### Database Schema
- Added `mapPlusCode String?` to `InvitationLetter` model
- Run `prisma db push` or `prisma migrate dev` to apply

## Files Changed
- `prisma/schema.prisma` — added `mapPlusCode` field to InvitationLetter
- `src/app/api/users/route.ts` — added POST handler for user creation
- `src/app/api/invitations/[id]/route.ts` — added PUT handler for invitation updates
- `src/app/api/designer/generate/route.ts` — improved prompt and added config validation
- `src/app/actions/invitation.ts` — added mapPlusCode to create/update actions
- `src/app/dashboard/invitations/page.tsx` — cache-busting fetch
- `src/app/dashboard/invitations/new/page.tsx` — cache-busting fetch, mapPlusCode field
- `src/app/dashboard/invitations/[id]/edit/page.tsx` — mapPlusCode field in interface and form
- `src/app/dashboard/designer/page.tsx` — cache-busting fetch
- `src/app/dashboard/messages/page.tsx` — cache-busting fetch (invitations + messages)
- `src/app/dashboard/users/page.tsx` — admin password reset modal and buttons
- `src/app/dashboard/users/new/page.tsx` — cache-busting fetch
- `src/components/invitation/WeddingDetails.tsx` — mapPlusCode prop and Google Maps button
- `src/components/invitation/InvitationPage.tsx` — mapPlusCode in interface and prop passing
- `src/app/[slug]/InvitationPage.tsx` — mapPlusCode in interface and prop passing
- `src/app/[slug]/page.tsx` — mapPlusCode serialization
- `CLAUDE.md` — updated bug patterns documentation
- `majorupdate.md` — this file

## Testing
All fixes verified in sandbox:
- User creation via POST `/api/users` ✓
- Invitation listing via GET `/api/invitations` ✓
- Invitation update via PUT `/api/invitations/[id]` ✓
- Messages listing via GET `/api/messages` ✓
- Password reset via PUT `/api/users/[id]` ✓
- Google Maps Plus Code storage and retrieval ✓
- Duplicate user rejection (409) ✓
- AI Designer: Gemini API blocked in sandbox but prompt improvements and config validation verified via code review
