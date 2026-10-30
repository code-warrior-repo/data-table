# mui-datatables feature parity plan

Reviewed October 29, 2026 against the upstream `master` README, package manifest, main table implementation, filter, toolbar, body and text-label sources, and this project's current source. This is a feature/API review, not an execution audit of upstream's full test suite. Freeze a commit SHA before implementation so completion can be measured against an immutable baseline.

## Objective and scope

Deliver every documented user-facing capability of mui-datatables while retaining this project's JavaScript, React and MUI architecture without TanStack. Preserve existing DynamicTable props. Decide explicitly whether consumers need API compatibility: feature parity does not itself make `<MUIDataTable columns options components>` calls work unchanged.

Recommended approach: a modern canonical API plus a separate optional compatibility entry point. Include compatibility in the final milestone if drop-in migration is part of the goal. Deprecated aliases, legacy responsive modes, undocumented props and private internals require explicit ledger entries rather than an accidental promise to reproduce every historical behavior.

Sources:

- [Public API and examples](https://github.com/gregnb/mui-datatables/blob/master/README.md): public parity inventory.
- [Main implementation](https://github.com/gregnb/mui-datatables/blob/master/src/MUIDataTable.js): option normalization, state, events and extension points.
- [Filter implementation](https://github.com/gregnb/mui-datatables/blob/master/src/components/TableFilter.js): immediate versus confirmed filters.
- [Toolbar implementation](https://github.com/gregnb/mui-datatables/blob/master/src/components/TableToolbar.js): print and download integration.
- [Body implementation](https://github.com/gregnb/mui-datatables/blob/master/src/components/TableBody.js): selection, expansion and range selection.
- [Text labels](https://github.com/gregnb/mui-datatables/blob/master/src/textLabels.js): localization surface.
- [Package manifest](https://github.com/gregnb/mui-datatables/blob/master/package.json): declares MUI 5 peers; this project declares MUI 9 peers. Port behavior rather than adopting the older implementation and dependency stack.

## Current coverage and remaining work

“Partial” means a usable foundation exists, not that parity is complete.

| Capability | Current project | Planned completion |
|---|---|---|
| Column/data input | Object rows, header descriptors, dot paths, composite/computed values | Normalize string columns, upstream descriptors and array rows in adapter; stable IDs and schema validation |
| Sorting | Single/multiple sorts, custom comparator, per-column opt-out | Controlled sorting, global disable, descending-first and third-click reset, whole-model custom sorter |
| Pagination | Client/server paging, sizes, All, first/last | Controlled size, disable pagination, jump-to-page, custom footer and individual events |
| Search | Toggleable text search, per-column opt-out | Controlled query/open state, always-open, case-sensitive/custom predicate, debounce helper, placeholder/input props and lifecycle events |
| Filtering | Inline text filters and custom predicate | Dialog/popover, checkbox/dropdown/multiselect/custom inputs, array any/all matching, custom/sorted choices, draft/apply/reset, chips and callbacks |
| Visibility | Missing | Visible/hidden/excluded columns, immutable visibility, chooser, per-column chooser eligibility and events |
| Column order | Missing | Controlled order, pointer/keyboard reorder, locked columns, configurable animation and events |
| Column sizing | Static width | Resizers, min/max bounds, controlled widths, keyboard support and pointer cleanup |
| Selection | Email-specific loaded-data selection | General none/single/multiple selection, eligibility, row-click, checkbox/header visibility, range selection, controlled IDs and select toolbar |
| Bulk delete | Per-row delete only | Selected-row callback with cancellation; consumer-owned backend mutation and local-data update |
| Expansion | Missing | Controlled IDs, eligibility, expand-all/header controls, row-click trigger, custom detail renderer and events |
| CSV/download | Shared serializers, formula escaping, export exclusions | Filename/delimiter settings, explicit row/column scopes, reordered projection, transform/cancel hook and disabled toolbar state |
| Other exports | TXT/JSON/XLSX/PDF | Preserve these additional formats and apply the same scope/query contract |
| Printing | Missing | Print-only document, column eligibility, row scope, repeated headers, unclipped layout and custom styling |
| Responsive layout | Horizontal container | Standard/vertical/simple layouts, breakpoint behavior and accessible labels |
| Sticky/layout controls | Sticky header, max height, density, fullscreen | Fixed selection column, body height, row-hover toggle, elevation, table ID/caption and container props |
| Render customization | Cells, extra toolbar, actions | Header labels/headers, full rows, body footer, pagination footer, search, filter footer, selection toolbar and update-value callback |
| Component overrides | Limited render props | Slots for head/body/footer, toolbar/select toolbar, filter/filter chips, column chooser, resizer, checkbox, expansion button, tooltip, icons and reorder backend |
| Props/styling hooks | Limited column layout and MUI theme | Table/row/cell/header/chip prop getters, stable component names/classes, sx and theme overrides |
| Localization | Hardcoded UI strings | Nested label dictionary, announcements, pagination labels, locale-aware values and RTL verification |
| Persistence | Missing | Versioned storage key, restore/reset, schema migration and column reconciliation |
| Events | Backend request and action callbacks | Unified state-change/init events plus specific search/filter/sort/page/selection/expansion/visibility/order/cell/row events |
| Remote operation | Caller requests and Spring adapter | Standard serializable query/result contract, optional cancellation/debounce adapter, custom sort mappings and remote filter choices |

## Architecture

Keep dependencies flowing in one direction:

```text
normalized columns + rows + effective state
                   |
              pure selectors
                   |
        hooks + semantic action dispatch
                   |
           MUI components / slots
                   |
      optional transport / persistence adapters
```

Proposed modules:

```text
src/core/
  columns.js          # normalize schema and capabilities
  state.js            # defaults, reducer and action contracts
  rows.js             # filter/sort/page selectors
  filters.js          # typed filter operators and facet choices
  selection.js        # ID-based eligibility/range operations
  expansion.js        # ID-based expansion operations
  projection.js       # display/export/print row and column scopes
src/hooks/
  useTableModel.js
  useControlledTableState.js
  useRowSelection.js
  useRowExpansion.js
  useColumnLayout.js
  useTablePersistence.js
src/components/
  TableToolbar.jsx
  SelectionToolbar.jsx
  FilterPanel.jsx
  FilterChips.jsx
  ColumnVisibilityMenu.jsx
  TableHeader.jsx
  TableRows.jsx
  ExpandedRow.jsx
  TableFooter.jsx
src/adapters/
  remote.js
  persistence.js
  muiDatatables.js
```

Use a reducer for semantic transitions and pure selectors for derived data. UI-only states such as an open menu stay near the relevant component. Do not store another copy of filtered/sorted rows.

Canonical state sketch:

```js
{
  pagination: { pageIndex: 0, pageSize: 10 },
  sorting: [{ columnId: 'name', direction: 'asc' }],
  search: { value: '', caseSensitive: false },
  filters: [{ columnId: 'status', operator: 'in', value: ['active'] }],
  columnVisibility: { email: false },
  columnOrder: ['name', 'email'],
  columnSizing: { name: 240 },
  selectedRowIds: [],
  expandedRowIds: []
}
```

Expose `state`, `initialState`, and `onStateChange(nextState, event)`, with per-slice controlled behavior. Controlled props win over persisted/default state. Resolve reset rules in the reducer and notify from the action path, avoiding duplicate backend requests from effects. Keep draft dialog filters separate from committed query filters.

Use stable row and column IDs throughout. Generate upstream `dataIndex` and `rowIndex` metadata only at the compatibility boundary. Separate raw/accessor values, filter/search values, rendered nodes and export/print values. Preserve this project's existing value behavior through its legacy-prop adapter.

## Delivery phases

Effort estimates below are engineering estimates, not measured upstream facts. They assume one experienced engineer, browser testing, documentation and review. Work is dependent in this order; each phase should be released and verified separately.

### 0. Freeze the contract and parity ledger — 2–3 days

Create `docs/parity-matrix.md` with one row per upstream public table prop, option, column option, callback, component override and plugin. Record exact baseline SHA, default, mapping, observable behavior, test and example. Add a separate list for source-only/deprecated behavior; resolve README/source differences explicitly.

Acceptance: every public entry maps to a planned implementation and phase; the distinction between feature parity and API compatibility is documented. Record existing exports and UI defaults before changing them.

### 1. State and extension foundation — 5–7 days

Introduce schema normalization, reducer, controlled state slices, semantic events and the slot contract. Extract the toolbar, header, rows and footer from DynamicTable. Add declaration files and public API documentation while keeping implementation in JavaScript. Retain legacy props through a normalization layer with documented conflict precedence.

Acceptance: existing consumers still pass; controlled state changes appear immediately; local actions emit consistent events; one action produces one remote-query notification; multiple tables and SSR hydration are covered.

### 2. Search, filtering and pagination parity — 6–8 days

Implement all filter editors, available choices, array matching, chips, draft/apply/cancel/reset and render hooks. Complete search controls and debouncing. Add pagination disable/jump/controlled size and sorting-cycle options. Define filter-choice behavior independently from the loaded server page; allow remote/static choices.

Acceptance: all filter types work locally and in server query serialization; cancel sends no query, apply sends one, reset and chip removal update the same model. Verify nulls, arrays, dates, empty values and interaction with sorting/paging.

### 3. Selection, bulk actions and expansion — 6–8 days

Replace email-specific state with the shared selection model and preserve its current external behavior through an adapter. Add modes, eligibility, select-all scopes, shift ranges, row-click controls, selection toolbar placement and delete cancellation. Add expansion with independent controls and a detail renderer.

Acceptance: selections/expansions remain attached to IDs after sorting/filtering; checkbox, action and expansion clicks do not trigger unintended row actions. Clarify current-page versus matching-dataset selection. General remote “select all matching” is an optional extension requiring a query/exclusion contract, not something to infer from loaded rows.

### 4. Column management and presentation — 6–9 days

Implement visibility first, then ordering, then sizing on the same normalized schema. Add mobile layouts, sticky selection cells and missing layout controls. Use feature-local pointer events for sizing; choose a reorder dependency only if needed for robust accessible dragging. Provide keyboard alternatives.

Acceptance: column settings survive each other and data updates; excluded/locked columns behave consistently; resizing does not trigger sort or drag; layout works in RTL, mobile and fullscreen. Header/body/filter/export mappings stay aligned after reordering.

### 5. Export, print and full customization — 5–7 days

Build a shared projection service with explicit rows (`page`, `filtered`, `selected`, `all`) and columns (`visible`, `exportable`, `printable`) scopes. Add CSV configuration and cancellation/transform hooks. Allow direct server export handlers to bypass fetching all JSON rows. Implement print-specific layout and complete render/prop hooks and component replacements.

Acceptance: requested order and scope are consistent across formats; hidden and excluded columns follow configured rules; CSV injection protection remains; actual workbook/PDF content and print output are verified. Upstream “displayed rows” behavior must be checked against its implementation and mapped explicitly rather than assumed to mean the current page.

### 6. Persistence, localization and release hardening — 5–7 days

Add versioned preference storage, schema reconciliation and reset. Persist layout/preferences by default; saving query terms or row IDs is opt-in. Replace hardcoded strings and add locale/RTL examples. Verify accessibility and performance across feature combinations; publish a complete example catalog and compatibility matrix.

Acceptance: corrupt/old storage does not break rendering; removed/new columns restore safely; every control and live announcement is localizable; keyboard operations, focus restoration and SSR work. Validate supported React/MUI/Node versions and resolve or document dependency audit findings.

### 7. Optional API compatibility adapter — 5–8 days

Provide an explicit `compat` entry point for upstream-style `title`, `columns`, `options`, `components`, array rows, callback metadata and aliases. Translate names, default values, index-based selection/expansion and render signatures into the canonical model. Emulate value-update callbacks through a documented immutable-data callback. Preserve compatibility-specific rendered-value filter behavior in the adapter, not the core.

Acceptance: representative upstream examples run through the adapter; all claimed mappings have conformance tests. Unsupported private internals or historical aliases produce a clear documented outcome. Exact behavioral compatibility can extend this estimate after the ledger is complete.

Core feature parity: approximately 35–49 engineering days. With the optional adapter: approximately 40–57 days. Plan roughly 10–14 calendar weeks for one engineer including review and integration contingency; revise after phase 0. Backend endpoints and application-specific bulk operations are outside these estimates.

## Backend boundary

Keep HTTP routing, database queries, authorization and mutations outside the React table library. An optional reference Node service can demonstrate the contract without becoming a dependency of the UI package.

A remote query should contain versioned pagination, allowlisted sort fields, committed search and typed filters. A result supplies rows and total count, with optional separate facet choices. Query state should serialize without functions. Selection, layout and open-menu state should not trigger data requests.

The backend validates page-size limits and filter operators, maps public field IDs to authorized database expressions, uses parameterized queries and repeats authorization for exports/bulk operations. Use a deterministic secondary sort to stabilize pagination. Large exports should use a streaming endpoint or job rather than browser materialization. Cancellation and stale-response handling belong in the fetch adapter or application integration.

## Completion criteria

- Every baseline public API ledger entry has a mapping, example and behavioral test; no untracked parity claims.
- Unit tests cover reducers/selectors; interaction tests cover components and callbacks; browser tests cover drag/resize, print, mobile and accessibility.
- Integration combinations include controlled state + persistence, filters + server paging, selection + sort/filter, expansion + actions, visibility + ordering + export, and RTL + sizing.
- A reference demo exercises each feature and the important combinations, including a working mock server.
- Existing library consumers retain documented behavior or receive explicit migration instructions.
- Package checks include lint, tests, declarations, build, installation/import smoke tests, browser bundle inspection and the declared runtime matrix.
- Performance budgets are established from a measured baseline; virtualization is a separately scoped extension unless needed to satisfy an agreed benchmark. Grouping, pivoting and a spreadsheet editing engine are also separate capabilities, not assumed upstream parity requirements.

## Additional reference: mui-tablekit

The subsequent [mui-tablekit review](./mui-tablekit-review.md) examines commit `1f26294cdf779378a1f70c89841a6cd211050c23` and extends this roadmap with typed numeric/date filters, nested row trees, grouped/collapsible columns and left/right pinning. Treat those additions as explicit scope beyond the original mui-datatables inventory. Preserve this project's multiple-sort state and richer export formats. The review includes proposed schema changes, acceptance cases and additional estimates; no feature implementation is included in that review.
