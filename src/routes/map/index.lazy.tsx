import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  MapPin,
  ShieldAlert,
  Building2,
  Store,
  Phone,
  Navigation,
  Search,
  Users,
  Flame,
  Stethoscope,
  Radio,
  Layers,
  Compass,
  Maximize2,
  RefreshCw,
  Droplets,
  GraduationCap,
  Recycle,
  Trophy,
  WifiOff,
  Clock,
  MessageSquare,
  ExternalLink,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Siren,
  X,
  Locate,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Ambulance,
  HeartPulse,
  Share2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { Input } from '#/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { useBarangayScope, type BarangayScope } from '#/hooks/useBarangayScope'
import { useNetworkStatus } from '#/hooks/useNetworkStatus'
import { cn } from '#/lib/utils'
import { toast } from 'sonner'

import { Route as MapRoute, type MapBusiness } from './index'

function escapeHtml(unsafe: any): string {
  if (unsafe === undefined || unsafe === null) return ''
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatMessengerUrl(link?: string | null): string | null {
  if (!link || !link.trim()) return null
  const trimmed = link.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }
  const clean = trimmed.replace(/^@/, '').replace(/^m\.me\//, '').replace(/^facebook\.com\//, '')
  return `https://m.me/${clean}`
}

export type SpotScope = 'daine_1' | 'daine_2' | 'both'

export type SpotCategory =
  | 'evacuation'
  | 'government'
  | 'health'
  | 'emergency'
  | 'water'
  | 'education'
  | 'mrf'
  | 'sports'
  | 'business'

export interface MapSpot {
  id: string
  name: string
  category: SpotCategory
  categoryTag: string
  scope: SpotScope
  purok?: string
  lat: number
  lng: number
  phone?: string
  messenger_link?: string
  address: string
  capacity?: number
  amenities?: string[]
  status?: string
  description?: string
  hours?: string
  isBusiness?: boolean
  photo_url?: string
}

export interface OpenStatusResult {
  isOpen: boolean
  label: string
  badgeClass: string
  color: string
}

export const DAINE_1_CENTER = { lat: 14.1955, lng: 120.8798, zoom: 16 }
export const DAINE_2_CENTER = { lat: 14.197, lng: 120.886, zoom: 16 }
export const ALL_DAINE_CENTER = { lat: 14.1962, lng: 120.8829, zoom: 15 }

export const PUROK_ANCHORS = {
  daine_1: {
    purok_1: { lat: 14.1962, lng: 120.8785, label: 'Daine 1 - Purok 1' },
    purok_2: { lat: 14.1955, lng: 120.8798, label: 'Daine 1 - Purok 2 (Hall / Covered Court)' },
    purok_3: { lat: 14.1942, lng: 120.881, label: 'Daine 1 - Purok 3 (Elementary School)' },
    purok_4: { lat: 14.1925, lng: 120.8802, label: 'Daine 1 - Purok 4 (Tanod Outpost)' },
  },
  daine_2: {
    purok_1: { lat: 14.1982, lng: 120.8845, label: 'Daine 2 - Purok 1 / Sitio Ilaya' },
    purok_2: { lat: 14.197, lng: 120.886, label: 'Daine 2 - Purok 2 / Daine 2 Hall' },
    purok_3: { lat: 14.1958, lng: 120.8875, label: 'Daine 2 - Purok 3 / Sitio Ibaba' },
    purok_4: { lat: 14.1945, lng: 120.889, label: 'Daine 2 - Purok 4 / Boundary' },
  },
}

// Compute real-time open/closed status from hours string
export function computeOpenStatus(hours?: string): OpenStatusResult {
  if (!hours || typeof hours !== 'string' || !hours.trim()) {
    return {
      isOpen: true,
      label: '🟢 Open Today',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
      color: 'text-emerald-600',
    }
  }

  const raw = hours.trim().toLowerCase()

  // 24/7 check
  if (
    raw.includes('24/7') ||
    raw.includes('24 hours') ||
    raw.includes('24-hour') ||
    raw.includes('always open') ||
    raw.includes('ready & operational') ||
    raw.includes('emergency activation')
  ) {
    return {
      isOpen: true,
      label: '🟢 Open 24/7',
      badgeClass: 'bg-emerald-500/15 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300',
      color: 'text-emerald-600',
    }
  }

  const now = new Date()
  const currentDay = now.getDay() // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  // Check day applicability
  let isTodayApplicable = true
  if (
    raw.includes('mon-fri') ||
    raw.includes('monday to friday') ||
    raw.includes('lunes hanggang biyernes') ||
    raw.includes('lunes - biyernes')
  ) {
    if (currentDay === 0 || currentDay === 6) {
      isTodayApplicable = false
    }
  } else if (
    raw.includes('mon-sat') ||
    raw.includes('monday to saturday') ||
    raw.includes('lunes hanggang sabado') ||
    raw.includes('lunes - sabado')
  ) {
    if (currentDay === 0) {
      isTodayApplicable = false
    }
  }

  if (!isTodayApplicable) {
    return {
      isOpen: false,
      label: '⚪ Closed Today',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400',
      color: 'text-slate-500',
    }
  }

  // Parse time range e.g. "8:00 AM - 5:00 PM"
  const timeMatch = raw.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)

  if (timeMatch) {
    let startHour = parseInt(timeMatch[1], 10)
    const startMin = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0
    const startAmPm = (timeMatch[3] || '').toLowerCase()

    let endHour = parseInt(timeMatch[4], 10)
    const endMin = timeMatch[5] ? parseInt(timeMatch[5], 10) : 0
    const endAmPm = (timeMatch[6] || '').toLowerCase()

    if (startAmPm === 'pm' && startHour < 12) startHour += 12
    if (startAmPm === 'am' && startHour === 12) startHour = 0

    if (endAmPm === 'pm' && endHour < 12) endHour += 12
    if (endAmPm === 'am' && endHour === 12) endHour = 0

    const startTotal = startHour * 60 + startMin
    const endTotal = endHour * 60 + endMin

    if (currentMinutes >= startTotal && currentMinutes <= endTotal) {
      return {
        isOpen: true,
        label: '🟢 Open Now',
        badgeClass: 'bg-emerald-500/15 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300',
        color: 'text-emerald-600',
      }
    } else {
      return {
        isOpen: false,
        label: '🔴 Closed Now',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300',
        color: 'text-rose-600',
      }
    }
  }

  return {
    isOpen: true,
    label: '🟢 Open Today',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300',
    color: 'text-emerald-600',
  }
}

// Deterministic coordinate resolver (GPS coordinates -> Purok anchors with ID hash micro-offset)
export function resolveSpotCoordinates(
  business: {
    id?: string | number
    name?: string
    latitude?: number | string | null
    longitude?: number | string | null
    map_url?: string | null
    barangay?: string | null
    purok?: string | null
    address?: string | null
  },
  index: number
): { lat: number; lng: number } {
  // 1. If explicit latitude & longitude are valid numbers
  if (
    business.latitude !== undefined &&
    business.latitude !== null &&
    business.longitude !== undefined &&
    business.longitude !== null
  ) {
    const lat = typeof business.latitude === 'number' ? business.latitude : parseFloat(String(business.latitude))
    const lng = typeof business.longitude === 'number' ? business.longitude : parseFloat(String(business.longitude))
    if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
      return { lat, lng }
    }
  }

  // 2. If map_url contains coordinates
  if (business.map_url) {
    const match =
      business.map_url.match(/#map=\d+\/([0-9.-]+)\/([0-9.-]+)/) ||
      business.map_url.match(/destination=([0-9.-]+),([0-9.-]+)/) ||
      business.map_url.match(/@([0-9.-]+),([0-9.-]+)/) ||
      business.map_url.match(/q=([0-9.-]+),([0-9.-]+)/)
    if (match && match[1] && match[2]) {
      const lat = parseFloat(match[1])
      const lng = parseFloat(match[2])
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        return { lat, lng }
      }
    }
  }

  // 3. Resolve Barangay ('daine_1' or 'daine_2')
  const brgyRaw = (business.barangay || '').toLowerCase()
  const addrRaw = (business.address || '').toLowerCase()
  const isDaine2 =
    brgyRaw === 'daine_2' ||
    brgyRaw === 'daine2' ||
    brgyRaw.includes('daine 2') ||
    addrRaw.includes('daine 2') ||
    addrRaw.includes('daine ii') ||
    addrRaw.includes('ilaya') ||
    addrRaw.includes('ibaba')

  const brgyKey = isDaine2 ? 'daine_2' : 'daine_1'

  // 4. Resolve Purok Anchor
  const purokRaw = (business.purok || '').toLowerCase()
  let purokKey: 'purok_1' | 'purok_2' | 'purok_3' | 'purok_4' = 'purok_2'

  if (purokRaw.includes('1') || addrRaw.includes('purok 1') || addrRaw.includes('sitio 1') || addrRaw.includes('ilaya')) {
    purokKey = 'purok_1'
  } else if (purokRaw.includes('2') || addrRaw.includes('purok 2') || addrRaw.includes('sitio 2') || addrRaw.includes('hall')) {
    purokKey = 'purok_2'
  } else if (purokRaw.includes('3') || addrRaw.includes('purok 3') || addrRaw.includes('sitio 3') || addrRaw.includes('ibaba') || addrRaw.includes('school')) {
    purokKey = 'purok_3'
  } else if (purokRaw.includes('4') || addrRaw.includes('purok 4') || addrRaw.includes('sitio 4') || addrRaw.includes('boundary') || addrRaw.includes('outpost')) {
    purokKey = 'purok_4'
  }

  const anchor = PUROK_ANCHORS[brgyKey][purokKey]

  // 5. Deterministic micro-offset based on business ID hash (NO random jitter)
  const idStr = String(business.id || business.name || `biz-${index}`)
  let hash = 5381
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash << 5) + hash + idStr.charCodeAt(i)
    hash = hash & hash
  }
  const absHash = Math.abs(hash)
  const angle = ((absHash % 360) * Math.PI) / 180
  const dist = 0.0002 + ((absHash >> 4) % 35) * 0.00001

  return {
    lat: anchor.lat + Math.sin(angle) * dist,
    lng: anchor.lng + Math.cos(angle) * dist,
  }
}

