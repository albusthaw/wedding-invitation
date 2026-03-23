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
│   └── middleware.ts          # Route protection middleware
├── .env                       # Environment variables
├── .env.example               # Environment template
├── install.sh                 # VPS installation script
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
chmod +x install.sh
sudo ./install.sh
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
**Rule:** Never add `authorized` to the callbacks object in `src/lib/auth.ts`. Route protection logic belongs in `src/middleware.ts`.

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

## Testing

### Unit Tests (no server/database required)
```bash
npm run test:unit    # 62 tests: encryption, imports, config, security, structure
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
- **Security**: no hardcoded secrets, bcrypt usage, try-catch in auth, middleware protection
- **E2E auth**: CSRF tokens, providers, login/logout, session data
- **E2E API**: invitations, users, messages, RSVP, settings, upload (auth + validation)
- **E2E route protection**: dashboard redirect, API auth checks

## Notes for AI Assistants
- This uses Next.js App Router (not Pages Router)
- Server Components are default; use "use client" only for interactive components
- Server Actions are in `src/app/actions/`
- API routes are in `src/app/api/`
- Prisma client is a singleton in `src/lib/prisma.ts`
- Auth is configured in `src/lib/auth.ts`; middleware in `src/middleware.ts`
- The public invitation page is at `src/app/[slug]/`
- All file uploads go to `public/uploads/`
- When resuming work, check `tocontinue.md` for pending tasks
