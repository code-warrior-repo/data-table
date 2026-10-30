# Changelog

## Unreleased — production hardening

### Theme selection

- Made Grey/Blue presets visibly tint the table surface and added a standard MUI Dark preset. Default still follows the application theme.
- Theme changes preserve mounted controls and application typography/component overrides; the menu now marks the active choice.

### Generic selection and toolbar placement

- Added `renderBulkActions` for caller-owned remove/delete/email/custom actions, with selected IDs, loaded rows, unloaded IDs and a clear-selection callback.
- Added `selectionColumnPosition`: first (new default), last, or a zero-based position. Use last to retain prior email-checkbox placement.
- Added `toolbarAlignment` (left by default) and `toolbarPositions` overrides for individual controls.
- Toolbar repositioning preserves control state and active exports. Custom bulk rendering takes precedence over the legacy email button.


- Added native per-slice controlled query state, `initialState`, state/query callbacks and `createTableState`.
- Added declaration files and server-safe `/core`, `/spring` and `/exports` entry points.
- Added cancellable export jobs, progress, lifecycle callbacks and endpoint-mode handlers.
- Added total-order typed comparisons, explicit null placement and raw typed export values.
- Added stable-ID validation, controlled selection, dataset reset policy and selection scope.
- Added named component slots, control labels and separate filtering/sorting versus pagination memoization.
- Added strict consumer/package checks, real-browser/axe tests and CI runtime/browser matrices.

### Migration changes

- Interactive rows require stable unique IDs; duplicate IDs are rejected for all rows.
- Table-driven export defaults now preserve raw values. Use `exportValue` to restore display-text formatting.
- Null/invalid values sort last in either direction by default. Empty strings/booleans are not numeric-coerced.
- Controlled query keys remain fixed for a mounted instance; remount to change ownership.
- Empty/no-op query patches do not emit callbacks. Changes to initial props remain initialization-only.
- Existing row action flags, search alias and server page callback remain supported.

The dependency audit findings, distribution license decision and manual screen-reader/runtime qualification remain release gates; the presence of CI configuration does not mean hosted CI has executed.
