# DESIGN.md - BrgyConnect Authoritative Design System & UI Specification

> **MANDATORY SPECIFICATION**: This document serves as the absolute, non-negotiable authoritative design standard for all present and future UI components, pages, widgets, consoles, and interactions across BrgyConnect (`ag-brgy-connect`). All AI models, agents, and engineers MUST strictly comply with these rules. Zero deviations permitted.

---

## 1. Core Philosophy & Design Identity

BrgyConnect is a real-world municipal platform serving citizens, small business owners, and local government officials of **Barangay Daine 1 & Barangay Daine 2 (Indang, Cavite, Philippines)**. 

The aesthetic is:
* **Grounded, institutional, and trust-first**
* **Direct, highly scannable, and usable in tropical sunlight**
* **Free of generic AI tropes and decorative synthetic fluff ("Anti-Slop")**

### 1.1 The "Anti-Slop" Core Invariants (STRICTLY ENFORCED)
1. **Zero Gradients on UI Controls & Surfaces**:
   - Strictly banned: `bg-gradient-to-*`, `bg-linear-to-*`, diagonal washes, rainbow card backgrounds (`emerald-500/10`, `purple-500/10`).
   - All cards, headers, panels, sidebars, and dialogs MUST use solid, opaque surfaces (`bg-card`, `bg-background`, `bg-muted/40`).
   - Exception: The official Philippine Flag 3-color accent strip (`#0038A8`, `#FCD116`, `#CE1126`) used strictly as a thin 2px-6px header ribbon.
2. **Zero Ambient Lighting Disks & Glow Orbs**:
   - Strictly banned: `rounded-full blur-3xl`, `blur-2xl`, glowing radial meshes, and decorative background halos.
3. **Zero Decorative Glassmorphism on Content Containers**:
   - Strictly banned: `backdrop-blur-*` on content cards, modal dialogs, and tables. All content cards must have solid 100% opaque backgrounds (`bg-card`) with crisp 1px borders (`border-border`).
   - Sticky navigation bars and floating speed dials may use `backdrop-blur-md` with `bg-card/95` only to prevent text bleed while scrolling.
4. **Zero Consumer Emojis in UI**:
   - Strictly banned: Any emoji characters (e.g., 🚨, 🤖, ⚖️, ⚡, 🎉, 📞, 💬, 🔍, ✅, ❌) in button labels, toasts, badges, or notification strings.
   - Use strictly typed **Lucide React** icon primitives (`<Siren />`, `<Gavel />`, `<CheckCircle2 />`, `<FileText />`, `<Phone />`).
5. **No Decorative Sparkles (`<Sparkles />`) on Civic Records**:
   - Strictly banned: Sparkle icons on government seals, clearance cards, resident IDs, certificates, and admin desks. Clearances and blotters are legal documents.
6. **No AI Buzzwords & Slop Terminology**:
   - Strictly banned: "Civic Horizon", "Next-Gen Synergy", "Revolutionizing Municipal Landscape", "Seamless Ecosystem", "Delightful".
   - Required: Formal Philippine Local Government Code (RA 7160) civic terminology:
     - *Tanggapan ng Punong Barangay* / *Office of the Punong Barangay*
     - *Sangguniang Barangay*
     - *Katarungang Pambarangay (Lupon Tagapamayapa)*
     - *Barangay Clearance & Certification Desk*
     - *Barangay Tanod Emergency Patrol Desk*
7. **Zero Em-Dash (`—`) Rule**:
   - Never use `—` as decorative typography or dividers. Use standard hyphens `-` or bullet points `•`.

---

## 2. Color System & Palette Invariants

The color system is calibrated in perceptual OKLCH tokens for full compliance with **WCAG AAA** contrast ($>7:1$ for body copy, $>4.5:1$ for large text).

### 2.1 Allowed Palette & Tokens

```
┌────────────────────────────────────────────────────────────────────────┐
│                   PRIMARY CIVIC BLUE: #0C2B64 / #0038A8                │
│         Authoritative, governmental, steady, high-contrast             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         ▼                                                     ▼
┌─────────────────────────────────┐   ┌──────────────────────────────────┐
│      ACCENT: KALAYAAN GOLD      │   │    SAFETY: ALERT / BLOTTER RED   │
│   #D99B00 / #C98A0C / #FCD116   │   │        #B91C1C / #CE1126         │
│  Official seal accent, pinned   │   │  Reserved STRICTLY for emergency │
│  bulletins, active tabs, stamps │   │  hotlines, blotter & live alerts │
└─────────────────────────────────┘   └──────────────────────────────────┘
```

