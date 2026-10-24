---
name: VeriSure AI
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#4d556b'
  on-tertiary: '#ffffff'
  tertiary-container: '#656d84'
  on-tertiary-container: '#eef0ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
  code-tabular:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: -0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.25rem
  margin: 1rem
  margin-desktop: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system targets enterprise compliance officers, institutional risk managers, and forensic document auditors who operate under stringent statutory mandates. The visual signature delivers absolute evidentiary rigor, computational precision, and institutional authority.

The aesthetic fuses modern high-density enterprise SaaS architecture with audit-grade visual restraint:
- **Structural Integrity:** Crisp 1px structural framing, split-pane forensic inspectors, and zero decorative fluff. Every visual mark serves verification and traceability.
- **Dual-Zone Layout Architecture:** A grounding deep navy navigation frame coupled with a clean, high-contrast luminescent slate workspace to eliminate eye fatigue during extensive verification workflows.
- **Forensic Legibility:** Information hierarchy prioritizes verification states, cryptographic checksums, discrepancy flags, and statutory audit trails above visual embellishment.

## Colors

The color system establishes a clear functional separation between platform shell scaffolding, interactive verification surfaces, and statutory status semantics.

### Surface Architecture & Canvas
- **Navigation & Scaffolding (Dark Navy Shell):** Primary rail `#0F172A` with elevated surface `#1E293B` and active hover states `#334155`.
- **Operational Workspace (Light Canvas):** Canvas background `#F8FAFC`, card and pane surfaces `#FFFFFF`, muted utility containers `#F1F5F9`.
- **Structural Borders:** Uniform `#E2E8F0` for workspace dividing planes, forensic bounding boxes, and data tables. `#334155` for dark shell segment dividers.

### Functional Accents
- **Primary Interactive (Tech Blue):** `#2563EB` (Hover: `#1D4ED8`, Active: `#1E40AF`, Subtle container: `#EFF6FF`). Used for primary actions, active tabs, and cryptographic validation triggers.
- **Secondary Verification (Deep Teal):** `#0D9488` (Hover: `#0F766E`, Container: `#F0FDFA`). Identifies AI confidence metrics, algorithmic validations, and secondary analysis triggers.

### Regulatory State System
- **Verified / Compliant:** `#059669` (Text/Icon), `#ECFDF5` (Surface), `#A7F3D0` (Border).
- **Warning / Review Required:** `#D97706` (Text/Icon), `#FFFBEB` (Surface), `#FDE68A` (Border).
- **Critical Mismatch / Discrepancy:** `#E11D48` (Text/Icon), `#FFF1F2` (Surface), `#FECDD3` (Border).
- **Neutral Audit Metadata:** `#64748B` (Text/Icon), `#F8FAFC` (Surface), `#CBD5E1` (Border).

## Typography

Typography prioritizes density, unambiguous glyph differentiation, and numerical tabular alignment.

- **Headlines (Plus Jakarta Sans):** Geometric stability and institutional gravitas. Used for document headers, verification summary titles, and module designations.
- **Interface & Data (Inter):** High x-height, neutral letterforms, and optimized legibility at compact enterprise scales (12px - 13px). Used for form labels, grid contents, and workflow steps.
- **Cryptographic & Hash Metadata (JetBrains Mono):** Required for document SHA-256 signatures, ledger timestamps, OCR extraction raw outputs, and discrepancy diff blocks. Ensure `font-variant-numeric: tabular-nums` across all numeric compliance outputs.

## Layout & Spacing

The layout is constructed on an enterprise fixed-sidebar/fluid-workspace model optimized for 1440px+ workstations with responsive collapsing rules down to 1024px tablet monitors.

### Workspace Architecture
- **Persistent Global Rail:** Fixed 240px navy sidebar (`#0F172A`), collapsible to an icon-only 64px rail on viewports under 1280px.
- **Forensic Dual-Pane Inspector:** Split screen pattern featuring a 50/50 or 60/40 ratio between the original evidentiary document viewer and the extracted AI metadata/discrepancy panel.
- **Rhythm & Grid:** Tight 4px/8px incremental rhythm engineered for maximum screen density without visual collision. Data cells adhere to a compact 36px or standard 44px vertical grid height.
- **Breakpoints:**
  - **Desktop Large (1440px+):** Full 12-column layout, open inspection splits, sticky audit timeline.
  - **Desktop Standard (1200px - 1439px):** Gutter drops to 1rem; sidebar collapses automatically during dual-pane inspection.
  - **Tablet / Small Screen (1024px - 1199px):** Inspection split transforms into a tabbed toggle interface (Document vs. Metadata).

