// src/utils/formatDate.js
import { format } from "date-fns";
function normalizeDateFormat(pattern = "MM/dd/yyyy") {
  return pattern.replace(/YYYY/g, "yyyy").replace(/DD/g, "dd");
}
var formatDate = (timestamp, dateFormat = "MM/dd/yyyy") => {
  if (timestamp == null || timestamp === "") return "";
  try {
    if (timestamp instanceof Date) return format(timestamp, normalizeDateFormat(dateFormat));
    const hasTime = /[T\s]\d{2}:\d{2}/.test(timestamp) || // e.g. "2024-04-22 13:45" or "2024-04-22T13:45"
    /Z$/.test(timestamp) || // ends with Z (UTC)
    /[+-]\d{2}:\d{2}$/.test(timestamp);
    if (!hasTime) {
      const m = String(timestamp).match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (m) {
        const [, y, mo, d] = m;
        return format(new Date(Number(y), Number(mo) - 1, Number(d)), normalizeDateFormat(dateFormat));
      }
    }
    return format(new Date(timestamp), normalizeDateFormat(dateFormat));
  } catch {
    try {
      return format(timestamp, "MM/dd/yyyy");
    } catch {
      return "";
    }
  }
};
var DAY_MS = 24 * 60 * 60 * 1e3;

// src/util.js
function getByPath(obj, path) {
  if (!obj || !path) return void 0;
  return path.split(".").reduce((acc, key) => {
    if (acc == null) return void 0;
    return acc[key];
  }, obj);
}
function isIsoDateString(str) {
  if (typeof str !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}(?:[T ][\d:+\-.Z]+)?$/.test(str)) return false;
  const day = Date.parse(str.slice(0, 10));
  return Number.isFinite(day) && new Date(day).toISOString().slice(0, 10) === str.slice(0, 10) && Number.isFinite(Date.parse(str));
}
function toDisplayString(value, dateFormat = "MM/dd/yyyy") {
  if (value == null) return "";
  if (value instanceof Date) {
    return formatDate(value, dateFormat);
  }
  if (typeof value === "string" && isIsoDateString(value)) {
    return formatDate(value, dateFormat);
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "string") return value;
  return String(value);
}
function comparable(value, dataType = "auto") {
  if (value == null) return null;
  const numeric = (v) => typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  const date = (v) => v instanceof Date ? v.getTime() : isIsoDateString(v) ? Date.parse(v) : NaN;
  if (dataType === "number") {
    const n = numeric(value);
    return Number.isFinite(n) ? [1, n] : null;
  }
  if (dataType === "date") {
    const n = date(value);
    return Number.isFinite(n) ? [3, n] : null;
  }
  if (dataType === "boolean") return typeof value === "boolean" ? [2, Number(value)] : null;
  if (dataType === "string") return [4, String(value)];
  if (typeof value === "number") return Number.isFinite(value) ? [1, value] : null;
  if (typeof value === "boolean") return [2, Number(value)];
  if (value instanceof Date) {
    const n = date(value);
    return Number.isFinite(n) ? [3, n] : null;
  }
  if (typeof value === "string") {
    if (isIsoDateString(value)) return [3, Date.parse(value)];
    const n = numeric(value);
    if (Number.isFinite(n)) return [1, n];
    return [4, value];
  }
  return [5, String(value)];
}
function compareValues(a, b, { dataType = "auto", nulls = "last", order = "asc", locale } = {}) {
  const left = comparable(a, dataType), right = comparable(b, dataType);
  if (!left || !right) {
    if (!left && !right) return 0;
    return (!left ? 1 : -1) * (nulls === "first" ? -1 : 1);
  }
  const result = left[0] !== right[0] ? Math.sign(left[0] - right[0]) : typeof left[1] === "number" ? Math.sign(left[1] - right[1]) : Math.sign(left[1].localeCompare(right[1], locale, { numeric: true, sensitivity: "base" }));
  return order === "desc" ? -result : result;
}

