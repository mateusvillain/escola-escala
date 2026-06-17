import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

export default function proxy(request: NextRequest) {
  const user = getAuthUser(request);

  if (!user) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/curso/:path*",
    "/admin/:path*",
    "/instrutor/:path*",
    "/api/admin/:path*",
    "/api/instructor/:path*",
    "/api/dashboard/:path*",
    "/api/modules/:path*",
    "/api/progress/:path*",
    "/api/enrollments/:path*",
    "/api/certificates/:path*",
    "/api/subscriptions/:path*",
    "/api/users/me",
  ],
};
