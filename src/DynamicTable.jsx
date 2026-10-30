import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, Checkbox, IconButton, LinearProgress, Paper, Stack, Table, TableBody,
  TableContainer, TableHead, TableSortLabel, TextField, Tooltip, Typography } from '@mui/material';
import { ThemeProvider, useTheme } from '@mui/material/styles';
import DensityMediumIcon from '@mui/icons-material/DensityMedium';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import EmailIcon from '@mui/icons-material/Email';
import InfoIcon from '@mui/icons-material/Info';
import Search from './Search';
import ExportOptions from './ExportOptions';
import MultiColumnSort from './MultiColumnSort';
import ThemeSelector from './ThemeSelector';
import { defaultTableLabels } from './labels.js';
import { createTableTheme } from './themes';
import { StyledActionTableCell, StyledTableCell, StyledTableRow } from './StyledComponents';
import ColumnHeaderControls from './ColumnHeaderControls';
import { useColumnLayout } from './hooks/useColumnLayout.js';
import CustomTablePagination from './CustomTablePagination';
import { insertSelectionCell, arrangeToolbarControls } from './core/layout.js';
import { rowIdentities } from './core/identity.js';
import { getColumnText, getColumnValue, normalizeColumns } from './core/columns.js';
import { useTableModel } from './hooks/useTableModel.js';
import { buildActions, renderLegacyRowActions } from './compat/legacyActions.jsx';

