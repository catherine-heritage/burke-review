# Round 3 Firebase voting setup

The website stays on GitHub Pages. No Firebase Hosting configuration, Cloud
Functions, administrator credentials or automatic rule deployment are included.
All changes are on `codex/round-3-firebase-voting` pending approval.

## Publish the rules manually after review

1. Open https://console.firebase.google.com/ and select **burke-logo**.
2. In the left sidebar choose **Build → Firestore Database**.
3. Select the **(default)** database, then open the **Rules** tab.
4. Copy the **entire contents of `firestore.rules`** from this branch. Replace
   the Rules editor with that complete file, including `rules_version = '2';`.
5. Review the rules and click **Publish** yourself when ready. This task has not
   published them. Do not enable test mode.

The complete rule file is [`firestore.rules`](firestore.rules), not a fragment.
It allows an authenticated account to get its own vote, create/update only its
own UID document, and save exactly five validated integer settings. Collection
results can only be listed once that account has a vote. Deleting votes,
writing shared totals, other users' votes, nested documents or other collections
is denied. No composite index is needed.

Anonymous Authentication and the web app are already configured according to
the supplied project details. The public web configuration is in
`round-3/firebase-config.js`. If sign-in fails after deployment, check
**Build → Authentication → Sign-in method → Anonymous** remains enabled and
that the project's API-key/domain restrictions permit the GitHub Pages origin.
Do not add a service-account key.

## Approve the website change separately

The draft PR must be reviewed and approved before it is merged into `main`.
Merging `main` will trigger the repository's existing GitHub Pages publication.
No merge, deployment or hosting migration was performed by this task.
Until the new rules are published, the voting area may show an unavailable
message; the existing logo controls remain usable.

## Stored data and counting

Each active vote is stored at `round3Votes/{firebaseUid}` with only:

```json
{ "spacing": 0, "shape": 0, "weight": 0, "tracking": 0, "colour": 0 }
```

The first four settings allow 0 or 1. Colour uses the existing reference mapping:
0 Original, 1 Single-colour text, 2 Single-colour icon. No subsidiary colours,
name, email, timestamp, IP address or client-written totals are saved in these
vote documents. Firebase itself manages anonymous authentication accounts.

The UID is retained using Firebase Auth's browser-local persistence. Updating
its document changes the vote without increasing the number of active votes.
Returning with that same account restores the recorded vote and shows results.
A different browser/device, cleared browser storage or private browsing can
produce a different anonymous account; this is one vote per Firebase account,
as requested, rather than identity verification of a person.

Results use a Firestore collection listener started only after a server-confirmed
own vote. Security rules independently enforce that gate. The five preference
breakdowns are shown first, followed by at most three complete combinations.
Counts and percentages use all valid active votes. Ties use the settings code
for a stable order. Results initially read the existing vote documents; later
updates read changes. Quota/connection errors keep the page usable and expose a
retry option. This uses Spark-compatible Auth/Firestore features without a paid
server or Cloud Functions.

## Verification performed locally

- Firestore rules were evaluated by Google's official Firestore emulator
  **1.22.0**, on `demo-burke-logo`. Its Cloud SDK archive checksum was verified.
- **10 Node tests** passed: data validation/aggregation and security rules.
- Chromium used the actual Firebase browser SDK and local Anonymous Auth and
  Firestore emulators. First votes, duplicate clicks, changing a vote with a
  stable total, restoring the same UID and selection, two-browser live updates,
  five total voters/four distinct combinations, top-three ranking and percentages,
  both Round 3 routes and mobile layouts passed.
- Fault-injection tests passed for permission/network failures, retry, rejected
  and pending votes, capturing the choice at click time, results-read failure,
  results retry and stale-count messaging. Unconfirmed writes never unlock results.
- Existing checks passed: 28 SVG/reference pixel comparisons, 192 underlying
  combinations, 48 interface settings, navigation, earlier review flows, asset
  integrity, JavaScript syntax and whitespace.

Screenshots: `/tmp/burke-voting-before.png`, `/tmp/burke-voting-after.png`,
`/tmp/burke-voting-mobile.png`. These contain **local emulator test votes only**.

## Live Firebase verification status

**Not verified against the production database.** A live anonymous-auth readiness
request was attempted, but this execution environment blocked the Google API
connection with `403 Forbidden` at the network proxy. It did not reach Firebase.
No live anonymous account or vote was created and no rules were published.
Production reads/writes, authorized-domain configuration and live result updates
still need a real-browser smoke test after you publish the rules and approve the
website deployment. Local emulator success is not presented as live verification.

After deployment, open the website, cast a vote and confirm the count increases
by one. Change its settings and update: the total should stay the same. Reload
and confirm the saved selection and results return. Open another browser/private
window: results must be hidden until that account votes, then updates should
appear in the first browser automatically.

## Repeat local tests / rebuild SDK

The static site has no required build step. Firebase SDK 13.0.0 is self-hosted in
`round-3/vendor/`, with its licence notices, so a failed third-party script host
cannot prevent logo rendering. To update the vendored SDK after dependency changes:

```sh
npm ci
npm run build:firebase
```

For local tests, install Java 21+, Python Playwright and Chromium at
`/usr/bin/chromium`, then run:

```sh
npm run test:rules
npm run test:voting
python -u scripts/check-round-3.py
```

`firebase.test.json` is for local emulators only and the scripts explicitly use
`demo-burke-logo`. There is no deployment command. The browser tests replace only
the Firebase transport/configuration with local emulator endpoints; the production
page has no URL flag or user-accessible switch for changing its backend.
