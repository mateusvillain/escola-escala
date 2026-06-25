import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/jwt'
import { getOrganizationRole } from '@/lib/organization'
import { OrganizationPanel } from '@/components/organization/OrganizationPanel'

export const metadata = { title: 'Minha Organização' }

export default async function OrganizacaoPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  if (!token) redirect('/login')

  let userId: string
  try {
    userId = verifyToken(token).userId
  } catch {
    redirect('/login')
  }

  const role = await getOrganizationRole(userId)
  if (role === 'member') redirect('/dashboard')

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Minha Organização</h1>
      <OrganizationPanel userId={userId} />
    </div>
  )
}
