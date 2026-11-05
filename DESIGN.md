---
name: "KV-TV Theme (kv-tv-theme)"
description: "Pure OLED black Metro Typographic Panorama design system with giant light-weight lowercase pivots, flat saturated color-block live tiles, and razor-sharp 10-foot D-Pad focus geometry."
colors:
  cobalt: "#0078D7"
  violet: "#6B21A8"
  teal: "#008272"
  crimson: "#D83B01"
  vermilion: "#B91C1C"
  emerald: "#107C10"
  amber: "#B45309"
  oled-void: "#000000"
  surface-chrome: "#0A0A0A"
  surface-card: "#121212"
  surface-elevated: "#1C1C1C"
  ink-primary: "#FFFFFF"
  ink-secondary: "#D4D4D4"
  ink-muted: "#8E8E8E"
  border-hairline: "#262626"
  border-strong: "#454545"
typography:
  display:
    fontFamily: "'Work Sans', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(2.8rem, 5vw, 4.6rem)"
    fontWeight: 200
    lineHeight: 0.95
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "'Work Sans', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(2.2rem, 3.2vw, 3.25rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  title:
    fontFamily: "'Work Sans', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(1.35rem, 1.8vw, 1.85rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  body:
    fontFamily: "'Work Sans', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  label:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.04em"
rounded:
  none: "0px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "20px"
  xl: "32px"
components:
  tile-cobalt:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.ink-primary}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "24px"
  tile-violet:
    backgroundColor: "{colors.violet}"
    textColor: "{colors.ink-primary}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "24px"
  tile-teal:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.ink-primary}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "24px"
  tile-crimson:
    backgroundColor: "{colors.crimson}"
    textColor: "{colors.ink-primary}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "24px"
  tile-emerald:
    backgroundColor: "{colors.emerald}"
    textColor: "{colors.ink-primary}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "24px"
  button-primary:
    backgroundColor: "{colors.ink-primary}"
    textColor: "{colors.oled-void}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "12px 18px"
  button-primary-hover:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.ink-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "12px 18px"
  button-danger:
    backgroundColor: "{colors.crimson}"
    textColor: "{colors.ink-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "12px 18px"
  input-field:
    backgroundColor: "{colors.oled-void}"
    textColor: "{colors.ink-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    padding: "12px 14px"
---

# Design System: KV-TV Theme (kv-tv-theme)

## Overview

**Creative North Star: "The OLED Typographic Panorama"**

`kv-tv-theme` is an unapologetically flat, razor-sharp 10-foot and desktop design system rooted in the Digital Design Canon of Windows Phone 7 / Zune HD Metro (`digital-design-canon-metro-typographic-tiles`). Rather than wrapping content in translucent glass panels, blurred backdrops, or rounded card chrome, the interface treats typography, flat high-chroma color planes, and pure OLED black void (`#000000`) as the sole structural materials. Oversized light-weight lowercase panorama pivot headers anchor the top of every stage, while asymmetric multi-span live tiles (`2×2` hero, `2×1` wide, `1×1` square) carry crisp geometric vector glyphs, bottom-left bold lowercase titles, and monospace telemetry stamps.

Every surface is engineered simultaneously for a 10-foot living-room television navigated by a 5-way Android TV D-Pad remote (`ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Enter`) and a high-density desktop browser or admin console. Focus is never ambiguous: active tiles snap forward (`scale(1.022)`) with a 4px solid white perimeter frame (`outline: 4px solid #FFFFFF; outline-offset: 2px`) and zero blurred glow.

The system explicitly rejects all contemporary AI-slop tropes: no `backdrop-filter: blur()`, no radial neon glows, no rounded corners (`border-radius: 0px` everywhere), no gradient text or gradient tile backgrounds, and no decorative chrome.

