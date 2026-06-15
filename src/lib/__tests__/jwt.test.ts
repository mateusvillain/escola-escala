import { describe, it, expect, beforeAll } from "vitest";
import { signToken, verifyToken } from "../jwt";
import { TokenExpiredError } from "jsonwebtoken";

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-that-is-at-least-32-characters-long";
});

const payload = { userId: "user-123", email: "test@example.com", role: "STUDENT" };

describe("signToken", () => {
  it("retorna uma string", () => {
    expect(typeof signToken(payload)).toBe("string");
  });
});

describe("verifyToken", () => {
  it("retorna o payload correto para um token válido", () => {
    const token = signToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  it("lança erro para token inválido", () => {
    expect(() => verifyToken("token-invalido")).toThrow();
  });

  it("lança TokenExpiredError para token expirado", async () => {
    const jwt = await import("jsonwebtoken");
    const nowSeconds = Math.floor(Date.now() / 1000);
    const expiredToken = jwt.default.sign(
      { ...payload, exp: nowSeconds - 1 },
      process.env.JWT_SECRET!
    );
    expect(() => verifyToken(expiredToken)).toThrow(TokenExpiredError);
  });
});
