import { describe, it, expect } from "vitest";
import { applyMaskOnInput } from "../masked-input";
import { maskCepInput } from "../../viacep";

function createMockInput(value: string, selectionStart: number | null) {
  const input = {
    value,
    selectionStart,
    setSelectionRange(start: number) {
      input.selectionStart = start;
    },
  };
  return input;
}

describe("applyMaskOnInput", () => {
  it("não toca no input quando a máscara não altera o valor", () => {
    const input = createMockInput("123", 3);
    applyMaskOnInput(input, (raw) => raw);
    expect(input.value).toBe("123");
    expect(input.selectionStart).toBe(3);
  });

  it("move o cursor para o fim quando a máscara só adiciona separador no fim", () => {
    const input = createMockInput("010010", 6);
    applyMaskOnInput(input, maskCepInput);
    expect(input.value).toBe("01001-0");
    expect(input.selectionStart).toBe(7);
  });

  it("mantém o cursor logo após o caractere recém-digitado quando a edição é no meio da string", () => {
    // Usuário tinha "01001-000" e digitou "9" entre o "01001" e o "-".
    const input = createMockInput("010019-000", 6);
    applyMaskOnInput(input, maskCepInput);
    expect(input.value).toBe("01001-900");
    expect(input.selectionStart).toBe(7);
  });

  it("usa o fim do valor como cursor quando selectionStart é null", () => {
    const input = createMockInput("010010", null);
    applyMaskOnInput(input, maskCepInput);
    expect(input.value).toBe("01001-0");
    expect(input.selectionStart).toBe(7);
  });
});
