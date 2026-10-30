import { formatDate } from "./utils/formatDate";

export function getByPath(obj, path) {
    if (!obj || !path) return undefined;
    return path.split(".").reduce((acc, key) => {
        if (acc == null) return undefined;
        return acc[key];
    }, obj);
}

export function isIsoDateString(str) {
    if (typeof str !== "string") return false;
    if (!/^\d{4}-\d{2}-\d{2}(?:[T ][\d:+\-.Z]+)?$/.test(str)) return false;
    const day = Date.parse(str.slice(0, 10));
    return Number.isFinite(day) && new Date(day).toISOString().slice(0, 10) === str.slice(0, 10) && Number.isFinite(Date.parse(str));
}

export function toDisplayString(value, dateFormat = "MM/dd/yyyy") {
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

/** Typed comparison with a total order. Invalid values share the null bucket. */
export function comparable(value, dataType = 'auto') {
    if (value == null) return null;
    const numeric = v => typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : NaN;
    const date = v => v instanceof Date ? v.getTime() : isIsoDateString(v) ? Date.parse(v) : NaN;
    if (dataType === 'number') { const n = numeric(value); return Number.isFinite(n) ? [1, n] : null; }
    if (dataType === 'date') { const n = date(value); return Number.isFinite(n) ? [3, n] : null; }
    if (dataType === 'boolean') return typeof value === 'boolean' ? [2, Number(value)] : null;
    if (dataType === 'string') return [4, String(value)];
    if (typeof value === 'number') return Number.isFinite(value) ? [1, value] : null;
    if (typeof value === 'boolean') return [2, Number(value)];
    if (value instanceof Date) { const n = date(value); return Number.isFinite(n) ? [3, n] : null; }
    if (typeof value === 'string') {
        if (isIsoDateString(value)) return [3, Date.parse(value)];
        const n = numeric(value);
        if (Number.isFinite(n)) return [1, n];
        return [4, value];
    }
    return [5, String(value)];
}

export function compareValues(a, b, { dataType = 'auto', nulls = 'last', order = 'asc', locale } = {}) {
    const left = comparable(a, dataType), right = comparable(b, dataType);
    if (!left || !right) {
        if (!left && !right) return 0;
        return (!left ? 1 : -1) * (nulls === 'first' ? -1 : 1);
    }
    const result = left[0] !== right[0] ? Math.sign(left[0] - right[0]) :
        typeof left[1] === 'number' ? Math.sign(left[1] - right[1]) :
            Math.sign(left[1].localeCompare(right[1], locale, { numeric: true, sensitivity: 'base' }));
    return order === 'desc' ? -result : result;
}

// Apply ascending/descending
function applyOrder(result, order) {
    return order === 'desc' ? -result : result; // 'asc' or anything else -> ascending
}

// Build a comparator from multiple selected columns
function buildMultiComparator(selectedColumns = []) {
    return (a, b) => {
        for (const col of selectedColumns) {
            const field = col?.field;
            if (!field) continue;

            const order = col?.order || 'asc';
            const res = compareValues(getByPath(a, field), getByPath(b, field));

            if (res !== 0) {
                return applyOrder(res, order);
            }
        }
        return 0;
    };
}

// Build a comparator from single orderBy + order
function buildSingleComparator(orderBy, order = 'asc') {
    if (!orderBy) return () => 0;
    return (a, b) => applyOrder(compareValues(getByPath(a, orderBy), getByPath(b, orderBy)), order);
}

// Main sort function
export function sortData(data = [], { selectedColumns = [], orderBy, order = 'asc' } = {}) {
    if (!Array.isArray(data) || data.length === 0) return data;

    const hasMulti = Array.isArray(selectedColumns) && selectedColumns.length > 0;
    const comparator = hasMulti
        ? buildMultiComparator(selectedColumns)
        : buildSingleComparator(orderBy, order);

    // Avoid mutating the original array
    return data.slice().sort(comparator);
}
