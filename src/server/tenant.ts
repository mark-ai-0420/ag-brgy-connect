import { createServerFn } from '@tanstack/react-start'
import { getCookies, setCookie } from '@tanstack/react-start/server'
import { z } from 'zod'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { getAuthSession } from '#/server/auth'

export interface Barangay {
  id: string
  slug: string
  code_prefix: string
  name: string
  short_name: string
  municipality: string
  province: string
  region: string
  zip_code: string
  seal_url?: string | null
  logo_url?: string | null
  banner_url?: string | null
  tagline?: string | null
  description?: string | null
  map_center_lat: number
  map_center_lng: number
  map_default_zoom: number
  geojson_boundary?: any | null
  puroks: string[]
  purok_landmarks?: Array<{ name: string; lat: number; lng: number; landmark?: string }> | null
  emergency_hotline?: string | null
  police_hotline?: string | null
  health_center_hotline?: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export const DEFAULT_BARANGAYS: Barangay[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    slug: 'daine-1',
    code_prefix: 'BD1',
    name: 'Barangay Daine 1',
    short_name: 'Daine 1',
    municipality: 'Indang',
    province: 'Cavite',
    region: 'Region IV-A (CALABARZON)',
    zip_code: '4122',
    seal_url: '/logo.jpg',
    logo_url: '/logo.jpg',
    banner_url: null,
    tagline: 'Pamahalaang Barangay ng Daine 1',
    description: 'Official digital services and community portal for Barangay Daine 1, Indang, Cavite.',
    map_center_lat: 14.1955,
    map_center_lng: 120.8798,
    map_default_zoom: 16,
    puroks: [
      'Purok 1',
      'Purok 2',
      'Purok 3',
      'Purok 4',
      'Sitio Ilaya',
      'Sitio Ibaba',
      'Sitio Centro',
      'Sitio Boundary',
    ],
    emergency_hotline: '(046) 415-0123',
    police_hotline: '(046) 415-0211',
    health_center_hotline: '(046) 415-0102',
    is_active: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    slug: 'daine-2',
    code_prefix: 'BD2',
    name: 'Barangay Daine 2',
    short_name: 'Daine 2',
    municipality: 'Indang',
    province: 'Cavite',
    region: 'Region IV-A (CALABARZON)',
    zip_code: '4122',
    seal_url: '/logo.jpg',
    logo_url: '/logo.jpg',
    banner_url: null,
    tagline: 'Pamahalaang Barangay ng Daine 2',
    description: 'Official digital services and community portal for Barangay Daine 2, Indang, Cavite.',
    map_center_lat: 14.197,
    map_center_lng: 120.886,
    map_default_zoom: 16,
    puroks: [
      'Purok 1',
      'Purok 2',
      'Purok 3',
      'Purok 4',
      'Purok 5',
      'Purok 6',
      'Purok 7',
    ],
    emergency_hotline: '(046) 415-0456',
    police_hotline: '(046) 415-0211',
    health_center_hotline: '(046) 415-0102',
    is_active: true,
  },
]