**Key Characteristics:**
- Pure OLED pitch-black canvas (`#000000`) that turns off unlit television pixels and maximizes chromatic pop.
- Giant light-weight (`font-weight: 200`) lowercase panorama pivot headers (`store`, `pre-sets`, `short-codes`, `phone-qr`, `overview`, `applications`, `promotions`) that establish hierarchy through scale and opacity contrast alone.
- Unmodulated, high-chroma flat color-block tiles (`cobalt`, `violet`, `teal`, `crimson`, `vermilion`, `emerald`, `amber`) paired exclusively with crisp white ink (`#FFFFFF`).
- Strict `0px` corner radius across every tile, button, badge, modal dialog, table, and input control.
- 10-foot D-Pad spatial readiness with `4px solid #FFFFFF` focus rings, 2D bounding-box roving `tabindex`, and `tabular-nums` monospace short-code stamps.

## Colors

The `kv-tv-theme` palette contrasts an absolute pitch-black OLED stage with seven unmodulated, saturated architectural color blocks calibrated to maintain WCAG AA contrast against pure white (`#FFFFFF`) foreground typography and iconography.

### Primary
- **Metro Cobalt** (`#0078D7`): Primary brand accent, active top-bar state, primary button hover fill, and the signature color block for CloudStream 3 (`cloudstream-kv`, `88103`) and primary system actions.
- **Royal Violet** (`#6B21A8`): Primary media-server color block assigned to Jellyfin TV (`jellyfin-kv`, `88101`) and secondary KPI telemetry blocks.
- **Metro Teal** (`#008272`): Home-theater and repository color block assigned to Kodi 21 Omega (`kodi-kv`, `88102`) and configuration bundle actions.

### Secondary
- **Cinema Crimson** (`#D83B01`): High-energy streaming accent assigned to KV-Netflix (`netflix-kv`, `88104`), destructive/reset buttons, and alert banners.
- **Broadcast Vermilion** (`#B91C1C`): Ad-free video and live broadcast color block assigned to KV-Tube / SmartTube (`youtube-kv`, `88105`).

### Tertiary
- **Signal Emerald** (`#107C10`): Interactive utility accent for the AFTVnews 5-Digit Short-Code Dialer, live CDN online status indicators, and active promotion badges.
- **Editorial Amber** (`#B45309`): Companion utility accent for the Phone & TV QR Sideload Companion tile, featured promotion highlights, and warning callouts.

### Neutral
- **OLED Void** (`#000000`): The canonical root background for `html`, `body`, the live tile matrix gutter, and recessed data wells.
- **Surface Chrome** (`#0A0A0A`): Persistent top navigation switcher bars, command toolbars, and the floating D-Pad remote simulator housing.
- **Surface Card** (`#121212`): Secondary non-tile utility containers, admin data panels, and modal dialog bodies.
- **Surface Elevated** (`#1C1C1C`): Interactive keypad keys, table header strips, and secondary D-Pad buttons at rest.
- **Ink Primary** (`#FFFFFF`): Primary text, active panorama pivot headers, vector tile glyphs, and high-visibility focus borders.
- **Ink Secondary** (`#D4D4D4`): Supporting deck copy, table cell values, and inactive navigation links.
- **Ink Muted** (`#8E8E8E`): Metadata labels, inactive panorama pivots (`rgba(255, 255, 255, 0.58)`), and secondary timestamps.
- **Border Hairline** (`#262626`): 1px structural dividers separating headers, table rows, and spec grids (`rgba(255, 255, 255, 0.18)` on translucent surfaces).
- **Border Strong** (`#454545`): High-contrast borders for interactive dialer keys, form inputs, and secondary buttons (`rgba(255, 255, 255, 0.38)`).

### Named Rules
**The Unmodulated Color-Block Rule.** Every live tile and KPI block must use a single flat solid CSS color (`background-color`) with zero linear or radial gradients, zero internal drop shadows, and zero background photography bleed.

**The True OLED Pitch-Black Rule.** The root stage (`html`, `body`, `.metro-grid`) must always be pure `#000000` so that the `12px` grid gutters read as physical void between illuminated color planes on OLED television panels.

