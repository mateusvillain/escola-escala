'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CourseProgressCard } from './CourseProgressCard'
import { ContinueWatchingCard } from './ContinueWatchingCard'
import { CompletedCourseCard } from './CompletedCourseCard'
import { DashboardSkeleton } from './DashboardSkeleton'

interface DashboardLesson {
  id: string
  title: string
}

interface InProgressCourse {
  id: string
  title: string
  slug: string
  thumbnailUrl: string | null
  progress: number
  lastLesson: DashboardLesson | null
}

interface CompletedCourse {
  id: string
  title: string
  slug: string
  thumbnailUrl: string | null
  progress: number
  completedAt: string
  certificateUrl: string | null
}

interface AvailableCourse {
  id: string
  title: string
  slug: string
  thumbnailUrl: string | null
  planAccess: 'basic' | 'premium'
}

interface DashboardData {
  inProgress: InProgressCourse[]
  completed: CompletedCourse[]
  available: AvailableCourse[]
}

function Section({
  title,
  action,
  children,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <lui-heading level="2" size="lg">
          {title}
        </lui-heading>
        {action}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{children}</div>
    </section>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
      <svg className="w-16 h-16 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
      <p className="text-base font-medium text-gray-500">Você ainda não está matriculado em nenhum curso</p>
      <Link
        href="/cursos"
        className="mt-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
      >
        Explorar cursos
      </Link>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
      <p className="text-sm text-red-600">{message}</p>
    </div>
  )
}

export function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    fetch('/api/dashboard')
      .then(res => {
        if (!res.ok) throw new Error('Erro ao carregar dashboard')
        return res.json() as Promise<DashboardData>
      })
      .then(json => {
        if (active) setData(json)
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar seus cursos. Tente novamente.')
      })

    return () => {
      active = false
    }
  }, [])

  if (error) return <ErrorState message={error} />
  if (!data) return <DashboardSkeleton />

  const { inProgress, completed, available } = data
  const continueItem = inProgress.find(course => course.lastLesson)
  const isEmpty = inProgress.length === 0 && completed.length === 0 && available.length === 0

  if (isEmpty) return <EmptyState />

  return (
    <div className="space-y-10">
      {continueItem && continueItem.lastLesson && (
        <ContinueWatchingCard
          courseTitle={continueItem.title}
          lessonTitle={continueItem.lastLesson.title}
          thumbnailUrl={continueItem.thumbnailUrl}
          href={`/cursos/${continueItem.slug}/aulas/${continueItem.lastLesson.id}`}
        />
      )}

      {inProgress.length > 0 && (
        <Section title="Em andamento">
          {inProgress.map(course => (
            <CourseProgressCard
              key={course.id}
              title={course.title}
              thumbnailUrl={course.thumbnailUrl}
              progress={course.progress}
              ctaLabel="Continuar"
              ctaHref={`/cursos/${course.slug}`}
            />
          ))}
        </Section>
      )}

      {available.length > 0 && (
        <Section
          title="Disponíveis para você"
          action={
            <Link href="/cursos" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
              Ver todos →
            </Link>
          }
        >
          {available.map(course => (
            <CourseProgressCard
              key={course.id}
              title={course.title}
              thumbnailUrl={course.thumbnailUrl}
              planAccess={course.planAccess}
              ctaLabel="Começar"
              ctaHref={`/cursos/${course.slug}`}
            />
          ))}
        </Section>
      )}

      {completed.length > 0 && (
        <Section title="Concluídos">
          {completed.map(course => (
            <CompletedCourseCard
              key={course.id}
              title={course.title}
              slug={course.slug}
              thumbnailUrl={course.thumbnailUrl}
              completedAt={course.completedAt}
              certificateUrl={course.certificateUrl}
            />
          ))}
        </Section>
      )}
    </div>
  )
}
