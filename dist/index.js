'use client';

// src/DynamicTable.jsx
import React7, { useEffect, useMemo as useMemo2, useRef as useRef3, useState as useState5 } from "react";
import {
  Alert as Alert2,
  Box as Box2,
  Checkbox as Checkbox2,
  IconButton as IconButton6,
  LinearProgress,
  Paper,
  Stack as Stack2,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableSortLabel,
  TextField as TextField2,
  Tooltip as Tooltip6,
  Typography
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import DensityMediumIcon from "@mui/icons-material/DensityMedium";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import EmailIcon from "@mui/icons-material/Email";
import InfoIcon from "@mui/icons-material/Info";

// src/Search.jsx
import React, { useState } from "react";
import { TextField, IconButton, Box } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import PropTypes from "prop-types";
import Tooltip from "@mui/material/Tooltip";
var Search = ({ searchText, handleSearchTextChange }) => {
  const [showSearch, setShowSearch] = useState(false);
  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      handleSearchTextChange({ target: { value: "" } });
    }
  };
  return /* @__PURE__ */ React.createElement(Box, { display: "flex", alignItems: "center" }, showSearch && /* @__PURE__ */ React.createElement(
    TextField,
    {
      label: "Search",
      variant: "outlined",
      value: searchText,
      onChange: handleSearchTextChange,
      slotProps: { htmlInput: { "data-testid": "search-input" } },
      margin: "normal",
      size: "small"
    }
  ), /* @__PURE__ */ React.createElement(Tooltip, { title: showSearch ? "Close" : "Search" }, /* @__PURE__ */ React.createElement(
    IconButton,
    {
      onClick: toggleSearch,
      "aria-label": showSearch ? "Close search" : "Open search"
    },
    showSearch ? /* @__PURE__ */ React.createElement(CloseIcon, { "aria-hidden": "true" }) : /* @__PURE__ */ React.createElement(SearchIcon, { "aria-hidden": "true" })
  )));
};
Search.propTypes = {
  searchText: PropTypes.string.isRequired,
  handleSearchTextChange: PropTypes.func.isRequired
};
var Search_default = Search;

// src/ExportOptions.jsx
import React2, { useRef, useState as useState2 } from "react";
import { Alert, IconButton as IconButton2, Menu, MenuItem, Snackbar, Tooltip as Tooltip2 } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

