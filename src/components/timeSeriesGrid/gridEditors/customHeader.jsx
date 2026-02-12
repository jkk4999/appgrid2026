import React from 'react';
import PropTypes from 'prop-types';

// Zustand
import useStore from '../../../zustandStore';

// Mui
import { Checkbox, IconButton, Tooltip } from '@mui/material';

import { useTheme } from '@mui/material';

// Mui icons
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

// PubSubJS
import PubSub from 'pubsub-js';

const CustomHeader = ({ displayName, column, showErrorRecs, rowErrors }) => {
  const theme = useTheme();

  // global state
  const selectedAccentColor = useStore((state) => state.selectedAccentColor);

  const [checked, setChecked] = React.useState(false);

  const onChange = (event) => {
    setChecked(event.target.checked);

    PubSub.publish('TimeSeriesColumnClicked', {
      column: column.colId,
      value: event.target.checked
    });
  };

  const onEditClick = (event) => {
    event.stopPropagation();
    PubSub.publish('TimeSeriesColumnEdit', {
      column: column.colId
    });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Checkbox
        checked={checked}
        onChange={onChange}
        onClick={(event) => {
          // Since onClick captures the click, we can simulate onChange here
          onChange({ target: { checked: !checked } });
          event.stopPropagation(); // Prevent Ag-Grid from handling this click if needed
        }}
        sx={{
          color: theme.palette.text.primary, // Unchecked color
          '&.Mui-checked': {
            color: selectedAccentColor // Checked color
          }
        }}
      />
      <Tooltip title="Edit" placement="top">
        <IconButton
          aria-label="Edit"
          onClick={onEditClick}
          size="small"
          sx={{
            color: theme.palette.text.primary,
            padding: '2px',
            '&:hover': {
              color: selectedAccentColor
            }
          }}
        >
          <EditOutlinedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
      {showErrorRecs && (
        <Tooltip title={rowErrors[displayName]} arrow placement="top">
          <ErrorOutlineIcon style={{ color: 'red' }} />
        </Tooltip>
      )}
    </div>
  );
};

// PropTypes validation
CustomHeader.propTypes = {
  displayName: PropTypes.string.isRequired,
  column: PropTypes.object // Adjust type according to your column object structure
};

export { CustomHeader };
