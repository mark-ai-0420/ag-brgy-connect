import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { ArrowLeft, CalendarDays, User, Pin, Megaphone } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { z } from 'zod'

import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'

const getAnnouncement = createServerFn({ method: 'GET' })
  .validator((id: string) => z.string().min(1).parse(id))
  .handler(async ({ data: id }) => {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from('announcements')
      .select('id, title, body, pinned, created_at, author_id, category, scope, image_url')
      .eq('id', id)
      .single()
    if (error || !data) return null
    return data
  })

export const Route = createFileRoute('/announcements/$announcementId')({
  component: AnnouncementDetail,
  loader: ({ params }) => getAnnouncement({ data: params.announcementId }),
})

const CATEGORY_COLORS: Record<string, string> = {
  General: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 font-semibold',
  Advisory: 'bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200 border border-amber-300 font-semibold',
  Emergency: 'bg-red-100 text-red-900 dark:bg-red-900/50 dark:text-red-200 border border-red-300 font-semibold',
  Programs: 'bg-purple-100 text-purple-900 dark:bg-purple-900/50 dark:text-purple-200 border border-purple-300 font-semibold',
  Infrastructure: 'bg-orange-100 text-orange-900 dark:bg-orange-900/50 dark:text-orange-200 border border-orange-300 font-semibold',
  Health: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-200 border border-emerald-300 font-semibold',
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
    <div className="container mx-auto py-10 px-4 md:px-6 max-w-4xl">
      {/* Back button */}
      <Button variant="ghost" asChild className="mb-6 -ml-3 text-muted-foreground hover:text-foreground min-h-[44px] px-3">
        <Link to="/announcements">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Announcements
        </Link>
      </Button>

      <article className="space-y-6">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {item.pinned && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-400 text-slate-950 border border-amber-500/50 shadow-xs">
              <Pin className="h-3.5 w-3.5 fill-slate-950" />
              Pinned Notice
            </span>
          )}
          {item.category && (
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${CATEGORY_COLORS[item.category] ?? 'bg-muted text-muted-foreground'}`}>
              {item.category}
            </span>
          )}
          {item.scope && (
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
              item.scope === 'both' ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200' :
              item.scope === 'daine_1' ? 'bg-[#0038A8]/10 text-[#0038A8] dark:bg-[#0038A8]/30 dark:text-[#60a5fa]' :
              'bg-[#CE1126]/10 text-[#CE1126] dark:bg-[#CE1126]/30 dark:text-[#f87171]'
            }`}>
              {item.scope === 'both' ? 'All Daine' : item.scope === 'daine_1' ? 'Barangay Daine 1' : 'Barangay Daine 2'}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-foreground">
          {item.title}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground pb-6 border-b">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-primary" />
            {format(parseISO(item.created_at), 'MMMM d, yyyy')}
          </span>
          <span className="flex items-center gap-1.5">
            <User className="h-4 w-4 text-primary" />
            {item.author_id ? 'Barangay Official' : 'Barangay Council'}
          </span>
        </div>

        {/* Full Hero Image (if present) */}
        {item.image_url && (
          <div className="rounded-2xl overflow-hidden border border-border/80 shadow-md bg-muted/40 my-6">
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-auto max-h-[550px] object-cover object-center"
            />
          </div>
        )}

        {/* Body Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none pt-2">
          {item.body?.split('\n\n').map((paragraph: string, idx: number) => (
            <p key={idx} className="text-base sm:text-lg leading-relaxed text-foreground/90 mb-4 whitespace-pre-wrap">
              {paragraph}
            </p>
          ))}
        </div>
      </article>

      {/* Footer nav */}
      <div className="mt-12 pt-6 border-t flex items-center justify-between">
        <Button variant="outline" asChild className="min-h-[44px] px-4 font-semibold">
          <Link to="/announcements">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All Announcements
          </Link>
        </Button>
      </div>
    </div>
  )
}