// src/exports.js
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1e3);
}
function csvCell(value) {
  const text = value == null ? "" : String(value);
  const safe = /^[\s]*[=+@\-]|^[\t\r\n]/.test(text) ? "'" + text : text;
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}
function exportColumns(columns) {
  return columns.flatMap((column) => {
    if (column.enableExport === false) return [];
    if (column.columns) return exportColumns(column.columns);
    return column.accessorKey || column.accessorFn || column.exportValue ? [column] : [];
  });
}
function getExportData({ rows, columns }) {
  const fields = exportColumns(columns);
  return {
    headers: fields.map((c) => String(c.exportHeader ?? (typeof c.header === "string" ? c.header : c.id ?? c.accessorKey ?? ""))),
    keys: fields.map((c, index) => String(c.id ?? c.accessorKey ?? `column${index + 1}`)),
    values: rows.map((row, index) => fields.map((c) => c.exportValue ? c.exportValue(row, index) : c.accessorFn ? c.accessorFn(row, index) : c.accessorKey.split(".").reduce((value, key) => value?.[key], row)))
  };
}
function textValue(value) {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}
function rowsToCsv(context) {
  const { headers, values } = getExportData(context);
  return [headers, ...values].map((row) => row.map((value) => csvCell(textValue(value))).join(",")).join("\r\n");
}
function rowsToTxt(context) {
  const { headers, values } = getExportData(context);
  const escape = (value) => textValue(value).replaceAll("\\", "\\\\").replaceAll("	", "\\t").replaceAll("\r", "\\r").replaceAll("\n", "\\n");
  return [headers, ...values].map((row) => row.map(escape).join("	")).join("\r\n");
}
function rowsToJson(context) {
  const { keys, values } = getExportData(context);
  const used = /* @__PURE__ */ new Set();
  const uniqueKeys = keys.map((key) => {
    let unique = key;
    let suffix = 2;
    while (used.has(unique)) unique = `${key}_${suffix++}`;
    used.add(unique);
    return unique;
  });
  return JSON.stringify(values.map((row) => Object.fromEntries(uniqueKeys.map((key, index) => [key, row[index] ?? null]))), null, 2);
}
function exportRowsAsCsv({ filename = "table.csv", ...context }) {
  downloadBlob(new Blob(["\uFEFF", rowsToCsv(context)], { type: "text/csv;charset=utf-8" }), filename);
}
function exportRowsAsTxt({ filename = "table.txt", ...context }) {
  downloadBlob(new Blob([rowsToTxt(context)], { type: "text/plain;charset=utf-8" }), filename);
}
function exportRowsAsJson({ filename = "table.json", ...context }) {
  downloadBlob(new Blob([rowsToJson(context)], { type: "application/json;charset=utf-8" }), filename);
}
async function createXlsxBlob(context) {
  const module = await import("exceljs");
  const ExcelJS = module.default ?? module;
  const { headers, values } = getExportData(context);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Results");
  sheet.addRow(headers);
  values.forEach((row) => sheet.addRow(row.map((value) => value == null ? null : typeof value === "number" || typeof value === "boolean" || value instanceof Date ? value : textValue(value))));
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.columns.forEach((column) => {
    column.width = 24;
  });
  return new Blob([await workbook.xlsx.writeBuffer()], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
}
async function exportRowsAsXlsx({ filename = "table.xlsx", ...context }) {
  downloadBlob(await createXlsxBlob(context), filename);
}
async function createPdfBlob(context) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const { headers, values } = getExportData(context);
  const doc = new jsPDF({ orientation: "landscape" });
  if (context.title) doc.text(String(context.title), 14, 15);
  autoTable(doc, {
    head: [headers],
    body: values.map((row) => row.map(textValue)),
    startY: context.title ? 22 : 14,
    styles: { fontSize: 9, overflow: "linebreak" },
    horizontalPageBreak: true,
    showHead: "everyPage"
  });
  return doc.output("blob");
}
async function exportRowsAsPdf({ filename = "table.pdf", ...context }) {
  downloadBlob(await createPdfBlob(context), filename);
}
var defaultExportHandlers = {
  pdf: exportRowsAsPdf,
  txt: exportRowsAsTxt,
  json: exportRowsAsJson,
  xlsx: exportRowsAsXlsx,
  csv: exportRowsAsCsv
};
async function exportWithEndpoint({ url, filename, fetcher = fetch, signal, method = "GET", body }) {
  const response = await fetcher(url, { method, signal, credentials: "same-origin", ...body == null ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } });
  if (!response.ok) throw new Error(`Export failed (${response.status})`);
  downloadBlob(await response.blob(), filename);
}

