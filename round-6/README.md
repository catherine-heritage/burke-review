# Round 6 — Approved identity

The current Round 6 uses the approved SVG files supplied by the owner. Their
original bytes are preserved in `assets/approved/`; primary, secondary and
favicon files are included for each company. `assets/approved-rendered/` contains
viewBox-cropped display copies using the same paths, plus light-on-dark and tonal
application variants. No paths are redrawn. The shared-primary and neutral
controls recolour the previews, not the supplied originals.

| Company | Icon | Company text |
| --- | --- | --- |
| Group | #1B2E46 | #1B2E46 |
| Development | #9E9E9E | #939393 |
| Property Management | #1E4497 | #1E4497 |
| Realty | #EF8E4B | #EF8E4B |

The owner confirmed that the intentional icon/text difference is Development.
The approved arrangement uses company colour in the two upper bars. Only the primary logo appears on the overview, each company page, and the
identity-board hero. Secondary artwork is retained for existing mockup applications
and source preservation, without a duplicate preview under the main logo. Browser favicons use the supplied company favicon artwork.

Shared defaults are primary #1B2E46, B accent #5A6B81, Neutral 1 #E6E4E0 and
Neutral 2 #FAFAF8. Shared changes propagate to all companies. Company icon/text
colours are read-only. Accent 2 remains editable for children, starting from the
previously exported brochure options: Development #C5AB78, Realty #F9D1B7 and
Property Management #9FBCCF. These are starting values, not newly approved accents.
Group has no Accent 2 row or state value.

Prepared palettes, generation, favourites and logo-treatment selection have been
removed. The competitor toggle starts off on each load; enabling it loads the
research and reveals the company checks and Competitor colours page. Disabling
it while on that page returns to All companies. The competitor research and
readability method remain references rather than assessments of overall brand
resemblance or complete accessibility compliance.

Settings use the separate browser-local key `burkeApprovedIdentity.v1`, so older
exploratory palettes cannot override the approved defaults. No sign-in is needed
on GitHub Pages. The previous private Sites publication is retained separately.

## Verification

Run `python tests/check-approved-identity.py` from the repository root with
Playwright and Chromium available. It serves only this repository locally and
checks the approved colours and bar arrangement, absence of redundant secondary previews, Accent 2,
shared updates, brochure recolouring, readability, competitor enable/disable,
old-storage isolation and mobile width. Review screenshots are written outside
the repository at `/tmp/burke-approved-checks/`.
