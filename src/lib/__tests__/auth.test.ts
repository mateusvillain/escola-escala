import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { signToken } from "../jwt";
import { requireRole } from "../auth";

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-that-is-at-least-32-characters-long";
});

function makeRequest(token?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (token) headers["Cookie"] = `auth-token=${token}`;
  return new NextRequest("http://localhost/api/admin/courses", { headers });
}

describe("requireRole", () => {
  it("retorna 401 quando não há token", async () => {
    const result = requireRole(makeRequest(), ["admin"]);
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(401);
  });

  it("retorna 403 quando usuário tem role incorreto (student → admin)", async () => {
    const token = signToken({ userId: "u1", email: "student@test.com", role: "student" });
    const result = requireRole(makeRequest(token), ["admin"]);
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(403);
  });

  it("retorna 403 quando usuário tem role incorreto (instructor → admin)", async () => {
    const token = signToken({ userId: "u2", email: "instructor@test.com", role: "instructor" });
    const result = requireRole(makeRequest(token), ["admin"]);
    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(403);
  });

  it("retorna { user } quando usuário tem role correto (admin)", async () => {
    const token = signToken({ userId: "u3", email: "admin@test.com", role: "admin" });
    const result = requireRole(makeRequest(token), ["admin"]);
    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as { user: { role: string } }).user.role).toBe("admin");
  });

  it("aceita múltiplos roles permitidos", async () => {
    const token = signToken({ userId: "u4", email: "inst@test.com", role: "instructor" });
    const result = requireRole(makeRequest(token), ["admin", "instructor"]);
    expect(result).not.toBeInstanceOf(NextResponse);
  });
});
