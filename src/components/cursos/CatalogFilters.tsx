'use client'

import { useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

const PLAN_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'basic', label: 'Básico' },
  { value: 'premium', label: 'Premium' },
]

export function CatalogFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentPlan = searchParams.get('planAccess') ?? ''
  const currentSearch = searchParams.get('search') ?? ''

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) params.set(k, v)
      else params.delete(k)
    })
    return `${pathname}?${params.toString()}`
  }

  function handleSearch(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      router.push(buildUrl({ search: value, planAccess: currentPlan }))
    }, 300)
  }

  return (
    <div className="flex flex-wrap items-center gap-3 mb-8">
      <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
        {PLAN_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => router.push(buildUrl({ planAccess: f.value, search: currentSearch }))}
            className={[
              'px-4 py-2 text-sm font-medium transition-colors',
              currentPlan === f.value
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="Buscar curso..."
        defaultValue={currentSearch}
        onChange={e => handleSearch(e.target.value)}
        className="flex-1 min-w-[200px] px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}
