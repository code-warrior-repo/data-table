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

The package provides ES module imports. Its entry has a `'use client'` directive for Next.js integration. Place interactive table usage in a client component. XLSX and PDF engines load when those formats are requested. Declared peer ranges do not mean every version combination has been tested.

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

The [example catalog](examples/nextjs-demo/README.md) contains **53 standalone examples**, each with its own source file, route, description and expandable source view. Remote examples use a simulated backend; email examples only preview recipients.

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
| React state hook | `useTableModel` |
| Pure row processing | `buildRowModel` |
| Column helpers | `normalizeColumns`, `getColumnValue`, `getColumnText`, `headersToExportColumns` |
| Export projection | `getExportData` |
| String serializers | `rowsToCsv`, `rowsToTxt`, `rowsToJson` |
| Browser file exports | `exportRowsAsCsv`, `exportRowsAsTxt`, `exportRowsAsJson`, `exportRowsAsXlsx`, `exportRowsAsPdf` |
| Blob builders | `createXlsxBlob`, `createPdfBlob` |
| Download/endpoint helpers | `downloadBlob`, `exportWithEndpoint` |
| Handler map | `defaultExportHandlers` |
| Spring Data adapters | `createSpringDataSource`, `normalizeSpringPage` |

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

Without `getRowId`, row keys and renderer `rowId` fall back from `uniqueField`/`id` to the index within the displayed page. Email selection instead falls back to row-object identity. Supply stable IDs when using stateful row controls. A supplied `getRowId` must itself return valid identities; its result is not repaired by the fallback.

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

`orderBy`, `order` and `initialRowsPerPage` initialize state; changing them later does not control it. Search/filter/sort/size changes reset the page unless an explicit page is included in a hook update. Header clicks replace the sort list with one column and alternate ascending/descending. Use the multi-sort menu to retain multiple priority columns.

When `currentPage` is supplied, the parent must apply page changes. `onPageChangeRequest` is emitted only in server mode; client mode has no independent page-change callback. For parent-managed paging with the built-in pager, supply a page of rows through the server contract, as shown in the [controlled-page example](examples/nextjs-demo/examples/controlled-page.jsx).

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

The header checkbox covers all matching local rows, across client pages, or only the loaded rows in server mode. Selection resets when the `data` array reference changes. The button is disabled without `onEmail`, during loading, or on error. The table does not send email.

### Export controls

| Parameter | Type | Default | Behavior |
|---|---|---|---|
| `enableExport` | `boolean` | `false` | Show the export menu. Disabled during loading/error and while an export runs. |
| `exportOptions` | `{csv?, txt?, xlsx?, pdf?, json?}` | CSV/TXT/XLSX/PDF on; JSON off | Boolean flags for each menu format. Omitted flags retain their defaults. |
| `exportHandlers` | `Record<format, (context) => void or Promise<void>>` | built-in handlers | Override individual format handlers. Keys: `csv`, `txt`, `xlsx`, `pdf`, `json`. |
| `fetchAllForExport` | `(query) => object[] or Promise<object[]>` | unset | Full matching-row resolver when server `totalCount` exceeds the loaded-row count. |

