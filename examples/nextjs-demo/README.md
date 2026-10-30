# Individual DynamicTable examples

The catalog contains **69 separate examples**, one source file and route per implemented capability. It uses the public package API. Planned tree, grouping, persistence and advanced filter-dialog features are not part of the current implementation.

## Run

Use a Node version allowed by the root package's `engines` field (`.nvmrc` supplies one).

From the repository root:

```sh
npm install
npm run build
npm install --prefix examples/nextjs-demo
npm run dev --prefix examples/nextjs-demo
```

Open [the example catalog](http://localhost:3000). Each example has its own `/examples/<slug>` page, description, live controls and expandable source. `/spring` remains an alias for the Spring adapter example.

The demo imports the library's built `dist` through the local package dependency. Rebuild the root library after changing its source. Restart the demo if an installed local package or cached build needs refreshing.

To verify the examples and library:

```sh
npm run check
npm run build --prefix examples/nextjs-demo
```

The root test suite imports example components through a source alias; the Next production build separately checks package integration and generated routes.

## Data and remote behavior

All data is synthetic and shared from [examples/shared.js](examples/shared.js). Remote examples use [examples/mockServer.js](examples/mockServer.js); they require no API credentials or running backend. Its cancellable delayed requests exercise the server contract, and its fetch-compatible adapter returns Spring Data Page responses.

Replace `loadPage` or the supplied mock `fetcher` with an application fetch integration when connecting a real service. Match the request/response contract rather than adding backend code to the table package. The endpoint-download example also supplies a simulated fetcher; omit it to use a real endpoint.

Email controls preview recipients only. Legacy action examples report their callback invocation without deleting, cloning or sending records. Export examples download real files when activated. The custom-handler example instead reports the received export context. Browser fullscreen requires support and a user gesture.

The controlled-page example demonstrates native partial controlled state in client mode; the external controls and built-in pager update the same parent-owned page. The controlled-query example shows full-query ownership and reset.

## Catalog

### Data

| Example | Source | Purpose |
|---|---|---|
| [Basic table](http://localhost:3000/examples/basic) | [basic.jsx](examples/basic.jsx) | Render object rows with stable IDs. |
| [Column options](http://localhost:3000/examples/column-options) | [column-options.jsx](examples/column-options.jsx) | Set widths, alignment and per-column capability opt-outs. |
| [Composite columns](http://localhost:3000/examples/composite-columns) | [composite-columns.jsx](examples/composite-columns.jsx) | Join fields with a separator and suffix. |
| [Computed values](http://localhost:3000/examples/computed-values) | [computed-values.jsx](examples/computed-values.jsx) | A valueGetter powers display, search and sorting. |
| [Custom cells](http://localhost:3000/examples/custom-cells) | [custom-cells.jsx](examples/custom-cells.jsx) | Render MUI chips and formatted amounts without changing raw sort values. |
| [Date formatting](http://localhost:3000/examples/date-formatting) | [date-formatting.jsx](examples/date-formatting.jsx) | Format date-only strings and Date objects independently. |
| [Nested fields](http://localhost:3000/examples/nested-columns) | [nested-columns.jsx](examples/nested-columns.jsx) | Read values through dot paths. |

### Query

| Example | Source | Purpose |
|---|---|---|
| [Client pagination](http://localhost:3000/examples/pagination) | [pagination.jsx](examples/pagination.jsx) | Change pages and page sizes, including All. |
| [Column filters](http://localhost:3000/examples/column-filters) | [column-filters.jsx](examples/column-filters.jsx) | Combine case-insensitive substring filters across columns. |
| [Controlled page](http://localhost:3000/examples/controlled-page) | [controlled-page.jsx](examples/controlled-page.jsx) | External buttons control currentPage; the built-in pager uses the same state. |
| [Custom comparator](http://localhost:3000/examples/custom-sort) | [custom-sort.jsx](examples/custom-sort.jsx) | Sort statuses in business order rather than alphabetically. |
| [Custom filter predicate](http://localhost:3000/examples/custom-filter) | [custom-filter.jsx](examples/custom-filter.jsx) | The score filter uses a minimum threshold rather than substring matching. |
| [Global search](http://localhost:3000/examples/search) | [search.jsx](examples/search.jsx) | Open the search icon, type a name, status or score, then close it to clear. |
| [Multi-column sorting](http://localhost:3000/examples/multi-sort) | [multi-sort.jsx](examples/multi-sort.jsx) | Use the sort icon to add priority columns; cycle ascending, descending and removed. |
| [Single-column sorting](http://localhost:3000/examples/single-sort) | [single-sort.jsx](examples/single-sort.jsx) | Click a header to alternate ascending and descending order. |

### Actions

| Example | Source | Purpose |
|---|---|---|
| [Caller-defined row actions](http://localhost:3000/examples/row-actions) | [row-actions.jsx](examples/row-actions.jsx) | Define action buttons at the call site and inspect the row passed to the handler. |
| [Conditional and disabled actions](http://localhost:3000/examples/conditional-actions) | [conditional-actions.jsx](examples/conditional-actions.jsx) | Only active rows have an Edit action; pending work disables the button. |
| [Display-only action column](http://localhost:3000/examples/display-column) | [display-column.jsx](examples/display-column.jsx) | Position controls before data columns; they are excluded from all data operations. |
| [Email selection](http://localhost:3000/examples/email-selection) | [email-selection.jsx](examples/email-selection.jsx) | Select matching rows or leave selection empty to use all matching rows. No email is sent. |
| [Row action menu](http://localhost:3000/examples/action-menu) | [action-menu.jsx](examples/action-menu.jsx) | A caller-owned component uses hooks to manage a menu for each row. |

### Compatibility

| Example | Source | Purpose |
|---|---|---|
| [Action descriptors](http://localhost:3000/examples/action-descriptors) | [action-descriptors.jsx](examples/action-descriptors.jsx) | Use dynamic visibility and disabled rules with the descriptor API. |
| [Legacy Clone action](http://localhost:3000/examples/legacy-clone) | [legacy-clone.jsx](examples/legacy-clone.jsx) | An individual original action flag and callback; this demo reports intent without mutating data. |
| [Legacy Delete action](http://localhost:3000/examples/legacy-delete) | [legacy-delete.jsx](examples/legacy-delete.jsx) | An individual original action flag and callback; this demo reports intent without mutating data. |
| [Legacy Edit action](http://localhost:3000/examples/legacy-edit) | [legacy-edit.jsx](examples/legacy-edit.jsx) | An individual original action flag and callback; this demo reports intent without mutating data. |
| [Legacy Report action](http://localhost:3000/examples/legacy-report) | [legacy-report.jsx](examples/legacy-report.jsx) | An individual original action flag and callback; this demo reports intent without mutating data. |
| [Legacy View action](http://localhost:3000/examples/legacy-view) | [legacy-view.jsx](examples/legacy-view.jsx) | An individual original action flag and callback; this demo reports intent without mutating data. |
| [Legacy action options](http://localhost:3000/examples/legacy-action-options) | [legacy-action-options.jsx](examples/legacy-action-options.jsx) | Customize labels, icon presentation and visibility predicates. |

### Output

| Example | Source | Purpose |
|---|---|---|
| [CSV export](http://localhost:3000/examples/export-csv) | [export-csv.jsx](examples/export-csv.jsx) | Download only this format using the export menu. |
| [Custom export handler](http://localhost:3000/examples/custom-export-handler) | [custom-export-handler.jsx](examples/custom-export-handler.jsx) | Replace one format handler and inspect the export context instead of downloading. |
| [Endpoint export](http://localhost:3000/examples/endpoint-export) | [endpoint-export.jsx](examples/endpoint-export.jsx) | Download an endpoint response using exportWithEndpoint. |
| [Export values and exclusions](http://localhost:3000/examples/export-columns) | [export-columns.jsx](examples/export-columns.jsx) | Exclude private fields and format export values independently of rendered cells. |
| [JSON export](http://localhost:3000/examples/export-json) | [export-json.jsx](examples/export-json.jsx) | Download only this format using the export menu. |
| [PDF export](http://localhost:3000/examples/export-pdf) | [export-pdf.jsx](examples/export-pdf.jsx) | Download only this format using the export menu. |
| [TXT export](http://localhost:3000/examples/export-txt) | [export-txt.jsx](examples/export-txt.jsx) | Download only this format using the export menu. |
| [XLSX export](http://localhost:3000/examples/export-xlsx) | [export-xlsx.jsx](examples/export-xlsx.jsx) | Download only this format using the export menu. |

### Remote

| Example | Source | Purpose |
|---|---|---|
| [Bounded Spring full export](http://localhost:3000/examples/spring-export) | [spring-export.jsx](examples/spring-export.jsx) | Fetch all pages with limits, progress and cancellation. |
| [Full-result server export](http://localhost:3000/examples/server-export) | [server-export.jsx](examples/server-export.jsx) | Resolve every matching row before downloading a partial backend dataset. |
| [Server pagination and cancellation](http://localhost:3000/examples/server-pagination) | [server-pagination.jsx](examples/server-pagination.jsx) | Fetch simulated pages and cancel obsolete queries. |
| [Spring Data adapter](http://localhost:3000/examples/spring-adapter) | [spring-adapter.jsx](examples/spring-adapter.jsx) | Adapt pageable requests and Spring Page responses without a real server. |

### Presentation

| Example | Source | Purpose |
|---|---|---|
| [Application theme](http://localhost:3000/examples/parent-theme) | [parent-theme.jsx](examples/parent-theme.jsx) | Application typography and explicit component overrides are retained alongside the table palette. |
| [Built-in theme selector](http://localhost:3000/examples/themes) | [themes.jsx](examples/themes.jsx) | Choose one of the library themes. |
| [Density toggle](http://localhost:3000/examples/density) | [density.jsx](examples/density.jsx) | Use the density icon to switch row padding. |
| [Fullscreen toggle](http://localhost:3000/examples/fullscreen) | [fullscreen.jsx](examples/fullscreen.jsx) | Enter and exit browser fullscreen. Unsupported browsers show feedback. |
| [Header tooltips](http://localhost:3000/examples/header-tooltips) | [header-tooltips.jsx](examples/header-tooltips.jsx) | Open the info buttons for column guidance. |
| [Sticky header and bounded height](http://localhost:3000/examples/sticky-header) | [sticky-header.jsx](examples/sticky-header.jsx) | Scroll the table body while its header stays visible. |

### Feedback

| Example | Source | Purpose |
|---|---|---|
| [Empty state](http://localhost:3000/examples/empty-state) | [empty-state.jsx](examples/empty-state.jsx) | Show a custom message when there are no matching records. |
| [Error state](http://localhost:3000/examples/error-state) | [error-state.jsx](examples/error-state.jsx) | Display an error and suppress stale body rows. |
| [Export failure feedback](http://localhost:3000/examples/export-errors) | [export-errors.jsx](examples/export-errors.jsx) | A simulated resolver failure produces a visible error notification. |
| [Loading state](http://localhost:3000/examples/loading-state) | [loading-state.jsx](examples/loading-state.jsx) | Display progress and mark the table as busy. |

### Extension

| Example | Source | Purpose |
|---|---|---|
| [Custom toolbar](http://localhost:3000/examples/custom-toolbar) | [custom-toolbar.jsx](examples/custom-toolbar.jsx) | Add a query reset button and matching-row counter. |
| [Pure row model](http://localhost:3000/examples/pure-row-model) | [pure-row-model.jsx](examples/pure-row-model.jsx) | Filter, sort and page outside the table component. |
| [Reusable state hook](http://localhost:3000/examples/headless-hook) | [headless-hook.jsx](examples/headless-hook.jsx) | Use useTableModel with application-owned rendering. |
| [Standalone Blob builders](http://localhost:3000/examples/blob-builders) | [blob-builders.jsx](examples/blob-builders.jsx) | Generate XLSX/PDF blobs separately from downloading. |
| [Standalone serializers](http://localhost:3000/examples/serialization) | [serialization.jsx](examples/serialization.jsx) | Inspect CSV, TXT and JSON without creating a download. |

## Adding another example

1. Add an independent client component under `examples/` using the public package import.
2. Add its unique slug, title, group and description to `examples/catalog.js`.
3. Import and register the component in `examples/registry.jsx`.
4. Run `npm run check` from the repository root. The catalog test checks route/component coverage and renders every entry.
5. Update this catalog and build the Next demo. Routes are generated from the catalog; source panels read only registered filenames.

Keep each example focused. Shared data and mock transport can be reused, while the feature-defining configuration should remain visible in the individual file.

## Hardening examples

- [Controlled query state](examples/controlled-query.jsx) — `/examples/controlled-query`
- [Controlled selection](examples/controlled-selection.jsx) — `/examples/controlled-selection`
- [Component slots](examples/component-slots.jsx) — `/examples/component-slots`
- [Localized labels](examples/localization.jsx) — `/examples/localization`
- [Endpoint handler without row fetching](examples/endpoint-handler.jsx) — `/examples/endpoint-handler`

## Generic bulk actions and layout

- [Generic bulk remove/email actions](examples/bulk-actions.jsx) — `/examples/bulk-actions`
- [Selection first](examples/selection-first.jsx) — `/examples/selection-first`
- [Selection last](examples/selection-last.jsx) — `/examples/selection-last`
- [Selection at a numeric position](examples/selection-position.jsx) — `/examples/selection-position`
- [Toolbar left](examples/toolbar-left.jsx) — `/examples/toolbar-left`
- [Toolbar right](examples/toolbar-right.jsx) — `/examples/toolbar-right`
- [Split toolbar](examples/toolbar-split.jsx) — `/examples/toolbar-split`

| [Column reordering](http://localhost:3000/examples/column-reordering) | [column-reordering.jsx](examples/column-reordering.jsx) | Move columns by drag/drop, keyboard or menu; utility columns retain their positions. |
| [Column resizing](http://localhost:3000/examples/column-resizing) | [column-resizing.jsx](examples/column-resizing.jsx) | Resize columns with pointer or keyboard controls and per-column width limits. |
| [Controlled column layout](http://localhost:3000/examples/controlled-column-layout) | [controlled-column-layout.jsx](examples/controlled-column-layout.jsx) | Control order and pixel widths in the parent, lock a column and reset the layout. |
