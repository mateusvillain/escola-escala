import { Suspense } from 'react'
import { AuditLogTable } from '@/components/admin/AuditLogTable'

export default function AdminAuditoriaPage() {
  return (
    <Suspense fallback={<div className="text-gray-400">Carregando...</div>}>
      <AuditLogTable />
    </Suspense>
  )
}
