import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/jwt'
import { prisma } from '@/lib/prisma'
import { EditProfileForm } from '@/components/profile/EditProfileForm'
import { ChangePasswordForm } from '@/components/profile/ChangePasswordForm'
import { ReferralCodeCard } from '@/components/profile/ReferralCodeCard'
import { FiscalDataForm } from '@/components/profile/FiscalDataForm'

export default async function PerfilPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  if (!token) redirect('/login')

  let auth
  try {
    auth = verifyToken(token)
  } catch {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      cpfCnpj: true,
      addressStreet: true,
      addressNumber: true,
      addressComplement: true,
      addressNeighborhood: true,
      addressCity: true,
      addressState: true,
      addressZipCode: true,
    },
  })

  if (!user) redirect('/login')

  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <div className="max-w-xl">
      <lui-heading level="1">Meu Perfil</lui-heading>

      <div className="mt-6 space-y-8">
        {/* Avatar + identidade */}
        <div className="flex items-center gap-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-semibold flex-shrink-0">
              {initials}
            </div>
          )}
          <div>
            <p className="font-semibold text-lg">{user.name}</p>
            <p className="text-gray-500 text-sm">{user.email}</p>
          </div>
        </div>

        <hr className="border-gray-200" />

        <EditProfileForm name={user.name} avatarUrl={user.avatarUrl} />

        <hr className="border-gray-200" />

        <FiscalDataForm
          cpfCnpj={user.cpfCnpj}
          addressStreet={user.addressStreet}
          addressNumber={user.addressNumber}
          addressComplement={user.addressComplement}
          addressNeighborhood={user.addressNeighborhood}
          addressCity={user.addressCity}
          addressState={user.addressState}
          addressZipCode={user.addressZipCode}
        />

        <hr className="border-gray-200" />

        <ReferralCodeCard />

        <hr className="border-gray-200" />

        <ChangePasswordForm />
      </div>
    </div>
  )
}
