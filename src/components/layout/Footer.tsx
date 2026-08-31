import { Link } from '@tanstack/react-router'
import { ShieldAlert, FileText, PhoneCall, MapPin, ExternalLink, Globe } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-card text-card-foreground border-t border-border mt-auto">
      {/* Top Civic Banner */}
      <div className="border-b border-border/60 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img
                src="/logo.jpg"
                alt="Barangay Daine Official Seal"
                width="48"
                height="48"
                className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/20 shadow-sm shrink-0"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-extrabold tracking-wider text-[#002878] dark:text-[#93c5fd] uppercase bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                    Republic of the Philippines
                  </span>
                  <span className="text-xs text-foreground/80 dark:text-muted-foreground font-semibold">
                    Province of Cavite &bull; Municipality of Indang
                  </span>
                </div>
                <h2 className="text-base font-extrabold text-foreground tracking-tight mt-1">
                  BrgyConnect &bull; Barangay Daine Digital Portal
                </h2>
                <p className="text-xs text-muted-foreground">
                  Serving Barangay Daine 1 and Barangay Daine 2 with transparent, fast, and accessible digital governance.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/emergency"
                className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#CE1126] hover:bg-[#b00e1f] active:bg-[#960c1a] transition-all shadow-sm btn-tactile cursor-pointer"
              >
                <PhoneCall className="h-4 w-4" />
                Emergency Hotline Dial
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          
          {/* Col 1: Barangay Services */}
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-primary" />
              Civic Services
            </h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>
                <Link to="/documents" className="min-h-[44px] inline-flex items-center hover:text-primary transition-colors">
                  Request Barangay Clearance
                </Link>
              </li>
              <li>
                <Link to="/documents" className="min-h-[44px] inline-flex items-center hover:text-primary transition-colors">
                  Certificate of Indigency & Residency
                </Link>
              </li>
              <li>
                <Link to="/track" className="min-h-[44px] inline-flex items-center hover:text-primary transition-colors">
                  Track Document Status
                </Link>
              </li>
              <li>
                <Link to="/complaints" className="min-h-[44px] inline-flex items-center hover:text-primary transition-colors">
                  File Incident & Blotter Report
                </Link>
              </li>
              <li>
                <Link to="/directory" className="min-h-[44px] inline-flex items-center hover:text-primary transition-colors">
                  Local Merchant Directory
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 2: Community & Governance */}
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-primary" />
              Community & Portal
            </h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>
                <Link to="/announcements" className="min-h-[44px] inline-flex items-center hover:text-primary transition-colors">
                  Bulletins & Advisories
                </Link>
              </li>
              <li>
                <Link to="/events" className="min-h-[44px] inline-flex items-center hover:text-primary transition-colors">
                  Community Calendar
                </Link>
              </li>
              <li>
                <Link to="/officials" className="min-h-[44px] inline-flex items-center hover:text-primary transition-colors">
                  Barangay Officials
                </Link>
              </li>
              <li>
                <Link to="/map" className="min-h-[44px] inline-flex items-center hover:text-primary transition-colors">
                  Interactive GIS & Evacuation
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Emergency Contacts */}
          <div>
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-[#CE1126]" />
              Hotlines & Support
            </h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>
                <a href="tel:09171230001" className="min-h-[44px] inline-flex items-center hover:text-primary transition-colors">
                  Daine 1 Desk: <span className="font-mono ml-1.5 font-semibold text-foreground">0917-123-0001</span>
                </a>
              </li>
              <li>
                <a href="tel:09171230002" className="min-h-[44px] inline-flex items-center hover:text-primary transition-colors">
                  Daine 2 Desk: <span className="font-mono ml-1.5 font-semibold text-foreground">0917-123-0002</span>
                </a>
              </li>
              <li>
                <a href="tel:0464150322" className="min-h-[44px] inline-flex items-center hover:text-primary transition-colors">
                  BFP Indang Fire: <span className="font-mono ml-1.5 font-semibold text-foreground">(046) 415-0322</span>
                </a>
              </li>
              <li>
                <a href="tel:0464150211" className="min-h-[44px] inline-flex items-center hover:text-primary transition-colors">
                  PNP Indang Police: <span className="font-mono ml-1.5 font-semibold text-foreground">(046) 415-0211</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Republic of the Philippines & Municipal Seal */}
          <div className="flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-[#FCD116]" />
                Municipal Jurisdiction
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Barangay Hall Complex, Barangay Daine, Municipality of Indang, Province of Cavite 4122, Philippines.
              </p>
              <div className="p-3 bg-muted/60 rounded-xl border border-border/80 text-[11px] text-muted-foreground">
                <p className="font-bold text-foreground mb-0.5">Philippine Standard Time (PST)</p>
                <p>UTC+8 &bull; Office Hours: Mon - Fri (8:00 AM - 5:00 PM)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border bg-muted/40 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2.5 text-center md:text-left">
            <span>
              &copy; {currentYear} Barangay Daine, Indang, Cavite. Republic of the Philippines. All rights reserved.
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            <Link to="/privacy" className="min-h-[44px] inline-flex items-center hover:text-primary font-medium transition-colors">
              Privacy Policy & Data Privacy Act of 2012
            </Link>
            <Link to="/terms" className="min-h-[44px] inline-flex items-center hover:text-primary font-medium transition-colors">
              Terms of Service
            </Link>
            <Link to="/emergency" className="min-h-[44px] inline-flex items-center hover:text-primary font-medium transition-colors">
              Disaster Preparedness
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
