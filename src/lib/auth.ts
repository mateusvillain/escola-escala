import { NextRequest } from "next/server";
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