#### Light Mode Token Architecture
| Semantic Role | Token Variable | Tailwind Class | Contrast Purpose |
| :--- | :--- | :--- | :--- |
| **Canvas** | `--background` | `bg-background` | Clean, crisp, non-glare off-white ground |
| **Card Surface** | `--card` | `bg-card` | Solid 100% white card containers |
| **Primary Text** | `--foreground` | `text-foreground` | Deep slate-black text ($>14:1$ contrast) |
| **Muted Surface** | `--muted` | `bg-muted` | Recessed inputs, table header fills, tag backgrounds |
| **Muted Text** | `--muted-foreground`| `text-muted-foreground`| Metadata, secondary descriptions, timestamps |
| **Border / Hairline** | `--border` | `border-border` | Crisp 1px structural separation |
| **Primary Brand** | `--primary` | `bg-primary` / `text-primary`| Official Philippine deep navy |
| **Destructive / Red** | `--destructive` | `bg-destructive` | High-priority safety, delete actions, emergency |

#### Dark Mode Token Architecture
| Semantic Role | Token Variable | Tailwind Class | Contrast Purpose |
| :--- | :--- | :--- | :--- |
| **Canvas** | `--background` | `bg-background` | Deep slate-navy off-black (`oklch(0.14 0.02 255)`) |
| **Card Surface** | `--card` | `bg-card` | Solid elevated container (`oklch(0.18 0.025 255)`) |
| **Primary Text** | `--foreground` | `text-foreground` | Crisp, legible off-white text (`#F3F4F6`) |
| **Muted Surface** | `--muted` | `bg-muted` | Recessed fills (`oklch(0.22 0.025 255)`) |
| **Muted Text** | `--muted-foreground`| `text-muted-foreground`| Clear legible secondary copy |
| **Border** | `--border` | `border-border` | Subtle hairline divider (`oklch(0.28 0.03 255)`) |

### 2.2 Color Discipline & Enforcement Rules
* **Banned Arbitrary Colors**: Never introduce uncontrolled purple (`#8b5cf6`), violet, neon pink, or arbitrary electric gradients.
* **Jurisdiction Color Rules**:
  - **Barangay Daine 1**: Civic Navy (`#0038A8`, `text-blue-600`, `bg-blue-100 dark:bg-blue-950`).
  - **Barangay Daine 2**: Civic Red/Rose (`#CE1126`, `text-rose-600`, `bg-rose-100 dark:bg-rose-950`).
  - **Dual Jurisdiction / Super Admin**: Neutral Slate (`text-slate-700`, `bg-slate-100 dark:bg-slate-800`).
* **Safety Red Isolation**: Red (`#B91C1C`) is strictly banned from general badges, marketing cards, or decorative borders. It is used strictly for:
  1. Emergency Speed Dial FAB & Responders (`/emergency`)
  2. Blotter & Police reports (`/complaints`)
  3. Irreversible destructive actions (Delete, Reject, Revoke)

---

## 3. Typography Hierarchy & Strict Specs

### 3.1 Font Families
* **Interface Body & Headings**: `Plus Jakarta Sans`, system-ui, -apple-system, sans-serif
* **Data, Reference Numbers, Tracking IDs**: `JetBrains Mono`, monospace (e.g., `BD1-8F3A29D1`, `REQ-2026-0001`, QR codes, control numbers)

### 3.2 Type Scale
| Level | Tailwind Classes | Usage |
| :--- | :--- | :--- |
| **Display Title** | `text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight` | Landing Hero only (Max 2 lines) |
| **Page Header** | `text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground` | Top of major screens |
| **Card Title** | `text-base sm:text-lg font-bold text-foreground` | Cards, directory items, modal titles |
| **Body Copy** | `text-sm sm:text-base text-muted-foreground leading-relaxed max-w-[65ch]` | Explanations, instructions, descriptions |
| **Metadata / Badges**| `text-xs font-semibold uppercase tracking-wider` | Category pills, jurisdiction tags, statuses |
| **Tracking Codes** | `font-mono text-sm sm:text-base font-bold tracking-wider` | Document reference numbers, IDs |

