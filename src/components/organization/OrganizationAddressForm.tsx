'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Alert } from '@/components/ui'
import { fetchAddressByCep, validateCep, maskCepInput } from '@/lib/viacep'
import { applyMaskOnInput } from '@/lib/utils/masked-input'
import { BRAZILIAN_STATES } from '@/lib/brazilian-states'
import {
  getShadowInput,
  readShadowValue,
  writeShadowValue,
  syncHostError,
  readStateValue,
  writeStateValue,
} from '@/lib/utils/shadow-input'

interface OrganizationAddressFormProps {
  addressStreet: string | null
  addressNumber: string | null
  addressComplement: string | null
  addressNeighborhood: string | null
  addressCity: string | null
  addressState: string | null
  addressZipCode: string | null
}

export function OrganizationAddressForm(props: OrganizationAddressFormProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function handleCepInput() {
    const form = formRef.current
    if (!form) return

    const input = getShadowInput(form, 'addressZipCode')
    if (!input) return

    applyMaskOnInput(input, maskCepInput)
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
      addressZipCode: readShadowValue(form, 'addressZipCode').trim(),
      addressStreet: readShadowValue(form, 'addressStreet').trim(),
      addressNumber: readShadowValue(form, 'addressNumber').trim(),
      addressComplement: readShadowValue(form, 'addressComplement').trim(),
      addressNeighborhood: readShadowValue(form, 'addressNeighborhood').trim(),
      addressCity: readShadowValue(form, 'addressCity').trim(),
      addressState: readStateValue(form),
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
        const cepIssue = issues?.find((issue) => issue.path[0] === 'addressZipCode')
        if (cepIssue) {
          syncHostError(getShadowInput(form, 'addressZipCode'), cepIssue.message)
          setFieldErrors((prev) => ({ ...prev, addressZipCode: cepIssue.message }))
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
      <lui-heading level="3">Endereço da organização</lui-heading>
      <p className="text-sm text-gray-500 mt-1 mb-4">
        Necessário apenas para a emissão de nota fiscal da cobrança por seat.
      </p>

      <lui-stack space="md">
        {status === 'success' && (
          <Alert variant="success" title="Endereço atualizado com sucesso." />
        )}
        {status === 'error' && errorMsg && (
          <Alert variant="danger" title="Erro ao salvar" content={errorMsg} />
        )}

        <form ref={formRef} onSubmit={handleSubmit}>
          <lui-stack space="lg">
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
              label="Salvar endereço"
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
