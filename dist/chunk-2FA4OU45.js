// src/exports.js
function checkAbort(signal) {
  if (signal?.aborted) throw signal.reason ?? new DOMException("Export aborted", "AbortError");
}
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  try {
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1e3);
  }
}
function csvCell(value) {
  const text = textValue(value);
  const formula = /^[\s\u0000-\u001f]*[=+@\-＝＋＠－]|^[\t\r\n]/u.test(text);
  const safe = typeof value !== "number" && formula ? "'" + text : text;
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
  return [headers, ...values].map((row) => row.map((value) => csvCell(value)).join(",")).join("\r\n");
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
  checkAbort(context.signal);
  const text = rowsToCsv(context);
  checkAbort(context.signal);
  downloadBlob(new Blob(["\uFEFF", text], { type: "text/csv;charset=utf-8" }), filename);
}
function exportRowsAsTxt({ filename = "table.txt", ...context }) {
  checkAbort(context.signal);
  const text = rowsToTxt(context);
  checkAbort(context.signal);
  downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), filename);
}
function exportRowsAsJson({ filename = "table.json", ...context }) {
  checkAbort(context.signal);
  const text = rowsToJson(context);
  checkAbort(context.signal);
  downloadBlob(new Blob([text], { type: "application/json;charset=utf-8" }), filename);
}
async function createXlsxBlob(context) {
  checkAbort(context.signal);
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
  const buffer = await workbook.xlsx.writeBuffer();
  checkAbort(context.signal);
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  });
}
async function exportRowsAsXlsx({ filename = "table.xlsx", ...context }) {
  const blob = await createXlsxBlob(context);
  checkAbort(context.signal);
  downloadBlob(blob, filename);
}
async function createPdfBlob(context) {
  checkAbort(context.signal);
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
  const blob = doc.output("blob");
  checkAbort(context.signal);
  return blob;
}
async function exportRowsAsPdf({ filename = "table.pdf", ...context }) {
  const blob = await createPdfBlob(context);
  checkAbort(context.signal);
  downloadBlob(blob, filename);
}
var defaultExportHandlers = {
  pdf: exportRowsAsPdf,
  txt: exportRowsAsTxt,
  json: exportRowsAsJson,
  xlsx: exportRowsAsXlsx,
  csv: exportRowsAsCsv
};
async function exportWithEndpoint({ url, filename, fetcher = fetch, signal, method = "GET", body }) {
  checkAbort(signal);
  const response = await fetcher(url, { method, signal, credentials: "same-origin", ...body == null ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } });
  if (!response.ok) throw new Error(`Export failed (${response.status})`);
  const blob = await response.blob();
  checkAbort(signal);
  downloadBlob(blob, filename);
}

export {
  downloadBlob,
  getExportData,
  rowsToCsv,
  rowsToTxt,
  rowsToJson,
  exportRowsAsCsv,
  exportRowsAsTxt,
  exportRowsAsJson,
  createXlsxBlob,
  exportRowsAsXlsx,
  createPdfBlob,
  exportRowsAsPdf,
  defaultExportHandlers,
  exportWithEndpoint
};
//# sourceMappingURL=chunk-2FA4OU45.js.map