/** MUI presentation over an independent row model; server requests belong to the caller. */
export default function DynamicTable(props) {
  const labels = { ...defaultTableLabels, ...props.labels };
  const slots = props.slots ?? {};
  const slotProps = props.slotProps ?? {};
  const Root = slots.root ?? Paper, Toolbar = slots.toolbar ?? Stack, Head = slots.header ?? TableHead;
  const Body = slots.body ?? TableBody, Row = slots.row ?? StyledTableRow, Cell = slots.cell ?? StyledTableCell;
  const ActionCell = slots.actionCell ?? StyledActionTableCell, TableComponent = slots.table ?? Table;
  const Footer = slots.footer ?? CustomTablePagination;
  const { enableColumnFilters = false, loading = false, error,
    emptyDataMessage = labels.empty, pageTitle = '', enableEmail = false,
    uniqueField = '', getRowId, onEmail, serverSidePagination = false, fetchAllForExport } = props;
  const selectionEnabled = Boolean(props.enableRowSelection || enableEmail);
  const selectionLabel = props.selectionColumnLabel ?? (props.enableRowSelection ? labels.selection : labels.email);
  const selectAllLabel = props.enableRowSelection ? labels.selectAllRows : labels.selectAllEmails;
  const normalizedHeaders = useMemo(() => normalizeColumns(props.headers), [props.headers]);
  const model = useTableModel({ ...props, headers: normalizedHeaders });
  const layout = useColumnLayout(normalizedHeaders, props);
  const headers = layout.headers;
  const resizing = Boolean(props.enableColumnResizing);
  const [theme, setTheme] = useState('default');
  const applicationTheme = useTheme();
  const activeTheme = useMemo(() => createTableTheme(applicationTheme, props.enableThemes ? theme : 'default'),
    [applicationTheme, props.enableThemes, theme]);
  const [dense, setDense] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState('');
  // Explicit selection ownership/reset policy; email is a compatibility action over matching rows.
  const [selection, setSelection] = useState({ data: props.data, datasetKey: props.datasetKey, ids: new Set(props.initialSelectedRowIds ?? []) });
  const selectionValid = Object.is(selection.datasetKey, props.datasetKey) &&
    (props.selectionReset === 'dataset' || selection.data === props.data);
  const selected = props.selectedRowIds !== undefined ? new Set(props.selectedRowIds) : selectionValid ? selection.ids : new Set();
  useEffect(() => {
    setSelection(previous => {
      const valid = Object.is(previous.datasetKey, props.datasetKey) &&
        (props.selectionReset === 'dataset' || previous.data === props.data);
      return valid ? previous : { data: props.data, datasetKey: props.datasetKey, ids: new Set() };
    });
  }, [props.data, props.datasetKey, props.selectionReset]);
  const ref = useRef(null);
  const actions = buildActions(props);
  const hasActions = props.enableRowActions !== false &&
    (typeof props.renderRowActions === 'function' || actions.length > 0);
  const requireIds = Boolean(selectionEnabled || props.renderBulkActions || hasActions || headers.some(header => header.renderCell));
  const identities = useMemo(() => rowIdentities(props.data ?? [], { getRowId, uniqueField, requireIds }),
    [props.data, getRowId, uniqueField, requireIds]);
  const identify = row => identities.get(row);
  function updateSelection(ids) {
    if (props.selectedRowIds === undefined) setSelection({ data: props.data, datasetKey: props.datasetKey, ids });
    props.onSelectionChange?.([...ids]);
  }
  const selectedRows = model.filteredRows.filter(row => selected.has(identify(row)));
  const selectedRowIds = [...selected];
  const selectedLoadedRows = (props.data ?? []).filter(row => selected.has(identify(row)));
  const loadedIds = new Set(identities.values());
  const bulkContext = {
    selectedRowIds, selectedRows: selectedLoadedRows, selectedCount: selected.size,
    unloadedSelectedRowIds: selectedRowIds.filter(id => !loadedIds.has(id)),
    clearSelection: () => updateSelection(new Set()), disabled: loading || Boolean(error), state: model.state
  };
  const selectionRows = props.selectionScope === 'page' ? model.rows : model.filteredRows;
  const selectedInScope = selectionRows.filter(row => selected.has(identify(row))).length;
  const allSelected = selectionRows.length > 0 && selectedInScope === selectionRows.length;
  const columnCount = headers.length + Number(hasActions) + Number(selectionEnabled);
  const dataColumnWidths = [
    ...headers.map(header => ({ key: `column-${header.field}`, width: layout.sizing[header.field] })),
    ...(hasActions ? [{ key: 'row-actions', width: 160 }] : []),
  ];
  const columnWidths = selectionEnabled ? insertSelectionCell(dataColumnWidths,
    { key: 'selection-column', width: 140 }, props.selectionColumnPosition) : dataColumnWidths;
  const sort = model.sorting[0];

  useEffect(() => {
    const change = () => setFullscreen(document.fullscreenElement === ref.current);
    document.addEventListener('fullscreenchange', change);
    return () => document.removeEventListener('fullscreenchange', change);
  }, []);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement === ref.current) await document.exitFullscreen();
      else if (ref.current?.requestFullscreen) await ref.current.requestFullscreen();
      else throw new Error('Fullscreen is unavailable in this browser.');
    } catch (cause) { setFullscreenError(cause.message); }
  }
  function toggleRow(row, checked) {
    const ids = new Set(selected);
    if (checked) ids.add(identify(row)); else ids.delete(identify(row));
    updateSelection(ids);
  }
  const needsAllRows = serverSidePagination && model.count > model.filteredRows.length;
  const exportFetch = needsAllRows ? async context => {
    if (!fetchAllForExport) throw new Error('Provide fetchAllForExport to export the full server result.');
    return fetchAllForExport({ orderBy: sort?.field ?? '', order: sort?.order ?? 'asc',
      selectedColumns: model.sorting, searchText: model.searchText, columnFilters: model.columnFilters }, context);
  } : undefined;

  function toggleAllRows(checked) {
    const ids = new Set(selected);
    selectionRows.forEach(row => checked ? ids.add(identify(row)) : ids.delete(identify(row)));
    updateSelection(ids);
  }
  const selectionHeader = (<Cell key="selection-column"><Checkbox slotProps={{ input: { 'aria-label': selectAllLabel } }} disabled={loading || Boolean(error)} checked={allSelected}
            indeterminate={selectedInScope > 0 && !allSelected} onChange={event => toggleAllRows(event.target.checked)} />{selectionLabel}</Cell>);
  const headerCells = [
          ...headers.map(header => <Cell {...slotProps.cell} key={`column-${header.field}`} style={{ ...slotProps.cell?.style, width: resizing ? layout.sizing[header.field] : header.width, ...(resizing ? { position: props.stickyHeader ? 'sticky' : 'relative' } : {}), ...(resizing && header.resizable !== false ? { paddingInlineEnd: 14 } : {}) }}
            data-column-field={header.field} {...(props.enableColumnReordering && header.reorderable !== false ? layout.dropProps(header.field) : {})}
            align={header.align} sortDirection={sort?.field === header.field ? sort.order : false}>
            {(props.enableColumnReordering || resizing) && <ColumnHeaderControls column={header} layout={layout} labels={labels} direction={activeTheme.direction}
              reorder={props.enableColumnReordering && header.reorderable !== false} resize={resizing && header.resizable !== false} />}
            {header.sortable === false ? header.label : <TableSortLabel active={sort?.field === header.field}
              direction={sort?.field === header.field ? sort.order : 'asc'} onClick={() => model.update({ page: 0,
                sorting: [{ field: header.field, order: sort?.field === header.field && sort.order === 'asc' ? 'desc' : 'asc' }] })}>
              {header.label}
            </TableSortLabel>}
            {props.tooltipFields?.[header.field] && <Tooltip title={props.tooltipFields[header.field].join(', ')}>
              <IconButton size="small" aria-label={labels.about(header.label)}><InfoIcon fontSize="small" /></IconButton>
            </Tooltip>}
            {enableColumnFilters && header.filterable !== false && <TextField size="small" variant="filled" label={labels.filter(header.label)}
              sx={{ bgcolor: 'background.paper', color: 'text.primary', borderRadius: 1, mt: 1, width: '100%' }}
              slotProps={{ inputLabel: { sx: { color: 'text.secondary', '&.Mui-focused': { color: 'text.primary' } } },
                input: { sx: { color: 'text.primary', '&::after': { borderBottomColor: 'text.primary' } } } }}
              value={model.columnFilters[header.field] ?? ''} onChange={event => model.update({ page: 0,
                columnFilters: { ...model.columnFilters, [header.field]: event.target.value } })} />}
          </Cell>),
          ...(hasActions ? [<Cell key="row-actions">{props.actionsColumnLabel ?? labels.actions}</Cell>] : [])

  ];
  const renderSelectionCell = (row, index) => (<Cell key="selection-column"><Checkbox slotProps={{ input: { 'aria-label': props.enableRowSelection ? labels.selectRow(index + 1) : labels.selectEmailRow(index + 1) } }} disabled={loading || Boolean(error)}
              checked={selected.has(identify(row))} onChange={event => toggleRow(row, event.target.checked)} /></Cell>);
  const controls = {
    search: ((props.searchByText || props.enableSearch) && <Search labels={labels} searchText={model.searchText}
        handleSearchTextChange={event => model.update({ searchText: event.target.value, page: 0 })} />),
    density: (props.enableDensePadding && <IconButton aria-label={labels.densePadding} onClick={() => setDense(!dense)}><DensityMediumIcon /></IconButton>),
    sort: (props.enableMultiColumnSort && <MultiColumnSort labels={labels} headers={headers.filter(h => h.sortable !== false)}
        selectedColumns={model.sorting} handleSortChange={sorting => model.update({ sorting, page: 0 })} />),
    export: (props.enableExport && <ExportOptions labels={labels} headers={headers} data={model.filteredRows} pageTitle={pageTitle}
        fetchAllRows={exportFetch} onExportStart={props.onExportStart} onExportComplete={props.onExportComplete}
        onExportError={props.onExportError} onExportCancel={props.onExportCancel} exportOptions={props.exportOptions} exportHandlers={props.exportHandlers}
        state={{ page: model.page, rowsPerPage: model.rowsPerPage, sorting: model.sorting,
          searchText: model.searchText, columnFilters: model.columnFilters }} disabled={loading || Boolean(error)} />),
    themes: (props.enableThemes && <ThemeSelector labels={labels} currentTheme={theme} handleThemeChange={setTheme} />),
    fullscreen: (props.enableFullScreenOption && <IconButton aria-label={labels.fullscreen} onClick={toggleFullscreen}>
        {fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}</IconButton>),
    bulkActions: (props.renderBulkActions ? props.renderBulkActions(bulkContext) : (enableEmail && <IconButton aria-label={labels.sendEmail} disabled={!onEmail || loading || Boolean(error)}
        onClick={() => onEmail(selectedRows.length ? selectedRows : model.filteredRows)}><EmailIcon /></IconButton>)),
    custom: (props.renderToolbar?.({ ...model, selectedRows, selection: bulkContext })),
  };
  const arrangedControls = arrangeToolbarControls(controls, props.toolbarAlignment, props.toolbarPositions);
  const firstRight = arrangedControls.findIndex(control => control.side === 'right');
  const content = <Root {...slotProps.root} ref={ref} sx={[{ width: '100%', overflow: 'auto', p: fullscreen ? 2 : 0 }, slotProps.root?.sx ?? {}]}>
    <Toolbar {...slotProps.toolbar} direction="row" spacing={1} sx={[{ p: 1, alignItems: 'center', flexWrap: 'wrap' }, slotProps.toolbar?.sx ?? {}]}>
      {pageTitle && <Typography component="h2" variant="h6" sx={{ flexShrink: 0 }}>{pageTitle}</Typography>}
      {arrangedControls.map(({ id, node, side }, index) => <React.Fragment key={id}>
        {index === firstRight && <Box aria-hidden="true" sx={{ flexGrow: 1 }} />}
        <Box data-table-toolbar-control={id} data-table-toolbar-side={side}
          sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>{node}</Box>
      </React.Fragment>)}
    </Toolbar>
    {fullscreenError && <Alert severity="warning" onClose={() => setFullscreenError('')}>{fullscreenError}</Alert>}
    {error && <Alert severity="error">{error instanceof Error ? error.message : String(error)}</Alert>}
    {loading && <LinearProgress aria-label={labels.loading} />}
    {model.sorting.length > 0 && <Box component="span" role="status" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' }}>{labels.sortSummary(model.sorting)}</Box>}
    <TableContainer sx={{ maxHeight: props.maxHeight }}>
      <TableComponent {...slotProps.table} stickyHeader={props.stickyHeader} size={dense ? 'small' : 'medium'}
        sx={[...(Array.isArray(slotProps.table?.sx) ? slotProps.table.sx : [slotProps.table?.sx ?? {}]),
          ...(resizing ? [{ tableLayout: 'fixed', width: columnWidths.reduce((sum, column) => sum + column.width, 0) }] : [])]}
        aria-label={props['aria-label'] ?? (pageTitle || labels.table)} aria-busy={loading}>
        {resizing && <colgroup>{columnWidths.map(column => <col key={column.key} style={{ width: column.width }} />)}</colgroup>}
        <Head {...slotProps.header}><Row>
          {selectionEnabled ? insertSelectionCell(headerCells, selectionHeader, props.selectionColumnPosition) : headerCells}
        </Row></Head>
        <Body {...slotProps.body}>
          {!error && model.rows.map((row, index) => {
            const rowId = identify(row);
            const cells = [
            ...headers.map(header => <Cell {...slotProps.cell} key={`column-${header.field}`} align={header.align}
              sx={[...(Array.isArray(slotProps.cell?.sx) ? slotProps.cell.sx : [slotProps.cell?.sx ?? {}]), ...(resizing ? [{ overflowWrap: 'anywhere' }] : [])]}>
              {header.renderCell ? header.renderCell({ row, value: getColumnValue(row, header), rowIndex: index, rowId }) : getColumnText(row, header)}
            </Cell>),
            ...(hasActions ? [<ActionCell key="row-actions" {...slotProps.actionCell}>
              {props.renderRowActions ? props.renderRowActions({ row, rowIndex: index, rowId }) :
                renderLegacyRowActions({ row, actions, icons: props.showActionIcons, visibility: props.actionVisibilityRules })}
            </ActionCell>] : [])

            ];
            return <Row {...slotProps.row} key={rowId} selected={selectionEnabled && selected.has(rowId)} hover>
            {selectionEnabled ? insertSelectionCell(cells, renderSelectionCell(row, index), props.selectionColumnPosition) : cells}
          </Row>;
          })}
          {!loading && !error && model.rows.length === 0 && <Row><Cell colSpan={Math.max(1, columnCount)} align="center">
            {emptyDataMessage}
          </Cell></Row>}
        </Body>
      </TableComponent>
    </TableContainer>
    <Footer {...slotProps.footer} labels={labels} count={model.count} page={model.page} rowsPerPage={model.rowsPerPage}
      rowsPerPageOptions={props.rowsPerPageOptions} onPageChange={page => model.update({ page })}
      onRowsPerPageChange={event => model.update({ rowsPerPage: Number(event.target.value), page: 0 })} />
  </Root>;
  return <ThemeProvider theme={activeTheme}><Box>{content}</Box></ThemeProvider>;
}
