import { Suspense } from 'react'
import { UserTable } from '@/components/admin/UserTable'

export default function AdminUsuariosPage() {
  return (
    <Suspense fallback={<div className="text-gray-400">Carregando...</div>}>
      <UserTable />
    </Suspense>
  )
}
