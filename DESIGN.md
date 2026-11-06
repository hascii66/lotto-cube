---
version: alpha
name: LottoCube
description: A Thai lottery statistics workbench inspired by instrument panels and perforated lottery tickets.
colors:
  primary: '#076e82'
  primary-hover: '#06677a'
  ink: '#112b35'
  text: '#243b46'
  muted: '#566a76'
  background: '#f5f7f9'
  surface: '#ffffff'
  border: '#e1e8ed'
  accent-soft: '#e5f4f6'
  cyan: '#78d8e4'
  warning: '#805617'
  warning-soft: '#fff7e8'
  danger: '#b3303b'
  scrollbar-thumb: '#7a8e99'
  scrollbar-track: '#f0f4f6'
  scrollbar-hover: '#647e89'
  scrollbar-active: '#4f6b78'
  ticket: '#112b35'
  surface-soft: '#eff4f6'
  chart-bar: '#c7dfe7'
  on-primary: '#ffffff'
typography:
  display:
    fontFamily: "'Noto Sans Thai Variable', 'Inter Variable', system-ui, sans-serif"
  body:
    fontFamily: "'Noto Sans Thai Variable', 'Inter Variable', system-ui, sans-serif"
  data:
    fontFamily: "'Inter Variable', 'Noto Sans Thai Variable', system-ui, sans-serif"
rounded:
  panel: '12px'
  control: '7px'
spacing:
  page: '37px'
  panel: '23px'
  gap: '20px'
components:
  button:
    height: '42px'
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    rounded: '{rounded.control}'
  button-hover:
    backgroundColor: '{colors.primary-hover}'
    textColor: '{colors.surface}'
  panel:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text}'
    rounded: '{rounded.panel}'
    padding: '{spacing.panel}'
  dialog:
    width: '560px'
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text}'
  ticket:
    backgroundColor: '{colors.ticket}'
    textColor: '{colors.cyan}'
  workspace:
    backgroundColor: '{colors.background}'
    textColor: '{colors.text}'
  heading:
    textColor: '{colors.ink}'
  soft-surface:
    backgroundColor: '{colors.surface-soft}'
  chart-bar:
    backgroundColor: '{colors.chart-bar}'
  secondary-text:
    textColor: '{colors.muted}'
  divider:
    backgroundColor: '{colors.border}'
  selected-navigation:
    backgroundColor: '{colors.accent-soft}'
    textColor: '{colors.primary}'
  warning:
    backgroundColor: '{colors.warning-soft}'
    textColor: '{colors.warning}'
  error:
    textColor: '{colors.danger}'
  scrollbar:
    backgroundColor: '{colors.scrollbar-track}'
  scrollbar-thumb:
    backgroundColor: '{colors.scrollbar-thumb}'
  scrollbar-hover:
    backgroundColor: '{colors.scrollbar-hover}'
  scrollbar-active:
    backgroundColor: '{colors.scrollbar-active}'
---

# LottoCube design system

## Overview

The product is a Thai/English statistical workbench for exploring historical government lottery results, based on the user's supplied brief. It serves Thai readers using phones and laptops. Product register: dense, calm, and transparent; no gambling transactions, prediction guarantees, or invented results.

North Star: a laboratory ledger with an authentic lottery-ticket object. The signature is the midnight-blue result ticket: boxed digits, a perforation separating secondary awards, and a quiet barcode-like motif. All other panels are restrained work surfaces. Avoid casino styling, floating decorative cubes, gradients, neon prediction badges, and generic landing-page heroes.

`src/styles.css :root` is the canonical runtime token source; this frontmatter mirrors those values. A `colors.X` entry maps directly to `--color-X`; typography maps to `--font-display`, `--font-body`, and `--font-data`; rounded maps to `--radius-panel` and `--radius-control`. Shared consumers: `Panel`, `Modal`, `.button`, charts, and the global scrollbar baseline. Update this document and CSS together. No theme adapters or second token systems.

## Colors

Light mode uses cool gray backgrounds, white panels, ink headings, and petroleum-blue actions. Dark mode uses #0d1b24 background, #142630 surface, #1b303c soft surface, #304754 borders, #e6f0f4 headings, #d7e5ec text, #a7bbc7 secondary text, and #83d6e3 primary accents. The single runtime owner is `[data-theme="dark"]` in styles.css. Ticket backgrounds stay #112b35 in both modes, separate from the heading token. On-primary text switches from white to #102a34. Both themes keep semantic warning/error labels and four heatmap levels with actual counts. Theme defaults to the OS and can cycle system → light → dark; local preference survives reload. Bootstrap sets theme before paint. Forced colors use native system colors.

