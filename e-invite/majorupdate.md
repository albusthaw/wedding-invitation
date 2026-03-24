# Major Update - 2026-03-24 (v11)

## Summary
Media tab page load error fix, comprehensive security review with critical XSS and access control fixes, DOMPurify HTML sanitization.

## Changes

### Media Tab Page Load Error Fix (#1 — Persistent Bug)
- **Root cause:** `handleDrop` useCallback had a stale closure — it called `uploadFiles` but only listed `[isImage]` in its dependency array. When React re-rendered the component, `handleDrop` held a reference to the original `uploadFiles` which captured stale props/state, causing runtime errors.
- **Fix:** Complete MediaUploader rewrite:
  - `uploadFiles` moved to `useCallback` with full dependency array
  - Stable refs (`currentFilesRef`, `onUploadRef`) used for callback props to prevent infinite re-render loops
  - `handleDrop` dependency array now includes `[isImage, uploadFiles]`
  - Inline validation inside `uploadFiles` to avoid closure over `validateFile`
  - Stable React keys using `img-${index}-${url.slice(-10)}`

### Security Review Findings & Fixes

#### CRITICAL: Stored XSS via customHtml/customCss (#22)
- **Issue:** `customHtml` rendered via `dangerouslySetInnerHTML` with no sanitization. AI prompt injection or direct PUT API could inject `<script>` tags served to all public visitors.
- **Fix:** Added `isomorphic-dompurify` package. Created `src/lib/sanitize.ts` with:
  - `sanitizeHtml()` — DOMPurify with allowed tags (div, span, SVG, etc.), strips scripts/iframes/forms/event handlers
  - `sanitizeCss()` — strips `expression()`, `javascript:`, `-moz-binding`, `behavior:` patterns
- Applied in: `/api/designer/generate` (after AI response parse) and `/api/invitations/[id]` PUT handler

#### CRITICAL: Hardcoded Fallback Encryption Key (#23)
- **Issue:** `encryption.ts` had `process.env.NEXTAUTH_SECRET || "fallback-secret-key"` — if env var missing, uses a publicly known key. Attackers could decrypt all invitee special links.
- **Fix:** Now throws error if NEXTAUTH_SECRET is not set: `if (!secret) throw new Error("NEXTAUTH_SECRET required")`

#### CRITICAL: Broken Access Control on Invitation CRUD (#24)
- **Issue:** `PUT /api/invitations/[id]` and `DELETE /api/invitations/[id]` only checked authentication, not authorization. Any CLIENT could modify or delete any invitation.
- **Fix:** PUT and DELETE now require ADMIN role. GET checks ADMIN or UserInvitation assignment.

#### HIGH: Settings Endpoint Lacked Role Check (#25)
- **Issue:** `GET /api/settings` was accessible to any authenticated user. Server actions `getSetting()` and `getSettings()` had no auth check and could leak the Gemini API key.
- **Fix:** GET endpoint requires ADMIN. Server actions require ADMIN and mask geminiApiKey as `***configured***`.

## Files Changed
- `src/components/designer/MediaUploader.tsx` — Complete rewrite fixing stale closure bug
- `src/lib/sanitize.ts` — New: DOMPurify HTML/CSS sanitization utilities
- `src/app/api/designer/generate/route.ts` — Sanitize AI-generated customHtml/customCss
- `src/app/api/invitations/[id]/route.ts` — Admin-only PUT/DELETE, assignment-based GET, sanitize HTML/CSS
- `src/app/api/settings/route.ts` — Admin-only GET
- `src/app/actions/settings.ts` — Admin-only getSetting/getSettings, mask API key
- `src/lib/encryption.ts` — Remove fallback key, throw on missing NEXTAUTH_SECRET
- `CLAUDE.md` — Bug patterns #22-#26
- `majorupdate.md` — This file
- `package.json` — Added isomorphic-dompurify dependency

## Testing
- Build succeeds ✓
- All routes registered ✓
- Type checking passes ✓
- Security review completed with all CRITICAL and HIGH findings addressed ✓

## New Dependency
- `isomorphic-dompurify` — Server-side compatible DOMPurify for HTML sanitization
