'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { Button, Alert } from '@/components/ui'

export default function RecuperarSenhaPage() {
  const formRef = useRef<HTMLFormElement>(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const luiInput = formRef.current?.querySelector('lui-input')
    const shadowInput = (luiInput as Element | null)?.shadowRoot?.querySelector('input')
    const email = shadowInput?.value ?? ''

    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } catch { /* sempre exibir sucesso — nunca revelar se e-mail existe */ }

    setSubmitted(true)
    setLoading(false)
  }

  function handleButtonClick() {
    formRef.current?.requestSubmit()
  }

  return (
    <lui-card aria-label="Recuperar senha">
      <lui-heading level="2">Recuperar senha</lui-heading>

      <lui-stack space="md">
        {submitted ? (
          <Alert
            variant="success"
            title="E-mail enviado"
            content="Se esse e-mail estiver cadastrado, você receberá um link em breve."
          />
        ) : (
          <form ref={formRef} onSubmit={handleSubmit}>
            <lui-stack space="lg">
              <lui-body>
                Informe o e-mail da sua conta e enviaremos um link para redefinir sua senha.
              </lui-body>
              <lui-input
                label="E-mail"
                type="email"
                name="email"
                placeholder="email@exemplo.com"
                required
              />
              <Button
                label="Enviar link"
                loading={loading}
                loadingText="Enviando..."
                block
                onClick={handleButtonClick}
              />
            </lui-stack>
          </form>
        )}

        <lui-flex justify="center">
          <Link href="/login" style={{ fontSize: '0.875rem', textDecoration: 'underline' }}>
            Voltar para o login
          </Link>
        </lui-flex>
      </lui-stack>
    </lui-card>
  )
}
