import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

export default function proxy(request: NextRequest) {
  // Rota de retorno do Embedded Checkout: o navegador pode chegar aqui sem o
  // cookie de sessão disponível (ex.: retorno de um desafio 3DS em outro
  // domínio) — a validação de identidade vem do session_id, não do cookie.
  if (request.nextUrl.pathname === "/api/subscriptions/checkout/return") {
    return NextResponse.next();
  }

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
