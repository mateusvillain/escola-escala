import { config } from 'dotenv'
config({ path: '.env.local' })

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, Role, PlanType, BillingCycle, CourseStatus, SubscriptionStatus } from '../src/generated/prisma/client'
import bcrypt from 'bcryptjs'
import { stripe } from '../src/lib/stripe'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function seedSubscriber({
  email,
  name,
  passwordHash,
  planId,
  stripeSubscriptionId,
}: {
  email: string
  name: string
  passwordHash: string
  planId: string
  stripeSubscriptionId: string
}) {
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, passwordHash, role: Role.student },
  })

  // Real Stripe test-mode customer — needed for the billing portal button to
  // work with these seed accounts. Reused on re-seed via User.stripeCustomerId.
  const stripeCustomerId = user.stripeCustomerId ?? (await stripe.customers.create({ email, name })).id

  if (!user.stripeCustomerId) {
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId } })
  }

  await prisma.userSubscription.upsert({
    where: { stripeSubscriptionId },
    update: { stripeCustomerId },
    create: {
      userId: user.id,
      planId,
      stripeSubscriptionId,
      stripeCustomerId,
      status: SubscriptionStatus.active,
      billingCycle: BillingCycle.monthly,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })
}

// Mantido em sincronia com E2E_COURSE_SLUG / E2E_LESSON_TITLES em e2e/helpers.ts —
// os specs de player e certificado (TASK-182/183) navegam por esse curso fixo.
const E2E_COURSE_SLUG = 'curso-e2e-playwright'
const E2E_LESSON_TITLES = ['Aula 1', 'Aula 2', 'Aula 3']

async function seedE2ECourse(instructorId: string) {
  const course = await prisma.course.upsert({
    where: { slug: E2E_COURSE_SLUG },
    update: {},
    create: {
      title: 'Curso E2E Playwright',
      slug: E2E_COURSE_SLUG,
      description: 'Curso fixo usado pelos specs E2E de player e certificado. Não editar manualmente.',
      instructorId,
      planAccess: PlanType.premium,
      status: CourseStatus.published,
    },
  })

  const existingModule = await prisma.module.findFirst({
    where: { courseId: course.id, title: 'Introdução' },
  })
  if (existingModule) return

  const module_ = await prisma.module.create({
    data: { courseId: course.id, title: 'Introdução', order: 1 },
  })

  for (const [index, title] of E2E_LESSON_TITLES.entries()) {
    await prisma.lesson.create({
      data: {
        moduleId: module_.id,
        title,
        order: index + 1,
        videoId: `e2e-test-video-${index + 1}`,
      },
    })
  }
}

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

  const instructor = await prisma.instructor.upsert({
    where: { userId: instructorUser.id },
    update: {},
    create: {
      userId: instructorUser.id,
      bio: 'Instrutor de teste para desenvolvimento.',
      slug: 'instrutor-teste',
    },
  })

  await seedE2ECourse(instructor.id)

  await seedSubscriber({
    email: 'aluno.basico@test.com',
    name: 'Aluno Básico',
    passwordHash,
    planId: basicPlan.id,
    stripeSubscriptionId: 'sub_test_basic',
  })

  await seedSubscriber({
    email: 'aluno.premium@test.com',
    name: 'Aluno Premium',
    passwordHash,
    planId: premiumPlan.id,
    stripeSubscriptionId: 'sub_test_premium',
  })

  // Usuário sem assinatura, só com dados fiscais preenchidos — para testar a
  // visualização da seção "Dados fiscais" em /admin/usuarios/[id] de forma
  // isolada (sem pagamento/matrículas envolvidos).
  await prisma.user.upsert({
    where: { email: 'aluno.dados-fiscais@test.com' },
    update: {},
    create: {
      email: 'aluno.dados-fiscais@test.com',
      name: 'Aluno Dados Fiscais',
      passwordHash,
      role: Role.student,
      cpfCnpj: '111.444.777-35',
      addressStreet: 'Rua Augusta',
      addressNumber: '500',
      addressComplement: 'Apto 12',
      addressNeighborhood: 'Consolação',
      addressCity: 'São Paulo',
      addressState: 'SP',
      addressZipCode: '01305-000',
    },
  })

  console.log('Seed concluído.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
