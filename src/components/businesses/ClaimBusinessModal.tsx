import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Sparkles, Store, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { submitBusinessClaim } from '#/server/businessClaims'

interface ClaimBusinessModalProps {
  business: {
    id: string
    name: string
    category: string
    barangay?: string
    purok?: string
    address?: string
  }
  user?: {
    id: string
    email?: string
    user_metadata?: { full_name?: string }
  } | null
  className?: string
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost'
  buttonSize?: 'default' | 'sm' | 'lg'
}

export function ClaimBusinessModal({
  business,
  user,
  className = '',
  buttonVariant = 'outline',
  buttonSize = 'default',
}: ClaimBusinessModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [claimantName, setClaimantName] = useState(user?.user_metadata?.full_name || '')
  const [claimantPhone, setClaimantPhone] = useState('')
  const [relationship, setRelationship] = useState<'Owner' | 'Co-Owner' | 'Manager' | 'Authorized Representative'>('Owner')
  const [proofNotes, setProofNotes] = useState('')
  const [proofImageUrl, setProofImageUrl] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!claimantName.trim()) {
      toast.error('Please enter your full name.')
      return
    }

    if (!claimantPhone.trim() || claimantPhone.length < 7) {
      toast.error('Please provide a valid contact number so the Barangay can verify your claim.')
      return
    }

    if (!proofNotes.trim() || proofNotes.length < 5) {
      toast.error('Please provide a brief statement, business permit #, or proof details.')
      return
    }

    setLoading(true)
    try {
      await submitBusinessClaim({
        data: {
          businessId: business.id,
          claimantName,
          claimantPhone,
          relationship,
          proofNotes,
          proofImageUrl: proofImageUrl.trim() || undefined,
        },
      })

      toast.success('Ownership Claim Submitted!', {
        description: `Your claim for "${business.name}" has been sent to Barangay staff for verification. You will be notified once reviewed.`,
      })
      setOpen(false)
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit claim. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={buttonVariant}
          size={buttonSize}
          className={`min-h-[44px] inline-flex items-center gap-2 font-bold cursor-pointer transition-all active:scale-[0.97] border-amber-500/30 text-amber-900 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 ${className}`}
          aria-label={`Claim ownership of ${business.name}`}
        >
          <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
          <span>Claim this Business</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-semibold w-fit mb-1 border border-amber-500/20">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Official Merchant Verification</span>
          </div>
          <DialogTitle className="text-xl font-black tracking-tight text-foreground">
            Claim "{business.name}"
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Are you the owner or registered operator of this establishment? Submit a claim to take ownership and manage this listing.
          </DialogDescription>
        </DialogHeader>

        {!user ? (
          <div className="py-6 flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Store className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-foreground">Resident Sign-In Required</h4>
              <p className="text-xs text-muted-foreground max-w-sm">
                To prevent unauthorized claims and protect local merchants, please sign in or register with your verified Barangay resident account.
              </p>
            </div>
            <div className="flex gap-3 w-full pt-2">
              <Link to="/auth/sign-in" className="flex-1">
                <Button className="w-full min-h-[44px] font-bold">Sign In</Button>
              </Link>
              <Link to="/auth/sign-up" className="flex-1">
                <Button variant="outline" className="w-full min-h-[44px] font-bold">Create Account</Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Target Business Banner */}
            <div className="p-3 rounded-xl bg-muted/60 border border-border/70 flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                <Store className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm truncate text-foreground">{business.name}</p>
                <p className="text-xs text-muted-foreground">
                  {business.category} &bull; {business.purok ? `Purok ${business.purok}, ` : ''}{business.barangay === 'daine_2' ? 'Barangay Daine 2' : 'Barangay Daine 1'}
                </p>
              </div>
            </div>

            {/* Claimant Information */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="claimantName" className="text-xs font-bold">
                  Claimant Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="claimantName"
                  value={claimantName}
                  onChange={(e) => setClaimantName(e.target.value)}
                  placeholder="Juan Dela Cruz"
                  className="min-h-[44px] mt-1"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="claimantPhone" className="text-xs font-bold">
                    Contact Phone <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="claimantPhone"
                    value={claimantPhone}
                    onChange={(e) => setClaimantPhone(e.target.value)}
                    placeholder="0917-123-4567"
                    className="min-h-[44px] mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="relationship" className="text-xs font-bold">
                    Relationship to Business <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={relationship}
                    onValueChange={(val: any) => setRelationship(val)}
                  >
                    <SelectTrigger id="relationship" className="min-h-[44px] mt-1">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Owner">Sole Owner</SelectItem>
                      <SelectItem value="Co-Owner">Co-Owner / Partner</SelectItem>
                      <SelectItem value="Manager">General Manager</SelectItem>
                      <SelectItem value="Authorized Representative">Authorized Representative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="proofNotes" className="text-xs font-bold">
                  Proof of Ownership & Details <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="proofNotes"
                  value={proofNotes}
                  onChange={(e) => setProofNotes(e.target.value)}
                  placeholder="e.g. Barangay Business Permit #2026-0492, DTI Certificate #184920, or detailed location and operation history."
                  className="min-h-[80px] mt-1 text-sm"
                  required
                />
              </div>

              <div>
                <Label htmlFor="proofImageUrl" className="text-xs font-bold">
                  Supporting Photo / Document URL <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Input
                  id="proofImageUrl"
                  value={proofImageUrl}
                  onChange={(e) => setProofImageUrl(e.target.value)}
                  placeholder="https://... (photo of storefront, permit, or ID)"
                  className="min-h-[44px] mt-1"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-muted-foreground flex gap-2.5 items-start">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Claims are reviewed by Barangay Daine staff. False ownership claims violate the Citizen Terms of Service and will result in account suspension.
              </span>
            </div>

            <DialogFooter className="gap-2 pt-2 sm:space-x-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="min-h-[44px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="min-h-[44px] font-bold bg-primary hover:bg-primary/90 text-primary-foreground btn-tactile"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Ownership Claim'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
