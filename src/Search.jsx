import React, { useState } from 'react';
import { TextField, IconButton, Box } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import PropTypes from 'prop-types';
import Tooltip from '@mui/material/Tooltip';

const Search = ({ searchText, handleSearchTextChange, labels }) => {
  const [showSearch, setShowSearch] = useState(false);

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      handleSearchTextChange({ target: { value: '' } });
    }
  };

  return (
    <Box display="flex" alignItems="center">
      {showSearch && (
        <TextField
          label={labels.search}
          autoFocus
          variant="outlined"
          value={searchText}
          onChange={handleSearchTextChange}
          slotProps={{ htmlInput: { 'data-testid': 'search-input' } }}
          margin="normal"
          size='small'
        />
      )}
      <Tooltip describeChild title={showSearch ? labels.closeSearch : labels.openSearch}>
        <IconButton
            onClick={toggleSearch}
            aria-label={showSearch ? labels.closeSearch : labels.openSearch}
        >
          {showSearch ? (
              <CloseIcon aria-hidden="true" />
          ) : (
              <SearchIcon aria-hidden="true" />
          )}
      </IconButton>
      </Tooltip>
    </Box>
  );
};

Search.propTypes = {
  searchText: PropTypes.string.isRequired,
  handleSearchTextChange: PropTypes.func.isRequired,
};

export default Search;