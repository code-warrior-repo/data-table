# mui-tablekit review and combined roadmap

Reviewed October 29, 2026 at commit `1f26294cdf779378a1f70c89841a6cd211050c23` (package version 0.1.2). This review inspected source, public types, documentation and test cases; it did not install dependencies, run upstream tests or validate the live browser demo. Reported behavior below is based on static inspection, not a production readiness certification.

## Recommendation

Use mui-datatables as the public-capability checklist and mui-tablekit as a second, modern architectural reference. Continue developing this project's modular engine-free implementation. Replacing the package with mui-tablekit would require adapting consumers and retaining several existing features separately; its API is intentionally different.

Do not add a dependency on either table engine. Reuse the design principles and implement against our agreed contracts. Preserve existing DynamicTable props, multiple sorts, composite headers, row actions, email integration and TXT/JSON/XLSX/PDF output.

## What the source demonstrates

The [manifest](https://github.com/harshmoorjani/mui-tablekit/blob/1f26294cdf779378a1f70c89841a6cd211050c23/package.json) declares MUI 9 and React 19 peers, TypeScript declarations and ESM output. It declares no regular runtime dependencies; UI dependencies are peers. Its MUI generation matches this project's declared MUI major, while its React peer contract is narrower than this project's React 18/19 range.

[model.ts](https://github.com/harshmoorjani/mui-tablekit/blob/1f26294cdf779378a1f70c89841a6cd211050c23/src/model.ts) contains pure state initialization, filtering, comparison and paging. [types.ts](https://github.com/harshmoorjani/mui-tablekit/blob/1f26294cdf779378a1f70c89841a6cd211050c23/src/types.ts) defines the public contracts. [tree.ts](https://github.com/harshmoorjani/mui-tablekit/blob/1f26294cdf779378a1f70c89841a6cd211050c23/src/tree.ts) and [columnLayout.ts](https://github.com/harshmoorjani/mui-tablekit/blob/1f26294cdf779378a1f70c89841a6cd211050c23/src/columnLayout.ts) model hierarchical rows and headers independently of cell rendering. [storage.ts](https://github.com/harshmoorjani/mui-tablekit/blob/1f26294cdf779378a1f70c89841a6cd211050c23/src/storage.ts) validates restored state and omits row selection and expansion when saving.

The key architectural benefit is making these algorithms independently testable. However, [DataTable.tsx](https://github.com/harshmoorjani/mui-tablekit/blob/1f26294cdf779378a1f70c89841a6cd211050c23/src/DataTable.tsx) remains approximately 950 lines and coordinates state, sizing, selection, output and rendering. Our implementation should extract those responsibilities into hooks and smaller components rather than reproducing that concentration.

## Comparison with this project

| Area | mui-tablekit source | Current project | Decision |
|---|---|---|---|
| Query state | Complete controlled state or internal defaults | Internal query state; controlled page | Adopt a consistent ownership contract |
| Sorting | One nullable sort descriptor | Multiple sort descriptors | Keep our multiple-sort model |
| Filtering | Typed values, custom controls, ranges, choices, chips and draft confirmation | Inline text/custom predicate | Add typed operators and pluggable editors |
| Selection | Stable IDs, modes, eligibility, scope and bulk callback | Email-specific selection, reset on new data array | Build a shared ID model; preserve legacy email reset policy through an adapter |
| Expansion | Detail rendering and hierarchical rows | Missing | Add details first, tree semantics in a separate milestone |
| Columns | Nested groups, aggregate collapse, visibility/order/width/pinning | Flat headers and static width | Extend normalized schema before adding controls |
| Output | CSV and text-only print | CSV/TXT/JSON/XLSX/PDF | Preserve our formats and add printing |
| Persistence | Validated browser storage, no selected/expanded row IDs | Missing | Add versioned storage with explicit precedence and policy |
| UI feedback | Application-owned remote status | Built-in loading/error props | Preserve our feedback states |
| Extension | Typed components and render hooks | Cells, actions, extra toolbar | Build stable slots with documented responsibilities |

## Design lessons worth adopting

1. **State ownership and identity.** Require stable row IDs for stateful interactions. Keep selected IDs independent of whichever page is loaded. State changes should not automatically mean network requests: compare the query subset before fetching. Dataset switches need an explicit selection/expansion reset policy.
2. **Filter semantics.** Keep raw values distinct from display nodes. Define inclusive ranges, invalid/inverted range behavior, array any/all matching and custom editor value shapes. Decide whether date filters represent UTC days, local days or a configured business timezone; do not silently change existing date formatting.
3. **Tree semantics.** Sort siblings, page roots, retain ancestors of matching descendants and reveal matching paths without overwriting saved expansion. Validate IDs throughout the hierarchy and reject cycles. Parent totals remain caller-provided unless a separate aggregation contract is added.
4. **Header trees.** Group headers need computed spans and explicit cell/header associations after visibility and order changes. Aggregate-column collapse is a presentation feature, not automatic row grouping, pivoting or calculation.
5. **Column layout.** Pinned offsets depend on effective widths and utility columns. Enforce reorder rules across locked columns and pinned zones. Provide keyboard alternatives and disable or adapt pinning when the viewport cannot fit it. Make width bounds configurable rather than copying the source's fixed limits.
6. **Remote ownership.** Render exactly the response page; do not relabel old response rows after locally clamping a server page. The application resolves out-of-range pages and stale requests. Never label loaded-row selection or export as all backend results.
7. **Output isolation.** Reuse one projection of rows and columns across formats. A print document should exclude interactive controls and treat text as text. Keep whole-dataset streaming exports in the application/backend adapter.

The source's test suite includes scenarios for invalid dates, tree ID/cycle checks, grouped-header spans, export escaping and cleanup, selection and customization. These are useful acceptance-test ideas. Their presence does not substitute for running our own tests or browser qualification.

## Limitations and adoption checks

- The public state contains a single sort object; adopting it directly would reduce this project's multi-sort capability.
- CSV and print are the native output features. Our other serializers and custom export handlers remain separate work.
- It does not provide a general remote-all-results action contract, virtualized rendering, or an automatic aggregation engine. Nested data support should not be described as any of those.
- Public component hooks do not provide a dedicated replacement for every upstream filter/column panel or dialog footer. A component slot inventory is still required for mui-datatables parity.
- Persistence lacks an explicit schema-version migration mechanism in the inspected source. Add one here. Test Next.js hydration with stored preferences because restoration occurs in state initialization and server/client storage availability differs.
- Cached row filtering/sorting helps, but some full-dataset work remains in the component. Establish actual render and interaction benchmarks before making large-data claims.
- Test real-browser drag, touch resize, focus, grouped pinning, native printing and screen readers. The upstream documentation explicitly defers some browser/manual qualification; this review does not establish that coverage.

## Changes to the existing implementation plan

Keep phases 0–7 in `mui-datatables-parity-plan.md`, with these additions:

| Existing phase | Addition |
|---|---|
| 0: inventory | Add mui-tablekit's frozen commit and independent feature mappings; distinguish added capabilities from original upstream parity |
| 1: state/schema | Allow nested column definitions; reserve separate row-expansion and column-group-expansion state; define query-only notifications |
| 2: filtering | Make number/date ranges first-class; specify invalid values, date timezone, choices and array operators |
| 3: interactions | Separate row-detail expansion from hierarchical child expansion and preserve selection across page refreshes in the new API |
| 4: layout | Add left/right pinning, cumulative offsets, pin zones, grouped-header geometry and narrow-screen fallback |
| 5: output | Define nested/group column paths and tree row scopes consistently for CSV, TXT, JSON, XLSX, PDF and print |
| 6: hardening | Add hydration/storage migration tests, tree/group/pin interaction cases and measured performance budgets |

Add a separate hierarchical-data milestone after basic selection and layout:

- Pure row-tree construction and filtering/sorting/paging selectors.
- Grouped header construction and accessible associations.
- Aggregate-versus-child column expansion state.
- Root-count pagination, filtered ancestor retention and temporary reveal.
- Layout and output integration, examples and regression tests.

Estimate **8–12 additional engineering days** for that milestone and **2–4 additional days** for robust column pinning. These estimates include tests and examples but assume no automatic aggregates, cascading tree selection, pivoting, lazy child loading or virtualization. Those capabilities need separate requirements.

Combined estimate: the previous 35–49-day core plan becomes approximately **45–65 engineering days** if these tablekit additions are included. The optional mui-datatables API adapter remains another 5–8 days. Re-estimate after the combined parity inventory; neither library's README is a substitute for an agreed acceptance contract.
