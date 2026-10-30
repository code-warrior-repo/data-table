import React from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import PaletteIcon from '@mui/icons-material/Palette';
import PropTypes from 'prop-types';
import { themes } from './themes';
import Tooltip from '@mui/material/Tooltip';

const ThemeSelector = ({ handleThemeChange, labels, currentTheme }) => {
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
      <IconButton aria-label={labels.themeSelector} aria-haspopup="menu" aria-expanded={Boolean(anchorEl)} onClick={handleClick}>
      <Tooltip describeChild title={labels.themeSelector}><PaletteIcon /></Tooltip>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => handleClose(null)}
      >
        {Object.keys(themes).map((theme) => (
          <MenuItem key={theme} selected={currentTheme === theme} aria-current={currentTheme === theme ? 'true' : undefined} onClick={() => handleClose(theme)}>
            {theme.charAt(0).toUpperCase() + theme.slice(1)}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
};

ThemeSelector.propTypes = {
  handleThemeChange: PropTypes.func.isRequired,
  currentTheme: PropTypes.oneOf(Object.keys(themes)).isRequired,
  labels: PropTypes.object.isRequired,
};

export default ThemeSelector;