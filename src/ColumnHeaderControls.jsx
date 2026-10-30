import React, { useRef, useState } from 'react';
import { Box, IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

/** Independent move/resize controls keep sorting, filtering and drag gestures separate. */
export default function ColumnHeaderControls({ column, layout, labels, reorder, resize, direction }) {
  const [anchor, setAnchor] = useState(null);
  const gesture = useRef(null);
  const { field, label } = column;
  const { min, max } = layout.bounds(column);
  const width = layout.sizing[field];
  const sign = direction === 'rtl' ? -1 : 1;
  function move(step) {
    const target = layout.neighbor(field, step);
    if (target) layout.move(field, target);
  }
  return <>
    {reorder && <>
      <Tooltip title={labels.moveColumn(label)}>
        <IconButton size="small" color="inherit" aria-label={labels.moveColumn(label)} aria-haspopup="menu" aria-expanded={Boolean(anchor)}
          {...layout.dragProps(field)} onClick={event => setAnchor(event.currentTarget)}
          onKeyDown={event => {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
              event.preventDefault(); event.stopPropagation(); move((event.key === 'ArrowRight' ? 1 : -1) * sign);
            }
          }}><DragIndicatorIcon fontSize="small" /></IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {[-1, 1].map(step => <MenuItem key={step} disabled={!layout.neighbor(field, step)} onClick={() => { move(step); setAnchor(null); }}>
          {step === -1 ? labels.moveColumnStart : labels.moveColumnEnd}
        </MenuItem>)}
      </Menu>
    </>}
    {resize && <Box role="separator" tabIndex={0} aria-label={labels.resizeColumn(label)} aria-orientation="vertical"
      aria-valuemin={min} aria-valuemax={max} aria-valuenow={width} aria-valuetext={labels.columnWidth(width)}
      onPointerDown={event => {
        if (event.button !== 0) return;
        event.preventDefault(); event.stopPropagation();
        event.currentTarget.focus();
        gesture.current = { pointerId: event.pointerId, x: event.clientX, width };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={event => {
        if (gesture.current?.pointerId === event.pointerId) layout.resize(field, gesture.current.width + (event.clientX - gesture.current.x) * sign);
      }}
      onPointerUp={event => {
        if (gesture.current?.pointerId === event.pointerId) {
          gesture.current = null;
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      }}
      onPointerCancel={() => { if (gesture.current) layout.resize(field, gesture.current.width); gesture.current = null; }}
      onLostPointerCapture={() => { gesture.current = null; }}
      onKeyDown={event => {
        const step = event.shiftKey ? 50 : 10;
        const next = event.key === 'Home' ? min : event.key === 'End' ? max : event.key === 'ArrowRight' ? width + step * sign : event.key === 'ArrowLeft' ? width - step * sign : null;
        if (next !== null) { event.preventDefault(); event.stopPropagation(); layout.resize(field, next); }
      }}
      sx={{ position: 'absolute', insetInlineEnd: 0, top: 0, bottom: 0, width: 10, cursor: 'col-resize', touchAction: 'none',
        '&::after': { content: '""', position: 'absolute', insetInlineEnd: 3, top: '20%', height: '60%', borderInlineEnd: '2px solid currentColor' },
        '&:focus-visible': { outline: '2px solid currentColor', outlineOffset: -2 } }} />}
  </>;
}
