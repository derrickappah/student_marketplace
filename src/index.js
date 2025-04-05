import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import DateLocalizationProvider from './contexts/DateLocalizationContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <DateLocalizationProvider>
        <App />
      </DateLocalizationProvider>
    </ThemeProvider>
  </React.StrictMode>
); 