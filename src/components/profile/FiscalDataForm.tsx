'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Alert } from '@/components/ui'
import { fetchAddressByCep, validateCep } from '@/lib/viacep'
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

function getShadowInput(form: HTMLFormElement, name: string): HTMLInputElement | null {
  const el = form.querySelector(`lui-input[name="${name}"]`)
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

function getSelectElement(form: HTMLFormElement, name: string): HTMLSelectElement | null {
  return form.querySelector(`select[name="${name}"]`)
}

function readSelectValue(form: HTMLFormElement, name: string): string {
  return getSelectElement(form, name)?.value ?? ''
}

export function FiscalDataForm(props: FiscalDataFormProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [cpfError, setCpfError] = useState<string | null>(null)
  const [cepError, setCepError] = useState<string | null>(null)

  async function handleCepBlur() {
    const form = formRef.current
    if (!form) return

    const cep = readShadowValue(form, 'addressZipCode').trim()
    if (!cep) {
      setCepError(null)
      return
    }

    if (!validateCep(cep)) {
      setCepError('CEP inválido')
      return
    }

    setCepError(null)

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
    const stateSelect = getSelectElement(form, 'addressState')
    if (stateSelect && !stateSelect.value) {
      stateSelect.value = address.state
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('idle')
    setErrorMsg(null)
    setCpfError(null)
    setCepError(null)

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
      addressState: readSelectValue(form, 'addressState'),
    }

    if (values.addressZipCode && !validateCep(values.addressZipCode)) {
      setCepError('CEP inválido')
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
          if (cpfIssue) setCpfError(cpfIssue.message)
          if (cepIssue) setCepError(cepIssue.message)
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
              error={!!cpfError}
              error-text={cpfError ?? ''}
            />
            <lui-input
              label="CEP"
              name="addressZipCode"
              placeholder="00000-000"
              value={props.addressZipCode ?? ''}
              optional
              error={!!cepError}
              error-text={cepError ?? ''}
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
            <div>
              <label htmlFor="addressState" className="block text-sm text-gray-700 mb-1">
                Estado <span className="text-gray-400">(opcional)</span>
              </label>
              <select
                id="addressState"
                name="addressState"
                defaultValue={props.addressState ?? ''}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione</option>
                {BRAZILIAN_STATES.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
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
