# E-Invite - Wedding Invitation System

## Project Overview
E-Invite is a full-stack wedding invitation management system built with Next.js. It allows administrators to create, design, and manage beautiful animated wedding invitation pages with AI-powered design capabilities.

## Tech Stack
- **Framework**: Next.js 16.x (App Router, Server Components, Server Actions)
- **Language**: TypeScript 5.9.x
- **UI**: React 19.x + Tailwind CSS 4.x
- **Animations**: Framer Motion 12.x
- **Database**: MySQL via Prisma ORM 7.x
- **Auth**: NextAuth.js v5 (Auth.js) with JWT strategy
- **AI**: Google Gemini API (`@google/genai`) - default model: `gemini-3.1-flash-lite-preview`
- **Image Processing**: Sharp 0.34.x
- **Audio**: Native HTML5 Audio API
- **Runtime**: Node.js 24.x LTS

## Project Structure
```
e-invite/
├── prisma/
│   ├── schema.prisma          # Database schema (MySQL)
│   └── seed.ts                # Database seeding script
├── public/
│   └── uploads/
│       ├── photos/            # Uploaded wedding photos
│       └── music/             # Uploaded .mp3 files
├── src/
│   ├── app/
│   │   ├── [slug]/            # Public invitation pages (dynamic)
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # NextAuth endpoints
│   │   │   ├── designer/      # AI designer endpoints
│   │   │   ├── invitations/   # Invitation CRUD
│   │   │   ├── invitees/      # Invitee CRUD + bulk import
│   │   │   ├── messages/      # Public messages endpoint
│   │   │   ├── rsvp/          # Public RSVP endpoint
│   │   │   ├── settings/      # Settings + Gemini test
│   │   │   ├── upload/        # File upload endpoint
│   │   │   └── users/         # User CRUD
│   │   ├── actions/           # Server actions
│   │   │   ├── designer.ts    # AI design generation
│   │   │   ├── invitation.ts  # Invitation CRUD actions
│   │   │   ├── invitee.ts     # Invitee management
│   │   │   ├── message.ts     # Message actions
│   │   │   ├── settings.ts    # Settings actions
│   │   │   └── user.ts        # User CRUD actions
│   │   ├── dashboard/         # Admin dashboard pages
│   │   │   ├── designer/      # AI Designer page
│   │   │   ├── invitations/   # Invitation management
│   │   │   ├── invitees/      # Invitee management (CRUD, CSV, links)
│   │   │   ├── messages/      # Messages management
│   │   │   ├── settings/      # Settings page
│   │   │   └── users/         # User management
│   │   ├── login/             # Login page
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── designer/          # Designer modal components
│   │   │   ├── AIChatPanel.tsx
│   │   │   ├── ColorPicker.tsx
│   │   │   ├── DesignerModal.tsx
│   │   │   ├── FontSelector.tsx
│   │   │   ├── MediaUploader.tsx
│   │   │   └── PreviewPopup.tsx
│   │   ├── invitation/        # Public invitation components
│   │   │   ├── CountdownTimer.tsx
│   │   │   ├── EnvelopeOpener.tsx
│   │   │   ├── InvitationPage.tsx
│   │   │   ├── MessageWall.tsx
│   │   │   ├── MusicPlayer.tsx
│   │   │   ├── PhotoGallery.tsx
│   │   │   ├── RsvpForm.tsx
│   │   │   └── WeddingDetails.tsx
│   │   ├── SessionProvider.tsx
│   │   └── Sidebar.tsx
│   ├── lib/
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── encryption.ts      # AES encryption for special links
│   │   ├── gemini.ts          # Gemini AI client utility
│   │   └── prisma.ts          # Prisma client singleton
│   ├── types/
│   │   ├── index.ts           # App TypeScript types
│   │   └── next-auth.d.ts     # NextAuth type augmentation
│   ├── auth.ts                # Auth re-exports
│   └── proxy.ts              # Route protection proxy (Next.js 16)
├── .env                       # Environment variables
├── .env.example               # Environment template
├── install.sh                 # VPS installation script (fresh server)
├── reinstall.sh               # VPS reinstallation script (existing server)
├── package.sh                 # ZIP packaging script
├── next.config.ts             # Next.js configuration
├── package.json               # Dependencies
├── postcss.config.mjs         # PostCSS config
└── tsconfig.json              # TypeScript config
```

## Key Concepts

### Invitation Flow
1. Admin creates an InvitationLetter with slug, groom/bride names, date, venue
2. Admin assigns Users (clients) who can manage invitees for that invitation
3. Clients add invitees, generating encrypted special links
4. Admin designs the page using the AI Designer
5. Admin publishes the invitation
6. Public accesses `domain.com/{slug}` or `domain.com/{slug}?special={code}`

