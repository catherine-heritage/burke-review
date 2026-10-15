Round 3 is a buildless static page served at both `/` and `round-3/`.
Round 2's former homepage is preserved at `round-2/` with a base URL pointing
to the repository root, so its existing assets and review code are unchanged.
All three rounds use `round-navigation.css` for the shared masthead. Round 1
retains its self-contained bundle; only its embedded template navigation changed.

`source-data.js` embeds the seven exact Group SVG strings from `Round 4/`.
`subsidiary-data.js` embeds the seven supplied references for each of Realty,
Development and PM, in filename order. These are local module data, so controls
never wait for a network request. Original source SVG files remain untouched.
The preview omits the two previously approved isolated navy dots in Group 05 and
06; compound paths and letter counters remain intact.

`logo-renderer.js` composes the supplied paths. All single-option previews match
the relevant reference, including incidental alignment and rounding. Wider +
curved moves whole curved layers by the gap increments measured from 03 versus
00. Bold + tighter uniformly scales the actual 01 descriptor outlines to 06's
cap height and places them at 06's individual letter centres. Each subsidiary
uses its own descriptor outlines, including the two-line Property Management.
All logos share the original 1080 × 935.4 artboard and consistent display scale.

The SVG navy is fixed at #1B2E46. Group retains its original gold. Subsidiary
accents replace gold with exactly the two colours specified for each company;
there is no colour picker. Original, Text one colour and Icon one colour use
the same arrangements as references 00, 02 and 05 respectively.

Favourites are stored only in this browser under the existing Round 3 key.
Selected favourites are encoded in a shareable URL fragment, including company
and accent. Original five-digit Group links and saved favourites remain valid.
No feedback is sent or saved remotely.

Run locally with `python -m http.server 8000` from the repository root.
For verification, install Python Playwright and Chromium, then run
`python scripts/check-round-3.py`. The test uses `/usr/bin/chromium` and a temporary
local server under `/burke-review/`, matching the GitHub Pages path. It checks
pixel equality against all 28 references and each accent (49 checks), all 336
company/accent/refinement combinations, fixed navy, comparison controls, sharing,
storage, legacy/malformed links, clipboard fallback, navigation and desktop/mobile
layouts. Screenshots are written to `/tmp/burke-round3-desktop.png` and
`/tmp/burke-round3-mobile.png`.
