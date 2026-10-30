import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, Checkbox, IconButton, LinearProgress, Paper, Stack, Table, TableBody,
  TableContainer, TableHead, TableSortLabel, TextField, Tooltip, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import DensityMediumIcon from '@mui/icons-material/DensityMedium';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import EmailIcon from '@mui/icons-material/Email';
import InfoIcon from '@mui/icons-material/Info';
import Search from './Search';
import ExportOptions from './ExportOptions';
import MultiColumnSort from './MultiColumnSort';
import ThemeSelector from './ThemeSelector';
import { themes } from './themes';
import { StyledActionTableCell, StyledTableCell, StyledTableRow } from './StyledComponents';
import CustomTablePagination from './CustomTablePagination';
import { getByPath } from './util';
import { getColumnText, getColumnValue, normalizeColumns } from './core/columns.js';
import { useTableModel } from './hooks/useTableModel.js';
import { buildActions, renderLegacyRowActions } from './compat/legacyActions.jsx';

/** MUI presentation over an independent row model; server requests belong to the caller. */
export default function DynamicTable(props) {
  const { enableColumnFilters = false, loading = false, error,
    emptyDataMessage = 'No matching records.', pageTitle = '', enableEmail = false,
    uniqueField = '', getRowId, onEmail, serverSidePagination = false, fetchAllForExport } = props;
  const headers = useMemo(() => normalizeColumns(props.headers), [props.headers]);
  const model = useTableModel({ ...props, headers });
  const [theme, setTheme] = useState('default');
  const [dense, setDense] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState('');
  // Selection is scoped to the current data array to avoid emailing stale server pages.
  const [selection, setSelection] = useState({ data: props.data, ids: new Set() });
  const selected = selection.data === props.data ? selection.ids : new Set();
  const ref = useRef(null);
  const actions = buildActions(props);
  const hasActions = props.enableRowActions !== false &&
    (typeof props.renderRowActions === 'function' || actions.length > 0);
  const identify = row => getRowId ? getRowId(row) : getByPath(row, uniqueField || 'id') ?? row;
  const selectedRows = model.filteredRows.filter(row => selected.has(identify(row)));
  const allSelected = model.filteredRows.length > 0 && selectedRows.length === model.filteredRows.length;
  const columnCount = headers.length + Number(hasActions) + Number(enableEmail);
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
    setSelection({ data: props.data, ids });
  }
  const needsAllRows = serverSidePagination && model.count > model.filteredRows.length;
  const exportFetch = needsAllRows ? async () => {
    if (!fetchAllForExport) throw new Error('Provide fetchAllForExport to export the full server result.');
    return fetchAllForExport({ orderBy: sort?.field ?? '', order: sort?.order ?? 'asc',
      selectedColumns: model.sorting, searchText: model.searchText, columnFilters: model.columnFilters });
  } : undefined;

  const content = <Paper ref={ref} sx={{ width: '100%', overflow: 'auto', p: fullscreen ? 2 : 0 }}>
    <Stack direction="row" spacing={1} sx={{ p: 1, alignItems: 'center', flexWrap: 'wrap' }}>
      {pageTitle && <Typography component="h2" variant="h6" sx={{ flexGrow: 1 }}>{pageTitle}</Typography>}
      {(props.searchByText || props.enableSearch) && <Search searchText={model.searchText}
        handleSearchTextChange={event => model.update({ searchText: event.target.value, page: 0 })} />}
      {props.enableDensePadding && <IconButton aria-label="Dense padding" onClick={() => setDense(!dense)}><DensityMediumIcon /></IconButton>}
      {props.enableMultiColumnSort && <MultiColumnSort headers={headers.filter(h => h.sortable !== false)}
        selectedColumns={model.sorting} handleSortChange={sorting => model.update({ sorting, page: 0 })} />}
      {props.enableExport && <ExportOptions headers={headers} data={model.filteredRows} pageTitle={pageTitle}
        fetchAllRows={exportFetch} exportOptions={props.exportOptions} exportHandlers={props.exportHandlers}
        state={{ page: model.page, rowsPerPage: model.rowsPerPage, sorting: model.sorting,
          searchText: model.searchText, columnFilters: model.columnFilters }} disabled={loading || Boolean(error)} />}
      {props.enableThemes && <ThemeSelector currentTheme={theme} handleThemeChange={setTheme} />}
      {props.enableFullScreenOption && <IconButton aria-label="Toggle fullscreen" onClick={toggleFullscreen}>
        {fullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}</IconButton>}
      {enableEmail && <IconButton aria-label="Send email" disabled={!onEmail || loading || Boolean(error)}
        onClick={() => onEmail(selectedRows.length ? selectedRows : model.filteredRows)}><EmailIcon /></IconButton>}
      {props.renderToolbar?.({ ...model, selectedRows })}
    </Stack>
    {fullscreenError && <Alert severity="warning" onClose={() => setFullscreenError('')}>{fullscreenError}</Alert>}
    {error && <Alert severity="error">{error instanceof Error ? error.message : String(error)}</Alert>}
    {loading && <LinearProgress aria-label="Loading rows" />}
    <TableContainer sx={{ maxHeight: props.maxHeight }}>
      <Table stickyHeader={props.stickyHeader} size={dense ? 'small' : 'medium'}
        aria-label={props['aria-label'] ?? (pageTitle || 'Data table')} aria-busy={loading}>
        <TableHead><StyledTableRow>
          {headers.map(header => <StyledTableCell key={header.field} style={{ width: header.width }}
            align={header.align} sortDirection={sort?.field === header.field ? sort.order : false}>
            {header.sortable === false ? header.label : <TableSortLabel active={sort?.field === header.field}
              direction={sort?.field === header.field ? sort.order : 'asc'} onClick={() => model.update({ page: 0,
                sorting: [{ field: header.field, order: sort?.field === header.field && sort.order === 'asc' ? 'desc' : 'asc' }] })}>
              {header.label}
            </TableSortLabel>}
            {props.tooltipFields?.[header.field] && <Tooltip title={props.tooltipFields[header.field].join(', ')}>
              <IconButton size="small" aria-label={`About ${header.label}`}><InfoIcon fontSize="small" /></IconButton>
            </Tooltip>}
            {enableColumnFilters && header.filterable !== false && <TextField size="small" label={`Filter ${header.label}`}
              value={model.columnFilters[header.field] ?? ''} onChange={event => model.update({ page: 0,
                columnFilters: { ...model.columnFilters, [header.field]: event.target.value } })} />}
          </StyledTableCell>)}
          {hasActions && <StyledTableCell>{props.actionsColumnLabel ?? 'Actions'}</StyledTableCell>}
          {enableEmail && <StyledTableCell><Checkbox aria-label="Select all emails" checked={allSelected}
            indeterminate={selectedRows.length > 0 && !allSelected} onChange={event =>
              setSelection({ data: props.data, ids: new Set(event.target.checked ? model.filteredRows.map(identify) : []) })} />Email</StyledTableCell>}
        </StyledTableRow></TableHead>
        <TableBody>
          {!error && model.rows.map((row, index) => {
            const rowId = getRowId ? getRowId(row) : getByPath(row, uniqueField || 'id') ?? index;
            return <StyledTableRow key={rowId} hover>
            {headers.map(header => <StyledTableCell key={header.field} align={header.align}>
              {header.renderCell ? header.renderCell({ row, value: getColumnValue(row, header), rowIndex: index, rowId }) : getColumnText(row, header)}
            </StyledTableCell>)}
            {hasActions && <StyledActionTableCell>
              {props.renderRowActions ? props.renderRowActions({ row, rowIndex: index, rowId }) :
                renderLegacyRowActions({ row, actions, icons: props.showActionIcons, visibility: props.actionVisibilityRules })}
            </StyledActionTableCell>}
            {enableEmail && <StyledTableCell><Checkbox aria-label={`Select email row ${index + 1}`}
              checked={selected.has(identify(row))} onChange={event => toggleRow(row, event.target.checked)} /></StyledTableCell>}
          </StyledTableRow>;
          })}
          {!loading && !error && model.rows.length === 0 && <StyledTableRow><StyledTableCell colSpan={Math.max(1, columnCount)} align="center">
            {emptyDataMessage}
          </StyledTableCell></StyledTableRow>}
        </TableBody>
      </Table>
    </TableContainer>
    <CustomTablePagination count={model.count} page={model.page} rowsPerPage={model.rowsPerPage}
      rowsPerPageOptions={props.rowsPerPageOptions} onPageChange={page => model.update({ page })}
      onRowsPerPageChange={event => model.update({ rowsPerPage: Number(event.target.value), page: 0 })} />
  </Paper>;
  return props.enableThemes ? <ThemeProvider theme={themes[theme]}>{content}</ThemeProvider> : <Box>{content}</Box>;
}
