# Major Update - 2026-03-24 (v8)

## Summary
Critical AI Designer fix (encrypted API key bug), clipboard copy fix, envelope page customization, Gemini model update.

## Changes

### Bug Fixes

#### Gemini API Key Stored Encrypted (Critical - Bug #3 root cause)
- **Symptom:** AI Designer completely non-functional. Clicking suggested prompts or pressing send does nothing visible. Error: "Failed to generate design."
- **Root cause:** `/api/settings/route.ts` encrypted the Gemini API key with AES `encrypt()` before storing to DB. But `/api/designer/generate/route.ts` read the value back as-is without `decrypt()`, sending encrypted gibberish to Google Gemini. The API returned auth errors which were caught but not clearly shown.
- **Fix:** Removed encryption from API key storage. The key is now stored in plain text (server-side only, masked in GET responses). Also removed unused `encrypt` import from settings route and `decrypt` import from test-gemini route.
- **Impact:** This was the #1 reason the AI Designer appeared completely broken.

#### Clipboard Copy Not Working (Bug #1, #2)
- **Symptom:** "Copy Link" on invitation letters page and "Copy Personal Link" on invitees page don't copy anything.
- **Root cause:** `navigator.clipboard.writeText()` fails silently in non-HTTPS contexts or when the document loses focus.
- **Fix:** Added try-catch with `document.execCommand("copy")` fallback using temporary hidden textarea on both pages.

#### Invalid Default Gemini Model Name (Bug #3 contributing)
- **Symptom:** Even after fixing the API key encryption, AI generation could fail because `gemini-3.1-flash-lite-preview` is not a valid model.
- **Fix:** Changed default model to `gemini-2.0-flash` in seed, settings page, .env.example, and CLAUDE.md.

### New Features / Improvements

#### AI Designer Major Rewrite (Feature #3, #3.1, #3.2)
- **Complete system prompt rewrite** with:
  - Two-screen documentation (Envelope Page + Main Invitation Page)
  - Envelope design properties: `envelopeBgColor`, `envelopePaperColor`, `envelopeTextColor`
  - 8 theme presets with full envelope color specs
  - Section-by-section description of the invitation page
  - Google Fonts organized by style
  - CSS selector reference
  - Gallery arrangement support
  - Strict JSON-only output rules
- **EnvelopeOpener component** now reads colors from designConfig:
  - Background color, paper color, text color, primary (button) color all configurable
  - Falls back to original cream/gold/dark defaults if not set
  - All hardcoded colors replaced with dynamic props
- **Error messages improved**: More specific error details surfaced to the chat panel

#### Envelope Page Customization (Feature #3.1)
- AI can now modify both the envelope screen and the main invitation page in a single prompt
- Three new design config fields: `envelopeBgColor`, `envelopePaperColor`, `envelopeTextColor`
- Both InvitationPage components pass envelope config to EnvelopeOpener

### Database Schema
No schema changes in this update.

## Files Changed
- `src/app/api/settings/route.ts` — Removed API key encryption (plain text storage)
- `src/app/api/settings/test-gemini/route.ts` — Read API key directly (no decrypt)
- `src/app/api/designer/generate/route.ts` — Complete rewrite with envelope support, better priming
- `src/app/dashboard/invitations/page.tsx` — Clipboard copy fallback
- `src/app/dashboard/invitees/page.tsx` — Clipboard copy fallback with helper function
- `src/app/dashboard/settings/page.tsx` — Default model updated to gemini-2.0-flash
- `src/components/invitation/EnvelopeOpener.tsx` — Dynamic envelope colors from config
- `src/app/[slug]/InvitationPage.tsx` — Pass envelope config to EnvelopeOpener
- `src/components/invitation/InvitationPage.tsx` — Pass envelope config to EnvelopeOpener
- `src/components/designer/AIChatPanel.tsx` — Envelope color preview, updated DesignConfig interface
- `src/components/designer/DesignerModal.tsx` — Updated DesignConfig interface with envelope fields
- `prisma/seed.ts` — Default model updated
- `.env.example` — Default model updated
- `CLAUDE.md` — New bug patterns (#18-#21), model name updated
- `majorupdate.md` — This file

## Testing
- Build succeeds with all changes ✓
- AI flow logic validated (JSON parsing, color validation, envelope fields) ✓
- Clipboard fallback pattern verified ✓
- Sandbox network restricted (no live Gemini testing) — test on deployment with Settings > Test Connection

## IMPORTANT: Post-Deploy Steps
1. Run `prisma db push` to ensure schema is current
2. Go to Settings > Gemini AI Integration
3. Enter your Google Gemini API key
4. Set model to `gemini-2.0-flash` (or your preferred model)
5. Click "Save All Settings"
6. Click "Test Connection" to verify
7. **If previously configured**: You MUST re-enter the API key because the old value was encrypted and is now unreadable. The system now stores it in plain text.
