"use client";
import {
  QUERY_KEYS,
  buildRowModel,
  createTableState,
  getByPath,
  getColumnText,
  getColumnValue,
  getFilteredRows,
  headersToExportColumns,
  normalizeColumns,
  paginateRows,
  toTableQuery,
  transitionTableState,
  validateTableState
} from "./chunk-AVPCDLU4.js";
import {
  createSpringDataSource,
  fetchAllSpringRows,
  normalizeSpringPage,
  toSpringRequest
} from "./chunk-NADGQ3OK.js";
import {
  createPdfBlob,
  createXlsxBlob,
  defaultExportHandlers,
  downloadBlob,
  exportRowsAsCsv,
  exportRowsAsJson,
  exportRowsAsPdf,
  exportRowsAsTxt,
  exportRowsAsXlsx,
  exportWithEndpoint,
  getExportData,
  rowsToCsv,
  rowsToJson,
  rowsToTxt
} from "./chunk-2FA4OU45.js";

// src/DynamicTable.jsx
import React8, { useEffect as useEffect2, useMemo as useMemo2, useRef as useRef4, useState as useState7 } from "react";
import {
  Alert as Alert2,
  Box as Box3,
  Checkbox as Checkbox2,
  IconButton as IconButton7,
  LinearProgress,
  Paper,
  Stack as Stack2,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableSortLabel,
  TextField as TextField2,
  Tooltip as Tooltip7,
  Typography as Typography2
} from "@mui/material";
import { ThemeProvider, useTheme } from "@mui/material/styles";
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
var Search = ({ searchText, handleSearchTextChange, labels }) => {
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
      label: labels.search,
      autoFocus: true,
      variant: "outlined",
      value: searchText,
      onChange: handleSearchTextChange,
      slotProps: { htmlInput: { "data-testid": "search-input" } },
      margin: "normal",
      size: "small"
    }
  ), /* @__PURE__ */ React.createElement(Tooltip, { describeChild: true, title: showSearch ? labels.closeSearch : labels.openSearch }, /* @__PURE__ */ React.createElement(
    IconButton,
    {
      onClick: toggleSearch,
      "aria-label": showSearch ? labels.closeSearch : labels.openSearch
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
import React2, { useEffect, useRef, useState as useState2 } from "react";
import { Alert, Button, IconButton as IconButton2, Menu, MenuItem, Snackbar, Tooltip as Tooltip2, Typography } from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

// src/labels.js
var defaultTableLabels = {
  selection: "Selection",
  selectAllRows: "Select all rows",
  selectRow: (index) => `Select row ${index}`,
  table: "Data table",
  empty: "No matching records.",
  actions: "Actions",
  email: "Email",
  sendEmail: "Send email",
  selectAllEmails: "Select all emails",
  selectEmailRow: (index) => `Select email row ${index}`,
  search: "Search",
  openSearch: "Open search",
  closeSearch: "Close search",
  densePadding: "Dense padding",
  fullscreen: "Toggle fullscreen",
  loading: "Loading rows",
  sortMenu: "Multi-column sort",
  clearSorting: "Clear Sorting",
  themeSelector: "theme selector",
  moveColumn: (label) => `Move ${label}`,
  resizeColumn: (label) => `Resize ${label}`,
  moveColumnStart: "Move toward start",
  moveColumnEnd: "Move toward end",
  columnWidth: (width) => `${width} pixels`,
  filter: (label) => `Filter ${label}`,
  about: (label) => `About ${label}`,
  sortSummary: (sorting) => sorting.map((sort, index) => `${sort.field}: ${sort.order}, priority ${index + 1}`).join("; "),
  rowsPerPage: "Rows per page:",
  firstPage: "Go to first page",
  previousPage: "Go to previous page",
  nextPage: "Go to next page",
  lastPage: "Go to last page",
  displayedRows: ({ from, to, count }) => `${from}\u2013${to} of ${count}`,
  exportMenu: "Export menu",
  exporting: "Preparing export",
  cancelExport: "Cancel export",
  exportProgress: ({ loaded, total }) => `Exporting ${loaded} of ${total} rows`
};

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
  disabled = false,
  onExportStart,
  onExportComplete,
  onExportError,
  onExportCancel,
  labels = defaultTableLabels
}) {
  const [anchor, setAnchor] = useState2(null);
  const [busy, setBusy] = useState2(false);
  const active = useRef(null);
  const [error, setError] = useState2("");
  const [progress, setProgress] = useState2(null);
  useEffect(() => () => {
    active.current?.controller.abort();
    active.current = null;
  }, []);
  function cancel() {
    const job = active.current;
    if (!job) return;
    active.current = null;
    job.controller.abort();
    setBusy(false);
    setProgress(null);
    onExportCancel?.(job.info);
  }
  async function run(format) {
    if (active.current) return;
    const snapshot = state ? { ...state, sorting: state.sorting.map((sort) => ({ ...sort })), columnFilters: { ...state.columnFilters } } : void 0;
    const filename = `${pageTitle.replace(/[^a-z0-9_-]+/gi, "_") || "table"}_${timestamp()}.${format}`;
    const controller = new AbortController();
    const info = { format, filename, state: snapshot };
    const job = { controller, info };
    active.current = job;
    const signal = controller.signal;
    const onProgress = (value) => {
      if (active.current === job && !signal.aborted) setProgress(value);
    };
    setBusy(true);
    setError("");
    setAnchor(null);
    try {
      onExportStart?.(info);
      const configured = exportHandlers[format] ?? defaultExportHandlers[format];
      const handler = typeof configured === "function" ? configured : configured.handler;
      const rows = configured.mode === "endpoint" ? [] : fetchAllRows ? await fetchAllRows({ signal, onProgress }) : data;
      if (signal.aborted || active.current !== job) return;
      if (!Array.isArray(rows)) throw new Error("Export must return an array of rows.");
      await handler({
        rows,
        columns: headersToExportColumns(headers),
        title: pageTitle,
        filename,
        state: snapshot,
        signal,
        onProgress
      });
      if (!signal.aborted && active.current === job) onExportComplete?.({ ...info, rowCount: configured.mode === "endpoint" ? void 0 : rows.length });
    } catch (cause) {
      if (!signal.aborted && active.current === job) {
        const failure = cause instanceof Error ? cause : new Error(String(cause));
        setError(failure.message);
        onExportError?.(failure, info);
      }
    } finally {
      if (active.current === job) {
        active.current = null;
        setBusy(false);
        setProgress(null);
      }
    }
  }
  return /* @__PURE__ */ React2.createElement(React2.Fragment, null, /* @__PURE__ */ React2.createElement(Tooltip2, { describeChild: true, title: labels.exportMenu }, /* @__PURE__ */ React2.createElement("span", null, /* @__PURE__ */ React2.createElement(
    IconButton2,
    {
      "aria-label": labels.exportMenu,
      disabled: busy || disabled,
      onClick: (event) => setAnchor(event.currentTarget)
    },
    /* @__PURE__ */ React2.createElement(FileDownloadIcon, null)
  ))), busy && /* @__PURE__ */ React2.createElement(React2.Fragment, null, /* @__PURE__ */ React2.createElement(Typography, { role: "status" }, progress ? labels.exportProgress(progress) : labels.exporting), /* @__PURE__ */ React2.createElement(Button, { onClick: cancel }, labels.cancelExport)), /* @__PURE__ */ React2.createElement(Menu, { anchorEl: anchor, open: Boolean(anchor), onClose: () => setAnchor(null) }, ["csv", "txt", "xlsx", "pdf", "json"].filter((format) => exportOptions[format] ?? format !== "json").map((format) => /* @__PURE__ */ React2.createElement(MenuItem, { key: format, onClick: () => run(format) }, format.toUpperCase()))), /* @__PURE__ */ React2.createElement(Snackbar, { open: Boolean(error), autoHideDuration: 6e3, onClose: () => setError("") }, /* @__PURE__ */ React2.createElement(Alert, { severity: "error", onClose: () => setError("") }, error)));
}

// src/MultiColumnSort.jsx
import React3, { useState as useState3 } from "react";
import { IconButton as IconButton3, Menu as Menu2, MenuItem as MenuItem2, Checkbox, ListItemText, Divider } from "@mui/material";
import SortIcon from "@mui/icons-material/Sort";
import PropTypes2 from "prop-types";
import Tooltip3 from "@mui/material/Tooltip";
var MultiColumnSort = ({ headers, selectedColumns, handleSortChange, labels }) => {
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
  return /* @__PURE__ */ React3.createElement("div", null, /* @__PURE__ */ React3.createElement(IconButton3, { "aria-label": labels.sortMenu, onClick: handleClick }, /* @__PURE__ */ React3.createElement(Tooltip3, { describeChild: true, title: labels.sortMenu }, /* @__PURE__ */ React3.createElement(SortIcon, null))), /* @__PURE__ */ React3.createElement(
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
    /* @__PURE__ */ React3.createElement(MenuItem2, { onClick: handleClearSorting }, labels.clearSorting)
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
  default: createTheme({ palette: { primary: { main: "#008000" }, secondary: { main: "#ff4081" } } }),
  grey: createTheme({
    palette: {
      primary: { main: "#9e9e9e" },
      secondary: { main: "#bdbdbd" },
      background: { default: "#eeeeee", paper: "#f5f5f5" }
    }
  }),
  blue: createTheme({
    palette: {
      primary: { main: "#1976d2" },
      secondary: { main: "#ff4081" },
      background: { default: "#e3f2fd", paper: "#f0f7ff" }
    }
  }),
  light: createTheme({ palette: { mode: "light", primary: { main: "#90caf9" }, secondary: { main: "#f48fb1" } } }),
  dark: createTheme({ palette: { mode: "dark" } })
};
function createTableTheme(applicationTheme, preset = "default") {
  return createTheme(applicationTheme, {
    palette: themes[preset].palette,
    components: {
      MuiTableCell: {
        styleOverrides: {
          head: ({ theme }) => ({
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            fontSize: "inherit",
            "& .MuiTableSortLabel-root, & .MuiTableSortLabel-root:hover, & .MuiTableSortLabel-root.Mui-active": { color: "inherit" },
            "& .MuiTableSortLabel-icon, & .MuiCheckbox-root, & .MuiCheckbox-root.Mui-checked": { color: "inherit" }
          })
        }
      }
    }
  }, { components: applicationTheme.components });
}

// src/ThemeSelector.jsx
import Tooltip4 from "@mui/material/Tooltip";
var ThemeSelector = ({ handleThemeChange, labels, currentTheme }) => {
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
  return /* @__PURE__ */ React4.createElement("div", null, /* @__PURE__ */ React4.createElement(IconButton4, { "aria-label": labels.themeSelector, "aria-haspopup": "menu", "aria-expanded": Boolean(anchorEl), onClick: handleClick }, /* @__PURE__ */ React4.createElement(Tooltip4, { describeChild: true, title: labels.themeSelector }, /* @__PURE__ */ React4.createElement(PaletteIcon, null))), /* @__PURE__ */ React4.createElement(
    Menu3,
    {
      anchorEl,
      open: Boolean(anchorEl),
      onClose: () => handleClose(null)
    },
    Object.keys(themes).map((theme) => /* @__PURE__ */ React4.createElement(MenuItem3, { key: theme, selected: currentTheme === theme, "aria-current": currentTheme === theme ? "true" : void 0, onClick: () => handleClose(theme) }, theme.charAt(0).toUpperCase() + theme.slice(1)))
  ));
};
ThemeSelector.propTypes = {
  handleThemeChange: PropTypes3.func.isRequired,
  currentTheme: PropTypes3.oneOf(Object.keys(themes)).isRequired,
  labels: PropTypes3.object.isRequired
};
var ThemeSelector_default = ThemeSelector;

// src/StyledComponents.js
import { styled } from "@mui/material/styles";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
var StyledTableCell = styled(TableCell)({
  [`&.${tableCellClasses.body}`]: { fontSize: 14 }
});
var StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": { backgroundColor: theme.palette.action.hover },
  "&:last-child td, &:last-child th": { border: 0 }
}));
var StyledActionTableCell = styled(StyledTableCell)(({ theme }) => ({
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
  "& .MuiButton-root:hover": { textDecoration: "underline" }
}));

