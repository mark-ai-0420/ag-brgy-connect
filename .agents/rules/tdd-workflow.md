# TDD Workflow — Mandatory Development Process

## Rule: Always Test and Validate

Every implementation task MUST include automated testing and validation. Never assume code works — prove it works.

### 1. Fan-Out Build Pattern (Required)

When implementing features or fixes, ALWAYS use subagent fan-out:
- **Break tasks into parallel workstreams** and assign each to a dedicated builder subagent
- **Each builder subagent must run `pnpm run build`** (or equivalent) after completing their changes and fix any errors before reporting done
- **Never serialize work that can be parallelized** — if tasks touch different files, run them concurrently

### 2. High-Reasoning Critic & Orchestrator Pattern (Required)

After builders complete their work, the primary orchestrator (running on **Gemini 3.7 Flash High**) executes verification in the primary thread:
- **Orchestrator**: Consolidates code from parallel builders, runs unified build checks (`pnpm run build`), resolves any merge or compilation issues.
- **Critic & QA**: Executes automated Puppeteer test scripts, inspects responsive layouts on desktop and mobile, captures high-resolution screenshots, and evaluates the UI with deep reasoning.
- **The critic must issue a PASS/FAIL verdict** before work is presented to the user.
- **If FAIL**: Fix issues and re-run verification until 100% PASS.

### 3. Nothing Breaks Rule (Required)

- **Run full build (`pnpm run build`)** after every batch of changes — zero errors required
- **Push database migrations (`pnpm dlx supabase db push`)** when SQL changes are made — don't leave this for the user
- **Run any existing test suites** if present in the project
- **Verify that existing features still work** after adding new ones — check for regressions in related routes/components
- **Never ask the user to manually run verification commands** — always run them yourself

### 4. Git Commit & Push Policy (Required)

- **NEVER automatically commit or push to Git repositories without explicit user approval.**
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
- [ ] Explicit user confirmation received before committing/pushing to Git


### 6. Full End-to-End Audit After Major Releases (Required)

After a major release or significant milestone, ALWAYS trigger a comprehensive multi-agent audit to ensure the app is in tip-top shape:
- **Fan-Out Auditors**: Spawn dedicated subagents for:
  - **Visual & UI/UX Critic**: Checks for pixel-perfect alignment, responsive design, intuitive navigation, state management (loading/empty states), accessibility, and overall ease of use.
  - **Performance & Architecture Auditor**: Audits loading speeds, caching (`staleTime`), network waterfalls, unoptimized images, unneeded rerenders, and database query efficiency.
  - **Functional & Flow QA Tester**: End-to-end testing of critical user journeys, capturing viewport screenshots, and verifying state changes and edge cases.
- **Consolidation**: The Orchestrator aggregates these findings, issues a PASS/FAIL verdict, and proposes fixes for any identified regressions before concluding the release.