// src/utils/formatDate.js
import { format } from "date-fns";
function normalizeDateFormat(pattern = "MM/dd/yyyy") {
  return pattern.replace(/YYYY/g, "yyyy").replace(/DD/g, "dd");
}
var formatDate = (timestamp2, dateFormat = "MM/dd/yyyy") => {
  if (timestamp2 == null || timestamp2 === "") return "";
  try {
    if (timestamp2 instanceof Date) return format(timestamp2, normalizeDateFormat(dateFormat));
    const hasTime = /[T\s]\d{2}:\d{2}/.test(timestamp2) || // e.g. "2024-04-22 13:45" or "2024-04-22T13:45"
    /Z$/.test(timestamp2) || // ends with Z (UTC)
    /[+-]\d{2}:\d{2}$/.test(timestamp2);
    if (!hasTime) {
      const m = String(timestamp2).match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (m) {
        const [, y, mo, d] = m;
        return format(new Date(Number(y), Number(mo) - 1, Number(d)), normalizeDateFormat(dateFormat));
      }
    }
    return format(new Date(timestamp2), normalizeDateFormat(dateFormat));
  } catch {
    try {
      return format(timestamp2, "MM/dd/yyyy");
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
  return /^\d{4}-\d{2}-\d{2}(?:[T ][\d:+\-.Z]+)?$/.test(str);
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
function compareValues(a, b) {
  if (areBothNullish(a, b)) return 0;
  if (isNullish(a)) return -1;
  if (isNullish(b)) return 1;
  if (isDateLike(a) || isDateLike(b)) {
    return compareDates(a, b);
  }
  const aNum = toNumberOrNull(a);
  const bNum = toNumberOrNull(b);
  if (aNum != null && bNum != null) {
    return compareNumbers(aNum, bNum);
  }
  return compareStrings(String(a), String(b));
}
function isNullish(v) {
  return v == null;
}
function areBothNullish(a, b) {
  return isNullish(a) && isNullish(b);
}
function isDateLike(v) {
  return v instanceof Date || isIsoDateString(v) && Number.isFinite(Date.parse(v));
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
  return Math.sign(a.localeCompare(b, void 0, { numeric: true, sensitivity: "base" }));
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
  return toDisplayString(value, column.dateFormat) + (column.fields?.length ? "" : column.suffix ?? "");
}
function headersToExportColumns(headers) {
  return headers.map((header) => ({
    id: header.field,
    header: header.label,
    enableExport: header.type === "display" ? false : header.enableExport,
    exportValue: header.exportValue ?? ((row) => getColumnText(row, header))
  }));
}

// src/exportUtils.js
function timestamp(date = /* @__PURE__ */ new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = date.getUTCFullYear();
  const MM = pad(date.getUTCMonth() + 1);
  const dd = pad(date.getUTCDate());
  const HH = pad(date.getUTCHours());
  const mm = pad(date.getUTCMinutes());
  const ss = pad(date.getUTCSeconds());
  return `${MM}${dd}${yyyy}${HH}${mm}${ss}`;
}

// src/ExportOptions.jsx
function ExportOptions({
  data = [],
  headers,
  pageTitle = "",
  fetchAllRows,
  exportOptions = {},
  exportHandlers = {},
  state,
  disabled = false
}) {
  const [anchor, setAnchor] = useState2(null);
  const [busy, setBusy] = useState2(false);
  const lock = useRef(false);
  const [error, setError] = useState2("");
  async function run(format2) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setAnchor(null);
    try {
      const rows = fetchAllRows ? await fetchAllRows() : data;
      if (!Array.isArray(rows)) throw new Error("Export must return an array of rows.");
      const filename = `${pageTitle.replace(/[^a-z0-9_-]+/gi, "_") || "table"}_${timestamp()}.${format2}`;
      await (exportHandlers[format2] ?? defaultExportHandlers[format2])({
        rows,
        columns: headersToExportColumns(headers),
        title: pageTitle,
        filename,
        state
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Export failed.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return /* @__PURE__ */ React2.createElement(React2.Fragment, null, /* @__PURE__ */ React2.createElement(Tooltip2, { title: "Export" }, /* @__PURE__ */ React2.createElement("span", null, /* @__PURE__ */ React2.createElement(
    IconButton2,
    {
      "aria-label": "Export menu",
      disabled: busy || disabled,
      onClick: (event) => setAnchor(event.currentTarget)
    },
    /* @__PURE__ */ React2.createElement(FileDownloadIcon, null)
  ))), /* @__PURE__ */ React2.createElement(Menu, { anchorEl: anchor, open: Boolean(anchor), onClose: () => setAnchor(null) }, ["csv", "txt", "xlsx", "pdf", "json"].filter((format2) => exportOptions[format2] ?? format2 !== "json").map((format2) => /* @__PURE__ */ React2.createElement(MenuItem, { key: format2, onClick: () => run(format2) }, format2.toUpperCase()))), /* @__PURE__ */ React2.createElement(Snackbar, { open: Boolean(error), autoHideDuration: 6e3, onClose: () => setError("") }, /* @__PURE__ */ React2.createElement(Alert, { severity: "error", onClose: () => setError("") }, error)));
}

// src/MultiColumnSort.jsx
import React3, { useState as useState3 } from "react";
import { IconButton as IconButton3, Menu as Menu2, MenuItem as MenuItem2, Checkbox, ListItemText, Divider } from "@mui/material";
import SortIcon from "@mui/icons-material/Sort";
import PropTypes2 from "prop-types";
import Tooltip3 from "@mui/material/Tooltip";
var MultiColumnSort = ({ headers, selectedColumns, handleSortChange }) => {
  const [anchorEl, setAnchorEl] = useState3(null);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleToggle = (field) => {
    const currentIndex = selectedColumns.findIndex((col) => col.field === field);
    const newSelectedColumns = [...selectedColumns];
    if (currentIndex === -1) {
      newSelectedColumns.push({ field, order: "asc" });
    } else {
      if (newSelectedColumns[currentIndex].order === "asc") {
        newSelectedColumns[currentIndex] = { field, order: "desc" };
      } else {
        newSelectedColumns.splice(currentIndex, 1);
      }
    }
    handleSortChange(newSelectedColumns);
  };
  const handleClearSorting = () => {
    handleSortChange([]);
    handleClose();
  };
  return /* @__PURE__ */ React3.createElement("div", null, /* @__PURE__ */ React3.createElement(IconButton3, { "aria-label": "Multi-column sort", onClick: handleClick }, /* @__PURE__ */ React3.createElement(Tooltip3, { title: "Multi-column sort" }, /* @__PURE__ */ React3.createElement(SortIcon, null))), /* @__PURE__ */ React3.createElement(
    Menu2,
    {
      anchorEl,
      open: Boolean(anchorEl),
      onClose: handleClose
    },
    headers.map((header) => /* @__PURE__ */ React3.createElement(MenuItem2, { key: header.field, onClick: () => handleToggle(header.field) }, /* @__PURE__ */ React3.createElement(
      Checkbox,
      {
        checked: selectedColumns.some((col) => col.field === header.field),
        indeterminate: selectedColumns.some((col) => col.field === header.field && col.order === "desc")
      }
    ), /* @__PURE__ */ React3.createElement(ListItemText, { primary: header.label }))),
    /* @__PURE__ */ React3.createElement(Divider, null),
    /* @__PURE__ */ React3.createElement(MenuItem2, { onClick: handleClearSorting }, "Clear Sorting")
  ));
};
MultiColumnSort.propTypes = {
  headers: PropTypes2.arrayOf(PropTypes2.shape({
    label: PropTypes2.string.isRequired,
    field: PropTypes2.string.isRequired
  })).isRequired,
  selectedColumns: PropTypes2.arrayOf(PropTypes2.shape({
    field: PropTypes2.string.isRequired,
    order: PropTypes2.string.isRequired
  })).isRequired,
  handleSortChange: PropTypes2.func.isRequired
};
var MultiColumnSort_default = MultiColumnSort;

// src/ThemeSelector.jsx
import React4 from "react";
import { IconButton as IconButton4, Menu as Menu3, MenuItem as MenuItem3 } from "@mui/material";
import PaletteIcon from "@mui/icons-material/Palette";
import PropTypes3 from "prop-types";

// src/themes.js
import { createTheme } from "@mui/material/styles";
var themes = {
  default: createTheme({
    palette: {
      primary: {
        main: "#008000"
      },
      secondary: {
        main: "#ff4081"
      }
    }
  }),
  grey: createTheme({
    palette: {
      primary: {
        main: "#9e9e9e"
        // grey 500
      },
      secondary: {
        main: "#bdbdbd"
        // grey 400
      }
    }
  }),
  blue: createTheme({
    palette: {
      primary: {
        main: "#1976d2"
      },
      secondary: {
        main: "#ff4081"
      }
    }
  }),
  light: createTheme({
    palette: {
      mode: "light",
      primary: {
        main: "#90caf9"
      },
      secondary: {
        main: "#f48fb1"
      }
    }
  })
};

// src/ThemeSelector.jsx
import Tooltip4 from "@mui/material/Tooltip";
var ThemeSelector = ({ handleThemeChange }) => {
  const [anchorEl, setAnchorEl] = React4.useState(null);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = (theme) => {
    setAnchorEl(null);
    if (theme) {
      handleThemeChange(theme);
    }
  };
  return /* @__PURE__ */ React4.createElement("div", null, /* @__PURE__ */ React4.createElement(IconButton4, { "aria-label": "theme selector", onClick: handleClick }, /* @__PURE__ */ React4.createElement(Tooltip4, { title: "Select Theme" }, /* @__PURE__ */ React4.createElement(PaletteIcon, null))), /* @__PURE__ */ React4.createElement(
    Menu3,
    {
      anchorEl,
      open: Boolean(anchorEl),
      onClose: () => handleClose(null)
    },
    Object.keys(themes).map((theme) => /* @__PURE__ */ React4.createElement(MenuItem3, { key: theme, onClick: () => handleClose(theme) }, theme.charAt(0).toUpperCase() + theme.slice(1)))
  ));
};
ThemeSelector.propTypes = {
  handleThemeChange: PropTypes3.func.isRequired
};
var ThemeSelector_default = ThemeSelector;

// src/StyledComponents.js
import { styled } from "@mui/material/styles";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
var StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    fontSize: "inherit"
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14
  }
}));
var StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover
  },
  // hide last border
  "&:last-child td, &:last-child th": {
    border: 0
  }
}));
var StyledActionTableCell = styled(TableCell)(({ theme }) => ({
  whiteSpace: "nowrap",
  textAlign: "right",
  width: "1%",
  paddingRight: theme.spacing(2),
  "& .MuiButtonBase-root": {
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: theme.spacing(0.5)
  },
  // If rendering text Buttons when icons are off
  "& .MuiButton-root:hover": {
    textDecoration: "underline"
  }
}));

