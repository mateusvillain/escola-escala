import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/jwt'
import { DashboardContent } from '@/components/dashboard/DashboardContent'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  if (!token) redirect('/login')

  let user
  try {
    user = verifyToken(token)
  } catch {
    redirect('/login')
  }

  return (
    <div>
      <lui-heading level="1" size="xl">Olá, {user.name}!</lui-heading>
      <p className="text-sm text-gray-500 mt-1 mb-8">Continue de onde parou ou explore novos cursos.</p>

      <DashboardContent />
    </div>
  )
}
