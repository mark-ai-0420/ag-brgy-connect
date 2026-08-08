import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader } from '#/components/ui/card'
import { Separator } from '#/components/ui/separator'
import {
  ArrowLeft,
  MapPin,
  Phone,
  Clock,
  ExternalLink,
  Store,
} from 'lucide-react'

const getBusiness = createServerFn({ method: 'GET' })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
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
  'Sari-Sari Store': 'bg-amber-100 text-amber-950 border border-amber-300 font-semibold',
  'Eatery / Carenderia': 'bg-orange-100 text-orange-950 border border-orange-300 font-semibold',
  'Water Station': 'bg-blue-100 text-blue-950 border border-blue-300 font-semibold',
  Laundry: 'bg-sky-100 text-sky-950 border border-sky-300 font-semibold',
  Salon: 'bg-pink-100 text-pink-950 border border-pink-300 font-semibold',
  'Repair Shop': 'bg-slate-100 text-slate-950 border border-slate-300 font-semibold',
  Clinic: 'bg-emerald-100 text-emerald-950 border border-emerald-300 font-semibold',
  Pharmacy: 'bg-teal-100 text-teal-950 border border-teal-300 font-semibold',
  Tailoring: 'bg-purple-100 text-purple-950 border border-purple-300 font-semibold',
  Others: 'bg-gray-100 text-gray-950 border border-gray-300 font-semibold',
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
      <div className="mt-0.5 p-1.5 bg-muted rounded-md shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
          {label}
        </p>
        <div className="text-sm">{children}</div>
      </div>
    </div>
  )
}

function BusinessDetail() {
  const business = Route.useLoaderData()

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

  // Build OpenStreetMap embed URL for Daine, Indang, Cavite
  const mapSrc = business.lat && business.lng
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${business.lng - 0.005}%2C${business.lat - 0.004}%2C${business.lng + 0.005}%2C${business.lat + 0.004}&layer=mapnik&marker=${business.lat}%2C${business.lng}`
    : 'https://www.openstreetmap.org/export/embed.html?bbox=120.840%2C14.183%2C120.850%2C14.192&layer=mapnik&marker=14.1875%2C120.8452'

  const mapLink = business.lat && business.lng
    ? `https://www.openstreetmap.org/?mlat=${business.lat}&mlon=${business.lng}#map=17/${business.lat}/${business.lng}`
    : 'https://www.openstreetmap.org/?mlat=14.1875&mlon=120.8452#map=16/14.1875/120.8452'

  return (
    <div className="container mx-auto py-8 md:py-10 px-4 md:px-6 max-w-5xl pb-24 md:pb-10">
      {/* Back */}
      <Button variant="ghost" asChild className="mb-6 -ml-2 text-muted-foreground hover:text-foreground min-h-[44px] px-3">
        <Link to="/directory">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Directory
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Hero card */}
          <Card className="overflow-hidden">
            {business.photo_url ? (
              <div className="w-full h-64 md:h-80 bg-muted">
                <img src={business.photo_url} alt={business.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="h-2 bg-gradient-to-r from-primary via-primary/80 to-primary/50" />
            )}
            <CardHeader className="pb-4 pt-6">
              <span
                className={`inline-flex self-start text-[11px] font-semibold px-2.5 py-0.5 rounded-full border mb-3 ${badgeClass}`}
              >
                {business.category}
              </span>
              <h1 className="text-2xl md:text-3xl font-bold leading-tight">
                {business.name}
              </h1>
            </CardHeader>
            <CardContent>
              <Separator className="mb-5" />
              <h2 className="font-semibold mb-2 text-sm uppercase tracking-wider text-muted-foreground">
                About
              </h2>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {business.description}
              </p>
            </CardContent>
          </Card>

          {/* Map embed */}
          <Card className="overflow-hidden">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={mapSrc}
                title={`Map of ${business.name}`}
                className="absolute inset-0 w-full h-full border-0"
                loading="lazy"
              />
            </div>
            <CardContent className="py-3">
              <a
                href={mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium min-h-[44px]"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open in OpenStreetMap
              </a>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Contact Info */}
          <Card>
            <CardHeader className="pb-3">
              <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                Contact & Hours
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow icon={MapPin} label="Address">
                {business.address}
              </InfoRow>
              {business.phone && (
                <InfoRow icon={Phone} label="Phone">
                  <a
                    href={`tel:${business.phone.replace(/[^0-9+]/g, '')}`}
                    className="text-primary hover:underline font-medium min-h-[44px] inline-flex items-center"
                  >
                    {business.phone}
                  </a>
                </InfoRow>
              )}
              <InfoRow icon={Clock} label="Hours">
                {business.hours}
              </InfoRow>
            </CardContent>
          </Card>

          {/* Call Now CTA Desktop */}
          {business.phone && (
            <Button asChild className="hidden md:inline-flex w-full min-h-[48px] text-base font-semibold shadow-md" size="lg">
              <a href={`tel:${business.phone.replace(/[^0-9+]/g, '')}`}>
                <Phone className="mr-2 h-5 w-5" />
                Call Now ({business.phone})
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Floating Sticky CTA */}
      {business.phone && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t z-40 shadow-2xl">
          <Button asChild className="w-full min-h-[48px] text-base font-semibold shadow-lg" size="lg">
            <a href={`tel:${business.phone.replace(/[^0-9+]/g, '')}`}>
              <Phone className="mr-2 h-5 w-5" />
              Call {business.phone}
            </a>
          </Button>
        </div>
      )}
    </div>
  )
}
