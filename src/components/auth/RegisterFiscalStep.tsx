'use client'

import { useRef, useState } from 'react'
import { Alert, Button } from '@/components/ui'
import { fetchAddressByCep, validateCep } from '@/lib/viacep'
import { detectDocumentType, validateCpf, validateCnpj } from '@/lib/utils/document'
import { BRAZILIAN_STATES } from '@/lib/brazilian-states'

interface Props {
  onContinue: () => void
  continueLoading: boolean
}

const REQUIRED_FIELDS = [
  'cpfCnpj',
  'addressZipCode',
  'addressStreet',
  'addressNumber',
  'addressNeighborhood',
  'addressCity',
  'addressState',
] as const

function getShadowInput(form: HTMLFormElement, name: string): HTMLInputElement | null {
  // Esta etapa do wizard só existe depois de uma transição de estado no client
  // (nunca é server-rendered) — para esses elementos o React define `name` só
  // como propriedade JS, não como atributo (diferente de qualquer outro
  // formulário do projeto, que é hidratado a partir de HTML gerado no
  // servidor). Por isso o seletor `lui-input[name="..."]` não funciona aqui;
  // é preciso comparar a propriedade diretamente.
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

// lui-select não aceita `value` direto — sua API é por índice (`selected`)
// sobre a lista de opções da prop `options` (string separada por vírgula).
// Para LER o valor escolhido, o <select> nativo dentro do shadow DOM sempre
// reflete a opção realmente selecionada (busca por tag, não por atributo —
// não tem o problema de reflexão do `name` em elementos CSR-only). Para
// ESCREVER um valor programaticamente (autofill por CEP), é preciso setar a
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

export function RegisterFiscalStep({ onContinue, continueLoading }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function handleCepBlur() {
    const form = formRef.current
    if (!form) return

    const cep = readShadowValue(form, 'addressZipCode').trim()
    if (!cep) return

    if (!validateCep(cep)) {
      setFieldErrors((prev) => ({ ...prev, addressZipCode: 'CEP inválido' }))
      return
    }

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
    setErrorMsg(null)
    setFieldErrors({})

    const form = formRef.current
    if (!form) return

    const values = {
      cpfCnpj: readShadowValue(form, 'cpfCnpj').trim(),
      addressZipCode: readShadowValue(form, 'addressZipCode').trim(),
      addressStreet: readShadowValue(form, 'addressStreet').trim(),
      addressNumber: readShadowValue(form, 'addressNumber').trim(),
      addressComplement: readShadowValue(form, 'addressComplement').trim(),
      addressNeighborhood: readShadowValue(form, 'addressNeighborhood').trim(),
      addressCity: readShadowValue(form, 'addressCity').trim(),
      addressState: readStateValue(form),
    }

    const errors: Record<string, string> = {}
    for (const field of REQUIRED_FIELDS) {
      if (!values[field]) errors[field] = 'Obrigatório'
    }

    if (values.cpfCnpj && !errors.cpfCnpj) {
      const type = detectDocumentType(values.cpfCnpj)
      const valid = type === 'cpf' ? validateCpf(values.cpfCnpj) : type === 'cnpj' ? validateCnpj(values.cpfCnpj) : false
      if (!valid) errors.cpfCnpj = 'CPF/CNPJ inválido'
    }

    if (values.addressZipCode && !errors.addressZipCode && !validateCep(values.addressZipCode)) {
      errors.addressZipCode = 'CEP inválido'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (res.ok) {
        onContinue()
        return
      }

      const data = await res.json()
      const issues = data.issues as { path: string[]; message: string }[] | undefined
      const cpfIssue = issues?.find((issue) => issue.path[0] === 'cpfCnpj')
      const cepIssue = issues?.find((issue) => issue.path[0] === 'addressZipCode')
      if (cpfIssue || cepIssue) {
        setFieldErrors({
          ...(cpfIssue && { cpfCnpj: cpfIssue.message }),
          ...(cepIssue && { addressZipCode: cepIssue.message }),
        })
      } else {
        setErrorMsg(data.error ?? 'Erro ao salvar dados fiscais.')
      }
    } catch {
      setErrorMsg('Erro de conexão. Tente novamente.')
    }

    setLoading(false)
  }

  return (
    <lui-stack space="md">
      {errorMsg && <Alert variant="danger" title="Erro ao salvar" content={errorMsg} />}

      <form ref={formRef} onSubmit={handleSubmit}>
        <lui-stack space="lg">
          <lui-input
            label="CPF ou CNPJ"
            name="cpfCnpj"
            placeholder="000.000.000-00"
            required
            error={!!fieldErrors.cpfCnpj}
            error-text={fieldErrors.cpfCnpj ?? ''}
          />
          <lui-input
            label="CEP"
            name="addressZipCode"
            placeholder="00000-000"
            required
            error={!!fieldErrors.addressZipCode}
            error-text={fieldErrors.addressZipCode ?? ''}
            onBlur={handleCepBlur}
          />
          <lui-input
            label="Rua"
            name="addressStreet"
            placeholder="Nome da rua"
            required
            error={!!fieldErrors.addressStreet}
            error-text={fieldErrors.addressStreet ?? ''}
          />
          <lui-input
            label="Número"
            name="addressNumber"
            placeholder="123"
            required
            error={!!fieldErrors.addressNumber}
            error-text={fieldErrors.addressNumber ?? ''}
          />
          <lui-input
            label="Complemento"
            name="addressComplement"
            placeholder="Apto, bloco, etc."
            optional
          />
          <lui-input
            label="Bairro"
            name="addressNeighborhood"
            placeholder="Bairro"
            required
            error={!!fieldErrors.addressNeighborhood}
            error-text={fieldErrors.addressNeighborhood ?? ''}
          />
          <lui-input
            label="Cidade"
            name="addressCity"
            placeholder="Cidade"
            required
            error={!!fieldErrors.addressCity}
            error-text={fieldErrors.addressCity ?? ''}
          />
          <lui-select
            label="Estado"
            name="addressState"
            options={BRAZILIAN_STATES.join(',')}
            placeholder="Selecione"
            required
            error={!!fieldErrors.addressState}
            error-text={fieldErrors.addressState ?? ''}
          />
          <Button
            label="Continuar para pagamento"
            type="submit"
            loading={loading || continueLoading}
            loadingText="Continuando..."
            block
          />
        </lui-stack>
      </form>
    </lui-stack>
  )
}
