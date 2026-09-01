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
  MessageCircle,
  Building2,
  CreditCard,
  CheckCircle2,
  UserCheck,
  Sparkles,
} from 'lucide-react'
import { CATEGORY_COLORS, computeOpenStatus, getMessengerUrl } from './index'
import { ClaimBusinessModal } from '#/components/businesses/ClaimBusinessModal'

const getBusiness = createServerFn({ method: 'GET' })
  .validator((id: string) => z.string().min(1).parse(id))
  .handler(async ({ data: id }) => {
    const supabase = createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('businesses')
      .select('id, name, category, description, address, phone, hours, status, photo_url, menu_image_url, misc_image_url, map_url, owner_id, barangay, purok, messenger_link, payment_methods, created_at')
      .eq('id', id)
      .single()
    if (error || !data) return null

    let ownerBadge = null
    if (data.owner_id) {
      try {
        const { data: ownerData } = await supabase.rpc('get_verified_resident', { resident_id: data.owner_id })
        if (ownerData && ownerData.length > 0) {
          ownerBadge = ownerData[0]
        }
      } catch (e) {
        console.error('Error fetching owner badge:', e)
      }
    }

    return {
      ...data,
      ownerBadge,
      currentUser: user ? { id: user.id, email: user.email, user_metadata: user.user_metadata } : null,
    }
  })

