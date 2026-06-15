import { config } from 'dotenv'
config({ path: '.env.local' })

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, Role, PlanType, BillingCycle, SubscriptionStatus } from '../src/generated/prisma/client'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const passwordHash = await bcrypt.hash('Test@12345', 12)

  const basicPlan = await prisma.subscriptionPlan.upsert({
    where: { type: PlanType.basic },
    update: {},
    create: {
      name: 'Básico',
      type: PlanType.basic,
      description: 'Acesso aos cursos básicos',
      priceMonthly: 29.9,
      priceAnnual: 299.0,
      stripePriceIdMonthly: process.env.STRIPE_PRICE_BASIC_MONTHLY ?? '',
      stripePriceIdAnnual: process.env.STRIPE_PRICE_BASIC_ANNUAL ?? '',
    },
  })

  const premiumPlan = await prisma.subscriptionPlan.upsert({
    where: { type: PlanType.premium },
    update: {},
    create: {
      name: 'Premium',
      type: PlanType.premium,
      description: 'Acesso a todos os cursos',
      priceMonthly: 59.9,
      priceAnnual: 599.0,
      stripePriceIdMonthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY ?? '',
      stripePriceIdAnnual: process.env.STRIPE_PRICE_PREMIUM_ANNUAL ?? '',
    },
  })

  await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      name: 'Admin',
      passwordHash,
      role: Role.admin,
    },
  })

  const instructorUser = await prisma.user.upsert({
    where: { email: 'instrutor@test.com' },
    update: {},
    create: {
      email: 'instrutor@test.com',
      name: 'Instrutor Teste',
      passwordHash,
      role: Role.instructor,
    },
  })

  await prisma.instructor.upsert({
    where: { userId: instructorUser.id },
    update: {},
    create: {
      userId: instructorUser.id,
      bio: 'Instrutor de teste para desenvolvimento.',
      slug: 'instrutor-teste',
    },
  })

  const alunoBasico = await prisma.user.upsert({
    where: { email: 'aluno.basico@test.com' },
    update: {},
    create: {
      email: 'aluno.basico@test.com',
      name: 'Aluno Básico',
      passwordHash,
      role: Role.student,
    },
  })

  await prisma.userSubscription.upsert({
    where: { stripeSubscriptionId: 'sub_test_basic' },
    update: {},
    create: {
      userId: alunoBasico.id,
      planId: basicPlan.id,
      stripeSubscriptionId: 'sub_test_basic',
      stripeCustomerId: 'cus_test_basic',
      status: SubscriptionStatus.active,
      billingCycle: BillingCycle.monthly,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  const alunoPremium = await prisma.user.upsert({
    where: { email: 'aluno.premium@test.com' },
    update: {},
    create: {
      email: 'aluno.premium@test.com',
      name: 'Aluno Premium',
      passwordHash,
      role: Role.student,
    },
  })

  await prisma.userSubscription.upsert({
    where: { stripeSubscriptionId: 'sub_test_premium' },
    update: {},
    create: {
      userId: alunoPremium.id,
      planId: premiumPlan.id,
      stripeSubscriptionId: 'sub_test_premium',
      stripeCustomerId: 'cus_test_premium',
      status: SubscriptionStatus.active,
      billingCycle: BillingCycle.monthly,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  console.log('Seed concluído.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
