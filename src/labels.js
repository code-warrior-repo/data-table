export const defaultTableLabels = {
  selection: 'Selection', selectAllRows: 'Select all rows', selectRow: index => `Select row ${index}`,
  table: 'Data table', empty: 'No matching records.', actions: 'Actions', email: 'Email', sendEmail: 'Send email',
  selectAllEmails: 'Select all emails', selectEmailRow: index => `Select email row ${index}`,
  search: 'Search', openSearch: 'Open search', closeSearch: 'Close search',
  densePadding: 'Dense padding', fullscreen: 'Toggle fullscreen', loading: 'Loading rows',
  sortMenu: 'Multi-column sort', clearSorting: 'Clear Sorting', themeSelector: 'theme selector',
  moveColumn: label => `Move ${label}`, resizeColumn: label => `Resize ${label}`,
  moveColumnStart: 'Move toward start', moveColumnEnd: 'Move toward end', columnWidth: width => `${width} pixels`,
  filter: label => `Filter ${label}`, about: label => `About ${label}`,
  sortSummary: sorting => sorting.map((sort, index) => `${sort.field}: ${sort.order}, priority ${index + 1}`).join('; '),
  rowsPerPage: 'Rows per page:', firstPage: 'Go to first page', previousPage: 'Go to previous page',
  nextPage: 'Go to next page', lastPage: 'Go to last page',
  displayedRows: ({ from, to, count }) => `${from}–${to} of ${count}`,
  exportMenu: 'Export menu', exporting: 'Preparing export', cancelExport: 'Cancel export',
  exportProgress: ({ loaded, total }) => `Exporting ${loaded} of ${total} rows`
};
