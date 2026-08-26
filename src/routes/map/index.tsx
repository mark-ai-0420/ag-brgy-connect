import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
// Server function — fetches approved businesses for dynamic mapping
export const getMapBusinesses = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from('businesses')
      .select('id, name, category, phone, address, hours, description, map_url, barangay, purok, latitude, longitude, messenger_link, photo_url')
      .eq('status', 'approved')
      .order('name')
    if (error) console.error('Error fetching businesses for map:', error)
    return data ?? []
  } catch (error) {
    console.error('Error in getMapBusinesses:', error)
    return []
  }
})

export const Route = createFileRoute('/map/')({
  head: () => ({
    links: [
      {
        rel: 'stylesheet',
        href: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
      },
    ],
  }),
  loader: () => getMapBusinesses(),
})
