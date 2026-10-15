Round 3 is a buildless static page served at both `/` and `round-3/`.
It shows one large Burke Group logo, the three subsidiaries together beneath it,
and a compact shared options row. The layout follows the owner's supplied
screenshot, with the supplied logo geometry and the original Round 2 Blue palette
as clarified by the owner.

All four shape/lettering controls and Colour treatment update the family together.
The main navy stays #1B2E46. Default accents are Group #768290, Realty #CC6E2F,
Development #81376D, and Property Management #317B82. The header remains the
original supplied horizontal SVG. Treatments control accent placement: Original
uses the accent on the bottom icon layer and secondary lettering; Single-colour
icon uses all-accent icon/navy lettering; Single-colour text retains a two-colour
icon/navy lettering; Inverse uses all navy for Group and accent top two layers,
navy bottom layer and accent secondary lettering for subsidiaries.

Comparison UI and behaviour, including saving, removing and sharing favourites,
are removed for now. Existing browser favourites are left untouched. Existing
`#logo=` refinement links initialize geometry and treatment together. Treatment
values retain the supplied reference mapping: 0 Original, 1 Single-colour text
(reference 02), 2 Single-colour icon (reference 05), 3 Inverse. Company previews are always shown together. Anonymous voting appears below the
options, followed by voter-only live results. It uses the five parent settings
and restores the saved vote for the same Firebase account. See
`../FIREBASE_SETUP.md` for security rules, manual activation and testing status.

`source-data.js` and `subsidiary-data.js` embed the 28 exact reference strings
from `Round 4/`. `logo-renderer.js` composes their actual outlined paths.
The latest Group 06 moves BURKE into its icon; the owner previously approved
keeping the earlier vertical placement, whose identical tighter BURKE outlines
are also supplied in Realty 06. That correction remains in effect.

Combined wider/curved settings move whole curved layers by the gap increments
measured from 03 versus 00. Bold/tighter uniformly scales the 01 descriptor
outlines to 06's cap height and places them at 06's individual letter centres.
The shared preview crop is 160 150 760 680; this removes empty artboard space
without changing geometry, proportions or the scale between subsidiary logos.

Run locally with `python -m http.server 8000` from the repository root.
With Python Playwright and `/usr/bin/chromium` installed, run
`python -u scripts/check-round-3.py`. It verifies 28 reference/colour pixel
comparisons, all 256 company/refinement/treatment combinations, all 64 shared
UI settings, treatment keyboard navigation, unchanged Options toolbar, comparison removal, legacy links, layout, navigation
and the earlier review flows under the `/burke-review/` GitHub Pages path.
Screenshots are written to `/tmp/burke-round3-layout-desktop.png` and
`/tmp/burke-round3-layout-mobile.png`.

Voting UI is isolated in `voting.js`, validation/aggregation in `vote-model.js`,
and Firebase transport in `firebase-voting.js`. The SDK loads separately from
logo rendering. The owner-approved existing visual identity is unchanged; new
headings use the existing Montserrat section-heading style. Results list the five
preference breakdowns before the top three complete combinations. The existing
comparison feature remains absent, as it was before this enhancement.

Explore colours is an initially expanded native `details` section between Options and Your
vote. Each company has two visible family swatches: Group Navy/Gold, Realty
Red/Orange, Development Purple/Blue, and Property Management Green/Teal. Clicking
a swatch selects only the family for the next shuffle and updates the underline.
It leaves the current HEX value, preview and lock unchanged. A separate 18px
colour-wheel icon beside each HEX field opens the native full-spectrum picker,
with tooltip "Choose custom colour". Manual colours remain until edited, reset
or shuffled while unlocked.
Shuffle varies all unlocked companies in their selected warm/cool shade families.
Group exploration affects only its accent; the main navy is fixed. Reset restores
all four defaults, default families, and unlocked padlocks without changing logo
refinements. Copy includes active company HEX values, fixed navy and original
gold for reference. No colours or family selections enter Firebase votes.

`colour-model.js` owns colour families/defaults/HEX validation and shuffle logic.
`colour-explorer.js` owns temporary active families, colour values and locks. The
renderer receives optional company accent overrides; result previews use defaults.
Run `node tests/colour-explorer.test.js`, `node tests/vote-model.test.js`, and
`python tests/check-colour-explorer.py`. The local browser test checks both routes,
paired family selection, full-spectrum picker/HEX edits, locking/shuffle/reset/copy,
SVG geometry, main navy, all treatments, voting isolation and 320–1448px layouts.
It uses a mock voting transport, never production Firebase. The existing
`scripts/check-round-3.py` verifies all 28 authoritative SVG references recoloured
to the new defaults, 256 combinations, 64 UI settings and earlier-round navigation.
