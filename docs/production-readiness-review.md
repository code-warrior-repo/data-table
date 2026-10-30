# Production-readiness review

Reviewed October 30, 2026 against this repository's current implementation. This is an engineering assessment of the source, tests, package output and declared runtime support. It is not a security audit or certification.

## Implementation update

The [hardening status](hardening-status.md) records the subsequent implementation of all seven priority areas and the remaining release gates. The findings below are the pre-hardening baseline, retained for traceability; they are not a current inventory of missing APIs.

## Assessment

The component is a useful alpha implementation with a reusable row model, working examples and regression tests. I would not yet approve it as a general-purpose production library shared across teams. The gaps are primarily API ownership, lifecycle handling, accessibility qualification and release engineering. Feature parity with another table package would not resolve those gaps by itself.

A production decision should target specific supported use cases, dataset sizes, runtime versions and accessibility requirements. Keep the no-TanStack requirement; none of the recommendations requires a table-engine dependency.

## Changes completed in this update

- `src/spring.js` now provides `toSpringRequest` so paging and export criteria share one mapping.
- `fetchAllSpringRows` retrieves bounded pages sequentially and returns a complete row array, with cancellation, progress, row/page limits and optional duplicate-ID checking. It rejects changed totals, malformed/incomplete results and exceeded bounds rather than silently truncating.
- The Spring source validates pagination and transport response shape and checks cancellation around fetch/JSON processing.
- Default cells/rows use native MUI styling; colored headers, forced white text, font overrides and zebra striping were removed. Application theme overrides remain effective.
- The theme selector's default now inherits the app theme; with no provider this is MUI's standard theme. Nondefault presets remain opt-in.
- The Spring example reuses one source for normal page requests and full-result exports. The README covers the new helpers and behavioral changes.

MUI's [default theme documentation](https://mui.com/material-ui/customization/default-theme/) explains the baseline `createTheme()` behavior. Standard styling is a maintainability and integration improvement, not evidence that the whole component meets a production bar.

## Findings and required improvements

### P1 — Establish one owner for query state

Evidence: [useTableModel](../src/hooks/useTableModel.js) stores search/filter/sort/size internally but accepts an independently controlled page. `onPageChangeRequest` fires only in server mode. Changing `orderBy`, `order` or `initialRowsPerPage` after mount does not control state. A parent-controlled client page cannot follow built-in pager changes through a dedicated callback.

Impact: URL-driven state, reset/saved-view flows, application-owned queries and data fetching need custom glue. The UI can show state different from what the application believes is active.

Recommendation: introduce `state`, `initialState`, `onStateChange` and semantic query events, with explicit per-slice ownership and precedence. Add a reducer for transitions and a query-only selector for remote requests; selection or layout updates must not trigger fetching. Keep legacy props through a compatibility adapter. Avoid performing user callbacks from state updater functions that may replay.

Acceptance: externally reset every query field; exercise batched actions, Strict Mode, URL restoration and parent-delayed updates. One committed query action must cause one request notification. Follow React's [state ownership guidance](https://react.dev/learn/sharing-state-between-components).

### P1 — Make asynchronous export lifecycle explicit

Evidence: [ExportOptions](../src/ExportOptions.jsx) locks concurrent clicks but has no AbortController, cancel control or unmount lifecycle. Full-row resolution precedes every handler, including direct server export handlers. [DynamicTable](../src/DynamicTable.jsx) does not pass a signal/progress interface to `fetchAllForExport`. The new Spring helper accepts these inputs, but the built-in menu does not yet supply them.

Impact: requests may outlive the mounted table, users cannot cancel, and custom endpoint handlers may unnecessarily retrieve all JSON rows before downloading the actual artifact.

Recommendation: use an export job contract such as `{query, signal, onProgress}` and distinguish row-serialization handlers from endpoint handlers. Cancel on user request/unmount, ignore stale job completions and expose `onExportStart`, `onExportComplete`, `onExportError`. Retain bounded browser exports; use backend jobs or endpoint downloads for large results. Describe the current helper as buffered and bounded, not streaming.

Acceptance: cancel during fetch and generation, unmount during export, start a second job, reject a backend page and change query during a running job. No partial artifact or stale completion notification should result. The saved query must remain the one used by the export.

