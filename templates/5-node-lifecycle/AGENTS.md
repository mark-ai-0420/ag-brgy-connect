# AGENTS.md — Development Guidelines & Collaboration Protocol

Welcome to **{{PROJECT_NAME}}**. This document defines the operational protocol, architectural standards, and workflow rules for AI agents and subagents working in this codebase.

---

## 🤝 1. Collaboration & User Pairing Philosophy

1. **5-Node Multi-Agent Lifecycle Protocol (MANDATORY)**:
   ```mermaid
   graph TD
       A["1. 🎯 Product Strategist"] -->|Feature Scope & Requirements| B["2. 🎨 UI/UX Designer"]
       B -->|Clarify / Iterate if Blocked| A
       B -->|Approved Design Spec & Handoff| C["3. ⚡ Engineering Hub"]
       C -->|Parallel Builders with File-Lock| C_Test["Verified Build & Visual Proof"]
       C_Test -->|Schema changes?| DBA_Check{"Migration files changed?"}
       DBA_Check -->|YES: Full Audit| D["4. 🗄️ DBA & Cloud Architect"]
       DBA_Check -->|NO: Awareness-only| UserGate["Prompt User for Git Approval"]
       C_Test -->|Screenshots & Walkthrough| E["5. 📢 Poster / Community Lead"]
       D -->|RLS, Indexes & Security Sign-Off| UserGate
       UserGate -->|User Confirms| GitPush["Git Commit & Push to Main"]
       GitPush -->|Release Broadcast| E_Live["Poster Publishes"]
       E_Live -->|User & Engagement Insights| A
   ```

   - **Node 1 (Product -> UX)**: Product Strategist authors `handoffs/<feature>/01_product_brief.md` defining problem statement, requirements, and acceptance criteria.
   - **Node 2 (UX -> Engineering)**: UI/UX Designer authors `handoffs/<feature>/02_design_spec.md` with responsive layouts, visual tokens, interaction states, and file-lock assignments.
   - **Node 3 (Engineering Execution)**: Engineering Hub authors `handoffs/<feature>/03_implementation_plan.md`, fans out parallel builder subagents with **explicit file-lock ownership**, runs builds, executes automated E2E browser tests, and captures verification screenshots.
   - **Node 4 (Conditional DBA Gate)**: If database migrations or schema files changed (`supabase/migrations`, `prisma/schema.prisma`, `drizzle/`, etc.), DBA review and security sign-off is mandatory and blocking. If UI/logic only, DBA is notified for awareness (non-blocking).
   - **Node 5 (Git Gate)**: Engineering Hub prompts the user for explicit Git commit/push confirmation.
   - **Node 6 (Release Broadcast)**: Once pushed to `main`, Poster finalizes and publishes community/social media release announcements (`06_release_post.md`).
   - **Node 7 (Retrospective Feedback Loop)**: Poster and telemetry feed engagement insights back to Node 1 for subsequent feature iterations.

2. **Explicit User Approval for Git (MANDATORY)**:
   - **NEVER** run `git commit` or `git push` automatically or silently.
   - For **schema-touching releases**: wait for DBA audit sign-off, verify build, present screenshots, then ask user for explicit confirmation.
   - For **UI/code-only releases**: verify build, present screenshots, then ask user for explicit confirmation.
   - Format approved commits using **Conventional Commits** (e.g. `feat(auth): add session recovery and password visibility toggles`).

3. **Subagent Fan-Out with File-Lock Protocol**:
   - Decompose multi-file features across dedicated builder subagents (`Model: 'flash'`).
   - **Each builder must have explicit file-level ownership.** No two builders may modify the same file concurrently.
   - Each subagent verifies its changes independently before reporting completion.
   - Primary thread acts as the Orchestrator and QA Critic.

4. **High-Signal Verification Artifacts**:
   - Present verification via concise markdown with clickable file links (e.g. [`src/main.tsx`](file:///path/to/file)).
   - Include structured **Pass/Fail test tables** and **high-resolution screenshot carousels**.

5. **Proactive Root-Cause Resolution**:
   - Diagnose root causes directly instead of asking the user to troubleshoot.
   - When encountering high-impact architectural trade-offs, proactively propose the cleanest solution with rationale or suggest `/grill-me`.

---

## 🏗️ 2. Tech Stack & Architectural Conventions

* **Framework**: {{FRAMEWORK_NAME}} (e.g., TanStack Start / Next.js / Vite React / SvelteKit)
* **Styling**: {{STYLING_ENGINE}} (e.g., Tailwind CSS v4, CSS Modules, Radix UI)
* **Database & Auth**: {{DATABASE_ENGINE}} (e.g., Supabase PostgreSQL, Prisma, Drizzle)
* **State & Data Fetching**: {{DATA_FETCHING_ENGINE}} (e.g., TanStack Query, Server Actions, tRPC)

### Critical Rules:
- **Server vs Client Boundaries**: Isolate database access and secret keys inside server functions or backend endpoints.
- **Defensive Data Handling**: Always guard against nullable loader/server data to prevent hydration crashes.
- **Zero Build Regressions**: `{{BUILD_COMMAND}}` must succeed with 0 compilation, type, and lint errors.

---

## 🔄 3. Mandatory Rules & Gates

Refer to project-specific rules in `.agents/rules/`:
- [`.agents/rules/tdd-workflow.md`](.agents/rules/tdd-workflow.md) — Subagent fan-out, TDD execution, and visual verification
- [`.agents/rules/git-approval-gate.md`](.agents/rules/git-approval-gate.md) — Explicit user approval protocol for Git commits
- [`.agents/rules/db-migration-gate.md`](.agents/rules/db-migration-gate.md) — Conditional DBA sign-off on database schema updates

---

## 🎨 4. UI/UX Design Intelligence Protocol (MANDATORY FOR NODE 2)

Node 2 (🎨 UI/UX Designer) and all frontend builders MUST actively consult and synthesize our design intelligence stack before speccing or generating UI components:
1. **`impeccable` (Paul Bakaus)**: Enforce the craft floor, eliminate generic AI tropes, and apply `/impeccable polish` & `/impeccable craft`.
2. **`taste-skill` (Leonxlnx)**: Declare a **"Design Read"** (page kind, audience, vibe, aesthetic family) and practice anti-default restraint.
3. **`emil-design-eng` & `animate` (Emil Kowalski)**: Spring physics, fluid entry/exit choreography, $44\text{px}+$ touch targets, and tactile button micro-feedback (`active:scale-95`).
4. **`ui-ux-pro-max`**: Query 84 styles, 192 color palettes (OKLCH tokens), 74 font pairings, and 98 UX guidelines.
5. **`huashu-design`**: 5-dimensional studio critique (Art Direction, Visual Hierarchy, Motion Continuity, Frontend Precision, Copywriting).

