function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="w-full aspect-video bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-2 bg-gray-200 rounded w-full" />
        <div className="h-9 bg-gray-200 rounded w-full" />
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-10">
      <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />

      {[0, 1].map(section => (
        <div key={section}>
          <div className="h-5 bg-gray-200 rounded w-40 mb-4 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2].map(card => (
              <SkeletonCard key={card} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
