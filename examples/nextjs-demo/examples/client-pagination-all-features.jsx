'use client';
import { useRef, useState } from 'react';
import { Alert, Button, Stack, Typography } from '@mui/material';
import { createTableState, DynamicTable } from '@company/mui-data-table';
import { ExampleBulkActions, ExampleRowMenu, FeatureSettings, FeatureSummary, fullFeatureColumns,
  initialColumnOrder, initialColumnSizing, makeFullFeatureRows, splitToolbar } from './full-feature-shared';

const initialQuery = () => createTableState({ rowsPerPage: 3 });
export default function Example() {
  const [data, setData] = useState(makeFullFeatureRows);
  const [query, setQuery] = useState(initialQuery);
  const [selectedIds, setSelectedIds] = useState([]);
  const [columnOrder, setColumnOrder] = useState(initialColumnOrder);
  const [columnSizing, setColumnSizing] = useState(initialColumnSizing);
  const [position, setPosition] = useState('first');
  const [toolbar, setToolbar] = useState('split');
  const [preview, setPreview] = useState('ready');
  const [message, setMessage] = useState('Client mode: search, filtering, sorting and pagination run over the complete local dataset.');
  const copyNumber = useRef(0);
  function remove(ids) {
    const selected = new Set(ids);
    setData(previous => previous.filter(row => !selected.has(row.id)));
    setSelectedIds(previous => previous.filter(id => !selected.has(id)));
    setQuery(previous => ({ ...previous, page: 0 }));
    setMessage(`Removed ${ids.length} synthetic records.`);
  }
  function reset() {
    setQuery(initialQuery()); setColumnOrder(initialColumnOrder); setColumnSizing(initialColumnSizing);
    setPreview('ready'); setMessage('Query and column layout reset.');
  }
  return <Stack spacing={2}>
    <Typography>All data is synthetic. Email actions preview recipients only. Score filters specify a minimum; other filters match text. Exports include every matching row, across client pages.</Typography>
    <FeatureSettings position={position} onPositionChange={setPosition} toolbar={toolbar} onToolbarChange={setToolbar} preview={preview} onPreviewChange={setPreview} />
    <Stack direction="row" spacing={1}>
      <Button onClick={() => { setData(makeFullFeatureRows()); setSelectedIds([]); setQuery(initialQuery()); setPreview('ready'); setMessage('Synthetic records restored.'); }}>Restore data</Button>
    </Stack>
    <Alert severity="info" data-testid="feature-feedback">{message}</Alert>
    <FeatureSummary query={query} selectedIds={selectedIds} />
    <DynamicTable pageTitle="Client-side customers" headers={fullFeatureColumns} data={preview === 'empty' ? [] : data} getRowId={row => row.id}
      state={query} onStateChange={setQuery} rowsPerPageOptions={[3, 5, 10, { value: -1, label: 'All' }]}
      searchByText enableColumnFilters enableMultiColumnSort stickyHeader maxHeight={420}
      enableDensePadding enableThemes enableFullScreenOption enableExport
      exportOptions={{ csv: true, txt: true, json: true, xlsx: true, pdf: true }}
      enableColumnReordering columnOrder={columnOrder} onColumnOrderChange={setColumnOrder}
      enableColumnResizing columnSizing={columnSizing} onColumnSizingChange={setColumnSizing} minColumnWidth={120} maxColumnWidth={500}
      enableRowSelection selectedRowIds={selectedIds} onSelectionChange={setSelectedIds} selectionScope="page" selectionColumnPosition={position}
      toolbarAlignment={toolbar === 'right' ? 'right' : 'left'} toolbarPositions={toolbar === 'split' ? splitToolbar : undefined}
      tooltipFields={{ score: ['Minimum score filter', 'Numeric sorting and raw numeric export'] }}
      loading={preview === 'loading'} error={preview === 'error' ? 'Example error state. Choose Ready to continue.' : undefined}
      emptyDataMessage="No customers match. Clear filters or restore the example data."
      renderToolbar={() => <Button color="inherit" onClick={reset}>Reset query and layout</Button>}
      renderBulkActions={context => <ExampleBulkActions context={context} onRemove={remove}
        onEmail={({ selectedRows }) => setMessage(`Email preview: ${selectedRows.map(row => row.email).join(', ')}`)} />}
      renderRowActions={({ row }) => <ExampleRowMenu row={row} items={[
        { id: 'view', label: 'View', onClick: () => setMessage(`Viewing ${row.name} ${row.surname}: ${row.email}`) },
        { id: 'edit', label: row.status === 'Active' ? 'Mark pending' : 'Mark active', onClick: () => {
          setData(previous => previous.map(record => record.id === row.id ? { ...record, status: row.status === 'Active' ? 'Pending' : 'Active' } : record));
          setMessage(`Updated ${row.name}'s status.`);
        } },
        { id: 'clone', label: 'Clone', onClick: () => {
          const copy = { ...row, id: `${row.id}-copy-${++copyNumber.current}`, name: `${row.name} (copy)` };
          setData(previous => [...previous, copy]); setMessage(`Cloned ${row.name}.`);
        } },
        { id: 'delete', label: 'Delete', onClick: () => remove([row.id]) },
      ]} />}
      onExportStart={({ format }) => setMessage(`Preparing ${format.toUpperCase()} export.`)}
      onExportComplete={({ format, rowCount }) => setMessage(`Exported ${rowCount} matching rows as ${format.toUpperCase()}.`)}
      onExportError={error => setMessage(`Export failed: ${error.message}`)} onExportCancel={() => setMessage('Export cancelled.')} />
  </Stack>;
}
