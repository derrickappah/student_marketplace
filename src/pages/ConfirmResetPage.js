import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Alert,
  CircularProgress
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from "../services/supabase";
import LockResetIcon from '@mui/icons-material/LockReset';

const ConfirmResetPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get access token from URL query params
  const queryParams = new URLSearchParams(location.search);
  const accessToken = queryParams.get('access_token');

  useEffect(() => {
    if (!accessToken) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [accessToken]);

  const validatePassword = () => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePassword()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });
      
      if (error) throw error;
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Error resetting password:', err);
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 4, 
          borderRadius: 3,
          background: 'linear-gradient(145deg, #ffffff, #f8f9fa)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.05), 0 2px 8px rgba(0,0,0,0.04)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            padding: '1px',
            background: 'linear-gradient(to bottom right, rgba(255,255,255,0.8), rgba(255,255,255,0))',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            pointerEvents: 'none',
          },
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box 
            sx={{ 
              width: 70, 
              height: 70, 
              borderRadius: '50%', 
              bgcolor: 'rgba(25, 118, 210, 0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <LockResetIcon 
              sx={{ 
                fontSize: 40, 
                color: 'primary.main',
                filter: 'drop-shadow(0 2px 4px rgba(25, 118, 210, 0.2))',
              }} 
            />
          </Box>
          <Typography 
            variant="h5" 
            component="h1" 
            gutterBottom 
            fontWeight="bold"
            sx={{
              background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Reset Your Password
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Enter your new password below to complete the reset process
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}
        
        {success ? (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            Password reset successful! Redirecting to login...
          </Alert>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || !accessToken}
              required
              margin="normal"
              sx={{ mb: 2 }}
              InputProps={{
                sx: {
                  borderRadius: 2,
                  '&.Mui-focused': {
                    boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.12)',
                  }
                }
              }}
            />
            
            <TextField
              fullWidth
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading || !accessToken}
              required
              margin="normal"
              sx={{ mb: 3 }}
              InputProps={{
                sx: {
                  borderRadius: 2,
                  '&.Mui-focused': {
                    boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.12)',
                  }
                }
              }}
            />
            
            <Button 
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || !accessToken}
              sx={{
                py: 1.5,
                borderRadius: 2,
                transition: 'all 0.2s',
                background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.25)',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(25, 118, 210, 0.35)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ConfirmResetPage; 