// src/ColumnHeaderControls.jsx
import React5, { useRef as useRef2, useState as useState4 } from "react";
import { Box as Box2, IconButton as IconButton5, Menu as Menu4, MenuItem as MenuItem4, Tooltip as Tooltip5 } from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
function ColumnHeaderControls({ column, layout, labels, reorder, resize, direction }) {
  const [anchor, setAnchor] = useState4(null);
  const gesture = useRef2(null);
  const { field, label } = column;
  const { min, max } = layout.bounds(column);
  const width = layout.sizing[field];
  const sign = direction === "rtl" ? -1 : 1;
  function move(step) {
    const target = layout.neighbor(field, step);
    if (target) layout.move(field, target);
  }
  return /* @__PURE__ */ React5.createElement(React5.Fragment, null, reorder && /* @__PURE__ */ React5.createElement(React5.Fragment, null, /* @__PURE__ */ React5.createElement(Tooltip5, { title: labels.moveColumn(label) }, /* @__PURE__ */ React5.createElement(
    IconButton5,
    {
      size: "small",
      color: "inherit",
      "aria-label": labels.moveColumn(label),
      "aria-haspopup": "menu",
      "aria-expanded": Boolean(anchor),
      ...layout.dragProps(field),
      onClick: (event) => setAnchor(event.currentTarget),
      onKeyDown: (event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          event.stopPropagation();
          move((event.key === "ArrowRight" ? 1 : -1) * sign);
        }
      }
    },
    /* @__PURE__ */ React5.createElement(DragIndicatorIcon, { fontSize: "small" })
  )), /* @__PURE__ */ React5.createElement(Menu4, { anchorEl: anchor, open: Boolean(anchor), onClose: () => setAnchor(null) }, [-1, 1].map((step) => /* @__PURE__ */ React5.createElement(MenuItem4, { key: step, disabled: !layout.neighbor(field, step), onClick: () => {
    move(step);
    setAnchor(null);
  } }, step === -1 ? labels.moveColumnStart : labels.moveColumnEnd)))), resize && /* @__PURE__ */ React5.createElement(
    Box2,
    {
      role: "separator",
      tabIndex: 0,
      "aria-label": labels.resizeColumn(label),
      "aria-orientation": "vertical",
      "aria-valuemin": min,
      "aria-valuemax": max,
      "aria-valuenow": width,
      "aria-valuetext": labels.columnWidth(width),
      onPointerDown: (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.focus();
        gesture.current = { pointerId: event.pointerId, x: event.clientX, width };
        event.currentTarget.setPointerCapture(event.pointerId);
      },
      onPointerMove: (event) => {
        if (gesture.current?.pointerId === event.pointerId) layout.resize(field, gesture.current.width + (event.clientX - gesture.current.x) * sign);
      },
      onPointerUp: (event) => {
        if (gesture.current?.pointerId === event.pointerId) {
          gesture.current = null;
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      },
      onPointerCancel: () => {
        if (gesture.current) layout.resize(field, gesture.current.width);
        gesture.current = null;
      },
      onLostPointerCapture: () => {
        gesture.current = null;
      },
      onKeyDown: (event) => {
        const step = event.shiftKey ? 50 : 10;
        const next = event.key === "Home" ? min : event.key === "End" ? max : event.key === "ArrowRight" ? width + step * sign : event.key === "ArrowLeft" ? width - step * sign : null;
        if (next !== null) {
          event.preventDefault();
          event.stopPropagation();
          layout.resize(field, next);
        }
      },
      sx: {
        position: "absolute",
        insetInlineEnd: 0,
        top: 0,
        bottom: 0,
        width: 10,
        cursor: "col-resize",
        touchAction: "none",
        "&::after": { content: '""', position: "absolute", insetInlineEnd: 3, top: "20%", height: "60%", borderInlineEnd: "2px solid currentColor" },
        "&:focus-visible": { outline: "2px solid currentColor", outlineOffset: -2 }
      }
    }
  ));
}

