import React from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import PaletteIcon from '@mui/icons-material/Palette';
import PropTypes from 'prop-types';
import { themes } from './themes'; // Import the themes
import Tooltip from '@mui/material/Tooltip';

const ThemeSelector = ({ handleThemeChange }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (theme) => {
    setAnchorEl(null);
    if (theme) {
      handleThemeChange(theme);
    }
  };

  return (
    <div>
      <IconButton aria-label={"theme selector"} onClick={handleClick}>
      <Tooltip title="Select Theme"><PaletteIcon /></Tooltip>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => handleClose(null)}
      >
        {Object.keys(themes).map((theme) => (
          <MenuItem key={theme} onClick={() => handleClose(theme)}>
            {theme.charAt(0).toUpperCase() + theme.slice(1)}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
};

ThemeSelector.propTypes = {
  handleThemeChange: PropTypes.func.isRequired,
};

export default ThemeSelector;