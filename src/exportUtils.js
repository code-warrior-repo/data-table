// exportUtils.js
// Shared helpers for building consistent column accessors across formats.

import { getByPath, toDisplayString } from './util';

/**
 * Small helper to append suffix when present.
 */
function withSuffix(value, suffix = '') {
    return suffix ? `${value}${suffix}` : value;
}

/**
 * Normalize header config and build a single accessor object.
 */
function makeAccessor(h) {
    const key = (h.key ?? h.field ?? '').trim();
    const label = h.label ?? key;

    if (!key) {
        // No stable key: create a no-op accessor (skipped downstream)
        return { key: '', label, getValue: () => '' };
    }

    const suffix = h.suffix ?? '';
    const sep = h.separator ?? '';

    // If composite fields are present, use them; otherwise single field path.
    const fields = Array.isArray(h.fields) && h.fields.length > 0
        ? h.fields.filter(Boolean)
        : null;

    const path = fields ? null : (h.field ?? '');
    const dateFormat = h.dateFormat;

    const getValue = fields
        // Composite column: format each field value individually and join with separator
        ? (row) => withSuffix(
            fields.map((p) => toDisplayString(getByPath(row, p))).join(sep),
            suffix
        )
        // Single column: format single value, supporting dateFormat
        : (row) => withSuffix(
            toDisplayString(getByPath(row, path), dateFormat),
            suffix
        );

    return { key, label, getValue };
}

/**
 * Build accessors for all headers.
 * - Supports composite columns via `fields + separator + suffix`
 * - Supports single columns via `field + dateFormat + suffix`
 * - Uses `key` (or `field`) as the column key in exported outputs
 * - Provides a readable column `label`
 */
export function buildHeaderAccessors(headers) {
    return headers.map(makeAccessor);
}

/** Sanitize text for plain formats (e.g., tabs/newlines in TXT) */
export function sanitizePlainText(text) {
    return String(text == null ? '' : text)
        .replace(/\t/g, ' ')
        .replace(/\r?\n/g, ' ');
}

/**
 * Timestamp helper for filenames (MMDDYYYYHHMMSS, in UTC).
 * Using UTC ensures deterministic output across environments.
 */
export function timestamp(date = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = date.getUTCFullYear();
    const MM = pad(date.getUTCMonth() + 1);
    const dd = pad(date.getUTCDate());
    const HH = pad(date.getUTCHours());
    const mm = pad(date.getUTCMinutes());
    const ss = pad(date.getUTCSeconds());
    return `${MM}${dd}${yyyy}${HH}${mm}${ss}`;
}