### Special Invitee Links
- Encrypted using AES-256-CBC with NEXTAUTH_SECRET as key
- Format: `name::invitationId` encrypted to URL-safe base64
- Decrypted on the public page to show personalized greeting

### Design Config
The `designConfig` JSON field on InvitationLetter stores:
```json
{
  "primaryFont": "Great Vibes",
  "backgroundColor": "#0d0505",
  "primaryColor": "#ed5566",
  "accentColor": "#c9a96e",
  "textColor": "#ffffff",
  "backgroundImage": "",
  "enableGallery": true,
  "enableRsvp": true,
  "enableCountdown": true,
  "enableMessages": true,
  "customCss": ""
}
```

### Google Maps Plus Code
The `mapPlusCode` field on InvitationLetter stores a Google Maps Plus Code (e.g., `X3XP+44 Mandalay, Myanmar (Burma)`). When set, a map pin button appears next to the venue name on the public invitation page, linking to Google Maps search for that Plus Code.

### Publish/Unpublish
- Invitation must be published to be publicly visible
- Design changes after publishing set `needsRepublish = true`
- Republishing from either Invitations page or Designer resets the flag

## Development Commands
```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run start        # Start production server
npm run db:push      # Push Prisma schema to database
npm run db:seed      # Seed default data
npx prisma studio    # Open Prisma Studio GUI
```

## Default Admin Credentials
- Email: `admin@einvite.com`
- Password: `admin123`
- **Change these after first login!**

## Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | MySQL connection string | mysql://root:password@localhost:3306/einvite |
| NEXTAUTH_SECRET | JWT signing secret | (generate random) |
| NEXTAUTH_URL | App base URL | http://localhost:3000 |
| GEMINI_API_KEY | Google Gemini API key | (empty) |
| GEMINI_MODEL | Gemini model name | gemini-3.1-flash-lite-preview |

## Photo Upload & AI Optimization
- Upload endpoint validates image dimensions (max 2000x2000) and file size (max 2MB)
- Oversized images are automatically resized and compressed via Sharp
- When a photo is optimized, the API returns `wasOptimized: true` and an `aiSuggestion` string
- The MediaUploader component displays this AI feedback to guide the user
- Users can use the AI Designer chat to request further image adjustments

## ZIP Packaging (einvite.zip)

### How einvite.zip is repacked
The zip is always repacked from **fresh source code** — no build artifacts, no dependencies, no user data. On a fresh VPS, unzip then run `install.sh` and it handles everything.

**Repack command** (run from the project root `/home/user/wedding-invitation`):
```bash
rm -f einvite.zip
cd e-invite && zip -r ../einvite.zip . \
  -x "./node_modules/*" \
  -x "./.next/*" \
  -x "./.env" \
  -x "./public/uploads/photos/*" \
  -x "./public/uploads/music/*" \
  -x "./.git/*" \
  -x "./prisma/*.db" \
  -x "./prisma/*.db-journal" \
  -x "./tsconfig.tsbuildinfo" \
  -x "*.DS_Store" \
  -x "./package-lock.json"
# Re-add directory placeholder files
zip ../einvite.zip \
  public/uploads/photos/.gitkeep \
  public/uploads/music/.gitkeep
cd ..
```

**What gets included:**
- All source code (`src/`, `prisma/`, `public/`)
- Config files (`package.json`, `tsconfig.json`, `next.config.ts`, etc.)
- `.env.example` (template, NOT the actual `.env`)
- `install.sh` (executable, handles full VPS setup)
- `reinstall.sh` (executable, handles conflict-free reinstall)
- `package.sh` (convenience script for timestamped archives)
- `CLAUDE.md`, `README.md`, `.gitignore`
- Upload directory placeholders (`.gitkeep`)

**What gets excluded:**
- `node_modules/` — `npm install` handles this
- `.next/` — `npm run build` recreates this
- `.env` — `install.sh` generates this with random secrets
- `package-lock.json` — regenerated by `npm install`
- `tsconfig.tsbuildinfo` — build cache artifact
- `public/uploads/photos/*`, `public/uploads/music/*` — user data
- `.git/` — not needed for deployment
- `.DS_Store` — macOS artifacts

**Deployment flow after unzip:**
```bash
unzip einvite.zip -d e-invite
cd e-invite
chmod +x install.sh reinstall.sh
sudo ./install.sh          # Fresh server
# OR
sudo ./reinstall.sh        # Existing server (drops DB, preserves uploads)
```

