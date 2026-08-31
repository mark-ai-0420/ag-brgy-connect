# 🎯 Implementation Plan: UI/UX Design Intelligence Polish & Anti-Slop Refinements

Implement the Stage 2 UI/UX Design Intelligence Polish across four parallel builder subagents, embedding physical tactile feedback, mobile viewport stability (`100dvh`), and typographic restraint across the platform.

## User Review Required

> [!NOTE]
> - **Tactile Micro-Feedback**: Upgrades the global `<Button>` primitive to include `active:scale-[0.97]` and cubic-bezier `--ease-out` easing by default, giving every button physical feedback without modifying individual call sites.
> - **Mobile Viewport Stability**: Replaces legacy `min-h-screen` with `min-h-[100dvh]` across all full-page routes to prevent layout jumping when mobile browsers expand/collapse address bars.
> - **Anti-Slop Eyebrow Restraint**: Prunes repetitive decorative uppercase tracking micro-labels across feeds, allowing strong typography and layout structure to lead.

---

## Proposed Changes

### Builder 1: Design Tokens & Button Primitive

#### [MODIFY] [styles.css](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/styles.css)
- Add custom cubic-bezier easing tokens (`--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`, `--ease-in-out`, `--ease-drawer`) in `:root` and `.dark`.
- Update `.card-hover` and `.btn-gradient` to leverage `--ease-out` for snappy interactions.

#### [MODIFY] [button.tsx](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/components/ui/button.tsx)
- Update `buttonVariants` to include `active:scale-[0.97] transition-all duration-150 ease-out` by default.

---

### Builder 2: Auth Views Viewport Stability

#### [MODIFY] [sign-in.tsx](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/auth/sign-in.tsx)
#### [MODIFY] [sign-up.tsx](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/auth/sign-up.tsx)
#### [MODIFY] [reset-password.tsx](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/auth/reset-password.tsx)
#### [MODIFY] [update-password.tsx](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/auth/update-password.tsx)
#### [MODIFY] [callback.tsx](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/auth/callback.tsx)
- Replace `min-h-screen` / `h-screen` with `min-h-[100dvh]` / `h-[100dvh]`.

---

### Builder 3: Core Public Civic Hubs

#### [MODIFY] [index.tsx](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/index.tsx)
#### [MODIFY] [emergency.tsx](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/emergency.tsx)
#### [MODIFY] [officials/index.tsx](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/officials/index.tsx)
#### [MODIFY] [verify/$requestId.tsx](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/verify/$requestId.tsx)
#### [MODIFY] [verify/resident/$residentId.tsx](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/verify/resident/$residentId.tsx)
- Upgrade full-height hero and root containers to `min-h-[100dvh]`.
- Refine spacing rhythm and card border contrast.

---

### Builder 4: Feeds & Discovery Routes

#### [MODIFY] [track.tsx](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/track.tsx)
#### [MODIFY] [directory/index.tsx](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/directory/index.tsx)
#### [MODIFY] [directory/$businessId.tsx](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/directory/$businessId.tsx)
#### [MODIFY] [announcements/index.tsx](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/announcements/index.tsx)
#### [MODIFY] [events/index.tsx](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/events/index.tsx)
#### [MODIFY] [map/index.tsx](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/map/index.tsx)
#### [MODIFY] [map/index.lazy.tsx](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/map/index.lazy.tsx)
- Prune redundant uppercase tracking eyebrow tags.
- Upgrade full-height layout containers to `min-h-[100dvh]`.

---

## Verification Plan

### Automated Tests
- `npx --yes pnpm run build` — Verify 0 TypeScript, SSR, or Vite errors.
- Run Puppeteer verification script checking:
  1. Button active scale on click (`transform: scale(0.97)`).
  2. Mobile viewport layout stability (zero address-bar layout shift).
  3. Clean visual presentation across desktop (1440px) and mobile (375px).

### Manual Verification
- Visual inspection of button presses and feed navigation.
