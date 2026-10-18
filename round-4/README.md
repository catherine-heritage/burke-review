## Repository upload

This is the supplied HTML presentation, labelled Round 4. Open `index.html` through the website. The reference PNG screenshots remain in the original attachment and are not required by the presentation. The original handoff notes follow.

# Handoff: Burke Colour Review

## Overview
An interactive presentation tool for the Burke brand family: Burke Group, Burke Realty, Burke Development and Burke Property Management. The presenter walks the board through one identity board per company and changes choices live. The four boards recolour in real time, and readability (contrast) feedback updates with them. A hidden admin palette lets the presenter fine-tune every brand colour during the session.

Voting has been removed. The tool is now for presenting only: it has no backend, no persistence and no Firebase.

## About the design files
The files in this bundle are **design references built in HTML**. They are prototypes that show the intended look and behaviour, not production code to ship as-is. Recreate them in the target repo's environment. If the repo has no framework yet, a small static site works: plain HTML/CSS/JS, or Vite + React. Either way it needs to keep the live-recolour behaviour described below.

`*.dc.html` files are self-contained "Design Component" pages that run on `support.js`, a small runtime that compiles the templates in the browser. Open `Colour Round.dc.html` in a browser served over HTTP; the iframes and SVG fetches need a server, so `file://` won't work. Read the template markup for exact styles, and the `<script data-dc-script>` class for logic.

## Fidelity
**High fidelity.** Final colours, typography, spacing and copy. Recreate pixel-accurately.

## Screens

### 1. Colour Round (`Colour Round.dc.html`): the presentation shell
Max width 1440px, centred, padding 40px 32px; page background `#F2F0EC`.

- **Header:** the B mark (40px high), an eyebrow ("BURKE IDENTITY REVIEW · ROUND 5", Urbanist 11px/600, letter-spacing 0.2em, `#4E5A68`), the title "Colour" (Hanken Grotesk 34px/300), and intro copy (14px/1.55, `#4E5A68`, max 520px).
- **Tabs:** pill group (`#E6E2DB` track, 5px padding) with ALL COMPANIES, GROUP, REALTY, DEVELOPMENT and PROPERTY MGMT. Active tab is `#1B2E46` with white text. A "✓ " prefix appears on a company tab once a choice has been made there.
- **Admin-only "Starting shades" toggle:** Contrast-tuned / Approved.
- **Overview tab:**
  - A "How to review" card with two numbered steps.
  - A 4-up card grid (`auto-fit minmax(220px,1fr)`). Each card has: logo (150px on `#FBFAF8`), a 28px palette strip, name with hex, Family / Logo / Contrast rows, and an "EDIT {COMPANY}" pill.
  - Reset All button. Shuffle All Shades shows in admin only.
- **Company tab:** two columns that wrap.
  - **Left panel** (white, 24px padding, max 400px), top to bottom:
    1. Logo (72px) and company name (20px/500).
    2. **Choices** box: inset 1.5px `#1B2E46` ring, radius 12, padding 18.
       - "1 · Colour family" pills (22px swatch dot, 1.5px border; `#1B2E46` when selected).
       - "2 · Logo colour position" cards: "Colour at bottom" or "Colour at top", each with a 40px mark preview. This step is hidden for Group's "Navy only", with a note that it isn't needed.
    3. **Is it easy to read?** A one-line summary (e.g. "All pairings read well") with a Show details toggle. Details list each check with a sample tile, a 4-dot score, a verdict, plain-language meaning and an optional WCAG ratio with badges.
    4. **Full palette · admin only**, shown only in admin mode: dashed `#C9C2B6` border, background `#FAF8F5`. One row per palette colour: colour picker swatch, label, hex input, Reset.
  - **Right column:** an "Enlarge board" / "Show controls" toggle, then the company's identity board. The board is 1920×1140, scaled to the column width (`scale = width / 1920`).

### 2–5. Identity boards (`Burke * Identity Board.dc.html`)
Fixed 1920×1140 compositions on a `#DCDAD5` frame. Each shows the primary logo, a palette strip (Primary, Secondary, Accent 1, Accent 2, Neutral 1, Neutral 2, with labels and hex codes; Group has no Accent 2), and 8–11 application mockups: business cards, favicons, letterhead, signage, email, web, print and so on. They are static. All recolouring is applied by the shell (see below).

## Key behaviour: live recolouring
The shell loads each board in an iframe. Once the board's images have loaded, it snapshots every element's `style` attribute, every `<img src>` ending `.svg`, and every text node that is exactly a hex code. On any colour change it re-applies a list of `[from, to]` colour pairs:
- **Inline styles:** replaced in both `#hex` and `rgb(r, g, b)` forms. Pairs flagged `bg` only replace inside `background` declarations.
- **SVGs:** fetched as text, colours replaced, then rewritten as blob URLs (cached by a key).
- **Hex labels:** rewritten so the board's swatch codes always match.

