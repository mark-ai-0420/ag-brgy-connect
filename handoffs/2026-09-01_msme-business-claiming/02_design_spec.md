# 🎨 Stage 2: UI/UX Design Specification — MSME Business Ownership Claiming

> **Feature Name**: MSME Business Ownership Claiming Workflow  
> **Lifecycle Stage**: Stage 2 (UI/UX Design Specification & File-Lock Partitioning)  
> **Author**: Node 2 (🎨 Lead UI/UX Designer & Civic Design Director)  
> **Inputs**: `handoffs/2026-09-01_msme-business-claiming/01_product_brief.md`

---

## 🧭 1. Design Read (Per `taste-skill`)

* **Page Kind**: Civic Directory + Administrative Triage Desk
* **Target Audience**: Micro-entrepreneurs in Barangay Daine 1 & 2 (sari-sari store owners, riders, carenderia cooks) and Barangay Desk Officers
* **Aesthetic Vibe**: Tactile, trustworthy, uncluttered, affirmative feedback
* **Aesthetic Family**: High-Craft Civic System with OKLCH tokens, warm amber accents for claimable states, and emerald for verified ownership.
* **Anti-Slop Restraints**: No raw unstyled borders, no generic AI-purple glows, no dense multi-nested cards. Every interactive control strictly $\ge 44\times 44\text{px}$.

---

## 🎨 2. Component Design & Interaction Specs

### A. Unclaimed Badge & Claim Trigger (`ClaimBusinessModal.tsx`)
* **Location**: On `/directory` cards and `/directory/$businessId` banner when `owner_id IS NULL`.
* **Visual Treatment**:
  - Badge: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20`
  - Action Button: `"Claim Business"` with `Sparkles` or `Store` icon, `btn-tactile` press feedback (`active:scale-[0.97]`).
* **Modal Dialog**:
  - Radix Dialog primitive with backdrop blur (`backdrop-blur-sm bg-background/80`).
  - Inputs: Full Name (prefilled from profile), Contact Number, Claimant Role (*Owner, Co-Owner, Manager, Relative*), Ownership Statement / Permit Number, and Optional Image Upload (Storefront / ID).
  - Submit Button: Full-width tactile button with loading spinner state.

### B. Admin Claims Desk Tab (`/admin/businesses`)
* **Tab Hierarchy**:
  - Tabs: `[ All Listings (N) ]` | `[ Pending Listings (N) ]` | `[ Ownership Claims (N) 🏷️ ]` | `[ Archived ]`
* **Claims Review Card / Table Row**:
  - Displays: Target Business Name, Barangay/Purok, Claimant Name, Claimant Phone, Claim Date, Status Badge.
  - Quick Action: `[ Review Claim ]` triggers inspection modal.
* **Claim Review Modal**:
  - Compares: Business Details $\leftrightarrow$ Claimant Identity & Proof.
  - Actions:
    - `[ Reject Claim ]`: Opens rejection reason textarea.
    - `[ Approve & Transfer Ownership ]`: Emerald confirmation button with Sonner toast feedback.

---

## 🔒 3. Engineering Hub File-Lock Ownership Partitioning

To ensure zero merge conflicts during parallel engineering execution:

| File Lock ID | Target File Path | Primary Responsibility |
| :--- | :--- | :--- |
| **🔒 Lock 1 (DBA)** | `supabase/migrations/20240126000001_business_claims_schema.sql` | `business_claims` table, RLS policies, and triggers |
| **🔒 Lock 2 (Backend)** | `src/server/businessClaims.ts` | Server functions: `submitBusinessClaim`, `getBusinessClaims`, `reviewBusinessClaim` |
| **🔒 Lock 3 (Frontend Modal)** | `src/components/businesses/ClaimBusinessModal.tsx` | Claim Trigger button & Dialog form component |
| **🔒 Lock 4 (Directory Routes)** | `src/routes/directory/$businessId.tsx` & `src/routes/directory/index.tsx` | Wire unclaimed badges & Claim modal trigger |
| **🔒 Lock 5 (Admin Console)** | `src/routes/_authenticated/admin/businesses.tsx` | Add "Ownership Claims" Tab, claims table, and review dialog |

---

## ✅ 4. UX Quality Checklist
- [x] Declared Design Read with anti-slop guidelines.
- [x] All touch targets meet WCAG $\ge 44\times 44\text{px}$.
- [x] Tactile button physics (`active:scale-[0.97]` + custom easing).
- [x] Sonner toast feedback on claim submission and admin resolution.
- [x] Clear file-lock assignments for Node 3.
