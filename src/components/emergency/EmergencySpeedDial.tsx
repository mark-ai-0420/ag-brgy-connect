import { useState } from 'react'
import { PhoneCall, ShieldAlert, Siren, Flame, HeartPulse, Map, X, Radio } from 'lucide-react'
import { Link } from '@tanstack/react-router'

import { useBarangayScope } from '#/hooks/useBarangayScope'

export function EmergencySpeedDial() {
  const [isOpen, setIsOpen] = useState(false)
  const { scope } = useBarangayScope()

  const scopeLabel = scope === 'daine1' ? 'Daine 1' : scope === 'daine2' ? 'Daine 2' : 'All Daine'

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 md:left-6 z-40">
      {isOpen && (
        <div
          role="dialog"
          aria-label="Emergency Hotline Contacts"
          aria-modal="true"
          className="mb-3 w-80 bg-card text-card-foreground border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col glass-dock animate-in slide-in-from-bottom-3 fade-in-0 duration-200"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#CE1126] to-[#a50e1e] text-white px-4 py-3.5 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center">
                <Siren className="w-5 h-5 text-yellow-300 animate-pulse" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm leading-tight tracking-tight">Emergency Hotlines</h3>
                <p className="text-[10px] text-white/85 font-medium">Quick Dial &bull; {scopeLabel}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 active:bg-white/30 p-1.5 rounded-full text-white transition-colors cursor-pointer"
              aria-label="Close emergency speed dial"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Hotlines List */}
          <div className="p-2 flex flex-col gap-1.5 max-h-[60vh] overflow-y-auto">
            {(scope === 'all' || scope === 'daine1') && (
              <a
                href="tel:09171230001"
                className="flex items-center gap-3 p-2.5 hover:bg-muted active:bg-muted/80 rounded-xl transition-all group min-h-[48px] btn-tactile border border-transparent hover:border-border/60"
                aria-label="Call Brgy Daine 1 Ops Desk at 0917-123-0001"
              >
                <div className="bg-blue-500/15 text-blue-600 dark:text-blue-400 p-2.5 rounded-xl group-hover:bg-[#0038A8] group-hover:text-white transition-colors shadow-xs">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Daine 1 Ops Desk</p>
                  <p className="text-xs font-mono font-semibold text-muted-foreground group-hover:text-foreground transition-colors">0917-123-0001</p>
                </div>
                <PhoneCall className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
            )}

            {(scope === 'all' || scope === 'daine2') && (
              <a
                href="tel:09171230002"
                className="flex items-center gap-3 p-2.5 hover:bg-muted active:bg-muted/80 rounded-xl transition-all group min-h-[48px] btn-tactile border border-transparent hover:border-border/60"
                aria-label="Call Brgy Daine 2 Ops Desk at 0917-123-0002"
              >
                <div className="bg-red-500/15 text-[#CE1126] dark:text-red-400 p-2.5 rounded-xl group-hover:bg-[#CE1126] group-hover:text-white transition-colors shadow-xs">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-foreground group-hover:text-destructive transition-colors">Daine 2 Ops Desk</p>
                  <p className="text-xs font-mono font-semibold text-muted-foreground group-hover:text-foreground transition-colors">0917-123-0002</p>
                </div>
                <PhoneCall className="w-3.5 h-3.5 text-muted-foreground group-hover:text-destructive transition-colors" />
              </a>
            )}
            
            <a
              href="tel:0464150322"
              className="flex items-center gap-3 p-2.5 hover:bg-muted active:bg-muted/80 rounded-xl transition-all group min-h-[48px] btn-tactile border border-transparent hover:border-border/60"
              aria-label="Call BFP Indang Fire Station at (046) 415-0322"
            >
              <div className="bg-orange-500/15 text-orange-600 dark:text-orange-400 p-2.5 rounded-xl group-hover:bg-orange-500 group-hover:text-white transition-colors shadow-xs">
                <Flame className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-foreground group-hover:text-orange-600 transition-colors">BFP Indang Fire Station</p>
                <p className="text-xs font-mono font-semibold text-muted-foreground group-hover:text-foreground transition-colors">(046) 415-0322</p>
              </div>
              <PhoneCall className="w-3.5 h-3.5 text-muted-foreground group-hover:text-orange-600 transition-colors" />
            </a>
            
            <a
              href="tel:0464150211"
              className="flex items-center gap-3 p-2.5 hover:bg-muted active:bg-muted/80 rounded-xl transition-all group min-h-[48px] btn-tactile border border-transparent hover:border-border/60"
              aria-label="Call PNP Indang Police at (046) 415-0211"
            >
              <div className="bg-blue-500/15 text-blue-600 dark:text-blue-400 p-2.5 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-xs">
                <Siren className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-foreground group-hover:text-blue-600 transition-colors">PNP Indang Police</p>
                <p className="text-xs font-mono font-semibold text-muted-foreground group-hover:text-foreground transition-colors">(046) 415-0211</p>
              </div>
              <PhoneCall className="w-3.5 h-3.5 text-muted-foreground group-hover:text-blue-600 transition-colors" />
            </a>
            
            <a
              href="tel:0464150102"
              className="flex items-center gap-3 p-2.5 hover:bg-muted active:bg-muted/80 rounded-xl transition-all group min-h-[48px] btn-tactile border border-transparent hover:border-border/60"
              aria-label="Call Rural Health and Ambulance at (046) 415-0102"
            >
              <div className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-xs">
                <HeartPulse className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-foreground group-hover:text-emerald-600 transition-colors">Rural Health & Ambulance</p>
                <p className="text-xs font-mono font-semibold text-muted-foreground group-hover:text-foreground transition-colors">(046) 415-0102</p>
              </div>
              <PhoneCall className="w-3.5 h-3.5 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
            </a>

            <a
              href="tel:09285550102"
              className="flex items-center gap-3 p-2.5 hover:bg-muted active:bg-muted/80 rounded-xl transition-all group min-h-[48px] btn-tactile border border-transparent hover:border-border/60"
              aria-label="Call Brgy Tanod Outpost at 0928-555-0102"
            >
              <div className="bg-amber-500/15 text-amber-600 dark:text-amber-400 p-2.5 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-colors shadow-xs">
                <Radio className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-foreground group-hover:text-amber-600 transition-colors">Brgy Tanod Quick Response</p>
                <p className="text-xs font-mono font-semibold text-muted-foreground group-hover:text-foreground transition-colors">0928-555-0102</p>
              </div>
              <PhoneCall className="w-3.5 h-3.5 text-muted-foreground group-hover:text-amber-600 transition-colors" />
            </a>
          </div>

          {/* Footer actions */}
          <div className="p-2.5 border-t border-border/80 bg-muted/40 grid grid-cols-2 gap-2">
            <Link
              to="/emergency"
              className="flex items-center justify-center min-h-[44px] px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 rounded-xl transition-colors text-center"
              onClick={() => setIsOpen(false)}
              aria-label="View full directory of emergency hotlines"
            >
              All Hotlines
            </Link>
            <Link
              to="/map"
              className="flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-1.5 text-xs font-bold text-foreground hover:bg-accent rounded-xl transition-colors text-center"
              onClick={() => setIsOpen(false)}
              aria-label="View evacuation map"
            >
              <Map className="w-3.5 h-3.5 text-primary" />
              Evac Map
            </Link>
          </div>
        </div>
      )}

      {/* Floating Speed Dial Trigger (56px diameter) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-14 h-14 rounded-full shadow-[0_4px_24px_rgba(206,17,38,0.45)] hover:shadow-[0_8px_32px_rgba(206,17,38,0.65)] transition-all duration-200 border-2 border-white/40 cursor-pointer btn-tactile ${
          isOpen ? 'bg-muted text-foreground rotate-45 scale-95' : 'bg-[#CE1126] text-white hover:scale-105 active:scale-95'
        }`}
        aria-label={isOpen ? 'Close emergency hotline speed dial' : 'Open emergency hotline speed dial'}
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <div className="relative flex items-center justify-center">
            <PhoneCall className="w-6 h-6 animate-pulse" />
            <div className="absolute inset-0 rounded-full animate-ping bg-red-400/40 -z-10" />
          </div>
        )}
      </button>
    </div>
  )
}
