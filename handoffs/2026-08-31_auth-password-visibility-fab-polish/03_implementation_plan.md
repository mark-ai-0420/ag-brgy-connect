# 🎯 Implementation Plan: Auth Password Visibility & Floating Widget Suppression Polish

Implement route-aware suppression of floating civic widgets (`EmergencySpeedDial`, `KaDaineChatbot`) on all `/auth/*` routes and upgrade password visibility toggle buttons to high-contrast, tactile 44x44px controls across all authentication pages.

## User Review Required

> [!NOTE]
> - **Floating FAB Suppression**: The emergency hotline speed dial and Ka-Daine AI resident chatbot will be automatically suppressed on `/auth/sign-in`, `/auth/sign-up`, `/auth/reset-password`, and `/auth/update-password` to eliminate mobile screen viewport obstruction.
> - **Password Visibility Toggles**: Upgrades all eye buttons across auth forms to minimum $44\times 44\text{px}$ touch targets with tactile `active:scale-95`, `hover:bg-muted/80`, and dynamic ARIA accessibility labels.

---

## Proposed Changes

### Shell & Root Layout

#### [MODIFY] [__root.tsx](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/__root.tsx)
- Import `useRouterState` from `@tanstack/react-router`.
- Read active pathname with `const pathname = useRouterState({ select: (s) => s.location.pathname })`.
- Derive `const isAuthRoute = pathname.startsWith('/auth')`.
- Conditionally render `{!isAuthRoute && <EmergencySpeedDial />}` and `{!isAuthRoute && <KaDaineChatbot />}`.

---

### Authentication Pages

#### [MODIFY] [sign-in.tsx](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/auth/sign-in.tsx)
- Update password visibility toggle button with tactile token styling:
  `className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] p-2 flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-muted/80 active:bg-muted active:scale-95 transition-all cursor-pointer rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 z-10"`
- Ensure `type="button"` and `aria-label={showPassword ? 'Hide password' : 'Show password'}`.

#### [MODIFY] [sign-up.tsx](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/auth/sign-up.tsx)
- Update password and confirm password visibility toggle buttons with matching tactile styling, $44\times 44\text{px}$ touch bounding box, and `z-10` layering.

#### [MODIFY] [update-password.tsx](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/auth/update-password.tsx)
- Update new password and confirm password visibility toggle buttons with matching tactile styling, $44\times 44\text{px}$ touch bounding box, and `z-10` layering.

---

## Verification Plan

### Automated Tests
- `npx --yes pnpm run build` — Verify 0 TypeScript, SSR, or Vite compilation errors.
- Run Puppeteer verification script checking:
  1. Floating widgets are absent on `/auth/sign-in`, `/auth/sign-up`, and `/auth/update-password`.
  2. Floating widgets are present on `/` and `/dashboard`.
  3. Clicking password visibility toggle switches `input[type="password"]` to `input[type="text"]` and updates `aria-label`.

### Manual Verification
- Visual inspection on desktop (1440px) and mobile (375px) viewports.
