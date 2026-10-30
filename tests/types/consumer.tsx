import { useState } from 'react';
import { createTableState, DynamicTable, type Column, type TableState } from '@company/mui-data-table';
import { buildRowModel } from '@company/mui-data-table/core';
import { createSpringDataSource, fetchAllSpringRows, toSpringRequest } from '@company/mui-data-table/spring';
import { rowsToCsv } from '@company/mui-data-table/exports';
type Person = { id: number; name: string };
const rows: Person[] = [{ id: 1, name: 'Ada' }];
const headers: Column<Person>[] = [{ field: 'name', renderCell: ({ row }) => row.name }];
export function Consumer() {
  const [columnOrder, setColumnOrder] = useState<string[]>(['name']);
  const [columnSizing, setColumnSizing] = useState<Record<string, number>>({ name: 200 });
  const [state, setState] = useState<TableState>(() => createTableState());
  return <DynamicTable headers={headers} data={rows} state={state} onStateChange={setState}
    getRowId={row => row.id} labels={{ search: 'Find' }} slots={{ toolbar: 'section' }}
    enableColumnReordering columnOrder={columnOrder} onColumnOrderChange={setColumnOrder}
    enableColumnResizing columnSizing={columnSizing} onColumnSizingChange={setColumnSizing} minColumnWidth={80}
    selectionColumnPosition="first" toolbarAlignment="left" toolbarPositions={{ export: 'right' }}
    renderBulkActions={({ selectedRows, clearSelection }) => <button onClick={clearSelection}>{selectedRows[0]?.name}</button>}
    selectedRowIds={[1]} onSelectionChange={ids => console.log(ids)}
    fetchAllForExport={async (_query, { signal }) => { signal.throwIfAborted(); return rows; }}
    exportHandlers={{ csv: { mode: 'endpoint', handler: async ({ signal, state }) => { signal.throwIfAborted(); console.log(state.page); } } }} renderRowActions={({ row }) => <button>{row.name}</button>} />;
}
const source = createSpringDataSource<Person>({ url: '/api' });
void fetchAllSpringRows({ dataSource: source, query: createTableState() });
void source(toSpringRequest());
rowsToCsv({ rows, columns: [{ accessorKey: 'name' }] });
buildRowModel({ data: rows, headers });
// @ts-expect-error Invalid state sizes must be numbers.
createTableState({ rowsPerPage: '10' });
// @ts-expect-error Row render context retains the consumer's row type.
const invalid: Column<Person> = { renderCell: ({ row }) => row.missing };
void invalid;
