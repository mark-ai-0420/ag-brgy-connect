import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { z } from 'zod'
import { useState } from 'react'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader } from '#/components/ui/card'
import { Separator } from '#/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import {
  ArrowLeft,
  MapPin,
  Phone,
  Clock,
  ExternalLink,
  Store,
  Maximize2,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Navigation,
} from 'lucide-react'

const getBusiness = createServerFn({ method: 'GET' })
  .validator((id: string) => z.string().min(1).parse(id))
  .handler(async ({ data: id }) => {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from('businesses')
      .select('id, name, category, description, address, phone, hours, status, photo_url, menu_image_url, misc_image_url, map_url, owner_id, created_at')
      .eq('id', id)
      .single()
    if (error || !data) return null
    return data
  })

export const Route = createFileRoute('/directory/$businessId')({
  component: BusinessDetail,
  loader: ({ params }) => getBusiness({ data: params.businessId }),
})

const CATEGORY_COLORS: Record<string, string> = {
  'Sari-Sari Store': 'bg-amber-100 text-amber-950 dark:bg-amber-900/50 dark:text-amber-200 border border-amber-300 font-semibold',
  'Eatery / Carenderia': 'bg-orange-100 text-orange-950 dark:bg-orange-900/50 dark:text-orange-200 border border-orange-300 font-semibold',
  'Water Station': 'bg-blue-100 text-blue-950 dark:bg-blue-900/50 dark:text-blue-200 border border-blue-300 font-semibold',
  Laundry: 'bg-sky-100 text-sky-950 dark:bg-sky-900/50 dark:text-sky-200 border border-sky-300 font-semibold',
  Salon: 'bg-pink-100 text-pink-950 dark:bg-pink-900/50 dark:text-pink-200 border border-pink-300 font-semibold',
  'Repair Shop': 'bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-slate-200 border border-slate-300 font-semibold',
  Clinic: 'bg-emerald-100 text-emerald-950 dark:bg-emerald-900/50 dark:text-emerald-200 border border-emerald-300 font-semibold',
  Pharmacy: 'bg-teal-100 text-teal-950 dark:bg-teal-900/50 dark:text-teal-200 border border-teal-300 font-semibold',
  Tailoring: 'bg-purple-100 text-purple-950 dark:bg-purple-900/50 dark:text-purple-200 border border-purple-300 font-semibold',
  Others: 'bg-gray-100 text-gray-950 dark:bg-slate-800 dark:text-slate-200 border border-gray-300 font-semibold',
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 p-2 bg-primary/10 rounded-lg shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <div className="text-sm text-foreground/90 font-medium">{children}</div>
      </div>
    </div>
  )
}

