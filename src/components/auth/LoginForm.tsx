'use client'

import { useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button, Alert } from '@/components/ui'
import { loginSchema } from '@/lib/schemas/auth'

// Busca pela propriedade JS `name`, não pelo seletor de atributo
// `lui-input[name="..."]`: o atributo só existe no HTML quando a página é
// renderizada no servidor (hard load/refresh). Em qualquer navegação
// client-side do Next.js (router.push, <Link>, inclusive chegar aqui depois
// de um logout), o React monta a árvore inteiramente no cliente e seta
// propriedades reconhecidas de custom elements só como propriedade JS, nunca
// como atributo — a propriedade `.name` sempre reflete o valor certo, o
// atributo não. Sem isso, o formulário lê email/senha vazios em silêncio.
function readShadowValue(form: HTMLFormElement, name: string): string {
  const inputs = Array.from(form.querySelectorAll('lui-input')) as (HTMLElement & { name?: string })[]
  const el = inputs.find((node) => node.name === name)
  return el?.shadowRoot?.querySelector('input')?.value ?? ''
}

function LoginFormInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get('redirect')
  const resetSuccess = searchParams.get('reset') === 'success'

  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoginError(null)

    const form = formRef.current
    if (!form) return

    const values = {
      email: readShadowValue(form, 'email'),
      password: readShadowValue(form, 'password'),
    }

    const parsed = loginSchema.safeParse(values)
    if (!parsed.success) {
      setLoginError('Preencha e-mail e senha corretamente.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })

      if (res.ok) {
        const redirect = redirectParam && redirectParam.startsWith('/') ? redirectParam : '/dashboard'
        router.push(redirect)
        return
      }

      if (res.status === 401) {
        setLoginError('E-mail ou senha incorretos')
      } else {
        const data = await res.json()
        setLoginError(data.error ?? 'Erro ao entrar. Tente novamente.')
      }
    } catch {
      setLoginError('Erro de conexão. Tente novamente.')
    }

    setLoading(false)
  }

  return (
    <lui-card aria-label="Login">
      <lui-heading level="2">Entrar</lui-heading>

      <lui-stack space="md">
        {resetSuccess && (
          <Alert
            variant="success"
            title="Senha redefinida"
            content="Sua senha foi atualizada com sucesso. Faça login para continuar."
          />
        )}

        {loginError && (
          <Alert variant="danger" title="Erro ao entrar" content={loginError} />
        )}

        <form ref={formRef} onSubmit={handleSubmit}>
          <lui-stack space="lg">
            <lui-input
              label="E-mail"
              type="email"
              name="email"
              placeholder="email@exemplo.com"
              required
            />
            <lui-input
              label="Senha"
              type="password"
              name="password"
              placeholder="Sua senha"
              required
            />
            <lui-flex justify="end">
              <Link href="/recuperar-senha" style={{ fontSize: '0.875rem', textDecoration: 'underline' }}>
                Esqueci minha senha
              </Link>
            </lui-flex>
            <Button
              label="Entrar"
              type="submit"
              loading={loading}
              loadingText="Entrando..."
              disabled={loading}
              block
            />
          </lui-stack>
        </form>

        <lui-flex justify="center">
          <Link href="/cadastro" style={{ fontSize: '0.875rem', textDecoration: 'underline' }}>
            Não tem conta? Criar conta
          </Link>
        </lui-flex>
      </lui-stack>
    </lui-card>
  )
}

export function LoginForm() {
  return (
    <Suspense>
      <LoginFormInner />
    </Suspense>
  )
}
