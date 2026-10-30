# @company/mui-data-table

A modular JavaScript React table built with Material UI, with local or caller-managed server data and no TanStack dependency. This README documents the **current public API exported by `src/index.js`**. Internal components and utilities are implementation details.

## Contents

- [Setup and quick start](#setup-and-quick-start)
- [Individual examples](#individual-examples)
- [Public exports](#public-exports)
- [DynamicTable parameters](#dynamictable-parameters)
- [Column parameters](#column-parameters)
- [Callback parameters and row actions](#callback-parameters-and-row-actions)
- [State hook: useTableModel](#state-hook-usetablemodel)
- [Row and column functions](#row-and-column-functions)
- [Export functions and parameters](#export-functions-and-parameters)
- [Spring Data functions and parameters](#spring-data-functions-and-parameters)
- [Behavior, validation and migration](#behavior-validation-and-migration)

## Setup and quick start

For development in this repository:

```sh
npm install
npm run check
```

Use the Node version in `.nvmrc`, or one allowed by `engines`: `^22.22.2 || ^24.15.0 || >=26.0.0`.

Consumers install this package and satisfy its peer dependencies:

| Peer | Declared range |
|---|---|
| `react`, `react-dom` | `^18.2.0` or `^19.0.0` |
| `@mui/material`, `@mui/icons-material` | `^9.5.0` |
| `@emotion/react` | `^11.14.0` |
| `@emotion/styled` | `^11.14.1` |

The package provides ES module imports and declaration files for root and helper subpaths. Its root entry has a `'use client'` directive for Next.js integration. Place interactive table usage in a client component. TypeScript declarations are included. Use `@company/mui-data-table/core`, `/spring`, or `/exports` for independent helper imports; these entries have no client directive. Only browser-download functions in `/exports` require DOM APIs. XLSX and PDF engines load when those formats are requested. Declared peer ranges do not mean every version combination has been tested.

```jsx
'use client';

import { Button } from '@mui/material';
import { DynamicTable } from '@company/mui-data-table';

const customers = [
  { id: 'ada', name: 'Ada', status: 'Active', amount: 125.5 },
  { id: 'grace', name: 'Grace', status: 'Pending', amount: 250 }
];
const headers = [
  { field: 'name', label: 'Customer' },
  { field: 'status', label: 'Status' },
  { field: 'amount', label: 'Amount', align: 'right',
    renderCell: ({ value }) => `$${value.toFixed(2)}` }
];

export default function Customers() {
  return <DynamicTable
    headers={headers}
    data={customers}
    getRowId={row => row.id}
    pageTitle="Customers"
    searchByText
    enableColumnFilters
    enableMultiColumnSort
    enableExport
    renderRowActions={({ row }) => (
      <Button onClick={() => console.log('View', row)}>View</Button>
    )}
  />;
}
```

## Individual examples

The [example catalog](examples/nextjs-demo/README.md) contains **66 standalone examples**, each with its own source file, route, description and expandable source view. Remote examples use a simulated backend; email examples only preview recipients.

```sh
npm run build
npm install --prefix examples/nextjs-demo
npm run dev --prefix examples/nextjs-demo
```

Open [the local catalog](http://localhost:3000). Validate its production build with `npm run build --prefix examples/nextjs-demo`.

## Public exports

All imports below use `@company/mui-data-table`; there is no default package export.

| Category | Named exports |
|---|---|
| React component | `DynamicTable` |
| React state hook | `useTableModel`, `createTableState` |
| Pure row processing | `buildRowModel` |
| Column helpers | `normalizeColumns`, `getColumnValue`, `getColumnText`, `headersToExportColumns` |
| Export projection | `getExportData` |
| String serializers | `rowsToCsv`, `rowsToTxt`, `rowsToJson` |
| Browser file exports | `exportRowsAsCsv`, `exportRowsAsTxt`, `exportRowsAsJson`, `exportRowsAsXlsx`, `exportRowsAsPdf` |
| Blob builders | `createXlsxBlob`, `createPdfBlob` |
| Download/endpoint helpers | `downloadBlob`, `exportWithEndpoint` |
| Handler map | `defaultExportHandlers` |
| Spring Data adapters | `createSpringDataSource`, `normalizeSpringPage`, `toSpringRequest`, `fetchAllSpringRows` |

## DynamicTable parameters

`DynamicTable(props)` renders a React element. Defaults below apply when a parameter is omitted or `undefined`; pass the documented types rather than `null` unless explicitly supported.

### Data and identity

| Parameter | Type | Default | Behavior |
|---|---|---|---|
| `headers` | `Column[]` | `[]` | Column definitions, normalized and validated by the component. See [column parameters](#column-parameters). |
| `data` | `object[]` | `[]` | All local rows, or only the loaded server page. Must be an array. |
| `getRowId` | `(row) => string or number` | unset | Return a unique, stable ID. Used for React keys, renderer context and email selection. |
| `uniqueField` | `string` | `''` | Dot path for identity when `getRowId` is absent. Empty means use `id`. |
| `pageTitle` | `string` | `''` | Visible title, default accessible name and export filename/title source. |
| `aria-label` | `string` | `pageTitle` or `'Data table'` | Accessible table name; does not replace the visible title. |

Interactive rows (email selection, action controls, or custom cells) require a unique, stable string or finite numeric ID via `getRowId`, `uniqueField`, or `id`. Duplicate IDs are rejected. Noninteractive rows may fall back to their original input index. A supplied `getRowId` must return valid IDs even for noninteractive rows.

### Search, filters, sorting and pagination

| Parameter | Type | Default | Behavior |
|---|---|---|---|
| `searchByText` | `boolean` | `false` | Show the toggleable search control. Search is trimmed, case-insensitive substring matching. Closing search clears its query. |
| `enableSearch` | `boolean` | `false` | Alias that also enables search; either search flag enables the control. |
| `enableColumnFilters` | `boolean` | `false` | Show inline text inputs for filterable columns. Nonempty filters combine with AND. |
| `orderBy` | `string` | `''` | Initial single-sort field. An empty field initializes without sorting. |
| `order` | `'asc'` or `'desc'` | `'asc'` | Initial direction for `orderBy`. |
| `enableMultiColumnSort` | `boolean` | `false` | Show the priority-sort menu. Each column cycles ascending → descending → removed. |
| `initialRowsPerPage` | `integer` | `5` | Initial page size; positive integers or `-1` for All. |
| `currentPage` | `integer` | internal page, initially `0` | Optional controlled, zero-based page. |
| `rowsPerPageOptions` | `Array<number or {value, label}>` | `[5, 10, 20, 30, {value: -1, label: 'All'}]` | Available sizes. The current size is added if missing. Use positive sizes and optionally `-1`. |
| `serverSidePagination` | `boolean` | `false` | Skip local searching, filtering, sorting and paging; render supplied rows directly. |
| `totalCount` | `integer` | server: `data.length`; local: derived | Total matching server rows. Must be nonnegative if supplied. Does not override local counts. |
| `onPageChangeRequest` | `(query) => void` | unset | Server-mode query notification on page/size/search/filter/sort updates. See [query shape](#query-shape). |

`orderBy`, `order` and `initialRowsPerPage` initialize legacy state; native `initialState` takes precedence and native `state` controls its supplied slices. Legacy defaults initialize uncontrolled slices. Changing these legacy initial props later does not control state. Search/filter/sort/size changes reset the page unless an explicit page is included in a hook update. Header clicks replace the sort list with one column and alternate ascending/descending. Use the multi-sort menu to retain multiple priority columns.

When `currentPage` is supplied, the parent must apply page changes. Native `state.page` takes precedence over this legacy alias. Use `onStateChange` to observe proposals in both modes; `onPageChangeRequest` remains a server-only compatibility callback. See the [controlled-page example](examples/nextjs-demo/examples/controlled-page.jsx).

### Controlled query state

| Parameter | Type | Default | Meaning |
|---|---|---|---|
| `state` | `Partial<TableState>` | unset | Supplied keys are parent-controlled; absent keys remain internal. |
| `initialState` | `Partial<TableState>` | defaults below | Initial uncontrolled state; takes precedence over legacy initial props. Changes after mount are ignored. |
| `onStateChange` | `(next, event) => void` | unset | Proposed query state after a meaningful user action, in client or server mode. |
| `onQueryChange` | `(next, event) => void` | unset | Query-only notification in either mode. Use this OR `onStateChange` to start fetching, rather than fetching from both. |

`TableState` contains `page`, `rowsPerPage`, `searchText`, `columnFilters`, and `sorting`. Controlled slices render the parent's value until it accepts a proposal. Keep the set of controlled keys fixed during a mount; remount to change ownership. The hook composes batched proposals without invoking callbacks from React state updater functions or effects. Mounts, prop updates, and no-op transitions do not emit events. A patch containing query criteria still requests a page reset unless page is explicitly supplied.

```jsx
const [state, setState] = useState(() => createTableState({ rowsPerPage: 10 }));
<DynamicTable headers={headers} data={customers} state={state} onStateChange={setState} />
// Parent-driven reset, including search/filter/sort/page:
// setState(createTableState({ rowsPerPage: 10 }));
```

`event` is `{ type, changedKeys, previousState }`. `type` is the changed state key when exactly one key changed, otherwise `'query'`. `changedKeys` includes effective page resets. Multiple callbacks can observe the same action, but only one should own the remote request. None of these state APIs includes selection or presentation settings.

### Caller-defined and descriptor actions

| Parameter | Type | Default | Behavior |
|---|---|---|---|
| `renderRowActions` | `(context) => ReactNode` | unset | Render caller-owned buttons/menus per row. Overrides descriptor and legacy action rendering. |
| `enableRowActions` | `boolean` | automatic | Only `false` suppresses the dedicated column. Otherwise it appears when a renderer or enabled action exists; `true` alone does not create it. |
| `actionsColumnLabel` | `ReactNode` | `'Actions'` | Header for the dedicated actions column. |
| `actions` | `Action[]` | `[]` | Additional action descriptors, appended to enabled legacy actions. See [descriptor parameters](#action-descriptor-parameters). |
| `showActionIcons` | `boolean` | `false` | Use an icon button when a descriptor has an icon; otherwise use its text button. Does not affect caller-rendered JSX. |
| `actionVisibilityRules` | `Record<string, (row) => boolean>` | `{}` | Extra visibility checks keyed by action ID. Does not affect caller-rendered JSX. |

### Legacy action parameters

These remain available for existing callers. Each enabled action receives the original row object and is disabled if its callback is absent. Custom renderers take precedence over all these flags.

| Enable flag (default `false`) | Callback `(row) => void` | Action ID | Label |
|---|---|---|---|
| `enableView` | `onView` | `'view'` | `'View'` |
| `enableEdit` | `onEdit` | `'edit'` | `editLabel`, default `'Edit'` |
| `enableDelete` | `onDelete` | `'delete'` | `deleteLabel`, default `'Delete'` |
| `enableClone` | `onClone` | `'clone'` | `'Clone'` |
| `enableReportLink` | `onReportLink` | `'report'` | `'Report'` |

`editLabel` and `deleteLabel` are optional strings. The table does not implement deletion, cloning, navigation, confirmation or asynchronous pending state for these callbacks; applications own those operations.

### Email selection

| Parameter | Type | Default | Behavior |
|---|---|---|---|
| `enableEmail` | `boolean` | `false` | Add row/header checkboxes and the Send email button. |
| `onEmail` | `(rows: object[]) => void` | unset | Receive selected matching rows; if none are selected among matching rows, receive all matching loaded rows. |

The header checkbox covers all matching local rows, across client pages, or only the loaded rows in server mode. By default selection resets when the `data` array reference changes. Opt into dataset-based retention with `selectionReset`. Controlled selection is always owned by the parent. The button is disabled without `onEmail`, during loading, or on error. The table does not send email.

### Selection ownership

| Parameter | Type | Default | Meaning |
|---|---|---|---|
| `enableRowSelection` | `boolean` | `false` | General row-selection checkboxes, independent of email. |
| `selectionColumnPosition` | `'first'`, `'last'` or integer | `'first'` | Insert checkboxes at the first/last column or a zero-based position, including the optional row-action column. Header/body order stays aligned. |
| `selectionColumnLabel` | `ReactNode` | `'Selection'` or legacy `'Email'` | Header for the selection column. |
| `selectedRowIds` | `Array<string or number>` | internal | Controlled IDs; the parent accepts updates. |
| `initialSelectedRowIds` | ID array | `[]` | Initial uncontrolled IDs. |
| `onSelectionChange` | `(ids) => void` | unset | Proposed ID array after a checkbox action. Does not trigger query callbacks. |
| `selectionReset` | `'data'` or `'dataset'` | `'data'` | Reset on a new data reference, or retain across refreshes until dataset key changes. |
| `datasetKey` | `string or number` | unset | Identity of the dataset for uncontrolled reset behavior. A changed key clears uncontrolled selection. Parents must clear controlled IDs themselves. |
| `selectionScope` | `'page'` or `'filtered'` | `'filtered'` | Rows affected by the header checkbox. Server scope is always limited to supplied rows. Existing IDs outside the scope are retained. |

Checkboxes now appear first by default, including in legacy email mode. Set `selectionColumnPosition="last"` to restore the earlier placement. Numeric positions must be within `0..headers.length + Number(hasRowActions)`; invalid positions throw. Positioning does not pin the checkbox column.

General checkboxes are enabled through `enableRowSelection`. Legacy `enableEmail` also enables checkboxes; use both to add email delivery integration to general selection. Selected IDs are available through `onSelectionChange`. Bulk email receives only matching loaded row objects, not unseen IDs.

### Generic bulk actions

| Parameter | Type | Default | Meaning |
|---|---|---|---|
| `renderBulkActions` | `(context) => ReactNode` | unset | Caller-owned bulk buttons or menus. Combine with `enableRowSelection`. Replaces the legacy email button when supplied. |

No remove/delete/email behavior is hardcoded into the generic renderer. The application owns its operation, authorization, confirmation, pending state and errors. Return `null` to hide actions. The renderer is invoked even with no selection so it can show disabled controls.

| Context field | Type | Meaning |
|---|---|---|
| `selectedRowIds` | ID array | Every selected ID, including hidden/filtered and retained remote-page selections. |
| `selectedRows` | row array | Selected rows present anywhere in the current `data` array, even if hidden by local filters. This is not an all-server-results fetch. |
| `selectedCount` | number | Number of selected IDs; may exceed `selectedRows.length` in server mode. |
| `unloadedSelectedRowIds` | ID array | Selected IDs absent from the loaded `data` array. Useful when a handler requires row objects rather than IDs. |
| `clearSelection()` | function | Clear internal selection, or propose `[]` through `onSelectionChange` in controlled mode. |
| `disabled` | boolean | Table is loading or errored; application buttons should honor this and their own pending state. |
| `state` | `TableState` | Current query state for application-owned handlers. |

```jsx
<DynamicTable
  headers={headers}
  data={customers}
  getRowId={row => row.id}
  enableRowSelection
  selectionColumnPosition="first"
  renderBulkActions={({ selectedRowIds, selectedRows, selectedCount, clearSelection, disabled }) => (
    <Stack direction="row" spacing={1}>
      <Button disabled={disabled || selectedCount === 0} onClick={async () => {
        await removeCustomers(selectedRowIds);
        clearSelection();
      }}>Remove selected</Button>
      <Button disabled={disabled || selectedCount === 0}
        onClick={() => previewEmail(selectedRows)}>Email selected</Button>
    </Stack>
  )}
/>
```

The consuming component supplies MUI `Button`/`Stack`, rows and handlers; its handlers own error handling and pending state. Clear selection after a successful operation. Do not treat unloaded IDs as loaded records. The [bulk-actions example](examples/nextjs-demo/examples/bulk-actions.jsx) operates on synthetic local data and previews email without sending it.

Legacy `enableEmail`/`onEmail` continue to work when no `renderBulkActions` is provided. Legacy no-selection email behavior remains all matching loaded rows; generic actions have no such automatic fallback.

### Toolbar placement

| Parameter | Type | Default | Meaning |
|---|---|---|---|
| `toolbarAlignment` | `'left'` or `'right'` | `'left'` | Default side for all enabled toolbar controls, including bulk and custom content. |
| `toolbarPositions` | `Partial<Record<control, 'left' or 'right'>>` | `{}` | Per-control overrides of the default side. Unknown controls or unsupported positions throw. |

Control keys are `search`, `density`, `sort`, `export`, `themes`, `fullscreen`, `bulkActions`, and `custom` (the `renderToolbar` result). Email's compatibility button belongs to `bulkActions`. The title remains at the beginning without forcing controls to the opposite side. Left controls precede right controls in DOM/keyboard order; their existing relative order is retained within each side. Sides follow the layout's reading direction in RTL themes.

```jsx
<DynamicTable headers={headers} data={customers} searchByText enableExport enableThemes
  toolbarAlignment="left"
  toolbarPositions={{ export: 'right', themes: 'right', bulkActions: 'right' }}
/>
```

Changing alignment retains control instances: search input state and active export jobs are preserved. Custom toolbar slots must retain the supplied children and their flex layout to use built-in positioning. `renderToolbar` also receives the generic context as `context.selection`; its original `context.selectedRows` still means selected *matching* rows for compatibility.

### Export controls

| Parameter | Type | Default | Behavior |
|---|---|---|---|
| `enableExport` | `boolean` | `false` | Show the export menu. Disabled during loading/error and while an export runs. |
| `exportOptions` | `{csv?, txt?, xlsx?, pdf?, json?}` | CSV/TXT/XLSX/PDF on; JSON off | Boolean flags for each menu format. Omitted flags retain their defaults. |
| `exportHandlers` | `Record<format, ExportHandler>` | built-in handlers | Override individual format handlers. Keys: `csv`, `txt`, `xlsx`, `pdf`, `json`. |
| `fetchAllForExport` | `(query, job) => object[] or Promise<object[]>` | unset | Full matching-row resolver when server `totalCount` exceeds the loaded-row count. |

The menu exports matching, sorted rows across all client pages. It ignores email selection. A partial server dataset requires `fetchAllForExport`; a missing resolver or rejected export produces an error snackbar. The resolver runs before row-based format handlers. Endpoint handlers skip it. See [export callback shapes](#export-callback-shapes).

### Presentation and feedback

| Parameter | Type | Default | Behavior |
|---|---|---|---|
| `loading` | `boolean` | `false` | Show progress and set `aria-busy`. Supplied rows can remain visible; loading does not start a fetch. |
| `error` | `Error or string` | unset | A truthy error displays an alert and suppresses body data rows. |
| `emptyDataMessage` | `ReactNode` | `'No matching records.'` | Empty-state content when not loading or errored. |
| `stickyHeader` | `boolean` | `false` | Make headers sticky within the scrolling table container. |
| `maxHeight` | `number or CSS string` | unset | Maximum scrolling body-container height. |
| `enableDensePadding` | `boolean` | `false` | Show a density toggle; initial row size is medium. |
| `enableFullScreenOption` | `boolean` | `false` | Show browser fullscreen controls. Unsupported/rejected fullscreen shows feedback. |
| `enableThemes` | `boolean` | `false` | Show the library theme selector: `default`, `grey`, `blue`, `light`, `dark`; initial selection is `default`, the original green palette (`#008000`). The table uses green even when the selector is hidden. Headers follow each selected palette and use its contrasting text color. Grey/Blue also tint the table surface; Light uses light blue accents and Dark uses the MUI dark palette. Presets apply to this table and retain application typography and component overrides. Explicit overrides may take precedence over preset colors. |
| `tooltipFields` | `Record<field, string[]>` | no tooltips | Header information buttons; array items are joined with commas. |
| `renderToolbar` | `(context) => ReactNode` | unset | Append controls/content to the existing toolbar. Does not replace the default toolbar. |

Unknown props are not automatically forwarded to MUI components. Use the explicit `slots`, `slotProps` and `labels` contracts below. Pagination remains visible for empty and nonempty results.

### Component slots and localization

| Parameter | Type | Default | Meaning |
|---|---|---|---|
| `slots` | object of React element/component types | native wrappers | Override `root`, `table`, `toolbar`, `header`, `body`, `row`, `cell`, `actionCell`, or `footer`. |
| `slotProps` | object keyed by slot name | `{}` | Additional wrapper props. Managed table/query values retain precedence. Root/toolbar `sx` is composed with defaults. |
| `labels` | `Partial<TableLabels>` | English defaults | Override UI strings and formatters listed below. |

Slots must forward provided children, props and refs where applicable and preserve native table semantics. Header/body/row/cell slots replace wrappers around the working controls. Footer receives `count`, `page`, `rowsPerPage`, change callbacks, size options and labels. Action cells are separate from data cells. `renderToolbar` still appends content; the toolbar slot controls its wrapper.

String labels: `selection`, `selectAllRows`, `table`, `empty`, `actions`, `email`, `sendEmail`, `selectAllEmails`, `search`, `openSearch`, `closeSearch`, `densePadding`, `fullscreen`, `loading`, `sortMenu`, `clearSorting`, `themeSelector`, `rowsPerPage`, `firstPage`, `previousPage`, `nextPage`, `lastPage`, `exportMenu`, `exporting`, `cancelExport`.

Formatter labels: `selectRow(index)`, `selectEmailRow(index)`, `filter(columnLabel)`, `about(columnLabel)`, `sortSummary(sorting)`, `displayedRows({from,to,count})`, `exportProgress({loaded,total})`. Labels cover built-in control names; column labels, action labels, format names, preset names and application error messages remain application content. Translate size-option text such as All via `rowsPerPageOptions`.

## Column parameters

`headers` is an array of these descriptors. `DynamicTable` normalizes them automatically. Use `normalizeColumns` yourself before passing ID-only definitions to the lower-level helpers.

| Parameter | Type | Default | Behavior |
|---|---|---|---|
| `field` | `string` | `id` | Unique, nonempty column identity and dot-path accessor. Takes precedence over `id`. Required unless `id` is supplied. |
| `id` | `string` | unset | Identity/accessor alias used when `field` is nullish. |
| `label` | `string` recommended | resolved `field` | Visible header text; also used in export headers and filter labels. |
| `type` | `'display'` or omitted | data column | Display columns render controls but are excluded from query processing and exports. |
| `fields` | `string[]` | unset | For a nonempty array, read/format each dot path and combine them. |
| `separator` | `string` | `''` | Join composite `fields`. |
| `suffix` | `string` | `''` | Append after composite or single-column text. |
| `valueGetter` | `(row) => value` | dot-path/composite accessor | Override the accessed value. Takes precedence over `fields`. |
| `dataType` | `'auto'`, `'number'`, `'string'`, `'boolean'`, `'date'` | `'auto'` | Comparison policy; typed invalid values share the null bucket. |
| `nulls` | `'first'` or `'last'` | `'last'` | Position invalid/nullish values independently of ascending/descending direction. |
| `locale` | `string or string[]` | runtime locale | Locale for default text comparison. |
| `dateFormat` | `string` | `'MM/dd/yyyy'` | Format Date/recognized ISO date values. Uses date-fns-style tokens; `YYYY`/`DD` are normalized to `yyyy`/`dd`. |
| `renderCell` | `({row, value, rowIndex, rowId}) => ReactNode` | formatted accessor text | Change cell presentation only. |
| `sortable` | `boolean` | `true` | Allow header/menu sorting and local comparator processing. |
| `searchable` | `boolean` | `true` | Include this column's text in global search. |
| `filterable` | `boolean` | `true` | Allow its filter input and local column filtering. |
| `sortComparator` | `(a, b) => number` | built-in comparison | Compare two accessed values, not row wrappers; negative/zero/positive for ascending order. The engine applies direction. |
| `filterFn` | `(value, filter, row) => boolean` | case-insensitive substring | Replace local matching for a nonempty filter. Built-in UI supplies string filters. |
| `enableExport` | `boolean` | `true` | Include the column in every built-in export format. |
| `exportValue` | `(row, index) => value` | `getColumnValue(row, column)` | Export-specific value, independent of rendered React nodes. `index` is within the exported row collection. |
| `width` | `number or CSS width string` | unset | Header-cell width; numeric values use pixels. |
| `align` | `'left'`, `'center'`, `'right'`, `'justify'` or `'inherit'` | MUI default | Header/body alignment. |

Column identities must be unique after resolving `field ?? id`. A display column forcibly disables `sortable`, `searchable`, `filterable` and `enableExport` even if those flags are supplied as `true`; its `valueGetter` is not used. Use `renderCell` for its content.

Default sorting uses a deterministic type order (numbers, booleans, valid dates, text, other stringified values) and a separate null bucket. Numeric strings compare numerically in auto mode; empty strings and booleans are not coerced to numbers. Custom comparators own their value/null policy and return ascending comparison results.

Default local search uses OR across searchable data columns. Column filters use AND and combine with search. Nullish/empty-string filters are inactive. Composite-column sorting uses its composed text; single-column sorting uses the raw accessed value. Keep each column's value types consistent or provide a comparator.

```jsx
const headers = [
  { field: 'fullName', label: 'Name', fields: ['firstName', 'lastName'], separator: ' ' },
  { field: 'profile.city', label: 'City', searchable: false },
  { field: 'score', label: 'Minimum score',
    filterFn: (value, filter) => value >= Number(filter) },
  { id: 'controls', label: 'Actions', type: 'display',
    renderCell: ({ row }) => <Button onClick={() => openCustomer(row)}>View</Button> }
];
```

The last snippet assumes `Button` and `openCustomer` are supplied by the consuming component.

## Callback parameters and row actions

### Row renderer context

`renderRowActions` receives `{ row, rowIndex, rowId }`. `renderCell` receives the same properties plus `value`.

| Property | Meaning |
|---|---|
| `row` | Original input object, without a table-engine wrapper. |
| `rowIndex` | Zero-based position in the displayed page; changes after sorting/paging. |
| `rowId` | `getRowId(row)`, or the configured identity path, or original-input-index fallback for noninteractive rows. |
| `value` | Accessed column value; present only for cell rendering. Undefined for display columns. |

Return `null`/`false` from a row-action renderer when no actions apply; the empty cell remains for alignment. Keep hooks in a child component returned by the renderer rather than calling hooks inside the callback itself.

```jsx
<DynamicTable
  headers={headers}
  data={customers}
  getRowId={row => row.id}
  actionsColumnLabel="Manage"
  renderRowActions={({ row, rowId }) => (
    <Button disabled={savingId === rowId} onClick={() => editCustomer(row)}>
      Edit {row.name}
    </Button>
  )}
/>
```

The consuming component supplies `headers`, `customers`, `Button`, `savingId` and `editCustomer`. Use caller-owned menus, permissions, error and pending state as needed.

### Action descriptor parameters

`actions` is an array, not a row-to-actions factory. For dynamic per-row JSX use `renderRowActions`.

| Parameter | Type | Default | Meaning |
|---|---|---|---|
| `id` | `string` | required | Unique among enabled legacy and custom actions; used as the React key and visibility-rule key. |
| `label` | `string` | required | Button text, or icon button's accessible name/tooltip. |
| `onClick` | `(row) => void` | unset | Click callback; absence disables the action. Returned promises are not awaited by the descriptor renderer. |
| `icon` | React component type | unset | Icon component, such as an MUI icon; used only with `showActionIcons`. |
| `visible` | `(row) => boolean` | show | Per-row visibility predicate. |
| `disabled` | `boolean or (row) => boolean` | enabled if callback exists | Per-row disabled rule. |

`visible(row)` and `actionVisibilityRules[id](row)` must both permit an action. These rules do not constrain a custom `renderRowActions` callback.

### Query shape

`onPageChangeRequest(query)` receives this object in server mode:

```js
{
  page: 0,
  rowsPerPage: 10,
  searchText: '',
  columnFilters: { status: 'Active' },
  sorting: [{ field: 'name', order: 'asc' }],
  sortBy: 'name',
  sortDir: 'asc',
  selectedColumns: [{ field: 'name', order: 'asc' }]
}
```

`page` is zero-based. `sorting` is ordered by priority. `sortBy`/`sortDir` mirror its first entry, defaulting to `''`/`'asc'`. `selectedColumns` is a compatibility alias of `sorting`. `columnFilters` maps resolved field names to values; built-in inputs produce strings.

The callback is not called on mount. The caller performs initial fetching and subsequent requests. It owns authentication, cancellation, stale responses, debouncing, retries and server page recovery. Updating controlled `currentPage` alone does not notify the callback.

### Toolbar context

`renderToolbar(context)` receives all fields returned by `useTableModel`, plus `selectedRows` and `selection` (the full generic bulk-action context). Thus it includes `page`, `rowsPerPage`, `searchText`, `columnFilters`, `sorting`, `rows`, `filteredRows`, `count`, `update` and `selectedRows`. The context also includes native `state`. The selection array contains selected matching loaded rows, and can be empty even when email's no-selection behavior would use all matching rows.

### Export callback shapes

`fetchAllForExport(query, job)` receives:

```js
{
  orderBy: 'name',
  order: 'asc',
  selectedColumns: [{ field: 'name', order: 'asc' }],
  searchText: '',
  columnFilters: { status: 'Active' }
}
```

It must return an array or a promise resolving to an array. It receives no pagination in query. Its second argument is `{ signal, onProgress }`, where progress accepts `{ loaded, total }`. Forward these to the source/helper; cancellation is checked before invoking the format handler. It is invoked only when server `totalCount` exceeds the loaded row count. Preserve sort/filter criteria when resolving all rows.

`exportHandlers[format](context)` receives:

```js
{
  rows: [],               // resolved matching rows
  columns: [],            // standalone export descriptors, adapted from headers
  title: 'Customers',
  filename: 'Customers_MMDDYYYYHHMMSS.csv', // actual UTC timestamp replaces the pattern
  state: {
    page: 0,
    rowsPerPage: 10,
    sorting: [],
    searchText: '',
    columnFilters: {}
  }
}
```

Return `void` or `Promise<void>`; rejection/throwing produces an error snackbar. Filenames use the sanitized `pageTitle` (or `table`) plus a UTC timestamp and extension. The menu locks until resolution and handler completion and displays Cancel export. Cancellation/unmount aborts the job, suppresses stale completion and prevents built-in downloads. Synchronous serialization cannot be interrupted mid-task; application handlers must observe the provided signal before their own side effects. It does not interpret a handler's `false` return as cancellation; a custom handler can simply omit downloading.

Export handler context also contains `signal` and `onProgress`. Existing handler functions remain row-based. To bypass row fetching, supply an endpoint descriptor:

```jsx
exportHandlers={{ xlsx: { mode: 'endpoint', handler: ({ state, signal }) =>
  exportWithEndpoint({ url: '/api/customers/export', filename: 'customers.xlsx', method: 'POST', body: state, signal })
} }}
```

An endpoint context has `rows: []`; use its snapshot `state`. A descriptor with `mode: 'rows'` behaves like a plain handler function.

Lifecycle callbacks: `onExportStart(info)`, `onExportComplete({...info, rowCount})`, `onExportError(error, info)`, `onExportCancel(info)`. `info` contains `format`, `filename`, `state`; `rowCount` is undefined for endpoints. Cancellation does not emit an error or completion. Unmount suppresses subsequent callbacks. Lifecycle callbacks should not throw. Dates/objects inside filter state are subject to the immutable-input contract; replace them rather than mutate them while exporting.

## State hook: useTableModel

```js
const model = useTableModel(options);
```

A React hook; call it inside a component/custom hook.

### createTableState(partial = {})

Returns a validated query state with defaults `{ page: 0, rowsPerPage: 5, searchText: '', columnFilters: {}, sorting: [] }`, overridden by a partial object. Rejects unknown keys, unsafe/invalid pagination, non-string search, non-object filters and invalid/duplicate sort descriptors. Use it to initialize or reset controlled state.

### Options

| Parameter | Default | Meaning |
|---|---|---|
| `data` | `[]` | Input row array. |
| `headers` | `[]` | Data/display columns; normalize ID-only definitions before calling. |
| `currentPage` | internal page | Optional controlled page, initially `0` if omitted. |
| `initialRowsPerPage` | `5` | Initial positive size or `-1`. |
| `orderBy` | `''` | Initial sort field. |
| `order` | `'asc'` | Initial sort direction. |
| `serverSidePagination` | `false` | Skip local data processing when true. |
| `totalCount` | unset | Server total; nonnegative integer. |
| `onPageChangeRequest` | unset | Same server query callback as DynamicTable. |
| `state` | unset | Native partial controlled query state. |
| `initialState` | defaults | Native initial uncontrolled query state. |
| `onStateChange`, `onQueryChange` | unset | Query state/event notifications in both modes. |

### Returned model and update parameters

| Property/function | Type | Meaning |
|---|---|---|
| `rows` | `object[]` | Displayed page, or unchanged loaded server rows. |
| `filteredRows` | `object[]` | All filtered **and sorted** client rows; loaded rows in server mode. |
| `count` | `number` | Matching client count or supplied/fallback server total. |
| `page` | `number` | Effective page; locally clamped, unchanged in server mode. |
| `rowsPerPage` | `number` | Current size. |
| `searchText` | `string` | Current global query, initially `''`. |
| `columnFilters` | `object` | Field-to-filter map, initially `{}`. |
| `sorting` | `Array<{field, order}>` | Priority sorts; initially derived from `orderBy`/`order` or `[]`. |
| `state` | `TableState` | Effective query state, including locally clamped page. |
| `update(patch)` | function | Shallow-merge an update to query state. |
| `update(previous => patch)` | function | Derive a shallow patch from the latest state, including earlier batched updates. |

Writable patch keys are `page`, `rowsPerPage`, `searchText`, `columnFilters` and `sorting`. Replace complete maps/arrays when updating nested state. A patch containing search, filters, sorting or size resets the page to `0`, unless it also supplies `page`. Do not mutate `previous` or returned state.

```js
model.update({ searchText: 'Ada' });
model.update(previous => ({
  columnFilters: { ...previous.columnFilters, status: 'Active' }
}));
model.update({ sorting: [{ field: 'score', order: 'desc' }], page: 0 });
```

The hook does not normalize columns, implement email selection, render controls or fetch data. Its page/sizing validation comes from `buildRowModel`.

## Row and column functions

### normalizeColumns(headers = [])

- **Parameter:** an array of column descriptors from [column parameters](#column-parameters).
- **Returns:** a new descriptor array resolving `field ?? id`, defaulting `label` to the field and disabling data capabilities on display columns. Input descriptors are not mutated.
- **Throws:** `TypeError` for a non-array; `Error` for missing, blank or duplicate resolved identities.

### getColumnValue(row, column)

- **Parameters:** the original row and a normalized column descriptor.
- **Returns:** `undefined` for a display column; otherwise `valueGetter(row)`, or composed `fields` text, or the value at `column.field`.
- Composite values format each field with `dateFormat`, join using `separator` and append `suffix`.

### getColumnText(row, column)

- **Parameters:** the original row and a normalized column descriptor.
- **Returns:** the accessed value formatted as a string, including date formatting and the configured suffix. Nullish values format as empty text before a suffix. Does not execute `renderCell`.
- Composite values already include their suffix; it is not appended again.

### headersToExportColumns(headers)

- **Parameter:** normalized UI columns.
- **Returns:** standalone descriptors containing `id`, `header`, `enableExport` and `exportValue`. The fallback export value uses `getColumnValue`; display columns are excluded.
- This adapter now preserves raw numbers, booleans and Date objects. To export display formatting, supply `exportValue: row => getColumnText(row, normalizedColumn)`. Composite values remain composed text. This is a deliberate migration change.

```js
const columns = headersToExportColumns(normalizeColumns(headers));
```

### buildRowModel(options)

Pure processing without React or browser APIs. Does not mutate the input array.

| Option | Type | Default | Meaning |
|---|---|---|---|
| `data` | `object[]` | `[]` | Input rows. |
| `headers` | `Column[]` | `[]` | Normalized columns. |
| `searchText` | `string` | `''` | Global search. |
| `columnFilters` | `Record<field, value>` | `{}` | Nonempty filter criteria. |
| `sorting` | `Array<{field, order}>` | `[]` | Priority comparisons; unknown/non-sortable fields are ignored. |
| `page` | `integer` | `0` | Nonnegative page index. |
| `rowsPerPage` | `integer` | `5` | Positive size or `-1` for All. |
| `serverSide` | `boolean` | `false` | Note the name differs from the component/hook's `serverSidePagination`. |
| `totalCount` | `integer` | unset | Nonnegative server total; falls back to input length. |

Returns `{ rows, filteredRows, count, page }`, with the meanings described in the hook return table. Local order is search/filter → stable sort → page. In server mode, it preserves the supplied rows and requested page. Throws `TypeError` for non-array data/headers and `RangeError` for invalid page/size/total values. It does not perform `normalizeColumns` validation automatically.

## Export functions and parameters

### Standalone export context

Serializers, file exports and Blob builders use an export schema distinct from UI `headers`:

```js
const context = {
  rows: customers,
  columns: [
    { accessorKey: 'name', header: 'Customer' },
    { id: 'amount', accessorFn: row => row.amount, header: 'Amount' },
    { accessorKey: 'email', enableExport: false }
  ],
  title: 'Customers'
};
```

| Context parameter | Type | Default | Meaning |
|---|---|---|---|
| `rows` | `object[]` | required | Exact rows to project, in their current order. Helpers do not search, sort or paginate. |
| `columns` | `ExportColumn[]` | required | Export schema below. |
| `title` | `string` | unset | Optional PDF heading. Other standalone formats ignore it. |
| `filename` | `string` | per download function | Used only by file-download wrappers. |
| `signal` | `AbortSignal` | unset | Cancellation check before generation/download; async wrappers check again after generation. |

| ExportColumn parameter | Type | Default | Meaning |
|---|---|---|---|
| `accessorKey` | `string` | unset | Dot path to a row value. |
| `accessorFn` | `(row, index) => value` | unset | Computed accessor; takes precedence over `accessorKey`. |
| `exportValue` | `(row, index) => value` | unset | Export override; takes precedence over both accessors. |
| `id` | `string` | accessor key/generated key | JSON object key and fallback header. |
| `header` | `string` | ID/accessor key/empty text | Header label. Non-string values are not rendered as React nodes. |
| `exportHeader` | `value convertible to string` | `header` fallback | Explicit export header override. |
| `enableExport` | `boolean` | `true` | `false` removes this descriptor and any child descriptors. |
| `columns` | `ExportColumn[]` | unset | Recursively flatten a group. Export-schema groups do not imply UI grouped-header support. |

A leaf without `accessorKey`, `accessorFn` or `exportValue` is skipped. Group descriptors are flattened in definition order. Accessor indexes refer to the exported row collection.

### Projection and string serializers

| Function | Parameters | Return value and behavior |
|---|---|---|
| `getExportData({ rows, columns })` | Required export context | `{ headers: string[], keys: string[], values: value[][] }`. One shared projection for all formats. Keys default to ID, accessor key, then `column1`, `column2`, etc. |
| `rowsToCsv(context)` | Export context | CSV string with headers and CRLF records. Escapes quotes/delimiters/newlines and prefixes formula-like text with an apostrophe. Does not add a BOM. |
| `rowsToTxt(context)` | Export context | Tab-separated text with headers and CRLF records; escapes embedded backslashes, tabs and line breaks. |
| `rowsToJson(context)` | Export context | Indented JSON array string. Preserves JSON-compatible types, converts nullish cell values to `null`, and suffixes duplicate keys (`name_2`, etc.). |

Dates become ISO strings in text formats; objects use JSON serialization. Inputs must be serializable: circular objects/BigInt can throw. The string serializers create no download. CSV formula guarding protects formula-like strings, including full-width prefixes/control characters, while retaining numeric negative values as numbers.

### Browser file-download wrappers

| Function | Parameters | Default filename | Return |
|---|---|---|---|
| `exportRowsAsCsv({ filename, ...context })` | Export context plus optional filename | `'table.csv'` | `undefined`; downloads UTF-8 CSV with a BOM. |
| `exportRowsAsTxt({ filename, ...context })` | Same | `'table.txt'` | `undefined`; downloads TXT. |
| `exportRowsAsJson({ filename, ...context })` | Same | `'table.json'` | `undefined`; downloads JSON. |
| `exportRowsAsXlsx({ filename, ...context })` | Same | `'table.xlsx'` | `Promise<void>`; builds and downloads XLSX. |
| `exportRowsAsPdf({ filename, ...context })` | Same | `'table.pdf'` | `Promise<void>`; builds and downloads PDF. |

These wrappers use DOM/URL download APIs. They require a browser environment, propagate failures, and do not show their own snackbar. The table's export menu handles that UI.

### Blob builders, download helper and handler map

| Function/value | Parameters | Returns/behavior |
|---|---|---|
| `createXlsxBlob(context)` | Required rows/columns | `Promise<Blob>` with XLSX MIME type. A `Results` sheet with bold/frozen header and width 24 columns; retains numbers, booleans and Date values when supplied by accessors. |
| `createPdfBlob(context)` | Rows/columns and optional title | `Promise<Blob>` with PDF MIME type. Landscape table, repeating header and optional heading. |
| `downloadBlob(blob, filename)` | Required Blob and filename string | `undefined`. Creates a temporary link/object URL, starts a download, removes the link and schedules URL revocation. Requires browser DOM/URL APIs. |
| `defaultExportHandlers` | Map, not a function | `{csv: exportRowsAsCsv, txt: exportRowsAsTxt, json: exportRowsAsJson, xlsx: exportRowsAsXlsx, pdf: exportRowsAsPdf}`. |

Blob builders do not download automatically. They need Blob support and their respective export engine; PDF generation has a fixed default font rather than an application font-registration API.

### exportWithEndpoint(options)

Downloads the response body as a Blob without projecting rows.

| Parameter | Type | Default | Meaning |
|---|---|---|---|
| `url` | `string` | required | Export endpoint. |
| `filename` | `string` | required | Download filename; response headers are not used to choose it. |
| `fetcher` | fetch-compatible function | global `fetch` | Receives URL and request options. Wrap it to add application authentication/headers. |
| `signal` | `AbortSignal` | unset | Passed through to the fetcher. |
| `method` | `string` | `'GET'` | HTTP method. Use a method accepting a body when supplying one. |
| `body` | JSON-serializable value | unset | If non-nullish, JSON-encoded with `Content-Type: application/json`. |

Returns `Promise<void>`. Requests use `credentials: 'same-origin'`. Non-OK responses throw `Error('Export failed (STATUS)')`; network, abort and download errors propagate. Uses browser APIs to start the final download; it buffers the response Blob, so it is not a zero-memory streaming client.

```js
await exportWithEndpoint({
  url: '/api/customers/export',
  filename: 'customers.xlsx',
  method: 'POST',
  body: { searchText: 'Ada', sorting: [{ field: 'name', order: 'asc' }] },
  signal: controller.signal
});
```

The consuming code supplies `controller` and imports `exportWithEndpoint`.

## Spring Data functions and parameters

### normalizeSpringPage(page)

| Parameter | Type | Default field values |
|---|---|---|
| `page` | Spring Page-like object | Object itself is required. |
| `page.content` | `object[]` | `[]` if nullish |
| `page.totalElements` | `number` | `0` if nullish |
| `page.totalPages` | `number` | `0` if nullish |

Returns `{ rows, rowCount, pageCount }`. Validates that the response is an object, content is an array, and supplied totals are nonnegative safe integers. Missing/nullish fields retain the listed defaults. Invalid shapes throw `TypeError`/`RangeError`. For full exports, nonempty rows require accurate totals; missing totals cannot prove completeness.

### createSpringDataSource(options)

| Factory parameter | Type | Default | Meaning |
|---|---|---|---|
| `url` | `string` | required | Base URL, optionally including existing query parameters/hash. |
| `fetcher` | fetch-compatible function | global `fetch` | Application-supplied fetch implementation; receives `{ signal }`. |
| `params` | `object` | `{}` | Additional query parameters; non-nullish values are stringified. |
| `mapSort` | `(sorting) => string[]` | automatic mapping | Map adapter sort descriptors to repeated backend `sort` query values. |

Returns an async `dataSource(request)` function:

| Request parameter | Type | Default | Meaning |
|---|---|---|---|
| `pagination` | `{pageIndex, pageSize}` | required | Zero-based page index and backend-supported size. |
| `pagination.pageIndex` | `integer` | required | Serialized as `page`. |
| `pagination.pageSize` | `integer` | required | Serialized as `size`; `-1` is rejected. |
| `sorting` | `Array<{id: string, desc: boolean}>` | `[]` | Serialized as repeated `sort=field,asc` / `sort=field,desc`, unless `mapSort` is supplied. |
| `globalFilter` | `string` | `''` | Nonempty search query, serialized as `search`. |
| `columnFilters` | `Array<{id: string, value}>` | `[]` | Non-nullish/nonempty values serialized as `filter.<id>=String(value)`. |
| `signal` | `AbortSignal` | unset | Forwarded to the fetcher. |

Resolves to `{ rows, rowCount, pageCount }` using `normalizeSpringPage`. Page indexes must be nonnegative safe integers and sizes positive safe integers; invalid values fail before fetching. Cancellation is checked before/after the fetch and JSON parsing. Non-OK responses throw `Error('Table request failed (STATUS)')`; fetch/JSON errors propagate. Existing page/size/sort/search values are replaced. Filter parameters for IDs present in `columnFilters` are replaced or cleared; other base-URL filter parameters remain. Pass a cleared filter explicitly or use a clean base URL for dynamic filters. Objects/arrays are stringified rather than encoded as a typed range/filter protocol.

The native adapter request shape differs from the table query. Use `toSpringRequest` to map it, and reuse the same data source for exports:

```jsx
const source = createSpringDataSource({ url: '/api/customers' });

// Inside the consuming component's cancellable request effect:
const result = await source(toSpringRequest(query, { signal: controller.signal }));
// result.rows -> data; result.rowCount -> totalCount

// In the rendered table:
<DynamicTable
  headers={headers}
  data={result.rows}
  totalCount={result.rowCount}
  serverSidePagination
  currentPage={query.page}
  onPageChangeRequest={setQuery}
  enableExport
  fetchAllForExport={exportQuery => fetchAllSpringRows({
    dataSource: source,
    query: exportQuery,
    pageSize: 500,
    maxRows: 10000,
    getRowId: row => row.id
  })}
/>
```

Import `createSpringDataSource`, `toSpringRequest`, `fetchAllSpringRows` and `DynamicTable`. The consuming component supplies its rows/query state, headers and controller. Create/memoize `source` once rather than during every render. The [Spring example](examples/nextjs-demo/examples/spring-adapter.jsx) shows the complete component with mock transport, cancellation, stale-response protection and full-result exports. Core table rendering remains backend-independent; applications choose the transport.

### toSpringRequest(query = {}, options = {})

Maps a DynamicTable query, including `fetchAllForExport` criteria, to the native adapter request.

| Query parameter | Default | Mapping |
|---|---|---|
| `page` | `0` | `pagination.pageIndex`; nonnegative safe integer. |
| `rowsPerPage` | `10` | `pagination.pageSize`, unless overridden by `options.pageSize`. |
| `sorting` | `selectedColumns`, then single-sort fallback, then `[]` | Array of `{field, order}` becomes `{id: field, desc: order === 'desc'}`. An explicit empty array clears sorting. |
| `selectedColumns` | unset | Compatibility sort-array alias when `sorting` is absent. |
| `sortBy` / `orderBy` | unset | Single-sort fallback field; `sortBy` takes precedence when non-nullish. |
| `sortDir` / `order` | `'asc'` | Fallback direction; `sortDir` takes precedence. |
| `searchText` | `''` | `globalFilter`. |
| `columnFilters` | `{}` | Field/value map becomes `[{id, value}]`. |

| Options parameter | Default | Meaning |
|---|---|---|
| `signal` | unset | Copied to the request. |
| `pageSize` | query size or `10` | Positive safe integer; allows a bounded export size even when UI size is `-1`. |

Returns `{ pagination, sorting, globalFilter, columnFilters, signal }`. Throws for invalid page/size or non-array sorting. This maps table queries; do not pass an already-native Spring request to it.

### fetchAllSpringRows(options)

See the [standalone progress/cancel example](examples/nextjs-demo/examples/spring-export.jsx).

Sequentially fetches from page zero until the advertised matching-row total has been received. Uses the same source/filter/sort mapping as page requests and returns one complete array, never an intentionally truncated result.

| Parameter | Type | Default | Meaning |
|---|---|---|---|
| `dataSource` | `(request) => Promise<{rows, rowCount, pageCount?}>` | required | Usually the result of `createSpringDataSource`. Must return normalized pages. |
| `query` | table/export query object | `{}` | Search, filters and sort criteria; its page is ignored. |
| `pageSize` | positive safe integer | `500` | Bounded request size; backend-capped sizes are supported. |
| `maxRows` | positive safe integer | `10000` | Reject a result whose advertised total exceeds this limit. |
| `maxPages` | positive safe integer | `100` | Maximum number of requests; a larger known page count is rejected after the first response. |
| `signal` | `AbortSignal` | unset | Cancellation forwarded to each request and checked between requests/after responses. |
| `getRowId` | `(row) => string or number` | unset | Optional duplicate detection across pages. IDs must be nonempty strings or finite numbers. |
| `onProgress` | `({loaded, total, page, pagesFetched}) => void` | unset | Called synchronously after each accepted page. `page` is zero-based; `pagesFetched` is one-based. |

Returns `Promise<object[]>`. Throws/rejects on invalid limits, missing totals, source errors, cancellation, changed totals/page counts, early empty/exhausted pages, excess rows, or duplicate IDs when identity checking is enabled. A zero-total empty response returns `[]`. Accurate `rowCount` is required; positive `pageCount` metadata is optional but checked when available. This helper buffers the bounded result in memory.

Use a deterministic sort ending in a unique key, or a backend snapshot/export endpoint, for changing datasets. Count/ID checks detect some inconsistencies but cannot guarantee a transactional snapshot. For larger datasets, use a server export endpoint instead of raising browser-memory limits without measurement.

The helper's `signal` and `onProgress` can be forwarded directly from the built-in menu job argument or application-owned controls.

## Behavior, validation and migration

- Keep input rows, headers, maps and arrays immutable. Replace their references when changing values; preserve references between unrelated renders to benefit from memoization.
- Local pages clamp after data shrinks. Server pages retain their requested identity; the caller must recover an out-of-range page and keep rows, count and page consistent.
- Validate pages as nonnegative integers, sizes as positive integers or `-1`, and supplied totals as nonnegative integers. The component also validates unique column identities.
- Date-only `YYYY-MM-DD` values are formatted using local calendar components; timestamp/Date display follows the runtime's local timezone. Invalid or mixed-type values need application-specific handling; this is not a range/date-validation API.
- Legacy action props and `enableSearch` remain supported. New action UI belongs in `renderRowActions` or display columns. Native renderer `row` is the original object, not `{ original: ... }`.
- Internal `RowActions`, export menus, styled components, themes, date/path utilities and pagination controls are not public package exports. Import only the names listed in [public exports](#public-exports).
- The package now exposes controlled query state, declaration files, helper subpaths, selection ownership, export jobs, slots and localization. Column visibility/reordering/resizing, grouped headers, trees, persistence, print controls and virtualization remain future scope. See the [parity plan](docs/mui-datatables-parity-plan.md) and [tablekit review](docs/mui-tablekit-review.md) for proposed work; those are not implemented API parameters.

The default table theme is green (`#008000`), with contrasting header text and alternating row shading. Selecting another theme updates the header, accents, table surface and pagination together. Application typography and component overrides remain effective; explicit header overrides can take precedence over preset colors. Pagination keeps accessible labels and theme-based foreground/background colors.

See the [hardening implementation status](docs/hardening-status.md), [migration notes](CHANGELOG.md) and [production-readiness review](docs/production-readiness-review.md) for current blockers, evidence and release criteria. Passing the existing tests/build is not a production certification.

The implementation separates column access (`src/core/columns.js`), row processing (`src/core/rows.js`), state (`src/hooks/useTableModel.js`), MUI composition (`src/DynamicTable.jsx`), legacy compatibility (`src/compat/legacyActions.jsx`), serialization (`src/exports.js`) and backend adaptation (`src/spring.js`). This repository is a library; the Next.js application is an optional example catalog.
# data-table

## Release qualification

`npm run check` runs lint, strict public type checks, unit/interaction tests and the library build. `npm run test:package` installs a tarball into a fresh temporary consumer and verifies declarations, environment boundaries and helper imports. Build the demo and install Playwright browsers before `npm run test:browser`. `npm run benchmark` prints a synthetic row-model baseline. See [hardening status](docs/hardening-status.md) for CI coverage and remaining release gates, including dependency findings and the license decision.
