# Project Memory: ag-brgy-connect

> Workspace: `/Users/markhuelgas/Documents/antigravity/ag-brgy-connect`
> Domain heuristics, local architectural patterns, and project conventions.

## Architecture & Tech Stack
- **Application Architecture & Stack** (`confidence: 1.00`): TanStack Start framework with React 19, Supabase SSR for auth and PostgreSQL database access, and Tailwind CSS v4 with shadcn/ui components.

## Domain Entities & Workflows
- **Barangay Domain Entities & Workflows** (`confidence: 1.00`): Core modules include resident profiling, digital certificate/clearance request issuance, incident/blotter tracking, and community announcements.

## Database & Schema Rules
- **Database Migrations & Remote Parity** (`confidence: 1.00`): Manage database schema through idempotent SQL migration scripts in `supabase/migrations/`. Verify remote Supabase column and table parity before querying from server functions.
- **Supabase RLS & Function Privileges** (`confidence: 1.00`): `SECURITY DEFINER` functions used in RLS policies (e.g. `get_user_role`) must explicitly grant execute privileges to `authenticated` and `anon` roles, and use `(SELECT auth.uid())` for InitPlan caching.

## Security & Data Privacy
- **Zero-PII Public Endpoints** (`confidence: 1.00`): Public QR verification routes (`/verify/resident/$id`) and directory payloads must never expose raw resident emails, phone numbers, or auth UUIDs (`owner_id`) in client-accessible DOM.

## Testing & Quality Assurance
- **Client Hydration Guard in Automated Tests** (`confidence: 1.00`): Forms gating submit buttons behind `!isHydrated` require automated test runners (Playwright/Puppeteer) to explicitly wait for `!btn.hasAttribute('disabled')` before clicking submit.
- **Playwright Test Page Isolation** (`confidence: 1.00`): In multi-route test suites under Vite SSR, spawn fresh browser pages per route to prevent HMR and WebSocket connection stalls during aggressive viewport resizes.
