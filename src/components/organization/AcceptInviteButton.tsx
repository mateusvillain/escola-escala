'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Alert } from '@/components/ui'

export function AcceptInviteButton({ token }: { token: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAccept() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/organizations/invites/${token}/accept`, { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Não foi possível aceitar o convite.')
        setLoading(false)
        return
      }

      router.push('/dashboard')
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <>
      {error && <Alert variant="danger" title="Erro ao aceitar convite" content={error} />}
      <Button
        label="Aceitar convite"
        loading={loading}
        loadingText="Aceitando..."
        disabled={loading}
        onClick={handleAccept}
        block
      />
    </>
  )
}
