# Major Update - 2026-03-23 (v3)

## Summary
Bug fixes, security hardening, test suite, Next.js 16 proxy migration, and configuration updates.

## Changes

### Domain Configuration
- Default hostname: `minthantthaw.me`
- App domain: `invite.minthantthaw.me`
- Nginx `server_name` set to `invite.minthantthaw.me`
- `NEXTAUTH_URL` set to `http://invite.minthantthaw.me` (HTTP initially; update to HTTPS after certbot)
- Install summary shows domain, SSL setup steps (including .env update), and DNS reminder

### Bug Fixes

#### HTTPS NEXTAUTH_URL Before SSL Setup Breaks Login (Critical — Root Cause)
- **Root cause:** `install.sh` set `NEXTAUTH_URL="https://..."` but SSL (certbot) is a manual post-install step. When NEXTAUTH_URL is HTTPS, NextAuth uses `__Secure-`/`__Host-` prefixed cookies with the `Secure` flag. Browsers refuse to store `Secure` cookies over plain HTTP, so the CSRF cookie is never saved and every login POST fails with `MissingCSRF` → user sees "Invalid email or password"
- **Verified by:** Full end-to-end test with MySQL, production build, and simulated Nginx proxy headers. Login succeeds with HTTP NEXTAUTH_URL, fails with HTTPS NEXTAUTH_URL when accessed over HTTP
- **Fixed** `install.sh` and `reinstall.sh` to set `NEXTAUTH_URL="http://..."` initially
- **Added** SSL setup instructions in install summary: set up certbot, then update `.env` to HTTPS, then restart PM2
- **Fixed** seed error handling: show actual errors instead of `2>/dev/null`

#### Next.js 16 Middleware Deprecation
- **Renamed** `src/middleware.ts` → `src/proxy.ts` — Next.js 16 deprecated the `middleware.ts` file convention in favor of `proxy.ts`
- **Replaced** `auth()` wrapper from NextAuth v5 with standalone proxy function using `getToken()` from `next-auth/jwt`
- **Result:** No more deprecation warning on startup

#### Login Server Error
- **Removed** `authorized` callback from NextAuth config `callbacks` object — it's a middleware-only callback in NextAuth v5 and was causing server errors during the login flow
- **Added** `trustHost: true` to NextAuth config for proper operation behind Nginx reverse proxy
- **Added** try-catch error handling in the `authorize()` function to prevent unhandled 500 errors when the database is unreachable

#### Deprecated Type Stub Packages
- **Removed** `@types/bcryptjs` and `@types/uuid` from dependencies — bcryptjs 3.x and uuid 13.x now ship their own TypeScript types, making the separate `@types/*` packages redundant and causing deprecation warnings on install

#### Prisma Import Inconsistency
- **Fixed** all 6 server action files that used `import prisma from "@/lib/prisma"` (default import) to use `import { prisma } from "@/lib/prisma"` (named import)
- **Removed** `export default` from `src/lib/prisma.ts` to prevent future misuse
- Files fixed: `user.ts`, `invitation.ts`, `invitee.ts`, `message.ts`, `settings.ts`, `designer.ts`

### Security
- **Fixed** npm audit vulnerability: `effect` < 3.20.0 (AsyncLocalStorage context leak in Prisma's transitive dependency)
- Added `overrides` in `package.json` to pin `effect` to `^3.21.0`
- Zero vulnerabilities after fix (`npm audit` clean)

### Test Suite (New)
- **Unit tests** (`npm run test:unit`): 63 tests covering encryption, file structure, import consistency, configuration, install script, Prisma schema, and security checks
- **E2E tests** (`npm run test:e2e`): Full integration tests covering auth flow, API endpoints, route protection, RSVP validation, upload validation, and security headers
- Tests use Node.js built-in test runner (no additional dependencies)

### ZIP Packaging
- Renamed from `e-invite.zip` to `einvite.zip`
- Updated CLAUDE.md with new zip name and repack commands

### Documentation
- Added **Bug Patterns** section to CLAUDE.md documenting all discovered and fixed bugs
- Added **Testing** section to CLAUDE.md with test commands and coverage details
- Updated ZIP packaging section to reflect `einvite.zip` naming

## Files Changed
- `package.json` — added test scripts, `effect` override, removed `@types/bcryptjs` and `@types/uuid`
- `src/middleware.ts` → `src/proxy.ts` — renamed for Next.js 16, rewrote to use `getToken()` instead of `auth()` wrapper
- `src/lib/auth.ts` — removed `authorized` callback, added `trustHost`, added try-catch
- `src/lib/prisma.ts` — removed default export
- `src/app/actions/*.ts` (6 files) — fixed prisma imports
- `.env.example` — NEXTAUTH_URL changed to HTTP
- `install.sh` — NEXTAUTH_URL to HTTP, seed error handling, SSL instructions in summary
- `reinstall.sh` — NEXTAUTH_URL to HTTP, seed error handling, SSL instructions in summary
- `CLAUDE.md` — bug patterns, testing docs, zip naming, proxy docs
- `tests/unit.test.ts` — unit test suite (updated for proxy.ts, HTTP NEXTAUTH_URL)
- `tests/e2e.test.ts` — E2E test suite
- `majorupdate.md` — this file
