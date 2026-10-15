Round 3 is a buildless static page served at both `/` and `round-3/`.
It shows one large Burke Group logo, the three subsidiaries together beneath it,
and a compact shared options row. The layout follows the owner's supplied
screenshot; the owner explicitly chose to retain the supplied navy/gold logo
artwork and provisional subsidiary accents rather than the mockup's blue diamond.

All five refinement controls update all four companies simultaneously.
The subsidiaries use their previously approved default provisional accents:
Realty #B66B3F, Development #5476A1, Property Management #41785C.
Navy remains fixed at #1B2E46 and Group gold at #A67C52. The new header asset
retains the existing supplied horizontal Logo 2 geometry, with gold matched to
Round 3. The full source logo files and previous rounds remain unchanged.

Comparison UI and behaviour, including saving, removing and sharing favourites,
are removed for now. Existing browser favourites are left untouched. Existing
`#logo=` refinement links still initialize the shared options; company choices
are now shown together. Voting and submission are deliberately deferred until
the owner's next instructions.

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
`python -u scripts/check-round-3.py`. It verifies 49 reference/colour pixel
comparisons, 336 company/accent/refinement combinations, all 48 shared UI settings,
comparison removal, legacy refinement links, desktop/mobile layout, navigation
and the earlier review flows under the `/burke-review/` GitHub Pages path.
Screenshots are written to `/tmp/burke-round3-layout-desktop.png` and
`/tmp/burke-round3-layout-mobile.png`.
