import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { getOrCreateReferralCode } from '@/lib/referral'

export async function GET(request: NextRequest) {
  const auth = getAuthUser(request)
  if (!auth) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const code = await getOrCreateReferralCode(auth.userId)

  return NextResponse.json({ code })
}
