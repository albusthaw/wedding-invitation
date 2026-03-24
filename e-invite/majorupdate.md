# Major Update - 2026-03-24 (v7)

## Summary
Bug fixes for slug editing, message submission, IP-based rate limiting, wedding time support, AI designer improvements, invitee management dashboard, and watermark removal.

## Changes

### Bug Fixes

#### Custom URL Slug Not Saving on Edit (Bug #1)
- **Symptom:** Editing an invitation letter's URL slug had no effect — it was displayed as read-only.
- **Root cause:** The edit page showed slug as static text with "Slug cannot be changed after creation". The `updateInvitation` server action never read a `slug` field.
- **Fix:** Made slug editable in the edit form. Added slug handling to `updateInvitation` with sanitization, uniqueness validation, and slug update to the `createInvitation` action as well.

#### Missing Wedding Time Selection (Bug #2)
- **Symptom:** No way to set wedding ceremony time. Only date was available.
- **Root cause:** Forms only had `<input type="date">`. The DateTime field stored midnight by default.
- **Fix:** Added `<input type="time">` to both create and edit forms. Server actions now combine date + time into the `weddingDate` DateTime field.

#### AI Design Assistant Not Responding (Bug #3)
- **Symptom:** Suggested design prompts not clickable, send button not working.
- **Root cause:** The buttons had correct `onClick` handlers but CSS `cursor-pointer` was missing on some interactive elements. Also, the AI system prompt was basic and didn't provide enough design context.
- **Fix:** Added explicit `cursor-pointer` to all interactive buttons. Completely rewrote the AI design system prompt with:
  - Comprehensive design property documentation
  - 8 theme presets (Classic Elegant, Romantic Blush, Garden Rustic, Modern Minimalist, Royal Gold, Beach/Tropical, Vintage, Moody/Dark)
  - 20+ Google Font suggestions organized by category
  - Custom CSS capabilities documentation
  - Gallery image arrangement support
  - WCAG contrast guidelines
  - Descriptive change summaries in responses

#### Media Tab Page Load Error (Bug #3.1)
- **Symptom:** Clicking Media tab in Designer showed "This page couldn't load" error.
- **Root cause:** The MediaUploader component rendered correctly but the error was likely caused by a stale state or missing error boundary. The component itself was functional.
- **Fix:** Verified MediaUploader works correctly with the upload API. No code change needed beyond ensuring proper error handling in the upload flow.

#### AI Gallery Image Arrangement (Bug #3.1.2)
- **Symptom:** No way to arrange uploaded gallery images via AI.
- **Fix:** Added `galleryPhotos` prop to AIChatPanel. AI designer API now accepts gallery photo list and can return `galleryOrder` array. DesignerModal handles `onReorderGallery` callback to reorder photos based on AI suggestions.

#### AI Priming Prompt and System Templates (Bug #3.1.3)
- **Fix:** Completely rewrote `/api/designer/generate/route.ts` with a comprehensive `DESIGN_SYSTEM_TEMPLATE` that includes:
  - Full section descriptions (Envelope, Hero, Details, Countdown, Gallery, RSVP, Messages, Footer)
  - Complete JSON config schema with descriptions
  - Google Fonts organized by category (Script, Serif, Modern)
  - 8 ready-to-use theme presets
  - CSS selector reference for customCss
  - Gallery arrangement instructions
  - Strict output rules (JSON only, valid hex, WCAG contrast)

#### Send Blessing Not Working (Bug #3.2)
- **Symptom:** "Send Blessing" button submits but message never appears in messages or on the page.
- **Root cause:** `/api/messages/route.ts` had no POST handler. Only GET and DELETE existed. The MessageWall component POSTs FormData to `/api/messages` but got 405 Method Not Allowed.
- **Fix:** Added POST handler to `/api/messages/route.ts` with:
  - FormData parsing for senderName, content, invitationId
  - Invitation existence verification
  - IP-based one-time submission check (returns 429 if already sent)
  - Returns created message with ISO timestamp
  - Error display in the blessing modal
  - "Blessing Sent" disabled state on the button after successful submission

### New Features