**The Brand-Locked Tile Color Rule.** Each flagship application and utility owns a permanent semantic tile color (`cobalt` for CloudStream 3, `violet` for Jellyfin TV, `teal` for Kodi 21, `crimson` for KV-Netflix, `vermilion` for KV-Tube, `emerald` for Short-Code Dialer, `amber` for Phone QR) that carries across the storefront, modal banners, and admin dashboards.

## Typography

**Display Font:** `Work Sans` (with `'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif` fallback)
**Body Font:** `Work Sans` (with `'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif` fallback)
**Label/Mono Font:** `JetBrains Mono` (with `monospace` fallback)

**Character:** Geometric, humanist-inflected sans-serif (`Work Sans`) that captures the iconic Swiss-meets-Zune contrast between razor-thin `200` weight giant lowercase panorama headers and tight `700` weight tile titles, paired with industrial `JetBrains Mono` for 5-digit short-codes, SHA/package identifiers, and live install counters.

### Hierarchy
- **Display** (`200` ExtraLight, `clamp(2.8rem, 5vw, 4.6rem)`, `line-height: 0.95`, `letter-spacing: -0.04em`, `text-transform: lowercase`): Panorama pivot rail buttons (`store`, `pre-sets`, `short-codes`, `phone-qr`, `overview`, `applications`). Active pivot renders in `#FFFFFF`; inactive pivots recede to `rgba(255, 255, 255, 0.58)`.
- **Headline** (`700` Bold, `clamp(2.2rem, 3.2vw, 3.25rem)`, `line-height: 1.05`, `letter-spacing: -0.035em`, `text-transform: lowercase`): Hero `2×2` live tile titles (`cloudstream 3`) and primary modal dialog titles.
- **Title** (`700` Bold, `clamp(1.35rem, 1.8vw, 1.85rem)`, `line-height: 1.05`, `letter-spacing: -0.03em`, `text-transform: lowercase`): Standard `2×1` and `1×1` live tile titles (`jellyfin tv`, `kodi 21`, `kv-netflix`, `kv-tube`) and section headers.
- **Body** (`400` Regular / `500` Medium, `0.9375rem` / `15px`, `line-height: 1.45`, max width `72ch`): Panorama subbar deck descriptions, app edition subtitles, and modal feature lists.
- **Label** (`600`–`700` Bold `JetBrains Mono`, `0.75rem` / `12px`, `line-height: 1.2`, `letter-spacing: 0.04em`, `font-variant-numeric: tabular-nums`): Top switcher links, 5-digit short-code stamps (`88103 · 24.2 MB`), telemetry pills, package names, and table headers.

### Named Rules
**The Lowercase Panorama Pivot Rule.** All panorama pivot headers (`pivot-btn`), tile titles (`tile-title`), and modal banner titles (`dialog-title`) must use `text-transform: lowercase` with tight negative tracking (`-0.03em` to `-0.04em`) to preserve the authentic Zune/Metro editorial voice.

**The 12px Functional Floor & Tabular-Nums Rule.** No text node anywhere in the interface may drop below `0.75rem` (`12px`), and every numeric counter, short-code (`88101`–`88105`), version string, price, and file size must enforce `font-variant-numeric: tabular-nums`.

## Layout

`kv-tv-theme` organizes content on a wide, horizontal-first Panorama Stage (`.metro-stage`, `max-width: 1720px`, fluid horizontal padding `clamp(16px, 3.5vw, 48px)`). Below the persistent top chrome bar (`.mockup-switcher` / `.kv-topbar`) and the giant lowercase `.panorama-header`, the primary canvas is an asymmetric 6-column 2D CSS Grid (`.metro-grid`):

- **Desktop & 10-Foot TV (`> 1220px`):** `grid-template-columns: repeat(6, minmax(0, 1fr))` with `grid-auto-rows: minmax(215px, 240px)` and a strict `12px` (`spacing.md`) gap on both axes.
- **Tile Span Architecture:**
  - `.span-2x2` (`grid-column: span 2; grid-row: span 2`): Hero anchor tile (4 columns × 2 rows of visual weight in a 2×2 block), housing an oversized `56px` vector icon, a `220×76px` translucent watermark short-code numeral (`rgba(255, 255, 255, 0.2)`), a live cycling status strip, and full package telemetry.
  - `.span-2x1` (`grid-column: span 2; grid-row: span 1`): Wide horizontal feature or utility tile.
  - `.span-1x1` (`grid-column: span 1; grid-row: span 1`): Compact square application tile.
