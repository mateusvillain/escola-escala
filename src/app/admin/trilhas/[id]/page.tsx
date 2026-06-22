import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { TrackForm } from '@/components/admin/TrackForm'
import { TrackCourseList } from '@/components/admin/TrackCourseList'

interface EditTrilhaPageProps {
  params: Promise<{ id: string }>
}

export default async function EditTrilhaPage({ params }: EditTrilhaPageProps) {
  const { id } = await params

  const track = await prisma.courseTrack.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { order: 'asc' },
        include: {
          course: {
            select: { id: true, title: true, slug: true, thumbnailUrl: true, status: true },
          },
        },
      },
    },
  })

  if (!track) notFound()

  const canPublish = track.items.length >= 2

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Link
          href="/admin/trilhas"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Trilhas
        </Link>
      </div>
      <lui-heading level="1" size="xl" className="mb-6">
        Editar trilha
      </lui-heading>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <TrackForm
          trackId={track.id}
          slug={track.slug}
          canPublish={canPublish}
          defaultValues={{
            title: track.title,
            description: track.description,
            thumbnailUrl: track.thumbnailUrl ?? '',
            isBundle: track.isBundle,
            bundlePriceOneTime: track.bundlePriceOneTime?.toString() ?? '',
            stripePriceIdBundle: track.stripePriceIdBundle ?? '',
          }}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <TrackCourseList trackId={track.id} initialItems={track.items} />
      </div>
    </div>
  )
}
