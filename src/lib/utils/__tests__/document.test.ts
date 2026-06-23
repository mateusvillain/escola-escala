import { describe, it, expect } from "vitest";
import { validateCpf, validateCnpj, detectDocumentType, formatCpfCnpj } from "../document";

const VALID_CPF = "123.456.789-09";
const VALID_CNPJ = "11.222.333/0001-81";

describe("validateCpf", () => {
  it("aceita CPF válido com máscara", () => {
    expect(validateCpf(VALID_CPF)).toBe(true);
  });

  it("aceita CPF válido só com números", () => {
    expect(validateCpf("12345678909")).toBe(true);
  });

  it("rejeita CPF com dígito verificador errado", () => {
    expect(validateCpf("123.456.789-00")).toBe(false);
  });

  it("rejeita CPF com todos os dígitos iguais", () => {
    expect(validateCpf("111.111.111-11")).toBe(false);
  });

  it("rejeita CPF com tamanho diferente de 11 dígitos", () => {
    expect(validateCpf("123456789")).toBe(false);
  });

  it("rejeita entrada vazia", () => {
    expect(validateCpf("")).toBe(false);
  });
});

describe("validateCnpj", () => {
  it("aceita CNPJ válido com máscara", () => {
    expect(validateCnpj(VALID_CNPJ)).toBe(true);
  });

  it("aceita CNPJ válido só com números", () => {
    expect(validateCnpj("11222333000181")).toBe(true);
  });

  it("rejeita CNPJ com dígito verificador errado", () => {
    expect(validateCnpj("11.222.333/0001-80")).toBe(false);
  });

  it("rejeita CNPJ com todos os dígitos iguais", () => {
    expect(validateCnpj("11.111.111/1111-11")).toBe(false);
  });

  it("rejeita CNPJ com tamanho diferente de 14 dígitos", () => {
    expect(validateCnpj("1122233300018")).toBe(false);
  });

  it("rejeita entrada null/vazia", () => {
    expect(validateCnpj("")).toBe(false);
  });
});

describe("detectDocumentType", () => {
  it("detecta CPF por 11 dígitos", () => {
    expect(detectDocumentType(VALID_CPF)).toBe("cpf");
  });

  it("detecta CNPJ por 14 dígitos", () => {
    expect(detectDocumentType(VALID_CNPJ)).toBe("cnpj");
  });

  it("retorna null para tamanho que não é CPF nem CNPJ", () => {
    expect(detectDocumentType("123")).toBeNull();
  });

  it("retorna null para entrada vazia", () => {
    expect(detectDocumentType("")).toBeNull();
  });
});

describe("formatCpfCnpj", () => {
  it("formata CPF sem máscara para 000.000.000-00", () => {
    expect(formatCpfCnpj("12345678909")).toBe("123.456.789-09");
  });

  it("formata CNPJ sem máscara para 00.000.000/0000-00", () => {
    expect(formatCpfCnpj("11222333000181")).toBe("11.222.333/0001-81");
  });

  it("mantém apenas os dígitos quando o tamanho não é CPF nem CNPJ", () => {
    expect(formatCpfCnpj("123")).toBe("123");
  });
});