---

## 4. The 3 Authoritative Screen Layout Archetypes

Every current and future page in BrgyConnect MUST strictly inherit one of these three architectural layouts:

### Archetype 1: Collection / Data Directory
*Used in:* `/directory`, `/announcements`, `/events`, `/officials`, `/admin/*`, `/admin/barangays`

```
┌────────────────────────────────────────────────────────────────────────┐
│ Page Header: Title + Clear Civic Context + [Primary Action CTA]        │
├────────────────────────────────────────────────────────────────────────┤
│ Filter & Search Strip:                                                 │
│ [Search Input (min 44px)] | [Barangay Scope Switcher] | [Category Pills]│
├────────────────────────────────────────────────────────────────────────┤
│ Data Grid or Table:                                                    │
│ ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────┐ │
│ │ Solid Card (bg-card) │ │ Solid Card (bg-card) │ │ Solid Card ...   │ │
│ │ 1px border-border    │ │ 1px border-border    │ │                  │ │
│ │ Title + Details      │ │ Title + Details      │ │                  │ │
│ │ Min 44px Action Link │ │ Min 44px Action Link │ │                  │ │
│ └──────────────────────┘ └──────────────────────┘ └──────────────────┘ │
├────────────────────────────────────────────────────────────────────────┤
│ Summary & Pagination: "Showing X of Y verified records"               │
└────────────────────────────────────────────────────────────────────────┘
```

### Archetype 2: Entity Detail & Verification
*Used in:* `/verify/$requestId`, `/verify/resident/$residentId`, `/directory/$businessId`, `/complaints/$id`

```
┌────────────────────────────────────────────────────────────────────────┐
│ Back Link (e.g., "← Back to Public Directory")                         │
├───────────────────────────────────┬────────────────────────────────────┤
│ Left Column (8 cols):             │ Right Sidebar (4 cols, sticky):    │
│ - Official Header & Flag Ribbon   │ - Quick Actions (Print, Download)  │
│ - Verified Record Table           │ - Official Seal / QR Verification  │
│ - 4-Stage Progress Stepper        │ - Direct Emergency / Support Desk  │
└───────────────────────────────────┴────────────────────────────────────┘
```

### Archetype 3: Form / Creation Workflow
*Used in:* `/documents/request`, `/complaints/new`, `/businesses/new`, `/auth/sign-in`, `/auth/sign-up`

