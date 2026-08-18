import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Separator } from '#/components/ui/separator'
import {
  Phone,
  ShieldAlert,
  Flame,
  Stethoscope,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react'

import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'

const getEmergencyContacts = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase.from('emergency_contacts').select('id, name, label, phone, display_order, barangay').order('display_order', { ascending: true })
    if (error) console.error('Error fetching emergency contacts:', error)
    return data ?? []
  } catch (error) {
    console.error('Error in getEmergencyContacts:', error)
    return []
  }
})

export const Route = createFileRoute('/emergency')({
  component: EmergencyRoute,
  loader: () => getEmergencyContacts(),
})

const CATEGORY_STYLES: Record<string, any> = {
  'Barangay Daine 1 Responders': {
    icon: ShieldAlert,
    color: 'text-blue-700 dark:text-blue-400',
    borderColor: 'border-l-blue-500',
    bgAccent: 'bg-blue-50 dark:bg-blue-950/20',
  },
  'Barangay Daine 2 Responders': {
    icon: ShieldAlert,
    color: 'text-red-700 dark:text-red-400',
    borderColor: 'border-l-red-500',
    bgAccent: 'bg-red-50 dark:bg-red-950/20',
  },
  'Police / Law Enforcement': {
    icon: ShieldCheck,
    color: 'text-blue-700 dark:text-blue-400',
    borderColor: 'border-l-blue-500',
    bgAccent: 'bg-blue-50 dark:bg-blue-950/20',
  },
  'Fire Station': {
    icon: Flame,
    color: 'text-red-700 dark:text-red-400',
    borderColor: 'border-l-red-500',
    bgAccent: 'bg-red-50 dark:bg-red-950/20',
  },
  'Medical / Health': {
    icon: Stethoscope,
    color: 'text-emerald-800 dark:text-emerald-400',
    borderColor: 'border-l-emerald-600',
    bgAccent: 'bg-emerald-50 dark:bg-emerald-950/20',
  }
}

const FALLBACK_STYLE = {
  icon: AlertTriangle,
  color: 'text-slate-700 dark:text-slate-400',
  borderColor: 'border-l-slate-500',
  bgAccent: 'bg-slate-50 dark:bg-slate-950/20',
}

import { useBarangayScope } from '#/hooks/useBarangayScope'
import { useMemo } from 'react'

function EmergencyRoute() {
  const allContacts = Route.useLoaderData()
  const { scope } = useBarangayScope()
  
  const contacts = useMemo(() => {
    return allContacts.filter((c: any) => {
      // If contact is tied to a specific barangay (e.g. ops desk), filter by scope
      if (c.barangay && c.barangay !== 'both') {
        const dbScope = scope === 'daine1' ? 'daine_1' : 'daine_2'
        if (scope !== 'all' && c.barangay !== dbScope) return false
      }
      return true
    })
  }, [allContacts, scope])

  // Group by label
  const groupedContacts = contacts.reduce((acc: any, curr: any) => {
    const label = curr.label || 'Other'
    if (!acc[label]) acc[label] = []
    acc[label].push(curr)
    return acc
  }, {})

  const sections = Object.entries(groupedContacts).map(([category, items]: [string, any]) => {
    return {
      category,
      ...CATEGORY_STYLES[category] ?? FALLBACK_STYLE,
      contacts: items
    }
  })

  return (
    <div className="min-h-screen">
      {/* Urgent header banner */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white py-10 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="flex-shrink-0 p-4 bg-white/15 rounded-2xl backdrop-blur-sm ring-1 ring-white/20">
              <AlertTriangle className="h-10 w-10 text-white" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
                Emergency Contacts
              </h1>
              <p className="text-red-50 text-sm md:text-base max-w-xl leading-relaxed font-normal">
                In case of emergency, contact the appropriate authorities{' '}
                <strong className="text-white font-bold underline decoration-yellow-400 underline-offset-2">immediately</strong>. Save these
                numbers or bookmark this page.
              </p>
            </div>
          </div>

          {/* National hotlines row */}
          <div className="mt-8 flex flex-wrap gap-3 justify-center sm:justify-start">
            {[
              { label: 'National Emergency', number: '911' },
              { label: 'Red Cross', number: '143' },
              { label: 'PNP Hotline', number: '117' },
            ].map(({ label, number }) => (
              <a
                key={number}
                href={`tel:${number}`}
                className="flex items-center gap-3 bg-white/15 hover:bg-white/25 active:bg-white/30 transition-colors backdrop-blur-sm rounded-xl px-4 py-3 ring-1 ring-white/20 min-h-[48px] shadow-sm"
              >
                <Phone className="h-5 w-5 text-yellow-300 shrink-0" />
                <div className="text-left">
                  <p className="text-[10px] text-red-50 font-semibold uppercase tracking-wide leading-none mb-1">
                    {label}
                  </p>
                  <p className="text-2xl font-extrabold leading-none tracking-tight">{number}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Cards grid */}
      <div className="container mx-auto max-w-4xl py-10 px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sections.map((section, idx) => (
            <Card
              key={idx}
              className={`border-l-4 ${section.borderColor} shadow-sm overflow-hidden`}
            >
              <CardHeader className={`pb-3 ${section.bgAccent}`}>
                <div className="flex items-center gap-2.5">
                  <section.icon className={`h-5 w-5 ${section.color} shrink-0`} />
                  <CardTitle className="text-base font-bold">{section.category}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-5">
                {section.contacts.map((contact: any, cIdx: number) => {
                  const numbers = contact.phone ? contact.phone.split(',').map((n: string) => n.trim()) : []
                  return (
                    <div key={cIdx}>
                      {cIdx > 0 && <Separator className="mb-5" />}
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        {contact.name}
                      </p>
                      <div className="flex flex-col gap-3">
                        {numbers.map((number: string, nIdx: number) => (
                          <div
                            key={nIdx}
                            className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors"
                          >
                            <a
                              href={`tel:${number.replace(/[^0-9+]/g, '')}`}
                              className="text-xl sm:text-2xl font-bold tracking-tight hover:text-primary transition-colors min-h-[44px] flex items-center"
                            >
                              {number}
                            </a>
                            <Button
                              asChild
                              size="default"
                              className="shrink-0 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold min-h-[44px] px-4 rounded-xl shadow-sm"
                            >
                              <a href={`tel:${number.replace(/[^0-9+]/g, '')}`}>
                                <Phone className="h-4 w-4 mr-1.5" />
                                Call
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-muted-foreground mt-10 max-w-lg mx-auto">
          Contact numbers are regularly verified by Barangay Daine. If you
          notice an outdated number, please visit the Barangay Hall or call the
          emergency hotline.
        </p>
      </div>
    </div>
  )
}
