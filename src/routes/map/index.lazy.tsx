import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef, useMemo } from 'react'
import {
  MapPin, ShieldAlert, Building2, Store, Phone, Navigation, Search, Users, CheckCircle2, Flame, Stethoscope, Radio, ExternalLink, Layers, Sparkles, Info, Compass, Maximize2, RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { Input } from '#/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '#/components/ui/tabs'

import { Route as MapRoute } from './index'

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

export const Route = createLazyFileRoute('/map/')({
  component: MapRouteComponent,
})

export interface MapSpot {
  id: string
  name: string
  category: 'evacuation' | 'government' | 'emergency' | 'business'
  categoryTag: string
  lat: number
  lng: number
  phone?: string
  address: string
  capacity?: number
  amenities?: string[]
  status?: string
  description?: string
  hours?: string
  isBusiness?: boolean
}

const MAP_CENTER = { lat: 14.1955, lng: 120.8798, zoom: 15 }

// Haversine formula to compute distance in km from center
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371 // Earth radius in km
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

const STATIC_SPOTS: MapSpot[] = [
  {
    id: 'evac-1',
    name: 'Barangay Daine Covered Court & Multipurpose Hall',
    category: 'evacuation',
    categoryTag: '🚨 Evacuation Center',
    lat: 14.1958,
    lng: 120.8802,
    address: 'Sitio 1, Brgy. Daine, Indang, Cavite',
    phone: '0917-555-0101',
    capacity: 500,
    amenities: ['Restrooms', 'Generator', 'Medical Station', 'Water Supply'],
    status: 'Ready & Operational',
    description: 'Primary emergency shelter with standby power generator and medical bay.',
  },
  {
    id: 'evac-2',
    name: 'Barangay Daine Elementary School Grounds',
    category: 'evacuation',
    categoryTag: '🚨 Evacuation Center',
    lat: 14.1942,
    lng: 120.8785,
    address: 'School Road, Brgy. Daine, Indang, Cavite',
    phone: '0917-555-0101',
    capacity: 800,
    amenities: ['Classrooms', 'Water Supply', 'Field Area', 'Relief Staging Desk'],
    status: 'Primary Typhoon & Flood Shelter',
    description: 'Main school facility designated as high-capacity typhoon relief shelter.',
  },
  {
    id: 'gov-1',
    name: 'Barangay Daine Hall & Operations Center',
    category: 'government',
    categoryTag: '🏛️ Barangay Hall & Ops',
    lat: 14.1955,
    lng: 120.8798,
    address: 'Main Road, Brgy. Daine, Indang, Cavite',
    phone: '0917-123-DAINE',
    amenities: ['Admin Office', 'CCTV Operations', 'Barangay Captain Desk'],
    status: 'Open 24/7 Duty',
    description: 'Headquarters for local barangay services and emergency command operations.',
  },
  {
    id: 'gov-2',
    name: 'Barangay Daine Health Center & Birthing Clinic',
    category: 'government',
    categoryTag: '🏛️ Health & Birthing Clinic',
    lat: 14.1952,
    lng: 120.8805,
    address: 'Health Complex, Brgy. Daine, Indang, Cavite',
    phone: '0928-555-0102',
    amenities: ['First Aid', 'Maternal Care', 'Vaccine Cold Storage', 'Pharmacy Depot'],
    status: 'Mon-Fri 8:00 AM - 5:00 PM',
    description: 'Community clinic for basic healthcare, maternal checkups, and triage.',
  },
  {
    id: 'emerg-1',
    name: 'BFP Indang Fire Station Outpost',
    category: 'emergency',
    categoryTag: '🏥 Fire & Rescue Station',
    lat: 14.1965,
    lng: 120.8812,
    address: 'Provincial Road, Brgy. Daine Outpost, Indang',
    phone: '(046) 415-0322',
    amenities: ['Fire Engine', 'Rescue Gear', 'Hydrant Access'],
    status: '24/7 Response Unit',
    description: 'Bureau of Fire Protection station for fast fire and emergency rescue response.',
  },
  {
    id: 'emerg-2',
    name: 'Barangay Tanod Outpost / Police Community Desk',
    category: 'emergency',
    categoryTag: '🏥 Security & Police Patrol',
    lat: 14.1950,
    lng: 120.8795,
    address: 'Purok 1 Outpost, Brgy. Daine, Indang',
    phone: '(046) 415-0211',
    amenities: ['24/7 Patrol Vehicle', 'Radio Dispatch', 'First Responders'],
    status: '24/7 Patrol Duty',
    description: 'Barangay Peacekeeping Officer (Tanod) and Police Community Patrol Desk.',
  },
]

// Default coordinate offsets for database businesses lacking explicit lat/lng
const BUSINESS_OFFSETS = [
  { lat: 0.0012, lng: -0.0018 },
  { lat: -0.0011, lng: 0.0022 },
  { lat: 0.0019, lng: 0.0011 },
  { lat: -0.0016, lng: -0.0025 },
  { lat: 0.0009, lng: 0.0033 },
  { lat: -0.0024, lng: 0.0015 },
  { lat: 0.0025, lng: -0.0010 },
  { lat: -0.0008, lng: -0.0030 },
]

function MapRouteComponent() {
  const loadedBusinesses = MapRoute.useLoaderData()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('map')

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<Record<string, any>>({})
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  // Merge static spots + dynamic database businesses
  const allSpots: MapSpot[] = useMemo(() => {
    const businessSpots: MapSpot[] = (loadedBusinesses || []).map((b: any, index: number) => {
      let lat = MAP_CENTER.lat
      let lng = MAP_CENTER.lng

      // Extract coords from map_url if present
      if (b.map_url) {
        const match = b.map_url.match(/#map=\d+\/([0-9.-]+)\/([0-9.-]+)/) || b.map_url.match(/destination=([0-9.-]+),([0-9.-]+)/)
        if (match && match[1] && match[2]) {
          lat = parseFloat(match[1])
          lng = parseFloat(match[2])
        } else {
          const offset = BUSINESS_OFFSETS[index % BUSINESS_OFFSETS.length]
          lat = MAP_CENTER.lat + offset.lat
          lng = MAP_CENTER.lng + offset.lng
        }
      } else {
        const offset = BUSINESS_OFFSETS[index % BUSINESS_OFFSETS.length]
        const jitterLat = (Math.random() - 0.5) * 0.0015
        const jitterLng = (Math.random() - 0.5) * 0.0015
        lat = MAP_CENTER.lat + offset.lat + jitterLat
        lng = MAP_CENTER.lng + offset.lng + jitterLng
      }

      return {
        id: `biz-${b.id || index}`,
        name: b.name,
        category: 'business',
        categoryTag: `🏪 ${b.category || 'Local Business'}`,
        lat,
        lng,
        phone: b.phone || undefined,
        address: b.address || 'Barangay Daine, Indang, Cavite',
        hours: b.hours || undefined,
        description: b.description || undefined,
        isBusiness: true,
        status: 'Verified Business',
      }
    })

    return [...STATIC_SPOTS, ...businessSpots]
  }, [loadedBusinesses])

  // Filter spots by category & search query
  const filteredSpots = useMemo(() => {
    return allSpots.filter((spot) => {
      let matchesCategory = true
      if (selectedCategory === 'evacuation') {
        matchesCategory = spot.category === 'evacuation'
      } else if (selectedCategory === 'government') {
        matchesCategory = spot.category === 'government'
      } else if (selectedCategory === 'emergency') {
        matchesCategory = spot.category === 'emergency'
      } else if (selectedCategory === 'business') {
        matchesCategory = spot.category === 'business'
      }

      const matchesSearch =
        searchQuery.trim() === '' ||
        spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spot.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spot.categoryTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (spot.description && spot.description.toLowerCase().includes(searchQuery.toLowerCase()))

      return matchesCategory && matchesSearch
    })
  }, [allSpots, selectedCategory, searchQuery])

  // Stats calculation
  const totalEvacCapacity = useMemo(() => {
    return STATIC_SPOTS.filter((s) => s.category === 'evacuation').reduce((acc, curr) => acc + (curr.capacity || 0), 0)
  }, [])

  const reliefStationsCount = useMemo(() => {
    return STATIC_SPOTS.filter((s) => s.category === 'evacuation').length
  }, [])

  const emergencyOutpostsCount = useMemo(() => {
    return STATIC_SPOTS.filter((s) => s.category === 'emergency').length
  }, [])

  // Initialize Leaflet map on client-side
  useEffect(() => {
    if (typeof window === 'undefined') return
    let isMounted = true

    // Dynamically inject Leaflet CSS if missing
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

      // Destroy previous map instance if re-initializing
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      const map = L.map(mapContainerRef.current, {
        center: [MAP_CENTER.lat, MAP_CENTER.lng],
        zoom: MAP_CENTER.zoom,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      mapInstanceRef.current = map
      markersRef.current = {}

      // Add markers for filtered spots
      filteredSpots.forEach((spot) => {
        const getMarkerBg = (cat: string) => {
          if (cat === 'evacuation') return 'bg-red-600 border-red-900 text-white shadow-red-500/50'
          if (cat === 'government') return 'bg-blue-600 border-blue-950 text-white shadow-blue-500/50'
          if (cat === 'emergency') return 'bg-emerald-600 border-emerald-950 text-white shadow-emerald-500/50'
          return 'bg-amber-500 border-amber-900 text-amber-950 shadow-amber-500/50'
        }

        const getMarkerEmoji = (cat: string) => {
          if (cat === 'evacuation') return '🚨'
          if (cat === 'government') return '🏛️'
          if (cat === 'emergency') return '🏥'
          return '🏪'
        }

        const customIcon = L.divIcon({
          className: 'custom-leaflet-pin',
          html: `
            <div class="relative group cursor-pointer flex flex-col items-center">
              <div class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-md border-2 ${getMarkerBg(
                spot.category
              )} transition-transform hover:scale-110">
                ${getMarkerEmoji(spot.category)}
              </div>
              <div class="w-2 h-2 ${
                getMarkerBg(spot.category).split(' ')[0]
              } rotate-45 -mt-1 shadow-sm"></div>
            </div>
          `,
          iconSize: [36, 42],
          iconAnchor: [18, 42],
          popupAnchor: [0, -36],
        })

        const directionUrl = `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`
        const phoneHtml = spot.phone
          ? `<a href="tel:${escapeHtml(spot.phone)}" class="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 font-semibold mt-2">📞 Call: ${escapeHtml(spot.phone)}</a>`
          : ''

        const capacityHtml = spot.capacity
          ? `<div class="text-xs font-semibold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded border border-red-200 inline-block mt-1">👥 Evacuation Capacity: ${spot.capacity.toLocaleString()} residents</div>`
          : ''

        const popupContent = `
          <div class="p-1 max-w-xs font-sans">
            <span class="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">${escapeHtml(spot.categoryTag)}</span>
            <h3 class="font-bold text-sm text-slate-900 mt-1.5 mb-1 leading-snug">${escapeHtml(spot.name)}</h3>
            <p class="text-xs text-slate-600 mb-1">${escapeHtml(spot.address)}</p>
            ${capacityHtml}
            ${
              spot.status
                ? `<div class="text-[11px] text-emerald-700 font-medium mt-1">Status: ${escapeHtml(spot.status)}</div>`
                : ''
            }
            <div class="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
              <a href="${directionUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded bg-primary text-primary-foreground font-semibold hover:opacity-90">
                🗺️ Directions
              </a>
              ${phoneHtml}
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
  }, [filteredSpots])

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
    // Switch to map view on mobile if needed
    setActiveTab('map')
  }

  const handleResetView = () => {
    setSelectedCategory('all')
    setSearchQuery('')
    setSelectedSpotId(null)
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([MAP_CENTER.lat, MAP_CENTER.lng], MAP_CENTER.zoom, { duration: 1 })
    }
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 max-w-7xl">
      {/* Header Banner with Philippine Color Accents */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0038A8] via-[#002675] to-[#1E3A8A] text-white p-6 sm:p-8 mb-6 shadow-xl">
        {/* Subtle Philippine Flag Accent bar */}
        <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-[#0038A8] via-[#FCD116] to-[#CE1126]" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-[#FCD116] text-[#0038A8] hover:bg-[#FCD116]/90 font-extrabold px-3 py-1 text-xs border border-amber-300">
                <Compass className="h-3.5 w-3.5 mr-1" /> Interactive GIS Map
              </Badge>
              <Badge variant="outline" className="text-white border-white/30 text-xs">
                Barangay Daine, Indang, Cavite
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Emergency Evacuation & GIS Directory
            </h1>
            <p className="text-white/80 text-sm sm:text-base max-w-2xl">
              Locate emergency shelters, typhoon evacuation capacity, health centers, fire stations, and verified local businesses across Barangay Daine.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/15 text-center">
              <div className="text-xs text-white/70 font-medium flex items-center justify-center gap-1">
                <Users className="h-3.5 w-3.5 text-amber-300" /> Total Capacity
              </div>
              <div className="text-xl font-black text-amber-300 mt-0.5">{totalEvacCapacity.toLocaleString()}</div>
              <div className="text-[10px] text-white/60">Residents</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/15 text-center">
              <div className="text-xs text-white/70 font-medium flex items-center justify-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5 text-red-400" /> Relief Hubs
              </div>
              <div className="text-xl font-black text-red-400 mt-0.5">{reliefStationsCount}</div>
              <div className="text-[10px] text-white/60">Active Centers</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/15 text-center">
              <div className="text-xs text-white/70 font-medium flex items-center justify-center gap-1">
                <Radio className="h-3.5 w-3.5 text-emerald-400" /> 24/7 Response
              </div>
              <div className="text-xl font-black text-emerald-400 mt-0.5">{emergencyOutpostsCount}</div>
              <div className="text-[10px] text-white/60">Outposts</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/15 text-center">
              <div className="text-xs text-white/70 font-medium flex items-center justify-center gap-1">
                <Store className="h-3.5 w-3.5 text-blue-300" /> Businesses
              </div>
              <div className="text-xl font-black text-blue-300 mt-0.5">
                {allSpots.filter((s) => s.category === 'business').length}
              </div>
              <div className="text-[10px] text-white/60">Verified Pinned</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Badges & Search Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-card p-4 rounded-xl border shadow-sm">
        {/* Category Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
            className="rounded-full text-xs font-semibold"
          >
            All Locations ({allSpots.length})
          </Button>

          <Button
            variant={selectedCategory === 'evacuation' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('evacuation')}
            className={`rounded-full text-xs font-semibold ${
              selectedCategory === 'evacuation' ? 'bg-red-600 hover:bg-red-700 text-white' : 'hover:bg-red-50 text-red-700 border-red-200'
            }`}
          >
            🚨 Evacuation Centers ({STATIC_SPOTS.filter((s) => s.category === 'evacuation').length})
          </Button>

          <Button
            variant={selectedCategory === 'government' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('government')}
            className={`rounded-full text-xs font-semibold ${
              selectedCategory === 'government' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'hover:bg-blue-50 text-blue-700 border-blue-200'
            }`}
          >
            🏛️ Barangay Hall & Health ({STATIC_SPOTS.filter((s) => s.category === 'government').length})
          </Button>

          <Button
            variant={selectedCategory === 'emergency' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('emergency')}
            className={`rounded-full text-xs font-semibold ${
              selectedCategory === 'emergency' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'hover:bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            🏥 Emergency Outposts ({STATIC_SPOTS.filter((s) => s.category === 'emergency').length})
          </Button>

          <Button
            variant={selectedCategory === 'business' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('business')}
            className={`rounded-full text-xs font-semibold ${
              selectedCategory === 'business' ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'hover:bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            🏪 Local Businesses ({allSpots.filter((s) => s.category === 'business').length})
          </Button>
        </div>

        {/* Search Input & Reset */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search spots, phone, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>
          {(selectedCategory !== 'all' || searchQuery !== '' || selectedSpotId !== null) && (
            <Button variant="ghost" size="icon" onClick={handleResetView} title="Reset View & Filters" className="h-9 w-9 shrink-0">
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Layout: Split Screen on Desktop, Tabs on Mobile */}
      <div className="block lg:hidden mb-4">
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'map' | 'list')}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="map" className="text-xs font-bold">
              🗺️ GIS Map View
            </TabsTrigger>
            <TabsTrigger value="list" className="text-xs font-bold">
              📋 Spot List ({filteredSpots.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Map Container Column */}
        <div className={`lg:col-span-8 ${activeTab === 'list' ? 'hidden lg:block' : 'block'}`}>
          <Card className="overflow-hidden border shadow-md relative">
            <CardHeader className="p-4 bg-muted/30 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" /> Barangay Daine GIS Interactive Map
                </CardTitle>
                <CardDescription className="text-xs">
                  Click any marker or spot card to fly directly to location and view emergency details.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetView}
                className="text-xs h-8 gap-1 hidden sm:flex"
              >
                <Maximize2 className="h-3.5 w-3.5" /> Recenter Map
              </Button>
            </CardHeader>

            <CardContent className="p-0 relative">
              <div
                ref={mapContainerRef}
                className="w-full h-[450px] sm:h-[550px] lg:h-[600px] z-10 bg-slate-100 dark:bg-slate-900"
              />

              {!leafletLoaded && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-20">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-xs font-semibold">Loading Barangay Daine Map Tiles...</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Location List Panel Column */}
        <div className={`lg:col-span-4 ${activeTab === 'map' ? 'hidden lg:block' : 'block'}`}>
          <Card className="border shadow-md h-[600px] lg:h-[670px] flex flex-col">
            <CardHeader className="p-4 border-b bg-muted/30 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" /> Evacuation & Spots List
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Showing {filteredSpots.length} location{filteredSpots.length === 1 ? '' : 's'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-3 overflow-y-auto flex-1 space-y-3">
              {filteredSpots.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-3">
                  <div className="p-3 bg-muted rounded-full w-12 h-12 mx-auto flex items-center justify-center">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h4 className="text-sm font-semibold">No spots matching your filter</h4>
                  <p className="text-xs text-muted-foreground">
                    Try adjusting your search query or switching categories.
                  </p>
                  <Button variant="outline" size="sm" onClick={handleResetView} className="text-xs">
                    Reset Filters
                  </Button>
                </div>
              ) : (
                filteredSpots.map((spot) => {
                  const distKm = calculateDistanceKm(MAP_CENTER.lat, MAP_CENTER.lng, spot.lat, spot.lng)
                  const isSelected = selectedSpotId === spot.id

                  return (
                    <div
                      key={spot.id}
                      onClick={() => handleSpotClick(spot)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-md'
                          : 'bg-card hover:border-primary/50 hover:bg-accent/40 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${
                            spot.category === 'evacuation'
                              ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300'
                              : spot.category === 'government'
                              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
                              : spot.category === 'emergency'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                          }`}
                        >
                          {spot.categoryTag}
                        </span>

                        <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 bg-muted px-2 py-0.5 rounded">
                          <Navigation className="h-3 w-3 text-primary" /> {distKm < 1 ? `${Math.round(distKm * 1000)}m` : `${distKm.toFixed(1)}km`}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm tracking-tight text-foreground leading-snug mb-1">
                        {spot.name}
                      </h3>

                      <p className="text-xs text-muted-foreground flex items-start gap-1 mb-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <span>{spot.address}</span>
                      </p>

                      {/* Capacity badge for Evacuation Centers */}
                      {spot.capacity && (
                        <div className="mb-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          <span>Evacuation Capacity: {spot.capacity.toLocaleString()} persons</span>
                        </div>
                      )}

                      {/* Amenities pills */}
                      {spot.amenities && spot.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2.5">
                          {spot.amenities.map((item, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded font-medium"
                            >
                              ✓ {item}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 inline-flex items-center justify-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
                        >
                          <Navigation className="h-3 w-3" /> Get Directions
                        </a>

                        {spot.phone && (
                          <a
                            href={`tel:${spot.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/80 border border-border"
                          >
                            <Phone className="h-3 w-3 text-emerald-600" /> Call Hotline
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