// Haversine formula to compute distance in km
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Authentic Civic Infrastructure & Emergency Facilities Layer
export const STATIC_SPOTS: MapSpot[] = [
  // ==================== BARANGAY DAINE 1 ====================
  {
    id: 'd1-evac-1',
    name: 'Barangay Daine 1 Covered Court & Multipurpose Hall',
    category: 'evacuation',
    categoryTag: '🚨 Evacuation Center',
    scope: 'daine_1',
    purok: 'Purok 2',
    lat: 14.1955,
    lng: 120.8798,
    address: 'Purok 2 (Barangay Complex), Brgy. Daine 1, Indang, Cavite',
    phone: '0917-123-0001',
    messenger_link: 'https://m.me/BrgyDaine1Cavite',
    capacity: 500,
    amenities: ['Standby 25kVA Generator', 'Medical Triage Bay', 'Restrooms & Showers', 'Potable Water Tank'],
    status: 'Primary Evacuation Center — Ready & Operational',
    description: 'Central typhoon and calamity emergency shelter with emergency standby power, high-volume potable water bladder, and medical triage station.',
    hours: 'Open 24/7',
  },
  {
    id: 'd1-evac-2',
    name: 'Barangay Daine 1 Elementary School Evacuation Grounds',
    category: 'evacuation',
    categoryTag: '🚨 Evacuation Center',
    scope: 'daine_1',
    purok: 'Purok 3',
    lat: 14.1942,
    lng: 120.881,
    address: 'School Road, Purok 3, Brgy. Daine 1, Indang, Cavite',
    phone: '0917-123-0001',
    capacity: 850,
    amenities: ['12 High-Capacity Classrooms', 'Deep Well Water Pump', 'Relief Staging Yard', 'Community Feeding Kitchen'],
    status: 'Designated High-Capacity Typhoon Shelter',
    description: 'High-capacity institutional shelter designated for severe flood, typhoon, and disaster relief operations.',
    hours: '24/7 Emergency Activation',
  },
  {
    id: 'd1-gov-1',
    name: 'Barangay Daine 1 Hall & Executive Operations Center',
    category: 'government',
    categoryTag: '🏛️ Barangay Hall & Ops',
    scope: 'daine_1',
    purok: 'Purok 2',
    lat: 14.1955,
    lng: 120.8798,
    address: 'Barangay Center, Purok 2, Brgy. Daine 1, Indang, Cavite',
    phone: '0917-123-0001',
    messenger_link: 'https://m.me/BrgyDaine1Cavite',
    amenities: ['Captain & Kagawad Desks', 'Lupon Mediation Office', 'CCTV Command Operations', 'Resident Clearance Window'],
    status: 'Open for Public Services & Emergency Command',
    description: 'Headquarters for local barangay government administrative services, Lupon Tagapamayapa, and disaster coordination.',
    hours: 'Mon-Fri 8:00 AM - 5:00 PM',
  },
  {
    id: 'd1-health-1',
    name: 'Barangay Daine 1 Health Center & Birthing Station',
    category: 'health',
    categoryTag: '🏥 Health & Birthing Clinic',
    scope: 'daine_1',
    purok: 'Purok 2',
    lat: 14.1952,
    lng: 120.8805,
    address: 'Health Complex, Purok 2, Brgy. Daine 1, Indang, Cavite',
    phone: '0928-555-0103',
    amenities: ['First Aid & Triage', 'Vaccine Cold Storage', 'Maternal & Prenatal Checkup', 'Free Maintenance Medicine'],
    status: 'Public Health Station',
    description: 'Community health station providing immunization, prenatal care, emergency first aid, and basic diagnostic services.',
    hours: 'Mon-Fri 8:00 AM - 5:00 PM',
  },
  {
    id: 'd1-emerg-1',
    name: 'Barangay Daine 1 Tanod Outpost & Security Desk',
    category: 'emergency',
    categoryTag: '🛡️ Security & Tanod Outpost',
    scope: 'daine_1',
    purok: 'Purok 4',
    lat: 14.1925,
    lng: 120.8802,
    address: 'Purok 4 Junction, Brgy. Daine 1, Indang, Cavite',
    phone: '0928-555-0101',
    amenities: ['24/7 Patrol Motorcycle', 'Two-Way VHF Radio Hub', 'First Responder First Aid Kit', 'Emergency Searchlights'],
    status: '24/7 Peacekeeping & Incident Patrol',
    description: 'Barangay Peacekeeping Officer (Tanod) outpost providing round-the-clock community patrol and disaster response.',
    hours: 'Open 24/7',
  },
  {
    id: 'd1-water-1',
    name: 'Daine 1 Community Potable Water Refilling Hub (Disaster Reserve)',
    category: 'water',
    categoryTag: '🚰 Community Water Refilling',
    scope: 'daine_1',
    purok: 'Purok 1',
    lat: 14.1962,
    lng: 120.8785,
    address: 'Purok 1 Water Compound, Brgy. Daine 1, Indang, Cavite',
    phone: '0917-555-0131',
    messenger_link: 'https://m.me/BrgyDaine1Cavite',
    amenities: ['Potable Water Supply During Disasters', 'Reverse Osmosis Filtration', 'Gravity-Fed Bladder Tanks', 'Free Calamity Rations'],
    status: 'Active Potable Water & Relief Hub',
    description: 'Designated potable water supply station equipped with backup filtration and emergency water bladders for disaster relief.',
    hours: 'Daily 6:00 AM - 7:00 PM',
  },
  {
    id: 'd1-edu-1',
    name: 'Barangay Daine 1 Day Care & Early Learning Center',
    category: 'education',
    categoryTag: '🏫 Day Care & Early Learning',
    scope: 'daine_1',
    purok: 'Purok 2',
    lat: 14.1957,
    lng: 120.8792,
    address: 'Purok 2 Civic Grounds, Brgy. Daine 1, Indang, Cavite',
    phone: '0917-123-0001',
    amenities: ['ECCD Early Learning Classrooms', 'Supplementary Feeding Kitchen', 'Safe Children Play Area', 'First Aid Station'],
    status: 'Accredited Barangay Child Development Center',
    description: 'Barangay Early Childhood Care and Development center providing preschool education and child nutrition feeding programs.',
    hours: 'Mon-Fri 7:30 AM - 4:30 PM',
  },
  {
    id: 'd1-mrf-1',
    name: 'Daine 1 Material Recovery Facility (MRF) & Composting Hub',
    category: 'mrf',
    categoryTag: '♻️ Material Recovery Facility (MRF)',
    scope: 'daine_1',
    purok: 'Purok 4',
    lat: 14.192,
    lng: 120.8795,
    address: 'Eco-Park Area, Purok 4, Brgy. Daine 1, Indang, Cavite',
    amenities: ['Biodegradable Composting Pit', 'Plastic Shredder & Baler', 'Recyclables Segregation Bay', 'Eco-Brick Production Desk'],
    status: 'Ecological Solid Waste Operations',
    description: 'Barangay ecological solid waste management facility enforcing Purok-level zero-waste segregation and organic composting.',
    hours: 'Mon-Sat 7:00 AM - 4:00 PM',
  },
  {
    id: 'd1-sports-1',
    name: 'Daine 1 Purok 1 Covered Court & Youth Development Center',
    category: 'sports',
    categoryTag: '🏀 Covered Court & Youth Center',
    scope: 'daine_1',
    purok: 'Purok 1',
    lat: 14.1965,
    lng: 120.878,
    address: 'Purok 1 Sports Grounds, Brgy. Daine 1, Indang, Cavite',
    amenities: ['Full Covered Basketball Court', 'SK Youth Desk', 'Night Floodlights', 'Secondary Evacuation Ready'],
    status: 'Youth Center & Multi-Purpose Covered Court',
    description: 'Community sports venue and Sangguniang Kabataan youth center used for sports, assemblies, and secondary disaster shelter.',
    hours: 'Daily 6:00 AM - 10:00 PM',
  },

  // ==================== BARANGAY DAINE 2 ====================
  {
    id: 'd2-evac-1',
    name: 'Barangay Daine 2 Multi-Purpose Covered Court & Relief Center',
    category: 'evacuation',
    categoryTag: '🚨 Evacuation Center',
    scope: 'daine_2',
    purok: 'Purok 2',
    lat: 14.197,
    lng: 120.886,
    address: 'Purok 2 (Barangay Center), Brgy. Daine 2, Indang, Cavite',
    phone: '0917-123-0002',
    messenger_link: 'https://m.me/BrgyDaine2Cavite',
    capacity: 600,
    amenities: ['Standby Generator Unit', 'Comfort Rooms & Wash Stations', 'Mobile Kitchen Staging Area', 'Child-Friendly Space'],
    status: 'Primary Evacuation Center — Ready & Operational',
    description: 'Central disaster shelter and relief staging grounds for Barangay Daine 2 residents during typhoons and calamities.',
    hours: 'Open 24/7',
  },
  {
    id: 'd2-gov-1',
    name: 'Barangay Daine 2 Hall & Command Operations Center',
    category: 'government',
    categoryTag: '🏛️ Barangay Hall & Ops',
    scope: 'daine_2',
    purok: 'Purok 2',
    lat: 14.197,
    lng: 120.886,
    address: 'Main Road, Purok 2, Brgy. Daine 2, Indang, Cavite',
    phone: '0917-123-0002',
    messenger_link: 'https://m.me/BrgyDaine2Cavite',
    amenities: ['Captain & Kagawad Offices', 'Lupon Tagapamayapa Mediation Room', 'Incident Command Post', 'Public WiFi Hotspot'],
    status: 'Open for Public Services & Emergency Command',
    description: 'Executive administration building and disaster operations command center for Barangay Daine 2.',
    hours: 'Mon-Fri 8:00 AM - 5:00 PM',
  },
  {
    id: 'd2-health-1',
    name: 'Barangay Daine 2 Health Station & Nutrition Depot',
    category: 'health',
    categoryTag: '🏥 Health & Birthing Clinic',
    scope: 'daine_2',
    purok: 'Purok 2',
    lat: 14.1968,
    lng: 120.8863,
    address: 'Civic Center, Purok 2, Brgy. Daine 2, Indang, Cavite',
    phone: '0928-555-0104',
    amenities: ['Immunization Clinic', 'Maternal Care Unit', 'Blood Pressure & Glucose Screening', 'Emergency Oxygen Supply'],
    status: 'Public Health Station',
    description: 'Primary public health facility serving Daine 2 puroks with free infant vaccines, prenatal care, and health counseling.',
    hours: 'Mon-Fri 8:00 AM - 5:00 PM',
  },
  {
    id: 'd2-emerg-1',
    name: 'Daine 2 Tanod Outpost & Sitio Ilaya Peacekeeping Post',
    category: 'emergency',
    categoryTag: '🛡️ Security & Tanod Outpost',
    scope: 'daine_2',
    purok: 'Purok 1',
    lat: 14.1982,
    lng: 120.8845,
    address: 'Sitio Ilaya / Purok 1 Corridor, Brgy. Daine 2, Indang, Cavite',
    phone: '0928-555-0102',
    amenities: ['Tanod Patrol Base', 'Emergency Searchlights', 'First Aid Trauma Bag', 'Two-Way Radio Hub'],
    status: '24/7 Peacekeeping & Incident Patrol',
    description: 'North perimeter peacekeeping post and emergency response station for Sitio Ilaya and boundary roads.',
    hours: 'Open 24/7',
  },
  {
    id: 'd2-water-1',
    name: 'Daine 2 Community Mineral & Alkaline Refilling Center (Sitio Ibaba)',
    category: 'water',
    categoryTag: '🚰 Community Water Refilling',
    scope: 'daine_2',
    purok: 'Purok 3',
    lat: 14.1958,
    lng: 120.8875,
    address: 'Sitio Ibaba / Purok 3, Brgy. Daine 2, Indang, Cavite',
    phone: '0917-555-0132',
    messenger_link: 'https://m.me/BrgyDaine2Cavite',
    amenities: ['Potable Water Supply During Disasters', 'UV Sterilization Line', 'Emergency Power Hookup', 'Disaster Ration Tanks'],
    status: 'Active Potable Water & Relief Hub',
    description: 'Community potable water station dedicated to serving Sitio Ibaba and designated emergency water distribution point.',
    hours: 'Daily 6:30 AM - 7:30 PM',
  },
  {
    id: 'd2-edu-1',
    name: 'Barangay Daine 2 Child Development & Day Care Center',
    category: 'education',
    categoryTag: '🏫 Day Care & Early Learning',
    scope: 'daine_2',
    purok: 'Purok 2',
    lat: 14.1973,
    lng: 120.8858,
    address: 'Purok 2 Civic Area, Brgy. Daine 2, Indang, Cavite',
    phone: '0917-123-0002',
    amenities: ['Preschool Learning Modules', 'Supplementary Feeding Kitchen', 'Interactive Toy Corner', 'Sanitized Washrooms'],
    status: 'Accredited Barangay Child Development Center',
    description: 'Barangay child development center providing early childhood education, child care, and nutrition assistance.',
    hours: 'Mon-Fri 8:00 AM - 4:00 PM',
  },
  {
    id: 'd2-mrf-1',
    name: 'Daine 2 Material Recovery Facility (MRF) & Eco-Park',
    category: 'mrf',
    categoryTag: '♻️ Material Recovery Facility (MRF)',
    scope: 'daine_2',
    purok: 'Purok 4',
    lat: 14.1945,
    lng: 120.889,
    address: 'Purok 4 Boundary Road, Brgy. Daine 2, Indang, Cavite',
    amenities: ['Waste Segregation Bays', 'Compost Fertilizer Shed', 'Bottle & Can Compactor', 'Community Herbal Garden'],
    status: 'Ecological Solid Waste Operations',
    description: 'Ecological MRF and community organic garden transforming barangay biodegradable waste into free fertilizer for farmers.',
    hours: 'Mon-Sat 7:00 AM - 4:30 PM',
  },
  {
    id: 'd2-sports-1',
    name: 'Daine 2 Sitio Ibaba Multi-Purpose Court & Youth Center',
    category: 'sports',
    categoryTag: '🏀 Covered Court & Youth Center',
    scope: 'daine_2',
    purok: 'Purok 3',
    lat: 14.1955,
    lng: 120.888,
    address: 'Sitio Ibaba Sports Area, Brgy. Daine 2, Indang, Cavite',
    amenities: ['Multi-Purpose Court', 'Community Staging Stage', 'Night Lighting', 'Relief Distribution Point'],
    status: 'Youth Center & Multi-Purpose Covered Court',
    description: 'Sitio Ibaba community sports facility and secondary emergency relief distribution center.',
    hours: 'Daily 6:00 AM - 9:30 PM',
  },

  // ==================== MUNICIPAL / BOTH BARANGAYS ====================
  {
    id: 'emerg-bfp',
    name: 'BFP Indang Fire Station Outpost',
    category: 'emergency',
    categoryTag: '🚒 Fire & Rescue Station',
    scope: 'both',
    purok: 'Provincial Corridor',
    lat: 14.1965,
    lng: 120.8812,
    address: 'Provincial Road, Brgy. Daine Outpost, Indang, Cavite',
    phone: '(046) 415-0322',
    amenities: ['Fire Engine Tanker', 'Rescue Vehicle', 'Hydrant Network Access', 'Emergency EMT Equipment'],
    status: '24/7 Response Unit',
    description: 'Bureau of Fire Protection station for fast fire suppression, vehicular rescue, and heavy calamity response.',
    hours: 'Open 24/7',
  },
  {
    id: 'emerg-pnp',
    name: 'Indang Municipal Police Station (PNP) Mobile Patrol Desk',
    category: 'emergency',
    categoryTag: '🚓 Police Mobile Patrol Desk',
    scope: 'both',
    purok: 'Provincial Junction',
    lat: 14.1938,
    lng: 120.8835,
    address: 'Provincial Junction Desk, Indang, Cavite',
    phone: '(046) 415-0211',
    amenities: ['PNP Patrol Vehicle', 'VHF Repeater Base', '24/7 Dispatch Desk'],
    status: '24/7 Law Enforcement',
    description: 'Philippine National Police rapid response and mobile patrol unit serving both Daine 1 and Daine 2.',
    hours: 'Open 24/7',
  },
  {
    id: 'emerg-mdrrmo',
    name: 'MDRRMO Indang Emergency Rescue Sub-Station',
    category: 'emergency',
    categoryTag: '🚑 Disaster & Medical Rescue (MDRRMO)',
    scope: 'both',
    purok: 'Provincial Highway',
    lat: 14.195,
    lng: 120.8825,
    address: 'Provincial Highway Junction, Indang, Cavite',
    phone: '0998-555-0100',
    amenities: ['Emergency Medical Ambulance', 'High-Water Rescue Boats', 'Trauma Responders', 'Satellite Comms'],
    status: '24/7 Calamity Dispatch',
    description: 'Municipal Disaster Risk Reduction and Management Office emergency paramedic dispatch and severe typhoon rescue.',
    hours: 'Open 24/7',
  },
]