## Typography

Self-hosted Noto Sans Thai Variable handles Thai; Inter Variable handles Latin text and tabular lottery digits. The app packages only Thai and Latin WOFF2 subsets, with system fallbacks and font-display swap. Body baseline is 16px; explanatory copy is 14px and dense captions generally 12px. Small branding/technical annotations are secondary. Forms use 16px inputs on phones to prevent automatic zoom. Numbers have tabular spacing and ordinary zero shapes. Dates follow the selected language: th-TH with Buddhist years or en-GB with Gregorian years, always Asia/Bangkok. Stored dates stay ISO Gregorian. src/lib/i18n.ts and en.json own translation; locale switching updates visible labels, forms, errors, weekdays, document title and html lang without reloading or losing state.

## Layout

Mobile-first usage: layouts fit 320px, settings have 44px targets, filters wrap, and the document owns scrolling. The ticket stacks its secondary awards on narrow phones. Desktop: 238px navigation, 72px toolbar, 37px main gutters, 1520px maximum content. The ticket and contextual note form an asymmetric top row. Four metrics precede three positional plots; structure and sum charts share a row. At 800px navigation becomes an explicitly opened drawer. At 650px panels stack, metrics become two columns, and native filters fill available width. At 440px the ticket stub becomes a horizontal strip. The page owns vertical scrolling; the archive owns horizontal overflow. No viewport height constraint on forms. The mobile note card is omitted because its explanatory content repeats the persistent guide.

## Elevation & Depth

Borders and tonal changes define panels. Shadows are reserved for modal dialogs and status notifications. Native modal backdrop softly dims the workspace. Analytical content never floats or animates into view.

## Shapes

12px panel corners and 7px controls are the primary families. The ticket alone uses simulated perforation cutouts. Lucide icons use consistent 1.7–2px strokes. Number chips are compact rectangles, not pills.

## Components

Homepage priority: the archive-wide Top 10 last-two and last-three award frequencies sit directly after the latest-draw ticket, before analytical filters and graphs. Two quiet panels show five columns of ranked number tiles in two rows; panels stack on mobile and sit side by side from 1100px. The first tile uses the existing primary/soft-accent tokens. Counts and scope stay explicit. Tapping a number opens the canonical Modal with that award's actual draw history. No new token family or chart library.

`components/ui.tsx` owns panels, modal dialogs, empty states, clearable search, and formula disclosure. Global button classes encode solid primary, outline neutral, and solid danger. Hover uses tonal feedback; keyboard focus uses a 3px primary ring; active presses move 1px; disabled controls are faded and cannot activate. Automatic verification retains all usable content and uses a small status indicator; no manual synchronization button. There are no skeletons.

`Modal` wraps native `dialog.showModal()` for focus containment, inert background, Escape, and focus restoration. OS-owned select/date popups are intentional; all owned labels and validation follow the chosen language; OS-owned popups follow the device. `DataManager` owns create/import forms. `Preferences` owns language, theme, install guidance, and app-version updates. Duplicate dates and conflicting imports are explained before a write. Manual entry is guarded against accidental dismissal. Toasts use one stable live region in `App`; critical errors remain inline.

Charts show counts and percentages, and include accessible textual summaries. The shortlist is a heuristic ranking, explicitly distinguished from winning probability. Native tables preserve all columns under mobile horizontal overflow. Use real links for navigation, real buttons for actions. Motion is limited to 160ms state transitions and automatic checks; reduced motion disables animation. The production manifest, PNG and maskable icons, self-hosted fonts, and versioned service worker support home-screen installation and offline reopening. API responses are never represented as fresh by an offline cache.

## Do's and Don'ts

- Keep the result date, source, sample size, and scoring explanation visible or directly available.
- Use the same actions, labels, focus styles, and modal behavior across 3D, 2D, and archive screens.
- Preserve numeric strings, including `00`, `008`, and `097863`.
- Never label an old stored draw as the current official result.
- Never imply that frequent or absent numbers are more likely to win a future independent draw.