// src/CustomTablePagination.jsx
import React5 from "react";
import { TablePagination } from "@mui/material";
function CustomTablePagination({
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [5, 10, 20, 30, { value: -1, label: "All" }]
}) {
  const options = rowsPerPageOptions.some((option) => (option.value ?? option) === rowsPerPage) ? rowsPerPageOptions : [rowsPerPage, ...rowsPerPageOptions];
  return /* @__PURE__ */ React5.createElement(
    TablePagination,
    {
      component: "div",
      count,
      page,
      rowsPerPage,
      rowsPerPageOptions: options,
      onPageChange: (_, next) => onPageChange(next),
      onRowsPerPageChange,
      showFirstButton: true,
      showLastButton: true
    }
  );
}

// src/hooks/useTableModel.js
import { useMemo, useRef as useRef2, useState as useState4 } from "react";

// src/core/rows.js
function buildRowModel({
  data = [],
  headers = [],
  searchText = "",
  columnFilters = {},
  sorting = [],
  page = 0,
  rowsPerPage = 5,
  serverSide = false,
  totalCount
}) {
  if (!Array.isArray(data) || !Array.isArray(headers)) throw new TypeError("data and headers must be arrays.");
  if (!Number.isInteger(page) || page < 0) throw new RangeError("page must be a nonnegative integer.");
  if (rowsPerPage !== -1 && (!Number.isInteger(rowsPerPage) || rowsPerPage < 1)) {
    throw new RangeError("rowsPerPage must be a positive integer or -1 (All).");
  }
  if (totalCount !== void 0 && (!Number.isInteger(totalCount) || totalCount < 0)) {
    throw new RangeError("totalCount must be a nonnegative integer.");
  }
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
      const compare = column.sortComparator ?? compareValues;
      const result = compare(getColumnValue(a, column), getColumnValue(b, column));
      if (result) return sort.order === "desc" ? -result : result;
    }
    return 0;
  });
  const count = serverSide ? totalCount ?? data.length : filtered.length;
  const lastPage = rowsPerPage === -1 ? 0 : Math.max(0, Math.ceil(count / rowsPerPage) - 1);
  const safePage = serverSide ? page : Math.min(page, lastPage);
  return {
    filteredRows: sorted,
    count,
    page: safePage,
    rows: serverSide || rowsPerPage === -1 ? sorted : sorted.slice(safePage * rowsPerPage, (safePage + 1) * rowsPerPage)
  };
}

