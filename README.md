# Burke Group identity review

A buildless static website for GitHub Pages at `/burke-review/`. All website assets and development files are self-contained on the laptop. Catherine approved publication after the final child-company spacing adjustment.

## Current round and navigation

Round 3 is the default homepage and remains available at `round-3/`. It shows
one large Group logo above three subsidiary previews, with a compact shared
options row. The layout follows the owner's reference screenshot while retaining
the supplied SVG artwork, fixed navy and default subsidiary accents. Comparison
has been removed for now; voting will follow separate instructions. Existing
refinement links still work. See `round-3/README.md` for rendering and verification.

Round 1 remains at `round-1/`. Round 2's former homepage is now at `round-2/`,
using its original review code and assets. All three rounds have the same top
navigation. The following review-flow notes describe Round 2.

## Review flow

The identities are Logo 01 — Four-Part B, Logo 02 — Layered B, and Logo 03 — Rising Forms. The opening Shortlist shows three black logos and one Next button. The guided journey proceeds through Logo 1, Logo 2 and Logo 3 in order, then comparison. Each logo has The logo, Child companies, Group of companies, On a website and In real life — Mockups sections. Each logo is one continuous scrolling page; Jump to scrolls to its content, and All logos sits beside the identity title. Mockups form a two-by-two desktop grid, and Next advances to the next logo. Logo applications are expanded by default.

The compact toolbar keeps logo and palette controls, Compare mode and its adjacent on/off switch, Jump to, Customise colours, Help and Provide Feedback. Toggling Compare preserves the scroll position and toolbar layout. Comparison always shows all three logos in one palette or all three palettes with one logo. It contains aligned primary and secondary logos, favicons/symbols, four supplied mockups, condensed website colour studies and child-company studies. Group of companies is only in individual views.

Customise colours opens one global five-colour editor directly. Two interactive example presets, Espresso + Aged Brass and Deep Petrol + Copper, load all five parent colours and three subsidiary colours. Individual edits remain available; Reset restores the active preset. These examples do not appear in the shortlist or feedback palette rankings. Custom colours update logo applications and website presentations together. Custom mode includes child-company studies with three editable secondary colours. Website company buttons switch the parent or subsidiary branding; supplied mockups remain excluded from custom mode. Returning to supplied palettes restores the supplied colours. The original standalone Colour Lab remains at `colour-lab/`, and condensed website colour studies appear in both individual exploration and comparison.

## Feedback

Provide Feedback opens a dialog with separate 1st/2nd/3rd rankings for the black logos and the three supplied palettes, plus a required name. Duplicate places swap rather than allowing conflicting ranks. Users can copy the plain-text answers or open an email draft addressed to `catherine@heritageholdings.ky` with the answers included. The user sends that email. No feedback is automatically submitted or stored in a shared database. Hearts, shortlists and selection controls have been removed from the current review.

## Assets and palettes

The 36 finished mockup PNGs and four blank PNGs remain unchanged; `assets/mockups/source-map.json` records their SHA-256 checksums. Green Cap 2 and Green Cap 3 were supplied under reversed filenames and are mapped to the correct depicted logos.

SVG applications preserve supplied geometry. The updated coloured artboards and light-favicon backgrounds use shared Neutral 1 `#E6E4E0`; Neutral 2 is `#FAFAF8`. Palette display order is Primary, Secondary, Accent, Neutral 1, Neutral 2. Gold is labelled Black and gold. All three supplied Blue logo artboards use primary `#1B2E46`, which takes precedence over the palette-only reference listing `#1D3348`.

Child companies retain the supplied symbols and BURKE outlines, with Montserrat Semi Bold descriptors and fixed secondary colours: Realty `#BD6C5A`, Development `#648EAB`, Property Management `#4C968E`. All nine child-company website headers use supplied outlined horizontal SVGs; originals are retained in assets/companies/child-horizontal. The earlier Property Management source files are also preserved. Group of companies uses the supplied SureBuilt and Slimlines PNGs unchanged. Child-company cards include the supplied horizontal logo, dark and light favicons and standalone symbol alongside the primary logo. Mockups follow Signage, Business Card, Polo, Cap, with the custom-colour invitation at the end. Montserrat and its licence are self-hosted.

## Previous round

`round-1/` preserves the complete original review. Its only template addition is a return link. Both `round-1/round-1-selected/` and the original `round-1-selected/` retain the selected-logo page. Original review and Colour Lab storage keys are preserved. The original root homepage remains recoverable at commit `a7a6654d12a46bb3d0e931aff6a7ac70e598676d`.

## Hosting and verification

GitHub Pages deploys the repository root from `main`; `.nojekyll` enables direct static serving. No build step or package installation is needed. Serve the repository parent and open `/burke-review/` for local verification.

Run `python scripts/check-assets.py` for PNG checksums, complete mapping and SVG geometry/fill checks. Browser checks cover desktop/mobile layout, the guided journey, stable comparison toggle, global colour editing, ranking validation, clipboard output and the addressed email draft. Local preview helpers and backups are kept outside the published repository.
