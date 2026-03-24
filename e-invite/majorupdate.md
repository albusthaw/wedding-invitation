# Major Update - 2026-03-24 (v14)

## Summary
Added configurable image generation model setting (`gemini-3.1-flash-image-preview`), fixed photo upload being misused as background, rebuilt AI design system with multi-turn refinement for major redesigns, added 10 preset prompts each for Page AI and Envelope AI, multi-element image generation.

## Changes

### Settings: Image Generation Model (#38 update)
- New `geminiImageModel` setting in Settings page, stored in DB
- Positioned above API Key field
- Default: `gemini-3.1-flash-image-preview` (the correct image-capable model)
- Text design model (`gemini-3.1-flash-lite-preview`) and image generation model are now separate and independently configurable
- Seed script updated to include default `geminiImageModel`

### Fix: Photo Upload Background Misuse (#38b)
- **Problem:** Uploading a photo and asking AI "add to gallery" caused AI to set it as entire page `backgroundImage`
- **Fix:** Rewrote all comprehensive AI prompts with explicit CRITICAL rules:
  - "add to gallery" → keep `enableGallery=true`, NOT `backgroundImage`
  - "use as background" → put in `backgroundImage` or `customCss`
  - Added REMINDER in context when photos exist
  - Photos default to gallery grid, only moved to background when explicitly requested

### Multi-Turn AI Refinement (#38c)
- Major redesigns (keywords: complete, redesign, chinese, japanese, indian, theme, etc.) now use 2-step AI process:
  1. **Plan**: AI describes design approach + generates initial JSON
  2. **Refine**: AI self-critiques the plan and outputs improved, cohesive final JSON
- Only triggers in comprehensive mode for major redesign requests
- Simple color/font changes still use single-turn for speed

### Multi-Element Image Generation (generate-image endpoint rewrite)
- Text model plans 3-6 design elements from a single prompt
- Image model generates each element separately
- All images returned together, user adds all to gallery at once
- Example: "Chinese wedding decorations" → generates red peonies, gold double-happiness, silk pattern, lantern, etc.
- Cap: 6 elements max per generation request

### 10 Preset Prompts (#38d)
- **Envelope AI (comprehensive)**: Chinese wedding, dark moody, vintage lace, royal purple, tropical beach, art deco, rustic barn, winter wonderland, Japanese sakura, Indian mandala
- **Page AI (comprehensive)**: Chinese wedding, garden party, luxury black/gold, beach tropical, royal Indian, rustic barn, modern minimalist, Japanese sakura, art deco gatsby, winter wonderland

## Files Changed
- `src/app/dashboard/settings/page.tsx` — Added geminiImageModel field
- `src/app/api/designer/generate/route.ts` — Rewrote all prompts, added multi-turn refinement, photo handling rules
- `src/app/api/designer/generate-image/route.ts` — Reads image model from DB, multi-element generation
- `src/components/designer/AIChatPanel.tsx` — 10 presets each, multi-image display, "Add All to Gallery"
- `prisma/seed.ts` — Added geminiImageModel default
- `CLAUDE.md` — Updated #38, added #38b-#38d
- `majorupdate.md` — This file

## Testing
- Build succeeds ✓
- All 65 unit tests pass ✓
- All routes registered ✓
- Type checking passes ✓
