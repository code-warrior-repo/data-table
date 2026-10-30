# Hardening implementation status

Updated October 30, 2026. Implements the seven priorities in order without adding a table-engine dependency. The original review is retained as the baseline; the status below supersedes its observations about missing APIs.

| Priority | Delivered | Evidence |
|---|---|---|
| 1. State ownership | `state`, `initialState`, `onStateChange`, `onQueryChange`, pure transitions, `createTableState`, controlled-key validation and legacy callback compatibility | State/interaction tests cover full and partial control, delayed parent acceptance, parent resets, Strict Mode, batched patches, no-ops and client/server notification boundaries. |
| 2. Typed package boundary | Public declaration files and root/client plus `/core`, `/spring`, `/exports` entries | Strict consumer compilation and packed-library installation/import smoke test. Root retains its client directive; pure helper entries do not have one. |
| 3. Export lifecycle | Abortable jobs, progress/cancel controls, snapshots, completion/error/cancel notifications and endpoint mode | Tests cover cancellation, unmount, stale completion and endpoint row-fetch bypass. Built-in download wrappers check abort before their side effect. |
| 4. Value correctness | Explicit `dataType`, `nulls`, `locale`, total-order comparison and raw typed export values | Comparator reflexivity/antisymmetry/transitivity checks over mixed/invalid samples, null-placement tests and typed export regressions. |
| 5. Identity/selection | Stable IDs for interactive rows, duplicate rejection, general row selection independent of email, controlled selected IDs, scope, dataset/reset policies | Selection tests cover refresh, dataset switches, parent acceptance and scope. Labels now target checkbox inputs rather than wrappers. |
| 6. Release qualification | Node/React CI matrix, browser/axe suite, tarball consumer checks, declaration checks and release notes | `.github/workflows/ci.yml`, `playwright.config.js`, `tests/browser`, `scripts/check-package.mjs`. Hosted CI has not run in this local session. |
| 7. Composition/performance | Named wrapper slots/props, UI labels, live multi-sort description, search focus and independent filtering/sorting/pagination memoization | Slot/localization tests and a regression proving that page changes do not rerun the filter/sort accessors. A benchmark script records a synthetic baseline. |

## Migration

- Interactive row controls require valid stable IDs; duplicate IDs are rejected even without controls. Noninteractive rows may use original-input-index keys.
- `headersToExportColumns` now preserves raw primitive/Date values. Supply `exportValue` for display-formatted export text.
- Null/invalid comparison values sort last in both directions by default; set `nulls: 'first'` as needed. Custom comparators own their policy.
- Native controlled keys must remain fixed for a mounted table. Initial props initialize only; parent resets should update `state`.
- Choose one callback to own fetching; both native callbacks can observe an action and legacy server callbacks remain supported.
- Component slots must preserve props, children, refs and native table semantics. Application renderers own their interactive controls and accessible names.

## What this does not certify

These changes do not constitute an unconditional production approval. Remaining release gates:

1. Run the checked-in CI matrix on the declared supported Node/React versions. The local host is Node 24.11.1, below the declared Node 24 minimum.
2. Complete manual screen-reader, native fullscreen/download and physical-device qualification. Automated axe checks are limited to the tested rendered states; they do not cover every possible custom renderer/theme.
3. Resolve or formally accept the two moderate ExcelJS/UUID findings. No untested major transitive override or forced downgrade was applied. Package consumers' dependency resolution must also be considered.
4. Choose and include the distribution license. `LICENSE` remains absent; this change does not invent a legal grant for the project.
5. Review and version the documented breaking migration changes before publishing.
6. Define workload-specific performance budgets and run them on target browsers/devices. The synthetic Node benchmark is descriptive, not an SLA.

Export cancellation suppresses subsequent work/download after the signal is observed; synchronous spreadsheet/PDF generation cannot be preempted on the main thread. Endpoint implementations must observe the provided signal and maintain their own authorization, query validation and snapshot guarantees. Bulk operations and email delivery remain application-owned.