`install.sh` will automatically:
1. Install Node.js LTS, MySQL, Nginx, PM2
2. Create database and user with random password
3. Generate `.env` with secure secrets
4. Run `npm install` (installs all deps + runs `prisma generate` via postinstall)
5. Run `prisma db push` (creates tables)
6. Run seed script (creates default admin)
7. Run `npm run build` (production build)
8. Configure Nginx reverse proxy
9. Start app via PM2 with auto-restart
10. Configure UFW firewall

**Alternative: `./package.sh`** creates a timestamped archive (`einvite-v1.0.0-20260323_120000.zip`) using the same exclusions.

## Hold / Continue Protocol
When the user says "Hold", the protocol is:
1. Push all current work to the branch
2. Create `tocontinue.md` in the project root with exact next steps
3. Stop work

When the user says "Restart", pick up from `tocontinue.md` and continue.

## Bug Patterns

Known bugs found and fixed — watch for regressions:

### 1. Prisma Default Import (Fixed)
**Symptom:** Inconsistent database behavior, potential multiple PrismaClient instances.
**Root cause:** Some files used `import prisma from "@/lib/prisma"` (default) while others used `import { prisma } from "@/lib/prisma"` (named). The default export was removed.
**Rule:** Always use `import { prisma } from "@/lib/prisma"`. Never add `export default` back to `prisma.ts`.
**Files affected:** All server actions in `src/app/actions/`.

### 2. NextAuth `authorized` Callback in Wrong Location (Fixed)
**Symptom:** Server error on login, unexpected middleware conflicts.
**Root cause:** The `authorized` callback was placed inside the `callbacks` object in the NextAuth config. In NextAuth v5, `authorized` is a middleware-only callback — it belongs in the middleware wrapper (`auth()`), not in the config `callbacks`.
**Rule:** Never add `authorized` to the callbacks object in `src/lib/auth.ts`. Route protection logic belongs in `src/proxy.ts`.

### 3. Missing `trustHost` for Reverse Proxy (Fixed)
**Symptom:** Login fails with CSRF/callback URL errors when running behind Nginx.
**Root cause:** NextAuth v5 requires `trustHost: true` when the app is behind a reverse proxy that sets X-Forwarded headers.
**Rule:** Keep `trustHost: true` in the NextAuth config. Do not remove it.

### 4. Unhandled Error in `authorize()` (Fixed)
**Symptom:** Server 500 error on login if database is unreachable or query fails.
**Root cause:** No try-catch around the database lookup and bcrypt comparison in the credentials provider's `authorize` function.
**Rule:** The `authorize` function must have try-catch wrapping all async operations. On error, log and return `null` (not throw).

### 5. NPM Vulnerability in `effect` (Prisma Transitive Dependency) (Fixed)
**Symptom:** `npm audit` reports high severity vulnerability in `effect` < 3.20.0.
**Root cause:** Prisma's `@prisma/config` depends on `effect` which had an AsyncLocalStorage context leak.
**Rule:** The `overrides` field in `package.json` pins `effect` to `^3.21.0`. Do not remove this override until Prisma ships a fix natively.

### 6. Next.js 16 Middleware Deprecation (Fixed)
**Symptom:** `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.` warning on startup.
**Root cause:** Next.js 16 renamed `middleware.ts` to `proxy.ts`.
**Fix:** Renamed `src/middleware.ts` → `src/proxy.ts`. Replaced the `auth()` wrapper with a standalone proxy function that uses `getToken()` from `next-auth/jwt` to check authentication status directly.
**Rule:** Never use `export default auth(...)` in `src/proxy.ts`. Use `getToken()` from `next-auth/jwt` for session checks in the proxy. The file must be named `proxy.ts`, not `middleware.ts`.

### 8. `__Host-` Secure Cookies Cause MissingCSRF Behind TLS Proxy (Fixed)
**Symptom:** Login fails with `MissingCSRF` when site uses Cloudflare HTTPS (or any TLS-terminating proxy).
**Root cause:** With `NEXTAUTH_URL=https://...`, NextAuth auto-detects `useSecureCookies=true`, which sets the CSRF cookie with `__Host-` prefix and `Secure` flag. The `__Host-` prefix is extremely strict — it requires the cookie to be served from an HTTPS origin with exact path and no Domain attribute. When the app server itself only sees HTTP (behind Cloudflare/Nginx), the strict requirements of `__Host-` cookies can fail due to proxy behavior, Cloudflare edge processing, or browser enforcement quirks. The browser doesn't store/send the cookie → `MissingCSRF`.
**Fix:** Set `useSecureCookies: false` in the NextAuth config. HTTPS security is provided by Cloudflare at the edge, not by cookie flags. Cookies now use plain names (`authjs.csrf-token` instead of `__Host-authjs.csrf-token`) without the `Secure` flag, which works reliably behind any TLS-terminating proxy.
**Verified:** Full signIn flow tested in sandbox with `NEXTAUTH_URL=https://`, confirmed login succeeds and session is properly created.
**Rule:** Always set `useSecureCookies: false` in the NextAuth config when the app runs behind a TLS-terminating proxy (Cloudflare, Nginx+certbot). Never remove this setting.

