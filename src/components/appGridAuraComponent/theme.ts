// theme.ts
import { createTheme } from '@mui/material/styles';

export const getTheme = (mode: 'light' | 'dark') =>
  createTheme({
    // Disable MUI's default CSS baseline which tries to load Google Fonts
    cssVariables: false,
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            primary: { main: '#0070D2' }, // Salesforce blue
            secondary: { main: '#00A1E0' },
            background: {
              default: '#F3F3F3',
              paper: '#FFFFFF'
            },
            text: {
              primary: '#080707',
              secondary: '#666666'
            },
            divider: 'rgba(0, 0, 0, 0.12)',
            error: { main: '#EA001E' },
            warning: { main: '#FFB75D' },
            info: { main: '#00A1E0' },
            success: { main: '#2E844A' }
          }
        : {
            primary: { main: '#1B96FF' }, // Lighter blue for dark mode
            secondary: { main: '#26ABE3' },
            background: {
              default: '#0a0a0a',
              paper: '#1a1a1a'
            },
            text: {
              primary: '#ffffff',
              secondary: '#b1b1b1'
            },
            divider: 'rgba(255, 255, 255, 0.12)',
            error: { main: '#FF5D5D' },
            warning: { main: '#FFB75D' },
            info: { main: '#26ABE3' },
            success: { main: '#4BCA81' }
          })
    },
    typography: {
      fontFamily: "'Salesforce Sans', Arial, sans-serif",
      button: {
        textTransform: 'none'
      }
    },
    shape: {
      borderRadius: 4
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none'
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none'
          }
        }
      },
      MuiStack: {
        defaultProps: {
          useFlexGap: true
        }
      }
    }
  });
