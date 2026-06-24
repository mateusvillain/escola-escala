import { describe, it, expect } from "vitest";
import { validateCpf, validateCnpj, detectDocumentType, formatCpfCnpj, maskCpfCnpjInput } from "../document";

const VALID_CPF = "123.456.789-09";
const VALID_CNPJ = "11.222.333/0001-81";
// CNPJ alfanumérico sintético (formato Receita Federal, IN RFB 2.229/2024,
// vigência a partir de 07/2026) — gerado pelo próprio algoritmo de DV para
// teste, não corresponde a uma empresa real.
const VALID_CNPJ_ALFANUMERICO = "12.ABC.345/01DE-35";

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

  it("aceita CNPJ alfanumérico válido (formato Receita Federal a partir de 07/2026)", () => {
    expect(validateCnpj(VALID_CNPJ_ALFANUMERICO)).toBe(true);
  });

  it("aceita CNPJ alfanumérico válido sem máscara, com letra minúscula", () => {
    expect(validateCnpj("12abc34501de35")).toBe(true);
  });

  it("rejeita CNPJ alfanumérico com dígito verificador errado", () => {
    expect(validateCnpj("12.ABC.345/01DE-36")).toBe(false);
  });

  it("rejeita CNPJ alfanumérico com letra na posição de dígito verificador", () => {
    expect(validateCnpj("12.ABC.345/01DE-A5")).toBe(false);
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

  it("detecta CNPJ alfanumérico mesmo com letras", () => {
    expect(detectDocumentType(VALID_CNPJ_ALFANUMERICO)).toBe("cnpj");
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

  it("formata CNPJ alfanumérico sem máscara para 00.AAA.000/0000-00", () => {
    expect(formatCpfCnpj("12ABC34501DE35")).toBe("12.ABC.345/01DE-35");
  });
});

describe("maskCpfCnpjInput", () => {
  it("formata progressivamente como CPF enquanto só houver dígitos e até 11 deles", () => {
    expect(maskCpfCnpjInput("123")).toBe("123");
    expect(maskCpfCnpjInput("1234")).toBe("123.4");
    expect(maskCpfCnpjInput("123456789")).toBe("123.456.789");
    expect(maskCpfCnpjInput("12345678909")).toBe("123.456.789-09");
  });

  it("muda para o formato de CNPJ ao passar de 11 dígitos numéricos", () => {
    expect(maskCpfCnpjInput("112223330001")).toBe("11.222.333/0001");
  });

  it("muda para o formato de CNPJ assim que houver uma letra, mesmo com poucos caracteres", () => {
    expect(maskCpfCnpjInput("12A")).toBe("12.A");
  });

  it("converte letras minúsculas para maiúsculas ao aplicar a máscara de CNPJ", () => {
    expect(maskCpfCnpjInput("12abc34501de35")).toBe("12.ABC.345/01DE-35");
  });

  it("trunca em 14 caracteres no formato de CNPJ", () => {
    expect(maskCpfCnpjInput("12ABC34501DE3599")).toBe("12.ABC.345/01DE-35");
  });
});
