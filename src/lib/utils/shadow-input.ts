import { BRAZILIAN_STATES } from "@/lib/brazilian-states";

// lui-input usa shadow DOM — leitura/escrita de valor passa pelo shadowRoot,
// não pela propriedade React `value`. Busca pela propriedade JS `name`, não
// pelo seletor de atributo `lui-input[name="..."]`: o atributo só existe no
// HTML quando a página é renderizada no servidor (hard load/refresh). Em
// navegação client-side do Next.js, o React monta a árvore inteiramente no
// cliente e seta propriedades reconhecidas de custom elements só como
// propriedade JS, nunca como atributo.
export function getShadowInput(form: HTMLFormElement, name: string): HTMLInputElement | null {
  const inputs = Array.from(form.querySelectorAll("lui-input")) as (HTMLElement & { name?: string })[];
  const el = inputs.find((node) => node.name === name);
  return el?.shadowRoot?.querySelector("input") ?? null;
}

export function readShadowValue(form: HTMLFormElement, name: string): string {
  return getShadowInput(form, name)?.value ?? "";
}

export function writeShadowValue(form: HTMLFormElement, name: string, value: string) {
  const input = getShadowInput(form, name);
  if (!input) return;
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

// O lui-input zera seu próprio `error` interno a cada tecla digitada
// (_handleInput, fora do controle do React). Isso faz o React "pular" o
// re-render quando o novo valor de `error`/`error-text` é igual ao último
// que ele mesmo aplicou — o prop nunca volta a ser reaplicado no host, e o
// erro fica preso escondido. Setar a propriedade direto no host, fora do
// fluxo declarativo do React, garante que o estado visual sempre reflita a
// validação atual.
export function syncHostError(input: HTMLInputElement | null, message: string) {
  const root = input?.getRootNode();
  const host = root instanceof ShadowRoot ? (root.host as HTMLElement & { error: boolean; errorText: string }) : null;
  if (!host) return;
  host.error = !!message;
  host.errorText = message;
}

// lui-select não aceita `value` direto — sua API é por índice (`selected`)
// sobre uma lista de opções vinda da prop `options`. Para LER o valor
// escolhido, o <select> nativo dentro do shadow DOM sempre reflete a opção
// realmente selecionada. Para ESCREVER (autofill por CEP), é preciso setar a
// propriedade `selected` do host — setar o <select> interno direto
// desincroniza o estado interno do componente.
export function getStateSelectHost(form: HTMLFormElement): (HTMLElement & { selected: number }) | null {
  return form.querySelector("lui-select") as (HTMLElement & { selected: number }) | null;
}

export function readStateValue(form: HTMLFormElement): string {
  return getStateSelectHost(form)?.shadowRoot?.querySelector("select")?.value ?? "";
}

export function writeStateValue(form: HTMLFormElement, value: string) {
  const host = getStateSelectHost(form);
  if (!host) return;
  const idx = BRAZILIAN_STATES.indexOf(value as (typeof BRAZILIAN_STATES)[number]);
  if (idx === -1) return;
  host.selected = idx + 1;
}