### 9. Nginx `X-Forwarded-Proto $scheme` Wrong Behind Cloudflare (Fixed)
**Symptom:** Nginx sends `X-Forwarded-Proto: http` to Node.js when behind Cloudflare.
**Root cause:** `proxy_set_header X-Forwarded-Proto $scheme;` uses Nginx's local scheme, which is always `http` when Cloudflare→Nginx is HTTP. This overwrites Cloudflare's `X-Forwarded-Proto: https`.
**Fix:** Nginx config now passes through upstream proxy's `X-Forwarded-Proto` when present, falling back to `$scheme`.
**Rule:** Never use bare `$scheme` for `X-Forwarded-Proto` when behind a CDN.

### 10. Generic Login Error Message Hides Real Failure (Fixed)
**Symptom:** Login page shows "Invalid email or password" for ALL auth failures, including CSRF errors.
**Fix:** Login page now shows "Invalid email or password" only for `CredentialsSignin`. Other errors show the actual error code.
**Rule:** Always show the specific error type for non-credential errors on the login page.

### 7. Deprecated Type Stub Packages (Fixed)
**Symptom:** `npm warn deprecated @types/bcryptjs` and `npm warn deprecated @types/uuid` during installation.
**Root cause:** bcryptjs 3.x and uuid 13.x now ship their own TypeScript types. The separate `@types/*` packages are no longer needed and show deprecation warnings.
**Fix:** Removed `@types/bcryptjs` and `@types/uuid` from dependencies.
**Rule:** Do not re-add `@types/bcryptjs` or `@types/uuid` to `package.json`.

### 11. Missing POST Handler for User Creation (Fixed)
**Symptom:** Creating a user shows "Failed to execute 'json' on 'Response': Unexpected end of JSON input".
**Root cause:** `/api/users/route.ts` only had a GET handler. POST returned 405 with empty body.
**Fix:** Added POST handler with validation, duplicate check, bcrypt hashing, and invitation assignment.
**Rule:** Every API route that a client-side form POSTs to must have a POST handler. Always return JSON from API routes, even for errors.

### 12. Missing PUT Handler for Invitation Updates (Fixed)
**Symptom:** Designer can't save designs; PUT to `/api/invitations/[id]` returns 405.
**Root cause:** Route only had GET and DELETE — no PUT handler.
**Fix:** Added PUT handler supporting all invitation fields.
**Rule:** The designer page saves via `PUT /api/invitations/[id]`. This handler must exist.

### 13. Client-Side Fetch Caching (Fixed)
**Symptom:** Data appears on Dashboard (Server Component) but not on client pages that fetch from API.
**Root cause:** Browser or Next.js may cache client-side `fetch()` responses. Client component pages fetch from API routes, while the Dashboard queries Prisma directly as a Server Component.
**Fix:** Added `{ cache: "no-store" }` to all client-side `fetch()` calls for API data.
**Rule:** Always use `{ cache: "no-store" }` for client-side fetches that need fresh data. Server Components query Prisma directly and don't have this issue.

### 14. Missing POST Handler for Messages/Blessings (Fixed)
**Symptom:** "Send Blessing" button submits but message never appears. No error shown.
**Root cause:** `/api/messages/route.ts` only had GET and DELETE handlers. The MessageWall component POSTs to `/api/messages` but got 405.
**Fix:** Added POST handler to `/api/messages/route.ts` with validation and IP-based one-time limiting.
**Rule:** The MessageWall sends blessings via `POST /api/messages`. This handler must exist and be public (no auth required).

### 15. URL Slug Not Editable After Creation (Fixed)
**Symptom:** Custom slug changes are lost when saving an invitation letter edit.
**Root cause:** The edit page displayed slug as read-only text. The `updateInvitation` server action never read a `slug` field from formData.
**Fix:** Made slug editable in the edit form. Added slug handling to `updateInvitation` with sanitization and uniqueness check.
**Rule:** Slug updates must be validated for uniqueness (excluding current record) and sanitized to lowercase alphanumeric + hyphens.