How each choice and setting maps to colours:
- **Company colour:** the source colour (Group `#A67C52`, Realty `#CC6E2F`, Development `#755A77`, PM `#157279`) is replaced with the selected shade. Development also replaces `#866A88` with its colour lightened by 8%.
- **"Navy only" (Group):** the source colour maps to the logo's other fill (white on reversed logos) or to navy, and dark text on those panels switches to Neutral 2.
- **Logo colour position "top":** in the B mark, the three bar paths are identified by their path data prefixes `M371.62,178.94`, `M371.62,280.97` and `M371.62,375.84`. The fills are swapped so the top two bars take the company colour and the bottom bar takes the plain fill.
- **B on navy (Accent 1, shared):** on reversed and tonal marks (`*-mark-rev`, `*-primary-rev`, `*-mark-tonal`, `*-mark-tonal-full`), the plain bars are set to this colour. It is one global value that applies to all four companies, and is edited on any tab.
- **Accent 2 (child companies only):** the source accent is replaced on that company's board.
- **Neutrals and navy (admin):** replaced across the board. When navy changes, dark text `#0F1B2A` follows as the navy multiplied by 0.58.
- **Illustrations** (`villa`, `warehouse`, `office`, `building`, `masterplan`, `siteplan`) are greyscale. Only their company-colour details keep the live colour.
- **Group "Navy only":** the Secondary swatch column is hidden on the board and on the overview strip.

## State
- Per company: `family`, `hex`, `treatment` (`bottom` or `top`), `accent` (Accent 2), and `pal` (`{navy, n1, n2}`), plus text mirrors for the hex inputs.
- Global: `navyB` (Accent 1), `tuned` (starting shades), `tab`, `touched` (per company), `showChecks`, `showTech`, `wide`, and `admin`.
- **Admin mode:** visiting with `?admin=1` sets `localStorage.burkeColourAdmin = '1'`. `?noadmin` or the panel's "Hide" clears it. This is a convenience gate, not security.
- Nothing is persisted apart from the admin flag; a reload resets everything.

## Design tokens
**Shared**
- Navy (primary) `#1B2E46`
- Ink / dark text `#0F1B2A`
- Accent 1 / B on navy `#5A6B81`
- Neutral 1 `#E6E4E0`
- Neutral 2 `#FAFAF8`
- Board frame `#DCDAD5`
- Floor/shadow shade `#CFCCC6`
- UI greys: `#2A3644`, `#4E5A68`, `#6A7480`, `#7A8592`, `#B9C2CC`
- UI page background `#F2F0EC`, tab track `#E6E2DB`, borders `#D6D1C8` / `#CFCAC1` / `#E2DDD5`

**Colour families** (default is the contrast-tuned shade; "Approved" switches to the original)
- **Group:** Navy only (fixed, default); Slate `#768290` (tuned `#66717E`). Group has no Accent 2.
- **Realty:** Orange `#BB6130`; Orange-red `#BF4E30` (tuned `#C24F31`). Accent 2 `#78A0B6`.
- **Development:** Purple `#755A77` (tuned `#87688A`); Blue `#3A6EA5` (tuned `#3E75B0`). Accent 2 `#B9A9B6`.
- **Property Management:** Teal `#157279` (tuned `#177F87`); Green `#2E7D4F` (tuned `#308252`). Accent 2 `#6FA8A6`.

**Readability check colours:** scores 4/3/2/1 use `#1D5B36`, `#2F7A4A`, `#A0641A`, `#8A2C1D`. Pass/fail badges: `#DDEFE3` with `#1D5B36`, and `#F6E0DC` with `#8A2C1D`.

**Contrast thresholds (WCAG 2.1)**
- Text: 7 = Excellent; 4.5 = Good; 3 = Big text only; below 3 = Hard to read.
- Graphics: 4.5 = Stands out clearly; 3 = Clearly visible; 2 = Quite faint; below 2 = Blends in.

**Typography**
- Hanken Grotesk (300/400/500/600) for body and titles.
- Urbanist (500/600/700) for all-caps labels: 10–12px, letter-spacing 0.12–0.2em.
- Both are loaded from Google Fonts.

**Radii:** pills 999px; cards 10–12px; swatches 6–8px; favicon tiles 19–20px.

## Assets
`assets/`: 37 SVGs. Logos, marks, wordmarks and their reversed (`-rev`), white and tonal variants for each company. Also greyscale-ready illustrations (villa, site plan, building, masterplan, warehouse, office) and portrait/QR placeholders. All were created for this project. Keep the B-mark path data intact, because the bar swapping relies on it.

## Files
- `Colour Round.dc.html`: the shell, with all logic in its `<script data-dc-script>` class.
- `Burke Group Identity Board.dc.html`, `Burke Realty Identity Board.dc.html`, `Burke Development Identity Board.dc.html`, `Burke Property Management Identity Board.dc.html`: the four boards.
- `support.js`: the prototype runtime. Only needed to view the references; not needed in production.
- `assets/*.svg`
- `screenshots/`:
  - `board-*.png`: each board recoloured with the default choices (the source files hold the original colours; the shell recolours them).
  - `shell-overview.png`: the presentation shell's overview.
  - `shell-company-panel.png`: the left control panel. The board column appears empty there because the screenshot tool can't capture iframes.

## Known follow-ups
- Accent 2 has low presence on the child boards. A gentler approach is still to be decided.
- The B-on-navy colour (`#5A6B81`) is provisional and may be revisited.