The menu exports matching, sorted rows across all client pages. It ignores email selection. A partial server dataset requires `fetchAllForExport`; a missing resolver or rejected export produces an error snackbar. The resolver runs before custom format handlers. See [export callback shapes](#export-callback-shapes).

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
| `enableThemes` | `boolean` | `false` | Show the library theme selector: `default`, `grey`, `blue`, `light`; initial selection is `default`. Otherwise inherit the parent MUI theme. |
| `tooltipFields` | `Record<field, string[]>` | no tooltips | Header information buttons; array items are joined with commas. |
| `renderToolbar` | `(context) => ReactNode` | unset | Append controls/content to the existing toolbar. Does not replace the default toolbar. |

Unknown props are not automatically forwarded to MUI components. In particular, there are currently no generic `sx`, `className`, `slots` or `components` table props. Pagination remains visible for empty and nonempty results.

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
| `dateFormat` | `string` | `'MM/dd/yyyy'` | Format Date/recognized ISO date values. Uses date-fns-style tokens; `YYYY`/`DD` are normalized to `yyyy`/`dd`. |
| `renderCell` | `({row, value, rowIndex, rowId}) => ReactNode` | formatted accessor text | Change cell presentation only. |
| `sortable` | `boolean` | `true` | Allow header/menu sorting and local comparator processing. |
| `searchable` | `boolean` | `true` | Include this column's text in global search. |
| `filterable` | `boolean` | `true` | Allow its filter input and local column filtering. |
| `sortComparator` | `(a, b) => number` | built-in comparison | Compare two accessed values, not row wrappers; negative/zero/positive for ascending order. The engine applies direction. |
| `filterFn` | `(value, filter, row) => boolean` | case-insensitive substring | Replace local matching for a nonempty filter. Built-in UI supplies string filters. |
| `enableExport` | `boolean` | `true` | Include the column in every built-in export format. |
| `exportValue` | `(row, index) => value` | `getColumnText(row, column)` | Export-specific value, independent of rendered React nodes. `index` is within the exported row collection. |
| `width` | `number or CSS width string` | unset | Header-cell width; numeric values use pixels. |
| `align` | `'left'`, `'center'`, `'right'`, `'justify'` or `'inherit'` | MUI default | Header/body alignment. |

Column identities must be unique after resolving `field ?? id`. A display column forcibly disables `sortable`, `searchable`, `filterable` and `enableExport` even if those flags are supplied as `true`; its `valueGetter` is not used. Use `renderCell` for its content.

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
| `rowId` | `getRowId(row)`, or the configured identity path, or displayed-index fallback. |
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

`renderToolbar(context)` receives all fields returned by `useTableModel`, plus `selectedRows`. Thus it includes `page`, `rowsPerPage`, `searchText`, `columnFilters`, `sorting`, `rows`, `filteredRows`, `count`, `update` and `selectedRows`. The selection array contains selected matching loaded rows, and can be empty even when email's no-selection behavior would use all matching rows.

### Export callback shapes

`fetchAllForExport(query)` receives:

```js
{
  orderBy: 'name',
  order: 'asc',
  selectedColumns: [{ field: 'name', order: 'asc' }],
  searchText: '',
  columnFilters: { status: 'Active' }
}
```

It must return an array or a promise resolving to an array. It receives neither pagination nor an AbortSignal. It is invoked only when server `totalCount` exceeds the loaded row count. Preserve sort/filter criteria when resolving all rows.

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

Return `void` or `Promise<void>`; rejection/throwing produces an error snackbar. Filenames use the sanitized `pageTitle` (or `table`) plus a UTC timestamp and extension. The menu locks until resolution and handler completion. It does not interpret a handler's `false` return as cancellation; a custom handler can simply omit downloading.

For a direct endpoint download without first loading all rows as JSON, add a button through `renderToolbar` and call `exportWithEndpoint` from it.

## State hook: useTableModel

```js
const model = useTableModel(options);
```

A React hook; call it inside a component/custom hook.

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
- **Returns:** standalone descriptors containing `id`, `header`, `enableExport` and `exportValue`. The fallback export value uses `getColumnText`; display columns are excluded.
- This adapter preserves formatted text by default. Supply `exportValue` to retain numbers, booleans or Date objects in formats that support types.

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

Dates become ISO strings in text formats; objects use JSON serialization. Inputs must be serializable: circular objects/BigInt can throw. The string serializers create no download. CSV formula guarding operates on serialized text, so even negative numeric text receives an apostrophe; use a typed XLSX cell when numeric preservation matters.

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

Returns `{ rows, rowCount, pageCount }`. This is shape adaptation, not response validation.

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
| `pagination.pageSize` | `integer` | required | Serialized as `size`; the adapter does not translate `-1`. |
| `sorting` | `Array<{id: string, desc: boolean}>` | `[]` | Serialized as repeated `sort=field,asc` / `sort=field,desc`, unless `mapSort` is supplied. |
| `globalFilter` | `string` | `''` | Nonempty search query, serialized as `search`. |
| `columnFilters` | `Array<{id: string, value}>` | `[]` | Non-nullish/nonempty values serialized as `filter.<id>=String(value)`. |
| `signal` | `AbortSignal` | unset | Forwarded to the fetcher. |

Resolves to `{ rows, rowCount, pageCount }` using `normalizeSpringPage`. Non-OK responses throw `Error('Table request failed (STATUS)')`; fetch/JSON errors propagate. Existing page/size/sort/search values are replaced. Filter parameters for IDs present in `columnFilters` are replaced or cleared; other base-URL filter parameters remain. Pass a cleared filter explicitly or use a clean base URL for dynamic filters. Objects/arrays are stringified rather than encoded as a typed range/filter protocol.

The adapter request shape differs from the table's query shape. Map them explicitly:

```js
const dataSource = createSpringDataSource({ url: '/api/customers' });
const controller = new AbortController();
const query = {
  page: 0, rowsPerPage: 10, sorting: [{ field: 'name', order: 'asc' }],
  searchText: '', columnFilters: {}
};
const result = await dataSource({
  pagination: { pageIndex: query.page, pageSize: query.rowsPerPage },
  sorting: query.sorting.map(({ field, order }) => ({ id: field, desc: order === 'desc' })),
  globalFilter: query.searchText,
  columnFilters: Object.entries(query.columnFilters).map(([id, value]) => ({ id, value })),
  signal: controller.signal
});
// result.rows → data; result.rowCount → totalCount
```

Import `createSpringDataSource` from the package. The [Spring example](examples/nextjs-demo/examples/spring-adapter.jsx) demonstrates cancellation and stale-response protection with a mock fetcher. Applications own authorization, endpoint validation and dataset fetching.

## Behavior, validation and migration

- Keep input rows, headers, maps and arrays immutable. Replace their references when changing values; preserve references between unrelated renders to benefit from memoization.
- Local pages clamp after data shrinks. Server pages retain their requested identity; the caller must recover an out-of-range page and keep rows, count and page consistent.
- Validate pages as nonnegative integers, sizes as positive integers or `-1`, and supplied totals as nonnegative integers. The component also validates unique column identities.
- Date-only `YYYY-MM-DD` values are formatted using local calendar components; timestamp/Date display follows the runtime's local timezone. Invalid or mixed-type values need application-specific handling; this is not a range/date-validation API.
- Legacy action props and `enableSearch` remain supported. New action UI belongs in `renderRowActions` or display columns. Native renderer `row` is the original object, not `{ original: ... }`.
- Internal `RowActions`, export menus, styled components, themes, date/path utilities and pagination controls are not public package exports. Import only the names listed in [public exports](#public-exports).
- The package does not currently expose a complete controlled-query `state` prop, typed declarations, selection beyond email, column visibility/reordering/resizing, grouped headers, trees, persistence, print controls or virtualization. See the [parity plan](docs/mui-datatables-parity-plan.md) and [tablekit review](docs/mui-tablekit-review.md) for proposed work; those are not implemented API parameters.

The implementation separates column access (`src/core/columns.js`), row processing (`src/core/rows.js`), state (`src/hooks/useTableModel.js`), MUI composition (`src/DynamicTable.jsx`), legacy compatibility (`src/compat/legacyActions.jsx`), serialization (`src/exports.js`) and backend adaptation (`src/spring.js`). This repository is a library; the Next.js application is an optional example catalog.
# data-table