### P1 — Define value types and comparator laws

Evidence: [util.js](../src/util.js) treats either date-like operand as a reason to date-compare both operands. An invalid Date or non-date opposite operand can produce NaN, and `compareNumbers` returns `1` for NaN comparisons, including self-comparison. `toNumberOrNull` also coerces empty strings and booleans. [column access](../src/core/columns.js) formats composite values, and its export adapter defaults to formatted text.

Impact: mixed or invalid data can produce inconsistent ordering. Numbers/booleans may become strings in table-driven JSON/XLSX exports unless applications override `exportValue`.

Recommendation: define `dataType`, `nulls`, valid-value rules and optional locale/timezone configuration. Separate raw values, search/filter text, display formatting and export values. Build one typed comparison policy with reflexivity, antisymmetry and transitivity. Preserve existing behavior only through an explicit migration layer where necessary.

Acceptance: property-based comparator tests plus cases for NaN, invalid Date, mixed types, nullish values, numeric text, empty strings and booleans. Validate raw numeric/boolean values in exported XLSX/JSON. Define date-only calendar semantics and timezone behavior rather than inferring them from arbitrary strings.

### P1 — Publish a typed, environment-separated package contract

Evidence: [package.json](../package.json) exposes one ESM entry and no declaration entry. [tsup.config.js](../tsup.config.js) marks the entire entry `'use client'`, including exported pure row and Spring helpers.

Impact: TypeScript consumers lack a checked public contract. Next.js server code cannot treat these helpers as an independent server-safe entry. One package entry also makes browser/transport/React responsibilities harder to audit and version separately.

Recommendation: keep JavaScript implementation if preferred, but generate maintained `.d.ts` declarations or migrate the public boundary to TypeScript. Publish explicit entries such as root/client, `/core`, `/spring`, `/exports`, each with its own environment contract. Put client directives only on React UI entries. Retain React/MUI as peers and measure installed-package bundles.

Acceptance: install a tarball in a fresh consumer, compile strict TypeScript, import pure helpers from Node/Next server code, render the table in Next client code and verify that a basic table does not eagerly load PDF/XLSX engines. Test the declared React 18/19 ranges rather than assuming React 19 tests establish both.

### P1 — Verify accessibility and interaction behavior in real browsers

Evidence: current tests are Vitest/jsdom tests. The table has labels and native table markup, but there is no checked-in real-browser/axe qualification. Only the first sort criterion is reflected in the header's sort state. Search focus, loading announcements and fullscreen feedback require browser verification.

Impact: successful DOM tests do not prove keyboard focus, screen-reader announcements, mobile layout, contrast across presets or native fullscreen/print/download behavior.

