'use client'

import { useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button, Alert } from '@/components/ui'

function RedefinirSenhaForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const inputs = formRef.current?.querySelectorAll('lui-input[type="password"]') ?? []
    const values = Array.from(inputs).map(
      inp => (inp as Element).shadowRoot?.querySelector('input')?.value ?? ''
    )
    const [newPassword, confirmPassword] = values

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      })

      if (res.ok) {
        router.push('/login?reset=success')
        return
      }

      const data = await res.json()
      setError(data.error ?? 'Erro ao redefinir senha.')
    } catch {
      setError('Erro de conexão. Tente novamente.')
    }

    setLoading(false)
  }

  function handleButtonClick() {
    formRef.current?.requestSubmit()
  }

  const isTokenError =
    error?.toLowerCase().includes('inválido') || error?.toLowerCase().includes('expirado')

  return (
    <lui-card aria-label="Redefinir senha">
      <lui-heading level="2">Redefinir senha</lui-heading>

      <lui-stack space="md">
        {error && (
          <lui-stack space="sm">
            <Alert variant="danger" title="Erro" content={error} />
            {isTokenError && (
              <lui-flex justify="center">
                <Link href="/recuperar-senha" style={{ fontSize: '0.875rem', textDecoration: 'underline' }}>
                  Solicitar um novo link
                </Link>
              </lui-flex>
            )}
          </lui-stack>
        )}

        <form ref={formRef} onSubmit={handleSubmit}>
          <lui-stack space="lg">
            <lui-input
              label="Nova senha"
              type="password"
              name="newPassword"
              placeholder="Mínimo 8 caracteres"
              required
            />
            <lui-input
              label="Confirmar nova senha"
              type="password"
              name="confirmPassword"
              placeholder="Repita a nova senha"
              required
            />
            <Button
              label="Redefinir senha"
              loading={loading}
              loadingText="Salvando..."
              block
              onClick={handleButtonClick}
            />
          </lui-stack>
        </form>

        <lui-flex justify="center">
          <Link href="/login" style={{ fontSize: '0.875rem', textDecoration: 'underline' }}>
            Voltar para o login
          </Link>
        </lui-flex>
      </lui-stack>
    </lui-card>
  )
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense>
      <RedefinirSenhaForm />
    </Suspense>
  )
}
