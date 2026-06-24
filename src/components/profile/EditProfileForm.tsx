'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Alert } from '@/components/ui'

interface EditProfileFormProps {
  name: string
  avatarUrl: string | null
}

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

export function EditProfileForm({ name, avatarUrl }: EditProfileFormProps) {
  const router = useRouter()
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

    const newName = readShadowValue(form, 'name').trim()
    const newAvatarUrl = readShadowValue(form, 'avatarUrl').trim()

    if (!newName) return

    setLoading(true)

    try {
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          avatarUrl: newAvatarUrl || null,
        }),
      })

      if (res.ok) {
        setStatus('success')
        router.refresh()
      } else {
        const data = await res.json()
        setErrorMsg(data.error ?? 'Erro ao salvar.')
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
      <lui-heading level="3">Editar perfil</lui-heading>

      <lui-stack space="md">
        {status === 'success' && (
          <Alert variant="success" title="Perfil atualizado com sucesso." />
        )}
        {status === 'error' && errorMsg && (
          <Alert variant="danger" title="Erro ao salvar" content={errorMsg} />
        )}

        <form ref={formRef} onSubmit={handleSubmit}>
          <lui-stack space="lg">
            <lui-input
              label="Nome"
              name="name"
              placeholder="Seu nome completo"
              value={name}
              required
            />
            <lui-input
              label="URL do avatar"
              name="avatarUrl"
              placeholder="https://..."
              value={avatarUrl ?? ''}
              optional
            />
            <Button
              label="Salvar"
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
