import React from 'react'

// MUI
import { Box, Typography, useTheme } from "@mui/material";

// spinners
import PacmanLoader from 'react-spinners/PacmanLoader'

const SubGridLoadingIndicator = () => {
   const theme = useTheme();

   return (
      <Box
         sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(31, 41, 55, 0.2)', // Adjust the alpha value here
            display: 'flex',
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
            }}
         >
            <PacmanLoader color={theme.palette.text.primary} size={40} />
            <Typography ml={2} mt={2} variant="button" color="inherit" component="div">
               Loading data...
            </Typography>
         </Box>
      </Box>
   )
}

export default SubGridLoadingIndicator