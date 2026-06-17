'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StarRating } from '@/components/cursos/StarRating'
import { CourseReviewModal } from './CourseReviewModal'

interface PendingCourse {
  id: string
  title: string
  slug: string
}

interface SubmittedReview {
  courseId: string
  title: string
  slug: string
  rating: number
  comment: string | null
  createdAt: string
}

export function MyReviewsContent({
  pending,
  submitted,
}: {
  pending: PendingCourse[]
  submitted: SubmittedReview[]
}) {
  const [reviewingCourse, setReviewingCourse] = useState<PendingCourse | null>(null)
  const router = useRouter()

  return (
    <div className="space-y-10">
      {pending.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Avaliações pendentes
          </h2>
          <div className="space-y-3">
            {pending.map(course => (
              <div
                key={course.id}
                className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4"
              >
                <p className="text-sm font-medium text-gray-900">{course.title}</p>
                <button
                  type="button"
                  onClick={() => setReviewingCourse(course)}
                  className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Avaliar
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {submitted.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Minhas avaliações
          </h2>
          <div className="space-y-3">
            {submitted.map(review => (
              <div key={review.courseId} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-semibold text-gray-900">{review.title}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <StarRating rating={review.rating} size="sm" />
                {review.comment && <p className="text-sm text-gray-600 mt-2">{review.comment}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {reviewingCourse && (
        <CourseReviewModal
          courseTitle={reviewingCourse.title}
          courseSlug={reviewingCourse.slug}
          onClose={() => setReviewingCourse(null)}
          onSubmitted={() => {
            setReviewingCourse(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