// src/core/columns.js
function normalizeColumns(headers = []) {
  if (!Array.isArray(headers)) throw new TypeError("headers must be an array.");
  const used = /* @__PURE__ */ new Set();
  return headers.map((column) => {
    const field = column?.field ?? column?.id;
    if (typeof field !== "string" || !field.trim() || used.has(field)) {
      throw new Error("Columns require unique, nonempty field or id strings.");
    }
    if (column.dataType !== void 0 && !["auto", "string", "number", "boolean", "date"].includes(column.dataType)) throw new Error("Invalid column dataType.");
    if (column.nulls !== void 0 && !["first", "last"].includes(column.nulls)) throw new Error("Invalid column nulls policy.");
    used.add(field);
    return {
      ...column,
      field,
      label: column.label ?? field,
      ...column.type === "display" ? {
        sortable: false,
        searchable: false,
        filterable: false,
        enableExport: false
      } : {}
    };
  });
}
function getColumnValue(row, column) {
  if (column.type === "display") return void 0;
  if (column.valueGetter) return column.valueGetter(row);
  if (column.fields?.length) {
    return column.fields.map((path) => toDisplayString(getByPath(row, path), column.dateFormat)).join(column.separator ?? "") + (column.suffix ?? "");
  }
  return getByPath(row, column.field);
}
function getColumnText(row, column) {
  const value = getColumnValue(row, column);
  return toDisplayString(value, column.dateFormat) + (!column.valueGetter && column.fields?.length ? "" : column.suffix ?? "");
}
function headersToExportColumns(headers) {
  return headers.map((header) => ({
    id: header.field,
    header: header.label,
    enableExport: header.type === "display" ? false : header.enableExport,
    exportValue: header.exportValue ?? ((row) => getColumnValue(row, header))
  }));
}

// src/core/rows.js
function getFilteredRows({ data = [], headers = [], searchText = "", columnFilters = {}, sorting = [], serverSide = false }) {
  if (!Array.isArray(data) || !Array.isArray(headers)) throw new TypeError("data and headers must be arrays.");
  const dataColumns = headers.filter((column) => column.type !== "display");
  const sortColumns = new Map(dataColumns.map((column) => [column.field, column]));
  const comparators = sorting.flatMap((sort) => {
    const column = sortColumns.get(sort.field);
    return !column || column.sortable === false ? [] : [{ column, sort }];
  });
  const search = String(searchText).trim().toLocaleLowerCase();
  const filtered = serverSide ? data : data.filter((row) => (!search || dataColumns.some((column) => column.searchable !== false && getColumnText(row, column).toLocaleLowerCase().includes(search))) && dataColumns.every((column) => {
    const filter = Object.hasOwn(columnFilters, column.field) ? columnFilters[column.field] : void 0;
    if (filter == null || filter === "" || column.filterable === false) return true;
    return column.filterFn ? column.filterFn(getColumnValue(row, column), filter, row) : getColumnText(row, column).toLocaleLowerCase().includes(String(filter).toLocaleLowerCase());
  }));
  const sorted = serverSide ? filtered : [...filtered].sort((a, b) => {
    for (const { column, sort } of comparators) {
      const left = getColumnValue(a, column), right = getColumnValue(b, column);
      const result = column.sortComparator ? column.sortComparator(left, right) * (sort.order === "desc" ? -1 : 1) : compareValues(left, right, { dataType: column.dataType, nulls: column.nulls, order: sort.order, locale: column.locale });
      if (result) return result;
    }
    return 0;
  });
  return sorted;
}
function paginateRows({ filteredRows, page = 0, rowsPerPage = 5, serverSide = false, totalCount }) {
  if (!Number.isSafeInteger(page) || page < 0) throw new RangeError("page must be a nonnegative integer.");
  if (rowsPerPage !== -1 && (!Number.isSafeInteger(rowsPerPage) || rowsPerPage < 1)) {
    throw new RangeError("rowsPerPage must be a positive integer or -1 (All).");
  }
  if (totalCount !== void 0 && (!Number.isSafeInteger(totalCount) || totalCount < 0)) {
    throw new RangeError("totalCount must be a nonnegative integer.");
  }
  const count = serverSide ? totalCount ?? filteredRows.length : filteredRows.length;
  const lastPage = rowsPerPage === -1 ? 0 : Math.max(0, Math.ceil(count / rowsPerPage) - 1);
  const safePage = serverSide ? page : Math.min(page, lastPage);
  return {
    filteredRows,
    count,
    page: safePage,
    rows: serverSide || rowsPerPage === -1 ? filteredRows : filteredRows.slice(safePage * rowsPerPage, (safePage + 1) * rowsPerPage)
  };
}
function buildRowModel(options = {}) {
  return paginateRows({ ...options, filteredRows: getFilteredRows(options) });
}

