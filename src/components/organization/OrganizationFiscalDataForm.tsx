'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Alert } from '@/components/ui'
import { fetchAddressByCep, validateCep, maskCepInput } from '@/lib/viacep'
import { validateCnpj, maskCpfCnpjInput } from '@/lib/utils/document'
import { applyMaskOnInput } from '@/lib/utils/masked-input'
import { BRAZILIAN_STATES } from '@/lib/brazilian-states'

interface OrganizationFiscalDataFormProps {
  cnpj: string | null
  legalName: string | null
  addressStreet: string | null
  addressNumber: string | null
  addressComplement: string | null
  addressNeighborhood: string | null
  addressCity: string | null
  addressState: string | null
  addressZipCode: string | null
}

// Mesmo padrão de FiscalDataForm (src/components/profile/FiscalDataForm.tsx):
// lui-input usa shadow DOM, então leitura/escrita de valor passa pelo
// shadowRoot, não pela propriedade React `value`.
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

function syncHostError(input: HTMLInputElement | null, message: string) {
  const root = input?.getRootNode()
  const host = root instanceof ShadowRoot ? (root.host as HTMLElement & { error: boolean; errorText: string }) : null
  if (!host) return
  host.error = !!message
  host.errorText = message
}

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

export function OrganizationFiscalDataForm(props: OrganizationFiscalDataFormProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function handleCnpjInput() {
    const form = formRef.current
    if (!form) return

    const input = getShadowInput(form, 'cnpj')
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

  function handleCnpjBlur() {
    const form = formRef.current
    if (!form) return

    const input = getShadowInput(form, 'cnpj')
    const cnpj = (input?.value ?? '').trim()

    const message = cnpj && !validateCnpj(cnpj) ? 'CNPJ inválido' : ''

    syncHostError(input, message)
    setFieldErrors((prev) => {
      const next = { ...prev }
      if (message) next.cnpj = message
      else delete next.cnpj
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
      cnpj: readShadowValue(form, 'cnpj').trim(),
      legalName: readShadowValue(form, 'legalName').trim(),
      addressZipCode: readShadowValue(form, 'addressZipCode').trim(),
      addressStreet: readShadowValue(form, 'addressStreet').trim(),
      addressNumber: readShadowValue(form, 'addressNumber').trim(),
      addressComplement: readShadowValue(form, 'addressComplement').trim(),
      addressNeighborhood: readShadowValue(form, 'addressNeighborhood').trim(),
      addressCity: readShadowValue(form, 'addressCity').trim(),
      addressState: readStateValue(form),
    }

    if (values.cnpj && !validateCnpj(values.cnpj)) {
      syncHostError(getShadowInput(form, 'cnpj'), 'CNPJ inválido')
      setFieldErrors((prev) => ({ ...prev, cnpj: 'CNPJ inválido' }))
      return
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
      const res = await fetch('/api/organizations/me', {
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
        const cnpjIssue = issues?.find((issue) => issue.path[0] === 'cnpj')
        const cepIssue = issues?.find((issue) => issue.path[0] === 'addressZipCode')
        if (cnpjIssue || cepIssue) {
          if (cnpjIssue) syncHostError(getShadowInput(form, 'cnpj'), cnpjIssue.message)
          if (cepIssue) syncHostError(getShadowInput(form, 'addressZipCode'), cepIssue.message)
          setFieldErrors((prev) => ({
            ...prev,
            ...(cnpjIssue && { cnpj: cnpjIssue.message }),
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
      <lui-heading level="3">Dados fiscais da organização</lui-heading>
      <p className="text-sm text-gray-500 mt-1 mb-4">
        Necessário apenas para a emissão de nota fiscal da cobrança por seat.
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
              label="CNPJ"
              name="cnpj"
              placeholder="00.000.000/0000-00"
              value={props.cnpj ?? ''}
              optional
              error={!!fieldErrors.cnpj}
              error-text={fieldErrors.cnpj ?? ''}
              onInput={handleCnpjInput}
              onBlur={handleCnpjBlur}
            />
            <lui-input
              label="Razão social"
              name="legalName"
              placeholder="Razão social da empresa"
              value={props.legalName ?? ''}
              optional
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
