# Major Update - 2026-03-24 (v14)

## Summary
Added configurable image generation model setting (`gemini-3.1-flash-image-preview`), fixed photo upload being misused as background, rebuilt AI design system with multi-turn refinement for major redesigns, added 10 preset prompts each for Page AI and Envelope AI, multi-element image generation.

*(See Part 2 below for the deep-design pipeline overhaul)*

---

# Major Update Part 2 - 2026-03-24 (v15)

## Summary
Complete overhaul of the AI design pipeline. Comprehensive mode now runs a 3-phase deep-design pipeline (Planning → Image Generation → Design Assembly) that takes 1-5 minutes for full page/envelope redesigns with AI-generated custom images.

## Problem
- Previous system just asked text model for a JSON config → returned in ~5 seconds
- No actual image generation was happening during design requests
- AI only changed background colors and fonts, no real visual elements created
- No back-and-forth conversation to refine the design plan

## Solution: 3-Phase Deep Design Pipeline

### Phase 1: Planning (back-and-forth, up to 15 turns)
- Text model (`gemini-3.1-flash-lite-preview`) iterates with itself, planning:
  - Which decorative images are needed (flowers, borders, motifs, icons)
  - Color palette and typography
  - Animation concepts
  - For each image: what it is, size (e.g. 200x200), position (e.g. top-left corner), CSS placement
- AI must output "OPTIMAL" keyword to signal plan completion (acts as a brake)
- By turn 10, system forces finalization regardless
- Max 15 turns safety limit

### Phase 2: Image Generation
- Image model (`gemini-3.1-flash-image-preview`) generates each planned element
- Each element generated with `responseModalities: ["TEXT", "IMAGE"]`
- Images saved to `public/uploads/photos/ai-{uuid}.{ext}`
- Image metadata includes: url, description, width, height, position, cssPlacement
- Cap: 8 elements max per design
- Images auto-added to gallery

### Phase 3: Design Assembly
- Text model receives ALL generated images + their metadata
- Produces complete CSS/HTML config that:
  - Positions every generated image using their cssPlacement data
  - Creates matching color palette and typography
  - Includes @keyframes animations (float, shimmer, fadeIn, pulse)
  - Creates a cohesive theme tying everything together
  - Must include ALL generated images in customCss/customHtml
- This is a FULL redesign, not just background color changes

### Visual Progress in Chat
- System messages show each phase:
  - "🔍 Phase 1/3 — Planning design elements and layout..."
  - "🎨 Phase 2/3 — Generated N design element images"
  - "🏗️ Phase 3/3 — Assembled complete design with all elements"
- Pulsing amber indicator during processing
- Shows "Deep designing... (1-5 min)" in loading state
- Generated images displayed in grid before Apply button

## Files Changed
- `src/app/api/designer/deep-design/route.ts` — **New:** 3-phase pipeline endpoint
- `src/components/designer/AIChatPanel.tsx` — Comprehensive mode routes to deep-design, shows phase progress, system messages
- `CLAUDE.md` — Bug pattern #40 (deep design pipeline)
- `majorupdate.md` — Part 2

## Testing
- Build succeeds ✓
- All 65 unit tests pass ✓
- New `/api/designer/deep-design` route registered ✓
- Style-only mode still uses fast `/api/designer/generate` ✓