```
┌────────────────────────────────────────────────────────────────────────┐
│ Workflow Header (Clear instruction, zero distraction)                  │
├────────────────────────────────────────────────────────────────────────┤
│ Single-Column Card Container (max-w-2xl or max-w-lg mx-auto):          │
│ - Visible field labels with explicit required marker (*)               │
│ - Inputs with min-h-[44px], crisp border, explicit focus ring          │
│ - Real-time inline field validation errors directly below input        │
│ - Primary Submit Button (min-h-[44px], bg-primary, btn-tactile)        │
│ - Secondary Cancel / Back Link                                         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Component Standards & Micro-Interactions

### 5.1 Interactive Touch Targets & Buttons
* **Minimum Touch Target**: Every button, link, switch, and dropdown trigger MUST have a bounding box of at least **$44 \times 44\text{px}$** (`min-h-[44px]`).
* **Physical Tactile Feedback**:
  ```css
  .btn-tactile {
    box-shadow: 0 2px 0 0 rgba(0, 0, 0, 0.15);
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .btn-tactile:active {
    transform: translateY(2px);
    box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
  }
  ```
* **No Exaggerated Float**: Maximum hover elevation is `-translate-y-[2px]` (hover float of `-5px` is strictly banned).

### 5.2 Standard Corner Radii
* **Inputs, Buttons, Dropdowns**: `rounded-xl` (`12px` / `0.75rem`)
* **Cards, Banners, Dialog Modals**: `rounded-2xl` (`16px` / `1.0rem`)
* **Badges, Pills, Status Indicators**: `rounded-full` (`9999px`)

### 5.4 The Philippine Flag Segmented Ribbon
* To celebrate civic identity without messy gradients, use a clean 3-segment horizontal bar:
  ```tsx
  <div className="flex h-1.5 w-full overflow-hidden rounded-full mb-4">
    <div className="w-[45%] bg-[#0038A8]" />
    <div className="w-[10%] bg-[#FCD116]" />
    <div className="w-[45%] bg-[#CE1126]" />
  </div>
  ```
* **Strict Rule**: Never blur or feather this divider. It must have sharp geometric boundaries.

### 5.5 Chart & Data Visualization Palette (Recharts)
* Banned: Random neon purple/violet lines or multi-color gradients.
* Primary Trend / Velocity Lines: Civic Navy `#0C2B64` (Light) / `#38BDF8` (Dark).
* Bar & Metric Visualizations:
  - Total Volume / Applications: Civic Navy `#0038A8`
  - Ready / Completed / Approved: Emerald `#16A34A`
  - Processing / Pending: Kalayaan Amber `#D99B00`
  - Critical / Blotter / Escalated: Alert Red `#CE1126`

### 5.6 Status Badge & Queue Standardization
All status pills across admin tables, resident tracking, and Lupon conciliation desks must use this strict semantic mapping:
| Status | Semantic Purpose | Light Tokens | Dark Tokens |
| :--- | :--- | :--- | :--- |
| `pending` / `submitted` | Awaiting review | `bg-amber-100 text-amber-900 border-amber-300` | `bg-amber-950/40 text-amber-300 border-amber-800` |
| `investigating` / `in_progress` | Active staff work | `bg-blue-100 text-blue-900 border-blue-300` | `bg-blue-950/40 text-blue-300 border-blue-800` |
| `scheduled_hearing` / `summon` | Lupon mediation set | `bg-sky-100 text-sky-900 border-sky-300` | `bg-sky-950/40 text-sky-300 border-sky-800` |
| `ready_pickup` / `completed` | Ready for citizen | `bg-emerald-100 text-emerald-900 border-emerald-300` | `bg-emerald-950/40 text-emerald-300 border-emerald-800` |
| `rejected` / `dismissed` | Terminated / Denied | `bg-rose-100 text-rose-900 border-rose-300` | `bg-rose-950/40 text-rose-300 border-rose-800` |

### 5.7 Ban on Sub-12px Micro-Text
* **Strict Floor**: `text-[10px]` is strictly prohibited across all screens.
* Sub-12px micro-text strains citizen readability on mobile devices in tropical conditions.
* Smallest allowed text is `text-xs font-semibold` (`12px`) or `text-[11px] font-bold uppercase tracking-wider` reserved strictly for compact table status badges.

---

## 6. Pre-Commit Quality & Anti-Slop Audit Checklist

Before any code modification or new feature is committed, the engineering agent MUST perform this audit:

- [ ] **No Gradients**: Zero `bg-gradient-to-*` or `bg-linear-to-*` on cards, headers, or backgrounds.
- [ ] **No Blur Disks**: Zero `rounded-full blur-3xl` or ambient lighting glow divs.
- [ ] **No Glassmorphism on Cards**: All cards use solid `bg-card` with opaque contrast.
- [ ] **No Emojis**: Zero consumer emojis in buttons, toasts, notifications, or copy; Lucide icons used exclusively.
- [ ] **No Sparkles on Legal UI**: `<Sparkles />` banned from certificates, seals, IDs, and admin modules.
- [ ] **No Em-Dash**: Zero instances of `—` in copy text.
- [ ] **No Sub-12px Micro-Text**: All labels and captions $\ge 12\text{px}$ (`text-xs font-semibold`), except `text-[11px]` for uppercase badges.
- [ ] **Zero Stray Purple/Indigo**: Only canonical Civic Blue, Sky, Kalayaan Amber, and Civic Red tokens permitted.
- [ ] **Touch Targets**: All interactive elements $\ge 44 \times 44\text{px}$.
- [ ] **Dark & Light Mode Contrast**: Verified readable in both modes ($>7:1$ text contrast).
- [ ] **Build Integrity**: `pnpm exec tsc --noEmit` and `pnpm run build` pass with **0 errors**.
