# TDD Workflow — Mandatory Development Process

## Rule: Always Test and Validate

Every implementation task MUST include automated testing and validation. Never assume code works — prove it works.

### 1. Fan-Out Build Pattern (Required)

When implementing features or fixes, ALWAYS use subagent fan-out:
- **Break tasks into parallel workstreams** and assign each to a dedicated builder subagent
- **Each builder subagent must run `pnpm run build`** (or equivalent) after completing their changes and fix any errors before reporting done
- **Never serialize work that can be parallelized** — if tasks touch different files, run them concurrently

### 2. Critic & Orchestrator Pattern (Required)

After builders complete their work, ALWAYS spawn verification subagents:
- **Orchestrator subagent**: Coordinates the overall verification flow, runs the consolidated build, checks for merge conflicts between parallel builders, and ensures all pieces fit together
- **Critic subagent(s)**: Reviews the output of each builder for correctness, edge cases, regressions, and code quality. Takes screenshots for visual changes and evaluates them
- **The critic must give a PASS/FAIL verdict** before work is considered complete
- **If FAIL**: Fix issues and re-run the critic loop until PASS

### 3. Nothing Breaks Rule (Required)

- **Run full build (`pnpm run build`)** after every batch of changes — zero errors required
- **Push database migrations (`pnpm dlx supabase db push`)** when SQL changes are made — don't leave this for the user
- **Run any existing test suites** if present in the project
- **Verify that existing features still work** after adding new ones — check for regressions in related routes/components
- **Never ask the user to manually run verification commands** — always run them yourself

### 4. Verification Checklist (Every Task)

Before reporting a task as complete, confirm:
- [ ] Code compiles with zero errors
- [ ] Database migrations are applied (if any)
- [ ] New routes are accessible (check `routeTree.gen.ts` updated)
- [ ] No type errors or `as any` workarounds introduced
- [ ] Visual changes verified via screenshots (when applicable)
- [ ] Related existing features tested for regressions
