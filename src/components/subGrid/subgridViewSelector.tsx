import React from 'react';

// Zustand
import useStore from '../../zustandStore'

// PubSubJS
import PubSub from "pubsub-js";

// Mui
import { Autocomplete, Box, IconButton, Stack, TextField, Tooltip, Typography } from "@mui/material";

import { useTheme } from '@mui/material';

// Mui icons
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'

import PostAddOutlinedIcon from '@mui/icons-material/PostAddOutlined';

interface SubgridViewSelectorProps {
  onViewChange: (view: any) => void;
  /** The relation name (sObjectApiName) for per-relation view state */
  relationName: string;
}

// Empty array constant to avoid creating new arrays on each render
const EMPTY_ARRAY: any[] = [];

const SubgridViewSelector: React.FC<SubgridViewSelectorProps> = ({ onViewChange, relationName }) => {
  const theme = useTheme();

  // Get raw state from store - separate selectors to avoid object creation in selector
  const selectedAccentColor = useStore((state) => state.selectedAccentColor);

  const setSubgridViewForRelation = useStore((state) => state.setSubgridViewForRelation);

  // Subscribe to per-relation state maps ONLY
  // We DO NOT fall back to global state - that causes race conditions when switching tabs
  const subgridViewByRelation = useStore((state) => state.subgridViewByRelation);

  const subgridViewOptionsByRelation = useStore((state) => state.subgridViewOptionsByRelation);

  // Read ONLY from per-relation state when relationName is provided
  // If relationName is not provided, show nothing (this is expected - relationName should always be provided)
  const selectedSubgridView = relationName
    ? subgridViewByRelation[relationName] ?? null
    : null;

  const subgridViewOptions = relationName
    ? (subgridViewOptionsByRelation[relationName] ?? EMPTY_ARRAY)
    : EMPTY_ARRAY;

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
      }}
    >
      <Stack
        direction='row'
        alignItems={'center'}
        spacing={2}
        sx={{
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}>
        <Typography sx={{ color: selectedAccentColor }}>View:</Typography>
        <Autocomplete
          id="subgridViewSelector"
          getOptionLabel={(option: any) => option ? (option.Name || option.name || '') : ''}
          isOptionEqualToValue={(option: any, value: any) => {
            const oId = option?.Id || option?.id;

            const vId = value?.Id || value?.id;

            if (oId && vId) return oId === vId;

            const oName = option?.Name || option?.name;

            const vName = value?.Name || value?.name;

            return !!oName && !!vName && oName === vName;
          }}
          options={subgridViewOptions}
          value={selectedSubgridView}
          renderInput={(params) => (
            <TextField {...params} variant="standard" />
          )}
          onChange={(_event, value) => {
            if (value) {
              setSubgridViewForRelation(relationName, value);
              // Notify parent of view change so it can persist the preference
              onViewChange?.(value);
            }
          }}
          slotProps={{
            paper: {
              sx: {
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
              }
            }
          }}
          sx={{
            width: 225,
            '& .MuiAutocomplete-input': {
              color: theme.palette.text.primary, // Text color
            },
            '& .MuiInput-underline:before': {
              borderBottomColor: theme.palette.text.primary, // Underline color
            },
            '& .MuiAutocomplete-popupIndicator': {
              color: theme.palette.text.primary, // Arrow icon color
            },
            '& .MuiAutocomplete-clearIndicator': {
              color: theme.palette.text.primary, // Change clear button color
            },
          }}
        />
        <Stack direction="row" spacing={0}>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
            }}>
            {/* create template */}
            <Tooltip title="Create Template" placement="top" sx={{
              color: theme.palette.text.primary,
              '&:hover': {
                color: theme.palette.text.primary, // Hover color when using a CSS variable
              },
            }}>
              <IconButton
                aria-label="CreateTemplate"
                onClick={() => PubSub.publish('CreateSubgridTemplate')}
              >
                <PostAddOutlinedIcon sx={{ fontSize: 25 }} />
              </IconButton>
            </Tooltip>
          </Box>
          {/* delete template */}
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{
              backgroundColor: theme.palette.background.paper,
              color: theme.palette.text.primary,
            }}>
            <Tooltip title="Delete Subgrid Template" placement="top" sx={{
              color: theme.palette.text.primary,
              '&:hover': {
                color: theme.palette.text.primary, // Hover color when using a CSS variable
              },
            }}>
              <IconButton
                aria-label="DeleteSubgridTemplate"
                onClick={() => PubSub.publish('DeleteSubgridTemplate')}
              >
                <DeleteOutlinedIcon sx={{ fontSize: 25 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
};

export { SubgridViewSelector }
