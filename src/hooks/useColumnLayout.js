import { useId, useState } from 'react';
import { columnBounds, moveColumn, resolveColumnOrder, resolveColumnSizing } from '../core/columnLayout.js';

const DRAG_TYPE = 'application/x-mui-data-table-column';
export function useColumnLayout(columns, props) {
  const tableId = useId();
  const [internalOrder, setInternalOrder] = useState(() => props.initialColumnOrder ?? []);
  const [internalSizing, setInternalSizing] = useState(() => props.initialColumnSizing ?? {});
  const order = resolveColumnOrder(columns, props.columnOrder ?? internalOrder);
  const sizing = resolveColumnSizing(columns, props.columnSizing ?? internalSizing, props);
  const byField = new Map(columns.map(column => [column.field, column]));
  function move(field, target) {
    const next = moveColumn(columns, order, field, target);
    if (next === order) return;
    if (props.columnOrder === undefined) setInternalOrder(next);
    props.onColumnOrderChange?.(next);
  }
  function resize(field, width) {
    const { min, max } = columnBounds(byField.get(field), props);
    const nextWidth = Math.min(max, Math.max(min, width));
    if (nextWidth === sizing[field]) return;
    const next = { ...sizing, [field]: nextWidth };
    if (props.columnSizing === undefined) setInternalSizing(next);
    props.onColumnSizingChange?.(next);
  }
  const movable = order.filter(field => byField.get(field).reorderable !== false);
  return {
    headers: order.map(field => byField.get(field)), order, sizing, resize,
    bounds: column => columnBounds(column, props),
    neighbor: (field, step) => movable[movable.indexOf(field) + step],
    move,
    dragProps: field => ({
      draggable: true,
      onDragStart: event => {
        event.dataTransfer.setData(DRAG_TYPE, JSON.stringify({ tableId, field }));
        event.dataTransfer.effectAllowed = 'move';
      },
    }),
    dropProps: field => ({
      onDragOver: event => {
        if (event.dataTransfer.types.includes(DRAG_TYPE)) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }
      },
      onDrop: event => {
        const payload = event.dataTransfer.getData(DRAG_TYPE);
        if (!payload) return;
        event.preventDefault();
        let source;
        try { source = JSON.parse(payload); } catch { return; }
        if (source?.tableId === tableId) move(source.field, field);
      },
    }),
  };
}
