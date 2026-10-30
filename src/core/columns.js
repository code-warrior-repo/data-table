import { getByPath, toDisplayString } from '../util.js';

/** Stable identities and capability defaults for data and display-only columns. */
export function normalizeColumns(headers = []) {
  if (!Array.isArray(headers)) throw new TypeError('headers must be an array.');
  const used = new Set();
  return headers.map(column => {
    const field = column?.field ?? column?.id;
    if (typeof field !== 'string' || !field.trim() || used.has(field)) {
      throw new Error('Columns require unique, nonempty field or id strings.');
    }
    used.add(field);
    return { ...column, field, label: column.label ?? field,
      ...(column.type === 'display' ? {
        sortable: false, searchable: false, filterable: false, enableExport: false
      } : {}) };
  });
}

/** One value contract for rendering, searching, sorting and exporting. */
export function getColumnValue(row, column) {
  if (column.type === 'display') return undefined;
  if (column.valueGetter) return column.valueGetter(row);
  if (column.fields?.length) {
    return column.fields.map(path => toDisplayString(getByPath(row, path), column.dateFormat))
      .join(column.separator ?? '') + (column.suffix ?? '');
  }
  return getByPath(row, column.field);
}

export function getColumnText(row, column) {
  const value = getColumnValue(row, column);
  return toDisplayString(value, column.dateFormat) + (column.fields?.length ? '' : column.suffix ?? '');
}

export function headersToExportColumns(headers) {
  return headers.map(header => ({
    id: header.field,
    header: header.label,
    enableExport: header.type === 'display' ? false : header.enableExport,
    exportValue: header.exportValue ?? (row => getColumnText(row, header))
  }));
}
