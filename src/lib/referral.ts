import { prisma } from '@/lib/prisma'

const CODE_LENGTH = 8
// Sem caracteres ambíguos (0/O, 1/I/L) para facilitar digitação manual do código.
const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function generateCode(): string {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)]
  }
  return code
}

// Código inválido ou do próprio usuário é tratado como ausente (sem erro) por quem chama esta função.
export async function validateReferralCode(code: string, currentUserId: string | null): Promise<string | null> {
  const referral = await prisma.referralCode.findUnique({ where: { code } })
  if (!referral) return null
  if (currentUserId && referral.ownerUserId === currentUserId) return null
  return referral.code
}

export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const existing = await prisma.referralCode.findUnique({ where: { ownerUserId: userId } })
  if (existing) return existing.code

  while (true) {
    const code = generateCode()
    const conflict = await prisma.referralCode.findUnique({ where: { code } })
    if (conflict) continue

    try {
      const created = await prisma.referralCode.create({ data: { code, ownerUserId: userId } })
      return created.code
    } catch {
      // Corrida entre duas requisições do mesmo usuário — outra já criou o código.
      const retryExisting = await prisma.referralCode.findUnique({ where: { ownerUserId: userId } })
      if (retryExisting) return retryExisting.code
      throw new Error('Falha ao gerar código de indicação')
    }
  }
}
