'use client'

import { useEffect, useState } from 'react'
import { Button, Alert } from '@/components/ui'

export function ReferralCodeCard() {
  const [link, setLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let active = true

    fetch('/api/users/me/referral-code')
      .then(async (res) => {
        if (!res.ok) throw new Error()
        const data = await res.json()
        if (active) setLink(`${window.location.origin}/planos?ref=${data.code}`)
      })
      .catch(() => {
        if (active) setError('Erro ao carregar seu código de indicação.')
      })

    return () => {
      active = false
    }
  }, [])

  async function handleCopy() {
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section>
      <lui-heading level="3">Indique e ganhe</lui-heading>
      <lui-stack space="md">
        <lui-body size="sm">
          Compartilhe seu link de indicação. Quem assinar pelo seu link ganha desconto, e você recebe um crédito na sua próxima cobrança.
        </lui-body>

        {error && <Alert variant="danger" title="Erro" content={error} />}

        {!error && (
          <div className="flex items-center gap-3 flex-wrap">
            <code className="flex-1 min-w-0 truncate bg-gray-100 text-sm text-gray-800 px-3 py-2 rounded-lg">
              {link ?? 'Carregando...'}
            </code>
            <Button
              label={copied ? 'Copiado!' : 'Copiar link'}
              variant="secondary"
              disabled={!link}
              onClick={handleCopy}
            />
          </div>
        )}
      </lui-stack>
    </section>
  )
}
