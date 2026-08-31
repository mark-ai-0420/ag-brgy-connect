# 📦 Stage 2: UI/UX Design Specification
## Auth Password Visibility & Floating Widget Suppression Polish

> **Feature Slug:** `auth-password-visibility-fab-polish`  
> **Date:** 2026-08-31  
> **Author:** Node 2 — Lead Product Designer & Civic UI/UX Architect (`1ee4baed-7b22-40f0-a209-9a6a511bd8f3`)  
> **Handoff Target:** Node 3 — Engineering Hub (`3544ab40-f53a-4478-938c-4ffadf8dc6b5`)  
> **Product Brief Reference:** [`handoffs/2026-08-31_auth-password-visibility-fab-polish/01_product_brief.md`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/handoffs/2026-08-31_auth-password-visibility-fab-polish/01_product_brief.md)

---

### 1. Design Rationale & UX Improvements

1. **Floating Civic Widget Suppression on `/auth/*` Routes**:
   - On mobile screens ($<640\text{px}$), the fixed bottom `EmergencySpeedDial` (red phone FAB) and `KaDaineChatbot` (blue chat bubble) overlap the bottom portions of login/registration forms, obstructing the password inputs and submit actions.
   - **Specification**: Use TanStack Router's `useRouterState({ select: s => s.location.pathname })` in [`src/routes/__root.tsx`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/__root.tsx). When `pathname.startsWith('/auth')`, conditionally unmount or suppress `<EmergencySpeedDial />` and `<KaDaineChatbot />`.

2. **High-Contrast, Tactile Password Visibility Toggle**:
   - Replace subtle, low-contrast eye icon buttons with a dedicated, tactile toggle:
     - **Touch Target**: Minimum $44\times 44\text{px}$ touch bounding box (`min-h-[44px] min-w-[44px]`).
     - **Visual Contrast**: `text-foreground/70 hover:text-foreground` (light/dark adaptive).
     - **Micro-Interaction**: `hover:bg-muted/80 active:bg-muted active:scale-95 transition-all rounded-lg`.
     - **Z-Index Layering**: `z-10` to guarantee the button is always clickable above input borders.
     - **Accessibility**: Explicit dynamic `aria-label={showPassword ? 'Hide password' : 'Show password'}` and `type="button"` (to prevent accidental form submission).

---

### 2. Detailed Component Specs & Tailwind Tokens

#### A. [`src/routes/__root.tsx`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/__root.tsx)
```tsx
import { useRouterState } from '@tanstack/react-router'

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isAuthRoute = pathname.startsWith('/auth')

  return (
    <AuthProvider>
      <BarangayScopeProvider>
        {/* ... shell components ... */}
        <Outlet />
        <Footer />
        <PWAInstallBanner />
        {!isAuthRoute && <EmergencySpeedDial />}
        {!isAuthRoute && <KaDaineChatbot />}
        <SessionTimeoutModal />
      </BarangayScopeProvider>
    </AuthProvider>
  )
}
```

#### B. Password Visibility Toggle Token Pattern
Apply uniformly in [`src/routes/auth/sign-in.tsx`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/auth/sign-in.tsx), [`src/routes/auth/sign-up.tsx`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/auth/sign-up.tsx), and [`src/routes/auth/update-password.tsx`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/auth/update-password.tsx):
```tsx
<div className="relative">
  <Input
    placeholder="••••••••"
    type={showPassword ? 'text' : 'password'}
    autoComplete="current-password"
    aria-label="Account password"
    className="min-h-[44px] rounded-xl border-border/90 bg-background/80 pl-10 pr-12 focus-visible:ring-primary/40 text-sm"
    {...field}
  />
  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] p-2 flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-muted/80 active:bg-muted active:scale-95 transition-all cursor-pointer rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 z-10"
    aria-label={showPassword ? 'Hide password' : 'Show password'}
  >
    {showPassword ? (
      <EyeOff className="h-4 w-4" />
    ) : (
      <Eye className="h-4 w-4" />
    )}
  </button>
</div>
```

---

### 3. Subagent File-Lock Assignment

To allow safe parallel implementation without merge conflicts:
* **Builder-Root**: 🔒 [`src/routes/__root.tsx`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/__root.tsx)
* **Builder-Auth**: 🔒 [`src/routes/auth/sign-in.tsx`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/auth/sign-in.tsx), 🔒 [`src/routes/auth/sign-up.tsx`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/auth/sign-up.tsx), 🔒 [`src/routes/auth/update-password.tsx`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/auth/update-password.tsx)

---

### 4. Verification Checklist

- [ ] **Build Validation**: `npx --yes pnpm run build` succeeds with 0 TypeScript, SSR, or Vite errors.
- [ ] **FAB Suppression**: On `/auth/sign-in`, `/auth/sign-up`, `/auth/reset-password`, and `/auth/update-password`, neither `EmergencySpeedDial` nor `KaDaineChatbot` appear in the DOM/viewport.
- [ ] **FAB Restoration**: Navigating to `/` or `/dashboard` immediately renders both floating widgets.
- [ ] **Password Toggle Touch**: Eye button has minimum $44\times 44\text{px}$ touch target, toggles plain text / obscured password, and triggers tactile micro-interactions.
