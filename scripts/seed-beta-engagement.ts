import { config } from 'dotenv'
config({ path: '.env.local' })

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const org = await prisma.organization.findFirst({ where: { slug: 'empresa-beta-ltda' } })
  if (!org) throw new Error('Organização Empresa Beta LTDA não encontrada')

  const colaborador = await prisma.user.findUnique({ where: { email: 'colaborador@empresa-beta.com' } })
  if (!colaborador) throw new Error('colaborador@empresa-beta.com não encontrado')

  // 3 cursos públicos publicados para criar estados distintos
  const courses = await prisma.course.findMany({
    where: { organizationId: null, status: 'published' },
    take: 3,
    include: { modules: { take: 1, include: { lessons: { take: 1 } } } },
  })

  if (courses.length < 1) throw new Error('Nenhum curso público publicado encontrado')

  const now = new Date()
  const days = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000)

  // Estado 1: concluído — enrolledAt 30 dias atrás, completedAt 5 dias atrás
  if (courses[0]) {
    await prisma.courseEnrollment.upsert({
      where: { userId_courseId: { userId: colaborador.id, courseId: courses[0].id } },
      create: {
        userId: colaborador.id,
        courseId: courses[0].id,
        enrolledAt: days(30),
        completedAt: days(5),
      },
      update: { completedAt: days(5) },
    })
    // Progresso de aula para contribuir com tempo de estudo
    const lesson0 = courses[0].modules[0]?.lessons[0]
    if (lesson0) {
      await prisma.lessonProgress.upsert({
        where: { userId_lessonId: { userId: colaborador.id, lessonId: lesson0.id } },
        create: {
          userId: colaborador.id,
          lessonId: lesson0.id,
          watchPercentage: 100,
          lastPositionSeconds: 1800,
          isCompleted: true,
          completedAt: days(5),
          lastWatchedAt: days(5),
        },
        update: { lastWatchedAt: days(5), lastPositionSeconds: 1800, isCompleted: true, watchPercentage: 100, completedAt: days(5) },
      })
    }
    console.log(`✓ Curso concluído: ${courses[0].title}`)
  }

  // Estado 2: em andamento — enrolledAt 3 dias atrás, progresso recente
  if (courses[1]) {
    await prisma.courseEnrollment.upsert({
      where: { userId_courseId: { userId: colaborador.id, courseId: courses[1].id } },
      create: {
        userId: colaborador.id,
        courseId: courses[1].id,
        enrolledAt: days(3),
        completedAt: null,
      },
      update: { completedAt: null },
    })
    const lesson1 = courses[1].modules[0]?.lessons[0]
    if (lesson1) {
      await prisma.lessonProgress.upsert({
        where: { userId_lessonId: { userId: colaborador.id, lessonId: lesson1.id } },
        create: {
          userId: colaborador.id,
          lessonId: lesson1.id,
          watchPercentage: 45,
          lastPositionSeconds: 900,
          isCompleted: false,
          lastWatchedAt: days(1),
        },
        update: { lastWatchedAt: days(1), lastPositionSeconds: 900, watchPercentage: 45, isCompleted: false },
      })
    }
    console.log(`✓ Curso em andamento: ${courses[1].title}`)
  }

  // Estado 3: atrasado — enrolledAt 20 dias atrás, sem atividade recente
  if (courses[2]) {
    await prisma.courseEnrollment.upsert({
      where: { userId_courseId: { userId: colaborador.id, courseId: courses[2].id } },
      create: {
        userId: colaborador.id,
        courseId: courses[2].id,
        enrolledAt: days(20),
        completedAt: null,
      },
      update: { completedAt: null },
    })
    const lesson2 = courses[2].modules[0]?.lessons[0]
    if (lesson2) {
      await prisma.lessonProgress.upsert({
        where: { userId_lessonId: { userId: colaborador.id, lessonId: lesson2.id } },
        create: {
          userId: colaborador.id,
          lessonId: lesson2.id,
          watchPercentage: 10,
          lastPositionSeconds: 120,
          isCompleted: false,
          lastWatchedAt: days(19),
        },
        update: { lastWatchedAt: days(19), lastPositionSeconds: 120, watchPercentage: 10, isCompleted: false },
      })
    }
    console.log(`✓ Curso atrasado: ${courses[2].title}`)
  }

  console.log('\nDados de engajamento inseridos para colaborador@empresa-beta.com')
  console.log(`Org: ${org.name} (${org.id})`)
  console.log(`Membro: ${colaborador.name} (${colaborador.id})`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
