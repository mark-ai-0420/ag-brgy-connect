import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { createSupabaseServerClient } from '#/lib/supabase.server'

export const globalSearchFn = createServerFn({ method: 'GET' })
  .validator((d: { query: string }) => z.object({ query: z.string().min(1).max(100) }).parse(d))
  .handler(async ({ data }) => {
    const { query } = data
    const supabase = createSupabaseServerClient()
    const searchPattern = `%${query}%`

    const [
      { data: announcements },
      { data: events },
      { data: businesses },
      { data: officials }
    ] = await Promise.all([
      supabase.from('announcements').select('id, title, body, created_at').ilike('title', searchPattern).limit(5),
      supabase.from('events').select('id, title, location, starts_at').ilike('title', searchPattern).limit(5),
      supabase.from('businesses').select('id, name, category, address').eq('status', 'approved').ilike('name', searchPattern).limit(5),
      supabase.from('barangay_officials').select('id, name, position, committee').ilike('name', searchPattern).limit(5)
    ])

    return {
      announcements: announcements ?? [],
      events: events ?? [],
      businesses: businesses ?? [],
      officials: officials ?? [],
    }
  })