// src/hooks/useTableModel.js
var EMPTY = [];
function useTableModel({
  data = EMPTY,
  headers = EMPTY,
  currentPage,
  initialRowsPerPage = 5,
  orderBy = "",
  order = "asc",
  serverSidePagination = false,
  totalCount,
  onPageChangeRequest
}) {
  const [state, setState] = useState4(() => ({
    page: currentPage ?? 0,
    rowsPerPage: initialRowsPerPage,
    searchText: "",
    columnFilters: {},
    sorting: orderBy ? [{ field: orderBy, order }] : []
  }));
  const requestedPage = currentPage ?? state.page;
  const model = useMemo(
    () => buildRowModel({
      data,
      headers,
      ...state,
      page: requestedPage,
      serverSide: serverSidePagination,
      totalCount
    }),
    [data, headers, state, requestedPage, serverSidePagination, totalCount]
  );
  const latest = useRef2(state);
  latest.current = { ...state, page: model.page };
  function update(change) {
    const patch = typeof change === "function" ? change(latest.current) : change;
    const resetPage = ["searchText", "columnFilters", "sorting", "rowsPerPage"].some((key) => Object.hasOwn(patch, key));
    const next = { ...latest.current, ...resetPage ? { page: 0 } : {}, ...patch };
    latest.current = next;
    setState(next);
    if (serverSidePagination) onPageChangeRequest?.({
      ...next,
      sortBy: next.sorting[0]?.field ?? "",
      sortDir: next.sorting[0]?.order ?? "asc",
      selectedColumns: next.sorting
    });
  }
  return { ...state, ...model, update };
}

