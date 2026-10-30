import React from 'react';
import { Button, IconButton, Stack, Tooltip } from '@mui/material';
import View from '@mui/icons-material/Visibility';
import Edit from '@mui/icons-material/Edit';
import Delete from '@mui/icons-material/Delete';
import Clone from '@mui/icons-material/ContentCopy';
import Report from '@mui/icons-material/Report';

export function buildActions(props) {
  return [
    ['view', props.enableView, 'View', props.onView, View],
    ['edit', props.enableEdit, props.editLabel ?? 'Edit', props.onEdit, Edit],
    ['delete', props.enableDelete, props.deleteLabel ?? 'Delete', props.onDelete, Delete],
    ['clone', props.enableClone, 'Clone', props.onClone, Clone],
    ['report', props.enableReportLink, 'Report', props.onReportLink, Report]
  ].filter(([, enabled]) => enabled).map(([id, , label, onClick, icon]) => ({ id, label, onClick, icon }))
    .concat(props.actions ?? []);
}

/** Compatibility only. New tables supply renderRowActions or display columns. */
export function renderLegacyRowActions({ row, actions, icons, visibility = {} }) {
  return <Stack direction="row" spacing={1}>
    {actions.filter(action => (action.visible?.(row) ?? true) && (visibility[action.id]?.(row) ?? true))
      .map(action => {
        const Icon = action.icon;
        const disabled = !action.onClick || (typeof action.disabled === 'function' ? action.disabled(row) : action.disabled);
        return icons && Icon ? <Tooltip title={action.label} key={action.id}><span>
          <IconButton aria-label={action.label} disabled={disabled} size="small" onClick={() => action.onClick(row)}><Icon /></IconButton>
        </span></Tooltip> : <Button key={action.id} size="small" disabled={disabled}
          onClick={() => action.onClick(row)}>{action.label}</Button>;
      })}
  </Stack>;
}