## Commands

```sh
npm ci --ignore-scripts
npm run check
npm run test:package
npm ci --prefix examples/nextjs-demo --ignore-scripts
npm run build --prefix examples/nextjs-demo
npx playwright install
npm run test:browser
npm run benchmark
```

Run the package smoke test after building. Browser tests start their own localhost server and consume the built demo. The current suite targets Chromium, Firefox and WebKit in CI. No deployment or release is performed by these commands.

## Local verification record

- `npm run check`: lint, strict declaration consumer checks, **148 tests**, and library build pass.
- Next production build: all **59 individual examples** generated successfully.
- Fresh tarball consumer: installed package, strict type compilation and pure-entry imports pass.
- Synthetic Node baseline: 1,000 rows/3 columns median 4.01 ms; 10,000 rows/3 columns median 46.67 ms for filtering + numeric sort + paging (five warm runs on Node 24.11.1). These timings are host/workload-specific.
- Four Chromium interaction tests pass, including keyboard search and axe checks, controlled resets, narrow-screen server paging/action menus, general selection and Spring export cancellation; Firefox/WebKit and hosted runtime matrix are configured in CI, not locally qualified by the unit-test result.

## Generic actions and placement update

Selection now feeds caller-owned `renderBulkActions`, with selected IDs, selected loaded rows, unloaded selected IDs, disabled state and explicit clearing. The legacy email button remains compatible and is replaced when a generic renderer is supplied. Checkbox position is first by default, with last/numeric placement available; toolbar controls default left with global and individual side overrides. Repositioning preserves active controls/jobs.

The catalog now has 66 individual examples. Layout/bulk interaction tests, strict declaration checks, the fresh-package consumer and production demo build pass. Five Chromium tests pass, including actual first-column bulk selection and split-toolbar geometry. Existing release gates above remain unchanged.

## Column movement and sizing update

Column order and pixel widths now have independent controlled/initial props and callbacks. Header move buttons support native drag/drop, keyboard arrows and menus; resize separators support pointer capture, keyboard steps and min/max bounds. Per-column locks keep utility and fixed columns aligned. Layout state stays outside query processing; it preserves selection and sorting, and exports follow the displayed order. The green default and pagination accessibility fixes remain in place.

Verification: lint, strict declaration checks, 187 unit/component/example tests, library build and production demo build pass (69 individual examples). All 10 Chromium checks pass, including actual column drag/drop, pointer resizing, controlled reset and automated accessibility scans. Focused layout/selection tests also passed after consolidating column widths. Other browser engines and manual screen-reader/touch-device qualification remain outside this local verification.

## Complete pagination examples update

The catalog now includes 71 examples, with integrated client and Spring server demos combining compatible end-user features. Both demonstrate controlled queries and column layout, generic cross-page selection/actions, dynamic row menus, header filters/tooltips, typed and rendered columns, all five export formats, theme/density/fullscreen controls and positioning. Client mode adds All and loading/error/empty previews; server mode uses the real Spring adapter and bounded complete-result export, stale-read cancellation, isolated mock mutations and failure/retry. Supporting UI/backend sources are included on each demo page.

Combined checks exposed filter-label contrast on colored headers and duplicate MUI/Emotion contexts in the linked demo. Header filters now have paper-colored surfaces and readable focus styles; demo resolution aliases share a single peer installation so caller-rendered cells follow the selected theme. Application example buttons inherit readable text colors, and warning chips use contrasting text.

Verification: 196 unit/component/example tests, lint, strict declaration checks, library build and demo production build pass (75 generated pages, including 71 example routes). All 13 Chromium tests pass. New browser checks download all five formats, inspect complete CSV/JSON/XLSX data and PDF signature, exercise client queries/layout/actions and server cross-page bulk operations/filtering/sorting/retry, and scan focused filters/custom cells in every built-in theme. Other browser engines and manual device/screen-reader qualification remain outside this local verification.
