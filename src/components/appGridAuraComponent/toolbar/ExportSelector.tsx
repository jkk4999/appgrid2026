import React, { useMemo, useState } from 'react';

// Zustand
import useStore, { ExportTypeOption } from '../../../zustandStore'
import { useShallow } from 'zustand/react/shallow';

// Mui
import { Autocomplete, Box, Stack, TextField, Typography } from "@mui/material";

import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';

// Theme
import { useTheme } from '@mui/material/styles';


// components
import { ActionIconButton } from '../../common/ActionIconButton';

const exportOptions: ExportTypeOption[] = [
   {
      name: 'exportToExcel',
      label: 'Export to Excel',
   },
   {
      name: 'exportToCSV',
      label: 'Export to CSV',
   }
];

const ExportSelector = () => {
   const theme = useTheme();

   // global state
   const {
      setSelectedExportType,
   } = useStore(
      useShallow((state) => ({
         setSelectedExportType: state.setSelectedExportType,
      }))
   );

   const [selectedExport, setSelectedExport] = useState<ExportTypeOption | null>(null);


   // Define a reusable style object for the tooltips to avoid repetition.
   const tooltipSx = useMemo(() => ({
      color: theme.palette.text.primary,
      '&:hover': {
         color: theme.palette.text.primary,
      },
   }), [theme.palette.text.primary]);

   return (
      <Box>
         <Stack
            direction='row'
            alignItems={'center'}
            spacing={1}
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
            }}
         >
            <Typography>
               Export:
            </Typography>
            <Autocomplete
               id="exportSelector"
               getOptionLabel={(option) => option?.label || ''}
               isOptionEqualToValue={(option, value) => option?.name === value?.name}
               options={exportOptions}
               value={selectedExport}
               sx={{
                  ml: 2,
                  width: 200,
                  '& .MuiAutocomplete-popupIndicator': {
                     color: theme.palette.text.primary,
                  },
                  '& .MuiAutocomplete-clearIndicator': {
                     color: theme.palette.text.primary,
                  },
               }}
               renderInput={(params) => (
                  <TextField
                     {...params}
                     variant="standard"
                     sx={{
                        '& .MuiInputBase-input': {
                           color: theme.palette.text.primary,
                        },
                        '& .MuiInput-underline:before': {
                           borderBottomColor: theme.palette.text.primary,
                        },
                        '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                           borderBottomColor: theme.palette.text.primary,
                        },
                     }} />
               )}
               onChange={(_event, value) => {
                  if (value) {
                     setSelectedExport(value);
                  }
               }}
            />
            <ActionIconButton
               title="Export"
               aria-label="Export"
               onClick={() => {
                  if (selectedExport) {
                     setSelectedExportType(selectedExport)
                  }
               }}
               sx={tooltipSx}>
               <FileDownloadOutlinedIcon sx={{ fontSize: 25 }} />
            </ActionIconButton>
         </Stack>
      </Box>
   );
};

export default ExportSelector;