export const Route = createFileRoute('/directory/$businessId')({
  component: BusinessDetail,
  loader: ({ params }) => getBusiness({ data: params.businessId }),
})

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
      <div className="mt-0.5 p-2 bg-primary/10 dark:bg-primary/20 rounded-xl shrink-0 border border-primary/20">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-muted-foreground mb-0.5">
          {label}
        </p>
        <div className="text-sm text-foreground font-semibold leading-relaxed">{children}</div>
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
      <div className="min-h-[100dvh] container mx-auto py-20 text-center max-w-md px-4 flex flex-col items-center justify-center">
        <div className="p-4 bg-muted rounded-full inline-flex mb-4">
          <Store className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-extrabold mb-2">Business Not Found</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          This listing may have been removed or the link is invalid.
        </p>
        <Button asChild className="min-h-[44px] font-bold rounded-xl btn-tactile">
          <Link to="/directory">Back to Directory</Link>
        </Button>
      </div>
    )
  }

  const badgeClass =
    CATEGORY_COLORS[business.category as string] ??
    'bg-gray-100 text-gray-700 border-gray-200'

  const isDaine2 = business.barangay === 'daine_2'
  const messengerUrl = getMessengerUrl(business.messenger_link)
  const openStatus = computeOpenStatus(business.hours)

  // Construct gallery items
  const galleryImages = [
    business.photo_url ? { key: 'photo', label: 'Storefront', url: business.photo_url, description: 'Storefront & Main View' } : null,
    business.menu_image_url ? { key: 'menu', label: 'Menu / Rates', url: business.menu_image_url, description: 'Price List, Services & Rates' } : null,
    business.misc_image_url ? { key: 'misc', label: 'Products / Facilities', url: business.misc_image_url, description: 'Products & Store Facilities' } : null,
  ].filter(Boolean) as Array<{ key: string; label: string; url: string; description: string }>

  const currentImage = galleryImages[activeImageIndex] || galleryImages[0]

  // Try extracting lat/lng from map_url (if it exists)
  let lat: number | null = null
  let lng: number | null = null
  if (business.map_url) {
    const coordsMatch = business.map_url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || business.map_url.match(/mlat=(-?\d+\.\d+)&mlon=(-?\d+\.\d+)/)
    if (coordsMatch) {
      lat = parseFloat(coordsMatch[1])
      lng = parseFloat(coordsMatch[2])
    }
  }

  const mapSrc = lat && lng
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.005}%2C${lat - 0.004}%2C${lng + 0.005}%2C${lat + 0.004}&layer=mapnik&marker=${lat}%2C${lng}`
    : 'https://www.openstreetmap.org/export/embed.html?bbox=120.840%2C14.183%2C120.850%2C14.192&layer=mapnik&marker=14.1875%2C120.8452'

  const mapLink = business.map_url || (lat && lng
    ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`
    : 'https://www.openstreetmap.org/?mlat=14.1875&mlon=120.8452#map=16/14.1875/120.8452')

  return (
    <div className="min-h-[100dvh] container mx-auto py-8 md:py-10 px-4 md:px-6 max-w-6xl pb-28 md:pb-10">
      {/* Back button */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <Button variant="ghost" asChild className="-ml-2 text-muted-foreground hover:text-foreground min-h-[44px] px-3 font-semibold rounded-xl">
          <Link to="/directory">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Directory
          </Link>
        </Button>

        {!business.owner_id && (
          <ClaimBusinessModal
            business={business}
            user={business.currentUser}
            className="sm:inline-flex"
          />
        )}
      </div>

      {/* Unclaimed Business Alert Banner */}
      {!business.owner_id && (
        <Card className="mb-6 border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent rounded-2xl shadow-sm">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-300 text-xs font-bold border border-amber-500/30">
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                <span>Barangay-Curated Listing</span>
              </div>
              <h3 className="font-extrabold text-base text-foreground">Do you own or manage {business.name}?</h3>
              <p className="text-xs text-muted-foreground">
                This listing was curated by Barangay staff. Verified owners can claim this profile to update operating hours, price lists, photos, and payment methods.
              </p>
            </div>
            <ClaimBusinessModal
              business={business}
              user={business.currentUser}
              className="w-full sm:w-auto shrink-0 shadow-sm font-bold"
            />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Multi-Image Gallery Card */}
          <Card className="overflow-hidden border shadow-sm rounded-2xl">
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
                    width="800"
                    height="450"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                  />
                  {/* Floating category badge & expand button */}
                  <div className="absolute top-3.5 left-3.5 bg-background/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border shadow-xs">
                    {currentImage.label}
                  </div>
                  <div className="absolute bottom-3.5 right-3.5 bg-slate-950/85 hover:bg-slate-950 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 backdrop-blur-md shadow-md transition-all group-hover:scale-105 btn-tactile">
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span>View Fullscreen</span>
                  </div>
                </div>

                {/* Multi-Image Tabs / Thumbnails if > 1 image */}
                {galleryImages.length > 1 && (
                  <div className="flex items-center gap-2.5 p-3.5 bg-muted/30 border-t overflow-x-auto scrollbar-none touch-pan-x">
                    <span className="text-xs font-bold text-muted-foreground mr-1 flex items-center gap-1 shrink-0">
                      <ImageIcon className="h-3.5 w-3.5 text-primary" /> Photos:
                    </span>
                    {galleryImages.map((img, idx) => (
                      <button
                        key={img.key}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all min-h-[44px] shrink-0 cursor-pointer ${
                          activeImageIndex === idx
                            ? 'bg-primary text-primary-foreground border-primary shadow-xs ring-2 ring-primary/30'
                            : 'bg-card text-muted-foreground hover:text-foreground hover:bg-muted/80 border-border'
                        }`}
                      >
                        <img src={img.url} alt={img.label} className="w-6 h-6 rounded-md object-cover border" />
                        <span>{img.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-3 bg-gradient-to-r from-primary via-teal-600 to-emerald-600" />
            )}

            <CardHeader className="pb-4 pt-6 px-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className={`inline-flex text-[11px] font-bold px-3 py-1 rounded-full border ${badgeClass}`}
                >
                  {business.category}
                </span>

                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-3 py-1 rounded-full shadow-2xs ${
                    isDaine2
                      ? 'bg-purple-100 text-purple-900 dark:bg-purple-950/80 dark:text-purple-200 border border-purple-300 dark:border-purple-800'
                      : 'bg-blue-100 text-blue-900 dark:bg-blue-950/80 dark:text-blue-200 border border-blue-300 dark:border-blue-800'
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  {isDaine2 ? 'Barangay Daine II' : 'Barangay Daine I'}
                </span>

                {business.purok && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                    <MapPin className="h-3 w-3 text-primary" />
                    {business.purok}
                  </span>
                )}

                {/* Operating hours live pulsing badge */}
                <span
                  className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full shadow-2xs border ${openStatus.badgeClass}`}
                >
                  {openStatus.label === 'Open Now' || openStatus.label === 'Open 24/7' ? (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-200"></span>
                      </span>
                      <span>{openStatus.label === 'Open 24/7' ? 'Open 24/7' : 'Open Now'}</span>
                    </>
                  ) : openStatus.label === 'Closed Now' ? (
                    <>
                      <span className="h-2 w-2 rounded-full bg-rose-200 inline-block"></span>
                      <span>Closed Now</span>
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3 text-slate-300" />
                      <span>Hours Not Listed</span>
                    </>
                  )}
                </span>

                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 px-3 py-1 rounded-full inline-flex items-center gap-1 shadow-2xs">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Verified Local Business
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight text-foreground">
                {business.name}
              </h1>
            </CardHeader>

            <CardContent className="space-y-5 px-6 pb-6">
              <Separator />
              <div>
                <h2 className="font-bold mb-2.5 text-sm text-foreground">
                  About the Business
                </h2>
                <p className="text-foreground/90 leading-relaxed text-sm sm:text-base whitespace-pre-wrap">
                  {business.description || 'No detailed description provided for this business listing.'}
                </p>
              </div>

              {/* Accepted Payments */}
              {business.payment_methods && business.payment_methods.length > 0 && (
                <div className="pt-2">
                  <h2 className="font-bold mb-2.5 text-sm text-foreground flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-primary" /> Accepted Payment Methods
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {business.payment_methods.map((method: string) => (
                      <span
                        key={method}
                        className="text-xs font-bold px-3 py-1 rounded-lg bg-muted text-foreground border shadow-2xs"
                      >
                        {method}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Owner Verified Resident Badge */}
              {business.ownerBadge && (
                <div className="pt-2">
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/20 text-xs shadow-xs">
                    <UserCheck className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="font-bold text-foreground text-sm">
                        Registered Daine Resident Owner: {business.ownerBadge.full_name || 'Verified Resident'}
                      </p>
                      <p className="text-muted-foreground text-xs mt-0.5 font-medium">
                        {business.ownerBadge.barangay === 'daine_2' ? 'Barangay Daine II' : 'Barangay Daine I'}
                        {business.ownerBadge.purok ? ` • ${business.ownerBadge.purok}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location & Directions Section */}
          <Card className="overflow-hidden border shadow-sm rounded-2xl">
            <CardHeader className="py-4 pb-3 px-6">
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" /> Location &amp; Directions
                </h2>
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-bold min-h-[44px] px-2.5 rounded-lg btn-tactile"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  <span>Open Directions</span>
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
            <CardContent className="py-3.5 px-6 bg-muted/20 border-t flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="font-medium text-foreground">
                  {business.purok ? `${business.purok}, ` : ''}{business.address}
                </span>
              </div>
              <a
                href={mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline font-bold min-h-[44px] items-center"
              >
                <span>View Full Map</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Contact & Details Box */}
          <Card className="border shadow-sm rounded-2xl">
            <CardHeader className="pb-3 px-5">
              <h2 className="font-bold text-sm text-foreground">
                Contact &amp; Details
              </h2>
            </CardHeader>
            <CardContent className="space-y-4 px-5 pb-5">
              <InfoRow icon={MapPin} label="Address">
                {business.purok ? `${business.purok}, ` : ''}{business.address}
              </InfoRow>

              {business.phone && (
                <InfoRow icon={Phone} label="Phone Number">
                  <a
                    href={`tel:${business.phone.replace(/[^0-9+]/g, '')}`}
                    className="text-primary hover:underline font-bold min-h-[44px] inline-flex items-center gap-1"
                  >
                    <span>{business.phone}</span>
                  </a>
                </InfoRow>
              )}

              {messengerUrl && (
                <InfoRow icon={MessageCircle} label="Facebook Messenger">
                  <a
                    href={messengerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-700 dark:text-sky-400 hover:underline font-bold inline-flex items-center gap-1.5 min-h-[44px]"
                  >
                    <span>Chat on Messenger</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </InfoRow>
              )}

              {business.hours && (
                <InfoRow icon={Clock} label="Operating Hours">
                  <div className="space-y-1.5">
                    <p>{business.hours}</p>
                    <div>
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${openStatus.badgeClass}`}
                      >
                        {openStatus.label === 'Open Now' || openStatus.label === 'Open 24/7' ? (
                          <>
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-200"></span>
                            </span>
                            <span>{openStatus.label}</span>
                          </>
                        ) : openStatus.label === 'Closed Now' ? (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-200 inline-block"></span>
                            <span>Closed Now</span>
                          </>
                        ) : (
                          <span>Hours Not Listed</span>
                        )}
                      </span>
                    </div>
                  </div>
                </InfoRow>
              )}

              {business.map_url && (
                <InfoRow icon={Navigation} label="Map Link">
                  <a
                    href={business.map_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-bold inline-flex items-center gap-1 min-h-[44px]"
                  >
                    <span>View on External Map</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </InfoRow>
              )}
            </CardContent>
          </Card>

          {/* Desktop Instant Action CTAs */}
          <div className="space-y-3 hidden md:block">
            {business.phone && (
              <Button
                asChild
                className="w-full min-h-[48px] text-base font-bold shadow-md gap-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl btn-tactile"
                size="lg"
              >
                <a href={`tel:${business.phone.replace(/[^0-9+]/g, '')}`}>
                  <Phone className="h-5 w-5" />
                  Call Now ({business.phone})
                </a>
              </Button>
            )}

            {messengerUrl && (
              <Button
                asChild
                className="w-full min-h-[48px] text-base font-bold shadow-md gap-2 bg-sky-700 hover:bg-sky-800 active:bg-sky-900 text-white rounded-xl btn-tactile"
                size="lg"
              >
                <a href={messengerUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-5 w-5" />
                  Chat on Messenger
                </a>
              </Button>
            )}

            <Button
              asChild
              variant="outline"
              className="w-full min-h-[48px] text-base font-bold shadow-xs gap-2 rounded-xl btn-tactile border-border hover:border-primary/50"
              size="lg"
            >
              <a href={mapLink} target="_blank" rel="noopener noreferrer">
                <Navigation className="h-5 w-5 text-primary" />
                Get Directions
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Floating Sticky CTA Bottom Bar */}
      {(business.phone || messengerUrl || mapLink) && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-3 bg-background/95 backdrop-blur-md border-t z-40 shadow-2xl flex gap-2">
          {business.phone && (
            <Button
              asChild
              className="flex-1 min-h-[48px] text-sm font-bold shadow-lg gap-1.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl btn-tactile"
              size="lg"
            >
              <a href={`tel:${business.phone.replace(/[^0-9+]/g, '')}`}>
                <Phone className="h-4 w-4" />
                Call
              </a>
            </Button>
          )}
          {messengerUrl && (
            <Button
              asChild
              className="flex-1 min-h-[48px] text-sm font-bold shadow-lg gap-1.5 bg-sky-700 hover:bg-sky-800 active:bg-sky-900 text-white rounded-xl btn-tactile"
              size="lg"
            >
              <a href={messengerUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" />
                Messenger
              </a>
            </Button>
          )}
          <Button
            asChild
            variant="outline"
            className="min-h-[48px] px-3 font-bold shadow-xs gap-1 rounded-xl btn-tactile border-border"
            size="lg"
          >
            <a href={mapLink} target="_blank" rel="noopener noreferrer" aria-label="Open directions in map">
              <Navigation className="h-4 w-4 text-primary" />
            </a>
          </Button>
        </div>
      )}

      {/* Fullscreen Lightbox Dialog */}
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
                width="1200"
                height="800"
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
              />

              {galleryImages.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white min-h-[44px] min-w-[44px] flex items-center justify-center transition-all cursor-pointer"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white min-h-[44px] min-w-[44px] flex items-center justify-center transition-all cursor-pointer"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            {galleryImages.length > 1 && (
              <div className="flex items-center justify-center gap-3 p-3.5 bg-black/80 border-t border-white/10 overflow-x-auto">
                {galleryImages.map((img, idx) => (
                  <button
                    key={img.key}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all min-h-[44px] cursor-pointer ${
                      activeImageIndex === idx
                        ? 'bg-primary text-white border-primary ring-2 ring-white/50'
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