export const Route = createLazyFileRoute('/map/')({
  component: MapRouteComponent,
})

function MapRouteComponent() {
  const loadedBusinesses = MapRoute.useLoaderData() as MapBusiness[] | undefined
  const { scope, setScope } = useBarangayScope()
  const { isOffline } = useNetworkStatus()

  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map')
  const [isMobileDrawerExpanded, setIsMobileDrawerExpanded] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLocating, setIsLocating] = useState(false)

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<Record<string, any>>({})
  const userMarkerRef = useRef<any>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  // Merge static authentic civic spots + dynamic database businesses
  const allSpots: MapSpot[] = useMemo(() => {
    const businessSpots: MapSpot[] = (loadedBusinesses || []).map((b: MapBusiness, index: number) => {
      const coords = resolveSpotCoordinates(b, index)
      const isDaine2 =
        (b.barangay && (b.barangay === 'daine_2' || b.barangay.toLowerCase().includes('2'))) ||
        (b.address && (b.address.toLowerCase().includes('daine 2') || b.address.toLowerCase().includes('daine ii')))

      const spotScope: SpotScope = isDaine2 ? 'daine_2' : 'daine_1'
      const messengerLink = formatMessengerUrl(b.messenger_link)

      return {
        id: `biz-${b.id || index}`,
        name: b.name,
        category: 'business' as SpotCategory,
        categoryTag: `🏪 ${b.category || 'Local MSME'}`,
        scope: spotScope,
        purok: b.purok || undefined,
        lat: coords.lat,
        lng: coords.lng,
        phone: b.phone || undefined,
        messenger_link: messengerLink || undefined,
        address: b.address || (isDaine2 ? 'Barangay Daine 2, Indang, Cavite' : 'Barangay Daine 1, Indang, Cavite'),
        hours: b.hours || undefined,
        description: b.description || undefined,
        isBusiness: true,
        status: 'Verified MSME Business',
        photo_url: b.photo_url || undefined,
      }
    })

    return [...STATIC_SPOTS, ...businessSpots]
  }, [loadedBusinesses])

  // Filter spots by scope
  const scopeFilteredSpots = useMemo(() => {
    if (scope === 'all') return allSpots
    if (scope === 'daine1') {
      return allSpots.filter((s) => s.scope === 'daine_1' || s.scope === 'both')
    }
    if (scope === 'daine2') {
      return allSpots.filter((s) => s.scope === 'daine_2' || s.scope === 'both')
    }
    return allSpots
  }, [allSpots, scope])

  // Filter spots by category & search query
  const filteredSpots = useMemo(() => {
    return scopeFilteredSpots.filter((spot) => {
      let matchesCategory = true
      if (selectedCategory !== 'all') {
        matchesCategory = spot.category === selectedCategory
      }

      const q = searchQuery.trim().toLowerCase()
      const matchesSearch =
        q === '' ||
        spot.name.toLowerCase().includes(q) ||
        spot.address.toLowerCase().includes(q) ||
        spot.categoryTag.toLowerCase().includes(q) ||
        (spot.purok && spot.purok.toLowerCase().includes(q)) ||
        (spot.description && spot.description.toLowerCase().includes(q)) ||
        (spot.phone && spot.phone.toLowerCase().includes(q))

      return matchesCategory && matchesSearch
    })
  }, [scopeFilteredSpots, selectedCategory, searchQuery])

  // Active reference center for distance calculation (uses user GPS when available)
  const referenceCenter = useMemo(() => {
    if (userLocation) return userLocation
    if (scope === 'daine1') return DAINE_1_CENTER
    if (scope === 'daine2') return DAINE_2_CENTER
    return ALL_DAINE_CENTER
  }, [userLocation, scope])

  // Stats calculation based on current scope
  const totalEvacCapacity = useMemo(() => {
    return scopeFilteredSpots
      .filter((s) => s.category === 'evacuation')
      .reduce((acc, curr) => acc + (curr.capacity || 0), 0)
  }, [scopeFilteredSpots])

  const reliefStationsCount = useMemo(() => {
    return scopeFilteredSpots.filter((s) => s.category === 'evacuation').length
  }, [scopeFilteredSpots])

  const waterStationsCount = useMemo(() => {
    return scopeFilteredSpots.filter((s) => s.category === 'water').length
  }, [scopeFilteredSpots])

  const emergencyOutpostsCount = useMemo(() => {
    return scopeFilteredSpots.filter((s) => s.category === 'emergency').length
  }, [scopeFilteredSpots])

  const businessesCount = useMemo(() => {
    return scopeFilteredSpots.filter((s) => s.category === 'business').length
  }, [scopeFilteredSpots])

  // Nearest evacuation shelter calculation
  const nearestEvacShelter = useMemo(() => {
    const evacSpots = scopeFilteredSpots.filter((s) => s.category === 'evacuation')
    if (evacSpots.length === 0) return null

    let bestSpot = evacSpots[0]
    let minDistance = calculateDistanceKm(referenceCenter.lat, referenceCenter.lng, bestSpot.lat, bestSpot.lng)

    for (let i = 1; i < evacSpots.length; i++) {
      const dist = calculateDistanceKm(referenceCenter.lat, referenceCenter.lng, evacSpots[i].lat, evacSpots[i].lng)
      if (dist < minDistance) {
        minDistance = dist
        bestSpot = evacSpots[i]
      }
    }

    return {
      spot: bestSpot,
      distanceKm: minDistance,
    }
  }, [scopeFilteredSpots, referenceCenter])

  // Smoothly fly to scope center on scope change
  const handleScopeChange = useCallback(
    (newScope: BarangayScope) => {
      setScope(newScope)
      setSelectedSpotId(null)

      if (mapInstanceRef.current) {
        if (newScope === 'daine1') {
          mapInstanceRef.current.flyTo([DAINE_1_CENTER.lat, DAINE_1_CENTER.lng], DAINE_1_CENTER.zoom, { duration: 1.2 })
        } else if (newScope === 'daine2') {
          mapInstanceRef.current.flyTo([DAINE_2_CENTER.lat, DAINE_2_CENTER.lng], DAINE_2_CENTER.zoom, { duration: 1.2 })
        } else {
          mapInstanceRef.current.flyTo([ALL_DAINE_CENTER.lat, ALL_DAINE_CENTER.lng], ALL_DAINE_CENTER.zoom, { duration: 1.0 })
        }
      }
    },
    [setScope]
  )

  // Initialize Leaflet map on client-side
  useEffect(() => {
    if (typeof window === 'undefined') return
    let isMounted = true

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return
      setLeafletLoaded(true)

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      const initialCenter =
        scope === 'daine1' ? DAINE_1_CENTER : scope === 'daine2' ? DAINE_2_CENTER : ALL_DAINE_CENTER

      const map = L.map(mapContainerRef.current, {
        center: [initialCenter.lat, initialCenter.lng],
        zoom: initialCenter.zoom,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      mapInstanceRef.current = map
      markersRef.current = {}

      // Add user location marker if GPS is active
      if (userLocation) {
        const userIcon = L.divIcon({
          className: 'user-gps-pin',
          html: `
            <div class="relative flex items-center justify-center">
              <div class="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping"></div>
              <div class="w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-[9px] font-black">
                ●
              </div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })

        const uMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
          .addTo(map)
          .bindPopup(`
            <div class="p-1 font-sans text-xs">
              <strong class="text-blue-600 dark:text-blue-400">📍 Your Current GPS Location</strong>
              <p class="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">Calculated nearest emergency shelters from here.</p>
            </div>
          `)
        userMarkerRef.current = uMarker
      }

      // Add markers for filtered spots
      filteredSpots.forEach((spot) => {
        const getMarkerConfig = (cat: SpotCategory) => {
          switch (cat) {
            case 'evacuation':
              return {
                bg: 'bg-red-600 border-red-950 text-white shadow-red-500/50 ring-2 ring-red-400/40',
                emoji: '🚨',
              }
            case 'government':
              return {
                bg: 'bg-blue-600 border-blue-950 text-white shadow-blue-500/50 ring-2 ring-blue-400/40',
                emoji: '🏛️',
              }
            case 'health':
              return {
                bg: 'bg-teal-600 border-teal-950 text-white shadow-teal-500/50 ring-2 ring-teal-400/40',
                emoji: '🏥',
              }
            case 'emergency':
              return {
                bg: 'bg-indigo-600 border-indigo-950 text-white shadow-indigo-500/50 ring-2 ring-indigo-400/40',
                emoji: '🛡️',
              }
            case 'water':
              return {
                bg: 'bg-cyan-600 border-cyan-950 text-white shadow-cyan-500/50 ring-2 ring-cyan-400/40',
                emoji: '🚰',
              }
            case 'education':
              return {
                bg: 'bg-emerald-600 border-emerald-950 text-white shadow-emerald-500/50 ring-2 ring-emerald-400/40',
                emoji: '🏫',
              }
            case 'mrf':
              return {
                bg: 'bg-lime-600 border-lime-950 text-white shadow-lime-500/50 ring-2 ring-lime-400/40',
                emoji: '♻️',
              }
            case 'sports':
              return {
                bg: 'bg-purple-600 border-purple-950 text-white shadow-purple-500/50 ring-2 ring-purple-400/40',
                emoji: '🏀',
              }
            case 'business':
            default:
              return {
                bg: 'bg-amber-500 border-amber-950 text-amber-950 shadow-amber-500/50 ring-2 ring-amber-400/40',
                emoji: '🏪',
              }
          }
        }

        const markerConfig = getMarkerConfig(spot.category)
        const isSelected = selectedSpotId === spot.id

        const customIcon = L.divIcon({
          className: 'custom-leaflet-pin',
          html: `
            <div class="relative group cursor-pointer flex flex-col items-center ${
              isSelected ? 'scale-125 z-50 animate-bounce' : 'transition-transform hover:scale-115'
            }">
              <div class="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shadow-lg border-2 ${
                markerConfig.bg
              }">
                ${markerConfig.emoji}
              </div>
              <div class="w-2.5 h-2.5 ${markerConfig.bg.split(' ')[0]} rotate-45 -mt-1.5 shadow-sm"></div>
            </div>
          `,
          iconSize: [40, 46],
          iconAnchor: [20, 46],
          popupAnchor: [0, -40],
        })

        const openStatus = computeOpenStatus(spot.hours)
        const messengerUrl = formatMessengerUrl(spot.messenger_link)
        const directionUrl = `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`

        const scopeLabel =
          spot.scope === 'daine_1'
            ? 'Barangay Daine 1'
            : spot.scope === 'daine_2'
            ? 'Barangay Daine 2'
            : 'Municipal / Indang'

        const phoneBtn = spot.phone
          ? `<a href="tel:${escapeHtml(
              spot.phone
            )}" class="inline-flex items-center justify-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 font-semibold no-underline" title="Call Hotline">
              📞 Call
            </a>`
          : ''

        const messengerBtn = messengerUrl
          ? `<a href="${escapeHtml(
              messengerUrl
            )}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-sky-50 text-sky-800 hover:bg-sky-100 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300 font-semibold no-underline" title="Chat on Messenger">
              💬 Messenger
            </a>`
          : ''

        const capacityBadge = spot.capacity
          ? `<div class="text-[11px] font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 px-2 py-1 rounded border border-red-200 mt-1.5 flex items-center gap-1">
              👥 Evacuation Capacity: <strong>${spot.capacity.toLocaleString()} persons</strong>
            </div>`
          : ''

        const hoursInfo = spot.hours
          ? `<div class="text-[11px] text-slate-700 dark:text-slate-300 mt-1 flex items-center gap-1 font-medium">
              🕒 ${escapeHtml(spot.hours)}
            </div>`
          : ''

        const amenitiesHtml =
          spot.amenities && spot.amenities.length > 0
            ? `<div class="flex flex-wrap gap-1 mt-1.5">
                ${spot.amenities
                  .slice(0, 3)
                  .map(
                    (a) =>
                      `<span class="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-medium">✓ ${escapeHtml(
                        a
                      )}</span>`
                  )
                  .join('')}
                ${
                  spot.amenities.length > 3
                    ? `<span class="text-[9px] text-slate-500 font-medium">+${spot.amenities.length - 3} more</span>`
                    : ''
                }
              </div>`
            : ''

        const popupContent = `
          <div class="p-1 max-w-[280px] font-sans text-slate-900 dark:text-slate-100">
            <div class="flex items-center justify-between gap-1 mb-1">
              <span class="text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                ${escapeHtml(spot.categoryTag)}
              </span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded border ${openStatus.badgeClass}">
                ${escapeHtml(openStatus.label)}
              </span>
            </div>

            <h3 class="font-bold text-sm text-slate-900 dark:text-slate-100 leading-snug mt-1 mb-0.5">
              ${escapeHtml(spot.name)}
            </h3>

            <div class="text-[11px] text-blue-700 dark:text-blue-300 font-semibold flex items-center gap-1">
              📍 ${escapeHtml(scopeLabel)}${spot.purok ? ` • ${escapeHtml(spot.purok)}` : ''}
            </div>

            <p class="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
              ${escapeHtml(spot.address)}
            </p>

            ${hoursInfo}
            ${capacityBadge}
            ${amenitiesHtml}

            <div class="grid grid-cols-3 gap-1.5 mt-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <a href="${directionUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center gap-1 text-xs px-2 py-1.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 no-underline col-span-${
                phoneBtn && messengerBtn ? '1' : !phoneBtn && !messengerBtn ? '3' : '2'
              }">
                🗺️ Directions
              </a>
              ${phoneBtn}
              ${messengerBtn}
            </div>
          </div>
        `

        const marker = L.marker([spot.lat, spot.lng], { icon: customIcon }).addTo(map).bindPopup(popupContent)

        marker.on('click', () => {
          setSelectedSpotId(spot.id)
        })

        markersRef.current[spot.id] = marker
      })
    })

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [filteredSpots, scope, selectedSpotId, userLocation])

  // Center map on spot selection
  const handleSpotClick = (spot: MapSpot) => {
    setSelectedSpotId(spot.id)
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([spot.lat, spot.lng], 17, { duration: 1.2 })
      const marker = markersRef.current[spot.id]
      if (marker) {
        marker.openPopup()
      }
    }
    setActiveTab('map')
  }

  const selectedSpot = useMemo(() => {
    if (!selectedSpotId) return null
    return allSpots.find((s) => s.id === selectedSpotId) || null
  }, [allSpots, selectedSpotId])

  // Find Nearest Evacuation Shelter action
  const handleFindNearestEvacuation = useCallback(() => {
    const evacSpots = scopeFilteredSpots.filter((s) => s.category === 'evacuation')
    if (evacSpots.length === 0) {
      toast.error('No evacuation shelters found in the current scope.')
      return
    }

    let nearestSpot = evacSpots[0]
    let minDistance = calculateDistanceKm(referenceCenter.lat, referenceCenter.lng, nearestSpot.lat, nearestSpot.lng)

    for (let i = 1; i < evacSpots.length; i++) {
      const dist = calculateDistanceKm(referenceCenter.lat, referenceCenter.lng, evacSpots[i].lat, evacSpots[i].lng)
      if (dist < minDistance) {
        minDistance = dist
        nearestSpot = evacSpots[i]
      }
    }

    setSelectedCategory('evacuation')
    setSelectedSpotId(nearestSpot.id)
    setActiveTab('map')

    const distLabel = minDistance < 1 ? `${Math.round(minDistance * 1000)}m` : `${minDistance.toFixed(1)}km`
    toast.success(`Nearest Evacuation Shelter: ${nearestSpot.name} (${distLabel} away)`, {
      duration: 4000,
    })

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([nearestSpot.lat, nearestSpot.lng], 17, { duration: 1.5 })
      const marker = markersRef.current[nearestSpot.id]
      if (marker) {
        setTimeout(() => {
          marker.openPopup()
        }, 1500)
      }
    }
  }, [scopeFilteredSpots, referenceCenter])

  // User Geolocation (Locate Me)
  const handleLocateMe = useCallback(() => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported by your browser.')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false)
        const userCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setUserLocation(userCoords)
        toast.success('Location found! Updating distance measurements...')

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([userCoords.lat, userCoords.lng], 16, { duration: 1.5 })
        }
      },
      (error) => {
        setIsLocating(false)
        console.warn('Geolocation error:', error)
        toast.error('Could not retrieve your location. Showing barangay reference centers.')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    )
  }, [])

  const handleResetView = () => {
    setSelectedCategory('all')
    setSearchQuery('')
    setSelectedSpotId(null)
    if (mapInstanceRef.current) {
      const center = scope === 'daine1' ? DAINE_1_CENTER : scope === 'daine2' ? DAINE_2_CENTER : ALL_DAINE_CENTER
      mapInstanceRef.current.flyTo([center.lat, center.lng], center.zoom, { duration: 1 })
    }
  }

  // Categories list with count and tactile touch targets
  const CATEGORIES = [
    { key: 'all', label: 'All Spots', icon: '📍', count: scopeFilteredSpots.length, color: 'hover:bg-primary/10' },
    {
      key: 'evacuation',
      label: 'Evacuation Shelters',
      icon: '🚨',
      count: scopeFilteredSpots.filter((s) => s.category === 'evacuation').length,
      color: 'hover:bg-red-50 text-red-700 border-red-200 dark:hover:bg-red-950/40 dark:text-red-300',
      activeColor: 'bg-red-600 hover:bg-red-700 text-white',
    },
    {
      key: 'water',
      label: 'Potable Water Stations',
      icon: '🚰',
      count: scopeFilteredSpots.filter((s) => s.category === 'water').length,
      color: 'hover:bg-cyan-50 text-cyan-700 border-cyan-200 dark:hover:bg-cyan-950/40 dark:text-cyan-300',
      activeColor: 'bg-cyan-600 hover:bg-cyan-700 text-white',
    },
    {
      key: 'government',
      label: 'Barangay Halls & Ops',
      icon: '🏛️',
      count: scopeFilteredSpots.filter((s) => s.category === 'government').length,
      color: 'hover:bg-blue-50 text-blue-700 border-blue-200 dark:hover:bg-blue-950/40 dark:text-blue-300',
      activeColor: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    {
      key: 'health',
      label: 'Health & Birthing',
      icon: '🏥',
      count: scopeFilteredSpots.filter((s) => s.category === 'health').length,
      color: 'hover:bg-teal-50 text-teal-700 border-teal-200 dark:hover:bg-teal-950/40 dark:text-teal-300',
      activeColor: 'bg-teal-600 hover:bg-teal-700 text-white',
    },
    {
      key: 'education',
      label: 'Day Care Centers',
      icon: '🏫',
      count: scopeFilteredSpots.filter((s) => s.category === 'education').length,
      color: 'hover:bg-emerald-50 text-emerald-700 border-emerald-200 dark:hover:bg-emerald-950/40 dark:text-emerald-300',
      activeColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    {
      key: 'emergency',
      label: 'Security & Fire',
      icon: '🛡️',
      count: scopeFilteredSpots.filter((s) => s.category === 'emergency').length,
      color: 'hover:bg-indigo-50 text-indigo-700 border-indigo-200 dark:hover:bg-indigo-950/40 dark:text-indigo-300',
      activeColor: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    },
    {
      key: 'mrf',
      label: 'MRF / Eco-Park',
      icon: '♻️',
      count: scopeFilteredSpots.filter((s) => s.category === 'mrf').length,
      color: 'hover:bg-lime-50 text-lime-800 border-lime-200 dark:hover:bg-lime-950/40 dark:text-lime-300',
      activeColor: 'bg-lime-600 hover:bg-lime-700 text-white',
    },
    {
      key: 'sports',
      label: 'Covered Courts',
      icon: '🏀',
      count: scopeFilteredSpots.filter((s) => s.category === 'sports').length,
      color: 'hover:bg-purple-50 text-purple-700 border-purple-200 dark:hover:bg-purple-950/40 dark:text-purple-300',
      activeColor: 'bg-purple-600 hover:bg-purple-700 text-white',
    },
    {
      key: 'business',
      label: 'Local MSMEs',
      icon: '🏪',
      count: scopeFilteredSpots.filter((s) => s.category === 'business').length,
      color: 'hover:bg-amber-50 text-amber-800 border-amber-200 dark:hover:bg-amber-950/40 dark:text-amber-300',
      activeColor: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
  ]

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 max-w-7xl">
      {/* Offline Alert Banner */}
      {isOffline && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-950 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 shrink-0 mt-0.5 shadow-sm">
              <WifiOff className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                ⚡ Offline Mode Active — Cached Emergency Shelters & Purok Hotlines Ready
              </h4>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-0.5 leading-relaxed">
                Map tiles cannot download without active internet. All evacuation capacities, Purok anchor coordinates, and emergency hotlines below remain 100% accessible offline.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <Button
              size="sm"
              onClick={() => setActiveTab('list')}
              className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto min-h-[44px]"
            >
              <Layers className="h-4 w-4 mr-1.5" /> View Offline Spot Directory
            </Button>
          </div>
        </div>
      )}

      {/* Header Banner with Philippine Color Accents & Dual-Barangay Scope Switcher */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0038A8] via-[#002675] to-[#1E3A8A] text-white p-6 sm:p-8 mb-6 shadow-xl">
        {/* Subtle Philippine Flag Accent bar */}
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-[#0038A8] via-[#FCD116] to-[#CE1126]" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-[#FCD116] text-[#0038A8] hover:bg-[#FCD116]/90 font-black px-3 py-1 text-xs border border-amber-300 shadow-xs">
                  <Compass className="h-3.5 w-3.5 mr-1" /> Interactive GIS Map & Civic Horizon
                </Badge>
                <Badge variant="outline" className="text-white border-white/30 text-xs backdrop-blur-xs">
                  Indang, Cavite
                </Badge>
                {userLocation && (
                  <Badge className="bg-emerald-500 text-white font-bold text-xs border border-emerald-400">
                    📍 GPS Live Active
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-2">
                Emergency Evacuation & GIS Directory
              </h1>
              <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
                Locate emergency evacuation shelters, potable water refill hubs, health clinics, ECCD daycare centers, MRF eco-facilities, and verified local MSMEs across Barangay Daine 1 and Daine 2.
              </p>
            </div>

            {/* High-Contrast Dual-Barangay Scope Switcher with Min 44px Touch Targets */}
            <div className="bg-slate-950/85 p-2.5 rounded-2xl border border-white/20 backdrop-blur-md shadow-2xl flex flex-col gap-2 shrink-0">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300 px-2 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Select Barangay Scope:
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleScopeChange('all')}
                  className={cn(
                    'min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-black transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer',
                    scope === 'all'
                      ? 'bg-[#FCD116] text-[#0038A8] shadow-lg ring-2 ring-white/60 scale-102'
                      : 'bg-white/10 text-white hover:bg-white/20 hover:text-white'
                  )}
                >
                  <span className="leading-tight">All Daine</span>
                  <span className="text-[10px] opacity-80 font-semibold">(1 & 2)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleScopeChange('daine1')}
                  className={cn(
                    'min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-black transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer',
                    scope === 'daine1'
                      ? 'bg-blue-500 text-white shadow-lg ring-2 ring-white/60 scale-102'
                      : 'bg-white/10 text-white hover:bg-white/20 hover:text-white'
                  )}
                >
                  <span className="leading-tight">Barangay</span>
                  <span className="text-[10px] opacity-90 font-semibold">Daine 1</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleScopeChange('daine2')}
                  className={cn(
                    'min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-black transition-all text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer',
                    scope === 'daine2'
                      ? 'bg-amber-500 text-slate-950 shadow-lg ring-2 ring-white/60 scale-102'
                      : 'bg-white/10 text-white hover:bg-white/20 hover:text-white'
                  )}
                >
                  <span className="leading-tight">Barangay</span>
                  <span className="text-[10px] opacity-90 font-semibold">Daine 2</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-white/15">
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 text-center">
              <div className="text-xs text-white/80 font-semibold flex items-center justify-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-amber-300" /> Evac Capacity
              </div>
              <div className="text-2xl font-black text-amber-300 mt-1">{totalEvacCapacity.toLocaleString()}</div>
              <div className="text-[11px] text-white/70 font-medium">Residents Shelter</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 text-center">
              <div className="text-xs text-white/80 font-semibold flex items-center justify-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-red-400" /> Relief Hubs
              </div>
              <div className="text-2xl font-black text-red-400 mt-1">{reliefStationsCount}</div>
              <div className="text-[11px] text-white/70 font-medium">Evac Centers</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 text-center">
              <div className="text-xs text-white/80 font-semibold flex items-center justify-center gap-1.5">
                <Droplets className="h-3.5 w-3.5 text-cyan-300" /> Water Hubs
              </div>
              <div className="text-2xl font-black text-cyan-300 mt-1">{waterStationsCount}</div>
              <div className="text-[11px] text-white/70 font-medium">Potable Supply</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 text-center">
              <div className="text-xs text-white/80 font-semibold flex items-center justify-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-emerald-400" /> 24/7 Response
              </div>
              <div className="text-2xl font-black text-emerald-400 mt-1">{emergencyOutpostsCount}</div>
              <div className="text-[11px] text-white/70 font-medium">Security & Fire</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/15 text-center col-span-2 sm:col-span-1">
              <div className="text-xs text-white/80 font-semibold flex items-center justify-center gap-1.5">
                <Store className="h-3.5 w-3.5 text-blue-300" /> MSMEs
              </div>
              <div className="text-2xl font-black text-blue-300 mt-1">{businessesCount}</div>
              <div className="text-[11px] text-white/70 font-medium">Verified Pinned</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Badges & Search Top Bar */}
      <div className="flex flex-col gap-4 mb-6 bg-card p-4 sm:p-5 rounded-2xl border shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search evacuation shelters, purok anchors, potable water, hotlines, MSMEs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-xs sm:text-sm h-11 rounded-xl"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLocateMe}
              disabled={isLocating}
              className="h-11 min-h-[44px] text-xs font-bold gap-1.5 rounded-xl shrink-0 px-3.5 cursor-pointer"
            >
              <Locate className={cn('h-4 w-4 text-blue-600', isLocating && 'animate-spin')} />
              <span>{isLocating ? 'Locating...' : 'Locate Me (GPS)'}</span>
            </Button>

            {(selectedCategory !== 'all' || searchQuery !== '' || selectedSpotId !== null) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetView}
                className="h-11 min-h-[44px] text-xs font-bold gap-1.5 rounded-xl shrink-0 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Reset Filters
              </Button>
            )}
          </div>
        </div>

        {/* Category Badges Filter with Min 44px Touch Targets and Tactile Feedback */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-thin">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.key
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={cn(
                  'min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 border cursor-pointer select-none active:scale-95',
                  isActive
                    ? cat.activeColor || 'bg-primary text-primary-foreground border-primary shadow-md ring-2 ring-primary/30'
                    : `bg-card ${cat.color || 'border-border text-foreground'}`
                )}
              >
                <span className="text-sm">{cat.icon}</span>
                <span>{cat.label}</span>
                <span
                  className={cn(
                    'text-[11px] px-1.5 py-0.5 rounded-md font-bold',
                    isActive ? 'bg-white/20 text-current' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {cat.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Layout: Split Screen on Desktop, Tabs on Mobile */}
      <div className="block lg:hidden mb-4">
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'map' | 'list')}>
          <TabsList className="grid grid-cols-2 w-full h-12 p-1 bg-muted rounded-xl">
            <TabsTrigger value="map" className="text-xs font-bold rounded-lg min-h-[40px]">
              🗺️ GIS Map View
            </TabsTrigger>
            <TabsTrigger value="list" className="text-xs font-bold rounded-lg min-h-[40px]">
              📋 Spot List ({filteredSpots.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map Container Column */}
        <div className={`lg:col-span-8 ${activeTab === 'list' ? 'hidden lg:block' : 'block'}`}>
          <Card className="overflow-hidden border shadow-md relative rounded-3xl">
            <CardHeader className="p-4 sm:p-5 bg-muted/30 border-b flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />{' '}
                  {scope === 'daine1'
                    ? 'Barangay Daine 1 GIS Map'
                    : scope === 'daine2'
                    ? 'Barangay Daine 2 GIS Map'
                    : 'Barangay Daine (1 & 2) Interactive GIS Map'}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-0.5">
                  Click any marker or card to pan coordinates, inspect Open/Closed hours, evacuation capacity, or launch turn-by-turn directions.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetView}
                  className="text-xs h-9 min-h-[36px] gap-1.5 hidden sm:flex rounded-xl font-bold cursor-pointer"
                >
                  <Maximize2 className="h-3.5 w-3.5" /> Recenter Map
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0 relative">
              <div
                ref={mapContainerRef}
                className="w-full h-[62dvh] min-h-[480px] max-h-[720px] sm:h-[600px] lg:h-[650px] z-10 bg-slate-100 dark:bg-slate-900 rounded-b-3xl overflow-hidden"
              />

              {!leafletLoaded && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-20">
                  <div className="flex flex-col items-center gap-2.5 text-muted-foreground">
                    <RefreshCw className="h-7 w-7 animate-spin text-primary" />
                    <span className="text-xs sm:text-sm font-bold">Loading Barangay Daine GIS Tiles...</span>
                  </div>
                </div>
              )}

              {/* Floating "🚨 Nearest Evacuation Shelter" FAB Button with Min 44px Target */}
              <button
                type="button"
                onClick={handleFindNearestEvacuation}
                className={cn(
                  'absolute bottom-4 right-4 z-20 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-xs sm:text-sm px-4 py-3 min-h-[48px] rounded-2xl shadow-2xl flex items-center gap-2.5 transition-all hover:scale-105 cursor-pointer ring-4 ring-red-500/30',
                  selectedSpot ? 'hidden md:flex' : 'flex'
                )}
                title="Calculate nearest evacuation shelter"
              >
                <Siren className="h-5 w-5 animate-pulse text-amber-300" />
                <div className="flex flex-col items-start text-left">
                  <span className="leading-tight">Nearest Evacuation Shelter</span>
                  {nearestEvacShelter && (
                    <span className="text-[10px] opacity-90 font-medium">
                      {nearestEvacShelter.distanceKm < 1
                        ? `${Math.round(nearestEvacShelter.distanceKm * 1000)}m away`
                        : `${nearestEvacShelter.distanceKm.toFixed(1)}km away`}
                    </span>
                  )}
                </div>
              </button>

              {/* Slide-Up Bottom Sheet on Mobile (< 768px) with High-Contrast Highlight */}
              {selectedSpot && (
                <div
                  className={cn(
                    'absolute bottom-2 left-2 right-2 z-30 bg-card/95 backdrop-blur-md border border-border shadow-2xl rounded-3xl p-4 sm:p-5 animate-in slide-in-from-bottom-5 duration-200 block md:hidden transition-all',
                    isMobileDrawerExpanded ? 'max-h-[85%] overflow-y-auto' : 'max-h-[55%] overflow-y-auto'
                  )}
                >
                  {/* Top Drag Handle & Toggle */}
                  <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-border/50">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={cn(
                          'text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider',
                          selectedSpot.category === 'evacuation'
                            ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300'
                            : selectedSpot.category === 'government'
                            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
                            : selectedSpot.category === 'health'
                            ? 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300'
                            : selectedSpot.category === 'emergency'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300'
                            : selectedSpot.category === 'water'
                            ? 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300'
                            : selectedSpot.category === 'education'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : selectedSpot.category === 'mrf'
                            ? 'bg-lime-50 text-lime-800 border-lime-200 dark:bg-lime-950/40 dark:text-lime-300'
                            : selectedSpot.category === 'sports'
                            ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300'
                            : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                        )}
                      >
                        {selectedSpot.categoryTag}
                      </span>
                      <span className="text-[10px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded">
                        {selectedSpot.scope === 'daine_1'
                          ? 'Daine 1'
                          : selectedSpot.scope === 'daine_2'
                          ? 'Daine 2'
                          : 'Daine 1 & 2'}
                      </span>
                      {(() => {
                        const status = computeOpenStatus(selectedSpot.hours)
                        return (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${status.badgeClass}`}>
                            {status.label}
                          </span>
                        )
                      })()}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setIsMobileDrawerExpanded(!isMobileDrawerExpanded)}
                        className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                        aria-label="Expand or collapse bottom drawer"
                      >
                        {isMobileDrawerExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSpotId(null)}
                        className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                        aria-label="Close details"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="space-y-2">
                    <h3 className="font-black text-base sm:text-lg text-foreground leading-snug">
                      {selectedSpot.name}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>
                        {selectedSpot.purok ? <strong className="text-foreground">{selectedSpot.purok} • </strong> : null}
                        {selectedSpot.address}
                      </span>
                    </p>

                    {selectedSpot.hours && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>{selectedSpot.hours}</span>
                      </p>
                    )}

                    {selectedSpot.capacity && (
                      <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                        <Users className="h-4 w-4 shrink-0" />
                        <span>Evacuation Shelter Capacity: {selectedSpot.capacity.toLocaleString()} persons</span>
                      </div>
                    )}

                    {selectedSpot.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {selectedSpot.description}
                      </p>
                    )}

                    {selectedSpot.amenities && selectedSpot.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedSpot.amenities.map((item, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] bg-secondary text-secondary-foreground px-2.5 py-1 rounded-lg font-semibold"
                          >
                            ✓ {item}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons with Min 44px Touch Targets */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border/50">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selectedSpot.lat},${selectedSpot.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'min-h-[44px] inline-flex items-center justify-center gap-1.5 text-xs px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all no-underline shadow-xs cursor-pointer',
                        selectedSpot.phone && formatMessengerUrl(selectedSpot.messenger_link)
                          ? 'col-span-1'
                          : !selectedSpot.phone && !formatMessengerUrl(selectedSpot.messenger_link)
                          ? 'col-span-3'
                          : 'col-span-2'
                      )}
                    >
                      <Navigation className="h-4 w-4" /> Directions
                    </a>

                    {selectedSpot.phone && (
                      <a
                        href={`tel:${selectedSpot.phone}`}
                        className="min-h-[44px] inline-flex items-center justify-center gap-1.5 text-xs px-3 py-2.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold border border-emerald-300 no-underline shadow-xs cursor-pointer"
                      >
                        <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Call
                      </a>
                    )}

                    {formatMessengerUrl(selectedSpot.messenger_link) && (
                      <a
                        href={formatMessengerUrl(selectedSpot.messenger_link)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[44px] inline-flex items-center justify-center gap-1.5 text-xs px-3 py-2.5 rounded-xl bg-sky-50 text-sky-800 hover:bg-sky-100 dark:bg-sky-950/60 dark:text-sky-300 font-bold border border-sky-300 no-underline shadow-xs cursor-pointer"
                      >
                        <MessageSquare className="h-4 w-4 text-sky-600 dark:text-sky-400" /> Chat
                      </a>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Location List Panel Column (Responsive Side Panel on Desktop 1280px+) */}
        <div className={`lg:col-span-4 ${activeTab === 'map' ? 'hidden lg:block' : 'block'}`}>
          <Card className="border shadow-md h-[640px] lg:h-[730px] flex flex-col rounded-3xl">
            <CardHeader className="p-4 sm:p-5 border-b bg-muted/30 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" /> Evacuation & Civic Spot Directory
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Showing {filteredSpots.length} location{filteredSpots.length === 1 ? '' : 's'} in{' '}
                    {scope === 'daine1' ? 'Barangay Daine 1' : scope === 'daine2' ? 'Barangay Daine 2' : 'All Daine (1 & 2)'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-3.5 overflow-y-auto flex-1 space-y-3 scrollbar-thin">
              {filteredSpots.length === 0 ? (
                <div className="text-center py-14 px-4 space-y-3.5">
                  <div className="p-3.5 bg-muted rounded-2xl w-14 h-14 mx-auto flex items-center justify-center shadow-xs">
                    <Search className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <h4 className="text-sm font-black">No spots matching your filter</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Try clearing your search query, switching barangay scopes, or selecting another category layer.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetView}
                    className="text-xs rounded-xl min-h-[44px] font-bold px-4 cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Reset Filters
                  </Button>
                </div>
              ) : (
                filteredSpots.map((spot) => {
                  const distKm = calculateDistanceKm(
                    referenceCenter.lat,
                    referenceCenter.lng,
                    spot.lat,
                    spot.lng
                  )
                  const isSelected = selectedSpotId === spot.id
                  const openStatus = computeOpenStatus(spot.hours)
                  const messengerUrl = formatMessengerUrl(spot.messenger_link)

                  const scopeTag =
                    spot.scope === 'daine_1'
                      ? 'Daine 1'
                      : spot.scope === 'daine_2'
                      ? 'Daine 2'
                      : 'All Indang'

                  return (
                    <div
                      key={spot.id}
                      onClick={() => handleSpotClick(spot)}
                      className={cn(
                        'p-4 rounded-2xl border transition-all cursor-pointer select-none',
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-md scale-101'
                          : 'bg-card hover:border-primary/50 hover:bg-accent/40 shadow-xs'
                      )}
                    >
                      <div className="flex items-start justify-between gap-1.5 mb-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={cn(
                              'text-[10px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider',
                              spot.category === 'evacuation'
                                ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300'
                                : spot.category === 'government'
                                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
                                : spot.category === 'health'
                                ? 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300'
                                : spot.category === 'emergency'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300'
                                : spot.category === 'water'
                                ? 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300'
                                : spot.category === 'education'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : spot.category === 'mrf'
                                ? 'bg-lime-50 text-lime-800 border-lime-200 dark:bg-lime-950/40 dark:text-lime-300'
                                : spot.category === 'sports'
                                ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300'
                                : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                            )}
                          >
                            {spot.categoryTag}
                          </span>
                          <span className="text-[10px] font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                            {scopeTag}
                          </span>
                        </div>

                        <span className="text-[10px] font-black text-muted-foreground flex items-center gap-1 bg-muted px-2 py-0.5 rounded shrink-0">
                          <Navigation className="h-3 w-3 text-primary" />{' '}
                          {distKm < 1 ? `${Math.round(distKm * 1000)}m` : `${distKm.toFixed(1)}km`}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="font-black text-sm tracking-tight text-foreground leading-snug">
                          {spot.name}
                        </h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${openStatus.badgeClass}`}>
                          {openStatus.label}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground flex items-start gap-1.5 mb-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <span>
                          {spot.purok ? <strong className="text-foreground">{spot.purok} • </strong> : null}
                          {spot.address}
                        </span>
                      </p>

                      {/* Hours info if available */}
                      {spot.hours && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mb-2 font-medium">
                          <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span>{spot.hours}</span>
                        </p>
                      )}

                      {/* Capacity badge for Evacuation Centers */}
                      {spot.capacity && (
                        <div className="mb-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                          <Users className="h-4 w-4 shrink-0" />
                          <span>Evacuation Shelter Capacity: {spot.capacity.toLocaleString()} persons</span>
                        </div>
                      )}

                      {/* Description / civic role */}
                      {spot.description && (
                        <p className="text-xs text-muted-foreground mb-2.5 line-clamp-2 leading-relaxed">
                          {spot.description}
                        </p>
                      )}

                      {/* Amenities pills */}
                      {spot.amenities && spot.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {spot.amenities.map((item, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md font-semibold"
                            >
                              ✓ {item}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action buttons with Min 44px Touch Targets */}
                      <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-border/50">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className={cn(
                            'min-h-[44px] inline-flex items-center justify-center gap-1.5 text-xs px-2.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all no-underline shadow-xs cursor-pointer',
                            spot.phone && messengerUrl ? 'col-span-1' : !spot.phone && !messengerUrl ? 'col-span-3' : 'col-span-2'
                          )}
                        >
                          <Navigation className="h-3.5 w-3.5" /> Directions
                        </a>

                        {spot.phone && (
                          <a
                            href={`tel:${spot.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="min-h-[44px] inline-flex items-center justify-center gap-1 text-xs px-2.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold border border-emerald-300 no-underline shadow-xs cursor-pointer"
                          >
                            <Phone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Call
                          </a>
                        )}

                        {messengerUrl && (
                          <a
                            href={messengerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="min-h-[44px] inline-flex items-center justify-center gap-1 text-xs px-2.5 py-2 rounded-xl bg-sky-50 text-sky-800 hover:bg-sky-100 dark:bg-sky-950/60 dark:text-sky-300 font-bold border border-sky-300 no-underline shadow-xs cursor-pointer"
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" /> Chat
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
