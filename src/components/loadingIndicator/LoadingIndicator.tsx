import React from 'react'

// Zustand
import useStore from '../../zustandStore'
import { useShallow } from 'zustand/react/shallow';

// MUI
import { Box, Typography } from "@mui/material";

// spinners
import PacmanLoader from 'react-spinners/PacmanLoader'

interface LoadingIndicatorProps {
   isLoading: boolean;
}


const LoadingIndicator = ({ isLoading }: LoadingIndicatorProps) => {

   // global state
   const { loadingIndicatorText } = useStore(useShallow((state) => ({
      isQueryActive: state.loading,
      loadingIndicatorText: state.loadingIndicatorText,
   })));

   return (
      <Box
         sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(31, 41, 55, 0.2)',
            display: isLoading ? 'flex' : 'none',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
         }}
      >
         <Box
            sx={{
               display: 'flex',
               flexDirection: 'column',
               alignItems: 'center',
               textAlign: 'center',
               transform: 'translateY(-40px)', // Adjust position up by 40px
            }}
         >
            <PacmanLoader color={'white'} size={40} />
            <Typography ml={2} mt={2} variant="button" color="inherit" component="div">
               {loadingIndicatorText}
            </Typography>
         </Box>
      </Box>
   );
};

export default LoadingIndicator