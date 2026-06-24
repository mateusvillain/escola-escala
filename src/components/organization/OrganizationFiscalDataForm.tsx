'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Alert } from '@/components/ui'
import { validateCnpj, maskCpfCnpjInput } from '@/lib/utils/document'
import { applyMaskOnInput } from '@/lib/utils/masked-input'
import { getShadowInput, readShadowValue, syncHostError } from '@/lib/utils/shadow-input'

interface OrganizationFiscalDataFormProps {
  cnpj: string | null
  legalName: string | null
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
    }

    if (values.cnpj && !validateCnpj(values.cnpj)) {
      syncHostError(getShadowInput(form, 'cnpj'), 'CNPJ inválido')
      setFieldErrors((prev) => ({ ...prev, cnpj: 'CNPJ inválido' }))
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
        if (cnpjIssue) {
          syncHostError(getShadowInput(form, 'cnpj'), cnpjIssue.message)
          setFieldErrors((prev) => ({ ...prev, cnpj: cnpjIssue.message }))
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
