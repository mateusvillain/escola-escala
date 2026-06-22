import Link from 'next/link'
import { TrackForm } from '@/components/admin/TrackForm'

export default function NovaTrilhaPage() {
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
        Nova trilha
      </lui-heading>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <TrackForm />
      </div>
    </div>
  )
}