- **Tablet / Compact Landscape (`761px–1220px`):** Collapses cleanly to a 4-column grid (`repeat(4, minmax(0, 1fr))`, `grid-auto-rows: minmax(200px, 225px)`).
- **Mobile / Narrow Viewport (`<= 760px`):** Collapses to a 2-column grid (`repeat(2, minmax(0, 1fr))`), where `.span-2x2` and `.span-2x1` span the full 2 columns and `.span-1x1` tiles sit two-across.
- **10-Foot D-Pad Spatial Navigation:** All interactive tiles participate in a single roving `tabindex` group (`tabindex="0"` on the active tile, `tabindex="-1"` on peers) driven by live `getBoundingClientRect()` perpendicular-axis overlap geometry so 5-way remote arrow keys move predictably across `2×2`, `2×1`, and `1×1` spans.

## Elevation & Depth

This design system is strictly **flat and shadowless**. There is no `box-shadow` vocabulary, no ambient drop shadow, no glassmorphism, and no `backdrop-filter` anywhere in `kv-tv-theme`.

Depth and hierarchy are communicated through three purely architectural mechanisms:
1. **Luminance & Chroma Contrast:** Saturated color blocks (`#0078D7`, `#6B21A8`, `#008272`, `#D83B01`, `#B91C1C`, `#107C10`, `#B45309`) sit directly against `#000000` OLED void.
2. **State Opacity Dimming:** When a panorama pivot filters the stage, non-matching tiles recede in-place via `.is-dimmed` (`opacity: 0.28`) rather than disappearing or blurring.
3. **Kinetic Scale & Crisp Perimeter Framing:** Hovered tiles shift subtly (`transform: scale(1.01)`), while D-Pad/keyboard-focused tiles pop forward (`transform: scale(1.022)`, `z-index: 5`) inside a razor-sharp `4px solid #FFFFFF` outline with a `2px` black offset gap (`outline-offset: 2px`). transitions use `cubic-bezier(0.16, 1, 0.3, 1)` (`--ease-out-expo`) over `140ms`–`180ms`.

### Named Rules
**The Zero-Shadow Flat Plane Rule.** Never apply `box-shadow`, `text-shadow`, or `backdrop-filter: blur()` to any tile, modal, button, or navigation bar.

**The Crisp White Focus Frame Rule.** Every interactive tile and control must indicate `:focus-visible` with a solid, unblurred `#FFFFFF` outline (`4px solid #FFFFFF` with `outline-offset: 2px` on tiles; `2px` or `3px solid #FFFFFF` on buttons and inputs).

## Shapes

Every element in `kv-tv-theme` obeys an uncompromising orthogonal geometry (`* { border-radius: 0px; }`). Corners are 90-degree mitered right angles across the entire viewport.

- **Corner Radius:** `0px` (`rounded.none`) universally — live tiles, telemetry pills, code stamps, action buttons, form inputs, QR frames, and `<dialog>` containers.
- **Borders & Dividers:** Structural separation uses crisp `1px solid` hairlines (`rgba(255, 255, 255, 0.18)` or `#262626`) for section rails and data tables, stepping up to `2px solid #FFFFFF` for modal dialog frames, primary action buttons, and the D-Pad simulator bar.
- **Iconography Geometry:** Vector icons use square caps and mitered joins (`stroke-linecap="square" stroke-linejoin="miter" stroke-width="2.75"`) to echo the right-angled tile silhouette.

### Named Rules
**The Zero-Radius Rule.** `border-radius` must remain `0px` on every element without exception; pill badges, rounded avatars, and softened card corners are forbidden.