Recommendation: add a Playwright browser suite and automated accessibility checks. Verify names, focus return after popovers, search autofocus, multi-sort priority announcements, error/live regions and zoom/RTL/mobile behavior. Expose a localization dictionary instead of scattering hardcoded English strings. Use [MUI's table accessibility guidance](https://mui.com/material-ui/react-table/#accessibility) as a starting point, followed by manual screen-reader checks.

Acceptance: keyboard-only completion of the supported table tasks; no serious/critical automated accessibility findings in the agreed matrix; recorded manual screen-reader, zoom and responsive verification. Native MUI styling now supplies the baseline rather than a forced header palette.

### P1 — Make identity and selection an explicit contract

Evidence: [DynamicTable](../src/DynamicTable.jsx) still falls back to displayed-index React keys and object-identity email selection. Supplied row IDs are not checked for uniqueness. Selection resets on any new `data` reference.

Impact: stateful custom cells can be reused for a different record after reorder when IDs are absent. Parent array recreation unexpectedly clears selection; keeping selection across datasets without a policy would instead risk stale bulk operations.

Recommendation: require/validate stable IDs for stateful interactions, decouple selection from email, and define `selectionScope`, `datasetKey`, controlled selected IDs and reset policies. Preserve the current email behavior through compatibility defaults. A backend “all matching” selection needs a separate query/exclusions contract.

Acceptance: refresh rows with the same IDs, replace the dataset, change eligibility, reorder/filter/page and verify exact selected IDs. Reject duplicate IDs and keep action/editor state attached to the correct record.

### P1 — Add repeatable release qualification

Evidence: root `npm run check` covers lint, Vitest and library build, while the demo build is a separate command. No checked-in CI workflow or declaration/runtime/browser matrix is present. The package dry run contains only README, package.json and dist files. `LICENSE` is listed in the allowlist but no LICENSE file exists; relative README references to docs/examples are absent from the tarball.

Impact: a local pass is not reproducible release evidence, published API declarations are unchecked, and external distribution has unresolved license/documentation packaging details.

Recommendation: add CI for supported runtimes, fresh install, root checks, demo production build, declaration consumers, browser/a11y checks, tarball-content checks and consumer smoke tests. Decide the distribution license/ownership explicitly; do not invent one as part of a refactor. Publish usable docs URLs or include the referenced files. Add a changelog and defined API compatibility/versioning policy.

Acceptance: a tagged release can be rebuilt from a clean checkout and installed in fresh supported consumers. The tarball has declarations and intended docs/license, and CI artifacts record the qualification matrix. The current execution host is Node 24.11.1, below the declared Node 24 minimum; run the release checks on a supported runtime even though current checks pass here.

### P1 — Resolve dependency findings before claiming release readiness

The dependency audit on October 30 reports **two moderate findings in the ExcelJS/UUID chain**. npm proposes a major ExcelJS downgrade; no forced fix or untested override was applied. Inspect the dependency's actual usage and available maintained fixes, evaluate alternatives or an optional/server-side export path, and record a reviewed remediation or acceptance. An audit result is not proof of exploitability in this application, nor does lazy loading remove the finding.

### P2 — Improve composition, styling hooks and measurable performance

Evidence: [DynamicTable](../src/DynamicTable.jsx) still combines toolbar composition, browser fullscreen, email selection, actions, header/body rendering and export setup. It does not expose general slot/prop getters. [buildRowModel](../src/core/rows.js) repeats filtering and sorting when the hook's full state object changes, including paging. There are no agreed dataset/interaction budgets.

Recommendation: extract toolbar/header/body/footer and feature-specific hooks. Define a small slot/slotProps contract and retain caller-owned row actions. Memoize filtered/sorted rows independently of page selection. Precompute expensive accessors/comparators only when measured. Establish realistic row/column/refresh workloads; prefer server paging for large datasets and add virtualization only if a measured requirement demands it.

Acceptance: test custom slots without bypassing accessibility or state behavior. Record render, search, page-change, refresh and export performance against agreed budgets and browser/device targets. Avoid hardcoded width/visual choices unless they are documented product requirements.

## Suggested implementation order

1. **Contract and correctness:** complete controlled state, identity rules and comparison/value semantics. Add declarations as part of this boundary, not after another round of features.
2. **Async and environment boundary:** export jobs/cancellation, shared query mapping and client/server-safe package entries.
3. **Release evidence:** browser/a11y/runtime matrix, fresh consumer tests, dependency remediation and packaging/license decisions.
4. **Extension and performance:** small stable slots, component decomposition, measured memoization and localization.
5. Resume parity features only after those gates: advanced filters, visibility/reorder/resize, expansion and trees should build on established contracts.

A focused hardening release should aim at a smaller verified use-case matrix instead of promising every future feature. Rough planning allowance: 2–4 engineering weeks for the first release gates, subject to the agreed scope and runtime/browser matrix. This does not include the full mui-datatables/tablekit parity roadmap.

## Verification completed for this update

- Lint, 121 tests and library build pass, including new Spring paging/export and theme inheritance regressions.
- Next production build generated all 54 example routes successfully.
- npm package dry run succeeds; its contents expose the documentation/license gaps noted above.
- Dependency audit completed and the two moderate findings remain disclosed.

The export helper detects changing counts and optionally duplicate IDs; offset pagination still cannot provide a transactional snapshot of a concurrently changing dataset. A deterministic unique sort or backend snapshot is required for stronger guarantees. Spring's [Page contract](https://docs.spring.io/spring-data/commons/docs/current/api/org/springframework/data/domain/Page.html) supplies totals and page metadata, not transactional consistency.
