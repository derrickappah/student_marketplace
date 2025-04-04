import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { supabase } from "../services/supabase";

/**
 * A wrapper component that redirects non-admin users to the home page
 * Shows a loading indicator while checking admin status
 */
const AdminRoute = () => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setCheckingAdmin(false);
        return;
      }

      try {
        // Check if user has admin role in the database
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data?.role === 'admin');
        }
      } catch (err) {
        console.error('Error checking admin privileges:', err);
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    if (!loading) {
      checkAdminStatus();
    }
  }, [user, loading]);

  // Show loading indicator while checking authentication or admin status
  if (loading || checkingAdmin) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          flexDirection: 'column',
          gap: 2,
          bgcolor: theme => theme.palette.background.default,
        }}
      >
        <CircularProgress 
          size={60} 
          thickness={4} 
          sx={{ 
            color: 'primary.main',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            }
          }} 
        />
        <Typography variant="body1" color="text.secondary">
          Verifying admin privileges...
        </Typography>
      </Box>
    );
  }
  
  // Redirect to home if not authenticated or not an admin
  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  // If admin, render admin routes
  return <Outlet />;
};

export default AdminRoute; 