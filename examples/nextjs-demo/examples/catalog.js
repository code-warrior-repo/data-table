export const examples = [
  {
    "slug": "basic",
    "title": "Basic table",
    "group": "Data",
    "description": "Render object rows with stable IDs."
  },
  {
    "slug": "column-options",
    "title": "Column options",
    "group": "Data",
    "description": "Set widths, alignment and per-column capability opt-outs."
  },
  {
    "slug": "composite-columns",
    "title": "Composite columns",
    "group": "Data",
    "description": "Join fields with a separator and suffix."
  },
  {
    "slug": "computed-values",
    "title": "Computed values",
    "group": "Data",
    "description": "A valueGetter powers display, search and sorting."
  },
  {
    "slug": "custom-cells",
    "title": "Custom cells",
    "group": "Data",
    "description": "Render MUI chips and formatted amounts without changing raw sort values."
  },
  {
    "slug": "date-formatting",
    "title": "Date formatting",
    "group": "Data",
    "description": "Format date-only strings and Date objects independently."
  },
  {
    "slug": "nested-columns",
    "title": "Nested fields",
    "group": "Data",
    "description": "Read values through dot paths."
  },
  {
    "slug": "pagination",
    "title": "Client pagination",
    "group": "Query",
    "description": "Change pages and page sizes, including All."
  },
  {
    "slug": "column-filters",
    "title": "Column filters",
    "group": "Query",
    "description": "Combine case-insensitive substring filters across columns."
  },
  {
    "slug": "controlled-page",
    "title": "Controlled page",
    "group": "Query",
    "description": "External buttons control currentPage; the built-in pager uses the same state."
  },
  {
    "slug": "custom-sort",
    "title": "Custom comparator",
    "group": "Query",
    "description": "Sort statuses in business order rather than alphabetically."
  },
  {
    "slug": "custom-filter",
    "title": "Custom filter predicate",
    "group": "Query",
    "description": "The score filter uses a minimum threshold rather than substring matching."
  },
  {
    "slug": "search",
    "title": "Global search",
    "group": "Query",
    "description": "Open the search icon, type a name, status or score, then close it to clear."
  },
  {
    "slug": "multi-sort",
    "title": "Multi-column sorting",
    "group": "Query",
    "description": "Use the sort icon to add priority columns; cycle ascending, descending and removed."
  },
  {
    "slug": "single-sort",
    "title": "Single-column sorting",
    "group": "Query",
    "description": "Click a header to alternate ascending and descending order."
  },
  {
    "slug": "row-actions",
    "title": "Caller-defined row actions",
    "group": "Actions",
    "description": "Define action buttons at the call site and inspect the row passed to the handler."
  },
  {
    "slug": "conditional-actions",
    "title": "Conditional and disabled actions",
    "group": "Actions",
    "description": "Only active rows have an Edit action; pending work disables the button."
  },
  {
    "slug": "display-column",
    "title": "Display-only action column",
    "group": "Actions",
    "description": "Position controls before data columns; they are excluded from all data operations."
  },
  {
    "slug": "email-selection",
    "title": "Email selection",
    "group": "Actions",
    "description": "Select matching rows or leave selection empty to use all matching rows. No email is sent."
  },
  {
    "slug": "action-menu",
    "title": "Row action menu",
    "group": "Actions",
    "description": "A caller-owned component uses hooks to manage a menu for each row."
  },
  {
    "slug": "action-descriptors",
    "title": "Action descriptors",
    "group": "Compatibility",
    "description": "Use dynamic visibility and disabled rules with the descriptor API."
  },
  {
    "slug": "legacy-clone",
    "title": "Legacy Clone action",
    "group": "Compatibility",
    "description": "An individual original action flag and callback; this demo reports intent without mutating data."
  },
  {
    "slug": "legacy-delete",
    "title": "Legacy Delete action",
    "group": "Compatibility",
    "description": "An individual original action flag and callback; this demo reports intent without mutating data."
  },
  {
    "slug": "legacy-edit",
    "title": "Legacy Edit action",
    "group": "Compatibility",
    "description": "An individual original action flag and callback; this demo reports intent without mutating data."
  },
  {
    "slug": "legacy-report",
    "title": "Legacy Report action",
    "group": "Compatibility",
    "description": "An individual original action flag and callback; this demo reports intent without mutating data."
  },
  {
    "slug": "legacy-view",
    "title": "Legacy View action",
    "group": "Compatibility",
    "description": "An individual original action flag and callback; this demo reports intent without mutating data."
  },
  {
    "slug": "legacy-action-options",
    "title": "Legacy action options",
    "group": "Compatibility",
    "description": "Customize labels, icon presentation and visibility predicates."
  },
  {
    "slug": "export-csv",
    "title": "CSV export",
    "group": "Output",
    "description": "Download only this format using the export menu."
  },
  {
    "slug": "custom-export-handler",
    "title": "Custom export handler",
    "group": "Output",
    "description": "Replace one format handler and inspect the export context instead of downloading."
  },
  {
    "slug": "endpoint-export",
    "title": "Endpoint export",
    "group": "Output",
    "description": "Download an endpoint response using exportWithEndpoint."
  },
  {
    "slug": "export-columns",
    "title": "Export values and exclusions",
    "group": "Output",
    "description": "Exclude private fields and format export values independently of rendered cells."
  },
  {
    "slug": "export-json",
    "title": "JSON export",
    "group": "Output",
    "description": "Download only this format using the export menu."
  },
  {
    "slug": "export-pdf",
    "title": "PDF export",
    "group": "Output",
    "description": "Download only this format using the export menu."
  },
  {
    "slug": "export-txt",
    "title": "TXT export",
    "group": "Output",
    "description": "Download only this format using the export menu."
  },
  {
    "slug": "export-xlsx",
    "title": "XLSX export",
    "group": "Output",
    "description": "Download only this format using the export menu."
  },
  {
    "slug": "server-export",
    "title": "Full-result server export",
    "group": "Remote",
    "description": "Resolve every matching row before downloading a partial backend dataset."
  },
  {
    "slug": "server-pagination",
    "title": "Server pagination and cancellation",
    "group": "Remote",
    "description": "Fetch simulated pages and cancel obsolete queries."
  },
  {
    "slug": "spring-adapter",
    "title": "Spring Data adapter",
    "group": "Remote",
    "description": "Adapt pageable requests and Spring Page responses without a real server."
  },
  {
    "slug": "parent-theme",
    "title": "Application theme",
    "group": "Presentation",
    "description": "The table inherits a parent MUI ThemeProvider when the library selector is disabled."
  },
  {
    "slug": "themes",
    "title": "Built-in theme selector",
    "group": "Presentation",
    "description": "Choose one of the library themes."
  },
  {
    "slug": "density",
    "title": "Density toggle",
    "group": "Presentation",
    "description": "Use the density icon to switch row padding."
  },
  {
    "slug": "fullscreen",
    "title": "Fullscreen toggle",
    "group": "Presentation",
    "description": "Enter and exit browser fullscreen. Unsupported browsers show feedback."
  },
  {
    "slug": "header-tooltips",
    "title": "Header tooltips",
    "group": "Presentation",
    "description": "Open the info buttons for column guidance."
  },
  {
    "slug": "sticky-header",
    "title": "Sticky header and bounded height",
    "group": "Presentation",
    "description": "Scroll the table body while its header stays visible."
  },
  {
    "slug": "empty-state",
    "title": "Empty state",
    "group": "Feedback",
    "description": "Show a custom message when there are no matching records."
  },
  {
    "slug": "error-state",
    "title": "Error state",
    "group": "Feedback",
    "description": "Display an error and suppress stale body rows."
  },
  {
    "slug": "export-errors",
    "title": "Export failure feedback",
    "group": "Feedback",
    "description": "A simulated resolver failure produces a visible error notification."
  },
  {
    "slug": "loading-state",
    "title": "Loading state",
    "group": "Feedback",
    "description": "Display progress and mark the table as busy."
  },
  {
    "slug": "custom-toolbar",
    "title": "Custom toolbar",
    "group": "Extension",
    "description": "Add a query reset button and matching-row counter."
  },
  {
    "slug": "pure-row-model",
    "title": "Pure row model",
    "group": "Extension",
    "description": "Filter, sort and page outside the table component."
  },
  {
    "slug": "headless-hook",
    "title": "Reusable state hook",
    "group": "Extension",
    "description": "Use useTableModel with application-owned rendering."
  },
  {
    "slug": "blob-builders",
    "title": "Standalone Blob builders",
    "group": "Extension",
    "description": "Generate XLSX/PDF blobs separately from downloading."
  },
  {
    "slug": "serialization",
    "title": "Standalone serializers",
    "group": "Extension",
    "description": "Inspect CSV, TXT and JSON without creating a download."
  }
];
