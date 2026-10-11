# Burke Group identity review

A buildless, single-page review website compatible with the `/burke-review/` GitHub Pages base path.

## Publication

The existing Pages site is deployed by GitHub's `pages build and deployment` workflow from `main` (latest inspected live commit: `a7a6654d12a46bb3d0e931aff6a7ac70e598676d`). The website was stored in the root `index.html`; it contains its own bundled images and review logic. No repository-authored workflow was present.

Development is on `identity-review-round-2`. Do not merge or deploy until Catherine approves the preview. `.nojekyll` permits these static files to be served directly after approval; no changes to the Pages source configuration are needed.

## Preserved previous round

`round-1/index.html` retains the original complete manifest, scripts, artwork, review controls and browser storage keys. The only change inside its page template is an additive fixed return link. `round-1/round-1-selected/` preserves the existing selected-logo reference page with its relative return navigation. The original `round-1-selected/` also remains at its existing address.

The original root page remains available in Git at the baseline commit. An additional byte-for-byte local backup was made before edits. The original Pages homepage remains live until this branch is approved and merged.

## Assets

- `data.js`: central logo, palette, application and asset mapping.
- `assets/logos/source/`: all 15 untouched supplied SVG artboards.
- `assets/logos/{black,gold,blue,green}/{1,2,3}/`: isolated SVG applications, preserving the supplied nodes, groups, geometry and fills. View boxes enclose each application; separator lines are omitted.
- `assets/mockups/`: the 36 finished PNGs and four blank PNGs, copied without re-encoding. `source-map.json` records source filenames and SHA-256 checksums.
- `assets/fonts/`: supplied Montserrat variable TTF (weights 100–900) and its OFL licence. The supplied set contains no WOFF2 files, so the licensed TTF is self-hosted.
- `colour-lab/`: the original HTML template, logic, logo data and bundled React/runtime files unpacked into local assets. The original controls and storage key are retained. Font references use the shared Montserrat file; a small height bridge allows embedding on the homepage. Comparison frame sources are encoded as template attributes to prevent premature placeholder requests before the runtime mounts.
- `assets/colour-lab-preview.png`: an actual screenshot of the working supplied interface.

### Supplied artwork limitation

The supplied `Green Cap 2.png` contains Logo 03, and `Green Cap 3.png` contains Logo 02. Visual inspection confirmed their filenames are reversed. The gallery maps them to their actual logos; the PNGs remain unchanged and their source filenames/checksums are recorded.

All nine colour artboards have five complete applications: primary stacked, horizontal, dark favicon, light favicon and standalone symbol. The black artboards have four complete applications. Logo 01's fifth symbol contains only two vertical rectangles; Logos 02 and 03 omit the fifth symbol. Incomplete black symbols are intentionally omitted. No substitute artwork is created. Complete corrected black symbol artwork can be added later.

The Gold SVGs use their supplied black fill in some components; they are displayed exactly as supplied, while the palette selector shows the requested `#1E1F1F` / `#B08A56` swatches. No prepared SVG fills have been substituted.

## Preview and verification

Serve the repository using any static HTTP server. To check under the production base path, serve its parent and open `/burke-review/`. Browser JavaScript modules require HTTP rather than opening the HTML as a local file.

Run `python scripts/check-assets.py` to verify image checksums, mapping completeness and exact SVG geometry/fills using only the standard library.

Browser checks cover initial black state and no finished-image preloading; all logo/palette selections and application counts; missing-selection instructions; gallery/comparison sources; keyboard image navigation; embedded Colour Lab selection handoff, HEX editing, saved palettes and comparisons; 390px and 768px responsive layouts; and Round 1 return navigation.

Saved Colour Lab palettes and original Round 1 reviews use browser-local storage. Local preview data belongs to the local preview origin; existing production data will remain associated with the GitHub Pages origin when deployed.
