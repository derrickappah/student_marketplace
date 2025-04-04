import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { updatePassword } from "../services/supabase";
import { supabase } from "../services/supabase";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();
  
  // Check if this page is being accessed with a recovery token
  useEffect(() => {
    const checkRecoveryToken = async () => {
      const { data } = await supabase.auth.getSession();
      // If there's no active session or it's not a recovery session, redirect to login
      if (!data?.session) {
        setError('Invalid or expired password reset link. Please try again.');
      }
      setLoading(false);
    };
    
    checkRecoveryToken();
  }, [navigate]);
  
  const onSubmit = async (data) => {
    try {
      setError('');
      await updatePassword(data.password);
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box 
          sx={{ 
            mt: 8, 
            mb: 4, 
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px'
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h4" gutterBottom>
            Set New Password
          </Typography>

          {success ? (
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              Your password has been updated! Redirecting to login...
            </Alert>
          ) : (
            <>
              {error && (
                <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Box
                component="form"
                onSubmit={handleSubmit(onSubmit)}
                sx={{ width: '100%', mt: 1 }}
              >
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="New Password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                />

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Confirm New Password"
                  type="password"
                  id="confirmPassword"
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) =>
                      value === watch('password') || 'Passwords do not match',
                  })}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update Password'}
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ResetPasswordPage; 