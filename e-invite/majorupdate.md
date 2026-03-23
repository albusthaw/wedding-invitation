# Major Update - 2026-03-23 (v4)

## Summary
Bug fixes, security hardening, test suite, Next.js 16 proxy migration, Cloudflare compatibility, and configuration updates.

## Changes

### Domain Configuration
- Default hostname: `minthantthaw.me`
- App domain: `invite.minthantthaw.me`
- Nginx `server_name` set to `invite.minthantthaw.me`
- `NEXTAUTH_URL` set to `https://invite.minthantthaw.me`

### Bug Fixes

#### Nginx X-Forwarded-Proto Breaks Login Behind Cloudflare (Critical)
- **Root cause:** Nginx config used `proxy_set_header X-Forwarded-Proto $scheme;`. With Cloudflare (Browser→HTTPS→Cloudflare→HTTP→Nginx→Node), `$scheme` is `http` because Cloudflare→Nginx is HTTP. This overwrites Cloudflare's `X-Forwarded-Proto: https`, causing inconsistent protocol signaling between CSRF cookie creation and CSRF validation — resulting in `MissingCSRF` errors displayed as "Invalid email or password"
- **Fix:** Nginx now passes through upstream proxy's `X-Forwarded-Proto` when present (`$http_x_forwarded_proto`), falling back to `$scheme` for certbot setups. Works with both Cloudflare and direct SSL
- **Verified:** End-to-end test with MySQL, production build, manual cookie injection simulating Cloudflare HTTPS browser

#### Generic Login Error Message Hides Real Failure
- **Root cause:** Login page showed "Invalid email or password" for ALL auth errors, including `MissingCSRF`, `CallbackRouteError`, etc.
- **Fix:** Login page now shows specific error code for non-credential errors (e.g. "Login failed: MissingCSRF") so users can diagnose the actual issue

#### Next.js 16 Middleware Deprecation
- **Renamed** `src/middleware.ts` → `src/proxy.ts` — Next.js 16 deprecated the `middleware.ts` file convention in favor of `proxy.ts`
- **Replaced** `auth()` wrapper from NextAuth v5 with standalone proxy function using `getToken()` from `next-auth/jwt`
- **Result:** No more deprecation warning on startup

#### Login Server Error
- **Removed** `authorized` callback from NextAuth config `callbacks` object
- **Added** `trustHost: true` to NextAuth config for reverse proxy operation
- **Added** try-catch error handling in `authorize()` function

#### Seed Error Handling
- **Fixed** seed command in install.sh/reinstall.sh: shows actual errors instead of suppressing stderr with `2>/dev/null`

#### Deprecated Type Stub Packages
- **Removed** `@types/bcryptjs` and `@types/uuid` from dependencies

#### Prisma Import Inconsistency
- **Fixed** all 6 server action files to use `import { prisma }` (named import)
- **Removed** `export default` from `src/lib/prisma.ts`

### Security
- **Fixed** npm audit vulnerability: `effect` < 3.20.0
- Added `overrides` in `package.json` to pin `effect` to `^3.21.0`

### Test Suite (New)
- **Unit tests** (`npm run test:unit`): 64 tests
- **E2E tests** (`npm run test:e2e`): Full integration tests
- Tests use Node.js built-in test runner (no additional dependencies)

### ZIP Packaging
- Renamed from `e-invite.zip` to `einvite.zip`

## Files Changed
- `package.json` — test scripts, `effect` override, removed `@types/bcryptjs` and `@types/uuid`
- `src/middleware.ts` → `src/proxy.ts` — renamed for Next.js 16, uses `getToken()`
- `src/lib/auth.ts` — removed `authorized` callback, added `trustHost`, added try-catch
- `src/lib/prisma.ts` — removed default export
- `src/app/login/page.tsx` — specific error messages per error type
- `src/app/actions/*.ts` (6 files) — fixed prisma imports
- `.env.example` — NEXTAUTH_URL set to HTTPS
- `install.sh` — Nginx X-Forwarded-Proto fix, seed error handling, HTTPS URL
- `reinstall.sh` — same Nginx and seed fixes
- `CLAUDE.md` — bug patterns, testing docs, Cloudflare notes
- `tests/unit.test.ts` — 64 tests (Nginx proxy header test added)
- `tests/e2e.test.ts` — E2E test suite
- `majorupdate.md` — this file
