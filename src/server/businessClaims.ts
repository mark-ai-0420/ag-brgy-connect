import { createServerFn } from '@tanstack/react-start'
import { createSupabaseServerClient } from '#/lib/supabase.server'
import { z } from 'zod'

export const submitBusinessClaim = createServerFn({ method: 'POST' })
  .validator(
    (data: unknown) =>
      z
        .object({
          businessId: z.string().uuid(),
          claimantName: z.string().min(2, 'Name is required'),
          claimantPhone: z.string().min(7, 'Valid contact number is required'),
          relationship: z.enum(['Owner', 'Co-Owner', 'Manager', 'Authorized Representative']),
          proofNotes: z.string().min(5, 'Please provide a brief statement or permit details'),
          proofImageUrl: z.string().optional(),
        })
        .parse(data)
  )
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('You must be signed in to claim a business listing.')
    }

    // 1. Verify business exists and is currently unclaimed
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('id, name, owner_id, barangay')
      .eq('id', data.businessId)
      .single()

    if (bizError || !business) {
      throw new Error('Business listing not found.')
    }

    if (business.owner_id) {
      throw new Error('This business listing has already been claimed by a registered owner.')
    }

    // 2. Check if user already submitted a pending claim for this business
    const { data: existingClaim } = await supabase
      .from('business_claims')
      .select('id, status')
      .eq('business_id', data.businessId)
      .eq('claimant_id', user.id)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingClaim) {
      throw new Error('You already have a pending ownership claim for this business.')
    }

    // 3. Insert claim request
    const { data: claim, error: insertError } = await supabase
      .from('business_claims')
      .insert({
        business_id: data.businessId,
        claimant_id: user.id,
        claimant_name: data.claimantName.trim(),
        claimant_phone: data.claimantPhone.trim(),
        relationship: data.relationship,
        proof_notes: data.proofNotes.trim(),
        proof_image_url: data.proofImageUrl || null,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error submitting business claim:', insertError)
      throw new Error('Failed to submit ownership claim. Please try again.')
    }

    return { success: true, claim }
  })

export const getBusinessClaims = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role, barangay')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!roleData || !['admin', 'moderator'].includes(roleData.role)) {
    throw new Error('Unauthorized')
  }

  const adminScope = roleData.barangay ?? 'both'

  let query = supabase
    .from('business_claims')
    .select(`
      id,
      business_id,
      claimant_id,
      claimant_name,
      claimant_phone,
      relationship,
      proof_notes,
      proof_image_url,
      status,
      admin_notes,
      reviewed_at,
      created_at,
      businesses (
        id,
        name,
        category,
        barangay,
        purok,
        photo_url,
        owner_id
      )
    `)
    .order('created_at', { ascending: false })

  const { data: claims, error } = await query

  if (error) {
    console.error('Error fetching business claims:', error)
    return { claims: [], adminScope }
  }

  return { claims: claims ?? [], adminScope }
})

export const reviewBusinessClaim = createServerFn({ method: 'POST' })
  .validator(
    (data: unknown) =>
      z
        .object({
          claimId: z.string().uuid(),
          status: z.enum(['approved', 'rejected']),
          adminNotes: z.string().optional(),
        })
        .parse(data)
  )
  .handler(async ({ data }) => {
    const supabase = createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!roleData || !['admin', 'moderator'].includes(roleData.role)) {
      throw new Error('Unauthorized')
    }

    // 1. Fetch the claim
    const { data: claim, error: fetchErr } = await supabase
      .from('business_claims')
      .select('id, business_id, claimant_id, status, businesses(name)')
      .eq('id', data.claimId)
      .single()

    if (fetchErr || !claim) {
      throw new Error('Claim not found.')
    }

    const businessName = (claim.businesses as any)?.name ?? 'Business'

    // 2. Update claim status
    const now = new Date().toISOString()
    const { error: claimUpdateErr } = await supabase
      .from('business_claims')
      .update({
        status: data.status,
        admin_notes: data.adminNotes || null,
        reviewed_by: user.id,
        reviewed_at: now,
        updated_at: now,
      })
      .eq('id', data.claimId)

    if (claimUpdateErr) {
      throw new Error('Failed to update claim status.')
    }

    // 3. If approved, transfer business ownership
    if (data.status === 'approved') {
      const { error: bizUpdateErr } = await supabase
        .from('businesses')
        .update({
          owner_id: claim.claimant_id,
          updated_at: now,
        })
        .eq('id', claim.business_id)

      if (bizUpdateErr) {
        console.error('Error assigning business owner:', bizUpdateErr)
        throw new Error('Claim was approved but failed to reassign owner.')
      }

      // Notify the resident
      await supabase.from('notifications').insert({
        user_id: claim.claimant_id,
        title: '🎉 Business Ownership Claim Approved!',
        message: `Your claim for "${businessName}" has been verified and approved by the Barangay. You can now manage your store hours, photos, and services from your dashboard.`,
        type: 'system',
        link: `/directory/${claim.business_id}`,
      })
    } else {
      // Rejection notice
      await supabase.from('notifications').insert({
        user_id: claim.claimant_id,
        title: 'Business Ownership Claim Update',
        message: `Your claim for "${businessName}" was not approved. ${data.adminNotes ? `Reason: ${data.adminNotes}` : 'Please contact the Barangay Hall with valid business clearance.'}`,
        type: 'system',
        link: `/directory/${claim.business_id}`,
      })
    }

    return { success: true, status: data.status }
  })