// src/compat/legacyActions.jsx
import React6 from "react";
import { Button, IconButton as IconButton5, Stack, Tooltip as Tooltip5 } from "@mui/material";
import View from "@mui/icons-material/Visibility";
import Edit from "@mui/icons-material/Edit";
import Delete from "@mui/icons-material/Delete";
import Clone from "@mui/icons-material/ContentCopy";
import Report from "@mui/icons-material/Report";
function buildActions(props) {
  return [
    ["view", props.enableView, "View", props.onView, View],
    ["edit", props.enableEdit, props.editLabel ?? "Edit", props.onEdit, Edit],
    ["delete", props.enableDelete, props.deleteLabel ?? "Delete", props.onDelete, Delete],
    ["clone", props.enableClone, "Clone", props.onClone, Clone],
    ["report", props.enableReportLink, "Report", props.onReportLink, Report]
  ].filter(([, enabled]) => enabled).map(([id, , label, onClick, icon]) => ({ id, label, onClick, icon })).concat(props.actions ?? []);
}
function renderLegacyRowActions({ row, actions, icons, visibility = {} }) {
  return /* @__PURE__ */ React6.createElement(Stack, { direction: "row", spacing: 1 }, actions.filter((action) => (action.visible?.(row) ?? true) && (visibility[action.id]?.(row) ?? true)).map((action) => {
    const Icon = action.icon;
    const disabled = !action.onClick || (typeof action.disabled === "function" ? action.disabled(row) : action.disabled);
    return icons && Icon ? /* @__PURE__ */ React6.createElement(Tooltip5, { title: action.label, key: action.id }, /* @__PURE__ */ React6.createElement("span", null, /* @__PURE__ */ React6.createElement(IconButton5, { "aria-label": action.label, disabled, size: "small", onClick: () => action.onClick(row) }, /* @__PURE__ */ React6.createElement(Icon, null)))) : /* @__PURE__ */ React6.createElement(
      Button,
      {
        key: action.id,
        size: "small",
        disabled,
        onClick: () => action.onClick(row)
      },
      action.label
    );
  }));
}

