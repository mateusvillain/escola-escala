'use client'

import { useState } from 'react'
import Link from 'next/link'

export function EmpresasPlanClient({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [seats, setSeats] = useState(5)
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual')

  return (
    <div className="max-w-xl mx-auto bg-white border border-gray-200 rounded-2xl p-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Plano Empresas</h2>
        <p className="text-sm text-gray-500">Acesso a todo o catálogo para a sua equipe, cobrado por seat.</p>
      </div>

      <div className="space-y-5 mb-6">
        <div>
          <label htmlFor="seats" className="block text-sm font-medium text-gray-700 mb-1.5">
            Quantidade de seats
          </label>
          <input
            id="seats"
            type="number"
            min={1}
            value={seats}
            onChange={(e) => setSeats(Math.max(1, Number(e.target.value) || 1))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-4">
          <span className={`text-sm font-medium ${billing === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
            Mensal
          </span>
          <button
            onClick={() => setBilling((prev) => (prev === 'monthly' ? 'annual' : 'monthly'))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              billing === 'annual' ? 'bg-blue-600' : 'bg-gray-300'
            }`}
            role="switch"
            aria-checked={billing === 'annual'}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                billing === 'annual' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${billing === 'annual' ? 'text-gray-900' : 'text-gray-500'}`}>
            Anual
          </span>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-300 rounded-xl px-4 py-3 mb-4 text-sm text-yellow-800">
        Contratação self-service ainda não está disponível — a cobrança por seat está em desenvolvimento. Fale
        com nosso time para contratar o plano Empresas agora.
      </div>

      {isAuthenticated ? (
        <button
          disabled
          title="Em breve"
          className="w-full py-3 rounded-xl text-sm font-semibold bg-gray-200 text-gray-500 cursor-not-allowed"
        >
          Confirmar ({seats} {seats === 1 ? 'seat' : 'seats'}, {billing === 'monthly' ? 'mensal' : 'anual'}) — em
          breve
        </button>
      ) : (
        <Link
          href="/cadastro?next=/planos/empresas"
          className="w-full block text-center py-3 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Criar conta para continuar
        </Link>
      )}
    </div>
  )
}