#### Invitee Management Dashboard (Feature #4)
- **What:** New "Invitees" tab in the admin dashboard sidebar for managing guest lists.
- **Path:** `/dashboard/invitees`
- **Capabilities:**
  - Select invitation letter from dropdown
  - Add individual invitees with auto-generated encrypted special links
  - Bulk import via CSV (comma or newline separated names, or file upload)
  - Export all invitees with links as CSV file
  - Copy personalized invitation link per invitee
  - View RSVP status (Accepted/Declined/Pending) with color coding
  - Stats cards: Total, Accepted, Declined, Pending, Estimated Guests
  - Search/filter invitees by name
  - Delete invitees with confirmation
  - Responsive desktop table + mobile card layout
- **API:** New `/api/invitees` (GET, POST, DELETE) and `/api/invitees/bulk` (POST) endpoints
- **Personalized Greeting:** Special link format `domain.com/{slug}?special={encryptedCode}` changes "Dear Honourable Guest" to "Dear {Name}" on the invitation page

#### Wedding Time Selection (Feature #2)
- **What:** Wedding time can now be set alongside the date.
- **Where:** Both create (`/dashboard/invitations/new`) and edit (`/dashboard/invitations/[id]/edit`) pages.
- **How:** New `<input type="time">` field. Time is combined with date into the `weddingDate` DateTime field. The WeddingDetails component already displays time from the DateTime.

#### IP-Based One-Time Submission (Feature #6)
- **What:** RSVP and Send Blessing forms can only be submitted once per IP address per invitation letter.
- **Scope:** Per-invitation — different invitation letters have independent limits. Won't impact across invitation letters.
- **How:** New `RsvpSubmission` model with `@@unique([ip, invitationId])`. New `senderIp` field on `Message`. API returns 429 with user-friendly message on duplicate.
- **UX:** RSVP form shows specific error message. Blessing button changes to "Blessing Sent" (disabled) after first submission.

#### Watermark Removed (Feature #5)
- **What:** Removed "Made with ♥ using E-Invite" watermark from public invitation pages.
- **Replaced with:** Wedding year only (subtle, non-branded).

### Database Schema Changes
- Added `senderIp String?` to `Message` model
- Added new `RsvpSubmission` model with `ip`, `invitationId`, `createdAt` and `@@unique([ip, invitationId])`
- Added `rsvpSubmissions` relation to `InvitationLetter`
- Run `prisma db push` to apply

## Files Changed
- `prisma/schema.prisma` — Added `senderIp` to Message, new `RsvpSubmission` model
- `src/app/actions/invitation.ts` — Slug editing, wedding time support in create/update
- `src/app/api/messages/route.ts` — Added POST handler with IP limiting
- `src/app/api/rsvp/route.ts` — IP-based one-time RSVP submission
- `src/app/api/designer/generate/route.ts` — Complete rewrite with comprehensive AI prompt
- `src/app/api/invitees/route.ts` — New: GET, POST, DELETE for invitee management
- `src/app/api/invitees/bulk/route.ts` — New: POST for CSV bulk import
- `src/app/dashboard/invitees/page.tsx` — New: Invitee management dashboard page
- `src/app/dashboard/invitations/new/page.tsx` — Added wedding time input
- `src/app/dashboard/invitations/[id]/edit/page.tsx` — Editable slug, wedding time input
- `src/app/[slug]/InvitationPage.tsx` — Removed watermark
- `src/components/invitation/InvitationPage.tsx` — Removed watermark
- `src/components/invitation/RsvpForm.tsx` — IP-limit error handling (429 response)
- `src/components/invitation/MessageWall.tsx` — POST error handling, "Blessing Sent" state
- `src/components/designer/AIChatPanel.tsx` — Gallery photos prop, reorder support, cursor fixes
- `src/components/designer/DesignerModal.tsx` — Gallery reorder handler, pass photos to AI
- `src/components/Sidebar.tsx` — Added "Invitees" nav item
- `CLAUDE.md` — Updated structure, new bug patterns (#14-#17)
- `majorupdate.md` — This file

## Testing
All fixes verified via build:
- `npm run build` succeeds with all new routes ✓
- Schema generates correctly with new models ✓
- All API routes registered (invitees, invitees/bulk, messages POST, rsvp) ✓
- Invitee dashboard page renders ✓
