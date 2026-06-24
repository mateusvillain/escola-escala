'use client'

import { useRef, useState } from 'react'
import { Button, Alert } from '@/components/ui'

// Busca pela propriedade JS `name`, não pelo seletor de atributo
// `lui-input[name="..."]`: o atributo só existe no HTML quando a página é
// renderizada no servidor (hard load/refresh). Em navegação client-side do
// Next.js (ex.: clicar em "Perfil" no menu do usuário), o React monta a
// árvore inteiramente no cliente e seta propriedades reconhecidas de custom
// elements só como propriedade JS, nunca como atributo.
function readShadowValue(form: HTMLFormElement, name: string): string {
  const inputs = Array.from(form.querySelectorAll('lui-input')) as (HTMLElement & { name?: string })[]
  const el = inputs.find((node) => node.name === name)
  return el?.shadowRoot?.querySelector('input')?.value ?? ''
}

export function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('idle')
    setErrorMsg(null)

    const form = formRef.current
    if (!form) return

    const currentPassword = readShadowValue(form, 'currentPassword')
    const newPassword = readShadowValue(form, 'newPassword')
    const confirmPassword = readShadowValue(form, 'confirmPassword')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMsg('Preencha todos os campos.')
      setStatus('error')
      return
    }

    if (newPassword.length < 8) {
      setErrorMsg('A nova senha deve ter pelo menos 8 caracteres.')
      setStatus('error')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('A nova senha e a confirmação não coincidem.')
      setStatus('error')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (res.ok) {
        setStatus('success')
        form.reset()
      } else {
        const data = await res.json()
        setErrorMsg(data.error === 'Senha atual incorreta'
          ? 'Senha atual incorreta.'
          : (data.error ?? 'Erro ao alterar senha.'))
        setStatus('error')
      }
    } catch {
      setErrorMsg('Erro de conexão. Tente novamente.')
      setStatus('error')
    }

    setLoading(false)
  }

  return (
    <section>
      <lui-heading level="3">Alterar senha</lui-heading>

      <lui-stack space="md">
        {status === 'success' && (
          <Alert variant="success" title="Senha alterada com sucesso." />
        )}
        {status === 'error' && errorMsg && (
          <Alert variant="danger" title="Erro" content={errorMsg} />
        )}

        <form ref={formRef} onSubmit={handleSubmit}>
          <lui-stack space="lg">
            <lui-input
              label="Senha atual"
              type="password"
              name="currentPassword"
              placeholder="Sua senha atual"
              required
            />
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
              label="Alterar senha"
              type="submit"
              loading={loading}
              loadingText="Alterando..."
              onClick={() => {}}
            />
          </lui-stack>
        </form>
      </lui-stack>
    </section>
  )
}
