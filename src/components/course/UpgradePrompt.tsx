import Image from 'next/image'
import Link from 'next/link'

export type UpgradeReason = 'plan_upgrade_required' | 'no_subscription' | 'subscription_inactive'

const MESSAGES: Record<UpgradeReason, { title: string; description: string }> = {
  plan_upgrade_required: {
    title: 'Conteúdo exclusivo do plano Premium',
    description: 'Esta aula faz parte de um curso Premium. Faça upgrade para continuar assistindo.',
  },
  no_subscription: {
    title: 'Assine para acessar este curso',
    description: 'Esta aula é exclusiva para assinantes. Escolha um plano para começar a assistir.',
  },
  subscription_inactive: {
    title: 'Sua assinatura está inativa',
    description: 'Reative sua assinatura para continuar de onde parou.',
  },
}

const PREMIUM_HIGHLIGHTS = [
  'Acesso a todos os cursos, incluindo os exclusivos Premium',
  'Downloads para assistir offline',
  'Suporte prioritário',
  'Acesso antecipado a novos cursos',
]

interface UpgradePromptProps {
  reason: UpgradeReason
  thumbnailUrl?: string | null
}

export function UpgradePrompt({ reason, thumbnailUrl }: UpgradePromptProps) {
  const { title, description } = MESSAGES[reason]

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden bg-gradient-to-br from-blue-700 to-indigo-800"
      style={{ aspectRatio: '16 / 9' }}
    >
      {thumbnailUrl && (
        <Image
          src={thumbnailUrl}
          alt=""
          fill
          className="object-cover blur-sm opacity-50"
        />
      )}
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative h-full flex flex-col items-center justify-center text-center px-6 py-8 gap-4">
        <div>
          <p className="text-white font-semibold text-lg">{title}</p>
          <p className="text-white/90 text-sm max-w-sm mt-1.5 mx-auto">{description}</p>
        </div>

        <ul className="text-left space-y-1.5">
          {PREMIUM_HIGHLIGHTS.map(item => (
            <li key={item} className="flex items-center gap-2 text-sm text-white/90">
              <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clipRule="evenodd"
                />
              </svg>
              {item}
            </li>
          ))}
        </ul>

        <Link
          href="/planos"
          className="px-6 py-2.5 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition-colors text-sm"
        >
          Fazer Upgrade para Premium
        </Link>
      </div>
    </div>
  )
}
