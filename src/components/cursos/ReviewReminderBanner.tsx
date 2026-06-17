'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CourseReviewModal } from '@/components/dashboard/CourseReviewModal'

export function ReviewReminderBanner({
  courseSlug,
  courseTitle,
}: {
  courseSlug: string
  courseTitle: string
}) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-amber-800 font-medium">Você concluiu este curso! Que tal avaliar sua experiência?</p>
          <p className="text-amber-700 text-sm mt-0.5">Sua opinião ajuda outros alunos a escolher este curso.</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex-shrink-0 px-6 py-2.5 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors text-sm"
        >
          Avaliar curso
        </button>
      </div>

      {open && (
        <CourseReviewModal
          courseTitle={courseTitle}
          courseSlug={courseSlug}
          onClose={() => setOpen(false)}
          onSubmitted={() => {
            setOpen(false)
            router.refresh()
          }}
        />
      )}
    </>
  )
}