// src/hooks/useColumnLayout.js
import { useId, useState as useState5 } from "react";

// src/core/columnLayout.js
function resolveColumnOrder(columns, order = []) {
  if (!Array.isArray(order) || order.some((field) => typeof field !== "string") || new Set(order).size !== order.length) {
    throw new Error("columnOrder must be an array of unique field strings.");
  }
  const requested = new Set(order);
  const known = new Set(columns.map((column) => column.field));
  return [...order.filter((field) => known.has(field)), ...columns.map((column) => column.field).filter((field) => !requested.has(field))];
}
function moveColumn(columns, order, field, target) {
  const movable = new Set(columns.filter((column) => column.reorderable !== false).map((column) => column.field));
  if (!movable.has(field) || !movable.has(target) || field === target) return order;
  const sequence = order.filter((key) => movable.has(key));
  const from = sequence.indexOf(field), to = sequence.indexOf(target);
  if (from < 0 || to < 0) return order;
  sequence.splice(to, 0, sequence.splice(from, 1)[0]);
  let index = 0;
  return order.map((key) => movable.has(key) ? sequence[index++] : key);
}
function positive(value, name) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) throw new Error(`${name} must be a finite positive pixel width.`);
  return value;
}
function columnBounds(column, { defaultColumnWidth = 180, minColumnWidth = 80, maxColumnWidth = 800 } = {}) {
  const min = positive(column.minWidth ?? minColumnWidth, "minWidth");
  const max = positive(column.maxWidth ?? maxColumnWidth, "maxWidth");
  if (min > max) throw new Error("Column minWidth must not exceed maxWidth.");
  const declared = typeof column.width === "string" && /^\d+(\.\d+)?px$/.test(column.width) ? Number.parseFloat(column.width) : column.width;
  const width = typeof declared === "number" ? positive(declared, "width") : positive(defaultColumnWidth, "defaultColumnWidth");
  return { min, max, width: Math.min(max, Math.max(min, width)) };
}
function resolveColumnSizing(columns, sizing = {}, options) {
  if (!sizing || typeof sizing !== "object" || Array.isArray(sizing)) throw new Error("columnSizing must be an object of pixel widths keyed by field.");
  return Object.fromEntries(columns.map((column) => {
    const { min, max, width } = columnBounds(column, options);
    const requested = Object.hasOwn(sizing, column.field) ? positive(sizing[column.field], `columnSizing.${column.field}`) : width;
    return [column.field, Math.min(max, Math.max(min, requested))];
  }));
}

