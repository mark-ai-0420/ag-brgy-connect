# TDD Workflow — Mandatory Development Process

## Rule: Always Test and Validate

Every implementation task MUST include automated testing and validation. Never assume code works — prove it works.

### 1. Fan-Out Build Pattern with File-Lock Protocol (Required)

When implementing features or fixes, ALWAYS use subagent fan-out:
- **Break tasks into parallel workstreams** and assign each to a dedicated builder subagent
- **Each builder subagent must run `pnpm run build`** (or equivalent) after completing their changes and fix any errors before reporting done
- **Never serialize work that can be parallelized** — if tasks touch different files, run them concurrently
- **Explicit file-level ownership is mandatory.** The orchestrator's fan-out prompt must list which files each builder owns. No two builders may modify the same file. If overlap is unavoidable, one builder is designated as primary owner; the other reports its required changes as instructions to the orchestrator for sequential application.

#### File-Lock Example:
```
Builder A owns: src/routes/directory/index.tsx, src/components/directory/*
Builder B owns: src/routes/emergency.tsx
Builder C owns: src/routes/_authenticated/dashboard.tsx
Shared file (src/components/ui/card.tsx): Builder A is primary owner.
  Builder C reports card.tsx changes to orchestrator for sequential application.
```

### 2. High-Reasoning Critic & Orchestrator Pattern (Required)

After builders complete their work, the primary orchestrator executes verification in the primary thread:
- **Orchestrator**: Consolidates code from parallel builders, runs unified build checks (`pnpm run build`), resolves any merge or compilation issues.
- **Critic & QA**: Executes automated E2E test scripts from `tests/e2e/`, inspects responsive layouts on desktop and mobile, captures high-resolution screenshots, and evaluates the UI.
- **The critic must issue a PASS/FAIL verdict** before work is presented to the user.
- **If FAIL**: Fix issues and re-run verification until 100% PASS.

### 3. Nothing Breaks Rule (Required)

- **Run full build (`pnpm run build`)** after every batch of changes — zero errors required
- **Push database migrations (`pnpm dlx supabase db push`)** when SQL changes are made — don't leave this for the user
- **Run any existing test suites** if present in the project (`pnpm test:e2e` for E2E tests)
- **Verify that existing features still work** after adding new ones — check for regressions in related routes/components
- **Never ask the user to manually run verification commands** — always run them yourself

### 4. Conditional DBA Gate & Git Commit Policy (Required)

- **NEVER automatically commit or push to Git repositories without explicit user approval.**
- **DBA gate is conditional:**
  - **Schema-touching releases** (files changed in `supabase/migrations/`, new RLS policies, new tables/columns): DBA audit is mandatory and blocking. Wait for DBA PASS sign-off before prompting user.
  - **UI-only releases** (no migration files changed): DBA is notified for awareness only (non-blocking). Proceed directly to user Git approval.
  - **Detection method**: `git diff --cached --name-only | grep -c 'supabase/migrations'`
- Always build, verify, and present the completed work to the user first.
- Only run `git commit` and `git push` when the user explicitly requests or confirms it.

### 5. Verification Checklist (Every Task)

Before reporting a task as complete, confirm:
- [ ] Code compiles with zero errors
- [ ] Database migrations are applied (if any)
- [ ] New routes are accessible (check `routeTree.gen.ts` updated)
- [ ] No type errors or `as any` workarounds introduced
- [ ] Visual changes verified via screenshots (when applicable)
- [ ] Related existing features tested for regressions
- [ ] Builder file-lock ownership was explicitly declared (no silent overwrites)
- [ ] DBA gate condition evaluated (schema-touching vs UI-only)
- [ ] Explicit user confirmation received before committing/pushing to Git


### 6. Full End-to-End Audit After Major Releases (Required)

After a major release or significant milestone, ALWAYS trigger a comprehensive multi-agent audit to ensure the app is in tip-top shape:
- **Fan-Out Auditors**: Spawn dedicated subagents for:
  - **Visual & UI/UX Critic**: Checks for pixel-perfect alignment, responsive design, intuitive navigation, state management (loading/empty states), accessibility, and overall ease of use.
  - **Performance & Architecture Auditor**: Audits loading speeds, caching (`staleTime`), network waterfalls, unoptimized images, unneeded rerenders, and database query efficiency.
  - **Functional & Flow QA Tester**: End-to-end testing of critical user journeys, capturing viewport screenshots, and verifying state changes and edge cases.
- **Consolidation**: The Orchestrator aggregates these findings, issues a PASS/FAIL verdict, and proposes fixes for any identified regressions before concluding the release.

### 7. Hotfix & Rollback Protocol (Required)

If a post-release regression is discovered after `git push`:
1. **Immediately** run `git revert HEAD` and push the revert to `main`.
2. Open a new pipeline cycle starting at Stage 3 (Engineering) with the targeted fix.
3. Notify **Poster** to hold or retract any published announcements.
4. The fix follows the same conditional DBA gate and user approval before re-pushing.
