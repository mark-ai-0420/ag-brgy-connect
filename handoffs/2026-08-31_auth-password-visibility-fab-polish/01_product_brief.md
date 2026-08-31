# 📦 Stage 1: Product Strategy Brief
## Auth Password Visibility & Floating Widget Suppression Polish

> **Feature Slug:** `auth-password-visibility-fab-polish`  
> **Date:** 2026-08-31  
> **Author:** Node 1 — Product Strategist (`45ee6b25-d500-4f7a-958a-2c4ba1c88a77`)  
> **Handoff Target:** Node 2 — Lead Product Designer (`1ee4baed-7b22-40f0-a209-9a6a511bd8f3`)

---

### 1. Executive Summary & Problem Statement
* **User Problem**: 
  1. On mobile screens, the floating `EmergencySpeedDial` (red phone FAB) and `KaDaineChatbot` (blue chat bubble) sit fixed at the bottom right/left of the viewport. When residents scroll through authentication forms ([`/auth/sign-in`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/auth/sign-in.tsx) and [`/auth/sign-up`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/auth/sign-up.tsx)), these floating widgets hover directly over the password and confirm password inputs, physically blocking the password visibility toggle (`Eye`/`EyeOff` icon button).
  2. The eye toggle icon currently has low-contrast resting color (`text-muted-foreground`) which can feel subtle on budget screens or under bright sunlight.
* **North Star Metric**: 
  - **100% unobstructed password fields** on all mobile viewports (<640px).
  - **Zero touch collision** between floating civic widgets and form inputs during login/registration.

---

### 2. Proposed Scope & Acceptance Criteria

#### A. Suppress Floating FABs on Auth Routes
* **Requirement**: In [`src/routes/__root.tsx`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/__root.tsx) or in the respective component wrappers (`EmergencySpeedDial` and `KaDaineChatbot`), check the current route pathname using `useRouterState({ select: s => s.location.pathname })`.
* **Rule**: If the pathname starts with `/auth` (e.g., `/auth/sign-in`, `/auth/sign-up`, `/auth/reset-password`, `/auth/update-password`), do **NOT** render the floating `EmergencySpeedDial` and `KaDaineChatbot` buttons.
* **Rationale**: Authentication screens require maximum focus and unobstructed mobile form inputs.

#### B. Enhance Password Visibility Toggle UX
* **Requirement**: In [`src/routes/auth/sign-in.tsx`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/auth/sign-in.tsx), [`src/routes/auth/sign-up.tsx`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/auth/sign-up.tsx), and [`src/routes/auth/update-password.tsx`](file:///Users/markhuelgas/Documents/antigravity/ag-brgy-connect/src/routes/auth/update-password.tsx):
  1. Add subtle tactile background affordance on the button (`hover:bg-muted/80 active:bg-muted p-1.5 rounded-lg`).
  2. Ensure minimum touch target is strictly **44×44px**.
  3. Ensure `z-10` positioning so the button is never occluded by input container styling.
  4. Ensure clear `aria-label="Show password"` / `aria-label="Hide password"`.

---

### 3. Acceptance Criteria (Given-When-Then)

* **Scenario 1: Mobile Sign-In Form is Completely Unobstructed**
  * **Given** a resident browsing `/auth/sign-in` on a mobile device (375px viewport),
  * **When** the page renders,
  * **Then** no floating emergency dial or chatbot bubble hovers over the form,
  * **And** the password input with its eye toggle is 100% visible and unblocked.

* **Scenario 2: Password Visibility Toggle Tapping**
  * **Given** a resident typing a password in `/auth/sign-up`,
  * **When** they tap the Eye icon button,
  * **Then** the input text toggles from `••••••••` to plain text,
  * **And** the icon changes to `EyeOff` with instant tactile feedback.

* **Scenario 3: Non-Auth Pages Retain Floating Widgets**
  * **Given** a resident navigating from `/auth/sign-in` back to the homepage (`/`) or `/emergency`,
  * **When** the route changes,
  * **Then** the `EmergencySpeedDial` and `KaDaineChatbot` render normally as expected.

---

### 4. Target Files
1. `src/routes/__root.tsx` (Route-aware suppression of `EmergencySpeedDial` and `KaDaineChatbot`)
2. `src/routes/auth/sign-in.tsx` (Refine Eye toggle styling and touch affordance)
3. `src/routes/auth/sign-up.tsx` (Refine Eye toggle styling on Password and Confirm Password)
4. `src/routes/auth/update-password.tsx` (Refine Eye toggle styling)
