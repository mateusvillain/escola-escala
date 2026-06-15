import { Suspense } from 'react'
import { SubscriptionTable } from '@/components/admin/SubscriptionTable'

export default function AdminAssinaturasPage() {
  return (
    <Suspense fallback={<div className="text-gray-400">Carregando...</div>}>
      <SubscriptionTable />
    </Suspense>
  )
}
