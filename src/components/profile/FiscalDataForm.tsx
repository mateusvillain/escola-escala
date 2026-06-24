'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Alert } from '@/components/ui'
import { fetchAddressByCep, validateCep, maskCepInput } from '@/lib/viacep'
import { detectDocumentType, validateCpf, validateCnpj, maskCpfCnpjInput } from '@/lib/utils/document'
import { applyMaskOnInput } from '@/lib/utils/masked-input'
import { BRAZILIAN_STATES } from '@/lib/brazilian-states'

interface FiscalDataFormProps {
  cpfCnpj: string | null
  addressStreet: string | null
  addressNumber: string | null
  addressComplement: string | null
  addressNeighborhood: string | null
  addressCity: string | null
  addressState: string | null
  addressZipCode: string | null
}

// Busca pela propriedade JS `name`, não pelo seletor de atributo
// `lui-input[name="..."]`: o atributo só existe no HTML quando a página é
// renderizada no servidor (hard load/refresh). Em navegação client-side do
// Next.js (ex.: clicar em "Perfil" no menu do usuário, o caminho normal até
// esta página), o React monta a árvore inteiramente no cliente e seta
// propriedades reconhecidas de custom elements só como propriedade JS, nunca
// como atributo — sem isso, a máscara e a validação desta tela ficam
// quebradas sempre que se chega aqui por um link interno, não só num refresh.
function getShadowInput(form: HTMLFormElement, name: string): HTMLInputElement | null {
  const inputs = Array.from(form.querySelectorAll('lui-input')) as (HTMLElement & { name?: string })[]
  const el = inputs.find((node) => node.name === name)
  return el?.shadowRoot?.querySelector('input') ?? null
}

function readShadowValue(form: HTMLFormElement, name: string): string {
  return getShadowInput(form, name)?.value ?? ''
}

