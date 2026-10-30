import React, { useState } from 'react';
import { IconButton, Menu, MenuItem, Checkbox, ListItemText, Divider } from '@mui/material';
import SortIcon from '@mui/icons-material/Sort';
import PropTypes from 'prop-types';
import Tooltip from '@mui/material/Tooltip';

const MultiColumnSort = ({ headers, selectedColumns, handleSortChange }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleToggle = (field) => {
    const currentIndex = selectedColumns.findIndex(col => col.field === field);
    const newSelectedColumns = [...selectedColumns];

    if (currentIndex === -1) {
      newSelectedColumns.push({ field, order: 'asc' });
    } else {
      if (newSelectedColumns[currentIndex].order === 'asc') {
        newSelectedColumns[currentIndex] = { field, order: 'desc' };
      } else {
        newSelectedColumns.splice(currentIndex, 1);
      }
    }

    handleSortChange(newSelectedColumns);
  };

  const handleClearSorting = () => {
    handleSortChange([]);
    handleClose();
  };

  return (
    <div>
      <IconButton aria-label="Multi-column sort" onClick={handleClick}>
      <Tooltip title="Multi-column sort"><SortIcon /></Tooltip>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {headers.map((header) => (
          <MenuItem key={header.field} onClick={() => handleToggle(header.field)}>
            <Checkbox
              checked={selectedColumns.some(col => col.field === header.field)}
              indeterminate={selectedColumns.some(col => col.field === header.field && col.order === 'desc')}
            />
            <ListItemText primary={header.label} />
          </MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={handleClearSorting}>
          Clear Sorting
        </MenuItem>
      </Menu>
    </div>
  );
};

MultiColumnSort.propTypes = {
  headers: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    field: PropTypes.string.isRequired,
  })).isRequired,
  selectedColumns: PropTypes.arrayOf(PropTypes.shape({
    field: PropTypes.string.isRequired,
    order: PropTypes.string.isRequired,
  })).isRequired,
  handleSortChange: PropTypes.func.isRequired,
};

export default MultiColumnSort;