## Elevation & Depth

Visual hierarchy relies on structural planes and subtle, high-spread ambient shadows rather than elevated layers or heavy gradients.

### Tonal Tiers & Separation
- **Level 0 (Base Canvas):** Background `#F8FAFC`. Used behind tables, dashboards, and audit logs.
- **Level 1 (Card & Content Panes):** `#FFFFFF` framed by a clean `1px solid #E2E8F0`. No shadow in resting state.
- **Level 2 (Active/Hover Cards & Popovers):** `#FFFFFF` with `box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.03)` and `border: 1px solid #CBD5E1`.
- **Level 3 (Modal Dialogues & Inspection Drawers):** High-spread administrative elevation: `box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)` over a backdrop wash of `rgba(15, 23, 42, 0.4)`.

### Forensic Borders
Border lines carry the bulk of visual organization:
- Dividers between table rows: `1px solid #F1F5F9`.
- Structural split between panes: `1px solid #E2E8F0`.
- Field discrepancies / highlighting boxes: `1px solid #E11D48` accompanied by a 4% tint fill.

## Shapes

The design system employs a soft, precision-engineered geometric profile (`roundedness: 1`).

- **Interactive Controls & Inputs:** 4px (`0.25rem`) corner radius. Maintains sharp, professional tool lines without severe brutalism.
- **Cards, Modals & Inspector Panels:** 8px (`0.5rem`) corner radius for outer frames (`rounded-lg`), retaining 4px internal nestings.
- **Status Tags & Cryptographic Badges:** 4px (`0.25rem`) radius with clean 1px borders. Never use full pill rounding for status indicators to prevent a playful, casual appearance.
- **Confidence Gauges & Action Bars:** 4px radius for internal meters, preserving strict architectural alignment.

## Components

### Buttons
- **Primary:** Background `#2563EB`, text `#FFFFFF`, 4px radius, font Inter semi-bold 13px, height 36px, horizontal padding `1rem`. Active state `#1E40AF`.
- **Secondary:** Surface `#FFFFFF`, border `1px solid #E2E8F0`, text `#1E293B`, subtle hover `#F8FAFC`.
- **Critical / Reject:** Surface `#FFF1F2`, border `1px solid #FECDD3`, text `#E11D48`, hover `#FFE4E6`.
- **Ghost Action:** Background transparent, text `#64748B`, hover `#F1F5F9`, text `#0F172A`.

### Status Badges
- **Verified:** Background `#ECFDF5`, border `1px solid #A7F3D0`, text `#059669`. Includes standard checkmark icon (`12px`).
- **Under Review:** Background `#FFFBEB`, border `1px solid #FDE68A`, text `#D97706`. Includes clock icon (`12px`).
- **Discrepancy:** Background `#FFF1F2`, border `1px solid #FECDD3`, text `#E11D48`. Includes alert triangle (`12px`).
- **Structure:** Height 22px, padding `0 8px`, font Inter medium 11px uppercase with `0.02em` tracking.

### Form Inputs & Filters
- **Text & Numeric Inputs:** Height 36px, background `#FFFFFF`, border `1px solid #CBD5E1`, text `#0F172A`, placeholder `#94A3B8`. Focused: border `#2563EB`, outline `1px solid #2563EB`.
- **Checkboxes & Radios:** Sharp 4px radius (checkbox) and standard circular (radio). Size 16px. Border `#CBD5E1`. Checked state `#2563EB`.

### Compliance Data Tables
- **Header:** Height 36px, background `#F8FAFC`, border-bottom `1px solid #E2E8F0`, typography label-sm (`#64748B`, uppercase).
- **Row:** Height 44px, alternating hover state `#F8FAFC`, border-bottom `1px solid #F1F5F9`.
- **Alignment:** Cryptographic hashes, currency, and scores strictly right-aligned with `JetBrains Mono` tabular figures.

### Forensic Split Panes
- Continuous `1px solid #E2E8F0` center divider featuring inline zoom, rotation, and side-by-side OCR overlay toggles.
- Discrepancy highlights render with a 1px dashed `#E11D48` bounding box overlaid directly on document coordinates.

### Audit Timeline
- Vertical left-aligned connecting line (`2px solid #E2E8F0`). Node indicators: 8px solid dots colored strictly by verification action (`#059669`, `#2563EB`, or `#D97706`).
- Timestamp text in JetBrains Mono 11px (`#64748B`).