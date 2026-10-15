# Round 3 layout QA

Source visual truth: the owner's latest attached layout screenshot in this chat
(1448 × 1086 pixels; no local source file was provided). The owner's subsequent
latest clarification is part of the visual brief: match the layout, use the
original Round 2 Blue palette and original child colours with fixed values,
and keep all child previews beneath the Group by default. Remove comparison. Voting is deferred.

Implementation captures:
- `/tmp/burke-round3-layout-desktop.png` — 1448 × 1086 CSS px, device scale 1.
- `/tmp/burke-round3-layout-mobile.png` — 390 CSS px wide, device scale 1,
  full-page capture. No source mobile layout was provided.

Route: `/burke-review/`, default Original settings, all four companies visible.
The `/round-3/` route uses the same layout and module.

## Comparison evidence

The attached source and browser-rendered desktop capture were inspected at the
same viewport. Full-view composition follows the source: horizontal logo/header
at the top, round links on the right, serif heading and supporting sentence,
one full-width Group stage, three equal subsidiary stages, then a divided options
row. The Group stage begins at y=250 and ends at y=620; subsidiaries begin at
636 and end at 916; the options divider sits at y=950. These match the source's
major-region proportions within a few pixels.

Focused review covered header typography/underline, SVG counters and layer gaps,
and the option labels, selected states and vertical separators. Fonts and
layout hierarchy follow the reference: Georgia display title and locally hosted
Montserrat interface text. Background is warm grey, stages are white with subtle
borders, and selected options are understated grey. The supplied logos remain
sharp outlined vectors. Source blue diamond artwork and single-line Property
Management are intentionally replaced by the owner's supplied artwork and its
authoritative two-line typography, per the explicit clarification.

## Findings and comparison history

Initial capture: [P2] round navigation rendered at 12px because the shared
navigation stylesheet overrode the page's 16px rule. This made the header density
visibly smaller than the reference. Fixed using a page-scoped selector with
higher specificity. The final desktop capture confirms the corrected size,
spacing and navy active underline. Responsive captures and checks were repeated
after the fix.

Final capture: no actionable P0/P1/P2 findings. Minor differences caused by the
approved supplied logos and fonts are intentional; no logo geometry was redrawn.

## Functional and responsive checks

Chromium exercised every shared refinement combination and confirmed all four
previews update together. No comparison controls or company selector remain,
even when old saved favourites exist. Existing refinement hashes initialize geometry and colour treatment together.
Desktop and widths 320, 390, 700, 768 and 1100 do not overflow. Subsidiaries stack
on narrow screens and retain equal scales. Keyboard focus remains visible on
native radio controls, and a screen-reader status announces shared updates.
No browser JavaScript errors were observed. All three round navigation links and
the earlier review flows were checked under the repository URL prefix.

Reference verification passed: 28 fixed-palette SVG pixel comparisons, all 192 company/refinement/treatment
combinations, and 48 shared interface states. The fixed colours were also checked directly
against `PALETTES.blue` and Round 2’s `CHILDREN`. The requested Colour treatment segmented control uses the same styling as the
other four options. Its wider final column accommodates the full labels on
desktop; tablet/mobile wrapping prevents truncation. All three treatments were
checked against references 00/02/05 with each company’s existing accent. Native
radio keyboard navigation follows Original, Single-colour icon, Single-colour
text, and no colour picker or extra customisation is present. Existing
asset integrity checks passed.

Implementation checklist: complete. No P3 follow-up is required for this layout.

final result: passed