// src/DynamicTable.jsx
function DynamicTable(props) {
  const {
    enableColumnFilters = false,
    loading = false,
    error,
    emptyDataMessage = "No matching records.",
    pageTitle = "",
    enableEmail = false,
    uniqueField = "",
    getRowId,
    onEmail,
    serverSidePagination = false,
    fetchAllForExport
  } = props;
  const headers = useMemo2(() => normalizeColumns(props.headers), [props.headers]);
  const model = useTableModel({ ...props, headers });
  const [theme, setTheme] = useState5("default");
  const [dense, setDense] = useState5(false);
  const [fullscreen, setFullscreen] = useState5(false);
  const [fullscreenError, setFullscreenError] = useState5("");
  const [selection, setSelection] = useState5({ data: props.data, ids: /* @__PURE__ */ new Set() });
  const selected = selection.data === props.data ? selection.ids : /* @__PURE__ */ new Set();
  const ref = useRef3(null);
  const actions = buildActions(props);
  const hasActions = props.enableRowActions !== false && (typeof props.renderRowActions === "function" || actions.length > 0);
  const identify = (row) => getRowId ? getRowId(row) : getByPath(row, uniqueField || "id") ?? row;
  const selectedRows = model.filteredRows.filter((row) => selected.has(identify(row)));
  const allSelected = model.filteredRows.length > 0 && selectedRows.length === model.filteredRows.length;
  const columnCount = headers.length + Number(hasActions) + Number(enableEmail);
  const sort = model.sorting[0];
  useEffect(() => {
    const change = () => setFullscreen(document.fullscreenElement === ref.current);
    document.addEventListener("fullscreenchange", change);
    return () => document.removeEventListener("fullscreenchange", change);
  }, []);
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement === ref.current) await document.exitFullscreen();
      else if (ref.current?.requestFullscreen) await ref.current.requestFullscreen();
      else throw new Error("Fullscreen is unavailable in this browser.");
    } catch (cause) {
      setFullscreenError(cause.message);
    }
  }
  function toggleRow(row, checked) {
    const ids = new Set(selected);
    if (checked) ids.add(identify(row));
    else ids.delete(identify(row));
    setSelection({ data: props.data, ids });
  }
  const needsAllRows = serverSidePagination && model.count > model.filteredRows.length;
  const exportFetch = needsAllRows ? async () => {
    if (!fetchAllForExport) throw new Error("Provide fetchAllForExport to export the full server result.");
    return fetchAllForExport({
      orderBy: sort?.field ?? "",
      order: sort?.order ?? "asc",
      selectedColumns: model.sorting,
      searchText: model.searchText,
      columnFilters: model.columnFilters
    });
  } : void 0;
  const content = /* @__PURE__ */ React7.createElement(Paper, { ref, sx: { width: "100%", overflow: "auto", p: fullscreen ? 2 : 0 } }, /* @__PURE__ */ React7.createElement(Stack2, { direction: "row", spacing: 1, sx: { p: 1, alignItems: "center", flexWrap: "wrap" } }, pageTitle && /* @__PURE__ */ React7.createElement(Typography, { component: "h2", variant: "h6", sx: { flexGrow: 1 } }, pageTitle), (props.searchByText || props.enableSearch) && /* @__PURE__ */ React7.createElement(
    Search_default,
    {
      searchText: model.searchText,
      handleSearchTextChange: (event) => model.update({ searchText: event.target.value, page: 0 })
    }
  ), props.enableDensePadding && /* @__PURE__ */ React7.createElement(IconButton6, { "aria-label": "Dense padding", onClick: () => setDense(!dense) }, /* @__PURE__ */ React7.createElement(DensityMediumIcon, null)), props.enableMultiColumnSort && /* @__PURE__ */ React7.createElement(
    MultiColumnSort_default,
    {
      headers: headers.filter((h) => h.sortable !== false),
      selectedColumns: model.sorting,
      handleSortChange: (sorting) => model.update({ sorting, page: 0 })
    }
  ), props.enableExport && /* @__PURE__ */ React7.createElement(
    ExportOptions,
    {
      headers,
      data: model.filteredRows,
      pageTitle,
      fetchAllRows: exportFetch,
      exportOptions: props.exportOptions,
      exportHandlers: props.exportHandlers,
      state: {
        page: model.page,
        rowsPerPage: model.rowsPerPage,
        sorting: model.sorting,
        searchText: model.searchText,
        columnFilters: model.columnFilters
      },
      disabled: loading || Boolean(error)
    }
  ), props.enableThemes && /* @__PURE__ */ React7.createElement(ThemeSelector_default, { currentTheme: theme, handleThemeChange: setTheme }), props.enableFullScreenOption && /* @__PURE__ */ React7.createElement(IconButton6, { "aria-label": "Toggle fullscreen", onClick: toggleFullscreen }, fullscreen ? /* @__PURE__ */ React7.createElement(FullscreenExitIcon, null) : /* @__PURE__ */ React7.createElement(FullscreenIcon, null)), enableEmail && /* @__PURE__ */ React7.createElement(
    IconButton6,
    {
      "aria-label": "Send email",
      disabled: !onEmail || loading || Boolean(error),
      onClick: () => onEmail(selectedRows.length ? selectedRows : model.filteredRows)
    },
    /* @__PURE__ */ React7.createElement(EmailIcon, null)
  ), props.renderToolbar?.({ ...model, selectedRows })), fullscreenError && /* @__PURE__ */ React7.createElement(Alert2, { severity: "warning", onClose: () => setFullscreenError("") }, fullscreenError), error && /* @__PURE__ */ React7.createElement(Alert2, { severity: "error" }, error instanceof Error ? error.message : String(error)), loading && /* @__PURE__ */ React7.createElement(LinearProgress, { "aria-label": "Loading rows" }), /* @__PURE__ */ React7.createElement(TableContainer, { sx: { maxHeight: props.maxHeight } }, /* @__PURE__ */ React7.createElement(
    Table,
    {
      stickyHeader: props.stickyHeader,
      size: dense ? "small" : "medium",
      "aria-label": props["aria-label"] ?? (pageTitle || "Data table"),
      "aria-busy": loading
    },
    /* @__PURE__ */ React7.createElement(TableHead, null, /* @__PURE__ */ React7.createElement(StyledTableRow, null, headers.map((header) => /* @__PURE__ */ React7.createElement(
      StyledTableCell,
      {
        key: header.field,
        style: { width: header.width },
        align: header.align,
        sortDirection: sort?.field === header.field ? sort.order : false
      },
      header.sortable === false ? header.label : /* @__PURE__ */ React7.createElement(
        TableSortLabel,
        {
          active: sort?.field === header.field,
          direction: sort?.field === header.field ? sort.order : "asc",
          onClick: () => model.update({
            page: 0,
            sorting: [{ field: header.field, order: sort?.field === header.field && sort.order === "asc" ? "desc" : "asc" }]
          })
        },
        header.label
      ),
      props.tooltipFields?.[header.field] && /* @__PURE__ */ React7.createElement(Tooltip6, { title: props.tooltipFields[header.field].join(", ") }, /* @__PURE__ */ React7.createElement(IconButton6, { size: "small", "aria-label": `About ${header.label}` }, /* @__PURE__ */ React7.createElement(InfoIcon, { fontSize: "small" }))),
      enableColumnFilters && header.filterable !== false && /* @__PURE__ */ React7.createElement(
        TextField2,
        {
          size: "small",
          label: `Filter ${header.label}`,
          value: model.columnFilters[header.field] ?? "",
          onChange: (event) => model.update({
            page: 0,
            columnFilters: { ...model.columnFilters, [header.field]: event.target.value }
          })
        }
      )
    )), hasActions && /* @__PURE__ */ React7.createElement(StyledTableCell, null, props.actionsColumnLabel ?? "Actions"), enableEmail && /* @__PURE__ */ React7.createElement(StyledTableCell, null, /* @__PURE__ */ React7.createElement(
      Checkbox2,
      {
        "aria-label": "Select all emails",
        checked: allSelected,
        indeterminate: selectedRows.length > 0 && !allSelected,
        onChange: (event) => setSelection({ data: props.data, ids: new Set(event.target.checked ? model.filteredRows.map(identify) : []) })
      }
    ), "Email"))),
    /* @__PURE__ */ React7.createElement(TableBody, null, !error && model.rows.map((row, index) => {
      const rowId = getRowId ? getRowId(row) : getByPath(row, uniqueField || "id") ?? index;
      return /* @__PURE__ */ React7.createElement(StyledTableRow, { key: rowId, hover: true }, headers.map((header) => /* @__PURE__ */ React7.createElement(StyledTableCell, { key: header.field, align: header.align }, header.renderCell ? header.renderCell({ row, value: getColumnValue(row, header), rowIndex: index, rowId }) : getColumnText(row, header))), hasActions && /* @__PURE__ */ React7.createElement(StyledActionTableCell, null, props.renderRowActions ? props.renderRowActions({ row, rowIndex: index, rowId }) : renderLegacyRowActions({ row, actions, icons: props.showActionIcons, visibility: props.actionVisibilityRules })), enableEmail && /* @__PURE__ */ React7.createElement(StyledTableCell, null, /* @__PURE__ */ React7.createElement(
        Checkbox2,
        {
          "aria-label": `Select email row ${index + 1}`,
          checked: selected.has(identify(row)),
          onChange: (event) => toggleRow(row, event.target.checked)
        }
      )));
    }), !loading && !error && model.rows.length === 0 && /* @__PURE__ */ React7.createElement(StyledTableRow, null, /* @__PURE__ */ React7.createElement(StyledTableCell, { colSpan: Math.max(1, columnCount), align: "center" }, emptyDataMessage)))
  )), /* @__PURE__ */ React7.createElement(
    CustomTablePagination,
    {
      count: model.count,
      page: model.page,
      rowsPerPage: model.rowsPerPage,
      rowsPerPageOptions: props.rowsPerPageOptions,
      onPageChange: (page) => model.update({ page }),
      onRowsPerPageChange: (event) => model.update({ rowsPerPage: Number(event.target.value), page: 0 })
    }
  ));
  return props.enableThemes ? /* @__PURE__ */ React7.createElement(ThemeProvider, { theme: themes[theme] }, content) : /* @__PURE__ */ React7.createElement(Box2, null, content);
}

