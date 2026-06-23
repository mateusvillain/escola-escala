export interface ViaCepAddress {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface ViaCepResponse {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
}

export function validateCep(cep: string): boolean {
  return /^\d{8}$/.test(cep.replace(/\D/g, ""));
}

export async function fetchAddressByCep(cep: string): Promise<ViaCepAddress | null> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as ViaCepResponse;
    if (data.erro) return null;

    return {
      street: data.logradouro ?? "",
      neighborhood: data.bairro ?? "",
      city: data.localidade ?? "",
      state: data.uf ?? "",
    };
  } catch {
    return null;
  }
}
