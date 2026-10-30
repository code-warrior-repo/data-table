import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, IconButton, Menu, MenuItem, Snackbar, Tooltip, Typography } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { defaultExportHandlers } from './exports.js';
import { headersToExportColumns } from './core/columns.js';
import { defaultTableLabels } from './labels.js';
import { timestamp } from './exportUtils.js';

export default function ExportOptions({ data = [], headers, pageTitle = '', fetchAllRows,
  exportOptions = {}, exportHandlers = {}, state, disabled = false,
  onExportStart, onExportComplete, onExportError, onExportCancel, labels = defaultTableLabels }) {
  const [anchor, setAnchor] = useState(null);
  const [busy, setBusy] = useState(false);
  const active = useRef(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(null);
  useEffect(() => () => { active.current?.controller.abort(); active.current = null; }, []);

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
    const snapshot = state ? { ...state, sorting: state.sorting.map(sort => ({ ...sort })), columnFilters: { ...state.columnFilters } } : undefined;
    const filename = `${pageTitle.replace(/[^a-z0-9_-]+/gi, '_') || 'table'}_${timestamp()}.${format}`;
    const controller = new AbortController();
    const info = { format, filename, state: snapshot };
    const job = { controller, info };
    active.current = job;
    const signal = controller.signal;
    const onProgress = value => { if (active.current === job && !signal.aborted) setProgress(value); };
    setBusy(true);
    setError('');
    setAnchor(null);
    try {
      onExportStart?.(info);
      const configured = exportHandlers[format] ?? defaultExportHandlers[format];
      const handler = typeof configured === 'function' ? configured : configured.handler;
      const rows = configured.mode === 'endpoint' ? [] : fetchAllRows ? await fetchAllRows({ signal, onProgress }) : data;
      if (signal.aborted || active.current !== job) return;
      if (!Array.isArray(rows)) throw new Error('Export must return an array of rows.');
      await handler({ rows, columns: headersToExportColumns(headers), title: pageTitle, filename,
        state: snapshot, signal, onProgress });
      if (!signal.aborted && active.current === job) onExportComplete?.({ ...info, rowCount: configured.mode === 'endpoint' ? undefined : rows.length });
    } catch (cause) {
      if (!signal.aborted && active.current === job) {
        const failure = cause instanceof Error ? cause : new Error(String(cause));
        setError(failure.message);
        onExportError?.(failure, info);
      }
    } finally {
      if (active.current === job) { active.current = null; setBusy(false); setProgress(null); }
    }
  }
  return <>
    <Tooltip describeChild title={labels.exportMenu}><span><IconButton aria-label={labels.exportMenu} disabled={busy || disabled}
      onClick={event => setAnchor(event.currentTarget)}><FileDownloadIcon /></IconButton></span></Tooltip>
    {busy && <><Typography role="status">{progress ? labels.exportProgress(progress) : labels.exporting}</Typography>
      <Button onClick={cancel}>{labels.cancelExport}</Button></>}
    <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
      {['csv', 'txt', 'xlsx', 'pdf', 'json'].filter(format => exportOptions[format] ?? format !== 'json')
        .map(format => <MenuItem key={format} onClick={() => run(format)}>{format.toUpperCase()}</MenuItem>)}
    </Menu>
    <Snackbar open={Boolean(error)} autoHideDuration={6000} onClose={() => setError('')}>
      <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
    </Snackbar>
  </>;
}
