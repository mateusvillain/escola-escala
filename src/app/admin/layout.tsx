import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/jwt'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  let user = null
  if (token) {
    try {
      user = verifyToken(token)
    } catch {}
  }

  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')

  return (
    <div className="min-h-screen flex bg-gray-50">
      <AdminSidebar userName={user.name} userEmail={user.email} />
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  )
}
