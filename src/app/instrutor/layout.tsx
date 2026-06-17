import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/jwt'
import { InstructorSidebar } from '@/components/instructor/InstructorSidebar'

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  let user = null
  if (token) {
    try {
      user = verifyToken(token)
    } catch {}
  }

  if (!user) redirect('/login')
  if (user.role !== 'instructor' && user.role !== 'admin') redirect('/dashboard')

  return (
    <div className="min-h-screen flex bg-gray-50">
      <InstructorSidebar userName={user.name} userEmail={user.email} />
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  )
}