// src/core/state.js
var QUERY_KEYS = ["page", "rowsPerPage", "searchText", "columnFilters", "sorting"];
var object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
function validateTableState(state) {
  if (!object(state)) throw new TypeError("Table state must be an object.");
  for (const key of Object.keys(state)) {
    if (!QUERY_KEYS.includes(key)) throw new Error(`Unknown table state key: ${key}`);
  }
  if (!Number.isSafeInteger(state.page) || state.page < 0) throw new RangeError("page must be a nonnegative safe integer.");
  if (state.rowsPerPage !== -1 && (!Number.isSafeInteger(state.rowsPerPage) || state.rowsPerPage < 1)) {
    throw new RangeError("rowsPerPage must be a positive safe integer or -1.");
  }
  if (typeof state.searchText !== "string") throw new TypeError("searchText must be a string.");
  if (!object(state.columnFilters)) throw new TypeError("columnFilters must be an object.");
  if (!Array.isArray(state.sorting) || state.sorting.some((sort) => !sort || typeof sort.field !== "string" || !sort.field || !["asc", "desc"].includes(sort.order))) {
    throw new TypeError("sorting must contain { field, order: asc or desc } descriptors.");
  }
  const fields = state.sorting.map((sort) => sort.field);
  if (new Set(fields).size !== fields.length) throw new Error("Sort fields must be unique.");
  return state;
}
function createTableState(partial = {}) {
  return validateTableState({ page: 0, rowsPerPage: 5, searchText: "", columnFilters: {}, sorting: [], ...partial });
}
var sameRecord = (a, b) => Object.keys(a).length === Object.keys(b).length && Object.keys(a).every((key) => Object.hasOwn(b, key) && Object.is(a[key], b[key]));
function changedQueryKeys(a, b) {
  return QUERY_KEYS.filter((key) => key === "sorting" ? a.sorting.length !== b.sorting.length || a.sorting.some((sort, index) => sort.field !== b.sorting[index]?.field || sort.order !== b.sorting[index]?.order) : key === "columnFilters" ? !sameRecord(a[key], b[key]) : !Object.is(a[key], b[key]));
}
function transitionTableState(previous, change) {
  const patch = typeof change === "function" ? change(previous) : change;
  if (!object(patch)) throw new TypeError("update must return a state patch object.");
  const reset = ["searchText", "columnFilters", "sorting", "rowsPerPage"].some((key) => Object.hasOwn(patch, key));
  const next = validateTableState({ ...previous, ...reset ? { page: 0 } : {}, ...patch });
  const changedKeys = changedQueryKeys(previous, next);
  const type = changedKeys.length === 1 ? changedKeys[0] : "query";
  return { next, event: { type, changedKeys, previousState: previous } };
}
function toTableQuery(state) {
  return {
    ...state,
    sortBy: state.sorting[0]?.field ?? "",
    sortDir: state.sorting[0]?.order ?? "asc",
    selectedColumns: state.sorting
  };
}

export {
  getByPath,
  normalizeColumns,
  getColumnValue,
  getColumnText,
  headersToExportColumns,
  getFilteredRows,
  paginateRows,
  buildRowModel,
  QUERY_KEYS,
  validateTableState,
  createTableState,
  transitionTableState,
  toTableQuery
};
//# sourceMappingURL=chunk-AVPCDLU4.js.map