// src/hooks/useColumnLayout.js
var DRAG_TYPE = "application/x-mui-data-table-column";
function useColumnLayout(columns, props) {
  const tableId = useId();
  const [internalOrder, setInternalOrder] = useState5(() => props.initialColumnOrder ?? []);
  const [internalSizing, setInternalSizing] = useState5(() => props.initialColumnSizing ?? {});
  const order = resolveColumnOrder(columns, props.columnOrder ?? internalOrder);
  const sizing = resolveColumnSizing(columns, props.columnSizing ?? internalSizing, props);
  const byField = new Map(columns.map((column) => [column.field, column]));
  function move(field, target) {
    const next = moveColumn(columns, order, field, target);
    if (next === order) return;
    if (props.columnOrder === void 0) setInternalOrder(next);
    props.onColumnOrderChange?.(next);
  }
  function resize(field, width) {
    const { min, max } = columnBounds(byField.get(field), props);
    const nextWidth = Math.min(max, Math.max(min, width));
    if (nextWidth === sizing[field]) return;
    const next = { ...sizing, [field]: nextWidth };
    if (props.columnSizing === void 0) setInternalSizing(next);
    props.onColumnSizingChange?.(next);
  }
  const movable = order.filter((field) => byField.get(field).reorderable !== false);
  return {
    headers: order.map((field) => byField.get(field)),
    order,
    sizing,
    resize,
    bounds: (column) => columnBounds(column, props),
    neighbor: (field, step) => movable[movable.indexOf(field) + step],
    move,
    dragProps: (field) => ({
      draggable: true,
      onDragStart: (event) => {
        event.dataTransfer.setData(DRAG_TYPE, JSON.stringify({ tableId, field }));
        event.dataTransfer.effectAllowed = "move";
      }
    }),
    dropProps: (field) => ({
      onDragOver: (event) => {
        if (event.dataTransfer.types.includes(DRAG_TYPE)) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
        }
      },
      onDrop: (event) => {
        const payload = event.dataTransfer.getData(DRAG_TYPE);
        if (!payload) return;
        event.preventDefault();
        let source;
        try {
          source = JSON.parse(payload);
        } catch {
          return;
        }
        if (source?.tableId === tableId) move(source.field, field);
      }
    })
  };
}

// src/CustomTablePagination.jsx
import React6 from "react";
import { TablePagination } from "@mui/material";
function CustomTablePagination({
  count,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [5, 10, 20, 30, { value: -1, label: "All" }],
  labels
}) {
  const labelId = React6.useId();
  const options = rowsPerPageOptions.some((option) => (option.value ?? option) === rowsPerPage) ? rowsPerPageOptions : [rowsPerPage, ...rowsPerPageOptions];
  return /* @__PURE__ */ React6.createElement(
    TablePagination,
    {
      component: "div",
      count,
      page,
      rowsPerPage,
      sx: { color: "text.primary", bgcolor: "background.paper" },
      slotProps: {
        select: {
          labelId,
          inputProps: { "aria-labelledby": labelId },
          SelectDisplayProps: { "aria-label": labels.rowsPerPage },
          sx: { color: "text.primary", "& .MuiSelect-icon": { color: "text.primary" } },
          MenuProps: { slotProps: { paper: { sx: { color: "text.primary", bgcolor: "background.paper" } } } }
        },
        menuItem: { sx: { color: "text.primary" } }
      },
      rowsPerPageOptions: options,
      onPageChange: (_, next) => onPageChange(next),
      onRowsPerPageChange,
      labelRowsPerPage: labels.rowsPerPage,
      labelDisplayedRows: labels.displayedRows,
      getItemAriaLabel: (type) => labels[`${type}Page`],
      showFirstButton: true,
      showLastButton: true
    }
  );
}

