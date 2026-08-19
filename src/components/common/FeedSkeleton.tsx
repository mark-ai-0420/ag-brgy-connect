import { Skeleton } from '#/components/ui/skeleton'

export function FeedSkeleton() {
  return (
    <div className="container mx-auto py-10 px-4 md:px-6 max-w-6xl">
      <div className="flex items-center gap-3 mb-8">
        <Skeleton className="h-12 w-12 rounded-2xl shrink-0" />
        <div className="space-y-2 w-full">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
      </div>
      <div className="mb-8 flex gap-4 flex-col sm:flex-row">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-full sm:w-[200px] rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden">
            <Skeleton className="h-48 w-full rounded-none" />
            <div className="p-5 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
              <div className="pt-4 flex gap-2">
                <Skeleton className="h-8 w-16 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
