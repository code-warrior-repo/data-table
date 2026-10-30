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
import React7, { useEffect as useEffect2, useMemo as useMemo2, useRef as useRef3, useState as useState5 } from "react";
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
  Typography as Typography2
} from "@mui/material";
import { createTheme as createTheme2, ThemeProvider, useTheme } from "@mui/material/styles";
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
  default: createTheme(),
  grey: createTheme({
    palette: {
      primary: { main: "#616161" },
      secondary: { main: "#757575" },
      background: { default: "#eeeeee", paper: "#f5f5f5" }
    }
  }),
  blue: createTheme({
    palette: {
      primary: { main: "#1565c0" },
      secondary: { main: "#7b1fa2" },
      background: { default: "#e3f2fd", paper: "#f0f7ff" }
    }
  }),
  light: createTheme({ palette: { mode: "light" } }),
  dark: createTheme({ palette: { mode: "dark" } })
};

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
import TableCell from "@mui/material/TableCell";
import { default as default2 } from "@mui/material/TableCell";
import { default as default3 } from "@mui/material/TableRow";
var StyledActionTableCell = styled(TableCell)({
  whiteSpace: "nowrap",
  width: "1%"
});

// src/CustomTablePagination.jsx
import React5 from "react";
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
import { useCallback, useLayoutEffect, useMemo, useRef as useRef2, useState as useState4 } from "react";
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
  const ownership = useRef2(ownedKeys);
  if (ownership.current !== ownedKeys) throw new Error("Controlled state keys must remain fixed; remount to change ownership.");
  const [internal, setInternal] = useState4(() => createTableState({
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
  const latest = useRef2(settings);
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
import React6 from "react";
import { Button as Button2, IconButton as IconButton5, Stack, Tooltip as Tooltip5 } from "@mui/material";
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
  const Body = slots.body ?? TableBody, Row = slots.row ?? default3, Cell = slots.cell ?? default2;
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
  const headers = useMemo2(() => normalizeColumns(props.headers), [props.headers]);
  const model = useTableModel({ ...props, headers });
  const [theme, setTheme] = useState5("default");
  const applicationTheme = useTheme();
  const activeTheme = useMemo2(() => props.enableThemes && theme !== "default" ? createTheme2(applicationTheme, { palette: themes[theme].palette }) : applicationTheme, [applicationTheme, props.enableThemes, theme]);
  const [dense, setDense] = useState5(false);
  const [fullscreen, setFullscreen] = useState5(false);
  const [fullscreenError, setFullscreenError] = useState5("");
  const [selection, setSelection] = useState5({ data: props.data, datasetKey: props.datasetKey, ids: new Set(props.initialSelectedRowIds ?? []) });
  const selectionValid = Object.is(selection.datasetKey, props.datasetKey) && (props.selectionReset === "dataset" || selection.data === props.data);
  const selected = props.selectedRowIds !== void 0 ? new Set(props.selectedRowIds) : selectionValid ? selection.ids : /* @__PURE__ */ new Set();
  useEffect2(() => {
    setSelection((previous) => {
      const valid = Object.is(previous.datasetKey, props.datasetKey) && (props.selectionReset === "dataset" || previous.data === props.data);
      return valid ? previous : { data: props.data, datasetKey: props.datasetKey, ids: /* @__PURE__ */ new Set() };
    });
  }, [props.data, props.datasetKey, props.selectionReset]);
  const ref = useRef3(null);
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
  const selectionHeader = /* @__PURE__ */ React7.createElement(Cell, { key: "selection-column" }, /* @__PURE__ */ React7.createElement(
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
    ...headers.map((header) => /* @__PURE__ */ React7.createElement(
      Cell,
      {
        ...slotProps.cell,
        key: `column-${header.field}`,
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
      props.tooltipFields?.[header.field] && /* @__PURE__ */ React7.createElement(Tooltip6, { title: props.tooltipFields[header.field].join(", ") }, /* @__PURE__ */ React7.createElement(IconButton6, { size: "small", "aria-label": labels.about(header.label) }, /* @__PURE__ */ React7.createElement(InfoIcon, { fontSize: "small" }))),
      enableColumnFilters && header.filterable !== false && /* @__PURE__ */ React7.createElement(
        TextField2,
        {
          size: "small",
          label: labels.filter(header.label),
          value: model.columnFilters[header.field] ?? "",
          onChange: (event) => model.update({
            page: 0,
            columnFilters: { ...model.columnFilters, [header.field]: event.target.value }
          })
        }
      )
    )),
    ...hasActions ? [/* @__PURE__ */ React7.createElement(Cell, { key: "row-actions" }, props.actionsColumnLabel ?? labels.actions)] : []
  ];
  const renderSelectionCell = (row, index) => /* @__PURE__ */ React7.createElement(Cell, { key: "selection-column" }, /* @__PURE__ */ React7.createElement(
    Checkbox2,
    {
      slotProps: { input: { "aria-label": props.enableRowSelection ? labels.selectRow(index + 1) : labels.selectEmailRow(index + 1) } },
      disabled: loading || Boolean(error),
      checked: selected.has(identify(row)),
      onChange: (event) => toggleRow(row, event.target.checked)
    }
  ));
  const controls = {
    search: (props.searchByText || props.enableSearch) && /* @__PURE__ */ React7.createElement(
      Search_default,
      {
        labels,
        searchText: model.searchText,
        handleSearchTextChange: (event) => model.update({ searchText: event.target.value, page: 0 })
      }
    ),
    density: props.enableDensePadding && /* @__PURE__ */ React7.createElement(IconButton6, { "aria-label": labels.densePadding, onClick: () => setDense(!dense) }, /* @__PURE__ */ React7.createElement(DensityMediumIcon, null)),
    sort: props.enableMultiColumnSort && /* @__PURE__ */ React7.createElement(
      MultiColumnSort_default,
      {
        labels,
        headers: headers.filter((h) => h.sortable !== false),
        selectedColumns: model.sorting,
        handleSortChange: (sorting) => model.update({ sorting, page: 0 })
      }
    ),
    export: props.enableExport && /* @__PURE__ */ React7.createElement(
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
    themes: props.enableThemes && /* @__PURE__ */ React7.createElement(ThemeSelector_default, { labels, currentTheme: theme, handleThemeChange: setTheme }),
    fullscreen: props.enableFullScreenOption && /* @__PURE__ */ React7.createElement(IconButton6, { "aria-label": labels.fullscreen, onClick: toggleFullscreen }, fullscreen ? /* @__PURE__ */ React7.createElement(FullscreenExitIcon, null) : /* @__PURE__ */ React7.createElement(FullscreenIcon, null)),
    bulkActions: props.renderBulkActions ? props.renderBulkActions(bulkContext) : enableEmail && /* @__PURE__ */ React7.createElement(
      IconButton6,
      {
        "aria-label": labels.sendEmail,
        disabled: !onEmail || loading || Boolean(error),
        onClick: () => onEmail(selectedRows.length ? selectedRows : model.filteredRows)
      },
      /* @__PURE__ */ React7.createElement(EmailIcon, null)
    ),
    custom: props.renderToolbar?.({ ...model, selectedRows, selection: bulkContext })
  };
  const arrangedControls = arrangeToolbarControls(controls, props.toolbarAlignment, props.toolbarPositions);
  const firstRight = arrangedControls.findIndex((control) => control.side === "right");
  const content = /* @__PURE__ */ React7.createElement(Root, { ...slotProps.root, ref, sx: [{ width: "100%", overflow: "auto", p: fullscreen ? 2 : 0 }, slotProps.root?.sx ?? {}] }, /* @__PURE__ */ React7.createElement(Toolbar, { ...slotProps.toolbar, direction: "row", spacing: 1, sx: [{ p: 1, alignItems: "center", flexWrap: "wrap" }, slotProps.toolbar?.sx ?? {}] }, pageTitle && /* @__PURE__ */ React7.createElement(Typography2, { component: "h2", variant: "h6", sx: { flexShrink: 0 } }, pageTitle), arrangedControls.map(({ id, node, side }, index) => /* @__PURE__ */ React7.createElement(React7.Fragment, { key: id }, index === firstRight && /* @__PURE__ */ React7.createElement(Box2, { "aria-hidden": "true", sx: { flexGrow: 1 } }), /* @__PURE__ */ React7.createElement(
    Box2,
    {
      "data-table-toolbar-control": id,
      "data-table-toolbar-side": side,
      sx: { display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }
    },
    node
  )))), fullscreenError && /* @__PURE__ */ React7.createElement(Alert2, { severity: "warning", onClose: () => setFullscreenError("") }, fullscreenError), error && /* @__PURE__ */ React7.createElement(Alert2, { severity: "error" }, error instanceof Error ? error.message : String(error)), loading && /* @__PURE__ */ React7.createElement(LinearProgress, { "aria-label": labels.loading }), model.sorting.length > 0 && /* @__PURE__ */ React7.createElement(Box2, { component: "span", role: "status", sx: { position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" } }, labels.sortSummary(model.sorting)), /* @__PURE__ */ React7.createElement(TableContainer, { sx: { maxHeight: props.maxHeight } }, /* @__PURE__ */ React7.createElement(
    TableComponent,
    {
      ...slotProps.table,
      stickyHeader: props.stickyHeader,
      size: dense ? "small" : "medium",
      "aria-label": props["aria-label"] ?? (pageTitle || labels.table),
      "aria-busy": loading
    },
    /* @__PURE__ */ React7.createElement(Head, { ...slotProps.header }, /* @__PURE__ */ React7.createElement(Row, null, selectionEnabled ? insertSelectionCell(headerCells, selectionHeader, props.selectionColumnPosition) : headerCells)),
    /* @__PURE__ */ React7.createElement(Body, { ...slotProps.body }, !error && model.rows.map((row, index) => {
      const rowId = identify(row);
      const cells = [
        ...headers.map((header) => /* @__PURE__ */ React7.createElement(Cell, { ...slotProps.cell, key: `column-${header.field}`, align: header.align }, header.renderCell ? header.renderCell({ row, value: getColumnValue(row, header), rowIndex: index, rowId }) : getColumnText(row, header))),
        ...hasActions ? [/* @__PURE__ */ React7.createElement(ActionCell, { key: "row-actions", ...slotProps.actionCell }, props.renderRowActions ? props.renderRowActions({ row, rowIndex: index, rowId }) : renderLegacyRowActions({ row, actions, icons: props.showActionIcons, visibility: props.actionVisibilityRules }))] : []
      ];
      return /* @__PURE__ */ React7.createElement(Row, { ...slotProps.row, key: rowId, selected: selectionEnabled && selected.has(rowId), hover: true }, selectionEnabled ? insertSelectionCell(cells, renderSelectionCell(row, index), props.selectionColumnPosition) : cells);
    }), !loading && !error && model.rows.length === 0 && /* @__PURE__ */ React7.createElement(Row, null, /* @__PURE__ */ React7.createElement(Cell, { colSpan: Math.max(1, columnCount), align: "center" }, emptyDataMessage)))
  )), /* @__PURE__ */ React7.createElement(
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
  return /* @__PURE__ */ React7.createElement(ThemeProvider, { theme: activeTheme }, /* @__PURE__ */ React7.createElement(Box2, null, content));
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