### 16. No Wedding Time Field (Fixed)
**Symptom:** No way to set a wedding time. Only date was available.
**Root cause:** The create/edit forms only had a date input. The `weddingDate` DateTime field stored midnight by default.
**Fix:** Added time input to both new and edit pages. Server action now combines date + time into a single DateTime.
**Rule:** Wedding time is stored in the `weddingDate` DateTime field (date + time combined). Both date and time inputs are required.

### 17. IP-Based One-Time RSVP/Blessing Submission (Feature)
**What:** RSVP and Send Blessing can only be submitted once per IP address per invitation letter.
**How:** New `RsvpSubmission` model with `@@unique([ip, invitationId])`. New `senderIp` field on `Message`. Both `/api/rsvp` and `/api/messages` POST handlers check for existing submissions and return 429 if duplicate.
**Rule:** IP limiting is per-invitation-letter, not global. Different invitation letters get independent limits. The `x-forwarded-for` header is used for IP detection (works behind Nginx/Cloudflare).

### 18. Gemini API Key Stored Encrypted But Read Without Decrypting (Fixed)
**Symptom:** AI Designer buttons (suggested prompts, send) do nothing. No design changes generated.
**Root cause:** Settings API encrypted the Gemini API key using AES `encrypt()` before storing to DB. But `/api/designer/generate` read the value back without calling `decrypt()`, sending encrypted gibberish to Google Gemini API.
**Fix:** Removed encryption from API key storage. The key is now stored in plain text in the database (it's server-side only, never exposed to clients; the GET endpoint masks it as `***configured***`).
**Rule:** NEVER encrypt the Gemini API key before storing. It must be stored in plain text so `/api/designer/generate` can use it directly. The `encrypt()/decrypt()` functions are only for invitee special codes, not for config values.

### 19. Clipboard Copy Fails Silently (Fixed)
**Symptom:** "Copy Link" buttons on Invitations and Invitees pages don't copy to clipboard.
**Root cause:** `navigator.clipboard.writeText()` fails silently in non-HTTPS contexts, when document isn't focused, or in some browser security policies.
**Fix:** Added try-catch with `document.execCommand("copy")` fallback using a temporary hidden textarea.
**Rule:** Always use a clipboard fallback. Never rely on `navigator.clipboard` alone.

### 20. Envelope Page Not Configurable via AI (Fixed)
**Symptom:** AI could only change main page colors/fonts, not the envelope opener screen.
**Fix:** Added `envelopeBgColor`, `envelopePaperColor`, `envelopeTextColor` to the design config. EnvelopeOpener component now reads these from config with sensible defaults. AI system prompt documents both screens.
**Rule:** The envelope uses `envelopeBgColor` (dark background), `envelopePaperColor` (light paper), `envelopeTextColor` (dark text on paper). These are optional fields with fallback defaults.

### 21. Gemini Model Name (Fixed)
**Rule:** Default Gemini model is `gemini-3.1-flash-lite-preview`. Do NOT change this model name. It is the correct and intended model.

## Testing

### Unit Tests (no server/database required)
```bash
npm run test:unit    # 65 tests: encryption, imports, config, security, structure
```

### E2E Tests (requires running server + MySQL)
```bash
npm run build
npm run db:push && npm run db:seed
npm run test:e2e     # Auth flow, API endpoints, route protection, security
```

### What Tests Cover
- **Encryption**: round-trip, URL-safety, unicode, random IV uniqueness
- **Import consistency**: no default prisma imports, "use server"/"use client" directives
- **File structure**: all required files exist, install.sh executable
- **Configuration**: package.json scripts, dependencies, env vars, auth config
- **Install script**: domain config, Nginx, NEXTAUTH_URL, required packages
- **Prisma schema**: all models, required fields, cascade deletes
- **Security**: no hardcoded secrets, bcrypt usage, try-catch in auth, proxy route protection
- **E2E auth**: CSRF tokens, providers, login/logout, session data
- **E2E API**: invitations, users, messages, RSVP, settings, upload (auth + validation)
- **E2E route protection**: dashboard redirect, API auth checks

## Notes for AI Assistants
- This uses Next.js App Router (not Pages Router)
- Server Components are default; use "use client" only for interactive components
- Server Actions are in `src/app/actions/`
- API routes are in `src/app/api/`
- Prisma client is a singleton in `src/lib/prisma.ts`
- Auth is configured in `src/lib/auth.ts`; route protection in `src/proxy.ts`
- The public invitation page is at `src/app/[slug]/`
- All file uploads go to `public/uploads/`
- When resuming work, check `tocontinue.md` for pending tasks
