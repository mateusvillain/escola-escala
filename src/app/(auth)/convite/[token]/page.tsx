import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { AcceptInviteButton } from '@/components/organization/AcceptInviteButton'

export default async function ConvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const invite = await prisma.organizationInvite.findUnique({
    where: { token },
    include: { organization: { select: { name: true } } },
  })

  if (!invite) {
    return (
      <lui-card aria-label="Convite não encontrado">
        <lui-heading level="2">Convite não encontrado</lui-heading>
        <lui-stack space="md">
          <lui-body>
            Este link de convite não é válido. Verifique se copiou o link completo ou peça para quem te
            convidou enviar um novo convite.
          </lui-body>
          <Link href="/login" style={{ fontSize: '0.875rem', textDecoration: 'underline' }}>
            Ir para o login
          </Link>
        </lui-stack>
      </lui-card>
    )
  }

  if (invite.status === 'accepted') {
    return (
      <lui-card aria-label="Convite já aceito">
        <lui-heading level="2">Este convite já foi aceito</lui-heading>
        <lui-stack space="md">
          <lui-body>
            Este convite para {invite.organization.name} já foi utilizado. Se você já tem uma conta, faça
            login normalmente.
          </lui-body>
          <Link href="/login" style={{ fontSize: '0.875rem', textDecoration: 'underline' }}>
            Ir para o login
          </Link>
        </lui-stack>
      </lui-card>
    )
  }

  const expired = invite.expiresAt < new Date()
  if (expired) {
    return (
      <lui-card aria-label="Convite expirado">
        <lui-heading level="2">Este convite expirou</lui-heading>
        <lui-stack space="md">
          <lui-body>
            O convite para {invite.organization.name} expirou. Peça para quem te convidou enviar um novo
            convite.
          </lui-body>
        </lui-stack>
      </lui-card>
    )
  }

  const cookieStore = await cookies()
  const authToken = cookieStore.get('auth-token')?.value

  let user: { email: string } | null = null
  if (authToken) {
    try {
      user = verifyToken(authToken)
    } catch {
      user = null
    }
  }

  if (!user) {
    const next = `/convite/${token}`
    redirect(`/cadastro?next=${encodeURIComponent(next)}&email=${encodeURIComponent(invite.email)}`)
  }

  if (user.email !== invite.email) {
    const next = `/convite/${token}`
    return (
      <lui-card aria-label="Convite para outro e-mail">
        <lui-heading level="2">Este convite é para outro e-mail</lui-heading>
        <lui-stack space="md">
          <lui-body>
            Você está logado com um e-mail diferente do convidado ({invite.email}). Saia da conta atual e
            entre (ou crie uma conta) com o e-mail correto para aceitar este convite.
          </lui-body>
          <Link
            href={`/login?redirect=${encodeURIComponent(next)}`}
            style={{ fontSize: '0.875rem', textDecoration: 'underline' }}
          >
            Trocar de conta
          </Link>
        </lui-stack>
      </lui-card>
    )
  }

  return (
    <lui-card aria-label="Aceitar convite">
      <lui-heading level="2">Você foi convidado para {invite.organization.name}</lui-heading>
      <lui-stack space="md">
        <lui-body>
          Aceite o convite para fazer parte de {invite.organization.name} e ter acesso aos cursos da
          plataforma como membro da organização.
        </lui-body>
        <AcceptInviteButton token={token} />
      </lui-stack>
    </lui-card>
  )
}
