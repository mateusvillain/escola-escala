import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";

function makeRequest(withCookie = false): NextRequest {
  const headers: Record<string, string> = {};
  if (withCookie) headers["Cookie"] = "auth-token=sometoken";
  return new NextRequest("http://localhost/api/auth/logout", {
    method: "POST",
    headers,
  });
}

describe("POST /api/auth/logout", () => {
  it("retorna 200 com { success: true }", async () => {
    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true });
  });

  it("remove o cookie auth-token com Max-Age=0", async () => {
    const res = await POST();
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("auth-token=");
    expect(setCookie.toLowerCase()).toMatch(/max-age=0/);
  });

  it("funciona mesmo sem cookie ativo (idempotente)", async () => {
    const res = await POST();
    expect(res.status).toBe(200);
  });
});
