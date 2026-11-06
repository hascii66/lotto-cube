---
name: LottoCube
description: Thai/English historical lottery archive and statistics guide for phones and laptops.
colors:
  primary: '#0868cf'
  primary-hover: '#0758b1'
  ink: '#1d2024'
  text: '#282b2e'
  muted: '#5d6268'
  background: '#fffaf3'
  surface: '#fffdf9'
  border: '#d7d2ca'
  accent-soft: '#e7f0ff'
  warning: '#805617'
  warning-soft: '#fff3d1'
  danger: '#b3303b'
  surface-soft: '#f4f0e9'
  pick-accent: '#fff0bb'
  pick-leader: '#ffe79a'
  route-green: '#27b648'
  route-blue: '#0873d6'
  route-red: '#eb4652'
  on-primary: '#ffffff'
typography:
  display:
    fontFamily: "'Noto Sans Thai Variable', 'Inter Variable', system-ui, sans-serif"
    fontSize: '38px'
    fontWeight: 750
    lineHeight: 1.45
  body:
    fontFamily: "'Noto Sans Thai Variable', 'Inter Variable', system-ui, sans-serif"
    fontSize: '16px'
    fontWeight: 400
    lineHeight: 1.9
  data:
    fontFamily: "'Inter Variable', 'Noto Sans Thai Variable', system-ui, sans-serif"
    fontWeight: 600
rounded:
  panel: '20px'
  control: '15px'
  chip: '25px'
spacing:
  desktop-page: '32px 37px'
  mobile-page: '7px 16px'
  panel: '18px'
  row: '44px'
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    rounded: '{rounded.control}'
    height: '46px'
  button-neutral:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.ink}'
    rounded: '{rounded.control}'
    height: '46px'
  panel:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.text}'
    rounded: '{rounded.panel}'
    padding: '{spacing.panel}'
  ranked-number:
    backgroundColor: '{colors.pick-accent}'
    textColor: '{colors.ink}'
    rounded: '{rounded.chip}'
---

# Design System: LottoCube

## Overview

**Creative North Star: "The City Wayfinder"**

LottoCube is a calm, direct way to move through historical lottery results. Warm paper surfaces set the ground; blue marks the selected action; ranked number pairs stay large and easy to scan. The approved first screen is `.impeccable/mocks/city-wayfinding-01.png`. Its colored route is adapted to links for real app sections. It never draws a connection between lottery numbers.

The system serves Thai and English readers on phones and laptops. The first view lets people choose a draw and award type, scan ten ranked numbers, and move to analysis, number checking, or the archive. Existing data management, filters, history, preferences, and guides remain part of the same workspace.

**Key Characteristics:**

- Warm paper ground with quiet borders.
- Blue selection and amber number chips.
- Full-width ranked rows and direct section links.
- Historical scores are labeled as an index, never winning odds.

## Colors

The primary color is clear blue against a warm neutral base. Status colors keep their meaning; route colors identify link stops only.

### Primary

- **LottoCube blue**: selected category, active navigation, and primary actions.

### Neutral

- **Warm paper** is the light workspace ground; **soft white** is used for cards and controls.
- **Charcoal** is used for headings and important numbers; **body charcoal** carries readable copy.
- **Warm border** separates panels and rows; **muted gray** carries secondary information.
- **Pale blue** marks selected navigation. **Amber** marks ranked number chips.

### Named Rules

**The Route Is Navigation Rule.** Connect only actual app sections. Never connect lottery results or imply a relationship among numbers.

**The Score Is Not Odds Rule.** Keep the historical-ranking explanation visible or one tap away wherever scores appear.

## Typography

**Display Font:** Noto Sans Thai Variable with Inter Variable and system sans-serif fallbacks.
**Body Font:** Noto Sans Thai Variable with Inter Variable and system sans-serif fallbacks.
**Label/Data Font:** Inter Variable with Noto Sans Thai Variable fallback; tabular numerals for dates, ranks, and scores.

**Character:** Bold Thai headings and clear numerals establish a strong scan path. Body copy stays regular and comfortably spaced.

### Hierarchy

- **Display** (weight 750, 30–42px, 38px on phones, 1.45 line-height): page titles.
- **Title** (weight 650–700, 16–20px): panel titles and section labels.
- **Body** (weight 400, 14–16px, about 1.9 line-height): explanations and controls.
- **Label** (weight 500–650, 11–14px): navigation, rank, and metadata.
- **Data** (weight 600–750): numeric results and score indices with tabular spacing.

## Layout

Mobile uses normal document scrolling, a compact header with direct search and menu actions, and a persistent five-item bottom bar for Picks, 3 digits, 2 digits, Check, and Archive. The drawer holds preferences, the guide, and data-management actions. Leave space for the bottom bar and safe-area insets. At 320px, controls wrap only where intended; the page itself does not scroll horizontally.

Desktop keeps the 238px navigation sidebar, 72px header, and up to 1520px main content. Page gutters are 37px at desktop widths and 16px on narrow phones. Analytical panels stack below 650px; data tables preserve columns with local horizontal overflow.

## Elevation & Depth

Borders and warm tonal layers define cards. Shadows remain restrained: the fixed mobile navigation uses a soft top shadow, and dialogs/status notices may sit above the workspace. The paper texture is a subtle background material and is removed in dark mode.

## Shapes

Cards use rounded 20px corners. Controls use 15px corners; number chips use a broad pill. Ranked rows use thin horizontal separators. Wayfinding nodes are circular markers on a three-color line and remain links, not decorative data marks.

## Components

### Buttons

Primary buttons use LottoCube blue with white text. Neutral controls use a near-white fill and warm-gray outline. Category choices are equally wide; the selected choice is blue. Keep a visible 3px keyboard-focus ring.

### Cards / Containers

Panels use soft-white surfaces, a 1px warm border, 20px corners, and 18px internal padding. No hard shadow is used on analytical content.

### Inputs / Fields

Selectors and inputs use a soft-white fill, 1–2px warm border, and 15px corners. The draw selector includes a calendar icon; keep its visible label available to assistive technology.

### Navigation

Desktop uses a full-height sidebar with a pale-blue active state. Mobile uses five direct links in the bottom bar, a menu button in the header, and route stops as compact shortcuts on the picks page. Use `aria-current` for active routes.

### Ranked Number Row

Each row shows its rank in a warm-gray chip, the number in amber, and the score separated by a vertical rule. One award category is shown at a time; the ten rows fit the approved 426×923 CSS-pixel phone viewport.

## Do's and Don'ts

### Do:

- **Do** keep draw date, sample size, formula, and score meaning available beside ranked data.
- **Do** preserve leading zeroes and use real archive values.
- **Do** use the route line only for actual navigation links.

### Don't:

- **Don't** describe a score as a probability or promise of winning.
- **Don't** add weekday weighting without evidence from held-out results.
- **Don't** connect or group number results with the wayfinding route.
