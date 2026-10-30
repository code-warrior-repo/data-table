import React, { useRef, useState } from 'react';
import { Alert, IconButton, Menu, MenuItem, Snackbar, Tooltip } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { defaultExportHandlers } from './exports.js';
import { headersToExportColumns } from './core/columns.js';
import { timestamp } from './exportUtils.js';

export default function ExportOptions({ data = [], headers, pageTitle = '', fetchAllRows,
  exportOptions = {}, exportHandlers = {}, state, disabled = false }) {
  const [anchor, setAnchor] = useState(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState('');
  async function run(format) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setAnchor(null);
    try {
      const rows = fetchAllRows ? await fetchAllRows() : data;
      if (!Array.isArray(rows)) throw new Error('Export must return an array of rows.');
      const filename = `${pageTitle.replace(/[^a-z0-9_-]+/gi, '_') || 'table'}_${timestamp()}.${format}`;
      await (exportHandlers[format] ?? defaultExportHandlers[format])({ rows,
        columns: headersToExportColumns(headers), title: pageTitle, filename, state });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Export failed.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return <>
    <Tooltip title="Export"><span><IconButton aria-label="Export menu" disabled={busy || disabled}
      onClick={event => setAnchor(event.currentTarget)}><FileDownloadIcon /></IconButton></span></Tooltip>
    <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
      {['csv', 'txt', 'xlsx', 'pdf', 'json'].filter(format => exportOptions[format] ?? format !== 'json')
        .map(format => <MenuItem key={format} onClick={() => run(format)}>{format.toUpperCase()}</MenuItem>)}
    </Menu>
    <Snackbar open={Boolean(error)} autoHideDuration={6000} onClose={() => setError('')}>
      <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
    </Snackbar>
  </>;
}
