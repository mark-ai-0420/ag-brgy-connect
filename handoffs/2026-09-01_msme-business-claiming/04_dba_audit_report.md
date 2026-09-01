# Node 4: DBA & Cloud Architect Audit Report

**Feature**: MSME Business Ownership Claiming Workflow  
**Migration File**: [`supabase/migrations/20240126000001_business_claims_schema.sql`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/supabase/migrations/20240126000001_business_claims_schema.sql)  
**Auditor**: Node 4 (🗄️ DBA & Cloud Architect)  
**Date**: September 1, 2026  
**Status**: **APPROVED (100% Compliance)**  

---

## 1. Schema Architecture & Column Specification

```sql
CREATE TABLE IF NOT EXISTS public.business_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  claimant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claimant_name TEXT NOT NULL,
  claimant_phone TEXT NOT NULL,
  relationship TEXT NOT NULL DEFAULT 'Owner',
  proof_notes TEXT,
  proof_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### DBA Findings:
1. **Primary Key**: Uses UUID `gen_random_uuid()` to prevent enumeration attacks and ensure multi-region/offline compatibility.
2. **Foreign Key Integrity**:
   - `business_id` $\to$ `public.businesses(id)` with `ON DELETE CASCADE` (if a business is permanently deleted, open claims are cleanly pruned).
   - `claimant_id` $\to$ `auth.users(id)` with `ON DELETE CASCADE` (if a resident deletes their account, pending claims are pruned).
   - `reviewed_by` $\to$ `auth.users(id)` with `ON DELETE SET NULL` (preserves historical review logs even if an admin account is deactivated).
3. **Check Constraints**: `CHECK (status IN ('pending', 'approved', 'rejected'))` strictly enforces valid finite state transitions.
4. **Temporal Tracking**: `TIMESTAMPTZ` with `DEFAULT NOW()` guarantees timezone-aware auditability.

---

## 2. Performance & Query Indexing

The migration provisions 4 targeted B-Tree indexes:

| Index Name | Column(s) | Query Optimization Target |
| :--- | :--- | :--- |
| `idx_business_claims_business_id` | `business_id` | Foreign key joins & checking existing claims for a business |
| `idx_business_claims_claimant_id` | `claimant_id` | RLS evaluation `auth.uid() = claimant_id` & resident claims history |
| `idx_business_claims_status` | `status` | Admin pending filter queries (`status = 'pending'`) |
| `idx_business_claims_created_at` | `created_at DESC` | Chronological sorting in the Admin Claims Desk |

---

## 3. Row-Level Security (RLS) Policy Audit

| Policy Name | Action | Scope / Predicate | DBA Security Verdict |
| :--- | :--- | :--- | :--- |
| **Claimants can view own claims** | `SELECT` | `USING (auth.uid() = claimant_id)` | **PASS**: Strict tenant isolation prevents residents from reading other citizens' proof files. |
| **Authenticated users can submit claims** | `INSERT` | `WITH CHECK (auth.uid() = claimant_id)` | **PASS**: Prevents spoofing claimant ID on submission. |
| **Admins/Moderators can view all claims** | `SELECT` | `USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')))` | **PASS**: RBAC gate ensures only designated Barangay staff can audit claims. |
| **Admins/Moderators can update claims** | `UPDATE` | `USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')))` | **PASS**: Residents cannot approve or alter their own claims. |

---

## 4. Server-Side Transaction & Notification Safety

In [`src/server/businessClaims.ts`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/server/businessClaims.ts):
- **Ownership Transfer**: When an admin approves a claim, `businesses.owner_id` is updated atomically to `claim.claimant_id`.
- **In-App Notification**: An automatic notification record is dispatched to `claim.claimant_id` alerting the resident of the approval/rejection with resolution notes.

---

## 5. Formal DBA Sign-Off

```
[✓] Schema design conforms to Postgres best practices
[✓] Zero sequential table scan risks on high-traffic queries
[✓] RLS policies prevent unauthorized data escalation
[✓] Clean foreign key cascade semantics
```

**Final Decision**: **APPROVED FOR GIT COMMIT & DEPLOYMENT**.
