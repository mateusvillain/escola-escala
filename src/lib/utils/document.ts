function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function onlyAlnumUpper(value: string): string {
  return value.replace(/[^0-9a-zA-Z]/g, "").toUpperCase();
}

function hasAllRepeatedChars(value: string): boolean {
  return /^(.)\1*$/.test(value);
}

// CNPJ alfanumérico (IN RFB nº 2.229/2024, vigência a partir de 07/2026): os
// 12 primeiros caracteres (raiz + ordem) podem ser dígito ou letra A-Z, os 2
// dígitos verificadores continuam sempre numéricos. O cálculo do DV não
// muda — só passa a usar o valor ASCII de cada caractere subtraído de 48
// (dígito '0'-'9' mantém o mesmo valor 0-9; letra 'A'-'Z' vira 17-42), mod
// 11. Para CNPJ 100% numérico (formato atual) essa fórmula dá exatamente o
// mesmo resultado de antes, então CPF (sempre numérico) reaproveita a mesma
// função sem mudança de comportamento.
function charValue(char: string): number {
  return char.charCodeAt(0) - 48;
}

function calculateCheckDigit(chars: string, weights: number[]): number {
  const sum = weights.reduce((acc, weight, i) => acc + charValue(chars[i]) * weight, 0);
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

function applyGroups(cleaned: string, groupSizes: number[], separators: string[]): string {
  let result = "";
  let pos = 0;
  for (let i = 0; i < groupSizes.length && pos < cleaned.length; i++) {
    if (i > 0) result += separators[i - 1];
    result += cleaned.slice(pos, pos + groupSizes[i]);
    pos += groupSizes[i];
  }
  return result;
}

export function validateCpf(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || hasAllRepeatedChars(cpf)) return false;

  const digit1 = calculateCheckDigit(cpf, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (digit1 !== parseInt(cpf[9], 10)) return false;

  const digit2 = calculateCheckDigit(cpf, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (digit2 !== parseInt(cpf[10], 10)) return false;

  return true;
}

export function validateCnpj(value: string): boolean {
  const cnpj = onlyAlnumUpper(value);
  if (cnpj.length !== 14 || hasAllRepeatedChars(cnpj)) return false;

  // Os 2 dígitos verificadores são sempre numéricos, mesmo no CNPJ alfanumérico.
  if (!/^\d{2}$/.test(cnpj.slice(12))) return false;

  const digit1 = calculateCheckDigit(cnpj, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (digit1 !== Number(cnpj[12])) return false;

  const digit2 = calculateCheckDigit(cnpj, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (digit2 !== Number(cnpj[13])) return false;

  return true;
}

export function detectDocumentType(value: string): "cpf" | "cnpj" | null {
  const cleaned = onlyAlnumUpper(value);
  if (/^\d{11}$/.test(cleaned)) return "cpf";
  if (cleaned.length === 14) return "cnpj";
  return null;
}

export function formatCpfCnpj(value: string): string {
  const type = detectDocumentType(value);

  if (type === "cpf") {
    return applyGroups(onlyDigits(value), [3, 3, 3, 2], [".", ".", "-"]);
  }

  if (type === "cnpj") {
    return applyGroups(onlyAlnumUpper(value), [2, 3, 3, 4, 2], [".", ".", "/", "-"]);
  }

  return onlyAlnumUpper(value);
}

// Máscara aplicada a cada tecla digitada. Detecta o formato pela presença de
// letra (só CNPJ alfanumérico tem) ou pelo tamanho (mais de 11 caracteres só
// cabe em CNPJ) — não substitui validateCpf/validateCnpj, só formata
// visualmente enquanto o usuário digita.
export function maskCpfCnpjInput(rawValue: string): string {
  const stripped = onlyAlnumUpper(rawValue);
  const isCnpjShape = /[A-Z]/.test(stripped) || stripped.length > 11;

  if (!isCnpjShape) {
    return applyGroups(stripped.slice(0, 11), [3, 3, 3, 2], [".", ".", "-"]);
  }

  return applyGroups(stripped.slice(0, 14), [2, 3, 3, 4, 2], [".", ".", "/", "-"]);
}
