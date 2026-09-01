# 🎯 Stage 1: Product Brief — MSME Business Ownership Claiming

> **Feature Name**: MSME Business Ownership Claiming Workflow  
> **Lifecycle Stage**: Stage 1 (Product Strategy & Requirements)  
> **Target Audience**: Barangay Daine 1 & Daine 2 Local Business Owners, Residents, and Barangay Administrators  
> **Author**: Node 1 (🎯 Product Strategist)

---

## 📌 1. Problem Statement & Citizen Value

### The Challenge:
To ensure the **MSME Business Directory** (`/directory`) is valuable immediately upon launch, Barangay administrators and staff manually encode local establishments (sari-sari stores, eateries, water refilling stations, repair shops). 

However, as local merchants register on BrgyConnect, they currently have no self-service mechanism to take over their pre-encoded listings. This leads to:
1. **Stale Information**: Store hours, contact numbers, and GCash QR codes become outdated because owners cannot update them.
2. **Duplicate Listings**: Merchants attempt to create a second listing from scratch rather than claiming the official one.
3. **Administrative Overhead**: Barangay staff must manually coordinate with merchants to update data.

### The Solution:
Introduce a verified, multi-step **"Claim this Business"** workflow that enables registered residents to claim existing barangay-curated listings with proof of ownership, reviewed and approved by Barangay administrators.

---

## 🎯 2. Feature Requirements

### R1. Unclaimed Listing Discovery & Trigger
- On `/directory` and `/directory/$businessId`, if `owner_id IS NULL`, display an anti-slop, high-craft banner/button:  
  *🏷️ "Is this your establishment? Claim this business listing"*.
- If the visitor is a guest, prompt them to sign in or register before claiming.

### R2. Claim Request Submission Flow
- A verified modal/drawer allowing the claimant to provide:
  1. **Claimant Details**: Full Name, Contact Number, Relationship (*Sole Owner, Co-Owner, Manager, Authorized Representative*).
  2. **Verification Statement / Proof**: Explanation of ownership, business permit number, or upload of supporting proof (*Barangay Business Clearance, DTI Registration, Storefront Photo, or Valid ID*).
- Prevents duplicate pending claims by the same user on the same business.

### R3. Admin Review & Triage Desk
- In `/admin/businesses`, introduce a **"Claims Review"** tab (with badge counter for pending claims).
- Barangay officials can:
  - Inspect claimant details, timestamp, attached proof, and verification notes.
  - **Approve Claim**: Transfers `businesses.owner_id = claimant_id`, sets claim status to `approved`, and sends a real-time in-app notification to the resident.
  - **Reject Claim**: Sets claim status to `rejected` with custom feedback notes explaining why proof was insufficient.

### R4. Post-Claim Merchant Ownership & Editing
- Once approved, the business appears under the merchant's **Resident Dashboard** (`/dashboard`).
- The resident receives full editing capabilities on their business details (opening hours, contact phone, photos, GCash payment methods, price lists) via `/businesses/$businessId/edit` or `/dashboard`.

---

## 🛡️ 3. Multi-Tenancy & Security Rules
- Multi-tenant scoping: Barangay Daine 1 claims can only be approved by Daine 1 admins; Daine 2 claims by Daine 2 admins.
- RLS Policies: Claim records can only be created by authenticated users for unowned businesses. Users can view their own claims. Admins can view and update all claims within their barangay scope.

---

## 🏁 4. Acceptance Criteria (Guardrails)

- [ ] **AC1**: Public directory cards for unclaimed businesses (`owner_id IS NULL`) render a distinct, accessible "Claim Listing" trigger.
- [ ] **AC2**: Claim submission saves to a new `business_claims` table with status `pending`.
- [ ] **AC3**: Admin Console (`/admin/businesses`) displays a dedicated Claims Desk with approve/reject actions.
- [ ] **AC4**: Approving a claim updates `businesses.owner_id` to the claimant and sends an in-app notification.
- [ ] **AC5**: The claimant can successfully edit their newly claimed business.
- [ ] **AC6**: Mobile responsive ($375\text{px}$) with touch targets $\ge 44\text{px}$ and zero horizontal scrolling.
