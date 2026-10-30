import { getColumnValue, getColumnText } from './columns.js';
import { compareValues } from '../util.js';

export function getFilteredRows({ data = [], headers = [], searchText = '', columnFilters = {}, sorting = [], serverSide = false }) {
  if (!Array.isArray(data) || !Array.isArray(headers)) throw new TypeError('data and headers must be arrays.');
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
      const left = getColumnValue(a, column), right = getColumnValue(b, column);
      const result = column.sortComparator
        ? column.sortComparator(left, right) * (sort.order === 'desc' ? -1 : 1)
        : compareValues(left, right, { dataType: column.dataType, nulls: column.nulls, order: sort.order, locale: column.locale });
      if (result) return result;
    }
    return 0;
  });
  return sorted;
}

export function paginateRows({ filteredRows, page = 0, rowsPerPage = 5, serverSide = false, totalCount }) {
  if (!Number.isSafeInteger(page) || page < 0) throw new RangeError('page must be a nonnegative integer.');
  if (rowsPerPage !== -1 && (!Number.isSafeInteger(rowsPerPage) || rowsPerPage < 1)) {
    throw new RangeError('rowsPerPage must be a positive integer or -1 (All).');
  }
  if (totalCount !== undefined && (!Number.isSafeInteger(totalCount) || totalCount < 0)) {
    throw new RangeError('totalCount must be a nonnegative integer.');
  }
  const count = serverSide ? totalCount ?? filteredRows.length : filteredRows.length;
  const lastPage = rowsPerPage === -1 ? 0 : Math.max(0, Math.ceil(count / rowsPerPage) - 1);
  // The backend owns page recovery. Preserve its page identity even when counts shrink.
  const safePage = serverSide ? page : Math.min(page, lastPage);
  return { filteredRows, count, page: safePage,
    rows: serverSide || rowsPerPage === -1 ? filteredRows : filteredRows.slice(safePage * rowsPerPage, (safePage + 1) * rowsPerPage) };
}

export function buildRowModel(options = {}) {
  return paginateRows({ ...options, filteredRows: getFilteredRows(options) });
}
