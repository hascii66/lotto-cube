# LottoCube interaction contract

Business evidence: the supplied brief, followed by the user decision on 2026-11-05 to use the real JSON archive, ten calendar years of results, automatic completeness checks, Thai/English, light/dark/system themes, and a mobile PWA. Source contract: https://news.sanook.com/lotto/archive/ and scripts/fetch_lotto.py. The maintained brand is LottoCube. No login, billing, purchase, permission, or deletion flow applies.

## Canonical UI Map

| Capability     | Canonical owner                      | Source of truth                | Allowed variants                                        | Verification      |
| -------------- | ------------------------------------ | ------------------------------ | ------------------------------------------------------- | ----------------- |
| Select/Listbox | Native select in App and DataManager | DESIGN.md                      | native OS popup                                         | tests/app.spec.ts |
| Date           | Native date input in DataManager     | DESIGN.md, src/lib/data.ts     | native OS calendar, ISO stored value                    | tests/app.spec.ts |
| Form           | DataManager and Scorer               | src/lib/data.ts, this contract | create, import review, number scoring                   | tests/app.spec.ts |
| Scrollbar      | Global src/styles.css baseline       | DESIGN.md                      | document and horizontal archive overflow                | tests/app.spec.ts |
| Toast          | Single App live region               | this contract                  | success, information; critical errors inline            | tests/app.spec.ts |
| CRUD           | DataManager, useDraws, History       | supplied brief, this contract  | create; explicit reviewed JSON replacement; no deletion | tests/app.spec.ts |

## Navigation and tables

Navigation, filters, archive query, and archive page persist in URL search parameters. Browser Back restores the prior view and filters. History always searches all stored draws and awards; analytical filters do not restrict it. Client pagination displays 10 rows because the complete bounded dataset is locally owned. Search is local and immediate, so there is no network debounce or request race. Changing the query resets page one; results clamp any stale page. Clear restores focus to the input.

The mobile sidebar is an explicitly non-modal navigation disclosure. It focuses its close control on opening, supports Escape and focus restoration, and becomes inert while closed. Content remains keyboard accessible while it is expanded; the dismiss control over the page is a convenience, not modal isolation. Data forms always use the canonical native modal dialog instead.

## Data lifecycle and resilience

Initial state comes directly from data/lotto-history.json through src/data/history.ts, currently 238 real draws across the ten-year source window. No 24-draw seed is used in production. Reference records remain only in tests/fixtures. useDraws is the sole browser persistence writer and migrates the previous lottolab storage key without deleting it. It merges the bundled archive with saved records, replaces seed entries, and preserves explicit manual/import overrides. Invalid saved bytes are preserved under .recovery before a successful replacement; failed writes do not announce success.

On mount, focus, visibility resume, online recovery, and every visible minute, useDraws asks the same-origin /api/history service to check freshness. Requests are deduplicated; repeated local attempts are separated by 30 seconds. The Python service shares one lock per process and a 120-second check window. It reads the latest source archive rather than inferring draw dates from a schedule. A persisted date manifest proves which draws belong in the ten-year window. Complete current data takes only the lightweight source check; missing dates, incomplete awards, absent coverage, or a newly published draw trigger the history collector. Calendar cutoff handles leap days. Each completed archive page is written atomically, old data is backed up, and no placeholder or fabricated record is accepted. One backend process owns a data directory; shared locking is needed before scaling replicas.

Source failure returns stored history with an explicit stale status. The UI keeps charts usable, does not claim that the source was verified, and retries later. Offline analysis requires no API. The latest draw label means newest stored draw and is accompanied by verification status. JSON updates do not require a rebuild for online clients because the API supplies new records; the bundled archive supplies first-load/offline fallback.

Imports accept JSON arrays up to 5 MB / 10,000 draws and reject the entire file if any row or duplicate date is invalid. Preview shows additions and changed existing dates. Replacement is explicit; unrelated dates remain. Manual create rejects existing dates. All lottery numbers remain strings. Dates must exist and cannot be in the future in Bangkok.

## Forms and feedback

Forms own validation with noValidate, linked labels/errors, invalid states, and first-invalid focus. Keep values after errors. Successful create/import closes the modal, opens the archive, clears query/page, preserves analysis filters, and announces success. Native dialog owns focus containment, background inertness, Escape, and restoration. Dirty create dismissal shows an app-owned discard choice; actual page unload uses the narrow beforeunload lifecycle guard.

## Statistical semantics

The homepage Top 10 panels use all stored draws, explicitly labelled with archive size, independent of the analysis filters below. The two-digit panel counts last2 once per draw; the three-digit panel counts back3 only, twice per draw, excluding front3 and the first prize. Sort by observed count descending, then numeric string ascending for ties. Show only observed numbers, up to ten; never pad sparse/empty rankings with zero-frequency suggestions. The per-number dialog uses exactly the same award scope and retains canonical Escape/focus restoration. These frequency rankings are distinct from the existing heuristic statistical shortlist.

Weekday filtering precedes latest-N selection. 3D includes the selected award groups; all = five numbers per draw. 2D uses only last2. Scoring applies analytical filters; the scorer's occurrence history searches all stored dates and award types and labels that scope. Unique permutations eliminate repeated arrangements. Empty data gives zero counts without NaN or generated recommendations. Ranking formulas are disclosed and are not calibrated probability. Pattern badge uses an absolute difference of 10 percentage points, not a significance test.

## Locale, theme, and installation

PreferencesProvider owns language and theme; the English dictionary is checked against every literal translation key. Switching language preserves numbers, filters, search and scorer input and recomputes visible validation messages. Acknowledgement toasts are dismissed on language change; important errors stay inline. Light/dark choice is initialized before paint and defaults to the OS. All native date/select popups are intentionally OS owned.

The production build generates a service worker with a versioned shell and font cache. Navigation uses the network with a cached compatible shell as fallback; API requests bypass caches. Offline reopen must work after the first completed online load, including a new window and locale switching. A waiting app version requires the explicit update action. Installation uses the browser prompt when available and a shared modal with Safari/Android instructions otherwise. HTTPS is required outside localhost. Tests validate browser behavior; physical iOS installation remains an OS action.

## Verification

Unit tests: src/lib/analytics.test.ts, src/lib/data.test.ts, and src/lib/i18n.test.ts; Python source/collector/server tests in scripts/test_*.py.
Browser and accessibility: tests/app.spec.ts in both themes/locales. Production cache and offline reopen: tests/pwa.spec.ts. Run npm run typecheck, npm test, npm run build, npm run test:e2e, and npm run format:check. Strict skill audit is static evidence only, never a replacement for these checks.
