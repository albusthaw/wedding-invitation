# Major Update - 2026-03-24 (v9)

## Summary
Complete AI Designer rewrite with dual-tab Envelope/Invitation design, role-based access control (admin vs client), Gemini model name fix, and new client dashboard.

## Changes

### AI Designer Complete Rewrite (Bug #1, #2, #3)

#### AIChatPanel.tsx — Rewritten from scratch
- **New `mode` prop**: `"envelope"` or `"invitation"` — each has its own preset prompts and context
- **Direct fetch to `/api/designer/generate`** with proper error handling and error banner display
- **Preset prompt buttons**: 6 envelope-specific prompts + 8 invitation-specific prompts, all clickable
- **Send button**: Properly wired with `doSend()` function, disabled while loading
- **Apply Changes**: Shows color preview chips, applies config on click
- **Undo support**: Config history stack with undo button
- **Error display**: Red banner below chat with dismiss button

#### /api/designer/generate/route.ts — Rewritten
- **Dual system prompts**: `ENVELOPE_PROMPT` and `INVITATION_PROMPT` — each tailored with exact element descriptions
- **Envelope prompt** documents: background color, paper color, text color, button/seal color, stamp, greeting
- **Invitation prompt** documents: Hero, Wedding Details, Countdown, Gallery, RSVP, Footer, Message Wall
- **Mode parameter**: API accepts `mode: "envelope" | "invitation"` to select the right prompt
- **5 envelope presets + 6 invitation presets** included in prompts
- **Validation**: hex color regex, boolean checks, font validation, undefined cleanup

#### DesignerModal.tsx — Updated tabs
- **Replaced single "AI" tab** with two tabs: "Envelope" (envelope design AI) and "Page AI" (invitation page AI)
- Tab IDs: `"envelope-ai"`, `"page-ai"`, `"style"`, `"sections"`, `"media"`, `"css"`
- Each AI tab renders `AIChatPanel` with the appropriate `mode` prop

### Gemini Model Name Fix (Bug #3)
- **Reverted to `gemini-3.1-flash-lite-preview`** everywhere:
  - `.env.example`, `prisma/seed.ts`, `src/app/dashboard/settings/page.tsx`
  - `src/lib/gemini.ts`, `src/app/api/designer/generate/route.ts`
  - `src/app/api/settings/test-gemini/route.ts`, `CLAUDE.md`
- **Rule**: This model name is correct. Do NOT change it.

### Role-Based Access Control (Bug #5, #5.1, #5.2)

#### Sidebar.tsx — Role-aware navigation
- Nav items now have `adminOnly` flag
- CLIENT users only see: Dashboard, Invitees, Messages
- ADMIN users see all: Dashboard, Invitation Letters, Users, Invitees, Designer, Messages, Settings
- Subtitle shows "Admin Dashboard" or "Client Portal" based on role

#### Dashboard page — Split by role
- **Admin**: Original dashboard with stats cards (Total Invitations, Users, Messages, Published Rate), recent invitations, recent messages
- **Client**: New "My Invitations" page showing assigned invitation cards with:
  - Title, couple names, slug, wedding date
  - Invitee and message counts
  - Preview link (if published)
  - "Manage Invitees" link → `/dashboard/invitees?invitationId=xxx`

#### Proxy route protection
- Admin-only routes blocked for CLIENT: `/dashboard/invitations`, `/dashboard/users`, `/dashboard/designer`, `/dashboard/settings`
- CLIENT attempting admin routes gets redirected to `/dashboard`

#### API access control
- **GET /api/invitations**: Admin sees all; Client sees only assigned invitations
- **GET /api/messages**: Admin sees all; Client sees only messages for assigned invitations
- **DELETE /api/messages**: Admin deletes any; Client can delete messages for their assigned invitations
- **GET/POST/DELETE /api/invitees**: Access checked against UserInvitation assignments

#### Invitees page — Query param support
- Accepts `?invitationId=xxx` URL param for pre-selecting invitation
- Works with client dashboard "Manage Invitees" links

### Old Code Cleanup (Bug #4)
- Removed old single-AI tab rendering code from DesignerModal
- Removed stale `renderAITab()` function, replaced with `renderEnvelopeAITab()` and `renderPageAITab()`

## Files Changed
- `src/components/designer/AIChatPanel.tsx` — Complete rewrite with mode support
- `src/app/api/designer/generate/route.ts` — Complete rewrite with dual prompts
- `src/components/designer/DesignerModal.tsx` — Two AI tabs, updated interfaces
- `src/components/Sidebar.tsx` — Role-aware nav with adminOnly flags
- `src/app/dashboard/page.tsx` — Split admin/client dashboard
- `src/proxy.ts` — Admin-only route blocking for clients
- `src/app/api/invitations/route.ts` — Role-based filtering
- `src/app/api/messages/route.ts` — Role-based access for GET and DELETE
- `src/app/api/invitees/route.ts` — Assignment-based access check
- `src/app/dashboard/invitees/page.tsx` — URL param preselection
- `.env.example` — Model name reverted
- `prisma/seed.ts` — Model name reverted
- `src/app/dashboard/settings/page.tsx` — Model name reverted
- `src/lib/gemini.ts` — Model name reverted
- `src/app/api/settings/test-gemini/route.ts` — Model name reverted
- `CLAUDE.md` — Bug pattern #21 updated, model name reverted
- `majorupdate.md` — This file

## Testing
- Build succeeds with all changes ✓
- All routes registered correctly ✓
- Type checking passes ✓

## Post-Deploy Steps
1. Run `prisma db push` to ensure schema is current
2. Go to Settings and re-enter Gemini API key if needed (old encrypted values won't work)
3. Verify model is `gemini-3.1-flash-lite-preview`
4. Test AI Designer: Open Designer > Click "Envelope" tab > Click any preset prompt
5. Test Client access: Log in as CLIENT user, verify restricted navigation