// Normalizes puroks if stored as string or JSON
function normalizeBarangay(row: any): Barangay {
  let puroks: string[] = []
  if (Array.isArray(row.puroks)) {
    puroks = row.puroks.map(String)
  } else if (typeof row.puroks === 'string') {
    try {
      const parsed = JSON.parse(row.puroks)
      if (Array.isArray(parsed)) puroks = parsed.map(String)
    } catch {
      puroks = []
    }
  }

  return {
    id: row.id,
    slug: row.slug,
    code_prefix: row.code_prefix || 'BD',
    name: row.name,
    short_name: row.short_name || row.name,
    municipality: row.municipality || 'Indang',
    province: row.province || 'Cavite',
    region: row.region || 'Region IV-A (CALABARZON)',
    zip_code: row.zip_code || '4122',
    seal_url: row.seal_url || '/logo.jpg',
    logo_url: row.logo_url || '/logo.jpg',
    banner_url: row.banner_url || null,
    tagline: row.tagline || null,
    description: row.description || null,
    map_center_lat: Number(row.map_center_lat ?? 14.1955),
    map_center_lng: Number(row.map_center_lng ?? 120.8798),
    map_default_zoom: Number(row.map_default_zoom ?? 15),
    geojson_boundary: row.geojson_boundary || null,
    puroks: puroks.length > 0 ? puroks : DEFAULT_BARANGAYS[0].puroks,
    purok_landmarks: Array.isArray(row.purok_landmarks) ? row.purok_landmarks : null,
    emergency_hotline: row.emergency_hotline || null,
    police_hotline: row.police_hotline || null,
    health_center_hotline: row.health_center_hotline || null,
    is_active: Boolean(row.is_active ?? true),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

/**
 * Fetch all active barangays (or all if includeInactive = true)
 */
export const getAllBarangays = createServerFn({ method: 'GET' })
  .validator((includeInactive?: boolean) => Boolean(includeInactive))
  .handler(async ({ data: includeInactive }): Promise<Barangay[]> => {
    try {
      const supabase = createSupabaseServerClient()
      let query = supabase.from('barangays').select('*').order('name', { ascending: true })

      if (!includeInactive) {
        query = query.eq('is_active', true)
      }

      const { data, error } = await query
      if (error || !data || data.length === 0) {
        return DEFAULT_BARANGAYS
      }

      return data.map(normalizeBarangay)
    } catch {
      return DEFAULT_BARANGAYS
    }
  })

/**
 * Fetch a single barangay by slug or UUID with fallback to Daine 1
 */
export const getTenantBarangay = createServerFn({ method: 'GET' })
  .validator((slugOrId?: string | null) => slugOrId)
  .handler(async ({ data: slugOrId }): Promise<Barangay> => {
    if (!slugOrId) return DEFAULT_BARANGAYS[0]

    // Normalize legacy inputs
    const clean = slugOrId.trim().toLowerCase()
    if (clean === 'daine_1' || clean === 'daine1' || clean === 'daine-1') {
      return DEFAULT_BARANGAYS[0]
    }
    if (clean === 'daine_2' || clean === 'daine2' || clean === 'daine-2') {
      return DEFAULT_BARANGAYS[1]
    }

    try {
      const supabase = createSupabaseServerClient()
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean)

      let query = supabase.from('barangays').select('*')
      if (isUuid) {
        query = query.eq('id', clean)
      } else {
        query = query.eq('slug', clean)
      }

      const { data, error } = await query.maybeSingle()
      if (error || !data) {
        // Fallback matching in default list
        const matched = DEFAULT_BARANGAYS.find(
          (b) => b.id.toLowerCase() === clean || b.slug.toLowerCase() === clean
        )
        return matched || DEFAULT_BARANGAYS[0]
      }

      return normalizeBarangay(data)
    } catch {
      return DEFAULT_BARANGAYS[0]
    }
  })

/**
 * Resolves active tenant for incoming requests (Session -> Cookie -> Default)
 */
export const resolveRequestTenant = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ tenant: Barangay; all: Barangay[]; source: 'session' | 'cookie' | 'default' }> => {
    let all: Barangay[] = DEFAULT_BARANGAYS
    try {
      const fetched = await getAllBarangays({ data: false })
      if (fetched && fetched.length > 0) all = fetched
    } catch {
      // fallback
    }

    // 1. Check user session
    try {
      const auth = await getAuthSession()
      if (auth.user) {
        // If resident or staff bound to a specific barangay
        const userBrgyId = (auth as any).barangay_id || (auth as any).user_role_barangay_id
        if (userBrgyId) {
          const match = all.find((b) => b.id === userBrgyId)
          if (match) {
            return { tenant: match, all, source: 'session' }
          }
        }

        // Legacy string check
        if (auth.barangay === 'daine_2') {
          return { tenant: DEFAULT_BARANGAYS[1], all, source: 'session' }
        }
        if (auth.barangay === 'daine_1') {
          return { tenant: DEFAULT_BARANGAYS[0], all, source: 'session' }
        }
      }
    } catch {
      // Ignore auth check errors in public contexts
    }

    // 2. Check Cookie
    try {
      const cookies = getCookies()
      const cookieSlug = cookies?.brgy_tenant_slug
      if (cookieSlug) {
        const match = all.find(
          (b) =>
            b.slug.toLowerCase() === cookieSlug.toLowerCase() ||
            b.id.toLowerCase() === cookieSlug.toLowerCase()
        )
        if (match) {
          return { tenant: match, all, source: 'cookie' }
        }
      }
    } catch {
      // Fall through to default
    }

    // 3. Fallback
    return { tenant: all[0] || DEFAULT_BARANGAYS[0], all, source: 'default' }
  }
)

/**
 * Set active tenant cookie
 */
export const setActiveTenantCookie = createServerFn({ method: 'POST' })
  .validator((slug: string) => z.string().min(1).parse(slug))
  .handler(async ({ data: slug }) => {
    try {
      setCookie('brgy_tenant_slug', slug, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
      })
      return { success: true, slug }
    } catch (err: any) {
      return { success: false, error: err?.message }
    }
  })
