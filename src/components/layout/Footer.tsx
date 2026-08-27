import { Link } from '@tanstack/react-router'

export function Footer() {
  return (
    <footer className="bg-muted text-muted-foreground py-8 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <img
            src="/logo.jpg"
            alt="Barangay Daine Logo"
            width="32"
            height="32"
            className="h-8 w-8 rounded-full object-cover grayscale opacity-70"
          />
          <span className="font-semibold text-sm">© {new Date().getFullYear()} Barangay Daine, Indang, Cavite. All rights reserved.</span>
        </div>
        <div className="flex gap-6 text-sm">
          <Link to="/privacy" className="min-h-[44px] inline-flex items-center hover:text-primary transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="min-h-[44px] inline-flex items-center hover:text-primary transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  )
}
