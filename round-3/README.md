Round 3 is a buildless static page served at both `/` and `round-3/`.
It shows one large Burke Group logo, the three subsidiaries together beneath it,
and a compact shared options row. The layout follows the owner's supplied
screenshot, with the supplied logo geometry and the original Round 2 Blue palette
as clarified by the owner.

All four shape/lettering controls and the Colour treatment segmented control
update all companies simultaneously. The palette values stay fixed; there is no
colour picker or customisation. Original uses the two-colour icon and accent
lettering; Single-colour icon uses an all-accent icon with navy lettering;
Single-colour text retains the two-colour icon with navy lettering. Inverse makes Group entirely navy; subsidiaries use accent
top two icon layers, a navy bottom layer and accent secondary lettering. The primary
#1B2E46 and Group secondary #B78352 come from `PALETTES.blue` in `data.js`.
The child accents match Round 2's `CHILDREN` exactly: Realty #BD6C5A,
Development #648EAB, Property Management #8F9868. `blue-palette.js` applies these
fixed colours to the supplied outlined geometry. The header uses the original
`assets/logos/blue/2/horizontal.svg` directly. Source logos and earlier rounds
remain unchanged.

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
UI settings, treatment keyboard navigation, no colour picker, comparison removal, legacy links, layout, navigation
and the earlier review flows under the `/burke-review/` GitHub Pages path.
Screenshots are written to `/tmp/burke-round3-layout-desktop.png` and
`/tmp/burke-round3-layout-mobile.png`.

Voting UI is isolated in `voting.js`, validation/aggregation in `vote-model.js`,
and Firebase transport in `firebase-voting.js`. The SDK loads separately from
logo rendering. The owner-approved existing visual identity is unchanged; new
headings use the existing Montserrat section-heading style. Results list the five
preference breakdowns before the top three complete combinations. The existing
comparison feature remains absent, as it was before this enhancement.
