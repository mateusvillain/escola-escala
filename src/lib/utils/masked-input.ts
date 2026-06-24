interface MaskableInput {
  value: string;
  selectionStart: number | null;
  setSelectionRange(start: number, end: number): void;
}

const ALNUM_PATTERN = /[0-9A-Za-z]/;

function countAlnum(value: string): number {
  let count = 0;
  for (const char of value) {
    if (ALNUM_PATTERN.test(char)) count++;
  }
  return count;
}

function caretForAlnumCount(value: string, count: number): number {
  if (count <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < value.length; i++) {
    if (ALNUM_PATTERN.test(value[i])) {
      seen++;
      if (seen === count) return i + 1;
    }
  }
  return value.length;
}

// Aplica uma função de máscara a um <input> nativo (lido via shadowRoot de um
// lui-input) preservando a posição do cursor por contagem de caracteres
// alfanuméricos digitados, não por índice bruto — necessário porque a máscara
// insere/remove separadores a cada tecla, deslocando o índice mesmo sem o
// usuário ter movido o cursor. Recebe uma interface mínima (não
// HTMLInputElement) para não depender de DOM real em teste.
export function applyMaskOnInput(input: MaskableInput, mask: (raw: string) => string): void {
  const masked = mask(input.value);
  if (input.value === masked) return;

  const caret = input.selectionStart ?? input.value.length;
  const alnumBeforeCaret = countAlnum(input.value.slice(0, caret));

  input.value = masked;

  const newCaret = caretForAlnumCount(masked, alnumBeforeCaret);
  input.setSelectionRange(newCaret, newCaret);
}
