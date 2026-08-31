# 📦 Stage 2: UI/UX Design Specification
## UI/UX Design Intelligence Polish & Anti-Slop Refinements

> **Feature Slug:** `ui-ux-design-intelligence-polish`  
> **Date:** 2026-08-31  
> **Author:** Node 2 — Lead Product Designer & Civic UI/UX Architect (`1ee4baed-7b22-40f0-a209-9a6a511bd8f3`)  
> **Handoff Target:** Node 3 — Engineering Hub (`3544ab40-f53a-4478-938c-4ffadf8dc6b5`)  
> **Audit Reference:** [`ui_ux_audit_report.md`](file:///Users/markhuelgas/.gemini/antigravity/brain/1ee4baed-7b22-40f0-a209-9a6a511bd8f3/ui_ux_audit_report.md)

---

### 1. Scope & Design Rationales

Following our comprehensive UI/UX audit against our updated design intelligence pillars (`taste-skill`, `emil-design-eng`, `ui-ux-pro-max`, `impeccable`), this handoff establishes high-craft polish across four core areas:

1. **Physical Tactile Feedback & Motion Physics (`emil-design-eng`)**:
   - Every interactive `<Button>` must provide physical micro-feedback (`active:scale-[0.97]`) and smooth state transitions.
   - Define custom cubic-bezier easing tokens in `src/styles.css` (`--ease-out`, `--ease-in-out`, `--ease-drawer`) so animations feel snappy rather than robotic or linear.

2. **Mobile Viewport Stability (`taste-skill` & `ui-ux-pro-max`)**:
   - Replace legacy `min-h-screen` and `h-screen` classes with `min-h-[100dvh]` and `h-[100dvh]` across all full-height auth views and civic portal pages to prevent layout jumping when mobile browsers (iOS Safari, Chrome Android) expand/collapse navigation address bars.

3. **Eyebrow Restraint & Visual Hierarchy (`taste-skill`)**:
   - Eliminate redundant and repetitive decorative uppercase tracking labels (`uppercase tracking-wider text-[11px]`) across public feeds.
   - Strictly limit eyebrows to a maximum of 1 per 3 sections, letting clean typography scales and spatial structure carry the hierarchy.

---

### 2. Component Specifications & Code Changes

#### A. Core Design Tokens & Global CSS
📁 [`src/styles.css`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/styles.css)
- Add the standard custom easing variables in `:root` and `.dark`:
```css
:root {
  /* ... existing tokens ... */
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
}
```
- Ensure `.btn-gradient` and `.card-hover` leverage `--ease-out` for snappy interactions (150ms–220ms max duration).

#### B. Button Primitive with Built-In Tactile Feedback
📁 [`src/components/ui/button.tsx`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/components/ui/button.tsx)
- Update `buttonVariants` to include `active:scale-[0.97] transition-transform duration-150 ease-out` by default:
```tsx
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all duration-150 active:scale-[0.97] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer",
  {
    // ... variants ...
  }
)
```

#### C. Mobile Viewport Stability (`dvh`)
Replace `min-h-screen` / `h-screen` with `min-h-[100dvh]` / `h-[100dvh]`:
- 📁 [`src/routes/auth/sign-in.tsx`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/auth/sign-in.tsx) (`min-h-[100dvh]`)
- 📁 [`src/routes/auth/sign-up.tsx`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/auth/sign-up.tsx) (`min-h-[100dvh]`)
- 📁 [`src/routes/auth/reset-password.tsx`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/auth/reset-password.tsx) (`min-h-[100dvh]`)
- 📁 [`src/routes/auth/update-password.tsx`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/auth/update-password.tsx) (`min-h-[100dvh]`)
- 📁 [`src/routes/auth/callback.tsx`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/auth/callback.tsx) (`min-h-[100dvh]`)
- 📁 [`src/routes/index.tsx`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/index.tsx) (`min-h-[100dvh]`)
- 📁 [`src/routes/emergency.tsx`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/emergency.tsx) (`min-h-[100dvh]`)
- 📁 [`src/routes/track.tsx`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/track.tsx) (`min-h-[100dvh]`)
- 📁 [`src/routes/announcements/index.tsx`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/announcements/index.tsx) (`min-h-[100dvh]`)
- 📁 [`src/routes/events/index.tsx`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/events/index.tsx) (`min-h-[100dvh]`)
- 📁 [`src/routes/officials/index.tsx`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/officials/index.tsx) (`min-h-[100dvh]`)
- 📁 [`src/routes/verify/$requestId.tsx`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/verify/$requestId.tsx) (`min-h-[100dvh]`)
- 📁 [`src/routes/verify/resident/$residentId.tsx`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/verify/resident/$residentId.tsx) (`min-h-[100dvh]`)

#### D. Eyebrow Restraint & Visual Hierarchy
Audit and prune decorative `uppercase tracking-wider text-[11px]` in:
- 📁 [`src/routes/track.tsx`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/track.tsx): Replace repetitive micro-labels over fields with clean, readable standard labels (`text-xs font-semibold text-muted-foreground`).
- 📁 [`src/routes/directory/index.tsx`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/directory/index.tsx) & [`src/routes/directory/$businessId.tsx`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/directory/$businessId.tsx): Remove redundant section eyebrows where card headers already provide strong contextual cues.
- 📁 [`src/routes/announcements/index.tsx`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/announcements/index.tsx) & [`src/routes/events/index.tsx`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/events/index.tsx): Consolidate header badges to keep focus on titles, dates, and event tags.

---

### 3. Parallel Execution & File-Lock Matrix

| Builder Role | File Ownership (File-Lock) | Focus Area |
| :--- | :--- | :--- |
| **Builder 1 (Tokens & Components)** | 🔒 `src/styles.css`<br>🔒 `src/components/ui/button.tsx` | Global easing tokens & Button primitive tactile micro-feedback |
| **Builder 2 (Auth Views)** | 🔒 `src/routes/auth/sign-in.tsx`<br>🔒 `src/routes/auth/sign-up.tsx`<br>🔒 `src/routes/auth/reset-password.tsx`<br>🔒 `src/routes/auth/update-password.tsx`<br>🔒 `src/routes/auth/callback.tsx` | Viewport `100dvh` stability, clean layout, mobile touch compliance |
| **Builder 3 (Core Public Routes)** | 🔒 `src/routes/index.tsx`<br>🔒 `src/routes/emergency.tsx`<br>🔒 `src/routes/officials/index.tsx`<br>🔒 `src/routes/verify/*.tsx` | Viewport `100dvh` stability, section rhythm, hero stack restraint |
| **Builder 4 (Feed & Discovery Routes)** | 🔒 `src/routes/track.tsx`<br>🔒 `src/routes/directory/*.tsx`<br>🔒 `src/routes/announcements/*.tsx`<br>🔒 `src/routes/events/*.tsx`<br>🔒 `src/routes/map/*.tsx` | Eyebrow reduction, cleaner typographic hierarchy, viewport `100dvh` |

---

### 4. Verification & QA Protocol

1. **Build Integrity**:
   - `npx --yes pnpm run build` must complete with 0 TypeScript and 0 Vite SSR errors.
2. **Interactive Tactile QA**:
   - Verify every `<Button>` scales to `0.97` on active press without causing layout shifts.
3. **Mobile Viewport QA**:
   - Test on responsive mobile viewports ($375\text{px}$, $390\text{px}$, $412\text{px}$) to ensure zero bottom clipping or address-bar jumpiness.
4. **Visual Rhythm QA**:
   - Verify that feeds and lists have clean typographic hierarchy without redundant decorative uppercase micro-tags.