function BusinessDetail() {
  const business = Route.useLoaderData()
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (!business) {
    return (
      <div className="container mx-auto py-20 text-center max-w-md">
        <div className="p-4 bg-muted rounded-full inline-flex mb-4">
          <Store className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Business Not Found</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          This listing may have been removed or the link is invalid.
        </p>
        <Button asChild>
          <Link to="/directory">Back to Directory</Link>
        </Button>
      </div>
    )
  }

  const badgeClass =
    CATEGORY_COLORS[business.category as string] ??
    'bg-gray-100 text-gray-700 border-gray-200'

  // Construct gallery items
  const galleryImages = [
    business.photo_url ? { key: 'photo', label: 'Storefront', url: business.photo_url, description: 'Storefront & Main View' } : null,
    business.menu_image_url ? { key: 'menu', label: 'Menu / Rates', url: business.menu_image_url, description: 'Price List, Services & Rates' } : null,
    business.misc_image_url ? { key: 'misc', label: 'Products / Facilities', url: business.misc_image_url, description: 'Products & Store Facilities' } : null,
  ].filter(Boolean) as Array<{ key: string; label: string; url: string; description: string }>

  const currentImage = galleryImages[activeImageIndex] || galleryImages[0]

  // Try extracting lat/lng from map_url (if it exists)
  let lat: number | null = null;
  let lng: number | null = null;
  if (business.map_url) {
    const coordsMatch = business.map_url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || business.map_url.match(/mlat=(-?\d+\.\d+)&mlon=(-?\d+\.\d+)/);
    if (coordsMatch) {
      lat = parseFloat(coordsMatch[1]);
      lng = parseFloat(coordsMatch[2]);
    }
  }

  const mapSrc = lat && lng
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.005}%2C${lat - 0.004}%2C${lng + 0.005}%2C${lat + 0.004}&layer=mapnik&marker=${lat}%2C${lng}`
    : 'https://www.openstreetmap.org/export/embed.html?bbox=120.840%2C14.183%2C120.850%2C14.192&layer=mapnik&marker=14.1875%2C120.8452'

  const mapLink = business.map_url || (lat && lng
    ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`
    : 'https://www.openstreetmap.org/?mlat=14.1875&mlon=120.8452#map=16/14.1875/120.8452')

  return (
    <div className="container mx-auto py-8 md:py-10 px-4 md:px-6 max-w-6xl pb-24 md:pb-10">
      {/* Back */}
      <Button variant="ghost" asChild className="mb-6 -ml-2 text-muted-foreground hover:text-foreground min-h-[44px] px-3">
        <Link to="/directory">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Directory
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Multi-Image Gallery Card */}
          <Card className="overflow-hidden border shadow-sm">
            {galleryImages.length > 0 ? (
              <div className="flex flex-col">
                {/* Active Image Hero */}
                <div
                  onClick={() => setLightboxOpen(true)}
                  className="relative w-full h-64 sm:h-80 md:h-96 bg-muted cursor-pointer group overflow-hidden"
                  title="Click to expand full image"
                >
                  <img
                    src={currentImage.url}
                    alt={`${business.name} - ${currentImage.label}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                  />
                  {/* Floating category badge & expand button */}
                  <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border shadow-xs">
                    {currentImage.label}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md shadow-md transition-all group-hover:scale-105">
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span>View Fullscreen</span>
                  </div>
                </div>

                {/* Multi-Image Tabs / Thumbnails if > 1 image */}
                {galleryImages.length > 1 && (
                  <div className="flex items-center gap-2.5 p-3.5 bg-muted/30 border-t overflow-x-auto scrollbar-hide">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-1 flex items-center gap-1 shrink-0">
                      <ImageIcon className="h-3.5 w-3.5 text-primary" /> Photos:
                    </span>
                    {galleryImages.map((img, idx) => (
                      <button
                        key={img.key}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all min-h-[40px] shrink-0 ${
                          activeImageIndex === idx
                            ? 'bg-primary text-primary-foreground border-primary shadow-xs ring-1 ring-primary/40'
                            : 'bg-card text-muted-foreground hover:text-foreground hover:bg-muted/80 border-border'
                        }`}
                      >
                        <img src={img.url} alt={img.label} className="w-5 h-5 rounded object-cover border" />
                        <span>{img.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-3 bg-gradient-to-r from-primary via-primary/80 to-primary/50" />
            )}

            <CardHeader className="pb-4 pt-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className={`inline-flex text-[11px] font-semibold px-3 py-0.5 rounded-full border ${badgeClass}`}
                >
                  {business.category}
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 px-2.5 py-0.5 rounded-full">
                  Verified Local Business
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold leading-tight text-foreground">
                {business.name}
              </h1>
            </CardHeader>

            <CardContent className="space-y-4">
              <Separator />
              <div>
                <h2 className="font-bold mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                  About the Business
                </h2>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base whitespace-pre-wrap">
                  {business.description || 'No detailed description provided for this business listing.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Map & Location Section */}
          <Card className="overflow-hidden border shadow-sm">
            <CardHeader className="py-4 pb-2">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" /> Location & Directions
                </h2>
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold min-h-[40px] px-2"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  <span>Open Map</span>
                </a>
              </div>
            </CardHeader>
            <div className="relative w-full" style={{ paddingBottom: '50%' }}>
              <iframe
                src={mapSrc}
                title={`Map of ${business.name}`}
                className="absolute inset-0 w-full h-full border-0"
                loading="lazy"
              />
            </div>
            <CardContent className="py-3 bg-muted/20 border-t flex items-center justify-between text-xs text-muted-foreground">
              <span>{business.address}</span>
              <a
                href={mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
              >
                <span>Full Map</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Contact Info */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <h2 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                Contact & Details
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow icon={MapPin} label="Address">
                {business.address}
              </InfoRow>
              {business.phone && (
                <InfoRow icon={Phone} label="Phone Number">
                  <a
                    href={`tel:${business.phone.replace(/[^0-9+]/g, '')}`}
                    className="text-primary hover:underline font-semibold min-h-[44px] inline-flex items-center"
                  >
                    {business.phone}
                  </a>
                </InfoRow>
              )}
              {business.hours && (
                <InfoRow icon={Clock} label="Operating Hours">
                  {business.hours}
                </InfoRow>
              )}
              {business.map_url && (
                <InfoRow icon={Navigation} label="Map Link">
                  <a
                    href={business.map_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-semibold inline-flex items-center gap-1"
                  >
                    <span>View on External Map</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </InfoRow>
              )}
            </CardContent>
          </Card>

          {/* Call Now CTA Desktop */}
          {business.phone && (
            <Button asChild className="hidden md:inline-flex w-full min-h-[48px] text-base font-bold shadow-md gap-2" size="lg">
              <a href={`tel:${business.phone.replace(/[^0-9+]/g, '')}`}>
                <Phone className="h-5 w-5" />
                Call Now ({business.phone})
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Floating Sticky CTA */}
      {business.phone && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t z-40 shadow-2xl">
          <Button asChild className="w-full min-h-[48px] text-base font-bold shadow-lg gap-2" size="lg">
            <a href={`tel:${business.phone.replace(/[^0-9+]/g, '')}`}>
              <Phone className="h-5 w-5" />
              Call {business.phone}
            </a>
          </Button>
        </div>
      )}

      {/* Lightbox Dialog */}
      {galleryImages.length > 0 && (
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 text-white border-slate-800">
            <DialogHeader className="p-4 bg-black/80 border-b border-white/10 flex flex-row items-center justify-between">
              <div>
                <DialogTitle className="text-base font-bold text-white">
                  {business.name} — {currentImage.label}
                </DialogTitle>
                <p className="text-xs text-white/70 mt-0.5">{currentImage.description}</p>
              </div>
            </DialogHeader>

            <div className="relative flex items-center justify-center p-4 min-h-[300px] max-h-[75vh]">
              <img
                src={currentImage.url}
                alt={`${business.name} - ${currentImage.label}`}
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
              />

              {galleryImages.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white min-h-[44px] min-w-[44px] flex items-center justify-center transition-all"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white min-h-[44px] min-w-[44px] flex items-center justify-center transition-all"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            {galleryImages.length > 1 && (
              <div className="flex items-center justify-center gap-3 p-3 bg-black/80 border-t border-white/10">
                {galleryImages.map((img, idx) => (
                  <button
                    key={img.key}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold border transition-all ${
                      activeImageIndex === idx
                        ? 'bg-primary text-white border-primary ring-1 ring-white/50'
                        : 'bg-white/10 text-white/80 hover:bg-white/20 border-white/20'
                    }`}
                  >
                    {img.label}
                  </button>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
