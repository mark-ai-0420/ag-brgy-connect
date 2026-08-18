import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'









export interface Official {
  id: string
  name: string
  position: string
  committee: string | null
  photo_url: string | null
  contact_number: string | null
  term: string
  display_order: number
  barangay: 'daine_1' | 'daine_2'
  created_at: string
}

const getOfficials = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from('barangay_officials')
      .select('id, name, position, committee, photo_url, contact_number, term, display_order, barangay')
      .order('display_order', { ascending: true })
    if (error) console.error('Error fetching officials:', error)
    return (data as Official[]) ?? []
  } catch (error) {
    console.error('Error in getOfficials:', error)
    return []
  }
})

export const Route = createFileRoute('/officials/')({
  loader: () => getOfficials(),
})
