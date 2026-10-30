/** Insert the same utility column into header and body arrays. Index includes row-action cells. */
export function insertSelectionCell(cells, cell, position = 'first') {
  const index = position === 'first' ? 0 : position === 'last' ? cells.length : position;
  if (!Number.isInteger(index) || index < 0 || index > cells.length) {
    throw new RangeError(`selectionColumnPosition must be first, last, or an index from 0 to ${cells.length}.`);
  }
  return [...cells.slice(0, index), cell, ...cells.slice(index)];
}

/** Group by side without changing control keys or introducing different React parents. */
export function arrangeToolbarControls(controls, alignment = 'left', positions = {}) {
  if (!['left', 'right'].includes(alignment)) throw new Error('toolbarAlignment must be left or right.');
  for (const [key, side] of Object.entries(positions)) {
    if (!Object.hasOwn(controls, key)) throw new Error(`Unknown toolbar control: ${key}`);
    if (!['left', 'right'].includes(side)) throw new Error(`Toolbar position for ${key} must be left or right.`);
  }
  return Object.entries(controls)
    .map(([id, node]) => ({ id, node, side: positions[id] ?? alignment }))
    .filter(({ node }) => node !== false && node !== null && node !== undefined)
    .sort((a, b) => Number(a.side === 'right') - Number(b.side === 'right'));
}
