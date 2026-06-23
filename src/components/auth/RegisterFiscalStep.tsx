'use client'

import { useRef, useState } from 'react'
import { Alert, Button } from '@/components/ui'
import { fetchAddressByCep } from '@/lib/viacep'
import { detectDocumentType, validateCpf, validateCnpj } from '@/lib/utils/document'

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

export function RegisterFiscalStep({ onContinue, continueLoading }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function handleCepBlur() {
    const form = formRef.current
    if (!form) return

    const cep = readShadowValue(form, 'addressZipCode').trim()
    if (cep.replace(/\D/g, '').length !== 8) return

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
    if (!readShadowValue(form, 'addressState').trim()) {
      writeShadowValue(form, 'addressState', address.state)
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
      addressState: readShadowValue(form, 'addressState').trim().toUpperCase(),
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

    if (values.addressState && !errors.addressState && !/^[A-Za-z]{2}$/.test(values.addressState)) {
      errors.addressState = 'UF inválida'
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
      const cpfIssue = (data.issues as { path: string[]; message: string }[] | undefined)?.find(
        (issue) => issue.path[0] === 'cpfCnpj'
      )
      if (cpfIssue) {
        setFieldErrors({ cpfCnpj: cpfIssue.message })
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
          <lui-input
            label="UF"
            name="addressState"
            placeholder="SP"
            maxlength="2"
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
