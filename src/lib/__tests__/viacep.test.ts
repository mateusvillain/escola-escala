import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchAddressByCep, validateCep } from "../viacep";

describe("validateCep", () => {
  it("aceita CEP com 8 dígitos, com ou sem máscara", () => {
    expect(validateCep("01001-000")).toBe(true);
    expect(validateCep("01001000")).toBe(true);
  });

  it("rejeita CEP com menos ou mais de 8 dígitos", () => {
    expect(validateCep("123")).toBe(false);
    expect(validateCep("010010001")).toBe(false);
  });

  it("rejeita entrada vazia", () => {
    expect(validateCep("")).toBe(false);
  });
});

describe("fetchAddressByCep", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("retorna o endereço mapeado em caso de sucesso", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        logradouro: "Praça da Sé",
        bairro: "Sé",
        localidade: "São Paulo",
        uf: "SP",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchAddressByCep("01001-000");

    expect(result).toEqual({
      street: "Praça da Sé",
      neighborhood: "Sé",
      city: "São Paulo",
      state: "SP",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://viacep.com.br/ws/01001000/json/",
      expect.objectContaining({ signal: expect.anything() })
    );
  });

  it("retorna null quando o ViaCEP responde { erro: true }", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ erro: true }) })
    );

    const result = await fetchAddressByCep("00000000");
    expect(result).toBeNull();
  });

  it("retorna null em caso de timeout/abort", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new DOMException("Aborted", "TimeoutError"))
    );

    const result = await fetchAddressByCep("01001000");
    expect(result).toBeNull();
  });

  it("retorna null em caso de erro de rede", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));

    const result = await fetchAddressByCep("01001000");
    expect(result).toBeNull();
  });

  it("retorna null para CEP malformado sem chamar a API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchAddressByCep("123");

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
