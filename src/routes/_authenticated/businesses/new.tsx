import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { getAuthSession } from '#/server/auth'
import { toast } from 'sonner'
import { useState } from 'react'
import { BusinessForm, businessFormSchema, type BusinessFormValues } from '#/components/businesses/BusinessForm'
import {
  Store,
  Sparkles,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  ArrowLeft,
  Users,
  Eye,
  BadgeCheck,
  TrendingUp,
  MessageCircle,
  PhoneCall
} from 'lucide-react'
import { Button } from '#/components/ui/button'

const createBusiness = createServerFn({ method: 'POST' })
  .validator((data: unknown) => businessFormSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const { session } = await getAuthSession()
    
    if (!session) {
      throw new Error('Not authenticated')
    }

    const { data: inserted, error } = await supabase.from('businesses').insert({
      owner_id: session.user.id,
      name: data.name,
      category: data.category,
      barangay: data.barangay,
      purok: data.purok || null,
      address: data.address,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      phone: data.phone,
      messenger_link: data.messenger_link || null,
      payment_methods: data.payment_methods?.length ? data.payment_methods : ['Cash', 'GCash'],
      hours: data.hours || '',
      description: data.description || '',
      map_url: data.map_url || '',
      photo_url: data.photo_url || null,
      menu_image_url: data.menu_image_url || null,
      misc_image_url: data.misc_image_url || null,
      status: 'pending',
    }).select('id').single()

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, id: inserted.id }
  })

export const Route = createFileRoute('/_authenticated/businesses/new')({
  head: () => ({
    meta: [
      {
        title: 'MSME Merchant Onboarding | Barangay Daine Connect',
      },
      {
        name: 'description',
        content:
          'Register and list your local sari-sari store, eatery, clinic, or service on the official Barangay Daine MSME Directory for free.',
      },
    ],
  }),
  component: NewBusinessRoute,
})

function NewBusinessRoute() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  async function handleSubmit(values: BusinessFormValues) {
    try {
      setIsSubmitting(true)
      await createBusiness({ data: values })
      toast.success('Business listing submitted! It will appear on the directory once approved.')
      navigate({ to: '/dashboard' })
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create business listing')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate({ to: '/dashboard' })
  }

  return (
    <div className="container mx-auto py-6 sm:py-10 px-4 md:px-6 max-w-6xl space-y-8">
      
      {/* Navigation Breadcrumb & Back Link */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          asChild
          className="min-h-[44px] px-3 font-semibold rounded-xl text-muted-foreground hover:text-foreground -ml-2 gap-1.5"
        >
          <Link to="/directory">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to MSME Directory</span>
          </Link>
        </Button>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Link to="/dashboard" className="hover:underline">Dashboard</Link>
          <span>/</span>
          <Link to="/directory" className="hover:underline">Directory</Link>
          <span>/</span>
          <span className="text-foreground">Merchant Registration</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MSME Merchant Onboarding Hero Banner with Benefits Checklist       */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0038A8] via-[#002d87] to-teal-900 text-white p-6 sm:p-8 md:p-10 shadow-xl border border-white/15">
        {/* Glow & micro-pattern accents */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] bg-[size:28px_28px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-6">
          
          {/* Header Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-xs sm:text-sm font-bold tracking-wide border border-white/30 text-amber-200 shadow-xs">
            <Sparkles className="h-4 w-4 text-amber-300 fill-amber-300" />
            <span>Barangay Daine MSME Merchant Onboarding</span>
          </div>

          {/* Main Title & Narrative */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight drop-shadow-xs">
              List Your Business &amp; Connect With Neighbors
            </h1>
            <p className="text-white/90 text-sm sm:text-base md:text-lg max-w-3xl leading-relaxed">
              Empower your local enterprise with direct community reach across Barangay Daine 1 and Daine 2. From sari-sari stores and carenderias to repair shops, water stations, and home-based services — gain 24/7 visibility with all registered residents.
            </p>
          </div>

          {/* 3 Core Benefits Checklist Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            
            {/* Benefit 1: Free Community Listing */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 space-y-2 transition-all hover:bg-white/15">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-400 text-slate-950 font-black shrink-0 shadow-xs">
                  <BadgeCheck className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-bold text-white leading-tight">100% Free Community Listing</h2>
              </div>
              <p className="text-xs text-white/80 leading-relaxed">
                Zero listing fees or monthly commissions. Showcase your products, menu, hours, and rates to thousands of local residents.
              </p>
            </div>

            {/* Benefit 2: Interactive GIS Map Pin */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 space-y-2 transition-all hover:bg-white/15">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-300 text-teal-950 font-black shrink-0 shadow-xs">
                  <MapPin className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-bold text-white leading-tight">Interactive GIS Map Pin</h2>
              </div>
              <p className="text-xs text-white/80 leading-relaxed">
                Get your storefront pinned on the official Barangay Interactive Map with coordinates and turn-by-turn navigation.
              </p>
            </div>

            {/* Benefit 3: Resident Verification */}
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 space-y-2 transition-all hover:bg-white/15">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-300 text-emerald-950 font-black shrink-0 shadow-xs">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-bold text-white leading-tight">Resident Verification &amp; Trust</h2>
              </div>
              <p className="text-xs text-white/80 leading-relaxed">
                Gain the official "Verified Local Merchant" badge with instant 1-tap phone calls and direct Facebook Messenger chats.
              </p>
            </div>

          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-white/90 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Fast 24-Hour Barangay Review</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Covers Both Daine 1 &amp; Daine 2</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Live Open/Closed Status Indicator</span>
            </div>
          </div>

        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* Business Form Container                                            */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
              <Store className="h-6 w-6 text-primary" />
              Merchant Registration Form
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Fill in your business details below. You can update your information, hours, or photos anytime after approval.
            </p>
          </div>
        </div>

        <BusinessForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>

    </div>
  )
}