function writeShadowValue(form: HTMLFormElement, name: string, value: string) {
  const input = getShadowInput(form, name)
  if (!input) return
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

// O lui-input zera seu próprio `error` interno a cada tecla digitada
// (_handleInput, fora do controle do React). Isso faz o React "pular" o
// re-render quando o novo valor de `error`/`error-text` é igual ao último
// que ele mesmo aplicou (ex. inválido -> inválido de novo, sem passar por um
// estado válido no meio) — o prop nunca volta a ser reaplicado no host, e o
// erro fica preso escondido. Setar a propriedade direto no host, fora do
// fluxo declarativo do React, garante que o estado visual sempre reflita a
// validação atual.
function syncHostError(input: HTMLInputElement | null, message: string) {
  const root = input?.getRootNode()
  const host = root instanceof ShadowRoot ? (root.host as HTMLElement & { error: boolean; errorText: string }) : null
  if (!host) return
  host.error = !!message
  host.errorText = message
}

// lui-select não aceita `value` direto — sua API é por índice (`selected`)
// sobre uma lista de opções vinda da prop `options` (string separada por
// vírgula). Para LER o valor escolhido, basta o <select> nativo dentro do
// shadow DOM (sempre reflete a opção realmente selecionada). Para ESCREVER
// um valor programaticamente (autofill por CEP), é preciso setar a
// propriedade `selected` do host — setar o <select> interno direto
// desincroniza o estado interno do componente (ele guarda o índice, não a
// string), e um re-render do Lit reverteria a mudança.
function getStateSelectHost(form: HTMLFormElement): (HTMLElement & { selected: number }) | null {
  return form.querySelector('lui-select') as (HTMLElement & { selected: number }) | null
}

function readStateValue(form: HTMLFormElement): string {
  return getStateSelectHost(form)?.shadowRoot?.querySelector('select')?.value ?? ''
}

function writeStateValue(form: HTMLFormElement, value: string) {
  const host = getStateSelectHost(form)
  if (!host) return
  const idx = BRAZILIAN_STATES.indexOf(value as (typeof BRAZILIAN_STATES)[number])
  if (idx === -1) return
  host.selected = idx + 1
}

export function FiscalDataForm(props: FiscalDataFormProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  // Objeto (não strings soltas) de propósito: o lui-input limpa seu próprio
  // estado interno de erro a cada tecla digitada, fora do controle do React.
  // Setar a mesma mensagem de erro duas vezes em sequência (ex. inválido →
  // inválido, sem passar por um estado válido/vazio no meio) com um state
  // `string | null` faz o React pular o re-render (mesmo valor, via
  // Object.is) e o erro nunca volta a aparecer. Espalhar `{...prev}` sempre
  // cria uma referência nova, então o React nunca pula o re-render.
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function handleCpfCnpjInput() {
    const form = formRef.current
    if (!form) return

    const input = getShadowInput(form, 'cpfCnpj')
    if (!input) return

    applyMaskOnInput(input, maskCpfCnpjInput)
  }

  function handleCepInput() {
    const form = formRef.current
    if (!form) return

    const input = getShadowInput(form, 'addressZipCode')
    if (!input) return

    applyMaskOnInput(input, maskCepInput)
  }

  function handleCpfBlur() {
    const form = formRef.current
    if (!form) return

    const input = getShadowInput(form, 'cpfCnpj')
    const cpf = (input?.value ?? '').trim()

    let message = ''
    if (cpf) {
      const type = detectDocumentType(cpf)
      const valid = type === 'cpf' ? validateCpf(cpf) : type === 'cnpj' ? validateCnpj(cpf) : false
      if (!valid) message = 'CPF/CNPJ inválido'
    }

    syncHostError(input, message)
    setFieldErrors((prev) => {
      const next = { ...prev }
      if (message) next.cpfCnpj = message
      else delete next.cpfCnpj
      return next
    })
  }

  async function handleCepBlur() {
    const form = formRef.current
    if (!form) return

    const input = getShadowInput(form, 'addressZipCode')
    const cep = (input?.value ?? '').trim()

    if (!cep) {
      syncHostError(input, '')
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next.addressZipCode
        return next
      })
      return
    }

    if (!validateCep(cep)) {
      syncHostError(input, 'CEP inválido')
      setFieldErrors((prev) => ({ ...prev, addressZipCode: 'CEP inválido' }))
      return
    }

    syncHostError(input, '')
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next.addressZipCode
      return next
    })

    const address = await fetchAddressByCep(cep)
    if (!address) return

    if (!readShadowValue(form, 'addressStreet').trim()) {
      writeShadowValue(form, 'addressStreet', address.street)
    }
    if (!readShadowValue(form, 'addressNeighborhood').trim()) {
      writeShadowValue(form, 'addressNeighborhood', address.neighborhood)
    }
    if (!readShadowValue(form, 'addressCity').trim()) {
      writeShadowValue(form, 'addressCity', address.city)
    }
    if (!readStateValue(form)) {
      writeStateValue(form, address.state)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('idle')
    setErrorMsg(null)
    setFieldErrors({})

    const form = formRef.current
    if (!form) return

    const values: Record<string, string> = {
      cpfCnpj: readShadowValue(form, 'cpfCnpj').trim(),
      addressZipCode: readShadowValue(form, 'addressZipCode').trim(),
      addressStreet: readShadowValue(form, 'addressStreet').trim(),
      addressNumber: readShadowValue(form, 'addressNumber').trim(),
      addressComplement: readShadowValue(form, 'addressComplement').trim(),
      addressNeighborhood: readShadowValue(form, 'addressNeighborhood').trim(),
      addressCity: readShadowValue(form, 'addressCity').trim(),
      addressState: readStateValue(form),
    }

    if (values.cpfCnpj) {
      const type = detectDocumentType(values.cpfCnpj)
      const valid = type === 'cpf' ? validateCpf(values.cpfCnpj) : type === 'cnpj' ? validateCnpj(values.cpfCnpj) : false
      if (!valid) {
        syncHostError(getShadowInput(form, 'cpfCnpj'), 'CPF/CNPJ inválido')
        setFieldErrors((prev) => ({ ...prev, cpfCnpj: 'CPF/CNPJ inválido' }))
        return
      }
    }

    if (values.addressZipCode && !validateCep(values.addressZipCode)) {
      syncHostError(getShadowInput(form, 'addressZipCode'), 'CEP inválido')
      setFieldErrors((prev) => ({ ...prev, addressZipCode: 'CEP inválido' }))
      return
    }

    const body = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== ''))

    if (Object.keys(body).length === 0) return

    setLoading(true)

    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        setStatus('success')
        router.refresh()
      } else {
        const data = await res.json()
        const issues = data.issues as { path: string[]; message: string }[] | undefined
        const cpfIssue = issues?.find((issue) => issue.path[0] === 'cpfCnpj')
        const cepIssue = issues?.find((issue) => issue.path[0] === 'addressZipCode')
        if (cpfIssue || cepIssue) {
          if (cpfIssue) syncHostError(getShadowInput(form, 'cpfCnpj'), cpfIssue.message)
          if (cepIssue) syncHostError(getShadowInput(form, 'addressZipCode'), cepIssue.message)
          setFieldErrors((prev) => ({
            ...prev,
            ...(cpfIssue && { cpfCnpj: cpfIssue.message }),
            ...(cepIssue && { addressZipCode: cepIssue.message }),
          }))
        } else {
          setErrorMsg(data.error ?? 'Erro ao salvar.')
          setStatus('error')
        }
      }
    } catch {
      setErrorMsg('Erro de conexão. Tente novamente.')
      setStatus('error')
    }

    setLoading(false)
  }

  return (
    <section>
      <lui-heading level="3">Dados fiscais</lui-heading>
      <p className="text-sm text-gray-500 mt-1 mb-4">
        Opcional — necessário apenas para a emissão de nota fiscal das suas compras.
      </p>

      <lui-stack space="md">
        {status === 'success' && (
          <Alert variant="success" title="Dados fiscais atualizados com sucesso." />
        )}
        {status === 'error' && errorMsg && (
          <Alert variant="danger" title="Erro ao salvar" content={errorMsg} />
        )}

        <form ref={formRef} onSubmit={handleSubmit}>
          <lui-stack space="lg">
            <lui-input
              label="CPF ou CNPJ"
              name="cpfCnpj"
              placeholder="000.000.000-00"
              value={props.cpfCnpj ?? ''}
              optional
              error={!!fieldErrors.cpfCnpj}
              error-text={fieldErrors.cpfCnpj ?? ''}
              onInput={handleCpfCnpjInput}
              onBlur={handleCpfBlur}
            />
            <lui-input
              label="CEP"
              name="addressZipCode"
              placeholder="00000-000"
              value={props.addressZipCode ?? ''}
              optional
              error={!!fieldErrors.addressZipCode}
              error-text={fieldErrors.addressZipCode ?? ''}
              onInput={handleCepInput}
              onBlur={handleCepBlur}
            />
            <lui-input
              label="Rua"
              name="addressStreet"
              placeholder="Nome da rua"
              value={props.addressStreet ?? ''}
              optional
            />
            <lui-input
              label="Número"
              name="addressNumber"
              placeholder="123"
              value={props.addressNumber ?? ''}
              optional
            />
            <lui-input
              label="Complemento"
              name="addressComplement"
              placeholder="Apto, bloco, etc."
              value={props.addressComplement ?? ''}
              optional
            />
            <lui-input
              label="Bairro"
              name="addressNeighborhood"
              placeholder="Bairro"
              value={props.addressNeighborhood ?? ''}
              optional
            />
            <lui-input
              label="Cidade"
              name="addressCity"
              placeholder="Cidade"
              value={props.addressCity ?? ''}
              optional
            />
            <lui-select
              label="Estado"
              name="addressState"
              options={BRAZILIAN_STATES.join(',')}
              placeholder="Selecione"
              selected={props.addressState ? BRAZILIAN_STATES.indexOf(props.addressState as (typeof BRAZILIAN_STATES)[number]) + 1 : 0}
              optional
            />
            <Button
              label="Salvar dados fiscais"
              type="submit"
              loading={loading}
              loadingText="Salvando..."
            />
          </lui-stack>
        </form>
      </lui-stack>
    </section>
  )
}
