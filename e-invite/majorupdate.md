# Major Update - 2026-03-24 (v13)

## Summary
Fixed couple photo upload error, designer "i.map" crash, removed Media tab (integrated uploads into AI chat), added AI image generation for design elements, removed 6-photo gallery limit.

## Changes

### Bug Fix: Couple Photo Upload Error (#35)
- **Symptom:** Adding couple photo in Invitation Letter creation triggers Server Component render error.
- **Root cause:** `savePhoto()` derived file extension from `file.name` which is unreliable for server-action File objects.
- **Fix:** Extension derived from MIME type first, with filename fallback.

### Bug Fix: Designer "i.map is not a function" (#36)
- **Symptom:** Any AI design request fails with "Design failed: i.map is not a function".
- **Root cause:** `galleryPhotos` from API returned as JSON string `"[]"` instead of array `[]`. The designer page passed this raw to DesignerModal which calls `.map()`.
- **Fix:** Added JSON parse with fallback in designer page when passing galleryPhotos to modal.

### Refactor: Media Tab Removed, Upload in AI Chat (#37)
- **What:** Removed the separate "Media" tab from the Designer modal.
- **Why:** Streamlines workflow — users no longer switch tabs to add photos/music.
- **How:** AIChatPanel now has (+) button for uploading photos and music directly in the chat. Uploaded files appear as chat messages. Gallery photo thumbnails shown at bottom of chat. Both Envelope AI and Page AI tabs support upload.

### Feature: AI Image Generation (#38)
- **What:** Generate custom design element images (flowers, borders, ornaments, cultural motifs) using Gemini AI.
- **New endpoint:** `POST /api/designer/generate-image` — uses `gemini-2.0-flash-exp` model with image output.
- **Flow:** User types description → clicks 🎨 button → AI generates image → saved to server → user clicks "Add to Gallery" → available as PHOTO_N in design prompts.
- **Use cases:** Chinese wedding decorations, floral borders, animated element backgrounds, cultural motifs.
- **Both envelope and page AI** can generate and use these images in their designs.

### Change: Gallery Photo Limit Removed (#39)
- 6-photo cap removed. Default maxPhotos now 99.
- AI-generated design elements need gallery space; old limit was too restrictive.

## Files Changed
- `src/app/actions/invitation.ts` — MIME-based extension in savePhoto()
- `src/app/dashboard/designer/page.tsx` — Parse galleryPhotos JSON string
- `src/components/designer/DesignerModal.tsx` — Removed Media tab, wired new AIChatPanel props
- `src/components/designer/AIChatPanel.tsx` — Added upload (+), AI image gen (🎨), gallery thumbnails, music support
- `src/components/designer/MediaUploader.tsx` — Removed 6-photo max (now 99)
- `src/app/api/designer/generate/route.ts` — Updated prompts, removed photo cap references
- `src/app/api/designer/generate-image/route.ts` — **New:** AI image generation endpoint
- `CLAUDE.md` — Bug patterns #35-#39
- `majorupdate.md` — This file

## Testing
- Build succeeds (no warnings) ✓
- All 65 unit tests pass ✓
- All routes registered including new `/api/designer/generate-image` ✓
- Type checking passes ✓
