import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const publicRoutes = ["/", "/login", "/register"];

// Routes that only ADMIN can access
const adminOnlyRoutes = [
  "/dashboard/invitations",
  "/dashboard/users",
  "/dashboard/designer",
  "/dashboard/settings",
];

export default async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Allow NextAuth API routes
  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  // Allow public API routes
  if (pathname.startsWith("/api/public") || pathname.startsWith("/api/rsvp") || pathname.startsWith("/api/messages")) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // Allow public routes
  if (publicRoutes.includes(pathname)) return NextResponse.next();

  // Allow invitation pages (public-facing /[slug] routes)
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length >= 1 && !["dashboard", "admin", "api", "login", "register"].includes(segments[0])) {
    return NextResponse.next();
  }

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Block CLIENT from admin-only routes
    if (token.role !== "ADMIN") {
      for (const route of adminOnlyRoutes) {
        if (pathname.startsWith(route)) {
          return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
        }
      }
    }
  }

  // Protect non-public API routes
  if (pathname.startsWith("/api")) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
