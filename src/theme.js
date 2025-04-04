import { createTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

// Define a sophisticated color palette
const primaryColor = {
  light: '#4B7BF5',
  main: '#2563EB',
  dark: '#1D4ED8',
  contrastText: '#ffffff',
};

const secondaryColor = {
  light: '#F472B6',
  main: '#EC4899',
  dark: '#DB2777',
  contrastText: '#ffffff',
};

// Create a theme creation function that accepts a mode parameter
const createAppTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: primaryColor,
    secondary: secondaryColor,
    background: {
      default: mode === 'dark' ? '#121212' : '#F8FAFC',
      paper: mode === 'dark' ? '#1E1E1E' : '#FFFFFF',
      navbar: mode === 'dark' ? 'rgba(18, 18, 18, 0.95)' : 'rgba(25, 118, 210, 0.95)',
      light: mode === 'dark' ? '#2D2D2D' : '#F1F5F9',
      card: mode === 'dark' ? '#2D2D2D' : '#ffffff',
      gradient: mode === 'dark' 
        ? 'linear-gradient(135deg, #1E1E1E 0%, #2D2D2D 100%)' 
        : 'linear-gradient(135deg, #f5f7fa 0%, #e4e9f2 100%)',
      highlight: mode === 'dark' 
        ? alpha(primaryColor.light, 0.2) 
        : alpha(primaryColor.light, 0.1),
      dark: mode === 'dark' ? '#121212' : '#0F172A',
    },
    success: {
      main: '#22C55E',
      light: '#86EFAC',
      dark: '#16A34A',
      contrastText: '#ffffff',
    },
    info: {
      main: '#3B82F6',
      light: '#93C5FD',
      dark: '#2563EB',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#F59E0B',
      light: '#FDE68A',
      dark: '#D97706',
      contrastText: '#ffffff',
    },
    error: {
      main: '#EF4444',
      light: '#FCA5A5',
      dark: '#DC2626',
      contrastText: '#ffffff',
    },
    grey: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#eeeeee',
      300: '#e0e0e0',
      400: '#bdbdbd',
      500: '#9e9e9e',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },
    text: {
      primary: mode === 'dark' ? '#E2E8F0' : '#1E293B',
      secondary: mode === 'dark' ? '#94A3B8' : '#64748B',
      disabled: mode === 'dark' ? '#64748B' : '#94A3B8',
      hint: mode === 'dark' ? '#64748B' : '#9DA3AE',
    },
    divider: mode === 'dark' ? alpha('#E2E8F0', 0.12) : alpha('#1E293B', 0.08),
    action: {
      active: mode === 'dark' ? alpha('#E2E8F0', 0.7) : alpha('#1E293B', 0.54),
      hover: mode === 'dark' ? alpha('#E2E8F0', 0.1) : alpha('#1E293B', 0.04),
      selected: mode === 'dark' ? alpha('#E2E8F0', 0.16) : alpha('#1E293B', 0.08),
      disabled: mode === 'dark' ? alpha('#E2E8F0', 0.3) : alpha('#1E293B', 0.26),
      disabledBackground: mode === 'dark' ? alpha('#E2E8F0', 0.12) : alpha('#1E293B', 0.12),
      focus: mode === 'dark' ? alpha('#E2E8F0', 0.12) : alpha('#1E293B', 0.12),
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
      letterSpacing: '-0.01em',
      lineHeight: 1.4,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      letterSpacing: '-0.01em',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      letterSpacing: '-0.01em',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      letterSpacing: '-0.01em',
      lineHeight: 1.4,
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: '1rem',
      letterSpacing: '0.00938em',
      lineHeight: 1.5,
    },
    subtitle2: {
      fontWeight: 500,
      fontSize: '0.875rem',
      letterSpacing: '0.00714em',
      lineHeight: 1.57,
    },
    body1: {
      fontSize: '1rem',
      letterSpacing: '0.00938em',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      letterSpacing: '0.01071em',
      lineHeight: 1.43,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      fontSize: '0.875rem',
      letterSpacing: '0.02857em',
      lineHeight: 1.75,
    },
    caption: {
      fontSize: '0.75rem',
      letterSpacing: '0.03333em',
      lineHeight: 1.66,
    },
    overline: {
      fontSize: '0.75rem',
      letterSpacing: '0.08333em',
      lineHeight: 2.66,
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    'none',
    '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0 30px 60px -12px rgba(0, 0, 0, 0.25)',
    '0 35px 70px -12px rgba(0, 0, 0, 0.25)',
    '0 40px 80px -12px rgba(0, 0, 0, 0.25)',
    '0 45px 90px -12px rgba(0, 0, 0, 0.25)',
    '0 50px 100px -12px rgba(0, 0, 0, 0.25)',
    '0 55px 110px -12px rgba(0, 0, 0, 0.25)',
    '0 60px 120px -12px rgba(0, 0, 0, 0.25)',
    '0 65px 130px -12px rgba(0, 0, 0, 0.25)',
    '0 70px 140px -12px rgba(0, 0, 0, 0.25)',
    '0 75px 150px -12px rgba(0, 0, 0, 0.25)',
    '0 80px 160px -12px rgba(0, 0, 0, 0.25)',
    '0 85px 170px -12px rgba(0, 0, 0, 0.25)',
    '0 90px 180px -12px rgba(0, 0, 0, 0.25)',
    '0 95px 190px -12px rgba(0, 0, 0, 0.25)',
    '0 100px 200px -12px rgba(0, 0, 0, 0.25)',
    '0 105px 210px -12px rgba(0, 0, 0, 0.25)',
    '0 110px 220px -12px rgba(0, 0, 0, 0.25)',
    '0 115px 230px -12px rgba(0, 0, 0, 0.25)',
    '0 120px 240px -12px rgba(0, 0, 0, 0.25)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: mode === 'dark' ? '#333' : '#f1f1f1',
          },
          '&::-webkit-scrollbar-thumb': {
            background: mode === 'dark' ? '#666' : '#888',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: mode === 'dark' ? '#888' : '#555',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: mode === 'dark' 
              ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
              : '0 4px 12px rgba(0, 0, 0, 0.1)',
          },
          '&.Mui-disabled': {
            transform: 'none',
            boxShadow: 'none',
          },
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: mode === 'dark' 
              ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
              : '0 4px 12px rgba(0, 0, 0, 0.1)',
          },
        },
        outlined: {
          borderWidth: 1.5,
          '&:hover': {
            borderWidth: 1.5,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: mode === 'dark' 
            ? '0 4px 20px rgba(0,0,0,0.4)' 
            : '0 4px 20px rgba(0,0,0,0.05)',
          overflow: 'hidden',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: mode === 'dark' 
              ? '0 12px 24px rgba(0,0,0,0.5)' 
              : '0 12px 24px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 24,
          '&:last-child': {
            paddingBottom: 24,
          },
        },
      },
    },
    MuiCardActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '20px 24px 12px',
        },
        title: {
          fontSize: '1.25rem',
          fontWeight: 600,
        },
        subheader: {
          fontSize: '0.875rem',
          color: '#57606a',
        },
      },
    },
    MuiCardMedia: {
      styleOverrides: {
        root: {
          transition: 'transform 0.3s ease',
          '&:hover': {
            transform: 'scale(1.03)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: alpha('#1E293B', 0.23),
              },
            },
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#2563EB',
                borderWidth: 2,
              },
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          height: 24,
          '& .MuiChip-label': {
            padding: '0 8px',
            fontSize: '0.75rem',
          },
        },
        outlined: {
          borderWidth: 1.5,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 24px rgba(0,0,0,0.08)',
          backdropFilter: 'blur(8px)',
        },
        colorPrimary: {
          background: 'linear-gradient(90deg, #1565c0 0%, #1976d2 35%, #2196f3 100%)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 16,
        },
        elevation1: {
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        },
        elevation2: {
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        },
        elevation3: {
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.25rem',
          fontWeight: 600,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          margin: '24px 0',
          borderColor: 'rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          transition: 'all 0.2s',
          '&.Mui-selected': {
            backgroundColor: alpha(primaryColor.main, 0.08),
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: '2px solid white',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          transition: 'background-color 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(0,0,0,0.04)',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          '&.Mui-selected': {
            backgroundColor: alpha(primaryColor.main, 0.12),
            '&:hover': {
              backgroundColor: alpha(primaryColor.main, 0.18),
            },
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: alpha('#1E293B', 0.04),
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          textDecoration: 'none',
          transition: 'color 0.2s ease, text-decoration 0.2s ease',
          position: 'relative',
          '&:hover': {
            textDecoration: 'none',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            width: '100%',
            height: '1px',
            bottom: 0,
            left: 0,
            backgroundColor: 'currentColor',
            transform: 'scaleX(0)',
            transformOrigin: 'right',
            transition: 'transform 0.3s ease',
          },
          '&:hover::after': {
            transform: 'scaleX(1)',
            transformOrigin: 'left',
          },
        },
      },
    },
    MuiBreadcrumbs: {
      styleOverrides: {
        root: {
          '& .MuiBreadcrumbs-ol': {
            alignItems: 'center',
          },
          '& .MuiBreadcrumbs-separator': {
            color: '#9DA3AE',
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: alpha('#1E293B', 0.9),
          borderRadius: 6,
          padding: '6px 12px',
          fontSize: '0.75rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
        arrow: {
          color: 'rgba(0, 0, 0, 0.8)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
        standardSuccess: {
          backgroundColor: alpha('#2e7d32', 0.12),
          color: '#1b5e20',
        },
        standardError: {
          backgroundColor: alpha('#d32f2f', 0.12),
          color: '#c62828',
        },
        standardWarning: {
          backgroundColor: alpha('#ed6c02', 0.12),
          color: '#e65100',
        },
        standardInfo: {
          backgroundColor: alpha('#0288d1', 0.12),
          color: '#01579b',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: alpha(primaryColor.main, 0.04),
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: alpha(primaryColor.main, 0.12),
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        circle: {
          strokeLinecap: 'round',
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: alpha('#1E293B', 0.08),
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          margin: '2px 8px',
          padding: '8px 12px',
          '&:hover': {
            backgroundColor: alpha('#1E293B', 0.04),
          },
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          border: '2px solid white',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

export default createAppTheme; 