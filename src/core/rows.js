import { getColumnValue, getColumnText } from './columns.js';
import { compareValues } from '../util.js';

export function buildRowModel({ data = [], headers = [], searchText = '', columnFilters = {},
  sorting = [], page = 0, rowsPerPage = 5, serverSide = false, totalCount }) {
  if (!Array.isArray(data) || !Array.isArray(headers)) throw new TypeError('data and headers must be arrays.');
  if (!Number.isInteger(page) || page < 0) throw new RangeError('page must be a nonnegative integer.');
  if (rowsPerPage !== -1 && (!Number.isInteger(rowsPerPage) || rowsPerPage < 1)) {
    throw new RangeError('rowsPerPage must be a positive integer or -1 (All).');
  }
  if (totalCount !== undefined && (!Number.isInteger(totalCount) || totalCount < 0)) {
    throw new RangeError('totalCount must be a nonnegative integer.');
  }
  const dataColumns = headers.filter(column => column.type !== 'display');
  const sortColumns = new Map(dataColumns.map(column => [column.field, column]));
  const comparators = sorting.flatMap(sort => {
    const column = sortColumns.get(sort.field);
    return !column || column.sortable === false ? [] : [{ column, sort }];
  });
  const search = String(searchText).trim().toLocaleLowerCase();
  const filtered = serverSide ? data : data.filter(row =>
    (!search || dataColumns.some(column => column.searchable !== false &&
      getColumnText(row, column).toLocaleLowerCase().includes(search))) &&
    dataColumns.every(column => {
      const filter = Object.hasOwn(columnFilters, column.field) ? columnFilters[column.field] : undefined;
      if (filter == null || filter === '' || column.filterable === false) return true;
      return column.filterFn ? column.filterFn(getColumnValue(row, column), filter, row) :
        getColumnText(row, column).toLocaleLowerCase().includes(String(filter).toLocaleLowerCase());
    }));
  const sorted = serverSide ? filtered : [...filtered].sort((a, b) => {
    for (const { column, sort } of comparators) {
      const compare = column.sortComparator ?? compareValues;
      const result = compare(getColumnValue(a, column), getColumnValue(b, column));
      if (result) return sort.order === 'desc' ? -result : result;
    }
    return 0;
  });
  const count = serverSide ? totalCount ?? data.length : filtered.length;
  const lastPage = rowsPerPage === -1 ? 0 : Math.max(0, Math.ceil(count / rowsPerPage) - 1);
  // The backend owns page recovery. Preserve its page identity even when counts shrink.
  const safePage = serverSide ? page : Math.min(page, lastPage);
  return { filteredRows: sorted, count, page: safePage,
    rows: serverSide || rowsPerPage === -1 ? sorted : sorted.slice(safePage * rowsPerPage, (safePage + 1) * rowsPerPage) };
}
