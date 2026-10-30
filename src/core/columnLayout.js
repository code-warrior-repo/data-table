/** Presentation state is keyed by stable column fields, independent of row/query state. */
export function resolveColumnOrder(columns, order = []) {
  if (!Array.isArray(order) || order.some(field => typeof field !== 'string') || new Set(order).size !== order.length) {
    throw new Error('columnOrder must be an array of unique field strings.');
  }
  const requested = new Set(order);
  const known = new Set(columns.map(column => column.field));
  return [...order.filter(field => known.has(field)), ...columns.map(column => column.field).filter(field => !requested.has(field))];
}

export function moveColumn(columns, order, field, target) {
  const movable = new Set(columns.filter(column => column.reorderable !== false).map(column => column.field));
  if (!movable.has(field) || !movable.has(target) || field === target) return order;
  const sequence = order.filter(key => movable.has(key));
  const from = sequence.indexOf(field), to = sequence.indexOf(target);
  if (from < 0 || to < 0) return order;
  sequence.splice(to, 0, sequence.splice(from, 1)[0]);
  let index = 0;
  return order.map(key => movable.has(key) ? sequence[index++] : key);
}

function positive(value, name) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) throw new Error(`${name} must be a finite positive pixel width.`);
  return value;
}

export function columnBounds(column, { defaultColumnWidth = 180, minColumnWidth = 80, maxColumnWidth = 800 } = {}) {
  const min = positive(column.minWidth ?? minColumnWidth, 'minWidth');
  const max = positive(column.maxWidth ?? maxColumnWidth, 'maxWidth');
  if (min > max) throw new Error('Column minWidth must not exceed maxWidth.');
  const declared = typeof column.width === 'string' && /^\d+(\.\d+)?px$/.test(column.width) ? Number.parseFloat(column.width) : column.width;
  const width = typeof declared === 'number' ? positive(declared, 'width') : positive(defaultColumnWidth, 'defaultColumnWidth');
  return { min, max, width: Math.min(max, Math.max(min, width)) };
}

export function resolveColumnSizing(columns, sizing = {}, options) {
  if (!sizing || typeof sizing !== 'object' || Array.isArray(sizing)) throw new Error('columnSizing must be an object of pixel widths keyed by field.');
  return Object.fromEntries(columns.map(column => {
    const { min, max, width } = columnBounds(column, options);
    const requested = Object.hasOwn(sizing, column.field) ? positive(sizing[column.field], `columnSizing.${column.field}`) : width;
    return [column.field, Math.min(max, Math.max(min, requested))];
  }));
}
