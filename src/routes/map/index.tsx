import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'

export interface MapBusiness {
  id: string | number
  name: string
  category: string | null
  phone: string | null
  address: string | null
  hours: string | null
  description: string | null
  map_url: string | null
  barangay: string | null
  purok: string | null
  latitude: number | string | null
  longitude: number | string | null
  messenger_link: string | null
  photo_url: string | null
}

// Server function — fetches approved businesses for dynamic GIS mapping
export const getMapBusinesses = createServerFn({ method: 'GET' }).handler(async (): Promise<MapBusiness[]> => {
  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from('businesses')
      .select('id, name, category, phone, address, hours, description, map_url, barangay, purok, latitude, longitude, messenger_link, photo_url')
      .eq('status', 'approved')
      .order('name')

    if (error) {
      console.error('Error fetching businesses for map:', error)
      return []
    }
    return (data as MapBusiness[]) ?? []
  } catch (error) {
    console.error('Error in getMapBusinesses:', error)
    return []
  }
})

export const Route = createFileRoute('/map/')({
  head: () => ({
    meta: [
      {
        title: 'Interactive GIS Map & Evacuation Shelters | Barangay Daine',
      },
      {
        name: 'description',
        content:
          'Interactive GIS mapping and emergency infrastructure directory for Barangay Daine 1 & Daine 2, Indang, Cavite. Locate emergency evacuation shelters, potable water hubs, health centers, daycare facilities, and verified local MSMEs.',
      },
      {
        name: 'keywords',
        content:
          'Barangay Daine 1, Barangay Daine 2, Indang Cavite, GIS Map, Evacuation Shelters, Emergency Hotlines, Potable Water Stations, Health Center, Child Development, MSME Directory, Cavite Civic Map',
      },
      {
        property: 'og:title',
        content: 'Interactive GIS Map & Emergency Evacuation | Barangay Daine',
      },
      {
        property: 'og:description',
        content:
          'Real-time GIS map locator for evacuation shelters, disaster water stations, health facilities, and local MSME establishments in Barangay Daine 1 & 2, Indang, Cavite.',
      },
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:site_name',
        content: 'Barangay Daine Connect & Civic Horizon',
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: 'Barangay Daine GIS Map & Evacuation Hubs',
      },
      {
        name: 'twitter:description',
        content:
          'Interactive map locator for evacuation shelters, civic amenities, and local businesses in Brgy. Daine 1 & 2, Indang, Cavite.',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
      },
    ],
  }),
  loader: async (): Promise<MapBusiness[]> => getMapBusinesses(),
})
