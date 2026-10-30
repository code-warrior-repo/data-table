'use client';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Stack, Typography } from '@mui/material';
import { createTableState, createSpringDataSource, DynamicTable, fetchAllSpringRows, toSpringRequest } from '@company/mui-data-table';
import { ExampleBulkActions, ExampleRowMenu, FeatureSettings, FeatureSummary, fullFeatureColumns,
  initialColumnOrder, initialColumnSizing, splitToolbar } from './full-feature-shared';
import { createFullFeatureBackend } from './full-feature-server';

const initialQuery = () => createTableState({ rowsPerPage: 3 });
export default function Example() {
  const backend = useMemo(() => createFullFeatureBackend(), []);
  // Replace the mock fetcher with your authenticated fetcher and real Spring endpoint.
  const source = useMemo(() => createSpringDataSource({ url: '/api/customers', fetcher: backend.fetcher }), [backend]);
  const [query, setQuery] = useState(initialQuery);
  const [result, setResult] = useState({ rows: [], rowCount: 0, loading: true, error: null });
  const [revision, setRevision] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [columnOrder, setColumnOrder] = useState(initialColumnOrder);
  const [columnSizing, setColumnSizing] = useState(initialColumnSizing);
  const [position, setPosition] = useState('first');
  const [toolbar, setToolbar] = useState('split');
  const [message, setMessage] = useState('Server mode: each request loads only one page. Selection can span pages using stable IDs.');
  useEffect(() => {
    const controller = new AbortController();
    setResult(previous => ({ ...previous, rows: [], loading: true, error: null }));
    source(toSpringRequest(query, { signal: controller.signal })).then(page => {
      if (controller.signal.aborted) return;
      const lastPage = Math.max(0, Math.ceil(page.rowCount / query.rowsPerPage) - 1);
      if (query.page > lastPage) { setQuery(previous => ({ ...previous, page: lastPage })); return; }
      setResult({ ...page, loading: false, error: null });
    }).catch(error => {
      if (!controller.signal.aborted) setResult(previous => ({ ...previous, loading: false, error }));
    });
    return () => controller.abort();
  }, [query, source, revision]);
  function refresh() { setRevision(previous => previous + 1); }
  function remove(ids) {
    backend.remove(ids); setSelectedIds(previous => previous.filter(id => !ids.includes(id)));
    setQuery(previous => ({ ...previous, page: 0 })); refresh(); setMessage(`Removed ${ids.length} synthetic records on the server.`);
  }
  function reset() { setQuery(initialQuery()); setColumnOrder(initialColumnOrder); setColumnSizing(initialColumnSizing); setMessage('Query and column layout reset.'); }
  return <Stack spacing={2}>
    <Typography>Simulated Spring backend with cancellable requests and real mock mutations. Score filters specify a minimum. Email previews and deletes resolve selected IDs on the server, including unloaded pages. Every export format fetches the complete matching result through the same Spring source.</Typography>
    <FeatureSettings position={position} onPositionChange={setPosition} toolbar={toolbar} onToolbarChange={setToolbar} />
    <Stack direction="row" gap={1} flexWrap="wrap">
      <Button onClick={refresh}>Reload page</Button>
      <Button onClick={() => { backend.failNext(); refresh(); }}>Fail next request</Button>
      <Button onClick={() => { backend.restore(); setSelectedIds([]); setQuery(initialQuery()); refresh(); setMessage('Server records restored.'); }}>Restore data</Button>
      {result.error && <Button onClick={refresh}>Retry request</Button>}
    </Stack>
    <Alert severity="info" data-testid="feature-feedback">{message}</Alert>
    <FeatureSummary query={query} selectedIds={selectedIds} />
    <Typography variant="caption" data-testid="server-request-count">Read requests: {backend.requestCount}</Typography>
    <DynamicTable pageTitle="Server-side customers" headers={fullFeatureColumns} data={result.rows} totalCount={result.rowCount} serverSidePagination
      getRowId={row => row.id} state={query} onQueryChange={setQuery} rowsPerPageOptions={[3, 5, 10]}
      loading={result.loading} error={result.error} emptyDataMessage="No customers match. Clear filters or restore the example data."
      searchByText enableColumnFilters enableMultiColumnSort stickyHeader maxHeight={420}
      enableDensePadding enableThemes enableFullScreenOption enableExport
      exportOptions={{ csv: true, txt: true, json: true, xlsx: true, pdf: true }}
      enableColumnReordering columnOrder={columnOrder} onColumnOrderChange={setColumnOrder}
      enableColumnResizing columnSizing={columnSizing} onColumnSizingChange={setColumnSizing} minColumnWidth={120} maxColumnWidth={500}
      enableRowSelection selectedRowIds={selectedIds} onSelectionChange={setSelectedIds} selectionScope="page" selectionColumnPosition={position}
      toolbarAlignment={toolbar === 'right' ? 'right' : 'left'} toolbarPositions={toolbar === 'split' ? splitToolbar : undefined}
      tooltipFields={{ score: ['Minimum score filter', 'Server numeric sorting and raw numeric export'] }}
      renderToolbar={() => <Button color="inherit" onClick={reset}>Reset query and layout</Button>}
      renderBulkActions={context => <ExampleBulkActions context={context} onRemove={remove}
        onEmail={({ selectedRowIds }) => setMessage(`Email preview: ${backend.previewEmails(selectedRowIds).join(', ')}`)} />}
      renderRowActions={({ row }) => <ExampleRowMenu row={row} items={[
        { id: 'view', label: 'View', onClick: () => setMessage(`Viewing ${row.name} ${row.surname}: ${row.email}`) },
        { id: 'edit', label: row.status === 'Active' ? 'Mark pending' : 'Mark active', onClick: () => { backend.toggleStatus(row.id); refresh(); setMessage(`Updated ${row.name}'s status on the server.`); } },
        { id: 'clone', label: 'Clone', onClick: () => { backend.clone(row.id); refresh(); setMessage(`Cloned ${row.name} on the server.`); } },
        { id: 'delete', label: 'Delete', onClick: () => remove([row.id]) },
      ]} />}
      fetchAllForExport={(exportQuery, { signal, onProgress }) => fetchAllSpringRows({ dataSource: source, query: exportQuery,
        pageSize: 3, maxRows: 100, maxPages: 50, getRowId: row => row.id, signal, onProgress })}
      onExportStart={({ format }) => setMessage(`Preparing full-result ${format.toUpperCase()} export.`)}
      onExportComplete={({ format, rowCount }) => setMessage(`Exported ${rowCount} matching rows as ${format.toUpperCase()}.`)}
      onExportError={error => setMessage(`Export failed: ${error.message}`)} onExportCancel={() => setMessage('Export cancelled.')} />
  </Stack>;
}
