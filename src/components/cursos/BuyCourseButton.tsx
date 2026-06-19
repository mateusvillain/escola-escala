'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  courseSlug: string
  price: number
  isAuthenticated: boolean
}

export function BuyCourseButton({ courseSlug, price, isAuthenticated }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleBuy() {
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(`/cursos/${courseSlug}`)}`)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/courses/${courseSlug}/purchase`, { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Erro ao iniciar a compra.')
        return
      }

      window.location.href = data.url
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={handleBuy}
        disabled={loading}
        className="flex-shrink-0 px-6 py-2.5 bg-white/10 border border-white text-white font-semibold rounded-lg hover:bg-white/20 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
      >
        {loading
          ? 'Aguarde...'
          : `Comprar este curso — R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
      </button>
      {error && <p className="text-xs text-red-200">{error}</p>}
    </div>
  )
}
