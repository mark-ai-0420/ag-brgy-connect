import { useState } from 'react';
import { PhoneCall, ShieldAlert, Siren, Flame, HeartPulse, Map, X } from 'lucide-react';
import { Link } from '@tanstack/react-router';

import { useBarangayScope } from '#/hooks/useBarangayScope';

export function EmergencySpeedDial() {
  const [isOpen, setIsOpen] = useState(false);
  const { scope } = useBarangayScope();

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 md:left-6 z-40">
      {isOpen && (
        <div
          role="dialog"
          aria-label="Emergency Contacts Menu"
          aria-modal="true"
          className="mb-4 w-72 bg-background border rounded-xl shadow-lg overflow-hidden flex flex-col"
        >
          <div className="bg-destructive/10 text-destructive p-4 flex justify-between items-center border-b border-destructive/20">
            <h3 className="font-bold flex items-center gap-2">
              <Siren className="w-5 h-5 animate-pulse" />
              Emergency Contacts
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-destructive/20 p-1 rounded-full text-destructive"
              aria-label="Close emergency contacts menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-2 flex flex-col gap-1 max-h-[60vh] overflow-y-auto">
            {(scope === 'all' || scope === 'daine1') && (
              <a
                href="tel:09171230001"
                className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors group"
                aria-label="Call Brgy Daine 1 Ops Desk at 0917-123-0001"
              >
                <div className="bg-primary/10 text-primary p-2 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Brgy Daine 1 Ops Desk</p>
                  <p className="text-xs text-muted-foreground">0917-123-0001</p>
                </div>
              </a>
            )}

            {(scope === 'all' || scope === 'daine2') && (
              <a
                href="tel:09171230002"
                className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors group"
                aria-label="Call Brgy Daine 2 Ops Desk at 0917-123-0002"
              >
                <div className="bg-destructive/10 text-destructive p-2 rounded-full group-hover:bg-destructive group-hover:text-primary-foreground transition-colors">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Brgy Daine 2 Ops Desk</p>
                  <p className="text-xs text-muted-foreground">0917-123-0002</p>
                </div>
              </a>
            )}
            
            <a
              href="tel:0464150322"
              className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors group"
              aria-label="Call BFP Indang Fire Station at (046) 415-0322"
            >
              <div className="bg-orange-500/10 text-orange-600 p-2 rounded-full group-hover:bg-orange-500 group-hover:text-white transition-colors">
                <Flame className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">BFP Indang Fire Station</p>
                <p className="text-xs text-muted-foreground">(046) 415-0322</p>
              </div>
            </a>
            
            <a
              href="tel:0464150211"
              className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors group"
              aria-label="Call PNP Indang Police at (046) 415-0211"
            >
              <div className="bg-blue-500/10 text-blue-600 p-2 rounded-full group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <Siren className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">PNP Indang Police</p>
                <p className="text-xs text-muted-foreground">(046) 415-0211</p>
              </div>
            </a>
            
            <a
              href="tel:0464150102"
              className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors group"
              aria-label="Call Rural Health and Ambulance at (046) 415-0102"
            >
              <div className="bg-green-500/10 text-green-600 p-2 rounded-full group-hover:bg-green-500 group-hover:text-white transition-colors">
                <HeartPulse className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Rural Health & Ambulance</p>
                <p className="text-xs text-muted-foreground">(046) 415-0102</p>
              </div>
            </a>

            <a
              href="tel:09285550102"
              className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors group"
              aria-label="Call Brgy Tanod Outpost at 0928-555-0102"
            >
              <div className="bg-yellow-500/10 text-yellow-600 p-2 rounded-full group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Brgy Tanod Outpost</p>
                <p className="text-xs text-muted-foreground">0928-555-0102</p>
              </div>
            </a>
          </div>

          <div className="p-3 border-t bg-muted/50 flex flex-col gap-2">
            <Link
              to="/emergency"
              className="text-xs text-center font-medium hover:underline text-primary"
              onClick={() => setIsOpen(false)}
              aria-label="View all emergency services"
            >
              View All Emergency Services
            </Link>
            <Link
              to="/map"
              className="flex items-center justify-center gap-2 text-xs font-medium hover:underline text-primary"
              onClick={() => setIsOpen(false)}
              aria-label="View evacuation map"
            >
              <Map className="w-3 h-3" />
              View Evacuation Map
            </Link>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-all duration-300 ${
          isOpen ? 'bg-muted text-foreground rotate-45 scale-90' : 'bg-destructive text-destructive-foreground hover:scale-105'
        }`}
        aria-label={isOpen ? 'Close emergency contact speed dial' : 'Open emergency contact speed dial'}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="w-6 h-6" /> : (
          <div className="relative flex items-center justify-center">
             <PhoneCall className="w-6 h-6 animate-pulse" />
             <div className="absolute inset-0 rounded-full animate-ping bg-destructive/50 -z-10" />
          </div>
        )}
      </button>
    </div>
  );
}
