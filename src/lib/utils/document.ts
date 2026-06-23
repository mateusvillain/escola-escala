function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function hasAllRepeatedDigits(digits: string): boolean {
  return /^(\d)\1*$/.test(digits);
}

function calculateCheckDigit(digits: string, weights: number[]): number {
  const sum = weights.reduce((acc, weight, i) => acc + parseInt(digits[i], 10) * weight, 0);
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

export function validateCpf(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || hasAllRepeatedDigits(cpf)) return false;

  const digit1 = calculateCheckDigit(cpf, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (digit1 !== parseInt(cpf[9], 10)) return false;

  const digit2 = calculateCheckDigit(cpf, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (digit2 !== parseInt(cpf[10], 10)) return false;

  return true;
}

export function validateCnpj(value: string): boolean {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14 || hasAllRepeatedDigits(cnpj)) return false;

  const digit1 = calculateCheckDigit(cnpj, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (digit1 !== parseInt(cnpj[12], 10)) return false;

  const digit2 = calculateCheckDigit(cnpj, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (digit2 !== parseInt(cnpj[13], 10)) return false;

  return true;
}

export function detectDocumentType(value: string): "cpf" | "cnpj" | null {
  const digits = onlyDigits(value);
  if (digits.length === 11) return "cpf";
  if (digits.length === 14) return "cnpj";
  return null;
}

export function formatCpfCnpj(value: string): string {
  const digits = onlyDigits(value);
  const type = detectDocumentType(value);

  if (type === "cpf") {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  if (type === "cnpj") {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }

  return digits;
}