**The Structural Hairline Rule.** Internal tile metadata rows and secondary strips divide content with exposed `1px solid` hairlines (`rgba(255, 255, 255, 0.28)` inside color tiles; `rgba(255, 255, 255, 0.18)` on dark surfaces) rather than nested card boxes.

## Components

Every component is built as a sharp-edged rectangular block with immediate high-contrast state feedback.

### Buttons
- **Shape:** Hard 90-degree rectangle (`border-radius: 0px`), `2px solid #FFFFFF` border on primary/secondary modal actions (`padding: 12px 18px`) or borderless high-contrast slab on inline actions (`padding: 6px 12px`).
- **Primary (`.metro-action-btn`):** Solid `#FFFFFF` background with `#000000` bold text (`0.875rem`, `font-weight: 700`) and `2px solid #FFFFFF` border.
- **Hover / Focus:** Snaps immediately to Metro Cobalt (`background-color: #0078D7`, `color: #FFFFFF`) with `outline: 3px solid #FFFFFF; outline-offset: 2px`.
- **Secondary / Ghost (`.metro-action-btn.secondary`):** `#000000` background with `#FFFFFF` text and `2px solid #FFFFFF` border; fills with `#0078D7` on hover/focus.
- **Danger / Destructive:** Solid Cinema Crimson (`#D83B01`) or Vermilion (`#B91C1C`) background with `#FFFFFF` text.

### Chips
- **Style (`.code-stamp`, `.telemetry-pill`, `.dialer-preset-chip`):** Monospace `0.75rem` (`12px`) `JetBrains Mono` with `font-variant-numeric: tabular-nums` and `0px` radius. Inside colored tiles, `.code-stamp` uses `background-color: rgba(0, 0, 0, 0.28)` and `padding: 4px 8px`. On dark surfaces, `.telemetry-pill` and `.dialer-preset-chip` use `background-color: #121212` or `#000000` with `1px solid rgba(255, 255, 255, 0.18)`.
- **State:** Interactive preset chips (`.dialer-preset-chip`) invert to Signal Emerald (`background-color: #107C10`, `border-color: #FFFFFF`) on `:hover` and `:focus-visible`.

### Cards / Containers
- **Corner Style:** `0px` radius across both Live Tiles (`.metro-tile`) and secondary structural blocks (`.strip-block`).
- **Background:** Live Tiles use one of the 7 solid Metro color tokens (`#0078D7`, `#6B21A8`, `#008272`, `#D83B01`, `#B91C1C`, `#107C10`, `#B45309`). Secondary utility blocks and admin panels use `#121212` (`--bg-surface`).
- **Shadow Strategy:** None (`box-shadow: none`).
- **Border:** Live Tiles have `border: none` at rest and acquire a `4px solid #FFFFFF` outline (`outline-offset: 2px`) on focus. Secondary `.strip-block` containers use `1px solid rgba(255, 255, 255, 0.18)`.
- **Internal Padding:** `clamp(18px, 2vw, 26px)` on Live Tiles; `18px 20px` on secondary blocks.

### Inputs / Fields
- **Style:** Sharp rectangular field (`border-radius: 0px`), `background-color: #000000`, `color: #FFFFFF`, `border: 1px solid rgba(255, 255, 255, 0.38)` (`#454545`), `padding: 10px 14px`, `font-family: var(--font-sans)` (or `var(--font-mono)` for short-code/URL fields).
- **Focus:** Border upgrades to `#FFFFFF` with `outline: 2px solid #0078D7; outline-offset: 1px`.
- **Dialer Readout (`.dialer-readout`):** Oversized monospace input display (`clamp(1.75rem, 3vw, 2.5rem)`, `font-weight: 700`, `border: 2px solid #FFFFFF`, `background: #000000`).

