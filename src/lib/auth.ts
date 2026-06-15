import { NextRequest, NextResponse } from "next/server";
import { verifyToken, type JwtPayload } from "./jwt";

export function getAuthUser(request: NextRequest): JwtPayload | null {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return null;
  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function requireRole(
  request: NextRequest,
  allowedRoles: string[]
): { user: JwtPayload } | NextResponse {
  const user = getAuthUser(request);
  if (!user) {
    console.warn(`[auth] Unauthenticated access attempt: ${request.method} ${request.nextUrl.pathname}`);
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!allowedRoles.includes(user.role)) {
    console.warn(`[auth] Unauthorized access: user=${user.userId} role=${user.role} path=${request.nextUrl.pathname}`);
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  return { user };
}
