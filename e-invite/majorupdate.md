# Major Update - 2026-03-23 (v5)

## Summary
Bug fixes, security hardening, test suite, Next.js 16 proxy migration, Cloudflare compatibility, and configuration updates.

## Changes

### Domain Configuration
- Default hostname: `minthantthaw.me`
- App domain: `invite.minthantthaw.me`
- Nginx `server_name` set to `invite.minthantthaw.me`
- `NEXTAUTH_URL` set to `https://invite.minthantthaw.me`

### Bug Fixes

#### `__Host-` Secure Cookies Cause MissingCSRF Behind Cloudflare (Critical — Root Cause of Login Failure)
- **Root cause:** With `NEXTAUTH_URL=https://...`, NextAuth auto-detects `useSecureCookies=true`, setting cookies with `__Host-` prefix and `Secure` flag. The `__Host-` prefix has extremely strict browser requirements. Behind a TLS-terminating proxy (Cloudflare/Nginx), the origin server only sees HTTP, causing `__Host-` cookie storage/transmission to fail. The CSRF cookie is never sent back → `MissingCSRF` → login page shows "Login failed: MissingCSRF"
- **Fix:** Added `useSecureCookies: false` to NextAuth config in `src/lib/auth.ts`. HTTPS security is handled by Cloudflare at the edge, not by cookie flags. Cookies now use plain names (`authjs.csrf-token`) without `Secure` flag.
- **Verified:** Full signIn flow tested in sandbox — getCsrfToken → getProviders → POST callback/credentials → session check all succeed. Login returns correct admin session.

#### Nginx X-Forwarded-Proto Wrong Behind Cloudflare
- **Root cause:** `proxy_set_header X-Forwarded-Proto $scheme;` sends `http` when behind Cloudflare (CF→Nginx is HTTP)
- **Fix:** Nginx passes through upstream `X-Forwarded-Proto` when present, falls back to `$scheme`

#### Generic Login Error Message Hides Real Failure
- **Fix:** Login page now shows specific error code for non-credential errors (e.g. "Login failed: MissingCSRF")

#### Next.js 16 Middleware Deprecation
- **Renamed** `src/middleware.ts` → `src/proxy.ts`
- **Replaced** `auth()` wrapper with standalone `getToken()` from `next-auth/jwt`

#### Login Server Error
- **Removed** `authorized` callback from NextAuth config `callbacks` object
- **Added** `trustHost: true` to NextAuth config
- **Added** try-catch in `authorize()` function

#### Other Fixes
- Seed error handling: shows actual errors instead of `2>/dev/null`
- Removed deprecated `@types/bcryptjs` and `@types/uuid`
- Fixed all 6 server action files to use named prisma import
- Removed `export default` from `src/lib/prisma.ts`

### Security
- Fixed npm audit vulnerability: `effect` < 3.20.0
- Added `overrides` in `package.json` to pin `effect` to `^3.21.0`

### Test Suite
- **Unit tests** (`npm run test:unit`): 65 tests
- **E2E tests** (`npm run test:e2e`): Full integration tests
- Tests use Node.js built-in test runner

### ZIP Packaging
- Renamed from `e-invite.zip` to `einvite.zip`

## Files Changed
- `src/lib/auth.ts` — added `useSecureCookies: false`, removed `authorized` callback, added `trustHost`, added try-catch
- `src/app/login/page.tsx` — specific error messages per error type
- `src/proxy.ts` — renamed from middleware.ts, uses `getToken()`
- `src/lib/prisma.ts` — removed default export
- `src/app/actions/*.ts` (6 files) — fixed prisma imports
- `install.sh` — Nginx X-Forwarded-Proto fix, HTTPS URL, seed error handling
- `reinstall.sh` — same Nginx and seed fixes
- `.env.example` — NEXTAUTH_URL set to HTTPS
- `package.json` — test scripts, `effect` override, removed deprecated type stubs
- `CLAUDE.md` — bug patterns, testing docs, Cloudflare notes
- `tests/unit.test.ts` — 65 tests (useSecureCookies test added)
- `tests/e2e.test.ts` — E2E test suite
- `majorupdate.md` — this file
