Round 3 is a buildless static page at `round-3/`. The root review links here;
Round 1, Round 2's review code and shared styles remain unchanged.

`source-data.js` embeds the seven exact SVG strings from `Round 4/`, in filename
order. These are local module data, so controls never wait for a network request.
Original source files are untouched. The preview omits the isolated navy dots in
05 and 06, as requested; compound paths and letter counters remain intact.

Single-option previews reproduce each supplied reference, including incidental
alignment and rounding. Combined settings reuse the supplied BURKE, GROUP and
icon paths. Wider + curved moves whole curved layers by the gap increments
measured from 03 versus 00, preserving each curve. Extra bold + tighter uses the
01 GROUP outlines, uniformly scaled to 06's GROUP cap height and positioned at
06's individual letter centres. Tighter alone retains 06's larger/heavier GROUP.
All logos share the original 1080 × 935.4 artboard and a consistent display scale.

Favourites are stored only in this browser under a new Round 3 storage key.
Selected favourites are encoded in a shareable URL fragment; opening that link
loads the specified set. No feedback is sent or saved remotely.

Run locally with `python -m http.server 8000` from the repository root.
For verification, install Python Playwright and Chromium, then run
`python scripts/check-round-3.py`. The test uses `/usr/bin/chromium` and a temporary
local server. It checks pixel equality against all seven references (apart from
the approved dot removal), all 48 combinations, comparison controls, sharing,
storage, malformed links, clipboard fallback and desktop/mobile layout.
Screenshots are written to `/tmp/burke-round3-desktop.png` and
`/tmp/burke-round3-mobile.png`.
