import {format} from "date-fns";

export function normalizeDateFormat(pattern = 'MM/dd/yyyy') {
  return pattern
      .replace(/YYYY/g, 'yyyy')
      .replace(/DD/g, 'dd');
}

export const formatDate = (timestamp, dateFormat = 'MM/dd/yyyy') => {
  if (timestamp == null || timestamp === '') return '';

  try {
    if (timestamp instanceof Date) return format(timestamp, normalizeDateFormat(dateFormat));

    // Detect if the string has an explicit time component or timezone
    const hasTime =
        /[T\s]\d{2}:\d{2}/.test(timestamp) || // e.g. "2024-04-22 13:45" or "2024-04-22T13:45"
        /Z$/.test(timestamp) ||               // ends with Z (UTC)
        /[+-]\d{2}:\d{2}$/.test(timestamp);   // has timezone offset e.g. +05:30

    if (!hasTime) {
      // If it's a pure date (YYYY-MM-DD), construct using local components
      const m = String(timestamp).match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (m) {
        const [, y, mo, d] = m;
        // Local midnight (avoids UTC shift)
        return format(new Date(Number(y), Number(mo) - 1, Number(d)), normalizeDateFormat(dateFormat));
      }
      // You can add more branches here for other date-only formats like "MM/DD/YYYY", etc.
    }
    return format(new Date(timestamp), normalizeDateFormat(dateFormat));
  } catch {
    try {
      return format(timestamp, 'MM/dd/yyyy');
    } catch {
      return '';
    }
  }
};

// ===== Helpers =====
export const DAY_MS = 24 * 60 * 60 * 1000;

export const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}


export const daysBetween = (a, b) => {
  const aa = startOfDay(a);
  const bb = startOfDay(b);
  // If either is invalid, return NaN
  if (isNaN(aa) || isNaN(bb)) return NaN;
  return Math.round((aa - bb) / DAY_MS);
}

/* javascript:S5869*/
export const  isIsoDateString = (str) => {
  if (typeof str !== 'string') return false;
  // Matches YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss(.sss)?(Z|±HH:mm)?
  return /^\d{4}-\d{2}-\d{2}(?:[T ][\d:.+-Z]+)?$/.test(str);
}
export const parseLocalDateOnly = (isoDateOnlyOrUTC) => {
  // If format is YYYY-MM-DD, parse as local
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDateOnlyOrUTC);
  if (m) {
    const [, y, mm, dd] = m;
    return new Date(Number(y), Number(mm) - 1, Number(dd)); // local midnight
  }
  // Otherwise, fall back to Date() and then adjust to local start of day
  return startOfDay(new Date(isoDateOnlyOrUTC));
}

/**
 * Allow only Mondays that are exactly 14n days after the anchor (n >= 1).
 */
export const isAllowedBiweeklyMonday = (date, anchor) => {
  if (!(date instanceof Date) || isNaN(date)) return false;
  if (!(anchor instanceof Date) || isNaN(anchor)) return false;
  const isMonday = date.getDay() === 1; // Monday
  const diff = daysBetween(date, anchor);
  if (Number.isNaN(diff)) return false;
  // Must be strictly after anchor and aligned to 14-day cadence
  return isMonday && diff > 0 && diff % 14 === 0;
}
