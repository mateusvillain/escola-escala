import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatCpfCnpj } from '@/lib/utils/document'

type Role = 'admin' | 'instructor' | 'student'
type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing'
type BillingCycle = 'monthly' | 'annual'
type PlanType = 'basic' | 'premium'

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  instructor: 'Instrutor',
  student: 'Aluno',
}

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: 'Ativo',
  past_due: 'Pagamento pendente',
  canceled: 'Cancelado',
  trialing: 'Trial',
}

const STATUS_VARIANTS: Record<SubscriptionStatus, 'success' | 'caution' | 'danger' | 'info'> = {
  active: 'success',
  past_due: 'caution',
  canceled: 'danger',
  trialing: 'info',
}

const BILLING_LABELS: Record<BillingCycle, string> = {
  monthly: 'Mensal',
  annual: 'Anual',
}

const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  basic: 'Básico',
  premium: 'Premium',
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR')
}

interface UserDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      freeTrialEligible: true,
      createdAt: true,
      stripeCustomerId: true,
      cpfCnpj: true,
      addressStreet: true,
      addressNumber: true,
      addressComplement: true,
      addressNeighborhood: true,
      addressCity: true,
      addressState: true,
      addressZipCode: true,
      referralCode: {
        select: { code: true, createdAt: true },
      },
      subscriptions: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          billingCycle: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          stripeSubscriptionId: true,
          createdAt: true,
          plan: { select: { name: true, type: true } },
        },
      },
      enrollments: {
        orderBy: { enrolledAt: 'desc' },
        select: {
          id: true,
          enrolledAt: true,
          completedAt: true,
          course: { select: { id: true, title: true } },
        },
      },
      certificates: {
        orderBy: { issuedAt: 'desc' },
        select: {
          id: true,
          issuedAt: true,
          course: { select: { title: true } },
        },
      },
    },
  })

  if (!user) notFound()

  const hasFiscalData = !!(
    user.cpfCnpj ||
    user.addressStreet ||
    user.addressNumber ||
    user.addressComplement ||
    user.addressNeighborhood ||
    user.addressCity ||
    user.addressState ||
    user.addressZipCode
  )

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 mb-1">
        <Link
          href="/admin/usuarios"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Usuários
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <lui-heading level="1" size="xl">{user.name}</lui-heading>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <lui-tag label={ROLE_LABELS[user.role]} tag-style="subtle" size="sm" />
      </div>

      {/* Conta */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Conta</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Status</p>
            <lui-tag
              label={user.isActive ? 'Ativo' : 'Inativo'}
              variant={user.isActive ? 'success' : 'secondary'}
              tag-style="subtle"
              size="sm"
            />
          </div>
          <div>
            <p className="text-gray-500">Cadastrado em</p>
            <p className="text-gray-900">{formatDate(user.createdAt)}</p>
          </div>
          {user.freeTrialEligible && (
            <div>
              <p className="text-gray-500">Trial</p>
              <lui-tag label="Trial concedido — aguardando uso" variant="info" tag-style="subtle" size="sm" />
            </div>
          )}
          {user.stripeCustomerId && (
            <div>
              <p className="text-gray-500">Stripe Customer ID</p>
              <p className="text-gray-900 font-mono text-xs">{user.stripeCustomerId}</p>
            </div>
          )}
        </div>
      </div>

      {/* Dados fiscais */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Dados fiscais</h2>
        {!hasFiscalData ? (
          <p className="text-sm text-gray-400">Nenhum dado fiscal cadastrado.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">CPF/CNPJ</p>
              <p className="text-gray-900">{user.cpfCnpj ? formatCpfCnpj(user.cpfCnpj) : '—'}</p>
            </div>
            <div>
              <p className="text-gray-500">CEP</p>
              <p className="text-gray-900">{user.addressZipCode ?? '—'}</p>
            </div>
            <div>
              <p className="text-gray-500">Endereço</p>
              <p className="text-gray-900">
                {[user.addressStreet, user.addressNumber].filter(Boolean).join(', ') || '—'}
              </p>
            </div>
            {user.addressComplement && (
              <div>
                <p className="text-gray-500">Complemento</p>
                <p className="text-gray-900">{user.addressComplement}</p>
              </div>
            )}
            <div>
              <p className="text-gray-500">Bairro</p>
              <p className="text-gray-900">{user.addressNeighborhood ?? '—'}</p>
            </div>
            <div>
              <p className="text-gray-500">Cidade/UF</p>
              <p className="text-gray-900">
                {[user.addressCity, user.addressState].filter(Boolean).join(' / ') || '—'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Pagamento / Assinaturas */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Pagamento</h2>

        {user.referralCode && (
          <p className="text-sm text-gray-600 mb-4">
            Código de indicação: <span className="font-mono text-gray-900">{user.referralCode.code}</span>
            {' · '}criado em {formatDate(user.referralCode.createdAt)}
          </p>
        )}

        {user.subscriptions.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhuma assinatura registrada.</p>
        ) : (
          <div className="space-y-3">
            {user.subscriptions.map((sub) => (
              <div key={sub.id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-900">
                    {sub.plan.name} ({PLAN_TYPE_LABELS[sub.plan.type as PlanType]})
                  </p>
                  <lui-tag
                    label={STATUS_LABELS[sub.status as SubscriptionStatus]}
                    variant={STATUS_VARIANTS[sub.status as SubscriptionStatus]}
                    tag-style="subtle"
                    size="sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <p>Ciclo: {BILLING_LABELS[sub.billingCycle as BillingCycle]}</p>
                  <p>Desde: {formatDate(sub.createdAt)}</p>
                  <p>Período atual: {formatDate(sub.currentPeriodStart)} – {formatDate(sub.currentPeriodEnd)}</p>
                  <p className="font-mono truncate">{sub.stripeSubscriptionId}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Acesso a cursos */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">
          Acesso a cursos ({user.enrollments.length})
        </h2>
        {user.enrollments.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhuma matrícula.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {user.enrollments.map((enrollment) => (
              <div key={enrollment.id} className="flex items-center justify-between py-2 text-sm">
                <Link
                  href={`/admin/cursos/${enrollment.course.id}`}
                  className="text-blue-700 hover:underline"
                >
                  {enrollment.course.title}
                </Link>
                <span className="text-xs text-gray-500">
                  {enrollment.completedAt
                    ? `Concluído em ${formatDate(enrollment.completedAt)}`
                    : `Matriculado em ${formatDate(enrollment.enrolledAt)}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Certificados */}
      {user.certificates.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Certificados ({user.certificates.length})
          </h2>
          <div className="divide-y divide-gray-100">
            {user.certificates.map((cert) => (
              <div key={cert.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-900">{cert.course.title}</span>
                <span className="text-xs text-gray-500">Emitido em {formatDate(cert.issuedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