// src/core/layout.js
function insertSelectionCell(cells, cell, position = "first") {
  const index = position === "first" ? 0 : position === "last" ? cells.length : position;
  if (!Number.isInteger(index) || index < 0 || index > cells.length) {
    throw new RangeError(`selectionColumnPosition must be first, last, or an index from 0 to ${cells.length}.`);
  }
  return [...cells.slice(0, index), cell, ...cells.slice(index)];
}
function arrangeToolbarControls(controls, alignment = "left", positions = {}) {
  if (!["left", "right"].includes(alignment)) throw new Error("toolbarAlignment must be left or right.");
  for (const [key, side] of Object.entries(positions)) {
    if (!Object.hasOwn(controls, key)) throw new Error(`Unknown toolbar control: ${key}`);
    if (!["left", "right"].includes(side)) throw new Error(`Toolbar position for ${key} must be left or right.`);
  }
  return Object.entries(controls).map(([id, node]) => ({ id, node, side: positions[id] ?? alignment })).filter(({ node }) => node !== false && node !== null && node !== void 0).sort((a, b) => Number(a.side === "right") - Number(b.side === "right"));
}

// src/core/identity.js
function rowIdentities(data, { getRowId, uniqueField, requireIds = false }) {
  const seen = /* @__PURE__ */ new Set();
  const identities = /* @__PURE__ */ new Map();
  data.forEach((row, index) => {
    if (identities.has(row)) throw new Error("Duplicate row ID or repeated row reference.");
    const supplied = getRowId ? getRowId(row) : getByPath(row, uniqueField || "id");
    const id = supplied ?? (requireIds || getRowId ? void 0 : index);
    if (!["string", "number"].includes(typeof id) || typeof id === "string" && !id.trim() || typeof id === "number" && !Number.isFinite(id)) throw new Error("Rows with interactive controls require a stable string or number ID.");
    if (seen.has(id)) throw new Error(`Duplicate row ID: ${id}`);
    seen.add(id);
    identities.set(row, id);
  });
  return identities;
}

// src/hooks/useTableModel.js
import { useCallback, useLayoutEffect, useMemo, useRef as useRef3, useState as useState6 } from "react";
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
  onPageChangeRequest,
  state: controlledState,
  initialState,
  onStateChange,
  onQueryChange
}) {
  const ownedKeys = QUERY_KEYS.filter((key) => Object.hasOwn(controlledState ?? {}, key)).join(",");
  const ownership = useRef3(ownedKeys);
  if (ownership.current !== ownedKeys) throw new Error("Controlled state keys must remain fixed; remount to change ownership.");
  const [internal, setInternal] = useState6(() => createTableState({
    page: currentPage ?? 0,
    rowsPerPage: initialRowsPerPage,
    sorting: orderBy ? [{ field: orderBy, order }] : [],
    ...initialState
  }));
  const effective = validateTableState({
    ...internal,
    ...currentPage !== void 0 ? { page: currentPage } : {},
    ...controlledState
  });
  const { page, rowsPerPage, searchText, columnFilters, sorting } = effective;
  const filteredRows = useMemo(() => getFilteredRows({
    data,
    headers,
    searchText,
    columnFilters,
    sorting,
    serverSide: serverSidePagination
  }), [data, headers, searchText, columnFilters, sorting, serverSidePagination]);
  const model = useMemo(
    () => paginateRows({ filteredRows, page, rowsPerPage, serverSide: serverSidePagination, totalCount }),
    [filteredRows, page, rowsPerPage, serverSidePagination, totalCount]
  );
  const state = { ...effective, page: model.page };
  const settings = {
    state,
    controlledState,
    currentPage,
    serverSidePagination,
    onStateChange,
    onQueryChange,
    onPageChangeRequest
  };
  const latest = useRef3(settings);
  useLayoutEffect(() => {
    latest.current = settings;
  });
  const update = useCallback((change) => {
    const current = latest.current;
    const { next, event } = transitionTableState(current.state, change);
    if (!event.changedKeys.length) return;
    latest.current = { ...current, state: next };
    setInternal((previous) => {
      const uncontrolled = { ...previous };
      for (const key of QUERY_KEYS) {
        const owned = Object.hasOwn(current.controlledState ?? {}, key) || key === "page" && current.currentPage !== void 0;
        if (!owned) uncontrolled[key] = next[key];
      }
      return uncontrolled;
    });
    current.onStateChange?.(next, event);
    current.onQueryChange?.(next, event);
    if (current.serverSidePagination) current.onPageChangeRequest?.(toTableQuery(next));
  }, []);
  return { ...state, ...model, state, update };
}

