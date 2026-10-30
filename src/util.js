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
    return /^\d{4}-\d{2}-\d{2}(?:[T ][\d:+\-.Z]+)?$/.test(str);
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

// Generic value comparison with null/undefined safety and basic type handling
export function compareValues(a, b) {
    if (areBothNullish(a, b)) return 0;
    if (isNullish(a)) return -1;
    if (isNullish(b)) return 1;

    // Dates
    if (isDateLike(a) || isDateLike(b)) {
        return compareDates(a, b);
    }

    // Numbers
    const aNum = toNumberOrNull(a);
    const bNum = toNumberOrNull(b);
    if (aNum != null && bNum != null) {
        return compareNumbers(aNum, bNum);
    }

    // Strings
    return compareStrings(String(a), String(b));
}

/* ---------- Helpers ---------- */

function isNullish(v) {
    return v == null;
}

function areBothNullish(a, b) {
    return isNullish(a) && isNullish(b);
}

function isDateLike(v) {
    return v instanceof Date || (isIsoDateString(v) && Number.isFinite(Date.parse(v)));
}

function compareDates(a, b) {
    const aTime = a instanceof Date ? a.getTime() : new Date(a).getTime();
    const bTime = b instanceof Date ? b.getTime() : new Date(b).getTime();
    return compareNumbers(aTime, bTime);
}

function toNumberOrNull(v) {
    if (typeof v === "number") return v;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

function compareNumbers(a, b) {
    if (a === b) return 0;
    if (a < b) return -1;
    return 1;
}

function compareStrings(a, b) {
    return Math.sign(a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
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
