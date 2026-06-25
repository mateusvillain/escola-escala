import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/jwt'
import { Header } from '@/components/layout/Header'
import { hasReviewActivity } from '@/lib/reviews'
import { isOrganizationOwner } from '@/lib/organization'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  let user = null
  if (token) {
    try {
      user = verifyToken(token)
    } catch {}
  }

  if (!user) redirect('/login')

  const showReviewsLink = await hasReviewActivity(user.userId)
  const showOrganizationLink = await isOrganizationOwner(user.userId)

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} showReviewsLink={showReviewsLink} showOrganizationLink={showOrganizationLink} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
