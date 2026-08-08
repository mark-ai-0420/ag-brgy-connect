import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { ArrowLeft, CalendarDays, User, Pin } from 'lucide-react'
import { format, parseISO } from 'date-fns'

import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'

const getAnnouncement = createServerFn({ method: 'GET' })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from('announcements').select('*').eq('id', id).single()
    if (error || !data) return null
    return data
  })

export const Route = createFileRoute('/announcements/$announcementId')({
  component: AnnouncementDetail,
  loader: ({ params }) => getAnnouncement({ data: params.announcementId }),
})

const CATEGORY_COLORS: Record<string, string> = {
  Infrastructure: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Health: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  Sanitation: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  Administrative: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
}

function AnnouncementDetail() {
  const item = Route.useLoaderData()

  if (!item) {
    return (
      <div className="container mx-auto py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold">Announcement Not Found</h2>
        <p className="text-muted-foreground">This announcement may have been removed.</p>
        <Button asChild>
          <Link to="/announcements">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Announcements
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 max-w-3xl">
      {/* Back button */}
      <Button variant="ghost" asChild className="mb-6 -ml-3 text-muted-foreground hover:text-foreground">
        <Link to="/announcements">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Announcements
        </Link>
      </Button>

      <article>
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {item.pinned && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
              <Pin className="h-3 w-3" />
              Pinned
            </span>
          )}
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${CATEGORY_COLORS[item.category] ?? 'bg-muted text-muted-foreground'}`}>
            {item.category}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-5">{item.title}</h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pb-6 border-b mb-8">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            {format(parseISO(item.created_at), 'MMMM d, yyyy')}
          </span>
          <span className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            {item.author ?? 'Barangay Council'}
          </span>
        </div>

        {/* Body */}
        <div className="prose prose-slate dark:prose-invert max-w-none">
          {item.body?.split('\n\n').map((paragraph: string, idx: number) => (
            <p key={idx} className="text-base leading-relaxed text-foreground/90 mb-4 whitespace-pre-wrap">
              {paragraph}
            </p>
          ))}
        </div>
      </article>

      {/* Footer nav */}
      <div className="mt-12 pt-6 border-t">
        <Button variant="outline" asChild>
          <Link to="/announcements">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All Announcements
          </Link>
        </Button>
      </div>
    </div>
  )
}
