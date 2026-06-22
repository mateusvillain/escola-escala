import { Suspense } from 'react'
import { TrackTable } from '@/components/admin/TrackTable'

export default function AdminTrilhasPage() {
  return (
    <Suspense fallback={<div className="text-gray-400">Carregando...</div>}>
      <TrackTable />
    </Suspense>
  )
}