// src/spring.js
function normalizeSpringPage(page) {
  return { rows: page.content ?? [], rowCount: page.totalElements ?? 0, pageCount: page.totalPages ?? 0 };
}
function createSpringDataSource({ url, fetcher = fetch, params = {}, mapSort }) {
  return async ({ pagination, sorting = [], globalFilter = "", columnFilters = [], signal }) => {
    const [baseUrl, hash] = url.split("#", 2);
    const [pathname, search = ""] = baseUrl.split("?", 2);
    const query = new URLSearchParams(search);
    Object.entries(params).forEach(([key, value]) => {
      if (value != null) query.set(key, String(value));
    });
    query.set("page", String(pagination.pageIndex));
    query.set("size", String(pagination.pageSize));
    const sort = mapSort ? mapSort(sorting) : sorting.map(({ id, desc }) => `${id},${desc ? "desc" : "asc"}`);
    query.delete("sort");
    query.delete("search");
    columnFilters.forEach(({ id }) => query.delete(`filter.${id}`));
    sort.forEach((value) => query.append("sort", value));
    if (globalFilter) query.set("search", globalFilter);
    columnFilters.forEach(({ id, value }) => {
      if (value !== "" && value != null) query.set(`filter.${id}`, String(value));
    });
    const response = await fetcher(`${pathname}?${query}${hash ? `#${hash}` : ""}`, { signal });
    if (!response.ok) throw new Error(`Table request failed (${response.status})`);
    return normalizeSpringPage(await response.json());
  };
}
export {
  DynamicTable,
  buildRowModel,
  createPdfBlob,
  createSpringDataSource,
  createXlsxBlob,
  defaultExportHandlers,
  downloadBlob,
  exportRowsAsCsv,
  exportRowsAsJson,
  exportRowsAsPdf,
  exportRowsAsTxt,
  exportRowsAsXlsx,
  exportWithEndpoint,
  getColumnText,
  getColumnValue,
  getExportData,
  headersToExportColumns,
  normalizeColumns,
  normalizeSpringPage,
  rowsToCsv,
  rowsToJson,
  rowsToTxt,
  useTableModel
};
//# sourceMappingURL=index.js.map