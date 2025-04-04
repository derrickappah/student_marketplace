import React from 'react';
import { Box, useTheme } from '@mui/material';
import AdminNavigation from './AdminNavigation';
import { useLocation, Outlet } from 'react-router-dom';

const AdminLayout = () => {
  const theme = useTheme();
  const location = useLocation();
  
  // Only apply the admin layout to paths that start with "/admin"
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  if (!isAdminRoute) {
    return <Outlet />;
  }
  
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <AdminNavigation />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          bgcolor: theme.palette.background.default,
          overflowY: 'auto',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout; 