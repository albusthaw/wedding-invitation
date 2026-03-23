# Major Update - 2026-03-23 (v2)

## Summary
Bug fixes, security hardening, test suite, Next.js 16 proxy migration, and configuration updates.

## Changes

### Domain Configuration
- Default hostname: `minthantthaw.me`
- App domain: `invite.minthantthaw.me`
- Nginx `server_name` set to `invite.minthantthaw.me`
- `NEXTAUTH_URL` set to `https://invite.minthantthaw.me`
- Install summary shows domain, certbot command, and DNS reminder

### Bug Fixes

#### Login Server Error (Critical)
- **Removed** `authorized` callback from NextAuth config `callbacks` object — it's a middleware-only callback in NextAuth v5 and was causing server errors during the login flow
- **Added** `trustHost: true` to NextAuth config for proper operation behind Nginx reverse proxy
- **Added** try-catch error handling in the `authorize()` function to prevent unhandled 500 errors when the database is unreachable

#### Next.js 16 Middleware Deprecation + Login Failure (Critical)
- **Renamed** `src/middleware.ts` → `src/proxy.ts` — Next.js 16 deprecated the `middleware.ts` file convention in favor of `proxy.ts`
- **Replaced** `auth()` wrapper from NextAuth v5 with standalone proxy function using `getToken()` from `next-auth/jwt` — the `auth()` wrapper's `handleAuth()` function wraps `NextResponse.next()` in `new Response()`, which interferes with Next.js 16's proxy request forwarding and causes login callbacks to be swallowed
- **Result:** No more deprecation warning on startup; login works correctly with the new proxy approach

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
- `.env.example` — updated NEXTAUTH_URL
- `install.sh` — domain configuration
- `CLAUDE.md` — bug patterns, testing docs, zip naming, proxy docs
- `tests/unit.test.ts` — unit test suite (updated for proxy.ts)
- `tests/e2e.test.ts` — E2E test suite
- `majorupdate.md` — this file