// src/compat/legacyActions.jsx
import React7 from "react";
import { Button as Button2, IconButton as IconButton6, Stack, Tooltip as Tooltip6 } from "@mui/material";
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
  return /* @__PURE__ */ React7.createElement(Stack, { direction: "row", spacing: 1 }, actions.filter((action) => (action.visible?.(row) ?? true) && (visibility[action.id]?.(row) ?? true)).map((action) => {
    const Icon = action.icon;
    const disabled = !action.onClick || (typeof action.disabled === "function" ? action.disabled(row) : action.disabled);
    return icons && Icon ? /* @__PURE__ */ React7.createElement(Tooltip6, { title: action.label, key: action.id }, /* @__PURE__ */ React7.createElement("span", null, /* @__PURE__ */ React7.createElement(IconButton6, { "aria-label": action.label, disabled, size: "small", onClick: () => action.onClick(row) }, /* @__PURE__ */ React7.createElement(Icon, null)))) : /* @__PURE__ */ React7.createElement(
      Button2,
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
  const labels = { ...defaultTableLabels, ...props.labels };
  const slots = props.slots ?? {};
  const slotProps = props.slotProps ?? {};
  const Root = slots.root ?? Paper, Toolbar = slots.toolbar ?? Stack2, Head = slots.header ?? TableHead;
  const Body = slots.body ?? TableBody, Row = slots.row ?? StyledTableRow, Cell = slots.cell ?? StyledTableCell;
  const ActionCell = slots.actionCell ?? StyledActionTableCell, TableComponent = slots.table ?? Table;
  const Footer = slots.footer ?? CustomTablePagination;
  const {
    enableColumnFilters = false,
    loading = false,
    error,
    emptyDataMessage = labels.empty,
    pageTitle = "",
    enableEmail = false,
    uniqueField = "",
    getRowId,
    onEmail,
    serverSidePagination = false,
    fetchAllForExport
  } = props;
  const selectionEnabled = Boolean(props.enableRowSelection || enableEmail);
  const selectionLabel = props.selectionColumnLabel ?? (props.enableRowSelection ? labels.selection : labels.email);
  const selectAllLabel = props.enableRowSelection ? labels.selectAllRows : labels.selectAllEmails;
  const normalizedHeaders = useMemo2(() => normalizeColumns(props.headers), [props.headers]);
  const model = useTableModel({ ...props, headers: normalizedHeaders });
  const layout = useColumnLayout(normalizedHeaders, props);
  const headers = layout.headers;
  const resizing = Boolean(props.enableColumnResizing);
  const [theme, setTheme] = useState7("default");
  const applicationTheme = useTheme();
  const activeTheme = useMemo2(
    () => createTableTheme(applicationTheme, props.enableThemes ? theme : "default"),
    [applicationTheme, props.enableThemes, theme]
  );
  const [dense, setDense] = useState7(false);
  const [fullscreen, setFullscreen] = useState7(false);
  const [fullscreenError, setFullscreenError] = useState7("");
  const [selection, setSelection] = useState7({ data: props.data, datasetKey: props.datasetKey, ids: new Set(props.initialSelectedRowIds ?? []) });
  const selectionValid = Object.is(selection.datasetKey, props.datasetKey) && (props.selectionReset === "dataset" || selection.data === props.data);
  const selected = props.selectedRowIds !== void 0 ? new Set(props.selectedRowIds) : selectionValid ? selection.ids : /* @__PURE__ */ new Set();
  useEffect2(() => {
    setSelection((previous) => {
      const valid = Object.is(previous.datasetKey, props.datasetKey) && (props.selectionReset === "dataset" || previous.data === props.data);
      return valid ? previous : { data: props.data, datasetKey: props.datasetKey, ids: /* @__PURE__ */ new Set() };
    });
  }, [props.data, props.datasetKey, props.selectionReset]);
  const ref = useRef4(null);
  const actions = buildActions(props);
  const hasActions = props.enableRowActions !== false && (typeof props.renderRowActions === "function" || actions.length > 0);
  const requireIds = Boolean(selectionEnabled || props.renderBulkActions || hasActions || headers.some((header) => header.renderCell));
  const identities = useMemo2(
    () => rowIdentities(props.data ?? [], { getRowId, uniqueField, requireIds }),
    [props.data, getRowId, uniqueField, requireIds]
  );
  const identify = (row) => identities.get(row);
  function updateSelection(ids) {
    if (props.selectedRowIds === void 0) setSelection({ data: props.data, datasetKey: props.datasetKey, ids });
    props.onSelectionChange?.([...ids]);
  }
  const selectedRows = model.filteredRows.filter((row) => selected.has(identify(row)));
  const selectedRowIds = [...selected];
  const selectedLoadedRows = (props.data ?? []).filter((row) => selected.has(identify(row)));
  const loadedIds = new Set(identities.values());
  const bulkContext = {
    selectedRowIds,
    selectedRows: selectedLoadedRows,
    selectedCount: selected.size,
    unloadedSelectedRowIds: selectedRowIds.filter((id) => !loadedIds.has(id)),
    clearSelection: () => updateSelection(/* @__PURE__ */ new Set()),
    disabled: loading || Boolean(error),
    state: model.state
  };
  const selectionRows = props.selectionScope === "page" ? model.rows : model.filteredRows;
  const selectedInScope = selectionRows.filter((row) => selected.has(identify(row))).length;
  const allSelected = selectionRows.length > 0 && selectedInScope === selectionRows.length;
  const columnCount = headers.length + Number(hasActions) + Number(selectionEnabled);
  const dataColumnWidths = [
    ...headers.map((header) => ({ key: `column-${header.field}`, width: layout.sizing[header.field] })),
    ...hasActions ? [{ key: "row-actions", width: 160 }] : []
  ];
  const columnWidths = selectionEnabled ? insertSelectionCell(
    dataColumnWidths,
    { key: "selection-column", width: 140 },
    props.selectionColumnPosition
  ) : dataColumnWidths;
  const sort = model.sorting[0];
  useEffect2(() => {
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
    updateSelection(ids);
  }
  const needsAllRows = serverSidePagination && model.count > model.filteredRows.length;
  const exportFetch = needsAllRows ? async (context) => {
    if (!fetchAllForExport) throw new Error("Provide fetchAllForExport to export the full server result.");
    return fetchAllForExport({
      orderBy: sort?.field ?? "",
      order: sort?.order ?? "asc",
      selectedColumns: model.sorting,
      searchText: model.searchText,
      columnFilters: model.columnFilters
    }, context);
  } : void 0;
  function toggleAllRows(checked) {
    const ids = new Set(selected);
    selectionRows.forEach((row) => checked ? ids.add(identify(row)) : ids.delete(identify(row)));
    updateSelection(ids);
  }
  const selectionHeader = /* @__PURE__ */ React8.createElement(Cell, { key: "selection-column" }, /* @__PURE__ */ React8.createElement(
    Checkbox2,
    {
      slotProps: { input: { "aria-label": selectAllLabel } },
      disabled: loading || Boolean(error),
      checked: allSelected,
      indeterminate: selectedInScope > 0 && !allSelected,
      onChange: (event) => toggleAllRows(event.target.checked)
    }
  ), selectionLabel);
  const headerCells = [
    ...headers.map((header) => /* @__PURE__ */ React8.createElement(
      Cell,
      {
        ...slotProps.cell,
        key: `column-${header.field}`,
        style: { ...slotProps.cell?.style, width: resizing ? layout.sizing[header.field] : header.width, ...resizing ? { position: props.stickyHeader ? "sticky" : "relative" } : {}, ...resizing && header.resizable !== false ? { paddingInlineEnd: 14 } : {} },
        "data-column-field": header.field,
        ...props.enableColumnReordering && header.reorderable !== false ? layout.dropProps(header.field) : {},
        align: header.align,
        sortDirection: sort?.field === header.field ? sort.order : false
      },
      (props.enableColumnReordering || resizing) && /* @__PURE__ */ React8.createElement(
        ColumnHeaderControls,
        {
          column: header,
          layout,
          labels,
          direction: activeTheme.direction,
          reorder: props.enableColumnReordering && header.reorderable !== false,
          resize: resizing && header.resizable !== false
        }
      ),
      header.sortable === false ? header.label : /* @__PURE__ */ React8.createElement(
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
      props.tooltipFields?.[header.field] && /* @__PURE__ */ React8.createElement(Tooltip7, { title: props.tooltipFields[header.field].join(", ") }, /* @__PURE__ */ React8.createElement(IconButton7, { size: "small", "aria-label": labels.about(header.label) }, /* @__PURE__ */ React8.createElement(InfoIcon, { fontSize: "small" }))),
      enableColumnFilters && header.filterable !== false && /* @__PURE__ */ React8.createElement(
        TextField2,
        {
          size: "small",
          variant: "filled",
          label: labels.filter(header.label),
          sx: { bgcolor: "background.paper", color: "text.primary", borderRadius: 1, mt: 1, width: "100%" },
          slotProps: {
            inputLabel: { sx: { color: "text.secondary", "&.Mui-focused": { color: "text.primary" } } },
            input: { sx: { color: "text.primary", "&::after": { borderBottomColor: "text.primary" } } }
          },
          value: model.columnFilters[header.field] ?? "",
          onChange: (event) => model.update({
            page: 0,
            columnFilters: { ...model.columnFilters, [header.field]: event.target.value }
          })
        }
      )
    )),
    ...hasActions ? [/* @__PURE__ */ React8.createElement(Cell, { key: "row-actions" }, props.actionsColumnLabel ?? labels.actions)] : []
  ];
  const renderSelectionCell = (row, index) => /* @__PURE__ */ React8.createElement(Cell, { key: "selection-column" }, /* @__PURE__ */ React8.createElement(
    Checkbox2,
    {
      slotProps: { input: { "aria-label": props.enableRowSelection ? labels.selectRow(index + 1) : labels.selectEmailRow(index + 1) } },
      disabled: loading || Boolean(error),
      checked: selected.has(identify(row)),
      onChange: (event) => toggleRow(row, event.target.checked)
    }
  ));
  const controls = {
    search: (props.searchByText || props.enableSearch) && /* @__PURE__ */ React8.createElement(
      Search_default,
      {
        labels,
        searchText: model.searchText,
        handleSearchTextChange: (event) => model.update({ searchText: event.target.value, page: 0 })
      }
    ),
    density: props.enableDensePadding && /* @__PURE__ */ React8.createElement(IconButton7, { "aria-label": labels.densePadding, onClick: () => setDense(!dense) }, /* @__PURE__ */ React8.createElement(DensityMediumIcon, null)),
    sort: props.enableMultiColumnSort && /* @__PURE__ */ React8.createElement(
      MultiColumnSort_default,
      {
        labels,
        headers: headers.filter((h) => h.sortable !== false),
        selectedColumns: model.sorting,
        handleSortChange: (sorting) => model.update({ sorting, page: 0 })
      }
    ),
    export: props.enableExport && /* @__PURE__ */ React8.createElement(
      ExportOptions,
      {
        labels,
        headers,
        data: model.filteredRows,
        pageTitle,
        fetchAllRows: exportFetch,
        onExportStart: props.onExportStart,
        onExportComplete: props.onExportComplete,
        onExportError: props.onExportError,
        onExportCancel: props.onExportCancel,
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
    ),
    themes: props.enableThemes && /* @__PURE__ */ React8.createElement(ThemeSelector_default, { labels, currentTheme: theme, handleThemeChange: setTheme }),
    fullscreen: props.enableFullScreenOption && /* @__PURE__ */ React8.createElement(IconButton7, { "aria-label": labels.fullscreen, onClick: toggleFullscreen }, fullscreen ? /* @__PURE__ */ React8.createElement(FullscreenExitIcon, null) : /* @__PURE__ */ React8.createElement(FullscreenIcon, null)),
    bulkActions: props.renderBulkActions ? props.renderBulkActions(bulkContext) : enableEmail && /* @__PURE__ */ React8.createElement(
      IconButton7,
      {
        "aria-label": labels.sendEmail,
        disabled: !onEmail || loading || Boolean(error),
        onClick: () => onEmail(selectedRows.length ? selectedRows : model.filteredRows)
      },
      /* @__PURE__ */ React8.createElement(EmailIcon, null)
    ),
    custom: props.renderToolbar?.({ ...model, selectedRows, selection: bulkContext })
  };
  const arrangedControls = arrangeToolbarControls(controls, props.toolbarAlignment, props.toolbarPositions);
  const firstRight = arrangedControls.findIndex((control) => control.side === "right");
  const content = /* @__PURE__ */ React8.createElement(Root, { ...slotProps.root, ref, sx: [{ width: "100%", overflow: "auto", p: fullscreen ? 2 : 0 }, slotProps.root?.sx ?? {}] }, /* @__PURE__ */ React8.createElement(Toolbar, { ...slotProps.toolbar, direction: "row", spacing: 1, sx: [{ p: 1, alignItems: "center", flexWrap: "wrap" }, slotProps.toolbar?.sx ?? {}] }, pageTitle && /* @__PURE__ */ React8.createElement(Typography2, { component: "h2", variant: "h6", sx: { flexShrink: 0 } }, pageTitle), arrangedControls.map(({ id, node, side }, index) => /* @__PURE__ */ React8.createElement(React8.Fragment, { key: id }, index === firstRight && /* @__PURE__ */ React8.createElement(Box3, { "aria-hidden": "true", sx: { flexGrow: 1 } }), /* @__PURE__ */ React8.createElement(
    Box3,
    {
      "data-table-toolbar-control": id,
      "data-table-toolbar-side": side,
      sx: { display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }
    },
    node
  )))), fullscreenError && /* @__PURE__ */ React8.createElement(Alert2, { severity: "warning", onClose: () => setFullscreenError("") }, fullscreenError), error && /* @__PURE__ */ React8.createElement(Alert2, { severity: "error" }, error instanceof Error ? error.message : String(error)), loading && /* @__PURE__ */ React8.createElement(LinearProgress, { "aria-label": labels.loading }), model.sorting.length > 0 && /* @__PURE__ */ React8.createElement(Box3, { component: "span", role: "status", sx: { position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" } }, labels.sortSummary(model.sorting)), /* @__PURE__ */ React8.createElement(TableContainer, { sx: { maxHeight: props.maxHeight } }, /* @__PURE__ */ React8.createElement(
    TableComponent,
    {
      ...slotProps.table,
      stickyHeader: props.stickyHeader,
      size: dense ? "small" : "medium",
      sx: [
        ...Array.isArray(slotProps.table?.sx) ? slotProps.table.sx : [slotProps.table?.sx ?? {}],
        ...resizing ? [{ tableLayout: "fixed", width: columnWidths.reduce((sum, column) => sum + column.width, 0) }] : []
      ],
      "aria-label": props["aria-label"] ?? (pageTitle || labels.table),
      "aria-busy": loading
    },
    resizing && /* @__PURE__ */ React8.createElement("colgroup", null, columnWidths.map((column) => /* @__PURE__ */ React8.createElement("col", { key: column.key, style: { width: column.width } }))),
    /* @__PURE__ */ React8.createElement(Head, { ...slotProps.header }, /* @__PURE__ */ React8.createElement(Row, null, selectionEnabled ? insertSelectionCell(headerCells, selectionHeader, props.selectionColumnPosition) : headerCells)),
    /* @__PURE__ */ React8.createElement(Body, { ...slotProps.body }, !error && model.rows.map((row, index) => {
      const rowId = identify(row);
      const cells = [
        ...headers.map((header) => /* @__PURE__ */ React8.createElement(
          Cell,
          {
            ...slotProps.cell,
            key: `column-${header.field}`,
            align: header.align,
            sx: [...Array.isArray(slotProps.cell?.sx) ? slotProps.cell.sx : [slotProps.cell?.sx ?? {}], ...resizing ? [{ overflowWrap: "anywhere" }] : []]
          },
          header.renderCell ? header.renderCell({ row, value: getColumnValue(row, header), rowIndex: index, rowId }) : getColumnText(row, header)
        )),
        ...hasActions ? [/* @__PURE__ */ React8.createElement(ActionCell, { key: "row-actions", ...slotProps.actionCell }, props.renderRowActions ? props.renderRowActions({ row, rowIndex: index, rowId }) : renderLegacyRowActions({ row, actions, icons: props.showActionIcons, visibility: props.actionVisibilityRules }))] : []
      ];
      return /* @__PURE__ */ React8.createElement(Row, { ...slotProps.row, key: rowId, selected: selectionEnabled && selected.has(rowId), hover: true }, selectionEnabled ? insertSelectionCell(cells, renderSelectionCell(row, index), props.selectionColumnPosition) : cells);
    }), !loading && !error && model.rows.length === 0 && /* @__PURE__ */ React8.createElement(Row, null, /* @__PURE__ */ React8.createElement(Cell, { colSpan: Math.max(1, columnCount), align: "center" }, emptyDataMessage)))
  )), /* @__PURE__ */ React8.createElement(
    Footer,
    {
      ...slotProps.footer,
      labels,
      count: model.count,
      page: model.page,
      rowsPerPage: model.rowsPerPage,
      rowsPerPageOptions: props.rowsPerPageOptions,
      onPageChange: (page) => model.update({ page }),
      onRowsPerPageChange: (event) => model.update({ rowsPerPage: Number(event.target.value), page: 0 })
    }
  ));
  return /* @__PURE__ */ React8.createElement(ThemeProvider, { theme: activeTheme }, /* @__PURE__ */ React8.createElement(Box3, null, content));
}
export {
  DynamicTable,
  buildRowModel,
  createPdfBlob,
  createSpringDataSource,
  createTableState,
  createXlsxBlob,
  defaultExportHandlers,
  downloadBlob,
  exportRowsAsCsv,
  exportRowsAsJson,
  exportRowsAsPdf,
  exportRowsAsTxt,
  exportRowsAsXlsx,
  exportWithEndpoint,
  fetchAllSpringRows,
  getColumnText,
  getColumnValue,
  getExportData,
  headersToExportColumns,
  normalizeColumns,
  normalizeSpringPage,
  rowsToCsv,
  rowsToJson,
  rowsToTxt,
  toSpringRequest,
  useTableModel
};
//# sourceMappingURL=index.js.map