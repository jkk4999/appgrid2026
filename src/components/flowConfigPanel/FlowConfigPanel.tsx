import React, { } from 'react';

// Zustand
import useStore from '../../zustandStore'
import { useShallow } from 'zustand/react/shallow';

// components
import FlowSelector from './flowSelector';
import JsonEditor from './jsonEditor';

// MUI
import { AppBar, Box, IconButton, Tab, Tabs, Toolbar, Typography } from '@mui/material';

// Theme
import { useTheme } from '@mui/material/styles';

// MUI icons
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'

interface TabPanelProps {
   children?: React.ReactNode;
   index: number;
   value: number;
}

function CustomTabPanel(props: TabPanelProps) {
   const { children, value, index, ...other } = props;

   return (
      <div
         role="tabpanel"
         hidden={value !== index}
         id={`simple-tabpanel-${index}`}
         aria-labelledby={`simple-tab-${index}`}
         {...other}
      >
         {value === index && (
            <Box sx={{ p: 3 }}>
               <Typography>{children}</Typography>
            </Box>
         )}
      </div>
   );
}

const FlowConfigPanel = (props: any) => {
   const theme = useTheme();

   console.log('Flow config panel loading');

   const apiClient = props.apiClient;
   const gridApi = props.gridApi;
   const objectPermissions = props.objectPermissions;

   // global state
   const {
      selectedAccentColor,
      setShowFlowConfigPanel
   } = useStore(useShallow((state) => ({
      selectedAccentColor: state.selectedAccentColor,
      setShowFlowConfigPanel: state.setShowFlowConfigPanel
   })));

   const [value, setValue] = React.useState(0);

   // functions
   function a11yProps(index: number) {
      return {
         id: `simple-tab-${index}`,
         'aria-controls': `simple-tabpanel-${index}`,
      };
   }

   const handleChange = (event: React.SyntheticEvent, newValue: number) => {
      setValue(newValue);
   };

   return (
      <Box
         sx={{
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            typography: 'body1',
            border: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            boxSizing: 'border-box',
         }}>
         <AppBar
            position='sticky'
            sx={{
               backgroundColor: theme.palette.background.paper,
               color: theme.palette.text.primary,
               flexShrink: 0
            }}>
            <Toolbar variant="dense">
               <IconButton
                  size="large"
                  edge="start"
                  color="inherit"
                  aria-label="menu"
                  sx={{ ml: -1 }}
                  onClick={() => setShowFlowConfigPanel(false)}
               >
                  <ChevronLeftIcon />
               </IconButton>
               <Typography variant="button" color="inherit" component="div">
                  Flows
               </Typography>
            </Toolbar>
         </AppBar>
         <Tabs value={value} onChange={handleChange} sx={{
            '& .Mui-selected': {
               color: selectedAccentColor, // color of the selected tab
            },
            '& .MuiTab-root': {
               color: theme.palette.text.primary, // color of the unselected tab
            },
         }}>
            <Tab label="Flows" {...a11yProps(0)} />
            <Tab label="Flow Config" {...a11yProps(1)} />
         </Tabs>

         <Box sx={{
            flexGrow: 1,
            minWidth: 500,
            overflow: 'auto'
         }}>
            {/* flow selector */}
            <CustomTabPanel value={value} index={0}>
               <Box sx={{
                  backgroundColor: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  overflow: 'auto',
                  height: '100%'
               }}>
                  <FlowSelector apiClient={apiClient} gridApi={gridApi} objectPermissions={objectPermissions} />
               </Box>
            </CustomTabPanel>

            {/* flow config */}
            <CustomTabPanel value={value} index={1} >
               <Box
                  sx={{
                     backgroundColor: theme.palette.background.paper,
                     color: theme.palette.text.primary,
                     overflow: 'auto',
                     height: '100%'
                  }}>
                  <JsonEditor apiClient={apiClient} gridApi={gridApi} objectPermissions={objectPermissions} />
               </Box>
            </CustomTabPanel>
         </Box>
      </Box>
   )
}

export default FlowConfigPanel