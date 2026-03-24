# Major Update - 2026-03-24 (v10)

## Summary
Comprehensive AI Designer rewrite with full page rewriting capability, photo reference system, JS/CSS/animation generation, design mode toggle, save auto-publish, media tab rewrite with 6-photo limit, and reinstall.sh fix.

## Changes

### AI Designer — Comprehensive Rewrite (#1, #1.0, #1.1, #3, #4)

#### Two Design Modes — Toggle in Top Bar (#6)
- **Comprehensive Mode (Full)**: AI generates complete custom CSS with @keyframes animations, custom HTML with floating elements, photo backgrounds with text overlays, gradients, parallax effects, shimmer text, decorative SVGs
- **Style Mode**: Quick font and color changes only — no CSS/HTML generation
- Toggle switch in designer top bar labeled "Full" / "Style"

#### API Route Rewritten with 4 Prompt Templates
- `COMPREHENSIVE_ENVELOPE_PROMPT`: Full envelope redesign — animations, gradients, backdrop-filter, custom CSS/HTML
- `COMPREHENSIVE_INVITATION_PROMPT`: Full page rewrite — parallax hero, photo section backgrounds with text overlays, @keyframes animations, custom JS/CSS, decorative elements
- `SIMPLE_ENVELOPE_PROMPT`: Colors + font only
- `SIMPLE_INVITATION_PROMPT`: Colors + font + section toggles only
- API accepts `comprehensive: boolean` to select mode
- Photo reference system: `PHOTO_0` through `PHOTO_5` in CSS/HTML automatically replaced with actual URLs

#### AIChatPanel Rewritten
- Different preset prompts for each mode × each design level (4 sets total)
- Comprehensive presets guide users to ask for parallax, photo overlays, animations, custom elements
- Shows CSS/HTML badges when AI returns custom code
- Photo reference instructions shown when gallery has photos

### Media Tab Rewrite (#2)
- **6-photo maximum** enforced with clear count display
- **Photo index labels** shown on each uploaded photo: `photo[0]`, `photo[1]`, etc.
- Index labels enable AI reference — users can say "use photo[0] as hero background"
- Help text explains photo reference system for AI
- Auto-crop via existing Sharp image processing on upload

### Save Button Auto-Publish (#5)
- If invitation is already published, Save button auto-publishes (no need to click Publish separately)
- Button label: "Save & Publish" (if published) or "Save Draft" (if not)
- Status toast: "Saved & Published" or "Saved as Draft" shown for 3 seconds
- Publish button remains for initial publishing of drafts

### reinstall.sh Fix (#7)
- Script now auto-detects source files instead of requiring user to be in the source directory
- Checks `SCRIPT_DIR` first (where reinstall.sh lives)
- Falls back to existing install at `/opt/einvite` if available
- Clear error message if neither location has source files

## Files Changed
- `src/app/api/designer/generate/route.ts` — Complete rewrite: 4 prompt templates, photo reference replacement, comprehensive toggle
- `src/components/designer/AIChatPanel.tsx` — Complete rewrite: mode-specific prompts, comprehensive prop, CSS/HTML badges
- `src/components/designer/DesignerModal.tsx` — Comprehensive toggle, save auto-publish, status toast, media tab updates
- `src/components/designer/MediaUploader.tsx` — 6-photo max, index labels, maxPhotos prop
- `reinstall.sh` — Auto-detect source path
- `CLAUDE.md` — Model name verified as gemini-3.1-flash-lite-preview
- `majorupdate.md` — This file

## Testing
- Build succeeds ✓
- All routes registered ✓
- Type checking passes ✓
