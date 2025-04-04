import React, { createContext, useState, useContext, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import createAppTheme from '../theme';

const ColorModeContext = createContext({
  toggleColorMode: () => {},
  mode: 'light',
});

export const useColorMode = () => useContext(ColorModeContext);

export const ThemeProvider = ({ children }) => {
  // Check if user has previously set a preference
  const storedMode = localStorage.getItem('themeMode');
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialMode = storedMode || (prefersDarkMode ? 'dark' : 'light');
  
  const [mode, setMode] = useState(initialMode);

  const colorMode = React.useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          localStorage.setItem('themeMode', newMode);
          return newMode;
        });
      },
      mode,
    }),
    [mode],
  );

  // Use our createAppTheme function to generate a theme based on the current mode
  const theme = React.useMemo(
    () => createAppTheme(mode),
    [mode],
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ColorModeContext.Provider>
  );
};

export default ColorModeContext; 