### Navigation
- **Top System / Switcher Bar (`.mockup-switcher` / `.kv-topbar`):** Full-width `#0A0A0A` bar with `1px solid rgba(255, 255, 255, 0.18)` bottom border. Brand mark features a `12×12px` `#0078D7` square plus bold `0.75rem` monospace title. Navigation links are bracketed monospace labels (`[ 1 · Metro Panorama Tiles ]`) that fill with `#0078D7` and a `1px solid #FFFFFF` border when `[aria-current="page"]`.
- **Panorama Pivot Rail (`.panorama-pivots`):** Horizontal row of giant lowercase `Work Sans` (`font-weight: 200`, `clamp(2.8rem, 5vw, 4.6rem)`) tab buttons. Clicking or activating a pivot updates `aria-selected="true"` (`color: #FFFFFF`), updates the subbar deck copy, and dims non-matching grid tiles.

### Metro Live Tiles & Dialogs
- **Live Tile Internal Anatomy (`.metro-tile`):** Top row (`.tile-top`) pins a geometric SVG glyph (`40×40px`, or `56×56px` on `.span-2x2`) on the left and a `.code-stamp` (`88103 · 24.2 MB`) on the right. Hero `.span-2x2` tiles layer a giant middle-right watermark SVG numeral (`.watermark-code`) at `20%` white opacity and a `.live-status-strip` (`background: rgba(0, 0, 0, 0.32)`) that cycles real-time repository telemetry every 3.2 seconds. Bottom stack (`.tile-bottom`) anchors the bold lowercase `.tile-title`, `.tile-edition`, and a `1px` top-bordered `.tile-meta-row`.
- **Native Command Modal (`dialog`):** Uses semantic `<dialog closedby="any">` with `border: 2px solid #FFFFFF`, `background-color: #121212`, `width: min(92vw, 760px)`, and a solid `#000000` (`82%` opacity) backdrop (`overscroll-behavior: contain`). Top `.dialog-banner` inherits the selected app's exact Metro tile color (`#0078D7`, `#6B21A8`, etc.) and houses the lowercase title plus a `[ ESC · CLOSE ]` button.

## Do's and Don'ts

### Do:
- **Do** keep the root viewport background at pure `#000000` (`oled-void`) so the `12px` live-tile gutters act as true unlit OLED black separation.
- **Do** enforce `border-radius: 0px` (`rounded.none`) on every single element, including tiles, buttons, inputs, QR frames, badges, and `<dialog>` modals.
- **Do** set all panorama pivot headers (`font-weight: 200`, `clamp(2.8rem, 5vw, 4.6rem)`) and live tile titles (`font-weight: 700`) in `text-transform: lowercase` with tight negative letter-spacing (`-0.03em` to `-0.04em`).
- **Do** pair every Metro color block (`#0078D7`, `#6B21A8`, `#008272`, `#D83B01`, `#B91C1C`, `#107C10`, `#B45309`) with pure `#FFFFFF` text and vector icons to guarantee WCAG AA contrast (`>= 4.8:1`).
- **Do** provide a `4px solid #FFFFFF` focus outline (`outline-offset: 2px`) and `transform: scale(1.022)` on all focusable tiles so 10-foot Android TV D-Pad users can track focus effortlessly across the room.
- **Do** apply `font-variant-numeric: tabular-nums` (`JetBrains Mono`) to all 5-digit short-codes (`88101`–`88105`), install counters, file sizes, and version stamps.

### Don't:
- **Don't** use `backdrop-filter: blur()`, frosted glass overlays, or translucent floating cards anywhere in the interface.
- **Don't** apply `box-shadow`, neon outer glows, or colored drop shadows to tiles, modals, or buttons.
- **Don't** use linear, radial, or mesh gradients on tile backgrounds or typography; every color plane must be a single unmodulated solid color.
- **Don't** introduce rounded corners (`border-radius: 4px`, `8px`, `9999px`) on pills, buttons, avatars, or dialogs.
- **Don't** set any text smaller than `0.75rem` (`12px`) or use low-contrast gray text inside saturated color tiles.
- **Don't** trap keyboard or D-Pad users in 1D tab loops; always wire 2D spatial arrow-key navigation (`.metro-grid`) and native `<dialog closedby="any">` Escape/Back dismissal.
